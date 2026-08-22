<?php
declare(strict_types=1);
namespace AvOS\Content\Cache;

/**
 * The default invalidator until Phase 3L ships (Phase 3E §3E.17).
 *
 * This is a no-op and says so. It is NOT a fake feature: there is no cache to
 * invalidate yet, so doing nothing is the correct and complete behaviour. No
 * control anywhere in the product claims caching works because this class
 * exists.
 */
final class NullCacheInvalidator implements CacheInvalidatorInterface
{
    public function contentChanged(string $entityType, int $entityId): void {}

    public function routeChanged(string $path): void {}

    public function navigationChanged(): void {}
}
