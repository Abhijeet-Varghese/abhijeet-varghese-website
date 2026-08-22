<?php
declare(strict_types=1);
namespace AvOS\Media\Image;

use AvOS\Media\Capabilities;

/**
 * Picks the best available image processor at runtime (Phase 3F §3F.8).
 *
 * Imagick → GD → Null, decided by PROVEN capability rather than by
 * `extension_loaded()`. A per-format fallback is also supported: if Imagick is
 * the primary driver but cannot encode AVIF while GD can, the AVIF derivative
 * is produced by GD instead of being silently dropped.
 */
final class ImageProcessorFactory
{
    private ?ImageProcessorInterface $primary = null;
    /** @var ImageProcessorInterface[] */
    private ?array $chain = null;

    public function primary(): ImageProcessorInterface
    {
        return $this->primary ??= match (true) {
            Capabilities::hasImagick() => new ImagickProcessor(),
            Capabilities::hasGd()      => new GdProcessor(),
            default                    => new NullImageProcessor(),
        };
    }

    /** @return ImageProcessorInterface[] every working driver, best first */
    public function chain(): array
    {
        if ($this->chain !== null) return $this->chain;
        $chain = [];
        if (Capabilities::hasImagick()) $chain[] = new ImagickProcessor();
        if (Capabilities::hasGd())      $chain[] = new GdProcessor();
        if ($chain === []) $chain[] = new NullImageProcessor();
        return $this->chain = $chain;
    }

    /** The first driver that can actually encode $format, or null. */
    public function forFormat(string $format): ?ImageProcessorInterface
    {
        foreach ($this->chain() as $p) {
            if ($p->supports($format)) return $p;
        }
        return null;
    }

    public function available(): bool
    {
        return $this->primary()->available();
    }
}
