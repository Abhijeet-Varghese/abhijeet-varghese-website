# AV OS — API Reference (Phase 2 contract, v0.1)

**Generated** 2026-08-22 by `tools/retirement-evidence.py` — do not hand-edit.
Regenerate after every migration step.

This is the *current* surface, evidenced by real consumer scanning. It is the
contract the new `/api/v1` must satisfy before the legacy backend can be retired.

## Summary

| Metric | Count |
|---|---|
| Endpoints declared by the backend | 65 |
| Consumed by the public frontend | 3 |
| Consumed by the React admin (`/os/`) | 6 |
| Consumed by the legacy admin (`/admin/`) | 52 |
| Consumed by cron/CLI | 2 |
| **No consumer at all** | **8** |

> **Retirement rule.** The legacy admin consumes 52 of 65 endpoints.
> The old backend and the legacy admin are therefore one unit and must be
> retired together. Nothing here is deleted on reachability alone.

## Load-bearing today (10)

Consumed by the public site, the React admin or cron. Breaking any of these
breaks production.

| Endpoint | Consumers | Disposition |
|---|---|---|
| `/api/analytics` | `frontend`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/auth` | `react-admin`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/content` | `frontend`, `react-admin`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/diagnostics` | `legacy-admin`, `cron+cli` | **load-bearing** — must not break |
| `/api/flags` | `react-admin`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/media` | `react-admin`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/public` | `frontend`, `documentation` | **load-bearing** — must not break |
| `/api/session` | `react-admin`, `legacy-admin`, `documentation` | **load-bearing** — must not break |
| `/api/status` | `legacy-admin`, `cron+cli`, `documentation` | **load-bearing** — must not break |
| `/api/system` | `react-admin`, `legacy-admin` | **load-bearing** — must not break |

## Legacy-admin only (40) — the `/os/` parity backlog

| Endpoint | Consumers | Disposition |
|---|---|---|
| `/api/agents` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/ai` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/aiprompts` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/apikeys` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/audit` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/automations` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/backup` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/backups` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/business` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/campaigns` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/case-studies` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/content-health` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/copilot` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/crm` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/emaillog` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/emailtemplates` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/engagement` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/errors` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/facts` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/forms` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/integrations` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/intelligence` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/knowledge` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/knowledge-graph` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/leads` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/links` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/notifications` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/positioning` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/proposals` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/redirects` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/research` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/security-score` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/seo` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/sites` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/smtp` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/social` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/sync` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/trends` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/users` | `legacy-admin` | rebuild for `/os/` parity |
| `/api/webhooks` | `legacy-admin` | rebuild for `/os/` parity |

## No consumer (8) — candidates, NOT verdicts

`dev-intel`, `knowledge-ingest`, `outcomes`, `posts`, `projects`, `scoring`, `search-console`, `tag`

These have no reference in any scanned consumer. They are **not** cleared for
deletion: `posts` and `projects` are public content endpoints that external
callers or bookmarks may still hit, and cron/CLI invoke classes directly rather
than over HTTP. **Server access logs from staging are the missing evidence.**

## Response contract (unchanged, carried forward)

```json
{ "ok": true,  "data": { },  "error": null }
{ "ok": false, "data": null, "error": { "code": "...", "message": "...", "request_id": "AV-..." } }
```

Every response carries `X-Request-Id`. Errors are sanitised: no SQL, no stack
trace, no filesystem path. Mutating verbs require CSRF. All admin routes require
authentication plus a per-endpoint permission.
