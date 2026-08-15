-- ============================================================
-- AV OS — Migration 006: soft deletes · updated_at ·
-- redirects · AI prompt templates · perf log · indexes ·
-- automation test mode · webhook retry fields · project health
-- (idempotent — MariaDB supports ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- ---------- SOFT DELETE + UPDATED_AT (business data) ----------
ALTER TABLE leads         ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE contacts      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE companies     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE meetings      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE proposals     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE media         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                          ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;

-- business projects: progress + health + updated_at/deleted_at
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress TINYINT UNSIGNED DEFAULT 0 AFTER status,
                     ADD COLUMN IF NOT EXISTS health ENUM('green','amber','red') DEFAULT 'green' AFTER progress,
                     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
                     ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;

-- ---------- AUTOMATION: test mode ----------
ALTER TABLE automations ADD COLUMN IF NOT EXISTS test_mode TINYINT(1) DEFAULT 0 AFTER enabled;

-- ---------- WEBHOOK DELIVERIES: retry + event id ----------
ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS retry_count TINYINT UNSIGNED DEFAULT 0 AFTER success,
                               ADD COLUMN IF NOT EXISTS last_error VARCHAR(500) DEFAULT '' AFTER retry_count,
                               ADD COLUMN IF NOT EXISTS event_id VARCHAR(120) DEFAULT '' AFTER last_error;

-- ---------- REDIRECT MANAGER ----------
CREATE TABLE IF NOT EXISTS redirects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  old_url VARCHAR(500) NOT NULL,
  new_url VARCHAR(500) NOT NULL,
  status_code ENUM('301','302') DEFAULT '301',
  enabled TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_red_old (old_url(190))
) ENGINE=InnoDB;

-- ---------- AI PROMPT TEMPLATES (versioned) ----------
CREATE TABLE IF NOT EXISTS ai_prompts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  prompt TEXT NOT NULL,
  version INT UNSIGNED DEFAULT 1,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO ai_prompts (slug, name, prompt, version) VALUES
('seo-generator-v1', 'SEO metadata generator',
 'Generate SEO metadata for "{title}" ({type}). Return exactly two lines: line 1 = SEO title max 60 chars; line 2 = meta description max 155 chars. No quotes, no labels.', 1),
('case-study-generator-v1', 'Case study drafter',
 'Write a case study draft for "{project}" by Abhijeet Varghese. Structure: context, challenge, approach, outcome, metrics. Write in a clear, warm, editorial voice. Never invent facts about clients or results. Output is a DRAFT for human review.', 1),
('rewrite-v1', 'Rewrite (tone)',
 'Rewrite the following text in a clear, warm, confident editorial tone. Keep all facts, shorten where possible. Output only the rewritten text:\n\n{text}', 1),
('summarize-v1', 'Summarizer',
 'Summarize the following text in 3-4 sentences, preserving key facts. Output only the summary:\n\n{text}', 1),
('alt-text-v1', 'Alt text generator',
 'Write a concise, descriptive alt text (max 120 chars) for this image: {description}', 1);

-- ---------- PERFORMANCE LOG ----------
CREATE TABLE IF NOT EXISTS perf_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(40) DEFAULT '',
  method VARCHAR(10) DEFAULT '',
  path VARCHAR(300) DEFAULT '',
  status INT UNSIGNED DEFAULT 0,
  ms INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_perf_created (created_at)
) ENGINE=InnoDB;

-- ---------- INDEXES (frequent queries) ----------
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_events_path ON analytics_events (path(120));
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_aruns_created ON automation_runs (created_at);
CREATE INDEX IF NOT EXISTS idx_wdel_created ON webhook_deliveries (created_at);
CREATE INDEX IF NOT EXISTS idx_elog_created ON email_log (created_at);
CREATE INDEX IF NOT EXISTS idx_err_created ON system_errors (created_at);
CREATE INDEX IF NOT EXISTS idx_aiq_created ON ai_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_media_deleted ON media (deleted_at);
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads (deleted_at);
CREATE INDEX IF NOT EXISTS idx_opps_stage ON opportunities (stage);
