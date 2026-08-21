/**
 * AV OS — content adapter (content-migration phase).
 *
 * Maps the runtime `GET /api/v1/content` payload into per-collection overrides
 * for the `ContentDocument` the React components render from.
 *
 * After the content migration, the CMS holds the canonical content for every
 * collection (settings/navigation/sections/projects/articles/clients +
 * experience/story/orange/page_content/page_seo). This adapter maps those
 * canonical records back to the frontend's denormalized module shapes,
 * losslessly — every value is reproduced verbatim; only field names are
 * translated (challenge→problem, industry→category, type→kind, kicker→tag,
 * id→icon, …) and the few build-time constants / derived values are supplied
 * (href, index, tag, imageWidth/Height, mailto:/tel:).
 *
 * Functions (buildHead, comingSoonSeo, articleSeo, withBaseSrcset),
 * SOCIAL_ICONS, SITE_ORIGIN and the derived index exports stay hardcoded —
 * they are renderers/config, not content, and the loader's merge keeps the
 * static values for anything this adapter does not produce.
 */
import type { ApiContentPayload } from './schema';
import type { ContentDocument } from './static-snapshot';
import type { DeepPartial } from './types';

type R = Record<string, unknown>;
type PartialContent = DeepPartial<ContentDocument>;

function str(v: unknown): string { return typeof v === 'string' ? v : ''; }
function arr(v: unknown): R[] { return Array.isArray(v) ? v.filter((x): x is R => typeof x === 'object' && x !== null) : []; }
function strArr(v: unknown): string[] { return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []; }
function pad2(n: number): string { return String(n).padStart(2, '0'); }

/* ------------------------------------------------------------------ */
/* chrome ← settings + navigation                                       */
/* ------------------------------------------------------------------ */
function adaptChrome(settings: R, navigation: R): PartialContent['chrome'] {
  const primary = arr(navigation.primary).map((n) => ({ label: str(n.label), href: str(n.href) }));
  const footer = (navigation.footer ?? {}) as R;
  return {
    CHROME: {
      brandLabel: str(settings.siteName),
      brandHref: undefined, // build-time chrome
      logoUrl: str(settings.logo),
      primary,
      mobile: primary.map((p, i) => ({ ...p, index: pad2(i + 1) })),
      cta: (navigation.cta ?? {}) as { label: string; href: string },
      footer: {
        line: str(settings.tagline),
        email: str(settings.email),
        emailHref: str(settings.email) ? `mailto:${settings.email}` : '',
        phone: str(settings.phone),
        phoneHref: str(settings.phone) ? `tel:${str(settings.phone).replace(/[^+\d]/g, '')}` : '',
        availability: str(settings.availability),
        columns: arr(navigation.footerColumns).map((c) => ({
          label: str(c.label),
          links: arr(c.links).map((l) => ({ label: str(l.label), href: str(l.href) })),
        })),
        social: arr(settings.socials).map((s) => ({
          label: str(s.label),
          href: str(s.href),
          icon: str(s.id) as 'linkedin' | 'instagram' | 'whatsapp' | 'youtube' | 'behance',
        })),
        copyright: str(footer.copyright),
        note: str(footer.note),
      },
    },
  } as PartialContent['chrome'];
}

/* ------------------------------------------------------------------ */
/* projects ← projects + page_seo                                       */
/* ------------------------------------------------------------------ */
function adaptProjects(projects: R[], pageSeo: R): PartialContent['projects'] {
  const PROJECTS = projects.map((p, i) => ({
    slug: str(p.slug),
    client: str(p.client),
    category: str(p.industry),
    title: str(p.title),
    href: str(p.caseStudyPath) || `case-study-${str(p.slug)}.html`,
    image: str(p.image),
    imageAlt: str(p.imageAlt),
    portfolioAlt: str(p.portfolioAlt) || str(p.imageAlt),
    role: str(p.role),
    year: str(p.year),
    summary: str(p.summary),
    problem: str(p.challenge),
    approach: str(p.approach),
    outcome: str(p.outcome),
    status: (p.comingSoon ? 'coming-soon' : 'published') as 'published' | 'coming-soon',
    index: pad2(i + 1),
  }));
  return {
    PROJECTS,
    PORTFOLIO_SEO: (pageSeo.portfolio ?? {}) as never,
    CASE_STUDIES_SEO: (pageSeo.caseStudies ?? {}) as never,
  } as PartialContent['projects'];
}

