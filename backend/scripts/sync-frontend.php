<?php
/**
 * AV OS — frontend ↔ backend sync (content-aware, idempotent, locked).
 *
 * Pulls the frontend's design assets (css/js/assets/fonts) into the
 * canonical template source (site-template/) so backend publishes always use
 * the latest frontend design. Content (pages/copy/SEO) is owned by the CMS
 * and is NEVER touched by this script.
 *
 * Ownership rules:
 *   FRONTEND SOURCE OWNS: css · js · images · videos · fonts · icons ·
 *                         static assets · favicon
 *   CMS/PUBLISHER OWNS:   page/project/article content · navigation · SEO ·
 *                         settings · generated HTML · robots.txt · sitemap.xml
 *
 * Safety:
 *   - SHA-256 per-file hashes (not mtime) — only real content changes sync
 *   - dry-run mode reports added/modified/deleted/unchanged without writing
 *   - flock() sync lock — concurrent runs exit safely
 *   - files removed from the frontend are removed from the template
 *   - a manifest (storage/cache/frontend-manifest.json) makes runs idempotent
 *
 * Usage:
 *   php backend/scripts/sync-frontend.php            # sync
 *   php backend/scripts/sync-frontend.php --check    # dry-run report
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
require $root . '/includes/bootstrap.php';

$dry = in_array('--check', $argv, true) || in_array('--dry-run', $argv, true);

/* ---------- Vite mode: assets ship inside the Vite build; template sync is a no-op ---------- */
if (defined('AV_VITE_MODE') && AV_VITE_MODE) {
    echo "vite mode — template sync skipped (assets served from the Vite build at " . AV_VITE_DIST . ")\n";
    exit(0);
}

$src = defined('AV_FRONTEND_DIR') && AV_FRONTEND_DIR !== '' ? AV_FRONTEND_DIR : (dirname($root) . '/abhijeetvarghese');
$dst = AV_TEMPLATE;
$manifestFile = AV_CACHE . '/frontend-manifest.json';

if (!is_dir($src)) {
    echo "frontend dir not found: $src\n";
    echo "Set \$frontendDir in config.local.php (or AV_FRONTEND_DIR) to the frontend folder path.\n";
    exit(1);
}

$lock = Lock::acquire('sync');
if (!$lock) {
    echo "another sync is already running — exiting safely\n";
    exit(2);
}

/* ---------- collect files (relative path → sha256) ---------- */
function collectFiles(string $dir): array {
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if (!$f->isFile()) continue;
        $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($dir)));
        if (preg_match('#/(\.git|\.DS_Store|node_modules)(/|$)#', $rel)) continue;
        if (str_ends_with($rel, '.map')) continue;
        $out[$rel] = hash_file('sha256', $f->getPathname());
    }
    ksort($out);
    return $out;
}

/* ---------- allowed top-level parts (frontend owns these) ---------- */
const SYNC_PARTS = ['css', 'js', 'assets', 'favicon.ico', 'favicon.png'];

$prev = is_file($manifestFile) ? (json_decode((string)file_get_contents($manifestFile), true) ?: []) : [];
$prevFiles = $prev['files'] ?? [];
$cur = [];
foreach (SYNC_PARTS as $part) {
    if (is_dir($src . '/' . $part)) {
        foreach (collectFiles($src . '/' . $part) as $rel => $hash) $cur[$part . $rel] = $hash;
    } elseif (is_file($src . '/' . $part)) {
        $cur[$part] = hash_file('sha256', $src . '/' . $part);
    }
}

$added = $modified = $deleted = $unchanged = [];
foreach ($cur as $rel => $hash) {
    $dest = $dst . '/' . $rel;
    if (!isset($prevFiles[$rel])) { $added[] = $rel; continue; }
    if ($prevFiles[$rel] !== $hash) { $modified[] = $rel; continue; }
    if (!is_file($dest) || hash_file('sha256', $dest) !== $hash) { $modified[] = $rel; continue; }
    $unchanged[] = $rel;
}
foreach ($prevFiles as $rel => $hash) {
    if (!isset($cur[$rel]) && is_file($dst . '/' . $rel)) $deleted[] = $rel;
}

$report = ['added' => $added, 'modified' => $modified, 'deleted' => $deleted, 'unchanged' => count($unchanged), 'dry_run' => $dry];

if (!$dry && ($added || $modified || $deleted)) {
    foreach ($added as $rel) { @mkdir(dirname($dst . '/' . $rel), 0775, true); copy($src . '/' . $rel, $dst . '/' . $rel); }
    foreach ($modified as $rel) { @mkdir(dirname($dst . '/' . $rel), 0775, true); copy($src . '/' . $rel, $dst . '/' . $rel); }
    foreach ($deleted as $rel) { @unlink($dst . '/' . $rel); }
    file_put_contents($manifestFile, json_encode(['files' => $cur, 'synced_at' => date('c')]));
    // track in the live-sync state for the admin dashboard
    $stateFile = AV_CACHE . '/auto-publish-state.json';
    $state = is_file($stateFile) ? (json_decode((string)file_get_contents($stateFile), true) ?: []) : [];
    $state['last_sync'] = date('c');
    $state['last_sync_counts'] = ['added' => count($added), 'modified' => count($modified), 'deleted' => count($deleted)];
    $state['last_error'] = '';
    file_put_contents($stateFile, json_encode($state));
    printf("frontend synced: +%d added, ~%d modified, -%d deleted, %d unchanged\n", count($added), count($modified), count($deleted), count($unchanged));
} elseif ($dry) {
    printf("DRY RUN: +%d added, ~%d modified, -%d deleted, %d unchanged\n", count($added), count($modified), count($deleted), count($unchanged));
    foreach (array_slice($added, 0, 10) as $f) echo "  + $f\n";
    foreach (array_slice($modified, 0, 10) as $f) echo "  ~ $f\n";
    foreach (array_slice($deleted, 0, 10) as $f) echo "  - $f\n";
} else {
    echo "nothing to do\n";
}

Lock::release($lock);
