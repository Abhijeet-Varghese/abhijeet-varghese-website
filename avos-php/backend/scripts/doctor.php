<?php
/**
 * AV OS DOCTOR — deployment/config validator (CLI).
 *
 *   php backend/scripts/doctor.php
 *
 * Verifies PHP, extensions, database, storage, config, .htaccess,
 * frontend source, template, publish destination, locks, cron state.
 * Exit code 0 = ready, 1 = warnings, 2 = critical failures.
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
require $root . '/includes/bootstrap.php';

$checks = [];
$add = function (string $label, bool $ok, string $detail = '') use (&$checks): void {
    $checks[] = [$label, $ok, $detail];
};
$fmt = fn($ok) => $ok ? "PASS" : "FAIL";

$add('PHP', PHP_VERSION_ID >= 80000, PHP_VERSION);
$add('PDO MySQL', extension_loaded('pdo_mysql'), extension_loaded('pdo_mysql') ? '' : 'extension missing');
$add('GD', extension_loaded('gd'), extension_loaded('gd') ? '' : 'media processing degraded');
$add('cURL', extension_loaded('curl'), extension_loaded('curl') ? '' : 'AI/webhooks degraded');
$dbOk = true;
try { Database::one("SELECT 1"); } catch (Throwable $e) { $dbOk = false; }
$add('Database', $dbOk, $dbOk ? '' : $e->getMessage());
$migViol = [];
try {
    require_once AV_BACKEND . '/core/MigrationRunner.php';
    $migViol = MigrationRunner::validate(AV_ROOT . '/database/migrations');
} catch (Throwable $e) { $migViol = [$e->getMessage()]; }
$add('Migrations', count($migViol) === 0, count($migViol) ? 'portable violation: ' . implode('; ', array_slice($migViol, 0, 3)) : count(glob(AV_ROOT . '/database/migrations/*.sql')) . ' files portable');
$add('Storage', is_writable(AV_STORAGE), AV_STORAGE);
$add('Uploads', is_writable(AV_UPLOADS), AV_UPLOADS);
$add('Backups', is_writable(AV_BACKUPS), AV_BACKUPS);
$add('Locks', is_writable(AV_STORAGE . '/locks') || (is_dir(AV_STORAGE . '/locks') || @mkdir(AV_STORAGE . '/locks', 0775, true)), AV_STORAGE . '/locks');
if (defined('AV_VITE_MODE') && AV_VITE_MODE) {
    $add('Vite build', is_dir(AV_VITE_DIST) && is_file(AV_VITE_DIST . '/index.html'), AV_VITE_DIST);
} else {
    $add('Template', is_dir(AV_TEMPLATE) && is_file(AV_TEMPLATE . '/css/styles.css'), AV_TEMPLATE);
    $fe = AV_FRONTEND_DIR !== '' ? AV_FRONTEND_DIR : (dirname($root) . '/abhijeetvarghese');
    $add('Frontend source', is_dir($fe), $fe);
}
$add('Publish destination', is_dir(AV_SITE_OUT), AV_SITE_OUT);
$add('Web root .htaccess', is_file(AV_PUBLIC . '/.htaccess'), AV_PUBLIC . '/.htaccess');
$add('Installer locked', is_file(AV_PUBLIC . '/install/.installed'), '');
$add('Encryption key', strlen((string)AV_ENC_KEY) >= 32, strlen((string)AV_ENC_KEY) . ' chars');
$add('Environment', in_array(AV_ENV, ['local', 'development', 'staging', 'production'], true), AV_ENV);
$prodGuard = !(AV_ENV === 'production' && ((($GLOBALS['db']['pass'] ?? '') === 'aV0s_d3v_9xKq2mN7') || (($GLOBALS['db']['user'] ?? '') === 'avos')));
$add('Production guard', $prodGuard, $prodGuard ? '' : 'default credentials detected');
$add('HTTPS', AV_ENV !== 'production' || str_starts_with(AV_SITE_URL, 'https://'), AV_SITE_URL);
$add('Auto-publish flag', FeatureFlagModel::isOn('auto_publish'), '');
$add('Cron state', is_file(AV_CACHE . '/auto-publish-state.json'), 'state file present');

echo "AV OS DOCTOR — " . date('c') . "\n";
echo str_repeat('-', 40) . "\n";
$fails = 0;
foreach ($checks as [$label, $ok, $detail]) {
    printf("  %-20s %s  %s\n", $label, $fmt($ok), $detail);
    if (!$ok) $fails++;
}
echo str_repeat('-', 40) . "\n";
if ($fails === 0) {
    echo "SYSTEM READY\n";
    exit(0);
}
echo "{$fails} check(s) failed — see details above\n";
exit($fails >= 3 ? 2 : 1);
