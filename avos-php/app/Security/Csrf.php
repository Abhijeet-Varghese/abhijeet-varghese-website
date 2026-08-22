<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * CSRF token utility (AUTH-ARCHITECTURE §4).
 *
 * Hardening carried from the §88 audit finding L1: the legacy comparison used
 * hash_equals(stored, given), which returns TRUE when both are ''. Here an
 * empty token on EITHER side is always a failure.
 */
final class Csrf
{
    public const HEADER = 'X-CSRF-Token';
    private const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public static function generate(): string { return bin2hex(random_bytes(24)); }

    public static function verify(?string $expected, ?string $given): bool
    {
        if ($expected === null || $expected === '') return false;
        if ($given === null || $given === '') return false;
        return hash_equals($expected, $given);
    }

    public static function isMutating(string $method): bool
    { return in_array(strtoupper($method), self::MUTATING, true); }

    public static function fromHeaders(array $server): string
    { return (string)($server['HTTP_X_CSRF_TOKEN'] ?? ''); }
}
