# Phase 3E — Content Engine · Completion Report

**Branch** `feat/clean-url-engine` · **Phase 3D base** `eac5576`
**Checkpoint tag** `phase3e-start` · **Completion tag** `phase3e-complete`
Not pushed. Not deployed. `main` and `hostinger` untouched.

---

## 1 · Headline findings

**Three bugs were mine, found by the tests rather than by review.**

1. **The public Experience timeline rendered backwards.** `QuerySpec` defaults
   to `ORDER BY … DESC`, which is right for "newest first" and wrong for an
   ordered timeline: position 2 came before position 1. DOMAIN-MODEL §4 says the
   order *is* content, so this was a content-correctness bug, not cosmetics.
   Fixed by giving each repository a declared `defaultOrder()` — `asc` for
   position-ordered types, `desc` for date-ordered ones. `QuerySpec` itself was
   not modified; the default is merged into the query array, so a client can
   still override with `?order=`.

2. **A slug containing `.html` was silently accepted.** `Slug::normalise()`
   stripped the extension and carried on, so `POST {slug:"story.html"}` quietly
   produced `/story`. That contradicts my own rule elsewhere that a URL is never
   changed behind the author's back. Now: an **explicit** slug carrying `.html`,
   `.php` or `/` is a **422**; only a slug *derived from a title* is normalised.

3. **A 403 escaped as a 500 outside the HTTP chain.** `PublishingService` and
   `VersionService` called `Authorizer::requirePermission()` directly, which
   raises `AppException`. Inside the middleware chain that is translated; called
   directly — which is exactly how the test suite and any future CLI/cron caller
   uses it — it fell through to the generic 500 handler. Both services now
   translate to `ApiException` at the boundary. The decision still comes from
   the one Authorizer.

**One decision needs your sign-off:** amendment **A6** adds a new permission,
`content.delete`. See §7.

---

## 2 · Status

| Item | Status |
|---|---|
| Content domain | **COMPLETE** |
| Pages | **COMPLETE** |
| Projects | **COMPLETE** |
| Articles / Journal | **COMPLETE** |
| Experience | **COMPLETE** |
| Versions | **COMPLETE** |
| Draft/publish lifecycle | **COMPLETE** |
| Slug/routing integration | **COMPLETE** |
| Validation | **COMPLETE** |
| Content API | **COMPLETE** |
| Public/private separation | **COMPLETE** |
| Audit | **COMPLETE** |
| HTTP verification | **PASS** (84/84 over a real socket) |
| Version restore | **PASS** |
| Slug collision | **PASS** |
| Authorization | **PASS** |
| Security tests | **PASS** |
| §103 clean URL gate | **PASS** (24 pages · 22 sitemap URLs · 0 extension URLs) |
| Regression | **PASS** (337/337 prior tests still green) |
| Secret scan | **PASS** |
| Private email guard | **PASS** |
| **Legacy runtime changes** | **0** |

Deliberately **not** built, per the brief: media processing · SEO engine ·
booking · CRM · WebGL · animation library · AI · admin UI · queue · cache.

---

## 3 · Legacy runtime — evidence

Per-path `git status --porcelain`:

```
avos-php/backend               0
avos-php/database/migrations   0
avos-php/public_html           0
avos-php/includes              0
frontend/src                   0
admin/src                      0
```

**LEGACY RUNTIME CHANGES = 0.** The content engine uses the new database only.
No production data was read, written or inspected. `content_store` and
`site.json` were not imported.

---

## 4 · What was built

### Files created — 33 files, 4,560 LOC

| Area | Files |
|---|---|
| `app/Content/` | `ContentType` `ContentState` `Slug` `RoutePath` `ContentDocument` |
| `app/Content/Events/` | `ContentEvent` `EventDispatcher` |
| `app/Content/Cache/` | `CacheInvalidatorInterface` `NullCacheInvalidator` `RecordingCacheInvalidator` |
| `app/Security/` | `AuditLogger` — the first writer to `audit_logs` |
| `app/Domain/Content/` | `AbstractContentRepository` `PageRepository` `ProjectRepository` `ArticleRepository` `ExperienceRepository` `VersionRepository` `RouteRepository` `TaxonomyRepository` · `ContentService` `PageService` `ProjectService` `ArticleService` `ExperienceService` `VersionService` `PublishingService` `PublicContentService` |
| `app/Http/Controllers/` | `ContentController` `PublicContentController` |
| `database/next/migrations/` | `011_content_engine.sql` |
| `tests/next/` | `content.php` `content-http.php` `dev-router.php` |

