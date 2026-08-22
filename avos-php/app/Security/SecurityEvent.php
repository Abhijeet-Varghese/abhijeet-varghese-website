<?php
declare(strict_types=1);
namespace AvOS\Security;

/** Canonical security event types (Phase 2 §3C.11). Values are contract. */
final class SecurityEvent
{
    public const LOGIN_SUCCESS            = 'LOGIN_SUCCESS';
    public const LOGIN_FAILURE            = 'LOGIN_FAILURE';
    public const LOGOUT                   = 'LOGOUT';
    public const PASSWORD_CHANGED         = 'PASSWORD_CHANGED';
    public const PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED';
    public const PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED';
    public const SESSION_REVOKED          = 'SESSION_REVOKED';
    public const ACCOUNT_LOCKED           = 'ACCOUNT_LOCKED';
    public const ACCOUNT_UNLOCKED         = 'ACCOUNT_UNLOCKED';
    public const PERMISSION_DENIED        = 'PERMISSION_DENIED';
    public const ROLE_CHANGED             = 'ROLE_CHANGED';
    public const USER_CREATED             = 'USER_CREATED';
    public const USER_DISABLED            = 'USER_DISABLED';

    /** Events the owner is notified about (delivery is Phase 3O). */
    public const OWNER_NOTIFIABLE = [
        self::LOGIN_SUCCESS, self::ACCOUNT_LOCKED, self::PASSWORD_CHANGED,
        self::PASSWORD_RESET_COMPLETED, self::ROLE_CHANGED, self::USER_CREATED,
    ];

    public static function severityFor(string $type): string
    {
        return match ($type) {
            self::ACCOUNT_LOCKED, self::PERMISSION_DENIED,
            self::PASSWORD_RESET_COMPLETED, self::ROLE_CHANGED => 'warning',
            self::LOGIN_FAILURE                                 => 'info',
            default                                             => 'info',
        };
    }
}
