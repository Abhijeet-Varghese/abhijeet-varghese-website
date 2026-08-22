-- @UP
-- Phase 3F — media & asset engine.
--
-- Migrations 001–011 are checksummed and frozen, so the columns Phase 3F needs
-- are added by ALTER. Every addition is justified in PHASE-3F-REPORT.md and
-- recorded as a contract amendment. No table is created and none is dropped.
--
-- MariaDB note: `JSON` is an alias for LONGTEXT plus an automatic json_valid()
-- CHECK; information_schema reports longtext. Expected, not drift.

ALTER TABLE media
  -- §3F.2 asset classes. The approved ENUM already covered image/video/audio/
  -- document/model/texture/shader/font/other; SCRIPT was the only class with
  -- no home. MODEL_3D maps onto the existing `model` value rather than adding
  -- a synonym.
  MODIFY COLUMN kind ENUM('image','video','audio','document','model','texture',
                          'shader','script','font','other') NOT NULL DEFAULT 'image',

  -- §3F.24. Originals always live outside the web root; `visibility` decides
  -- whether a PUBLISHED COPY is placed in the public tree at all. A private
  -- asset therefore has no guessable URL to leak — it is not merely hidden.
  ADD COLUMN visibility ENUM('public','private') NOT NULL DEFAULT 'public' AFTER kind,

  -- Normalised, validated extension. Kept separate from original_name so the
  -- storage layer never has to parse a user-supplied string again.
  ADD COLUMN extension VARCHAR(16) NOT NULL DEFAULT '' AFTER mime,

  -- Path of the published public copy, '' when the asset is private.
  ADD COLUMN public_path VARCHAR(500) NOT NULL DEFAULT '' AFTER storage_path,

  -- §3F.13 saved crop configuration. The ORIGINAL is never rewritten; a crop
  -- is a recipe that derivatives are regenerated from.
  ADD COLUMN crop JSON NULL AFTER focal_y,

  -- §3F.14/§3F.16/§3F.17 technical metadata that varies by asset class:
  -- codec/fps for video, shader stage+version, model dimensions, EXIF summary
  -- with GPS already removed. Free-form because it genuinely differs per class
  -- and is never queried by value.
  ADD COLUMN meta JSON NULL AFTER credit,

  -- §3F.23 replacement chain. `replaced_by` points forward to the successor;
  -- the old row survives so historical content stays deterministic.
  ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1 AFTER processing_note,
  ADD COLUMN replaced_by INT UNSIGNED NULL AFTER version,

  ADD COLUMN uploaded_by INT UNSIGNED NULL AFTER replaced_by,

  ADD KEY idx_media_visibility (visibility, kind),
  ADD KEY idx_media_replaced (replaced_by),
  ADD CONSTRAINT fk_media_replaced FOREIGN KEY (replaced_by) REFERENCES media(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_media_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE media_variants
  -- §3F.10 five-step responsive ladder. The approved vocabulary
  -- (thumb/card/hero/full) had four image purposes; `xlarge` completes the
  -- thumbnail→small→medium→large→xlarge ladder the brief asks for without
  -- introducing a second naming convention.
  MODIFY COLUMN purpose ENUM('thumb','card','hero','full','xlarge','poster','preview') NOT NULL,
  -- Integrity + cache busting for the derivative itself.
  ADD COLUMN hash CHAR(64) NOT NULL DEFAULT '' AFTER bytes,
  ADD COLUMN storage_path VARCHAR(500) NOT NULL DEFAULT '' AFTER public_path,
  ADD KEY idx_variant_format (format);

-- @DOWN
ALTER TABLE media_variants
  DROP KEY idx_variant_format,
  DROP COLUMN storage_path,
  DROP COLUMN hash,
  MODIFY COLUMN purpose ENUM('thumb','card','hero','full','poster','preview') NOT NULL;

ALTER TABLE media
  DROP FOREIGN KEY fk_media_uploader,
  DROP FOREIGN KEY fk_media_replaced,
  DROP KEY idx_media_replaced,
  DROP KEY idx_media_visibility,
  DROP COLUMN uploaded_by,
  DROP COLUMN replaced_by,
  DROP COLUMN version,
  DROP COLUMN meta,
  DROP COLUMN crop,
  DROP COLUMN public_path,
  DROP COLUMN extension,
  DROP COLUMN visibility,
  MODIFY COLUMN kind ENUM('image','video','audio','document','model','texture',
                          'shader','font','other') NOT NULL DEFAULT 'image';
