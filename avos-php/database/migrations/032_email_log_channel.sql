-- ============================================================
-- AV OS — Migration 032: email_log channel tagging
-- Distinguishes backend-sent email from EmailJS fallback email
-- (spec: the log must identify 'backend' vs 'emailjs_fallback').
-- Idempotent: ADD COLUMN IF NOT EXISTS.
-- ============================================================

ALTER TABLE email_log
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20) NOT NULL DEFAULT 'backend';
