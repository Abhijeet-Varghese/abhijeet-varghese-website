<?php
/**
 * AV OS — migration runner (CLI, tracked, idempotent).
 *
 * Usage:
 *   php database/migrate.php              # run pending migrations
 *   php database/migrate.php --fresh      # drop & recreate database first
 *   php database/migrate.php --list       # show state without running
 *
 * Single engine: backend/core/MigrationRunner.php (shared with the
 * installers). Invariants: migrations are immutable (checksummed),
 * portable (no CREATE/DROP/ALTER DATABASE), and `USE` statements are
 * skipped explicitly.
 */
$root = dirname(__DIR__);
$fresh = in_array('--fresh', $argv, true);
$list = in_array('--list', $argv, true);

// No credential literals in source (§88 §2). Defaults are empty; real values
// come from the environment or the PRIVATE config file, resolved with the same
// out-of-web-root priority the application uses.
$db = ['host' => getenv('DB_HOST') ?: '127.0.0.1', 'name' => getenv('DB_NAME') ?: '',
       'user' => getenv('DB_USER') ?: '', 'pass' => getenv('DB_PASS') ?: ''];

$cfgCandidates = array_filter([
    getenv('AV_CONFIG_FILE') ?: '',
    (getenv('AV_PRIVATE_DIR') ?: '') ? rtrim(getenv('AV_PRIVATE_DIR'), '/') . '/config.local.php' : '',
    dirname($root, 2) . '/avos-private/config.local.php',
    dirname($root) . '/avos-private/config.local.php',
    dirname($root) . '/config.local.php',
    $root . '/config.local.php',        // legacy, inside the web root
]);
foreach ($cfgCandidates as $cfg) {
    if (is_file($cfg)) { require $cfg; break; }
}
if (empty($db['name']) || empty($db['user'])) {
    fwrite(STDERR, "Database is not configured. Set DB_* environment variables or provide a private config.local.php.\n");
    exit(1);
}
require $root . '/backend/core/MigrationRunner.php';

$pdo = new PDO("mysql:host={$db['host']};charset=utf8mb4", $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($fresh) { $pdo->exec("DROP DATABASE IF EXISTS `{$db['name']}`"); }

if ($list) {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db['name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$db['name']}`");
    $applied = [];
    try {
        foreach ($pdo->query("SELECT name FROM schema_migrations")->fetchAll(PDO::FETCH_COLUMN) as $n) $applied[$n] = true;
    } catch (Throwable $e) { /* fresh db */ }
    foreach (glob($root . '/database/migrations/*.sql') ?: [] as $f) {
        $n = basename($f);
        echo "  $n: " . (isset($applied[$n]) ? "applied" : "pending") . "\n";
    }
    echo "migration state listed\n";
    exit(0);
}

try {
    $res = MigrationRunner::run($pdo, $db['name'], $root . '/database/migrations');
    foreach ($res['files'] as $n) echo "  $n: applied — recorded\n";
    echo "migrations complete ({$res['total']} applied, {$res['applied']} statements, {$res['skipped']} idempotent/portability skips)\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}
