<?php
declare(strict_types=1);
namespace AvOS\Config;

use AvOS\Errors\ConfigurationException;

/**
 * Application configuration.
 *
 * Values come from (in order): defaults → private config file → environment
 * variables. Environment wins, so hPanel can override without editing files.
 *
 * Secrets are held here and never serialised. `safeReport()` returns presence
 * and validity only — never a value, never a length that would aid guessing.
 */
final class Config
{
    /** @var array<string,mixed> */
    private array $data;

    private function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * @param array<string,mixed> $fileVars variables defined by the private config file
     */
    public static function build(ConfigResolver $resolver, array $fileVars, Environment $env): self
    {
        // Legacy runtime credentials. The SAME private file is read by the old
        // backend, so `$db` must keep pointing at the legacy database.
        $dbLegacy = is_array($fileVars['db'] ?? null) ? $fileVars['db'] : [];
        // Contract amendment A15: `$dbNext` lets one private config serve both
        // runtimes. The new schema shares 20 table names with the legacy one
        // (users, roles, sessions, media, projects, leads, forms, audit_logs, …)
        // with INCOMPATIBLE definitions, so the two must not share a database.
        // Absent `$dbNext`, behaviour is exactly as before.
        $db = is_array($fileVars['dbNext'] ?? null) ? ($fileVars['dbNext'] + $dbLegacy) : $dbLegacy;

        // Debug may only ever be NARROWED, never widened: production can never
        // turn it on, and a public staging host can turn it off.
        $debug = $env->debugAllowed();
        if (getenv('AV_DEBUG') === '0' || ($fileVars['debug'] ?? null) === false) $debug = false;

        $data = [
            'env'      => $env->name(),
            'debug'    => $debug,

            'database' => [
                'host'    => self::pick(getenv('DB_HOST'), $db['host'] ?? null, '127.0.0.1'),
                'name'    => self::pick(getenv('DB_NAME'), $db['name'] ?? null, ''),
                'user'    => self::pick(getenv('DB_USER'), $db['user'] ?? null, ''),
                'pass'    => self::pick(getenv('DB_PASS'), $db['pass'] ?? null, ''),
                'charset' => self::pick(getenv('DB_CHARSET'), $db['charset'] ?? null, 'utf8mb4'),
                'port'    => (int)self::pick(getenv('DB_PORT'), $db['port'] ?? null, '3306'),
            ],

            'app' => [
                'name'     => 'AV OS',
                'site_url' => rtrim((string)self::pick(getenv('SITE_URL'), $fileVars['siteUrl'] ?? null, 'https://abhijeetvarghese.com'), '/'),
                'timezone' => 'UTC',   // UTC internally; presentation converts
            ],

            'email' => [
                // PUBLIC address — safe to expose to clients.
                'public'  => (string)self::pick(getenv('AV_PUBLIC_EMAIL'), $fileVars['publicEmail'] ?? null, 'hi@abhijeetvarghese.com'),
                'noreply' => (string)self::pick(getenv('AV_PUBLIC_NOREPLY'), $fileVars['publicNoReply'] ?? null, 'no-reply@abhijeetvarghese.com'),
                // PRIVATE owner address — never hardcoded, never client-visible.
                'owner'   => (string)self::pick(getenv('AV_OWNER_EMAIL'), $fileVars['ownerEmail'] ?? null, ''),
            ],

            'security' => [
                'enc_key'        => (string)self::pick(getenv('AV_ENC_KEY'), $fileVars['encKey'] ?? null, ''),
                'require_private_config' => (getenv('AV_REQUIRE_PRIVATE_CONFIG') === '1'),
                'trust_proxy'    => (getenv('AV_TRUST_PROXY') === '1'),
                'proxy_ranges'   => (string)(getenv('AV_TRUSTED_PROXY_RANGES') ?: ''),
            ],

            'session' => [
                'name'  => 'AVOS_SESS',
                'hours' => (int)self::pick(getenv('SESSION_HOURS'), $fileVars['sessionHours'] ?? null, '12'),
            ],

            'uploads' => [
                'max_bytes' => (int)self::pick(getenv('AV_MAX_UPLOAD_MB'), null, '20') * 1024 * 1024,
                'max_dim'   => (int)self::pick(getenv('AV_MAX_IMAGE_DIM'), null, '12000'),
            ],

            'storage' => [
                'private' => $resolver->resolvePrivateDir(),
            ],

            'cache' => [
                'driver' => (string)(getenv('AV_CACHE_DRIVER') ?: 'file'),   // file | null
                'ttl'    => (int)(getenv('AV_CACHE_TTL') ?: 300),
            ],

            'queue' => [
                'driver'      => 'database',      // shared hosting: no daemon
                'max_seconds' => (int)(getenv('AV_QUEUE_MAX_SECONDS') ?: 50),
            ],

            'booking' => [
                'hold_minutes'  => (int)(getenv('AV_BOOKING_HOLD_MIN') ?: 10),
                'default_tz'    => (string)(getenv('AV_BOOKING_TZ') ?: 'Asia/Kolkata'),
            ],

            'media' => [
                'variants' => ['thumb' => 400, 'card' => 800, 'hero' => 1600, 'full' => 2400],
            ],

            'config_meta' => [
                // WHICH variable in the private file supplied the credentials.
                // A name, never a value — proves the new runtime is on its own
                // database rather than silently sharing the legacy one.
                'db_profile'              => isset($fileVars['dbNext']) ? 'dbNext' : 'db',
                'path'                    => $resolver->resolve(),
                'source'                  => $resolver->source(),
                'outside_webroot'         => $resolver->isConfigOutsideWebRoot(),
                'private_source'          => $resolver->privateSource(),
                'private_outside_webroot' => $resolver->isPrivateDirOutsideWebRoot(),
            ],
        ];

        return new self($data);
    }

