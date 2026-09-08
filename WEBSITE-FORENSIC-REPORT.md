# WEBSITE INTEGRITY FORENSIC REPORT
### Read-only investigation — source-of-truth & Portfolio recovery

**Investigation date:** 2026-09-08 · **Mode:** READ-ONLY (no publish, no CMS/DB change, no delete, no checkout/reset, no overwrite)

---

## TOP-LINE STATUS

| Item | Status |
|---|---|
| **WEBSITE INTEGRITY** | 🟠 **AT RISK** — the served `public_html/site/` working tree was regenerated from stale CMS and no longer matches the newer frontend; **every newer artifact is fully recoverable** (nothing destroyed) |
| **RECENT PORTFOLIO** | ✅ **FOUND / RECOVERABLE** — the new cinematic "reel" Portfolio is intact in frontend source AND committed to git (`main`/HEAD). It is only **not being published** |
| **CURRENT FRONTEND** (`abhijeetvarghese/`) | 🟢 **NEW** — 24 hand-authored pages, latest design (Portfolio reel v2.5.0, clean-URL structure) |
| **CMS** (DB `content_store` + `avos-data/site.json` + PHP renderers) | 🔴 **OLD for Portfolio; current for most other pages** |
| **PUBLISHED SITE** (disk `avos-php/public_html/site/`) | 🔴 **OLD / MIXED on disk** — regenerated from CMS; but the **committed** git copy of the same dir is NEW |
| **ACTIVE OVERWRITE RISK** | ⚠️ **YES (latent)** — `auto-publish.php` cron + `PublishEngine::publish()` + `restore-canonical.php` can re-overwrite. **Not currently running** (only the dev `php -S` is up) |

---

## THE FIVE ANSWERS

**1. WHERE IS THE NEW PORTFOLIO?**
- Primary, hand-authored source: `abhijeetvarghese/portfolio.html` — **41,360 bytes, sha256 `d3fd3d39…`**, title *"Abhijeet Varghese — Creative Director Portfolio"*, loads `css/portfolio-reel.css?v=2.5.0-reel` + `js/portfolio-reel.js?v=2.5.0-reel` (cinematic film: `#film`, `data-pf-chapter` ×9, `pf-card__*`, `#progress`, 125 modern markers).
- **Committed to git**: identical file at `HEAD:abhijeetvarghese/portfolio.html` **and** `HEAD:avos-php/public_html/site/portfolio.html` (both `d3fd3d39…`, 45 reel markers). Branch `main` and `origin/main` carry it. (The `hostinger` branch does not have it.)
- Reel assets intact everywhere and byte-identical: `portfolio-reel.css` 40,161 B (`b6e6eeaf…`), `portfolio-reel.js` 19,063 B (`dab4e913…`) — present in `abhijeetvarghese/css|js/`, `avos-php/site-template/css|js/`, and `public_html/site/css|js/`.
- Reel media (`assets/case-army.webp`, `case-bpcl.webp`, `case-orange-experience-in-action.webp`, `assets/logos/*`) present and identical in frontend **and** deployed site.

**2. WHY IS THE OLD PORTFOLIO BEING SHOWN?**
The CMS page record `p-portfolio` has `template = "Portfolio"`, `blocks = 0`. During publish, `PublishEngine::renderPage()` dispatches it to **`renderPortfolio()`** (`PublishEngine.php:1535`), which builds an **older, bespoke grid page** (`portfolio-hero` / `portfolio-index__grid` / `portfolio-practice` / `portfolio-proof` / `portfolio-cta`, body class `portfolio-page`, title *"Portfolio — Abhijeet Varghese | Experience Design…"*, 27,445 B, sha256 `9f3bc20c…`). That renderer **predates the reel rebuild** and never references `portfolio-reel` (0 hits; backend contains **no** `portfolio-reel` string anywhere — confirmed). When a publish runs, this renderer writes its old markup to `public_html/site/portfolio.html`, overwriting the newer file. The new reel HTML exists only as a static frontend artifact; it was **never ported into a CMS template/renderer**, so the publisher cannot reproduce it.

