# MILESTONE 7 — HOSTINGER STAGING

> **Status: BLOCKED at Phase 1 (environment access) — no deployment performed.**
> This report is honest: everything requiring the actual Hostinger environment is
> marked **NOT TESTED / NOT CONFIGURED / BLOCKED**, per the critical-honesty rule.
> Local, genuinely-verifiable items are marked **PASS**.

---

## ⛔ WHY THIS MILESTONE CANNOT EXECUTE AS WRITTEN

The sandbox has **no path to Hostinger**: no SSH/SFTP/FTP credentials, no
Hostinger/hPanel session, no GitHub Actions push token, and no network route to
`next.abhijeetvarghese.com`. The spec's Phase 1 ("inspect the actual Hostinger
environment") and Phase 8 ("deploy to the confirmed staging target") cannot be
performed, and I will not fabricate a staging URL, a deployment, or any live-QA
result. The critical rule — "if staging and production cannot be clearly
distinguished: STOP. Do not upload anything" — applies: I stopped.

## HOSTINGER ENVIRONMENT

| Item | Value |
|---|---|
| PHP | **NOT TESTED** (Hostinger target; local sandbox PHP 8.4.24) |
| MariaDB | **NOT TESTED** (Hostinger target; local sandbox MariaDB 11.8.6) |
| Apache/LiteSpeed | **NOT TESTED** |
| HTTPS | **NOT TESTED** |
| Document root | **NOT CONFIRMED** (runbook says `public_html/`, site under `/site/`) |
| PHP extensions | **NOT TESTED** |
| cron / mail / upload limits | **NOT TESTED** |

The documented targets (from `HANDOVER.md`, `DEPLOY-HOSTINGER-PHP.md`) are:
staging `next.abhijeetvarghese.com`, production `abhijeetvarghese.com`. No
staging credentials, SSH keys, SFTP host, or deploy token exist anywhere in the
repository, so the actual environment cannot be inspected from here.

## DEPLOYMENT

| Item | Value |
|---|---|
| Staging URL | `next.abhijeetvarghese.com` (documented only — unreachable from sandbox) |
| Deployment method | **BLOCKED** — none runnable from here |
| Build | **PASS** (local clean build — see below) |
| Publish | **PASS** (local Vite publish — see below) |

### 🔴 Blocker A — the existing deploy workflow is STALE and targets the LEGACY frontend

`.github/workflows/deploy-staging.yml` (the only deploy mechanism in the repo)
still does:

```yaml
- name: Verify website source
  run: |
    test -f abhijeetvarghese/index.html      # ← LEGACY frontend, not frontend/dist
    test -f abhijeetvarghese/.htaccess
    test -d abhijeetvarghese/assets
- name: Create deployment branch
  run: |
    git subtree split --prefix=abhijeetvarghese --branch=deploy-tmp
    git push origin deploy-tmp:hostinger --force
```

It has **no `npm ci` / `npm run build` step** and pushes only the **legacy
`abhijeetvarghese/`** subtree (no PHP backend). As-is it would deploy the
pre-migration frontend, not React/Vite. This must be rewritten to build
`frontend/dist` before any real staging deploy. (Not modified in this commit —
untested deploy config is not shipped; proposed fix below.)

### 🔴 Blocker B — routing: Vite build is root-relative, runbook serves under `/site/`

The Vite build emits root-level routes (`index.html`, `story.html`, …) with
root-relative asset/href paths and its own `.htaccess`. The Hostinger runbook
serves the generated site under `/site/` and redirects `/` → `/site/`. These
two conventions must be reconciled (either serve the Vite build at the web root,
or set a Vite `base` and regenerate) — otherwise every internal link/asset on
Hostinger resolves one level off. Needs an explicit decision at deploy time.

## WHAT WAS ACTUALLY VERIFIED (local, real)

