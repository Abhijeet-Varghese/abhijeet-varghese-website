-- @UP
-- Password reset tokens (AUTH-ARCHITECTURE §5).
-- The token is NEVER stored: only sha256(token). A database disclosure must not
-- let an attacker reset an account. Single-use, short-lived, invalidated on use
-- and on any password change.
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  requested_ip VARCHAR(45) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  invalidated_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pr_token (token_hash),
  KEY idx_pr_user (user_id, created_at),
  KEY idx_pr_expiry (expires_at),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS password_resets;
