/**
 * AV OS — runtime content payload schema + validation (Phase 3 §5).
 *
 * `GET /api/v1/content` returns the standard AV OS envelope
 * `{ ok, data, error }` where `data` is the structured content document.
 * We validate it before rendering so malformed CMS data can never crash the
 * frontend: invalid content fails safely, logs a diagnostic, and falls back
 * to the static snapshot.
 *
 * The validator is deliberately lightweight and structural (shape + types +
 * status filtering), not a full runtime type-checker — it verifies enough to
 * guarantee the adapter and renderer can consume the payload safely.
 */

export const CONTENT_SCHEMA = 'avos.content/v1' as const;
export const SUPPORTED_SCHEMA_VERSIONS = [1] as const;

export interface ApiContentEnvelope {
  ok: boolean;
  data: ApiContentPayload | null;
  error: { code?: string; message?: string; request_id?: string } | null;
}

export interface ApiContentPayload {
  schema?: string;
  schemaVersion?: number;
  generatedAt?: string;
  revision?: number;
  settings?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
  sections?: unknown[];
  pages?: unknown[];
  projects?: unknown[];
  articles?: unknown[];
  clients?: unknown[];
  testimonials?: unknown[];
  media?: unknown[];
  seo?: unknown[];
  downloads?: unknown[];
  experience?: unknown[];
  story?: Record<string, unknown>;
  orange?: Record<string, unknown>;
  page_content?: Record<string, unknown>;
  page_seo?: Record<string, unknown>;
}

/** Collections that MUST be arrays (or objects) to be considered valid. */
const ARRAY_KEYS = ['sections', 'pages', 'projects', 'articles', 'clients', 'testimonials', 'media', 'seo', 'downloads', 'experience'] as const;
const OBJECT_KEYS = ['settings', 'navigation', 'story', 'orange', 'page_content', 'page_seo'] as const;

export interface ValidationResult {
  ok: boolean;
  /** hard failures — payload must be rejected */
  errors: string[];
  /** soft problems — payload is usable but noteworthy */
  warnings: string[];
  /** collection name → number of non-published items that were dropped */
  filtered: Record<string, number>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate + sanitize a runtime content payload.
 *
 * Returns the sanitized payload (draft/non-published items removed) plus a
 * result describing whether it is safe to use. `errors` being non-empty means
 * the caller MUST fall back to the static snapshot.
 */
export function validateContentPayload(raw: unknown): { payload: ApiContentPayload | null; result: ValidationResult } {
  const result: ValidationResult = { ok: false, errors: [], warnings: [], filtered: {} };

  // 1. envelope
  if (!isRecord(raw)) {
    result.errors.push('envelope: not an object');
    return { payload: null, result };
  }
  const env = raw as unknown as ApiContentEnvelope;
  if (env.ok !== true) {
    result.errors.push(`envelope: ok !== true (${String(env.ok)})`);
    return { payload: null, result };
  }
  if (!isRecord(env.data)) {
    result.errors.push('envelope: data missing or not an object');
    return { payload: null, result };
  }

  const data = env.data as unknown as ApiContentPayload;

  // 2. schema marker
  if (data.schema !== CONTENT_SCHEMA) {
    result.errors.push(`schema: expected "${CONTENT_SCHEMA}", got "${String(data.schema)}"`);
  }
  if (typeof data.schemaVersion !== 'number' || !(SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(data.schemaVersion)) {
    result.errors.push(`schemaVersion: unsupported (${String(data.schemaVersion)})`);
  }
  if (typeof data.revision !== 'number') {
    result.warnings.push('revision: missing or non-numeric');
  }

  // 3. required collections present with correct shape
  for (const k of ARRAY_KEYS) {
    const v = (data as Record<string, unknown>)[k];
    if (v === undefined) {
      result.warnings.push(`collection "${k}" absent`);
      continue;
    }
    if (!Array.isArray(v)) {
      result.errors.push(`collection "${k}" must be an array`);
    }
  }
  for (const k of OBJECT_KEYS) {
    const v = (data as Record<string, unknown>)[k];
    if (v !== undefined && !isRecord(v)) {
      result.errors.push(`collection "${k}" must be an object`);
    }
  }

  // 4. status filtering (defence-in-depth — the server already filters, but a
  //    malformed/legacy payload must never leak non-published items).
  const sanitized: ApiContentPayload = { ...data };
  for (const k of ['sections', 'pages', 'projects', 'articles', 'testimonials', 'downloads'] as const) {
    const arr = sanitized[k];
    if (!Array.isArray(arr)) continue;
    const before = arr.length;
    sanitized[k] = arr.filter((it) => isRecord(it) && (it.status === undefined || it.status === 'published'));
    const dropped = before - (sanitized[k] as unknown[]).length;
    if (dropped > 0) result.filtered[k] = dropped;
  }

  result.ok = result.errors.length === 0;
  return { payload: result.ok ? sanitized : null, result };
}

/** Human-readable diagnostic string for console/logs. */
export function describeValidation(result: ValidationResult): string {
  const parts: string[] = [];
  if (result.errors.length) parts.push(`errors: ${result.errors.join('; ')}`);
  if (result.warnings.length) parts.push(`warnings: ${result.warnings.join('; ')}`);
  const f = Object.entries(result.filtered).map(([k, n]) => `${k}:${n}`);
  if (f.length) parts.push(`filtered non-published: ${f.join(', ')}`);
  return parts.length ? parts.join(' | ') : 'ok';
}
