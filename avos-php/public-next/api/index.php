<?php
declare(strict_types=1);

/**
 * AV OS — NEW API front controller (/api/v1), Phase 3C.
 *
 * Deliberately placed in `public-next/` and NOT in the legacy `public_html/`:
 * Phase 3C must not alter the legacy runtime in any way. Where this directory
 * is mounted in the deployment package is a Phase 3E/deployment decision.
 */
$appRoot = dirname(__DIR__, 2);          // avos-php
require $appRoot . '/app/Autoloader.php';
AvOS\Autoloader::register($appRoot . '/app');

use AvOS\Bootstrap\AuthKernel;
use AvOS\Bootstrap\Kernel;
use AvOS\Core\ApiResponse;
use AvOS\Errors\AppException;
use AvOS\Http\Request;

$kernel = Kernel::boot($appRoot);                 // security headers + guards
$authKernel = new AuthKernel($kernel);
$authKernel->sessions->start($_SERVER);

$request = Request::fromGlobals();
$requestId = $kernel->context->requestId;

try {
    $response = $authKernel->router()->dispatch($request);
} catch (AppException $e) {
    $response = ApiResponse::error(
        $e->errorCode(), $e->getMessage(), $e->status(), $requestId, $e->fields(),
    );
} catch (Throwable $e) {
    error_log('[AVOS][' . $requestId . '] ' . $e::class . ': ' . $e->getMessage());
    $response = ApiResponse::error('SERVER_ERROR', 'Internal server error', 500, $requestId);
}

ApiResponse::send($response, $requestId);
