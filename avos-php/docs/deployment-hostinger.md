# AV OS — Hostinger Premium Deployment

Target: `https://abhijeetvarghese.com` — Hostinger Premium shared hosting (PHP 8.x, MariaDB,
Apache/LiteSpeed, `.htaccess`). **No Node, Docker, Redis or VPS services required.**

See also the full walkthrough in the repo root `DEPLOY-HOSTINGER-PHP.md` (same steps, more detail).
The public website is the **static frontend** (`abhijeetvarghese/`, deployed by the GitHub workflow
to the `hostinger` branch → web root). AV OS (admin + API) sits beside it in the same web root.

## 1. Create the database

hPanel → Databases → MySQL: create database + user, grant all privileges on it.
Note the name, user, password.

## 2. Upload files

- The static website (`abhijeetvarghese/*`) is already at the web root via the `hostinger`
  deploy branch. Keep it there; AV OS does not generate or overwrite it.
- Upload everything from `avos-php/public_html/` **into** `public_html/` on Hostinger
  (so `public_html/api`, `public_html/admin`, `public_html/install`, `media.php` land beside the
  site). `avos-php/public_html/.htaccess` **replaces** the frontend's `.htaccess` at the web root —
  it contains the same 301 map + caching rules plus the AV OS hardening and `/media` rewrite.
- Upload the rest of `avos-php/` (backend/, database/, includes/, storage/,
  config.local.example.php) to a folder **outside** the web root, e.g. `/home/uXXXXXX/avos/`
  (private — never directly downloadable). If you must keep it under `public_html/`, the included
  `.htaccess` rules block access to backend/, database/, includes/ and storage/.
- If the site folder is not the parent of the AV OS folder, set `$siteDir` in `config.local.php`
  (used by the SEO crawler and doctor).

## 3. Configure config.local.php

Copy `config.local.example.php` → `config.local.php` (outside web root) and fill:

```php
$db = ['host' => 'localhost', 'name' => 'uXXXXXX_avos', 'user' => 'uXXXXXX_avos', 'pass' => 'REAL_PASSWORD'];
$encKey = 'a-very-long-random-string-32+-chars';   // used for AI key encryption
$sessionHours = 12;
$siteUrl = 'https://abhijeetvarghese.com';
```

Production guard: the app **refuses to boot** with empty credentials, the dev user `avos` /
`aV0s_d3v_9xKq2mN7`, or an `$encKey` shorter than 32 chars.

## 4. Run the installer

Visit `https://abhijeetvarghese.com/install/` once. Enter the admin email (+ optional name), and
either choose a strong password or "generate temporary password". The installer: creates the schema,
runs all migrations (pure PDO — works even where `exec()` is disabled), imports the content seed,
creates the Super Admin with forced password change, then **locks itself** (`.installed` marker;
second visit → 404). Delete the `install/` folder afterwards for belt-and-braces.

## 5. Login

`https://abhijeetvarghese.com/admin/` → change the temporary password → Dashboard shows real state.
The **Website** view shows the static site folder status and runs the SEO crawl; there is nothing
to publish — the site is live as deployed.

## 6. Verify

- `https://abhijeetvarghese.com/` — homepage (static frontend); `/case-studies/orange-business/` clean URL; `/case-studies.html` → 301
- `https://abhijeetvarghese.com/api/status` — `{"ok":true,... "status":"healthy" ...}`
- `https://abhijeetvarghese.com/admin/` — CMS
- `/api/status` must NOT expose credentials/keys (it never does).

## 7. Cron (optional but recommended)

- `* * * * *  php /home/uXXXXXX/avos/backend/scripts/agent-runner.php` — AI agents / scheduled jobs
- `*/15 * * * * php /home/uXXXXXX/avos/backend/scripts/integration-sync.php`
- daily: `php /home/uXXXXXX/avos/backend/cron/lead-inactivity.php`, `php …/backend/cron/maintenance.php`

Hostinger: hPanel → Advanced → Cron Jobs.

## 8. Upgrades

Upload new files, then run `php database/migrate.php` (or re-visit install only if re-seeding from
scratch is intended). Migrations are tracked + idempotent; a failed run is safe to re-run.

## File permissions (Hostinger defaults are fine)

- `storage/` (uploads, cache, logs, backups, versions): writable by PHP (775).
- `public_html/`: 755 dirs / 644 files.
- Never commit or upload `config.local.php` anywhere public.
