/**
 * AV OS — runtime content loader (Phase 3 §4).
 *
 * CMSContentProvider / ContentLoader / ContentCache / PublishedSnapshot /
 * StaticFallback — realised as:
 *
 *   - `STATIC_CONTENT`   → PublishedSnapshot + StaticFallback (last-known-good)
 *   - `loadRuntimeContent()` → ContentLoader (fetch + validate + adapt)
 *   - `ContentCache`     → in-memory cache (ETag + TTL + revalidation)
 *   - `initContent()` / `getContent()` / `getContentState()` → the single
 *     synchronous access point the rest of the app reads from
 *
 * The flow is: attempt runtime content → validate → adapt → merge over the
 * static snapshot → use it. Any failure (network, timeout, malformed, empty)
 * falls back to the static snapshot — deliberately and observably (state is
 * exposed for diagnostics; a permanent failure is surfaced, never masked).
 */
import { STATIC_CONTENT, type ContentDocument } from './static-snapshot';
import type { DeepPartial } from './types';
import { validateContentPayload, describeValidation, type ApiContentPayload } from './schema';
import { adaptContentPayload } from './adapt';

export type ContentSource = 'static' | 'runtime';
export type ContentPhase = 'idle' | 'loading' | 'runtime' | 'fallback' | 'error';

export interface ContentState {
  phase: ContentPhase;
  source: ContentSource;
  /** reason for fallback/error (empty when running on runtime content) */
  reason: string;
  etag: string | null;
  revision: number | null;
  fetchedAt: number | null;
  /** time the last fetch took (ms) */
  fetchMs: number | null;
  /** count of successful runtime loads this session */
  runtimeLoads: number;
}

const CONTENT_ENDPOINT = '/api/v1/content';
const FETCH_TIMEOUT_MS = 4000;

/** In-memory content cache: single slot + ETag revalidation + soft TTL. */
export class ContentCache {
  private payload: ApiContentPayload | null = null;
  private etag: string | null = null;
  private fetchedAt = 0;
  /** soft TTL — after this age a background revalidation is allowed */
  private ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  get isFresh(): boolean {
    return this.payload !== null && Date.now() - this.fetchedAt < this.ttlMs;
  }

  get current(): { payload: ApiContentPayload | null; etag: string | null } {
    return { payload: this.payload, etag: this.etag };
  }

  store(payload: ApiContentPayload, etag: string | null): void {
    this.payload = payload;
    this.etag = etag;
    this.fetchedAt = Date.now();
  }

  clear(): void {
    this.payload = null;
    this.etag = null;
    this.fetchedAt = 0;
  }
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const defaultFetch: FetchFn = (url, init) => fetch(url, init);

class ContentLoader {
  private doc: ContentDocument = STATIC_CONTENT;
  private stateValue: ContentState = {
    phase: 'idle',
    source: 'static',
    reason: '',
    etag: null,
    revision: null,
    fetchedAt: null,
    fetchMs: null,
    runtimeLoads: 0,
  };
  private cache = new ContentCache();
  private inflight: Promise<void> | null = null;
  private fetchFn: FetchFn;

  constructor(fetchFn: FetchFn = defaultFetch) {
    this.fetchFn = fetchFn;
  }

  /** Current content document (static snapshot until runtime content loads). */
  get content(): ContentDocument {
    return this.doc;
  }

  get state(): ContentState {
    return { ...this.stateValue };
  }

  /** Synchronous access for modules that need the current document. */
  getContent(): ContentDocument {
    return this.doc;
  }

