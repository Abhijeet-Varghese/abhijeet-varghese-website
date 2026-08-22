# AV OS — API Contract (Phase 2, v1.0)

`/api/v1` — the contract Phase 3 implements. **Nothing here is built.**
The surface it must ultimately satisfy is evidenced in `API-REFERENCE.md`
(65 legacy endpoints and their real consumers).

---

## 1 · Conventions

```
/api/v1/{domain}/{resource}[/{id}[/{action}]]
```

| Aspect | Rule |
|---|---|
| Verbs | `GET` read · `POST` create/action · `PUT` full update · `PATCH` partial · `DELETE` remove |
| Content type | `application/json` required on write; wrong type → `415` |
| Auth | session cookie `AVOS_SESS`; no bearer tokens in v1 |
| CSRF | `X-CSRF-Token` on every mutating verb |
| Pagination | `?page=&per_page=` (max 100) → `data.items` + `data.total` |
| Filtering | explicit allow-listed params only; never raw SQL fragments |
| Idempotency | `Idempotency-Key` honoured on `POST /bookings` and `POST /jobs` |
| Request id | every response carries `X-Request-Id` |

### Envelope
```json
{ "ok": true,  "data": { }, "error": null }
{ "ok": false, "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "…",
             "request_id": "AV-20260822-AB12CD", "fields": { "slug": "required" } } }
```

### Error codes (stable)
`UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `CSRF_FAILED` 419 ·
`VALIDATION_ERROR` 422 · `NOT_FOUND` 404 · `CONFLICT` 409 ·
`RATE_LIMITED` 429 · `PAYLOAD_TOO_LARGE` 413 · `UNSUPPORTED_MEDIA` 415 ·
`SERVER_ERROR` 500. Messages are human-readable and **never** contain SQL,
paths, class names or stack traces.

## 2 · Domain map

```
/api/v1
├── auth/          login logout session 2fa/{setup,verify,disable} forgot reset change-password
├── users/         CRUD · roles · revoke-sessions · reset-password        [users.*]
├── roles/         CRUD · permissions                                     [roles.manage]
├── pages/         CRUD · builder · seo · versions · publish              [pages.*]
├── projects/      CRUD (?case_study=1) · versions · publish              [projects.*]
├── articles/      CRUD · categories · tags · publish · schedule          [articles.*]
├── experience/    CRUD · reorder                                         [content.*]
├── clients/       CRUD · testimonials                                    [content.*]
├── media/         upload · CRUD · variants · focal · usage               [media.*]
├── routes/        list · resolve · conflicts                             [routes.*]
├── redirects/     CRUD · hits                                            [redirects.*]
├── navigation/    CRUD · reorder                                         [navigation.*]
├── seo/           per-route get/put · schema · analysis · sitemap        [seo.*]
├── forms/         CRUD · fields · submissions · export · submit(PUBLIC)  [forms.*]
├── leads/         CRUD · notes · status · export                         [leads.*]
├── crm/           clients · proposals · activity                         [crm.*]
├── bookings/      availability(PUBLIC) · hold · confirm · cancel · reschedule
├── webgl/         scenes · shaders · bindings                            [webgl.*]
├── animations/    CRUD · presets                                         [animations.*]
├── publishing/    publish · schedule · rollback · preflight · deployments · versions
├── settings/      site · design-tokens · email{templates,smtp,log} · webhooks
├── audit/         list · filter                                          [audit.read]
├── system/        status · diagnostics · security · health · backups · errors · analytics
└── jobs/          list · retry · cancel                                  [jobs.manage]
```

## 3 · Endpoint specification format

Every endpoint in Phase 3 must be documented in this exact shape:

```
METHOD  /api/v1/pages/{id}
AUTH        required
PERMISSION  pages.write
REQUEST     { title?, slug?, template?, status?, publish_at? }
VALIDATION  slug: /^[a-z0-9-]+$/, unique across page_routes
            status ∈ enum; publish_at required iff status='scheduled'
