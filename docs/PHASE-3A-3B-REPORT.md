# Phase 3A + 3B Report — New Core & Database Foundation

**Commit:** `bfbb8a9` · **Tags:** `phase3a-3b-start` (`621b38e`) → `phase3a-3b-complete`
**Not pushed. Not deployed. Hostinger untouched. Legacy backend, legacy admin and legacy database intact.**

---

## Status

| Item | Status |
|---|---|
| Bootstrap | **COMPLETE** |
| Configuration | **COMPLETE** |
| Security foundation | **COMPLETE** (primitives only, as scoped) |
| Database connection | **COMPLETE** |
| Migration engine | **COMPLETE** |
| Schema | **COMPLETE** (59 tables) |
| Fresh database | **PASS** |
| Idempotency | **PASS** |
| Schema validation | **PASS** |
| Tests | **PASS** — 86/86 |
| Secret scan | **PASS** — 0 findings |

---

## Files created (26)

**Core** — `app/Autoloader.php`, `app/Bootstrap/Kernel.php`,
`app/Config/{Environment,ConfigResolver,Config}.php`,
`app/Core/{RequestContext,ApiResponse}.php`,
`app/Errors/{AppException,ConfigurationException,ValidationException,DatabaseException,ErrorCode,ErrorHandler}.php`,
`app/Database/Connection.php`

**Security primitives** — `app/Security/{Csrf,SessionConfig,Validator,Encoder,PathGuard,UploadValidator,RateLimiterInterface,ArrayRateLimiter,AuthorizerInterface,NullAuthorizer,AuditEvent}.php`

**Migration** — `app/Migration/{MigrationRunner,SystemSeeder,SchemaValidator}.php`,
`cli/avos`, `database/next/migrations/001–009`, `tests/next/run.php`

## Files modified (3)

`docs/DATABASE-SCHEMA.md` (implementation facts), `.gitignore`,
`tools/retirement-evidence.py` (see "bug found" below).

**Legacy files modified: 0.** Verified by `git status` on
`avos-php/backend`, `avos-php/database/migrations`, `avos-php/public_html/admin`.

---

## Database

**59 tables** across 9 migrations (+ `avos_migrations` ledger = 60).

| Migration | Tables | Domain |
|---|---|---|
| 001_identity | 8 | roles, permissions, role_permissions, users, user_roles, sessions, login_attempts, security_events |
| 002_media | 3 | media, media_variants, media_usage |
| 003_content | 11 | clients, pages, projects, categories, tags, articles, article_categories, article_tags, experience, testimonials, content_versions |
| 004_builder | 5 | builder_components, builder_templates, builder_nodes, builder_node_devices, design_tokens |
| 005_routing_seo | 6 | page_routes, redirects, page_seo, seo_analysis, navigation, navigation_items |
| 006_forms_crm | 6 | forms, form_fields, leads, form_submissions, lead_notes, lead_status_history |
| 007_booking | 7 | booking_services, booking_availability, booking_blackouts, booking_slots, bookings, booking_intake_fields, booking_intake_values |
| 008_creative | 4 | shader_assets, webgl_assets, animation_assets, scene_assets |
| 009_system | 9 | site_settings, jobs, job_attempts, audit_logs, email_templates, email_logs, notifications, backups, rate_limits |

**Seed (system data only):** 48 permissions · 7 roles · 142 role-permission
grants · 9 settings · 3 navigation groups.
**Fabricated business data: zero** — asserted by four tests
(`leads`, `clients`, `projects`, `testimonials` all count 0 after seeding).

Approved Phase 2 decisions honoured and test-asserted: `is_case_study` on
`projects` with **no** `case_studies` table; one polymorphic
`content_versions`; no `downloads` table; identity tables carried forward;
flat RBAC; `builder_node_devices` for responsive overrides.

---

## Tests — 86 pass, 0 fail

`php avos-php/tests/next/run.php` (dependency-free; shared hosting cannot run Composer)

| Group | Count | Notable |
|---|---|---|
| 3A.4 config resolver | 11 | rejects `/public_html/...` as private; invalid `AV_CONFIG_FILE` fails loudly without downgrading; legacy in-web-root config used but labelled |
| 3A.3 production guards | 8 | missing/empty credentials, weak key, known dev credentials, `safeReport` leaks no secret |
| 3A.6 security primitives | 32 | CSRF empty-vs-empty rejected; 6 traversal forms blocked; `.php`/`.phtml`/`.php.webp` uploads rejected; PNG-named-`.pdf` rejected; audit redacts nested secrets |
| 3B database | 35 | fresh-from-zero, idempotency, seeder idempotency, schema validation, structural guarantees, transactions, injection, controlled failure, immutability |

### Acceptance criteria

**3B.8 fresh database** — `DROP DATABASE` → `fresh` → 9 migrations (247 ms) →
seed (76 ms) → 60 tables. Reproducible.

**3B.9 controlled failure** — a 3-statement migration failing at statement 2:
detected, exact index reported (`2/3`), ledger marked `FAILED`, partial state
**visible** (`_t_partial` created, `_t_broken` absent), next run refused with
*"previously failed; resolve before continuing"*. No false success.

