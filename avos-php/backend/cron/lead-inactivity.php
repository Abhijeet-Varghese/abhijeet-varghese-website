<?php
/**
 * AV OS — lead inactivity sweep (cron-compatible CLI).
 *
 * Fires automations with trigger_event='lead.inactive' for leads with
 * no activity for >= their days_min condition. Designed for Hostinger
 * cron (PHP CLI is available on Premium plans):
 *
 *   php /home/uXXXXXX/domains/abhijeetvarghese.com/avos/backend/cron/lead-inactivity.php
 *
 * Suggested schedule: daily. The sweep is self-limiting (each lead fires
 * at most once per 24h per rule), so hourly is also safe.
 *
 * Exit codes: 0 ok, 1 bootstrap/config error, 2 database error.
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);

try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[lead-inactivity] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

try {
    $r = AutomationModel::runInactive();
    printf("[lead-inactivity] %s rules_checked=%d actions_fired=%d\n",
        date('c'), (int)$r['rules_checked'], (int)$r['actions_fired']);
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, '[lead-inactivity] sweep failed: ' . $e->getMessage() . "\n");
    exit(2);
}
