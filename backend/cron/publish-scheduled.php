<?php
/**
 * AV OS — scheduled publishing (cron-compatible).
 *
 * Publishes when any entity (page/project/article) has status 'scheduled'
 * and scheduled_at <= now. Safe to run every 5-15 minutes. flock-protected
 * so overlapping executions can never double-publish.
 *
 * Hostinger cron:
 *   php /home/uXXXXXX/avos/backend/cron/publish-scheduled.php
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$lock = fopen(sys_get_temp_dir() . '/avos-publish-scheduled.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    fwrite(STDERR, "[publish-scheduled] another run is in progress — skipping\n");
    exit(3);
}

try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[publish-scheduled] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

try {
    $doc = ContentStore::all();
    $due = false;
    $names = [];
    foreach (['pages', 'projects', 'articles'] as $key) {
        foreach (($doc[$key] ?? []) as $ent) {
            $st = $ent['status'] ?? '';
            $at = $ent['scheduled_at'] ?? '';
            if ($st === 'scheduled' && $at !== '' && strtotime($at) <= time()) {
                $due = true;
                $names[] = ($ent['title'] ?? '?') . " @ {$at}";
            }
        }
    }
    if (!$due) {
        printf("[publish-scheduled] %s — nothing scheduled for now\n", date('c'));
        exit(0);
    }
    $engine = new PublishEngine($doc);
    $r = $engine->publish();
    NotificationModel::push('Scheduled publish complete', implode('; ', array_slice($names, 0, 5)), 'publish');
    printf("[publish-scheduled] %s — published (%d pages, %d articles): %s\n", date('c'), $r['pages'], $r['articles'], implode('; ', $names));
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, '[publish-scheduled] failed: ' . $e->getMessage() . "\n");
    try { ErrorModel::log('error', 'scheduled_publish', $e->getMessage()); } catch (Throwable $x) {}
    exit(2);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
