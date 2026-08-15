-- ============================================================
-- AV OS — Migration 010: optional TOTP 2FA for administrators
-- (secret encrypted at rest; recovery codes stored hashed,
--  single-use; audit events on enable/disable/fail/recovery)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) NULL DEFAULT NULL AFTER must_change_password,
                  ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1) DEFAULT 0 AFTER totp_secret,
                  ADD COLUMN IF NOT EXISTS totp_recovery JSON NULL DEFAULT NULL AFTER totp_enabled,
                  ADD COLUMN IF NOT EXISTS totp_verified_at DATETIME NULL DEFAULT NULL AFTER totp_recovery;
