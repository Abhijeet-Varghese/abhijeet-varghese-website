import type { SeoData } from '@/types';
import { normalizeHref } from '@/routes/registry';
import { PUBLIC_EMAIL } from '@/config/identity';

/** Canonical production origin (SEO absolute URLs). */
export const SITE_ORIGIN = 'https://abhijeetvarghese.com';

/**
 * Staging build flag (build-time only). When `VITE_STAGING=1` is set for the
 * Vite build, every generated page gets `noindex, nofollow` so a staging copy
 * (e.g. next.abhijeetvarghese.com) cannot compete with production SEO.
 */
const IS_STAGING = (import.meta.env?.VITE_STAGING ?? '') === '1';

/** Absolute canonical URL, forced to the clean extensionless form (§30). */
export function canonicalUrl(raw: string): string {
  if (!raw) return SITE_ORIGIN + '/';
  const abs = raw.startsWith('http') ? raw : SITE_ORIGIN + (raw.startsWith('/') ? raw : '/' + raw);
  const u = new URL(abs);
  const clean = normalizeHref(u.pathname);
  // no trailing slash, except the root (§30)
  const path = clean === '/' ? '/' : clean.replace(/\/+$/, '');
  return u.origin + path + u.search + u.hash;
}

export const HOME_SEO: SeoData = {
  title:
    'Abhijeet Varghese — Creative Systems Leader | Experience Design, Enterprise Innovation & AI',
  description:
    'Abhijeet Varghese is a multidisciplinary creative systems leader with 12+ years across experience design, enterprise innovation, immersive technology and AI-enabled creative production.',
  keywords:
    'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: `${SITE_ORIGIN}/`,
  ogType: 'website',
  ogImage: `${SITE_ORIGIN}/assets/hero-portrait.webp`,
  twitterCard: 'summary_large_image',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Person',
    // Stable @id so other pages (e.g. the Orange case study graph) can
    // reference the same entity instead of describing a second person.
    '@id': `${SITE_ORIGIN}/#person`,
    name: 'Abhijeet Varghese',
    url: `${SITE_ORIGIN}/`,
    jobTitle: 'Creative Systems Leader',
    description:
      'Multidisciplinary creative systems leader with 12+ years across experience design, enterprise innovation, immersive technology and AI-enabled creative production.',
    email: `mailto:${PUBLIC_EMAIL}`,
    telephone: '+91-96940 80706',
    image: `${SITE_ORIGIN}/assets/logo.png`,
    // What this person is an authority on. This is the property that
    // increasingly drives inclusion in AI-assisted search results.
    knowsAbout: [
      'Experience Design',
      'Experience Centres',
      'Executive Briefing Centers',
      'Creative Direction',
      'Creative Strategy',
      'Brand Systems',
      'Enterprise Innovation',
      'Immersive Technology',
      'XR',
      'VR',
      'Spatial Experience',
      'AI-Enabled Creative Production',
      'Design Leadership',
    ],
    sameAs: [
      'https://www.linkedin.com/in/abhijeetvarghese/',
      'https://www.instagram.com/abhijeetvarghese/',
      'https://api.whatsapp.com/send?phone=919694080706',
      'https://www.youtube.com/@AbhijeetVarghese',
      'https://www.behance.net/abhijeetvarghese',
    ],
  },
};

export const STORY_SEO: SeoData = {
  title: 'About — Abhijeet Varghese | Creative Director & Experience Designer',
  description:
    'A creative director and experience designer who started in VFX and animation and now shapes films, interactive experiences, VR/XR, experience centres and brand systems.',
  keywords:
    'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: `${SITE_ORIGIN}/story.html`,
  ogType: 'website',
  ogImage: `${SITE_ORIGIN}/assets/hero-portrait.webp`,
  twitterCard: 'summary_large_image',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Abhijeet Varghese',
    url: `${SITE_ORIGIN}/story.html`,
    inLanguage: 'en',
    description:
      'A creative director and experience designer who started in VFX and animation and now shapes films, interactive experiences, VR/XR, experience centres and brand systems.',
  },
};

interface HeadOptions {
  /** optional asset paths to preload (fonts / hero image) */
  preloads?: { href: string; as: 'font' | 'image'; type?: string; fetchPriority?: string }[];
  themeColor?: string;
  /** relative favicon path (defaults to root-level assets/logo.png) */
  favicon?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build the full <head> inner HTML for a route (static, no hydration needed). */
export function buildHead(seo: SeoData, opts: HeadOptions = {}): string {
  const parts: string[] = [];
  parts.push('<meta charset="utf-8">');
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  parts.push(`<title>${esc(seo.title)}</title>`);
  parts.push(`<meta name="description" content="${esc(seo.description)}">`);
  if (seo.keywords) parts.push(`<meta name="keywords" content="${esc(seo.keywords)}">`);
  parts.push(
    seo.noindex || IS_STAGING
      ? '<meta name="robots" content="noindex, nofollow">'
      : '<meta name="robots" content="index, follow, max-image-preview:large">',
  );
  parts.push(`<meta name="theme-color" content="${opts.themeColor ?? seo.themeColor ?? '#F7F5EF'}">`);
  // §30: canonicals are always the clean, extensionless form. Normalising
  // here (rather than in 25 SeoData literals) means a stray *.html canonical
  // is structurally impossible.
  const canonical = canonicalUrl(seo.canonical);
  parts.push(`<link rel="canonical" href="${esc(canonical)}">`);
  for (const p of opts.preloads ?? []) {
    const attrs = [
      `rel="preload"`,
      `href="${esc(p.href)}"`,
      `as="${p.as}"`,
      p.type ? `type="${esc(p.type)}"` : '',
      p.as === 'font' ? 'crossorigin' : '',
      p.fetchPriority ? `fetchpriority="${p.fetchPriority}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    parts.push(`<link ${attrs}>`);
  }
  parts.push(`<meta property="og:type" content="${seo.ogType ?? 'website'}">`);
  parts.push(`<meta property="og:url" content="${esc(canonical)}">`);
  parts.push('<meta property="og:site_name" content="Abhijeet Varghese">');
  parts.push(`<meta property="og:title" content="${esc(seo.ogTitle ?? seo.title)}">`);
  parts.push(`<meta property="og:description" content="${esc(seo.ogDescription ?? seo.description)}">`);
  if (seo.ogImage) parts.push(`<meta property="og:image" content="${esc(seo.ogImage)}">`);
  if (seo.ogImageAlt) parts.push(`<meta property="og:image:alt" content="${esc(seo.ogImageAlt)}">`);
  parts.push(`<meta name="twitter:card" content="${seo.twitterCard ?? 'summary_large_image'}">`);
  parts.push(`<meta name="twitter:title" content="${esc(seo.ogTitle ?? seo.title)}">`);
  parts.push(`<meta name="twitter:description" content="${esc(seo.ogDescription ?? seo.description)}">`);
  if (seo.ogImage) parts.push(`<meta name="twitter:image" content="${esc(seo.ogImage)}">`);
  parts.push(`<link rel="icon" type="image/png" href="${esc(opts.favicon ?? 'assets/logo.png')}">`);
  if (seo.jsonLd) parts.push(`<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`);
  return parts.join('\n  ');
}
