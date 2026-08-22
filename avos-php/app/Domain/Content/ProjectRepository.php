<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentType;

/**
 * Projects — including case studies (Phase 3E §3E.3).
 *
 * Phase 2 decision, restated because it is load-bearing: a case study IS a
 * project with `is_case_study = 1`. There is no `case_studies` table and this
 * repository must never grow one.
 *
 * `client_id` is a real FK, so a client is never written into `metadata`.
 */
final class ProjectRepository extends AbstractContentRepository
{
    public function type(): string { return ContentType::PROJECT; }
    public function table(): string { return 'projects'; }

    public function writable(): array
    {
        return [
            'slug'          => 'string',
            'title'         => 'string',
            'summary'       => 'text',
            'description'   => 'text',
            'client_id'     => 'ref',
            'is_case_study' => 'bool',
            'role'          => 'string',
            'practice'      => 'string',
            'year_from'     => 'int',
            'year_to'       => 'int',
            'hero_media_id' => 'ref',
            'template'      => 'string',
            'content'       => 'json',
            'metadata'      => 'jsonmap',
            'featured'      => 'bool',
            'position'      => 'int',
            'publish_at'    => 'datetime',
            'author_id'     => 'ref',
        ];
    }

    public function versioned(): array
    {
        return ['slug', 'title', 'summary', 'description', 'client_id', 'is_case_study',
                'role', 'practice', 'year_from', 'year_to', 'hero_media_id', 'template',
                'content', 'metadata', 'featured', 'position', 'status', 'publish_at', 'author_id'];
    }

    public function publicFields(): array
    {
        return ['slug', 'title', 'summary', 'description', 'is_case_study', 'role',
                'practice', 'year_from', 'year_to', 'template', 'content', 'metadata',
                'featured', 'published_at'];
    }

    public function filterable(): array
    { return ['status', 'is_case_study', 'featured', 'client_id', 'practice', 'template']; }

    public function sortable(): array
    { return ['title', 'slug', 'position', 'year_from', 'year_to', 'created_at', 'updated_at', 'published_at']; }

    public function defaultSort(): string { return 'position'; }
    public function defaultOrder(): string { return 'asc'; }
}
