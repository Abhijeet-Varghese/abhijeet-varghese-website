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
