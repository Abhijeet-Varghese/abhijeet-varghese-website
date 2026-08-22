<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Database\Connection;

/**
 * Asset ↔ content relationships (Phase 3F §3F.20, §3F.21).
 *
 * `media_usage` is polymorphic by approved design: usage spans pages, projects,
 * articles and builder nodes, and a foreign key per entity type would mean a
 * column per type. Integrity is enforced here and by the usage check in
 * AssetService, which is why deletion consults this table first.
 *
 * The join back to the owning row is a UNION rather than four round trips, so
 * "where is this asset used?" is one query however large the library gets.
 */
final class UsageRepository
{
    /** entity_type => [table, title column]. Only approved content types. */
    private const ENTITIES = [
        'page'         => ['pages',         'title'],
        'project'      => ['projects',      'title'],
        'article'      => ['articles',      'title'],
        'experience'   => ['experience',    'title'],
        'client'       => ['clients',       'name'],
        'testimonial'  => ['testimonials',  'author_name'],
        'builder_node' => ['builder_nodes', 'name'],
    ];

    public function __construct(private readonly Connection $db) {}

    public function record(int $mediaId, string $entityType, int $entityId, string $field = ''): void
    {
        if (!isset(self::ENTITIES[$entityType])) return;   // never invent a relationship
        $this->db->run(
            'INSERT IGNORE INTO media_usage (media_id, entity_type, entity_id, field) VALUES (?,?,?,?)',
            [$mediaId, $entityType, $entityId, substr($field, 0, 80)],
        );
    }

    public function forget(int $mediaId, string $entityType, int $entityId, string $field = ''): void
    {
        $this->db->run(
            'DELETE FROM media_usage WHERE media_id = ? AND entity_type = ? AND entity_id = ? AND field = ?',
            [$mediaId, $entityType, $entityId, $field],
        );
    }

    public function countFor(int $mediaId): int
    {
        return (int)$this->db->scalar('SELECT COUNT(*) FROM media_usage WHERE media_id = ?', [$mediaId]);
    }

    /** @return array<int,array<string,mixed>> raw rows */
    public function rowsFor(int $mediaId): array
    {
        return $this->db->all(
            'SELECT * FROM media_usage WHERE media_id = ? ORDER BY entity_type, entity_id',
            [$mediaId],
        );
    }

    /**
     * §3F.21 — the answer the future Asset Manager needs:
     * content type · content id · content title · relationship · context.
     *
     * @return array<int,array{entity_type:string,entity_id:int,title:string,field:string,context:string,exists:bool}>
     */
    public function describeFor(int $mediaId): array
    {
        $rows = $this->rowsFor($mediaId);
        if ($rows === []) return [];

        // Group ids per type so each table is queried at most once.
        $byType = [];
        foreach ($rows as $r) $byType[(string)$r['entity_type']][] = (int)$r['entity_id'];

        $titles = [];
        foreach ($byType as $type => $ids) {
            if (!isset(self::ENTITIES[$type])) continue;
            [$table, $titleColumn] = self::ENTITIES[$type];
            $ids = array_values(array_unique($ids));
            $in = implode(',', array_fill(0, count($ids), '?'));
            // Table and column come from the const map, never from a request.
            $found = $this->db->all(
                'SELECT id, `' . $titleColumn . '` AS title FROM `' . $table . '` WHERE id IN (' . $in . ')',
                $ids,
            );
            foreach ($found as $f) $titles[$type . ':' . (int)$f['id']] = (string)$f['title'];
        }

        $out = [];
        foreach ($rows as $r) {
            $type = (string)$r['entity_type'];
            $id = (int)$r['entity_id'];
            $key = $type . ':' . $id;
            $out[] = [
                'entity_type' => $type,
                'entity_id'   => $id,
                'title'       => $titles[$key] ?? '',
                'field'       => (string)$r['field'],
                'context'     => self::context($type, (string)$r['field']),
                // A reference whose owner has vanished is itself worth seeing.
                'exists'      => array_key_exists($key, $titles),
            ];
        }
        return $out;
    }

    private static function context(string $entityType, string $field): string
    {
        $label = str_replace('_', ' ', $entityType);
        return $field === '' ? $label : $label . ' · ' . str_replace('_', ' ', $field);
    }

    /** Every media id referenced by anything — used by orphan detection. */
    public function referencedMediaIds(): array
    {
        return array_map('intval', array_column(
            $this->db->all('SELECT DISTINCT media_id FROM media_usage'),
            'media_id',
        ));
    }

    /**
     * Usage implied by a real FK column rather than by media_usage. These are
     * genuine references and must block deletion just as firmly.
     * @return array<int,array{entity_type:string,entity_id:int,title:string,field:string,context:string,exists:bool}>
     */
    public function structuralFor(int $mediaId): array
    {
        $checks = [
            ['projects', 'hero_media_id', 'project', 'title', 'hero image'],
            ['articles', 'cover_media_id', 'article', 'title', 'cover image'],
            ['clients', 'logo_media_id', 'client', 'name', 'logo'],
            ['page_seo', 'og_media_id', 'page_seo', 'title', 'open graph image'],
            ['builder_node_devices', 'media_id', 'builder_node_device', 'device', 'responsive override'],
        ];
        $out = [];
        foreach ($checks as [$table, $column, $type, $titleColumn, $context]) {
            $rows = $this->db->all(
                'SELECT id, `' . $titleColumn . '` AS title FROM `' . $table . '` WHERE `' . $column . '` = ?',
                [$mediaId],
            );
            foreach ($rows as $r) {
                $out[] = [
                    'entity_type' => $type,
                    'entity_id'   => (int)$r['id'],
                    'title'       => (string)$r['title'],
                    'field'       => $column,
                    'context'     => $context,
                    'exists'      => true,
                ];
            }
        }
        return $out;
    }
}