**3. WHAT OTHER RECENT FRONTEND WORK IS AT RISK?**
- **Clean-URL directory case studies & section landing pages** — the new frontend uses directory routes (`case-studies/indian-army/`, `case-studies/bharat-petroleum-corporation-limited/`, `case-studies/orange-business/`, `experience/`, `experience-design/bpcl-palakkad/`) with tiny root `.html` stubs that canonical-redirect to them. The publisher flattens to root `.html` files and **does not emit those directories** — so on disk those directory trees (and ~91 tracked asset files under them) show as **deleted**. They survive in git (`case-studies/indian-army/index.html` 18,969 B, `…/bharat-…` 34,559 B, `…/orange-business/` 49,500 B, `experience/` 40,118 B) and in `abhijeetvarghese/`.
- **Portfolio itself** (above) is the only *design-regressed* page.
- Home, Story, Experience, Contact, Consulting, essays/journal: the CMS renderers **already produce the same modern content** (identical modern-marker counts and identical `<title>`); the on-disk byte differences are only version-hash / analytics / stamping churn — **not design loss**.
- **Recruiters** is the reverse case: disk/CMS is *newer* (the 58 KB cinematic Phase A template) than the 18.5 KB file committed in git. It is intact and must be preserved.

**4. WHAT MUST BE PRESERVED BEFORE ANY CMS WORK?**
- The entire `abhijeetvarghese/` frontend source tree (24 HTML pages + `css/js/assets/` + clean-URL dirs).
- The committed git state of `avos-php/public_html/site/` (it holds the *new* deployed baseline) — do not let a working-tree publish commit over it.
- `site-template/css|js/portfolio-reel.*` and the Phase A template system (`TemplateRegistry.php`, `publish/templates/for-recruiters.html`, `for-recruiters.css|js`).
- The current DB (stale Portfolio record notwithstanding) and `avos-data/site.json`.

**5. SAFEST NEXT IMPLEMENTATION STEP**
Do **not** re-run the publisher. First (a) make the current good frontend the protected baseline, (b) bring the CMS *up to* the frontend by adding a reel Portfolio template/renderer and aligning the clean-URL/case-study routing — i.e. **frontend → CMS**, never CMS → frontend. Details in §24–27.

---

## 01 EXECUTIVE SUMMARY

The repository contains a **newer static frontend** (`abhijeetvarghese/`, committed and complete) and an **older PHP CMS publisher** (`avos-php/`) that regenerates `public_html/site/` from DB content + renderer methods. Most CMS page renderers were updated to match the current design, but the **Portfolio renderer (`renderPortfolio()`) was never updated to the new "reel" design**, and the publisher's **URL/file model differs** (flat root `.html` vs the frontend's clean directory URLs).

During Phase A, **three force-publishes were run** (2026-09-07 ~22:50) to validate stability. Because the CMS Portfolio record dispatches to the stale renderer and the publisher rebuilds the whole site, those runs **overwrote the on-disk `public_html/site/`** with CMS-generated markup: the Portfolio page reverted to the old grid (41 KB → 27 KB) and the clean-URL directory trees were replaced/removed. This is the observed regression.

**No data was actually lost.** The new Portfolio and all new pages/assets are present in (i) the working frontend source `abhijeetvarghese/`, and (ii) committed git history (`main`/HEAD). The damage is confined to the **working-tree copy** of the generated `public_html/site/` directory (36 modified + 91 deleted tracked paths) and is fully reversible.

## 02 CURRENT WEBSITE STATE (on disk, what a visitor gets)

Served by `php -S 0.0.0.0:8092 router.php` from `avos-php/public_html/site/` (CMS-generated as of 22:50).
- `/portfolio.html` → **OLD** grid page (`9f3bc20c…`, 27 KB), no reel CSS/JS.
- Case studies served from **flat root files** (`case-study-intuitive-experiences-for-industrial-environments.html`, `case-study-immersive-solutions-for-the-indian-army.html`, `experience-design/orange-business-executive-briefing-center/index.html`); the `/case-studies/<slug>/` clean URLs return 404 on this dev router (production Apache mod_rewrite handles some via `.htaccess` 301s).
- Home/Story/Experience/Contact/etc. render the modern CMS design (content-current).
- `/for-recruiters.html` → **NEW** cinematic Phase A page (58 KB).

