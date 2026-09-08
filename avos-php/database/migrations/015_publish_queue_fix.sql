-- ============================================================
-- AV OS — Migration 015: drop publish_queue (type,status) unique
-- key (it prevented job history — coalescing is done by the
-- enqueue SELECT, not by a DB constraint). Idempotent:
-- DROP INDEX IF EXISTS (MariaDB 10.6+; Hostinger runs 10.11+).
-- ============================================================
ALTER TABLE publish_queue DROP INDEX IF EXISTS uq_pq_type_status;
