# AV OS — Private Configuration Runbook (§88)

**Purpose:** move `config.local.php` out of the web root so it cannot be served
over HTTP under any Apache/LiteSpeed configuration.
**Status:** application support **implemented and proven locally**. The final
step on the live account is manual — git deployment can only write *inside* the
web root, so it cannot create a directory above it.

> **Never print secret values.** Every verification below reports
> SET / NOT SET / VALID / true / false only.

---

## 1 · Account path

Discovered from the repository, not invented:

| Source | Evidence |
|---|---|
| `STAGING-BACKEND-RUNBOOK.md` | `/home/u747717869/config.local.php`, `/home/u747717869/public_html/next` |
| `STAGING-BACKEND-RUNBOOK.md` | DB user `u747717869_avos_staging` |

→ **Account user: `u747717869`**
(`u123456789` in `DEPLOY-HOSTINGER-PHP.md` is a placeholder example — ignore it.)

```
/home/u747717869/
├── avos-private/              ← CREATE THIS (never served, never in git)
│   ├── config.local.php
│   ├── logs/  backups/  uploads/  cache/  versions/
└── public_html/
    └── next/                  ← web root = the `hostinger` branch
        ├── index.html  assets/  os/  api/  admin/
        └── backend/ includes/ database/   (deny-protected)
```

**Confirm the username before running anything:** hPanel → Files → File Manager,
or `echo $HOME` over SSH. If it differs, substitute it everywhere below.

---

## 2 · Create the private directory

**hPanel → Advanced → SSH Access** (or File Manager):

```bash
mkdir -p ~/avos-private/{logs,backups,uploads,cache,versions}
chmod 700 ~/avos-private
```

Create `~/avos-private/config.local.php` with your **existing** values —
copy them from the current `/home/u747717869/public_html/next/config.local.php`.
Do not retype secrets, do not paste them into chat, do not commit the file.

```php
<?php
// AV OS — PRIVATE configuration. Outside the web root. Never committed.
$env = 'production';

$db = [
  'host'    => 'localhost',
  'name'    => '',   // existing value
  'user'    => '',   // existing value
  'pass'    => '',   // existing value
  'charset' => 'utf8mb4',
];

$sessionHours = 12;
$encKey       = '';  // EXISTING AV_ENC_KEY — must not change, or stored
                     // secrets become undecryptable. Rotation is a separate step.
$siteUrl      = 'https://next.abhijeetvarghese.com';
$turnstile    = ['site_key' => '', 'secret_key' => ''];
```

```bash
chmod 600 ~/avos-private/config.local.php
```

> **Permissions note.** `700`/`600` is correct on Hostinger because PHP runs as
> your account user. My local rig runs Apache as `www-data`, so I tested with
> `755`/`644`; the mechanism is identical, only the owning user differs.

---

## 3 · Point the application at it

Two options — **either** works. Option A is explicit and preferred.

### Option A — environment variables (hPanel → PHP → PHP configuration → environment)

```
AV_PRIVATE_DIR = /home/u747717869/avos-private
AV_CONFIG_FILE = /home/u747717869/avos-private/config.local.php
```

### Option B — no configuration at all

The application walks up from the web root looking for `avos-private/`,
**skipping any candidate containing a `public_html` / `htdocs` / `www` / `public`
segment**. From `/public_html/next` it correctly rejects `/public_html` and
selects `/home/u747717869/avos-private`.

*Verified locally with zero environment variables:* `config_source: "AV_PRIVATE"`,
`private_source: "ancestor"`, both `outside_webroot: true`.

---

## 4 · Delete the old copy, then enable strict mode

**Order matters.** Verify first (§5), then:

```bash
rm ~/public_html/next/config.local.php
```

Then add:

```
AV_REQUIRE_PRIVATE_CONFIG = 1
```

With this set, AV OS **refuses to boot in production** if the configuration or
private storage is inside the web root — so the insecure layout can never
silently return. Leave it off until the private config is confirmed working.

---

## 5 · Verify without revealing secrets

**a) The application boots**

```
https://next.abhijeetvarghese.com/api/session
→ {"ok":true,"data":{"authed":false,...}}
```

**b) The old path is gone**

```
https://next.abhijeetvarghese.com/config.local.php   → 403 or 404 (never 200)
```

**c) Secret-free self-report.** `av_config_security()` returns booleans and
categories only — no values, no lengths that could aid guessing:

```php
[
  'config_source'           => 'AV_CONFIG_FILE' | 'AV_PRIVATE' | 'ancestor' | 'legacy-in-webroot',
  'config_outside_webroot'  => true,
  'private_source'          => 'AV_PRIVATE_DIR' | 'ancestor' | 'legacy-in-webroot',
  'private_outside_webroot' => true,
  'db_configured'           => true,
  'db_password_set'         => true,   // SET / NOT SET only
  'enc_key_set'             => true,
  'enc_key_strong'          => true,   // >= 32 chars — never the value
  'strict_mode'             => true,
]
```

**Target state:** `config_outside_webroot: true`, `private_outside_webroot: true`,
`strict_mode: true`.

Also available: `php backend/scripts/doctor.php` over SSH.

---

## 6 · Rollback

```bash
cp ~/avos-private/config.local.php ~/public_html/next/config.local.php
# and unset AV_REQUIRE_PRIVATE_CONFIG
```

The legacy in-web-root path still works (deny-protected, reported insecure), so
recovery is immediate if anything misbehaves.

---

## 7 · What is deliberately NOT done here

- **No credential rotation.** `AV_ENC_KEY` must not change until the path is
  proven — changing it makes stored secrets undecryptable. Rotation is a
  separate, controlled step you have deferred.
- **Nothing pushed or deployed.**
- **`storage/` on the live account.** Once `avos-private/` exists, `AV_STORAGE`
  follows it automatically, so new logs/backups/uploads are written outside the
  web root. Existing files under `public_html/next/storage/` should be moved
  across during the same maintenance window.
