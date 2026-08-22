<?php
declare(strict_types=1);
namespace AvOS\Api;

/**
 * Safe filtering/sorting (Phase 3D §3D.8).
 *
 * A request may NEVER supply a column name or SQL fragment. The caller declares
 * an allow-list of filterable and sortable fields; anything outside it is
 * ignored (filters) or rejected (sort). Values are always returned as bound
 * parameters — this class never builds a value into SQL text.
 */
final class QuerySpec
{
    /** @var array<string,mixed> */
    private array $filters = [];
    private string $sortField = '';
    private string $sortOrder = 'desc';

    /**
     * @param array<int,string> $allowedFilters
     * @param array<int,string> $allowedSorts
     */
    public function __construct(
        private readonly array $allowedFilters = [],
        private readonly array $allowedSorts = [],
        private readonly string $defaultSort = '',
    ) { $this->sortField = $defaultSort; }

    public function apply(array $query): self
    {
        foreach ($query as $key => $value) {
            if (!in_array($key, $this->allowedFilters, true)) continue;      // silently ignored
            if (is_array($value)) continue;
            $this->filters[$key] = is_scalar($value) ? (string)$value : '';
        }

        $sort = (string)($query['sort'] ?? '');
        if ($sort !== '') {
            if (!in_array($sort, $this->allowedSorts, true)) {
                // Rejected loudly: a silently ignored sort is a confusing bug.
                throw ApiException::validation(
                    ['sort' => 'must be one of: ' . implode(', ', $this->allowedSorts)],
                );
            }
            $this->sortField = $sort;
        }

        $order = strtolower((string)($query['order'] ?? ''));
        if ($order !== '') {
            if (!in_array($order, ['asc', 'desc'], true)) {
                throw ApiException::validation(['order' => 'must be asc or desc']);
            }
            $this->sortOrder = $order;
        }
        return $this;
    }

    /** @return array<string,mixed> */
    public function filters(): array { return $this->filters; }

    /**
     * SQL fragment built ONLY from allow-listed identifiers. Values never
     * appear here — they are returned by bindings() for parameter binding.
     * @return array{0:string,1:array<int,mixed>}
     */
    public function whereClause(string $prefix = ''): array
    {
        if ($this->filters === []) return ['', []];
        $p = $prefix === '' ? '' : rtrim($prefix, '.') . '.';
        $parts = [];
        $bind = [];
        foreach ($this->filters as $field => $value) {
            $parts[] = '`' . $p . $field . '` = ?';   // identifier came from the allow-list
            $bind[] = $value;
        }
        return [' WHERE ' . implode(' AND ', $parts), $bind];
    }

    public function orderClause(string $prefix = ''): string
    {
        if ($this->sortField === '') return '';
        $p = $prefix === '' ? '' : rtrim($prefix, '.') . '.';
        return ' ORDER BY `' . $p . $this->sortField . '` ' . strtoupper($this->sortOrder);
    }

    public function describe(): array
    {
        return ['filters' => $this->filters, 'sort' => $this->sortField, 'order' => $this->sortOrder];
    }
}
