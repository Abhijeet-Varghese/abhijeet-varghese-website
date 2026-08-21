/**
 * AV OS — ROUTE REGISTRY (single source of truth for public URLs).
 *
 * Brief §28–§32. Every public URL is extensionless. This module is the ONLY
 * place a public path is declared; canonicals, the sitemap, the .htaccess
 * redirect map, the prerender output paths and every internal link are all
 * derived from it. Nothing else may hardcode a URL.
 *
 * `legacy` records the URL the page was published at before the clean-URL
 * cutover so a permanent redirect can be generated automatically (§31) — no
 * inbound link or ranking is lost.
 *
 * Shared by the browser bundle and the Node build scripts, so it must stay
 * dependency-free and side-effect-free.
 */

import routesJson from './routes.json';

export interface RouteDef {
  /** prerender page id (matches PAGES / prerender ROUTES) */
  id: string;
  /** canonical, extensionless public path — always leading slash, never trailing */
  clean: string;
  /** pre-cutover public path, used to generate the 301 (null = never published) */
  legacy: string | null;
  /** file written into dist/ (directory-index form so any static host serves it) */
  out: string;
  /** include in sitemap.xml */
  sitemap: boolean;
  priority?: number;
  changefreq?: string;
}

/**
 * The table itself lives in `routes.json` so the Node build scripts
 * (prerender, sitemap, redirect map, URL verifier) and the browser bundle
 * read the SAME bytes. Duplicating it in two languages is precisely how
 * route definitions drift apart.
 */
export const ROUTES: RouteDef[] = routesJson as RouteDef[];


/** Legacy public path (and bare filename) → clean path. Built once. */
const LEGACY_TO_CLEAN: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const r of ROUTES) {
    if (!r.legacy) continue;
    map[r.legacy] = r.clean;                       // '/story.html'
    map[r.legacy.replace(/^\//, '')] = r.clean;    // 'story.html'
    map[`./${r.legacy.replace(/^\//, '')}`] = r.clean;
  }
  // index.html in any of its written forms resolves to the site root
  map['index.html'] = '/';
  map['./index.html'] = '/';
  map['/index.html'] = '/';
  return map;
})();

/**
 * Resolve any internal href to its canonical extensionless path.
 * Leaves external URLs, anchors, mailto:, tel: and asset paths untouched.
 * Preserves #fragments and ?queries.
 */
export function normalizeHref(href: string): string {
  if (typeof href !== 'string' || href === '') return href;
  if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(href)) return href;
  if (/^\.?\/?assets\//.test(href)) return href;

  const m = /^([^?#]*)([?#].*)?$/.exec(href);
  if (!m) return href;
  const path = m[1] ?? '';
  const suffix = m[2] ?? '';

  const hit = LEGACY_TO_CLEAN[path];
  if (hit !== undefined) return hit + suffix;

  // Any other stray .html reference → strip the extension so §103 holds.
  if (path.endsWith('.html')) {
    const stripped = path.replace(/(?:^\.\/)?(.*)\.html$/, '/$1').replace(/\/index$/, '') || '/';
    return stripped + suffix;
  }
  return href;
}

export const byId = (id: string): RouteDef | undefined => ROUTES.find((r) => r.id === id);
export const cleanFor = (id: string): string => byId(id)?.clean ?? '/';
