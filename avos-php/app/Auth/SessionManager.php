<?php
declare(strict_types=1);
namespace AvOS\Auth;

use AvOS\Database\Connection;
use AvOS\Security\Csrf;
use AvOS\Security\SessionConfig;

/**
 * Server-side session lifecycle (AUTH-ARCHITECTURE §3).
 *
 * Two layers, deliberately:
 *   1. the PHP session (cookie-backed) holds user_id / csrf / timestamps;
 *   2. the `sessions` table is a REGISTRY keyed on sha256(session_id).
 *
 * The registry is what makes revocation real: deleting the row logs the user
 * out on their very next request, which a cookie-only design cannot do.
 * The raw session id is never stored, logged or returned.
 */
final class SessionManager
{
    /** Idle timeout — sliding. */
    public const IDLE_MINUTES = 120;

    public function __construct(
        private readonly Connection $db,
        private readonly SessionConfig $config,
        private readonly int $absoluteHours = 12,
    ) {}

    public function start(array $server = []): void
    {
        if (PHP_SAPI === 'cli') return;
        if (session_status() === PHP_SESSION_NONE) {
            $this->config->apply($server ?: $_SERVER);
            session_start();
        }
    }

    /** Issue a fully authenticated session. Rotates the id first (fixation). */
    public function issue(int $userId, string $ip, string $userAgent): string
    {
        if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $sessionId = $this->currentSessionId();
        $now = time();

        $_SESSION['user_id']    = $userId;
        $_SESSION['csrf']       = Csrf::generate();
        $_SESSION['created_at'] = $now;
        $_SESSION['last_seen']  = $now;
        unset($_SESSION['2fa_pending']);

        $this->db->run(
            'INSERT INTO sessions (user_id, token_hash, ip, user_agent, last_seen_at, expires_at)
             VALUES (?,?,?,?,UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR))
             ON DUPLICATE KEY UPDATE last_seen_at=UTC_TIMESTAMP()',
            [$userId, hash('sha256', $sessionId), substr($ip, 0, 45), substr($userAgent, 0, 250), $this->absoluteHours],
        );
        return $_SESSION['csrf'];
    }

    /**
     * Validate the current session against the registry and both timeouts.
     * Returns the user id, or null (having destroyed the session) if invalid.
     */
    public function validate(): ?int
    {
        if (empty($_SESSION['user_id'])) return null;

        $now = time();
        $created = (int)($_SESSION['created_at'] ?? 0);
        $lastSeen = (int)($_SESSION['last_seen'] ?? 0);

        if ($created > 0 && $now - $created > $this->absoluteHours * 3600) { $this->destroy(); return null; }
        if ($lastSeen > 0 && $now - $lastSeen > self::IDLE_MINUTES * 60)   { $this->destroy(); return null; }

        $row = $this->db->one(
            'SELECT id, user_id FROM sessions WHERE token_hash=? AND expires_at > UTC_TIMESTAMP()',
            [hash('sha256', $this->currentSessionId())],
        );
        if ($row === null) { $this->destroy(); return null; }   // revoked or expired

        $_SESSION['last_seen'] = $now;
        $this->db->run('UPDATE sessions SET last_seen_at=UTC_TIMESTAMP() WHERE id=?', [(int)$row['id']]);
        return (int)$row['user_id'];
    }

    public function csrfToken(): string { return (string)($_SESSION['csrf'] ?? ''); }

    public function destroy(): void
    {
        $sessionId = $this->currentSessionId();
        if ($sessionId !== '') {
            $this->db->run('DELETE FROM sessions WHERE token_hash=?', [hash('sha256', $sessionId)]);
        }
        $_SESSION = [];
        if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_ACTIVE) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
            session_destroy();
        }
    }

    /** Revoke every session for a user (password change, admin action). */
    public function revokeAllForUser(int $userId, ?string $exceptSessionId = null): int
    {
        if ($exceptSessionId !== null) {
            $st = $this->db->run(
                'DELETE FROM sessions WHERE user_id=? AND token_hash <> ?',
                [$userId, hash('sha256', $exceptSessionId)],
            );
        } else {
            $st = $this->db->run('DELETE FROM sessions WHERE user_id=?', [$userId]);
        }
        return $st->rowCount();
    }

    public function activeSessions(int $userId): array
    {
        // token_hash deliberately excluded from the projection.
        return $this->db->all(
            'SELECT id, ip, user_agent, created_at, last_seen_at, expires_at
               FROM sessions WHERE user_id=? AND expires_at > UTC_TIMESTAMP() ORDER BY last_seen_at DESC',
            [$userId],
        );
    }

    /** Cron-friendly cleanup of expired rows. */
    public function purgeExpired(): int
    {
        return $this->db->run('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()')->rowCount();
    }

    public function currentSessionId(): string
    {
        if (PHP_SAPI === 'cli') return (string)($GLOBALS['__avos_cli_session_id'] ?? '');
        return session_id() ?: '';
    }
}
