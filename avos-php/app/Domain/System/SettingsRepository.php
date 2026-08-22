<?php
declare(strict_types=1);
namespace AvOS\Domain\System;

use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Database\Connection;

/**
 * Repository example (Phase 3D §3D.15) — REAL, not a placeholder.
 *
 * Reads `site_settings`, which genuinely exists and is genuinely seeded. SQL
 * lives here and nowhere else; no HTTP concepts appear in this class.
 *
 * Note how QuerySpec is used: identifiers come from an allow-list the caller
 * declares, values are always bound. A request can never supply a column name.
 */
final class SettingsRepository
{
    public const FILTERABLE = ['value_type', 'is_public'];
    public const SORTABLE   = ['skey', 'value_type', 'updated_at'];

    public function __construct(private readonly Connection $db) {}

    /** @return array{items:array,total:int} */
    public function paginate(QuerySpec $spec, Pagination $page, bool $publicOnly): array
    {
        [$where, $bind] = $spec->whereClause();
        if ($publicOnly) {
            $where = $where === '' ? ' WHERE is_public = 1' : $where . ' AND is_public = 1';
        }

        $total = (int)$this->db->scalar("SELECT COUNT(*) FROM site_settings{$where}", $bind);

        $rows = $this->db->all(
            "SELECT skey, svalue, value_type, is_public, updated_at
               FROM site_settings{$where}{$spec->orderClause()}
              LIMIT {$page->limit()} OFFSET {$page->offset()}",
            $bind,
        );
        return ['items' => $rows, 'total' => $total];
    }

    public function findByKey(string $key, bool $publicOnly): ?array
    {
        $sql = 'SELECT skey, svalue, value_type, is_public, updated_at FROM site_settings WHERE skey = ?';
        if ($publicOnly) $sql .= ' AND is_public = 1';
        return $this->db->one($sql, [$key]);
    }

    public function countAll(): int
    { return (int)$this->db->scalar('SELECT COUNT(*) FROM site_settings'); }
}
