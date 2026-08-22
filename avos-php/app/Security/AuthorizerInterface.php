<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Authorization abstraction (Phase 2 §3A.6).
 *
 * The CONTRACT only. Real RBAC resolution is Phase 3D, and owner identity
 * resolution is Phase 3C. Defining the seam now keeps later modules from
 * inventing their own ad-hoc permission checks.
 */
interface AuthorizerInterface
{
    public function isAuthenticated(): bool;
    public function userId(): ?int;
    /** Flat permission code, e.g. 'pages.write'. */
    public function can(string $permission): bool;
    /** Owner-only operations sit ABOVE any role. */
    public function isOwner(): bool;
}
