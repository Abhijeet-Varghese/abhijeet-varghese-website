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

## One source of truth — frontend → CMS sync

Every content collection in the CMS that describes the website is **derived from the
static files, automatically and one-way**. Change the HTML → the CMS follows. Nothing
in the CMS is ever written back to `abhijeetvarghese/`.

```
abhijeetvarghese/ (files)  ──SiteSync──▶  content_store
  index.html                              settings · nav · clients · sections
  *.html, experience/, case-studies/      pages · projects · articles · seo
  search-index.json                       (page types / titles / tags)
  assets/                                 media · downloads
```

| Store key | Derived from |
|---|---|
| `settings` | brand name, `.hp-hero__tagline`, `mailto:`/`tel:`, availability, favicon/logo, `og:image`, meta description/keywords, footer **Social** column |
| `nav` | `nav.site-nav__inner` links (+ `.btn` = CTA), `footer .footer__col` columns, `.footer__copy` |
| `clients` | `#clients img[src*="logos/"]` (name from `alt`, logo file name) |
| `sections` | every `main > section[id]` of `index.html` — kicker, h2, lede, theme, plus per-section fields (hero roles/CTAs/marquee, capabilities, featured `projectIds`, `essayIds`, journey eras, AI copy/chips, focus lists, contact micro-facts) |
| `pages` | every public page that is not a case study / essay / journal — `<title>`, meta, canonical, h1; the Experience page's `job` blocks are rebuilt from `article.exp-job`; other block lists are kept as authored |
| `projects` | `#work article.case` cards (client, industry, services, problem/approach/role/outcome, thumbnail) joined with each `case-studies/<slug>/index.html` (JSON-LD name/description/location, `<title>`, `og:image`, canonical); legacy redirect stubs → `legacyPaths` |
| `articles` | `essay-*.html` / `journal-*.html` — title, `.chapter__tag` → category + read time, JSON-LD `datePublished`, hero image, lede → excerpt, `.prose` paragraphs → body |
| `seo` | one row per public URL — title, description, keywords, canonical, og:image, h1, incoming-link count, heuristic score |
| `media` | every image / pdf / video under `assets/` (dimensions via `getimagesize`, alt text harvested from the pages) — served to the admin via `/media/<path>` |
| `downloads` | `assets/*.pdf` |

Rules:

- **Ids are stable.** Existing records are matched by slug / path / title / client, so
  `prj-1`, `art-3`, `p-story`, `c7` keep their ids across syncs and versions stay readable.
- **Nothing is deleted.** A record that exists only in the CMS is kept, marked
  `source: "cms-only"` and demoted to `draft` (it is not on the site, so it is not live).
- **Writes happen only on real change.** Each key is compared as canonical JSON; only
  changed keys get a new `versions` row (note: `sync from static frontend (<reason>)`).
- **Idempotent.** A forced re-run on an unchanged site writes nothing.

### Triggers

| Trigger | How |
|---|---|
| Automatic | `backend/scripts/agent-runner.php` (the per-minute cron) calls `SiteSync::runIfChanged()` first thing — a 5 ms fingerprint (content hash of html/json/xml/css/js, size+mtime of binaries) stored in `site_settings.frontend_sync`; the full parse (~60 ms) runs only when the fingerprint changed. Works even when AI agents are paused. |
| Admin | **Website → Sync from site** (`POST /api/system/sync-frontend`, `content.write`; `{"force":true}` re-derives everything). `GET /api/system/sync-frontend` shows last sync / in-sync state; `/api/status` carries a `frontend_sync` summary. |
| CLI | `php backend/scripts/sync-frontend.php [--force] [--status] [--json]` |
| Install | `database/install.php` runs a forced sync after seeding, so a fresh install already mirrors the site. |

Every run is audited (`action: sync`, entity `frontend`) and, when something changed,
posts an admin notification listing the updated keys. Views that show derived data
(Homepage Builder, Pages, Navigation, Projects, Case Studies, Clients, Thinking, Journal,
Media, SEO, Downloads, Settings) carry a "Mirrored from the static site" banner.

Editing those collections in the admin is still allowed — it is working data for agents
and SEO tools — but the next site change overwrites the derived fields. To change the
public website, edit the HTML.

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