    private static function pick(mixed ...$vals): string
    {
        foreach ($vals as $v) {
            if ($v === null || $v === false) continue;
            $s = is_scalar($v) ? (string)$v : '';
            if ($s !== '') return $s;
        }
        return '';
    }

    /** Dot-path accessor: $config->get('database.host'). */
    public function get(string $key, mixed $default = null): mixed
    {
        $node = $this->data;
        foreach (explode('.', $key) as $part) {
            if (!is_array($node) || !array_key_exists($part, $node)) return $default;
            $node = $node[$part];
        }
        return $node;
    }

    public function env(): string { return (string)$this->data['env']; }
    public function isDebug(): bool { return (bool)$this->data['debug']; }

    /**
     * Production guards (Phase 2 §3A.3). Returns a list of human-readable
     * problems; empty means the configuration is acceptable.
     * Messages deliberately contain no value and no filesystem path.
     */
    public function productionProblems(): array
    {
        $p = [];
        if ($this->get('database.name') === '' || $this->get('database.user') === '') {
            $p[] = 'database credentials are not configured';
        }
        if ($this->get('database.pass') === '') {
            $p[] = 'database password is empty';
        }
        // Known development credentials must never reach production.
        if ($this->get('database.user') === 'avos' || $this->get('database.name') === 'avos') {
            $p[] = 'default development database credentials detected';
        }
        $key = (string)$this->get('security.enc_key', '');
        if ($key === '')           $p[] = 'encryption key is not set';
        elseif (strlen($key) < 32) $p[] = 'encryption key is too short (32+ characters required)';

        if ($this->get('config_meta.source') === ConfigResolver::SOURCE_NONE) {
            $p[] = 'no configuration file was found';
        }
        if ($this->get('security.require_private_config') === true) {
            if ($this->get('config_meta.outside_webroot') !== true) {
                $p[] = 'configuration file is inside the web root';
            }
            if ($this->get('config_meta.private_outside_webroot') !== true) {
                $p[] = 'private storage is inside the web root';
            }
        }
        return $p;
    }

    /** Throws when production configuration is unsafe. Never leaks values. */
    public function assertProductionSafe(Environment $env): void
    {
        if (!$env->isProduction()) return;
        $problems = $this->productionProblems();
        if ($problems !== []) {
            throw new ConfigurationException(
                "AV OS is not configured for production:\n - " . implode("\n - ", $problems)
            );
        }
    }

    /** Presence/validity only — safe to render in diagnostics. */
    public function safeReport(): array
    {
        $key = (string)$this->get('security.enc_key', '');
        return [
            'env'                     => $this->env(),
            'debug'                   => $this->isDebug(),
            'config_source'           => $this->get('config_meta.source'),
            'db_profile'              => $this->get('config_meta.db_profile'),
            'config_outside_webroot'  => $this->get('config_meta.outside_webroot'),
            'private_source'          => $this->get('config_meta.private_source'),
            'private_outside_webroot' => $this->get('config_meta.private_outside_webroot'),
            'db_configured'           => $this->get('database.name') !== '' && $this->get('database.user') !== '',
            'db_password_set'         => $this->get('database.pass') !== '',
            'enc_key_set'             => $key !== '',
            'enc_key_strong'          => strlen($key) >= 32,
            'public_email'            => $this->get('email.public'),      // public by definition
            'owner_email_set'         => (string)$this->get('email.owner', '') !== '',
            'strict_mode'             => $this->get('security.require_private_config'),
        ];
    }
}
