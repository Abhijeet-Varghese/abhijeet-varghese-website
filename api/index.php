<?php
/**
 * AV OS — public API entry (front controller)
 * Routes: /api/{action} — see ApiController::handle()
 *
 * Every request gets a traceable request ID (header + error payload +
 * logs + perf_log). Timing is recorded for every API call.
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
    $__avos_root = dirname(__DIR__, 2);   // legacy fallback (unchanged behaviour)
}
require $__avos_root . '/includes/bootstrap.php';
unset($__avos_root, $__i, $__parent);


/* ---------- request ID + timing ---------- */
$avReqId = 'AV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
define('AV_REQUEST_ID', $avReqId);
$GLOBALS['AV_START'] = microtime(true);

header('X-Request-Id: ' . $avReqId);
header('Access-Control-Allow-Origin: same-origin');   // no wildcard CORS — same-origin default
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

/* ---------- record perf after the response (handlers exit() internally) ---------- */
register_shutdown_function(function (): void {
    try {
        $ms = (int)((microtime(true) - ($GLOBALS['AV_START'] ?? microtime(true))) * 1000);
        $path = substr((string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), 0, 290);
        if (str_starts_with($path, '/api/')) {
            Database::q(
                "INSERT INTO perf_log (request_id, method, path, status, ms) VALUES (?,?,?,?,?)",
                [defined('AV_REQUEST_ID') ? AV_REQUEST_ID : '', $_SERVER['REQUEST_METHOD'] ?? '?', $path, http_response_code(), $ms]
            );
        }
    } catch (Throwable $e) { /* perf logging must never break the request */ }
});

ApiController::handle();
