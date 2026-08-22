<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Database\Connection;

/**
 * Derivative rows (Phase 3F §3F.10, §3F.11).
 *
 * The rule that makes format reporting truthful: **a row exists only when the
 * bytes exist.** There is no "pending" or "failed" variant record. If AVIF
 * encoding failed, no AVIF row is written, so every list this repository
 * returns is a list of derivatives that genuinely exist on disk.
 */
final class VariantRepository
{
    public function __construct(private readonly Connection $db) {}

    public function upsert(
        int $mediaId,
        string $purpose,
        string $format,
        int $width,
        int $height,
        int $bytes,
        string $hash,
        string $publicPath,
        string $storagePath,
    ): void {
        $this->db->run(
            'INSERT INTO media_variants
               (media_id, purpose, format, width, height, bytes, hash, public_path, storage_path)
             VALUES (?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               height = VALUES(height), bytes = VALUES(bytes), hash = VALUES(hash),
               public_path = VALUES(public_path), storage_path = VALUES(storage_path)',
            [$mediaId, $purpose, $format, $width, $height, $bytes, $hash, $publicPath, $storagePath],
        );
    }

    /** @return array<int,array<string,mixed>> */
    public function forMedia(int $mediaId): array
    {
        return $this->db->all(
            'SELECT * FROM media_variants WHERE media_id = ? ORDER BY width, format',
            [$mediaId],
        );
    }

    /** @return array<int,array<string,mixed>> */
    public function forMediaIds(array $mediaIds): array
    {
        if ($mediaIds === []) return [];
        $in = implode(',', array_fill(0, count($mediaIds), '?'));
        return $this->db->all(
            'SELECT * FROM media_variants WHERE media_id IN (' . $in . ') ORDER BY media_id, width, format',
            array_values(array_map('intval', $mediaIds)),
        );
    }

    public function deleteForMedia(int $mediaId): array
    {
        $rows = $this->forMedia($mediaId);
        $this->db->run('DELETE FROM media_variants WHERE media_id = ?', [$mediaId]);
        return $rows;
    }

    public function countForMedia(int $mediaId): int
    {
        return (int)$this->db->scalar('SELECT COUNT(*) FROM media_variants WHERE media_id = ?', [$mediaId]);
    }

    /** Client projection. Grouped by format so a <picture> is trivial to build. */
    public static function toPublicList(array $rows): array
    {
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'purpose' => (string)$r['purpose'],
                'format'  => (string)$r['format'],
                'width'   => $r['width'] === null ? null : (int)$r['width'],
                'height'  => $r['height'] === null ? null : (int)$r['height'],
                'bytes'   => (int)$r['bytes'],
                'url'     => \AvOS\Media\Storage\StorageManager::publicUrlFor((string)$r['public_path']),
            ];
        }
        return $out;
    }

    /** @return string[] the formats that ACTUALLY exist for this asset */
    public static function formatsPresent(array $rows): array
    {
        return array_values(array_unique(array_map(
            static fn(array $r): string => (string)$r['format'],
            $rows,
        )));
    }
}
