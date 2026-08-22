<?php
declare(strict_types=1);
namespace AvOS\Http\Middleware;

use AvOS\Api\ApiException;
use AvOS\Http\Request;
use AvOS\Security\RateLimiterInterface;

/**
 * Rate limiting (Phase 3D §3D.13).
 *
 * Uses the Phase 3A RateLimiterInterface with the MariaDB driver — no Redis,
 * no daemon. Applied to sensitive authentication endpoints in this phase;
 * domain-specific limits come later.
 *
 * The bucket key is the route pattern (not the raw path), so `/users/1` and
 * `/users/2` share a limit and an attacker cannot evade it by varying an id.
 */
final class RateLimitMiddleware
{
    public function __construct(private readonly RateLimiterInterface $limiter) {}

    public function limit(int $max, int $windowSeconds, string $scope = 'ip'): callable
    {
        return function (Request $r, callable $next) use ($max, $windowSeconds, $scope): mixed {
            $route = $r->routePattern !== '' ? $r->routePattern : $r->path;
            $identity = match ($scope) {
                'user' => 'u:' . ($r->user?->id ?? 0),
                'ip'   => 'i:' . $r->ip,
                default => 'i:' . $r->ip,
            };
            $key = 'api:' . $route . ':' . $identity;

            if (!$this->limiter->allow($key, $max, $windowSeconds)) {
                throw ApiException::rateLimited($windowSeconds);
            }
            return $next($r);
        };
    }
}
