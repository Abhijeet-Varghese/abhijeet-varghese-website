<?php
/** Dev helper: push story + experience page seeds into content_store (not shipped). */
$root = dirname(__DIR__, 2);
require $root . '/includes/bootstrap.php';
$doc = json_decode(file_get_contents($root . '/../avos-data/site.json'), true);
if (!is_array($doc)) { fwrite(STDERR, "site.json parse failed\n"); exit(1); }
ContentStore::put('pages', $doc['pages'], null, 'page seeds');
foreach ($doc['pages'] as $p) {
    if (in_array($p['slug'] ?? '', ['story', 'experience'], true)) {
        echo "seeded: {$p['slug']} (template: {$p['template']}, blocks: " . count($p['blocks']) . ")\n";
    }
}
echo "DONE\n";
