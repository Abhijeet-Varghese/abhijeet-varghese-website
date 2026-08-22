<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Content\ContentState;
use AvOS\Database\Connection;

/**
 * Shared persistence for the four content types (Phase 3E §3E.1).
 *
 * All SQL for content lives in this class and its subclasses — services never
 * write SQL and controllers never see a row. Column identifiers always come
 * from the subclass's declared maps, never from a request, so a caller cannot
 * contribute SQL text; values are bound without exception.
 *
 * Soft delete is the default everywhere (`deleted_at`), because DOMAIN-MODEL §3
 * requires a deleted page's route to become a 301 rather than a 404 — which is
 * impossible once the row is gone.
 */
abstract class AbstractContentRepository
{
    public function __construct(protected readonly Connection $db) {}

    /** Content type key (ContentType::*). */
    abstract public function type(): string;

    /** Physical table. Never interpolated from user input. */
    abstract public function table(): string;

    /**
     * Writable columns => coercion kind.
     * kind ∈ string|text|int|bool|json|datetime|ref
     * @return array<string,string>
     */
    abstract public function writable(): array;

    /**
     * Columns that make up a VERSION payload: the content itself. Excludes ids,
     * timestamps and anything an operator did not author. §3E.6: "Do not store
     * secrets in versions" — the safest way to guarantee that is an allow-list.
     * @return string[]
     */
    abstract public function versioned(): array;

    /** Columns a PUBLIC (unauthenticated) reader may see. @return string[] */
    abstract public function publicFields(): array;

    /** @return string[] */
    abstract public function filterable(): array;

    /** @return string[] */
    abstract public function sortable(): array;

    public function defaultSort(): string { return 'updated_at'; }

    /**
     * Default sort DIRECTION. QuerySpec defaults to `desc`, which is right for
     * "newest first" listings and WRONG for an ordered timeline — position 1
     * must come first. Declaring it per repository is what stops the public
     * Experience timeline from rendering backwards.
     */
    public function defaultOrder(): string { return 'desc'; }

    /** Does this type have a slug column? (experience does not) */
    public function hasSlug(): bool { return true; }

    // ------------------------------------------------------------- reads

    public function findById(int $id, bool $includeDeleted = false): ?array
    {
        $sql = 'SELECT * FROM ' . $this->table() . ' WHERE id = ?';
        if (!$includeDeleted) $sql .= ' AND deleted_at IS NULL';
        return $this->db->one($sql, [$id]);
    }

    public function findBySlug(string $slug, bool $includeDeleted = false): ?array
    {
        if (!$this->hasSlug()) return null;
        $sql = 'SELECT * FROM ' . $this->table() . ' WHERE slug = ?';
        if (!$includeDeleted) $sql .= ' AND deleted_at IS NULL';
        return $this->db->one($sql, [$slug]);
    }

    /** Published-only lookup. The public read path uses ONLY this. */
    public function findPublishedBySlug(string $slug): ?array
    {
        if (!$this->hasSlug()) return null;
        return $this->db->one(
            'SELECT * FROM ' . $this->table() . '
              WHERE slug = ? AND deleted_at IS NULL AND status = ?',
            [$slug, ContentState::PUBLISHED],
        );
    }

    public function findPublishedById(int $id): ?array
    {
        return $this->db->one(
            'SELECT * FROM ' . $this->table() . '
              WHERE id = ? AND deleted_at IS NULL AND status = ?',
            [$id, ContentState::PUBLISHED],
        );
    }

