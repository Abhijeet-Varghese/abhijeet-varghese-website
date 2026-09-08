# AV OS on Hostinger Premium — Deployment Guide

Deploy the **static website** (`abhijeetvarghese/`) plus **AV OS** (admin + API) on
standard **Hostinger Premium shared hosting** — no VPS, no Node, no Docker.
Stack: static HTML/CSS/JS · PHP 8.x · MySQL/MariaDB · Apache/LiteSpeed.

> The website is hand-authored and served exactly as committed. AV OS does not
> generate, template or publish it — see `avos-php/docs/static-frontend.md`.

---

## What you are deploying

```
public_html/                        ← the ONLY web-accessible directory (= the website root)
├── index.html · story.html · portfolio.html · contact.html · …   ← STATIC WEBSITE (abhijeetvarghese/)
├── experience/ · case-studies/{,orange-business,indian-army,bharat-petroleum-corporation-limited}/
├── css/ · js/ · assets/ · sitemap.xml · robots.txt · search-index.json · 404.html
├── admin/
│   ├── login.php                   ← /admin (the CMS entry)
│   ├── change-password.php         ← forced first-login password change
│   └── app/                        ← AV OS admin app
├── api/
│   ├── index.php                   ← REST API front controller
│   └── .htaccess                   ← router + security headers
├── media.php                       ← serves private uploads at /media/…
├── install/                        ← first-run wizard (SELF-DISABLES)
└── .htaccess                       ← from avos-php/public_html/.htaccess: hardening + /media rewrite
                                       + the website's 301 map + cache rules (single web-root .htaccess)

OUTSIDE public_html (account root — NEVER upload these into public_html):
backend/        ← PHP engine: config, core, models, controllers, agents, scripts
includes/       ← bootstrap
database/       ← migrations + install.php (CLI installer)
storage/        ← uploads, cache, versions, logs, backups (private)
config.local.php← your secrets (DB credentials, AV_ENC_KEY, $siteDir) — NEVER commit
config.local.example.php
```

**Security by construction:** the entire PHP engine, storage and configuration
live OUTSIDE `public_html`. Only the static site, `admin/`, `api/`, `install/` and
`media.php` are public.

---

## Step 1 — Create the MySQL database

1. hPanel → **Databases → MySQL Databases**
2. Create a database (e.g. `u123_avos`) and a user with full privileges.
   Copy the host (usually `localhost`), database name, username and password.

## Step 2 — Upload the files

1. **Website** — push to `main`; `.github/workflows` subtree-splits `abhijeetvarghese/` to
   the `hostinger` branch, which Hostinger deploys to `public_html/`. (Manual alternative:
   upload the contents of `abhijeetvarghese/` into `public_html/`.)
2. **AV OS** — hPanel → **File Manager** → open `public_html`. Upload:
   - the **contents of** `avos-php/public_html/` into `public_html/` (`admin/`, `api/`,
     `install/`, `media.php`, and `.htaccess` — this `.htaccess` replaces the website's one;
     it contains the same redirect/cache rules plus the AV OS hardening)
   - `backend/`, `includes/`, `database/`, `storage/`
     into your account root (e.g. `home/u123456789/`) — **outside** `public_html`
3. Permissions: `storage/` and all subfolders **775** (uploads/cache/logs/backups
   must be writable by PHP).

## Step 3 — Configure secrets

1. In the account root, copy `config.local.example.php` → `config.local.php`.
2. Fill in:
   - `$db = ['host' => 'localhost', 'name' => 'u123_avos', 'user' => 'u123_avos', 'pass' => '…']`
   - `$encKey` — generate with your terminal or any random string generator
     (at least 32 characters: `openssl rand -hex 32`).
   - `$siteUrl = 'https://abhijeetvarghese.com'`
   - `$siteDir = '/home/u123456789/public_html'` — where the static website lives
     (used by the SEO crawler and `doctor.php`; default is the folder beside `avos-php`)
3. Set file permissions **600**.
4. The app **refuses to run in production** until the database is configured
   and `AV_ENC_KEY` is set — it will show a plain "not configured" message.

## Step 4 — Install

**Option A — web wizard (recommended):**
1. Visit `https://abhijeetvarghese.com/install/`
2. Enter admin name, email and a strong password (or let it generate one).
3. The wizard creates the schema, seeds content, creates the Super Admin
   (password change forced at first login) and **locks itself** — `/install/`
   returns 404 afterwards.

**Option B — CLI (requires SSH):**
```bash
php database/install.php --admin-email=you@domain.com --admin-password='YourStrongPass!'
# omitting --admin-password prints a secure random temporary password once
```

## Step 5 — Verify

| Check | URL | Expected |
|---|---|---|
| API health | `https://abhijeetvarghese.com/api/status` | `{"ok":true,"data":{"status":"healthy","database":"connected",…}}` |
| Admin | `https://abhijeetvarghese.com/admin/` | login page (redirects to `/admin/login.php`) |
| Public site | `https://abhijeetvarghese.com/` | the static website; `/case-studies/orange-business/` 200; `/case-studies.html` → 301 |

1. Log in at `/admin/login.php` → you are forced to set a new password.
2. Open **Settings** → verify site name, email, socials; upload logo/favicon if needed.
3. Open **Website** → status card shows the site folder + `index.html present: yes`;
   press **Run SEO crawl** to audit the live HTML.
4. Submit the contact form on the site → the lead appears in **Leads**.

---

## How the system works (the pipeline)

