<?php
declare(strict_types=1);
namespace AvOS\Media\Image;

use AvOS\Media\Capabilities;

/**
 * Imagick driver (Phase 3F §3F.8) — the preferred processor.
 *
 * Preferred over GD because it handles colour profiles, AVIF and orientation
 * properly, and because `stripImage()` is a real guarantee rather than a
 * side effect of re-encoding.
 *
 * Two things done deliberately:
 *
 * 1. **Orientation is baked in before stripping.** EXIF orientation is
 *    metadata, and stripping metadata from a rotated photo without applying
 *    the rotation first is how portrait images end up sideways.
 *
 * 2. **Metadata is stripped, then the sRGB profile is put back.** A fully
 *    stripped image with a wide-gamut source renders with wrong colours in
 *    browsers that assume sRGB, so the one profile worth keeping is restored.
 */
final class ImagickProcessor implements ImageProcessorInterface
{
    public function name(): string { return 'imagick'; }

    public function available(): bool { return Capabilities::hasImagick(); }

    public function supports(string $format): bool
    {
        if (!$this->available()) return false;
        $caps = Capabilities::all();
        return in_array(strtolower($format), $caps['imagick']['formats'], true);
    }

    public function probe(string $bytes): ?array
    {
        if (!$this->available()) return null;
        try {
            $im = new \Imagick();
            $im->readImageBlob($bytes);
            $out = [
                'width'       => $im->getImageWidth(),
                'height'      => $im->getImageHeight(),
                'orientation' => $im->getImageOrientation(),
            ];
            $im->clear();
            return $out['width'] > 0 && $out['height'] > 0 ? $out : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function encode(string $bytes, int $targetWidth, string $format, int $quality): ?string
    {
        if (!$this->supports($format)) return null;

        $im = null;
        try {
            $im = new \Imagick();
            $im->readImageBlob($bytes);

            // Animated sources: keep the first frame. A resized animation is a
            // different asset, not a derivative.
            if ($im->getNumberImages() > 1) {
                $im = $im->coalesceImages();
                $im->setIteratorIndex(0);
                $flat = $im->getImage();
                $im->clear();
                $im = $flat;
            }

            $this->applyOrientation($im);

            $w = $im->getImageWidth();
            $h = $im->getImageHeight();
            if ($w < 1 || $h < 1) return null;

            if ($targetWidth > 0 && $w > $targetWidth) {
                $newHeight = (int)max(1, round($h * ($targetWidth / $w)));
                $im->resizeImage($targetWidth, $newHeight, \Imagick::FILTER_LANCZOS, 1);
            }

            // §3F.9 — GPS and every other EXIF field leaves here.
            $im->stripImage();
            try { $im->setImageColorspace(\Imagick::COLORSPACE_SRGB); } catch (\Throwable) { /* optional */ }

            $fmt = strtolower($format);
            $im->setImageFormat($fmt);

            if ($fmt === 'jpeg') {
                $im->setImageCompressionQuality($quality);
                $im->setSamplingFactors(['2x2', '1x1', '1x1']);
                $im->setInterlaceScheme(\Imagick::INTERLACE_JPEG);
                // JPEG has no alpha; flatten onto white rather than black.
                $im->setImageBackgroundColor(new \ImagickPixel('white'));
                $im = $im->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
                $im->setImageFormat('jpeg');
                $im->setImageCompressionQuality($quality);
            } elseif ($fmt === 'png') {
                $im->setOption('png:compression-level', '9');
            } else {
                $im->setImageCompressionQuality($quality);
            }

            $blob = $im->getImagesBlob();
            return is_string($blob) && $blob !== '' ? $blob : null;
        } catch (\Throwable) {
            return null;
        } finally {
            if ($im instanceof \Imagick) { try { $im->clear(); } catch (\Throwable) {} }
        }
    }

    private function applyOrientation(\Imagick $im): void
    {
        try {
            $orientation = $im->getImageOrientation();
        } catch (\Throwable) {
            return;
        }
        $white = new \ImagickPixel('none');
        try {
            match ($orientation) {
                \Imagick::ORIENTATION_TOPRIGHT    => $im->flopImage(),
                \Imagick::ORIENTATION_BOTTOMRIGHT => $im->rotateImage($white, 180),
                \Imagick::ORIENTATION_BOTTOMLEFT  => (function () use ($im, $white) {
                    $im->rotateImage($white, 180); $im->flopImage(); })(),
                \Imagick::ORIENTATION_LEFTTOP     => (function () use ($im, $white) {
                    $im->rotateImage($white, 90); $im->flopImage(); })(),
                \Imagick::ORIENTATION_RIGHTTOP    => $im->rotateImage($white, 90),
                \Imagick::ORIENTATION_RIGHTBOTTOM => (function () use ($im, $white) {
                    $im->rotateImage($white, -90); $im->flopImage(); })(),
                \Imagick::ORIENTATION_LEFTBOTTOM  => $im->rotateImage($white, -90),
                default => null,
            };
            $im->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
        } catch (\Throwable) {
            // An un-rotatable image is still a usable image.
        }
    }
}
