-- ============================================================
-- AV OS — Migration 023: knowledge source key fix
-- Manual knowledge rows must not collide on the external-source
-- unique key (source_type='manual', source_id='').
-- NULL source_id rows are exempt from the unique constraint.
-- ============================================================
ALTER TABLE knowledge_items
  MODIFY source_id VARCHAR(190) NULL DEFAULT NULL;
ALTER TABLE knowledge_items DROP INDEX uq_ki_source;
ALTER TABLE knowledge_items ADD UNIQUE KEY uq_ki_source (source_type, source_id(120));
