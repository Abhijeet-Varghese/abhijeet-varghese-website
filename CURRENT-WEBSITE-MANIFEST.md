# CURRENT WEBSITE MANIFEST — Phase B cleanup reference

**Branch:** `phase-b-cleanup` (safety checkpoint `5f5fe06`; `main` untouched at `f21d793`)
**Date:** 2026-09-08 · **Mode:** no publish, no CMS/DB write, no redesign/copy/URL change.
**Source of truth for the public website:** the hand-authored static frontend **`abhijeetvarghese/`**. The CMS (`avos-php/`) is the editor/generator and is **stale for Portfolio**. The on-disk `public_html/site/` is a **generated artifact** (currently stale) and is not a source of truth.

---

## A. Classification legend
**CURRENT** — part of the live new website. **REQUIRED DEPENDENCY** — referenced by a current page (CSS/JS/font/media). **GENERATED** — produced by the publisher (regenerable, not source). **LEGACY** — superseded but still part of CMS architecture (keep until migration). **DUPLICATE** — redundant copy. **UNUSED** — referenced nowhere (deletion candidate). **UNKNOWN** — keep, needs review.

## B. Page manifest (canonical source / URL / assets)

| Page | Canonical URL | Source HTML | Page CSS | Page JS | Status |
|---|---|---|---|---|---|
| Home | `/` | `abhijeetvarghese/index.html` (57,511, `758630bf`) | — | — | CURRENT |
| Story/About | `/story.html` | `abhijeetvarghese/story.html` (42,252, `5ef0d3a6`) | — | — | CURRENT |
| Experience | `/experience/` | `abhijeetvarghese/experience/index.html` (40,118, `5e0f5f28`) | — | — | CURRENT (clean URL) |
| **Portfolio (reel)** | `/portfolio.html` | **`abhijeetvarghese/portfolio.html` (41,360, `d3fd3d39…`)** | **`css/portfolio-reel.css` (40,161, `b6e6eeaf…`)** | **`js/portfolio-reel.js` (19,063, `dab4e913…`)** | **CURRENT — FILM REEL** |
| Case Studies index | `/case-studies/` | `abhijeetvarghese/case-studies/index.html` (22,951, `210dc9fa`) | — | — | CURRENT (clean URL) |
| Case: Indian Army | `/case-studies/indian-army/` | `abhijeetvarghese/case-studies/indian-army/index.html` (18,969) | — | — | CURRENT |
| Case: BPCL | `/case-studies/bharat-petroleum-corporation-limited/` | `abhijeetvarghese/case-studies/bharat-petroleum-corporation-limited/index.html` (34,559) | — | — | CURRENT |
| Case: Orange Business | `/case-studies/orange-business/` | `abhijeetvarghese/case-studies/orange-business/index.html` (49,500) | `css/orange-business-case-study.css` (37,555) | `js/orange-business-case-study.js` (17,333) | CURRENT |
| Orange EBC (alias) | `/experience-design/orange-business-executive-briefing-center/` | redirect stub → `/case-studies/orange-business/` | — | — | CURRENT (redirect) |
| Recruiters | `/for-recruiters.html` | `abhijeetvarghese/for-recruiters.html` (58,260, `083f8049…`) | `css/for-recruiters.css` (38,668, `b2991135…`) | `js/for-recruiters.js` (11,398, `7655b9f0…`) | CURRENT (newer than git pre-Phase-A) |
| Contact | `/contact.html` | `abhijeetvarghese/contact.html` (30,399, `923bcffd`) | — | `js/country-data.js` (6,754) | CURRENT |
| Consulting | `/consulting.html` | `abhijeetvarghese/consulting.html` (18,434) | — | — | CURRENT |
| Blog/Insights | `/insights.html`, `/journal.html` + 4 essays + 2 journal posts | `abhijeetvarghese/{insights,journal,essay-*,journal-*}.html` | — | — | CURRENT |
| Utility | `/search.html`, `/sitemap.html`, `/privacy-policy.html`, `/terms.html`, `/404.html` | `abhijeetvarghese/*.html` | — | — | CURRENT |

**Global (every page):** `css/styles.css` (186,606, `cf9746d3…`), `css/tokens.css` (407), `js/main.js` (50,854, `015aed0a…`), fonts in `assets/fonts/*.woff2`.

**Clean-URL redirect stubs (CURRENT, intentional):** `experience.html` (→ `/experience/`), `case-studies.html` (→ `/case-studies/`), `case-study-immersive-…`, `case-study-intuitive-…`, `case-study-enterprise-…`, `experience-design/bpcl-palakkad/…`, `experience-design/orange-…/index.html` — all ~600–775 B `noindex,follow` + meta-refresh. These are **not** duplicates to delete; they are the canonical-redirect layer.

**Portfolio reel media (all resolve):** `assets/case-army.webp`, `assets/case-bpcl.webp`, `assets/case-orange-experience-in-action.webp`, `assets/logo.png`, `assets/logos/*.webp`, plus hero/about/essay/journal imagery under `assets/`. Every reference in `portfolio.html` resolves to a real file.

