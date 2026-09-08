-- ============================================================
-- AV OS — Migration 026: integration registry fresh-install fix
-- 1) schema.sql pre-seeds gsc/ga4/clarity/cloudflare/calendly;
--    migration 020 adds `enabled` DEFAULT 0, and 021's
--    ON DUPLICATE KEY UPDATE never restores it → on fresh
--    installs these real integrations start DISABLED. Fix.
-- 2) resend/smtp/turnstile rows are legacy (superseded by the
--    'email' adapter, SiteConfig SMTP and config Turnstile) and
--    have zero code references — remove the dead rows.
-- ============================================================
UPDATE integrations SET enabled=1
WHERE code IN ('gsc','ga4','clarity','cloudflare','calendly');

DELETE FROM integrations WHERE code IN ('resend','smtp','turnstile');
