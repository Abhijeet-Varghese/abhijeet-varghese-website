<?php
/**
 * AV OS — CMS snapshot export (Vite build input contract).
 *
 * Exports the PUBLISHED content from the CMS (MariaDB content_store) as a JSON
 * snapshot for the React/Vite build. This is the single hand-off point between
 * the backend content source of truth and the frontend build:
 *
 *   CMS (MariaDB content_store) → snapshot JSON → Vite build → dist → publish
 *
 * SAFETY — only published content is exported. The following are NEVER included:
 *   drafts · scheduled content · unpublished articles · leads · users ·
 *   OAuth tokens · API credentials · SMTP credentials · AI keys · DB credentials
 *   · admin data · internal/seo analytics state
 *
 * Usage:
 *   php backend/scripts/export-snapshot.php                    # print to stdout
 *   php backend/scripts/export-snapshot.php --out=/path/snapshot.json
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
require $root . '/includes/bootstrap.php';

$out = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--out=')) $out = substr($arg, 6);
}

$site = ContentStore::all();

/* ---------- published-only filter ---------- */
$isDue = function (array $e): bool {
    // mirrors PublishEngine::isDue — scheduled-but-not-due content is excluded
    $status = $e['status'] ?? ($e['published'] ?? 'published');
    if (isset($e['status']) && !in_array($status, ['published', 'live', 'active'], true)) return false;
    if (isset($e['published']) && !$e['published']) return false;
    $scheduleAt = $e['scheduled_at'] ?? ($e['publish_at'] ?? null);
    if ($scheduleAt) {
        $ts = is_numeric($scheduleAt) ? (int)$scheduleAt : strtotime((string)$scheduleAt);
        if ($ts !== false && $ts > time()) return false;
    }
    return true;
};

$snapshot = [
    'exported_at' => date('c'),
    'mode' => 'vite',
    'schema_version' => 1,
    // published content only — the same collections the Vite build consumes
    'settings' => $site['settings'] ?? [],
    'nav' => $site['nav'] ?? [],
    'sections' => array_values(array_filter($site['sections'] ?? [], fn($s) => ($s['status'] ?? 'published') === 'published')),
    'pages' => array_values(array_filter($site['pages'] ?? [], $isDue)),
    'projects' => array_values(array_filter($site['projects'] ?? [], fn($p) => $isDue($p) && ($p['status'] ?? 'published') === 'published')),
    'articles' => array_values(array_filter($site['articles'] ?? [], fn($a) => $isDue($a) && ($a['status'] ?? 'published') === 'published')),
    'clients' => $site['clients'] ?? [],
    'testimonials' => $site['testimonials'] ?? [],
    'downloads' => $site['downloads'] ?? [],
];

// hard exclusion: any of these keys are privileged and must never appear
$blacklist = ['leads', 'users', 'admin', 'oauth', 'tokens', 'credentials', 'secrets', 'api_keys', 'ai_config', 'smtp', 'analytics'];
foreach ($blacklist as $b) unset($snapshot[$b]);

$json = json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($out) {
    @mkdir(dirname($out), 0775, true);
    file_put_contents($out, $json . "\n");
    echo "snapshot written: $out (" . strlen($json) . " bytes)\n";
} else {
    echo $json . "\n";
}
exit(0);
