<?php
declare(strict_types=1);
namespace AvOS\Database;

use AvOS\Config\Config;
use AvOS\Errors\ConfigurationException;

/**
 * Database target guard (amendment A17).
 *
 * The new runtime and the legacy backend read the SAME private config file and
 * run on the SAME MySQL account. Twenty table names collide with incompatible
 * definitions, and a migration run against the legacy database both fails AND
 * writes ~50 tables into it. That is unrecoverable by "just re-running", so the
 * check happens BEFORE a connection is ever used for schema work — and it fails
 * closed.
 *
 * Everything this class reports is a boolean or a masked string. It never
 * renders a password, a key, an email address, or a full identifier.
 */
final class TargetGuard
{
    public const OK        = 'ok';
    public const LEGACY    = 'resolved-to-legacy-database';
    public const AMBIGUOUS = 'ambiguous-no-dbNext';
    public const MISSING   = 'no-database-configured';

    public function __construct(private readonly Config $config) {}

    /**
     * Show enough of an identifier to recognise it, never enough to reuse it.
     * Short values collapse entirely rather than leaking most of themselves.
     */
    public static function mask(string $v): string
    {
        if ($v === '') return '(unset)';
        $len = strlen($v);
        if ($len <= 8) return str_repeat('•', $len);
        return substr($v, 0, 4) . str_repeat('•', max(3, $len - 8)) . substr($v, -4);
    }

    /** Stable, non-reversible identity for comparing two names in a report. */
    public static function fingerprint(string $v): string
    {
        return $v === '' ? '(unset)' : substr(hash('sha256', $v), 0, 12);
    }

    public function resolvedName(): string { return (string)$this->config->get('database.name', ''); }
    public function legacyName(): string   { return (string)$this->config->get('config_meta.legacy_db_name', ''); }
    public function profile(): string      { return (string)$this->config->get('config_meta.db_profile', 'db'); }

    /** True when the new runtime would operate on the legacy database. */
    public function isLegacyTarget(): bool
    {
        $legacy = $this->legacyName();
        return $legacy !== '' && strcasecmp($this->resolvedName(), $legacy) === 0;
    }

    /**
     * A private config that defines $db but no $dbNext means the operator has
     * not stated which database the new runtime owns. Silence is not consent:
     * treat it as unresolved rather than defaulting onto the legacy one.
     */
    public function isAmbiguous(): bool
    {
        return $this->profile() === 'db' && $this->legacyName() !== '';
    }

    public function verdict(): string
    {
        if ($this->resolvedName() === '') return self::MISSING;
        // Ambiguity is reported FIRST: "you never said which database the new
        // runtime owns" is the actionable fault, and it is also why the target
        // landed on the legacy one.
        if ($this->isAmbiguous())         return self::AMBIGUOUS;
        if ($this->isLegacyTarget())      return self::LEGACY;
        return self::OK;
    }

    public function isSafe(): bool { return $this->verdict() === self::OK; }

    /** Safe diagnostics: booleans, masks and fingerprints only. */
    public function report(): array
    {
        $key = (string)$this->config->get('security.enc_key', '');
        return [
            'environment'                 => $this->config->env(),
            'environment_source'          => $this->config->get('config_meta.env_source'),
            'debug'                       => $this->config->isDebug(),
            'config_source'               => $this->config->get('config_meta.source'),
            'config_outside_webroot'      => $this->config->get('config_meta.outside_webroot'),
            'private_outside_webroot'     => $this->config->get('config_meta.private_outside_webroot'),
            'db_profile'                  => $this->profile(),
            'db_host'                     => self::mask((string)$this->config->get('database.host', '')),
            'db_name'                     => self::mask($this->resolvedName()),
            'db_user'                     => self::mask((string)$this->config->get('database.user', '')),
            'db_port'                     => (int)$this->config->get('database.port', 3306),
            'db_password_set'             => (string)$this->config->get('database.pass', '') !== '',
            'target_fingerprint'          => self::fingerprint($this->resolvedName()),
            'legacy_fingerprint'          => self::fingerprint($this->legacyName()),
            'resolved_is_legacy_database' => $this->isLegacyTarget(),
            'target_unambiguous'          => !$this->isAmbiguous() && $this->resolvedName() !== '',
            'enc_key_set'                 => $key !== '',
            'enc_key_strong'              => strlen($key) >= 32,
            'owner_email_set'             => (string)$this->config->get('email.owner', '') !== '',
            'owner_email_source'          => (string)$this->config->get('email.owner', '') === ''
                ? 'not-configured'
                : ((string)(getenv('AV_OWNER_EMAIL') ?: '') !== '' ? 'environment' : 'private-config'),
            'verdict'                     => $this->verdict(),
        ];
    }

    /**
     * @throws ConfigurationException when the target is the legacy database,
     *         unstated, or missing. Messages carry no identifier.
     */
    public function assertSafeTarget(string $operation = 'this operation'): void
    {
        switch ($this->verdict()) {
            case self::LEGACY:
                throw new ConfigurationException(
                    "Refusing {$operation}: the new runtime resolved to the LEGACY database. "
                    . 'Set $dbNext to a separate database in the private config.'
                );
            case self::AMBIGUOUS:
                throw new ConfigurationException(
                    "Refusing {$operation}: the private config defines \$db but no \$dbNext, "
                    . 'so the database the new runtime owns has not been stated.'
                );
            case self::MISSING:
                throw new ConfigurationException(
                    "Refusing {$operation}: no database is configured."
                );
        }
    }
}
