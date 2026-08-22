-- @UP
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  skey VARCHAR(120) NOT NULL,
  svalue LONGTEXT NULL,
  value_type ENUM('string','int','bool','json') NOT NULL DEFAULT 'string',
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_setting (skey),
  KEY idx_setting_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- is_public gates what /api/v1/settings may expose without authentication.

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  queue VARCHAR(40) NOT NULL DEFAULT 'default',
  type VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  state ENUM('pending','processing','completed','failed','dead') NOT NULL DEFAULT 'pending',
  priority TINYINT NOT NULL DEFAULT 5,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
  available_at DATETIME NOT NULL,
  reserved_at DATETIME NULL,
  reserved_by VARCHAR(64) NULL,
  idempotency_key VARCHAR(120) NULL,
  last_error VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_job_idem (idempotency_key),
  KEY idx_job_claim (state, queue, available_at, priority),
  KEY idx_job_reserved (reserved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  attempt TINYINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  outcome ENUM('completed','failed','timeout') NOT NULL DEFAULT 'failed',
  error_class VARCHAR(120) NULL,
  error_message VARCHAR(500) NULL,
  KEY idx_ja_job (job_id, attempt),
  CONSTRAINT fk_ja_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- job_attempts never stores the payload: it may contain recipient data.

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  resource_type VARCHAR(60) NOT NULL DEFAULT '',
  resource_id VARCHAR(60) NOT NULL DEFAULT '',
  `before` JSON NULL,   -- reserved word in MariaDB; must be quoted
  `after` JSON NULL,
  ip VARCHAR(45) NOT NULL DEFAULT '',
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  request_id VARCHAR(40) NOT NULL DEFAULT '',
  result ENUM('success','failure') NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_actor (actor_id, created_at),
  KEY idx_audit_action (action, created_at),
  KEY idx_audit_resource (resource_type, resource_id),
  KEY idx_audit_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- No FK on actor_id: the audit trail must survive deletion of the actor.

CREATE TABLE IF NOT EXISTS email_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  audience ENUM('client','owner') NOT NULL DEFAULT 'client',
  subject VARCHAR(255) NOT NULL,
  body_text LONGTEXT NOT NULL,
  body_html LONGTEXT NULL,
  status ENUM('draft','active') NOT NULL DEFAULT 'draft',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_et_slug (slug),
  KEY idx_et_audience (audience, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- `audience` is the enforcement point for the two-identity rule: a template
-- marked 'client' may never be rendered with the owner address.

CREATE TABLE IF NOT EXISTS email_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_slug VARCHAR(120) NOT NULL DEFAULT '',
  audience ENUM('client','owner') NOT NULL DEFAULT 'client',
  recipient_hash CHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  error VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  KEY idx_el_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- recipient_hash, not the address: the owner address must never be stored in
-- a table an admin screen could render.

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  level ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  title VARCHAR(190) NOT NULL,
  body VARCHAR(500) NOT NULL DEFAULT '',
  link VARCHAR(255) NOT NULL DEFAULT '',
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  kind ENUM('database','files','full') NOT NULL DEFAULT 'database',
  bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  checksum CHAR(64) NOT NULL DEFAULT '',
  status ENUM('pending','complete','failed','verified') NOT NULL DEFAULT 'pending',
  verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_backup_file (filename),
  KEY idx_backup_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket VARCHAR(190) NOT NULL,
  hit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rl_bucket (bucket, hit_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS job_attempts;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS site_settings;