### Files modified — 4

| File | Why |
|---|---|
| `app/Bootstrap/ApiKernel.php` | wire the content engine; register 58 routes |
| `app/Migration/SystemSeeder.php` | add `content.delete` (amendment A6) |
| `app/Migration/SchemaValidator.php` | parse `ALTER TABLE` (amendment A8) |
| `tools/retirement-evidence.py` | register the 3 new entry points (§3D.23) |

### Migrations added — 1

`011_content_engine.sql`. **No table created, none dropped: still 60 tables.**
It adds columns, widens three ENUMs and adds FKs and indexes — see
API-CONTRACT amendments A4/A5/A9.

Migrations 001–010 are checksummed and were **not** edited.

### Tables used — 14

`pages` `projects` `articles` `experience` `content_versions` `page_routes`
`redirects` `categories` `tags` `article_categories` `article_tags`
`audit_logs` `clients` (read-only FK check) `media` (read-only FK check).

### Endpoints implemented — 58 new (68 total)

9 public + 49 authenticated. Full table in `docs/API-CONTRACT.md`.

### Permissions used — 15

`pages.read/write/delete` · `projects.read/write/delete` ·
`articles.read/write/delete` · `content.read/write/delete` ·
`publishing.publish` · `versions.read` · `versions.restore`

**One new:** `content.delete` (amendment A6). Total 48 → 49.

---

## 5 · Test results

```
php avos-php/tests/next/run.php          86 pass    (3A/3B)
php avos-php/tests/next/auth.php        125 pass    (3C)
php avos-php/tests/next/api.php         126 pass    (3D)
php avos-php/tests/next/content.php     277 pass    (3E)      ← new
php avos-php/tests/next/content-http.php 84 pass    (3E HTTP) ← new
                                 ------------------
                                 TOTAL  698 pass · 0 fail · 0 skip
```

**Tests added: 361.** Prior total 337 → **698**. Zero failures, zero skips.

Other gates:

| Gate | Result |
|---|---|
| PHP lint, every file under `app cli database public-next tests/next` | clean |
| `cli/avos schema:validate` | 0 missing tables · 0 unexpected · 0 missing columns · 0 missing indexes |
| `frontend/scripts/verify-urls.mjs` (§103) | 24 pages · 22 sitemap URLs · 0 extension URLs · 0 broken links |
| `tools/retirement-evidence.py` | **DELETE 0** · ARCHIVE 2 · REWRITE 7 · MIGRATE 9 · KEEP 130 |
| `tools/identity-leak-guard.py` | PASS — 0 private addresses in 16 client-visible files |
| Direct grep for the private address across all 37 changed files | 0 hits |
| Secret scan across all changed files | 0 hits |

### The schema gate was proven, not assumed

`SchemaValidator` previously understood only `CREATE TABLE`, so every column
added by 011 would have been ungated. After the fix I dropped `pages.excerpt`
by hand: the gate reported `missing_columns 1: pages.excerpt`. Restored.

### Real HTTP (§3E.29) — evidence, not assertion

All 84 assertions cross a socket to the real front controller
(`public-next/api/index.php`) via `curl`, served by `php -S` with
`tests/next/dev-router.php`. Verified end to end: GET · POST · PUT · PATCH ·
DELETE · publish · unpublish · restore · 401 · 403 · 404 · 405 · 409 · 419 ·
422 · CSRF present/absent/wrong · request-id headers · security headers on
error responses · session login/logout · public/private separation.

Selected results:

- `GET /api/v1/pages` with no session → **401 UNAUTHORIZED** (all four types)
- `POST /api/v1/pages` with no CSRF header → **419 CSRF_FAILED**
- duplicate slug → **409 CONFLICT**
- `PATCH {status:"published"}` → **409**, naming the `publish` action
- editor `DELETE /api/v1/pages/{id}` → **403 FORBIDDEN**, page still present
- `GET /api/v1/system/owner-status` → **403** (owner unset, fails closed)
- after unpublish: public **404**, authenticated management read still **200**

---

## 6 · Specific brief requirements

### §3E.20 empty-database lifecycle

