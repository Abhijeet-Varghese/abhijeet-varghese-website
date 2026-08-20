<?php
/**
 * AV OS — media server (public portfolio assets from private storage).
 *
 * The generated public site embeds media under /site/assets/... so this
 * handler exists for the admin CMS (media library previews) and for
 * direct /media/... references. Files are public portfolio assets.
 *
 * Hard guards: strict filename pattern, realpath containment inside
 * storage/uploads, safe content-types, no PHP execution.
 */
// Locate the app root (backend/includes live OUTSIDE the web root, so the
// web root may be public_html/ or a subdirectory like public_html/next/).
// Walk upward until includes/bootstrap.php is found - no hardcoded depth.
$__avos_root = __DIR__;
for ($__i = 0; $__i < 8; $__i++) {
    if (is_file($__avos_root . '/includes/bootstrap.php')) break;
    $__parent = dirname($__avos_root);
    if ($__parent === $__avos_root) { $__avos_root = null; break; }
    $__avos_root = $__parent;
}
if ($__avos_root === null || !is_file($__avos_root . '/includes/bootstrap.php')) {
    $__avos_root = dirname(__DIR__);   // legacy fallback (unchanged behaviour)
}
require $__avos_root . '/includes/bootstrap.php';
unset($__avos_root, $__i, $__parent);


$f = $_GET['f'] ?? '';
if ($f === '' || str_contains($f, '..') || str_contains($f, '\\') || str_starts_with($f, '/') || str_contains($f, "\0")) {
    http_response_code(404);
    exit;
}
if (!preg_match('#^[A-Za-z0-9_\-]+(/[A-Za-z0-9_\-]+)*\.[A-Za-z0-9]{2,6}$#', $f)) {
    http_response_code(404);
    exit;
}
$root = realpath(AV_UPLOADS);
$file = realpath($root . '/' . $f);
if ($file === false || !str_starts_with($file, $root . '/') || !is_file($file)) {
    http_response_code(404);
    exit;
}
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$types = [
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
    'webp' => 'image/webp', 'avif' => 'image/avif', 'svg' => 'image/svg+xml',
    'pdf' => 'application/pdf', 'mp4' => 'video/mp4', 'webm' => 'video/webm', 'mov' => 'video/quicktime',
    'zip' => 'application/zip', 'txt' => 'text/plain', 'md' => 'text/markdown',
    'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
];
if (!isset($types[$ext])) {
    http_response_code(404);
    exit;
}
header('Content-Type: ' . $types[$ext]);
header('Cache-Control: public, max-age=86400');
header('X-Content-Type-Options: nosniff');
header('Content-Length: ' . filesize($file));
readfile($file);
