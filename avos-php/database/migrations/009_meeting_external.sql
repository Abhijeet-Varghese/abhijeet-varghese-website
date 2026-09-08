-- ============================================================
-- AV OS — Migration 009: meetings.external_event_id
-- (Calendly invitee UUID — idempotent meeting upserts + cancel mapping)
-- ============================================================
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS external_event_id VARCHAR(190) NULL DEFAULT NULL AFTER outcome;
CREATE INDEX IF NOT EXISTS idx_meet_ext ON meetings (external_event_id);
