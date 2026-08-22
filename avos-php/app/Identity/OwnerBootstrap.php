<?php
declare(strict_types=1);
namespace AvOS\Identity;

use AvOS\Errors\AppException;

/**
 * First-owner bootstrap.
 *
 * A freshly migrated + seeded database contains 7 roles and 49 permissions but
 * ZERO users, so nothing can authenticate and the whole admin chain is dead on
 * arrival. This creates exactly one account: the owner.
 *
 * Rules, all deliberate:
 *
 *  * The address is NEVER passed in — it is read from the configured owner
 *    identity (AV_OWNER_EMAIL / $ownerEmail in the private config), so it can
 *    never appear in argv, shell history, CI logs or a process list.
 *  * The password is NEVER passed in as an argument either; the caller reads it
 *    from a terminal with echo disabled and hands it over in memory.
 *  * It refuses when an owner already exists. Re-running is not a way to reset
 *    a password.
 *  * Every value it returns is redacted/boolean. It reports what happened
 *    without disclosing who.
 */
final class OwnerBootstrap
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly EmailIdentity $identity,
    ) {}

    /** Pre-flight state. Booleans only — safe to print anywhere. */
    public function status(): array
    {
        $configured = $this->identity->hasOwner();
        return [
            'owner_address_configured' => $configured,
            'owner_account_exists'     => $configured && $this->exists(),
            'user_count'               => $this->users->countActive(),
        ];
    }

    public function exists(): bool
    {
        if (!$this->identity->hasOwner()) return false;
        return $this->users->findByEmail($this->identity->ownerEmail()) !== null;
    }

    /**
     * Create the owner account.
     *
     * @throws AppException when the owner address is unconfigured or the
     *         account already exists — never with the address in the message.
     */
    public function create(string $name, string $plainPassword): array
    {
        if (!$this->identity->hasOwner()) {
            throw new AppException(
                'No owner address is configured. Set AV_OWNER_EMAIL, or $ownerEmail in the private config.',
                'CONFIGURATION_ERROR',
                500,
            );
        }
        if ($this->exists()) {
            throw new AppException(
                'An owner account already exists. This command creates the first one only.',
                'CONFLICT',
                409,
            );
        }

        $name = trim($name) === '' ? 'Owner' : trim($name);

        $user = $this->users->create(
            name: $name,
            email: $this->identity->ownerEmail(),
            plainPassword: $plainPassword,
            roleSlugs: ['owner'],
            mustChangePassword: false,
        );

        return [
            'created'              => true,
            'user_id'              => $user->id,
            'name'                 => $name,
            'email'                => '[redacted]',
            'roles'                => $this->users->roleSlugs($user->id),
            'must_change_password' => false,
        ];
    }
}
