# AV OS — Database Schema (Phase 2 contract, v1.0)

MariaDB · InnoDB · `utf8mb4_unicode_ci` · all timestamps UTC.
Grounded in the 88 existing tables. **Reuse is preferred over reinvention**;
every new table is justified.

Conventions: `id INT UNSIGNED AUTO_INCREMENT PK` · `created_at`/`updated_at` on
mutable tables · soft delete only where restore is a real product need
(`deleted_at DATETIME NULL`) · FKs `ON DELETE RESTRICT` unless stated ·
JSON only for genuinely variable structure.

---

## 1 · IDENTITY — reuse existing, extend for many-to-many roles

`users`, `roles`, `permissions`, `role_permissions`, `sessions`,
`login_attempts` **already exist and are well formed** (verified: `users` has
`password_hash`, `status ENUM('active','invited','suspended')`,
`must_change_password`, `twofa_secret`, `twofa_enabled`, `last_login_at/ip`;
`sessions` has `token_hash CHAR(64) UNIQUE`, `expires_at`, `last_seen_at`).

**Carry these forward unchanged.** They back the audited auth implementation.

### Changes

| Change | Reason |
|---|---|
| **NEW `user_roles(user_id, role_id)`** | Brief requires many-to-many. Existing `users.role_id` is single-role. Migrate by inserting one row per user, then keep `users.role_id` as a nullable *primary* role for UI default. Do **not** drop it in Phase 3 — dropping is a Phase 3S cleanup step. |
| **NEW `security_events`** | Brief §7/§20. Distinct from `audit_logs`: security-relevant only, longer retention, owner-notifiable. |

```sql
CREATE TABLE user_roles (
  user_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT UNSIGNED NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_ur_role (role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE security_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(60) NOT NULL,        -- login_failed | lockout | password_change
                                          -- | mfa_change | recovery | admin_created
                                          -- | permission_escalation | suspicious
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  user_id INT UNSIGNED NULL,
  email VARCHAR(190) NULL,                -- attempted identity; may not exist
  ip VARCHAR(45) NOT NULL DEFAULT '',
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  request_id VARCHAR(40) NOT NULL DEFAULT '',
  detail JSON NULL,                       -- NEVER credentials/tokens/keys
  notified TINYINT(1) NOT NULL DEFAULT 0, -- owner alert dispatched
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_se_type_time (event_type, created_at),
  KEY idx_se_sev (severity, created_at),
  KEY idx_se_user (user_id)
) ENGINE=InnoDB;
```

No soft delete on identity tables — deletion is an owner-only hard action with
an audit record.

## 2 · CONTENT

### Decisions that deviate from the brief's table list (with reasoning)

| Brief asked for | Decision | Reason |
|---|---|---|
| `case_studies` | **Merged into `projects`** via `is_case_study` | Evidence: identical shape and template; 3 rows. A separate table duplicates versions/SEO/media relations for no gain. |
| `project_versions` + `article_versions` + `page_versions` | **One `content_versions`** polymorphic table | Three identical structures. One table with `(entity_type, entity_id)` halves the code and gives a single restore path. |
| `experience` | **Table kept** | Ordered timeline with grouping — genuinely its own shape. |
| `downloads` | **Dropped** | 3 rows, already assets → `media.kind='document'`. |

```sql
CREATE TABLE pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  template VARCHAR(80) NOT NULL DEFAULT 'default',
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  publish_at DATETIME NULL,
  unpublish_at DATETIME NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pages_slug (slug),
  KEY idx_pages_status (status, publish_at),
  KEY idx_pages_deleted (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE content_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('page','project','article','experience','navigation','settings') NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,          -- monotonic per entity
  payload JSON NOT NULL,                  -- full snapshot, immutable
  checksum CHAR(64) NOT NULL,             -- sha256(payload) — dedupe + integrity
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cv (entity_type, entity_id, version),
  KEY idx_cv_entity (entity_type, entity_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  client_id INT UNSIGNED NULL,
  is_case_study TINYINT(1) NOT NULL DEFAULT 0,
  summary TEXT NULL,
  role VARCHAR(190) NOT NULL DEFAULT '',
  practice VARCHAR(190) NOT NULL DEFAULT '',
  year_from SMALLINT UNSIGNED NULL,
  year_to SMALLINT UNSIGNED NULL,
  hero_media_id INT UNSIGNED NULL,
  template VARCHAR(80) NOT NULL DEFAULT 'default',  -- 'orange' keeps its bespoke template
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  publish_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proj_slug (slug),
  KEY idx_proj_status (status, publish_at),
  KEY idx_proj_case (is_case_study, featured),
  CONSTRAINT fk_proj_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_proj_hero FOREIGN KEY (hero_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  kind ENUM('essay','journal') NOT NULL DEFAULT 'essay',
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  body JSON NULL,                         -- structured blocks, not HTML soup
  cover_media_id INT UNSIGNED NULL,
  author_id INT UNSIGNED NULL,
  reading_minutes SMALLINT UNSIGNED NULL, -- derived at publish
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  publish_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_art_slug (slug),
  KEY idx_art_kind_status (kind, status, publish_at)
) ENGINE=InnoDB;
```

