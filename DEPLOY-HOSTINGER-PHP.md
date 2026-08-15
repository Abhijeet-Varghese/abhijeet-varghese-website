# AV OS on Hostinger Premium — Deployment Guide

Deploy **AV OS** (CMS + API + static site generator) on standard
**Hostinger Premium shared hosting** — no VPS, no Node, no Docker.
Stack: PHP 8.x · MySQL/MariaDB · Apache/LiteSpeed.

---

## What you are deploying

```
public_html/                        ← the ONLY web-accessible directory
├── index.php                       ← optional redirect → /site/
├── site/                           ← GENERATED static public website
│   ├── index.html                  ← the public homepage
│   ├── story.html · experience.html · case-studies.html · …
│   ├── essay-*.html · journal-*.html
│   ├── css/ · js/ · assets/
│   ├── sitemap.xml · robots.txt
│   └── .htaccess                   ← no script execution in assets
├── admin/
│   ├── login.php                   ← /admin (the CMS entry)
│   ├── change-password.php         ← forced first-login password change
│   └── app/                        ← AV OS admin app (28 views)
├── api/
│   ├── index.php                   ← REST API front controller
│   └── .htaccess                   ← router + security headers
├── install/                        ← first-run wizard (SELF-DISABLES)
└── .htaccess                       ← hardening: no listing, no config, cache headers

OUTSIDE public_html (account root — NEVER upload these into public_html):
backend/        ← PHP engine: config, core, models, controllers, ai, publish
includes/       ← bootstrap
database/       ← schema.sql + install.php (CLI installer)
storage/        ← uploads, cache, versions, logs, backups (private)
site-template/  ← canonical frontend template (css/js/assets) used by the publish engine
config.local.php← your secrets (DB credentials, AV_ENC_KEY) — NEVER commit
config.local.example.php
```

**Security by construction:** the entire PHP engine, storage and configuration
live OUTSIDE `public_html`. Only `admin/`, `api/`, `install/`, `site/` and assets
are public.

---

## Step 1 — Create the MySQL database

1. hPanel → **Databases → MySQL Databases**
2. Create a database (e.g. `u123_avos`) and a user with full privileges.
   Copy the host (usually `localhost`), database name, username and password.

## Step 2 — Upload the files

1. hPanel → **File Manager** → open `public_html`.
2. Upload:
   - the **contents of** `avos-php/public_html/` into `public_html/`
   - `backend/`, `includes/`, `database/`, `storage/`, `site-template/`
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
| Public site | `https://abhijeetvarghese.com/site/` | the generated website |

1. Log in at `/admin/login.php` → you are forced to set a new password.
2. Open **Settings** → verify site name, email, socials; upload logo/favicon if needed.
3. Press **Publish website** (or `⌘⇧P`) → the static site regenerates atomically.
4. Point your domain root at the site: hPanel → **Redirects** → redirect
   `https://abhijeetvarghese.com/` → `/site/` (or upload a small `index.php`
   that forwards visitors), keeping `/admin` private.

---

## How the system works (the pipeline)

```
VISITOR → public site (static HTML) → contact/booking form
  → POST /api/public/lead  → validation + spam protection → MySQL leads → AV OS CRM
CMS (admin) → PUT /api/content → content_store (versioned)
  → POST /api/publish → PublishEngine renders site-template + content
  → staging dir → VALIDATION (pages, css, js, sitemap, no template leaks)
  → atomic swap → live /site/
```

- The **public website is static** — visitors never hit MySQL.
- Every content save is **versioned** (last 50 per entity); restore creates a new version.
- Public forms are protected by **honeypot + IP/email rate limiting**
  (optional Cloudflare Turnstile via config).
- **AI** (OpenAI/Gemini/Claude) is configured server-side; keys are encrypted
  at rest (`AV_ENC_KEY`) and never reach the browser.

---

## Scheduled tasks (Hostinger cron — optional)

- **Backups:** use the admin **Backup** button → writes a full JSON package to
  `storage/backups/` (download it regularly; keep it off the server).
