<?php
declare(strict_types=1);

/**
 * AV OS — API front controller (/api/v1). Phase 3D.
 *
 * Isolated in `public-next/`, deliberately NOT inside the legacy `public_html/`,
 * so the new stack cannot alter the legacy runtime. Mount point in the
 * deployment package is a later decision.
 */
$appRoot = dirname(__DIR__, 2);
require $appRoot . '/app/Autoloader.php';
AvOS\Autoloader::register($appRoot . '/app');

use AvOS\Bootstrap\ApiKernel;
use AvOS\Bootstrap\Kernel;
use AvOS\Http\Request;

$kernel = Kernel::boot($appRoot, sendHeaders: false);   // API sets its own headers
$api = new ApiKernel($kernel);
$api->sessions->start($_SERVER);

$request = Request::fromGlobals($kernel->context->requestId);
$api->handle($request)->send();