Plus `categories`, `tags`, `article_categories`, `article_tags`,
`experience`, `clients`, `testimonials` — conventional shapes, slug-unique,
`position` where order is meaningful (it is, for experience and navigation).

## 3 · BUILDER — extend migration 028

`builder_pages`, `builder_nodes`, `builder_components`, `builder_templates`
**already exist and are well designed** (nodes carry
`props/styles/responsive/bindings/conditions/interactions/animations` JSON).

**One new table** — the responsive contract cannot live in a JSON blob if
override/reset/copy semantics must be queryable:

```sql
CREATE TABLE builder_node_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  node_id INT UNSIGNED NOT NULL,
  device ENUM('mobile','tablet','laptop','large') NOT NULL,
  -- NULL = inherit from the next device up. Non-NULL = explicit override.
  styles JSON NULL, props JSON NULL, visible TINYINT(1) NULL,
  media_id INT UNSIGNED NULL,
  focal_x DECIMAL(5,4) NULL, focal_y DECIMAL(5,4) NULL,
  scene_id INT UNSIGNED NULL, animation_id INT UNSIGNED NULL,
  replaced_by INT UNSIGNED NULL,          -- device-specific component swap
  perf_profile ENUM('ultra','high','medium','low','reduced') NULL,
  UNIQUE KEY uq_nd (node_id, device),
  CONSTRAINT fk_nd_node FOREIGN KEY (node_id) REFERENCES builder_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

**What lives where**

| Data | Location | Why |
|---|---|---|
| tree shape, order, parent | relational (`builder_nodes`) | must be queryable, orderable, FK-enforced |
| per-device overrides | relational (`builder_node_devices`) | override/reset/copy are set operations; NULL *is* the inheritance signal |
| style/prop values | JSON columns | genuinely open-ended, never queried by value |
| component definitions | `builder_components` + registry in code | schema is code; instances are data |
| media references | FK to `media` | referential integrity + usage graph |

No page-level blobs.

## 4 · MEDIA

```sql
CREATE TABLE media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('image','video','audio','document','model','texture','shader','font','other') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,     -- relative to the PRIVATE root
  mime VARCHAR(120) NOT NULL,
  bytes BIGINT UNSIGNED NOT NULL,
  hash CHAR(64) NOT NULL,                 -- sha256 of the master
  width INT UNSIGNED NULL, height INT UNSIGNED NULL,
  duration_ms INT UNSIGNED NULL,
  focal_x DECIMAL(5,4) NULL DEFAULT 0.5, focal_y DECIMAL(5,4) NULL DEFAULT 0.5,
  alt_text VARCHAR(500) NOT NULL DEFAULT '',
  processing ENUM('pending','processing','ready','failed','unavailable') NOT NULL DEFAULT 'pending',
  processing_note VARCHAR(255) NOT NULL DEFAULT '',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_hash (hash),
  KEY idx_media_kind (kind, processing)
) ENGINE=InnoDB;

CREATE TABLE media_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_id INT UNSIGNED NOT NULL,
  purpose ENUM('thumb','card','hero','full','poster','preview') NOT NULL,
  format ENUM('webp','avif','jpeg','png','mp4','webm','glb') NOT NULL,
  width INT UNSIGNED NULL, height INT UNSIGNED NULL,
  bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  public_path VARCHAR(500) NOT NULL,      -- served derivative
  UNIQUE KEY uq_variant (media_id, purpose, format, width),
  CONSTRAINT fk_var_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE media_usage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_id INT UNSIGNED NOT NULL,
  entity_type VARCHAR(40) NOT NULL,       -- page|project|article|builder_node|…
  entity_id INT UNSIGNED NOT NULL,
  field VARCHAR(80) NOT NULL DEFAULT '',
  UNIQUE KEY uq_usage (media_id, entity_type, entity_id, field),
  KEY idx_usage_entity (entity_type, entity_id),
  CONSTRAINT fk_usage_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

`processing='unavailable'` is how FFmpeg/Imagick absence is represented
honestly rather than silently missing (shared-hosting constraint).

## 5 · ROUTING & SEO

