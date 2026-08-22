-- @UP
CREATE TABLE IF NOT EXISTS forms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  status ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  success_message VARCHAR(500) NOT NULL DEFAULT '',
  notify_owner TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_slug (slug),
  KEY idx_form_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_fields (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  form_id INT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  label VARCHAR(190) NOT NULL,
  field_type ENUM('text','textarea','email','phone','select','checkbox','radio','date','url','file','budget','project_type') NOT NULL DEFAULT 'text',
  required TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  options JSON NULL,
  conditions JSON NULL,
  UNIQUE KEY uq_ff (form_id, field_key),
  KEY idx_ff_form (form_id, position),
  CONSTRAINT fk_ff_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  company VARCHAR(190) NOT NULL DEFAULT '',
  source VARCHAR(80) NOT NULL DEFAULT 'website',
  project_type VARCHAR(120) NOT NULL DEFAULT '',
  budget_range VARCHAR(80) NOT NULL DEFAULT '',
  timeline VARCHAR(80) NOT NULL DEFAULT '',
  message TEXT NULL,
  status ENUM('new','contacted','qualified','proposal','negotiation','won','lost','archived') NOT NULL DEFAULT 'new',
  score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  client_id INT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_lead_status (status, created_at),
  KEY idx_lead_email (email),
  KEY idx_lead_deleted (deleted_at),
  CONSTRAINT fk_lead_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  form_id INT UNSIGNED NULL,
  lead_id INT UNSIGNED NULL,
  payload JSON NOT NULL,
  ip VARCHAR(45) NOT NULL DEFAULT '',
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('new','read','spam','archived') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_fs_form (form_id, created_at),
  KEY idx_fs_status (status),
  CONSTRAINT fk_fs_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL,
  CONSTRAINT fk_fs_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ln_lead (lead_id, created_at),
  CONSTRAINT fk_ln_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_ln_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(20) NOT NULL DEFAULT '',
  to_status VARCHAR(20) NOT NULL,
  actor_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_lsh_lead (lead_id, created_at),
  CONSTRAINT fk_lsh_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS lead_status_history;
DROP TABLE IF EXISTS lead_notes;
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS form_fields;
DROP TABLE IF EXISTS forms;
