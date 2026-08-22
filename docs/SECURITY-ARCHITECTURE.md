# AV OS — Security Architecture (Phase 2 contract, v1.0)

Consolidates the verified §88 work into one contract. Items marked **VERIFIED**
have recorded evidence from the security phases; items marked **CONTRACT** are
requirements Phase 3 must meet.

---

## 1 · Trust boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 0 — PUBLIC INTERNET (untrusted)                             │
│   anonymous browsers · crawlers · attackers                      │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼──────────────────────────────────────────────────┐
│ ZONE 1 — WEB ROOT  /public_html/next/                            │
│   static site · /os/ bundle · /api entry · media derivatives     │
│   ASSUME FULLY READABLE BY ANYONE. No secret may exist here.     │
└───────────────┬──────────────────────────────────────────────────┘
                │ PHP execution only
┌───────────────▼──────────────────────────────────────────────────┐
│ ZONE 2 — APPLICATION (authenticated)                             │
│   services · repositories · RBAC-gated endpoints                 │
└───────────────┬──────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│ ZONE 3 — PRIVATE  /home/<acct>/avos-private/  (never served)     │
│   config.local.php · AV_ENC_KEY · owner email · masters · logs   │
│   · backups · uploads (originals)                                │
└───────────────┬──────────────────────────────────────────────────┘
                │ localhost only