RESPONSE    200 { data: Page }
ERRORS      401 403 404 409(slug conflict) 419 422
SIDE EFFECTS  writes content_versions; invalidates route+sitemap cache;
              emits page.updated
AUDIT       action=page.update, before/after diff
```

### Worked examples

```
POST /api/v1/auth/login
AUTH none · rate: 60/15min per IP, 5/15min per email+IP
REQUEST { email, password }
RESPONSE 200 { user:{id,name,role}, must_change_password, must_2fa }
ERRORS 401 INVALID_CREDENTIALS (identical for unknown user) · 429
SIDE EFFECTS session issued unless must_2fa; sessions row created
AUDIT login · SECURITY EVENT login_success|login_failed
NEVER RETURNS password_hash, twofa_secret, owner email
```

```
POST /api/v1/forms/{id}/submit          ← PUBLIC WRITE
AUTH none · honeypot + rate limit + optional Turnstile
REQUEST { fields:{…} }  validated against form_fields
RESPONSE 200 { data:{ received:true } }        ← acknowledgement ONLY
ERRORS 422 · 429
SIDE EFFECTS form_submissions row; lead created/matched; queues owner
             notification to Identity::ownerEmail() (server-side)
AUDIT form.submit (actor=null)
NEVER RETURNS the stored record, the lead id, or any email address
```

```
POST /api/v1/bookings/hold              ← PUBLIC WRITE
REQUEST { slot_id, Idempotency-Key }
RESPONSE 200 { data:{ hold_token, expires_at } }
ERRORS 409 CONFLICT (slot taken) · 429
SIDE EFFECTS transaction: SELECT … FOR UPDATE on booking_slots;
             state free→held with TTL; UNIQUE(resource_id,starts_at) backstop
AUDIT booking.hold
NEVER RETURNS other bookings, names, or emails — free/busy only
```

```
POST /api/v1/publishing/{type}/{id}/publish
AUTH required · PERMISSION publishing.publish
SIDE EFFECTS preflight validation → snapshot (content_versions) →
             route activation → cache invalidation → verification →
             deployments row; queues sitemap regeneration
