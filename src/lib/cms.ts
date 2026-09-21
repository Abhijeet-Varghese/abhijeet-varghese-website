/**
 * AV OS CMS client — public content API → React.
 * REACT → PHP API → MySQL. No secrets in bundle.
 * Fail-safe: every call returns fallback if API/DB unavailable.
 * CMS is source of truth when available; fallback preserves approved design.
 */
export type CmsKey = 'settings'|'nav'|'pages'|'projects'|'articles'|'seo'|'sections'|'clients'|'media';

export interface CmsNavItem { id: string; label: string; href: string; page?: string; cta?: boolean; }
export interface CmsNav { primary: CmsNavItem[]; footerColumns: { id: string; label: string; links: { id:string; label:string; href:string }[] }[]; copyright?: string; source?: string; }
export interface CmsSettings { siteName?: string; tagline?: string; email?: string; phone?: string; availability?: string; logo?: string; favicon?: string; ogImage?: string; metaDescription?: string; keywords?: string; socials?: { id:string; label:string; href:string }[]; source?: string; }
export interface CmsSection {
  id: string; type?: string; name?: string; kicker?: string; title?: string; title2?: string; lede?: string;
  roles?: string[]; portrait?: string; cta?: { label:string; href:string }; cta2?: { label:string; href:string }; availability?: string; marquee?: string[];
  clientIds?: string[]; note?: string; projectIds?: string[]; essayIds?: string[]; quote?: string; image?: string; imageCaption?: string;
  items?: string[]; capabilities?: { name:string; body:string }[]; list?: string[]; openTo?: string[]; openLabel?: string;
  eras?: { name:string; note:string; future?: boolean }[]; coda?: string; p1?: string; p2?: string; chips?: string[]; projects?: { name:string; body:string }[]; motto?: string;
  micro?: { label:string; value:string; href?:string }[]; email?: string; phone?: string; theme?: string; status?: string; order?: number;
  // allow passthrough for legacy fields
  [k: string]: unknown;
}
export interface CmsProject {
  id: string; title: string; cardTitle?: string; client?: string; industry?: string; services?: string; status?: string; year?: string; featured?: boolean; order?: number;
  image?: string; imageAlt?: string; summary?: string; role?: string; challenge?: string; approach?: string; outcome?: string; location?: string;
  slug?: string; caseStudyPath?: string; url?: string; sections?: unknown[]; seo?: { title:string; desc:string; keywords:string; ogImage:string; canonical:string };
}
export interface CmsArticle {
  id: string; title: string; slug: string; type: string; status?: string; category?: string; readTime?: string; date?: string; image?: string; excerpt?: string; body?: string; url?: string; seo?: { title:string; desc:string; keywords:string; ogImage:string; canonical:string };
}
export interface CmsSeoRow { id: string; title: string; url: string; desc: string; canonical?: string; ogImage?: string; h1?: string; keywords?: string[]; score?: number; }
export interface CmsClient { id: string; name: string; monogram?: string; industry?: string; logo: string; }
export type CmsDoc = Record<CmsKey, unknown> & {_versions?: Record<string,number>};

const PUBLIC_KEYS: CmsKey[] = ['settings','nav','pages','projects','articles','seo','sections','clients','media'];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4500);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal, headers: { Accept: 'application/json', ...(init?.headers||{}) }});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally { clearTimeout(t); }
}

/** GET /api/public/content — all public keys, 60s CDN cache */
export async function getPublicContent(): Promise<{ ok: boolean; data: Partial<CmsDoc> } | null> {
  try {
    const res = await fetchJson<{ ok: boolean; data: Partial<CmsDoc> }>('/api/public/content');
    return res?.ok ? res : null;
  } catch { return null; }
}

/** GET /api/public/content/:key — single key */
export async function getPublicContentKey<K extends CmsKey>(key: K): Promise<{ ok:boolean; key:K; data: unknown } | null> {
  if (!PUBLIC_KEYS.includes(key)) return null;
  try {
    const res = await fetchJson<{ ok:boolean; key:K; data: unknown}>(`/api/public/content/${encodeURIComponent(key)}`);
    return res?.ok ? res : null;
  } catch { return null; }
}

/** GET /api/public/site — site_url + sync state */
export async function getPublicSite(): Promise<{ ok:boolean; site_url:string; sync:unknown; version:string } | null> {
  try { return await fetchJson<{ ok:boolean; site_url:string; sync:unknown; version:string }>('/api/public/site'); } catch { return null; }
}

/** Convenience: resolve asset URL — CMS media uses site-relative "media/..." */
export function cmsMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

/** Find a CMS section by id from a sections array */
export function findSection(sections: unknown, id: string): CmsSection | null {
  if (!Array.isArray(sections)) return null;
  const found = (sections as CmsSection[]).find((s) => s?.id === id);
  return found ?? null;
}

/** Safely pick a string field from CMS, else fallback */
export function pickString(cmsVal: unknown, fallback: string): string {
  return typeof cmsVal === 'string' && cmsVal.trim() !== '' ? cmsVal : fallback;
}

/** CMS media override with fallback */
export function pickMedia(cmsVal: unknown, fallback: string): string {
  const s = typeof cmsVal === 'string' ? cmsVal.trim() : '';
  if (!s) return fallback;
  return cmsMediaUrl(s);
}
