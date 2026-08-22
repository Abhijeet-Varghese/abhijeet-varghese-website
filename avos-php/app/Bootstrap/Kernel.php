<?php
declare(strict_types=1);
namespace AvOS\Bootstrap;

use AvOS\Config\Config;
use AvOS\Config\ConfigResolver;
use AvOS\Config\Environment;
use AvOS\Core\RequestContext;
use AvOS\Database\Connection;
use AvOS\Errors\ErrorHandler;
use AvOS\Security\SessionConfig;

/**
 * Application kernel (Phase 2 §3A.1).
 *
 * Deterministic boot sequence:
 *   1. request context (id, method, path)   — no side effects
 *   2. private configuration resolution     — filesystem reads only
 *   3. configuration assembly               — defaults ← file ← environment
 *   4. environment detection
 *   5. error handling                       — before anything can fail loudly
 *   6. production guards                    — refuse insecure configuration
 *   7. security defaults                    — headers, session params
 *   8. lazy service registration            — nothing connects until used
 *
 * Global state is limited to the singleton instance itself; everything else is
 * passed explicitly so the boot is testable.
 */
final class Kernel
{
    private static ?self $instance = null;

    private ?Connection $db = null;

    private function __construct(
        public readonly string $appRoot,
        public readonly RequestContext $context,
        public readonly ConfigResolver $resolver,
        public readonly Config $config,
        public readonly Environment $environment,
        public readonly SessionConfig $session,
    ) {}

    /**
     * @param string $appRoot the avos-php directory
     * @param bool   $sendHeaders false for CLI/tests
     */
    public static function boot(string $appRoot, bool $sendHeaders = true): self
    {
        if (self::$instance !== null) return self::$instance;

        $appRoot = rtrim($appRoot, '/');
        $context  = RequestContext::fromGlobals();
        $resolver = new ConfigResolver($appRoot);

        // --- private configuration -------------------------------------
        $path = $resolver->resolve();
        if ($resolver->source() === ConfigResolver::SOURCE_INVALID) {
            // Explicit but unreadable: fail loudly, disclose no path.
            self::hardFail($context, 'AV_CONFIG_FILE is set but the file is not readable.', $sendHeaders);
        }

        $fileVars = [];
        if ($path !== '' && getenv('AV_SKIP_LOCAL_CONFIG') !== '1') {
            $fileVars = self::loadConfigFile($path);
        }

        $environment = Environment::detect(isset($fileVars['env']) && is_string($fileVars['env']) ? $fileVars['env'] : null);
        $config      = Config::build($resolver, $fileVars, $environment);

        // --- error handling (registered before guards can throw) -------
        $logDir = rtrim((string)$config->get('storage.private'), '/') . '/logs';
        if (!is_dir($logDir)) @mkdir($logDir, 0775, true);
        (new ErrorHandler($context, $config->isDebug(), $logDir . '/php-error.log'))->register();

        // --- production guards ------------------------------------------
        $config->assertProductionSafe($environment);

        // --- security defaults -------------------------------------------
        $sessionCfg = new SessionConfig(
            (string)$config->get('session.name', 'AVOS_SESS'),
            (int)$config->get('session.hours', 12),
        );
        if ($sendHeaders && !$context->isCli) {
            self::securityHeaders($context->requestId);
            $sessionCfg->apply($_SERVER);
        }

        date_default_timezone_set((string)$config->get('app.timezone', 'UTC'));
        mb_internal_encoding('UTF-8');

        return self::$instance = new self($appRoot, $context, $resolver, $config, $environment, $sessionCfg);
    }

    /**
     * Load the private config in an isolated scope and return the variables it
     * defined. Isolation matters: the file must not be able to clobber kernel
     * locals or leak into the global scope.
     *
     * @return array<string,mixed>
     */
    private static function loadConfigFile(string $path): array
    {
        $load = static function (string $__f): array {
            require $__f;
            $vars = get_defined_vars();
            unset($vars['__f']);
            return $vars;
        };
        return $load($path);
    }

    private static function securityHeaders(string $requestId): void
    {
        if (headers_sent()) return;
        header('X-Request-Id: ' . $requestId);
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        header_remove('X-Powered-By');
        if (SessionConfig::isHttps($_SERVER)) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }

    /** Boot-time failure before the error handler exists. Leaks nothing. */
    private static function hardFail(RequestContext $ctx, string $message, bool $sendHeaders): never
    {
        if ($ctx->isCli) {
            fwrite(STDERR, "AV OS configuration error: {$message}\n");
            exit(1);
        }
        if ($sendHeaders && !headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            header('X-Request-Id: ' . $ctx->requestId);
        }
        echo json_encode(['ok' => false, 'data' => null, 'error' => [
            'code' => 'CONFIGURATION_ERROR', 'message' => $message, 'request_id' => $ctx->requestId,
        ]]);
        exit;
    }

    /** Lazily-created database connection. */
    public function db(): Connection
    {
        return $this->db ??= Connection::fromConfig($this->config);
    }

    /** Diagnostics: booleans and categories only — never a secret value. */
    public function safeStatus(): array
    {
        return [
            'app'        => 'AV OS',
            'request_id' => $this->context->requestId,
            'config'     => $this->config->safeReport(),
            'database'   => $this->db()->health(),
            'php'        => PHP_VERSION,
            'extensions' => [
                'pdo_mysql' => extension_loaded('pdo_mysql'),
                'mbstring'  => extension_loaded('mbstring'),
                'curl'      => extension_loaded('curl'),
                'gd'        => extension_loaded('gd'),
                'imagick'   => extension_loaded('imagick'),   // not assumed present
                'fileinfo'  => extension_loaded('fileinfo'),
            ],
        ];
    }

    public static function instance(): ?self { return self::$instance; }

    /** Test-only: forget the singleton so a fresh boot can be exercised. */
    public static function reset(): void { self::$instance = null; }
}