```sql
CREATE TABLE page_routes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  path VARCHAR(500) NOT NULL,             -- '/work/orange' — extensionless, no trailing slash
  entity_type ENUM('page','project','article','system') NOT NULL,
  entity_id INT UNSIGNED NULL,
  template VARCHAR(80) NOT NULL DEFAULT 'default',
  is_canonical TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  legacy_path VARCHAR(500) NULL,          -- auto-generates a 301
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_route_path (path(191)),
  UNIQUE KEY uq_route_entity (entity_type, entity_id, is_canonical),
  KEY idx_route_status (status)
) ENGINE=InnoDB;
```

`uq_route_entity` makes duplicate canonicals **structurally impossible**.
`redirects` already exists (`old_url`, `new_url`, `status_code`, `enabled`) —
extend with `hits INT UNSIGNED`, `last_hit_at`, and a `loop_checked` flag.

`page_seo` (1:1 with a route): `title`, `description`, `robots`, `og_title`,
`og_description`, `og_media_id`, `twitter_card`, `schema_type`,
`schema_json JSON`. **Canonical is never stored** — it is derived from
`page_routes.path`, which is why duplicates cannot drift.

## 6 · FORMS / CRM

`forms`, `form_submissions`, `leads` exist. Add `form_fields`, `lead_notes`,
`lead_status_history`. Pipeline enum:
`new|contacted|qualified|proposal|negotiation|won|lost|archived`.

## 7 · BOOKING (all new — only `meetings` exists today)

```sql
CREATE TABLE booking_slots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_id INT UNSIGNED NOT NULL DEFAULT 1,
  starts_at DATETIME NOT NULL,            -- UTC
  ends_at   DATETIME NOT NULL,
  state ENUM('free','held','booked','blocked') NOT NULL DEFAULT 'free',
  hold_expires_at DATETIME NULL,
  UNIQUE KEY uq_slot (resource_id, starts_at),   -- ← last line of defence
  KEY idx_slot_state (state, starts_at)
) ENGINE=InnoDB;
```

**Double-booking prevention — three layers:**
1. `SELECT … FOR UPDATE` on the slot row inside the booking transaction.
2. State machine `free → held (TTL) → booked`; expired holds swept by cron.
3. `UNIQUE (resource_id, starts_at)` — even a race that defeats 1 and 2 fails at
   the constraint. Application locks alone are insufficient with concurrent web
   and cron access.

Plus `booking_availability` (weekly rules + IANA tz), `booking_blackouts`,
`bookings`, `booking_intake_fields`, `booking_intake_values`.

## 8 · SYSTEM

```sql
CREATE TABLE jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  queue VARCHAR(40) NOT NULL DEFAULT 'default',
  type VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  state ENUM('pending','processing','completed','failed','dead') NOT NULL DEFAULT 'pending',
  priority TINYINT NOT NULL DEFAULT 5,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
  available_at DATETIME NOT NULL,         -- backoff target
  reserved_at DATETIME NULL,
  reserved_by VARCHAR(64) NULL,           -- cron run id
  idempotency_key VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_idem (idempotency_key),
  KEY idx_job_claim (state, queue, available_at, priority)
) ENGINE=InnoDB;
```

