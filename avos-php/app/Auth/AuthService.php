<?php
declare(strict_types=1);
namespace AvOS\Auth;

use AvOS\Database\Connection;
use AvOS\Errors\AppException;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\User;
use AvOS\Identity\UserRepository;
use AvOS\Security\SecurityEvent;
use AvOS\Security\SecurityEventRecorder;

/**
 * Authentication service (Phase 2 §3C.4).
 *
 * Anti-enumeration is a deliberate, load-bearing property: an unknown email, a
 * wrong password, a suspended account and a soft-deleted account all produce
 * the SAME response code, message and (approximately) the same timing. The
 * caller learns only "these credentials did not work".
 */
final class AuthService
{
    public const RESULT_OK        = 'ok';
    public const RESULT_FAILED    = 'failed';       // generic, non-enumerating
    public const RESULT_THROTTLED = 'throttled';
    public const RESULT_MFA       = 'mfa_required';

    public function __construct(
        private readonly Connection $db,
        private readonly UserRepository $users,
        private readonly PasswordHasher $hasher,
        private readonly SessionManager $sessions,
        private readonly LoginThrottle $throttle,
        private readonly SecurityEventRecorder $events,
        private readonly EmailIdentity $identity,
        private readonly MfaProviderInterface $mfa,
    ) {}

    /**
     * @return array{result:string,user:?User,csrf:?string,must_change_password:bool,retry_after_minutes:?int}
     */
    public function login(
        string $email,
        string $password,
        string $ip,
        string $userAgent,
        string $requestId = '',
    ): array {
        $email = strtolower(trim($email));
        $deny = fn(string $result, ?int $retry = null): array => [
            'result' => $result, 'user' => null, 'csrf' => null,
            'must_change_password' => false, 'retry_after_minutes' => $retry,
        ];

        // Broad spraying guard first — cheap, and independent of the identity.
        if ($this->throttle->ipExceeded($ip)) {
            $this->events->record(SecurityEvent::LOGIN_FAILURE, null, $email, $ip, $userAgent, $requestId,
                ['reason' => 'ip_rate_exceeded']);
            return $deny(self::RESULT_THROTTLED, 15);
        }

        // Targeted guard. Reported as throttled — this is the ONE place the
        // response differs, and it leaks nothing about whether the account
        // exists, because it triggers on attempt volume, not on identity.
        if ($this->throttle->isLocked($email, $ip)) {
            $this->events->record(SecurityEvent::ACCOUNT_LOCKED, null, $email, $ip, $userAgent, $requestId,
                ['reason' => 'too_many_failures']);
            return $deny(self::RESULT_THROTTLED, 15);
        }

        $user = $this->users->findByEmail($email);

        // Always run a verification so response timing does not distinguish an
        // unknown address from a wrong password.
        $hash = $user?->passwordHash() ?? '';
        $passwordOk = $this->hasher->verify($password, $hash);

        if ($user === null || !$passwordOk || !$user->isActive()) {
            $this->throttle->record($email, $ip, false);
            $this->events->record(SecurityEvent::LOGIN_FAILURE, $user?->id, $email, $ip, $userAgent, $requestId,
                ['reason' => $user === null ? 'unknown_identity'
                    : (!$passwordOk ? 'bad_password' : 'inactive_account')]);
            return $deny(self::RESULT_FAILED);
        }

        // Transparent hash upgrade when the cost factor changes.
        if ($this->hasher->needsRehash($hash)) {
            $this->users->updatePasswordHash($user->id, $this->hasher->hash($password), !$user->mustChangePassword);
        }

        $this->throttle->record($email, $ip, true);
        $this->throttle->clear($email, $ip);

        // MFA gate sits BETWEEN authentication and session issuance.
        if ($user->twofaEnabled) {
            if (!$this->mfa->isAvailable()) {
                // Fail closed: an account flagged for MFA must not fall back to
                // password-only just because no provider is wired up.
                $this->events->record(SecurityEvent::LOGIN_FAILURE, $user->id, $email, $ip, $userAgent, $requestId,
                    ['reason' => 'mfa_required_but_unavailable']);
                throw new AppException(
                    'This account requires two-factor authentication, which is not available in this build.',
                    'MFA_UNAVAILABLE', 503,
                );
            }
            return ['result' => self::RESULT_MFA, 'user' => $user, 'csrf' => null,
                    'must_change_password' => $user->mustChangePassword, 'retry_after_minutes' => null];
        }

        $csrf = $this->sessions->issue($user->id, $ip, $userAgent);
        $this->users->recordLogin($user->id, $ip);
        $this->events->record(SecurityEvent::LOGIN_SUCCESS, $user->id, $email, $ip, $userAgent, $requestId);

        return ['result' => self::RESULT_OK, 'user' => $user, 'csrf' => $csrf,
                'must_change_password' => $user->mustChangePassword, 'retry_after_minutes' => null];
    }

    public function logout(?int $userId, string $ip, string $userAgent, string $requestId = ''): void
    {
        if ($userId !== null) {
            $this->events->record(SecurityEvent::LOGOUT, $userId, null, $ip, $userAgent, $requestId);
        }
        $this->sessions->destroy();
    }

    /**
     * Change password for an authenticated user. Requires the current password
     * (so a hijacked session cannot silently lock the owner out), and revokes
     * every OTHER session on success.
     */
    public function changePassword(
        User $user,
        string $currentPassword,
        string $newPassword,
        string $ip,
        string $userAgent,
        string $requestId = '',
    ): void {
        if (!$this->hasher->verify($currentPassword, $user->passwordHash())) {
            $this->events->record(SecurityEvent::LOGIN_FAILURE, $user->id, $user->email, $ip, $userAgent, $requestId,
                ['reason' => 'password_change_bad_current']);
            throw new AppException('Current password is incorrect.', 'FORBIDDEN', 403);
        }
        $strength = $this->hasher->validateStrength($newPassword);
        if (!$strength['ok']) {
            throw new AppException('New password ' . $strength['reason'] . '.', 'VALIDATION_ERROR', 422);
        }
        if ($this->hasher->verify($newPassword, $user->passwordHash())) {
            throw new AppException('New password must differ from the current password.', 'VALIDATION_ERROR', 422);
        }

        $this->db->transaction(function () use ($user, $newPassword): void {
            $this->users->updatePasswordHash($user->id, $this->hasher->hash($newPassword), true);
            // Any outstanding reset token is void once the password changes.
            $this->db->run(
                'UPDATE password_resets SET invalidated_at=UTC_TIMESTAMP()
                  WHERE user_id=? AND used_at IS NULL AND invalidated_at IS NULL',
                [$user->id],
            );
        });

        $revoked = $this->sessions->revokeAllForUser($user->id, $this->sessions->currentSessionId());
        // Rotate CSRF after a credential change (audit finding L2).
        $_SESSION['csrf'] = \AvOS\Security\Csrf::generate();

        $this->events->record(SecurityEvent::PASSWORD_CHANGED, $user->id, $user->email, $ip, $userAgent, $requestId,
            ['other_sessions_revoked' => $revoked]);
    }

    /** Current CSRF token for the active session. */
    public function csrfToken(): string { return $this->sessions->csrfToken(); }
}
