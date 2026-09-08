# AV OS — Database

MySQL/MariaDB, `utf8mb4`/InnoDB. Single database, one canonical schema.

## Migration framework

- `database/migrations/*.sql` — ordered, idempotent (all `IF NOT EXISTS` / `INSERT IGNORE`).
- `database/migrate.php` — CLI runner:
  - `php database/migrate.php` (apply pending) · `--fresh` (drop & recreate) · `--list`
  - Records every file in `schema_migrations (id, name, executed_at, checksum)`.
  - **Migrations are immutable**: a changed file is refused (checksum drift) — ship a new numbered file.
- The web installer (`/install/`) runs `schema.sql` **plus** all migrations, pure PDO (no `exec()`).

## Tables (43)

**Core**
`users` (bcrypt, role_id, status, must_change_password) · `roles` (6) · `permissions` (25+) ·
`role_permissions` · `sessions` · `login_attempts` · `audit_logs` · `site_settings` · `sites` (multi-site ready)

**Content**
`content_store` (key_name, data JSON, updated_by) · `versions` (entity/entity_id/version/data/note —
every content save creates a version; 50 kept per entity) · `content_metrics`

**Media**
`media` (filename random hex, original_name, type, mime, width/height, alt_text, tags, urls for
webp/avif/thumb, usage_count, created_by)

**CRM**
`leads` (UTM capture, status enum, score, updated_at for inactivity) · `contacts` · `companies` ·
`opportunities` (pipeline stages + probability + value) · `activities` · `meetings` (subject,
scheduled_at, duration, type, status, outcome) · `tasks` · `lead_scoring_rules` (configurable rules)

**Forms**
`forms` · `form_submissions`

**Business**
`proposals` (scope, deliverables, timeline, investment, terms, validity, status draft→expired) ·
`projects` (business projects) · `project_milestones` · `project_documents`

**Analytics**
`analytics_events` (visitor_id, path, referrer, UTMs, device, event_type, sites_id) · `campaigns`
(name, utm_source/medium/campaign, status, budget, dates, description)

**AI**
`ai_providers` (code, label, model, temperature, api_key_encrypted) · `ai_requests` (usage log:
provider, action, prompt, response, model, tokens, ok) · `knowledge_items`

**Automation**
`automations` (trigger_event, conditions JSON, actions JSON, run_count, last_run_at, last_check_at) ·
`automation_runs` (history with results) · `notifications` (info/success/warning/critical)

**Platform**
`integrations` · `webhooks` (+`webhook_deliveries` with HMAC status) · `api_keys` (sha256-hashed,
revoke, last_used) · `feature_flags` · `system_errors` · `email_templates` (7 seeded, CMS-editable) ·
`email_log` (queue + delivery status) · `deployments` (history + content snapshot + site snapshot path) ·
`schema_migrations`

## Relationships

```
Company ──< Contact ──< Lead (via lead_id) ──< Meeting
Company ──< Opportunity ──< Proposal
Opportunity ──< Business Project ──< (published) Case Study (content_store projects)
Lead/Meeting/Project → activities (timeline)
```

## Migrations list

| File | Adds |
|------|------|
| 001_initial.sql | Base: auth, RBAC, content_store, versions, media, leads, forms, audit, providers |
| 002_crm_platform.sql | sites, CRM (companies…tasks), scoring, proposals, analytics, automations, notifications, webhooks, api_keys, flags, knowledge, errors, email_log |
| 003_email_ai_health.sql | email_templates + 7 seeds, campaigns description/dates, automations.last_check_at |
| 004_leads_activity.sql | leads.updated_at (drives lead.inactive trigger) |
| 005_deployments.sql | deployments (history + rollback snapshots) |

## Migrations 006–007

006: soft-delete + updated_at on all business tables · `redirects` · `ai_prompts` (5 seeded, versioned) ·
`perf_log` · automation `test_mode` · webhook delivery retry fields · project progress/health ·
indexes (created_at/path/status lookups).
007: `sessions` registry (token_hash unique, ip, user_agent, expires_at, last_seen_at) — powers
revocation + active-session view.


## Migration invariants (enforced by backend/core/MigrationRunner.php)

1. Migrations are immutable history — a file whose checksum changed after being recorded is refused.
2. Migrations must be portable: **no CREATE/DROP/ALTER DATABASE** (refused), and no `USE <db>`
   (legacy `USE` statements are skipped explicitly; 002_crm_platform.sql contains one, kept for history).
3. `php database/validate-migrations.php` fails CI/pre-deploy on violations (also wired into doctor.php).
4. New migrations: numbered files only, `IF NOT EXISTS`/`INSERT IGNORE` style so re-runs are safe.

## Operational data retention (backend/cron/maintenance.php)

api_cache 7d · integration_calls 90d · system_errors 90d · login_attempts 7d · rate_limits 1d ·
perf_log 14d · webhook_deliveries 30d · sessions 90d · ai_requests 365d · ai_agent_jobs 365d ·
ai_agent_memory 365d · audit_logs 730d · analytics_events 730d. Override each via `AV_RET_*` env vars.
