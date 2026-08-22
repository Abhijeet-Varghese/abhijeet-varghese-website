# PHASE 2 — Database / Content Architecture (foundation for the Visual CMS)

> Status: **design + prepared artifacts only.** No production change. Migrations
> are prepared (not applied), backups are scripted + locally verified. This
> document is the approval gate before Phase 3 (implementation).

---

## 1 · Content source-of-truth model (the core fix)

**Today (broken):** `MariaDB content_store` (CMS-editable) **and**
`frontend/src/content/*.ts` (build-time) both exist, and they have **already
diverged** — e.g. the CMS seed has 6 projects, the React frontend ships 3; the
CMS has a full "experience"/story/Orange narrative that the frontend re-authorizes
in TypeScript.

**Target:** `content_store` is the **single authoritative source** for CMS-managed
content. The frontend renders from a published snapshot served by the API, with a
build-time snapshot embedded only as a **first-paint/no-JS fallback** (last-known-good).

```
MariaDB content_store + builder_* (authoritative)
        │  published-only snapshot (no drafts/leads/users/secrets)
        ▼
GET /api/v1/content  (runtime, cached)
        │
        ▼
React frontend  ── static shell (build-time: chrome/app config) + runtime content
        │
        ▼
rendered website  (next.abhijeetvarghese.com)
```

Publishing stays atomic/reversible via the existing `PublishEngine` +
`deployments`/`versions` machinery. Runtime content changes are instant; static
shell rebuilds remain a CI-time concern (Hostinger has no Node).

## 2 · Classification of every existing hardcoded source

| `frontend/src/content/*.ts` | Content | Class | Action |
|---|---|---|---|
| `home.ts` (hero/clients/capabilities/work/thinking/journey/method/focus/contact) | site sections | **A · CMS-managed** | read from `content_store.sections` at runtime |
| `projects.ts` (projects + portfolio/case-study summaries + SEO) | projects | **A** | read from `content_store.projects` |
| `articles.ts` (essays/journal) | articles | **A** | read from `content_store.articles` |
| `story.ts` (Story/Evolution copy) | story page content | **A** | read from `content_store.pages[story]`/sections |
| `orange.ts` (Orange EBC long-form) | project detail | **A** | read from `content_store.projects[prj-1]` |
| `experience.ts` (6 roles) | experience content | **A** | read from `content_store` (experience page) |
| `pages.ts` (consulting/recruiters/insights/journal/legal/404 copy + SEO) | page content + SEO | **A** | read from `content_store.pages` |
| `chrome.ts` (nav/footer/social/contact) | navigation + site settings | **A** | read from `content_store.nav` + `settings` |
| `seo.ts` (`SITE_ORIGIN`, `HOME_SEO`, `STORY_SEO`, head builder) | SEO + canonical origin | **A** (per-item SEO) + **B** (origin) | SEO fields → `content_store`; origin → config/env |
| `types/*`, `styles/*`, `lib/*`, `components/*`, `sections/*` | component/styling code | **D · component definition / C · static config** | **stay hardcoded** (they are the renderer, not content) |

> **F · content that should remain hardcoded:** the React component code, design
> token *keys* (not values), and the head/SEO *template structure* — these are the
> product, not the content. Only the *values* they render become CMS-managed.

## 3 · Current database schema map (relevant subset)

| Table | Purpose | Used by |
|---|---|---|
| `content_store` | keyed JSON content (settings/sections/pages/projects/articles/clients/nav/media/seo/downloads/testimonials) | CMS content, publisher |
| `versions` | generic versioned snapshots (entity, entity_id, version, data) capped at 50 | revisions (already exists!) |
| `deployments` / `publish_queue` | publish snapshots + atomic rollback | publishing |
| `redirects` | 301/302 map | URL migration |
| `users` / `roles` / `role_permissions` / `permissions` | RBAC | auth |
| `media`, `forms`, `form_submissions`, `leads`, `meetings`, … | CRM/media/forms (normalized) | admin + public API |
| `feature_flags`, `site_settings`, `sites` | config | settings |

