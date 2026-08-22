# AV OS — Domain Model (Phase 2 contract, v1.0)

Entities, relationships and invariants. Grounded in `avos-data/site.json`
(12 collections, the canonical content) and the 88 existing tables.

---

## 1 · Entity relationship diagram

```
                    ┌──────┐     ┌──────────┐     ┌─────────────┐
                    │ user │────►│ user_role│────►│    role     │
                    └──┬───┘     └──────────┘     └──────┬──────┘
                       │                                  │
                  ┌────▼─────┐                    ┌───────▼────────┐
                  │ session  │                    │role_permission │
                  └──────────┘                    └───────┬────────┘
                                                          ▼
                                                   ┌────────────┐
                                                   │ permission │
                                                   └────────────┘

  ┌────────────┐  1      n  ┌──────────────┐
  │   page     │───────────►│ page_version │        ┌──────────────┐
  └─────┬──────┘            └──────────────┘        │  page_route  │
        │ 1                                    1:1  └──────▲───────┘
        │                                                  │
        │ n            ┌───────────┐                       │
        ├─────────────►│ page_seo  │ 1:1                   │
        │              └───────────┘                       │
        │ n                                                │
        └─────────────►┌──────────────┐   n:1  ┌───────────┴────┐
                       │ builder_node │───────►│ builder_page   │
                       └──────┬───────┘        └────────────────┘
                              │ 1:n
                       ┌──────▼─────────────────┐
                       │ builder_node_device    │  (mobile|tablet|laptop|large)
                       └────────────────────────┘

  ┌──────────┐ n:1 ┌────────┐        ┌──────────┐ n:m ┌──────────┐
  │ project  │────►│ client │        │ article  │────►│ category │
  └────┬─────┘     └────────┘        └────┬─────┘     └──────────┘
       │ n:m                              │ n:m ┌─────┐
       ├──────────► media_usage ◄─────────┴────►│ tag │
       │                 │                       └─────┘
       │                 ▼
       │           ┌─────────┐ 1:n ┌────────────────┐
       └──────────►│  media  │────►│ media_variant  │
                   └─────────┘     └────────────────┘

  ┌──────────────┐ 1:n ┌───────────────────┐ n:1 ┌──────────┐
  │ form         │────►│ form_submission   │────►│  lead    │
  └──────────────┘     └───────────────────┘     └────┬─────┘
                                                      │ 1:n
                                       ┌──────────────┼──────────────┐
                                       ▼              ▼              ▼
                                 ┌──────────┐  ┌──────────────┐ ┌─────────┐
                                 │lead_note │  │lead_status_hx│ │ booking │
                                 └──────────┘  └──────────────┘ └────┬────┘
                                                                     │ n:1
                                                            ┌────────▼────────┐
                                                            │ booking_slot    │
                                                            └─────────────────┘
```

## 2 · Canonical content (evidence: `avos-data/site.json`)

| Collection | Count | New entity | Notes |
|---|---|---|---|
| `settings` | 15 keys | `site_settings` | key/value, typed |
| `sections` | 9 | `builder_nodes` (type=section) | layout, not content |
| `pages` | 12 | `pages` + `page_versions` | one route each |
| `blocks` | 18 | `builder_nodes` (type=block) | |
| `projects` | 6 | `projects` | 3 are case studies |
| `articles` | 8 | `articles` | 4 essays + 2 journal live |
| `media` | 13 | `media` + `media_variants` | |
| `seo` | 5 | `page_seo` | currently partial coverage |
| `nav` | 3 groups | `navigation` + `navigation_items` | |
| `clients` | 16 | `clients` | logo wall |
| `testimonials` | 3 | `testimonials` | |
| `downloads` | 3 | `media` (kind=document) | no separate table needed |

**Decision — no `downloads` table.** Three rows that are already assets. A
`media.kind` discriminator is sufficient. Documented rather than blindly
following the brief's list.

## 3 · Entity invariants

**Page**
- Exactly one `page_route`; slug unique across all routable content.
- A page may be `draft` with no route; publishing creates/activates the route.
- Deleting a page soft-deletes it and converts its route to a 301 (never a 404).

**Project / Case study**
- A case study **is** a project with `is_case_study = 1`. Evidence: the existing
  content models them identically and the frontend renders them from one type.
  **Decision: no separate `case_studies` table** — a flag plus the case-study
  fields on `projects`. Two tables would duplicate every version, SEO and media
  relationship for a 3-row distinction.

**Article**
- `kind ∈ {essay, journal}`. Evidence: 4 essays + 2 journal entries render
  through one `ArticlePage` component with one template.

**Media**
- `hash` (sha256) is unique; re-uploading the same bytes returns the existing row.
- A `media` row may not be hard-deleted while `media_usage` references it.

**Lead**
- Exactly one current `status`; every transition appends to `lead_status_history`.
- A lead may have 0..n bookings; a booking has exactly one lead.

**Booking**
- A confirmed booking holds exactly one `booking_slot`.
- `(resource_id, starts_at)` is unique — the last line of defence against
  double booking (see `DATABASE-SCHEMA.md` §Booking).

**Version**
- Versions are immutable. Restore creates a *new* version whose payload equals
  the restored one. History is never rewritten.

## 4 · Content semantics that must not change

The Phase 3B/4 migration already proved these. Preserve exactly:

| Semantic | Rule |
|---|---|
| `experience` | Timeline entries, ordered, grouped by era. Order is meaningful. |
| `story` | Long-form about page with chapter numbering. Chapter numbers are content. |
| `orange` | A case study with a bespoke template and its own CSS bundle. **Must keep its dedicated template** — it is not a generic project page. |
| `page_content` | Body copy authored as structured blocks, not HTML soup. |
| `page_seo` | Title/description/canonical per page; canonical is derived from the route registry, never hand-typed. |
| `sections` | Reusable layout units referenced by pages. |
| `navigation` | Three groups (primary, footer, utility). Order meaningful. |
| `settings` | Site-wide, typed, single row per key. |

**Rule:** migration may re-shape storage but must not alter rendered meaning.
Verified by the existing text/heading parity harness.

## 5 · Ownership map (who writes what)

| Table group | Sole writer |
|---|---|
| `sessions`, `login_attempts`, `security_events` | `auth` |
| `users`, `user_roles` | `users` (owner-gated) |
| `pages*`, `projects`, `articles`, `experience`, `clients`, `testimonials` | `content` |
| `builder_*` | `builder` |
| `media*` | `media` |
| `page_routes`, `redirects` | `routing` |
| `page_seo`, `seo_*` | `seo` |
| `leads*`, `form_submissions` | `forms`/`crm` |
| `booking*` | `booking` |
| `jobs`, `job_attempts` | `jobs` |
| `audit_logs` | `audit` (append-only) |

No module writes another module's tables. Cross-domain changes go through the
owning service.
