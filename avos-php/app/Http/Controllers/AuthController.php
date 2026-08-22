<?php
declare(strict_types=1);
namespace AvOS\Http\Controllers;

use AvOS\Auth\AuthService;
use AvOS\Auth\NullMfaProvider;
use AvOS\Auth\PasswordResetService;
use AvOS\Auth\SessionManager;
use AvOS\Core\ApiResponse;
use AvOS\Errors\AppException;
use AvOS\Http\Request;
use AvOS\Identity\UserRepository;
use AvOS\Rbac\Authorizer;
use AvOS\Security\Csrf;
use AvOS\Security\Validator;

/**
 * Authentication endpoints (Phase 2 §3C.12).
 *
 * Controllers are thin: validate → call a service → shape a response. No SQL,
 * no business rules, no permission logic (that lives in Authorizer).
 */
final class AuthController
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly PasswordResetService $reset,
        private readonly SessionManager $sessions,
        private readonly UserRepository $users,
        private readonly Authorizer $authz,
        private readonly string $requestId,
    ) {}

    /** POST /api/v1/auth/login */
    public function login(Request $req): array
    {
        $v = new Validator($req->json());
        $email = $v->email('email', true);
        $password = $v->string('password', 4096, true);
        $v->validOrThrow();

        $r = $this->auth->login($email, $password, $req->ip, $req->userAgent, $this->requestId);

        return match ($r['result']) {
            AuthService::RESULT_THROTTLED => throw new AppException(
                'Too many attempts. Try again later.', 'RATE_LIMITED', 429),
            AuthService::RESULT_FAILED => throw new AppException(
                'Invalid email or password.', 'UNAUTHENTICATED', 401),
            AuthService::RESULT_MFA => ApiResponse::success([
                'authenticated' => false,
                'mfa_required'  => true,
                'mfa_status'    => NullMfaProvider::STATUS,
            ]),
            default => ApiResponse::success([
                'authenticated'        => true,
                'user'                 => $r['user']->toPublicArray(),
                'csrf_token'           => $r['csrf'],
                'must_change_password' => $r['must_change_password'],
            ]),
        };
    }

    /** POST /api/v1/auth/logout — CSRF-protected. */
    public function logout(Request $req): array
    {
        $userId = $this->sessions->validate();
        $this->requireCsrf($req);
        $this->auth->logout($userId, $req->ip, $req->userAgent, $this->requestId);
        return ApiResponse::success(['authenticated' => false]);
    }

    /**
     * GET /api/v1/auth/session
     * Safe for an unauthenticated caller: reports authenticated=false rather
     * than 401, because the admin shell needs to ask "am I logged in?".
     */
    public function session(Request $req): array
    {
        $userId = $this->sessions->validate();
        if ($userId === null) {
            return ApiResponse::success([
                'authenticated' => false, 'user' => null,
                'roles' => [], 'permissions' => [], 'csrf_token' => null,
                'mfa' => ['available' => false, 'status' => NullMfaProvider::STATUS],
            ]);
        }
        $this->authz->setUser($this->users->findById($userId));
        $payload = $this->authz->sessionPayload();
        $payload['csrf_token'] = $this->sessions->csrfToken();
        $payload['mfa'] = ['available' => false, 'status' => NullMfaProvider::STATUS];
        return ApiResponse::success($payload);
    }

    /** POST /api/v1/auth/password/change */
    public function changePassword(Request $req): array
    {
        $userId = $this->sessions->validate();
        if ($userId === null) throw new AppException('Authentication required', 'UNAUTHENTICATED', 401);
        $this->requireCsrf($req);

        $user = $this->users->findById($userId);
        if ($user === null) throw new AppException('Authentication required', 'UNAUTHENTICATED', 401);

        $v = new Validator($req->json());
        $current = $v->string('current_password', 4096, true);
        $new = $v->string('new_password', 4096, true);
        $v->validOrThrow();

        $this->auth->changePassword($user, $current, $new, $req->ip, $req->userAgent, $this->requestId);
        return ApiResponse::success(['changed' => true, 'other_sessions_revoked' => true]);
    }

    /**
     * POST /api/v1/auth/password/reset/request
     * Always 200 with the same body — no account enumeration. The token is
     * never returned to the client.
     */
    public function resetRequest(Request $req): array
    {
        $v = new Validator($req->json());
        $email = $v->email('email', true);
        $v->validOrThrow();

        $r = $this->reset->request($email, $req->ip, $req->userAgent, $this->requestId);

        return ApiResponse::success([
            'accepted' => true,
            'message'  => 'If that address has an account, a reset link has been issued.',
            // Honest about delivery instead of implying an email was sent.
            'delivery' => $r['delivery_status'],
        ]);
    }

    /** POST /api/v1/auth/password/reset/complete */
    public function resetComplete(Request $req): array
    {
        $v = new Validator($req->json());
        $token = $v->string('token', 128, true);
        $new = $v->string('new_password', 4096, true);
        $v->validOrThrow();

        $this->reset->complete($token, $new, $req->ip, $req->userAgent, $this->requestId);
        return ApiResponse::success(['reset' => true]);
    }

    /** Central CSRF enforcement for mutating verbs. */
    private function requireCsrf(Request $req): void
    {
        if (!Csrf::isMutating($req->method)) return;
        $given = $req->header(Csrf::HEADER);
        if (!Csrf::verify($this->sessions->csrfToken(), $given)) {
            throw new AppException('Invalid CSRF token', 'CSRF_FAILED', 419);
        }
    }
}
