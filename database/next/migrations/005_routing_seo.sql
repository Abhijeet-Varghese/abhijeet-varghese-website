-- @UP
-- uq_route_entity makes duplicate canonicals structurally impossible.
CREATE TABLE IF NOT EXISTS page_routes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  path VARCHAR(500) NOT NULL,
  entity_type ENUM('page','project','article','system') NOT NULL,
  entity_id INT UNSIGNED NULL,
  template VARCHAR(80) NOT NULL DEFAULT 'default',
  is_canonical TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  legacy_path VARCHAR(500) NULL,
  in_sitemap TINYINT(1) NOT NULL DEFAULT 1,
  priority DECIMAL(2,1) NOT NULL DEFAULT 0.5,
  changefreq VARCHAR(20) NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_route_path (path(191)),
  UNIQUE KEY uq_route_entity (entity_type, entity_id, is_canonical),
  KEY idx_route_status (status, in_sitemap)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redirects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_path VARCHAR(500) NOT NULL,
  to_path VARCHAR(500) NOT NULL,
  status_code SMALLINT UNSIGNED NOT NULL DEFAULT 301,
  is_wildcard TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  last_hit_at DATETIME NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_redirect_from (from_path(191)),
  KEY idx_redirect_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Canonical is deliberately ABSENT: it is derived from page_routes.path, so it
-- cannot drift out of sync with the route registry.
CREATE TABLE IF NOT EXISTS page_seo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  description VARCHAR(500) NOT NULL DEFAULT '',
  robots VARCHAR(80) NOT NULL DEFAULT 'index, follow',
  og_title VARCHAR(255) NOT NULL DEFAULT '',
  og_description VARCHAR(500) NOT NULL DEFAULT '',
  og_media_id INT UNSIGNED NULL,
  twitter_card VARCHAR(40) NOT NULL DEFAULT 'summary_large_image',
  schema_type VARCHAR(60) NOT NULL DEFAULT '',
  schema_json JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_route (route_id),
  CONSTRAINT fk_seo_route FOREIGN KEY (route_id) REFERENCES page_routes(id) ON DELETE CASCADE,
  CONSTRAINT fk_seo_media FOREIGN KEY (og_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_analysis (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id INT UNSIGNED NOT NULL,
  score TINYINT UNSIGNED NULL,
  checks JSON NULL,
  analyser VARCHAR(40) NOT NULL DEFAULT 'rules',
  analysed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_seoa_route (route_id, analysed_at),
  CONSTRAINT fk_seoa_route FOREIGN KEY (route_id) REFERENCES page_routes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_nav_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navigation_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  navigation_id INT UNSIGNED NOT NULL,
  parent_id INT UNSIGNED NULL,
  label VARCHAR(190) NOT NULL,
  route_id INT UNSIGNED NULL,
  external_url VARCHAR(500) NOT NULL DEFAULT '',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_ni_nav (navigation_id, position),
  KEY idx_ni_parent (parent_id),
  CONSTRAINT fk_ni_nav FOREIGN KEY (navigation_id) REFERENCES navigation(id) ON DELETE CASCADE,
  CONSTRAINT fk_ni_parent FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_ni_route FOREIGN KEY (route_id) REFERENCES page_routes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS navigation_items;
DROP TABLE IF EXISTS navigation;
DROP TABLE IF EXISTS seo_analysis;
DROP TABLE IF EXISTS page_seo;
DROP TABLE IF EXISTS redirects;
DROP TABLE IF EXISTS page_routes;
