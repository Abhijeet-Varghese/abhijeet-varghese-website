# Migration Audit — React + Vite Frontend (2026-09-18)

Pre-migration baseline: tag **`pre-react-baseline`** on `main` @ `298322c`
(production static frontend + AV OS backend). Full-branch backup bundle:
`/home/user/_branch-archive/all-branches-pre-cleanup.bundle` (local, 176 MB).

## 1. Repository & branches

| Branch | Verdict | Evidence |
|---|---|---|
| `main` | KEEP (production) | canonical static site + backend |
| `staging` | KEEP (dev/QA) | identical to main (`ahead=0`, `diff=0`) |
| `hostinger` | KEEP — **deployment branch** | machine-generated webroot consumed by Hostinger Git deployments; republished by `deploy-staging.yml` on every staging push. Documented deviation from "only main+staging": deleting it breaks the deployment pipeline; it carries no hand-authored work (`ahead=1` = deploy commit). |
| `feat/react-ts-vite-migration` | DELETED | 43 commits ahead but **no React app**: markdown reports + QA tooling only (`package.json` = axe/playwright devDeps, no `src/`). No production work. Archived in bundle. |
| `staging-react-vite` | DELETED | Earlier React+Vite attempt (2026-09-04) predating the approved mobile layer (2026-09-17/18). Reusing it would regress the approved design. Archived in bundle. |
| `mobile-tablet-homepage` | DELETED | 1 commit superseded by main's final mobile layer; only unique files were `desktop-lock-extra.css` + `tokens.css` (never referenced by the deployed site). Archived in bundle. |
| `static-frontend-final` | DELETED | 0 unique commits; stale snapshot of main (2026-09-09). |

Remote after cleanup: `main`, `staging`, `hostinger` only. No force-push to
main/staging, no history rewrite; deletions were fast-forward-safe (all unique
work archived in the bundle first).

## 2. Frontend (legacy static site — `abhijeetvarghese/`)

- Entry: `index.html` (9 sections: hero `#hero`, trust `#clients`,
  capabilities `#capabilities`, featured work `#work`, POV `#thinking`,
  journey `#journey`, AI/method `#ai`, focus/now `#focus`, contact
  `#contact`), plus chrome (site-nav, mobile-menu, progress, loader) and
  editorial footer (`footer--arena`).
- CSS cascade (approved, byte-identical imported into React):
  `styles.css` (tokens+global+components), `elevate.css`, `hero-v6.css`
  (hero states `hero-settled`/`hero-parked`), `home-mobile.css` (≤700 mobile
  layer, v4.0.0).
- JS: `main.js` (booking + form + chrome), `elevate.js`, `home-mobile.js`
  (work film/HUD, journey bar, footer arena, `body.hm-pin`), `country-data.js`
  (`window.AV_COUNTRIES`), `emailjs-fallback.js` (fetch-wrapper fallback),
  `sw.js` (offline fallback only).
- Single API call from the whole frontend: `POST /api/public/lead`. Booking
  calendar/slots are client-side IST logic; EmailJS runs only on API
  failure/timeout (owner-first, visitor second, 3 attempts, 1.2 s gaps).
- Inner pages still legacy-static: `/story/`, `/experience/`, `/case-studies/`,
  `/portfolio/`, `/consulting`, `/contact/`, `/insights/*` (4 essays), case
  study deep pages, legal pages. Served untouched during incremental takeover.
- Known legacy defect preserved intentionally: malformed inline `--fd` values
  in `hp6-field` spans and one unclosed marquee `<div>` exist in the shipped
  `index.html`; browsers auto-repair. The JSX conversion closes the div
  explicitly (render-equivalent) and keeps the inline values byte-identical.
- Analytics: **no GA4/GTM/Clarity IDs exist anywhere in the legacy frontend**
  (verified by grep across html/js). SEO surface = meta/OG/Twitter/canonical/
  JSON-LD (`Person` schema) + `sitemap.xml`/`robots.txt`. Nothing to port
  beyond preserving these; if GA4 is added later it must hook route changes.