## C. Asset dependency graph result
- All 5 CSS + 4 JS files in `abhijeetvarghese/{css,js}` are referenced (global 24×, page-specific 1–2×). **No unused page CSS/JS.**
- All fonts are `@font-face`-referenced in CSS (instrument-serif/inter-tight/poppins, normal+italic/medium). **No orphan fonts.**
- `assets/fonts/OFL-*.txt` = SIL Open Font License files → **REQUIRED (legal)**, keep.
- All top-level images and the four initially-flagged nested images (`journal-03/04.webp`, `orange-business-interactive-video-wall.jpg`, `orange-business-visitor-registration-touchscreen.jpg`) **are referenced** — by the Orange case-study page, `PublishEngine.php`, `avos-data/site.json`, or the CMS orange template. **No orphaned media.**
- **Old "grid portfolio" styles** (`.portfolio-piece`, `.portfolio-index__grid`, `.portfolio-hero`) exist **only inside the shared `styles.css`** (66 matches) — they are not a separable file, and the new reel page does not use them. Because `styles.css` is the shared stylesheet for all 24 pages, it is **REQUIRED/SHARED** and must not be deleted or stripped in this phase (note for future optimization, not cleanup).

## D. Classification of non-frontend locations
| Path | Classification | Action |
|---|---|---|
| `abhijeetvarghese/` (entire) | CURRENT + REQUIRED | preserve; this is the website |
| `avos-php/backend/publish/templates/for-recruiters.html` | CURRENT (Phase A canonical) | preserve |
| `avos-php/backend/publish/templates/orange-business-executive-briefing-center.html` | CURRENT (CMS canonical) | preserve |
| `avos-php/site-template/css|js/portfolio-reel.*`, `for-recruiters.*`, `styles.css`, `main.js` | REQUIRED DEPENDENCY (publish assets) | preserve; reel ready for CMS port |
| `avos-php/backend/publish/PublishEngine.php` `renderPortfolio()` (line 1535) | **LEGACY CMS RENDERER** (old grid) | keep; do NOT let it publish; replaced in migration phase |
| DB `content_store` portfolio + `avos-data/site.json` portfolio | **STALE CMS SOURCE** | keep; do not delete; reconciled in migration |
| `avos-php/public_html/site/` (on disk, stale) | GENERATED (stale; re-rendered 22:50) | leave as-is this phase; the NEW mirror is in `git main`; will be regenerated from corrected CMS later |
| `avos-php/storage/deployments/site-831b…/a049…/e797…/` (3 × 629K) | GENERATED backups (gitignored), all stale-old | keep (rollback artifacts); report only — not deleted |
| `design-system/`, `tests/`, root `*.md`, `avos-data/`, `.claude/` | UNKNOWN/docs/testing | keep |

## E. Cleanup decision
After building the manifest and the full dependency graph (HTML+CSS+JS+PHP+DB+JSON), **no CURRENT/REQUIRED/SHARED file is redundant**, and every candidate-orphan resolved to a real reference. Therefore:

**FILES REMOVED IN PHASE B: 0 (none).** This is the evidence-based outcome, not an oversight — the new frontend source tree is already a single, unambiguous implementation with no old duplicates inside it. The genuinely old/superseded items live in (a) the stale generator output and (b) legacy CMS renderer/data, both of which Phase B rules explicitly require us to **keep** (they are migration inputs, and deleting them provides no source-tree clarity).

## F. Verification (current frontend served statically on :8095)
- **Portfolio reel:** `#film` present, `data-pf-chapter` ×9, `pf-card` ×6, `portfolio-reel.css` + `portfolio-reel.js` loaded, old grid markup absent (0 × `.portfolio-index__grid`/`.portfolio-piece`; only the shared body class `portfolio-page` remains), title = *"…Creative Director Portfolio"*.
- **Clean URLs all 200:** `/`, `/story.html`, `/contact.html`, `/for-recruiters.html`, `/consulting.html`, `/insights.html`, `/experience/`, `/case-studies/`, `/case-studies/indian-army/`, `/case-studies/bharat-petroleum-corporation-limited/`, `/case-studies/orange-business/`, `/experience-design/orange-business-executive-briefing-center/`. Body classes confirm correct implementations (`bpcl-case`, `orange-business-case`, `experience-page`, `rp` recruiters, `home-arena`).
- Desktop + mobile: **0 horizontal overflow**, `#film` present on mobile.
- **0 failed network requests, 0 HTTP 404, 0 JS errors** across the reel page.
- axe: no content/contrast issues on the reel; one pre-existing generic `region` notice on the shared decorative `.page-close` back-link (present site-wide, not reel-specific; left unchanged — no redesign).

## G. Source-of-truth map (final)
- **All public pages:** source of truth = `abhijeetvarghese/` (the new frontend).
- **Recruiters additionally:** canonical publisher template = `avos-php/backend/publish/templates/for-recruiters.html` + page assets (Phase A) — matches frontend.
- **Portfolio:** source of truth = `abhijeetvarghese/portfolio.html` + `portfolio-reel.css/js`. The CMS `renderPortfolio()` + CMS portfolio record are **legacy/stale** and must NOT become truth.
- **Generated/deployed `public_html/site/`:** regenerable artifact; the intended-current mirror is the one in `git main`; re-publish only after the CMS is reconciled to the frontend.
