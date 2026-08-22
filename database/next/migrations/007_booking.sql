-- @UP
CREATE TABLE IF NOT EXISTS booking_services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(190) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  buffer_before_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  buffer_after_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  min_notice_hours SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  max_advance_days SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_bs_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly recurring availability, stored in the owner's IANA timezone.
CREATE TABLE IF NOT EXISTS booking_availability (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NULL,
  weekday TINYINT UNSIGNED NOT NULL,          -- 0=Sunday … 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_ba_day (weekday, enabled),
  CONSTRAINT fk_ba_service FOREIGN KEY (service_id) REFERENCES booking_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_blackouts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  starts_at DATETIME NOT NULL,                -- UTC
  ends_at DATETIME NOT NULL,
  reason VARCHAR(190) NOT NULL DEFAULT '',
  KEY idx_bb_range (starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UNIQUE(resource_id, starts_at) is the final defence against double booking:
-- even if FOR UPDATE and the hold state machine are both defeated by a race,
-- the constraint rejects the second insert.
CREATE TABLE IF NOT EXISTS booking_slots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_id INT UNSIGNED NOT NULL DEFAULT 1,
  service_id INT UNSIGNED NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  state ENUM('free','held','booked','blocked') NOT NULL DEFAULT 'free',
  hold_token CHAR(64) NULL,
  hold_expires_at DATETIME NULL,
  UNIQUE KEY uq_slot (resource_id, starts_at),
  KEY idx_slot_state (state, starts_at),
  KEY idx_slot_hold (hold_expires_at),
  CONSTRAINT fk_slot_service FOREIGN KEY (service_id) REFERENCES booking_services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slot_id BIGINT UNSIGNED NOT NULL,
  lead_id INT UNSIGNED NULL,
  service_id INT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  status ENUM('confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed',
  cancel_token CHAR(64) NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_slot (slot_id),
  KEY idx_booking_status (status, created_at),
  CONSTRAINT fk_bk_slot FOREIGN KEY (slot_id) REFERENCES booking_slots(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bk_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_bk_service FOREIGN KEY (service_id) REFERENCES booking_services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_intake_fields (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id INT UNSIGNED NULL,
  field_key VARCHAR(80) NOT NULL,
  label VARCHAR(190) NOT NULL,
  field_type ENUM('text','textarea','select','checkbox','url','budget') NOT NULL DEFAULT 'text',
  required TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  options JSON NULL,
  UNIQUE KEY uq_bif (service_id, field_key),
  CONSTRAINT fk_bif_service FOREIGN KEY (service_id) REFERENCES booking_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_intake_values (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  value TEXT NULL,
  UNIQUE KEY uq_biv (booking_id, field_key),
  CONSTRAINT fk_biv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @DOWN
DROP TABLE IF EXISTS booking_intake_values;
DROP TABLE IF EXISTS booking_intake_fields;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS booking_slots;
DROP TABLE IF EXISTS booking_blackouts;
DROP TABLE IF EXISTS booking_availability;
DROP TABLE IF EXISTS booking_services;