## 4 · Proposed schema (additive — `migration 028_builder_foundation.sql`)

Seven new tables, none modifying/dropping existing ones:

| New table | Why it's needed (problem it solves) | Notes |
|---|---|---|
| `builder_pages` | one editable page (slug/status/SEO/schedule/template) | layout supersedes the ad-hoc `pages` JSON key for *layout*; content records stay in `content_store` |
| `builder_nodes` | the element tree (parent_id + position) with JSON for props/styles/responsive/bindings/conditions/interactions/animations | tree is relational (queryable); flexible element data is JSON (appropriate) |
| `builder_components` | reusable named elements (Button, Project Card, Hero…) with a root node + lock flag | enables "edit class/component → all instances update" |
| `builder_templates` | page/section/header/footer/archive layouts + display conditions | template conditions ("all projects except featured") |
| `content_types` | user-defined content models (Awards, Services…) | custom content types without code |
| `content_fields` | the field schema per content type (typed enum) | field builder; validation + admin UI auto-generated |
| `custom_records` | content-type instances (slug/status/featured/published_at normalized + `data` JSON) | filterable/sortable core + flexible fields; avoids a full EAV pivot |

**Deliberately NOT new tables (avoid over-engineering):**
- **Revisions** → reuse existing `versions` (snapshot the page tree as one JSON doc per version; `ContentStore::versions/restore` already exist).
- **Design tokens** → extend `content_store.settings.designTokens` (site-wide, rarely changed, already versioned). A separate table adds a query layer with no benefit.
- **Redirects / forms / media / SEO / users / roles** → already exist; the builder surfaces them.

## 5 · Page/node data model

A page = `builder_pages` row + a tree of `builder_nodes` rooted at `parent_id IS NULL`.
Node JSON shape (per element):

```json
{ "id": 42, "type": "heading",
  "props":    { "text": "…", "tag": "h1" },
  "styles":   { "fontSize": "clamp(2.4rem,6vw,5rem)", "color": "var(--ink)" },
  "responsive": { "mobile": { "fontSize": "2rem" }, "tablet": { "fontSize": "3rem" } },
  "bindings":  [ { "source": "project.title" } ],
  "conditions": { "all": [ { "field": "project.featured", "op": "=", "value": true } ] },
  "interactions": [ { "trigger": "hover", "actions": [ { "type": "animate", "…" } ] } ],
  "animations": { "entrance": { "type": "fade", "duration": 0.6 } }
}
```

Stable integer node ids → clean undo/redo, copy/paste, revision diffing. The
`responsive` object uses the breakpoint registry from the design system.

## 6 · Component / template architecture

- **Component** = a named `builder_nodes` subtree (via `builder_components.root_node_id`).
  An **instance** is a `builder_nodes` row with `component_id` set; its own JSON
  fields are *overrides*. Detach = copy the subtree + clear `component_id`.
- **Template** = a serialized layout + `conditions` (apply-to rules). Page resolves:
  explicit template → matching template conditions → default.

## 7 · Revision architecture

Reuse `versions` (entity=`builder_page`, entity_id=page_id): each save snapshots the
full node tree as one JSON document. Autosave **does not** create revisions —
only explicit "Save" (debounced) does, and each restore is itself versioned.
This gives compare/restore/preview with zero new tables.

## 8 · Dynamic-data architecture

A single binding model: `{ "source": "project.title", "fallback": "" }`, resolved
against a **context** (page, record, query result, user, env, request). Loop/query
builders emit a query object (`{ contentType, filters[], sort, limit, offset }`)
executed by one API endpoint and rendered through a card template. One resolver,
not N special cases.

## 9 · API architecture

- **New versioned surface** (alongside the existing `/api/{action}` which stays for
  backward compat): `/api/v1/pages`, `/pages/{id}`, `/nodes`, `/nodes/{id}`,
  `/components`, `/templates`, `/content-types`, `/fields`, `/content/{type}`,
  `/design-tokens`, `/revisions`, `/redirects`.
