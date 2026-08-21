# PHASE 4 — Runtime Cutover + Visual Parity: Final Report

> Status: **runtime cutover complete on staging branch.** The React frontend now
> renders from `GET /api/v1/content` (CMS → API → provider → components), with
> the static snapshot as the deliberate fallback. Design/behaviour unchanged.
> **CMS → API → React → Website: PROVEN.**

---

## A · Files changed

**46 files** — 40 frontend source files (28 components + 5 entries + `pages/index.tsx`
+ `hydrate.tsx` + `entry-server.tsx` + `adapt.ts` + `provider.tsx` + `parity-check.ts`),
2 new dev tools (`scripts/serve-dist.mjs`, `tests/phase4-runtime-verify.mjs`),
1 doc (`PHASE-4-DEPENDENCY-INVENTORY.md`), + `package-lock.json` (playwright).

No production files, no `main`, no `src/content/*.ts` deletions, no `.htaccess`,
no Hostinger config touched.

## B · Components migrated

**28 content-value consumers** migrated from static module imports to `useContent()`:
chrome (Footer, Nav) · home sections (Hero, Clients, Capabilities, Work, Thinking,
AiMethod, Journey, Focus, Contact) · story sections (Prologue, Identity, Evolution,
Compass, Closing) · orange (Hero, ActionPanels, interactive×5) · pages
(CaseStudies, Consulting, Recruiters, Contact, Experience, Insights, Journal,
Orange, Portfolio). **3 signature changes**: `ComingSoonCase`/`ArticlePage` →
slug-based lookup; `LegalPage` → `kind`-based.

## C · Routes migrated

All **24 public routes** (home, story, experience, portfolio, case-studies,
case-bpcl, case-army, orange, contact, consulting, for-recruiters, insights,
journal, search, sitemap, privacy, terms, 404, 4 essays, 2 journal) — verified
rendering with runtime content + static fallback.

## D · Static imports removed from normal execution

Post-migration grep: **10 remaining imports**, all legitimate:
`SOCIAL_ICONS` (SVG code) · `buildHead` (fn) · `type ExperienceJob` (type) ·
`withBaseSrcset` (fn) · `comingSoonSeo` (fn) · and `pages/index.tsx`'s SEO
exports + `PROJECTS`/`ARTICLES_BY_SLUG` (build-time prerender registry).
**Zero** runtime components consume CMS-managed content *values* directly from
`src/content/*.ts`.

## E · Runtime architecture

`GET /api/v1/content` → `CMSContentProvider` (mounted in `hydrate.tsx` + `entry-server.tsx`,
identical tree both paths) → `useContent()` → `ContentLoader` (fetch→validate→adapt→merge).
The adapter now also derives `ESSAYS`/`JOURNAL`/`ESSAY_INDEX`/`JOURNAL_INDEX`/
`ARTICLES_BY_SLUG` from runtime `ARTICLES` (consumed by insights/journal/essay routes).

## F · Fallback architecture

`mergeContent()` deep-compacts and merges runtime content over `STATIC_CONTENT`
(the static snapshot = PublishedSnapshot/rollback). Any fetch failure → static.
Observable diagnostics: `<html data-avos-source data-avos-phase>` + console logs —
a permanent failure is surfaced, never silently masked.

## G · CMS publishing test

Edited `prj-1` title via the real `ContentStore::put` write path → `revision` 1→2,
new ETag → frontend (`/case-studies.html`) displayed the edited title **without a
Vite rebuild** → reverted via idempotent `migrate-content.php --key=projects`.
This proves the full CMS→API→React→Website chain.

## H · Cache test

ETag = SHA-256 of content → changes on publish (observed `86ae3a…`); `If-None-Match`
→ 304 (Phase 3 backend test still green); `Cache-Control: public, max-age=60, must-revalidate`.

## I · Failure-mode tests

`tests/content-layer.test.ts` (25 checks): A works · B unavailable · C malformed ·
D empty · E DB-down (500) · F stale/cached · G unpublished excluded · H invalid media ·
+ 4s-timeout. Plus browser test §3 (API blocked → static, non-blank site).

## J · Browser verification (Playwright, real Chromium)

