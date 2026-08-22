# Phase 3C Report — Identity, Authentication, RBAC, Security Events

**Commit:** `0f3eb7f` · **Tags:** `phase3c-start` (`2688bdb`) → `phase3c-complete`
**Not pushed. Not deployed. Hostinger untouched. No content migrated.**

---

## Status

| Item | Status |
|---|---|
| Identity | **COMPLETE** |
| Password security | **COMPLETE** |
| Login | **COMPLETE** |
| Sessions | **COMPLETE** |
| CSRF | **COMPLETE** |
| RBAC | **COMPLETE** |
| Authorization | **COMPLETE** |
| Security events | **COMPLETE** |
| Password reset | **COMPLETE** (delivery reports `not_configured` — no mailer yet, by design) |
| MFA | **DEFERRED** — interface declared, `NOT_IMPLEMENTED`, fails closed |
| API | **COMPLETE** (6 auth endpoints) |
| Tests | **PASS** — 211 total (86 + 125), 0 fail |
| Secret scan | **PASS** — 0 findings |
| Private email leak guard | **PASS** — both directions verified |
| **Legacy runtime changes** | **0** |

---

## Files created (19)

**Identity** `app/Identity/{EmailIdentity,User,UserRepository}.php`
**Auth** `app/Auth/{PasswordHasher,SessionManager,LoginThrottle,AuthService,PasswordResetService,MfaProviderInterface,NullMfaProvider,MailerInterface,NullMailer}.php`
**RBAC** `app/Rbac/Authorizer.php`
**Security** `app/Security/{SecurityEvent,SecurityEventRecorder}.php`
**HTTP** `app/Http/{Request,Router}.php`, `app/Http/Controllers/AuthController.php`
**Composition** `app/Bootstrap/AuthKernel.php`
**Entry** `public-next/api/index.php`
**Migration** `database/next/migrations/010_password_resets.sql`
**Tests** `tests/next/auth.php`

## Files modified (1)

`tools/retirement-evidence.py` — registered the Phase 3C entry points. Without
this the analyzer classified the new API front controller as ARCHIVE. Same
class of problem as Phase 3B; the tool must know about each new entry point.

**Legacy files modified: 0** — verified per-path with `git status`:
`avos-php/backend`, `avos-php/database/migrations`, `avos-php/public_html`,
`avos-php/includes`, `frontend/src`, `admin/src` → all **0 changed**.

---

## Database

**1 migration added:** `010_password_resets` → `password_resets`
(`token_hash CHAR(64) UNIQUE`, `expires_at`, `used_at`, `invalidated_at`,
FK → `users` ON DELETE CASCADE).

Total: **60 tables** (+ ledger = 61). Schema validation: 0 missing tables,
columns or indexes; 0 unexpected tables.

**No new permissions or roles were added** — the 48 permissions and 7 roles
seeded in Phase 3B are exactly what RBAC now enforces.

---

## Endpoints added (6)

| Method | Path | Auth | CSRF |
|---|---|---|---|
| POST | `/api/v1/auth/login` | none (throttled) | n/a |
| POST | `/api/v1/auth/logout` | session | **required** |
| GET | `/api/v1/auth/session` | optional | n/a |
| POST | `/api/v1/auth/password/change` | session | **required** |
| POST | `/api/v1/auth/password/reset/request` | none | n/a |
| POST | `/api/v1/auth/password/reset/complete` | none (token) | n/a |

Served by a **new isolated front controller** at `avos-php/public-next/api/index.php`,
deliberately *not* inside the legacy `public_html/`, so Phase 3C cannot alter the
legacy runtime. Where it mounts in the deployment package is a Phase 3E decision.

---

## Tests — 211 pass, 0 fail

```
php avos-php/tests/next/run.php    →  86 pass
php avos-php/tests/next/auth.php   → 125 pass
```

§3C.16 matrix, all covered:

