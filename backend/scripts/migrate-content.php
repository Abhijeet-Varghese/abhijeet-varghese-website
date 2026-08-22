<?php
/**
 * AV OS — content migration (Phase: content migration).
 *
 * Applies the canonical content document produced by
 * `frontend/scripts/extract-migration.ts` (avos-data/migrated-content.json)
 * into `content_store` — idempotently, transactionally, and reversibly
 * (every write is versioned via ContentStore::put).
 *
 * Usage:
 *   php backend/scripts/migrate-content.php --dry-run            # report only, no writes
 *   php backend/scripts/migrate-content.php --dry-run --key=projects
 *   php backend/scripts/migrate-content.php                      # apply (idempotent)
 *   php backend/scripts/migrate-content.php --key=experience     # apply one key
 *
 * Dry-run output per key: CREATE | UPDATE | SKIP | CONFLICT, plus
 * MISSING SOURCE / INVALID MEDIA / INVALID RELATIONSHIP diagnostics.
 * No database modification happens in --dry-run.
 */
$root = dirname(__DIR__, 2); // .../avos-php
$dryRun = in_array('--dry-run', $argv, true);
$keyArg = null;
foreach ($argv as $a) {
    if (str_starts_with($a, '--key=')) $keyArg = substr($a, 6);
}

require $root . '/includes/bootstrap.php';         // loads config.php + autoloader + providers

$seedFile = dirname($root) . '/avos-data/migrated-content.json';
if (!is_file($seedFile)) { fwrite(STDERR, "migration source not found: $seedFile\n"); exit(1); }
$pkg = json_decode((string)file_get_contents($seedFile), true);
if (!is_array($pkg) || !isset($pkg['content']) || !is_array($pkg['content'])) {
    fwrite(STDERR, "migration source malformed (missing content)\n"); exit(1);
}
$content = $pkg['content'];

// content_store keys the migration owns (in application order)
$keys = ['settings', 'nav', 'sections', 'projects', 'articles', 'clients',
         'experience', 'story', 'orange', 'page_content', 'page_seo'];
if ($keyArg !== null) {
    if (!in_array($keyArg, $keys, true)) { fwrite(STDERR, "unknown key: $keyArg (allowed: " . implode(', ', $keys) . ")\n"); exit(1); }
    $keys = [$keyArg];
}

$assetsRoot = dirname($root) . '/frontend/public';   // canonical asset files live here

/** Validate a media reference against the real asset files (INVALID MEDIA check). */
function validateMediaRefs(array $doc, string $assetsRoot, array &$invalid): void
{
    $walk = function ($v) use (&$walk, $assetsRoot, &$invalid) {
        if (is_array($v)) { foreach ($v as $x) $walk($x); return; }
        if (!is_string($v)) return;
        if (!str_starts_with($v, 'assets/')) return;
        // strip query/fragment + srcset candidate suffix
        $path = preg_split('/[ ?]/', $v)[0];
        if (!is_file($assetsRoot . '/' . $path)) $invalid[$v] = true;
    };
    $walk($doc);
}

/** Validate relationship references (projectIds/essayIds/clientIds). */
function validateRelations(array $doc, array &$invalidRel): void
{
    $ids = ['projects' => [], 'articles' => [], 'clients' => []];
    foreach ($ids as $k => $_v) {
        $col = $doc[$k] ?? [];
        if (!is_array($col)) continue;
        foreach ($col as $it) if (is_array($it) && isset($it['id'])) $ids[$k][] = $it['id'];
    }
    $check = function ($refs, array $valid, string $label) use (&$invalidRel) {
        if (!is_array($refs)) return;
        foreach ($refs as $r) if (is_string($r) && $r !== '' && !in_array($r, $valid, true)) $invalidRel["$label:$r"] = true;
    };
    foreach (($doc['sections'] ?? []) as $s) {
        if (!is_array($s)) continue;
        $check($s['projectIds'] ?? null, $ids['projects'], 'projectIds');
        $check($s['essayIds'] ?? null, $ids['articles'], 'essayIds');
        $check($s['clientIds'] ?? null, $ids['clients'], 'clientIds');
    }
}

$report = [];
foreach ($keys as $key) {
    $current = ContentStore::get($key);
    $next = $content[$key] ?? null;
    if (!is_array($next)) { $report[$key] = ['status' => 'MISSING_SOURCE', 'note' => 'key absent from migration source']; continue; }

    // settings: merge over existing (preserve admin-owned fields not in migration)
    if ($key === 'settings') {
        $next = array_merge($current, $next);
    }

    $curJson = json_encode($current, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $nextJson = json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $invalidMedia = [];
    validateMediaRefs($next, $assetsRoot, $invalidMedia);
    $invalidRel = [];
    if ($key === 'sections') validateRelations($content, $invalidRel);

    if ($curJson === $nextJson) {
        $report[$key] = ['status' => 'SKIP', 'note' => 'unchanged'];
    } elseif ($current === []) {
        $report[$key] = ['status' => 'CREATE', 'note' => 'new key', 'invalid_media' => array_keys($invalidMedia), 'invalid_relation' => array_keys($invalidRel)];
    } else {
        $report[$key] = ['status' => 'UPDATE', 'note' => 'content changed', 'invalid_media' => array_keys($invalidMedia), 'invalid_relation' => array_keys($invalidRel)];
    }
}

// ---- print report ----
echo "AV OS content migration " . ($dryRun ? "DRY RUN" : "APPLY") . " — " . date('c') . "\n";
echo str_repeat('─', 72) . "\n";
$table = [];
foreach ($report as $key => $r) {
    $media = isset($r['invalid_media']) && $r['invalid_media'] ? ('MEDIA:' . count($r['invalid_media'])) : '';
    $rel = isset($r['invalid_relation']) && $r['invalid_relation'] ? ('REL:' . count($r['invalid_relation'])) : '';
    $table[] = sprintf("  %-12s %-14s %s %s %s", $key, $r['status'], $r['note'], $media, $rel);
    if (isset($r['invalid_media']) && $r['invalid_media']) {
        foreach (array_slice($r['invalid_media'], 0, 8) as $m) $table[] = "       INVALID MEDIA: $m";
    }
    if (isset($r['invalid_relation']) && $r['invalid_relation']) {
        foreach (array_slice($r['invalid_relation'], 0, 8) as $m) $table[] = "       INVALID RELATIONSHIP: $m";
    }
}
echo implode("\n", $table) . "\n";
echo str_repeat('─', 72) . "\n";

// ---- dry run stops here ----
if ($dryRun) {
    $mutating = array_filter($report, fn($r) => $r['status'] === 'CREATE' || $r['status'] === 'UPDATE');
    echo sprintf("DRY RUN: %d key(s) would be written (%d skipped). No changes made.\n", count($mutating), count($report) - count($mutating));
    exit(0);
}

// ---- apply (transactional, idempotent, versioned) ----
$pdo = Database::pdo();
$wrote = 0;
try {
    $pdo->beginTransaction();
    foreach ($report as $key => $r) {
        if ($r['status'] === 'CREATE' || $r['status'] === 'UPDATE') {
            $value = $content[$key];
            if ($key === 'settings') $value = array_merge(ContentStore::get('settings'), $value);
            ContentStore::put($key, $value, null, 'content migration (migrated-content.json)');
            $wrote++;
        }
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "migration failed and was rolled back: " . $e->getMessage() . "\n");
    exit(1);
}

echo sprintf("APPLIED: %d key(s) written (versioned + reversible).\n", $wrote);
exit(0);
