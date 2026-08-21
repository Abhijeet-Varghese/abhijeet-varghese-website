/**
 * AV OS — content document model (Phase 3).
 *
 * `ContentDocument` is the single shape the React frontend renders from. It is
 * assembled from the existing `src/content/*` modules, which remain the
 * build-time / no-JS fallback ("last-known-good") during this phase.
 *
 * The runtime loader (see loader.ts) fetches `GET /api/v1/content`, validates
 * it, adapts it (adapt.ts) into this same shape, and swaps it in — falling
 * back to the static snapshot on any failure. Components keep importing the
 * `src/content/*` modules; only the *source* of those values changes.
 */
export type { ContentDocument } from './static-snapshot';

/** Recursive partial — functions become optional, arrays are kept whole. */
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T | undefined
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T | undefined;
