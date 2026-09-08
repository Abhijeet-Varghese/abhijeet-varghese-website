-- ============================================================
-- AV OS — Migration 014: production hardening
-- publish_queue (debounce/coalescing + visibility) · flag
-- environments · publish settings (retention, toggles)
-- ============================================================
CREATE TABLE IF NOT EXISTS publish_queue (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(40) NOT NULL DEFAULT 'publish',
  status ENUM('queued','processing','completed','failed') DEFAULT 'queued',
  requested_by INT UNSIGNED DEFAULT NULL,
  trigger_name VARCHAR(40) DEFAULT 'cms_save',
  note VARCHAR(255) DEFAULT '',
  error VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_pq_type_status (type, status)
) ENGINE=InnoDB;

ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS environment VARCHAR(40) DEFAULT 'all' AFTER enabled;

INSERT IGNORE INTO feature_flags (flag, enabled, environment, description) VALUES
  ('frontend_sync', 1, 'all', 'Frontend asset sync (css/js/assets into template)'),
  ('post_publish_healthcheck', 1, 'all', 'Verify critical routes after publish; auto-rollback on failure'),
  ('automatic_rollback', 1, 'all', 'Restore previous deployment when post-publish checks fail'),
  ('publish_queue', 1, 'all', 'Debounced publish queue (coalesces rapid saves into one publish)');

INSERT IGNORE INTO site_settings (skey, svalue) VALUES ('publish', '{"retention":10,"db_backups":5}');
