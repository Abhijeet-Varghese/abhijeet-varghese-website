<?php
declare(strict_types=1);
namespace AvOS\Media\Image;

/**
 * The processor used when the host has neither Imagick nor GD (§3F.8).
 *
 * It produces nothing and says so. This is not a fake feature: with no
 * rasteriser installed there is genuinely no way to make a derivative, and the
 * correct behaviour is for uploads to keep working, the original to remain
 * available, and the asset's `processing` state to read `unavailable` with a
 * reason an operator can act on.
 *
 * Nothing anywhere claims derivatives exist because this class was used.
 */
final class NullImageProcessor implements ImageProcessorInterface
{
    public function name(): string { return 'none'; }

    public function available(): bool { return false; }

    public function supports(string $format): bool { return false; }

    /** Dimensions are still worth reporting — that needs no image library. */
    public function probe(string $bytes): ?array
    {
        $info = @getimagesizefromstring($bytes);
        if ($info === false) return null;
        return ['width' => (int)$info[0], 'height' => (int)$info[1], 'orientation' => 1];
    }

    public function encode(string $bytes, int $targetWidth, string $format, int $quality): ?string
    {
        return null;
    }
}
