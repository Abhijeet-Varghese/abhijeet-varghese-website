# AV OS — HANDOVER SUMMARY

**Project:** Abhijeet Varghese (abhijeetvarghese.com) — portfolio platform
**Live version:** v2.4.20 (single authoritative line, per working policy)
**Date:** 2026-09-09 (static-frontend refactor)

---

## 1 · STACK

| Layer | Tech |
|---|---|
| Backend | PHP 8.4 (CLI), no framework — custom MVC (`backend/`) |
| Database | MariaDB 10/11, `avos` DB, `content_store(key_name, data)` JSON store |
| Frontend | `abhijeetvarghese/` — hand-authored HTML/CSS/JS (no build step), **served as-is** |
| Publishing | none — edit the frontend → commit → GitHub workflow → `hostinger` branch → web root |
| Site state | 100% STATIC — clean URLs (`/experience/`, `/case-studies/<slug>/`), 301 map + 404 in the frontend `.htaccess` |
| Dev server | `php -S 0.0.0.0:8092 router.php` (in `avos-php/`) |
| Testing | Playwright (Chromium) + axe-core; shell batteries for API/CRM |
| Fonts (local, no CDN) | Inter Tight · Instrument Serif · Poppins |
| Design system | Archived reference at `docs/archive/design-system/abhijeet-varghese/MASTER.md` (+ page notes); the live source of truth is the CSS in `abhijeetvarghese/css/` |

## 2 · FILE TREE (key paths)

```
repo root
├── abhijeetvarghese/              ← THE PUBLIC WEBSITE (final static frontend; deployed as-is)
│   ├── index.html · story.html · portfolio.html · contact.html · insights.html · …
│   ├── experience/ · case-studies/{,orange-business,indian-army,bharat-petroleum-corporation-limited}/
│   ├── css/styles.css · js/main.js (contact form → /api/public/lead) · assets/
│   └── .htaccess                  ← legacy-URL 301 map, cache headers, 404
├── avos-php/                      ← AV OS (admin + API) — works around the site, never renders it
│   ├── router.php                 ← dev server: serves AV_SITE_DIR + /api /admin /install /media
│   ├── backend/  config/config.php (AV_SITE_DIR) · core · models · controllers · agents · scripts/
│   │   └── scripts/               ← doctor.php, agent-runner.php, sync-frontend.php, prod-cleanup.php …
│   ├── public_html/               ← web-root files: .htaccess (hardening + site rules), admin/, api/, install/, media.php
│   ├── database/migrations/       ← immutable; 031_static_frontend.sql drops the publish tables
│   ├── docs/static-frontend.md    ← how the site + backend fit together
│   └── config.local.php           ← dev overrides (DB creds, $siteDir) — never committed
├── docs/archive/                  ← historical one-off reports + design-system notes (not maintained)
├── tests/                         ← battery (see §4)
├── .github/workflows/             ← subtree-splits abhijeetvarghese/ → hostinger branch
└── DEPLOY-HOSTINGER-PHP.md        ← live deploy runbook (Hostinger)
```

## 3 · THE ABOUT (STORY) PAGE — DESIGN STATE

One continuous cinematic canvas, rebuilt from scratch over the sessions:

- **Hero — The First Frame:** full-viewport editorial film title with nested blueprint frames, three typographic beats (`I DIDN'T` / `START OUT` / outlined-serif `DESIGNING EXPERIENCES.`), concise VFX-origin context, discipline rail, `Enter the story` CTA and low-volume role crawl. The compass stays hidden through the hero. Portrait remains exclusive to the identity spread.
- **Dual-skill refinement:** UI/UX Pro Max scroll-storytelling and responsive guidance combined with Apple HIG purpose/agency/material/motion principles. Liquid Glass is reserved for nav/compass; evolution copy uses standard content material; card motion is time-based and sleeps offscreen.
- **Identity hub (act 01):** statement + storyboard-beat bio → portrait (bleeding
  right edge, editorial scrim + scroll parallax) → tabular numbers 12+/65+/100+
  → facts strip → serif credo → THE ZOOM-OUT stage (1.08 overscan → pull-back
  scrub, frosted labels) → compact meta strips.
