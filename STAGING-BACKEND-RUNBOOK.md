# STAGING BACKEND ACTIVATION — RUNBOOK (hPanel)

> **Honest status:** the staging backend cannot be activated from this
> environment — there is no Hostinger access here (no SSH, no SFTP/FTP, no
> hPanel session, no Hostinger API token; `hpanel.hostinger.com` returns 403).
> Everything below is the exact, verified configuration needed; you must perform
> the hPanel steps yourself (or give this environment that access).

---

## 1 · Exact config.local.php location

`config.php` computes `AV_ROOT = dirname(__DIR__, 2)` from
`backend/config/config.php`, and loads `AV_ROOT . '/config.local.php'`.

So if the private engine lives at `/home/u747717869/backend/…`, then
`config.local.php` must be at:

```
/home/u747717869/config.local.php     ← account root (OUTSIDE public_html)
```

---

## 2 · CRITICAL correction — relocate the private engine OUT of the web root

The current `hostinger` branch is a *flat* web root, so it places
`backend/`, `includes/`, `database/`, `site-template/`, `storage/` **inside**
`/public_html/next/` (they are 403-blocked by the shipped `.htaccess`, but the
intended security model is for them to live outside `public_html`).

On Hostinger, keep **only these inside** `/public_html/next/`:

```
admin/   api/   install/   media.php   + static React/Vite build (index.html, assets/, *.html, .htaccess, robots.txt, sitemap.xml)
```

and **move** the rest up to the account root:

```
/home/u747717869/
├── backend/          ← move here (was /public_html/next/backend)
├── includes/         ← move here
├── database/         ← move here
├── site-template/    ← move here
├── storage/          ← move here (writable: 775)
├── avos-data/        ← NEW: upload site.json here (see §5)
└── config.local.php  ← create here (see §3)
```

`AV_ROOT` will then resolve to `/home/u747717869` and the private engine is
correctly outside the web root. (If you prefer a subfolder, e.g.
`/home/u747717869/avos-staging/`, put `backend/…` under it and `config.local.php`
there — `AV_ROOT` follows the directory that contains `backend/`.)

---

## 3 · config.local.php content (paste this, then fill in the DB values)

```php
<?php
// AV OS — STAGING (next.abhijeetvarghese.com) — NEVER commit this file.

$env = 'production';                     // keep 'production' so the guard enforces creds
define('AV_ENV', $env);
define('AV_DEBUG', false);

// ---- STAGING database (SEPARATE from production — do not reuse prod creds) ----
$db = [
  'host'    => 'localhost',              // Hostinger: localhost
  'name'    => 'u747717869_avos_staging',   // ← replace with the staging DB name you create
  'user'    => 'u747717869_avos_staging',   // ← replace with the staging DB user
  'pass'    => 'REPLACE-WITH-STAGING-DB-PASSWORD', // ← replace with the staging DB password
  'charset' => 'utf8mb4',
];

// ---- encryption key (32+ bytes; generate your own with: php -r "echo bin2hex(random_bytes(32));") ----
$encKey = '752a7136a15c8f83503cc21e280479d41a36eed4dfa84376d154f1509ae46004';

$sessionHours = 12;

// ---- site ----
$siteUrl = 'https://next.abhijeetvarghese.com';

// ---- optional Cloudflare Turnstile (leave empty for staging) ----
$turnstile = ['site_key' => '', 'secret_key' => ''];
```

> **Note on `AV_FRONTEND_MODE` / `AV_PUBLIC_DIR` / `AV_SITE_OUT_DIR`:** these are
> read from **environment variables** (`getenv()`), *not* from `config.local.php`
> variables — and `AV_PUBLIC`/`AV_SITE_OUT` are defined *before* `config.local.php`
> is loaded. They are **not required** for serving the site/admin/API/leads on the
> git-deployed staging site (they only affect the *publish* pipeline and cosmetic
> doctor checks). If you ever press "Publish" in the staging admin, set them as
> real env vars in hPanel (PHP → PHP configuration → environment) instead:
> `AV_FRONTEND_MODE=vite`, `AV_VITE_DIST=/home/u747717869/avos-data/../frontend/dist`-style path, `AV_SITE_OUT_DIR=/home/u747717869/public_html/next`.

---

## 4 · Create the staging MariaDB (hPanel)

1. hPanel → **Databases → MySQL Databases**.
2. Create a **new** database + user (e.g. `u747717869_avos_staging`) and grant it
   **all privileges** on that database only.
3. Copy host (usually `localhost`), name, user, password into `config.local.php` §3.
4. **Do not** touch or reuse the production database.

---

## 5 · Seed content (REQUIRED — the deploy package has no content)

The installer seeds CMS content from `AV_ROOT . '/../avos-data/site.json'`, but the
flat staging branch does **not** include `avos-data/`. So upload
`avos-data/site.json` (from this repo) to the account root so the path resolves:

```
/home/u747717869/avos-data/site.json   ← upload this (published CMS snapshot only)
```

(This file contains only published content — settings/pages/projects/articles/nav —
no leads, users, tokens, or secrets.)

---

## 6 · Install (schema + seed + admin + lock) — via SSH, or web wizard

**SSH (preferred):**
```bash
cd /home/u747717869
php database/install.php --admin-email=YOU@example.com --admin-name="Abhijeet Varghese"
# omitting --admin-password prints a secure one-time password; change on first login
```

**Web wizard:** visit `https://next.abhijeetvarghese.com/install/` and follow it
(it creates schema, seeds content, creates the Super Admin, then self-locks).

---

## 7 · Verify (only after §3–§6 are done on Hostinger)

```bash
# backend responds with JSON (CMS settings)
curl -s https://next.abhijeetvarghese.com/api/site

# admin login page renders
curl -s -o /dev/null -w "%{http_code}\n" https://next.abhijeetvarghese.com/admin/

# test lead (staging DB only)
curl -s -X POST https://next.abhijeetvarghese.com/api/public/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Staging Test","email":"staging@example.com","phone":"+910000000000","message":"test","source":"website","page":"/contact.html","website":""}'
```

Expected: `/api/site` = JSON; `/admin/` = 200 login page; lead returns
`{"ok":true,...}` and a `status:"new"` row appears in the **staging** `leads` table.

---

## 8 · Security re-check (after activation)

```
/.git/config, /config.local.php, /config.php, /backend/…, /includes/…,
/database/…, /storage/…, /site-template/…   → must all be 403/404
```
The shipped `.htaccess` already blocks these; confirm they remain blocked after
relocating the private engine to the account root.

---

## Production safety (unchanged)

- `main` / production `hostinger` deployment / production DB / `abhijeetvarghese.com`
  are **not** touched by any of this. Staging uses a separate DB + separate
  `config.local.php` + `noindex`/`Disallow: /`.
