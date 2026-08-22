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

### 2a · A SECOND DATABASE IS REQUIRED (measured, not assumed)

The new runtime **must not** share the legacy staging database. 20 table names
collide (`users`, `roles`, `sessions`, `media`, `projects`, `leads`, `forms`,
`audit_logs`, …) with incompatible definitions. Reproduced against a real copy
of the legacy schema:

```
php cli/avos migrate          FAILS  012_media_engine.sql: Unknown column 'kind' in 'media'
php cli/avos schema:validate  missing_columns 52 · missing_indexes 27
```

Worse, the failed run still writes ~50 new tables **into the legacy database**.
So: **never point the new runtime at the legacy database, not even once.**

In **hPanel → Databases → MySQL Databases**:

1. create a new database, e.g. `u747717869_avos_next`;
2. grant the **existing** staging DB user access to it (no new password needed),
   or create a dedicated user if you prefer.

### 2b · Write the private config

Create `~/avos-private/config.local.php` with your **existing** values — copy
`$db`, `$encKey` from the current
`/home/u747717869/public_html/next/config.local.php`. Do not retype secrets, do
not paste them into chat, do not commit the file.

```php
<?php
// AV OS — PRIVATE configuration. Outside the web root. Never committed.
$env = 'staging';          // next.abhijeetvarghese.com is the staging host
$debug = false;            // public host: never emit stack traces (A15)

// LEGACY runtime — leave exactly as it is today.
$db = [
  'host'    => 'localhost',
  'name'    => '',   // existing legacy database
  'user'    => '',   // existing value
  'pass'    => '',   // existing value
  'charset' => 'utf8mb4',
];

// NEW runtime (amendment A15). Keys omitted here are inherited from $db,
// so normally only the database name changes.
$dbNext = [
  'name' => 'u747717869_avos_next',
  // 'user' => '', 'pass' => '',   // only if you created a dedicated user
];

$sessionHours = 12;
$encKey       = '';  // EXISTING AV_ENC_KEY — must not change, or stored
                     // secrets become undecryptable. Rotation is a separate step.
$siteUrl      = 'https://next.abhijeetvarghese.com';
$ownerEmail   = '';  // private owner address — this file only, never in git
$turnstile    = ['site_key' => '', 'secret_key' => ''];
```

```bash
chmod 600 ~/avos-private/config.local.php
```

> **Permissions note.** `700`/`600` is correct on Hostinger because PHP runs as
> your account user.

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

*Verified in an exact replica of this layout, with zero environment variables:*
`config_source: "ancestor:avos-private"`, `private_source: "ancestor:avos-private"`,
both `outside_webroot: true`.

---

## 3a · Create the schema and the first owner (SSH)

`cli/` now ships with the package, deny-protected (`Require all denied`,
`php_flag engine off`) so it is unreachable over HTTP and usable only over SSH.

```bash
cd ~/public_html/next

php cli/avos health            # config source, outside-webroot flags, DB reachability
php cli/avos migrate           # 12 migrations -> 61 tables in the NEW database
php cli/avos seed              # 49 permissions · 7 roles · 9 settings · 3 nav groups
php cli/avos schema:validate   # must print all four counters as 0
php cli/avos owner:init        # first owner account; prompts for a password (echo off)
```

`health` prints booleans and category names only. The expected shape:

```json
"config": { "env": "staging", "config_source": "ancestor:avos-private",
            "db_profile": "dbNext", "config_outside_webroot": true,
            "private_outside_webroot": true, "db_password_set": true,
            "enc_key_set": true, "enc_key_strong": true },
"database": { "ok": true, "database_exists": true, "table_count": 61 }
```

`db_profile` **must read `dbNext`** — if it reads `db`, the new runtime is
pointed at the legacy database: stop and fix `$dbNext` before migrating.

`owner:init` never accepts the address or the password as an argument, refuses a
piped password, and refuses to run twice. Nothing it prints contains the
address.

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
https://next.abhijeetvarghese.com/api/v1/system/health     NEW runtime
→ {"ok":true,"data":{"status":"ok","application":"alive",
                     "database":"reachable","config":"valid",...}}

https://next.abhijeetvarghese.com/api/session              LEGACY runtime
→ {"ok":true,"data":{"authed":false,...}}
```

Before the private config exists both return HTTP 500 `CONFIGURATION_ERROR` —
that is the correct fail-closed state, not a routing fault.

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
