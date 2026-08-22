# AV OS — Backend Architecture (Phase 2 contract, v1.0)

**Grounded in Phase 1 evidence.** Nothing here is implemented. Phase 3 builds to
this contract; deviation requires an amendment to this document.

Target: PHP 8.2/8.3 · MariaDB · Apache/LiteSpeed · Hostinger **shared** hosting.
No VPS, Docker, Redis, daemon, root, or mandatory SaaS/AI.

---

## 1 · Runtime shape

```
REQUEST
  │
  ▼
public_html/api/index.php          front controller (thin)
  ▼
Kernel                             request id · timing · security headers · error boundary
  ▼
Router            ──────────────►  /api/v1/{domain}/{resource}[/{id}[/{action}]]
  ▼
Middleware pipeline                auth → rbac → csrf → rate-limit → content-type → validate
  ▼
Controller                         HTTP ⇄ domain translation ONLY
  ▼
Service                            business rules · transactions · emits domain events
  ▼
Repository                         SQL only · prepared statements · no business logic
  ▼
MariaDB
  ▲
Response                           { ok, data, error } + X-Request-Id
```

**Invariants**
- Controllers never touch PDO. Repositories never contain rules. Services never emit HTTP.
- Every mutating request is wrapped in a transaction owned by the service.
- Every state change emits a domain event; audit/email/webhooks subscribe. Never inline.

## 2 · Architecture dependency diagram

```
                       ┌────────────┐
                       │  identity  │  (no deps — leaf)
                       └─────┬──────┘
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐         ┌──────────┐
   │  auth   │────────►│  users   │────────►│  rbac    │
   └────┬────┘         └──────────┘         └────┬─────┘
        │                                        │
        └──────────────► audit ◄─────────────────┘
                           ▲
   ┌───────────────────────┼───────────────────────────────┐
   │                       │                               │
┌──▼─────┐  ┌────────┐  ┌──▼──────┐  ┌────────┐  ┌──────┐ │
│content │─►│ media  │  │ routing │◄─│  seo   │  │ nav  │ │
└──┬─────┘  └───┬────┘  └────┬────┘  └────────┘  └──────┘ │
   │            │            │                            │
   ▼            ▼            ▼                            │
┌────────┐  ┌────────┐  ┌──────────┐                      │
│builder │  │ webgl  │  │publishing│──────────────────────┘
└────────┘  └────────┘  └────┬─────┘
                             │
      ┌──────────┬───────────┼───────────┬──────────┐
      ▼          ▼           ▼           ▼          ▼
   ┌──────┐  ┌───────┐  ┌────────┐  ┌───────┐  ┌───────┐
   │ jobs │  │ email │  │ cache  │  │ forms │  │booking│
   └──────┘  └───────┘  └────────┘  └───┬───┘  └───┬───┘
                                        ▼          │
                                     ┌──────┐      │
                                     │ crm  │◄─────┘
                                     └──────┘
```

Arrows are *depends on*. No cycles. `identity`, `jobs`, `cache`, `audit` are
leaves that anything may use.

## 3 · Module contracts

Format: **responsibility · inputs · outputs · DB ownership · API ownership ·
dependencies · security boundary · extensibility**

### identity
Single source for the two email identities. · Config/env · Address strings + safety assertions · **owns no tables** · none (never exposed) · none · **Owner address is server-side only; `assertClientSafe()` guards every client-bound payload** · Additional identities (billing, support) added as constants + config keys.

### auth
Login, logout, session lifecycle, throttling, 2FA, recovery. · Credentials, TOTP codes · Session, CSRF token · `users`(shared) `sessions` `login_attempts` `security_events` · `/api/v1/auth/*` · identity, users, audit · **The only module that may write `sessions`; owner-email comparison happens here, never client-side** · Passkeys/WebAuthn slot into the same session issuance path.

### users · roles · permissions (RBAC)
Accounts and authorisation. · Admin input · User records, permission sets · `users` `roles` `permissions` `user_roles` `role_permissions` · `/api/v1/users/*`, `/api/v1/roles/*` · audit · **Owner-only operations gated above Super Admin** · New permissions are additive rows; no code change.

### content
Pages, projects, case studies, journal, experience, clients, testimonials — with versions. · Editor payloads · Content records, revisions · `pages` `page_versions` `projects` `case_studies` `articles` `article_versions` `categories` `tags` `experience` `clients` `testimonials` · `/api/v1/pages|projects|case-studies|articles/*` · media, seo, routing · **Draft content must never be readable by an unauthenticated request** · New types via `content_types` + `content_fields` (already exist).

### builder
Visual page composition. · Node trees · Renderable structure · `builder_pages` `builder_nodes` `builder_node_devices` `builder_components` `builder_templates` · `/api/v1/pages/{id}/builder` · content, media, webgl · Same as content · Device modes and node types are data, not code.

### media
Assets, variants, focal points, usage graph. · Uploads · Derivatives + metadata · `media` `media_variants` `media_usage` · `/api/v1/media/*` · jobs · **Masters outside the web root; derivatives public; uploads never executable** · New formats = new variant rows.

