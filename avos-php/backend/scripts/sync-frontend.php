<?php
/**
 * AV OS — sync the static frontend (AV_SITE_DIR) into the CMS content store.
 *
 *   php backend/scripts/sync-frontend.php            # only when the site changed
 *   php backend/scripts/sync-frontend.php --force    # re-derive everything
 *   php backend/scripts/sync-frontend.php --status   # show fingerprint / last sync
 *   php backend/scripts/sync-frontend.php --json     # machine-readable result
 *
 * One-way: frontend files are the source of truth; nothing is written back.
 */
error_reporting(E_ALL);
require dirname(__DIR__, 2) . '/includes/bootstrap.php';

$args = array_slice($argv, 1);
$force = in_array('--force', $args, true);
$json = in_array('--json', $args, true);

if (in_array('--status', $args, true)) {
    $st = SiteSync::state();
    $fp = SiteSync::fingerprint();
    $st['current_hash'] = $fp['hash'];
    $st['current_files'] = $fp['files'];
    $st['in_sync'] = ($st['hash'] ?? '') === $fp['hash'];
    echo json_encode($st, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
    exit(0);
}

$res = SiteSync::run(null, $force, 'cli');
if ($json) { echo json_encode($res, JSON_UNESCAPED_SLASHES), "\n"; exit($res['ok'] ? 0 : 1); }

printf("[sync-frontend] %s — site=%s files=%d %s\n", date('c'), AV_SITE_DIR, $res['files'], $res['ok'] ? 'OK' : 'FAILED');
if (!$res['ok']) { foreach ($res['warnings'] as $w) echo "  ! $w\n"; exit(1); }
if (!$res['changed'] && !$res['keys']) { echo "  no changes (fingerprint unchanged) — use --force to re-derive\n"; exit(0); }
foreach ($res['keys'] as $k => $info) printf("  %-10s %-9s %d item(s)\n", $k, $info['changed'] ? 'UPDATED' : 'same', $info['count']);
printf("  done in %d ms\n", $res['duration_ms']);
