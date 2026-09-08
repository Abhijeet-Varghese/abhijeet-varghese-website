<?php
/** Dev helper: restore canonical seed content (not shipped). */
$root = dirname(__DIR__, 2);
require $root . '/includes/bootstrap.php';
$doc = json_decode(file_get_contents($root . '/../avos-data/site.json'), true);
if (!is_array($doc)) { fwrite(STDERR, "site.json parse failed\n"); exit(1); }
foreach (['settings','sections','pages','projects','articles','clients','testimonials','downloads','seo','nav','media'] as $k) {
    if (array_key_exists($k, $doc)) { ContentStore::put($k, $doc[$k], null, 'canonical restore'); echo "restored: $k\n"; }
}
try { FeatureFlagModel::set('auto_publish', true); echo "auto_publish=true\n"; } catch (Throwable $e) { echo "flag: " . $e->getMessage() . "\n"; }
echo "DONE\n";