### routing
Route registry, redirects, canonicals, sitemap. · Content slugs · Resolved routes · `page_routes` `redirects` · `/api/v1/routes/*`, `/api/v1/redirects/*` · content · Public read-only · Registry stays the single source of truth (already true in the frontend).

### seo
Meta, schema, scoring. · Content · SEO payloads · `page_seo` `seo_analysis` `seo_schema` · `/api/v1/seo/*` · content, routing · Public read of published SEO only · **AI scoring is an extension point, reported `unavailable` until real** (no fake AI).

### forms · leads · crm
Intake and pipeline. · Public submissions · Leads, activity · `forms` `form_fields` `form_submissions` `leads` `lead_notes` `lead_status_history` · `/api/v1/forms/*`, `/api/v1/leads/*`, `/api/v1/crm/*` · email, jobs, audit · **Public may POST a submission and nothing else; reads are authenticated** · Pipeline states are data.

### booking
Availability, slots, bookings. · Public slot requests · Confirmed bookings · `booking_availability` `booking_blackouts` `booking_slots` `bookings` `booking_intake_fields` `booking_intake_values` · `/api/v1/bookings/*` · email, jobs · **Public sees free/busy only — never another client's identity** · Multi-service/multi-resource ready.

### webgl · animations
Scenes, shaders, timelines. · Uploads/config · Scene bindings · `webgl_assets` `shader_assets` `animation_assets` `scene_bindings` · `/api/v1/webgl/*`, `/api/v1/animations/*` · media · **Master `.glsl`/`.glb` outside the web root; only compiled derivatives are served** · New renderers are new asset kinds.

### publishing
draft → review → scheduled → published → archived, with rollback. · Content ids · Published artefacts + snapshots · `publish_queue`(exists) `deployments`(exists) `versions`(exists) · `/api/v1/publishing/*` · content, jobs, cache, audit · **`publish` is a distinct permission, separate from `write`** · New targets = new publish drivers.

### email
Templates and queued delivery. · Events · Queued messages · `email_templates` `email_logs` · `/api/v1/settings/email` · identity, jobs · **Client templates may only use `Identity::publicEmail()`; owner templates never leave the server** · SMTP driver swappable; no SaaS required.

### jobs (queue)
Background work. · Job payloads · Results · `jobs` `job_attempts` · `/api/v1/jobs/*` (read/retry only) · — · Admin-only · Cron+flock now; a worker pool later without contract change.

### cache
Content/query/route caching. · Keys · Values · filesystem (no table) · none · — · Never caches an authenticated response · Redis optional, never required.

### audit
Immutable event log. · Domain events · Records · `audit_logs` · `/api/v1/audit/*` · — · **Append-only; never records secrets** · Retention policy is config.

### system · settings
Health, diagnostics, configuration. · — · Status payloads · `site_settings` `system_settings` `design_tokens` · `/api/v1/system/*`, `/api/v1/settings/*` · — · **Diagnostics return booleans/categories, never secret values** · New checks are additive.

## 4 · What is deliberately NOT rebuilt

Phase 1 shows 88 existing tables. Many exist for legacy-admin features that the
locked requirements now forbid or defer:

| Existing tables | Disposition | Reason |
|---|---|---|
| `ai_agents` `ai_agent_jobs` `ai_agent_memory` `agent_outcomes` `ai_requests` | **DEFERRED** | No mandatory external AI; local inference impossible on shared hosting (D1). No fake AI. |
| `integrations` `integration_calls` `social_profiles` `social_drafts` | **DEFERRED** | "No external SaaS dependency for core functionality." |
| `knowledge_*` `research_*` `facts` `intelligence_metrics` `competitors` `backlinks` `keyword_*` `search_console_*` | **DEFERRED** | Legacy-admin-only; not in the locked scope. |
| `dev_repos` `dev_events` | **ARCHIVE** | No consumer (Phase 1). |
| `companies` `contacts` `opportunities` `proposals` `tasks` `campaigns` | **REVIEW** | Overlaps the new CRM; consolidate rather than duplicate. |

**Rule:** a deferred table is neither dropped nor carried into the new runtime.
It stays in the legacy schema until Phase 3S, when the retirement gates decide.

## 5 · Shared-hosting constraints (locked)

| Constraint | Consequence |
|---|---|
| No daemon | Queue = MariaDB + cron + `flock`, 60s granularity, documented |
| No Redis | Filesystem cache with a null driver fallback |
| No root | No package installs; PHP extensions assumed: PDO, mbstring, curl, GD. **Imagick and FFmpeg are NOT assumed** |
| No Composer at runtime | Bespoke PSR-4 autoloader; any vendor code is committed |
| Git deploy writes only inside the web root | Private config/storage placed manually once (runbook exists) |
| LiteSpeed, not Apache | `.htaccess` honoured but **REQUIRES STAGING EVIDENCE** for exact parity |

## 6 · Non-goals

Not a framework. Not multi-tenant. Not horizontally scaled. No GraphQL. No SSR
for the public site (it is prerendered and must stay that way for resilience).
