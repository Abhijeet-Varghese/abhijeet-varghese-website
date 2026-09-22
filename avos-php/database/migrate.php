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

$db = ['host' => getenv('DB_HOST') ?: '127.0.0.1', 'name' => getenv('DB_NAME') ?: 'avos',
       'user' => getenv('DB_USER') ?: 'avos', 'pass' => getenv('DB_PASS') ?: 'aV0s_d3v_9xKq2mN7'];
if (is_file($root . '/config.local.php')) require $root . '/config.local.php';
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
