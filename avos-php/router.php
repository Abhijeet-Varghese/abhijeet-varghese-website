<?php
/**
 * Dev router for `php -S` (Hostinger/Apache uses .htaccess instead).
 *
 *   /api/*     → REST API (public_html/api/index.php)
 *   /admin/*   → AV OS admin (public_html/admin)
 *   /install/* → first-run wizard (public_html/install)
 *   /media/*   → media library previews (private storage via media.php)
 *   everything else → the static frontend (AV_SITE_DIR, served as-is)
 *
 * The static frontend is the final website: no template layer, no HTML
 * generation. This router only mirrors what the frontend's own .htaccess
 * does on Apache (clean URLs, legacy → canonical 301s, 404 page).
 */
require_once __DIR__ . '/backend/config/config.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$path = rawurldecode($path);
$appRoot = __DIR__ . '/public_html';
$siteRoot = AV_SITE_DIR;

/* ---------- application routes ---------- */
if (str_starts_with($path, '/api/') || $path === '/api') {
    require $appRoot . '/api/index.php';
    return true;
}
if (str_starts_with($path, '/media/') || str_starts_with($path, '/admin/app/media/')) {
    // admin views reference covers as media/<name> relative to /admin/app/
    $_GET['f'] = substr($path, strpos($path, '/media/') + strlen('/media/'));
    require $appRoot . '/media.php';
    return true;
}
if ($path === '/admin' || $path === '/admin/') {
    header('Location: /admin/login.php', true, 302);
    return true;
}
if (str_starts_with($path, '/admin/') || str_starts_with($path, '/install/') || $path === '/install') {
    $file = $appRoot . '/' . ltrim($path, '/');
    if (is_dir($file)) $file = rtrim($file, '/') . '/index.php';
    $real = realpath($file);
    if ($real === false || !str_starts_with($real, realpath($appRoot))) return avNotFound($siteRoot);
    if (pathinfo($real, PATHINFO_EXTENSION) === 'php') { require $real; return true; }
    return avServeStatic($real);
}

/* ---------- static frontend ---------- */
// legacy → canonical redirects (mirrors abhijeetvarghese/.htaccess)
$redirects = [
    'case-studies.html' => '/case-studies/',
    'experience.html' => '/experience/',
    'case-study-enterprise-technology-made-understandable.html' => '/case-studies/orange-business/',
    'experience-design/orange-business-executive-briefing-center' => '/case-studies/orange-business/',
    'case-study-intuitive-experiences-for-industrial-environments.html' => '/case-studies/bharat-petroleum-corporation-limited/',
    'case-study-immersive-solutions-for-the-indian-army.html' => '/case-studies/indian-army/',
    'experience-design/bpcl-palakkad' => '/case-studies/bharat-petroleum-corporation-limited/',
];
$rel = trim($path, '/');
if (isset($redirects[$rel])) {
    header('Location: ' . $redirects[$rel], true, 301);
    return true;
}

$file = $siteRoot . '/' . $rel;
if ($rel === '') $file = $siteRoot . '/index.html';
if (is_dir($file)) {
    if (!str_ends_with($path, '/')) { header('Location: ' . $path . '/', true, 301); return true; }
    $file = rtrim($file, '/') . '/index.html';
}
if (!is_file($file) && is_file($file . '.html')) $file .= '.html';

$real = realpath($file);
if ($real === false || !is_file($real) || !str_starts_with($real, realpath($siteRoot))) return avNotFound($siteRoot);
// never serve dotfiles (e.g. .htaccess) from the site root
if (str_starts_with(basename($real), '.')) return avNotFound($siteRoot);
return avServeStatic($real);

/* ---------- helpers ---------- */
function avNotFound(string $siteRoot): bool
{
    http_response_code(404);
    $p = $siteRoot . '/404.html';
    header('Content-Type: text/html; charset=utf-8');
    echo is_file($p) ? file_get_contents($p) : 'Not found';
    return true;
}

function avServeStatic(string $real): bool
{
    $types = [
        'html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8', 'json' => 'application/json; charset=utf-8',
        'xml' => 'application/xml; charset=utf-8', 'txt' => 'text/plain; charset=utf-8',
        'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'webp' => 'image/webp', 'avif' => 'image/avif', 'gif' => 'image/gif', 'ico' => 'image/x-icon',
        'woff2' => 'font/woff2', 'woff' => 'font/woff', 'pdf' => 'application/pdf',
        'mp4' => 'video/mp4', 'webm' => 'video/webm', 'webmanifest' => 'application/manifest+json',
    ];
    $ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    if ($ext === 'html') header('Cache-Control: no-cache, must-revalidate');
    elseif (in_array($ext, ['css', 'js'], true)) header('Cache-Control: public, max-age=31536000, immutable');
    else header('Cache-Control: public, max-age=2592000');
    header('Content-Length: ' . filesize($real));
    readfile($real);
    return true;
}
