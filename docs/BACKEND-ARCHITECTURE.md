# AV OS — Backend Architecture (Phase 2 contract, v0.1)

**Status:** contract frozen for the modules below. Implementation has **not**
started beyond Phase 0/1. Nothing here is claimed as built.

Target: PHP 8.2/8.3 · MariaDB · Apache/LiteSpeed · Hostinger shared hosting.
No VPS, no Docker, no Redis, no daemon, no root, no framework bloat.

---

## 1 · Runtime shape

```
REQUEST
  → public_html/api/index.php        thin front controller
  → Kernel                            request id, timing, security headers
  → Router                            /api/v1/{module}/{resource}
  → Middleware pipeline               auth → RBAC → CSRF → rate-limit → validate
  → Controller                        no logic; translates HTTP ⇄ domain
  → Service                           business rules, transactions, events
  → Repository                        SQL only, prepared statements
  → MariaDB
  ← Response                          { ok, data, error } + X-Request-Id
```

**Rule:** controllers never touch the database; repositories never contain
business rules; services never emit HTTP.

## 2 · Module boundaries

| Module | Owns | Depends on |
|---|---|---|
| `identity` | public/owner addresses | — |
| `auth` | sessions, login, throttle, 2FA, recovery | identity, users, audit |
| `users` / `roles` / `permissions` | accounts, RBAC | audit |
| `content` | pages, projects, case-studies, journal, revisions | media, seo, routing |
| `builder` | sections, blocks, components, responsive config | content, media |
| `media` | assets, variants, focal points, usage graph | jobs |
| `routing` | route registry, redirects, canonicals, sitemap | content |
| `seo` | meta, schema, scoring | content, routing |
| `forms` / `leads` / `crm` | intake, pipeline | email, jobs, audit |
| `booking` | availability, slots, locking | email, jobs |
| `webgl` | scenes, shaders, animations | media |
| `publishing` | draft → review → schedule → publish → rollback | content, jobs, audit |
| `email` | templates, queued delivery | identity, jobs |
| `jobs` | MariaDB queue + cron + flock | — |
| `audit` | immutable event log | — |
| `system` / `settings` | config, health, diagnostics | — |

Each module registers its own routes, migrations, permissions and admin nav
through a manifest, so adding one touches no core file.

## 3 · Cross-cutting contracts

**Errors.** One envelope. Codes are stable strings (`UNAUTHENTICATED`,
`FORBIDDEN`, `CSRF_FAILED`, `VALIDATION_ERROR`, `RATE_LIMITED`, `NOT_FOUND`,
`CONFLICT`, `SERVER_ERROR`). Production never returns SQL, stack traces or
paths. Every error carries a request id that correlates to the server log.

**Validation.** Typed request objects per endpoint. Controllers receive
validated data or the request never reaches them.

**Authorisation.** Policy classes per resource. Route declares a permission;
middleware resolves it against RBAC before the controller runs. Owner-only
operations sit above `Super Admin`.

**Events.** Domain events (`content.published`, `booking.created`,
`lead.received`) fan out to audit, email and webhooks — never inline in a
controller.

**Queue.** `jobs` table + `cron` + `flock`. States: `pending → processing →
completed | failed → retry(backoff) → dead-letter`. No worker daemon; 60-second
granularity is accepted and documented.

**Cache.** Filesystem-backed with a null driver fallback. Redis is optional and
must never be required.

## 4 · Identity boundary (§3)

`Identity` is the single source of truth.

- `Identity::publicEmail()` — client-safe.
- `Identity::ownerEmail()` — **server-side only**, supplied by the private
  config or environment, never written into source.
- `Identity::assertClientSafe($payload)` — throws in non-production if the owner
  address is about to leave the server; redacts in production.
- CI runs `tools/identity-leak-guard.py` against both builds and the deployment
  package; the literal is supplied as a repository secret so it never enters git.

## 5 · Security posture (carried forward, already verified)

Private configuration outside the web root · per-directory deny files ·
hash-based CSP · prepared statements everywhere · central CSRF · dual-layer
login throttling · revocable server-side sessions · sanitised errors ·
non-executable uploads · extensionless URLs with a single route registry.

## 6 · Migration stance

**Strangler, not big-bang.** The new stack is built alongside the old under
`/api/v1`. A legacy path is deleted only when `tools/retirement-evidence.py`
reports zero consumers for it. The final runtime contains exactly one backend —
the hybrid exists only during transition, never at the end.

The sequencing gate is in `docs/BACKEND-RETIREMENT-PLAN.md`; the surface to
satisfy is in `docs/API-REFERENCE.md`.

---

## Not yet written (honest gaps)

`DATABASE-SCHEMA.md`, `AUTH-ARCHITECTURE.md`, `ADMIN-ARCHITECTURE.md`,
`SECURITY-ARCHITECTURE.md`. Security is currently documented across the §88
phase reports in `docs/`; it needs consolidating rather than re-deriving.
