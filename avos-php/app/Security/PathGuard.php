<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Secure filesystem path validation (SECURITY-ARCHITECTURE §3).
 *
 * Every control that stopped traversal in the §88 tests is reproduced here:
 * an allow-list pattern, explicit rejection of traversal/null bytes/absolute
 * paths, and realpath() containment inside an approved base directory.
 */
final class PathGuard
{
    /** Segments of [A-Za-z0-9_-] separated by '/', ending in a short extension. */
    private const SAFE_RELATIVE = '#^[A-Za-z0-9_\-]+(/[A-Za-z0-9_\-]+)*\.[A-Za-z0-9]{2,6}$#';

    public static function isSafeRelative(string $rel): bool
    {
        if ($rel === '' || strlen($rel) > 400) return false;
        if (str_contains($rel, "\0")) return false;
        if (str_contains($rel, '..')) return false;
        if (str_contains($rel, '\\')) return false;
        if (str_starts_with($rel, '/')) return false;
        // Reject percent-encoding outright; decoding then checking invites
        // double-encoding bypasses.
        if (str_contains($rel, '%')) return false;
        return preg_match(self::SAFE_RELATIVE, $rel) === 1;
    }

    /**
     * Resolve $rel inside $baseDir, or null if it escapes or does not exist.
     * Containment is proven with realpath(), not string comparison of input.
     */
    public static function resolveWithin(string $baseDir, string $rel): ?string
    {
        if (!self::isSafeRelative($rel)) return null;
        $base = realpath($baseDir);
        if ($base === false) return null;
        $full = realpath($base . '/' . $rel);
        if ($full === false) return null;
        return str_starts_with($full, $base . DIRECTORY_SEPARATOR) ? $full : null;
    }
}