  /** Idempotent boot: load runtime content once (reuses inflight request). */
  init(): Promise<void> {
    if (this.inflight) return this.inflight;
    this.inflight = this.load().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  /** Revalidate (used by the provider on mount / cache expiry). */
  revalidate(): Promise<void> {
    return this.load(true);
  }

  private async load(force = false): Promise<void> {
    // Short-circuit: if we have a fresh cached payload and aren't forced,
    // keep serving it (no DB hit per component).
    if (!force && this.cache.isFresh) return;

    this.stateValue.phase = 'loading';
    const started = performance.now();

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (this.cache.current.etag) headers['If-None-Match'] = this.cache.current.etag;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await this.fetchFn(CONTENT_ENDPOINT, { headers, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      // 304 → cache still valid; keep serving current runtime content.
      if (res.status === 304 && this.doc !== STATIC_CONTENT) {
        this.markRuntime(this.cache.current.payload, this.cache.current.etag, started, 'revalidated (304)');
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const raw: unknown = await res.json();
      const { payload, result } = validateContentPayload(raw);

      if (!result.ok || payload === null) {
        const diag = describeValidation(result);
        console.warn('[AV OS content] invalid runtime payload — falling back to static:', diag);
        this.fallback(`invalid payload (${diag})`);
        return;
      }

      const etag = res.headers.get('ETag');
      this.cache.store(payload, etag);
      const { content: adapted } = adaptContentPayload(payload);
      this.applyRuntime(adapted, payload.revision ?? null, etag, started);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AV OS content] runtime load failed — falling back to static:', msg);
      this.fallback(msg);
    }
  }

  /** Merge adapted runtime content over the static snapshot (per collection). */
  private applyRuntime(adapted: DeepPartial<ContentDocument>, revision: number | null, etag: string | null, started: number): void {
    // Compact first: drop undefined/''/empty values so an empty or partial CMS
    // document never blanks out a field that has static content (§11D).
    const compacted = deepCompact(adapted) as DeepPartial<ContentDocument> | undefined;
    // Shallow-merge per top-level collection: a collection present in the
    // adapted content replaces the static one; anything absent keeps static.
    const merged: ContentDocument = { ...STATIC_CONTENT };
    for (const key of Object.keys(compacted ?? {}) as (keyof ContentDocument)[]) {
      const value = (compacted as DeepPartial<ContentDocument>)[key];
      if (value !== undefined) {
        // @ts-expect-error — collection-level merge (each collection is a module namespace)
        merged[key] = { ...merged[key], ...value };
      }
    }
    this.doc = merged;
    this.stateValue = {
      phase: 'runtime',
      source: 'runtime',
      reason: '',
      etag,
      revision,
      fetchedAt: Date.now(),
      fetchMs: Math.round(performance.now() - started),
      runtimeLoads: this.stateValue.runtimeLoads + 1,
    };
  }

  private markRuntime(payload: ApiContentPayload | null, etag: string | null, started: number, reason: string): void {
    this.stateValue = {
      phase: 'runtime',
      source: 'runtime',
      reason,
      etag,
      revision: payload?.revision ?? this.stateValue.revision,
      fetchedAt: Date.now(),
      fetchMs: Math.round(performance.now() - started),
      runtimeLoads: this.stateValue.runtimeLoads,
    };
  }

  private fallback(reason: string): void {
    this.doc = STATIC_CONTENT;
    this.stateValue = {
      phase: 'fallback',
      source: 'static',
      reason,
      etag: this.stateValue.etag,
      revision: this.stateValue.revision,
      fetchedAt: this.stateValue.fetchedAt,
      fetchMs: this.stateValue.fetchMs,
      runtimeLoads: this.stateValue.runtimeLoads,
    };
  }
}

/**
 * Deep-compact: remove `undefined`/`null`/`''`/empty-array/empty-object leaves
 * (recursively). Used so empty runtime content falls back to static per-field
 * rather than overwriting it with blanks.
 */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isEmptyLeaf(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}
function deepCompact(v: unknown): unknown {
  if (Array.isArray(v)) {
    const out = v.map(deepCompact).filter((x) => !isEmptyLeaf(x));
    return out.length ? out : undefined;
  }
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const c = deepCompact(x);
      if (!isEmptyLeaf(c)) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v;
}

/** Singleton loader (one content source per session). */
export const contentLoader = new ContentLoader();

/** Boot-time initialisation (idempotent). */
export function initContent(): Promise<void> {
  return contentLoader.init();
}

/** Current content document (static fallback until runtime content is live). */
export function getContent(): ContentDocument {
  return contentLoader.getContent();
}

/** Diagnostics for observability (dev tools, tests, logging). */
export function getContentState(): ContentState {
  return contentLoader.state;
}

/** Re-export for tests / tooling that need to drive a fresh loader. */
export { ContentLoader, STATIC_CONTENT, CONTENT_ENDPOINT, FETCH_TIMEOUT_MS };
export type { ContentDocument };
