<?php
/**
 * Dev helper — copy the generated site into AV_MIRROR_DIR immediately.
 * Run when you want the workspace mirror refreshed without republishing:
 *   php backend/scripts/mirror-site.php
 */
require __DIR__ . '/../../includes/bootstrap.php';

$out = defined('AV_SITE_OUT') ? AV_SITE_OUT : '';
$target = defined('AV_MIRROR_DIR') ? AV_MIRROR_DIR : '';
if ($out === '' || $target === '' || !is_dir($out)) {
    fwrite(STDERR, "mirror: AV_MIRROR_DIR not configured or site dir missing\n");
    exit(1);
}
$engine = new PublishEngine(ContentStore::all());
// reuse the engine's copy primitives via a tiny reflection-free approach:
// publish() runs mirrorSite automatically; here we just mirror manually.
$rm = new ReflectionMethod($engine, 'rmDir');
$cp = new ReflectionMethod($engine, 'copyDir');
$rm->setAccessible(true);
$cp->setAccessible(true);
if (is_dir($target)) $rm->invoke($engine, $target);
@mkdir($target, 0775, true);
$cp->invoke($engine, $out, $target);
echo "mirror: {$out} -> {$target}\n";