`job_attempts` records each try (started, finished, error class, **never the
payload's secrets**). `audit_logs` exists — extend to the §20 shape:
`actor_id, action, resource_type, resource_id, before JSON, after JSON, ip,
user_agent, request_id, result, created_at`. Append-only; **never** stores
passwords, tokens, keys or DB credentials.

`backups`: `filename, bytes, checksum, kind, status, verified_at, created_at`.
`site_settings` / `system_settings` / `design_tokens`: typed key/value.

## 9 · Migration & rollback rules

- Every migration is additive or reversible; each ships a `-- DOWN` section.
- No destructive migration runs without an owner-only confirmation.
- Migrations are immutable and checksummed (the existing `MigrationRunner`
  already enforces this — carry it forward unchanged).
- The new schema must build from an **empty** database (Phase 3B gate).


---

## 10 · Implementation facts discovered during Phase 3B

Recorded per §3B.14 — these are platform realities found by building it, not
design changes.

### MariaDB has no native JSON type
`JSON` is an **alias for LONGTEXT** plus an automatic `json_valid()` CHECK
constraint. `information_schema.COLUMNS.DATA_TYPE` therefore reports
`longtext`, not `json`. Verified: **27 `json_valid` CHECK constraints** exist in
the built schema. This is correct behaviour, not drift — MySQL 8 differs. The
schema validator treats `json ≡ longtext` for this reason.

### DDL is not transactional
`CREATE TABLE` cannot be rolled back by a transaction on MariaDB. The migration
engine therefore applies statements individually, records the exact failing
statement index, marks the migration `failed` in the ledger, and refuses to
continue. Partial state is reported rather than hidden. Data-only operations
(the seeder) *do* run in a transaction. Proven by the controlled-failure test:
a 2-statement failure left `_t_partial` created, `_t_broken` absent, ledger
`FAILED`, and the next run blocked.

### `before` and `after` are reserved words
`audit_logs.before` / `.after` must be backtick-quoted. Found by an actual
migration failure during the first fresh run.

### Built schema (measured)
| Metric | Value |
|---|---|
| Tables | 59 (+1 migration ledger = 60) |
| Indexes | 189 |
| Foreign keys | 51 |
| Initial size | ~3.0 MB |
| Migration time | 247–274 ms |
| Seed time | 76–81 ms |
| Full `fresh` wall time | ~390 ms |

### Deliberate absences of a foreign key (§3B.5)
| Column | Why no FK |
|---|---|
| `security_events.user_id` | events must survive deletion of the actor, or the trail can be erased by deleting the user |
| `audit_logs.actor_id` | same reason |
| `content_versions.entity_id` | polymorphic; history must outlive a hard-deleted entity |
| `media_usage.entity_id` | polymorphic across page/project/article/builder_node |
| `rate_limits.bucket` | pure counter, no entity |

---

## §11 · Phase 3E additions (migration 011)

`011_content_engine.sql` extends the content tables by `ALTER`, because
migrations 001–010 are checksummed and must not be edited. **No table was
created or dropped — the count stays at 60 (+ `avos_migrations` = 61).**

| Table | Columns added | ENUM widened |
|---|---|---|
| `pages` | `excerpt` `content`(JSON) `published_at` `author_id` | yes |
| `projects` | `description` `content`(JSON) `metadata`(JSON) `published_at` `author_id` `created_by` `updated_by` | yes |
| `articles` | `featured` `published_at` `created_by` `updated_by` | yes |
| `experience` | `content`(JSON) `published_at` `author_id` `created_by` `updated_by` | yes (3 → 6 values) |

All four `status` ENUMs are now identical:
`draft, review, scheduled, published, unpublished, archived`.
`experience.status` default moves `published` → `draft`.

**`publish_at` vs `published_at` are different columns on purpose.**
`publish_at` is scheduling intent; `published_at` is the moment the content
actually went live and is cleared on unpublish. See API-CONTRACT amendment A4.

FKs added to `users(id) ON DELETE SET NULL` for every actor column, plus
`idx_pages_published`, `idx_proj_published`, `idx_art_featured`.

### Schema validation now covers `ALTER TABLE`

`SchemaValidator::expected()` previously parsed only `CREATE TABLE`, so every
column added after a table's first migration was ungated. It now applies
`ADD/MODIFY/DROP COLUMN` and `ADD KEY` in file order (amendment A8). Proven by
dropping `pages.excerpt` by hand and confirming the gate reported it.

### Still true

MariaDB has **no native JSON type**: `JSON` is `LONGTEXT` + an automatic
`json_valid()` CHECK, and `information_schema` reports `longtext`. The
validator treats `json ≡ longtext`. The new JSON columns behave the same way.

---

## §12 · Phase 3F additions (migration 012)

`012_media_engine.sql` extends the media tables by `ALTER`. **No table created
or dropped — still 60 tables (+ ledger = 61).**

| Table | Columns added | ENUM widened |
|---|---|---|
| `media` | `visibility` `extension` `public_path` `crop`(JSON) `meta`(JSON) `version` `replaced_by` `uploaded_by` | `kind` gains `script` |
| `media_variants` | `hash` `storage_path` | `purpose` gains `xlarge` |

FKs: `media.replaced_by → media(id) ON DELETE SET NULL`,
`media.uploaded_by → users(id) ON DELETE SET NULL`.
Indexes: `idx_media_visibility`, `idx_media_replaced`, `idx_variant_format`.

### Load-bearing constraints

* **`uq_media_hash`** makes byte-identical duplicates structurally impossible.
  Re-uploading the same bytes returns the existing row (DOMAIN-MODEL §3) rather
  than storing a second copy; a soft-deleted match is revived.
* **`uq_variant (media_id, purpose, format, width)`** makes derivative
  generation idempotent — a regenerate upserts rather than accumulating rows.
* **No variant row exists without bytes on disk.** There is deliberately no
  "pending" or "failed" variant state: a format that failed to encode simply
  has no row, which is what keeps the API's format reporting truthful.

### Storage is not in the database

`media.storage_path` is relative to the PRIVATE store and is never returned to
a public client. `media.public_path` is relative to the public store and is
empty for private assets. Neither column ever holds an absolute path.