    /**
     * A slug is taken if ANY non-deleted row other than $exceptId holds it.
     * Drafts count: `uq_*_slug` is a table-level unique key, so two drafts with
     * the same slug are impossible regardless of publication state.
     */
    public function slugTaken(string $slug, int $exceptId = 0): bool
    {
        if (!$this->hasSlug()) return false;
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM ' . $this->table() . ' WHERE slug = ? AND id <> ?',
            [$slug, $exceptId],
        ) > 0;
    }

    /**
     * @param bool $publishedOnly forces the public visibility filter regardless
     *                            of any status filter the caller supplied
     * @return array{items:array,total:int}
     */
    public function paginate(QuerySpec $spec, Pagination $page, bool $publishedOnly = false): array
    {
        [$where, $bind] = $spec->whereClause();
        $where = $where === '' ? ' WHERE deleted_at IS NULL' : $where . ' AND deleted_at IS NULL';
        if ($publishedOnly) {
            $where .= ' AND status = ?';
            $bind[] = ContentState::PUBLISHED;
        }

        $total = (int)$this->db->scalar('SELECT COUNT(*) FROM ' . $this->table() . $where, $bind);

        $order = $spec->orderClause();
        if ($order === '') {
            $order = ' ORDER BY `' . $this->defaultSort() . '` ' . strtoupper($this->defaultOrder());
        }

        $rows = $this->db->all(
            'SELECT * FROM ' . $this->table() . $where . $order
            . ' LIMIT ' . $page->limit() . ' OFFSET ' . $page->offset(),
            $bind,
        );
        return ['items' => $rows, 'total' => $total];
    }

    // ------------------------------------------------------------- writes

    /** @param array<string,mixed> $data already validated and coerced */
    public function insert(array $data): int
    {
        $cols = [];
        $bind = [];
        foreach ($this->writable() as $col => $_kind) {
            if (!array_key_exists($col, $data)) continue;
            $cols[] = $col;
            $bind[] = $data[$col];
        }
        foreach (['created_by', 'updated_by', 'status', 'published_at'] as $extra) {
            if (array_key_exists($extra, $data) && !in_array($extra, $cols, true)) {
                $cols[] = $extra;
                $bind[] = $data[$extra];
            }
        }
        if ($cols === []) $cols[] = 'id';   // never reachable in practice

        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        $quoted = implode(',', array_map(static fn(string $c): string => '`' . $c . '`', $cols));

        $this->db->run(
            'INSERT INTO ' . $this->table() . ' (' . $quoted . ') VALUES (' . $placeholders . ')',
            $bind,
        );
        return (int)$this->db->pdo()->lastInsertId();
    }

    /** @param array<string,mixed> $data */
    public function update(int $id, array $data): void
    {
        $allowed = $this->writable() + [
            'status' => 'string', 'published_at' => 'datetime', 'updated_by' => 'int',
        ];
        $sets = [];
        $bind = [];
        foreach ($allowed as $col => $_kind) {
            if (!array_key_exists($col, $data)) continue;
            $sets[] = '`' . $col . '` = ?';
            $bind[] = $data[$col];
        }
        if ($sets === []) return;
        $bind[] = $id;
        $this->db->run(
            'UPDATE ' . $this->table() . ' SET ' . implode(', ', $sets) . ' WHERE id = ?',
            $bind,
        );
    }

    public function setStatus(int $id, string $status, ?string $publishedAt, ?int $actorId): void
    {
        $this->db->run(
            'UPDATE ' . $this->table() . ' SET status = ?, published_at = ?, updated_by = ? WHERE id = ?',
            [$status, $publishedAt, $actorId, $id],
        );
    }

    public function softDelete(int $id, ?int $actorId): void
    {
        $this->db->run(
            'UPDATE ' . $this->table() . ' SET deleted_at = UTC_TIMESTAMP(), updated_by = ? WHERE id = ?',
            [$actorId, $id],
        );
    }

    // -------------------------------------------------------- projections

    /**
     * The version payload: authored content only. Anything not on the
     * `versioned()` allow-list — ids, timestamps, actor columns — is excluded,
     * which is what makes "no secrets in versions" structural rather than a
     * promise.
     */
    public function versionPayload(array $row): array
    {
        $out = [];
        foreach ($this->versioned() as $col) {
            if (!array_key_exists($col, $row)) continue;
            $out[$col] = $this->decodeColumn($col, $row[$col]);
        }
        return $out;
    }

    /** Public projection — the ONLY shape an unauthenticated caller receives. */
    public function toPublic(array $row): array
    {
        $out = [];
        foreach ($this->publicFields() as $col) {
            if (!array_key_exists($col, $row)) continue;
            $out[$col] = $this->decodeColumn($col, $row[$col]);
        }
        return $out;
    }

    /** Authenticated management projection: the full row, JSON columns decoded. */
    public function toAdmin(array $row): array
    {
        $out = [];
        foreach ($row as $col => $value) {
            $out[$col] = $this->decodeColumn((string)$col, $value);
        }
        return $out;
    }

    protected function decodeColumn(string $col, mixed $value): mixed
    {
        $kind = $this->writable()[$col] ?? null;
        if ($kind === 'json') {
            // A builder-compatible block document: always a document, never null.
            return \AvOS\Content\ContentDocument::decode(is_string($value) ? $value : null);
        }
        if ($kind === 'jsonmap') {
            // Free-form key/value metadata: absence is meaningful, so NULL stays NULL.
            if (!is_string($value) || $value === '') return null;
            $d = json_decode($value, true);
            return is_array($d) ? $d : null;
        }
        if ($kind === 'bool') return (bool)$value;
        if ($kind === 'int' || $kind === 'ref') return $value === null ? null : (int)$value;
        if ($col === 'id') return (int)$value;
        return $value;
    }
}
