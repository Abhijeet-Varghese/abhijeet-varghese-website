# Phase 3D Report — API Core

**Commit:** `6a4d4f0` · **Tags:** `phase3d-start` (`4d0a9e6`) → `phase3d-complete`
**Not pushed. Not deployed. Hostinger untouched. No content migrated. No admin UI.**

---

## Status

| Item | Status |
|---|---|
| API bootstrap | **COMPLETE** |
| Router | **COMPLETE** |
| Request abstraction | **COMPLETE** |
| Response system | **COMPLETE** |
| Validation | **COMPLETE** |
| Pagination | **COMPLETE** |
| Authentication middleware | **COMPLETE** |
| Authorization middleware | **COMPLETE** |
| CORS | **COMPLETE** |
| Rate limiting | **COMPLETE** |
| Audit integration | **COMPLETE** |
| Health endpoint | **COMPLETE** |
| HTTP verification | **PASS** |
| Security tests | **PASS** |
| Regression tests | **PASS** |
| Secret scan | **PASS** |
| Private email leak guard | **PASS** |
| **Legacy runtime changes** | **0** |

---

## Files created (14)

`app/Api/{ErrorCatalog,ApiException,ApiResult,Pagination,QuerySpec}.php`
`app/Http/Middleware/{AuthMiddleware,PermissionMiddleware,CorsMiddleware,SecurityHeadersMiddleware,RateLimitMiddleware}.php`
`app/Security/DbRateLimiter.php`
`app/Domain/System/{SettingsRepository,SystemService}.php`
`app/Http/Controllers/SystemController.php`
`app/Bootstrap/ApiKernel.php`
`tests/next/api.php`

## Files modified (5)

`app/Http/Router.php` (rewritten for params + middleware + 405)
`app/Http/Request.php` (rewritten: immutable, request id, params, user)
`public-next/api/index.php` (uses ApiKernel)
`tests/next/auth.php` (adapted to the new HTTP primitives — see A3)
`tools/retirement-evidence.py` (registered new entry points)
`docs/API-CONTRACT.md` (implemented status + amendments)

**Legacy files modified: 0** — verified per path:
`avos-php/backend`, `avos-php/database/migrations`, `avos-php/public_html`,
`avos-php/includes`, `frontend/src`, `admin/src` → **0 changed each**.

---

## Endpoints implemented (10)

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

No test-only endpoints remain. `/system/settings` and `/system/health` are real,
permanent system endpoints and serve as the service/repository exemplar
(§3D.15) — they are not stubs.

---

## Tests — 337 pass, 0 fail

```
tests/next/run.php    86   (3A/3B)
tests/next/auth.php  125   (3C)
tests/next/api.php   126   (3D)
```

### §3D.21 security matrix — verified over real HTTP

| Case | Result |
|---|---|
| unauthenticated protected endpoint | **401** |
| authenticated, insufficient permission (editor) | **403** |
| authenticated with permission (administrator) | **200** |
| owner-only, owner NOT configured | **403** (fail closed) |
| owner-only, owner configured (isolated test env) | **200** |
| malformed JSON | **400** `INVALID_JSON` |
| invalid content type | **415** |
| oversized payload (>1 MB) | **413** |
| invalid method | **405** with `details.allowed: ["GET","HEAD"]` |
| invalid route | **404** |
| invalid parameter (unknown key) | **404** |
| invalid sort field | **422** (allow-list) |
| SQL-like filter value | **200**, bound as data; table intact |
| XSS-like input | stored/returned as data; JSON-escaped |
| rate-limit trigger | 5×200 then **429**, `Retry-After: 900` |
| CORS rejection | no allow-origin header; preflight **403** |
| request ID generation | unique per request |
| sanitized internal error | no SQL/path/trace in any response |

### Owner email — both states (§3D.24)

**STATE A (unset, current):** `is_owner=false` for every account,
`/system/owner-status` → **403**, and **ordinary permission-protected routes are
unaffected** — administrator still gets 200 on `/system/settings`.

**STATE B (set via `AV_OWNER_EMAIL` in an isolated test env only):**
owner resolves, `/system/owner-status` → **200**, non-owner → **403**.

The real private address was never used: the fixture is
`owner-fixture@example.test`, and 0 private-email literals exist in the repo.

---

## Defect found by real HTTP testing

`curl -I` (HEAD) exposed it: **global middleware was composed per matched
route**, so 404 and 405 responses carried **no security headers at all**.
A unit test could not have caught this — it only appears when nothing matches.

Fixed: globals now wrap the entire dispatch, including route resolution.
Verified: a 404 now returns `X-Content-Type-Options`, `X-Frame-Options` and
`X-Request-Id`. `HEAD` support was added in the same change.

## Regression caught by the suite

Phase 3D changed shared `Http\Request` (added required `$requestId`) and
`Http\Router` (throws `ApiException` instead of `AppException`). This broke the
**frozen Phase 3C test file**. No Phase 3C runtime code changed. The test was
updated and the change is recorded as amendment **A3**.

---

## Contract deviations (recorded, not silent)

**A1 — response envelope.** §3D.4 puts `request_id` at the top level and renames
`error.fields` to `error.details`; the Phase 2 contract did the opposite.
Implemented per §3D.4, with `error.request_id` retained as a duplicate so
Phase 3C clients keep working.

**A2 — two extra error codes.** `PAYLOAD_TOO_LARGE` (413) and
`UNSUPPORTED_MEDIA_TYPE` (415) added to the 14 required; the request parser
needs them.

**A3 — shared HTTP primitives changed** (see above).

All three are documented in `docs/API-CONTRACT.md`.

---

## Known limitations

1. **CSRF is not enforced on unauthenticated POSTs** (login, reset request) —
   there is no session token to compare. They are protected by rate limiting
   instead. This is deliberate and standard.
2. **Rate limits are per route + IP.** A distributed source is not mitigated;
   that needs a WAF, unavailable on shared hosting.
3. **`DbRateLimiter` fails OPEN** on a storage error. Rate limiting is a
   mitigation, not an authorisation control — the real gates are auth and RBAC.
   A logged failure is preferable to locking the site out.
4. **Only 2 domain endpoints exist** (`system/settings`, `system/health`).
   The pattern is proven; content modules are Phase 3E+.
5. **General per-endpoint rate limiting is not applied to reads** — only to the
   sensitive auth endpoints, per the phase scope.
6. **Not verified on Hostinger/LiteSpeed.** Evidence is PHP 8.4.23 built-in
   server + MariaDB 11.8. **REQUIRES STAGING EVIDENCE** — in particular whether
   LiteSpeed passes `Origin` and custom headers identically.

## Unresolved

1. **Owner email still unset.** Deliberate, and the API works without it — but
   no owner-only operation can succeed until it is configured via
   `AV_OWNER_EMAIL` or the private config. I will not put it in the repository.
2. **CORS production value** — currently empty (same-origin). Confirm whether
   `/os/` will ever be served from a different origin.
3. **Mount point for `public-next/`** in the deployment package is still open;
   it is deliberately outside `public_html/` so the legacy runtime stays
   untouched.
