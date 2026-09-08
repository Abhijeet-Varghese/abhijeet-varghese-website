<?php
/**
 * AV OS — retention maintenance (cron-compatible, flock-protected).
 *
 * Default retention (configurable via env):
 *   AV_RET_AUDIT         audit logs          (default 730 days)
 *   AV_RET_ERRORS        system errors       (default 90 days)
 *   AV_RET_WEBHOOKS      webhook deliveries  (default 30 days)
 *   AV_RET_PERF          perf log            (default 14 days)
 *   AV_RET_ANALYTICS     analytics events    (default 730 days)
 *   AV_RET_CACHE         api cache           (default 7 days)
 *   AV_RET_CALLS         integration calls   (default 90 days)
 *   AV_RET_AIREQ         ai requests         (default 365 days)
 *   AV_RET_JOBS          agent jobs          (default 365 days)
 *   AV_RET_MEMORY        agent memory        (default 365 days)
 *   AV_RET_SESSIONS      sessions            (default 90 days)
 *   AV_RET_LOGIN        login attempts       (default 7 days)
 *   AV_RET_RATELIMIT     rate_limits         (default 1 day)
 *
 * Run daily:
 *   php /home/uXXXXXX/avos/backend/cron/maintenance.php
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$lock = fopen(sys_get_temp_dir() . '/avos-maintenance.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    fwrite(STDERR, "[maintenance] another run is in progress — skipping\n");
    exit(3);
}
try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[maintenance] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

try {
    // table => [env override, default days]; the WHERE column is created_at unless noted
    $ret = [
        'audit_logs'        => [(int)(getenv('AV_RET_AUDIT') ?: 730), 'created_at'],
        'system_errors'     => [(int)(getenv('AV_RET_ERRORS') ?: 90), 'created_at'],
        'webhook_deliveries'=> [(int)(getenv('AV_RET_WEBHOOKS') ?: 30), 'created_at'],
        'perf_log'          => [(int)(getenv('AV_RET_PERF') ?: 14), 'created_at'],
        'analytics_events'  => [(int)(getenv('AV_RET_ANALYTICS') ?: 730), 'created_at'],
        'api_cache'         => [(int)(getenv('AV_RET_CACHE') ?: 7), 'created_at'],
        'integration_calls' => [(int)(getenv('AV_RET_CALLS') ?: 90), 'created_at'],
        'ai_requests'       => [(int)(getenv('AV_RET_AIREQ') ?: 365), 'created_at'],
        'ai_agent_jobs'     => [(int)(getenv('AV_RET_JOBS') ?: 365), 'created_at'],
        'ai_agent_memory'   => [(int)(getenv('AV_RET_MEMORY') ?: 365), 'created_at'],
        'sessions'          => [(int)(getenv('AV_RET_SESSIONS') ?: 90), 'created_at'],
        'login_attempts'    => [(int)(getenv('AV_RET_LOGIN') ?: 7), 'attempted_at'],
        'rate_limits'       => [(int)(getenv('AV_RET_RATELIMIT') ?: 1), 'window_start'],
    ];
    $report = [];
    foreach ($ret as $table => [$days, $col]) {
        if ($days <= 0) { $report[$table] = 'disabled'; continue; }
        // skip tables that don't exist yet on partial installs
        $exists = Database::one("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=? AND table_name=?", [AV_DB['name'], $table]);
        if (!$exists || (int)$exists['n'] === 0) { $report[$table] = 'n/a'; continue; }
        try {
            $st = Database::q("DELETE FROM `$table` WHERE `$col` < NOW() - INTERVAL ? DAY", [$days]);
            $report[$table] = $st->rowCount() . " purged (>{$days}d)";
        } catch (Throwable $e) {
            $report[$table] = 'error: ' . $e->getMessage();
        }
    }
    printf("[maintenance] %s — %s\n", date('c'), json_encode($report));
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, '[maintenance] failed: ' . $e->getMessage() . "\n");
    exit(2);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
