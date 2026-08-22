<?php
declare(strict_types=1);
namespace AvOS\Media\Storage;

/**
 * Storage contract (Phase 3F §3F.3).
 *
 * Deliberately small and filesystem-shaped so a future driver has an obvious
 * job. `LocalFilesystemStorage` is the only implementation and the only one
 * planned: the locked architecture forbids S3 and every other external store,
 * and an interface with one implementation is still worth having here because
 * it is what keeps filesystem calls out of the services.
 *
 * Every method takes a RELATIVE path. Resolution and containment are the
 * driver's responsibility, so no caller can hand it an absolute path.
 */
interface StorageInterface
{
    /** Absolute base directory. Used for diagnostics, never returned to a client. */
    public function root(): string;

    public function exists(string $relative): bool;

    /** @return array{bytes:int,mtime:int,mime:string}|null */
    public function metadata(string $relative): ?array;

    /** Write bytes atomically. Returns the relative path actually written. */
    public function put(string $relative, string $contents): string;

    /** Move a file already on disk (e.g. a PHP upload temp file) into storage. */
    public function putFile(string $relative, string $absoluteSourcePath, bool $move = true): string;

    public function get(string $relative): ?string;

    /** Open a read stream. The caller must fclose(). */
    public function readStream(string $relative);

    public function move(string $from, string $to): bool;

    public function copy(string $from, string $to): bool;

    /**
     * Link if the filesystem allows it, otherwise copy. Returns the method
     * actually used so the caller can report the truth rather than assume.
     * @return array{ok:bool,method:string}
     */
    public function linkOrCopy(string $from, string $to): array;

    public function delete(string $relative): bool;

    /** Absolute path to a fresh temporary file inside this store. */
    public function temporaryPath(string $extension = 'tmp'): string;

    /**
     * Absolute path for a relative one, or null when it escapes the root.
     * The ONLY place a relative path becomes an absolute one.
     */
    public function absolute(string $relative): ?string;

    /** @return string[] every stored file, relative, for orphan detection */
    public function listAll(string $prefix = ''): array;

    public function writable(): bool;
}
