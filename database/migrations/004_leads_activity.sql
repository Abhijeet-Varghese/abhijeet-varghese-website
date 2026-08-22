-- ============================================================
-- AV OS — Migration 004: leads.last-activity timestamp
-- (drives the lead.inactive automation trigger; set on lead
-- updates by LeadModel). Idempotent.
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;