## 03 CURRENT FRONTEND BASELINE (`abhijeetvarghese/`) — the protected boundary

Hand-authored, static, the newest design. 24 root HTML pages + clean-URL subdirectories. Key files:

| File | Size | Role |
|---|---|---|
| `portfolio.html` | 41,360 | **NEW reel Portfolio** (`d3fd3d39…`) |
| `index.html` | 57,511 | Home (modern; 116+ interactive markers) |
| `story.html` | 42,252 | About |
| `contact.html` | 30,399 | Contact |
| `consulting.html` | 18,434 | Consulting |
| `for-recruiters.html` | 58,260 | Recruiters (synced copy) |
| `css/portfolio-reel.css` | 40,161 | Reel design system (`b6e6eeaf…`) |
| `js/portfolio-reel.js` | 19,063 | Reel interactions (`dab4e913…`) |
| `css/styles.css`, `js/main.js`, `css/tokens.css` | — | global; byte-identical to site-template |
| `case-studies/{indian-army,bharat-petroleum-corporation-limited,orange-business}/index.html` | 19–49 KB | clean-URL case studies |
| `experience/index.html`, `experience-design/{bpcl-palakkad,orange-business-executive-briefing-center}/index.html` | — | clean-URL sections |
| `assets/` (case-*.webp, logos/*) | — | all present, match deployed |

Root `case-study-*.html` and `experience.html` are **~600–775 B canonical redirect stubs** (`noindex,follow` + meta-refresh to the directory URL).

## 04 CMS STATE

- Content source: MySQL `content_store` (`avos` DB), seeded/restored from `avos-data/site.json` via `restore-canonical.php`.
- Portfolio record: `id=p-portfolio, slug=portfolio, template=Portfolio, blocks=0` → dispatched to `renderPortfolio()`. Same stale value in `avos-data/site.json`.
- Renderers (`avos-php/backend/publish/PublishEngine.php`): Home, Story/About, Experience, Contact, Recruiters (Phase A template), case studies etc. exist. **`renderPortfolio()` (line 1535) is the old grid and never loads `portfolio-reel`.** No backend file references `portfolio-reel`.

## 05 PUBLISHED STATE

- **On disk** (`public_html/site/`, mtime 22:50): CMS-generated; Portfolio OLD; flat URL structure; 36 modified + 91 deleted vs git.
- **Committed to git** (`HEAD:public_html/site/`): the **NEW** baseline — Portfolio `d3fd3d39…`, clean-URL directories present. This is the deploy mirror that was intended to be live before the Phase A republish.
- Deployment snapshots `storage/deployments/site-831b…/a049…/e797…/portfolio.html` all hold the **old** `9f3bc20c…` (they were produced by the 22:50 publishes; `storage/deployments/` is gitignored build artifact).

## 06 COMPLETE PAGE INVENTORY (new vs CMS vs published-on-disk)

| Page | Frontend source | CMS renderer | On-disk site | Git-committed site | Classification |
|---|---|---|---|---|---|
| Home `index.html` | 57,511 modern | renderHome (modern) | 55,562 modern | 57,511 modern | CMS-current (churn only) |
| Story `story.html` | 42,252 modern | renderAbout (modern) | modern | 42,252 modern | CMS-current |
| Experience | `experience/index.html` 40,118 | renderExperience (modern) | `experience.html` 39,975 flat | dir 40,118 | CMS-current content; **URL structure differs** |
| **Portfolio** | **41,360 REEL** | **renderPortfolio OLD grid** | **27,445 OLD** | **41,360 REEL** | 🔴 **FRONTEND NEWER / CMS STALE** |
| Case studies | dirs 19–49 KB | renderCaseStudy (flat) | flat 18–19 KB | dirs present | content ≈ same; **URL structure differs** |
| Orange EBC | `experience-design/orange-…/` | orange-business-ebc | same path | same path | aligned |
| Recruiters | 58,260 | Phase A template (NEW) | 58,260 NEW | 18,522 OLD | 🟢 CMS/disk NEWER than git |
| Contact | 30,399 modern | renderContact (modern) | 29,207 modern | 30,399 modern | CMS-current |
| Consulting | 18,434 | generic blocks | 18,383 | 18,434 | ≈ same |
| Essays/Journal | modern | renderArticle (modern) | modern | modern | CMS-current |
| Search/Sitemap/Privacy/Terms/404 | present | generated | present | present | ≈ same |

## 07 FRONTEND vs CMS MATRIX (verdict)

- **SAME (content-current):** Home, Story, Experience, Contact, Consulting, Orange EBC, essays/journal, search/legal/404. Byte differences = asset-version hash + analytics stamp only.
- **FRONTEND NEWER (real regression):** **Portfolio** (reel vs grid).
- **STRUCTURE CONFLICT:** Case studies + Experience — frontend uses clean directory URLs + redirect stubs; CMS emits flat root files. Same body content, different paths.
- **CMS NEWER:** Recruiters (Phase A) — protect it.
- **MISSING CMS representation:** the reel Portfolio and the clean-URL directory layout have no CMS renderer/template.

## 08 PORTFOLIO FORENSIC (version map)

- **VERSION A — NEW reel (current frontend):** `abhijeetvarghese/portfolio.html` + `git HEAD`; sha256 `d3fd3d39cf105c27`; 41,360 B; mtime 2026-09-07 21:17; title "…Creative Director Portfolio"; loads `portfolio-reel.css/js?v=2.5.0-reel`; 125 modern markers, `#film`, `data-pf-chapter` ×9. Git history: commits `1a05401 Rebuild Portfolio case studies as one card component…`, `bdf88e1 Fix portfolio film…tiny frame`, `2c10584 Organic SEO layer`, `49a09a3 Second SEO pass`.
- **VERSION B — OLD CMS grid (currently served):** `public_html/site/portfolio.html` + 3 deployment snapshots; sha256 `9f3bc20c311bcb1e`; 27,445 B; generated 22:50 by `renderPortfolio()`; `portfolio-page` body class; **0** reel references.
- Assets `portfolio-reel.css/js` exist in all locations but are **only linked by Version A**; Version B never includes them.

**It was not deleted — it stopped being published.** The reel file still exists in source and git; the publisher simply cannot emit it.

## 09 PORTFOLIO RECOVERY STATUS
**Fully recoverable.** No fabrication needed. Source of truth = `abhijeetvarghese/portfolio.html` (== `git HEAD`). Dependencies (`portfolio-reel.css/js`, `assets/*`) are present in `site-template/` and deployed. Two recovery paths (choose, don't execute yet): (a) treat reel as a static/passthrough page like the frontend, or (b) build a `Portfolio reel` CMS template + renderer (consistent with Phase A registry) so the publisher reproduces it. See §24.

## 10 RECENT FILE TIMELINE
| mtime | event |
|---|---|
| 21:17:46 | New frontend `abhijeetvarghese/` + `avos-data/site.json` (old CMS seed) placed |
| 21:20:34 | `site-template/css|js/portfolio-reel.*` synced in via `sync-frontend.php` (assets only) |
| 22:42:00 | `PublishEngine.php` last edited (Phase A) |
| **22:50:49** | **Phase A force-publishes → `public_html/site/*` regenerated from CMS; Portfolio reverts, clean-URL dirs removed** |

The old Portfolio replaced the new at ~22:50, driven by the force-publish, not by a code change to Portfolio.

## 11 GIT HISTORY FINDINGS
- Branch `main` (HEAD `f21d793`) contains the NEW portfolio and the NEW committed `public_html/site/` mirror. `origin/main` identical for portfolio.
- `origin/hostinger` portfolio = empty/absent (`e3b0c442…`) — older deploy branch; do not treat as current.
- `origin/staging-react-vite` (last commit 2026-09-04) is a **React/Vite rewrite of the ADMIN only** (`admin/src/*.tsx`); it is **not** a newer public website.
- Working tree: 36 modified, 91 deleted (all under generated `site/`), 10 untracked (Phase A files). No stash.

## 12 ASSET FORENSICS
- Global `styles.css`/`main.js`/`tokens.css`: **byte-identical** across frontend, `site-template`, and deployed site → design system intact.
- Reel assets present + identical in all three locations; deployed pages simply don't link them (except Recruiters' own assets).
- Case-study media: BPCL has **83 files** under `abhijeetvarghese/case-studies/bharat-petroleum-corporation-limited/assets/` (the on-disk clean-URL copies show deleted in `site/`, but the flat CMS page + frontend source retain media). Orphaned? No — they belong to the clean-URL frontend pages that still exist in source/git.

## 13 PUBLISH PIPELINE TRACE
```
DB content_store.pages[p-portfolio] (template="Portfolio", blocks=0)
  → POST /api/publish or cron auto-publish.php
  → PublishEngine::publish() → buildSite()
  → renderPage(page) → TemplateRegistry::page("Portfolio") → renderer renderPortfolio()
  → emits OLD grid markup (no portfolio-reel), flat case-study URLs
  → writes staging dir → atomic rename over public_html/site/
  → public_html/site/portfolio.html = 27 KB OLD ; clean-URL dirs not emitted
  → router serves old page to browser
```

## 14 EXACT OVERWRITE MECHANISM
**Generic/stale renderer + full-site regeneration.** Not a silent fallback (Phase A already loud-fails unknown templates) and not auto-publish-on-save. The mechanism is: a **known but outdated** dedicated renderer (`renderPortfolio`) regenerates the page from old CMS data on **every full publish**, and `buildSite()` rebuilds the entire `site/` tree (so the frontend's clean-URL directories, which the publisher doesn't model, are wiped). My Phase A **force-publish** one-liner invoked `PublishEngine::publish()` three times at 22:50, performing the overwrite. The atomic swap is working as designed — the problem is purely that the CMS renderer + URL model lag the frontend for Portfolio/case-study paths.

## 15 DUPLICATE / SOURCE-OF-TRUTH MAP
| Representation | Path | Authoritative for… | Generated? | Risk |
|---|---|---|---|---|
| Frontend source | `abhijeetvarghese/*.html` + dirs | **Design + page markup (NEW baseline)** | source | low (committed) |
| Frontend assets | `abhijeetvarghese/{css,js,assets}` | design system | source | low |
| CMS content | DB `content_store`, `avos-data/site.json` | copy/SEO/nav/settings | source for content | stale for Portfolio |
| CMS renderer | `backend/publish/PublishEngine.php` | page HTML generation | code | Portfolio stale |
| Templates | `backend/publish/templates/` | static dedicated pages (Recruiters) | code | none yet for reel |
| Template assets | `site-template/` | publish-time css/js/assets | copied by `sync-frontend.php` | assets OK |
| Generated site (disk) | `public_html/site/` | what is served | **generated** | **gets overwritten** |
| Deploy snapshots | `storage/deployments/*` | rollback | generated (gitignored) | currently all OLD |
| Committed site mirror | `git HEAD:public_html/site/` | intended live baseline | snapshotted | holds NEW (recover) |

**Overwrite rule that must hold:** frontend/source may overwrite CMS via explicit porting; CMS may **not** silently overwrite the frontend or the committed new site mirror.

## 16 RECRUITERS REFERENCE STATUS
Intact and NEW on disk (58 KB cinematic Phase A renderer). 13 acts, 10 AI `data-node`s, AVGC-XR phrase present, BPCL/Orange/Army, FAQ, JSON-LD, `for-recruiters.css/js`, reduced-motion/a11y verified earlier. **Not modified in this investigation.** Note: git still holds the *pre*-Phase-A 18.5 KB version — ensure the new one is committed before any reset/checkout so it is not lost.

## 17 AUTOMATIC OVERWRITE RISKS
| Trigger | Command/Path | Files affected | Behavior |
|---|---|---|---|
| Cron live-sync | `php backend/scripts/auto-publish.php` (runs `PublishEngine::publish()` when content hash changes) | all of `public_html/site/` | re-renders from CMS → would re-overwrite Portfolio/clean URLs |
| Manual/force publish | `POST /api/publish` or bootstrap `(new PublishEngine(ContentStore::all()))->publish()` | all of `public_html/site/` | same overwrite |
| Canonical restore | `php backend/scripts/restore-canonical.php` | DB content_store from `avos-data/site.json` | resets CMS content to seed (stale Portfolio) |
| Frontend asset sync | `php backend/scripts/sync-frontend.php` | `site-template/{css,js,assets}` only | **safe** — never touches HTML; locked; content-owned excluded |

**Currently running:** only the dev `php -S` server (no cron, no watcher active). So no overwrite is happening *now*, but the latent capability exists.

## 18 CURRENT SOURCE OF TRUTH BY PAGE
- **Design/markup = FRONTEND** (`abhijeetvarghese/`) for all pages (it is the newest).
- **Content/copy/SEO/nav = CMS** (and it is current for everything except Portfolio).
- **Per page truth:** Portfolio → frontend (CMS stale). Case-study/Experience routing → frontend clean-URL (CMS flat). Recruiters → CMS Phase A template (newer than committed). All others → effectively in sync; CMS render is authoritative at publish time.

## 19 FILE HASH MATRIX
| Artifact | Frontend/source | On-disk site | Git-committed site |
|---|---|---|---|
| portfolio.html | `d3fd3d39` (41,360) | `9f3bc20c` (27,445) | `d3fd3d39` (41,360) |
| portfolio-reel.css | `b6e6eeaf` (40,161) | `b6e6eeaf` | — |
| portfolio-reel.js | `dab4e913` (19,063) | `dab4e913` | — |
| styles.css | `cf9746d3` | `cf9746d3` | — |
| main.js | `015aed0a` | `015aed0a` | — |
| for-recruiters.html | 58,260 | `083f8049` (NEW) | `a7ed366b` (OLD 18.5 KB) |

(Prefix = first 12–16 hex chars of sha256.)

## 20 WHAT IS MISSING
- A CMS **reel Portfolio** template/renderer (so the publisher can emit the 41 KB page).
- Publisher support for the frontend's **clean directory URL** layout + redirect stubs (case studies, Experience).
- The on-disk `public_html/site/` is missing the new Portfolio and the clean-URL directory trees (they exist in source/git, not on the served tree).

## 21 WHAT IS STALE
- `PublishEngine::renderPortfolio()` (old grid; no reel).
- CMS Portfolio record + `avos-data/site.json` Portfolio (`template=Portfolio`, no reel awareness).
- Working-tree `public_html/site/` (generated from stale renderers).
- Deployment snapshots (all old).

## 22 WHAT MUST BE PRESERVED (do-not-touch)
- `abhijeetvarghese/` entire tree (source of new design).
- Git committed state — especially `HEAD:public_html/site/` (new mirror) and do not overwrite with a new publish commit.
- `site-template/{css,js}/portfolio-reel.*`, `for-recruiters.*`.
- Phase A: `TemplateRegistry.php`, `backend/publish/templates/for-recruiters.html`, the on-disk generated `for-recruiters.html` (newer than git — **commit it**).
- DB + `avos-data/site.json` (as-is until strategy approved).

## 23 WHAT CAN SAFELY BE MIGRATED (frontend → CMS)
- The reel Portfolio: add a registered `Portfolio reel` (or static passthrough) so the publisher reproduces `d3fd3d39…`.
- Clean-URL routing: make the publisher emit directory `index.html` pages + canonical stubs for case studies/Experience (matching frontend), or align `.htaccess` rewrites.
- Nothing should be migrated CMS → frontend.

## 24 RECOMMENDED RECOVERY PLAN (Portfolio)
1. **Freeze:** do not run `publish`, `auto-publish`, or `restore-canonical` until protected (§26).
2. Commit/preserve the current good artifacts: tag the frontend source; note that `git HEAD` already has the new Portfolio and new site mirror. **Commit the new on-disk `for-recruiters.html` + Phase A files first** so that work is not lost.
3. Choose render strategy for Portfolio:
   - **Option A (fastest, lowest-risk):** treat the reel as a **static passthrough** — copy `abhijeetvarghese/portfolio.html` into `backend/publish/templates/portfolio-reel.html`, register a `Portfolio reel` template that the publisher serves verbatim (like Recruiters), wired with `{{PAGE_CSS}}/{{PAGE_JS}}` for `portfolio-reel.css/js`. Publisher then emits the exact new page.
   - **Option B (content-managed):** build a reel renderer driven by CMS project data; larger effort, do later in Phase B.
4. Reconcile URLs so the served routes match the frontend (directories + stubs).
5. After implementation, verify: published `portfolio.html` sha256 matches the reel page, reel assets 200, case/clean URLs 200, and re-run the Playwright + axe + 3×publish SHA stability checks.

## 25 RECOMMENDED CMS SYNCHRONIZATION PLAN
Direction is **frontend → CMS only**. (a) Port the reel Portfolio into the template registry/renderer. (b) Teach the publisher the clean-URL layout (or standardize on one URL scheme and update `.htaccess`). (c) Re-seed nothing; leave DB content as-is (it is current except Portfolio, which will become template-driven). (d) Keep `sync-frontend.php` as the asset path (already safe). Never run `restore-canonical.php` to "fix" the site (it loads the stale seed).

## 26 TARGET ARCHITECTURE
Every bespoke page lives as a **registered template** in `TemplateRegistry` with its page-scoped assets declared in the manifest; the publisher renders from canonical templates + current CMS content; URL model matches the frontend (clean directories + canonical stubs); `sync-frontend.php` continues to own css/js/assets; the committed `public_html/site/` mirror always reflects the newest approved publish.

## 27 MIGRATION ORDER
1. Commit/protect current work (esp. new Recruiters + Phase A). 2. Disable/guard auto-publish during the work window. 3. Recover Portfolio (Option A static template). 4. Align clean-URL routing. 5. Verify (hashes, routes, a11y, browser, 3×publish stability). 6. Commit the regenerated `public_html/site/` as the new baseline. 7. Only then consider Phase B content-managed renderers.

## 28 SAFETY CHECKLIST (before any write)
- [x] Read-only investigation complete; nothing published/changed/deleted.
- [ ] Stop/disable `auto-publish.php` cron during changes.
- [ ] Commit Phase A + new Recruiters so they are in git before any reset.
- [ ] Tag/branch the current `abhijeetvarghese/` frontend baseline.
- [ ] Do not run `restore-canonical.php`.
- [ ] All CMS work tested via preview before publish; publish output SHA-verified against frontend.

## 29 FILES THAT MUST NOT BE TOUCHED (now)
- `abhijeetvarghese/**` (source), `avos-data/site.json`, the DB `content_store`,
- `avos-php/public_html/site/**` on-disk (leave until recovery ready — it's the served tree),
- `site-template/{css,js}/portfolio-reel.*`, `for-recruiters.*`,
- `backend/publish/templates/for-recruiters.html`, `TemplateRegistry.php` (no further edits without approval).

## 30 FILES THAT WILL EVENTUALLY NEED MIGRATION (frontend → CMS)
- New: `backend/publish/templates/portfolio-reel.html` (from `abhijeetvarghese/portfolio.html`) + registry entry + asset manifest.
- `PublishEngine.php`: a reel dispatch + clean-URL output for case studies/Experience (Phase B).
- Routing/`.htaccess`: clean-URL alignment.
- Regenerated `public_html/site/**` to be committed as the new baseline only after verification.

## 31 FINAL RECOMMENDATION
**Status is AT RISK but fully recoverable — nothing newer was destroyed.** The new reel Portfolio and the entire newest frontend are safe in `abhijeetvarghese/` and in `git main`; the regression is confined to the regenerated on-disk `public_html/site/`, caused by an **outdated `renderPortfolio()` renderer + full-site publish** that my Phase A force-publish triggered. Do **not** re-publish or restore-from-CMS. Protect the frontend baseline, commit the newer Recruiters/Phase-A work, then bring the CMS *up to* the frontend — starting with the reel Portfolio as a registered static template — and align the clean-URL routing, verifying by hash and browser before committing a new published baseline.
