# PHASE 3 — Content Mapping (static → CMS → API → React)

> The executable version of this document is `frontend/src/content/adapt.ts`;
> the parity checker (`frontend/scripts/parity-check.ts`) reads the same
> mapping and reports every divergence. This document records **every**
> frontend content source and its CMS equivalent — including what is **not**
> present in the CMS (reported, never silently dropped).

## 0 · How to read this

`frontend/src/content/*.ts` (static, build-time) is the shape the React
components render. `content_store` (CMS, runtime) is the authoritative source
Phase 2 established. The two shapes are **not identical**: the CMS stores a
*normalized* model (sections reference `clientIds`/`projectIds`/`essayIds`;
projects use `challenge`/`industry`; articles use `type`/`category`/`body`),
while the frontend renders a *denormalized* literal model.

`GET /api/v1/content` returns the normalized CMS shape (published-only). The
adapter (`adapt.ts`) maps it into the frontend shape. Where the CMS has no
equivalent, the field is left to the static fallback and recorded here as
**UNMAPPED / MISSING** — not invented.

**Classification recap (Phase 2):** A = CMS-managed · C = static technical
config · D = component definition · F = stays hardcoded. Only **A** content
flows through this mapping; C/D/F (component code, design-token *keys*, the
SEO/head *template structure*, `SOCIAL_ICONS` SVG paths, `buildHead`,
`withBaseSrcset`, `comingSoonSeo`, `articleSeo`) remain hardcoded by design.

---

## 1 · chrome.ts → settings + navigation

| Static field | CMS field (content_store) | API field | Consumer | Status |
|---|---|---|---|---|
| `CHROME.brandLabel` | `settings.siteName` | `settings.siteName` | Nav/Footer | **MAPS** (values match) |
| `CHROME.brandHref` (`index.html`) | — | — | Nav | **C** — build-time chrome |
| `CHROME.logoUrl` | `settings.logo` (`media/logo.png`) | `settings.logo` | Nav/Footer | **DIFFERENT** (`assets/logo.png` vs `media/logo.png`) |
| `CHROME.primary[]` | `nav.primary[]` | `navigation.primary[]` | Nav | **MAPS** (label/href) — but CMS has 5 items (incl. CTA) vs static 4 |
| `CHROME.mobile[]` (indexed) | — (derived) | — | Nav | **C** — derived (index `01…`) |
| `CHROME.cta` | `nav.primary[]` (item with `cta:true`) | `navigation.primary[]` | Nav | **DIFFERENT** — CMS models CTA as a nav item |
| `CHROME.footer.line` | `settings.tagline` | `settings.tagline` | Footer | **MAPS** |
| `CHROME.footer.email/emailHref` | `settings.email` | `settings.email` | Footer | **MAPS** (href derived `mailto:`) |
| `CHROME.footer.phone/phoneHref` | `settings.phone` | `settings.phone` | Footer | **MAPS** (href derived `tel:`) |
| `CHROME.footer.availability` | `settings.availability` | `settings.availability` | Footer | **MAPS** |
| `CHROME.footer.columns[]` | `nav.footerColumns[]` | `navigation.footerColumns[]` | Footer | **DIFFERENT** — CMS has a 4th "Social" column; index shift |
| `CHROME.footer.social[]` | `settings.socials[]` | `settings.socials[]` | Footer/SocialIcon | **DIFFERENT** — CMS `id` is `s1…s5`, not the icon name; icon must map id→name |
| `CHROME.footer.copyright` | `nav.copyright` | `navigation.copyright` | Footer | **MAPS** |
| `CHROME.footer.note` (`Built on AV OS…`) | — | — | Footer | **C** — build-time chrome |
| `SOCIAL_ICONS` (SVG paths) | — | — | SocialIcon | **F** — component definition (stays hardcoded) |

---

## 2 · projects.ts → projects

