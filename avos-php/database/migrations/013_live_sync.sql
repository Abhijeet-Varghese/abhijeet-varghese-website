-- ============================================================
-- AV OS — Migration 013: LIVE SYNC (plug-and-play)
-- auto_publish: publishing runs automatically after every content
-- save, so backend changes reflect on the public site instantly.
-- ============================================================
INSERT IGNORE INTO feature_flags (flag, enabled, description) VALUES
  ('auto_publish', 1, 'Publish automatically when content changes (live sync)');
