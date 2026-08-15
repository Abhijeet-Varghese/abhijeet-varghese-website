-- ============================================================
-- AV OS — Migration 005: deployment history + rollback
-- (publish records a row + site/content snapshot; rollback
--  restores the previous live deployment and creates new
--  content versions + audit events). Idempotent.
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(40) NOT NULL,
  status ENUM('live','superseded','rolled_back','failed') DEFAULT 'live',
  created_by INT UNSIGNED DEFAULT NULL,
  note VARCHAR(255) DEFAULT '',
  site_snapshot VARCHAR(255) DEFAULT '',
  content_snapshot MEDIUMTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dep_status (status)
) ENGINE=InnoDB;
