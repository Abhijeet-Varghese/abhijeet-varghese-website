-- ============================================================
-- AV OS v2 — Creative Business Operating System
-- Migration 002: CRM · Projects · Proposals · Analytics ·
-- Automation · Platform (idempotent)
-- ============================================================
USE avos;

-- ------------------------------------------------------------
-- MULTI-SITE READINESS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  domain VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  theme VARCHAR(60) DEFAULT 'default',
  status ENUM('active','maintenance','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CRM: COMPANIES / CONTACTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  website VARCHAR(255) DEFAULT '',
  industry VARCHAR(120) DEFAULT '',
  size VARCHAR(40) DEFAULT '',
  country VARCHAR(80) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_co_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contacts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) DEFAULT '',
  phone VARCHAR(40) DEFAULT '',
  role VARCHAR(120) DEFAULT '',
  linkedin VARCHAR(255) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ct_email (email),
  INDEX idx_ct_company (company_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CRM: OPPORTUNITIES (pipeline)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED DEFAULT NULL,
  contact_id INT UNSIGNED DEFAULT NULL,
  company_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(190) NOT NULL,
  value DECIMAL(14,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'INR',
  stage ENUM('new','contacted','qualified','meeting','proposal','negotiation','won','lost','archived') DEFAULT 'new',
  probability TINYINT UNSIGNED DEFAULT 10,
  expected_close DATE DEFAULT NULL,
  source VARCHAR(60) DEFAULT '',
  campaign VARCHAR(120) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_op_stage (stage),
  INDEX idx_op_company (company_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CRM: ACTIVITIES / MEETINGS / TASKS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(40) NOT NULL,          -- lead|contact|company|opportunity|project
  entity_id INT UNSIGNED NOT NULL,
  type VARCHAR(40) DEFAULT 'note',           -- note|call|email|meeting|task
  summary TEXT,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_act (entity_type, entity_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meetings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED DEFAULT NULL,
  contact_id INT UNSIGNED DEFAULT NULL,
  opportunity_id INT UNSIGNED DEFAULT NULL,
  subject VARCHAR(190) NOT NULL,
  scheduled_at DATETIME DEFAULT NULL,
  duration_min INT UNSIGNED DEFAULT 30,
  type VARCHAR(40) DEFAULT 'video',
  status ENUM('scheduled','confirmed','completed','cancelled','no_show','rescheduled') DEFAULT 'scheduled',
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mt_status (status),
  INDEX idx_mt_date (scheduled_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description TEXT,
  entity_type VARCHAR(40) DEFAULT '',
  entity_id INT UNSIGNED DEFAULT 0,
  due_at DATETIME DEFAULT NULL,
  status ENUM('todo','in_progress','done','cancelled') DEFAULT 'todo',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  assignee INT UNSIGNED DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tk_status (status),
  INDEX idx_tk_due (due_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- LEAD SCORING RULES (configurable)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  match_field VARCHAR(60) NOT NULL,          -- company|email_domain|budget|timeline|source|referral|meeting
  match_value VARCHAR(190) DEFAULT '',
  points INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) DEFAULT 1,
  sort INT UNSIGNED DEFAULT 0
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PROJECTS (business) + TASKS LINK
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id INT UNSIGNED DEFAULT NULL,
  company_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(190) NOT NULL,
  status ENUM('lead','scoping','in_progress','on_hold','completed','archived') DEFAULT 'scoping',
  budget DECIMAL(14,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'INR',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  team JSON DEFAULT NULL,
  notes TEXT,
  case_study_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pj_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_milestones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  due_at DATE DEFAULT NULL,
  status ENUM('pending','in_progress','done') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pm_project (project_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  media_id INT UNSIGNED DEFAULT NULL,
  kind VARCHAR(40) DEFAULT 'file',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pd_project (project_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PROPOSALS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT UNSIGNED DEFAULT NULL,
  client_name VARCHAR(190) NOT NULL,
  title VARCHAR(190) NOT NULL,
  scope TEXT,
  deliverables JSON DEFAULT NULL,
  timeline VARCHAR(190) DEFAULT '',
  investment DECIMAL(14,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'INR',
  terms TEXT,
  validity_days INT UNSIGNED DEFAULT 30,
  status ENUM('draft','sent','viewed','accepted','rejected','expired') DEFAULT 'draft',
  sent_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- FIRST-PARTY ANALYTICS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED DEFAULT 1,
  event_type VARCHAR(40) NOT NULL,           -- pageview|lead|meeting|cta_click|conversion
  path VARCHAR(255) DEFAULT '',
  referrer VARCHAR(500) DEFAULT '',
  utm_source VARCHAR(120) DEFAULT '',
  utm_medium VARCHAR(120) DEFAULT '',
  utm_campaign VARCHAR(120) DEFAULT '',
  device VARCHAR(20) DEFAULT '',             -- mobile|tablet|desktop
  country VARCHAR(60) DEFAULT '',
  visitor_id CHAR(32) DEFAULT '',
  content_id VARCHAR(80) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ae_type (event_type, created_at),
  INDEX idx_ae_path (path),
  INDEX idx_ae_visitor (visitor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS content_metrics (
  content_type VARCHAR(40) NOT NULL,
  content_id VARCHAR(80) NOT NULL,
  views INT UNSIGNED DEFAULT 0,
  unique_views INT UNSIGNED DEFAULT 0,
  cta_clicks INT UNSIGNED DEFAULT 0,
  leads INT UNSIGNED DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (content_type, content_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CAMPAIGNS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  utm_source VARCHAR(120) DEFAULT '',
  utm_medium VARCHAR(120) DEFAULT '',
  utm_campaign VARCHAR(120) DEFAULT '',
  status ENUM('active','paused','completed') DEFAULT 'active',
  budget DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- AUTOMATION ENGINE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  trigger_event VARCHAR(60) NOT NULL,        -- lead.created|lead.updated|page.published|form.submitted|lead.inactive
  conditions JSON DEFAULT NULL,
  actions JSON NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  run_count INT UNSIGNED DEFAULT 0,
  last_run_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS automation_runs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  automation_id INT UNSIGNED NOT NULL,
  entity_type VARCHAR(40) DEFAULT '',
  entity_id VARCHAR(80) DEFAULT '',
  result JSON DEFAULT NULL,
  success TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  type VARCHAR(40) DEFAULT 'info',
  title VARCHAR(190) NOT NULL,
  body TEXT,
  link VARCHAR(255) DEFAULT '',
  read_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nt_user (user_id, read_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- WEBHOOKS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(500) NOT NULL,
  secret VARCHAR(255) DEFAULT '',
  events JSON DEFAULT NULL,
  status ENUM('active','disabled') DEFAULT 'active',
  last_delivery DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webhook_id INT UNSIGNED NOT NULL,
  event VARCHAR(60) NOT NULL,
  payload JSON DEFAULT NULL,
  response_status INT UNSIGNED DEFAULT 0,
  success TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wd_webhook (webhook_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- API KEYS (hashed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  key_prefix CHAR(8) NOT NULL,
  permissions JSON DEFAULT NULL,
  last_used_at DATETIME DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  revoked TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_key_hash (key_hash)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- FEATURE FLAGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
  flag VARCHAR(80) NOT NULL PRIMARY KEY,
  enabled TINYINT(1) DEFAULT 0,
  description VARCHAR(255) DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SYSTEM ERRORS / EMAIL LOG
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_errors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(20) DEFAULT 'error',
  source VARCHAR(60) DEFAULT '',
  message TEXT,
  context JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_se_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template VARCHAR(60) DEFAULT '',
  recipient VARCHAR(190) DEFAULT '',
  subject VARCHAR(255) DEFAULT '',
  status ENUM('queued','sent','failed') DEFAULT 'queued',
  sent_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- KNOWLEDGE BASE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  body MEDIUMTEXT,
  category VARCHAR(60) DEFAULT 'general',
  tags JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kn_cat (category)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SEED: lead scoring defaults, feature flags, sample automation
-- ------------------------------------------------------------
INSERT IGNORE INTO lead_scoring_rules (name, match_field, match_value, points, sort) VALUES
  ('Large enterprise domain', 'email_domain', '', 10, 1),
  ('Consulting inquiry', 'lead_type', 'consulting', 15, 2),
  ('Experience centre project', 'project_type', 'experience centre', 20, 3),
  ('Urgent timeline', 'timeline', 'urgent', 15, 4),
  ('Direct website', 'source', 'website', 5, 5);

INSERT IGNORE INTO feature_flags (flag, enabled, description) VALUES
  ('ai_copilot', 1, 'AI Copilot assistant'),
  ('case_study_builder_v2', 1, 'Structured case study builder'),
  ('analytics_v2', 1, 'First-party analytics'),
  ('automation', 1, 'Automation engine'),
  ('proposals', 1, 'Proposal engine'),
  ('crm_v2', 1, 'CRM: contacts, companies, opportunities');

INSERT IGNORE INTO automations (name, trigger_event, conditions, actions, enabled) VALUES
  ('High-value lead follow-up', 'lead.created',
   JSON_OBJECT('score_min', 70),
   JSON_ARRAY(JSON_OBJECT('type','notification','title','High-value lead','body','Lead scored above 70 — follow up within 24h'), JSON_OBJECT('type','task','title','Follow up with lead','priority','high')),
   1);