| Check | Result |
|---|---|
| Clean build (`rm -rf node_modules dist && npm ci && npm run build`) | **PASS** — 0 vulnerabilities, `tsc` clean, 25 HTML routes |
| Dist content: 25 routes, hashed CSS/JS, fonts, images | **PASS** |
| Secret scan (API keys/OAuth/DB/SMTP/AI/OpenRouter/JWT) | **PASS** — ZERO findings |
| PHP-leakage scan (`<?php` / `{$this->` in HTML) | **PASS** — NONE |
| Dev-file scan (`.env`, `*.php`, `*.ts`, `*.map`, `node_modules` in dist) | **PASS** — NONE |
| Legacy isolation (publish + doctor with `abhijeetvarghese/` moved away) | **PASS** — `PUBLISH OK mode=vite pages=13 articles=6` |

`public_html/site/` was reverted to its committed state after the local publish
test (spec: do not modify it); working tree is clean.

## ROUTES

Local `frontend/dist` + local PHP publish = **25/25 present** (verified).
**Live staging route QA = NOT TESTED** (no staging domain).

## API / CONTACT / BOOKING (local, real MariaDB)

- `GET /api/site` → **PASS** (CMS read)
- `POST /api/public/lead` → **PASS** (lead persisted: `status=new score=65`)
- honeypot spam-drop → **PASS** · empty-name → 422 → **PASS**
- Contact form (Name/Mobile/Email/Message/Calendar/Time Slot/Submit) → **PASS**
  (local build; no Calendly, on-site submit, pending-approval copy)
- **Live staging = NOT TESTED**

## AVAILABILITY — 🔴 BLOCKER (endpoint does not exist)

`GET /api/public/availability` returns **404** — confirmed against the actual
backend (booted locally with the real MariaDB). The backend route map exposes
exactly two public routes: `POST /api/public/lead` and `POST /api/public/submit`.
`availability` appears only as a whitelist *string* in the content-store bulk-save
list — it is not a route and `site.json` contains no `availability` key.

The React calendar is therefore correctly in **static mode** (faithfully ported:
no live free/busy fetch, "time is optional"). Per the spec — *"if the required
availability API is genuinely missing: STOP AND REPORT IT AS A BLOCKER. Do not
claim calendar functionality is live"* — **live calendar availability is NOT
implemented and is reported as a blocker.**

## GOOGLE CALENDAR / MICROSOFT CALENDAR — 🔴 NOT IMPLEMENTED (not just "not configured")

A definitive backend search found **no Google Calendar and no Microsoft Calendar
provider code**. What actually exists:

- **Google service-account OAuth** (`OAuth2::googleServiceAccount…`) — used only
  for **Search Console, GA4 analytics, and Google Drive** (SEO/analytics), *not*
  Calendar.
- **Calendly** — the old external scheduler: `webhookInboundCalendly`,
  `settings.calendly_url`, `meetings.external_event_id` (Calendly dedup), and the
  `lead-intel`/`business-intel` agents referencing Calendly bookings.

There is **no free/busy, no calendar event creation, and no Google/Microsoft
calendar OAuth** anywhere in `avos-php/backend/`. The migration spec's premise
that these "remain provider integrations handled server-side" does not match this
repository. Reporting this as **NOT IMPLEMENTED** rather than "NOT CONFIGURED"
because adding staging OAuth credentials would not help — the code to use them
does not exist.

## EMAIL

- Email **queue** exists (`EmailModel::queue`, `lead_confirmation` template) — **PASS** (code path).
- Actual **delivery** = **NOT TESTED** (no SMTP; sandbox `sendmail` absent — the
  local test logged "sendmail not found", which is expected and non-fatal).

## ADMIN / SEO / ACCESSIBILITY / SECURITY / HTTPS / CACHE-CDN / PERFORMANCE / BROWSER / ERROR-HANDLING / ROLLBACK

