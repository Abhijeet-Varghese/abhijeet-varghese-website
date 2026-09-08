# AV OS — Authentication & Security

## Flow

1. Installer (`/install/`, self-locking) provisions the Super Admin in the relational `users` table
   with `password_hash()` (bcrypt) and `must_change_password = 1`. No default passwords, ever.
2. `POST /api/auth/login` → `Auth::attempt()`:
   - per-email+IP throttle: `login_attempts` rows, 5 fails / 15 min → `429 RATE_LIMITED`
   - global per-IP guard (60 / 15 min)
   - `password_verify()` → `session_regenerate_id(true)`, CSRF token minted
   - audit `login` event; `last_login_at/ip` recorded
3. First login forces `/admin/change-password.php` (min 12 chars, current verified).
4. Every state-changing request carries `X-CSRF-Token` (419 on mismatch).

## Session hardening

- `session.cookie_httponly`, `SameSite=Lax` (Secure when HTTPS), session timeout (`config.local.php`,
  default 12 h, sliding), destroy on logout.
- IP detection: `REMOTE_ADDR` unless `HTTP_X_FORWARDED_FOR` is present **and** the request came from a
  trusted proxy (config guard) — never blindly trusts headers.

## RBAC

Roles: Super Admin, Admin, Editor, Writer, SEO Manager, Viewer. 25+ permissions in `permissions` +
`role_permissions`. Enforcement is server-side in every API route (`Auth::can()`); hiding buttons in the
UI is only cosmetic. Verified in tests: Viewer cannot publish, cannot list users (403), can read leads
(200 with `leads.read`).

## Threat model coverage

| Attack | Mitigation |
|---|---|
| Brute force | per-email+IP throttle, global IP guard, audit trail |
| Session hijack | regenerate on login, HttpOnly/SameSite cookies, expiry |
| CSRF | token on all POST/PUT/DELETE |
| SQL injection | 100% PDO prepared statements; validated IDs/slugs/pagination/search |
| XSS | output escaping in admin UI and publish engine; search results never echo raw input |
| Path traversal | media/backup names validated by strict regex; router realpath containment |
| Upload attacks | MIME + extension + finfo content check, blocked extensions, random 16-hex filenames, SVG script rejection, no-execute .htaccess in uploads |
| Credential leaks | keys encrypted at rest (aes-256-cbc, AV_ENC_KEY), never serialized to the browser; production refuses insecure defaults (`avos`/`aV0s_d3v_9xKq2mN7`/short keys) |
| Error leaks | production errors return generic messages; details only with AV_DEBUG |

## Security center (admin)

Security view: active-session context, audit trail, failed-login history, throttle info, CSRF state,
logout controls. Login history also lives in `login_attempts` and `audit_logs`.

## V3 session registry

- Login mirrors the PHP session into `sessions` (token hash, IP, UA, expiry).
- Every request verifies the registry row still exists and is unexpired → **server-side session
  revocation** works (verified: revoke → next request 401). `last_seen_at` tracks activity.
- User management: role/status update, disable (auto-revokes), password reset (forces change +
  revokes), delete (refuses to remove the last active Super Admin).