Ran against a database created by 3A+3B with only system seed data
(`pages` 0 rows, `content_versions` 0 rows at start), for **all four types**:
create → update → version → publish → public read → unpublish → public read
fails → authenticated read succeeds → restore → publish again.

### §3E.21 version / restore

v1 → update → v2 → publish (v3) → update (v4) → **restore v2** →
**v5 appended**. Verified: restored content matches v2 byte for byte; versions
1–5 all still readable; v4 still readable; publication state unchanged by the
restore; audit row `page.version_restore` written. **No history was deleted.**

### §3E.22 slug collision

- second page, same slug → **409** with `suggestion: "…-2"`
- a **draft** reserves its slug (table-level `uq_*_slug`), so draft-vs-draft
  collides too
- a **published** slug still collides with a new draft
- a *different content type* may hold the same slug string (separate tables) —
  but publishing it is **409**, because `page_routes.uq_route_path` forbids a
  duplicate URL. Confirmed by count: exactly **1** active route for that path.
- updating a page to its own slug is not a conflict

### §3E.23 authorization

| Role | read | write | delete | publish | restore |
|---|---|---|---|---|---|
| OWNER | — see below | | | | |
| ADMINISTRATOR | ✅ | ✅ | ✅ | ✅ | ✅ |
| EDITOR | ✅ | ✅ | ❌ | ✅ | ✅ |
| CONTENT_MANAGER | ✅ | ✅ | ❌ | ❌ | ❌ |
| MEDIA_MANAGER (control) | ❌ | ❌ | ❌ | ❌ | ❌ |

**OWNER remains intentionally unconfigured**, so `isOwner()` is `false` for
every account and owner-only operations fail closed — while ordinary
authenticated content work keeps functioning, which is the §3D.24 requirement
carried forward. Verified in both directions.

### §3E.24 public content security

Direct attempts by **slug**, by **crafted route** and through the **index**, all
refused. A draft, an unpublished item and a nonexistent slug all return the same
plain 404 — an attacker cannot distinguish "hidden" from "absent".

Also proven structurally, not by stripping afterwards: the public payload is
built from a column allow-list, and the public service has **no** method that
takes an internal id, **no** version accessor and **no** audit accessor. A
public `?status=draft` filter is ignored, because `status` is removed from the
public filterable list.

Confirmed absent from a public page payload: `id` `author_id` `created_by`
`updated_by` `deleted_at` `status` `publish_at` `unpublish_at` `position`.
No `@` character appears anywhere in a public payload.

An **active route pointing at unpublished content resolves to nothing** —
tested by inserting exactly that orphan route.

### §3E.25 SQL / XSS / oversize

`'; DROP TABLE pages; --` and `<script>alert(1)</script><img src=x onerror=…>`
were stored **verbatim as data** in titles, excerpts and block props. Tables
survived; row counts intact. Legitimate rich content is **not** destroyed —
encoding happens at the response boundary, where `json_encode` neutralises it.

Rejected: malformed content structure (422) · oversized title (422) ·
a 300 KB document (413) · a disallowed sort field (422). A disallowed **filter**
is ignored rather than executed, per the Phase 3D rule.

### §3E.19 fixture hygiene

Every fixture is prefixed `zzz-avos-test-` / `zzz-avos-http-` and every fixture
email is on `example.test` (RFC 6761 — can never resolve). The suite asserts
that **none** of the Phase 0 fabricated records reappeared — Deloitte, PwC,
Sony, Stripe, Priya Sharma, Ravi Kumar, Maria Lopez, Ken Watanabe, Acme,
"12,000 sq ft" — and that `clients`, `leads` and `bookings` are all **0 rows**.

The suite deletes its own fixtures and then re-asserts the tables are empty and
the system seed is untouched.

---

## 7 · Contract amendments — needs your sign-off

Recorded in `docs/API-CONTRACT.md`. **A6 is the one that adds something new to
the security model** and is flagged accordingly.

| # | Amendment | Risk |
|---|---|---|
| **A4** | `published_at` added, distinct from the existing `publish_at` (intent vs. fact) | low |
| **A5** | new state `unpublished`; `experience` ENUM widened to match; its default moves `published` → `draft` | low |
| **A6** | **new permission `content.delete`** — granted only via the owner/administrator wildcard | **needs sign-off** |
| **A7** | public content endpoints mount under `/api/v1/content/*` (Phase 2 §4 named only the collection root) | low |
| **A8** | `SchemaValidator` now parses `ALTER TABLE` — modifies frozen Phase 3A/3B code, additive only | low |
| **A9** | columns added to the four content tables (no table created or dropped) | low |

