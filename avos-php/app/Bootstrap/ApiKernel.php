<?php
declare(strict_types=1);
namespace AvOS\Bootstrap;

use AvOS\Api\ApiException;
use AvOS\Api\ApiResult;
use AvOS\Api\ErrorCatalog;
use AvOS\Auth\AuthService;
use AvOS\Auth\LoginThrottle;
use AvOS\Auth\NullMailer;
use AvOS\Auth\NullMfaProvider;
use AvOS\Auth\PasswordHasher;
use AvOS\Auth\PasswordResetService;
use AvOS\Auth\SessionManager;
use AvOS\Domain\System\SettingsRepository;
use AvOS\Domain\System\SystemService;
use AvOS\Errors\AppException;
use AvOS\Http\Controllers\AuthController;
use AvOS\Http\Controllers\SystemController;
use AvOS\Http\Middleware\AuthMiddleware;
use AvOS\Http\Middleware\CorsMiddleware;
use AvOS\Http\Middleware\PermissionMiddleware;
use AvOS\Http\Middleware\RateLimitMiddleware;
use AvOS\Http\Middleware\SecurityHeadersMiddleware;
use AvOS\Http\Request;
use AvOS\Http\Router;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Rbac\Authorizer;
use AvOS\Security\DbRateLimiter;
use Throwable;

/**
 * API composition root (Phase 3D §3D.1).
 *
 * The request lifecycle in one readable place:
 *   request id → security headers → CORS → route match → auth → authorization
 *   → rate limit → controller → service → repository → response.
 *
 * Wiring is explicit rather than container-magic so the dependency graph can be
 * read top to bottom.
 */
final class ApiKernel
{
    public readonly EmailIdentity $identity;
    public readonly UserRepository $users;
    public readonly SessionManager $sessions;
    public readonly Authorizer $authz;
    public readonly AuthService $auth;
    public readonly PasswordResetService $reset;
    public readonly DbRateLimiter $limiter;
    public readonly SystemService $system;
    private readonly Router $router;

    public function __construct(public readonly Kernel $kernel)
    {
        $cfg = $kernel->config;
        $db = $kernel->db();

        $this->identity = EmailIdentity::fromConfig($cfg);
        $hasher = new PasswordHasher();
        $this->users = new UserRepository($db, $hasher);
        $this->sessions = new SessionManager($db, $kernel->session, (int)$cfg->get('session.hours', 12));
        $throttle = new LoginThrottle($db);
        $events = new \AvOS\Security\SecurityEventRecorder($db, $this->identity);

        $this->authz = new Authorizer(
            $this->users, $this->identity, $events,
            $kernel->context->ip, $kernel->context->userAgent, $kernel->context->requestId,
        );
        $this->auth = new AuthService(
            $db, $this->users, $hasher, $this->sessions, $throttle,
            $events, $this->identity, new NullMfaProvider(),
        );
        $this->reset = new PasswordResetService(
            $db, $this->users, $hasher, $this->sessions, $events, new NullMailer(),
        );
        $this->limiter = new DbRateLimiter($db);
        $this->system = new SystemService($db, $cfg, $this->identity, new SettingsRepository($db));

        $this->router = $this->buildRouter();
    }