| Static field | CMS field | Status |
|---|---|---|
| `PROJECTS[].slug` | `projects[].slug` | **MISSING** for 2 of 3 published projects (prj-2/prj-3 have `slug:null`) |
| `PROJECTS[].client` | `projects[].client` | **MAPS** |
| `PROJECTS[].category` | `projects[].industry` | **MAPS** (field renamed) |
| `PROJECTS[].title` | `projects[].title` | **MAPS** |
| `PROJECTS[].href` | — | **MISSING** (not stored; frontend derives from slug/status) |
| `PROJECTS[].image` | `projects[].image` | **DIFFERENT** (`assets/…` vs `media/…`) |
| `PROJECTS[].imageAlt` | `projects[].imageAlt` | **MAPS** |
| `PROJECTS[].portfolioAlt` | `projects[].imageAlt` | **DIFFERENT** (static uses distinct portfolio alt; CMS has one alt) |
| `PROJECTS[].role` | `projects[].role` | **MAPS** |
| `PROJECTS[].year` | `projects[].year` | **MAPS** |
| `PROJECTS[].summary` | `projects[].summary` | **MAPS** |
| `PROJECTS[].problem` | `projects[].challenge` | **MAPS** (field renamed) |
| `PROJECTS[].approach` | `projects[].approach` | **MAPS** |
| `PROJECTS[].outcome` | `projects[].outcome` | **MAPS** |
| `PROJECTS[].status` | `projects[].status` | **MAPS** (`published`→`published`; others→`coming-soon`) |
| `PROJECTS[].index` | — (derived) | **C** — derived order `01…` |
| `PORTFOLIO_SEO` / `CASE_STUDIES_SEO` | `projects[].seo` (per-project only) | **UNMAPPED** — listing-page SEO not in CMS |
| `comingSoonSeo()` | — | **F** — function (stays hardcoded) |

**Divergence note:** CMS seed has **6 projects** (3 published + 2 draft + 1
scheduled); the React frontend ships **3** (1 published + 2 "coming-soon").
Published-only filtering returns the 3 published, but their slugs/hrefs/alt
text differ from the static snapshot.

---

## 3 · articles.ts → articles

| Static field | CMS field | Status |
|---|---|---|
| `ARTICLES[].slug` | `articles[].slug` | **DIFFERENT** — CMS `technology-should-feel-human` vs static `essay-technology-should-feel-human` (missing `essay-`/`journal-` prefix) |
| `ARTICLES[].kind` | `articles[].type` (`essay`/`journal`) | **MAPS** (field renamed) |
| `ARTICLES[].title` | `articles[].title` | **MAPS** |
| `ARTICLES[].excerpt` | `articles[].excerpt` | **MAPS** |
| `ARTICLES[].tag` (`Design · 6 min`) | `articles[].category` (`Design`) + `readTime` | **DIFFERENT** — CMS stores them separately; static combines |
| `ARTICLES[].image` | `articles[].image` | **DIFFERENT** (`assets/…` vs `media/…`) |
| `ARTICLES[].imageAlt` | — | **MISSING** (not in CMS article records) |
| `ARTICLES[].imageWidth/Height` (1376×768) | — | **C** — build-time dimensions |
| `ARTICLES[].paragraphs[]` | `articles[].body` (single string) | **DIFFERENT** — CMS is one string; static is a paragraph array (split on blank lines) |
| `ARTICLES[].date` | `articles[].date` | **MAPS** |
| `ARTICLES[].backLabel/backHref` | — | **MISSING** (not in CMS) |
| `ARTICLES[].related` | — | **MISSING** (not in CMS) |
| `ARTICLES[].seo` | `articles[].seo` | **PARTIAL** — CMS has `{title,desc,keywords}`; static builds full SEO + JSON-LD |
| `ESSAYS` / `JOURNAL` / `ARTICLES_BY_SLUG` / `ESSAY_INDEX` / `JOURNAL_INDEX` | — (derived) | **C** — derived at module load (see limitation below) |

**Divergence note:** CMS seed has **8 articles** (6 published + 1 draft + 1
review); static ships **6**. Published filtering returns the 6, but slug/kind
prefixes and body→paragraphs shapes differ.

---

## 4 · home.ts → sections (+ clients)

Home is the largest mapping. The CMS stores each homepage section as a
`content_store.sections[]` record referencing other collections by id.

| Static export | CMS section (type) | Summary |
|---|---|---|
| `HERO` | `sections[type=hero]` | title/roles/lede map; `nameLines`, `portrait`, `actions`, `availability`, `marquee` **MISSING** in the section record (some exist as `portrait`/`cta`/`cta2`/`marquee` with different shapes) |
| `CLIENTS` | `sections[type=clients]` + `clients[]` | title/lede/note map; `logos[]` resolves via `clientIds` → `clients[]` (`name`→`name`, `logo`→`file`); `num`/`tag` **MISSING** |
| `CAPABILITIES` | `sections[type=capabilities]` | title/`title2`→em, `items[]` map (`name`→`title`, `body`→`description`); `num`/`tag` and per-item `feature` flag **MISSING** |
| `WORK` | `sections[type=work]` + `projects[]` | title/lede map; `cases[]` resolves via `projectIds`; `num`/`tag` **MISSING** |
| `THINKING` | `sections[type=thinking]` + `articles[]` | lede maps; `essays[]` resolves via `essayIds`; `num`/`tag`/`media` **MISSING** |
| `JOURNEY` | `sections[type=journey]` | title + `eras[]` map; `hint`/`coda`/`num`/`tag` **MISSING** |
| `AI_METHOD` | `sections[type=ai]` | title/`title2`, `p1`/`p2`→paragraphs map; `chips`/`projects`/`motto`/`media`/`num`/`tag` **MISSING** |
| `FOCUS` | `sections[type=focus]` | title/lede/`list`/`openTo`/`note` map; per-item `num` **MISSING** (static numbers items) |
| `CONTACT` | `sections[type=contact]` | title/lede/`micro[]` map; `num`/`tag` **MISSING** |