- **Public content bridge (the source-of-truth endpoint):**
  `GET /api/v1/content` → published-only snapshot (settings/nav/sections/pages/
  projects/articles/clients/custom records). Never drafts/leads/users/tokens/secrets.
  Cached (ETag), gzipped, noindex-irrelevant (it's data).
- Consistent envelope (reuse existing `{ok,data,error:{code,message,request_id}}`);
  pagination/filter/sort params on list endpoints.

## 10 · Frontend rendering changes

1. Add a `contentLoader` that fetches `/api/v1/content`; keep the current static
   snapshot as a **build-time fallback** for first paint + no-JS (preserves SEO/LCP).
2. Replace `src/content/*.ts` value *literals* with loader reads; keep the TS
   **types** (they document the contract).
3. Remove `src/content/*.ts` data files only after the loader is proven (staged).

## 11 · Migration strategy (staged, non-breaking)

```
existing system
   → 1. additive schema (028)          [no-op to runtime]
   → 2. /api/v1/content endpoint       [reads content_store, side-effect-free]
   → 3. seed builder_* from content_store (one-time, idempotent)
   → 4. frontend contentLoader (fallback = current snapshot)
   → 5. verify parity old vs new
   → 6. retire hardcoded data files
   → 7. (later) clean-URL + 301s        [separate, gated phase]
```

`.html` URLs are **untouched** this phase; a formal 301 map is a later phase.

## 12 · Backup verification

- **Scripted:** `avos-php/scripts/backup-db.sh` (mysqldump --single-transaction,
  gzipped, retention 20) + `backup-files.sh` (source + seed tar) + suggested git tag.
- **Locally verified this phase:** migration `028` applied cleanly to a throwaway
  DB (7 tables created); `mysqldump` produced a valid gzip.
- **Not yet verified:** the Hostinger production DB backup is a manual hPanel step
  (no host access from this environment) — flagged, not fabricated.

## 13 · Rollback plan

- Schema: additive + `IF NOT EXISTS`; rollback = drop the 7 new tables (a
  reversible `028_down` is trivial). Existing tables are never touched.
- Content: `versions` restore + `deployments` rollback (already live).
- Frontend: the build-time fallback snapshot is the rollback — if runtime content
  fails, the site still renders the last-known-good static content.
- URL: `.html` URLs remain, so there is no URL rollback risk this phase.

## 14 · Exact files/tables that will be modified (Phase 3+)

**Add:** migration `028_builder_foundation.sql` (7 tables) · `ApiController` (new
`/v1/*` + `/v1/content` routes, additive) · frontend `contentLoader` + a new
`content/` fetch layer · `export-snapshot.php` reuse · backup scripts.
**Modify (additive only):** `config.php` (no change needed), frontend `pages/*`
components to read from the loader (value literals replaced, not structure).
**Never touch:** existing tables' columns, `content_store` keys, admin/API/booking.

## 15 · Risks & mitigations

| Risk | Mitigation |
|---|---|
| Content divergence during cutover | build-time fallback = last-known-good; parity check before retiring data files |
| Runtime fetch adds latency / CLS | ETag cache + SSR fallback for first paint; content JSON is small (<100 KB) |
| Node-less Hostinger can't rebuild shell | static shell rebuilt in CI only; runtime content needs no Node |
| Over-normalization → slow builder | tree is relational; per-element flexible data is JSON (hybrid) |
| Revision bloat from autosave | revisions only on explicit save; `versions` cap 50 already enforced |

---

## Decision summary (the "why" behind each table)

Every new table answers a concrete builder need: **pages** (one editable unit +
SEO + schedule), **nodes** (the canvas tree), **components** (reuse + "edit once,
update everywhere"), **templates** (reuse layouts + display conditions),
**content_types/fields** (custom content models), **custom_records** (their data).
Revisions, tokens, redirects, forms, media, users reuse existing infrastructure.
No table was added "because a professional CMS has it."

**This is the end of Phase 2.** Prepared: migration `028`, backup scripts, this
document. Applied: nothing to production. Next step (Phase 3, on your approval):
implement the `/api/v1/content` bridge + content loader + parity check.
