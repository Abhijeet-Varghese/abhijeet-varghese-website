-- ============================================================
-- AV OS — Migration 020: INTEGRATION HUB + DATA INTELLIGENCE
-- Real integration registry · search console data · api cache
-- integration call log · research engine · knowledge graph
-- truth layer (facts) · case-study intelligence · social registry
-- trackable links (UTM / WhatsApp) · intelligence metrics
-- agent outcome measurement
-- ============================================================

-- ---------- extend integrations registry (idempotent) ----------
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS name VARCHAR(120) DEFAULT '' AFTER code,
  ADD COLUMN IF NOT EXISTS provider VARCHAR(60) DEFAULT '' AFTER name,
  ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'other' AFTER provider,
  ADD COLUMN IF NOT EXISTS enabled TINYINT(1) DEFAULT 0 AFTER status,
  ADD COLUMN IF NOT EXISTS authentication_type VARCHAR(40) DEFAULT 'none' AFTER enabled,
  ADD COLUMN IF NOT EXISTS capabilities JSON DEFAULT NULL AFTER authentication_type,
  ADD COLUMN IF NOT EXISTS free_tier VARCHAR(24) DEFAULT 'free' AFTER capabilities,
  ADD COLUMN IF NOT EXISTS quota JSON DEFAULT NULL AFTER free_tier,
  ADD COLUMN IF NOT EXISTS rate_limit JSON DEFAULT NULL AFTER quota,
  ADD COLUMN IF NOT EXISTS last_sync_at DATETIME NULL AFTER rate_limit,
  ADD COLUMN IF NOT EXISTS last_success_at DATETIME NULL AFTER last_sync_at,
  ADD COLUMN IF NOT EXISTS last_failure_at DATETIME NULL AFTER last_success_at,
  ADD COLUMN IF NOT EXISTS last_error VARCHAR(500) DEFAULT '' AFTER last_failure_at,
  ADD COLUMN IF NOT EXISTS configuration JSON DEFAULT NULL AFTER last_error,
  ADD COLUMN IF NOT EXISTS sync_interval_minutes INT UNSIGNED DEFAULT 1440 AFTER configuration,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sync_interval_minutes;

-- wider status vocabulary (CONNECTED is only ever set after a real verified request).
-- Transitional enum first (keeps legacy 'available' valid during the UPDATE),
-- then the final vocabulary.
ALTER TABLE integrations
  MODIFY status ENUM('connected','configured','not_connected','auth_required','rate_limited','error','disabled','unavailable','limited','manual','available')
  NOT NULL DEFAULT 'not_connected';
UPDATE integrations SET status = 'not_connected' WHERE status = 'available';
ALTER TABLE integrations
  MODIFY status ENUM('connected','configured','not_connected','auth_required','rate_limited','error','disabled','unavailable','limited','manual')
  NOT NULL DEFAULT 'not_connected';

-- ---------- search console (Google + Bing) ----------
CREATE TABLE IF NOT EXISTS search_console_queries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source ENUM('google','bing') NOT NULL DEFAULT 'google',
  property VARCHAR(200) DEFAULT '',
  query VARCHAR(300) NOT NULL,
  page VARCHAR(400) DEFAULT '',
  clicks INT UNSIGNED DEFAULT 0,
  impressions INT UNSIGNED DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  position DECIMAL(6,2) DEFAULT 0,
  country VARCHAR(8) DEFAULT '',
  device VARCHAR(16) DEFAULT '',
  ddate DATE NOT NULL,
  retrieved_at DATETIME DEFAULT NULL,
  UNIQUE KEY uq_scq (source, ddate, query(120), page(200), country, device),
  INDEX idx_scq_date (ddate),
  INDEX idx_scq_query (query(120))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS search_console_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source ENUM('google','bing') NOT NULL DEFAULT 'google',
  property VARCHAR(200) DEFAULT '',
  page VARCHAR(400) NOT NULL,
  clicks INT UNSIGNED DEFAULT 0,
  impressions INT UNSIGNED DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  position DECIMAL(6,2) DEFAULT 0,
  ddate DATE NOT NULL,
  retrieved_at DATETIME DEFAULT NULL,
  UNIQUE KEY uq_scp (source, ddate, page(200)),
  INDEX idx_scp_date (ddate)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS search_console_daily (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source ENUM('google','bing') NOT NULL DEFAULT 'google',
  property VARCHAR(200) DEFAULT '',
  ddate DATE NOT NULL,
  clicks INT UNSIGNED DEFAULT 0,
  impressions INT UNSIGNED DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  position DECIMAL(6,2) DEFAULT 0,
  retrieved_at DATETIME DEFAULT NULL,
  UNIQUE KEY uq_scd (source, ddate, property(120))
) ENGINE=InnoDB;

-- ---------- api cache (dedupe external calls) ----------
CREATE TABLE IF NOT EXISTS api_cache (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(64) NOT NULL UNIQUE,
  provider VARCHAR(60) DEFAULT '',
  endpoint VARCHAR(255) DEFAULT '',
  payload JSON DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cache_exp (expires_at)
) ENGINE=InnoDB;

-- ---------- integration call log (never secrets) ----------
CREATE TABLE IF NOT EXISTS integration_calls (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) DEFAULT '',
  endpoint VARCHAR(255) DEFAULT '',
  agent VARCHAR(60) DEFAULT '',
  request_id VARCHAR(40) DEFAULT '',
  duration_ms INT UNSIGNED DEFAULT 0,
  success TINYINT(1) DEFAULT 0,
  status_code INT UNSIGNED DEFAULT 0,
  error VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ic_provider (provider, created_at),
  INDEX idx_ic_success (success)
) ENGINE=InnoDB;

