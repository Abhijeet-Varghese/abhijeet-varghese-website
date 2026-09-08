# The public website — static frontend

The public site at `abhijeetvarghese.com` is the **hand-authored static frontend**
in the repo folder `abhijeetvarghese/`. It is served exactly as committed. There
is no template layer, no HTML generator, no publish step and no deployment queue
in AV OS.

```
abhijeetvarghese/
├── index.html · story.html · portfolio.html · contact.html · insights.html · …
├── experience/index.html                     ← clean URL   /experience/
├── case-studies/index.html                   ←             /case-studies/
├── case-studies/orange-business/             ←             /case-studies/orange-business/
├── case-studies/indian-army/                 ←             /case-studies/indian-army/
├── case-studies/bharat-petroleum-corporation-limited/
├── css/styles.css · js/main.js · assets/ (images, fonts, video)
├── sitemap.xml · robots.txt · search-index.json · 404.html
└── .htaccess                                 ← 301 map for legacy URLs, cache headers, 404
```

## How a change reaches the site

1. Edit the files in `abhijeetvarghese/` (HTML, `css/styles.css`, `js/main.js`, `assets/`).
2. Commit to `main`.
3. `.github/workflows` subtree-splits `abhijeetvarghese/` to the `hostinger` branch,
   which Hostinger deploys to the web root.

Redirects live in the frontend's own `.htaccess` (the seven legacy `.html` /
`experience-design/*` URLs → clean case-study directories). Add new redirects there.

## What AV OS does for the site at runtime

| Frontend feature | Backend endpoint | Notes |
|---|---|---|
| Contact / booking form (`js/main.js`) | `POST /api/public/lead` | validation, honeypots, rate limiting, optional Turnstile → CRM lead + notifications + automations |
| First-party analytics | `POST /api/analytics/track` | event, path, referrer, UTM, device, visitor id |
| Media library previews (admin only) | `GET /media/{file}` → `media.php` | private `storage/uploads` |

Everything else in AV OS (CRM, meetings, proposals, SEO center, agents, integrations,
knowledge, backups) works **around** the site: the content collections in the CMS
(`/api/content`, versioned in `content_store` / `versions`) are working data for those
tools — they do not render pages.

## SEO tooling against the static site

- `POST /api/seo/audit` crawls `AV_SITE_DIR` recursively (clean-URL aware:
  `case-studies/orange-business/index.html` → `/case-studies/orange-business/`),
  and records issues (title/description length, missing H1, alt text, canonical, …).
- `GET /api/seo/internal-links` reports pages with few incoming links.
- The SEO / internal-link agents read the same files; they never write to them.

## Serving

**Development** — `php -S 0.0.0.0:8092 router.php` (in `avos-php/`). `router.php`
serves `AV_SITE_DIR` (default `../abhijeetvarghese`), applies the same 301 map and
`404.html`, and routes `/api`, `/admin`, `/install`, `/media` to AV OS.

**Production (Hostinger)** — the frontend files sit at the web root next to
`admin/`, `api/`, `install/` and `media.php`; `public_html/.htaccess` (AV OS
hardening + media rewrite + the frontend's 301 map + caching) is the single
web-root `.htaccess`. Set `$siteDir` in `config.local.php` if the site lives
elsewhere on disk (used by the SEO crawler / doctor only).

## Config & status

- `AV_SITE_DIR` (`config.local.php` → `$siteDir`) — where the static site lives on disk.
- `GET /api/status` → `"site":"static"`, `site_dir`, `public_site: true|false`
  (index.html present).
- `php backend/scripts/doctor.php` checks the folder, `404.html` and the web-root `.htaccess`.

## Removed in the static-frontend refactor (migration 031)

`backend/publish/*`, `site-template/`, `public_html/site/`, `auto-publish.php`,
`sync-frontend.php`, `mirror-site.php`, `cron/publish-scheduled.php`; API routes
`/api/publish*`, `/api/deployments*`, `/api/redirects*`, `/api/sync/frontend`,
`/api/system/publishing`, `/api/system/publish-settings`; tables `publish_queue`,
`deployments`, `redirects`; feature flags `auto_publish`, `publish_scheduler`;
`site_settings 'publish'` (backup retention moved to `site_settings 'backup'` →
`GET|PUT /api/system/backup-settings`).
