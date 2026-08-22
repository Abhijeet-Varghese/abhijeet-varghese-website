-- @UP
-- Phase 3E — content engine.
--
-- Migrations 001–010 are checksummed and frozen; the columns the Phase 3E
-- brief requires are therefore added by ALTER here rather than by editing
-- 003_content.sql. Every addition below is justified in PHASE-3E-REPORT.md and
-- recorded as a contract amendment in API-CONTRACT.md — none is invented.
--
-- Two semantics that are deliberately NOT merged:
--   publish_at    = scheduling INTENT ("go live at ..."), already in 003.
--   published_at  = the moment the content actually became public.
-- Collapsing them would make "was this ever live?" unanswerable.
--
-- MariaDB note: `JSON` is an alias for LONGTEXT plus an automatic json_valid()
-- CHECK. information_schema reports longtext. That is expected, not drift.

ALTER TABLE pages
  ADD COLUMN excerpt TEXT NULL AFTER title,
  ADD COLUMN content JSON NULL AFTER template,
  ADD COLUMN published_at DATETIME NULL AFTER unpublish_at,
  ADD COLUMN author_id INT UNSIGNED NULL AFTER updated_by,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  ADD KEY idx_pages_published (published_at),
  ADD CONSTRAINT fk_pages_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_pages_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE projects
  ADD COLUMN description TEXT NULL AFTER summary,
  ADD COLUMN content JSON NULL AFTER template,
  ADD COLUMN metadata JSON NULL AFTER content,
  ADD COLUMN published_at DATETIME NULL AFTER publish_at,
  ADD COLUMN author_id INT UNSIGNED NULL,
  ADD COLUMN created_by INT UNSIGNED NULL,
  ADD COLUMN updated_by INT UNSIGNED NULL,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  ADD KEY idx_proj_published (published_at),
  ADD CONSTRAINT fk_proj_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_proj_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_proj_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE articles
  ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER reading_minutes,
  ADD COLUMN published_at DATETIME NULL AFTER publish_at,
  ADD COLUMN created_by INT UNSIGNED NULL,
  ADD COLUMN updated_by INT UNSIGNED NULL,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  ADD KEY idx_art_featured (featured, published_at),
  ADD CONSTRAINT fk_art_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_art_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Experience is a timeline, not a routable document: no slug, no page_route.
-- Its state enum is widened to the same six values so ONE state machine serves
-- every content type instead of a special case. Default moves published→draft:
-- a create API must never publish by accident.
ALTER TABLE experience
  ADD COLUMN content JSON NULL AFTER summary,
  ADD COLUMN published_at DATETIME NULL AFTER status,
  ADD COLUMN author_id INT UNSIGNED NULL,
  ADD COLUMN created_by INT UNSIGNED NULL,
  ADD COLUMN updated_by INT UNSIGNED NULL,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  ADD CONSTRAINT fk_exp_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_exp_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_exp_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- @DOWN
ALTER TABLE experience
  DROP FOREIGN KEY fk_exp_updater,
  DROP FOREIGN KEY fk_exp_creator,
  DROP FOREIGN KEY fk_exp_author,
  DROP COLUMN updated_by,
  DROP COLUMN created_by,
  DROP COLUMN author_id,
  DROP COLUMN published_at,
  DROP COLUMN content,
  MODIFY COLUMN status ENUM('draft','published','archived') NOT NULL DEFAULT 'published';

ALTER TABLE articles
  DROP FOREIGN KEY fk_art_updater,
  DROP FOREIGN KEY fk_art_creator,
  DROP KEY idx_art_featured,
  DROP COLUMN updated_by,
  DROP COLUMN created_by,
  DROP COLUMN published_at,
  DROP COLUMN featured,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft';

ALTER TABLE projects
  DROP FOREIGN KEY fk_proj_updater,
  DROP FOREIGN KEY fk_proj_creator,
  DROP FOREIGN KEY fk_proj_author,
  DROP KEY idx_proj_published,
  DROP COLUMN updated_by,
  DROP COLUMN created_by,
  DROP COLUMN author_id,
  DROP COLUMN published_at,
  DROP COLUMN metadata,
  DROP COLUMN content,
  DROP COLUMN description,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft';

ALTER TABLE pages
  DROP FOREIGN KEY fk_pages_updater,
  DROP FOREIGN KEY fk_pages_author,
  DROP KEY idx_pages_published,
  DROP COLUMN author_id,
  DROP COLUMN published_at,
  DROP COLUMN content,
  DROP COLUMN excerpt,
  MODIFY COLUMN status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft';
