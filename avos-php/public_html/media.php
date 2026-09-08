<?php
/**
 * AV OS — media server (public portfolio assets from private storage).
 *
 * Serves /media/<path> for the admin CMS (media library previews, project/
 * article cover images). Lookup order:
 *   1. storage/uploads/<path>          (files uploaded through the media library)
 *   2. <static site>/assets/<path>     (portfolio images that ship with the
 *                                       hand-authored frontend — CMS records
 *                                       reference them as media/<name>)
 * Files are public portfolio assets; the static site itself never uses /media.
 *
 * Hard guards: strict filename pattern, realpath containment inside one of the
 * two roots, safe content-types, no PHP execution.
 */
require __DIR__ . '/../includes/bootstrap.php';

$f = $_GET['f'] ?? '';
if ($f === '' || str_contains($f, '..') || str_contains($f, '\\') || str_starts_with($f, '/') || str_contains($f, "\0")) {
    http_response_code(404);
    exit;
}
if (!preg_match('#^[A-Za-z0-9_\-]+(/[A-Za-z0-9_\-]+)*\.[A-Za-z0-9]{2,6}$#', $f)) {
    http_response_code(404);
    exit;
}
$file = false;
$roots = [realpath(AV_UPLOADS)];
if (defined('AV_SITE_DIR') && is_dir(AV_SITE_DIR . '/assets')) $roots[] = realpath(AV_SITE_DIR . '/assets');
foreach ($roots as $root) {
    if ($root === false) continue;
    $cand = realpath($root . '/' . $f);
    if ($cand !== false && str_starts_with($cand, $root . '/') && is_file($cand)) { $file = $cand; break; }
}
if ($file === false) {
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
