<?php
declare(strict_types=1);

/**
 * Dev router for the NEW API front controller, for `php -S` only.
 *
 * Reproduces what Apache/LiteSpeed does in production: everything under
 * /api/ is handed to the Phase 3D front controller. It exists so the Phase 3E
 * HTTP tests exercise the REAL entry point — request parsing, session cookies,
 * CSRF headers, middleware, status codes — instead of calling services
 * directly and hoping the HTTP layer agrees.
 *
 * NOT part of the deployment package and never used in production.
 */
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api/')) {
    require dirname(__DIR__, 2) . '/public-next/api/index.php';
    return true;
}

http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['ok' => false, 'data' => null,
    'error' => ['code' => 'NOT_FOUND', 'message' => 'Only /api/* is served by this dev router.']]);
return true;
