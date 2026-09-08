<?php
/**
 * AV OS — migration invariant validator (CI / pre-deploy).
 *
 * Fails if any migration contains:
 *   CREATE DATABASE · DROP DATABASE · ALTER DATABASE
 * (`USE <db>` is tolerated but skipped by the runner; new migrations
 * should not contain it either — portability invariant, docs/database.md)
 *
 * Usage:
 *   php database/validate-migrations.php
 * Exit code 0 = clean, 1 = violations.
 */
$root = dirname(__DIR__);
require $root . '/backend/core/MigrationRunner.php';

$violations = MigrationRunner::validate($root . '/database/migrations');
$uses = [];
foreach (glob($root . '/database/migrations/*.sql') ?: [] as $f) {
    foreach (MigrationRunner::sqlSplit((string)file_get_contents($f)) as $stmt) {
        $body = trim(preg_replace('/^--[^\n]*(\n|$)/m', '', trim($stmt)));
        if (preg_match('/^USE\s+`?[\w$]+`?;?$/i', $body)) $uses[] = basename($f) . ': ' . substr($body, 0, 60);
    }
}

if ($violations) {
    fwrite(STDERR, "MIGRATION INVARIANT VIOLATIONS (" . count($violations) . "):\n");
    foreach ($violations as $v) fwrite(STDERR, "  ✘ $v\n");
    exit(1);
}
echo "migrations portable: 0 violations\n";
if ($uses) {
    echo "note — legacy USE statements (skipped by the runner; kept for historical integrity):\n";
    foreach (array_unique($uses) as $u) echo "  · $u\n";
}
exit(0);
