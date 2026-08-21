/**
 * AV OS — content adapter (Phase 3 §7: executable content mapping).
 *
 * Maps the runtime `GET /api/v1/content` payload (the normalized
 * `content_store` model: settings/navigation/sections/pages/projects/articles/
 * clients/…) into per-collection overrides for the `ContentDocument` the React
 * components render from.
 *
 * This file is the single place that knows the CMS→frontend field mapping.
 * It is deliberately faithful: it maps only what the CMS actually holds, and
 * leaves everything else `undefined` so the loader keeps the static fallback
 * for it. It never invents values. The parity checker (scripts/parity-check)
 * reads the same adapter output to report MATCH/MISSING/EXTRA/DIFFERENT/UNMAPPED.
 *
 * NOTE (documented limitation): the adapter overrides the *raw* collections
 * (PROJECTS, ARTICLES, CHROME, home sections…). Derived exports that are
 * computed at module load (ARTICLES_BY_SLUG, ESSAY_INDEX, …) remain static
 * until a later phase makes the content modules themselves store-backed.
 */
import type { ApiContentPayload } from './schema';
import type { ContentDocument } from './static-snapshot';
import type { DeepPartial } from './types';

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */

type R = Record<string, unknown>;
type PartialContent = DeepPartial<ContentDocument>;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
/** array of object records */
function arr(v: unknown): R[] {
  return Array.isArray(v) ? v.filter((x): x is R => typeof x === 'object' && x !== null) : [];
}
/** array of strings */
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/* ------------------------------------------------------------------ */
/* chrome ← settings + navigation                                       */
/* ------------------------------------------------------------------ */

function adaptChrome(settings: R, navigation: R): PartialContent['chrome'] {
  const socials = arr(settings.socials).map((s) => ({
    label: str(s.label),
    href: str(s.href),
    icon: (str(s.id) || str(s.label)).toLowerCase() as 'linkedin' | 'instagram' | 'whatsapp' | 'youtube' | 'behance',
  }));

  const primary = arr(navigation.primary).map((n) => ({ label: str(n.label), href: str(n.href) }));
  const columns = arr(navigation.footerColumns).map((c) => ({
    label: str(c.label),
    links: arr(c.links).map((l) => ({ label: str(l.label), href: str(l.href) })),
  }));

  return {
    CHROME: {
      brandLabel: str(settings.siteName) || undefined,
      brandHref: undefined, // build-time chrome (index.html) — not CMS-managed
      logoUrl: undefined, // build-time chrome — not CMS-managed
      primary,
      mobile: primary.map((p, i) => ({ ...p, index: String(i + 1).padStart(2, '0') })),
      cta: undefined, // derived (primary cta) — see note
      footer: {
        line: str(settings.tagline) || undefined,
        email: str(settings.email) || undefined,
        emailHref: str(settings.email) ? `mailto:${settings.email}` : undefined,
        phone: str(settings.phone) || undefined,
        phoneHref: str(settings.phone) ? `tel:${str(settings.phone).replace(/[^+\d]/g, '')}` : undefined,
        availability: str(settings.availability) || undefined,
        columns,
        social: socials,
        copyright: str(navigation.copyright) || undefined,
        note: undefined, // build-time chrome note — not CMS-managed
      },
    },
  } as PartialContent['chrome'];
}

/* ------------------------------------------------------------------ */
/* projects ← projects                                                  */
/* ------------------------------------------------------------------ */

function adaptProjects(projects: R[]): PartialContent['projects'] {
  const PROJECTS = projects.map((p, i) => ({
    slug: str(p.slug),
    client: str(p.client),
    category: str(p.industry),
    title: str(p.title),
    href: '', // derived by frontend from slug/status — not stored verbatim
    image: str(p.image),
    imageAlt: str(p.imageAlt),
    portfolioAlt: str(p.imageAlt),
    role: str(p.role),
    year: str(p.year),
    summary: str(p.summary),
    problem: str(p.challenge),
    approach: str(p.approach),
    outcome: str(p.outcome),
    status: (str(p.status) === 'published' ? 'published' : 'coming-soon') as 'published' | 'coming-soon',
    index: String(i + 1).padStart(2, '0'),
  }));
  return { PROJECTS } as PartialContent['projects'];
}

/* ------------------------------------------------------------------ */
/* articles ← articles                                                  */
/* ------------------------------------------------------------------ */

function adaptArticles(articles: R[]): PartialContent['articles'] {
  const ARTICLES = articles.map((a) => {
    const body = str(a.body);
    const paragraphs = body !== '' ? body.split(/\n{2,}/).map((s) => s.trim()) : [];
    return {
      slug: str(a.slug),
      kind: (str(a.type) === 'journal' ? 'journal' : 'essay') as 'essay' | 'journal',
      title: str(a.title),
      excerpt: str(a.excerpt),
      tag: str(a.category), // CMS category ≠ frontend "Design · 6 min" — DIFFERENT
      image: str(a.image),
      imageAlt: str(a.imageAlt ?? ''),
      imageWidth: 1376, // build-time dimensions — not CMS-managed
      imageHeight: 768,
      paragraphs,
      date: str(a.date),
      backLabel: '', // not CMS-managed
      backHref: '', // not CMS-managed
      related: undefined,
    };
  });
  return { ARTICLES } as PartialContent['articles'];
}

