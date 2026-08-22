<?php
declare(strict_types=1);
namespace AvOS\Media\Image;

use AvOS\Media\Capabilities;

/**
 * GD driver (Phase 3F §3F.8) — the fallback.
 *
 * Used only when Imagick is absent, which is a realistic shared-hosting
 * configuration. GD is weaker (no colour management, clumsy alpha) but it is
 * present on virtually every PHP build, so it is the difference between a
 * degraded image pipeline and no image pipeline.
 *
 * Metadata stripping is free here: GD decodes to a raw bitmap and re-encodes,
 * so no EXIF block survives. Orientation must therefore be read from the
 * SOURCE bytes before decoding, which is what `applyOrientation()` does.
 */
final class GdProcessor implements ImageProcessorInterface
{
    public function name(): string { return 'gd'; }

    public function available(): bool { return Capabilities::hasGd(); }

    public function supports(string $format): bool
    {
        if (!$this->available()) return false;
        return in_array(strtolower($format), Capabilities::all()['gd']['formats'], true);
    }

    public function probe(string $bytes): ?array
    {
        $info = @getimagesizefromstring($bytes);
        if ($info === false) {
            if (!$this->available()) return null;
            $img = @imagecreatefromstring($bytes);
            if ($img === false) return null;
            $out = ['width' => imagesx($img), 'height' => imagesy($img), 'orientation' => 1];
            imagedestroy($img);
            return $out;
        }
        return [
            'width'       => (int)$info[0],
            'height'      => (int)$info[1],
            'orientation' => self::readOrientation($bytes),
        ];
    }

    public function encode(string $bytes, int $targetWidth, string $format, int $quality): ?string
    {
        if (!$this->supports($format)) return null;

        $src = @imagecreatefromstring($bytes);
        if ($src === false) return null;

        try {
            $src = self::applyOrientation($src, self::readOrientation($bytes));

            $w = imagesx($src);
            $h = imagesy($src);
            if ($w < 1 || $h < 1) return null;

            $newW = ($targetWidth > 0 && $w > $targetWidth) ? $targetWidth : $w;
            $newH = (int)max(1, round($h * ($newW / $w)));

            $dst = imagecreatetruecolor($newW, $newH);
            if ($dst === false) return null;

            $fmt = strtolower($format);
            if (in_array($fmt, ['png', 'webp', 'avif'], true)) {
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
            } else {
                // JPEG cannot hold alpha; flatten onto white, not black.
                $white = imagecolorallocate($dst, 255, 255, 255);
                imagefilledrectangle($dst, 0, 0, $newW, $newH, $white);
            }

            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

            ob_start();
            $ok = match ($fmt) {
                'jpeg' => @imagejpeg($dst, null, $quality),
                'png'  => @imagepng($dst, null, 9),
                'webp' => @imagewebp($dst, null, $quality),
                'avif' => @imageavif($dst, null, $quality),
                'gif'  => @imagegif($dst),
                default => false,
            };
            $out = (string)ob_get_clean();
            imagedestroy($dst);

            return ($ok && $out !== '') ? $out : null;
        } catch (\Throwable) {
            return null;
        } finally {
            if ($src instanceof \GdImage) @imagedestroy($src);
        }
    }

    /** EXIF orientation from the source bytes, before GD discards it. */
    private static function readOrientation(string $bytes): int
    {
        if (!function_exists('exif_read_data')) return 1;
        // exif_read_data needs a stream; a data:// wrapper avoids a temp file.
        $uri = 'data://image/jpeg;base64,' . base64_encode($bytes);
        $data = @exif_read_data($uri);
        $o = is_array($data) ? (int)($data['Orientation'] ?? 1) : 1;
        return $o >= 1 && $o <= 8 ? $o : 1;
    }

    private static function applyOrientation(\GdImage $img, int $orientation): \GdImage
    {
        if ($orientation === 1) return $img;
        $rotate = static function (\GdImage $i, float $deg): \GdImage {
            $r = @imagerotate($i, $deg, 0);
            if ($r === false) return $i;
            imagedestroy($i);
            return $r;
        };
        $flip = static function (\GdImage $i, int $mode): \GdImage {
            @imageflip($i, $mode);
            return $i;
        };
        return match ($orientation) {
            2 => $flip($img, IMG_FLIP_HORIZONTAL),
            3 => $rotate($img, 180),
            4 => $flip($img, IMG_FLIP_VERTICAL),
            5 => $flip($rotate($img, -90), IMG_FLIP_HORIZONTAL),
            6 => $rotate($img, -90),
            7 => $flip($rotate($img, 90), IMG_FLIP_HORIZONTAL),
            8 => $rotate($img, 90),
            default => $img,
        };
    }
}
