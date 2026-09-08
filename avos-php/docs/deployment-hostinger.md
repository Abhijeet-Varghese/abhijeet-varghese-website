# AV OS — Hostinger Premium Deployment

Target: `https://abhijeetvarghese.com` — Hostinger Premium shared hosting (PHP 8.x, MariaDB,
Apache/LiteSpeed, `.htaccess`). **No Node, Docker, Redis or VPS services required.**

See also the full walkthrough at `/home/user/DEPLOY-HOSTINGER-PHP.md` (same steps, more detail).

## 1. Create the database

hPanel → Databases → MySQL: create database + user, grant all privileges on it.
Note the name, user, password.

## 2. Upload files

- Upload everything from `avos-php/public_html/` **into** `public_html/` on Hostinger
  (so `public_html/api`, `public_html/admin`, `public_html/install` land correctly).
- Upload the rest of `avos-php/` (backend/, database/, includes/, install/, site-template/,
  storage/, config.local.example.php, router.php) to a folder **outside** the web root, e.g.
  `/home/uXXXXXX/avos/` (private — never directly downloadable). If you must keep it under
  `public_html/`, the included `.htaccess` rules block access to backend/, database/, includes/,
  storage/ and site-template/.

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

## 5. Login & first publish

`https://abhijeetvarghese.com/admin/` → change the temporary password → Dashboard shows real state →
Publishing → **Publish website**. The static site is regenerated into `public_html/site/`.

## 6. Verify

- `https://abhijeetvarghese.com/` — homepage
- `https://abhijeetvarghese.com/api/status` — `{"ok":true,... "status":"healthy" ...}`
- `https://abhijeetvarghese.com/admin/` — CMS
- `/api/status` must NOT expose credentials/keys (it never does).

## 7. Cron (optional but recommended)

Lead-inactivity automation:
`php /home/uXXXXXX/avos/backend/cron/lead-inactivity.php` — daily. Hostinger: hPanel → Advanced →
Cron Jobs.

## 8. Upgrades

Upload new files, then run `php database/migrate.php` (or re-visit install only if re-seeding from
scratch is intended). Migrations are tracked + idempotent; a failed run is safe to re-run.

## File permissions (Hostinger defaults are fine)

- `storage/` (uploads, cache, logs, backups, deployments): writable by PHP (775).
- `public_html/`: 755 dirs / 644 files.
- Never commit or upload `config.local.php` anywhere public.
