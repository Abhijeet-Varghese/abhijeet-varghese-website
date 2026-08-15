-- ============================================================
-- AV OS — Migration 012: users.status supports 'disabled'
-- (user management: disable/delete use status='disabled')
-- ============================================================
ALTER TABLE users MODIFY COLUMN status ENUM('active','invited','suspended','disabled') NOT NULL DEFAULT 'active';
