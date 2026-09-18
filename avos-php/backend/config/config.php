<?php
/**
 * AV OS — configuration.
 * All secrets come from environment variables or a server-local config file.
 * Server-local configuration is never committed to Git.
 */

define('AV_ROOT', dirname(__DIR__, 2));
define('AV_PUBLIC', AV_ROOT . '/public_html');
define('AV_BACKEND', AV_ROOT . '/backend');
define('AV_STORAGE', AV_ROOT . '/storage');
define('AV_UPLOADS', AV_STORAGE . '/uploads');
define('AV_CACHE', AV_STORAGE . '/cache');
define('AV_LOGS', AV_STORAGE . '/logs');
define('AV_BACKUPS', AV_STORAGE . '/backups');
define('AV_SITE_DIR_DEFAULT', dirname(AV_ROOT) . '/abhijeetvarghese');

define('AV_NAME', 'AV OS');
define('AV_SUBTITLE', 'Creative Intelligence Platform');
define('AV_VERSION', '2.4.20');

$env = getenv('APP_ENV') ?: 'production';
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

// Hostinger Git deployments overwrite the staging target. Keep staging secrets outside it.
$pathNormalized = str_replace('\\', '/', AV_ROOT);
$stagingConfig = dirname(AV_ROOT, 2) . '/next-config.local.php';
$localConfig = AV_ROOT . '/config.local.php';
$configPath = (strpos($pathNormalized, '/next/avos-php') !== false && is_file($stagingConfig))
    ? $stagingConfig
    : $localConfig;
if (getenv('AV_SKIP_LOCAL_CONFIG') !== '1' && is_file($configPath)) require $configPath;

if (!defined('AV_ENV')) define('AV_ENV', $env);
if (!defined('AV_DEBUG')) define('AV_DEBUG', in_array($env, ['local', 'development', 'staging'], true));

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
define('AV_SITE_DIR', rtrim((string)(isset($siteDir) && $siteDir !== '' ? $siteDir : (getenv('AV_SITE_DIR') ?: AV_SITE_DIR_DEFAULT)), '/'));

define('AV_MAX_UPLOAD_BYTES', (int)(getenv('AV_MAX_UPLOAD_MB') ?: 20) * 1024 * 1024);
define('AV_MAX_IMAGE_DIM', (int)(getenv('AV_MAX_IMAGE_DIM') ?: 12000));
define('AV_TRUST_PROXY', (bool)(getenv('AV_TRUST_PROXY') ?: false));
define('AV_TRUSTED_PROXY_RANGES', (string)(getenv('AV_TRUSTED_PROXY_RANGES') ?: ''));

define('AV_RATE', [
  'login' => [5, 900],
  'lead' => [10, 900],
  'submit' => [20, 900],
  'media' => [30, 3600],
  'ai' => [60, 3600],
]);

date_default_timezone_set('Asia/Kolkata');
mb_internal_encoding('UTF-8');
error_reporting(AV_DEBUG ? E_ALL : E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', AV_DEBUG ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', AV_LOGS . '/php-error.log');

foreach ([AV_STORAGE, AV_UPLOADS, AV_CACHE, AV_LOGS, AV_BACKUPS] as $dir) {
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
}

set_exception_handler(function (Throwable $e) {
    error_log('[AVOS] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (AV_DEBUG) Response::error('Server error: ' . $e->getMessage(), 500);
    else Response::error('Internal server error', 500);
});
