<?php
declare(strict_types=1);
namespace AvOS\Api;

/**
 * Standard pagination contract (Phase 3D §3D.7).
 *
 * MAX_PER_PAGE is a hard ceiling: no API — public or admin — may return an
 * unbounded result set. `per_page` is clamped rather than rejected so a client
 * asking for too much still gets a valid page.
 */
final class Pagination
{
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE     = 100;

    private function __construct(
        public readonly int $page,
        public readonly int $perPage,
    ) {}

    public static function fromQuery(array $query): self
    {
        $page = (int)($query['page'] ?? 1);
        $per  = (int)($query['per_page'] ?? self::DEFAULT_PER_PAGE);
        return new self(
            max(1, $page),
            max(1, min(self::MAX_PER_PAGE, $per <= 0 ? self::DEFAULT_PER_PAGE : $per)),
        );
    }

    public function offset(): int { return ($this->page - 1) * $this->perPage; }
    public function limit(): int { return $this->perPage; }

    /** @param array<int,mixed> $items */
    public function envelope(array $items, int $total): array
    {
        $totalPages = $this->perPage > 0 ? (int)ceil($total / $this->perPage) : 0;
        return [
            'items' => $items,
            'pagination' => [
                'page'        => $this->page,
                'per_page'    => $this->perPage,
                'total'       => $total,
                'total_pages' => $totalPages,
                'has_more'    => $this->page < $totalPages,
            ],
        ];
    }
}
