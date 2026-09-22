-- ============================================================
-- AV OS — Migration 022: DEVELOPMENT INTELLIGENCE + KNOWLEDGE INGESTION
-- github/dev signals · knowledge source attribution ledger
-- ============================================================

-- ---------- knowledge_items: source attribution (Drive/Notion/manual) ----------
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'manual' AFTER tags,
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(190) DEFAULT '' AFTER source_type,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR(600) DEFAULT '' AFTER source_id,
  ADD COLUMN IF NOT EXISTS source_hash VARCHAR(64) DEFAULT '' AFTER source_url,
  ADD COLUMN IF NOT EXISTS source_modified VARCHAR(40) DEFAULT '' AFTER source_hash;
ALTER TABLE knowledge_items ADD UNIQUE KEY uq_ki_source (source_type, source_id(120));

-- ---------- development intelligence (GitHub etc.) ----------
CREATE TABLE IF NOT EXISTS dev_repos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  repo VARCHAR(190) NOT NULL UNIQUE,
  owner VARCHAR(120) DEFAULT '',
  url VARCHAR(300) DEFAULT '',
  description VARCHAR(300) DEFAULT '',
  language VARCHAR(60) DEFAULT '',
  stars INT UNSIGNED DEFAULT 0,
  forks INT UNSIGNED DEFAULT 0,
  open_issues INT UNSIGNED DEFAULT 0,
  default_branch VARCHAR(60) DEFAULT '',
  pushed_at VARCHAR(40) DEFAULT '',
  source VARCHAR(30) DEFAULT 'github',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dev_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  repo VARCHAR(190) DEFAULT '',
  kind ENUM('commit','issue','release','workflow','pr','video','deployment') DEFAULT 'commit',
  title VARCHAR(300) NOT NULL,
  url VARCHAR(400) DEFAULT '',
  state VARCHAR(30) DEFAULT 'open',
  meta JSON DEFAULT NULL,
  created_at DATETIME NULL,
  seen TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_de (repo, kind, url(190)),
  INDEX idx_de_repo (repo, created_at)
) ENGINE=InnoDB;

-- ---------- knowledge ingestion ledger (Drive/Notion/upload) ----------
CREATE TABLE IF NOT EXISTS knowledge_ingest (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_type ENUM('drive','notion','upload') NOT NULL DEFAULT 'upload',
  source_id VARCHAR(190) NOT NULL,
  title VARCHAR(300) DEFAULT '',
  kind ENUM('text','binary') DEFAULT 'text',
  content_hash VARCHAR(64) DEFAULT '',
  status ENUM('pending','ingested','failed','skipped') DEFAULT 'pending',
  last_modified VARCHAR(40) DEFAULT '',
  error VARCHAR(400) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ki2 (source_type, source_id(120))
) ENGINE=InnoDB;
