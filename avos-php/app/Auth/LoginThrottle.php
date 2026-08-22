<?php
declare(strict_types=1);
namespace AvOS\Auth;

use AvOS\Database\Connection;

/**
 * Brute-force protection (Phase 2 §3C.6) — MariaDB only.
 * No Redis, no daemon, no external service; cron trims old rows.
 *
 * Two independent windows, as in the audited legacy implementation:
 *   • per email+IP  — targeted credential stuffing
 *   • per IP        — broad spraying across many accounts
 */
final class LoginThrottle
{
    public function __construct(
        private readonly Connection $db,
        private readonly int $maxPerIdentity = 5,
        private readonly int $lockMinutes = 15,
        private readonly int $maxPerIp = 60,
        private readonly int $ipWindowMinutes = 15,
    ) {}

    public function record(string $email, string $ip, bool $success): void
    {
        $this->db->run(
            'INSERT INTO login_attempts (email, ip, success) VALUES (?,?,?)',
            [strtolower(trim($email)), substr($ip, 0, 45), (int)$success],
        );
    }

    public function failuresFor(string $email, string $ip): int
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM login_attempts
              WHERE email=? AND ip=? AND success=0
                AND attempted_at > (UTC_TIMESTAMP() - INTERVAL ? MINUTE)',
            [strtolower(trim($email)), substr($ip, 0, 45), $this->lockMinutes],
        );
    }

    public function isLocked(string $email, string $ip): bool
    {
        return $this->failuresFor($email, $ip) >= $this->maxPerIdentity;
    }

    public function ipExceeded(string $ip): bool
    {
        $n = (int)$this->db->scalar(
            'SELECT COUNT(*) FROM login_attempts
              WHERE ip=? AND attempted_at > (UTC_TIMESTAMP() - INTERVAL ? MINUTE)',
            [substr($ip, 0, 45), $this->ipWindowMinutes],
        );
        return $n >= $this->maxPerIp;
    }

    /** Successful authentication clears the identity's failure window. */
    public function clear(string $email, string $ip): void
    {
        $this->db->run(
            'DELETE FROM login_attempts WHERE email=? AND ip=? AND success=0',
            [strtolower(trim($email)), substr($ip, 0, 45)],
        );
    }

    public function purgeOlderThanDays(int $days = 30): int
    {
        return $this->db->run(
            'DELETE FROM login_attempts WHERE attempted_at < (UTC_TIMESTAMP() - INTERVAL ? DAY)', [$days]
        )->rowCount();
    }
}
