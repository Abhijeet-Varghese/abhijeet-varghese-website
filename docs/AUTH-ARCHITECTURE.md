# AV OS — Authentication & RBAC Architecture (Phase 2 contract, v1.0)

Grounded in the existing `core/Auth.php`, which was independently audited and
found strong. **This contract carries that implementation forward** rather than
replacing it; the changes below are additive.

---

## 1 · Identities

| Identity | Value | Visibility |
|---|---|---|
| PUBLIC | `hi@abhijeetvarghese.com` | client-visible, safe in HTML/JSON-LD/forms |
| OWNER | **not in source** — private config or `AV_OWNER_EMAIL` | server-side only, never client-visible |

The owner address is deliberately absent from the repository so CI can assert
its literal absence (`tools/identity-leak-guard.py`). Resolution order:
`AV_OWNER_EMAIL` env → `$ownerEmail` in the private config → unset.
Unset is a valid state: `Identity::hasOwnerEmail()` is false and owner
notifications are skipped with a logged warning rather than crashing.

## 2 · Authentication flow

```
POST /api/v1/auth/login  { email, password }
  │
  ├─ rate gate A: per-IP DoS guard        60 / 15 min      → 429 RATE_LIMITED
  ├─ rate gate B: per-email+IP throttle   5 / 15 min (cfg) → 429 THROTTLED
  │                                        (counted from login_attempts)
  ├─ lookup user WHERE email = ? AND status='active'
  ├─ password_verify()  ── fail ─► record attempt(0) ─► 401 INVALID_CREDENTIALS
  │                                 (identical message for unknown user —
  │                                  no account enumeration)
  ├─ password_needs_rehash() → transparently upgrade the hash
  ├─ record attempt(1)
  ├─ session_regenerate_id(true)            ← fixation defence
  │
  ├─ IF twofa_enabled:
  │     $_SESSION['2fa_pending'] = user_id      ← user_id NOT set
  │     router blocks every route except /auth/2fa/* and /session
  │     → 200 { must_2fa: true }
  │
  │     POST /api/v1/auth/2fa/verify { code }
  │       ├─ TOTP window ±1 · or a single-use recovery code
  │       ├─ on success: unset 2fa_pending; issue full session
  │       └─ on failure: security_event(mfa_failed) → 401
  │
  ├─ ELSE issue full session:
  │     $_SESSION['user_id'], ['csrf'] = 24 random bytes, ['created']
  │     INSERT sessions(user_id, token_hash=sha256(session_id), ip, ua, expires_at)
  │
  ├─ UPDATE users.last_login_at/ip
  ├─ audit(login) + security_event(login_success)
  └─ 200 { user, must_change_password }
```

**Every request thereafter:** `Auth::start()` reopens the session, enforces the
12-hour TTL, and re-checks the `sessions` registry — a revoked row logs the user
out immediately. This is what makes server-side revocation real.

**Logout:** destroys the PHP session, deletes the registry row, expires the
cookie.

## 3 · Session contract

| Property | Value |
|---|---|
| Cookie name | `AVOS_SESS` |
| `HttpOnly` | always |
| `SameSite` | `Lax` |
| `Secure` | when HTTPS (`Auth::isHttps()`) |
| Lifetime | `AV_SESSION_HOURS` (default 12), sliding on activity |
| Rotation | on login **and** on 2FA verify |
| Revocation | `sessions` row deleted → next request logs out |
| Storage | PHP session + `sessions` registry (`token_hash = sha256(session_id)`) |

Raw session ids are never logged, never returned, never in an error payload.

## 4 · CSRF

Token minted at session issuance (`bin2hex(random_bytes(24))`), returned by
`GET /api/v1/session`, sent as `X-CSRF-Token`. Enforced centrally in middleware
for **POST, PUT, PATCH, DELETE** — not per-controller.

**Hardening required in Phase 3C** (audit finding L1): `verifyCsrf()` currently
compares with `hash_equals(self::csrf(), $token)`; if the stored token were ever
empty, `hash_equals('','')` is true. Not currently reachable, but the new
implementation must reject empty on both sides.

Also rotate the CSRF token on password change (audit finding L2).

## 5 · Password & recovery

- `password_hash(PASSWORD_DEFAULT)`; rehash on login when the cost changes.
- Minimum 12 characters (installer already enforces this).
- `must_change_password` forces a change before any other action.
- **Reset flow:** `POST /auth/forgot` → always returns the same 200 regardless of
  whether the account exists (no enumeration) → if it exists, a single-use token
  (32 random bytes, sha256-stored, 30-minute TTL, invalidated on use or on a
  password change) is emailed **to the account address**. On completion: all
  sessions for that user are revoked, and a `security_event` notifies the owner.
