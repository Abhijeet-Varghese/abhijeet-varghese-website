-- ============================================================
-- AV OS — Migration 025: remove dead legacy feature flags
-- ai_copilot / analytics_v2 / case_study_builder_v2 / crm_v2
-- are v2.0 rollout flags with zero code references — the
-- features they gated are permanently on.
-- ============================================================
DELETE FROM feature_flags WHERE flag IN ('ai_copilot','analytics_v2','case_study_builder_v2','crm_v2');
