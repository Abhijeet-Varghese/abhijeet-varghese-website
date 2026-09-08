-- ============================================================
-- AV OS — Migration 019: ai_agents feature flag (global kill switch)
-- ============================================================
INSERT IGNORE INTO feature_flags (flag, enabled, environment, description) VALUES
  ('ai_agents', 1, 'all', 'AI Agent Operating System (global kill switch — OFF pauses all agents)');
