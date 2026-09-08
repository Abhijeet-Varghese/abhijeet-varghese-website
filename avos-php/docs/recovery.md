# AV OS — Disaster Recovery (spec §44)

| Scenario | What happens | Recovery |
|---|---|---|
| **Database lost** | Public static site keeps serving (no DB dependency — verified with MariaDB stopped: all pages 200). Admin shows clean errors, never "saved". | Restore the latest backup JSON (`storage/backups/`) via `POST /api/backups/restore` after recreating the DB, or re-run `/install/` then restore. Backups contain content, leads, submissions, user names/roles and AI provider config (never password hashes). |
| **Production site corrupted** | Publish never partially overwrites: builds go to staging, are validated, then atomically swapped. Post-publish verification (critical routes + sitemap) auto-restores the previous deployment on failure. | Manual rollback: `POST /api/publish/rollback` (restores previous site snapshot + content, creates new versions + audit). |
| **Publish fails** | Build stops; current live site untouched; `system_errors` logged; failure notification pushed. | Fix the reported validation error and publish again. Pre-flight (`POST /api/publish/preflight`) reports pages/articles/images/broken links/SEO errors before you commit. |
| **Admin account locked** (throttle) | 5 failed logins → 429 for 15 minutes; audit trail records the attempts. | Wait, or clear `login_attempts` rows (host-level access). Never a default password: installers generate random temp passwords with forced change. |
| **Admin forgotten password** | No self-service reset without email/SMTP configured. | Host-level: `php -r` script using `password_hash()` to set a new hash + `must_change_password=1`, or the `POST /api/users/{id}/reset-password` endpoint (Super Admin). |
| **Media deleted** | Media deletion is soft by default (files kept, row hidden, restore in one click). Permanent deletion is blocked with 409 while any content references the asset. | Restore from trash (API + Leads/Media UI). Files are never touched by soft delete. |
| **Security incident** (revoked sessions) | Sessions registry (`sessions` table) — revoking kills sessions server-side; next request → 401 → forced re-login. | Investigate via audit log + login history + security score; disable the user; reset the password. |
| **Hostinger data-center loss** | | Restore the site from the uploaded files + latest backup JSON. The generated static site in `public_html/site/` can be re-uploaded and served immediately without the backend. |

## Backup validation

Backups are JSON packages (`avos-backup-YYYYMMDD-HHMMSS.json`) written outside the web root, listing via
`GET /api/backups`, downloaded only via the authenticated endpoint. Restore is tested (see QA section):
content keys become new versions, leads/submissions are replaced, users are never restored (passwords
cannot be recovered — by design).

## Retention policy (cron)

`php backend/cron/maintenance.php` (daily): audit logs 365d · system errors 90d · webhook deliveries 30d ·
perf log 14d · analytics 730d. All configurable via `AV_RET_*` env vars; cron jobs are flock-protected
(no overlapping runs, start/end logged).

## Scheduled publishing (cron)

Entities with `status: scheduled` + `scheduled_at` publish automatically when due:
`php backend/cron/publish-scheduled.php` every 5–15 min (flock-protected, notifications on success/failure).
Without cron the system degrades gracefully: scheduled items simply wait; manual publish includes any due items.

## Added during production certification

- **2FA**: TOTP (RFC 6238) — enable/disable with code verification, 10 single-use
  recovery codes (hashed at rest, shown once), session enforcement (API returns
  `2FA_REQUIRED` until the challenge passes), audit events
  (`2FA_ENABLED/DISABLED/FAILED/RECOVERY_USED`), 5-attempt/15-min throttle.
  If the only Super Admin loses the app AND recovery codes: host-level reset —
  `UPDATE users SET totp_enabled=0, totp_secret=NULL WHERE id=1`.
- **SMTP**: server-side config (`/api/smtp`, encrypted in `site_settings`), pure-PHP
  client (plain/STARTTLS/SSL + AUTH LOGIN), queued→sent/failed logging with error
  capture (never passwords). Test via Integrations → SMTP → "Send test email".
- **Inbound webhooks**: `POST /api/webhooks/inbound/calendly` — HMAC-SHA256 signature
  (`Calendly-Webhook-Signature: t=…,v1=…`), 300s replay tolerance, event-ID
  idempotency (failed events retry, processed events never duplicate), mapping
  `invitee.created` → lead/meeting/activity and `invitee.canceled` → meeting
  cancelled; ledger in `inbound_events`; configure the signing key in Platform →
  Webhooks → Inbound.
- **Bulk operations**: `POST /api/content/bulk` (publish/unpublish/archive/restore/
  delete/tag/export) with per-item results, SEO gate on publish, versioned + audited.
  UI: Pages view bulk bar.
- **Production cleanup**: `php backend/scripts/prod-cleanup.php --dry-run|--execute`
  (dry-run runs inside a rolled-back transaction).
- **CLI restore**: `php backend/scripts/restore-backup.php <file.json>` — content
  (versioned), leads, submissions; users are never restored (re-create via the
  installer). Full drill verified: backup → destroy DB → migrations → restore →
  login → content/CRM verified → publish → site live (~2 s active work).
- **Static site at the root**: the generated site in `public_html/site/` is served at
  the web root by `.htaccess` rewrites (production) and the dev router; every public
  page, sitemap, robots, 404 and asset resolves at `/`.


## Backup kinds (v2.4.1)

- **Application Snapshot** — `avos-backup-*.json`: content + leads + submissions + users + AI provider
  metadata. Restored through the admin (validated + transactional: any failure rolls back completely).
- **Database Backup** — `db-*.sql`: full mysqldump (credentials via a chmod-600 defaults-extra-file,
  never on the command line). Restored on the CLI (`php backend/scripts/restore-backup.php` or mysql import).
- **Full Disaster Recovery** — both files + the deployment snapshots in `storage/deployments/`.

Download both kinds from Admin → Backups. `db-*.sql` is deliberately refused by the application
restore API (raw SQL belongs on the CLI).