- **Evolution — 3D FILM STACK:** 8 cards hinge open on scroll (sticky stage,
  1060vh runway, pointer camera, lerped rAF progress, world-tinted light).
  Cards 01–06 = chapters: dedicated About image + **glass plate at bottom** with
  **big title (lines flow inline)** + supporting line + extras (ch03 statement,
  ch04 signal chain, ch06 duo). Cards 07–08 = interludes: **no glass, text
  centered mid-card**, serif quote titles. **Sequence 01–08.** No numbers, no
  progress chrome. Card 08 holds open at the end.
- **Closing:** What (filmography list) → Now (split editorial grid) → Still
  Curious (numbered index) → Credits (quote · signature · CTA on paper).
- **Chrome:** nav + footer identical on every page; story compass pill
  (number + name, materializes, tablet-safe top:96px); no custom cursor.
- **Refinement layer:** entrance choreography, editorial typography, glass
  plate highlight + is-front breathing, gradient hover rules, focus/selection
  polish, GPU-friendly motion, full `prefers-reduced-motion` fallbacks.

### Orange Business EBC case study

- Canonical route: `/experience-design/orange-business-executive-briefing-center/`.
- The former flat Orange URL redirects to the canonical route and is excluded from the sitemap.
- The user-supplied long-form narrative, real project images, interaction system and client-specific orange/black visual world are integrated through a dedicated publish template.
- Dedicated cache-busted CSS/JS use the approved local Inter Tight and Poppins files; there are no CDN or missing-font requests.
- The nested route now uses the exact homepage `chrome()` and `footer()` renderers, global stylesheet and mobile-menu behavior. Bespoke case-study navbar/footer code has been removed.
- `chrome_consistency_qa.js` verifies matching DOM destinations and computed navbar/footer materials across all 24 public content, search and 404 pages.
- Panorama hotspots, responsibility choices, journey, architecture, proof tabs, room response and technology-purpose controls are keyboard and touch operable.
- The three MP4 files were not supplied. Publish therefore removes unavailable video sources/schema and serves the supplied posters without broken requests. Adding `rotoscope.mp4`, `videowall.mp4` and `VR.mp4` under `assets/media/video/` enables progressive video delivery on the next publish.
- Source and generated output are byte-identical; deployment history is pruned to one current live snapshot.

### Current project-detail state

- Orange Business remains the complete long-form canonical case study.
- BPCL and Indian Army retain their listing cards and stable URLs, while their inner routes now render responsive shared-chrome “Full case study coming soon” pages. Existing factual project records remain stored in the CMS.
- Story Evolution pacing is now materially faster: 480vh desktop/tablet and 440vh phone runways, direct 1:1 scroll tracking, immediate stack wake-up on scroll/resize, and compositor hiding for exited cards.
- Contact submissions stay entirely on-site: the selected date/time and context are saved to AV OS, an in-page confirmation is shown, and no Calendly script, iframe, popup or redirect is loaded.
- Every inner-page close control uses same-origin browser history to restore the exact originating route and scroll position; direct/new-tab visits retain the homepage fallback.

### Whole-site responsive/performance hardening

- Full implementation record: `FULL-SITE-OPTIMIZATION-REPORT.md`.
- Dedicated layout/spacing audit: `LAYOUT-VISUAL-POLISH-REPORT.md` (24 routes · 77 sections · 174 visual captures).
- Compact focus-trapped navigation now covers phone and tablet widths through 900px; desktop chrome remains unchanged above 900px.
- Every public image has alt text and intrinsic dimensions. Orange journey media switches responsive WebP candidates per state.
- The shared 500px logo is now a Retina-safe 160px asset (86% smaller); Inter Tight variable fonts are safely subset (59% combined reduction).
- Homepage/article LCP images receive selective preload. Apache output adds Brotli/Gzip, content-hashed CSS/JS caching, 30-day font/media caching and no-cache HTML.
- Every published project/article has factual SEO data, and the human-readable sitemap includes all three case studies.
- Search escaping/tag handling is clean; no public page emits console errors in the compatibility suite.

## 4 · WHAT WORKS — TEST BATTERY (all green at handover)

