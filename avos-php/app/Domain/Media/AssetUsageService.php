<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Api\ApiException;

/**
 * "Where is this asset used?" (Phase 3F §3F.21).
 *
 * Two sources of truth are merged, because a reference can exist in either:
 *
 *  - `media_usage`  — the polymorphic table, for references inside content
 *                     documents and builder nodes
 *  - real FK columns — `projects.hero_media_id`, `articles.cover_media_id`,
 *                      `clients.logo_media_id`, `page_seo.og_media_id`,
 *                      `builder_node_devices.media_id`
 *
 * Consulting only `media_usage` would report a hero image as unused and let it
 * be deleted, which is exactly the class of bug the deletion guard exists to
 * prevent.
 */
final class AssetUsageService
{
    public function __construct(
        private readonly AssetRepository $assets,
        private readonly UsageRepository $usage,
    ) {}

    /**
     * @return array{
     *   media_id:int, total:int, tracked:int, structural:int,
     *   used_by:array<int,array<string,mixed>>, deletable:bool
     * }
     */
    public function forAsset(int $mediaId): array
    {
        if ($this->assets->findById($mediaId, includeDeleted: true) === null) {
            throw ApiException::notFound('Asset not found.');
        }
        $tracked = $this->usage->describeFor($mediaId);
        $structural = $this->usage->structuralFor($mediaId);

        // De-duplicate: a hero image can be recorded in both places.
        $seen = [];
        $merged = [];
        foreach ([...$structural, ...$tracked] as $ref) {
            $key = $ref['entity_type'] . ':' . $ref['entity_id'] . ':' . $ref['field'];
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $merged[] = $ref;
        }

        return [
            'media_id'   => $mediaId,
            'total'      => count($merged),
            'tracked'    => count($tracked),
            'structural' => count($structural),
            'used_by'    => $merged,
            'deletable'  => $merged === [],
        ];
    }

    /** Record a reference. Called by content services when they bind an asset. */
    public function attach(int $mediaId, string $entityType, int $entityId, string $field = ''): void
    {
        if ($this->assets->findById($mediaId) === null) {
            throw ApiException::validation(['media_id' => 'does not reference an existing asset']);
        }
        $this->usage->record($mediaId, $entityType, $entityId, $field);
    }

    /**
     * Remove a reference. Explicit only — nothing in the system detaches a
     * reference implicitly, because a silent detach is how a page loses its
     * image without anyone noticing (§3F.20).
     */
    public function detach(int $mediaId, string $entityType, int $entityId, string $field = ''): void
    {
        $this->usage->forget($mediaId, $entityType, $entityId, $field);
    }
}
