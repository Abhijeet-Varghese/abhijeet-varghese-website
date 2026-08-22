<?php
declare(strict_types=1);
namespace AvOS\Auth;

/**
 * MFA boundary (Phase 2 §3C.14).
 *
 * STATUS: NOT IMPLEMENTED in Phase 3C — deliberately.
 *
 * The interface and the enrolment/verification contract are defined so the
 * login flow already has the correct seam (2FA gates BETWEEN authentication and
 * session issuance). The `users.twofa_secret` / `users.twofa_enabled` columns
 * are preserved for it.
 *
 * There is no fake implementation, no "Authenticator enabled" status and no UI.
 * `NullMfaProvider` reports availability as false so callers cannot mistake
 * absence for a disabled-but-working feature.
 */
interface MfaProviderInterface
{
    /** Is a working MFA provider actually wired up? */
    public function isAvailable(): bool;

    /** Begin enrolment: returns a secret + provisioning URI for an authenticator app. */
    public function beginEnrolment(int $userId, string $accountLabel): array;

    /** Confirm enrolment with a first code; returns recovery codes on success. */
    public function confirmEnrolment(int $userId, string $code): array;

    /** Verify a code (or a single-use recovery code) during login. */
    public function verify(int $userId, string $code): bool;

    public function disable(int $userId): void;
}
