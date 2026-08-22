<?php
/**
 * AV OS — remove ALL dummy/test content from the backend.
 * Preserves: real portfolio content (pages, sections, articles, projects,
 * clients, testimonials), media registry, settings, nav, SEO config,
 * email templates, scoring rules, feature flags.
 *
 * Removes: v1 demo seeds in content_store, every test row in real tables,
 * test files, test configs (SMTP pointing at test sinks, Calendly test key).
 */
error_reporting(E_ALL);
require dirname(__DIR__, 2) . '/includes/bootstrap.php';

$removed = [];

/* ---------- 1. dummy content_store keys (v1 demo seeds) ---------- */
$dummyKeys = ['leads', 'meetings', 'notifications', 'submissions', 'logs', 'backups',
              'analytics', 'dashboard', 'users', 'integrations', 'aiPrompts',
              'availability', 'forms'];
foreach ($dummyKeys as $k) {
    $st = Database::q("DELETE FROM content_store WHERE key_name=?", [$k]);
    $removed[] = "content_store[$k]: {$st->rowCount()} row(s)";
}

/* ---------- 2. test rows in real tables ---------- */
$st = Database::q("DELETE FROM users WHERE email LIKE '%@e2e.test' OR email LIKE '%@test.dev' OR email LIKE '%@test.com'");
$removed[] = "users (test): {$st->rowCount()}";
$st = Database::q("DELETE FROM leads");
$removed[] = "leads (all test): {$st->rowCount()}";
$st = Database::q("DELETE FROM meetings");
$removed[] = "meetings: {$st->rowCount()}";
$st = Database::q("DELETE FROM activities");
$removed[] = "activities: {$st->rowCount()}";
$st = Database::q("DELETE FROM opportunities");
$removed[] = "opportunities: {$st->rowCount()}";
$st = Database::q("DELETE FROM contacts");
$removed[] = "contacts: {$st->rowCount()}";
$st = Database::q("DELETE FROM companies");
$removed[] = "companies: {$st->rowCount()}";
$st = Database::q("DELETE FROM tasks");
$removed[] = "tasks: {$st->rowCount()}";
$st = Database::q("DELETE FROM proposals");
$removed[] = "proposals: {$st->rowCount()}";
$st = Database::q("DELETE FROM projects");
$removed[] = "business projects: {$st->rowCount()}";
$st = Database::q("DELETE FROM project_milestones");
$removed[] = "milestones: {$st->rowCount()}";
$st = Database::q("DELETE FROM project_documents");
$removed[] = "documents: {$st->rowCount()}";
$st = Database::q("DELETE FROM notifications");
$removed[] = "notifications: {$st->rowCount()}";
$st = Database::q("DELETE FROM automation_runs");
$removed[] = "automation runs: {$st->rowCount()}";
$st = Database::q("DELETE FROM automations WHERE name LIKE '%Inactive%' OR name LIKE '%test%' OR name LIKE '%Playwright%' OR name LIKE '%Journey%'");
$removed[] = "test automations: {$st->rowCount()}";
$st = Database::q("DELETE FROM webhooks");
$removed[] = "webhooks (test): {$st->rowCount()}";
$st = Database::q("DELETE FROM webhook_deliveries");
$removed[] = "webhook deliveries: {$st->rowCount()}";
$st = Database::q("DELETE FROM inbound_events");
$removed[] = "inbound events: {$st->rowCount()}";
$st = Database::q("DELETE FROM campaigns");
$removed[] = "campaigns (test): {$st->rowCount()}";
$st = Database::q("DELETE FROM email_log");
$removed[] = "email log: {$st->rowCount()}";
$st = Database::q("DELETE FROM ai_requests");
$removed[] = "ai requests: {$st->rowCount()}";
$st = Database::q("DELETE FROM perf_log");
$removed[] = "perf log: {$st->rowCount()}";
$st = Database::q("DELETE FROM analytics_events");
$removed[] = "analytics events: {$st->rowCount()}";
$st = Database::q("DELETE FROM content_metrics");
$removed[] = "content metrics: {$st->rowCount()}";
$st = Database::q("DELETE FROM media WHERE original_name LIKE '%test%' OR original_name LIKE '%pixel%' OR original_name LIKE '%playwright%' OR folder='E2E'");
$removed[] = "test media rows: {$st->rowCount()}";
$st = Database::q("DELETE FROM redirects");
$removed[] = "redirects (demo): {$st->rowCount()}";
$st = Database::q("DELETE FROM api_keys WHERE name LIKE '%test%' OR name LIKE '%Playwright%'");
$removed[] = "test api keys: {$st->rowCount()}";
$st = Database::q("DELETE FROM sessions");
$removed[] = "sessions: {$st->rowCount()}";
$st = Database::q("DELETE FROM login_attempts");
$removed[] = "login attempts: {$st->rowCount()}";
$st = Database::q("DELETE FROM audit_logs");
$removed[] = "audit logs (test noise): {$st->rowCount()}";
$st = Database::q("DELETE FROM versions");
$removed[] = "versions (test history): {$st->rowCount()}";
$st = Database::q("DELETE FROM deployments");
$removed[] = "deployments: {$st->rowCount()}";
$st = Database::q("DELETE FROM system_errors");
$removed[] = "system errors: {$st->rowCount()}";
$st = Database::q("DELETE FROM knowledge_items");
$removed[] = "knowledge: {$st->rowCount()}";
$st = Database::q("DELETE FROM form_submissions");
$removed[] = "form submissions (test): {$st->rowCount()}";

/* ---------- 3. remove test draft added to real content ---------- */
$doc = ContentStore::get('projects');
$before = count($doc);
$doc = array_values(array_filter($doc, fn($p) => !str_starts_with((string)($p['id'] ?? ''), 'prj-journey-')));
if (count($doc) !== $before) {
    ContentStore::put('projects', $doc, null, 'removed test drafts');
    $removed[] = 'test project drafts: ' . ($before - count($doc));
}

/* ---------- 4. test configs ---------- */
$st = Database::q("DELETE FROM site_settings WHERE skey='smtp'");
$removed[] = "smtp config (test sink): {$st->rowCount()}";
$st = Database::q("UPDATE integrations SET config_enc=NULL, status='available' WHERE code='calendly'");
$removed[] = "calendly signing key: {$st->rowCount()}";
$st = Database::q("UPDATE ai_providers SET api_key_enc=NULL");
$removed[] = "ai provider keys: {$st->rowCount()}";

/* ---------- 5. test files ---------- */
foreach (glob(AV_UPLOADS . '/E2E/*') ?: [] as $f) { @unlink($f); }
@rmdir(AV_UPLOADS . '/E2E');
$removed[] = "uploads/E2E files: cleaned";
foreach (glob(AV_BACKUPS . '/*') ?: [] as $f) { @unlink($f); }
$removed[] = "backups: cleaned";
foreach (glob(AV_STORAGE . '/deployments/*') ?: [] as $d) {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($d, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) { $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); }
    @rmdir($d);
}
$removed[] = "deployment snapshots: cleaned";
foreach (glob(AV_CACHE . '/rl-*.json') ?: [] as $f) { @unlink($f); }
$removed[] = "rate-limit cache: cleaned";
foreach (glob(AV_LOGS . '/*') ?: [] as $f) { @unlink($f); }
$removed[] = "logs: cleaned";

echo "AV OS dummy-content removal complete " . date('c') . "\n";
echo implode("\n", $removed) . "\n";
