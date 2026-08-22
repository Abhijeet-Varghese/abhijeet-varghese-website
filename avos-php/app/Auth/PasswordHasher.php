<?php
declare(strict_types=1);
namespace AvOS\Auth;

/**
 * Password hashing (Phase 2 §3C.3).
 *
 * Uses PHP's password_* facilities exclusively — no custom cryptography.
 * PASSWORD_DEFAULT so the algorithm can improve with PHP; needsRehash() lets
 * existing hashes upgrade transparently on the next successful login.
 */
final class PasswordHasher
{
    public const MIN_LENGTH = 12;

    public function hash(string $plain): string
    {
        return password_hash($plain, PASSWORD_DEFAULT);
    }

    public function verify(string $plain, string $hash): bool
    {
        if ($hash === '') {
            // Still burn comparable time so a user with no hash is not
            // distinguishable by response timing.
            password_verify($plain, '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
            return false;
        }
        return password_verify($plain, $hash);
    }

    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_DEFAULT);
    }

    /** @return array{ok:bool,reason:string} */
    public function validateStrength(string $plain): array
    {
        if (strlen($plain) < self::MIN_LENGTH) {
            return ['ok' => false, 'reason' => 'must be at least ' . self::MIN_LENGTH . ' characters'];
        }
        if (strlen($plain) > 4096) {
            // Long inputs are a bcrypt DoS vector.
            return ['ok' => false, 'reason' => 'is too long'];
        }
        if (trim($plain) === '') {
            return ['ok' => false, 'reason' => 'cannot be blank'];
        }
        return ['ok' => true, 'reason' => ''];
    }
}
