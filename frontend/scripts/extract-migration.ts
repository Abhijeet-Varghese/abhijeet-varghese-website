/**
 * AV OS — content migration extractor (Phase: content migration).
 *
 * Reads the canonical frontend content (`src/content/*`, via STATIC_CONTENT)
 * plus the existing CMS seed (`avos-data/site.json`, for record ids, design
 * tokens, and non-published records) and emits a **complete canonical target
 * document** for `content_store`.
 *
 * This is the single source of truth for the migration. It:
 *   - migrates the 5 collections Phase 3 found missing (experience, story,
 *     orange, page_content, page_seo) into faithful, structured CMS shapes;
 *   - normalizes the known divergences (§3): slugs, media paths (assets/),
 *     article body (paragraphs), navigation/CTA, and per-page SEO;
 *   - preserves the EXISTING CMS field names (admin compat) and only ADDS the
 *     missing frontend fields.
 *
 * It never rewrites copy — every value is copied verbatim from the frontend.
 * Run: npx tsx scripts/extract-migration.ts
 * Output: avos-data/migrated-content.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { STATIC_CONTENT } from '../src/content/static-snapshot';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

function loadSeed(): Record<string, unknown> {
  const p = resolve(repoRoot, 'avos-data', 'site.json');
  return JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
}

type R = Record<string, unknown>;
function asArr(v: unknown): R[] { return Array.isArray(v) ? (v as R[]) : []; }

/* ================================================================ */
/* canonical slug convention                                         */
/* ================================================================ */
// Article URLs are `<kind>-<title-slug>.html` (e.g. essay-technology-should-
// feel-human.html); projects use slugified titles. These match the live URLs.
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ================================================================ */
/* media canonicalisation: media/… → assets/… (files live in assets/) */
/* ================================================================ */
function canonicalMedia(src: string): string {
  return src.replace(/^media\//, 'assets/');
}

/* ================================================================ */
/* settings + nav (chrome)                                           */
/* ================================================================ */
function buildSettings(seed: R): R {
  const CHROME = STATIC_CONTENT.chrome.CHROME;
  const seedSettings = (seed.settings ?? {}) as R;
  return {
    siteName: CHROME.brandLabel,
    tagline: CHROME.footer.line,
    email: CHROME.footer.email,
    phone: CHROME.footer.phone,
    availability: CHROME.footer.availability,
    logo: CHROME.logoUrl,
    favicon: 'assets/logo.png',
    ogImage: 'assets/hero-portrait.webp',
    socials: CHROME.footer.social.map((s) => ({ id: s.icon, label: s.label, href: s.href })),
    // preserve existing (admin-owned) tokens + SEO defaults
    designTokens: seedSettings.designTokens ?? {},
    metaDescription: seedSettings.metaDescription ?? '',
    keywords: seedSettings.keywords ?? '',
    theme: seedSettings.theme ?? 'light',
  };
}

function buildNav(): R {
  const CHROME = STATIC_CONTENT.chrome.CHROME;
  return {
    primary: CHROME.primary.map((l, i) => ({ id: `n${i + 1}`, label: l.label, href: l.href, page: '' })),
    cta: CHROME.cta,
    footerColumns: CHROME.footer.columns.map((c, ci) => ({
      id: `fc${ci + 1}`,
      label: c.label,
      links: c.links.map((l, li) => ({ id: `fl${ci + 1}-${li + 1}`, label: l.label, href: l.href })),
    })),
    footer: { line: CHROME.footer.line, note: CHROME.footer.note, copyright: CHROME.footer.copyright },
  };
}

/* ================================================================ */
/* home sections (enrich existing records; keep admin fields)        */
/* ================================================================ */
function buildSections(seed: R): R[] {
  const home = STATIC_CONTENT.home;
  const seedSections = asArr(seed.sections);
  const byType = (t: string): R => seedSections.find((s) => s.type === t) ?? { id: t, type: t };

  const mk = (t: string, extra: R): R => {
    const base = byType(t);
    return { ...base, type: t, status: 'published', ...extra };
  };

  return [
    mk('hero', {
      num: undefined,
      nameLines: home.HERO.nameLines,
      portraitAlt: home.HERO.portrait.alt,
      portraitWidth: home.HERO.portrait.width,
      portraitHeight: home.HERO.portrait.height,
      actions: home.HERO.actions,
      availability: home.HERO.availability,
      // title/roles/lede/marquee/portrait/cta/cta2 already exist on the seed record
      title: home.HERO.seoLine,
      roles: home.HERO.roles,
      lede: home.HERO.lede,
      marquee: home.HERO.marquee,
      portrait: canonicalMedia(home.HERO.portrait.src),
    }),
    mk('clients', {
      num: home.CLIENTS.num,
      title: home.CLIENTS.title,
      lede: home.CLIENTS.lede,
      note: home.CLIENTS.note,
      kicker: home.CLIENTS.tag,
    }),
    mk('capabilities', {
      num: home.CAPABILITIES.num,
      title: home.CAPABILITIES.title.lead,
      title2: home.CAPABILITIES.title.em,
      kicker: home.CAPABILITIES.tag,
      items: home.CAPABILITIES.items.map((it) => ({
        num: it.num, name: it.title, body: it.description, feature: 'feature' in it ? it.feature : undefined,
      })),
    }),
    mk('work', {
      num: home.WORK.num,
      title: home.WORK.title,
      lede: home.WORK.lede,
      kicker: home.WORK.tag,
      projectIds: ['prj-1', 'prj-2', 'prj-3'],
      cases: home.WORK.cases.map((c) => ({ ...c, image: canonicalMedia(c.image) })),
    }),
    mk('thinking', {
      num: home.THINKING.num,
      lede: home.THINKING.lede,
      kicker: home.THINKING.tag,
      essayIds: ['art-1', 'art-2', 'art-3', 'art-4'],
      essays: home.THINKING.essays,
      media: { ...home.THINKING.media, src: canonicalMedia(home.THINKING.media.src) },
    }),
    mk('journey', {
      num: home.JOURNEY.num,
      title: home.JOURNEY.title,
      hint: home.JOURNEY.hint,
      coda: home.JOURNEY.coda,
      kicker: home.JOURNEY.tag,
      eras: home.JOURNEY.eras.map((e) => ({ index: e.index, name: e.name, note: e.note, future: e.future })),
    }),
    mk('ai', {
      num: home.AI_METHOD.num,
      title: home.AI_METHOD.title.lead,
      title2: home.AI_METHOD.title.em,
      kicker: home.AI_METHOD.tag,
      p1: home.AI_METHOD.paragraphs[0] ?? '',
      p2: home.AI_METHOD.paragraphs[1] ?? '',
      chips: home.AI_METHOD.chips,
      projects: home.AI_METHOD.projects,
      motto: home.AI_METHOD.motto,
      media: { ...home.AI_METHOD.media, src: canonicalMedia(home.AI_METHOD.media.src) },
    }),
    mk('focus', {
      num: home.FOCUS.num,
      title: home.FOCUS.title,
      lede: home.FOCUS.lede,
      kicker: home.FOCUS.tag,
      list: home.FOCUS.list.map((l) => ({ num: l.num, label: l.label })),
      openLabel: home.FOCUS.openLabel,
      openTo: home.FOCUS.open,
      note: home.FOCUS.note,
    }),
    mk('contact', {
      num: home.CONTACT.num,
      title: home.CONTACT.title,
      lede: home.CONTACT.lede,
      kicker: home.CONTACT.tag,
      micro: home.CONTACT.micro,
    }),
  ];
}

/* ================================================================ */
/* projects (normalize the 3 published; keep drafts/scheduled)       */
/* ================================================================ */
function buildProjects(seed: R): R[] {
  const frontend = STATIC_CONTENT.projects.PROJECTS;
  const seedProjects = asArr(seed.projects);
  // map canonical slug → frontend project
  const bySlug = new Map<string, (typeof frontend)[number]>();
  for (const p of frontend) bySlug.set(p.slug, p);

  return seedProjects.map((sp) => {
    const status = sp.status ?? 'published';
    if (status !== 'published') return sp; // drafts/scheduled: keep as-is
    const slug = typeof sp.slug === 'string' && sp.slug !== '' ? sp.slug : slugify(String(sp.title ?? ''));
    const fp = bySlug.get(slug);
    if (!fp) return sp; // published in CMS but not in frontend → keep (report as EXTRA)
    return {
      ...sp,
      slug,
      client: fp.client,
      industry: fp.category,
      title: fp.title,
      image: fp.image,
      imageAlt: fp.imageAlt,
      portfolioAlt: fp.portfolioAlt,
      role: fp.role,
      year: fp.year,
      summary: fp.summary,
      challenge: fp.problem,
      approach: fp.approach,
      outcome: fp.outcome,
      comingSoon: fp.status === 'coming-soon' ? true : (sp.comingSoon ?? false),
      comingSoonLabel: fp.status === 'coming-soon' ? 'Full case study coming soon' : (sp.comingSoonLabel ?? undefined),
    };
  });
}

/* ================================================================ */
/* articles (normalize the 6 published; keep draft/review)           */
/* ================================================================ */
function buildArticles(seed: R): R[] {
  const frontend = STATIC_CONTENT.articles.ARTICLES;
  const seedArticles = asArr(seed.articles);
  const bySlug = new Map<string, (typeof frontend)[number]>();
  for (const a of frontend) bySlug.set(a.slug, a);

  return seedArticles.map((sa) => {
    const status = sa.status ?? 'published';
    if (status !== 'published') return sa;
    const kind = sa.type === 'journal' ? 'journal' : 'essay';
    // canonical slug = <kind>-<existing seed slug>. The seed slug already uses
    // the live URL form (e.g. "ai-isnt-replacing-creativity"), so the frontend
    // slug is exactly `kind + '-' + seedSlug` — never re-derived from the title
    // (slugifying the title would corrupt apostrophes, e.g. "isn-t" vs "isnt").
    const canonical = `${kind}-${String(sa.slug ?? slugify(String(sa.title ?? '')))}`;
    const fa = bySlug.get(canonical);
    if (!fa) return { ...sa, slug: canonical, type: kind };
    return {
      ...sa,
      slug: canonical,
      type: kind,
      title: fa.title,
      excerpt: fa.excerpt,
      category: String(fa.tag).split(' · ')[0] ?? sa.category,
      readTime: (String(fa.tag).split(' · ')[1] ?? '') || sa.readTime,
      date: fa.date,
      image: fa.image,
      imageAlt: fa.imageAlt,
      paragraphs: fa.paragraphs,
      backLabel: fa.backLabel,
      backHref: fa.backHref,
      related: fa.related,
    };
  });
}

/* ================================================================ */
/* clients (normalize media)                                         */
/* ================================================================ */
function buildClients(seed: R): R[] {
  const logos = STATIC_CONTENT.home.CLIENTS.logos;
  const seedClients = asArr(seed.clients);
  const byName = new Map<string, (typeof logos)[number]>();
  for (const l of logos) byName.set(l.name, l);
  return seedClients.map((c) => {
    const logo = byName.get(String(c.name ?? ''));
    return logo ? { ...c, logo: `assets/logos/${logo.file}` } : c;
  });
}

/* ================================================================ */
/* experience (NEW key)                                              */
/* ================================================================ */
function buildExperience(): R[] {
  return STATIC_CONTENT.experience.EXPERIENCE_JOBS.map((j, i) => ({
    id: `exp-${i + 1}`,
    order: i + 1,
    status: 'published',
    date: j.date,
    role: j.role,
    roleSub: j.roleSub,
    company: j.company,
    location: j.location,
    image: j.image ? { ...j.image, src: canonicalMedia(j.image.src) } : undefined,
    summary: j.summary,
    disciplines: j.disciplines,
    responsibilities: j.responsibilities,
    moreResponsibilities: j.moreResponsibilities,
    lead: j.lead,
    last: j.last,
  }));
}

/* ================================================================ */
/* story (NEW key)                                                   */
/* ================================================================ */
function buildStory(): R {
  const s = STATIC_CONTENT.story;
  const media = (src: string | undefined) => (src ? canonicalMedia(src) : undefined);
  return {
    evolutionCards: s.EVOLUTION_CARDS.map((c) => ({
      act: c.act, world: c.world, image: media(c.image), alt: c.alt, meta: c.meta, category: c.category,
      note: c.note, title: c.title, serif: c.serif, desc: c.desc, stmt: c.stmt, system: c.system,
      duo: c.duo, mark: c.mark,
    })),
    prologue: {
      roles: s.PROLOGUE.roles, lede: s.PROLOGUE.lede, titleLines: s.PROLOGUE.titleLines,
    },
    identity: {
      statement: s.IDENTITY.statement, beats: s.IDENTITY.beats,
      question: s.IDENTITY.question,
      portrait: { ...s.IDENTITY.portrait, src: canonicalMedia(s.IDENTITY.portrait.src) },
      numbers: s.IDENTITY.numbers, facts: s.IDENTITY.facts, credo: s.IDENTITY.credo,
      zoomLabels: s.IDENTITY.zoomLabels, zoomImage: canonicalMedia(s.IDENTITY.zoomImage),
    },
    what: s.WHAT,
    now: s.NOW,
    curious: s.CURIOUS,
    credits: s.CREDITS,
    compassActs: s.COMPASS_ACTS,
  };
}

/* ================================================================ */
/* orange (NEW key)                                                  */
/* ================================================================ */
function buildOrange(): R {
  const o = STATIC_CONTENT.orange;
  return {
    summary: o.ORANGE_SUMMARY,
    projectStrip: o.ORANGE_PROJECT_STRIP,
    hotspots: o.ORANGE_HOTSPOTS,
    roleChain: o.ORANGE_ROLE_CHAIN,
    journey: o.ORANGE_JOURNEY.map((j) => ({ ...j, image: canonicalMedia(j.image), srcset: canonicalMedia(j.srcset) })),
    wallDefaultCopy: o.ORANGE_WALL_DEFAULT_COPY,
    archNodes: o.ORANGE_ARCH_NODES,
    purpose: o.ORANGE_PURPOSE,
    videoModes: o.ORANGE_VIDEO_MODES,
  };
}

/* ================================================================ */
/* page_content (NEW key) — consulting/recruiters/insights/journal/legal */
/* ================================================================ */
function buildPageContent(): R {
  const p = STATIC_CONTENT.pages;
  return {
    consulting: p.CONSULTING,
    recruiters: p.RECRUITERS,
    insights: p.INSIGHTS,
    journal: p.JOURNAL_PAGE,
    privacy: p.PRIVACY,
    privacyPage: p.PRIVACY_PAGE,
    terms: p.TERMS,
    termsPage: p.TERMS_PAGE,
  };
}

/* ================================================================ */
/* page_seo (NEW key) — per-page SEO, moved out of the TS modules     */
/* ================================================================ */
function buildPageSeo(): R {
  const { seo, projects, experience, orange, pages } = STATIC_CONTENT;
  return {
    home: seo.HOME_SEO,
    story: seo.STORY_SEO,
    portfolio: projects.PORTFOLIO_SEO,
    caseStudies: projects.CASE_STUDIES_SEO,
    experience: experience.EXPERIENCE_SEO,
    orange: orange.ORANGE_SEO,
    contact: pages.CONTACT_SEO,
    consulting: pages.CONSULTING_SEO,
    recruiters: pages.RECRUITERS_SEO,
    insights: pages.INSIGHTS_SEO,
    journal: pages.JOURNAL_SEO,
    search: pages.SEARCH_SEO,
    sitemap: pages.SITEMAP_SEO,
    privacy: pages.PRIVACY_SEO,
    terms: pages.TERMS_SEO,
    notFound: pages.NOT_FOUND_SEO,
  };
}

/* ================================================================ */
/* main                                                               */
/* ================================================================ */
function main(): void {
  const seed = loadSeed();
  const content: R = {
    settings: buildSettings(seed),
    nav: buildNav(),
    sections: buildSections(seed),
    projects: buildProjects(seed),
    articles: buildArticles(seed),
    clients: buildClients(seed),
    experience: buildExperience(),
    story: buildStory(),
    orange: buildOrange(),
    page_content: buildPageContent(),
    page_seo: buildPageSeo(),
  };

  const out = {
    meta: {
      schema: 'avos.migration/v1',
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: 'frontend/src/content/*.ts + avos-data/site.json',
      note: 'Canonical content_store target. Idempotent; apply with avos-php/scripts/migrate-content.php',
    },
    content,
  };

  const outPath = resolve(repoRoot, 'avos-data', 'migrated-content.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log('keys:', Object.keys(content).join(', '));
  console.log('counts:', JSON.stringify({
    sections: (content.sections as R[]).length,
    projects: (content.projects as R[]).length,
    articles: (content.articles as R[]).length,
    clients: (content.clients as R[]).length,
    experience: (content.experience as R[]).length,
    page_seo: Object.keys(content.page_seo as R).length,
  }));
}

main();
