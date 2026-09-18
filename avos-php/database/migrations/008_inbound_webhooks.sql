-- ============================================================
-- AV OS — Migration 008: inbound webhook event ledger
-- (Calendly invitee.created / invitee.canceled ingestion with
--  signature verification, idempotency and audit).
-- ============================================================
CREATE TABLE IF NOT EXISTS inbound_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(40) NOT NULL DEFAULT 'calendly',
  event_id VARCHAR(190) NOT NULL,
  event_type VARCHAR(80) DEFAULT '',
  payload MEDIUMTEXT,
  status ENUM('received','processed','duplicate','failed','invalid') DEFAULT 'received',
  error VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  UNIQUE KEY uq_inbound_event (source, event_id),
  INDEX idx_inb_created (created_at)
) ENGINE=InnoDB;

-- calendly integration row (signing key stored encrypted in config_enc)
INSERT IGNORE INTO integrations (code, label, status) VALUES ('calendly', 'Calendly', 'available');
