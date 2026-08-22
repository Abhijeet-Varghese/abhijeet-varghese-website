# AV OS — Admin Architecture (Phase 2 contract, v1.0)

The new admin is `/os/` (React 19 + TS + Vite SPA, already scaffolded: AppShell,
command palette, DataTable, auth provider, permissions hook — 2,407 LOC).
It will replace `/admin/` **but not yet**.

---

## 1 · Information architecture

```
AV OS
├── Dashboard          overview · activity · system health
├── CONTENT
│   ├── Pages          list · editor · builder · SEO · revisions
│   ├── Projects       incl. Case Studies (is_case_study filter)
│   ├── Journal        essays + journal entries
│   ├── Experience     ordered timeline
│   └── Clients        + testimonials
├── DESIGN
│   ├── Builder        canvas · navigator · inspector · device modes
│   ├── Components     registry · versions
│   ├── Templates
│   ├── Design tokens
│   ├── Animations
│   └── WebGL          scenes · shaders
├── MEDIA              library · variants · focal point · usage graph
├── GROWTH
│   ├── SEO            per-route meta · schema · scoring
│   ├── Redirects
│   ├── Navigation
│   └── Analytics      first-party
├── BUSINESS
│   ├── Forms          builder · submissions
│   ├── Leads          pipeline
│   ├── CRM            clients · proposals · activity
│   └── Bookings       calendar · availability · blackouts
├── PUBLISH
│   ├── Publishing     draft → review → scheduled → published
│   ├── Revisions      diff · restore
│   └── Deployments
└── SYSTEM
    ├── Users · Roles
    ├── Audit · Security
    ├── Email          templates · log · SMTP
    ├── Backups · Jobs
    └── Settings · Health
```

Every node maps to a permission; a user sees only what their permission set
allows. **UI hiding is convenience, never the security boundary** — the API
enforces independently.

## 2 · Screen contract

Every list screen: search · filter · sort · pagination · bulk actions ·
empty state · error state · loading skeleton.
Every editor: autosave with explicit save-state badge · dirty guard on navigate ·
optimistic update with rollback on failure · validation surfaced inline ·
confirmation dialog for destructive actions · undo where the operation is
reversible.

**Required states (no screen ships without all five):**
`loading · empty · populated · error · forbidden`.

## 3 · Reusable components (existing + required)

Existing: `AppShell`, `CommandPalette`, `DataTable`, `PageHeader`,
`SaveStateBadge`, `useApi`, `useContentDoc`, `useDebounce`, `usePermissions`.

Required additions: `ConfirmDialog`, `FormField` set, `MediaPicker`,
`RelationPicker`, `RevisionDiff`, `DeviceModeSwitcher`, `Inspector`,
`TreeNavigator`, `SlotCalendar`, `PipelineBoard`, `StatusPill`, `EmptyState`,
`ErrorBoundary`, `PermissionGate`.

## 4 · Responsive — independently designed, not scaled

Per the locked requirement, admin layouts are **designed per class**, not
reflowed from desktop:

| Class | Width | Layout intent |
|---|---|---|
| mobile | 390×844 | single column · bottom nav · sheet editors · builder = preview + reorder only (no canvas drag) |
| tablet | 768×1024 | two panes · collapsible sidebar · builder canvas with docked inspector |
| laptop | 1366×768 | three panes · persistent sidebar · compact density |
| desktop | 1440×900 | three panes · comfortable density |
| large | 1920×1080 | canvas + navigator + inspector simultaneously |
| ultrawide | 3440×1440 | max-width container, centred; no full-bleed stretching |

**Decision:** the builder canvas is not drag-editable on mobile. Direct
manipulation at 390px is a false affordance; mobile gets preview, reorder and
field editing. Documented rather than pretending parity.

## 5 · Legacy admin parity matrix

Evidence: legacy `/admin/` consumes **52** routes; `/os/` implements **6**;
gap **46**. Of those 46, **20 are DEFERRED** by the locked requirements
(no mandatory AI, no SaaS integrations, knowledge/research out of scope),
leaving **26 to rebuild**.

### DEFERRED (20) — not rebuilt, not deleted until Phase 3S gates
`agents · ai · aiprompts · apikeys · automations · business · campaigns ·
copilot · engagement · facts · integrations · intelligence · knowledge ·
knowledge-graph · links · positioning · research · sites · social · trends`

Reason: "no mandatory external AI", "no external SaaS dependency", and no
evidence of active use beyond the legacy admin. **No fake AI screens will be
built.** If a capability is unavailable, the admin says so explicitly.

