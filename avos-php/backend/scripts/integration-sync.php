<?php
/**
 * AV OS — INTEGRATION SYNC RUNNER (Hostinger cron, free-first).
 *
 *   cron: every 15 minutes (15 * * * * style entry)
 *   php /home/USERNAME/path/to/backend/scripts/integration-sync.php >> /home/USERNAME/path/to/storage/logs/integration-sync.log 2>&1
 *
 * Pipeline (lightweight, exits fast — no daemons):
 *   1. flock (no concurrent runs)
 *   2. find enabled integrations whose sync interval is due (SQL time compare)
 *   3. run each adapter sync (real API calls, cached, logged, rate-limit aware)
 *   4. on success enqueue the agent jobs each adapter triggers
 *   5. update registry timestamps · exit
 *
 * The public website is NEVER touched by this script.
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$lock = fopen(sys_get_temp_dir() . '/avos-integration-sync.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(3); // another run in progress
}
try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[integration-sync] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

$started = microtime(true);
try {
    // global kill switch also pauses data syncs that enqueue agents
    if (AgentSettings::isGloballyPaused()) {
        printf("[integration-sync] %s — AI agents paused; skipping agent-triggering syncs. exit\n", date('c'));
        exit(0);
    }
    $due = IntegrationHub::due();
    if (!$due) {
        printf("[integration-sync] %s — nothing due. exit\n", date('c'));
        exit(0);
    }
    $ok = 0; $fail = 0;
    foreach ($due as $row) {
        $code = $row['code'];
        if (!in_array($code, IntegrationHub::adapters(), true)) continue;   // virtual/manual rows
        $res = IntegrationHub::syncOne($code, 'cron');
        if (!empty($res['ok'])) {
            printf("[integration-sync] %s — %s: %s (imported %d)\n", date('c'), $code, $res['message'] ?? 'ok', (int)($res['imported'] ?? 0));
            $ok++;
        } else {
            printf("[integration-sync] %s — %s: FAILED %s\n", date('c'), $code, $res['error'] ?? 'unknown error');
            $fail++;
        }
    }
    printf("[integration-sync] %s — done: %d ok, %d failed, %.1fs\n", date('c'), $ok, $fail, microtime(true) - $started);
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, '[integration-sync] ' . $e->getMessage() . "\n");
    try { ErrorModel::log('error', 'integration-sync', $e->getMessage()); } catch (Throwable $ign) {}
    exit(1);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
