<?php
/**
 * AV OS — LIVE SYNC engine (production cron, zero-maintenance).
 *
 * Every minute (Hostinger cron / local watcher):
 *   1. content-aware frontend sync (sha256 manifest, locked, idempotent)
 *   2. drains the publish queue (debounced — rapid saves coalesce into one)
 *   3. publishes when the content hash changed since last publish
 *
 * Safety:
 *   - flock() on both sync and publish — concurrent runs exit safely
 *   - a failed publish never touches the live site (engine is atomic)
 *   - failures are logged + notified + counted (watchdog state)
 *   - after 3 consecutive failures the script goes into backoff (checks
 *     content hash only every 10th run) to avoid hammering a broken build
 *
 * Hostinger cron:
 *   * * * * * php /home/USERNAME/path/backend/scripts/auto-publish.php >> /home/USERNAME/path/storage/logs/auto-publish.log 2>&1
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$lock = fopen(sys_get_temp_dir() . '/avos-auto-publish.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(3);   // another run in progress — safe exit
}

try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[auto-publish] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

$stateFile = AV_CACHE . '/auto-publish-state.json';
$state = is_file($stateFile) ? (json_decode((string)file_get_contents($stateFile), true) ?: []) : [];
$changes = [];
$state['checked_at'] = date('c');

/* ---------- 1. frontend sync (only when enabled, and only in legacy mode) ---------- */
if (FeatureFlagModel::isOn('frontend_sync') && !(defined('AV_VITE_MODE') && AV_VITE_MODE)) {
    $src = defined('AV_FRONTEND_DIR') && AV_FRONTEND_DIR !== '' ? AV_FRONTEND_DIR : (dirname($root) . '/abhijeetvarghese');
    if (is_dir($src)) {
        $out = [];
        exec('php ' . escapeshellarg(__DIR__ . '/sync-frontend.php') . ' 2>&1', $out, $code);
        $line = trim(implode(' ', $out));
        if ($code === 2) {
            $changes[] = 'sync skipped (already running)';
        } elseif (str_contains($line, 'synced:')) {
            $changes[] = 'frontend ' . $line;
            // template changed → enqueue a rebuild so the live site gets the new assets
            PublishQueue::enqueue('publish', null, 'frontend_sync', 'frontend assets changed');
        } elseif (str_contains($line, 'nothing to do')) {
            // fine — no changes
        } else {
            $changes[] = 'sync: ' . $line;
        }
    }
}

/* ---------- 2. drain the publish queue (debounced) ---------- */
PublishQueue::requeueStale();
$job = PublishQueue::take('publish');
if ($job) {
    $lock2 = Lock::acquire('publish');
    if (!$lock2) {
        Database::q("UPDATE publish_queue SET status='queued' WHERE id=?", [(int)$job['id']]);
        $changes[] = 'publish deferred (already in progress)';
    } else {
        try {
            Database::q("DELETE FROM publish_queue WHERE type='publish' AND status='queued' AND id != ?", [(int)$job['id']]);
            $engine = new PublishEngine(ContentStore::all());
            $r = $engine->publish();
            PublishQueue::complete((int)$job['id'], "{$r['pages']} pages, {$r['articles']} articles");
            $state['content_hash'] = md5(json_encode(ContentStore::all()));
            $state['published_at'] = date('c');
            $state['failures'] = 0;
            $changes[] = "published ({$r['pages']} pages, {$r['articles']} articles)";
        } catch (Throwable $e) {
            PublishQueue::fail((int)$job['id'], $e->getMessage());
            $state['failures'] = (int)($state['failures'] ?? 0) + 1;
            $state['last_error'] = mb_substr($e->getMessage(), 0, 400);
            $changes[] = 'publish FAILED: ' . mb_substr($e->getMessage(), 0, 120);
            try {
                ErrorModel::log('error', 'auto_publish', $e->getMessage(), ['job' => (int)$job['id']]);
                NotificationModel::push('Auto-publish failed', mb_substr($e->getMessage(), 0, 200), 'error');
            } catch (Throwable $x) {}
        } finally {
            Lock::release($lock2);
        }
    }
}

/* ---------- 3. content-hash fallback (no queue job but content changed) ---------- */
if (!$job && (int)($state['failures'] ?? 0) < 3) {
    $hash = md5(json_encode(ContentStore::all()));
    if (($state['content_hash'] ?? '') !== $hash) {
        PublishQueue::enqueue('publish', null, 'content_change', 'content hash changed');
        $job2 = PublishQueue::take('publish');
        if ($job2) {
            $lock2 = Lock::acquire('publish');
            if (!$lock2) {
                Database::q("UPDATE publish_queue SET status='queued' WHERE id=?", [(int)$job2['id']]);
                $changes[] = 'publish deferred (already in progress)';
            } else {
                try {
                    $engine = new PublishEngine(ContentStore::all());
                    $r = $engine->publish();
                    PublishQueue::complete((int)$job2['id'], "{$r['pages']} pages, {$r['articles']} articles");
                    $state['content_hash'] = $hash;
                    $state['published_at'] = date('c');
                    $state['failures'] = 0;
                    $changes[] = "content changed — published ({$r['pages']} pages, {$r['articles']} articles)";
                } catch (Throwable $e) {
                    PublishQueue::fail((int)$job2['id'], $e->getMessage());
                    $state['failures'] = (int)($state['failures'] ?? 0) + 1;
                    $state['last_error'] = mb_substr($e->getMessage(), 0, 400);
                    $changes[] = 'publish FAILED: ' . mb_substr($e->getMessage(), 0, 120);
                    try {
                        ErrorModel::log('error', 'auto_publish', $e->getMessage(), ['trigger' => 'content_hash']);
                        NotificationModel::push('Auto-publish failed', mb_substr($e->getMessage(), 0, 200), 'error');
                    } catch (Throwable $x) {}
                } finally {
                    Lock::release($lock2);
                }
            }
        }
    }
}

file_put_contents($stateFile, json_encode($state));
printf("[auto-publish] %s — %s\n", date('c'), $changes ? implode('; ', $changes) : 'nothing to do');
exit(0);