**3B.10 idempotency** — second `migrate`: **0 applied, 9 already present**.
Second `seed`: permissions 48→48, roles 7→7, role_permissions 142→142.

**3B.11 schema validation** — 0 missing tables, 0 missing columns,
0 missing indexes, 0 unexpected tables.

**Immutability** — appending one comment to a migration produced
*"checksum mismatch — migrations are immutable"*.

**Rollback** — `rollback --steps=1` dropped 009's 9 tables (60→51);
`migrate` restored them (51→60).

---

## Performance baseline (3B.12)

| Metric | Value |
|---|---|
| Migration (9 files) | 247–274 ms |
| Seed | 76–81 ms |
| Full `fresh` wall time | ~390 ms |
| Tables / indexes / FKs | 60 / 189 / 51 |
| Initial size | ~3.0 MB |

---

## Bugs found and fixed during implementation

1. **PSR-4 violation.** `ArrayRateLimiter`, `NullAuthorizer` and three exception
   classes shared files with other classes, so the autoloader could not find
   them. Caught by a fatal in the test run; split into one class per file.
2. **`audit_logs.before` / `.after` are MariaDB reserved words.** Caught by an
   actual migration failure on the first fresh run — which also served as
   unplanned proof that the failure path works. Backtick-quoted.
3. **Resolver mislabelled the config source** as `AV_PRIVATE_DIR` when the
   private directory had been found by the ancestor walk. Diagnostics would
   have misreported how configuration was located.
4. **`tools/retirement-evidence.py` classified the entire new stack as DELETE**
   (26 files, 1,802 LOC) because it knew nothing of the new entry points or
   PSR-4. Left unfixed, the deletion tool would have recommended deleting the
   new backend. Now resolves `AvOS\` and treats the new stack as KEEP.

Two further failures were **bad test fixtures, not product bugs**, and are
recorded as such: a leaked `AV_PRIVATE_DIR` between cases, and a legacy-config
fixture placed under a directory that already contained an `avos-private/`.

---

## Implementation facts discovered (added to DATABASE-SCHEMA.md §10)

- **MariaDB has no native JSON type** — `JSON` is an alias for `LONGTEXT` plus
  an automatic `json_valid()` CHECK. `information_schema` reports `longtext`.
  **27 CHECK constraints** confirm the columns really are JSON. The validator
  treats `json ≡ longtext`; it was not "corrected" into a false match.
- **DDL is not transactional on MariaDB.** The engine reports the failing
  statement index and marks the migration failed rather than pretending
  atomicity. Data-only seeding *does* run in a transaction.
- **Five deliberate FK omissions** documented with reasons (audit/security
  events must survive actor deletion; polymorphic columns cannot carry an FK).

---

## Security checks

- Secret scan across all new code: **0 findings**
- Private owner email: **absent from the repository** (config/env only)
- New code contains **no credential literals**
- Config resolved from **outside the web root** in every test
- Production guards verified in 8 cases; messages contain no value and no path
- Injection payload stored as data, table intact
- `.gitignore` extended: `avos-php/storage/`, `/_avosnext/`, `*.sql.gz`, `*.dump`

---

## Existing gates still green

§103 clean-URL acceptance: **zero extension URLs, zero broken links, sitemap clean**.
Retirement analyzer: **DELETE 0 · ARCHIVE 2 · REWRITE 7 · MIGRATE 9 · KEEP 61**.

---

## Known limitations

1. **`reset` / `fresh` refuse to run in production** by design; there is no
   safe production "drop everything" and none was added.
2. **Rollback depends on `@DOWN` sections.** Every migration has one, but on
   MariaDB a *failed* migration cannot be auto-rolled-back — the ledger records
   the partial state for manual resolution instead.
3. **No HTTP entry point yet.** `/api/v1` routing is Phase 3E; the kernel is
   currently exercised through the CLI and tests.
4. **`AuthorizerInterface` denies everything.** Real RBAC is Phase 3D. Nothing
   claims to authorise anything yet.
5. **Not verified on Hostinger/LiteSpeed.** All evidence is local MariaDB 11.8
   and PHP 8.4.23. **REQUIRES STAGING EVIDENCE.**
6. **`user_roles` is created but unpopulated** — migrating existing users is
   Phase 3R, not now.

## Unresolved questions

1. **Does production hold content only in `content_store` and not in
   `site.json`?** Blocks Phase 3R. **REQUIRES STAGING EVIDENCE.**
2. **Are there real leads/bookings in production?** Determines whether the
   migration needs a PII-aware path. **REQUIRES STAGING EVIDENCE.**
3. **Owner email value** — still not supplied to any config; `owner_email_set`
   is `false`. Needed before Phase 3C can send owner notifications.
4. **Legacy `avos_migrations` name collision** — the new ledger is
   `avos_migrations` and the legacy one is `schema_migrations`. They differ, so
   the two systems can share a database if ever needed, but the intent is
   separate databases.
