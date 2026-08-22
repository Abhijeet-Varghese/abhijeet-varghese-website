<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Secure session cookie configuration (AUTH-ARCHITECTURE §3).
 * Configuration only — session issuance and the sessions registry belong to
 * Phase 3C.
 */
final class SessionConfig
{
    public function __construct(
        private readonly string $name = 'AVOS_SESS',
        private readonly int $hours = 12,
    ) {}

    public static function isHttps(array $server): bool
    {
        return (!empty($server['HTTPS']) && $server['HTTPS'] !== 'off')
            || (($server['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    }

    public function params(array $server): array
    {
        return [
            'lifetime' => $this->hours * 3600,
            'path'     => '/',
            'domain'   => '',
            'secure'   => self::isHttps($server),
            'httponly' => true,
            'samesite' => 'Lax',
        ];
    }

    public function apply(array $server): void
    {
        if (PHP_SAPI === 'cli' || session_status() !== PHP_SESSION_NONE) return;
        session_set_cookie_params($this->params($server));
        session_name($this->name);
    }

    public function name(): string { return $this->name; }
    public function hours(): int { return $this->hours; }
}