ERRORS 409 if preflight fails (returns the failing checks)
AUDIT publish (before/after status)
```

## 4 · Public vs authenticated surface

**Public (unauthenticated):** `GET /api/v1/content` (published only) ·
`GET /api/v1/bookings/availability` (free/busy only) ·
`POST /api/v1/forms/{id}/submit` · `POST /api/v1/leads` (public intake) ·
`GET /api/v1/system/status` (booleans only).

Everything else requires a session **and** a permission.

## 5 · Versioning & deprecation

`v1` is additive-only once Phase 3E ships. Breaking changes go to `v2`.
Legacy unversioned `/api/*` paths remain as 301/410 shims until
`tools/retirement-evidence.py` reports zero consumers — the same evidence gate
used for file deletion.

## 6 · Not specified yet (honest gaps)

- Per-endpoint request/response JSON schemas — **DEFERRED to Phase 3E**, written
  alongside each controller so they cannot drift from the implementation.
- Webhook payload signatures — **DEFERRED to Phase 3O**.
- Analytics event taxonomy — **UNKNOWN**, needs product input.


---

# Phase 3D — IMPLEMENTED (amendments and status)

Everything above this line remains the *plan*. This section records what is
actually built as of Phase 3D. Endpoints not listed here are **PLANNED**.

## Amendment A1 — response envelope (supersedes §1 above)

§3D.4 of the Phase 3D brief specifies a different envelope from the Phase 2
contract. It is implemented as specified and recorded here rather than changed
silently:

| | Phase 2 contract | Implemented (Phase 3D) |
|---|---|---|
| request id | inside `error.request_id` | **top level `request_id`**, on success *and* failure |
| validation detail key | `error.fields` | **`error.details`** |

`error.request_id` is **retained as a duplicate** so any Phase 3C client that
already reads it keeps working. Both shapes are emitted.

```json
{ "ok": true,  "data": {...}, "error": null, "request_id": "AV-20260822-89CE04" }
{ "ok": false, "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...},
             "request_id": "AV-..." },
  "request_id": "AV-..." }
```

## Amendment A2 — error codes

The catalog implements 16 codes: the 14 required by §3D.5 plus
`PAYLOAD_TOO_LARGE` (413) and `UNSUPPORTED_MEDIA_TYPE` (415), which the request
parser needs. `ErrorCatalog` owns the code→status mapping; controllers cannot
invent one.

## Amendment A3 — shared HTTP primitives changed

`Http\Request` gained a required `$requestId`; `Http\Router` now throws
`ApiException` (was `AppException`). No Phase 3C **runtime** code changed, but
the Phase 3C **test file** was updated to match. Recorded because Phase 3C is
frozen.

## IMPLEMENTED endpoints (10)

| Method | Path | Auth | Permission | Rate limit |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | public | — | 20 / 15 min |
| POST | `/api/v1/auth/logout` | session | — | — |
| GET | `/api/v1/auth/session` | optional | — | — |
| POST | `/api/v1/auth/password/change` | required | — | 10 / 15 min |
| POST | `/api/v1/auth/password/reset/request` | public | — | 5 / 15 min |
| POST | `/api/v1/auth/password/reset/complete` | public | — | 10 / 15 min |
| GET | `/api/v1/system/health` | optional | — | — |
| GET | `/api/v1/system/settings` | required | `settings.read` | — |
| GET | `/api/v1/system/settings/{key}` | required | `settings.read` | — |
| GET | `/api/v1/system/owner-status` | required | **owner only** | — |

`HEAD` is accepted wherever `GET` is.

## Pagination (IMPLEMENTED)

```json
{ "items": [...],
  "pagination": { "page": 1, "per_page": 25, "total": 9,
                  "total_pages": 1, "has_more": false } }
```
`per_page` default 25, **hard maximum 100**. No endpoint may return an
unbounded set.

## Filtering & sorting (IMPLEMENTED)

`?field=value&sort=field&order=asc|desc`. Both filter and sort fields come from
a per-endpoint allow-list. A disallowed **filter** is ignored; a disallowed
**sort or order** is a `422`. Values are always bound parameters — a request can
never contribute SQL text.

## CORS (IMPLEMENTED)

Allow-list from `AV_CORS_ORIGINS` (comma-separated). Default is **empty**:
same-origin only, no CORS headers emitted. `Access-Control-Allow-Origin: *` is
never sent — these APIs are credentialed. A disallowed origin receives no
allow-origin header; a disallowed preflight receives `403`.

| Environment | Typical value |
|---|---|
| local | `http://localhost:5173` |
| staging | `https://next.abhijeetvarghese.com` |
| production | empty (same-origin) |

## Security headers (IMPLEMENTED)

Applied to **every** response including 404/405:
`X-Content-Type-Options: nosniff` · `Referrer-Policy: no-referrer` ·
`Cache-Control: no-store, no-cache, must-revalidate, private` · `Pragma: no-cache` ·
`X-Frame-Options: DENY` · `X-Request-Id` · `X-Powered-By` removed.

## Versioning

`/api/v1` is current and additive-only. A future `/api/v2` mounts as a second
router namespace in `ApiKernel`; v1 routes stay registered and unchanged until
the evidence tool reports zero consumers. **v2 is not implemented.**

## Still PLANNED (not built)

Content, pages, projects, articles, media, routes, redirects, navigation, SEO,
forms, leads, CRM, bookings, WebGL, animations, publishing, audit, jobs.

---

# Phase 3E — IMPLEMENTED (content engine)

## Amendment A4 — `published_at` is a new column, distinct from `publish_at`

Migration 003 gave content a `publish_at` column. The Phase 3E brief requires
`published_at`. These are **not** the same thing and were not merged:

| Column | Meaning | Set by |
|---|---|---|
| `publish_at` | scheduling **intent** — "go live at …" | author |
| `published_at` | the moment the content **actually became public** | `PublishingService` |

Collapsing them would make "was this ever live, and when?" unanswerable.
`published_at` is cleared on unpublish; the publish moment survives in
`content_versions`.

Added to `pages`, `projects`, `articles`, `experience` by migration 011.

## Amendment A5 — new state `unpublished`

The approved ENUM was `draft, review, scheduled, published, archived`. §3E.8
requires an explicit UNPUBLISHED state. It is **not** `archived`:

- `unpublished` — taken down, route stays reserved, may return
- `archived` — retired, only recoverable to `draft`

Migration 011 widens the ENUM on all four content tables to
`draft, review, scheduled, published, unpublished, archived`, so **one** state
machine (`Content\ContentState`) serves every type instead of a special case
for `experience` (which previously had only three states).

`experience.status` default also moves `published` → `draft`: a create API must
never publish by accident.

### Transition table (enforced by `ContentState`, not by callers)

| From | Allowed to |
|---|---|
| `draft` | review, scheduled, published, archived |
| `review` | draft, scheduled, published, archived |
| `scheduled` | draft, published, archived |
| `published` | unpublished, draft, archived |
| `unpublished` | draft, published, archived |
| `archived` | draft |

A rejected transition is **409 CONFLICT** (well-formed request, wrong state),
not 422.

## Amendment A6 — new permission `content.delete`

API-CONTRACT §2 routes `experience/` through `content.*`, but the Phase 2
permission set had no `delete` action in that domain while `pages`, `projects`
and `articles` all did. `content.delete` is added to `SystemSeeder`.

It is granted **only** through the owner/administrator wildcard. Editor and
Content Manager do not receive it — consistent with the fact that neither holds
`pages.delete` either. Permission count: **48 → 49**.

## Amendment A7 — public content lives under `/api/v1/content/*`

Phase 2 §4 named a single public endpoint, `GET /api/v1/content`. §3E.16
requires a clear public/authenticated split. The split is by **path prefix**,
because a path split is testable over the router's own inventory:

```
/api/v1/content/*            PUBLIC   · published rows only · no session
/api/v1/{pages|projects|articles|experience}/*
                             AUTHENTICATED · session + permission · drafts visible
```

The public surface is served by a separate `PublicContentService` holding a
separate set of column allow-lists — not by a boolean flag on the management
service that a caller could get wrong.

## Amendment A8 — `SchemaValidator` now parses `ALTER TABLE`

Migrations 001–010 are checksummed and frozen, so 011 extends existing tables by
`ALTER`. The validator only understood `CREATE TABLE`, which would have left
every Phase 3E column ungated. It now applies `ADD/MODIFY/DROP COLUMN` and
`ADD KEY` in file order. This modifies Phase 3A/3B code; the change is purely
additive and is recorded here because 3A/3B is frozen.

Verified by deliberately dropping `pages.excerpt` — the gate reported
`missing_columns 1: pages.excerpt`.

## Behaviour fixed by contract, not left to callers

| Rule | Enforcement |
|---|---|
| `POST /{type}` **always** creates a `draft` | `ContentService::create` overrides any supplied status |
| `status` is **not** writable via PUT/PATCH | returns **409** naming the `publish` / `unpublish` actions |
| Publishing requires `publishing.publish` | not `{type}.write` — a Content Manager edits everything, publishes nothing |
| Restore never changes publication state | version payload `status` is history, not an instruction |
| Restore appends a new version | history is never rewritten or deleted |
| A slug collision is **409** with a `suggestion` | never a silent rename — a silently changed URL is an SEO incident |
| An explicit slug containing `.html`, `.php` or `/` is **422** | only a slug *derived from a title* is normalised |

## Columns added by migration 011

| Table | Added |
|---|---|
| `pages` | `excerpt`, `content` (JSON), `published_at`, `author_id` |
| `projects` | `description`, `content` (JSON), `metadata` (JSON), `published_at`, `author_id`, `created_by`, `updated_by` |
| `articles` | `featured`, `published_at`, `created_by`, `updated_by` |
| `experience` | `content` (JSON), `published_at`, `author_id`, `created_by`, `updated_by` |

Plus FKs to `users` for every actor column and `idx_*_published` indexes.
No table was created and none was dropped: **60 tables, unchanged**.

## Content document format (`content` / `body` JSON)

Builder-compatible, so Phase 3G can project it into `builder_nodes` without a
translation layer. The visual builder UI is **not** built.

```json
{ "version": 1,
  "blocks": [
    { "type": "hero", "name": "Intro",
      "props": { "heading": "…" }, "styles": { },
      "responsive": { "mobile": { "visible": false } },
      "children": [ { "type": "text", "props": { "body": "…" } } ] } ] }
```

Limits: **256 KB**, **500 blocks**, **12 levels** deep. Devices are
`mobile|tablet|laptop|large`, matching `builder_node_devices.device`.

**§3E.13 enforced literally:** a block carrying `author_id`, `client_id`,
`status`, `slug`, `published_at`, `created_by`, `updated_by`, `category_id` or
`tag_id` is rejected **at any depth**, including inside a responsive override.
Those are relational columns and a JSON copy would immediately drift.

## Version creation policy (§3E.7)

A version **is** created on: create · update *when the sha256 of the versioned
payload changes* · publish · unpublish · restore.

A version is **not** created for: any read · a no-op save · soft delete ·
a reorder that changes nothing · route hit counters · cache signals · audit
writes.

The payload is an **allow-list** of authored columns
(`AbstractContentRepository::versioned()`), which is what makes "no secrets in
versions" structural rather than a promise.

## Routing integration (§3E.11)

There is **no second route registry**. `frontend/src/routes/routes.json` remains
the build-time registry and `page_routes` (migration 005) the runtime table.

Path rule, derived from the live registry rather than invented:

```
default            /{slug}
explicit override  kept if the existing canonical's last segment == slug
```

Evidence — production has **no per-type URL prefix**:

```
/story                                                    page
/case-study-immersive-solutions-for-the-indian-army       project
/experience-design/orange-business-executive-briefing-center   project (nested)
/essay-technology-should-feel-human                       article
/journal-what-a-year-of-ai-enabled-production-taught-me   article
```

Inventing `/projects/{slug}` would have broken every existing canonical.

Publishing activates the canonical route inside the same transaction as the
status change. Unpublishing sets it `disabled` and keeps the row, so the URL
stays reserved. A slug change on republish moves the canonical and leaves a
**301** behind — a URL that once worked never starts returning 404.

## IMPLEMENTED endpoints (58 new · 68 total)

### Public — no session, published content only

| Method | Path |
|---|---|
| GET | `/api/v1/content` |
| GET | `/api/v1/content/resolve?path=` |
| GET | `/api/v1/content/pages` · `/api/v1/content/pages/{slug}` |
| GET | `/api/v1/content/projects` · `/api/v1/content/projects/{slug}` |
| GET | `/api/v1/content/articles` · `/api/v1/content/articles/{slug}` |
| GET | `/api/v1/content/experience` |

### Authenticated management — `{type}` ∈ `pages | projects | articles | experience`

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/{type}` | `{domain}.read` |
| POST | `/api/v1/{type}` | `{domain}.write` |
| GET | `/api/v1/{type}/{id}` | `{domain}.read` |
| PUT / PATCH | `/api/v1/{type}/{id}` | `{domain}.write` |
| DELETE | `/api/v1/{type}/{id}` | `{domain}.delete` |
| POST | `/api/v1/{type}/{id}/publish` | `publishing.publish` |
| POST | `/api/v1/{type}/{id}/unpublish` | `publishing.publish` |
| GET | `/api/v1/{type}/{id}/preflight` | `{domain}.read` |
| GET | `/api/v1/{type}/{id}/versions` | `versions.read` |
| GET | `/api/v1/{type}/{id}/versions/{version}` | `versions.read` |
| POST | `/api/v1/{type}/{id}/versions/{version}/restore` | `versions.restore` |
| POST | `/api/v1/experience/reorder` | `content.write` |

`{domain}` is `pages`, `projects`, `articles` for those types and `content` for
`experience` (API-CONTRACT §2).

CSRF (`X-CSRF-Token`) is required on every mutating verb — verified over real
HTTP, not asserted.

## Deferred relationships (§3E.12)

Not built, because no approved table represents them:

| Relationship | Status |
|---|---|
| project → tag | **DEFERRED** — no `project_tags` table |
| page → category | **DEFERRED** — no `page_categories` table |
| article → related article | **DEFERRED** — no table |
| project → media gallery | **DEFERRED to Phase 3H** — `media_usage` exists but media is a later phase |
| content → SEO record | **DEFERRED to Phase 3J** — `page_seo` exists, keyed on `page_routes.id` |

Implemented, because the schema does represent them: `project → client`,
`article → category`, `article → tag`, `content → author`,
`content → page_route`.

---

# Phase 3F — IMPLEMENTED (media & asset engine)

## Amendment A10 — Phase 3E route-count assertion scoped

Phase 3F adds public media reads under `/api/v1/content/media`, which is the
public prefix amendment A7 established. That inflated the Phase 3E test's
"58 content routes" count to 60. The frozen Phase 3E **test file** was scoped to
exclude `/media`; no Phase 3E **runtime** code changed. Recorded because 3E is
frozen — the same situation as amendment A3 in Phase 3D.

## Amendment A11 — `script` added to `media.kind`

The approved ENUM covered image/video/audio/document/model/texture/shader/font/
other. §3F.2 requires a SCRIPT class and it had no home. `MODEL_3D` maps onto
the existing `model` value rather than adding a synonym.

## Amendment A12 — `media.visibility`

New `ENUM('public','private') DEFAULT 'public'`. Required by §3F.24. It does not
merely hide an asset: a private asset gets **no published copy and no
derivatives**, so no public byte exists to be guessed at.

## Amendment A13 — `media_variants.purpose` gains `xlarge`

The approved vocabulary had four image purposes (thumb/card/hero/full). §3F.10
asks for a five-step ladder, so `xlarge` completes it without introducing a
second naming convention:

| Brief | Approved purpose | Width |
|---|---|---|
| thumbnail | `thumb` | 320 |
| small | `card` | 640 |
| medium | `hero` | 1280 |
| large | `full` | 1920 |
| xlarge | `xlarge` | 2560 |

## Amendment A14 — additional media columns (migration 012)

| Table | Added |
|---|---|
| `media` | `visibility` `extension` `public_path` `crop`(JSON) `meta`(JSON) `version` `replaced_by` `uploaded_by` |
| `media_variants` | `hash` `storage_path` |

Plus FKs to `users` and `media`, and `idx_media_visibility` / `idx_variant_format`.
**No table was created or dropped — still 60 tables.**

## Permissions — NO new permission (§3F.27)

`media.read`, `media.write` and `media.delete` already existed in the Phase 2
seeder and are used unchanged. **Permission count stays at 49.**

| Role | read | write | delete |
|---|---|---|---|
| Owner / Administrator | ✅ | ✅ | ✅ |
| Media Manager | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ |
| Content Manager | ✅ | ✅ | ❌ |
| SEO Manager | ❌ | ❌ | ❌ |

## Storage layout (§3F.5)

```
PRIVATE  <AV_PRIVATE_DIR>/storage/media/YYYY/MM/xx/<24-hex>.<ext>   ALL originals
PUBLIC   <appRoot>/public-next/assets/media/YYYY/MM/xx/<24-hex>[-purpose-width].<fmt>
```

* `xx` = first two characters of the storage name → 256 buckets, so no directory
  ever holds the whole library.
* The storage name is `sha256(contentHash + salt)` truncated to 24 hex
  characters: deterministic (re-import is idempotent), unguessable without the
  salt, and containing **no database id and no original filename**.
* The original filename survives only as metadata.
* Originals are **never** web-reachable. A public asset gets a published copy
  (hard-linked when the filesystem allows, copied otherwise — the method used is
  reported, not assumed).
* Resolution order: `AV_MEDIA_STORAGE_DIR` / `AV_MEDIA_PUBLIC_DIR` →
  `AV_PRIVATE_DIR/storage` → `<appRoot>/storage`. Never `public_html/`.

## Public asset URLs (§3F.25)

`/assets/media/2026/08/ab/<name>-hero-1280.webp` — a plain static URL served by
the web server, not PHP. No `.php`, no `.html`, no filesystem path, no database
id. No second URL engine was created.

## Upload security (§3F.6, §3F.7)

Eight ordered checks, first failure wins: size → filename shape → deny list on
**every dotted part** → allow-list → sniffed MIME → magic signature → content
scan → full decode. `Security\UploadValidator::BLOCKED_EXT` remains the single
deny list; `Media\MimeRegistry` imports it and a test asserts the two never
contradict.

## Capability reporting (§3F.8, §3F.11, §3F.14)

`GET /api/v1/media/capabilities`. Every format claim is proven by **encoding a
1×1 pixel at runtime**, not inferred from `extension_loaded()`. A derivative row
exists only when its bytes exist, so an AVIF that failed to encode is never
advertised.

## Asset versioning behaviour (§3F.23) — the documented choice

A replacement is a **new asset row**. The old row is retained, marked
`replaced_by`, and soft-deleted **only when nothing references it**. Existing
content keeps pointing at the old id and therefore renders exactly what it
rendered before.

Overwriting bytes in place was rejected: it would mutate every published page
using the asset, retroactively and invisibly.

## IMPLEMENTED endpoints (16 new · 84 total)

### Public
| Method | Path |
|---|---|
| GET | `/api/v1/content/media` |
| GET | `/api/v1/content/media/{id}` |

### Authenticated
| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/media` | `media.read` |
| POST | `/api/v1/media` | `media.write` |
| GET | `/api/v1/media/capabilities` | `media.read` |
| GET | `/api/v1/media/orphans` | `media.read` |
| GET | `/api/v1/media/{id}` | `media.read` |
| PUT / PATCH | `/api/v1/media/{id}` | `media.write` |
| POST | `/api/v1/media/{id}/replace` | `media.write` |
| POST | `/api/v1/media/{id}/restore` | `media.write` |
| DELETE | `/api/v1/media/{id}` `?force=1` | `media.delete` |
| GET | `/api/v1/media/{id}/usage` | `media.read` |
| POST | `/api/v1/media/{id}/usage` | `media.write` |
| DELETE | `/api/v1/media/{id}/usage` | `media.write` |
| GET | `/api/v1/media/{id}/download` | public asset: none · private: `media.read` |

Upload accepts `multipart/form-data` **or** `{filename, content_base64}` JSON.
`/download` is the only endpoint that returns bytes rather than the envelope;
every guard runs before a single byte is emitted.

## Deferred (documented, not built)

| Item | Status |
|---|---|
| Relational `media_tags` | **DEFERRED** — no table; shader tags live in `meta.tags` |
| Video transcoding at upload | **DEFERRED to Phase 3P** — too slow for a shared-hosting request; the service exists for the queue to drive |
| Poster-frame derivatives | **DEFERRED to Phase 3P** — implemented in `TranscodeService`, not wired into upload |
| Automated orphan cleanup | **DEFERRED to a maintenance phase** — §3F.22 requires report-only |
| Derivatives for private assets | **NOT PLANNED** — a public derivative of a private asset defeats the point |
| S3 / external DAM | **FORBIDDEN** by the locked architecture |

## Correction (Phase 3F re-verification) — public asset URL prefix

`StorageManager::PUBLIC_URL_PREFIX` is **`/assets`**, not `/assets/media`. The
public disk is rooted at `<publicRoot>/assets` and every relative path already
begins with `media/`, so a `/assets/media` prefix produced
`/assets/media/media/…` — a URL that 404s.

`StorageManager::publicUrlFor()` is now the **only** place a public asset URL is
constructed; `AssetRepository` and `VariantRepository` call it instead of
building the string themselves. The regression test resolves the URL against the
document root rather than against the constant, so it cannot pass while the
constant is wrong.

Canonical form:

```
/assets/media/2026/08/ab/<24-hex>.<ext>                originals (public assets)
/assets/media/2026/08/ab/<24-hex>-hero-1280.webp       derivatives
```

## Amendment A15 — private configuration: `$dbNext`, `db_profile`, `AV_DEBUG`

**Why.** The legacy backend and the new runtime read the **same** private
`config.local.php`, but they cannot share a **database**: 20 table names collide
(`users`, `roles`, `sessions`, `media`, `projects`, `leads`, `forms`,
`audit_logs`, `permissions`, `role_permissions`, `login_attempts`, `redirects`,
`site_settings`, `notifications`, `rate_limits`, `email_templates`,
`form_submissions`, `builder_components`, `builder_nodes`, `builder_templates`)
and the definitions differ. Measured against a real legacy database:

```
php cli/avos migrate          -> FAILS  012_media_engine.sql: Unknown column 'kind' in 'media'
php cli/avos schema:validate  -> missing_columns 52 · missing_indexes 27
```

`CREATE TABLE IF NOT EXISTS` silently keeps the legacy definition, so the new
runtime would query columns that do not exist — and the failed run still writes
~50 new tables into the legacy database. The two runtimes therefore get two
databases from one config file.

**Contract.**

| Variable | Read by | Meaning |
|---|---|---|
| `$db` | legacy backend **and** new runtime (fallback) | legacy database — unchanged |
| `$dbNext` | new runtime only | new database; keys given here override `$db`, keys omitted are inherited |
| `$debug` | new runtime | `false` forces debug off even in `staging` |

Precedence is unchanged: **environment variables still win** over both.
Omitting `$dbNext` reproduces the previous behaviour exactly.

**Diagnostics.** `Config::safeReport()` and
`GET /api/v1/system/health` (authenticated `detail` shape) gain:

```json
"database_profile": "dbNext" | "db",
"config_source":    "AV_CONFIG_FILE" | "AV_PRIVATE_DIR" | "ancestor:avos-private" | "legacy-in-webroot"
```

A **name**, never a value — it proves the new runtime is on its own database
rather than silently sharing the legacy one. The public health shape is
unchanged.

**`AV_DEBUG`.** Debug may only ever be *narrowed*: `AV_DEBUG=0` (or `$debug =
false`) switches it off on a public staging host; `AV_DEBUG=1` can **not** turn
it on in production.

## Amendment A16 — `cli/avos owner:init` and the shipped `cli/`

A migrated + seeded database holds 7 roles and 49 permissions and **zero users**,
so nothing can authenticate. `owner:init` creates exactly one account:

* the address is **never an argument** — it comes from `AV_OWNER_EMAIL` /
  `$ownerEmail`, so it cannot reach argv, shell history or a process list;
* the password is **never an argument** — read from the terminal with echo off,
  and the command refuses to read one from a pipe;
* it refuses when an owner already exists (it is not a password-reset path);
* its output is redacted (`"email": "[redacted]"`).

`cli/` is now included in the deployment package because there is no other way
to run the real migration engine on shared hosting. It ships with the standard
private-directory deny file (`Require all denied`, `php_flag engine off`,
`RemoveHandler .php`), so it is unreachable and non-executable over HTTP; it is
usable only as `php cli/avos …` over SSH. `tests/` still never ships.
