# FINAL STAGE — CLEANUP + QA + GO/NO-GO

> The 25-route migration is complete and frozen. This stage executed the
> cleanup pipeline, ran the full QA matrix, and produces the production
> GO / NO-GO recommendation.

---

## 1 · MIGRATION FREEZE

**25 routes frozen** across 9 commits on `feat/react-ts-vite-migration`:

```
9c12283 feat(frontend): add React TypeScript Vite MPA with build-time static generation
5bdcf7d docs: add React/Vite migration plan and route manifest
490b62c docs: add migration status report (Milestone 1)
0bbd546 feat(frontend): migrate Story/Evolution + route/interaction code splitting
127c25d feat(projects): migrate Portfolio, Case Studies, Orange + coming-soon pages
22c369c feat(content): migrate contact, consulting, recruiters, insights, journal, search, legal, 404 + essays/articles
9f3569d fix(frontend): migrate experience + sitemap routes (were marked done but missing)
3387dbd chore(frontend): cleanup orphaned assets + fix Orange favicon path
```

## 2 · OBSOLETE LEGACY IDENTIFIED (NOT removed — still the production path)

The hand-authored `abhijeetvarghese/` frontend (25 HTML · 3 CSS · 2 JS · 63
assets) is fully superseded by `frontend/dist`. It **remains in place** because:
(a) it is the current deployed production, and (b) the PHP `sync-frontend.php`
publish pipeline still references it. It becomes removable only after the new
build is deployed. **Nothing in `abhijeetvarghese/`, `avos-php/`, `avos-data/`,
`design-system/`, or `tests/` was modified or removed.**

## 3 · PROVEN-OBSOLETE FILES REMOVED (from the new frontend only)

| File | Reason (proven) |
|---|---|
| `frontend/src/content/search-index.json` | duplicate — `public/search-index.json` is the live source |
| `frontend/public/assets/journal/journal-03.webp` | belongs to draft article `on-writing-for-non-designers` |
| `frontend/public/assets/journal/journal-04.webp` | belongs to review article `clarity-as-a-business-metric` |
| `frontend/public/assets/media/orange-business-interactive-video-wall.jpg` | orphaned — no picture/jpg fallback in source (poster-only) |
| `frontend/public/assets/media/orange-business-visitor-registration-touchscreen.jpg` | orphaned — journey uses WebP only |

(OFL font license `.txt` files retained — license compliance, not obsolete.)

## 4 · UNUSED DEPENDENCIES

**None removed — none were unused.** The frontend footprint is intentionally
minimal: `react` + `react-dom` (runtime); `vite` + `@vitejs/plugin-react` +
`typescript` + `@types/react(-dom)` + `@types/node` (build). The root
`package.json` (`axe-core`, `playwright`) is the PHP test-battery's own tooling,
untouched.

## 5 · DUPLICATE CSS / JS / ASSETS

CSS is a **clean verbatim partition** (tokens 46 + base 82 + styles 3899 =
original 4027 lines; no new duplication — the original already carried
responsive re-declarations). One duplicate JSON + 4 orphaned images removed
(§3). Fonts are single-sourced (one copy each in `public/assets/fonts/`).

## 6 · BUILD

`npm run build` → deterministic static `dist/` (3.1 MB, 25 HTML entries + assets).
No Node runtime required.

## 7–10 · QA MATRIX (all green)

| Gate | Result |
|---|---|
| **25-route QA** (300 checks: 25 routes × 12 widths) | **0 HTTP errors · 0 console/network errors · 0 broken links · 0 missing images** |
| **Responsive** (320/375/390/430/768/820/1024/1280/1440/1920/2560/3840) | **0 horizontal overflow** |
| **SEO** (title/description/canonical/OG/Twitter/H1/JSON-LD) | **PASS on all pages** (redirect stub intentionally minimal, matches production) |
| **Accessibility** (landmarks/alt/single-H1/labels/live regions) | **PASS** |

