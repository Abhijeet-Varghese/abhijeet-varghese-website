<?php
/**
 * AV OS — CLI backup restore (disaster recovery).
 *
 * Usage:
 *   php backend/scripts/restore-backup.php <backup-file.json>
 *
 * Restores: content (each key becomes a new version), leads, form
 * submissions. NEVER restores users (password hashes are not and must
 * never be stored in backups). Requires a working database (run
 * migrations first with `php database/migrate.php`).
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
if (($argv[1] ?? '') === '') {
    fwrite(STDERR, "usage: php backend/scripts/restore-backup.php <backup-file.json>\n");
    exit(1);
}
$file = $argv[1];
if (!is_file($file) || !is_readable($file)) { fwrite(STDERR, "backup file not readable: $file\n"); exit(1); }
if (filesize($file) === 0) { fwrite(STDERR, "backup file is empty\n"); exit(1); }

try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, 'bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

$start = microtime(true);
$pkg = json_decode((string)file_get_contents($file), true);
if (!$pkg || empty($pkg['avos'])) { fwrite(STDERR, "invalid backup package\n"); exit(1); }

$restored = 0;
foreach (($pkg['content'] ?? []) as $key => $value) {
    if (!is_array($value)) continue;
    ContentStore::put($key, $value, null, 'restored from backup ' . basename($file));
    $restored++;
}
$leads = 0;
Database::q("DELETE FROM leads");
foreach (($pkg['leads'] ?? []) as $l) {
    if (empty($l['name'])) continue;
    Database::q("INSERT INTO leads (id, name, company, email, phone, lead_type, message, source, page, referrer,
                    utm_source, utm_medium, utm_campaign, utm_term, utm_content, status, score, tags, notes, created_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [$l['id'] ?? null, $l['name'], $l['company'] ?? '', $l['email'] ?? '', $l['phone'] ?? '', $l['lead_type'] ?? '',
         $l['message'] ?? '', $l['source'] ?? '', $l['page'] ?? '', $l['referrer'] ?? '', $l['utm_source'] ?? '',
         $l['utm_medium'] ?? '', $l['utm_campaign'] ?? '', $l['utm_term'] ?? '', $l['utm_content'] ?? '',
         $l['status'] ?? 'new', $l['score'] ?? 50, $l['tags'] ?? '[]', $l['notes'] ?? '', $l['created_at'] ?? date('Y-m-d H:i:s')]);
    $leads++;
}
$subs = 0;
Database::q("DELETE FROM form_submissions");
foreach (($pkg['submissions'] ?? []) as $fs) {
    Database::q("INSERT INTO form_submissions (form_id, data) VALUES (?,?)", [($fs['form_id'] ?? 0) ? (int)$fs['form_id'] : null, json_encode($fs['data'] ?? [])]);
    $subs++;
}
$secs = round(microtime(true) - $start, 2);
printf("[restore] %s — %d content keys, %d leads, %d submissions restored in %ss\n", date('c'), $restored, $leads, $subs, $secs);
exit(0);