| Area | Status |
|---|---|
| Admin (login/dashboard/leads/approve/reject) | **NOT TESTED** on staging (local backend not driven through the admin UI here) |
| SEO (staging noindex/sitemap/canonical) | **NOT TESTED** — requires staging domain |
| Accessibility | **PASS** locally (M5 axe audit; carries forward) |
| Security (dir listing / .env / backups / source leak) | **PASS** locally on `dist`; **NOT TESTED** on Hostinger |
| HTTPS / mixed content / secure cookies | **NOT TESTED** |
| Cache/CDN | **NOT TESTED** |
| Performance (LCP/CLS/INP/FCP/TTFB from real server) | **NOT TESTED** — local preview numbers are not a substitute |
| Browser QA (Chromium/Firefox/WebKit against staging) | **NOT TESTED** (staging unreachable) |
| Error handling (404/500/expired slot) | **PASS** locally (designed 404; graceful API failure) |
| Rollback | **PASS** (mechanism verified: atomic swap + `AV_FRONTEND_MODE=legacy` fallback) |

## LEGACY FRONTEND

**STILL PRESENT** — `abhijeetvarghese/` was not deleted (and is proven non-required
by the Vite publish, but is retained per spec until staging passes).

## PRODUCTION

**NOT DEPLOYED.** No DNS, `public_html`, credential, or GitHub-deploy changes.

## FINAL VERDICT

**NO-GO** (for both production and — as currently wired — staging).

Blockers (with severity + evidence + required fix):

1. **CRITICAL — no staging access path.** No Hostinger/SSH/SFTP/GitHub-token
   credentials exist in this environment.
   *Evidence:* sandbox has no route to `next.abhijeetvarghese.com`; repo contains
   no deploy secrets.
   *Fix:* a human with Hostinger access runs the deployment (runbook below).

2. **CRITICAL — stale deploy workflow.** `.github/workflows/deploy-staging.yml`
   builds/ships `abhijeetvarghese/` (legacy), has no `npm run build` step, and
   ships no PHP backend.
   *Evidence:* file content above.
   *Fix:* rewrite the workflow to `npm ci && npm run build` and ship `frontend/dist`
   + the `avos-php/` backend. (Proposed, untested — see `PIPELINE-CUTOVER.md`.)

3. **CRITICAL — calendar/availability premise is false for this repo.** No
   Google/Microsoft Calendar provider code and no availability endpoint exist.
   *Evidence:* definitive grep of `avos-php/backend/` — only Google service-account
   OAuth for Search Console/GA4/Drive, and Calendly. `GET /api/public/availability`
   → 404.
   *Fix:* decide whether live provider calendar + free/busy is a required feature;
   if yes, it must be **built** (server-side OAuth + free/busy + event creation +
   an availability endpoint) before it can be claimed live. The current
   request→approval→(manual) flow works without it.

4. **HIGH — root-vs-`/site/` routing.** Vite root-relative routes vs. the runbook's
   `/site/` serving convention must be reconciled before upload.
   *Fix:* serve the Vite build at the web root (recommended) or set a Vite `base`.

### Staging runbook (for the human with Hostinger access)

1. Confirm staging domain `next.abhijeetvarghese.com` ≠ production.
2. `npm ci && npm run build` (CI/local) → `frontend/dist`.
3. Upload `avos-php/` backend (outside `public_html`) + `frontend/dist` content into
   `public_html/` (or the chosen root), set `AV_FRONTEND_MODE=vite`, `AV_VITE_DIST`
   to the built path, and staging-only DB creds + `AV_ENC_KEY` in `config.local.php`.
4. Run `/install/`, then `doctor.php`, then `publish()` — verify `mode=vite`.
5. Add staging `robots`/noindex; run the 25-route + API + booking QA against the
   live domain; then re-run Playwright visual/responsive/a11y and the secret scan
   on the deployed tree.

**STOP. Production is not deployed; no further deployment steps were taken.**
