<?php
declare(strict_types=1);
namespace AvOS\Media\Storage;

use AvOS\Errors\AppException;

/**
 * Local filesystem storage (Phase 3F §3F.3).
 *
 * The only driver, and the only one the locked architecture permits. Designed
 * for Hostinger shared hosting: no shell, no extensions beyond core, no
 * assumptions about ownership, and directory modes that stay private.
 *
 * Three properties worth calling out:
 *
 * 1. **Containment is proven, not assumed.** Every relative path passes a strict
 *    pattern AND a realpath() containment check against the root. A path is
 *    resolved exactly once, here.
 *
 * 2. **Writes are atomic.** Bytes go to a temp file in the same directory and
 *    are then rename()d into place. A crashed or truncated write can therefore
 *    never leave a half-written asset that later looks valid — which matters
 *    because §3F.31 asks what happens when the disk fails mid-upload.
 *
 * 3. **Uploaded files are never executable.** Files are written 0644 and
 *    directories 0755, and a deny rule is planted in the private root, so even
 *    a misconfigured document root cannot run something out of here.
 */
final class LocalFilesystemStorage implements StorageInterface
{
    private const DIR_MODE  = 0755;
    private const FILE_MODE = 0644;

    /** Matches FileNaming's output: sharded dirs, one safe filename. */
    private const SAFE_RELATIVE = '#^[A-Za-z0-9_\-]+(/[A-Za-z0-9_\-]+)*(\.[A-Za-z0-9]{1,8})?$#';

    public function __construct(
        private readonly string $rootDir,
        private readonly bool $plantDenyFile = true,
    ) {}

    public function root(): string { return $this->rootDir; }

    /** Create the root on demand; harmless when it already exists. */
    public function ensureRoot(): void
    {
        if (!is_dir($this->rootDir)) {
            if (!@mkdir($this->rootDir, self::DIR_MODE, true) && !is_dir($this->rootDir)) {
                throw new AppException('Storage root could not be created.', 'STORAGE_UNAVAILABLE', 503);
            }
        }
        if ($this->plantDenyFile) $this->plantDeny();
    }

    /**
     * Defence in depth for the case where the private store ends up reachable
     * anyway — a misconfigured vhost, a symlink, a hosting migration. The
     * .htaccess covers Apache and LiteSpeed; index.html covers directory
     * listing on a server that ignores it.
     */
    private function plantDeny(): void
    {
        $ht = $this->rootDir . '/.htaccess';
        if (!is_file($ht)) {
            @file_put_contents($ht, implode("\n", [
                '# AV OS private media store — never web-reachable.',
                'Require all denied',
                '<IfModule mod_authz_core.c>',
                '  Require all denied',
                '</IfModule>',
                '<IfModule !mod_authz_core.c>',
                '  Order allow,deny',
                '  Deny from all',
                '</IfModule>',
                'php_flag engine off',
                '<FilesMatch "\.(php|phtml|php[0-9]|phar|cgi|pl|py|sh)$">',
                '  Require all denied',
                '</FilesMatch>',
                '',
            ]));
            @chmod($ht, self::FILE_MODE);
        }
        $idx = $this->rootDir . '/index.html';
        if (!is_file($idx)) { @file_put_contents($idx, ''); @chmod($idx, self::FILE_MODE); }
    }

    public function writable(): bool
    {
        return is_dir($this->rootDir) && is_writable($this->rootDir);
    }

    public function absolute(string $relative): ?string
    {
        if ($relative === '' || strlen($relative) > 400) return null;
        if (str_contains($relative, "\0")) return null;
        if (str_contains($relative, '..')) return null;
        if (str_contains($relative, '\\')) return null;
        if (str_contains($relative, '%')) return null;
        if (str_starts_with($relative, '/')) return null;
        if (preg_match(self::SAFE_RELATIVE, $relative) !== 1) return null;

        $base = realpath($this->rootDir);
        if ($base === false) return null;

        $candidate = $base . '/' . $relative;

        // The file may not exist yet (a write), so containment is checked
        // against the deepest EXISTING ancestor rather than the file itself.
        $probe = $candidate;
        while ($probe !== '' && !file_exists($probe)) {
            $parent = dirname($probe);
            if ($parent === $probe) break;
            $probe = $parent;
        }
        $realProbe = realpath($probe);
        if ($realProbe === false) return null;
        if ($realProbe !== $base && !str_starts_with($realProbe, $base . DIRECTORY_SEPARATOR)) return null;

        return $candidate;
    }

    public function exists(string $relative): bool
    {
        $abs = $this->absolute($relative);
        return $abs !== null && is_file($abs);
    }