A1/A2/A3 from Phase 3D are unchanged and were not reverted.

**Why A6 rather than a silent workaround:** the API contract routes experience
CRUD through `content.*`, and that domain had `read` and `write` but no
`delete`, while `pages`, `projects` and `articles` all had one. The alternatives
were to let `content.write` authorise deletion — which would let a Content
Manager delete timeline entries even though they cannot delete a page — or to
leave experience undeletable, which the brief asks for. I added the permission
and withheld it from Editor and Content Manager, matching how `pages.delete`
already behaves. **If you would rather it did not exist, say so and I will make
experience deletion owner/administrator-only through a role check instead.**

---

## 8 · Known limitations

Carried forward, unchanged by this phase:

1. **Owner email still unset** — `owner_email_set: false`. Owner-only ops fail
   closed by design. Needs `AV_OWNER_EMAIL` from you; it will not be written to
   the repository.
2. **No mailer** (Phase 3O) · **MFA not implemented** (interface + seam only).
3. **Nothing verified on LiteSpeed.** All evidence here is Apache 2.4.68 /
   PHP 8.4.23 built-in server. **REQUIRES STAGING EVIDENCE.**
4. **Manual Hostinger private-config step never performed.**
5. Case studies still nearly empty; zero quantified outcomes site-wide. Cannot
   be written without your real data.

New to this phase:

6. **The cache is a seam, not a cache.** `NullCacheInvalidator` does nothing and
   says so. Publishing emits the three signals Phase 3L will consume; there is
   no cache to invalidate yet and nothing in the product claims otherwise.
7. **The event bus is synchronous and in-process.** No queue (Phase 3P), no
   Redis, no broker. A listener that throws is logged and swallowed rather than
   being allowed to fail a publish that already committed.
8. **Scheduled publishing is not automated.** The `scheduled` state and
   `publish_at` exist and validate, but nothing promotes a scheduled item to
   published — that needs the cron/queue runner in Phase 3P. No control claims
   it works.
9. **Delete is soft only.** There is no hard-delete endpoint, deliberately:
   DOMAIN-MODEL §3 requires a deleted page's route to become a 301, which is
   impossible once the row is gone. Purge belongs with retention policy.
10. **`page_routes` is not yet reconciled with `routes.json`.** Both exist and
    both are authoritative in their own layer; the reconciliation is Phase 3F/3R
    and is not attempted here.
11. **`content` and `builder_nodes` are not yet linked.** Documents are stored
    in the builder-compatible shape so Phase 3G can project them into
    `builder_nodes` without translation, but no projection exists yet.
12. **Reading time** is derived from block text only when the author omits it,
    and never overwrites an explicit value.

---

## 9 · Migration blockers — unchanged, still outside this phase

Per §3E.27, all three remain **REQUIRES STAGING EVIDENCE** and were not touched:

1. Live `content_store` contents — whether content exists in the database that
   is absent from `site.json`.
2. Whether production holds real client PII in `leads` / `bookings`.
3. Access logs needed to clear the 8 zero-consumer legacy endpoints.

No production data was imported, inspected or modified.

---

## 10 · How to reproduce every result

```bash
export AV_CONFIG_FILE=/home/user/_avosnext/avos-private/config.local.php
export AV_PRIVATE_DIR=/home/user/_avosnext/avos-private

php avos-php/cli/avos fresh
php avos-php/cli/avos schema:validate

php avos-php/tests/next/run.php
php avos-php/tests/next/auth.php
php avos-php/tests/next/api.php
php avos-php/tests/next/content.php

# real HTTP
cd avos-php && php -S 0.0.0.0:8199 tests/next/dev-router.php &
AVOS_HTTP_BASE=http://127.0.0.1:8199 php avos-php/tests/next/content-http.php

cd frontend && node scripts/verify-urls.mjs
python3 tools/retirement-evidence.py .
AV_OWNER_EMAIL=owner-fixture@example.test python3 tools/identity-leak-guard.py \
  frontend/src admin/src docs
```

---

## 11 · Not started

Phase 3F. No production content migrated. No admin UI. No media processing.
Nothing pushed, nothing deployed.
