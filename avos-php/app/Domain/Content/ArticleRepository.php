<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentType;

/**
 * Articles — essays and journal entries (Phase 3E §3E.4).
 *
 * `kind ∈ {essay, journal}` per DOMAIN-MODEL §3: one table, one template, one
 * discriminator. Categories and tags are n:m relational joins
 * (`article_categories`, `article_tags`) and are never embedded in `body`.
 */
final class ArticleRepository extends AbstractContentRepository
{
    public function type(): string { return ContentType::ARTICLE; }
    public function table(): string { return 'articles'; }

    public function writable(): array
    {
        return [
            'slug'            => 'string',
            'kind'            => 'string',
            'title'           => 'string',
            'excerpt'         => 'text',
            'body'            => 'json',
            'cover_media_id'  => 'ref',
            'author_id'       => 'ref',
            'reading_minutes' => 'int',
            'featured'        => 'bool',
            'publish_at'      => 'datetime',
        ];
    }

    public function versioned(): array
    {
        return ['slug', 'kind', 'title', 'excerpt', 'body', 'cover_media_id',
                'author_id', 'reading_minutes', 'featured', 'status', 'publish_at'];
    }

    public function publicFields(): array
    {
        return ['slug', 'kind', 'title', 'excerpt', 'body', 'reading_minutes',
                'featured', 'published_at'];
    }

    public function filterable(): array { return ['status', 'kind', 'featured', 'author_id']; }
    public function sortable(): array
    { return ['title', 'slug', 'kind', 'created_at', 'updated_at', 'published_at', 'reading_minutes']; }
    public function defaultSort(): string { return 'published_at'; }
    public function defaultOrder(): string { return 'desc'; }
}
