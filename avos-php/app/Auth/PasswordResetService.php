<?php
declare(strict_types=1);
namespace AvOS\Auth;

use AvOS\Database\Connection;
use AvOS\Errors\AppException;
use AvOS\Identity\UserRepository;
use AvOS\Security\SecurityEvent;
use AvOS\Security\SecurityEventRecorder;

/**
 * Password reset (Phase 2 §3C.15).
 *
 * Properties that matter:
 *   • the raw token is returned to the CALLER ONCE and never stored — only
 *     sha256(token) is persisted, so a database disclosure cannot reset accounts;
 *   • single-use, short-lived, invalidated on use and on any password change;
 *   • no account enumeration: request() returns the same shape whether or not
 *     the address exists;
 *   • delivery is honest — if no mailer is configured the result says the mail
 *     was NOT sent rather than pretending.
 */
final class PasswordResetService
{
    public const TOKEN_TTL_MINUTES = 30;

    public function __construct(
        private readonly Connection $db,
        private readonly UserRepository $users,
        private readonly PasswordHasher $hasher,
        private readonly SessionManager $sessions,
        private readonly SecurityEventRecorder $events,
        private readonly ?MailerInterface $mailer = null,
    ) {}

    /**
     * Always returns the same public shape. `token` is populated only for
     * internal/test callers; controllers must never echo it to a client.
     *
     * @return array{accepted:bool,delivered:bool,delivery_status:string,token:?string}
     */
    public function request(string $email, string $ip, string $userAgent, string $requestId = ''): array
    {
        $email = strtolower(trim($email));
        $user = $this->users->findByEmail($email);

        // Uniform response regardless of existence or status.
        $response = ['accepted' => true, 'delivered' => false,
                     'delivery_status' => 'not_configured', 'token' => null];

        if ($user === null || !$user->isActive()) {
            $this->events->record(SecurityEvent::PASSWORD_RESET_REQUESTED, $user?->id, $email,
                $ip, $userAgent, $requestId, ['outcome' => 'ignored_unknown_or_inactive']);
            return $response;
        }

        $token = bin2hex(random_bytes(32));
        $this->db->transaction(function (Connection $db) use ($user, $token, $ip): void {
            // Supersede any outstanding token for this user.
            $db->run(
                'UPDATE password_resets SET invalidated_at=UTC_TIMESTAMP()
                  WHERE user_id=? AND used_at IS NULL AND invalidated_at IS NULL',
                [$user->id],
            );
            $db->run(
                'INSERT INTO password_resets (user_id, token_hash, requested_ip, expires_at)
                 VALUES (?,?,?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))',
                [$user->id, hash('sha256', $token), substr($ip, 0, 45), self::TOKEN_TTL_MINUTES],
            );
        });

        if ($this->mailer !== null && $this->mailer->isConfigured()) {
            $sent = $this->mailer->sendPasswordReset($user->email, $token);
            $response['delivered'] = $sent;
            $response['delivery_status'] = $sent ? 'sent' : 'failed';
        }

        $this->events->record(SecurityEvent::PASSWORD_RESET_REQUESTED, $user->id, $email,
            $ip, $userAgent, $requestId, ['delivery' => $response['delivery_status']]);

        $response['token'] = $token;    // internal use only — never serialised to a client
        return $response;
    }

    /** Consume a token and set a new password. Revokes every session. */
    public function complete(
        string $token,
        string $newPassword,
        string $ip,
        string $userAgent,
        string $requestId = '',
    ): void {
        $row = $this->db->one(
            'SELECT id, user_id, expires_at, used_at, invalidated_at
               FROM password_resets WHERE token_hash=?',
            [hash('sha256', $token)],
        );

        // One generic error for every failure mode — an attacker learns nothing
        // about whether a token existed, expired or was already used.
        $invalid = static fn(): never => throw new AppException(
            'This reset link is invalid or has expired.', 'VALIDATION_ERROR', 422
        );

        if ($row === null) $invalid();
        if ($row['used_at'] !== null || $row['invalidated_at'] !== null) $invalid();
        if (strtotime((string)$row['expires_at']) < time()) $invalid();

        $strength = $this->hasher->validateStrength($newPassword);
        if (!$strength['ok']) {
            throw new AppException('New password ' . $strength['reason'] . '.', 'VALIDATION_ERROR', 422);
        }

        $userId = (int)$row['user_id'];
        $this->db->transaction(function (Connection $db) use ($row, $userId, $newPassword): void {
            $db->run('UPDATE password_resets SET used_at=UTC_TIMESTAMP() WHERE id=?', [(int)$row['id']]);
            $db->run(
                'UPDATE password_resets SET invalidated_at=UTC_TIMESTAMP()
                  WHERE user_id=? AND used_at IS NULL AND invalidated_at IS NULL',
                [$userId],
            );
            $this->users->updatePasswordHash($userId, $this->hasher->hash($newPassword), true);
        });

        $revoked = $this->sessions->revokeAllForUser($userId);
        $this->events->record(SecurityEvent::PASSWORD_RESET_COMPLETED, $userId, null,
            $ip, $userAgent, $requestId, ['sessions_revoked' => $revoked]);
        $this->events->record(SecurityEvent::SESSION_REVOKED, $userId, null,
            $ip, $userAgent, $requestId, ['reason' => 'password_reset', 'count' => $revoked]);
    }

    public function purgeExpired(): int
    {
        return $this->db->run(
            'DELETE FROM password_resets
              WHERE expires_at < (UTC_TIMESTAMP() - INTERVAL 7 DAY)'
        )->rowCount();
    }
}
