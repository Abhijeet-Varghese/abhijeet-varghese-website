<?php
/* Dev router for `php -S` (Hostinger/Apache uses .htaccess instead) */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$root = __DIR__ . '/public_html';

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/public_html/api/index.php';
    return true;
}

// /media/* → media server (admin previews; published site uses /site/assets/)
if (str_starts_with($path, '/media/')) {
    $_GET['f'] = substr($path, strlen('/media/'));
    require __DIR__ . '/public_html/media.php';
    return true;
}

// map /site/* and /admin/* and everything else into public_html
$rel = ltrim($path, '/');
$file = $root . '/' . $rel;
if ($path === '/' || $path === '') {
    $file = $root . '/site/index.html';   // generated static site at the root
} elseif ($path === '/admin' || $path === '/admin/') {
    header('Location: /admin/login.php');
    return true;
}
// serve the generated static site for page URLs not present in the web root
if (!is_file($file) && !str_starts_with($path, '/api/') && !str_starts_with($path, '/admin/')
    && !str_starts_with($path, '/media/') && !str_starts_with($path, '/install/')) {
    $cand = $root . '/site/' . $rel;
    if (is_file($cand)) $file = $cand;
}

// safety: no traversal
$real = realpath($file);
if ($real === false || !str_starts_with($real, realpath($root))) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

if (is_dir($real)) {
    // prefer index.php (installer/admin) then index.html
    $cand = rtrim($real, '/') . '/index.php';
    if (!is_file($cand)) $cand = rtrim($real, '/') . '/index.html';
    $file = $cand;
    $real = realpath($file);
    if ($real === false) { http_response_code(404); echo 'Not found'; return true; }
}

$ext = pathinfo($real, PATHINFO_EXTENSION);

// PHP files: execute them from the correct directory
if ($ext === 'php') {
    require $real;
    return true;
}

$types = [
    'html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8',
    'js' => 'text/javascript; charset=utf-8', 'json' => 'application/json',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
    'webp' => 'image/webp', 'avif' => 'image/avif', 'svg' => 'image/svg+xml',
    'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
    'pdf' => 'application/pdf', 'ico' => 'image/x-icon', 'txt' => 'text/plain; charset=utf-8',
    'xml' => 'application/xml', 'mp4' => 'video/mp4',
];
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: ' . ($ext === 'html' ? 'no-cache' : 'public, max-age=86400'));
readfile($real);
return true;
