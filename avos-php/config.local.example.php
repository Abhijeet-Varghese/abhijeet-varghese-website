<?php
/**
 * AV OS — local production configuration (EXAMPLE).
 *
 * Copy this file to `config.local.php` in the AV OS root (OUTSIDE public_html),
 * fill in real values, and set permissions to 600. NEVER commit it.
 *
 * The production guard in backend/config/config.php will refuse to run until
 * the database credentials and AV_ENC_KEY are configured.
 */

// ---- environment ----
$env = 'production';                    // 'production' | 'development'
define('AV_ENV', $env);
define('AV_DEBUG', false);

// ---- database (Hostinger MySQL) ----
$db = [
  'host' => 'localhost',                // Hostinger: localhost
  'name' => 'u123456789_avos',          // your Hostinger DB name
  'user' => 'u123456789_avos',          // your Hostinger DB user
  'pass' => 'YOUR-STRONG-DB-PASSWORD',
  'charset' => 'utf8mb4',
];

// ---- secrets (generate with: php -r "echo bin2hex(random_bytes(32));") ----
$encKey = 'REPLACE-WITH-64-HEX-CHARS-FROM-RANDOM-BYTES';
$sessionHours = 12;

// ---- site ----
$siteUrl = 'https://abhijeetvarghese.com';
// Optional: frontend source folder for live sync (backend pulls its css/js/assets).
// Default when unset: the 'abhijeetvarghese' folder next to avos-php, or AV_FRONTEND_DIR.
// \$frontendDir = '/home/uXXXXXX/frontend';

// ---- optional: Cloudflare Turnstile for public forms ----
// $turnstile = [
//   'site_key' => '0x4AAAA...',
//   'secret_key' => '0x4AAAA...',
// ];
