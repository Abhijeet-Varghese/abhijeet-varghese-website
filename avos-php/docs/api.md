# AV OS — API Reference

Base: `/api/…` (production: `https://abhijeetvarghese.com/api/…`).

## Envelope

```json
{ "ok": true, "data": {…}, "error": null }
{ "ok": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

Status codes: 200 · 201 · 400 · 401 (unauthenticated) · 403 (forbidden) · 404 · 409 (conflict,
e.g. media in use) · 419 (CSRF) · 422 (validation) · 429 (rate limited) · 500.

## Public (no session)

| Endpoint | Purpose |
|---|---|
| `GET /api/status` | health: database, storage, publish readiness, version |
| `GET /api/site` | full site document (public read) |
| `GET /api/pages` / `/api/pages/{slug}` | pages |
| `GET /api/projects` / `/api/projects/{slug}` | projects / case studies |
| `GET /api/posts` / `/api/posts/{slug}` | articles |
| `POST /api/public/lead` | contact/booking → CRM (honeypot, Turnstile optional, per-IP + per-email throttling, scoring, automation, webhooks, confirmation emails) |
| `POST /api/public/submit` | generic form submission |
| `POST /api/analytics/track` | first-party analytics event (rate-limited) |
| `GET /api/v1/projects` · `GET /api/v1/case-studies` · `GET /api/v1/posts` · `POST /api/v1/leads` | versioned public API |

## Authenticated (session + CSRF header `X-CSRF-Token` on POST/PUT/DELETE)

**Auth**: `POST /api/auth/login` · `POST /api/auth/logout` · `POST /api/auth/change-password` · `GET /api/session`

**Content**: `GET|PUT /api/content` (key-based partial update) · `POST /api/publish`
· `POST /api/publish/rollback` · `GET /api/deployments` · `GET /api/versions/{key}`
· `POST /api/versions/{key}/restore`

**Media**: `GET|POST /api/media` (base64 JSON) · `PUT|DELETE /api/media/{id}`

**CRM**: `GET|POST|PUT|DELETE /api/leads(/id)` · `/api/crm/companies|contacts|opportunities|meetings`
· `/api/crm/tasks` · `/api/crm/pipeline` · `/api/crm/activities/{type}/{id}` · `/api/scoring/rules`

**Business**: `/api/business/projects` (+milestones, documents) · `/api/proposals` (+preview, `/pdf/{id}`)

**Analytics**: `/api/analytics/summary|pages|sources|daily|campaigns|content` · `/api/campaigns` (CRUD)

**AI**: `POST /api/ai/generate` (provider chat; DRAFT output only) · `GET|PUT /api/ai/providers(/code)`
· `GET /api/ai/usage` · `POST /api/copilot` (tool router — never raw SQL)

**Automation**: `/api/automations` (CRUD) · `/api/automations/runs` · `POST /api/automations/check-inactive`
(sweep; also `php backend/cron/lead-inactivity.php` for Hostinger cron)

**Platform**: `/api/webhooks` (+deliveries) · `/api/apikeys` · `/api/flags` · `/api/knowledge`
· `/api/errors` · `/api/emailtemplates` (+`/test/{id}`) · `/api/emaillog` · `/api/backup`
· `/api/backups` (list) · `/api/backups/restore` · `/api/backups/download/{file}` · `DELETE /api/backups/{file}`
· `/api/search?q=` · `/api/content-health` · `/api/sites` · `/api/audit` · `/api/users` · `/api/forms`
(+`export`, `{id}/status`) · `/api/notifications` (+read, read-all)

## Permissions (RBAC)

`content.read/write` · `publish` · `media.read/write` · `leads.read/write` · `forms.read/write` ·
`users.read/write` · `settings.read/write` · `audit.read` · `versions.read/restore` · `ai.read/write/use` ·
`backup` · `analytics.view` · `projects.manage` · `integrations.manage` · `automation.read/write`

Roles: Super Admin(1) · Admin(2) · Editor(3) · Writer(4) · SEO Manager(5) · Viewer(6). Every protected
route enforces its permission server-side (verified: Viewer → 403 on publish/users).

## V3 endpoints

`GET /api/leads` (paginated, filter status/q/sort, `?trashed=1`) · `GET /api/leads/export` (CSV,
formula-injection safe) · `POST /api/leads/{id}/restore` · `DELETE /api/leads/{id}?permanent=1` ·
`POST /api/crm/{entity}/{id}/restore` · `POST /api/proposals/{id}/restore` ·
`POST /api/media/{id}/restore` · `GET /api/crm/activities/{type}/{id}` (timeline) ·
`GET|POST|PUT|DELETE /api/redirects` · `POST /api/publish/preflight` · `GET /api/publish/diff` ·
`GET /api/security-score` · `GET /api/diagnostics` · `GET|POST|PUT|DELETE /api/aiprompts` ·
`POST /api/automations/test/{id}` · `POST /api/webhooks/retry-failed` ·
`PUT|DELETE /api/users/{id}` · `POST /api/users/{id}/reset-password|revoke-sessions` ·
`GET /media/{path}` (media server with traversal/type guards) · `GET /api/status` (extended:
media/email/ai/backup/perf).

## v2.4 — Integration Hub & Intelligence endpoints

All admin endpoints require auth + CSRF (same rules as v2). Public: `POST /api/links/click`.

### Integrations
- `GET /api/integrations` — registry with health + recent calls
- `PUT /api/integrations/:code` — save config (secrets encrypted; resets CONNECTED claim)
- `POST /api/integrations/:code/test` — real connection test (CONNECTED only on success)
- `POST /api/integrations/:code/sync` — run sync now + enqueue agent triggers
- `POST /api/integrations/:code/enable|disable` — master switch
- `GET /api/integrations/agent-graph` — agent → tool permissions
- `GET /api/integrations/calls?provider=&limit=` — external call log (secrets redacted)

### Search Console / search fusion
- `GET /api/search-console/overview?days=28` — Google + Bing + internal fusion
- `GET /api/search-console/queries|pages|quick-wins|opportunities|cro-candidates`
- `POST /api/search-console/import` — manual CSV import (Search Console export)

### Research
- `GET|POST|PUT|DELETE /api/research/sources[/:id]` — feed registry
- `POST /api/research/fetch` — fetch all enabled feeds (real network)
- `GET /api/research/items?limit=&days=`
- `GET /api/trends` — Google Trends items

### Knowledge graph + truth layer
- `GET /api/knowledge-graph` · `POST /api/knowledge-graph/build` · `POST /api/knowledge-graph/edge`
- `GET|POST /api/facts` · `PUT /api/facts/:id/status` · `DELETE /api/facts/:id`

### Intelligence
- `GET /api/case-studies/intel` · `POST /api/case-studies/intel` (rescore)
- `GET /api/social/profiles` · `POST /api/social/profiles` · `PUT|DELETE /api/social/profiles/:platform`
- `POST /api/social/sync` — YouTube RSS + WhatsApp link health
- `GET|POST /api/links` · `DELETE /api/links/:id` · `GET /api/links/:id/clicks`
- `POST /api/links/click?id=` — PUBLIC click tracking (no auth)
- `GET /api/positioning` — positioning health 0–100
- `GET /api/outcomes?agent=` — agent outcome measurement
- `GET /api/dev-intel` — GitHub repos + signals
- `GET /api/knowledge-ingest` — Drive/Notion ingestion ledger