`tests/phase4-runtime-verify.mjs` — **8/8 pass**:
1. GET /api/v1/content requested ✓
2. content source = runtime ✓ · 3. phase = runtime ✓ · 4. hero rendered ✓
5. **rendered text identical (runtime vs static) across all 24 routes** ✓
6. fallback source = static ✓ · 7. fallback renders non-blank ✓
8. no horizontal overflow ✓

## K · Responsive verification

3 viewports (390×844 / 768×1024 / 1440×900) × 6 key routes — zero horizontal
overflow, no layout regression.

## L · WebGL / Three.js verification

**No Three.js/WebGL exists in the current site** — verified by grep (`new WebGL`,
`from 'three'`, `getContext('webgl')` all absent). The Story "Evolution 3D film
stack" is a DOM/CSS transform engine (single rAF loop in `Evolution.tsx`). The
migration does not touch any animation libs (`lib/home-motion.ts`, `lib/scroll.ts`,
`lib/about.ts`, `lib/orange.ts`, `lib/analytics.ts` are all unchanged). No WebGL
to regress; nothing redesigned.

## M · SEO verification

Prerendered `<head>` preserved: `<title>`, `description`, `canonical`,
`robots` (index,follow), OG title/image, twitter card, JSON-LD — all present and
unchanged on home + story (build-time prerender; runtime body content does not
affect the head). Runtime SEO-head editing is a documented later builder concern.

## N · Performance measurements

| Metric | Value |
|---|---|
| `GET /api/v1/content` payload | 111.8 KB raw / **27.4 KB gzip** |
| API response time (local) | ~3–4 ms |
| main JS bundle | 290 KB (route-split; story/orange separate) |
| dist total | 3.2 MB (incl. all media) |
| cache | ETag + `max-age=60, must-revalidate`; single payload per page (no per-component queries) |

Payload grew vs Phase 3 (54.9 KB → 111.8 KB) **only because it now includes the
5 migrated collections** (experience/story/orange/page_content/page_seo). 27 KB
gzipped is well within acceptable bounds; if it grows materially, the documented
split is per-collection `?collections=` sub-resources + `stale-while-revalidate`
— not needed now.

## O · Remaining static dependencies

As §D — `pages/index.tsx` (build-time prerender registry + SEO head), the
`static-snapshot.ts` fallback definition, and code/type/function imports. The
`src/content/*.ts` files are **intact** and now serve only as: (1) the build-time
prerender snapshot, (2) the runtime fallback/rollback (§23 — marked LEGACY
STATIC FALLBACK, not deleted).

## P · Remaining issues (honest)

1. **SEO head is prerendered** — CMS edits to page `<head>` metadata require a
   republish (shell rebuild), per the hybrid model. Body content is fully runtime.
2. **DERIVED 19 leaf paths** (18 per-article `seo` + 1 `brandHref`) remain
   build-time-derived, not runtime — documented.
3. **Backend still not live on Hostinger staging** (pre-existing blocker: no
   staging MariaDB/`AV_ENC_KEY` provisioned; `STAGING-BACKEND-RUNBOOK.md` applies).
   The runtime cutover is proven locally; it is **NOT deployed** to staging.

## Q · Git commits / tags

- `1fe94a8` — feat(frontend): runtime cutover (this phase)
- tags: `phase4-runtime-cutover-start` (→ f4d2ed8), `phase4-runtime-cutover-complete` (→ 1fe94a8)
- prior rollback points intact: `phase-migration-complete`, `hostinger-backup-2026-08-21`.
- **Not pushed** (no PAT this turn). `main`/production untouched.

## R · Rollback procedure

`git checkout phase4-runtime-cutover-start` (or `phase-migration-complete`).
The migration is purely additive: static `src/content/*.ts` unchanged, so the
build-time prerender + static fallback path is exactly the pre-Phase-4 behaviour.
Runtime revert = block/remove `/api/v1/content` → every page falls back to static.

---

## Final statement

**CMS → API → React → Website — PROVEN.**

The frontend now renders its content from `GET /api/v1/content` (CMS-authoritative),
proven via: (1) the code-level dependency audit (no runtime static-content
consumers), (2) real-browser network + source verification, (3) byte-identical
static↔runtime rendered text across all 24 routes, (4) a live publish-edit test
showing content changes propagate without a rebuild, and (5) safe observable
fallback when the API is unavailable.

**Stopping here for approval** — Phase 5 (React admin foundation) has not been started.
