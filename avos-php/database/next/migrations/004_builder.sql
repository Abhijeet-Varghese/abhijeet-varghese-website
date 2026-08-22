-- @UP
CREATE TABLE IF NOT EXISTS builder_components (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'Custom',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft','published','deprecated') NOT NULL DEFAULT 'draft',
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  -- JSON: a component's prop schema is open-ended by definition and is never
  -- queried by value; relational columns would mean a table per component.
  schema_json JSON NULL,
  defaults_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bc_slug (slug),
  KEY idx_bc_category (category, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS builder_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  kind ENUM('page','section','header','footer','project','article','archive','search','error') NOT NULL DEFAULT 'page',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  layout JSON NOT NULL,
  conditions JSON NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bt_slug (slug),
  KEY idx_bt_kind (kind, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The element tree. Shape/order/parent are RELATIONAL so they can be queried,
-- ordered and integrity-checked; only open-ended values are JSON.
CREATE TABLE IF NOT EXISTS builder_nodes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id INT UNSIGNED NULL,
  component_id INT UNSIGNED NULL,
  template_id INT UNSIGNED NULL,
  parent_id INT UNSIGNED NULL,
  node_type VARCHAR(64) NOT NULL,
  name VARCHAR(190) NOT NULL DEFAULT '',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  props JSON NULL,
  styles JSON NULL,
  bindings JSON NULL,
  conditions JSON NULL,
  interactions JSON NULL,
  animations JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_bn_page (page_id, position),
  KEY idx_bn_parent (parent_id, position),
  KEY idx_bn_type (node_type),
  CONSTRAINT fk_bn_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_bn_parent FOREIGN KEY (parent_id) REFERENCES builder_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_bn_component FOREIGN KEY (component_id) REFERENCES builder_components(id) ON DELETE SET NULL,
  CONSTRAINT fk_bn_template FOREIGN KEY (template_id) REFERENCES builder_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-device overrides. RELATIONAL because NULL is the inheritance signal:
-- "reset property" is UPDATE … SET col=NULL, "copy desktop→tablet" is a row
-- copy, and the UI can render an override indicator from data rather than
-- guesswork. A JSON blob could not support those as set operations.
CREATE TABLE IF NOT EXISTS builder_node_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  node_id INT UNSIGNED NOT NULL,
  device ENUM('mobile','tablet','laptop','large') NOT NULL,
  styles JSON NULL,
  props JSON NULL,
  visible TINYINT(1) NULL,
  media_id INT UNSIGNED NULL,
  focal_x DECIMAL(5,4) NULL,
  focal_y DECIMAL(5,4) NULL,
  scene_id INT UNSIGNED NULL,
  animation_id INT UNSIGNED NULL,
  replaced_by INT UNSIGNED NULL,
  perf_profile ENUM('ultra','high','medium','low','reduced') NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nd (node_id, device),
  KEY idx_nd_media (media_id),
  CONSTRAINT fk_nd_node FOREIGN KEY (node_id) REFERENCES builder_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_nd_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL,
  CONSTRAINT fk_nd_replaced FOREIGN KEY (replaced_by) REFERENCES builder_nodes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS design_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope ENUM('global','theme','template','section') NOT NULL DEFAULT 'global',
  scope_ref VARCHAR(120) NOT NULL DEFAULT '',
  token_group VARCHAR(60) NOT NULL,
  token_key VARCHAR(80) NOT NULL,
  token_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token (scope, scope_ref, token_group, token_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS design_tokens;
DROP TABLE IF EXISTS builder_node_devices;
DROP TABLE IF EXISTS builder_nodes;
DROP TABLE IF EXISTS builder_templates;
DROP TABLE IF EXISTS builder_components;
