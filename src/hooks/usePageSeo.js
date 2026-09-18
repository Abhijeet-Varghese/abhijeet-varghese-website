import { useEffect } from 'react';
/* Per-route SEO: applies the page's legacy head (title, description,
   canonical, OG, Twitter, JSON-LD) on route change. Values come from
   src/data/pageMeta.json (extracted from the approved legacy heads) and can
   be overridden by CMS content.seo entries for the same path. */
const upsertMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
};
export default function usePageSeo(meta, cmsSeo) {
  useEffect(() => {
    if (!meta) return undefined;
    const cms = Array.isArray(cmsSeo) ? cmsSeo.find((s) => s.path === meta.route) : null;
    const title = (cms && cms.title) || meta.title;
    const desc = (cms && cms.description) || meta.description;
    if (title) document.title = title;
    upsertMeta('name', 'description', desc);
    let can = document.head.querySelector('link[rel="canonical"]');
    if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
    can.href = meta.canonical || ('https://abhijeetvarghese.com' + meta.route);
    (meta.og || []).forEach(([k, v]) => upsertMeta('property', k, v));
    (meta.twitter || []).forEach(([k, v]) => upsertMeta('name', k, v));
    document.querySelectorAll('script[data-route-jsonld]').forEach((s) => s.remove());
    (meta.jsonld || []).forEach((j) => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.setAttribute('data-route-jsonld', '1'); s.textContent = j; document.head.appendChild(s); });
    return undefined;
  }, [meta, cmsSeo]);
}
