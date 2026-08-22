<?php
declare(strict_types=1);
namespace AvOS\Content\Cache;

/**
 * Cache invalidation seam (Phase 3E §3E.17).
 *
 * The cache SYSTEM is Phase 3L. What Phase 3E owes it is the signal: the
 * content engine must be able to say "this changed" today, so that adding a
 * cache later is a wiring change rather than a hunt through every service for
 * missing invalidation calls.
 *
 * Three signals, matching the three things that can go stale:
 *   contentChanged   — a rendered entity
 *   routeChanged     — a URL appeared, moved or went away (sitemap, canonicals)
 *   navigationChanged— a menu that appears on every page
 */
interface CacheInvalidatorInterface
{
    public function contentChanged(string $entityType, int $entityId): void;

    public function routeChanged(string $path): void;

    public function navigationChanged(): void;
}
