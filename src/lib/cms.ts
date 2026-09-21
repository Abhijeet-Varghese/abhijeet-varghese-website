/**
 * AV OS CMS client — public content API → React.
 * REACT → PHP API → MySQL. No secrets in bundle.
 * Fail-safe: every call returns fallback if API/DB unavailable.
 */
export type CmsKey = 'settings'|'nav'|'pages'|'projects'|'articles'|'seo'|'sections'|'clients'|'media';
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
