<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Database\Connection;

/**
 * Media persistence (Phase 3F §3F.1).
 *
 * All media SQL lives here. Column identifiers only ever come from the
 * allow-lists below, never from a request; values are always bound.
 *
 * The `publicFields()` projection is the same technique Phase 3E used for
 * content: an allow-list, so a new internal column cannot leak by default. Note
 * what is NOT on it — `storage_path`, `uploaded_by`, `meta`, `hash` — because
 * a public consumer has no business knowing where a file sits on disk, who
 * uploaded it, or its exact bytes for a dictionary attack.
 */
final class AssetRepository
{
    public const FILTERABLE = ['kind', 'visibility', 'processing', 'extension', 'mime', 'uploaded_by'];
    public const SORTABLE   = ['created_at', 'updated_at', 'bytes', 'original_name', 'kind', 'width', 'height'];

    public function __construct(private readonly Connection $db) {}

    // ------------------------------------------------------------- reads

    public function findById(int $id, bool $includeDeleted = false): ?array
    {
        $sql = 'SELECT * FROM media WHERE id = ?';
        if (!$includeDeleted) $sql .= ' AND deleted_at IS NULL';
        return $this->db->one($sql, [$id]);
    }

    public function findByHash(string $hash, bool $includeDeleted = true): ?array
    {
        $sql = 'SELECT * FROM media WHERE hash = ?';
        if (!$includeDeleted) $sql .= ' AND deleted_at IS NULL';
        return $this->db->one($sql, [$hash]);
    }

    public function findByStoragePath(string $path): ?array
    {
        return $this->db->one('SELECT * FROM media WHERE storage_path = ?', [$path]);
    }

    /** @return array{items:array,total:int} */
    public function paginate(QuerySpec $spec, Pagination $page, bool $publicOnly = false): array
    {
        [$where, $bind] = $spec->whereClause();
        $where = $where === '' ? ' WHERE deleted_at IS NULL' : $where . ' AND deleted_at IS NULL';
        if ($publicOnly) {
            $where .= " AND visibility = 'public'";
        }

        $total = (int)$this->db->scalar('SELECT COUNT(*) FROM media' . $where, $bind);

        $order = $spec->orderClause();
        if ($order === '') $order = ' ORDER BY `created_at` DESC';

        $rows = $this->db->all(
            'SELECT * FROM media' . $where . $order
            . ' LIMIT ' . $page->limit() . ' OFFSET ' . $page->offset(),
            $bind,
        );
        return ['items' => $rows, 'total' => $total];
    }

    /** Every non-deleted storage path — the DB side of orphan detection. */
    public function allStoragePaths(): array
    {
        // Soft-deleted rows are INCLUDED on purpose: their bytes are still on
        // disk and still owned, so they are not orphans.
        return array_column(
            $this->db->all("SELECT storage_path FROM media WHERE storage_path <> ''"),
            'storage_path',
        );
    }

    /** Every public_path currently claimed, including derivative paths. */
    public function allPublicPaths(): array
    {
        $a = array_column($this->db->all("SELECT public_path FROM media WHERE public_path <> ''"), 'public_path');
        $b = array_column($this->db->all("SELECT public_path FROM media_variants WHERE public_path <> ''"), 'public_path');
        return array_values(array_unique([...$a, ...$b]));
    }

    // ------------------------------------------------------------- writes

    public function insert(array $data): int
    {
        $cols = array_keys($data);
        $quoted = implode(',', array_map(static fn(string $c): string => '`' . $c . '`', $cols));
        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        $this->db->run(
            'INSERT INTO media (' . $quoted . ') VALUES (' . $placeholders . ')',
            array_values($data),
        );
        return (int)$this->db->pdo()->lastInsertId();
    }

    /** @param array<string,mixed> $data allow-listed by the service */
    public function update(int $id, array $data): void
    {
        if ($data === []) return;
        $sets = [];
        $bind = [];
        foreach ($data as $col => $value) {
            $sets[] = '`' . $col . '` = ?';
            $bind[] = $value;
        }
        $bind[] = $id;
        $this->db->run('UPDATE media SET ' . implode(', ', $sets) . ' WHERE id = ?', $bind);
    }

