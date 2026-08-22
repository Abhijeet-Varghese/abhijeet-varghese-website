<?php
declare(strict_types=1);
namespace AvOS\Config;

/**
 * Environment detection. Deterministic and explicit: the environment is never
 * guessed from a hostname. Precedence: APP_ENV → private config $env →
 * 'production' (fail-safe default — an unconfigured system is treated as
 * production and therefore refuses insecure settings).
 */
final class Environment
{
    public const LOCAL = 'local';
    public const TESTING = 'testing';
    public const STAGING = 'staging';
    public const PRODUCTION = 'production';

    private const VALID = [self::LOCAL, self::TESTING, self::STAGING, self::PRODUCTION];

    public function __construct(private readonly string $name) {}

    public static function detect(?string $fromConfig = null): self
    {
        $env = (string)(getenv('APP_ENV') ?: '');
        if ($env === '' && $fromConfig !== null) $env = $fromConfig;
        if ($env === '') $env = self::PRODUCTION;
        $env = strtolower(trim($env));
        // 'development' is a common alias; normalise rather than reject.
        if ($env === 'development' || $env === 'dev') $env = self::LOCAL;
        if (!in_array($env, self::VALID, true)) $env = self::PRODUCTION;
        return new self($env);
    }

    public function name(): string { return $this->name; }
    public function is(string $n): bool { return $this->name === $n; }
    public function isProduction(): bool { return $this->name === self::PRODUCTION; }
    public function isTesting(): bool { return $this->name === self::TESTING; }
    /** Verbose diagnostics are permitted only outside production. */
    public function debugAllowed(): bool { return !$this->isProduction(); }
}
