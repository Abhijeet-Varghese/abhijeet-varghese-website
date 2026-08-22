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
// Staging note: the web root may be public_html/ (production) or a subdirectory
// like public_html/next/ (staging). AV_PUBLIC_DIR / AV_SITE_OUT_DIR let the
// backend target a non-default web root without touching production defaults.
define('AV_PUBLIC', getenv('AV_PUBLIC_DIR') ?: AV_ROOT . '/public_html');

/**
 * PRIVATE ROOT (§88) — secret + writable state that must never be reachable
 * over HTTP.
 *
 * IMPORTANT: "one level above AV_ROOT" is NOT automatically private. On this
 * account the staging web root is /home/uXXXXXXXX/public_html/next, so
 * dirname(AV_ROOT) is /home/uXXXXXXXX/public_html — still served over HTTP.
 * Every candidate is therefore validated with av_path_is_web_exposed().
 *
 * Resolution order:
 *   1. AV_PRIVATE_DIR env (hPanel → PHP → environment variables)  ← preferred
 *   2. nearest ancestor .../avos-private that is NOT web-exposed
 *   3. AV_ROOT/storage  ← LEGACY, inside the web root. Retained so an
 *      un-migrated deployment keeps working; reported as insecure by
 *      av_config_security() and rejected when AV_REQUIRE_PRIVATE_CONFIG=1.
 */

/**
 * True when $path sits inside a directory that a web server publishes.
 * Conservative: any `public_html` / `htdocs` / `www` / `public` path segment,
 * or anything at or below the application root, counts as exposed.
 */
function av_path_is_web_exposed(string $path, string $appRoot): bool
{
    $p = rtrim(str_replace('\\', '/', $path), '/');
    $r = rtrim(str_replace('\\', '/', $appRoot), '/');
    if ($p === $r || strpos($p . '/', $r . '/') === 0) return true;      // at/below web root
    foreach (['public_html', 'htdocs', 'www', 'public'] as $seg) {
        if (preg_match('#(^|/)' . preg_quote($seg, '#') . '(/|$)#', $p)) return true;
    }
    return false;
}

$__priv = '';
$__privSource = 'none';

// (1) explicit environment configuration
$__envPriv = getenv('AV_PRIVATE_DIR') ?: '';
if ($__envPriv !== '' && is_dir($__envPriv)) {
    $__priv = $__envPriv;
    $__privSource = 'AV_PRIVATE_DIR';
}

// (2) nearest non-exposed ancestor containing avos-private/
if ($__priv === '') {
    $__dir = AV_ROOT;
    for ($__i = 0; $__i < 6; $__i++) {
        $__parent = dirname($__dir);
        if ($__parent === $__dir) break;
        $__dir = $__parent;
        $__cand = $__dir . '/avos-private';
        if (is_dir($__cand) && !av_path_is_web_exposed($__cand, AV_ROOT)) {
            $__priv = $__cand;
            $__privSource = 'ancestor';
            break;
        }
    }
}

// (3) legacy in-web-root storage
if ($__priv === '') {
    $__priv = AV_ROOT . '/storage';
    $__privSource = 'legacy-in-webroot';
}

define('AV_PRIVATE', rtrim($__priv, '/'));
define('AV_PRIVATE_SOURCE', $__privSource);
define('AV_PRIVATE_IS_OUTSIDE_WEBROOT', !av_path_is_web_exposed(AV_PRIVATE, AV_ROOT));
unset($__priv, $__privSource, $__envPriv, $__dir, $__parent, $__cand, $__i);

define('AV_BACKEND', AV_ROOT . '/backend');
define('AV_INSTALL', AV_ROOT . '/install');
define('AV_STORAGE', AV_PRIVATE_IS_OUTSIDE_WEBROOT ? AV_PRIVATE : AV_ROOT . '/storage');
define('AV_UPLOADS', AV_STORAGE . '/uploads');
define('AV_CACHE', AV_STORAGE . '/cache');
define('AV_VERSIONS', AV_STORAGE . '/versions');
define('AV_LOGS', AV_STORAGE . '/logs');
define('AV_BACKUPS', AV_STORAGE . '/backups');
define('AV_TEMPLATE', AV_ROOT . '/site-template');          // canonical frontend template (legacy)
define('AV_SITE_OUT', getenv('AV_SITE_OUT_DIR') ?: AV_ROOT . '/public_html/site');   // generated public site
// React + Vite production build — the authoritative frontend source in Vite
// mode. Defaults to <repo>/frontend/dist (the Vite `npm run build` output).
define('AV_VITE_DIST', getenv('AV_VITE_DIST') ?: dirname(AV_ROOT) . '/frontend/dist');

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
/**
 * PRIVATE CONFIG RESOLUTION (§88 — configuration outside the web root)
 *
 * Priority:
 *   1. AV_CONFIG_FILE          explicit absolute path (hPanel env var)
 *   2. AV_PRIVATE/config.local.php   the resolved, validated private root
 *   3. nearest non-web-exposed ancestor .../avos-private/config.local.php
 *   4. AV_ROOT/config.local.php      LEGACY, inside the web root — deprecated
 *
 * (4) exists only so an un-migrated deployment keeps serving. It is reported
 * as insecure and is refused outright when AV_REQUIRE_PRIVATE_CONFIG=1.
 * No credential ever lives in source control or in the deployment package.
 */
