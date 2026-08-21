# PHASE 4 — Component Dependency Inventory (static content → runtime CMS)

Complete inventory of every consumer of `frontend/src/content/*.ts`, and its
migration disposition. Generated from the Phase 4 grep + per-file read.

Legend: **RUNTIME** = migrate to `useContent()` (CMS-managed value) ·
**BUILD-TIME** = stays on static (prerender/SEO-head/fallback path) ·
**CODE** = function/type/SVG (renderer logic — not content, stays) ·
**N/A** = no change.

## A. Provider mounting (single choke point)

| File | Change |
|---|---|
| `lib/hydrate.tsx` | wrap `<Component/>` in `<CMSContentProvider>` (client runtime path) |
| `entry-server.tsx` | wrap `<entry.Component/>` in `<CMSContentProvider>` (build path — same tree) |

## B. Content-value consumers → RUNTIME (`useContent()`)

| File | Static export(s) | CMS runtime field (`content.*`) |
|---|---|---|
| `components/chrome/Footer.tsx` | `CHROME` | `chrome.CHROME` |
| `components/chrome/Nav.tsx` | `CHROME` | `chrome.CHROME` |
| `sections/home/AiMethod.tsx` | `AI_METHOD` | `home.AI_METHOD` |
| `sections/home/Capabilities.tsx` | `CAPABILITIES` | `home.CAPABILITIES` |
| `sections/home/Clients.tsx` | `CLIENTS` | `home.CLIENTS` |
| `sections/home/Contact.tsx` | `CONTACT`, `CHROME` | `home.CONTACT`, `chrome.CHROME` |
| `sections/home/Focus.tsx` | `FOCUS` | `home.FOCUS` |
| `sections/home/Hero.tsx` | `HERO` | `home.HERO` |
| `sections/home/Journey.tsx` | `JOURNEY` | `home.JOURNEY` |
| `sections/home/Thinking.tsx` | `THINKING` | `home.THINKING` |
| `sections/home/Work.tsx` | `WORK` | `home.WORK` |
| `sections/orange/ActionPanels.tsx` | `ORANGE_VIDEO_MODES`, `ORANGE_WALL_DEFAULT_COPY` | `orange.*` |
| `sections/orange/Hero.tsx` | `ORANGE_HOTSPOTS` | `orange.ORANGE_HOTSPOTS` |
| `sections/orange/interactive.tsx` | `ORANGE_ROLE_CHAIN`, `ORANGE_JOURNEY`, `ORANGE_ARCH_NODES`, `ORANGE_PURPOSE`, `ORANGE_VIDEO_MODES` | `orange.*` (per-component) |
| `sections/story/Closing.tsx` | `WHAT`, `NOW`, `CURIOUS`, `CREDITS` | `story.*` |
| `sections/story/Compass.tsx` | `COMPASS_ACTS` | `story.COMPASS_ACTS` |
| `sections/story/Evolution.tsx` | `EVOLUTION_CARDS` | `story.EVOLUTION_CARDS` |
| `sections/story/Identity.tsx` | `IDENTITY` | `story.IDENTITY` |
| `sections/story/Prologue.tsx` | `PROLOGUE` | `story.PROLOGUE` |
| `pages/case-studies/CaseStudiesPage.tsx` | `PROJECTS` | `projects.PROJECTS` |
| `pages/consulting/ConsultingPage.tsx` | `CONSULTING` | `pages.CONSULTING` |
| `pages/contact/ContactPage.tsx` | `CHROME`, `CONTACT` | `chrome.CHROME`, `home.CONTACT` |
| `pages/experience/ExperiencePage.tsx` | `EXPERIENCE_JOBS` | `experience.EXPERIENCE_JOBS` |
| `pages/insights/InsightsPage.tsx` | `INSIGHTS`, `ESSAY_INDEX` | `pages.INSIGHTS`, `articles.ESSAY_INDEX` (runtime-derived) |
| `pages/journal/JournalPage.tsx` | `JOURNAL_PAGE`, `JOURNAL_INDEX` | `pages.JOURNAL_PAGE`, `articles.JOURNAL_INDEX` (runtime-derived) |
| `pages/orange/OrangePage.tsx` | `ORANGE_SUMMARY`, `ORANGE_PROJECT_STRIP` | `orange.*` |
| `pages/portfolio/PortfolioPage.tsx` | `PROJECTS`, `CAPABILITIES`, `CLIENTS` | `projects.PROJECTS`, `home.CAPABILITIES`, `home.CLIENTS` |
| `pages/recruiters/RecruitersPage.tsx` | `RECRUITERS` | `pages.RECRUITERS` |

