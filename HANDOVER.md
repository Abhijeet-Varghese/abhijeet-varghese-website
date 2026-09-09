# AV OS — HANDOVER SUMMARY

**Project:** Abhijeet Varghese (abhijeetvarghese.com) — portfolio platform
**Live version:** v2.4.20 (single authoritative line, per working policy)
**Date:** 2026-09-09 (current-variant-only repository)

---

## 1 · STACK

| Layer | Tech |
|---|---|
| Backend | PHP 8.4 (CLI), no framework — custom MVC (`avos-php/backend/`) |
| Database | MariaDB 10/11, `avos` DB, `content_store(key_name, data)` JSON store, checksum-immutable migrations |
| Frontend | `abhijeetvarghese/` — hand-authored HTML/CSS/JS (no build step), **served as-is** |
| Publishing | none — edit the frontend → commit → GitHub workflow → `hostinger` branch → web root |
| Site state | 100% STATIC — clean URLs (`/experience/`, `/case-studies/<slug>/`), 301 map + 404 in the frontend `.htaccess` |
| CMS data | one-way mirror: static files → `content_store` (`SiteSync`, every minute via `agent-runner.php`) |
| Dev server | `php -S 0.0.0.0:8092 router.php` (in `avos-php/`) |
| Fonts (local, no CDN) | Inter Tight · Instrument Serif · Poppins |
| Design system | the CSS in `abhijeetvarghese/css/` is the only source of truth |

## 2 · FILE TREE

```
repo root
├── abhijeetvarghese/              ← THE PUBLIC WEBSITE (final static frontend; deployed as-is)
│   ├── index.html · story.html · portfolio.html · contact.html · insights.html · …  (24 pages)
│   ├── experience/ · case-studies/{,orange-business,indian-army,bharat-petroleum-corporation-limited}/
│   ├── css/{tokens,styles,portfolio-reel,orange-business-case-study,indian-army-case-study}.css
│   ├── js/{main,portfolio-reel,orange-business-case-study,indian-army-case-study}.js   (contact form → /api/public/lead)
│   ├── assets/                    ← images, fonts, résumé
│   └── .htaccess                  ← legacy-URL 301 map, cache headers, 404
├── avos-php/                      ← AV OS (admin + API) — works around the site, never renders it
│   ├── router.php                 ← dev server: serves AV_SITE_DIR + /api /admin /install /media
│   ├── backend/  config/config.php (AV_SITE_DIR) · core · models · controllers · agents · integrations
│   │   └── scripts/               ← doctor · agent-runner · sync-frontend · integration-sync · restore-backup
│   ├── public_html/               ← web-root files: .htaccess, admin/ (login + SPA), api/, install/, media.php
│   ├── database/                  ← install.php · migrate.php · validate-migrations.php · provision.sql · migrations/001–031 (immutable)
│   ├── storage/                   ← runtime only (uploads, cache, logs, backups, locks) — git-ignored
│   ├── config.local.php           ← dev overrides (DB creds, $siteDir) — never committed
│   ├── start.sh · start.bat       ← local bootstrap (DB provision, server, watcher)
│   └── CHANGES.md                 ← changelog for the CURRENT variant only
├── .github/workflows/             ← subtree-splits abhijeetvarghese/ → hostinger branch
├── DEPLOY-HOSTINGER-PHP.md        ← live deploy runbook (Hostinger)
└── HANDOVER.md                    ← this file
```

There is no `docs/` or `tests/` folder and no Node tooling in the repository — the QA
battery was removed with the old-version code (see `avos-php/CHANGES.md` r9). Verify with
`php backend/scripts/doctor.php`, `php backend/scripts/sync-frontend.php --status`, and a
browser pass over the 24 routes.

## 3 · THE PUBLIC WEBSITE — CURRENT STATE

- **Home** (`body.home-arena`): arena hero, marquee, capabilities, featured-work cards
  (one global `CaseStudyCard` component × three records), thinking, journey, AI, CTA, arena footer.
- **Story** (`body.about-page`, "The Long Take"): one continuous cinematic canvas — first-frame hero,
  identity spread with portrait, zoom-out stage, 8-card 3D film stack, closing acts, credits.
  Compass pill, entrance choreography, full `prefers-reduced-motion` fallbacks.
- **Experience** (`/experience/`): immersive editorial record with expandable responsibilities.
- **Portfolio** (`portfolio.html`): the reel — player, chapters, practice spectrum, 16-logo proof
  wall, "More work — coming soon" panel. Custom reel cursor is intentional.
- **Case studies** (`/case-studies/`): index + three dedicated pages — Orange Business EBC
  (long-form, hotspots/tabs/journey all keyboard + touch operable; MP4s intentionally absent),
  Indian Army (Immersive Training & Qualification Ecosystem — 28 sections, 20 images, own
  css/js, sticky chapter nav; copy is fact-locked: no invented metrics/dates/specs, no
  "reconstruction" disclaimers), BPCL (self-contained sub-site; optional `walkthrough.mp4`
  probed by HEAD, absent by design).
- **Contact**: on-site scheduler (date/time saved to AV OS, in-page confirmation, no Calendly),
  country-code field, 44 px touch targets.
- Chrome (nav + footer) identical on every page; compact focus-trapped navigation ≤900 px.
- Legacy URLs (7) 301 to the canonical routes — identical map in `.htaccess` and `router.php`.
- Every public image has alt text + intrinsic dimensions; LCP images preloaded; CSS/JS carry a
  12-char SHA-256 content fingerprint (`?v=2.4.20-{hash}`) — re-hash after any change.

## 4 · AV OS — CURRENT STATE

- Admin SPA (`public_html/admin/app/`): 47 views, all backed by the API or the mirrored
  content store; no demo/seed data (notification bell, downloads, testimonials read live data).
- Content saves are versioned (`PUT /api/content` with `base_versions` → 409 on conflict).
  **A partial `settings` object replaces the whole key** — always send the full object.
- Static site → CMS mirror: `agent-runner.php` step 0 every minute, `POST /api/system/sync-frontend`,
  or `php backend/scripts/sync-frontend.php [--force|--status|--json]`. Nothing is written back.
- Installer: `php database/install.php --admin-email=… --generate` on a **fresh** DB
  (never run `migrate.php` first). Migrations are checksum-immutable — never edit a shipped file.

## 5 · WHAT'S LEFT / NEXT STEPS

1. **🔴 LIVE DEPLOY — NOT VERIFIED (external env required).** Hostinger: staging
   `next.abhijeetvarghese.com`, prod `abhijeetvarghese.com`. The website deploys from the
   `hostinger` branch (GitHub workflow). For AV OS follow `DEPLOY-HOSTINGER-PHP.md`.
2. **Known environment behaviour:** ephemeral sandboxes need PHP/MariaDB, DB provisioning and a
   server restart; `config.local.php` lives at `avos-php/config.local.php`; login throttling and
   2FA rate limits persist in the DB between sessions.
3. **Recovery path:** recreate `config.local.php`, provision the database, run
   `php database/install.php` (mirrors the static site into the CMS), start `router.php`, verify
   with `php backend/scripts/doctor.php`. The website itself needs nothing — it is the committed
   `abhijeetvarghese/` folder.