┌───────────────▼──────────────────────────────────────────────────┐
│ ZONE 4 — MariaDB (never publicly reachable)                      │
└──────────────────────────────────────────────────────────────────┘
```

**Rule:** data crosses inward freely, outward only through an explicit,
authorised, validated response.

## 2 · Endpoint classification

| Class | Auth | Examples | May return |
|---|---|---|---|
| **Public read** | none | `GET /api/v1/content`, published pages/projects/articles, sitemap | published content only |
| **Public write** | none + anti-abuse | `POST /api/v1/forms/{id}/submit`, `POST /leads` | acknowledgement only — never the stored record |
| **Authenticated** | session + permission | everything under `/os/` | scoped to permission |
| **Owner-only** | session + `isOwner` | ownership transfer, admin creation, destructive migration, restore, key config, deploy credentials | as needed |

### A public API response may NEVER contain
Owner email · any user email or password hash · session ids, CSRF tokens,
recovery codes, TOTP secrets · DB credentials, `AV_ENC_KEY`, SMTP credentials,
API keys · filesystem paths · SQL, stack traces, class names · draft or archived
content · another visitor's lead/booking/submission · internal ids that leak
volume (use opaque references where a count is sensitive) · audit or security
event records.

Enforced by `Identity::assertClientSafe()` on client-bound payloads, plus
explicit response DTOs — never `SELECT *` straight to JSON.

## 3 · Control matrix

| Threat | Control | Status |
|---|---|---|
| SQL injection | PDO, `ATTR_EMULATE_PREPARES=false`, repositories only; no user input in SQL strings | **VERIFIED** — 0 findings across the engine |
| XSS | React escapes by default; rich text sanitised on write (allow-list); no `dangerouslySetInnerHTML` without sanitiser; CSP without `script-src 'unsafe-inline'` | **VERIFIED** (CSP 75/75 hashes) |
| CSRF | Central middleware on all mutating verbs; `X-CSRF-Token`; reject empty on both sides | **VERIFIED** (419 on missing) + **CONTRACT** (empty-token hardening) |
| Session theft | HttpOnly, SameSite=Lax, Secure on HTTPS, rotation on login/2FA, server-side revocation | **VERIFIED** |
| Auth bypass | Middleware pipeline; UI hiding is never the boundary | **CONTRACT** |
| Path traversal | Allow-list pattern + `realpath()` containment + null-byte/encoded rejection | **VERIFIED** — 6 encodings → 404, empty body |
| Upload execution | Extension blocklist, `finfo` MIME, random storage names, SVG sanitisation, `php_flag engine off`, per-dir deny | **VERIFIED** — `.php/.phtml/.php.webp`/PHP-in-GIF → 403, not executed |
| MIME spoofing | `finfo` on content, not filename; extension∩MIME must agree; `X-Content-Type-Options: nosniff` | **VERIFIED** |
| Rate limiting | Per-IP + per-identity windows in MariaDB (`rate_limits`) | **VERIFIED** |
| Credential leak | Secrets only in Zone 3; CI secret scan + identity leak guard | **VERIFIED** — 0 in package |
| Error leak | One sanitised envelope + request id | **VERIFIED** — induced DB failure returned no SQL/path/trace |
| Directory exposure | `Options -Indexes` + per-directory `Require all denied` | **VERIFIED** — held with the root `.htaccess` deleted |
| Config exposure | Private config outside the web root; strict mode refuses in-root config | **VERIFIED** — `/config.local.php` → 404 with root `.htaccess` removed |
| Source exposure | No `.map`, `.ts`, `.php` in the package; CI asserts | **VERIFIED** |
| Backup exposure | Backups in Zone 3 only; never a public path | **CONTRACT** |
| Double booking | `FOR UPDATE` + state machine + `UNIQUE(resource_id, starts_at)` | **CONTRACT** |

## 4 · Headers (verified live)

`Content-Security-Policy` (sha256 hashes, no script `unsafe-inline`) ·
`X-Content-Type-Options: nosniff` · `X-Frame-Options: SAMEORIGIN` ·
`Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy` ·
`Strict-Transport-Security` · `Cross-Origin-Opener-Policy: same-origin` ·
`Cross-Origin-Resource-Policy: same-origin` ·
`X-Permitted-Cross-Domain-Policies: none` · `X-Powered-By` removed.

**Known limitations (not claimed as solved):**
- `style-src 'unsafe-inline'` retained — critical CSS inlines a different
  `<style>` per page; a static policy cannot enumerate them.
- `Server:` header cannot be removed from `.htaccess` on shared hosting.
- CSP will need `wasm-unsafe-eval` if WebGL adopts a WASM path; `worker-src
  blob:` is already permitted.

## 5 · Secret management

| Secret | Location | Never |
|---|---|---|
| DB credentials | Zone 3 private config | git, package, logs, responses |
| `AV_ENC_KEY` | Zone 3 private config | anywhere else; rotation invalidates stored secrets |
| Owner email | Zone 3 / `AV_OWNER_EMAIL` | source, git, client artefacts |
| SMTP credentials | Zone 3 | git, package |
| CI secrets | GitHub secrets | echoed in logs |

Diagnostics report **presence and validity only** (`SET`/`NOT SET`,
`enc_key_strong: true`) — never a value, never a length that aids guessing.

## 6 · Private configuration resolver (contract)

Priority: `AV_CONFIG_FILE` → `AV_PRIVATE/config.local.php` → nearest
**non-web-exposed** ancestor `avos-private/` → legacy in-web-root (deprecated).

`av_path_is_web_exposed()` treats any `public_html|htdocs|www|public` segment,
or anything at/below the app root, as served. This exists because
`dirname(AV_ROOT)` for `/public_html/next` is `/public_html` — still public.

`AV_REQUIRE_PRIVATE_CONFIG=1` makes production refuse to boot with an in-web-root
config. An explicitly-set but unreadable `AV_CONFIG_FILE` fails loudly and never
silently downgrades. **VERIFIED** — 7/7 boot matrix.

## 7 · Audit

Structure: `actor_id · action · resource_type · resource_id · before · after ·
ip · user_agent · request_id · result · created_at`. Append-only; no update or
delete path in the API. Retention configurable, default 24 months.

**Never logged:** passwords, hashes, tokens, TOTP secrets, recovery codes,
session ids, `AV_ENC_KEY`, DB/SMTP credentials, full request bodies of auth
endpoints.

## 8 · Continuous enforcement (CI gates, all blocking)

1. §103 clean-URL acceptance (static + runtime)
2. Secret scan (repo + assembled package)
3. Identity leak guard (owner email, personal mailboxes)
4. Package guarantees — no `config.local.php`/`.env`/`.git`, no `.sql/.bak/.log/.map/.pem/.key`, no credential literals
5. Per-directory deny files present and containing `Require all denied`
6. CSP present and hash-complete
7. PHP lint · typechecks · builds

## 9 · Residual risk (accepted, documented)

| Risk | Why accepted |
|---|---|
| LiteSpeed ≠ Apache | All evidence is Apache 2.4.68. **REQUIRES STAGING EVIDENCE.** |
| Config in web root until the manual step | Deny-protected; strict mode available; runbook issued |
| `style-src 'unsafe-inline'` | Low severity vs. per-page hashing complexity |
| 60s queue latency | Shared-hosting constraint, documented not hidden |
| No WAF | Not available on shared hosting |
