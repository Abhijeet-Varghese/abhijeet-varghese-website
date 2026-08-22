<?php
declare(strict_types=1);
namespace AvOS\Http\Middleware;

use AvOS\Http\Request;

/**
 * API security headers (Phase 3D §3D.12).
 *
 * Applied to every API response. `Cache-Control: no-store` is the important
 * one: an authenticated JSON response must never be cached by a browser or an
 * intermediary.
 */
final class SecurityHeadersMiddleware
{
    public function handle(Request $request, callable $next): mixed
    {
        if (!headers_sent()) {
            header('X-Content-Type-Options: nosniff');
            header('Referrer-Policy: no-referrer');
            header('Cache-Control: no-store, no-cache, must-revalidate, private');
            header('Pragma: no-cache');
            header('X-Frame-Options: DENY');            // an API is never framed
            header('X-Request-Id: ' . $request->requestId);
            header_remove('X-Powered-By');
        }
        return $next($request);
    }
}
