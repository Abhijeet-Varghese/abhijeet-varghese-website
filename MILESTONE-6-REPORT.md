# MILESTONE 6 — STAGING CUTOVER

> **Status: COMPLETE (code + verification).** The PHP publishing pipeline now
> consumes the React/Vite build as its official frontend source, proven
> independent of the legacy `abhijeetvarghese/` directory. **Production NOT deployed.**

---

## OLD PIPELINE

```
CMS (MariaDB content_store)
   ↓
PublishEngine (PHP) — renders ALL 25 HTML pages itself
   + syncMedia() copies css/js/assets from AV_TEMPLATE (site-template/)
   ↑  sync-frontend.php copies css/js/assets from AV_FRONTEND_DIR (abhijeetvarghese/)
   ↓
public_html/site/
```

The legacy pipeline had **two** frontend responsibilities: (1) PHP-rendered HTML
from CMS, and (2) asset sync from `abhijeetvarghese/` → `site-template/` → publish.

## NEW PIPELINE

```
CMS (MariaDB content_store)
   ↓  export-snapshot.php  (published-only JSON — Phase 4 contract)
frontend/src/content/*.ts   (typed snapshot, committed)
   ↓  npm run build          (build-time only — NOT on Hostinger)
frontend/dist/                (complete static site, 25 routes)
   ↓  PublishEngine::publishViteBuild()  (validate → atomic swap → verify → rollback)
public_html/site/
```

Vite owns all 25 public routes; `/api/*`, `/admin/*`, `/install/*`, `/media/*`
remain PHP. No SSR, no Node on Hostinger, Vite is build-time only.

## AV_FRONTEND_DIR — dependencies removed

| Consumer | Change |
|---|---|
| `config.php` | added `AV_VITE_DIST` + `AV_FRONTEND_MODE`/`AV_VITE_MODE` (auto-detect) |
| `PublishEngine::publish()` | delegates to `publishViteBuild()` in Vite mode |
| `PublishEngine` (new) | `publishViteBuild()`, `validateViteBuild()`, `verifyVitePublishedSite()`, `viteRouteFiles()`, `viteCounts()` |
| `sync-frontend.php` | Vite mode → clean no-op (assets ship in the Vite build) |
| `auto-publish.php` | Vite mode → skips the frontend-sync step |
| `doctor.php` | Vite mode → checks `AV_VITE_DIST` instead of template/frontend-source |
| `ApiController::syncFrontend()` | Vite mode → success no-op |
| `ApiController::systemDoctor()` | Vite mode → checks Vite build |

## REACT/VITE SOURCE

`frontend/dist/` (env `AV_VITE_DIST`), produced by `npm run build`. The typed
snapshot (`frontend/src/content/*.ts`) is the build-time content input; the new
`export-snapshot.php` defines the CMS → snapshot hand-off contract.

## PUBLISH ENGINE

`publishViteBuild()` copies `frontend/dist` → staging, validates (25 routes +
hashed CSS/JS present + no PHP/legacy leakage), runs `internalLinkCheck`, atomically
swaps into `public_html/site/`, verifies (key routes + hashed assets), and
auto-rolls-back on failure — identical safety machinery to the legacy path.
`publish()` auto-delegates; legacy renderers kept for fallback.

## BACKEND — PHP 8.x + MariaDB

Booted **PHP 8.4 + MariaDB 11.8** in the sandbox; ran `migrate.php --fresh` (27
migrations), `restore-canonical.php` (CMS seed), `doctor.php`. Verified live:
`GET /api/site` (CMS read), `POST /api/public/lead` (lead persisted to MariaDB:
`id=1 status=new score=65`), honeypot spam-drop, empty-name → 422. **No backend
functionality regressed.** The only pre-existing note: `GET /api/public/availability`
returns 404 (never existed in the route map — documented since M1).

## BUILD — clean

`npm ci` (0 vulns) → `npm run build` → 25 routes reproduced. PHP publish consumes
that `dist/` and emits a byte-identical `public_html/site/`.

## LEGACY ISOLATION TEST — **PASS**

Moved `abhijeetvarghese/` → `/tmp` (not deleted). With it absent:
- `doctor.php` → **PASS** (Vite build)
- `publish()` → **OK** (13 pages + 6 articles, mode=vite)
- `sync-frontend.php` → clean no-op (not "frontend dir not found")
- `export-snapshot.php` → snapshot written (6 published articles only — the 2
  draft/review articles correctly excluded)

Restored `abhijeetvarghese/` afterwards; legacy mode (`AV_FRONTEND_MODE=legacy`)
still works end-to-end (backward compatible).

## STAGING

No external staging URL is available in this sandbox (requires Hostinger
`next.abhijeetvarghese.com` + credentials). The equivalent staging verification —
PHP server (port 8092) serving the **published** Vite site + live API/MariaDB —
passed: `/` serves React HTML, `story.html`/orange = 200, unknown = designed 404,
lead API + honeypot + validation all correct.

## 25-ROUTE REGRESSION — **PASS**

All 25 routes present in the published `public_html/site/` (and in `frontend/dist/`);
288-check responsive sweep (M5, unchanged build) = 0 overflow / 0 console / 0 network
errors.

## VISUAL QA — **PASS** · SEO — **PASS** · ACCESSIBILITY — **PASS** · SECURITY — **PASS**

Published site is byte-identical to `frontend/dist` (copyDir), which was verified
pixel-identical (0 RMSE) to production in M5. SEO/a11y/secret-scan results carry
forward unchanged (see MILESTONE-5-REPORT.md).

## BOOKING — **PASS**

`POST /api/public/lead` → MariaDB (`status=new`) → pending approval (backend state
unchanged). Honeypot → spam drop; validation → 422. No Calendly, no client secrets.
No real calendar/email events fired (staging/test data only).

## HOSTINGER — **PASS**

Published output is pure static HTML/CSS/JS/assets (no Node, no npm, no persistent
process). PHP serves `/api/*` + `/admin/*`. `.htaccess` provides Brotli/Gzip,
immutable caching, designed 404, legacy redirect.

## ROLLBACK — **PASS**

Atomic swap + auto-rollback preserved; `AV_FRONTEND_MODE=legacy` flips back to the
pre-migration pipeline with no code change. Documented in `PIPELINE-CUTOVER.md`.

## LEGACY FRONTEND

**SAFE TO REMOVE** (in Vite mode) — proven by the isolation test. **Kept in this
commit** (legacy fallback + gated behind staging deployment). Removal is a separate
controlled commit for the next stage.

## PRODUCTION

**NOT DEPLOYED.** `public_html/site/` reverted to its committed state (per spec:
"do not modify public_html/site/"). No DNS, credential, or GitHub-deploy changes.

## FINAL GO / NO-GO

**GO FOR STAGING DEPLOYMENT** — the code cutover is complete and verified; the
pipeline is proven independent of the legacy frontend.

Two non-blocking notes carried into staging:
1. `export-snapshot.php` defines the CMS→Vite contract, but the committed
   `frontend/src/content/*.ts` is still the build-time source of truth — wiring the
   snapshot file into the build (regenerate TS/JSON content from the export) is a
   follow-up, not a blocker (the snapshot already matches the committed content).
2. Physical removal of `abhijeetvarghese/` + `site-template/` is deferred to the
   post-staging-QA controlled commit.
