-- @UP
-- MEDIA first: content and builder both FK into it.
CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('image','video','audio','document','model','texture','shader','font','other') NOT NULL DEFAULT 'image',
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  mime VARCHAR(120) NOT NULL DEFAULT '',
  bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  hash CHAR(64) NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  duration_ms INT UNSIGNED NULL,
  focal_x DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
  focal_y DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
  alt_text VARCHAR(500) NOT NULL DEFAULT '',
  credit VARCHAR(255) NOT NULL DEFAULT '',
  processing ENUM('pending','processing','ready','failed','unavailable') NOT NULL DEFAULT 'pending',
  processing_note VARCHAR(255) NOT NULL DEFAULT '',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_hash (hash),
  KEY idx_media_kind (kind, processing),
  KEY idx_media_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_id INT UNSIGNED NOT NULL,
  purpose ENUM('thumb','card','hero','full','poster','preview') NOT NULL,
  format ENUM('webp','avif','jpeg','png','mp4','webm','glb') NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  public_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_variant (media_id, purpose, format, width),
  CONSTRAINT fk_var_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Polymorphic by design: usage spans page/project/article/builder_node, and a
-- FK per entity type would need one column per type. Integrity is enforced in
-- the media service, and orphan detection is a scheduled job.
CREATE TABLE IF NOT EXISTS media_usage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_id INT UNSIGNED NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  field VARCHAR(80) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usage (media_id, entity_type, entity_id, field),
  KEY idx_usage_entity (entity_type, entity_id),
  CONSTRAINT fk_usage_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS media_usage;
DROP TABLE IF EXISTS media_variants;
DROP TABLE IF EXISTS media;