- **Scheduled publishing:** create a cron that hits
  `php /home/u123456789/backend/cron/publish-scheduled.php` at the desired time
  (this file is generated on install), or publish manually.

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
- Audit log for login/logout/content/publish/media/leads/users/restores/backups
- Error handler logs server-side; clients never see stack traces or paths

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/status` shows "AV OS is not configured for production" | Fill `config.local.php` (DB + `AV_ENC_KEY` ≥ 32 chars) |
| 500 on `/api/*` | Check PHP ≥ 8.1 in hPanel, DB credentials, `storage/` writable |
| Login says too many attempts | Wait 15 min or clear `login_attempts` in phpMyAdmin |
| Edits don't appear on the site | Press **Publish** (edits are saved to MySQL; publish regenerates HTML) |
| Uploads fail | `storage/uploads` must be writable (775) |
| AI says "no provider" | Integrations → configure OpenAI/Gemini/Claude (key stored encrypted) |
| Installer still accessible | Delete `public_html/install/` entirely after install |

## Root URL note (production certification)

The generated site lives at `public_html/site/`. The bundled `public_html/.htaccess`
serves it at the web root (`/` → `site/index.html`, page URLs rewritten into
`site/`), so `https://abhijeetvarghese.com/story.html` resolves after publishing.
`/api`, `/admin`, `/install` and `/media` are excluded from the rewrite.

## Production install checklist (v2.4 — verified zero-to-live)

1. Upload the package so the web root contains `public_html/` (api, admin, install, media.php, site) and everything else sits one level above it (backend, database, includes, storage, avos-data, site-template).
2. Create `config.local.php` (see `config.local.example.php`):
   - `$env = 'production'; define('AV_DEBUG', false);`
   - `$siteUrl = 'https://abhijeetvarghese.com';`
   - `$db` = your Hostinger database (NOT `avos` / `aV0s_d3v_9xKq2mN7` — the production guard rejects dev defaults).
   - `$encKey` = a **fixed** literal, generated once: `php -r "echo bin2hex(random_bytes(32));"` — never `random_bytes()` inline in the file (a new key per request would make stored secrets undecryptable).
3. Visit `https://yourdomain.com/install/` once — the installer now creates the database, applies **all 27 migrations** (001→027, recorded in `schema_migrations`), seeds the real portfolio content, and creates the Super Admin. The installer self-locks afterwards.
4. Verify: `https://yourdomain.com/api/status` → `environment: production`, `publish: ready`. Run `php backend/scripts/doctor.php` → SYSTEM READY.
5. Cron (Hostinger → Advanced → Cron Jobs):
   - `* * * * * php /home/USERNAME/path/to/backend/scripts/agent-runner.php >> /home/USERNAME/path/to/storage/logs/agent-runner.log 2>&1`
   - `* * * * * php /home/USERNAME/path/to/backend/scripts/auto-publish.php >> /home/USERNAME/path/to/storage/logs/auto-publish.log 2>&1`
   - `*/15 * * * * php /home/USERNAME/path/to/backend/scripts/integration-sync.php >> /home/USERNAME/path/to/storage/logs/integration-sync.log 2>&1`
   - daily: `php backend/cron/maintenance.php`, `php backend/cron/lead-inactivity.php` (flock-protected; safe to overlap)
6. Configure integrations in the admin (Integrations hub) with **real credentials** — never in code: GSC service account, GA4 property + measurement ID, Bing key, Cloudflare token, Calendly PAT + webhook signing key, SMTP, AI keys. Status shows CONNECTED only after a real verified request.
7. Optional: `*/5 * * * * php backend/scripts/sync-frontend.php` if you edit the design source externally.

Note: `database/migrations/*` are immutable history — never edit them. Ship new numbered files.


## Clean-first installs (v2.0.3+)

The installer seed (`avos-data/site.json`) contains only real portfolio
content and configuration — no demo leads/analytics/dashboard data. A fresh
install is born clean. If you ever need to strip a working install down to
production state, run:

    php backend/scripts/remove-dummy-content.php
    php backend/scripts/prod-cleanup.php --dry-run   # preview
    php backend/scripts/prod-cleanup.php --execute   # apply
