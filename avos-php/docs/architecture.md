# AV OS — Architecture

AV OS v2 is a **Creative Business Operating System**: a PHP/MySQL backend (CMS + CRM + business engine) that
regenerates a **static, fast, cacheable public website**. Everything runs on Hostinger Premium shared hosting
(PHP 8.x + MariaDB + Apache/LiteSpeed + `.htaccess`). No Node, no Docker, no Redis, no VPS services.

## System diagram

```
                          AV OS
                            │
          ┌─────────────────┼─────────────────┐
       CONTENT             CRM               AI
       Pages              Leads            Copilot
       Projects           Clients          Content AI
       Case Studies       Companies        SEO AI
       Journal            Meetings         Knowledge
       Services           Pipeline
          └─────────────────┼─────────────────┘
                            │
                      AUTOMATION
                            │
                      ANALYTICS
                            │
                       PHP API        (public_html/api/index.php — REST, JSON envelope)
                            │
                         MySQL        (single canonical source of truth)
                            │
                     PUBLISH ENGINE   (backend/publish/PublishEngine.php)
                            │
                      STATIC SITE      (public_html/site/ — atomic swap, rollback-safe)
                            │
                 abhijeetvarghese.com
```

## Canonical sources

| Concern            | Canonical source                                   |
|--------------------|----------------------------------------------------|
| Content            | MySQL `content_store` (JSON documents per entity)  |
| Frontend template  | `site-template/` (approved design, never edited by publish) |
| Generated site     | `public_html/site/` (regenerated on every publish) |
| Users/auth         | MySQL `users` (relational, bcrypt) — never content_store |
| Configuration      | `config.local.php` (outside web root; dev-only defaults rejected in production) |
| Migrations         | `database/migrations/*.sql` (tracked in `schema_migrations`, checksummed, immutable) |
| Deployment history | MySQL `deployments` (+ site snapshots in `storage/deployments/`) |

## Data flow (publish)

`MySQL content_store → ContentStore::all() → PublishEngine → site-template → staging dir →
validateBuild → atomic swap → live site` (+ `sitemap.xml`, `robots.txt`, `css/tokens.css` design tokens,
first-party analytics snippet). If any step fails: build stops, current live site stays untouched, failure
logged to `system_errors` and a notification is pushed.

## Public vs admin surface

- **Public** (no auth): `/api/site`, `/api/pages(/slug)`, `/api/projects(/slug)`, `/api/posts(/slug)`,
  `POST /api/public/lead`, `POST /api/public/submit`, `POST /api/analytics/track`, `GET /api/v1/*`,
  `/api/status`. Static HTML/CSS/JS under `public_html/site/`.
- **Admin** (session + CSRF + RBAC): everything else under `/api/…`, served to `/admin/app/`.

## Security posture

- Sessions: HttpOnly + SameSite + Secure cookies, `session_regenerate_id()` on login, expiry.
- Login: bcrypt, per-email+IP throttle (5 fails / 15 min → 429), global per-IP guard.
- CSRF: token on every state-changing request (419 on failure).
- RBAC: 6 roles, 25+ permissions, enforced server-side on every endpoint.
- SQL: 100% PDO prepared statements; IDs/slugs/pagination validated.
- Media: MIME + extension + real-content validation, random storage names, script-execution blocked,
  SVG script rejection, deletion protected when referenced (409).
- Secrets: never exposed to the frontend; production boot refuses insecure defaults.
- Error responses never leak stack traces outside development.

## Key directories

```
avos-php/
├── backend/
│   ├── config/config.php          (constants; reads config.local.php)
│   ├── core/  Database, Auth, Response(+Input), Pdf
│   ├── models/ Models.php (v1), BusinessModels.php (v2)
│   ├── publish/PublishEngine.php
│   ├── ai/AiProviders.php         (OpenAI / Anthropic / Gemini providers)
│   ├── controllers/ApiController.php (all routes + handlers)
│   └── cron/lead-inactivity.php   (Hostinger-cron-compatible sweep)
├── database/ schema.sql, migrate.php, migrations/001..005
├── includes/bootstrap.php
├── public_html/
│   ├── api/index.php              (API front controller)
│   ├── admin/  (login.php, change-password.php, app/ SPA)
│   ├── install/                   (web installer, self-locking)
│   └── site/                      (generated public site)
├── site-template/                 (canonical frontend template source)
└── storage/  uploads, cache, logs, backups, deployments, versions
```

## V3 layer (this pass)

- **Soft delete everywhere**: leads, contacts, companies, opportunities, meetings, tasks, proposals,
  business projects, media — `deleted_at`, restore + authorized permanent delete APIs, trash UI (Leads).
- **Request ID / tracing**: every API request carries `X-Request-Id: AV-YYYYMMDD-XXXXXX`, included in
  error payloads, error logs and `perf_log` (per-request ms, slow-endpoint visibility via `/api/status`).
- **Sessions registry**: `sessions` table mirrors PHP sessions → server-side revocation works
  (verified: revoked user's next request → 401).
- **Conflict detection**: `GET /api/content` returns per-key versions; `PUT` with `base_versions`
  → 409 with server version when another session saved first.
- **Redirects**: `redirects` table + CRUD API/UI → written to the site `.htaccess` at publish (301/302).
- **Pre-flight + diff + post-publish verification + auto-rollback**: see publishing.md.
- **Idempotent public leads**: same email within 24h returns the existing lead + activity entry
  (no duplicate rows), while genuinely different inquiries are never merged.
- **Security score** (`/api/security-score`, real checks) and **diagnostics** (`/api/diagnostics`:
  orphaned media rows, untracked files, duplicate slugs, trashed counts).
- **AI**: versioned prompt templates (`ai_prompts`, DB-backed library), daily/monthly request caps,
  copilot tool-level RBAC.
- **Automation**: dry-run test mode per rule, loop guard (max 5 executions/request), webhook retry
  (bounded, `POST /api/webhooks/retry-failed`).
- **Draft safety**: listings (homepage, journal/insights, sitemap page, sitemap.xml) never link or
  list non-published content; internal-link gate blocks publishing broken listings.
- **404 + headers**: generated `404.html`, `ErrorDocument`, `X-Frame-Options`/nosniff/Referrer-Policy/
  Permissions-Policy on the static site, same-origin CORS (no wildcard).
- **Cron**: `publish-scheduled.php`, `maintenance.php` (retention), `lead-inactivity.php` — all
  flock-protected, Hostinger cron-compatible.


## Frontend sources (single source of truth)

- `abhijeetvarghese/` — **design source of truth** (approved frontend; edit here).
- `site-template/` — template snapshot synced from it (`backend/scripts/sync-frontend.php`, hash-manifest based).
- `public_html/site/` — **generated output** of the publish engine. Never edit by hand; every publish regenerates it.

Editing `public_html/site/*.html` directly will not persist — the publish engine overwrites it. The
frontend-sync cron (optional) copies css/js/assets/fonts from the design source into the template and
(if `auto_publish` is enabled) republishes. Auto-publish is a deliberate plug-and-play choice; to
require a manual publish, disable the `auto_publish` flag (Platform → Feature flags) and use the
Publishing view.
