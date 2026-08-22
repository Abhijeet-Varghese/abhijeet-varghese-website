-- ============================================================================
-- AV OS — Migration 028: visual builder foundation (ADDITIVE)
--
-- Establishes the page/node/component/template/content-type layer for the
-- visual CMS & website builder. This is the ONLY source of layout truth; the
-- existing `content_store` remains the content-record store (projects,
-- articles, clients, settings, nav, …). Nothing here drops, renames, or
-- modifies existing tables — it is purely additive and idempotent.
--
-- Conventions (per MigrationRunner): no USE/DROP/CREATE DATABASE, IF NOT
-- EXISTS everywhere, portable column types.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PAGES — one row per editable page. The page's visual layout is the tree of
-- builder_nodes rooted here. SEO + status live here (superseding the ad-hoc
-- `pages` key inside content_store for *layout* purposes; content records stay
-- in content_store).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft',
  template_id INT UNSIGNED DEFAULT NULL,
  seo JSON NULL,
  publish_at DATETIME NULL,
  unpublish_at DATETIME NULL,
  updated_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bp_slug (slug),
  KEY idx_bp_status (status),
  KEY idx_bp_publish (publish_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- NODES — the builder element tree. One row per element on a page (or inside a
-- template/component). `parent_id` forms the tree; `position` orders siblings.
-- props/styles/responsive/bindings/conditions/interactions/animations are
-- structured JSON (the flexible, non-relational parts of an element).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_nodes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id INT UNSIGNED DEFAULT NULL,
  component_id INT UNSIGNED DEFAULT NULL,
  parent_id INT UNSIGNED DEFAULT NULL,
  type VARCHAR(64) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  props JSON NULL,
  styles JSON NULL,
  responsive JSON NULL,
  bindings JSON NULL,
  conditions JSON NULL,
  interactions JSON NULL,
  animations JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_bn_page (page_id),
  KEY idx_bn_parent (parent_id),
  KEY idx_bn_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- COMPONENTS — reusable, named element groups (Button, Project Card, Hero,
-- CTA, …). A component is itself a node tree; `root_node_id` points at its
-- root. Instances reference a component via builder_nodes.component_id and
-- may carry overrides (stored on the instance node).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_components (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'Custom',
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  root_node_id INT UNSIGNED DEFAULT NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  props JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bc_name (name),
  KEY idx_bc_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- TEMPLATES — page/section/header/footer/archive layouts with display
-- conditions (apply to "all projects", "except featured", …). `layout` is the
-- serialized root node; `conditions` drive where it applies.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  kind ENUM('page','section','header','footer','project','article','archive','search','error') NOT NULL DEFAULT 'page',
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  layout JSON NOT NULL,
  conditions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bt_name (name),
  KEY idx_bt_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- CONTENT TYPES — user-defined content models (Awards, Services, …). Fields
-- are defined in content_fields; records live in custom_records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  singular VARCHAR(190) NOT NULL,
  plural VARCHAR(190) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'doc',
  has_archive TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  settings JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ct_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- CONTENT FIELDS — the schema of each content type. `options`/`settings` hold
-- field-specific config (select options, validation, repeater sub-schema).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_fields (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_type_id INT UNSIGNED NOT NULL,
  field_key VARCHAR(120) NOT NULL,
  label VARCHAR(190) NOT NULL,
  field_type ENUM(
    'text','textarea','richtext','number','currency','date','time','url','email','phone',
    'color','image','gallery','video','audio','file','select','multiselect','checkbox',
    'toggle','radio','repeater','group','relation','taxonomy','user','code','html','json'
  ) NOT NULL DEFAULT 'text',
  required TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  options JSON NULL,
  settings JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cf_key (content_type_id, field_key),
  KEY idx_cf_type (content_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- CUSTOM RECORDS — instances of content types. `title`/`slug`/`status`/
-- `featured`/`published_at` are normalized (filterable/sortable); the full
-- flexible field set lives in `data` (JSON). Relational fields reference other
-- tables by id inside `data`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_type_id INT UNSIGNED NOT NULL,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  data JSON NULL,
  updated_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cr_slug (content_type_id, slug),
  KEY idx_cr_status (status),
  KEY idx_cr_featured (featured),
  KEY idx_cr_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
