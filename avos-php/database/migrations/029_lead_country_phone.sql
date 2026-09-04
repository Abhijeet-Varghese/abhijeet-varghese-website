-- ------------------------------------------------------------
-- 029 — Contact form: international mobile number with country code.
-- The /api/public/lead endpoint now stores the selected country calling
-- code and the national (significant) number alongside the full E.164
-- number in leads.phone. These snap the fields into the existing leads
-- table without disturbing existing rows (existing leads keep phone and
-- get empty country_code / phone_number).
--
-- Idempotent: ADD COLUMN ... IF NOT EXISTS — safe to re-run.
-- ------------------------------------------------------------

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(8) NOT NULL DEFAULT '' AFTER email,
  ADD COLUMN IF NOT EXISTS phone_number  VARCHAR(20) NOT NULL DEFAULT '' AFTER country_code;
