<?php
declare(strict_types=1);
namespace AvOS\Http\Middleware;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Http\Request;
use AvOS\Rbac\Authorizer;

/**
 * Authorization middleware (Phase 3D §3D.10).
 *
 * Delegates every decision to the Phase 3C Authorizer. The API implements NO
 * permission logic of its own, and owner checks continue to use the single
 * owner-resolution mechanism — including its fail-closed behaviour when no
 * owner email is configured.
 */
final class PermissionMiddleware
{
    public function __construct(private readonly Authorizer $authz) {}

    public function permission(string $code): callable
    {
        return function (Request $r, callable $next) use ($code): mixed {
            if (!$this->authz->isAuthenticated()) throw new ApiException(ErrorCatalog::UNAUTHORIZED);
            // requirePermission records PERMISSION_DENIED via the Authorizer.
            try {
                $this->authz->requirePermission($code);
            } catch (\AvOS\Errors\AppException $e) {
                throw new ApiException(
                    $e->errorCode() === 'UNAUTHENTICATED' ? ErrorCatalog::UNAUTHORIZED : ErrorCatalog::FORBIDDEN,
                );
            }
            return $next($r);
        };
    }

    public function role(string $slug): callable
    {
        return function (Request $r, callable $next) use ($slug): mixed {
            try { $this->authz->requireRole($slug); }
            catch (\AvOS\Errors\AppException $e) {
                throw new ApiException(
                    $e->errorCode() === 'UNAUTHENTICATED' ? ErrorCatalog::UNAUTHORIZED : ErrorCatalog::FORBIDDEN,
                );
            }
            return $next($r);
        };
    }

    /**
     * Owner-only. Fails closed when owner_email_set=false — which is the
     * current state, and must NOT affect ordinary permission-protected routes.
     */
    public function owner(): callable
    {
        return function (Request $r, callable $next): mixed {
            try { $this->authz->requireOwner(); }
            catch (\AvOS\Errors\AppException $e) {
                throw new ApiException(
                    $e->errorCode() === 'UNAUTHENTICATED' ? ErrorCatalog::UNAUTHORIZED : ErrorCatalog::FORBIDDEN,
                );
            }
            return $next($r);
        };
    }
}
