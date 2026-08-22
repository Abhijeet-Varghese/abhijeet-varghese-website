<?php
declare(strict_types=1);
namespace AvOS\Content\Cache;

/**
 * Records invalidation signals instead of acting on them.
 *
 * Exists so the test suite can prove that publish/unpublish/restore actually
 * emit the signals Phase 3L will depend on. Without it, "invalidation is
 * wired" would be an assertion rather than evidence.
 */
final class RecordingCacheInvalidator implements CacheInvalidatorInterface
{
    /** @var array<int,array{0:string,1:string}> [signal, subject] */
    private array $signals = [];

    public function contentChanged(string $entityType, int $entityId): void
    { $this->signals[] = ['content', $entityType . ':' . $entityId]; }

    public function routeChanged(string $path): void
    { $this->signals[] = ['route', $path]; }

    public function navigationChanged(): void
    { $this->signals[] = ['navigation', '*']; }

    /** @return array<int,array{0:string,1:string}> */
    public function signals(): array { return $this->signals; }

    public function has(string $signal, string $subject): bool
    { return in_array([$signal, $subject], $this->signals, true); }

    public function reset(): void { $this->signals = []; }
}
