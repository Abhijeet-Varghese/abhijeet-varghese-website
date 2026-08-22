<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentType;

/**
 * Pages (Phase 3E §3E.2).
 *
 * `content` holds a builder-compatible block document. `author_id`,
 * `created_by`, `updated_by` and `status` are relational columns and are
 * deliberately NOT duplicated inside that document (§3E.13).
 */
final class PageRepository extends AbstractContentRepository
{
    public function type(): string { return ContentType::PAGE; }
    public function table(): string { return 'pages'; }

    public function writable(): array
    {
        return [
            'slug'         => 'string',
            'title'        => 'string',
            'excerpt'      => 'text',
            'template'     => 'string',
            'content'      => 'json',
            'position'     => 'int',
            'publish_at'   => 'datetime',
            'unpublish_at' => 'datetime',
            'author_id'    => 'ref',
        ];
    }

    public function versioned(): array
    {
        return ['slug', 'title', 'excerpt', 'template', 'content', 'position', 'status',
                'publish_at', 'unpublish_at', 'author_id'];
    }

    public function publicFields(): array
    {
        // No internal ids, no actor columns, no deleted_at, no publish_at
        // (scheduling intent is internal), no updated_by.
        return ['slug', 'title', 'excerpt', 'template', 'content', 'published_at'];
    }

    public function filterable(): array { return ['status', 'template', 'author_id']; }
    public function sortable(): array   { return ['title', 'slug', 'position', 'created_at', 'updated_at', 'published_at']; }
    public function defaultSort(): string { return 'updated_at'; }
    public function defaultOrder(): string { return 'desc'; }
}
