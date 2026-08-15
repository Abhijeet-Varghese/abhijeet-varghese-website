-- ============================================================
-- AV OS — Creative Intelligence Platform · MySQL/MariaDB schema
-- Hostinger Premium compatible (utf8mb4, InnoDB)
-- v1.1 — no hardcoded admin credentials; admin is created by
-- the installer (install/) with a secure random password and
-- a forced change on first login.
-- ============================================================

-- (the database is created + selected by the installer/runner — no hardcoded name)

-- ------------------------------------------------------------
-- AUTHENTICATION & AUTHORIZATION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  status ENUM('active','invited','suspended') DEFAULT 'active',
  must_change_password TINYINT(1) DEFAULT 0,
  twofa_secret VARCHAR(255) DEFAULT NULL,
  twofa_enabled TINYINT(1) DEFAULT 0,
  last_login_at DATETIME DEFAULT NULL,
  last_login_ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_u_role FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_email (email),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  success TINYINT(1) DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_la (email, ip, attempted_at),
  INDEX idx_la_ip (ip, attempted_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- AUDIT & VERSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(60) NOT NULL,
  entity VARCHAR(80) DEFAULT '',
  entity_id VARCHAR(80) DEFAULT '',
  detail JSON DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al (created_at),
  INDEX idx_al_entity (entity, entity_id),
  INDEX idx_al_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(60) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  version INT UNSIGNED NOT NULL,
  data JSON NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ver (entity, entity_id, version),
  INDEX idx_v (entity, entity_id, created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CONTENT STORE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_store (
  key_name VARCHAR(80) NOT NULL PRIMARY KEY,
  data JSON NOT NULL,
  updated_by INT UNSIGNED DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cs_updated (updated_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MEDIA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  mime VARCHAR(120) DEFAULT '',
  size INT UNSIGNED DEFAULT 0,
  width INT UNSIGNED DEFAULT 0,
  height INT UNSIGNED DEFAULT 0,
  folder VARCHAR(120) DEFAULT 'Uploads',
  alt_text VARCHAR(255) DEFAULT '',
  caption TEXT,
  credit VARCHAR(120) DEFAULT '',
  tags JSON DEFAULT NULL,
  url VARCHAR(500) NOT NULL,
  webp_url VARCHAR(500) DEFAULT NULL,
  avif_url VARCHAR(500) DEFAULT NULL,
  thumb_url VARCHAR(500) DEFAULT NULL,
  usage_count INT UNSIGNED DEFAULT 0,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_m (folder, type),
  INDEX idx_m_created (created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- LEADS (CRM)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) DEFAULT '',
  email VARCHAR(190) DEFAULT '',
  phone VARCHAR(40) DEFAULT '',
  lead_type VARCHAR(60) DEFAULT '',
  message TEXT,
  source VARCHAR(60) DEFAULT '',
  page VARCHAR(190) DEFAULT '',
  referrer VARCHAR(500) DEFAULT '',
  utm_source VARCHAR(120) DEFAULT '',
  utm_medium VARCHAR(120) DEFAULT '',
  utm_campaign VARCHAR(120) DEFAULT '',
  utm_term VARCHAR(120) DEFAULT '',
  utm_content VARCHAR(120) DEFAULT '',
  status ENUM('new','contacted','qualified','proposal','won','lost','archived') DEFAULT 'new',
  score TINYINT UNSIGNED DEFAULT 50,
  tags JSON DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_l (status, created_at),
  INDEX idx_l_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- FORMS & SUBMISSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  config JSON NOT NULL,
  spam_protection ENUM('none','turnstile','honeypot') DEFAULT 'honeypot',
  notify_email VARCHAR(190) DEFAULT '',
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS form_submissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  form_id INT UNSIGNED DEFAULT NULL,
  data JSON NOT NULL,
  status ENUM('new','read','replied','archived','spam') DEFAULT 'new',
  ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fs (form_id, status),
  INDEX idx_fs_created (created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- AI
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_providers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  label VARCHAR(60) NOT NULL,
  api_key_enc VARCHAR(500) DEFAULT '',
  model VARCHAR(120) DEFAULT '',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT UNSIGNED DEFAULT 2000,
  is_default TINYINT(1) DEFAULT 0,
  enabled TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  provider VARCHAR(30) DEFAULT '',
  action VARCHAR(60) DEFAULT '',
  prompt TEXT,
  response TEXT,
  model VARCHAR(120) DEFAULT '',
  tokens_in INT UNSIGNED DEFAULT 0,
  tokens_out INT UNSIGNED DEFAULT 0,
  ok TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai (provider, created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- INTEGRATIONS & SETTINGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  config_enc JSON DEFAULT NULL,
  status ENUM('connected','available','error') DEFAULT 'available',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS site_settings (
  skey VARCHAR(80) NOT NULL PRIMARY KEY,
  svalue JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED: roles, permissions, providers, integrations
-- (Admin user is created by the installer, NOT hardcoded here.)
-- ============================================================
INSERT IGNORE INTO roles (id, name, description) VALUES
  (1, 'Super Admin', 'Full control including users, security, integrations'),
  (2, 'Admin', 'Everything except user deletion and billing'),
  (3, 'Editor', 'Content, media, SEO, publishing'),
  (4, 'Writer', 'Drafts and articles only'),
  (5, 'SEO Manager', 'SEO center, analytics, redirects'),
  (6, 'Viewer', 'Read-only access');

INSERT IGNORE INTO permissions (code, label) VALUES
  ('content.read','Read content'), ('content.write','Write content'),
  ('publish','Publish content'),
  ('media.read','Read media'), ('media.write','Upload/manage media'),
  ('leads.read','Read leads'), ('leads.write','Update leads'),
  ('forms.read','Read forms'), ('forms.write','Manage forms'),
  ('users.read','Read users'), ('users.write','Manage users'),
  ('settings.read','Read settings'), ('settings.write','Manage settings'),
  ('audit.read','View audit logs'),
  ('versions.read','Read versions'), ('versions.restore','Restore versions'),
  ('ai.read','View AI config'), ('ai.write','Configure AI providers'),
  ('backup','Create backups');

-- Super Admin: everything
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 1, id FROM permissions;
-- Admin: everything except users.write
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 2, id FROM permissions WHERE code NOT IN ('users.write');
-- Editor: content, publish, media, forms, leads, settings.read, ai.read
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 3, id FROM permissions WHERE code IN
  ('content.read','content.write','publish','media.read','media.write',
   'leads.read','leads.write','forms.read','forms.write','settings.read',
   'versions.read','versions.restore','audit.read','ai.read');
-- Writer: read content, write posts only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 4, id FROM permissions WHERE code IN ('content.read','content.write','media.read','ai.read');
-- SEO Manager: content.read, settings.read, ai.read
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 5, id FROM permissions WHERE code IN ('content.read','settings.read','audit.read','ai.read');
-- Viewer: read-only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 6, id FROM permissions WHERE code IN ('content.read','media.read','leads.read','forms.read','audit.read','versions.read');

INSERT IGNORE INTO ai_providers (code, label, model, temperature, max_tokens, is_default, enabled) VALUES
  ('openai', 'OpenAI', 'gpt-4o', 0.7, 2000, 1, 1),
  ('gemini', 'Google Gemini', 'gemini-2.0-flash', 0.7, 2000, 0, 1),
  ('claude',  'Anthropic Claude', 'claude-sonnet-4-20250514', 0.7, 2000, 0, 1);

INSERT IGNORE INTO integrations (code, label, status) VALUES
  ('ga4','Google Analytics 4','available'), ('gsc','Google Search Console','available'),
  ('clarity','Microsoft Clarity','available'), ('calendly','Calendly','available'),
  ('resend','Resend','available'), ('smtp','SMTP','available'),
  ('cloudflare','Cloudflare','available'), ('turnstile','Cloudflare Turnstile','available');

INSERT IGNORE INTO site_settings (skey, svalue) VALUES
  ('security', JSON_OBJECT('session_hours', 12, 'login_max_attempts', 5, 'login_lock_minutes', 15, 'csrf', 1)),
  ('rate_limits', JSON_OBJECT('login', JSON_OBJECT('max', 5, 'window', 900), 'lead', JSON_OBJECT('max', 10, 'window', 900), 'submit', JSON_OBJECT('max', 20, 'window', 900), 'media', JSON_OBJECT('max', 30, 'window', 3600), 'ai', JSON_OBJECT('max', 60, 'window', 3600)));