## 3. Backend (AV OS — `avos-php/`) — source of truth, untouched except one additive endpoint

- PHP 8 front controller `public_html/api/index.php` → `ApiController::handle()`
  (`match(true)` route table). Request IDs, perf logging, same-origin CORS,
  2FA gate, permission-checked admin routes.
- **Content model**: `content_store(key_name PK, data JSON longtext,
  updated_by, updated_at)` + `versions`. Keys: `settings, nav, clients, media,
  pages, projects, articles, seo, sections, downloads`.
- **SiteSync (critical finding)**: one-way mirror *static frontend →
  content_store* (fingerprint-gated; cron + admin button + CLI). The CMS never
  wrote back to the frontend — the static site WAS the source. The React
  migration inverts this: content_store → API → React. SiteSync remains useful
  while legacy inner pages exist (it keeps the store fresh); once the static
  home is retired it simply no-ops for migrated content (per-key writes only
  when derived JSON differs; admin edits win where the static source no longer
  changes). **Ops note**: after full migration, disable the frontend-sync cron
  or repoint `AV_SITE_DIR` to avoid overwriting admin edits from stale static
  files.
- Public endpoints before migration: `POST /api/public/lead` only.
  All `/api/content*` routes are admin-auth (`content.read/write`).
- **Additive extension (this migration)**: `GET /api/public/content` →
  `{ok, data:{content:<merged content_store>, generated, version}}`,
  `Cache-Control: public, max-age=30`. Read-only, public site content only
  (same data the HTML already exposes). No auth changes, no DB credential
  exposure, no secrets in the frontend.
- Database: MariaDB; schema via `database/provision.sql` + 35 ordered
  migrations (`database/migrate.php`). Local dev DB provisioned and migrated
  in-sandbox for this audit; `config.local.php` stays gitignored (`*.local`).
- Auth/admin: session login + 2FA + permissions — untouched; admin panel
  (`/admin`) still served by the router.

## 4. Content contract (CMS → React)

`GET /api/public/content` (same-origin in prod; `VITE_API_BASE` optional):

- `nav.primary[] {id,label,href,page}` → header nav links
- `clients[] {id,name,monogram,industry,logo}` → trust logo wall
  (`/assets/logos/{logo}`)
- `projects[] {id,title,cardTitle,client,industry,services,status,year,featured,order}`
  → featured work cards (`case__cat/client/title/work` = industry/client/
  cardTitle/services; first 3 non-draft)
- `articles[] {id,title,type,status,category,readTime,date,image,excerpt}`
  → POV essays, matched **by slug** (`id` minus `art-` prefix ↔ legacy href
  `/insights/{slug}/`) so CMS ordering never swaps cards
- `settings {siteName,tagline,email,phone,availability,logo,ogImage,
  metaDescription,keywords,socials,...}` → brand name, footer tagline
- Hardcoded JSX values remain as **fallback defaults** (rendered only when the
  API and snapshot both lack the field) — plus `src/data/snapshot.json`
  (generated from the live API, refresh: `npm run snapshot`) as the documented
  offline fallback. It is not a fake CMS: it is a byte-snapshot of the real
  store.
- Loading/error/empty/timeout/malformed/unavailable are all handled in
  `src/api/client.js` (AbortController timeouts, normalized `ApiError`,
  snapshot fallback with `fallback:true` flag surfaced via `useContent().status`).

## 5. CMS editability proof (staging-safe)

1. Original: `settings.tagline = "Making ambitious ideas impossible to
   misunderstand."`
2. Edited through the same write path the admin uses (`ContentStore::put`,
   note "QA CMS editability proof").
3. `GET /api/public/content` → `QA-PROOF-CMS-EDIT-20260918` ✓ (DB → API)
4. React footer binds `settings.tagline` (browser verification recorded in the
   migration report) ✓ (API → React)
5. Reverted via the same path; API confirmed original value. ✓

## 6. Routing / .htaccess / deployment (incremental takeover)

