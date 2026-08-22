<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\Pagination;
use AvOS\Database\Connection;

/**
 * The unified version store (Phase 3E §3E.6).
 *
 * ONE polymorphic table, `content_versions`, for every content type — Phase 2
 * decision. No per-type version table exists and none may be added.
 *
 * Two invariants this class enforces:
 *  - Versions are IMMUTABLE. There is no update() and no delete(). Restore
 *    creates a NEW version whose payload equals the restored one, so history is
 *    appended to and never rewritten (DOMAIN-MODEL §3).
 *  - Version numbers are allocated inside the caller's transaction using
 *    MAX(version)+1 guarded by `uq_cv (entity_type, entity_id, version)`. If two
 *    writers race, the unique key rejects the loser rather than silently
 *    overwriting a version.
 */
final class VersionRepository
{
    public function __construct(private readonly Connection $db) {}

    /**
     * Append a version. Returns the new version number.
     *
     * @param array<string,mixed> $payload content-only fields from
     *        AbstractContentRepository::versionPayload(), which is an
     *        allow-list — that is what keeps secrets out of version history.
     */
    public function append(
        string $entityType,
        int $entityId,
        array $payload,
        ?int $actorId,
        string $note = '',
    ): int {
        $json = (string)json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $checksum = hash('sha256', $json);
        $next = $this->nextVersion($entityType, $entityId);

        $this->db->run(
            'INSERT INTO content_versions
               (entity_type, entity_id, version, payload, checksum, note, created_by)
             VALUES (?,?,?,?,?,?,?)',
            [$entityType, $entityId, $next, $json, $checksum, substr($note, 0, 255), $actorId],
        );
        return $next;
    }

    public function nextVersion(string $entityType, int $entityId): int
    {
        return 1 + (int)$this->db->scalar(
            'SELECT COALESCE(MAX(version), 0) FROM content_versions WHERE entity_type = ? AND entity_id = ?',
            [$entityType, $entityId],
        );
    }

    /** Checksum of the payload as it would be stored — used by the change test. */
    public static function checksumOf(array $payload): string
    {
        return hash('sha256', (string)json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    public function latest(string $entityType, int $entityId): ?array
    {
        return $this->db->one(
            'SELECT * FROM content_versions WHERE entity_type = ? AND entity_id = ?
              ORDER BY version DESC LIMIT 1',
            [$entityType, $entityId],
        );
    }

    public function find(string $entityType, int $entityId, int $version): ?array
    {
        return $this->db->one(
            'SELECT * FROM content_versions WHERE entity_type = ? AND entity_id = ? AND version = ?',
            [$entityType, $entityId, $version],
        );
    }

    /** @return array{items:array,total:int} */
    public function paginate(string $entityType, int $entityId, Pagination $page): array
    {
        $total = (int)$this->db->scalar(
            'SELECT COUNT(*) FROM content_versions WHERE entity_type = ? AND entity_id = ?',
            [$entityType, $entityId],
        );
        $rows = $this->db->all(
            'SELECT id, entity_type, entity_id, version, checksum, note, created_by, created_at
               FROM content_versions
              WHERE entity_type = ? AND entity_id = ?
              ORDER BY version DESC
              LIMIT ' . $page->limit() . ' OFFSET ' . $page->offset(),
            [$entityType, $entityId],
        );
        return ['items' => $rows, 'total' => $total];
    }

    public function count(string $entityType, int $entityId): int
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM content_versions WHERE entity_type = ? AND entity_id = ?',
            [$entityType, $entityId],
        );
    }

    /** Version list projection. Never includes the payload — that needs a fetch. */
    public static function toSummary(array $row): array
    {
        return [
            'version'    => (int)$row['version'],
            'checksum'   => $row['checksum'],
            'note'       => $row['note'],
            'created_by' => $row['created_by'] === null ? null : (int)$row['created_by'],
            'created_at' => $row['created_at'],
        ];
    }

    public static function decodePayload(array $row): array
    {
        $d = json_decode((string)$row['payload'], true);
        return is_array($d) ? $d : [];
    }
}
