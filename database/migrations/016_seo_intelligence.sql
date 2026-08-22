-- ============================================================
-- AV OS — Migration 016: SEO + Intelligence engine
-- keywords · clusters · rankings · audits/issues · backlinks ·
-- competitors · opportunities · social drafts
-- ============================================================

CREATE TABLE IF NOT EXISTS keywords (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  keyword VARCHAR(190) NOT NULL,
  intent ENUM('informational','commercial','transactional','navigational','local') DEFAULT 'informational',
  topic VARCHAR(120) DEFAULT '',
  cluster_id INT UNSIGNED DEFAULT NULL,
  country VARCHAR(10) DEFAULT 'IN',
  language VARCHAR(10) DEFAULT 'en',
  priority TINYINT UNSIGNED DEFAULT 50,
  difficulty TINYINT UNSIGNED DEFAULT 0,
  search_volume INT UNSIGNED DEFAULT 0,
  trend TINYINT DEFAULT 0,
  current_position INT UNSIGNED DEFAULT 0,
  target_position INT UNSIGNED DEFAULT 10,
  target_url VARCHAR(500) DEFAULT '',
  primary_keyword TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kw (keyword, country, language),
  INDEX idx_kw_cluster (cluster_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS keyword_clusters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  pillar_url VARCHAR(500) DEFAULT '',
  description VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS keyword_rankings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  keyword_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) DEFAULT '',
  position INT UNSIGNED DEFAULT 0,
  country VARCHAR(10) DEFAULT 'IN',
  device ENUM('desktop','mobile') DEFAULT 'desktop',
  recorded_at DATE NOT NULL,
  UNIQUE KEY uq_rank (keyword_id, recorded_at, device),
  INDEX idx_rank_kw (keyword_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seo_audits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  score TINYINT UNSIGNED DEFAULT 0,
  pages_crawled INT UNSIGNED DEFAULT 0,
  issues_found INT UNSIGNED DEFAULT 0,
  summary JSON DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seo_issues (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  audit_id INT UNSIGNED DEFAULT NULL,
  url VARCHAR(500) DEFAULT '',
  issue_type VARCHAR(60) NOT NULL,
  severity ENUM('critical','warning','info') DEFAULT 'warning',
  detail VARCHAR(500) DEFAULT '',
  status ENUM('open','fixed','ignored') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_iss_status (status),
  INDEX idx_iss_type (issue_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS backlinks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referring_domain VARCHAR(190) NOT NULL,
  target_url VARCHAR(500) DEFAULT '',
  anchor VARCHAR(190) DEFAULT '',
  first_seen DATE DEFAULT NULL,
  last_seen DATE DEFAULT NULL,
  status ENUM('new','active','lost','broken') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bl (referring_domain, target_url)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS competitors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  domain VARCHAR(190) DEFAULT '',
  focus VARCHAR(190) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS content_opportunities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  keyword_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(190) NOT NULL,
  opportunity_score TINYINT UNSIGNED DEFAULT 0,
  reason VARCHAR(500) DEFAULT '',
  status ENUM('open','planned','created','done') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS social_drafts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_type VARCHAR(40) DEFAULT 'case_study',
  content_id VARCHAR(80) DEFAULT '',
  platform ENUM('linkedin','instagram','x','newsletter') DEFAULT 'linkedin',
  draft TEXT,
  status ENUM('draft','approved','posted') DEFAULT 'draft',
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO feature_flags (flag, enabled, environment, description) VALUES
  ('seo', 1, 'all', 'SEO command center (keywords, clusters, audits, opportunities)'),
  ('engagement', 1, 'all', 'Engagement events + scores'),
  ('intelligence', 1, 'all', 'Next-actions engine + briefs/reports'),
  ('site_search', 1, 'all', 'Public site search index + search page');
