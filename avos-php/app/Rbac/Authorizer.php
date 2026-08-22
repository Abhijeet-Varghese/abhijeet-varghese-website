<?php
declare(strict_types=1);
namespace AvOS\Rbac;

use AvOS\Errors\AppException;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\User;
use AvOS\Identity\UserRepository;
use AvOS\Security\AuthorizerInterface;
use AvOS\Security\SecurityEvent;
use AvOS\Security\SecurityEventRecorder;

/**
 * Central authorization service (Phase 2 §3C.9, §3C.10).
 *
 * This is the ONLY place that answers "may this user do X?". Controllers call
 * requireAuth / requirePermission / requireRole and never re-implement a check.
 *
 * Owner handling deserves explanation. The contract says OWNER has complete
 * authority, but §3C.9 forbids scattering `if ($user === owner)` through the
 * codebase. So ownership is resolved exactly once, here, against
 * EmailIdentity — never against a hardcoded address and never against a role
 * name — and every other module simply asks this service.
 *
 * Flat RBAC per the approved contract: no inheritance. A role is an explicit
 * set of permission codes; overlap between roles is expected and harmless.
 */
final class Authorizer implements AuthorizerInterface
{
    private ?User $user = null;
    /** @var string[]|null */
    private ?array $permissions = null;
    /** @var string[]|null */
    private ?array $roles = null;

    public function __construct(
        private readonly UserRepository $users,
        private readonly EmailIdentity $identity,
        private readonly ?SecurityEventRecorder $events = null,
        private readonly string $ip = '',
        private readonly string $userAgent = '',
        private readonly string $requestId = '',
    ) {}

    /** Bind the authenticated user for this request. */
    public function setUser(?User $user): void
    {
        $this->user = $user;
        $this->permissions = null;
        $this->roles = null;
    }

    public function user(): ?User { return $this->user; }
    public function userId(): ?int { return $this->user?->id; }

    public function isAuthenticated(): bool
    {
        return $this->user !== null && $this->user->isActive();
    }

    /**
     * Owner is determined by the configured private address alone.
     * When no owner address is configured, NOBODY is owner — deliberately
     * fail-closed rather than promoting an arbitrary account.
     */
    public function isOwner(): bool
    {
        if (!$this->isAuthenticated()) return false;
        return $this->identity->isOwnerEmail($this->user->email);
    }

    /** @return string[] */
    public function roles(): array
    {
        if (!$this->isAuthenticated()) return [];
        return $this->roles ??= $this->users->roleSlugs($this->user->id);
    }

    /** @return string[] */
    public function permissions(): array
    {
        if (!$this->isAuthenticated()) return [];
        if ($this->permissions === null) {
            $this->permissions = $this->users->permissionCodes($this->user->id);
        }
        return $this->permissions;
    }

    public function hasRole(string $slug): bool
    {
        return in_array($slug, $this->roles(), true);
    }

    /**
     * Permission check. The owner short-circuit lives here and ONLY here.
     * A suspended or soft-deleted user always fails, whatever their roles say.
     */
    public function can(string $permission): bool
    {
        if (!$this->isAuthenticated()) return false;
        if ($this->isOwner()) return true;
        return in_array($permission, $this->permissions(), true);
    }

    public function canAny(array $permissions): bool
    {
        foreach ($permissions as $p) if ($this->can($p)) return true;
        return false;
    }

    public function canAll(array $permissions): bool
    {
        foreach ($permissions as $p) if (!$this->can($p)) return false;
        return true;
    }

    // ------------------------------------------------------------- guards

    public function requireAuth(): User
    {
        if (!$this->isAuthenticated()) {
            throw new AppException('Authentication required', 'UNAUTHENTICATED', 401);
        }
        return $this->user;
    }

    public function requirePermission(string $permission): User
    {
        $user = $this->requireAuth();
        if (!$this->can($permission)) {
            $this->events?->record(
                SecurityEvent::PERMISSION_DENIED,
                userId: $user->id,
                email: $user->email,
                ip: $this->ip,
                userAgent: $this->userAgent,
                requestId: $this->requestId,
                detail: ['permission' => $permission],
            );
            throw new AppException('Forbidden', 'FORBIDDEN', 403);
        }
        return $user;
    }

    public function requireRole(string $roleSlug): User
    {
        $user = $this->requireAuth();
        if (!$this->isOwner() && !$this->hasRole($roleSlug)) {
            $this->events?->record(
                SecurityEvent::PERMISSION_DENIED,
                userId: $user->id, email: $user->email, ip: $this->ip,
                userAgent: $this->userAgent, requestId: $this->requestId,
                detail: ['role' => $roleSlug],
            );
            throw new AppException('Forbidden', 'FORBIDDEN', 403);
        }
        return $user;
    }

    /** Owner-only operations sit above every role and permission. */
    public function requireOwner(): User
    {
        $user = $this->requireAuth();
        if (!$this->isOwner()) {
            $this->events?->record(
                SecurityEvent::PERMISSION_DENIED,
                userId: $user->id, email: $user->email, ip: $this->ip,
                userAgent: $this->userAgent, requestId: $this->requestId,
                detail: ['scope' => 'owner-only'],
            );
            throw new AppException('Forbidden', 'FORBIDDEN', 403);
        }
        return $user;
    }

    /** Client-safe session projection. Never includes a hash or a token. */
    public function sessionPayload(): array
    {
        if (!$this->isAuthenticated()) {
            return ['authenticated' => false, 'user' => null, 'roles' => [], 'permissions' => []];
        }
        return [
            'authenticated' => true,
            'user'          => $this->user->toPublicArray(),
            'roles'         => $this->roles(),
            'permissions'   => $this->permissions(),
            'is_owner'      => $this->isOwner(),
        ];
    }
}
