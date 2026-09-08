-- ============================================================
-- AV OS — Migration 027: HARDENING
-- 1) DB-backed atomic rate limiter (replaces non-atomic file writes)
-- 2) analytics_events created_at index (retention/query performance)
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  k VARCHAR(190) NOT NULL PRIMARY KEY,
  window_start DATETIME NOT NULL,
  count INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_window (window_start)
) ENGINE=InnoDB;

ALTER TABLE analytics_events
  ADD INDEX IF NOT EXISTS idx_ae_created (created_at);