/* ------------------------------------------------------------------ */
/* articles ← articles                                                  */
/* ------------------------------------------------------------------ */
function adaptArticles(articles: R[]): PartialContent['articles'] {
  const ARTICLES = articles.map((a) => ({
    slug: str(a.slug),
    kind: (str(a.type) === 'journal' ? 'journal' : 'essay') as 'essay' | 'journal',
    title: str(a.title),
    excerpt: str(a.excerpt),
    tag: str(a.readTime) ? `${str(a.category)} · ${str(a.readTime)}` : str(a.category),
    image: str(a.image),
    imageAlt: str(a.imageAlt),
    imageWidth: 1376,
    imageHeight: 768,
    paragraphs: strArr(a.paragraphs),
    date: str(a.date),
    backLabel: str(a.backLabel),
    backHref: str(a.backHref),
    related: (a.related ?? undefined) as never,
  }));
  // `seo` is derived by articleSeo() at render time (not CMS content) — left out.
  return { ARTICLES } as unknown as PartialContent['articles'];
}

/* ------------------------------------------------------------------ */
/* home ← sections + clients                                            */
/* ------------------------------------------------------------------ */
function adaptHome(sections: R[], clients: R[]): PartialContent['home'] {
  const byType = (t: string): R => sections.find((s) => str(s.type) === t) ?? {};
  const hero = byType('hero');
  const clientsSec = byType('clients');
  const cap = byType('capabilities');
  const work = byType('work');
  const thinking = byType('thinking');
  const journey = byType('journey');
  const ai = byType('ai');
  const focus = byType('focus');
  const contact = byType('contact');

  const logos = clients.map((c) => ({ name: str(c.name), file: str(c.logo).split('/').pop() ?? '' }));

  return {
    HERO: {
      seoLine: str(hero.title),
      nameLines: strArr(hero.nameLines) as never,
      portrait: str(hero.portrait) ? { src: str(hero.portrait), alt: str(hero.portraitAlt), width: Number(hero.portraitWidth ?? 0), height: Number(hero.portraitHeight ?? 0) } : undefined,
      tagline: str(hero.title),
      roles: strArr(hero.roles),
      actions: (hero.actions ?? {}) as never,
      availability: str(hero.availability),
      lede: str(hero.lede),
      marquee: strArr(hero.marquee),
    } as never,
    CLIENTS: {
      num: str(clientsSec.num),
      tag: str(clientsSec.kicker),
      title: str(clientsSec.title),
      lede: str(clientsSec.lede),
      logos: logos as never,
      note: str(clientsSec.note),
    } as never,
    CAPABILITIES: {
      num: str(cap.num),
      tag: str(cap.kicker),
      title: { lead: str(cap.title), em: str(cap.title2) },
      items: arr(cap.items).map((it) => ({
        num: str(it.num),
        title: str(it.name),
        description: str(it.body),
        feature: it.feature ? true : undefined,
      })) as never,
    } as never,
    WORK: {
      num: str(work.num),
      tag: str(work.kicker),
      title: str(work.title),
      lede: str(work.lede),
      cases: arr(work.cases) as never,
    } as never,
    THINKING: {
      num: str(thinking.num),
      tag: str(thinking.kicker),
      lede: str(thinking.lede),
      essays: arr(thinking.essays) as never,
      media: (thinking.media ?? {}) as never,
    } as never,
    JOURNEY: {
      num: str(journey.num),
      tag: str(journey.kicker),
      title: str(journey.title),
      hint: str(journey.hint),
      eras: arr(journey.eras) as never,
      coda: str(journey.coda),
    } as never,
    AI_METHOD: {
      num: str(ai.num),
      tag: str(ai.kicker),
      title: { lead: str(ai.title), em: str(ai.title2) },
      paragraphs: [str(ai.p1), str(ai.p2)].filter((s) => s !== '') as never,
      chips: strArr(ai.chips),
      projects: arr(ai.projects) as never,
      motto: str(ai.motto),
      media: (ai.media ?? {}) as never,
    } as never,
    FOCUS: {
      num: str(focus.num),
      tag: str(focus.kicker),
      title: str(focus.title),
      lede: str(focus.lede),
      list: arr(focus.list).map((l) => ({ num: str(l.num), label: str(l.label) })) as never,
      openLabel: str(focus.openLabel),
      open: strArr(focus.openTo),
      note: str(focus.note),
    } as never,
    CONTACT: {
      num: str(contact.num),
      tag: str(contact.kicker),
      title: str(contact.title),
      lede: str(contact.lede),
      micro: arr(contact.micro).map((m) => ({ label: str(m.label), value: str(m.value), href: str(m.href) || undefined })) as never,
    } as never,
  } as PartialContent['home'];
}

