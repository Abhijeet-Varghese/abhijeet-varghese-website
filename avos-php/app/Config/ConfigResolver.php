<?php
declare(strict_types=1);
namespace AvOS\Config;

/**
 * Private configuration resolver (Phase 2 contract §12, SECURITY-ARCHITECTURE §6).
 *
 * Locates the configuration file that carries secrets. The whole point is that
 * this file must live OUTSIDE the web root, because a root-level config returns
 * HTTP 200 the moment the .htaccess protecting it is lost — proven in the §88
 * security phase.
 *
 * Priority:
 *   1. AV_CONFIG_FILE            explicit absolute path (hPanel env var)
 *   2. AV_PRIVATE_DIR/config.local.php
 *   3. nearest NON-web-exposed ancestor .../avos-private/config.local.php
 *   4. AV_ROOT/config.local.php  LEGACY, inside the web root — deprecated
 *
 * (4) exists only so an un-migrated deployment keeps serving; it is reported as
 * insecure and refused outright in strict mode.
 */
final class ConfigResolver
{
    public const SOURCE_ENV_FILE  = 'AV_CONFIG_FILE';
    public const SOURCE_PRIVATE   = 'AV_PRIVATE_DIR';
    public const SOURCE_ANCESTOR  = 'ancestor:avos-private';
    public const SOURCE_LEGACY    = 'legacy-in-webroot';
    public const SOURCE_NONE      = 'none';
    public const SOURCE_INVALID   = 'AV_CONFIG_FILE_INVALID';

    /** Directory names a web server publishes. Conservative by design. */
    private const WEB_SEGMENTS = ['public_html', 'htdocs', 'www', 'public'];

    private string $path = '';
    private string $source = self::SOURCE_NONE;
    private string $privateDir = '';
    private string $privateSource = self::SOURCE_NONE;

    public function __construct(private readonly string $appRoot) {}

    /**
     * A path is treated as web-exposed when it sits at/below the application
     * root, or contains a published directory segment.
     *
     * This matters concretely: for the staging web root /public_html/next,
     * dirname(appRoot) is /public_html — still served. A naive "one level up"
     * resolver would pick it and call it private.
     */
    public function isWebExposed(string $path): bool
    {
        $p = rtrim(str_replace('\\', '/', $path), '/');
        $r = rtrim(str_replace('\\', '/', $this->appRoot), '/');
        if ($p === $r || str_starts_with($p . '/', $r . '/')) return true;
        foreach (self::WEB_SEGMENTS as $seg) {
            if (preg_match('#(^|/)' . preg_quote($seg, '#') . '(/|$)#', $p) === 1) return true;
        }
        return false;
    }

    /** Resolve the private storage root (logs, uploads, backups, cache). */
    public function resolvePrivateDir(): string
    {
        if ($this->privateDir !== '') return $this->privateDir;

        $env = (string)(getenv('AV_PRIVATE_DIR') ?: '');
        if ($env !== '' && is_dir($env)) {
            $this->privateDir = rtrim($env, '/');
            $this->privateSource = self::SOURCE_PRIVATE;
            return $this->privateDir;
        }

        $dir = $this->appRoot;
        for ($i = 0; $i < 6; $i++) {
            $parent = dirname($dir);
            if ($parent === $dir) break;
            $dir = $parent;
            $candidate = $dir . '/avos-private';
            if (is_dir($candidate) && !$this->isWebExposed($candidate)) {
                $this->privateDir = $candidate;
                $this->privateSource = self::SOURCE_ANCESTOR;
                return $this->privateDir;
            }
        }

        $this->privateDir = $this->appRoot . '/storage';   // legacy, in web root
        $this->privateSource = self::SOURCE_LEGACY;
        return $this->privateDir;
    }

    /**
     * Resolve the configuration file path. Does NOT load it — loading is the
     * Config object's job, so resolution stays testable in isolation.
     */
    public function resolve(): string
    {
        if ($this->source !== self::SOURCE_NONE) return $this->path;

        $envFile = (string)(getenv('AV_CONFIG_FILE') ?: '');
        if ($envFile !== '') {
            if (is_file($envFile) && is_readable($envFile)) {
                $this->path = $envFile;
                $this->source = self::SOURCE_ENV_FILE;
            } else {
                // An explicit but broken setting must be loud, never silently
                // downgraded to a weaker source.
                $this->source = self::SOURCE_INVALID;
            }
            return $this->path;
        }

        $priv = $this->resolvePrivateDir();
        $candidates = [];
        if ($this->privateSource !== self::SOURCE_LEGACY) {
            // Label with the TRUE origin of the private dir (env vs ancestor),
            // otherwise diagnostics misreport how the config was found.
            $candidates[] = [$priv . '/config.local.php', $this->privateSource];
        }
        $dir = $this->appRoot;
        for ($i = 0; $i < 6; $i++) {
            $parent = dirname($dir);
            if ($parent === $dir) break;
            $dir = $parent;
            $candidates[] = [$dir . '/avos-private/config.local.php', self::SOURCE_ANCESTOR];
            $candidates[] = [$dir . '/config.local.php', self::SOURCE_ANCESTOR];
        }
        $candidates[] = [$this->appRoot . '/config.local.php', self::SOURCE_LEGACY];

        foreach ($candidates as [$file, $src]) {
            if (!is_file($file)) continue;
            if ($src !== self::SOURCE_LEGACY && $this->isWebExposed($file)) continue;
            $this->path = $file;
            $this->source = $src;
            return $this->path;
        }
        return '';
    }

    public function source(): string { $this->resolve(); return $this->source; }
    public function privateSource(): string { $this->resolvePrivateDir(); return $this->privateSource; }
    public function isConfigOutsideWebRoot(): bool
    {
        $p = $this->resolve();
        return $p !== '' && !$this->isWebExposed($p);
    }
    public function isPrivateDirOutsideWebRoot(): bool
    {
        return !$this->isWebExposed($this->resolvePrivateDir());
    }
}