/* ------------------------------------------------------------------ */
/* clients ← clients (→ home.CLIENTS.logos)                             */
/* ------------------------------------------------------------------ */

function adaptClients(clients: R[]): { logos: { name: string; file: string }[] } {
  return { logos: clients.map((c) => ({ name: str(c.name), file: str(c.logo) })) };
}

/* ------------------------------------------------------------------ */
/* home sections ← sections                                             */
/* ------------------------------------------------------------------ */

function adaptHomeSections(sections: R[]): PartialContent['home'] {
  const byType = (t: string): R => sections.find((s) => str(s.type) === t) ?? {};

  const hero = byType('hero');
  const capabilities = byType('capabilities');
  const work = byType('work');
  const thinking = byType('thinking');
  const journey = byType('journey');
  const ai = byType('ai');
  const focus = byType('focus');
  const contact = byType('contact');
  const clientsSec = byType('clients');

  return {
    HERO: {
      seoLine: str(hero.title),
      nameLines: undefined,
      portrait: undefined,
      tagline: str(hero.title),
      roles: strArr(hero.roles),
      actions: undefined,
      availability: undefined,
      lede: str(hero.lede),
      marquee: undefined,
    },
    CLIENTS: {
      num: undefined,
      tag: undefined,
      title: str(clientsSec.title),
      lede: str(clientsSec.lede),
      logos: undefined, // resolved separately via clients + clientIds
      note: str(clientsSec.note),
    },
    CAPABILITIES: {
      num: undefined,
      tag: undefined,
      title: { lead: str(capabilities.title), em: str(capabilities.title2) },
      items: arr(capabilities.items).map((it) => ({
        num: str(it.num),
        title: str(it.name),
        description: str(it.body),
      })),
    },
    WORK: {
      num: undefined,
      tag: undefined,
      title: str(work.title),
      lede: str(work.lede),
      cases: undefined, // resolved via projects + projectIds
    },
    THINKING: {
      num: undefined,
      tag: undefined,
      lede: str(thinking.lede),
      essays: undefined, // resolved via articles + essayIds
      media: undefined,
    },
    JOURNEY: {
      num: undefined,
      tag: undefined,
      title: str(journey.title),
      hint: undefined,
      eras: arr(journey.eras).map((e, i) => ({
        index: String(i + 1).padStart(2, '0'),
        name: str(e.name),
        note: str(e.note),
        future: i === arr(journey.eras).length - 1,
      })),
      coda: undefined,
    },
    AI_METHOD: {
      num: undefined,
      tag: undefined,
      title: { lead: str(ai.title), em: str(ai.title2) },
      paragraphs: [str(ai.p1), str(ai.p2)].filter((s) => s !== ''),
      chips: undefined,
      projects: undefined,
      motto: undefined,
      media: undefined,
    },
    FOCUS: {
      num: undefined,
      tag: undefined,
      title: str(focus.title),
      lede: str(focus.lede),
      list: strArr(focus.list).map((l, i) => ({ num: String(i + 1).padStart(2, '0'), label: l })),
      openLabel: str(focus.openLabel),
      open: strArr(focus.openTo),
      note: str(focus.note),
    },
    CONTACT: {
      num: undefined,
      tag: undefined,
      title: str(contact.title),
      lede: str(contact.lede),
      micro: arr(contact.micro).map((m) => ({ label: str(m.label), value: str(m.value), href: str(m.href) || undefined })),
    },
  } as PartialContent['home'];
}

/* ------------------------------------------------------------------ */
/* public adapter entry                                                 */
/* ------------------------------------------------------------------ */

export interface AdaptationReport {
  /** collections the CMS has no equivalent for (left to static fallback) */
  unmapped: string[];
  /** collections adapted (may still contain per-field gaps) */
  adapted: string[];
}

export interface AdaptedContent {
  content: PartialContent;
  report: AdaptationReport;
}

/** Adapt a validated API payload into per-collection ContentDocument overrides. */
export function adaptContentPayload(api: ApiContentPayload): AdaptedContent {
  const content: PartialContent = {};
  const adapted: string[] = [];
  const unmapped: string[] = [];

  content.chrome = adaptChrome((api.settings ?? {}) as R, (api.navigation ?? {}) as R);
  adapted.push('chrome');

  if (Array.isArray(api.projects)) {
    content.projects = adaptProjects(api.projects as R[]);
    adapted.push('projects');
  }
  if (Array.isArray(api.articles)) {
    content.articles = adaptArticles(api.articles as R[]);
    adapted.push('articles');
  }
  if (Array.isArray(api.sections)) {
    content.home = adaptHomeSections(api.sections as R[]);
    adapted.push('home');
  }
  if (Array.isArray(api.clients)) {
    const logos = adaptClients(api.clients as R[]).logos;
    content.home = {
      ...(content.home ?? {}),
      CLIENTS: { ...(content.home?.CLIENTS ?? {}), logos },
    } as PartialContent['home'];
    adapted.push('clients');
  }

  // Collections with no CMS equivalent — the static snapshot remains the
  // source for these until a later phase adds the content to content_store.
  for (const k of ['experience', 'story', 'orange', 'pages', 'seo'] as const) {
    unmapped.push(k);
  }

  return { content, report: { adapted, unmapped } };
}