**`clients[]` collection:** `name`→`name`, `logo`→`file` map cleanly (16 of 16);
`monogram`/`industry` are **EXTRA** (unused by the frontend today).

---

## 5 · Collections with **no CMS equivalent** (UNMAPPED)

These frontend sources have **no corresponding `content_store` content**, so
the adapter leaves them to the static fallback and the parity checker reports
them as UNMAPPED. This is the largest parity gap and the primary blocker to a
runtime-only cutover:

| Static module | Contents | CMS equivalent |
|---|---|---|
| `experience.ts` | `EXPERIENCE_JOBS` (6 roles), `EXPERIENCE_SEO` | **none** — `content_store` has no experience records |
| `story.ts` | `EVOLUTION_CARDS`, `PROLOGUE`, `IDENTITY`, `WHAT`, `NOW`, `CURIOUS`, `CREDITS`, `COMPASS_ACTS` | **none** — the Story/Evolution narrative is not in `content_store` |
| `orange.ts` | full Orange EBC case study (`ORANGE_*`, hotspots, journey, architecture, purpose, video modes) | **none** — project `prj-1` has a summary row but not the long-form case study |
| `pages.ts` | `CONSULTING`, `RECRUITERS`, `INSIGHTS`, `JOURNAL_PAGE`, `PRIVACY`/`PRIVACY_PAGE`, `TERMS`/`TERMS_PAGE` | **partial** — `content_store.pages[]` has 12 page records, but their `blocks[]` do not contain the prose the frontend renders |
| `seo.ts` | `HOME_SEO`, `STORY_SEO`, `SITE_ORIGIN`, `buildHead()` | **none** — `content_store.seo[]` is SEO *audit records*, not per-page SEO metadata |

---

## 6 · Adapter limitations (documented, not hidden)

1. **Derived exports remain static.** `ARTICLES_BY_SLUG`, `ESSAY_INDEX`,
   `JOURNAL_INDEX`, and the `pages/index.tsx` route registry are computed from
   the static modules at load time. Overriding the raw `ARTICLES`/`PROJECTS`
   collections does not yet propagate to these derived values. Making the
   content modules themselves store-backed is the gated next step (Phase 4+,
   after runtime parity is proven).
2. **`href`/clean URLs** are frontend-derived (not CMS fields); the CMS stores
   `slug`/`caseStudyPath`/`legacyPaths` instead.
3. **Media path prefix** differs (`assets/…` static vs `media/…` CMS) — a
   media-path normalization is required before runtime images resolve.

---

## 7 · Parity result (Phase 3, run against seeded `content_store`)

See `PARITY-REPORT.txt` for the full field-by-field diff. Summary:

| Collection | MATCH | MISSING | EXTRA | DIFFERENT | UNMAPPED |
|---|---|---|---|---|---|
| home | 197 | 31 | 10 | 0 | 0 |
| chrome | 78 | 4 | 6 | 10 | 0 |
| projects | 74 | 0 | 0 | 14 | 0 |
| articles | 580 | 20 | 2 | 46 | 0 |
| experience | — | — | — | — | **1 (whole collection)** |
| story | — | — | — | — | **1** |
| orange | — | — | — | — | **1** |
| pages | — | — | — | — | **1** |
| seo | — | — | — | — | **1** |

**TOTALS:** MATCH 929 · MISSING 55 · EXTRA 18 · DIFFERENT 70 · UNMAPPED 5
(of 1,975 static leaves).

> **Headline:** the runtime content bridge **works end-to-end** (content_store →
> API → adapter → React), but the current `content_store` **cannot yet reproduce
> the site**: 5 of 9 collections have no CMS equivalent, and the 4 mapped
> collections carry structural/value differences (slugs, media paths, body
> format, nav/CTA shape). Closing this gap is a **content-migration + data-seed**
> task, not a code task — and it is the explicit gate before the hardcoded
> content files can be retired (Phase 2 migration step 6).
