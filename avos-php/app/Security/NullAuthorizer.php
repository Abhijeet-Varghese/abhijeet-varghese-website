<?php
declare(strict_types=1);
namespace AvOS\Security;

/** Denies everything. The safe default until Phase 3C/3D land. */
final class NullAuthorizer implements AuthorizerInterface
{
    public function isAuthenticated(): bool { return false; }
    public function userId(): ?int { return null; }
    public function can(string $permission): bool { return false; }
    public function isOwner(): bool { return false; }
}
