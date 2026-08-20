# STAGING DEPLOYMENT — hostinger BRANCH (next.abhijeetvarghese.com)

## Result: FRONTEND LIVE + VERIFIED · PHP BACKEND DEPLOYED (AWAITS STAGING DB CREDS)

The existing `hostinger` branch (auto-deployed by Hostinger to `next.abhijeetvarghese.com`)
now contains the complete React + TypeScript + Vite staging build + PHP backend.

---

## 1. Old hostinger SHA
`df638bd81be23928e63990a4b870ab5092b656b0` (legacy flat frontend)

## 2. New hostinger SHA
`722e5f085e56e5d83ab9cb26bebfe2fda5609bcc`

## 3. main SHA before/after
`4f7d5e9f18ea5f98f33f45b51316dff7e0dd2125` — **UNCHANGED**

## 4. staging-react-vite SHA
`35f1dafee4744187473d7b9f08b584464961dd4d` — **UNCHANGED**

## 5. Exact package deployed (flat web root = branch root)

```
(hostinger branch root → /public_html/next/ web root)
├── .htaccess              hardened staging (blocks .git/dotfiles/backend/includes/database/storage/config)
├── index.html · 404.html · all 25 route HTML (flat)
├── assets/                hashed Vite JS/CSS
├── experience-design/     Orange EBC nested route
├── robots.txt             Disallow: /  ·  sitemap.xml · search-index.json
├── admin/  api/  install/  media.php      ← PHP public entry points
├── backend/  includes/  database/  site-template/  storage/   ← PRIVATE (403-blocked)
```
`config.local.php`, `.env`, `node_modules`, source files, `css/`, `js/` (legacy) — all absent.

## 6. GitHub Action run ID
**None** — pushing `hostinger` directly does not trigger any workflow (verified: the only
workflows fire on `main`/`staging-react-vite`). Deployment is via Hostinger's own Git
integration, which auto-pulled the branch.

## 7. GitHub Action result
N/A (no run triggered by the `hostinger` push — correct and intended).

## 8. Hostinger deployment result
**SUCCESS** — the live site changed from legacy (`css/styles.css?v=2.4.20-skill02`) to the
React/Vite build within minutes of the push.

## 9. Live staging URL
`https://next.abhijeetvarghese.com` — serving React/Vite (`data-page="home"`, hashed assets).

## 10. 25-route result — PASS
All 24 tested routes → 200 (home, story, experience, portfolio, case-studies, contact,
consulting, recruiters, insights, journal, search, sitemap, privacy, terms, 404, 2 coming-soon
case studies, 4 essays, 2 journal articles, Orange EBC nested route). Redirect stub → 301.
Unknown route → designed 404.

## 11. Backend API result — DEPLOYED, AWAITING STAGING CREDENTIALS
`/api/site` returns: `AV OS is not configured for production — database credentials not
configured — AV_ENC_KEY must be set`. This is **correct and safe**: the backend refuses to run
until staging MariaDB + `config.local.php` + `AV_ENC_KEY` are provisioned on Hostinger.
(The repo contains no staging DB credentials, and none were invented, per instruction.)
Locally (with a test DB) the same flat layout verified: `/api/site` OK, `/api/public/lead`
persists, admin login renders, honeypot spam-drop, empty-name → 422.

## 12. Admin result — DEPLOYED, AWAITING CREDENTIALS
`/admin/` returns 500 for the same reason (no DB config). Login page renders correctly when a
DB is present (verified locally). The admin is PHP, unchanged.

## 13. MariaDB result — STAGING DB NOT YET CONFIGURED
Staging must be pointed at a dedicated staging MariaDB (never production). This is a
Hostinger-side step requiring credentials I do not have and must not invent.

## 14. Booking result — FRONTEND LIVE, BACKEND AWAITING DB
Contact form (Name · Mobile Number · Email ID · Message · Calendar · Time Slot · Submit) is
live and spec-exact (no Organization). Submission posts to `/api/public/lead` (pending-approval,
no false confirmation), but persistence requires the staging DB (see §13).

## 15. Security result — PASS
`/.git/config`, `/.git/HEAD`, `/config.local.php`, `/config.php`, `/.env`,
`/backend/config/config.php`, `/includes/bootstrap.php`, `/database/migrate.php`, `/storage/`,
`/site-template/…`, `/schema.sql` — **all return 403**. No directory listing, no secret leak.

## 16. SEO result — PASS (staging isolation)
Every page: `noindex, nofollow`. `robots.txt`: `Disallow: /`. Canonicals still point to
production (`abhijeetvarghese.com`). Staging cannot compete with production SEO.

## 17. Production safety confirmation — UNTOUCHED
- `main` unchanged (`4f7d5e9`) · `staging-react-vite` unchanged (`35f1daf`)
- `abhijeetvarghese.com` is a **WordPress** site (separate stack), not the AV OS static site —
  completely untouched by this git push.
- `hostinger` was the only ref changed (as instructed), via `--force-with-lease`.
- Legacy `abhijeetvarghese/` still present in the repo.

## 18. Rollback command
```bash
# restore the previous hostinger content (legacy frontend)
git push https://github.com/Abhijeet-Varghese/abhijeet-varghese-website.git \
  hostinger-backup-2026-08-21:hostinger --force
```
Backup tag `hostinger-backup-2026-08-21` → `df638bd` (pushed to remote).

---

## Design / visual fidelity
Preserved exactly (this was architecture + deployment only): Deep Navy / Warm Paper / Azure,
Inter Tight + Instrument Serif, Arena hero, outlined Varghese, portrait, marquee, cap stack,
glass case panels, journey, Evolution (`about-evo3d__card`/`about-evo3d__stage` present), Orange
case-study design. The pushed build is byte-identical to the 0-RMSE-verified build except the
staging robots meta.

## Remaining Hostinger-side steps (require your hPanel — cannot be done from here)
1. Create a **staging MariaDB** (separate from production) + run `database/migrate.php`.
2. Create `config.local.php` at the account root with staging DB creds + `AV_ENC_KEY` (32+ chars)
   + `$siteUrl = 'https://next.abhijeetvarghese.com'`.
3. Re-verify `/api/site`, `/admin/`, and lead persistence once the DB is live.
