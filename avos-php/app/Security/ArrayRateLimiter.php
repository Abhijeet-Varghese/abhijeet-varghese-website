<?php
declare(strict_types=1);
namespace AvOS\Security;

/** Deterministic in-memory limiter for tests. */
final class ArrayRateLimiter implements RateLimiterInterface
{
    /** @var array<string,int[]> */
    private array $hits = [];

    public function allow(string $key, int $limit, int $windowSeconds): bool
    {
        $now = time();
        $this->hits[$key] = array_values(array_filter(
            $this->hits[$key] ?? [],
            static fn(int $t) => $t > $now - $windowSeconds,
        ));
        if (count($this->hits[$key]) >= $limit) return false;
        $this->hits[$key][] = $now;
        return true;
    }

    public function remaining(string $key, int $limit, int $windowSeconds): int
    {
        $now = time();
        $recent = array_filter($this->hits[$key] ?? [], static fn(int $t) => $t > $now - $windowSeconds);
        return max(0, $limit - count($recent));
    }

    public function reset(string $key): void { unset($this->hits[$key]); }
}
