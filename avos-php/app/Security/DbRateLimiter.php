<?php
declare(strict_types=1);
namespace AvOS\Security;

use AvOS\Database\Connection;
use Throwable;

/**
 * MariaDB-backed rate limiter (Phase 3D §3D.13).
 *
 * Shared-hosting compatible: no Redis, no daemon. Rows are trimmed by the same
 * call that reads them, plus a cron sweep, so the table cannot grow unbounded.
 *
 * A storage failure must never lock the site out, so allow() fails OPEN and
 * logs. Rate limiting is a mitigation, not an authorisation control — the real
 * gates are authentication and RBAC.
 */
final class DbRateLimiter implements RateLimiterInterface
{
    public function __construct(private readonly Connection $db) {}

    public function allow(string $key, int $limit, int $windowSeconds): bool
    {
        try {
            $bucket = substr($key, 0, 190);
            $used = (int)$this->db->scalar(
                'SELECT COUNT(*) FROM rate_limits
                  WHERE bucket = ? AND hit_at > (UTC_TIMESTAMP() - INTERVAL ? SECOND)',
                [$bucket, $windowSeconds],
            );
            if ($used >= $limit) return false;

            $this->db->run('INSERT INTO rate_limits (bucket) VALUES (?)', [$bucket]);
            return true;
        } catch (Throwable $e) {
            error_log('[AVOS][rate-limit] storage failure, failing open: ' . $e->getMessage());
            return true;
        }
    }

    public function remaining(string $key, int $limit, int $windowSeconds): int
    {
        try {
            $used = (int)$this->db->scalar(
                'SELECT COUNT(*) FROM rate_limits
                  WHERE bucket = ? AND hit_at > (UTC_TIMESTAMP() - INTERVAL ? SECOND)',
                [substr($key, 0, 190), $windowSeconds],
            );
            return max(0, $limit - $used);
        } catch (Throwable) { return $limit; }
    }

    public function reset(string $key): void
    {
        try { $this->db->run('DELETE FROM rate_limits WHERE bucket = ?', [substr($key, 0, 190)]); }
        catch (Throwable) {}
    }

    /** Cron sweep. */
    public function purgeOlderThan(int $seconds = 86400): int
    {
        return $this->db->run(
            'DELETE FROM rate_limits WHERE hit_at < (UTC_TIMESTAMP() - INTERVAL ? SECOND)', [$seconds]
        )->rowCount();
    }
}