### TO REBUILD (26)

| # | Legacy route | New endpoint | Admin screen | Model | Status |
|---|---|---|---|---|---|
| 1 | `/api/analytics` | `/api/v1/system/analytics` | Growth › Analytics | see DOMAIN-MODEL | NOT STARTED |
| 2 | `/api/audit` | `/api/v1/audit` | System › Audit | see DOMAIN-MODEL | NOT STARTED |
| 3 | `/api/backup` | `/api/v1/system/backups` | System › Backups | see DOMAIN-MODEL | NOT STARTED |
| 4 | `/api/backups` | `/api/v1/system/backups` | System › Backups | see DOMAIN-MODEL | NOT STARTED |
| 5 | `/api/case-studies` | `/api/v1/projects?case_study=1` | Content › Case Studies | see DOMAIN-MODEL | NOT STARTED |
| 6 | `/api/content-health` | `/api/v1/seo/health` | Growth › SEO | see DOMAIN-MODEL | NOT STARTED |
| 7 | `/api/crm` | `/api/v1/crm` | Business › CRM | see DOMAIN-MODEL | NOT STARTED |
| 8 | `/api/deployments` | `/api/v1/publishing/deployments` | Publish › Deployments | see DOMAIN-MODEL | NOT STARTED |
| 9 | `/api/diagnostics` | `/api/v1/system/diagnostics` | Dashboard › Health | see DOMAIN-MODEL | NOT STARTED |
| 10 | `/api/emaillog` | `/api/v1/settings/email/log` | System › Email | see DOMAIN-MODEL | NOT STARTED |
| 11 | `/api/emailtemplates` | `/api/v1/settings/email/templates` | System › Email | see DOMAIN-MODEL | NOT STARTED |
| 12 | `/api/errors` | `/api/v1/system/errors` | System › Errors | see DOMAIN-MODEL | NOT STARTED |
| 13 | `/api/forms` | `/api/v1/forms` | Business › Forms | see DOMAIN-MODEL | NOT STARTED |
| 14 | `/api/leads` | `/api/v1/leads` | Business › Leads | see DOMAIN-MODEL | NOT STARTED |
| 15 | `/api/notifications` | `/api/v1/system/notifications` | System › Notifications | see DOMAIN-MODEL | NOT STARTED |
| 16 | `/api/proposals` | `/api/v1/crm/proposals` | Business › CRM | see DOMAIN-MODEL | NOT STARTED |
| 17 | `/api/publish` | `/api/v1/publishing` | Publish › Publishing | see DOMAIN-MODEL | NOT STARTED |
| 18 | `/api/redirects` | `/api/v1/redirects` | Growth › Redirects | see DOMAIN-MODEL | NOT STARTED |
| 19 | `/api/security-score` | `/api/v1/system/security` | System › Security | see DOMAIN-MODEL | NOT STARTED |
| 20 | `/api/seo` | `/api/v1/seo` | Growth › SEO | see DOMAIN-MODEL | NOT STARTED |
| 21 | `/api/smtp` | `/api/v1/settings/email/smtp` | System › Email | see DOMAIN-MODEL | NOT STARTED |
| 22 | `/api/status` | `/api/v1/system/status` | Dashboard › Health | see DOMAIN-MODEL | NOT STARTED |
| 23 | `/api/sync` | `/api/v1/publishing/sync` | Publish › Publishing | see DOMAIN-MODEL | NOT STARTED |
| 24 | `/api/users` | `/api/v1/users` | System › Users | see DOMAIN-MODEL | NOT STARTED |
| 25 | `/api/versions` | `/api/v1/publishing/versions` | Publish › Revisions | see DOMAIN-MODEL | NOT STARTED |
| 26 | `/api/webhooks` | `/api/v1/settings/webhooks` | System › Webhooks | see DOMAIN-MODEL | NOT STARTED |
**Status vocabulary:** NOT STARTED → API BUILT → SCREEN BUILT → TESTED → VERIFIED.
A row is only VERIFIED when the operation genuinely works end-to-end against the
new backend — not when the screen renders.

### Already covered by `/os/` (6)
`auth · content · flags · media · session · system`

## 6 · API dependencies

`/os/` talks only to `/api/v1/*`. No direct DB access, no PHP templating, no
legacy `/api/*` calls after Phase 3E. The admin bundle must never contain the
owner email (CI-enforced).

## 7 · Deferred

- Real-time collaboration — DEFERRED (needs WebSockets; not available).
- Offline editing — DEFERRED.
- Multi-user presence — DEFERRED (single-owner system).
