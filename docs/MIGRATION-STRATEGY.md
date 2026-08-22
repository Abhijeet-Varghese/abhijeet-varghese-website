# AV OS — Migration Strategy (Phase 2 contract, v1.0)

**No migration code is written in Phase 2.** This is the design and the
reconciliation contract. Execution is Phase 3Q.

Non-negotiable: **original data is never destroyed until reconciliation passes.**

---

## 1 · Pipeline

```
LEGACY SOURCE                EXTRACT        TRANSFORM       LOAD         VERIFY
─────────────                ───────        ─────────       ────         ──────
content_store (MariaDB) ─┐
avos-data/site.json      ├─►  extractor ─►  mapper ─────►  new schema ─► reconciler
frontend/src/content/*.ts┘    (read-only)   (pure fn)      (txn)         (diff)
                                                              │              │
                                                              ▼              ▼
                                                          rollback      parity report
                                                          snapshot      (pass/fail)
```

Three legacy sources exist (Phase 1 evidence). **`avos-data/site.json` is
canonical** — it is the seed the installer uses and the richest complete set.
`frontend/src/content/*.ts` is what currently *ships*; `content_store` is what
the admin edits. Where they disagree, `site.json` wins and the difference is
reported, never silently resolved.

## 2 · Mapping — OLD → NEW

| Old content | New entity | New table | Field mapping | Transformation |
|---|---|---|---|---|
| `settings` (15 keys) | SiteSetting | `site_settings` | key → `skey`, value → typed `svalue` | infer type; JSON stays JSON |
| `nav` (3 groups) | Navigation | `navigation`, `navigation_items` | group → navigation row; items → ordered children | **preserve order** (meaningful) |
| `pages` (12) | Page | `pages` + `page_routes` + `page_seo` | slug, title, template, status | slug → extensionless route; canonical **derived**, not copied |
| `sections` (9) | BuilderNode | `builder_nodes` (type=section) | id → node, order → position | flatten into the node tree |
| `blocks` (18) | BuilderNode | `builder_nodes` (type=block) | parent → `parent_id` | preserve nesting + order |
| `projects` (6) | Project | `projects` | 3 have `is_case_study=1` | **`orange` keeps `template='orange'`** |
| `articles` (8) | Article | `articles` | `kind ∈ {essay, journal}` | 4 essays, 2 journal live, 2 pending |
| `media` (13) | Media | `media` + `media_variants` | path, alt, dims | compute sha256; derive variants |
| `seo` (5) | PageSeo | `page_seo` | title, description, og | **drop stored canonical** — derived from route |
| `clients` (16) | Client | `clients` | name, logo → media_id | link logos to media rows |
| `testimonials` (3) | Testimonial | `testimonials` | quote, author, client_id | |
| `downloads` (3) | Media | `media` (`kind='document'`) | | **no separate table** |
| `experience` | Experience | `experience` | ordered, grouped by era | **order is content** — preserve exactly |
| `story` | Page (`/story`) | `pages` + nodes | chapters | **chapter numbers are content**, not presentation |

### Identity domain
`users`, `roles`, `permissions`, `role_permissions`, `sessions`,
`login_attempts` are **carried forward in place** — no data migration. Only
addition: one `user_roles` row per existing `users.role_id`.

`Super Admin` → **OWNER**; owner determined by `Identity::isOwner()` against the
configured address, never by role name.

### Deferred domains
The 20 DEFERRED route families (AI, integrations, knowledge, research,
intelligence, social) have **no migration**. Their tables remain untouched in
the legacy schema until the Phase 3S gates decide. They are not carried into
the new runtime and not dropped.

## 3 · Reconciliation contract

Migration is only "done" when every check passes:

| # | Check | Method | Pass condition |
|---|---|---|---|
| R1 | Record counts | count per collection old vs new | exact match, or an explained delta |
| R2 | Slug integrity | every old slug resolves | 100%, via 200 or an intentional 301 |
| R3 | Route uniqueness | `page_routes` | zero duplicate canonicals |
| R4 | Rendered parity | **existing text/heading harness** | byte-identical visible text per route |
| R5 | Media references | every `media_id` resolves | zero orphans |
| R6 | Relationships | project→client, article→category/tag | zero broken FKs |
| R7 | SEO | title/description present per published route | 100% |
| R8 | Navigation order | ordered list compare | exact |
| R9 | Publish state | draft/published counts | exact |
| R10 | §103 | clean-URL gate | green, zero regressions |

**R4 is the strongest check and already exists** — the harness that proved the
clean-URL and identity codemods changed nothing will prove the same for the
content migration. It compares visible text and heading outline per route
against the current live build.

## 4 · Execution order (Phase 3Q)

1. Snapshot: `mysqldump` legacy + copy `avos-data/` → private backups, checksummed.
2. Dry run into a scratch database; emit the reconciliation report. **No writes to the live DB.**
3. Review R1–R10. Any failure stops the migration.
4. Migrate per collection in dependency order:
   `settings → media → clients → navigation → pages → sections/blocks → projects → articles → testimonials → experience → seo → routes`.
5. Re-run reconciliation against the real target.
6. Re-run §103 + parity harness against a build sourced from the new backend.
7. Freeze `frontend/src/content/*.ts` as the generated static fallback — no longer hand-edited.

## 5 · Rollback

| Level | Mechanism | Recovery |
|---|---|---|
| Per collection | transaction — a failed collection rolls back alone | immediate |
| Per run | pre-migration `mysqldump` restore | minutes |
| Content | `content_versions` snapshots | per record |
| Frontend | previous build already deployed; source content still committed | immediate |
| Full | legacy backend untouched throughout — it can still serve | immediate |

**The legacy runtime stays fully functional for the entire migration.** That is
the rollback: nothing is deleted until the Phase 3S gates are all true.

## 6 · Unknowns

- **REQUIRES STAGING EVIDENCE:** the live `content_store` contents. All planning
  is from `site.json` + the shipped TS. A live dump is needed before execution.
- **UNKNOWN:** whether any content exists only in the live DB and not in
  `site.json`. R1 will surface it; the migration must not run before that dump.
- **REQUIRES STAGING EVIDENCE:** real lead/booking/submission rows. If production
  holds genuine client data, it needs a PII-aware migration path and a retention
  decision — **not** to be guessed at.