    public function setProcessing(int $id, string $state, string $note = ''): void
    {
        $this->db->run(
            'UPDATE media SET processing = ?, processing_note = ? WHERE id = ?',
            [$state, substr($note, 0, 255), $id],
        );
    }

    public function softDelete(int $id): void
    {
        $this->db->run('UPDATE media SET deleted_at = UTC_TIMESTAMP() WHERE id = ?', [$id]);
    }

    public function restore(int $id): void
    {
        $this->db->run('UPDATE media SET deleted_at = NULL WHERE id = ?', [$id]);
    }

    /** Hard delete. Only reachable once the usage check has passed. */
    public function hardDelete(int $id): void
    {
        $this->db->run('DELETE FROM media WHERE id = ?', [$id]);
    }

    // -------------------------------------------------------- projections

    /** The full authenticated view. `storage_path` is included for operators. */
    public function toAdmin(array $row, array $variants = [], array $usage = []): array
    {
        return [
            'id'              => (int)$row['id'],
            'kind'            => (string)$row['kind'],
            'visibility'      => (string)$row['visibility'],
            'original_name'   => (string)$row['original_name'],
            'extension'       => (string)$row['extension'],
            'mime'            => (string)$row['mime'],
            'bytes'           => (int)$row['bytes'],
            'hash'            => (string)$row['hash'],
            'width'           => $row['width'] === null ? null : (int)$row['width'],
            'height'          => $row['height'] === null ? null : (int)$row['height'],
            'duration_ms'     => $row['duration_ms'] === null ? null : (int)$row['duration_ms'],
            'focal'           => ['x' => (float)$row['focal_x'], 'y' => (float)$row['focal_y']],
            'crop'            => self::decodeJson($row['crop'] ?? null),
            'alt_text'        => (string)$row['alt_text'],
            'credit'          => (string)$row['credit'],
            'meta'            => self::decodeJson($row['meta'] ?? null),
            'processing'      => (string)$row['processing'],
            'processing_note' => (string)$row['processing_note'],
            'version'         => (int)$row['version'],
            'replaced_by'     => $row['replaced_by'] === null ? null : (int)$row['replaced_by'],
            'uploaded_by'     => $row['uploaded_by'] === null ? null : (int)$row['uploaded_by'],
            'url'             => $row['public_path'] !== ''
                                 ? \AvOS\Media\Storage\StorageManager::publicUrlFor((string)$row['public_path'])
                                 : null,
            'download_url'    => '/api/v1/media/' . (int)$row['id'] . '/download',
            'variants'        => $variants,
            'usage_count'     => count($usage),
            'created_at'      => $row['created_at'],
            'updated_at'      => $row['updated_at'],
            'deleted_at'      => $row['deleted_at'],
        ];
    }

    /**
     * The public view. No storage path, no hash, no uploader, no internal meta,
     * no processing note. A private asset must never be projected through this
     * method at all — the service refuses before it gets here.
     */
    public function toPublic(array $row, array $variants = []): array
    {
        return [
            'kind'        => (string)$row['kind'],
            'alt_text'    => (string)$row['alt_text'],
            'credit'      => (string)$row['credit'],
            'width'       => $row['width'] === null ? null : (int)$row['width'],
            'height'      => $row['height'] === null ? null : (int)$row['height'],
            'duration_ms' => $row['duration_ms'] === null ? null : (int)$row['duration_ms'],
            'focal'       => ['x' => (float)$row['focal_x'], 'y' => (float)$row['focal_y']],
            'url'         => $row['public_path'] !== ''
                             ? \AvOS\Media\Storage\StorageManager::publicUrlFor((string)$row['public_path'])
                             : null,
            'variants'    => $variants,
        ];
    }

    public static function decodeJson(mixed $raw): mixed
    {
        if (!is_string($raw) || $raw === '') return null;
        $d = json_decode($raw, true);
        return is_array($d) ? $d : null;
    }
}
