<?php
declare(strict_types=1);

/**
 * AV OS — API front controller (/api/v1). Phase 3D, extended in Phase 3F.
 *
 * Isolated in `public-next/`, deliberately NOT inside the legacy `public_html/`,
 * so the new stack cannot alter the legacy runtime. Mount point in the
 * deployment package is a later decision.
 */
/**
 * Locate the application root by walking UPWARD until app/Autoloader.php is
 * found, exactly as the legacy front controller does.
 *
 * This used to be a fixed dirname(__DIR__, 2), which hardcoded the mount point.
 * Real Hostinger/LiteSpeed testing forced the controller to move out of the
 * api/ directory tree (LiteSpeed resolves /api/* to api/index.php via PATH_INFO
 * before .htaccess rewrites run, so a physical api/v1/ directory was shadowed
 * by the legacy handler). Resolving upward makes the mount point irrelevant:
 * the same file works at api/v1/index.php, at the package root, or anywhere
 * above app/.
 */
$appRoot = __DIR__;
for ($i = 0; $i < 8; $i++) {
    if (is_file($appRoot . '/app/Autoloader.php')) break;
    $parent = dirname($appRoot);
    if ($parent === $appRoot) { $appRoot = null; break; }
    $appRoot = $parent;
}
if ($appRoot === null || !is_file($appRoot . '/app/Autoloader.php')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'data' => null,
        'error' => ['code' => 'RUNTIME_NOT_FOUND',
                    'message' => 'The application runtime could not be located.']]);
    exit;
}
unset($i, $parent);

require $appRoot . '/app/Autoloader.php';
AvOS\Autoloader::register($appRoot . '/app');

use AvOS\Bootstrap\ApiKernel;
use AvOS\Bootstrap\BinaryDownload;
use AvOS\Bootstrap\Kernel;
use AvOS\Http\Request;

$kernel = Kernel::boot($appRoot, sendHeaders: false);   // API sets its own headers
$api = new ApiKernel($kernel);
$api->sessions->start($_SERVER);

$request = Request::fromGlobals($kernel->context->requestId);
$response = $api->handle($request);

// Phase 3F: a media download is a file, not an envelope. Every authorization
// and existence check already ran inside handle(), so reaching here means the
// caller is entitled to the bytes.
if ($response instanceof BinaryDownload) {
    $api->downloads->stream($response->descriptor);
    return;
}

$response->send();
