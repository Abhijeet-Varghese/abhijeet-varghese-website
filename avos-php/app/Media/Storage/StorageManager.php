<?php
declare(strict_types=1);
namespace AvOS\Media\Storage;

use AvOS\Config\Config;

/**
 * Two-disk storage manager (Phase 3F §3F.1, §3F.5, §3F.24).
 *
 * The whole privacy model lives in the fact that there are two disks and only
 * one of them is web-reachable:
 *
 *   PRIVATE  <storage>/media/…      outside the web root · ALL originals live here
 *   PUBLIC   <public>/assets/media/…  web-reachable · derivatives + published copies
 *
 * An original is never web-reachable, whatever its visibility. A PUBLIC asset
 * additionally gets a *published copy* in the public disk; a PRIVATE asset never
 * does, so there is no URL to guess — private is not "an unlisted URL", it is
 * "no URL exists". Private bytes only ever reach a client through the
 * authenticated download controller.
 *
 * Where the disks live is resolved from configuration, never hardcoded, and
 * deliberately NOT inside the legacy `public_html/` tree: writing there would
 * modify the legacy runtime, which every phase forbids.
 */
final class StorageManager
{
    public const PUBLIC_URL_PREFIX = '/assets/media';

    private ?LocalFilesystemStorage $private = null;
    private ?LocalFilesystemStorage $public = null;

    public function __construct(
        private readonly string $privateRoot,
        private readonly string $publicRoot,
    ) {}

    /**
     * Resolution order, most explicit first:
     *   AV_MEDIA_STORAGE_DIR / AV_MEDIA_PUBLIC_DIR   explicit override
     *   AV_PRIVATE_DIR/storage                        alongside the private config
     *   <appRoot>/storage                             development fallback
     *
     * The public disk defaults to `public-next/`, the Phase 3D non-legacy public
     * directory — never `public_html/`.
     */
    public static function fromConfig(Config $config, string $appRoot): self
    {
        $privateEnv = trim((string)(getenv('AV_MEDIA_STORAGE_DIR') ?: ''));
        $publicEnv  = trim((string)(getenv('AV_MEDIA_PUBLIC_DIR') ?: ''));

        if ($privateEnv === '') {
            $privateDir = trim((string)(getenv('AV_PRIVATE_DIR') ?: ''));
            $privateEnv = $privateDir !== ''
                ? rtrim($privateDir, '/') . '/storage'
                : rtrim($appRoot, '/') . '/storage';
        }
        if ($publicEnv === '') {
            $publicEnv = rtrim($appRoot, '/') . '/public-next';
        }
        unset($config);
        return new self(rtrim($privateEnv, '/'), rtrim($publicEnv, '/'));
    }

    /** Originals and anything that must never be fetched directly. */
    public function privateDisk(): LocalFilesystemStorage
    {
        if ($this->private === null) {
            $this->private = new LocalFilesystemStorage($this->privateRoot, plantDenyFile: true);
            $this->private->ensureRoot();
        }
        return $this->private;
    }

    /** Derivatives and published copies. Served by the web server, not PHP. */
    public function publicDisk(): LocalFilesystemStorage
    {
        if ($this->public === null) {
            // No deny file here — this disk is meant to be readable.
            $this->public = new LocalFilesystemStorage($this->publicRoot . '/assets', plantDenyFile: false);
            $this->public->ensureRoot();
        }
        return $this->public;
    }

    public function privateRoot(): string { return $this->privateRoot; }
    public function publicRoot(): string  { return $this->publicRoot; }

    /**
     * Public URL for a relative path on the public disk. Contains no `.php`,
     * no `.html` and no filesystem path — §3F.25. It is a plain static URL
     * under the existing clean-URL scheme, so no second URL engine exists.
     */
    public function publicUrl(string $relative): string
    {
        return self::PUBLIC_URL_PREFIX . '/' . ltrim($relative, '/');
    }

    /**
     * Copy (or hard-link) an original from the private disk to the public one.
     * Hard-linking avoids storing a second copy of every public asset, which
     * matters on shared hosting; it is safe precisely because originals are
     * immutable. Falls back to a real copy when the filesystem refuses, and
     * reports which happened rather than assuming.
     *
     * @return array{ok:bool,method:string,path:string}
     */
    public function publish(string $relative): array
    {
        $src = $this->privateDisk()->absolute($relative);
        if ($src === null || !is_file($src)) return ['ok' => false, 'method' => 'none', 'path' => ''];

        $dstAbs = $this->publicDisk()->absolute($relative);
        if ($dstAbs === null) return ['ok' => false, 'method' => 'none', 'path' => ''];

        $dir = dirname($dstAbs);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'method' => 'none', 'path' => ''];
        }
        if (is_file($dstAbs)) @unlink($dstAbs);

        if (@link($src, $dstAbs)) return ['ok' => true, 'method' => 'hardlink', 'path' => $relative];
        if (@copy($src, $dstAbs)) {
            @chmod($dstAbs, 0644);
            return ['ok' => true, 'method' => 'copy', 'path' => $relative];
        }
        return ['ok' => false, 'method' => 'none', 'path' => ''];
    }

    /** Withdraw a published copy. The private original is untouched. */
    public function unpublish(string $relative): bool
    {
        return $this->publicDisk()->delete($relative);
    }

    /** Health, for the capability endpoint and diagnostics. Paths are never sent to a client. */
    public function health(): array
    {
        $priv = $this->privateDisk();
        $pub = $this->publicDisk();
        return [
            'private_writable'  => $priv->writable(),
            'public_writable'   => $pub->writable(),
            'private_protected' => is_file($priv->root() . '/.htaccess'),
            // Proof the private store is not inside the public one — the
            // condition §3F.5 actually cares about.
            'private_outside_public' => !str_starts_with(
                rtrim((string)(realpath($priv->root()) ?: $priv->root()), '/') . '/',
                rtrim((string)(realpath($this->publicRoot) ?: $this->publicRoot), '/') . '/',
            ),
        ];
    }
}