- Recovery codes for 2FA: 10 single-use codes, hashed at rest, regenerated as a
  set.

## 6 · Lockout

Progressive, per `email+ip`: 5 failures in 15 minutes → throttled (existing
behaviour, DB-configurable via `site_settings.security`). A `lockout`
security_event notifies the owner. **Decision:** no permanent account lock —
on a single-owner system that is a self-denial-of-service vector. Throttling
plus owner alerting is the right trade.

## 7 · RBAC

### Permission naming
`{domain}.{action}` — lowercase, dot-separated. Actions:
`read · write · publish · delete · manage`.

17 codes already exist (`content.read/write`, `media.read/write`,
`leads.read/write`, `forms.read/write`, `users.read/write`, `settings.read/write`,
`ai.read/write`, `audit.read`, `versions.read/restore`). **Carry them forward
unchanged** — they are already seeded and enforced.

### New codes for the rebuilt domains
`pages.*`, `projects.*`, `articles.*`, `seo.*`, `routes.*`, `redirects.*`,
`navigation.*`, `bookings.*`, `crm.*`, `webgl.*`, `animations.*`,
`publishing.publish`, `publishing.rollback`, `jobs.manage`, `system.manage`,
`backup.*`, `roles.manage`.

### Roles

| Role | Grants |
|---|---|
| **OWNER** | everything, plus owner-only operations (below) |
| ADMINISTRATOR | everything except owner-only |
| EDITOR | content/pages/projects/articles read+write, media read+write, `publishing.publish` |
| CONTENT_MANAGER | as EDITOR without publish |
| SEO_MANAGER | `seo.*`, `routes.read`, `redirects.*`, `content.read` |
| MEDIA_MANAGER | `media.*`, `content.read` |
| BOOKING_MANAGER | `bookings.*`, `crm.read`, `leads.read/write` |

**No role inheritance.** Evidence: the existing implementation resolves
permissions by a flat join, and hierarchy makes "why can this user do X?"
hard to answer in an audit. Roles are explicit permission sets; overlap is fine.

`Super Admin` (existing) maps to OWNER during migration.

### Owner-only operations
Ownership transfer · administrator creation · destructive migrations ·
production restore · encryption/key configuration · deployment credentials ·
legacy-backend deletion authorisation.

Gate: `Policy::requireOwner()` — a distinct check above permission evaluation,
resolved against `Identity::isOwner($user->email)`, **never** against a role name
or a hardcoded address.

### Evaluation & enforcement
```
route declares  →  permission('pages.write')
middleware      →  401 if unauthenticated
                →  403 if permission not held
                →  403 if owner-only and !isOwner
controller      →  runs only if both pass
policy          →  per-record checks (e.g. author-only drafts) inside the service
admin UI        →  hides controls the session's permission set lacks
```

**The UI hiding a control is never the security boundary.** The API is. Every
endpoint is enforced server-side regardless of what the admin renders.

## 8 · Audit & security events

Every auth outcome writes to `audit_logs`; security-relevant outcomes also write
`security_events` and may notify the owner:

| Event | Owner notified |
|---|---|
| login success (new device/IP) | yes |
| login failure burst / lockout | yes |
| password change · MFA enable/disable · recovery used | yes |
| administrator created · permission escalation | yes |
| session revoked by admin | no (audit only) |

Notifications go **only** to `Identity::ownerEmail()`, server-side, never
rendered into any client response.

**Never logged:** passwords, password hashes, TOTP secrets, recovery codes,
session ids, CSRF tokens, `AV_ENC_KEY`, DB or SMTP credentials.

## 9 · MFA-ready architecture

TOTP already exists (`twofa_secret`, `twofa_enabled`, `core/Totp.php`). The
contract keeps 2FA as a **gate between authentication and session issuance**, so
adding WebAuthn/passkeys later means adding a verifier at the same point — no
change to session, CSRF or RBAC.

## 10 · Deferred / unknown

- **Device management UI** — DEFERRED to Phase 3P; the `sessions` registry
  already carries `ip`, `user_agent`, `last_seen_at` to support it.
- **IP allow-listing for `/os/`** — DEFERRED; the owner works from variable
  networks, so this needs a real decision, not a default.
- **Whether LiteSpeed preserves PHP session behaviour identically** —
  **REQUIRES STAGING EVIDENCE.**