    private function buildRouter(): Router
    {
        $k = $this->kernel;
        $authMw = new AuthMiddleware($this->sessions, $this->users, $this->authz);
        $perm   = new PermissionMiddleware($this->authz);
        $rate   = new RateLimitMiddleware($this->limiter);
        $cors   = CorsMiddleware::fromConfig((string)(getenv('AV_CORS_ORIGINS') ?: ''));

        $authC = new AuthController(
            $this->auth, $this->reset, $this->sessions, $this->users,
            $this->authz, $k->context->requestId,
        );
        $sysC = new SystemController($this->system, $this->authz);

        $r = new Router();
        // Global: headers first, then CORS (so a preflight short-circuits).
        $r->use(fn(Request $req, callable $next) => (new SecurityHeadersMiddleware())->handle($req, $next));
        $r->use(fn(Request $req, callable $next) => $cors->handle($req, $next));

        // ---- authentication (public, rate limited) ----
        $r->post('/api/v1/auth/login', fn(Request $q) => $this->legacyShape($authC->login($q), $q),
            [$rate->limit(20, 900)]);
        $r->post('/api/v1/auth/password/reset/request',
            fn(Request $q) => $this->legacyShape($authC->resetRequest($q), $q), [$rate->limit(5, 900)]);
        $r->post('/api/v1/auth/password/reset/complete',
            fn(Request $q) => $this->legacyShape($authC->resetComplete($q), $q), [$rate->limit(10, 900)]);

        // ---- authentication (session-aware) ----
        $r->get('/api/v1/auth/session', fn(Request $q) => $this->legacyShape($authC->session($q), $q),
            [$authMw->optional()]);
        $r->post('/api/v1/auth/logout', fn(Request $q) => $this->legacyShape($authC->logout($q), $q),
            [$authMw->optional()]);
        $r->post('/api/v1/auth/password/change',
            fn(Request $q) => $this->legacyShape($authC->changePassword($q), $q),
            [$authMw->required(), $rate->limit(10, 900)]);

        // ---- system ----
        $r->get('/api/v1/system/health', fn(Request $q) => $sysC->health($q), [$authMw->optional()]);
        $r->get('/api/v1/system/settings', fn(Request $q) => $sysC->listSettings($q),
            [$authMw->required(), $perm->permission('settings.read')]);
        $r->get('/api/v1/system/settings/{key}', fn(Request $q) => $sysC->getSetting($q),
            [$authMw->required(), $perm->permission('settings.read')]);
        // Owner-only: fails closed while owner_email_set=false, without
        // affecting any of the permission-protected routes above.
        $r->get('/api/v1/system/owner-status', fn(Request $q) => $sysC->ownerStatus($q),
            [$authMw->required(), $perm->owner()]);

        return $r;
    }

    /**
     * AuthController (Phase 3C) returns the older array shape. Adapt it to
     * ApiResult here rather than rewriting approved, frozen 3C code.
     */
    private function legacyShape(array $legacy, Request $req): ApiResult
    {
        return ApiResult::ok($legacy['body']['data'] ?? null, $req->requestId, $legacy['status'] ?? 200);
    }

    public function router(): Router { return $this->router; }

    /** Full lifecycle with a single error boundary. */
    public function handle(Request $request): ApiResult
    {
        try {
            $result = $this->router->dispatch($request);
            return $result instanceof ApiResult
                ? $result
                : ApiResult::ok($result, $request->requestId);
        } catch (ApiException $e) {
            return ApiResult::fromException($e, $request->requestId);
        } catch (AppException $e) {
            // Phase 3A/3C exceptions — map onto the catalog.
            $code = match ($e->errorCode()) {
                'UNAUTHENTICATED'   => ErrorCatalog::UNAUTHORIZED,
                'FORBIDDEN'         => ErrorCatalog::FORBIDDEN,
                'CSRF_FAILED'       => ErrorCatalog::CSRF_FAILED,
                'VALIDATION_ERROR'  => ErrorCatalog::VALIDATION_ERROR,
                'NOT_FOUND'         => ErrorCatalog::NOT_FOUND,
                'RATE_LIMITED'      => ErrorCatalog::RATE_LIMITED,
                'PAYLOAD_TOO_LARGE' => ErrorCatalog::PAYLOAD_TOO_LARGE,
                'UNSUPPORTED_MEDIA' => ErrorCatalog::UNSUPPORTED_MEDIA_TYPE,
                'MFA_UNAVAILABLE'   => ErrorCatalog::SERVICE_UNAVAILABLE,
                default             => ErrorCatalog::INTERNAL_ERROR,
            };
            $msg = $code === ErrorCatalog::INTERNAL_ERROR ? '' : $e->getMessage();
            return ApiResult::fail($code, $msg, $request->requestId, $e->fields() ?: null);
        } catch (Throwable $e) {
            // Nothing internal reaches the client; full detail goes to the log.
            error_log(sprintf('[AVOS][%s] %s: %s @ %s:%d',
                $request->requestId, $e::class, $e->getMessage(), $e->getFile(), $e->getLine()));
            return ApiResult::fail(ErrorCatalog::INTERNAL_ERROR, '', $request->requestId);
        }
    }
}
