# LEGACY FRONTEND REMOVAL — REPORT

## Result: legacy frontend REMOVED (repo) · deployment already clean · backend live-tests BLOCKED (no DB)

The React/Vite staging site is already live and serving **zero** legacy resources.
The legacy frontend source (`abhijeetvarghese/`) has been removed from the
`staging-react-vite` branch (commit `b8ecdbd`). No backend, admin, API, booking,
or DB code was touched.

---

## 1 · Exact files/folders DELETED (git rm -r)

**`abhijeetvarghese/` — 97 files** (the entire legacy frontend):

- 25 legacy HTML pages (`index.html`, `story.html`, `experience.html`,
  `portfolio.html`, `case-studies.html`, `contact.html`, `consulting.html`,
  `for-recruiters.html`, `insights.html`, `journal.html`, `search.html`,
  `sitemap.html`, `privacy-policy.html`, `terms.html`, `404.html`, 3 × case-study,
  4 × essay, 2 × journal, `experience-design/orange-business-executive-briefing-center/index.html`)
- `css/` (`styles.css`, `tokens.css`, `orange-business-case-study.css`)
- `js/` (`main.js`, `orange-business-case-study.js`)
- `assets/` (fonts, logos, about/, media/, journal/, essay-*, hero-portrait, resume)
- `.htaccess`, `robots.txt`, `sitemap.xml`, `search-index.json`

## 2 · Exact files/folders RETAINED

| Path | Reason |
|---|---|
| `frontend/` | NEW React + TypeScript + Vite build (authoritative frontend) |
| `avos-php/backend/` `includes/` `database/` `storage/` | PHP engine (controllers/models/services/auth/CSRF/migrations) |
| `avos-php/public_html/admin/` `api/` `install/` `media.php` | PHP public entry points |
| `avos-data/site.json` | CMS published-content seed |
| `design-system/` `tests/` `.claude/` `.github/` | tooling / docs (not frontend) |

## 3 · Backend dependency map

| Item | Class | Verdict |
|---|---|---|
| `abhijeetvarghese/` (path) | legacy frontend source | **REMOVED** |
| `AV_FRONTEND_DIR` fallback `dirname(AV_ROOT).'/abhijeetvarghese'` | legacy-mode only | guarded by `AV_VITE_MODE` — never runs in vite mode; harmless dangling path |
| `sync-frontend.php` / `auto-publish.php` / `doctor.php` | legacy template sync | vite-mode early-return (verified) |
| `avos-php/site-template/` (68 files) | legacy css/js/assets template | **KEEP for now** — referenced by `AV_TEMPLATE`; unused in vite mode; flag for follow-up removal |
| `avos-php/public_html/site/` (97 files) | legacy published HTML output | **KEEP for now** — also the `AV_SITE_OUT` destination (recreated at publish); flag for follow-up |
| `.github/workflows/deploy-staging.yml` | legacy frontend-sync workflow | **KEEP for now** — main-only rollback; ⚠️ landmine (would overwrite hostinger with legacy on a `main` push); flag for retirement on `main` |
| `tests/coming_soon_case_qa.py` | legacy test reading `abhijeetvarghese/` paths | **KEEP (now moot)** — dev-only test, not deployed |

## 4 · Admin test results — **NOT TESTED (BLOCKED)**

`/admin/` returns 500 because the backend has no DB config yet
(`AV OS is not configured for production`). No Hostinger access from this
environment to provision the staging DB. Not fabricated.

## 5 · API test results — **NOT TESTED (BLOCKED)**

`/api/site` → "database credentials not configured". Local (test DB) verification
of the same code is green: `/api/site` JSON, `/api/public/lead` persists, empty
name → 422, honeypot → spam-drop.

## 6 · Booking test results — **NOT TESTED (BLOCKED)**

Same root cause (no staging DB). Flow is code-verified locally; provider OAuth
(Google/Microsoft) is **NOT IMPLEMENTED** in this backend (unchanged, reported
across prior milestones).

## 7 · 25-route frontend test results — **PASS (live)**

All 24 tested routes → 200 on `next.abhijeetvarghese.com`; redirect stub → 301;
unknown → designed 404. Live site serves hashed Vite assets with `data-page`,
zero legacy `css/styles.css` / `js/main.js` references.

## 8 · Security test results — **PASS (live)**

`/.git/config`, `/config.local.php`, `/config.php`, `/backend/…`, `/includes/…`,
`/database/…`, `/storage/…`, `/site-template/…`, `/schema.sql` → **all 403**.

## 9 · Git commit SHA

`b8ecdbd` — `refactor: remove legacy frontend after React migration`
(97 deletions, on `staging-react-vite`; **not force-pushed**, `main` untouched)

## 10 · Deployment SHA

`hostinger` branch = `722e5f0` (React/Vite + PHP backend; **no legacy frontend**).
Unchanged this pass — already clean.

## 11 · Production untouched

`main` = `4f7d5e9` (unchanged) · `abhijeetvarghese.com` is a separate WordPress
site (untouched) · production DB untouched · legacy `abhijeetvarghese/` remains in
git history (recoverable via the pre-removal commit `b8ecdbd^`).

## 12 · Zero legacy frontend in use

**Confirmed.** Live homepage loads only `assets/*.{js,css}` (hashed Vite) — no
`css/styles.css`, no `js/main.js`, no legacy asset paths. The React/Vite build is
the sole frontend.

---

## Honest caveats (not fabricated)

- **Live admin / API / booking tests are BLOCKED** — the staging backend has no
  DB/`AV_ENC_KEY` configured, and this environment has no Hostinger access to
  provision them (see `STAGING-BACKEND-RUNBOOK.md` for the exact hPanel steps).
- **`site-template/`, `public_html/site/`, and the legacy workflow remain** in the
  repo — they are backend-adjacent / main-only and I removed only what is proven
  safe without live-backend verification. They are flagged above for a follow-up
  removal once the backend is confirmed live.
