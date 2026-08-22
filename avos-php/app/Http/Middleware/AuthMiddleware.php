<?php
declare(strict_types=1);
namespace AvOS\Http\Middleware;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Auth\SessionManager;
use AvOS\Http\Request;
use AvOS\Identity\UserRepository;
use AvOS\Rbac\Authorizer;
use AvOS\Security\Csrf;

/**
 * Authentication + CSRF middleware (Phase 3D §3D.9).
 *
 * Wraps the Phase 3C SessionManager/Authorizer — it does NOT reimplement
 * session or permission logic. Its only jobs are: resolve the session, bind the
 * user onto the request and the Authorizer, and enforce CSRF on mutating verbs.
 */
final class AuthMiddleware
{
    public function __construct(
        private readonly SessionManager $sessions,
        private readonly UserRepository $users,
        private readonly Authorizer $authz,
    ) {}

    /**
     * @param bool $required false => resolve the session if present but allow
     *                       anonymous access (used by /auth/session and health)
     */
    public function handle(Request $request, callable $next, bool $required = true): mixed
    {
        $userId = $this->sessions->validate();
        $user = $userId !== null ? $this->users->findById($userId) : null;

        // A session pointing at a deleted/suspended account is not a session.
        if ($user !== null && !$user->isActive()) {
            $this->sessions->destroy();
            $user = null;
            $userId = null;
        }

        $this->authz->setUser($user);

        if ($required && $user === null) {
            throw new ApiException(ErrorCatalog::UNAUTHORIZED);
        }

        // CSRF applies only to authenticated mutating requests: an anonymous
        // POST (login, reset request) has no session token to compare against
        // and is protected by rate limiting instead.
        if ($user !== null && $request->isMutating()) {
            if (!Csrf::verify($this->sessions->csrfToken(), $request->header(Csrf::HEADER))) {
                throw new ApiException(ErrorCatalog::CSRF_FAILED);
            }
        }

        return $next($request->withUser($user));
    }

    /** Convenience factories for route registration. */
    public function required(): callable
    { return fn(Request $r, callable $n) => $this->handle($r, $n, true); }

    public function optional(): callable
    { return fn(Request $r, callable $n) => $this->handle($r, $n, false); }
}