/* ------------------------------------------------------------------ */
/* experience ← experience + page_seo                                   */
/* ------------------------------------------------------------------ */
function adaptExperience(experience: R[], pageSeo: R): PartialContent['experience'] {
  const EXPERIENCE_JOBS = experience.map((j) => ({
    date: str(j.date),
    role: str(j.role),
    roleSub: str(j.roleSub) || undefined,
    company: str(j.company),
    location: str(j.location) || undefined,
    image: (j.image ?? undefined) as never,
    summary: str(j.summary),
    disciplines: strArr(j.disciplines),
    responsibilities: strArr(j.responsibilities),
    moreResponsibilities: strArr(j.moreResponsibilities),
    lead: (j.lead as boolean | undefined),
    last: (j.last as boolean | undefined),
  }));
  return { EXPERIENCE_JOBS, EXPERIENCE_SEO: (pageSeo.experience ?? {}) as never } as PartialContent['experience'];
}

/* ------------------------------------------------------------------ */
/* story ← story                                                        */
/* ------------------------------------------------------------------ */
function adaptStory(story: R): PartialContent['story'] {
  return {
    EVOLUTION_CARDS: (story.evolutionCards ?? []) as never,
    PROLOGUE: (story.prologue ?? {}) as never,
    IDENTITY: (story.identity ?? {}) as never,
    WHAT: (story.what ?? {}) as never,
    NOW: (story.now ?? {}) as never,
    CURIOUS: (story.curious ?? {}) as never,
    CREDITS: (story.credits ?? {}) as never,
    COMPASS_ACTS: (story.compassActs ?? []) as never,
  } as PartialContent['story'];
}

/* ------------------------------------------------------------------ */
/* orange ← orange + page_seo                                           */
/* ------------------------------------------------------------------ */
function adaptOrange(orange: R, pageSeo: R): PartialContent['orange'] {
  return {
    ORANGE_SEO: (pageSeo.orange ?? {}) as never,
    ORANGE_SUMMARY: (orange.summary ?? {}) as never,
    ORANGE_PROJECT_STRIP: (orange.projectStrip ?? []) as never,
    ORANGE_HOTSPOTS: (orange.hotspots ?? []) as never,
    ORANGE_ROLE_CHAIN: (orange.roleChain ?? []) as never,
    ORANGE_JOURNEY: (orange.journey ?? []) as never,
    ORANGE_WALL_DEFAULT_COPY: str(orange.wallDefaultCopy),
    ORANGE_ARCH_NODES: (orange.archNodes ?? []) as never,
    ORANGE_PURPOSE: (orange.purpose ?? []) as never,
    ORANGE_VIDEO_MODES: (orange.videoModes ?? []) as never,
  } as PartialContent['orange'];
}

