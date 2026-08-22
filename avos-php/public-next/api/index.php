<?php
declare(strict_types=1);

/**
 * AV OS — API front controller (/api/v1). Phase 3D, extended in Phase 3F.
 *
 * Isolated in `public-next/`, deliberately NOT inside the legacy `public_html/`,
 * so the new stack cannot alter the legacy runtime. Mount point in the
 * deployment package is a later decision.
 */
$appRoot = dirname(__DIR__, 2);
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
