<?php
declare(strict_types=1);
namespace AvOS\Core;

/**
 * Per-request context. Explicitly passed rather than held in globals so the
 * bootstrap stays deterministic and unit-testable.
 */
final class RequestContext
{
    private float $startedAt;

    private function __construct(
        public readonly string $requestId,
        public readonly string $method,
        public readonly string $path,
        public readonly string $ip,
        public readonly string $userAgent,
        public readonly bool $isCli,
    ) { $this->startedAt = microtime(true); }

    public static function fromGlobals(): self
    {
        $isCli = PHP_SAPI === 'cli';
        $uri   = (string)($_SERVER['REQUEST_URI'] ?? '');
        $path  = (string)(parse_url($uri, PHP_URL_PATH) ?: ($isCli ? 'cli' : '/'));
        return new self(
            requestId: self::newId(),
            method: (string)($_SERVER['REQUEST_METHOD'] ?? ($isCli ? 'CLI' : 'GET')),
            path: $path,
            ip: (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            userAgent: substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
            isCli: $isCli,
        );
    }

    /** Traceable, sortable, non-guessable-enough for correlation. */
    public static function newId(): string
    {
        return 'AV-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
    }

    public function elapsedMs(): int
    { return (int)round((microtime(true) - $this->startedAt) * 1000); }
}
