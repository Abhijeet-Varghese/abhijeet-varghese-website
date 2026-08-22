<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * Storage name and path generation (Phase 3F §3F.4, §3F.5).
 *
 * Hard rules, all testable:
 *  - the storage name is NEVER derived from the original filename
 *  - it NEVER contains a database id (ids are guessable and enumerate the library)
 *  - it NEVER contains an absolute or temporary path
 *  - the original filename survives only as metadata
 *
 * The name is `sha256(hash + secret-salt)` truncated to 24 hex characters. That
 * is deterministic — the same bytes always land in the same place, which makes
 * re-running an import idempotent — while remaining unguessable without the
 * salt, so a private asset's location cannot be derived from its content hash
 * even by someone who has the file.
 *
 * Layout (§3F.5), sharded so no directory ever holds the whole library:
 *
 *     media/2026/08/a3/a3f19c…d4.jpg
 *           ^    ^  ^
 *           |    |  +-- first 2 chars of the storage name (256 buckets)
 *           |    +----- month of upload
 *           +---------- year of upload
 *
 * Year/month keeps a growing library browsable by a human and makes date-scoped
 * backups trivial; the two-character bucket keeps any single directory well
 * under the point where ext4 lookups degrade.
 */
final class FileNaming
{
    private const NAME_LENGTH = 24;

    public function __construct(private readonly string $salt) {}

    /** Deterministic, unguessable, filename-independent. */
    public function storageName(string $contentHash, string $extension): string
    {
        $ext = strtolower(preg_replace('/[^a-z0-9]/i', '', $extension) ?? '');
        $name = substr(hash('sha256', $contentHash . '|' . $this->salt), 0, self::NAME_LENGTH);
        return $ext === '' ? $name : $name . '.' . $ext;
    }

    /** Relative directory: `media/YYYY/MM/xx`. */
    public function directory(string $storageName, ?int $timestamp = null): string
    {
        $ts = $timestamp ?? time();
        return sprintf('media/%s/%s/%s', gmdate('Y', $ts), gmdate('m', $ts), substr($storageName, 0, 2));
    }

    /** Full relative path used by the storage driver. */
    public function relativePath(string $contentHash, string $extension, ?int $timestamp = null): string
    {
        $name = $this->storageName($contentHash, $extension);
        return $this->directory($name, $timestamp) . '/' . $name;
    }

    /**
     * Derivative path, alongside the original but suffixed so the relationship
     * is obvious on disk during support work.
     *   a3f1…d4-hero-1280.webp
     */
    public function derivativePath(string $originalRelative, string $purpose, int $width, string $format): string
    {
        $dir = dirname($originalRelative);
        $base = pathinfo($originalRelative, PATHINFO_FILENAME);
        $p = preg_replace('/[^a-z0-9]/', '', strtolower($purpose)) ?? 'v';
        $f = preg_replace('/[^a-z0-9]/', '', strtolower($format)) ?? 'bin';
        return sprintf('%s/%s-%s-%d.%s', $dir, $base, $p, $width, $f);
    }

    /**
     * Sanitise the original filename for METADATA and Content-Disposition only.
     * Never used to build a path. Strips directory components, control bytes,
     * null bytes and traversal, and caps the length.
     */
    public static function sanitiseOriginalName(string $raw): string
    {
        $name = str_replace("\0", '', $raw);
        // basename() alone is not enough: a Windows-style path uses backslashes.
        $name = str_replace('\\', '/', $name);
        $name = basename($name);
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';
        $name = preg_replace('/[^\p{L}\p{N} ._\-()\[\]]/u', '_', $name) ?? '';
        $name = ltrim($name, '.');                 // no dotfiles
        $name = trim($name);
        if ($name === '') $name = 'upload';
        if (strlen($name) > 180) {
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $stem = substr(pathinfo($name, PATHINFO_FILENAME), 0, 160);
            $name = $ext === '' ? $stem : $stem . '.' . $ext;
        }
        return $name;
    }
}