$__cfgFile = '';
$__cfgSource = 'none';

$__envCfg = getenv('AV_CONFIG_FILE') ?: '';
if ($__envCfg !== '') {
    if (is_file($__envCfg) && is_readable($__envCfg)) {
        $__cfgFile = $__envCfg;
        $__cfgSource = 'AV_CONFIG_FILE';
    } else {
        // Explicit misconfiguration must be loud, never silently downgraded.
        $__cfgSource = 'AV_CONFIG_FILE_INVALID';
    }
}

if ($__cfgFile === '' && $__cfgSource !== 'AV_CONFIG_FILE_INVALID') {
    $__try = [];
    if (defined('AV_PRIVATE')) $__try[] = [AV_PRIVATE . '/config.local.php', 'AV_PRIVATE'];
    $__d = AV_ROOT;
    for ($__i = 0; $__i < 6; $__i++) {
        $__p = dirname($__d);
        if ($__p === $__d) break;
        $__d = $__p;
        $__try[] = [$__d . '/avos-private/config.local.php', 'ancestor:avos-private'];
        $__try[] = [$__d . '/config.local.php', 'ancestor'];
    }
    $__try[] = [AV_ROOT . '/config.local.php', 'legacy-in-webroot'];

    foreach ($__try as [$__cand, $__src]) {
        if (!is_file($__cand)) continue;
        if ($__src !== 'legacy-in-webroot' && av_path_is_web_exposed($__cand, AV_ROOT)) continue;
        $__cfgFile = $__cand;
        $__cfgSource = $__src;
        break;
    }
}

define('AV_CONFIG_PATH', $__cfgFile);
define('AV_CONFIG_SOURCE', $__cfgSource);
define('AV_CONFIG_OUTSIDE_WEBROOT', $__cfgFile !== '' && !av_path_is_web_exposed($__cfgFile, AV_ROOT));

if ($__cfgSource === 'AV_CONFIG_FILE_INVALID') {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    // Deliberately does NOT echo the path — it can reveal the account layout.
    exit("AV OS configuration error: AV_CONFIG_FILE is set but not readable.\n");
}

if (getenv('AV_SKIP_LOCAL_CONFIG') !== '1' && $__cfgFile !== '') {
    require $__cfgFile;
}
unset($__cfgFile, $__cfgSource, $__envCfg, $__try, $__cand, $__src, $__d, $__p, $__i);

if (!defined('AV_ENV')) define('AV_ENV', $env);
// local/development/staging = verbose debugging · production = sanitized errors
if (!defined('AV_DEBUG')) define('AV_DEBUG', in_array($env, ['local', 'development', 'staging'], true));

/**
 * Configuration security self-report. Returns booleans and categories ONLY —
 * never a secret value, never a length that could aid guessing.
 */
function av_config_security(): array
{
    return [
        'config_source'          => AV_CONFIG_SOURCE,
        'config_outside_webroot' => AV_CONFIG_OUTSIDE_WEBROOT,
        'private_source'         => AV_PRIVATE_SOURCE,
        'private_outside_webroot'=> AV_PRIVATE_IS_OUTSIDE_WEBROOT,
        'db_configured'          => !empty(AV_DB['name']) && !empty(AV_DB['user']),
        'db_password_set'        => AV_DB['pass'] !== '',
        'enc_key_set'            => AV_ENC_KEY !== '',
        'enc_key_strong'         => strlen(AV_ENC_KEY) >= 32,
        'strict_mode'            => (bool)(getenv('AV_REQUIRE_PRIVATE_CONFIG') === '1'),
    ];
}

// ---- production guard: refuse insecure defaults ----
if (AV_ENV === 'production') {
    $insecure = [];
    // Opt-in strictness: once the private config has been provisioned, set
    // AV_REQUIRE_PRIVATE_CONFIG=1 so an in-web-root config can never be used.
    if (getenv('AV_REQUIRE_PRIVATE_CONFIG') === '1') {
        if (!AV_CONFIG_OUTSIDE_WEBROOT)  $insecure[] = 'configuration file is inside the web root';
        if (!AV_PRIVATE_IS_OUTSIDE_WEBROOT) $insecure[] = 'private storage is inside the web root';
    }
    if (AV_CONFIG_PATH === '') $insecure[] = 'no configuration file found';
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

// ---- frontend mode ----
// 'vite' → the React/Vite build (AV_VITE_DIST) is the official frontend source;
//          the legacy template sync (AV_FRONTEND_DIR → site-template) is bypassed.
// 'legacy' → the pre-migration publish pipeline (PublishEngine HTML renderers +
//            template asset sync) remains in effect.
// auto-detect: 'vite' when AV_VITE_DIST contains a valid build; else 'legacy'.
$frontendMode = getenv('AV_FRONTEND_MODE') ?: (is_file(AV_VITE_DIST . '/index.html') && is_dir(AV_VITE_DIST . '/assets') ? 'vite' : 'legacy');
define('AV_FRONTEND_MODE', $frontendMode);
define('AV_VITE_MODE', $frontendMode === 'vite');

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