/* ------------------------------------------------------------------ */
/* pages ← page_content + page_seo                                      */
/* ------------------------------------------------------------------ */
function adaptPages(pageContent: R, pageSeo: R): PartialContent['pages'] {
  return {
    CONSULTING: (pageContent.consulting ?? {}) as never,
    RECRUITERS: (pageContent.recruiters ?? {}) as never,
    INSIGHTS: (pageContent.insights ?? {}) as never,
    JOURNAL_PAGE: (pageContent.journal ?? {}) as never,
    PRIVACY: (pageContent.privacy ?? []) as never,
    PRIVACY_PAGE: (pageContent.privacyPage ?? {}) as never,
    TERMS: (pageContent.terms ?? []) as never,
    TERMS_PAGE: (pageContent.termsPage ?? {}) as never,
    CONTACT_SEO: (pageSeo.contact ?? {}) as never,
    CONSULTING_SEO: (pageSeo.consulting ?? {}) as never,
    RECRUITERS_SEO: (pageSeo.recruiters ?? {}) as never,
    INSIGHTS_SEO: (pageSeo.insights ?? {}) as never,
    JOURNAL_SEO: (pageSeo.journal ?? {}) as never,
    SEARCH_SEO: (pageSeo.search ?? {}) as never,
    SITEMAP_SEO: (pageSeo.sitemap ?? {}) as never,
    PRIVACY_SEO: (pageSeo.privacy ?? {}) as never,
    TERMS_SEO: (pageSeo.terms ?? {}) as never,
    NOT_FOUND_SEO: (pageSeo.notFound ?? {}) as never,
  } as PartialContent['pages'];
}

/* ------------------------------------------------------------------ */
/* seo ← page_seo                                                       */
/* ------------------------------------------------------------------ */
function adaptSeo(pageSeo: R): PartialContent['seo'] {
  return {
    HOME_SEO: (pageSeo.home ?? {}) as never,
    STORY_SEO: (pageSeo.story ?? {}) as never,
  } as PartialContent['seo'];
}

/* ------------------------------------------------------------------ */
/* public entry                                                         */
/* ------------------------------------------------------------------ */
export interface AdaptationReport {
  unmapped: string[];
  adapted: string[];
}
export interface AdaptedContent {
  content: PartialContent;
  report: AdaptationReport;
}

export function adaptContentPayload(api: ApiContentPayload): AdaptedContent {
  const content: PartialContent = {};
  const adapted: string[] = [];

  const settings = (api.settings ?? {}) as R;
  const navigation = (api.navigation ?? {}) as R;
  const pageSeo = (api.page_seo ?? {}) as R;

  content.chrome = adaptChrome(settings, navigation);
  adapted.push('chrome');

  if (Array.isArray(api.projects)) {
    content.projects = adaptProjects(api.projects as R[], pageSeo);
    adapted.push('projects');
  }
  if (Array.isArray(api.articles)) {
    content.articles = adaptArticles(api.articles as R[]);
    adapted.push('articles');
  }
  if (Array.isArray(api.sections)) {
    content.home = adaptHome(api.sections as R[], Array.isArray(api.clients) ? (api.clients as R[]) : []);
    adapted.push('home');
  }
  if (Array.isArray(api.clients)) adapted.push('clients');
  if (Array.isArray(api.experience)) {
    content.experience = adaptExperience(api.experience as R[], pageSeo);
    adapted.push('experience');
  }
  if (typeof api.story === 'object' && api.story !== null) {
    content.story = adaptStory(api.story as R);
    adapted.push('story');
  }
  if (typeof api.orange === 'object' && api.orange !== null) {
    content.orange = adaptOrange(api.orange as R, pageSeo);
    adapted.push('orange');
  }
  if (typeof api.page_content === 'object' && api.page_content !== null) {
    content.pages = adaptPages(api.page_content as R, pageSeo);
    adapted.push('pages');
  }
  if (typeof api.page_seo === 'object' && api.page_seo !== null) {
    content.seo = adaptSeo(pageSeo);
    adapted.push('seo');
  }

  return { content, report: { adapted, unmapped: [] } };
}
