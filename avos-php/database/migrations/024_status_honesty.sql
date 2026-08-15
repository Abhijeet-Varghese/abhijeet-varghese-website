-- ============================================================
-- AV OS — Migration 024: integration status honesty fix
-- Credential-free adapters (RSS/Trends) start as 'configured';
-- CONNECTED is only set after a real, successful request.
-- ============================================================
UPDATE integrations SET status='configured'
WHERE status='connected' AND last_success_at IS NULL
  AND code IN ('trends','rss');
