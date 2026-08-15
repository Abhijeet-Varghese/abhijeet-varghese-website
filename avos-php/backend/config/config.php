<?php
/**
 * AV OS — configuration.
 * All secrets come from environment variables or config.local.php
 * (which lives OUTSIDE the web root and is never committed).
 *
 * Production refuses to boot with insecure defaults.
 */

// ---- paths ----
define('AV_ROOT', dirname(__DIR__, 2));                    // .../avos-php
define('AV_PUBLIC', AV_ROOT . '/public_html');
define('AV_BACKEND', AV_ROOT . '/backend');
define('AV_INSTALL', AV_ROOT . '/install');
define('AV_STORAGE', AV_ROOT . '/storage');
define('AV_UPLOADS', AV_STORAGE . '/uploads');
define('AV_CACHE', AV_STORAGE . '/cache');
define('AV_VERSIONS', AV_STORAGE . '/versions');
define('AV_LOGS', AV_STORAGE . '/logs');
define('AV_BACKUPS', AV_STORAGE . '/backups');
define('AV_TEMPLATE', AV_ROOT . '/site-template');          // canonical frontend template
define('AV_SITE_OUT', AV_ROOT . '/public_html/site');       // generated public site

// ---- app ----
define('AV_NAME', 'AV OS');
define('AV_SUBTITLE', 'Creative Intelligence Platform');
define('AV_VERSION', '2.4.20');

// ---- environment (default: production) ----
$env = getenv('APP_ENV') ?: 'production';

// ---- defaults (overridden by config.local.php / env) ----
$db = [
  'host' => getenv('DB_HOST') ?: '127.0.0.1',
  'name' => getenv('DB_NAME') ?: '',
  'user' => getenv('DB_USER') ?: '',
  'pass' => getenv('DB_PASS') ?: '',
  'charset' => 'utf8mb4',
];
$sessionHours = (int)(getenv('SESSION_HOURS') ?: 12);
$encKey = getenv('AV_ENC_KEY') ?: '';
$siteUrl = rtrim(getenv('SITE_URL') ?: 'https://abhijeetvarghese.com', '/');
$turnstile = ['site_key' => getenv('TURNSTILE_SITE_KEY') ?: '', 'secret_key' => getenv('TURNSTILE_SECRET_KEY') ?: ''];

// Load optional local config FIRST (outside web root, never committed) —
// it may override $env, $db, $encKey, $siteUrl, $turnstile, $sessionHours.
// AV_SKIP_LOCAL_CONFIG=1 bypasses it — used only to simulate a pristine
// production boot (CI/tests). Never set in real deployments.
if (getenv('AV_SKIP_LOCAL_CONFIG') !== '1' && is_file(AV_ROOT . '/config.local.php')) {
    require AV_ROOT . '/config.local.php';
}

if (!defined('AV_ENV')) define('AV_ENV', $env);
// local/development/staging = verbose debugging · production = sanitized errors
if (!defined('AV_DEBUG')) define('AV_DEBUG', in_array($env, ['local', 'development', 'staging'], true));

// ---- production guard: refuse insecure defaults ----
if (AV_ENV === 'production') {
    $insecure = [];
    if (empty($db['name']) || empty($db['user'])) $insecure[] = 'database credentials not configured';
    if ($db['pass'] === 'aV0s_d3v_9xKq2mN7' || $db['user'] === 'avos') $insecure[] = 'default database credentials detected';
    if (strlen($encKey) < 32) $insecure[] = 'AV_ENC_KEY must be set (32+ chars)';
    if ($insecure) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo "AV OS is not configured for production.\n" . implode("\n", array_map(fn($i) => " - $i", $insecure));
        exit;
    }
}

define('AV_DB', $db);
define('AV_SESSION_HOURS', $sessionHours);
define('AV_ENC_KEY', $encKey);
define('AV_SITE_URL', $siteUrl);
define('AV_TURNSTILE', $turnstile);
define('AV_FRONTEND_DIR', isset($frontendDir) ? $frontendDir : (getenv('AV_FRONTEND_DIR') ?: ''));

// ---- upload limits ----
define('AV_MAX_UPLOAD_BYTES', (int)(getenv('AV_MAX_UPLOAD_MB') ?: 20) * 1024 * 1024);
define('AV_MAX_IMAGE_DIM', (int)(getenv('AV_MAX_IMAGE_DIM') ?: 12000));

// ---- rate limits (requests per window) ----
// ---- proxy trust model (default OFF: forwarded IP headers are ignored) ----
// Enable only when the site is behind a known proxy (e.g. Cloudflare), and list
// the proxy's CIDR ranges — e.g. AV_TRUSTED_PROXY_RANGES='173.245.48.0/20,103.21.244.0/22'
define('AV_TRUST_PROXY', (bool)(getenv('AV_TRUST_PROXY') ?: false));
define('AV_TRUSTED_PROXY_RANGES', (string)(getenv('AV_TRUSTED_PROXY_RANGES') ?: ''));

define('AV_RATE', [
  'login' => [5, 900],        // 5 per 15 min (per email+ip)
  'lead' => [10, 900],        // 10 per 15 min per ip
  'submit' => [20, 900],
  'media' => [30, 3600],
  'ai' => [60, 3600],
]);

// ---- PHP runtime ----
date_default_timezone_set('Asia/Kolkata');
mb_internal_encoding('UTF-8');
error_reporting(AV_DEBUG ? E_ALL : E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', AV_DEBUG ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', AV_LOGS . '/php-error.log');

foreach ([AV_STORAGE, AV_UPLOADS, AV_CACHE, AV_VERSIONS, AV_LOGS, AV_BACKUPS, AV_SITE_OUT] as $dir) {
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
}

// ---- error handler: log server-side, never leak details to clients ----
set_exception_handler(function (Throwable $e) {
    error_log('[AVOS] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (AV_DEBUG) {
        Response::error('Server error: ' . $e->getMessage(), 500);
    } else {
        Response::error('Internal server error', 500);
    }
});
