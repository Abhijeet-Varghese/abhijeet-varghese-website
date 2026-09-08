<?php
/**
 * AV OS — production cleanup (spec §3/§30).
 *
 * Removes development/test artifacts while preserving all legitimate
 * content. Run BEFORE the first production deploy:
 *
 *   php backend/scripts/prod-cleanup.php --dry-run   # preview only
 *   php backend/scripts/prod-cleanup.php --execute   # apply
 *
 * Removes:
 *   - test users (viewer@e2e.test, editor-prod@test.dev, *@e2e.test, *@test.dev)
 *   - test leads / proposals / business projects / campaigns / webhooks /
 *     inbound events / automations / notifications / automation runs /
 *     ai_requests / perf_log / analytics events (test-visitor + generated test events)
 *   - test backups
 *   - audit noise for test actions
 *
 * NEVER removes: content (pages/projects/articles/sections), media,
 * email templates, scoring rules, feature flags, deployments history.
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$dry = in_array('--dry-run', $argv, true);
$run = in_array('--execute', $argv, true);
if (!$dry && !$run) { fwrite(STDERR, "usage: php backend/scripts/prod-cleanup.php --dry-run | --execute\n"); exit(1); }

require $root . '/includes/bootstrap.php';

$report = [];
if ($dry) { Database::pdo()->beginTransaction(); }   // dry-run previews inside a rolled-back transaction
$q = function (string $sql, array $p = []) use (&$report, $dry): void {
    $st = Database::q($sql, $p);
    $report[] = $st->rowCount() . " row(s)";
};
$section = function (string $name) use (&$report): void {
    $report[] = "\n[$name]";
};

$section('test users');
$q("UPDATE users SET status='disabled' WHERE email LIKE '%@e2e.test' OR email LIKE '%@test.dev' OR email LIKE '%@test.com'");
$q("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@e2e.test' OR email LIKE '%@test.dev')");

$section('test leads (identifiable test emails)');
$q("DELETE FROM leads WHERE email LIKE '%@test.dev' OR email LIKE '%@e2e.test' OR email LIKE '%@test.com' OR name IN ('Browser Tester','Journey Lead','SMTP Flow Lead','Hook Test')");

$section('test proposals / business projects');
$q("DELETE FROM proposals WHERE client_name LIKE '%Test%' OR client_name LIKE '%Journey%' OR client_name LIKE '%Debug%' OR title LIKE '%Test%' OR title LIKE '%Debug%' OR title LIKE '%Journey%'");
$q("DELETE FROM projects WHERE title LIKE '%Test%' OR title LIKE '%Journey%' OR title LIKE '%Debug%'");

$section('test campaigns / webhooks / inbound');
$q("DELETE FROM campaigns WHERE name LIKE '%test%' OR name LIKE '%Playwright%'");
$q("DELETE FROM webhooks WHERE endpoint LIKE '%dead%' OR endpoint LIKE '%127.0.0.1%'");
$q("DELETE FROM webhook_deliveries WHERE webhook_id NOT IN (SELECT id FROM webhooks)");
$q("DELETE FROM inbound_events WHERE event_id LIKE '%test%' OR event_id LIKE '%INVITEE%'");

$section('test automations / notifications / runs');
$q("DELETE FROM automations WHERE name LIKE '%test%' OR name LIKE '%Inactive lead%'");
$q("DELETE FROM automation_runs");
$q("DELETE FROM notifications WHERE title LIKE '%test%' OR title LIKE '%Calendly%' OR title LIKE '%Rollback%' OR title LIKE '%Scheduled%'");

$section('test activity + audit noise');
$q("DELETE FROM activities WHERE summary LIKE '%test%' OR summary LIKE '%Test%' OR summary LIKE '%Calendly%'");
$q("DELETE FROM audit_logs WHERE action LIKE '%test%' OR action IN ('lead_delete_permanent','backup_delete','campaign_create','campaign_update','campaign_delete')");

$section('test analytics + ai + perf');
$q("DELETE FROM analytics_events WHERE visitor_id LIKE '%test%' OR visitor_id LIKE '%e2e%' OR path LIKE '%127.0.0.1%'");
$q("DELETE FROM ai_requests WHERE prompt LIKE '%test%' OR prompt LIKE '%Test%'");
$q("DELETE FROM perf_log");
$q("DELETE FROM email_log WHERE recipient LIKE '%@test.dev' OR recipient LIKE '%@test.com' OR recipient LIKE '%@e2e.test'");

$section('test media (e2e-pixel)');
$q("DELETE FROM media WHERE original_name LIKE '%test%' OR original_name LIKE '%pixel%' OR original_name LIKE '%playwright%'");

$section('test backups');
foreach (glob(AV_BACKUPS . '/*.json') ?: [] as $f) {
    if (str_contains(basename($f), 'test') || str_contains(basename($f), 'backup-20260808')) {
        if (!$dry) @unlink($f);
        $report[] = "removed backup file: " . basename($f);
    }
}

$section('test content additions (journey project drafts)');
// draft case studies created by tests
$doc = ContentStore::get('projects');
$before = count($doc);
$doc = array_values(array_filter($doc, fn($p) => !str_starts_with((string)($p['id'] ?? ''), 'prj-journey-') && !str_contains((string)($p['title'] ?? ''), 'Journey Case Study')));
if (count($doc) !== $before) {
    ContentStore::put('projects', $doc, null, 'production cleanup');
    $report[] = "removed " . ($before - count($doc)) . " test project draft(s)";
}

echo "AV OS production cleanup (" . ($dry ? 'DRY RUN' : 'EXECUTED') . ") " . date('c') . "\n" . implode("\n", $report) . "\n";
if ($dry) { Database::pdo()->rollBack(); echo "\n(DRY RUN — nothing was changed; transaction rolled back.)\n"; }
echo "\nDone. Re-verify with: /api/status, /api/diagnostics and the E2E suite.\n";
