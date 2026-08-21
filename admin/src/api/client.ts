/**
 * AV OS admin — centralized typed API client.
 *
 * Single choke point for every network call. Handles: same-origin base URL,
 * credentials, CSRF header injection on mutations, JSON parsing, the
 * `{ok, data, error}` envelope, timeouts, request-ID surfacing, and a small
 * in-flight GET cache. Modules (`api/content.ts`, …) wrap this with typed
 * helpers; components never call `fetch` directly.
 */
import type { ApiEnvelope } from './types';

const BASE = '/api';
const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }

  /** User-safe message (never exposes internals). */
  get safeMessage(): string {
    if (this.code === 'UNAUTHENTICATED') return 'Your session has expired — please sign in again.';
    if (this.code === 'FORBIDDEN') return 'You do not have permission to do that.';
    if (this.code === 'RATE_LIMITED') return 'Too many requests — please slow down.';
    if (this.code === 'VALIDATION_ERROR' || this.status === 422) return this.message;
    if (this.status === 404) return 'Not found.';
    if (this.status >= 500) return 'Server error — please try again.';
    return this.message;
  }
}

export class CsrfStore {
  private static token: string | null = null;
  static set(t: string | null): void { this.token = t; }
  static get(): string | null { return this.token; }
}

/** Simple in-flight GET cache (de-dup concurrent reads, no stale persistence). */
const inflight = new Map<string, Promise<ApiEnvelope<unknown>>>();

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

export async function apiGet<T>(path: string, opts: { cache?: boolean } = {}): Promise<T> {
  const url = BASE + path;
  if (opts.cache !== false && inflight.has(url)) {
    return (inflight.get(url) as Promise<ApiEnvelope<T>>).then((r) => r.data as T);
  }
  const p = request<ApiEnvelope<T>>('GET', path).finally(() => inflight.delete(url));
  if (opts.cache !== false) inflight.set(url, p as Promise<ApiEnvelope<unknown>>);
  const r = await p;
  return r.data as T;
}

export async function apiSend<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const r = await request<ApiEnvelope<T>>(method, path, body);
  return r.data as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && CsrfStore.get()) headers['X-CSRF-Token'] = CsrfStore.get() as string;

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      credentials: 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === 'AbortError') {
      throw new ApiError('Request timed out — please try again.', 0, 'TIMEOUT');
    }
    throw new ApiError('Network error — check your connection.', 0, 'NETWORK');
  }
  clearTimeout(timer);

  const requestId = res.headers.get('X-Request-Id') ?? undefined;
  let json: ApiEnvelope<unknown> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<unknown>;
  } catch {
    json = null;
  }

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new ApiError('Authentication required.', res.status, 'UNAUTHENTICATED', requestId);
  }
  if (!res.ok || !json?.ok) {
    const code = json?.error?.code ?? undefined;
    const msg = json?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, code, requestId);
  }
  return json as T;
}