```
VISITOR → public site (static HTML) → contact/booking form
  → POST /api/public/lead  → validation + spam protection → MySQL leads → AV OS CRM
VISITOR → js/main.js → POST /api/analytics/track → first-party analytics
CMS (admin) → PUT /api/content → content_store (versioned) → CRM / SEO / agents / proposals
WEBSITE CHANGE → edit abhijeetvarghese/ → commit → deploy workflow → live
```

- The **public website is static** — visitors never hit MySQL; the site keeps serving with the DB down.
- Every content save is **versioned** (last 50 per entity); restore creates a new version.
- Public forms are protected by **honeypot + IP/email rate limiting**
  (optional Cloudflare Turnstile via config).
- **AI** (OpenAI/Gemini/Claude) is configured server-side; keys are encrypted
  at rest (`AV_ENC_KEY`) and never reach the browser.

---

## Scheduled tasks (Hostinger cron — optional)

- **Backups:** use the admin **Backup** button → writes a full JSON package to
  `storage/backups/` (download it regularly; keep it off the server).
- **Agents / integrations:** `php /home/u123456789/backend/scripts/agent-runner.php`
  every minute; `integration-sync.php` every 15 min; `cron/maintenance.php` +
  `cron/lead-inactivity.php` daily.

---

## Security checklist (implemented)

- PDO prepared statements everywhere; no SQL string concatenation from input
- bcrypt via `password_hash()`; login throttling (5 fails / 15 min per email+IP)
- Sessions: HttpOnly, SameSite=Lax, Secure under HTTPS, regenerated on login,
  expiry enforced
- CSRF token required on every state-changing admin API call
- RBAC: per-endpoint permission enforcement (Super Admin / Admin / Editor /
  Writer / SEO Manager / Viewer) — not just hidden buttons
- Uploads: MIME + extension + real content validation, size & dimension limits,
  random storage names, no executables, SVG script rejection, PHP execution
  disabled in upload dirs, WebP/thumbnail generation, deletion protection for
  in-use assets
- Secrets never in code: `config.local.php` outside web root; production guard
  blocks insecure defaults
- `.htaccess`: no directory listing, hidden-file/SQL/config blocks, security
  headers, asset caching
- Audit log for login/logout/content/media/leads/users/restores/backups
- Error handler logs server-side; clients never see stack traces or paths

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/status` shows "AV OS is not configured for production" | Fill `config.local.php` (DB + `AV_ENC_KEY` ≥ 32 chars) |
| 500 on `/api/*` | Check PHP ≥ 8.1 in hPanel, DB credentials, `storage/` writable |
| Login says too many attempts | Wait 15 min or clear `login_attempts` in phpMyAdmin |
| CMS edits don't appear on the site | Expected — the site is static. Edit `abhijeetvarghese/` and deploy |
| Uploads fail | `storage/uploads` must be writable (775) |
| AI says "no provider" | Integrations → configure OpenAI/Gemini/Claude (key stored encrypted) |
| Installer still accessible | Delete `public_html/install/` entirely after install |

## Root URL note

The static website *is* the web root. `public_html/.htaccess` (from AV OS) serves it
directly, applies the website's 301 map, `ErrorDocument 404 /404.html`, compression
and cache headers, rewrites `/media/*` to `media.php`, and blocks hidden/config/
backend paths. `/api`, `/admin`, `/install` are ordinary directories beside the site.

## Production install checklist (v2.4 — static frontend)

1. Website at the web root (deploy branch). Upload `avos-php/public_html/*` beside it (api, admin, install, media.php, .htaccess); everything else one level above (backend, database, includes, storage, avos-data).
2. Create `config.local.php` (see `config.local.example.php`):
   - `$env = 'production'; define('AV_DEBUG', false);`
   - `$siteUrl = 'https://abhijeetvarghese.com'; $siteDir = '/home/USERNAME/public_html';`
   - `$db` = your Hostinger database (NOT `avos` / `aV0s_d3v_9xKq2mN7` — the production guard rejects dev defaults).
   - `$encKey` = a **fixed** literal, generated once: `php -r "echo bin2hex(random_bytes(32));"` — never `random_bytes()` inline in the file.
3. Visit `https://yourdomain.com/install/` once — applies **all 31 migrations** (recorded in `schema_migrations`), seeds the CMS working data, creates the Super Admin, then self-locks.
4. Verify: `https://yourdomain.com/api/status` → `environment: production`, `site: static`, `public_site: true`. Run `php backend/scripts/doctor.php` → SYSTEM READY.
5. Cron (Hostinger → Advanced → Cron Jobs):
   - `* * * * * php /home/USERNAME/path/to/backend/scripts/agent-runner.php >> /home/USERNAME/path/to/storage/logs/agent-runner.log 2>&1`
   - `*/15 * * * * php /home/USERNAME/path/to/backend/scripts/integration-sync.php >> /home/USERNAME/path/to/storage/logs/integration-sync.log 2>&1`
   - daily: `php backend/cron/maintenance.php`, `php backend/cron/lead-inactivity.php` (flock-protected; safe to overlap)
6. Configure integrations in the admin (Integrations hub) with **real credentials** — never in code.

Note: `database/migrations/*` are immutable history — never edit them. Ship new numbered files.


## Clean-first installs (v2.0.3+)

The installer seed (`avos-data/site.json`) contains only real portfolio
content and configuration — no demo leads/analytics/dashboard data. A fresh
install is born clean. If you ever need to strip a working install down to
production state, run:

    php backend/scripts/remove-dummy-content.php
    php backend/scripts/prod-cleanup.php --dry-run   # preview
    php backend/scripts/prod-cleanup.php --execute   # apply
