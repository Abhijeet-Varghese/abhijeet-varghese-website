import { useEffect } from 'react';
import { useCmsContent } from './useCmsContent';
import type { CmsSeoRow } from '../lib/cms';

function upsertMeta(nameOrProp: string, content: string, isProp = false) {
  const sel = isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
  let el = document.querySelector(sel) as HTMLMetaElement | null;
  if (!content) return;
  if (!el) {
    el = document.createElement('meta');
    if (isProp) el.setAttribute('property', nameOrProp);
    else el.setAttribute('name', nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  if (!href) return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * useCmsSeo — CMS SEO → document.head
 * Reads `seo` key (array of rows by url) and when CMS provides a row for this
 * path, overrides title/description/canonical/OG/Twitter. Keeps static
 * fallback when CMS unavailable.
 */
export function useCmsSeo(path: string, fallback?: { title?: string; description?: string }) {
  const { data } = useCmsContent('seo', null);
  useEffect(() => {
    if (!Array.isArray(data)) return;
    const rows = data as CmsSeoRow[];
    const norm = (u: string) => {
      if (!u) return '/';
      const p = u.split('?')[0].split('#')[0];
      return p.endsWith('/') || p === '/' ? p : `${p}/`;
    };
    const target = norm(path);
    const row = rows.find((r) => norm(r.url) === target || norm(r.url) === target.replace(/\/$/, '') || r.url === path);
    if (!row) return;
    if (row.title && row.title !== document.title) {
      document.title = row.title;
    } else if (fallback?.title && !row.title) {
      // keep fallback title
    }
    if (row.desc) {
      upsertMeta('description', row.desc);
      upsertMeta('og:description', row.desc, true);
      upsertMeta('twitter:description', row.desc);
    } else if (fallback?.description) {
      upsertMeta('description', fallback.description);
    }
    if (row.canonical) setCanonical(row.canonical);
    if (row.ogImage) {
      const abs = row.ogImage.startsWith('http') ? row.ogImage : `https://abhijeetvarghese.com${row.ogImage.startsWith('/') ? row.ogImage : `/${row.ogImage}`}`;
      // cms media refs are site-relative media/... → /media/...
      const resolved = abs.includes('media/') && !abs.includes('/media/') ? abs.replace('media/', '/media/') : abs;
      upsertMeta('og:image', resolved, true);
      upsertMeta('twitter:image', resolved);
    }
  }, [data, path, fallback?.title, fallback?.description]);
}
