<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentType;

/**
 * Experience — the ordered career timeline (Phase 3E §3E.5).
 *
 * DOMAIN-MODEL §4 fixes the semantics that must not change: "Timeline entries,
 * ordered, grouped by era. Order is meaningful." So `position` and `era` are
 * CONTENT, not presentation, and both are versioned.
 *
 * Experience has no slug and no page_route: it is rendered inside the single
 * `/experience` page, which is itself a `pages` row. Giving each entry a URL
 * would invent routes the live site does not have.
 */
final class ExperienceRepository extends AbstractContentRepository
{
    public function type(): string { return ContentType::EXPERIENCE; }
    public function table(): string { return 'experience'; }
    public function hasSlug(): bool { return false; }

    public function writable(): array
    {
        return [
            'era'          => 'string',
            'title'        => 'string',
            'organisation' => 'string',
            'summary'      => 'text',
            'content'      => 'json',
            'year_from'    => 'int',
            'year_to'      => 'int',
            'position'     => 'int',
            'author_id'    => 'ref',
        ];
    }

    public function versioned(): array
    {
        return ['era', 'title', 'organisation', 'summary', 'content',
                'year_from', 'year_to', 'position', 'status'];
    }

    public function publicFields(): array
    {
        return ['era', 'title', 'organisation', 'summary', 'content',
                'year_from', 'year_to', 'position'];
    }

    public function filterable(): array { return ['status', 'era']; }
    public function sortable(): array   { return ['position', 'year_from', 'year_to', 'title', 'updated_at']; }
    public function defaultSort(): string { return 'position'; }
    public function defaultOrder(): string { return 'asc'; }
}