| Suite | Result |
|---|---|
| `e2e_fresh.sh` (fresh install, 139 checks — static-frontend assertions replace publish/rollback) | 139/139 |
| `integration_hub.sh` | green |
| `failure_modes.sh` · `journeys.sh` | 19/20 · 15/16 (1 pre-existing drift each: webhook timing, copilot wording) |
| `inbound_webhooks.sh` · `2fa_test.sh` | need a fresh DB + their own credentials (see §5.3) |
| Admin SPA sweep (Playwright, 50 views) | 0 JS errors · 0 API failures |
| `functional_test.js` · `admin_sweep.js` | 13/13 · 48/48 |
| `about_qa.js` (stack, sequence, axe on stage) | ALL CLEAN |
| `layout_audit2.js` (6 widths × 8 cards) | ALL CLEAN |
| `resp_ext.js` (**22 sizes**, 320×568 → 2560×1440 + landscape) | ALL CLEAN |
| `axe_audit.js` (14 pages) · `v25_responsive.js` (11×7) · `link_audit.php` (78 links/assets) | 0 · 0 · 0 |
| `site_static_integrity.py` (24 HTML · 124 images · 3 video regions · 2 forms · 138 buttons) | ALL CLEAN |
| `full_site_responsive_qa.js` (24 routes × 25 sizes + 7 continuous sweeps + DPR 2/3) | ALL CLEAN |
| `browser_compat_qa.js` (Chromium · Firefox · WebKit, mobile + desktop) | ALL CLEAN |
| `performance_budget_qa.js` (LCP · CLS · DOM · transfer · long-task budgets) | ALL CLEAN |
| `accessibility_resilience_qa.js` (24 routes: no-JS · reduced motion · 200% text · touch; forced-colors key routes) | ALL CLEAN |
| `visual_precision_qa.js` (24 routes · 77 sections · 7 composition viewports) | ALL CLEAN |
| `orange_business_case_qa.js` (10 edge sizes + interactions + no-JS + reduced motion) | ALL CLEAN |
| `chrome_consistency_qa.js` (24 public routes + computed chrome parity + mobile dialog) | ALL CLEAN |
| `apple_pass_check.js` · `dup_audit.js` · `case_nav_test.js` · `history_close_qa.js` | ALL CLEAN |
| `frontend_sync.sh` (static site → CMS mirror) | 24/24 |
| `doctor.php` | SYSTEM READY |

**Static-frontend refactor (2026-09-09) verified:** all 31 pages + clean URLs 200 ·
7 legacy 301s · 404 · dotfiles blocked · `/api/status` `site:"static"` · lead + analytics
endpoints from the frontend · SEO crawl over the static files (24 pages) · doctor SYSTEM READY ·
publish/deployments/redirects routes 404.

## 5 · WHAT'S LEFT / NEXT STEPS

1. **🔴 LIVE DEPLOY — NOT VERIFIED (external env required).** Hostinger:
   staging `next.abhijeetvarghese.com`, prod `abhijeetvarghese.com`.
   The website deploys from the `hostinger` branch (GitHub workflow). For AV OS follow
   `DEPLOY-HOSTINGER-PHP.md` (upload `avos-php/public_html/*` beside the site, private
   folders outside the web root, installer, env/DB/enc-key, cron for `agent-runner.php`).
2. **Dedicated Portfolio is live at `portfolio.html`.** It is a visual index with three published projects, six practice areas and the 16-organisation proof wall. `case-studies/` remains the narrative case-study collection. Nav id `n3b`, footer, seed, MySQL, sitemap and search index all point to the dedicated page.
3. **Known environment behavior:**
   - Ephemeral sandboxes may require PHP/MariaDB, `npm ci`, Playwright browser installation, DB provisioning and a server restart.
   - Restore CMS content with `php backend/scripts/sync-frontend.php --force` (mirrors the static site into the store); there is no JSON seed file any more.
   - `e2e_fresh.sh` requires a disposable fresh database and environment-local test credentials. Clear test rate-limit/login-attempt state between authentication suites.
   - `integration_hub.sh` and `inbound_webhooks.sh` should run independently to avoid shared-state races.
   - Public CSS/JS cache versions use a 12-character SHA-256 content fingerprint: `2.4.20-{hash}`.
4. **Recovery path:** recreate the environment-local `config.local.php`, provision the database, run `php database/install.php` (the installer mirrors the static site into the CMS; `sync-frontend.php --force` re-does that at any time), start `router.php`, and verify with `php backend/scripts/doctor.php` + the test battery. The website itself needs nothing — it is the committed `abhijeetvarghese/` folder.