| Group | Notable assertions |
|---|---|
| Identity | create/find/active/suspended, duplicate email rejected, weak password rejected, public projection omits hash and 2FA secret |
| Password | hash ≠ plaintext, verify, wrong password, empty stored hash fails safely, policy |
| Login | valid, invalid, **unknown email returns the identical result to a wrong password**, suspended identical, session created, rotation, logout, expiry, revocation |
| Throttle | locked after 5 failures; a different IP unaffected; clearing unlocks |
| CSRF | missing / invalid / valid; **empty-vs-empty can never match** |
| RBAC | all 7 roles asserted positively *and* negatively (e.g. content_manager can write but **cannot** publish; editor **cannot** manage roles → no inheritance) |
| Authorization | allowed, denied, unauthenticated, suspended, invalid role, owner-only |
| Security events | all 13 types recorded; password/token/enc_key **not** stored; session id never in the log |
| Reset | hash-only storage, single use, expiry, invalidation by password change, no enumeration |
| MFA | unavailable, `NOT_IMPLEMENTED`, verify never true, flagged account **fails closed** |
| API | malformed JSON, oversized body, wrong content type, unknown route |

### Live HTTP verification (real server, real cookies)

```
unauthenticated session   → {"authenticated":false, mfa:NOT_IMPLEMENTED}
wrong password            → 401 UNAUTHENTICATED "Invalid email or password."
unknown email             → 401 UNAUTHENTICATED "Invalid email or password."   ← identical
valid login               → ok, csrf 48 chars, password_hash present: False
authenticated session     → roles ['editor'], 16 permissions, is_owner False
logout without CSRF       → 419 CSRF_FAILED
logout with CSRF          → ok
session after logout      → authenticated: False
```

---

## Design decisions worth recording

**Anti-enumeration is enforced, not assumed.** Unknown email, wrong password,
suspended and soft-deleted accounts all produce the same code, message and
approximate timing — a password verify runs even when no user exists, against a
dummy hash, so response time does not distinguish them. Asserted by a test that
compares the two results directly.

**Owner resolution happens in exactly one place.** §3C.9 forbids scattering
`if ($user === owner)`. `Authorizer::isOwner()` is the only implementation, and
it resolves against `EmailIdentity` — never a hardcoded address, never a role
name. When no owner address is configured the system **fails closed**: nobody
is owner, and `requireOwner()` denies everyone including the first account.

**MFA fails closed.** An account with `twofa_enabled=1` cannot log in at all
while no provider exists — it raises `503 MFA_UNAVAILABLE` rather than
degrading to password-only. Silently ignoring a second factor because it is
unimplemented would be worse than refusing.

**Password reset never claims a send.** `NullMailer::isConfigured()` is false,
so the endpoint returns `delivery: "not_configured"`. The raw token is returned
only to internal callers and is never in the HTTP response.

---

## Known limitations

1. **MFA is not implemented.** Interface, columns and the login seam exist. No
   enrolment, no verification, no UI, no fake status.
2. **No mailer.** Reset tokens are generated and stored but cannot be
   delivered. Email is Phase 3O.
3. **CLI session emulation.** `SessionManager` uses a `$GLOBALS` session id
   under CLI so tests can exercise the full lifecycle. Under HTTP it uses the
   real PHP session; verified live.
4. **`user_roles` is populated only for users created by the new code.**
   Migrating existing legacy users is Phase 3R.
5. **Rate limiting is login-specific.** A general per-endpoint limiter is
   Phase 3E.
6. **Not verified on Hostinger/LiteSpeed.** All evidence is local PHP 8.4.23 +
   MariaDB 11.8. **REQUIRES STAGING EVIDENCE.**

## Unresolved issues

1. **The owner email is still not configured anywhere.** `owner_email_set` is
   `false`, so *no account can currently be owner*. Before Phase 3D this must be
   set via `AV_OWNER_EMAIL` or the private config — I will not write it into the
   repository. **Needs you.**
2. **Legacy user migration strategy** — legacy `users.role_id` is single-role;
   the new schema is many-to-many. Mapping is designed but not executed
   (Phase 3R).
3. **Session absolute timeout is 12 h, idle 120 min** — taken from the contract
   defaults. Confirm these are the values you want.
