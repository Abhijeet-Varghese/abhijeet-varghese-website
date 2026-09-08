-- ============================================================
-- AV OS — Migration 018: AI AGENT OPERATING SYSTEM
-- agent registry · job queue · memory · orchestrator settings
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_agents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(60) DEFAULT 'analyst',
  description VARCHAR(500) DEFAULT '',
  system_prompt TEXT,
  permissions JSON DEFAULT NULL,
  schedule VARCHAR(40) DEFAULT 'daily',
  priority ENUM('critical','high','medium','low') DEFAULT 'medium',
  autonomy TINYINT UNSIGNED DEFAULT 2,
  max_actions TINYINT UNSIGNED DEFAULT 5,
  max_tokens INT UNSIGNED DEFAULT 2000,
  max_cost DECIMAL(8,2) DEFAULT 0.50,
  enabled TINYINT(1) DEFAULT 1,
  status ENUM('active','paused','disabled','error','maintenance') DEFAULT 'active',
  last_run DATETIME NULL,
  last_success DATETIME NULL,
  last_failure DATETIME NULL,
  last_error VARCHAR(500) DEFAULT '',
  run_count INT UNSIGNED DEFAULT 0,
  success_count INT UNSIGNED DEFAULT 0,
  failure_count INT UNSIGNED DEFAULT 0,
  consecutive_failures TINYINT UNSIGNED DEFAULT 0,
  last_seen DATETIME NULL,
  current_job INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_agent_jobs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id INT UNSIGNED DEFAULT NULL,
  agent_slug VARCHAR(80) DEFAULT '',
  job_type VARCHAR(60) DEFAULT 'run',
  priority ENUM('critical','high','medium','low') DEFAULT 'medium',
  status ENUM('queued','running','completed','failed','cancelled') DEFAULT 'queued',
  input JSON DEFAULT NULL,
  output JSON DEFAULT NULL,
  error VARCHAR(500) DEFAULT '',
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  retry_count TINYINT UNSIGNED DEFAULT 0,
  cost DECIMAL(8,4) DEFAULT 0,
  tokens INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_status (status),
  INDEX idx_job_agent (agent_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_agent_memory (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_slug VARCHAR(80) NOT NULL,
  context VARCHAR(60) DEFAULT 'default',
  observation VARCHAR(500) DEFAULT '',
  decision VARCHAR(500) DEFAULT '',
  action VARCHAR(500) DEFAULT '',
  result VARCHAR(1000) DEFAULT '',
  metric VARCHAR(120) DEFAULT '',
  confidence TINYINT UNSIGNED DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mem_agent (agent_slug, created_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO site_settings (skey, svalue) VALUES
  ('ai_orchestrator', '{"paused_scopes":[],"daily_budget":2.00,"monthly_budget":40.00,"quality_threshold":70,"max_jobs_per_run":6}');
