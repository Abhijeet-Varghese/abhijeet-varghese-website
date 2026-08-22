<?php
declare(strict_types=1);
namespace AvOS\Http\Middleware;

use AvOS\Api\ApiResult;
use AvOS\Http\Request;

/**
 * CORS policy (Phase 3D §3D.11).
 *
 * The admin is same-origin (`/os/` under the same host as `/api/v1`), so the
 * default allow-list is EMPTY and no CORS headers are emitted at all — the
 * safest possible posture.
 *
 * `Access-Control-Allow-Origin: *` is never emitted, because these APIs are
 * credentialed (cookie sessions) and the wildcard is invalid with credentials.
 * Allowed origins come from configuration:
 *   local      AV_CORS_ORIGINS=http://localhost:5173
 *   staging    AV_CORS_ORIGINS=https://next.abhijeetvarghese.com
 *   production normally empty (same-origin only)
 */
final class CorsMiddleware
{
    private const ALLOW_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    private const ALLOW_HEADERS = 'Content-Type, X-CSRF-Token, X-Requested-With';
    private const MAX_AGE = '600';

    /** @param string[] $allowedOrigins */
    public function __construct(private readonly array $allowedOrigins = []) {}

    public static function fromConfig(string $csv): self
    {
        $origins = array_values(array_filter(array_map('trim', explode(',', $csv))));
        return new self($origins);
    }

    public function handle(Request $request, callable $next): mixed
    {
        $origin = $request->header('origin');

        // Same-origin (no Origin header) — nothing to negotiate.
        if ($origin === '') return $next($request);

        $allowed = in_array($origin, $this->allowedOrigins, true);

        if ($request->method === 'OPTIONS') {
            // Preflight. A disallowed origin gets 403 with no CORS headers, so
            // the browser blocks the real request.
            if (!$allowed) {
                return ApiResult::fail('FORBIDDEN', 'Origin not allowed.', $request->requestId, null, 403);
            }
            return ApiResult::ok(null, $request->requestId, 204, $this->headersFor($origin));
        }

        $result = $next($request);

        // Only a permitted origin receives CORS headers. A rejected origin
        // still gets its response, but the browser will not expose it to the
        // calling page — which is exactly what a CORS rejection means.
        if ($allowed && $result instanceof ApiResult) {
            return $result->withHeaders($this->headersFor($origin));
        }
        return $result;
    }

    private function headersFor(string $origin): array
    {
        return [
            'Access-Control-Allow-Origin'      => $origin,   // echo, never '*'
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Methods'     => self::ALLOW_METHODS,
            'Access-Control-Allow-Headers'     => self::ALLOW_HEADERS,
            'Access-Control-Max-Age'           => self::MAX_AGE,
            'Vary'                             => 'Origin',
        ];
    }

    public function isAllowed(string $origin): bool
    { return $origin !== '' && in_array($origin, $this->allowedOrigins, true); }
}
