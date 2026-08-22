<?php
declare(strict_types=1);
namespace AvOS\Identity;

/**
 * User entity. Immutable read model.
 *
 * `passwordHash` is intentionally NOT a public property: it is exposed only via
 * a dedicated accessor used by the password verifier, and is excluded from
 * every serialisation path so it cannot reach an API response by accident.
 */
final class User
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        private readonly string $passwordHash,
        public readonly ?int $primaryRoleId,
        public readonly string $status,             // active | invited | suspended
        public readonly bool $mustChangePassword,
        public readonly bool $twofaEnabled,
        public readonly ?string $lastLoginAt = null,
        public readonly ?string $deletedAt = null,
    ) {}

    public static function fromRow(array $r): self
    {
        return new self(
            (int)$r['id'],
            (string)$r['name'],
            (string)$r['email'],
            (string)$r['password_hash'],
            $r['primary_role_id'] !== null ? (int)$r['primary_role_id'] : null,
            (string)$r['status'],
            (bool)(int)$r['must_change_password'],
            (bool)(int)$r['twofa_enabled'],
            $r['last_login_at'] ?? null,
            $r['deleted_at'] ?? null,
        );
    }

    /** Only the password verifier should call this. */
    public function passwordHash(): string { return $this->passwordHash; }

    public function isActive(): bool
    { return $this->status === 'active' && $this->deletedAt === null; }

    /** Client-safe projection. No hash, no 2FA secret, no internal flags. */
    public function toPublicArray(): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'email'                => $this->email,
            'status'               => $this->status,
            'must_change_password' => $this->mustChangePassword,
            'twofa_enabled'        => $this->twofaEnabled,
            'last_login_at'        => $this->lastLoginAt,
        ];
    }
}
