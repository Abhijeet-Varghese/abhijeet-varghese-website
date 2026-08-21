# AV OS → Visual CMS & Website Builder — Architecture Audit (Phase 1)

> Scope of this document: **read-only audit + target architecture + phased plan.**
> No code, schema, or content was changed. This is the "understand first" gate
> the brief requires before any build work.

---

## A. Current architecture

The project is **not** a basic PHP admin. It is already a substantial
"creative-intelligence platform" ("AV OS", v2.4.20) with three tiers:

```
frontend/            React 19 + TypeScript + Vite (MPA, 25 static routes)
                     build-time SSR (prerender) + hydration
                     ── BUT content is build-time typed snapshots (src/content/*.ts)

avos-php/            PHP 8.x, no framework — custom MVC
                     backend/  (controllers · models · services · agents · integrations · publish)
                     includes/bootstrap.php (autoloader) · database/ (27 migrations + installer)
                     public_html/{admin,api,install,media.php,site}

MariaDB              normalized: 81 tables + content_store (key/value JSON) for site content
```

**Source of truth is split (the key finding):**
- CMS content lives in MariaDB `content_store` (seeded from `avos-data/site.json`).
- The React frontend consumes **build-time** `frontend/src/content/*.ts`
  (home, story, projects, articles, experience, orange, chrome, pages, seo) —
  a *parallel, hardcoded* copy. The live site is **not** runtime CMS-driven.

## B. Current database structure (81 tables)

- **Auth/RBAC:** users, roles, role_permissions, permissions, sessions, login_attempts, rate_limits, api_keys
- **Content:** content_store (JSON), pages/projects/articles are inside content_store; plus project_documents, project_milestones, case_study_scores
- **CRM/Business:** leads, contacts, companies, meetings, proposals, opportunities, campaigns, automations, automation_runs, tasks, activities
- **Forms:** forms, form_submissions
- **Media/SEO:** media, keywords, keyword_rankings/clusters, seo_audits, seo_issues, backlinks, research_items/sources, competitors, search_console_*
- **Publishing:** deployments, versions, publish_queue, redirects
- **AI/Agents:** ai_agents, ai_agent_jobs, ai_agent_memory, ai_prompts, ai_providers, ai_requests, knowledge_*
- **Integrations:** integrations, integration_calls, webhooks, webhook_deliveries, inbound_events, social_profiles/drafts
- **Ops:** audit_logs, system_errors, perf_log, notifications, email_log, email_templates, feature_flags, sites, site_settings

**Existing "blocks" concept:** `content_store.sections[].blocks` is a light
`{name, type, desc}` list — a seed of the builder model, not a full page tree.

## C. Current API structure

Single front controller (`ApiController::handle()`, a large switch), `/api/{action}`,
with a `/api/v1/...` variant. Notable surface:

- **Auth:** login/logout, change-password, 2FA (setup/enable/disable/verify/status), session
- **Content:** GET site/pages/projects/posts, PUT/POST content (bulk), content.read/.write gates
- **Publish:** publish, preflight, diff, rollback, deployments
- **Redirects:** GET/POST/PUT/DELETE
- **Media:** GET/POST/PUT/DELETE/restore (media.read/.write)
- **Leads:** GET/POST/PUT/DELETE/export/restore
- **Forms:** GET/submissions/status/export
- **CRM/SEO/AI/Agents/Webhooks/Integrations/Analytics:** extensive, RBAC-gated
- **Public:** POST /api/public/lead, /api/public/submit (honeypot + rate limit + Turnstile)

Error shape: `{ok, data, error:{code,message,request_id}}` — already request-ID
tagged; message is safe, code is stable, stack stays server-side.

## D. Current CMS capabilities (real, working)

- Content editing (pages/projects/articles/clients/nav/settings) via `content_store`
- Media library (upload/alt/soft-delete/restore), Downloads, Testimonials, Speaking
- Forms + submissions, Leads + CRM pipeline, Meetings, Proposals, Campaigns, Automations
- SEO (keywords/rankings/audits/backlinks/Search Console), Analytics, Research, Social
- AI Agents + AI Studio + Copilot + Knowledge graph
- Design System (tokens), Publishing (atomic swap + preflight + auto-rollback + revisions),
  Versions, Backups, Integrations, Users/Roles, Logs, Health, Security score, Command palette (⌘K)

It is a **form-based CMS** (50 views, vanilla-JS SPA) — **there is no visual page
builder.** Editing is field-by-field, not click-on-canvas.

## E. Current content source

Two, currently disconnected:

1. **MariaDB `content_store`** (runtime, CMS-editable) — the *intended* source of truth.
2. **`frontend/src/content/*.ts`** (build-time, hand-edited) — what actually renders.

`avos-data/site.json` is the canonical seed for `content_store` (published content
only; no leads/users/tokens/secrets).

## F. Current routing

- Apache `.htaccess`: root rewrites `/$1 → site/$1`; `/api`, `/admin`, `/install`,
  `/media` kept PHP; private paths (backend/includes/database/storage/config/.git)
  403-blocked; HSTS + CSP + cache headers.
