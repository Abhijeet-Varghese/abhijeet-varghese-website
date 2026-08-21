/**
 * AV OS — content merge (shared by the loader and the parity checker).
 *
 * `mergeContent(adapted)` deep-compacts the adapter output (drops
 * `undefined`/`''`/empty values so empty CMS content never blanks out a
 * static field) and merges it over the static snapshot, per collection.
 *
 * This single function is the one source of truth for "what the frontend
 * actually renders", so the parity checker measures exactly what the loader
 * produces.
 */
import { STATIC_CONTENT, type ContentDocument } from './static-snapshot';
import type { DeepPartial } from './types';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deep-compact: remove `undefined`/`null`/`''`/empty-array/empty-object *fields*
 * so empty CMS content never blanks out a static field. `''` inside an array is
 * a meaningful value (e.g. a blank-line paragraph separator) and is preserved.
 */
export function deepCompact(v: unknown): unknown {
  if (Array.isArray(v)) {
    const out = v.map(deepCompact).filter((x) => x !== undefined && x !== null);
    return out.length ? out : undefined;
  }
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const c = deepCompact(x);
      if (c !== undefined && c !== null && c !== '') out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v;
}

/** Merge adapted runtime content over the static snapshot (per collection). */
export function mergeContent(adapted: DeepPartial<ContentDocument>): ContentDocument {
  const compacted = deepCompact(adapted) as DeepPartial<ContentDocument> | undefined;
  const merged: ContentDocument = { ...STATIC_CONTENT };
  for (const key of Object.keys(compacted ?? {}) as (keyof ContentDocument)[]) {
    const value = (compacted as DeepPartial<ContentDocument>)[key];
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (merged as Record<string, any>)[key] = { ...(merged[key] as object), ...(value as object) };
    }
  }
  return merged;
}
