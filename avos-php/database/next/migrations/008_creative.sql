-- @UP
CREATE TABLE IF NOT EXISTS shader_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  stage ENUM('vertex','fragment','compute','include') NOT NULL DEFAULT 'fragment',
  source LONGTEXT NOT NULL,
  uniforms JSON NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft','published','deprecated') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shader_slug (slug),
  KEY idx_shader_stage (stage, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webgl_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  config JSON NULL,
  perf_profile ENUM('ultra','high','medium','low','reduced') NOT NULL DEFAULT 'high',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  vertex_shader_id INT UNSIGNED NULL,
  fragment_shader_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_scene_slug (slug),
  CONSTRAINT fk_scene_vs FOREIGN KEY (vertex_shader_id) REFERENCES shader_assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_scene_fs FOREIGN KEY (fragment_shader_id) REFERENCES shader_assets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS animation_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  trigger_type ENUM('load','scroll','hover','click','cursor','viewport','drag') NOT NULL DEFAULT 'scroll',
  timeline JSON NOT NULL,
  easing VARCHAR(80) NOT NULL DEFAULT 'ease',
  duration_ms INT UNSIGNED NOT NULL DEFAULT 600,
  delay_ms INT UNSIGNED NOT NULL DEFAULT 0,
  stagger_ms INT UNSIGNED NOT NULL DEFAULT 0,
  scrub TINYINT(1) NOT NULL DEFAULT 0,
  respects_reduced_motion TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_anim_slug (slug),
  KEY idx_anim_trigger (trigger_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scene_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scene_id INT UNSIGNED NOT NULL,
  media_id INT UNSIGNED NOT NULL,
  role ENUM('model','texture','environment','lut','other') NOT NULL DEFAULT 'other',
  UNIQUE KEY uq_sa (scene_id, media_id, role),
  CONSTRAINT fk_sa_scene FOREIGN KEY (scene_id) REFERENCES webgl_assets(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS scene_assets;
DROP TABLE IF EXISTS animation_assets;
DROP TABLE IF EXISTS webgl_assets;
DROP TABLE IF EXISTS shader_assets;
