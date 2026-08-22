<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Rate-limit abstraction (Phase 2 §3A.6).
 *
 * The interface is defined here so Phase 3C/3E can depend on it. Two drivers:
 * a database-backed one (production; the store table arrives with the system
 * migration) and an in-memory one for tests. No Redis — shared hosting.
 */
interface RateLimiterInterface
{
    /** True when the action is allowed and the hit has been counted. */
    public function allow(string $key, int $limit, int $windowSeconds): bool;
    public function remaining(string $key, int $limit, int $windowSeconds): int;
    public function reset(string $key): void;
}