- New root `.htaccess` (written by the workflow):
  1. `^avos-php` → 403 (backend internals never served)
  2. `/assets/*` that exist in `dist/` → built React bundles
  3. `/` and `/index.html` → `dist/index.html` (prerendered React home)
  4. everything else → `avos-php/router.php` (PHP API, `/admin`, `/media`,
     legacy inner pages, legacy assets, legacy clean-URL 301s, legacy 404)
- All existing URLs keep working: migrated route (`/`) via React; unmigrated
  routes via the untouched legacy static files; deep links + refresh are
  server-resolved files, not SPA guesses.
- `deploy-staging.yml` additions: Node 20 + `npm ci` + `npm run build`
  (vite build → `scripts/inject-seo.mjs` → `scripts/prerender-home.mjs` SSR
  bundle → static HTML for `/` inlined into `dist/index.html`), dist rsync,
  guard checks (`hp6-name` present = prerender succeeded). Hostinger branch
  publication unchanged (still the deployment source).
- Production stays Node-free: only static `dist/` files are deployed.

## 7. SEO strategy

- `/` is **prerendered at build time** (SSG from the CMS snapshot) — crawlers
  get full content without JS; hydration replaces it live. Title/meta/OG/
  canonical/JSON-LD ship in the Vite `index.html` (mirrored from the approved
  legacy head). `sitemap.xml`/`robots.txt` untouched (legacy files still
  deployed). Inner pages remain fully static (zero SEO change).
- Unknown paths: server-side legacy 404 (unchanged status-code behavior).

## 8. Duplicates / backups / dead code

- `src-backups/` (repo root, 968 KB: css/fonts/js backups) — **kept**: not
  referenced by runtime, but it is the human-made backup of pre-v4 styles;
  deletion is out of scope for "prove unused" (it's documentation of prior
  states, zero runtime cost).
- `scripts/` (repo root) — QA/ops helpers, kept.
- `.claude/` — gitignored, not deployed.
- Legacy `abhijeetvarghese/js/*.js` and `css/*.css` — still referenced by
  legacy inner pages during takeover; **not deleted** (removal gate: after the
  last inner page migrates, re-grep every remaining consumer per brief §12).
- `sw.js` — registered by React too (offline fallback); kept at webroot.

## 9. Architecture delivered

```
src/
  main.jsx            bootstrap: styles (legacy cascade order), router, SW
  entry-server.jsx    SSG prerender entry
  app/App.jsx         route map (/ → HomePage, * → NotFound)
  api/client.js       single API layer: timeouts, errors, snapshot fallback,
                      lead submission + EmailJS fallback (ported)
  hooks/              useContent, useLoader, useChrome, useMenu (focus trap,
                      Esc, body lock), useReveal, useHeroStates, useWorkStage
                      (desktop reel + ≤700 film + HUD, window.__avWork),
                      useJourneyStage (sticky pin/bar/era is-lit),
                      useFooterArena (hm-pin), useBooking (IST calendar,
                      slots, validation, submit)
  components/         Loader, SiteChrome (CMS nav), SiteFooter (CMS settings)
  sections/home/      Hero, Trust (CMS clients), Capabilities, FeaturedWork
                      (CMS projects), PointOfView (CMS articles by slug),
                      Journey, AISection, Focus, Contact
  pages/              HomePage, NotFound
  styles/             styles.css, elevate.css, hero-v6.css, home-mobile.css
                      (byte-identical copies; only ../assets/ → /assets/)
  data/               snapshot.json (fallback), countries.js (ported)
```

Performance: interactions are transform/opacity + IntersectionObserver +
rAF-throttled scroll (no layout-thrash loops); single vendor chunk + single
CSS sheet (approved cascade); images lazy + async decode; fonts
`font-display:swap`; prerender removes the blank-first-paint cost.

## 10. Open items (tracked, not blocking staging)

- Inner pages (`/story/`, `/case-studies/*`, `/insights/*`, `/contact/`,
  legal) still legacy — migrate route-by-route; `.htaccess` step 4 already
  supports flipping them one at a time.
- `hostinger` branch remains as documented deployment infrastructure.
- After full migration: disable/retire SiteSync cron (see §3 ops note) and
  re-audit legacy file deletion (brief §12 gate).