## C. Slug/key-based lookups (component signature change)

| File | Before | After |
|---|---|---|
| `pages/case-study/ComingSoonCase.tsx` | `{ project }` prop | `{ slug }` → `useContent()` lookup |
| `pages/article/ArticlePage.tsx` | `{ article }` prop | `{ slug }` → `useContent()` lookup |
| `pages/legal/LegalPage.tsx` | `{ num, title, lede, sections }` props | `{ kind: 'privacy'\|'terms' }` → `useContent()` lookup |

## D. Entry files (module-level → render runtime-aware component)

| File | Change |
|---|---|
| `entry-article.tsx` | pass `slug={pageId}` to `<ArticlePage>` |
| `entry-case-army.tsx` | pass `slug="immersive-solutions-for-the-indian-army"` |
| `entry-case-bpcl.tsx` | pass `slug="intuitive-experiences-for-industrial-environments"` |
| `entry-privacy-policy.tsx` | `<LegalPage kind="privacy" activeHref="privacy-policy.html"/>` |
| `entry-terms.tsx` | `<LegalPage kind="terms" activeHref="terms.html"/>` |

## E. Build-time (prerender/SEO-head) → stays static (the "published snapshot" path)

| File | Keeps static | Why |
|---|---|---|
| `pages/index.tsx` | SEO exports (`HOME_SEO`…`NOT_FOUND_SEO`), `PROJECTS`, `ARTICLES_BY_SLUG`, `comingSoonSeo` | builds the per-route SEO `<head>` + prerendered body at build time |
| `entry-server.tsx` | `buildHead` (function) | head renderer |

`pages/index.tsx` route components change to slug/kind-based signatures (same
as §C), but its SEO/`seo:` values stay static — SEO meta is baked into the
prerendered HTML (correct for crawlability; runtime SEO-head rewriting is a
later builder concern).

## F. Code / types (NOT content) → stays

| File | Import | Class |
|---|---|---|
| `components/chrome/SocialIcon.tsx` | `SOCIAL_ICONS` (SVG paths) | component definition |
| `pages/case-study/ComingSoonCase.tsx` | `type Project` | type |
| `pages/experience/ExperiencePage.tsx` | `type ExperienceJob` | type |
| `sections/orange/interactive.tsx` | `withBaseSrcset` | renderer function |
| `pages/index.tsx` | `comingSoonSeo` | renderer function |
| `entry-server.tsx` | `buildHead` | renderer function |
| `pages/index.tsx` | `SeoData` (type), `PreloadSpec` | type |

## G. Runtime-derived indexes (new, in the adapter)

`ESSAYS`, `JOURNAL`, `ESSAY_INDEX`, `JOURNAL_INDEX`, `ARTICLES_BY_SLUG` are
computed in `adapt.ts` from the runtime `ARTICLES` (they are views of CMS
content, and two pages consume them at runtime). This removes them from the
"DERIVED build-time" classification.

## H. Remaining DERIVED (build-time only, documented)

- per-article `seo` — built by `articleSeo()` at prerender; not consumed at
  runtime (SEO head is prerendered). Because the runtime-derived index views
  (`ARTICLES`, `ARTICLES_BY_SLUG`, `ESSAYS`, `JOURNAL`) now reproduce the
  articles at runtime, this single logical field is counted as **18 leaf paths**
  (6 articles × 3 views) by the leaf-level parity checker.
- `chrome.CHROME.brandHref` ×1 — build-time chrome constant (`index.html`).

→ after migration: **DERIVED = 19 leaf paths** (18 per-article `seo` + 1
`brandHref`); all are build-time/derived, not CMS content.
