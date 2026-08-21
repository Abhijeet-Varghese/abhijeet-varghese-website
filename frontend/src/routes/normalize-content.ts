/**
 * AV OS — content URL normalisation (brief §28).
 *
 * The content modules still carry pre-cutover `*.html` hrefs in ~67 places.
 * Rather than hand-editing every one (error-prone, and nothing stops the next
 * one being added), every internal link is rewritten to its canonical
 * extensionless form at a single choke point.
 *
 * Applied to BOTH content paths — `STATIC_CONTENT` and `mergeContent()` — which
 * are the only two values `ContentLoader.doc` can ever hold. Because server and
 * client run the identical transform, hydration cannot mismatch.
 */
import { normalizeHref } from '@/routes/registry';

/** Object keys whose string values are treated as links. */
const LINK_KEYS = new Set(['href', 'url', 'link', 'to', 'path', 'canonical', 'permalink']);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deep-clone `value`, rewriting internal links to clean URLs.
 *
 * A string is rewritten when it is either (a) the value of a link-ish key, or
 * (b) an unmistakable internal page reference (ends in `.html` and is not an
 * asset path). Prose is never touched — a sentence merely containing the
 * characters ".html" is not a link and is left exactly as authored.
 */
export function normalizeContentUrls<T>(value: T, key?: string): T {
  if (typeof value === 'string') {
    const looksLikeLink = key !== undefined && LINK_KEYS.has(key);
    const looksLikePage = /^[./]*[\w./-]+\.html(?:[?#][^\s]*)?$/.test(value);
    return (looksLikeLink || looksLikePage ? normalizeHref(value) : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => normalizeContentUrls(v, key)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeContentUrls(v, k);
    return out as unknown as T;
  }
  return value;
}
