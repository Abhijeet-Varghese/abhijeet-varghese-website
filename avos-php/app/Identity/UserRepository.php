<?php
declare(strict_types=1);
namespace AvOS\Identity;

use AvOS\Auth\PasswordHasher;
use AvOS\Database\Connection;
use AvOS\Errors\AppException;
use AvOS\Errors\ValidationException;

/**
 * User repository + domain service (Phase 2 §3C.1).
 *
 * All SQL for the identity domain lives here. Nothing else in the application
 * writes `users` or `user_roles`.
 */
final class UserRepository
{
    private const COLUMNS = 'id, name, email, password_hash, primary_role_id, status,
                             must_change_password, twofa_enabled, last_login_at, deleted_at';

    public function __construct(
        private readonly Connection $db,
        private readonly PasswordHasher $hasher,
    ) {}

    // ------------------------------------------------------------- lookup

    public function findById(int $id): ?User
    {
        $r = $this->db->one('SELECT ' . self::COLUMNS . ' FROM users WHERE id=? AND deleted_at IS NULL', [$id]);
        return $r === null ? null : User::fromRow($r);
    }

    /** Email lookup is case-insensitive; addresses are stored lowercased. */
    public function findByEmail(string $email): ?User
    {
        $r = $this->db->one(
            'SELECT ' . self::COLUMNS . ' FROM users WHERE email=? AND deleted_at IS NULL',
            [strtolower(trim($email))],
        );
        return $r === null ? null : User::fromRow($r);
    }

    public function emailExists(string $email): bool
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM users WHERE email=?', [strtolower(trim($email))]
        ) > 0;
    }

    public function countActive(): int
    {
        return (int)$this->db->scalar(
            "SELECT COUNT(*) FROM users WHERE status='active' AND deleted_at IS NULL"
        );
    }

    // ------------------------------------------------------------- create

    /**
     * @param string[] $roleSlugs
     * @throws ValidationException on a weak password or duplicate email
     */
    public function create(
        string $name,
        string $email,
        string $plainPassword,
        array $roleSlugs = [],
        bool $mustChangePassword = true,
        string $status = 'active',
    ): User {
        $email = strtolower(trim($email));
        $errors = [];
        if ($name === '') $errors['name'] = 'required';
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) $errors['email'] = 'must be a valid email address';
        $strength = $this->hasher->validateStrength($plainPassword);
        if (!$strength['ok']) $errors['password'] = $strength['reason'];
        if ($errors === [] && $this->emailExists($email)) $errors['email'] = 'is already registered';
        if ($errors !== []) throw new ValidationException($errors);

        return $this->db->transaction(function (Connection $db) use ($name, $email, $plainPassword, $roleSlugs, $mustChangePassword, $status): User {
            $primaryRoleId = null;
            if ($roleSlugs !== []) {
                $primaryRoleId = $db->scalar('SELECT id FROM roles WHERE slug=?', [$roleSlugs[0]]);
                $primaryRoleId = $primaryRoleId === false ? null : (int)$primaryRoleId;
            }

            $db->run(
                'INSERT INTO users (name, email, password_hash, primary_role_id, status, must_change_password)
                 VALUES (?,?,?,?,?,?)',
                [$name, $email, $this->hasher->hash($plainPassword), $primaryRoleId, $status, (int)$mustChangePassword],
            );
            $id = (int)$db->pdo()->lastInsertId();

            foreach ($roleSlugs as $slug) {
                $roleId = $db->scalar('SELECT id FROM roles WHERE slug=?', [$slug]);
                if ($roleId === false) throw new AppException("Unknown role: {$slug}", 'VALIDATION_ERROR', 422);
                $db->run('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?,?)', [$id, (int)$roleId]);
            }

            $user = $this->findById($id);
            if ($user === null) throw new AppException('User creation failed.');
            return $user;
        });
    }

    // ------------------------------------------------------------- status

    public function setStatus(int $userId, string $status): void
    {
        if (!in_array($status, ['active', 'invited', 'suspended'], true)) {
            throw new ValidationException(['status' => 'must be active, invited or suspended']);
        }
        $this->db->run('UPDATE users SET status=? WHERE id=?', [$status, $userId]);
    }

    public function softDelete(int $userId): void
    {
        $this->db->run('UPDATE users SET deleted_at=UTC_TIMESTAMP() WHERE id=?', [$userId]);
    }

    public function recordLogin(int $userId, string $ip): void
    {
        $this->db->run(
            'UPDATE users SET last_login_at=UTC_TIMESTAMP(), last_login_ip=? WHERE id=?',
            [substr($ip, 0, 45), $userId],
        );
    }

    // ----------------------------------------------------------- password

    public function updatePasswordHash(int $userId, string $hash, bool $clearMustChange = true): void
    {
        $this->db->run(
            'UPDATE users SET password_hash=?, must_change_password=? WHERE id=?',
            [$hash, $clearMustChange ? 0 : 1, $userId],
        );
    }

    public function setMustChangePassword(int $userId, bool $must): void
    {
        $this->db->run('UPDATE users SET must_change_password=? WHERE id=?', [(int)$must, $userId]);
    }

    // -------------------------------------------------------------- roles

    /** @return string[] role slugs */
    public function roleSlugs(int $userId): array
    {
        return array_column($this->db->all(
            'SELECT r.slug FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? ORDER BY r.slug',
            [$userId],
        ), 'slug');
    }

    /** @return string[] permission codes, de-duplicated across all roles */
    public function permissionCodes(int $userId): array
    {
        return array_column($this->db->all(
            'SELECT DISTINCT p.code
               FROM user_roles ur
               JOIN role_permissions rp ON rp.role_id = ur.role_id
               JOIN permissions p ON p.id = rp.permission_id
              WHERE ur.user_id = ?
              ORDER BY p.code',
            [$userId],
        ), 'code');
    }

    public function assignRole(int $userId, string $roleSlug): void
    {
        $roleId = $this->db->scalar('SELECT id FROM roles WHERE slug=?', [$roleSlug]);
        if ($roleId === false) throw new ValidationException(['role' => 'unknown role']);
        $this->db->run('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?,?)', [$userId, (int)$roleId]);
    }

    public function revokeRole(int $userId, string $roleSlug): void
    {
        $this->db->run(
            'DELETE ur FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.slug=?',
            [$userId, $roleSlug],
        );
    }

    public function hasRole(int $userId, string $roleSlug): bool
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.slug=?',
            [$userId, $roleSlug],
        ) > 0;
    }
}