-- ---------- research engine (RSS, open standards) ----------
CREATE TABLE IF NOT EXISTS research_sources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  rss_url VARCHAR(500) NOT NULL,
  topic VARCHAR(80) DEFAULT 'general',
  priority ENUM('high','medium','low') DEFAULT 'medium',
  enabled TINYINT(1) DEFAULT 1,
  authority TINYINT UNSIGNED DEFAULT 50,
  relevance TINYINT UNSIGNED DEFAULT 50,
  freshness TINYINT UNSIGNED DEFAULT 50,
  trust TINYINT UNSIGNED DEFAULT 50,
  last_fetched DATETIME NULL,
  last_error VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS research_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_id INT UNSIGNED DEFAULT NULL,
  guid VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  url VARCHAR(600) DEFAULT '',
  author VARCHAR(120) DEFAULT '',
  summary TEXT,
  published_at DATETIME NULL,
  fetched_at DATETIME NULL,
  processed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ri_source (source_id),
  INDEX idx_ri_pub (published_at)
) ENGINE=InnoDB;

-- ---------- knowledge graph ----------
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(40) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  label VARCHAR(200) NOT NULL,
  properties JSON DEFAULT NULL,
  source VARCHAR(60) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kg (entity_type, entity_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_type VARCHAR(40) NOT NULL,
  from_id VARCHAR(120) NOT NULL,
  to_type VARCHAR(40) NOT NULL,
  to_id VARCHAR(120) NOT NULL,
  relation VARCHAR(60) NOT NULL,
  weight TINYINT UNSIGNED DEFAULT 1,
  evidence VARCHAR(300) DEFAULT '',
  verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ke (from_type, from_id(60), to_type, to_id(60), relation)
) ENGINE=InnoDB;

-- ---------- truth layer (facts) ----------
CREATE TABLE IF NOT EXISTS facts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  claim TEXT NOT NULL,
  status ENUM('verified','unverified','inferred','opinion','external','deprecated') NOT NULL DEFAULT 'unverified',
  category VARCHAR(40) DEFAULT 'general',
  evidence TEXT,
  source VARCHAR(200) DEFAULT '',
  confidence TINYINT UNSIGNED DEFAULT 50,
  created_by VARCHAR(60) DEFAULT 'system',
  verified_by VARCHAR(60) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_facts_status (status)
) ENGINE=InnoDB;

-- ---------- case study intelligence ----------
CREATE TABLE IF NOT EXISTS case_study_scores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_slug VARCHAR(120) NOT NULL UNIQUE,
  project_title VARCHAR(200) DEFAULT '',
  score TINYINT UNSIGNED DEFAULT 0,
  dimensions JSON DEFAULT NULL,
  missing JSON DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- social profile registry ----------
CREATE TABLE IF NOT EXISTS social_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(30) NOT NULL UNIQUE,
  profile_url VARCHAR(300) NOT NULL,
  display_name VARCHAR(120) DEFAULT '',
  handle VARCHAR(120) DEFAULT '',
  api_availability ENUM('available','limited','manual','none') DEFAULT 'manual',
  connected TINYINT(1) DEFAULT 0,
  last_sync DATETIME NULL,
  capabilities JSON DEFAULT NULL,
  notes VARCHAR(300) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- trackable links (UTM generator + WhatsApp click-to-chat) ----------
CREATE TABLE IF NOT EXISTS trackable_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('utm','whatsapp') NOT NULL DEFAULT 'utm',
  name VARCHAR(160) NOT NULL,
  target_url VARCHAR(600) DEFAULT '',
  source VARCHAR(120) DEFAULT '',
  medium VARCHAR(120) DEFAULT '',
  campaign VARCHAR(120) DEFAULT '',
  term VARCHAR(120) DEFAULT '',
  content VARCHAR(120) DEFAULT '',
  phone VARCHAR(40) DEFAULT '',
  message VARCHAR(300) DEFAULT '',
  clicks INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS link_clicks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  link_id INT UNSIGNED NOT NULL,
  referrer VARCHAR(300) DEFAULT '',
  page VARCHAR(300) DEFAULT '',
  ip VARCHAR(45) DEFAULT '',
  ua VARCHAR(300) DEFAULT '',
  lead_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lc_link (link_id, created_at)
) ENGINE=InnoDB;

-- ---------- intelligence metrics (positioning health, trends, external data) ----------
CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  metric VARCHAR(80) NOT NULL,
  scope VARCHAR(120) DEFAULT '',
  value DECIMAL(14,4) DEFAULT 0,
  details JSON DEFAULT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_im_metric (metric, period_start)
) ENGINE=InnoDB;

-- ---------- agent outcome measurement (real business results) ----------
CREATE TABLE IF NOT EXISTS agent_outcomes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_slug VARCHAR(80) NOT NULL,
  metric VARCHAR(60) NOT NULL,
  entity VARCHAR(120) DEFAULT '',
  before_value VARCHAR(60) DEFAULT '',
  after_value VARCHAR(60) DEFAULT '',
  delta VARCHAR(60) DEFAULT '',
  period_start DATE NULL,
  period_end DATE NULL,
  source VARCHAR(60) DEFAULT '',
  note VARCHAR(300) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ao_agent (agent_slug, created_at)
) ENGINE=InnoDB;
