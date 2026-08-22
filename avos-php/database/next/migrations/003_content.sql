-- @UP
CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  name VARCHAR(190) NOT NULL,
  industry VARCHAR(120) NOT NULL DEFAULT '',
  logo_media_id INT UNSIGNED NULL,
  website VARCHAR(255) NOT NULL DEFAULT '',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_client_slug (slug),
  KEY idx_client_featured (is_featured, position),
  CONSTRAINT fk_client_logo FOREIGN KEY (logo_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pages (
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
  KEY idx_pages_deleted (deleted_at),
  CONSTRAINT fk_pages_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 2 decision: case studies are projects with a flag, not a second table.
CREATE TABLE IF NOT EXISTS projects (
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
  template VARCHAR(80) NOT NULL DEFAULT 'default',
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  publish_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proj_slug (slug),
  KEY idx_proj_status (status, publish_at),
  KEY idx_proj_case (is_case_study, featured, position),
  CONSTRAINT fk_proj_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_proj_hero FOREIGN KEY (hero_media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  name VARCHAR(190) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_cat_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  name VARCHAR(190) NOT NULL,
  UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  kind ENUM('essay','journal') NOT NULL DEFAULT 'essay',
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  body JSON NULL,
  cover_media_id INT UNSIGNED NULL,
  author_id INT UNSIGNED NULL,
  reading_minutes SMALLINT UNSIGNED NULL,
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  publish_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_art_slug (slug),
  KEY idx_art_kind_status (kind, status, publish_at),
  CONSTRAINT fk_art_cover FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL,
  CONSTRAINT fk_art_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_categories (
  article_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, category_id),
  KEY idx_ac_cat (category_id),
  CONSTRAINT fk_ac_art FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ac_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  KEY idx_at_tag (tag_id),
  CONSTRAINT fk_at_art FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ordered timeline. `position` is content, not presentation (DOMAIN-MODEL §4).
CREATE TABLE IF NOT EXISTS experience (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  era VARCHAR(120) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL,
  organisation VARCHAR(190) NOT NULL DEFAULT '',
  summary TEXT NULL,
  year_from SMALLINT UNSIGNED NULL,
  year_to SMALLINT UNSIGNED NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_exp_order (position),
  KEY idx_exp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id INT UNSIGNED NULL,
  author_name VARCHAR(190) NOT NULL,
  author_role VARCHAR(190) NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_test_status (status, position),
  CONSTRAINT fk_test_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 2 decision: ONE polymorphic version table, not one per content type.
CREATE TABLE IF NOT EXISTS content_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('page','project','article','experience','navigation','settings') NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  checksum CHAR(64) NOT NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cv (entity_type, entity_id, version),
  KEY idx_cv_entity (entity_type, entity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- No FK on content_versions.entity_id: it is polymorphic. History must also
-- outlive a hard-deleted entity, which a CASCADE would destroy.

-- @DOWN
DROP TABLE IF EXISTS content_versions;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS article_categories;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS clients;
