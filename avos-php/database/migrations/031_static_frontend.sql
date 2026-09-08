-- ============================================================
-- AV OS — Migration 031: static frontend is the final website
--
-- The hand-authored static frontend (../abhijeetvarghese) is served as-is.
-- The HTML generator (PublishEngine), template layer (site-template/),
-- frontend→template sync, deployment snapshots/rollback, publish queue and
-- CMS-managed redirects are retired. Redirects now live in the frontend's
-- own .htaccess. Backup retention keeps its own settings key.
-- ============================================================

-- carry the backup-retention setting over from the old publish settings blob
INSERT IGNORE INTO site_settings (skey, svalue)
SELECT 'backup', JSON_OBJECT('db_backups', COALESCE(JSON_EXTRACT(svalue, '$.db_backups'), 5))
FROM site_settings WHERE skey='publish';
INSERT IGNORE INTO site_settings (skey, svalue) VALUES ('backup', '{"db_backups":5}');
DELETE FROM site_settings WHERE skey='publish';

-- retired feature flags (publish pipeline only)
DELETE FROM feature_flags WHERE flag IN ('auto_publish','frontend_sync','post_publish_healthcheck','automatic_rollback','publish_queue','site_search');

-- retired tables
DROP TABLE IF EXISTS publish_queue;
DROP TABLE IF EXISTS deployments;
DROP TABLE IF EXISTS redirects;