- Dev: `router.php` for `php -S`.
- React/Vite is an **MPA** (physical `.html` files) — **no SPA fallback** (404 is
  real). This is intentional and good for SEO, but it means "clean URL" support
  must come from files/rewrites, not a client router.

## G. Current `.html` URL behavior

Every route is `.html`-suffixed (`story.html`, `portfolio.html`, …). The site is
already indexed/crawled on these URLs. A clean-URL migration (`/about`, `/portfolio`)
requires **301 redirects** from the `.html` URLs — a controlled, reversible change.

## H. Current frontend architecture

- Vite MPA, per-route code splitting (story 8 KB, orange 10 KB, contact <1 KB, etc.)
- Build-time `renderToString` (real HTML in `dist`, no blank `#root`)
- Content + chrome + SEO **hardcoded** in `src/content/*.ts`
- Runtime `/api` usage is limited to: analytics track, `POST /api/public/lead`
  (booking form), and `search-index.json` fetch. Everything else is static.

## I. Current problems (honest)

1. **Two sources of truth** — CMS (DB) ≠ frontend (TS). Editing content in the
   CMS does not change the live site unless a Node build runs (which Hostinger
   cannot do). This is *the* blocker for a visual builder.
2. **No visual builder** — all editing is form-based.
3. **`.html` URLs** — not clean, no migration plan.
4. **Backend router is a giant switch** — functional but not versioned
   controller classes; hard to extend cleanly.
5. **Admin is vanilla JS** — capable, but not a canvas/visual system, and not
   structured for a tree-based builder.
6. **Publish requires Node (Vite)** on a no-Node host → content→live is not instant.
7. No **custom content types**, **field builder**, **query/loop builder**,
   **conditions**, **interactions/animation timeline**, **popups**, **class system**,
   or **template conditions** — the "builder" surface is absent.

## J. Recommended target architecture

**Headless CMS + static-first delivery with a runtime data layer:**

```
MariaDB (normalized content + builder document store)
   ↓
PHP API v1  (content CRUD · builder tree CRUD · media · forms · publish)
   ↓
React frontend
   ├─ static shell (build-time, keeps current performance/SEO)
   └─ runtime data islands (fetch /api/v1/... for CMS-managed content)
   ── Visual Builder (React) editing the same document store, with live preview
```

Key decisions (need your input — see "Decision points" at the end):

1. **Delivery model:** (a) fully static (rebuild on publish, via CI — no Node on
   Hostinger), or (b) static shell + runtime JSON (instant publish, small perf cost),
   or (c) hybrid (static for core pages, runtime for dynamic lists). *Recommended: (c).*
2. **Builder admin:** rewrite admin as **React** (same stack as frontend) vs
   extend the vanilla-JS admin. *Recommended: React, sharing the component/design
   system with the public site so preview is exact.*
3. **Builder data model:** a `pages` tree-of-nodes store (normalized + JSON columns
   for node trees) — content stays normalized, layout becomes a node tree.

## K. Migration strategy (content safety)

1. Freeze + back up: `mysqldump avos`, tar of `avos-data/`, git tag.
2. Add a **content snapshot API** (`/api/v1/snapshot`) exposing only published
   content, then point the React build at it (single source of truth = `content_store`).
3. Introduce builder tables (pages_tree, elements, design_tokens, templates, …)
   as **additive** migrations; never drop existing tables.
4. Migrate `sections.blocks` into the node tree; keep `content_store` as the
   content record store.
5. Clean-URL + 301 map (generated redirects, reversible).

## L. Backup strategy

- **DB:** `mysqldump` → `storage/backups/` (versioned), plus the existing
  `deployments`/`versions` tables for content-level rollback.
- **Files:** full tar of `avos-php/` + `frontend/` + `avos-data/`; git history is
  the source-level backup.
- **Before any destructive migration:** dump + a reversible SQL migration + a
  verification query, all run against staging first (never production).

## M. Implementation phases

| Phase | Deliverable |
|---|---|
| 1 | ✅ **Audit + architecture map + backups** (this document) |
| 2 | Database/content architecture — builder document store + snapshot API + single source of truth |
| 3 | Authentication + roles + granular permissions (extend existing RBAC) |
| 4 | CMS core — content CRUD + custom content types + field builder |
| 5 | Visual builder foundation — canvas, element tree, properties panel, undo/redo, drag/drop |
| 6 | Design system — global tokens (colors/type/spacing/radius/shadow/motion) + class system |
| 7 | Dynamic data + query/loop builder + conditions |
| 8 | Templates + reusable components + instances |
| 9 | Interactions + animation timeline |
| 10 | Forms / media / SEO / redirects (extend existing) |
| 11 | Publishing / revisions / schedule / live preview |
| 12 | Performance + security hardening |
| 13 | Migrate the existing website onto the builder (clean URLs + 301s) |
| 14 | QA across devices + full regression |

---

## Honest scope statement

Building a Webflow/Elementor-class visual builder on this foundation is a
**multi-phase, multi-week engineering effort** — not a one-shot rewrite. This
audit (Phase 1) is complete and factual. I will **not** fabricate a finished
builder, ship buttons that do nothing, or delete/rewrite the working system.

The correct next step is **Phase 2 (database/content architecture)** — but it
requires your decisions on the three forks in §J before I write schema or code,
because they determine the entire direction.
