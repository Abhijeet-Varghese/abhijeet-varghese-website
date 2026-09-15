-- ============================================================
-- AV OS — Migration 007: server-side session registry
-- (enables session revocation, active-session listing, expiry).
-- PHP sessions remain the auth mechanism; this table mirrors them.
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  ip VARCHAR(45) DEFAULT '',
  user_agent VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  expires_at DATETIME NULL,
  INDEX idx_sess_user (user_id),
  INDEX idx_sess_expires (expires_at)
) ENGINE=InnoDB;
