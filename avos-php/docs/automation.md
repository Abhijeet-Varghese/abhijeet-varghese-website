# AV OS — Automation & Notifications

## Engine

DB-stored rules (`automations`): trigger → conditions (JSON) → actions (JSON), with run history in
`automation_runs` (success, results, entity). Every execution is logged; counters + last-run time on
the rule.

## Triggers

| Trigger | Fires when | Context keys |
|---|---|---|
| `lead.created` | public lead / CRM lead created | score, status, name, email, company, source, lead_id |
| `lead.updated` | lead updated | score, status, lead_id |
| `lead.inactive` | inactivity sweep (manual button or cron) | days_min, inactive_days, score, name, email, lead_id |
| `page.published` | publish completes | pages, articles |
| `form.submitted` | public form submission | form_id, submission_id |
| `project.created` | business project created | project_id, name |

## Conditions

`score_min`, `days_min`, `status` — evaluated against the event context (numeric/string compare).
Seeded example: `lead.created` + `score_min:70` → notification + high-priority follow-up task.

## Actions

- `notification` — push to the notification center (title/body rendered with context variables)
- `task` — create follow-up task attached to the entity
- `email` — queue the `follow_up` template to a recipient (context-rendered)
- `webhook` — signed outbound delivery to a URL

## Inactivity sweep (cron-compatible)

- UI: Automations → "Run inactivity check" (POST `/api/automations/check-inactive`).
- Cron (Hostinger): `php /path/to/avos/backend/cron/lead-inactivity.php` — daily is enough; hourly is
  safe (24h dedupe per lead per rule).
- Sweep finds leads with no activity ≥ `days_min`, non-terminal status, then runs matching rules.

## Notifications

Types: info / success / warning / critical (lead, publish, system). Pushed for: high-value leads,
meeting scheduling, publish complete/failed, rollback, backup restore, system errors, security
events. Read/unread, mark-all-read, bell indicator in the shell.

## Email templates

`email_templates` — new_lead, lead_confirmation, contact_confirmation, meeting_confirmation,
password_reset, admin_alert, follow_up. Editable in System → Email Templates; `{variables}` rendered
server-side; test button queues a real test delivery (status visible in Platform → Email log).

## V3 automation

- **Test mode**: `POST /api/automations/test/{id}` dry-runs a rule with a sample context —
  conditions evaluated, planned actions listed, nothing executed; result logged as a test run.
- **Loop guard**: max 5 automation executions per request chain; exceeding → warning logged, chain
  stopped (no infinite loops possible).
- **Webhook retries**: failed deliveries carry `retry_count` + `last_error`;
  `POST /api/webhooks/retry-failed` re-delivers failures (bounded at 3 attempts).
- **Cron safety**: all cron scripts (lead-inactivity, publish-scheduled, maintenance) are
  flock-protected against overlapping runs and record failures.