    public function metadata(string $relative): ?array
    {
        $abs = $this->absolute($relative);
        if ($abs === null || !is_file($abs)) return null;

        $mime = 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $fi = finfo_open(FILEINFO_MIME_TYPE);
            if ($fi !== false) {
                $detected = @finfo_file($fi, $abs);
                finfo_close($fi);
                if (is_string($detected) && $detected !== '') $mime = $detected;
            }
        }
        return ['bytes' => (int)filesize($abs), 'mtime' => (int)filemtime($abs), 'mime' => $mime];
    }

    private function ensureDirFor(string $absolute): void
    {
        $dir = dirname($absolute);
        if (is_dir($dir)) return;
        if (!@mkdir($dir, self::DIR_MODE, true) && !is_dir($dir)) {
            throw new AppException('Storage directory could not be created.', 'STORAGE_UNAVAILABLE', 503);
        }
    }

    public function put(string $relative, string $contents): string
    {
        $abs = $this->absolute($relative);
        if ($abs === null) throw new AppException('Rejected storage path.', 'STORAGE_PATH_REJECTED', 400);
        $this->ensureDirFor($abs);

        // Atomic: write beside the target, then rename.
        $tmp = $abs . '.part-' . bin2hex(random_bytes(6));
        $written = @file_put_contents($tmp, $contents, LOCK_EX);
        if ($written === false || $written !== strlen($contents)) {
            @unlink($tmp);
            throw new AppException('Storage write failed.', 'STORAGE_WRITE_FAILED', 503);
        }
        @chmod($tmp, self::FILE_MODE);
        if (!@rename($tmp, $abs)) {
            @unlink($tmp);
            throw new AppException('Storage write could not be committed.', 'STORAGE_WRITE_FAILED', 503);
        }
        return $relative;
    }

    public function putFile(string $relative, string $absoluteSourcePath, bool $move = true): string
    {
        if (!is_file($absoluteSourcePath)) {
            throw new AppException('Source file is missing.', 'STORAGE_WRITE_FAILED', 503);
        }
        $abs = $this->absolute($relative);
        if ($abs === null) throw new AppException('Rejected storage path.', 'STORAGE_PATH_REJECTED', 400);
        $this->ensureDirFor($abs);

        $tmp = $abs . '.part-' . bin2hex(random_bytes(6));
        $ok = $move
            ? (@rename($absoluteSourcePath, $tmp) ?: @copy($absoluteSourcePath, $tmp))
            : @copy($absoluteSourcePath, $tmp);
        if (!$ok) {
            @unlink($tmp);
            throw new AppException('Storage write failed.', 'STORAGE_WRITE_FAILED', 503);
        }
        @chmod($tmp, self::FILE_MODE);
        if (!@rename($tmp, $abs)) {
            @unlink($tmp);
            throw new AppException('Storage write could not be committed.', 'STORAGE_WRITE_FAILED', 503);
        }
        if ($move && is_file($absoluteSourcePath)) @unlink($absoluteSourcePath);
        return $relative;
    }

    public function get(string $relative): ?string
    {
        $abs = $this->absolute($relative);
        if ($abs === null || !is_file($abs)) return null;
        $data = @file_get_contents($abs);
        return $data === false ? null : $data;
    }

    public function readStream(string $relative)
    {
        $abs = $this->absolute($relative);
        if ($abs === null || !is_file($abs)) return null;
        $fh = @fopen($abs, 'rb');
        return $fh === false ? null : $fh;
    }

    public function move(string $from, string $to): bool
    {
        $a = $this->absolute($from);
        $b = $this->absolute($to);
        if ($a === null || $b === null || !is_file($a)) return false;
        $this->ensureDirFor($b);
        return @rename($a, $b);
    }

    public function copy(string $from, string $to): bool
    {
        $a = $this->absolute($from);
        $b = $this->absolute($to);
        if ($a === null || $b === null || !is_file($a)) return false;
        $this->ensureDirFor($b);
        return @copy($a, $b) && @chmod($b, self::FILE_MODE);
    }

    public function linkOrCopy(string $from, string $to): array
    {
        $a = $this->absolute($from);
        $b = $this->absolute($to);
        if ($a === null || $b === null || !is_file($a)) return ['ok' => false, 'method' => 'none'];
        $this->ensureDirFor($b);
        if (is_file($b)) @unlink($b);
        if (@link($a, $b)) return ['ok' => true, 'method' => 'hardlink'];
        $ok = @copy($a, $b);
        if ($ok) @chmod($b, self::FILE_MODE);
        return ['ok' => $ok, 'method' => $ok ? 'copy' : 'none'];
    }

    public function delete(string $relative): bool
    {
        $abs = $this->absolute($relative);
        if ($abs === null || !is_file($abs)) return false;
        return @unlink($abs);
    }

    public function temporaryPath(string $extension = 'tmp'): string
    {
        $dir = $this->rootDir . '/tmp';
        if (!is_dir($dir)) @mkdir($dir, self::DIR_MODE, true);
        $ext = preg_replace('/[^a-z0-9]/i', '', $extension) ?: 'tmp';
        return $dir . '/av-' . bin2hex(random_bytes(10)) . '.' . $ext;
    }

    public function listAll(string $prefix = ''): array
    {
        $base = realpath($this->rootDir);
        if ($base === false) return [];
        $start = $prefix === '' ? $base : $base . '/' . trim($prefix, '/');
        if (!is_dir($start)) return [];

        $out = [];
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($start, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY,
        );
        foreach ($it as $file) {
            if (!$file->isFile()) continue;
            $rel = ltrim(str_replace($base, '', $file->getPathname()), '/');
            // Housekeeping artefacts are not assets.
            if (str_starts_with($rel, 'tmp/')) continue;
            if (str_contains($rel, '.part-')) continue;
            $name = basename($rel);
            if ($name === '.htaccess' || $name === 'index.html' || $name === '.gitignore') continue;
            $out[] = $rel;
        }
        sort($out);
        return $out;
    }

    /** Remove stale `.part-*` files. Safe to call routinely. */
    public function sweepPartials(int $olderThanSeconds = 3600): int
    {
        $base = realpath($this->rootDir);
        if ($base === false) return 0;
        $removed = 0;
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY,
        );
        foreach ($it as $file) {
            if (!$file->isFile() || !str_contains($file->getFilename(), '.part-')) continue;
            if (time() - $file->getMTime() < $olderThanSeconds) continue;
            if (@unlink($file->getPathname())) $removed++;
        }
        return $removed;
    }
}
