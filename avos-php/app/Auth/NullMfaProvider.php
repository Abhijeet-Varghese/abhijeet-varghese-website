<?php
declare(strict_types=1);
namespace AvOS\Auth;

/**
 * The only provider that exists in Phase 3C. Every method reports honestly
 * rather than pretending.
 */
final class NullMfaProvider implements MfaProviderInterface
{
    public const STATUS = 'NOT_IMPLEMENTED';

    public function isAvailable(): bool { return false; }

    public function beginEnrolment(int $userId, string $accountLabel): array
    { throw new \RuntimeException('MFA is not implemented in this build.'); }

    public function confirmEnrolment(int $userId, string $code): array
    { throw new \RuntimeException('MFA is not implemented in this build.'); }

    /** Never returns true: an unimplemented factor must not grant access. */
    public function verify(int $userId, string $code): bool { return false; }

    public function disable(int $userId): void {}
}
