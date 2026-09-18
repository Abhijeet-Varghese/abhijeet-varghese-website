-- ============================================================
-- AV OS — one-time local database provisioning (run as root once):
--   mysql -uroot < database/provision.sql
-- (start.sh does this automatically when it can)
-- ============================================================
CREATE DATABASE IF NOT EXISTS avos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'avos'@'localhost' IDENTIFIED BY 'aV0s_d3v_9xKq2mN7';
CREATE USER IF NOT EXISTS 'avos'@'127.0.0.1' IDENTIFIED BY 'aV0s_d3v_9xKq2mN7';
GRANT ALL PRIVILEGES ON avos.* TO 'avos'@'localhost';
GRANT ALL PRIVILEGES ON avos.* TO 'avos'@'127.0.0.1';
FLUSH PRIVILEGES;