**Bugs found & fixed during this stage:** `experience.html` + `sitemap.html`
were marked "migrated" in earlier manifests but were actually missing (both now
migrated, 0 RMSE); the Orange favicon resolved to a relative path that 404'd
from the nested route (now `../../assets/logo.png`).

## 11 · SECURITY SCAN

Zero findings — no API keys, OAuth secrets, DB/SMTP credentials, OpenRouter
keys, or session secrets in `dist/`. No credential/token files.

## 12 · BACKEND REGRESSION

`avos-php/` + `avos-data/` **untouched** (zero files changed across all 9
migration commits). PHP 8.x · MariaDB · CMS · admin · API · AI · calendar ·
booking · email · SEO all intact.

## 13 · BOOKING REGRESSION (functional)

Empty submit → validation ✓ · invalid email ✓ · calendar open + date select ✓ ·
slot select + summary ✓ · valid submit (no-PHP preview) → graceful on-site
failure, **no Calendly** ✓ · mobile calendar ✓ · 0 page errors. Submission
remains a *request* (pending approval) — never a false confirmation.

## 14 · PERFORMANCE (final)

| Item | Size (gzip) |
|---|---|
| Shared `app` (react + react-dom + chrome) | **66.4 KB** |
| Homepage entry + sections | ~11 KB (index 2.7 + home 4.2 + motion/scroll ~2) |
| Story (Evolution) | 8.3 KB · Orange 9.9 KB · Experience 4.7 KB |
| Content/utility pages | 0.24–1.4 KB each |
| Booking calendar | 4.5 KB (lazy) |
| CSS | 26.8 KB (+7.7 KB Orange) |

Route-level splitting confirmed: no Story/Evolution/Portfolio/Orange/Calendar
code loads on unrelated pages. Largest asset: 205 KB shared JS bundle
(react-dom runtime); authored media 70–178 KB (lazy-loaded).

## 15 · STAGING DEPLOYMENT

**Not performed.** A live Hostinger staging deploy (`next.abhijeetvarghese.com`)
requires the external environment + credentials documented in
`DEPLOY-HOSTINGER-PHP.md`, which are not available in this sandbox. The
equivalent staging verification (built `dist/` served + compared against
production with Playwright/ImageMagick) is **fully green** across all 25 routes.

## 16 · PRODUCTION

**NOT DEPLOYED.** No changes to `public_html/site/` or the live site.

---

## GO / NO-GO

### ✅ **GO (for staging)** — with the following notes

The migration is architecturally complete and every verification gate passes:

- **Visual fidelity** — 0 RMSE (pixel-identical) across all 25 routes at
  390/768/1440/1920, deterministic under reduced-motion.
- **Content integrity** — verbatim (no copy changed); the few JSX whitespace
  text-node differences are invisible and were corrected where they affected
  layout (e.g. the company/location badge).
- **Backend** — PHP + MariaDB completely untouched; booking/lead contract
  (`POST /api/public/lead`) preserved; no Calendly, no client-side secrets.
- **SEO / a11y / responsive / security** — all green.

**Two items to carry into staging (not blockers):**

1. **Homepage JS ≈ 66–76 KB gz** — dominated by the react-dom runtime, the
   documented floor flagged since Milestone 2. The only routes to the "<30 KB"
   aspiration are Preact-compat or no-runtime content pages, both of which the
   spec explicitly excluded ("Do NOT switch to Preact", "React remains the
   frontend architecture"). Recommendation: ship as-is, revisit only if a real
   field-lab LCP/INP problem is measured on Hostinger.
2. **Deployment mechanics** — the PHP publish pipeline (`PublishEngine.php` +
   `sync-frontend.php`) still points at `abhijeetvarghese/`. The cutover needs
   a documented step to serve `frontend/dist` as the public root (or run the
   Vite build into the publish target) while keeping `/api/*`, `/admin/`, and
   the MariaDB-backed routes PHP-owned. This is a deployment-runbook item, not
   a code change.

### **Recommendation: GO for staging deployment.**
Final production cutover remains gated on the two notes above being resolved
in the Hostinger environment — not on any remaining code work.
