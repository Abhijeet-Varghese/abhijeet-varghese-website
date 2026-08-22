<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Media\AssetKind;
use AvOS\Media\Capabilities;
use AvOS\Media\DerivativeSpec;
use AvOS\Media\FileNaming;
use AvOS\Media\Image\ImageProcessorFactory;
use AvOS\Media\Storage\StorageManager;

/**
 * Derivative generation (Phase 3F §3F.10, §3F.11, §3F.13).
 *
 * The honesty rules, which are the point of this class:
 *
 *  - A variant row is written **only after** the bytes are on disk. A format
 *    that failed to encode produces no row, so the API can never advertise an
 *    AVIF that does not exist.
 *  - Failures are collected and reported per format, not swallowed. The caller
 *    gets a list of what worked AND what didn't and why.
 *  - The ORIGINAL is never touched. Crops are applied while generating
 *    derivatives; the source bytes are read and never written back (§3F.13).
 *
 * Derivatives always go to the PUBLIC disk, because a derivative of a private
 * asset would be a public copy of private content. Private assets therefore get
 * no derivatives at all — a deliberate limitation, documented, not a bug.
 */
final class DerivativeService
{
    public function __construct(
        private readonly StorageManager $storage,
        private readonly VariantRepository $variants,
        private readonly ImageProcessorFactory $processors,
        private readonly FileNaming $naming,
    ) {}

    /**
     * @return array{
     *   generated:int, formats:string[], purposes:string[],
     *   skipped:array<int,array{format:string,purpose:string,reason:string}>,
     *   driver:string, state:string, note:string
     * }
     */
    public function generate(array $media): array
    {
        $result = [
            'generated' => 0, 'formats' => [], 'purposes' => [], 'skipped' => [],
            'driver' => $this->processors->primary()->name(), 'state' => 'ready', 'note' => '',
        ];

        $kind = (string)$media['kind'];
        $ext = strtolower((string)$media['extension']);
        $id = (int)$media['id'];

        if (!AssetKind::isRasterisable($kind)) {
            $result['state'] = 'ready';
            $result['note'] = 'no derivatives apply to ' . AssetKind::label($kind);
            return $result;
        }
        if ($ext === 'svg') {
            // A vector already scales. Rasterising it would be strictly worse.
            $result['note'] = 'vector source needs no raster derivatives';
            return $result;
        }
        if ((string)$media['visibility'] === 'private') {
            $result['note'] = 'private assets get no public derivatives';
            return $result;
        }
        if (!$this->processors->available()) {
            $result['state'] = 'unavailable';
            $result['note'] = 'no image library on this host (Imagick and GD are both absent)';
            return $result;
        }

        $sourceRelative = (string)$media['storage_path'];
        $bytes = $this->storage->privateDisk()->get($sourceRelative);
        if ($bytes === null) {
            $result['state'] = 'failed';
            $result['note'] = 'the stored original could not be read';
            return $result;
        }

        // §3F.13 — a saved crop is applied to the DERIVATIVE input only.
        $crop = AssetRepository::decodeJson($media['crop'] ?? null);
        if (is_array($crop)) {
            $cropped = $this->applyCrop($bytes, $crop);
            if ($cropped !== null) $bytes = $cropped;
        }

        $probe = $this->processors->primary()->probe($bytes);
        $sourceWidth = (int)($probe['width'] ?? (int)($media['width'] ?? 0));
        if ($sourceWidth < 1) $sourceWidth = (int)($media['width'] ?? 0);
        if ($sourceWidth < 1) {
            $result['state'] = 'failed';
            $result['note'] = 'source width could not be determined';
            return $result;
        }

        $purposes = DerivativeSpec::rungsFor($sourceWidth);
        $formats = DerivativeSpec::formatsFor($ext);

        if ($formats === []) {
            $result['state'] = 'unavailable';
            $result['note'] = 'this host cannot encode any derivative format';
            return $result;
        }

        foreach ($purposes as $purpose) {
            $targetWidth = min(DerivativeSpec::width($purpose), $sourceWidth);
            $quality = DerivativeSpec::quality($purpose);

            foreach ($formats as $format) {
                $processor = $this->processors->forFormat($format);
                if ($processor === null) {
                    $result['skipped'][] = ['format' => $format, 'purpose' => $purpose,
                                            'reason' => 'no driver can encode ' . $format];
                    continue;
                }
                $encoded = $processor->encode($bytes, $targetWidth, $format, $quality);
                if ($encoded === null || $encoded === '') {
                    // Encoding failed for real. No row, and say so.
                    $result['skipped'][] = ['format' => $format, 'purpose' => $purpose,
                                            'reason' => $processor->name() . ' failed to encode ' . $format];
                    continue;
                }

                $dims = $processor->probe($encoded);
                $relative = $this->naming->derivativePath($sourceRelative, $purpose, $targetWidth, $format);

                try {
                    $this->storage->publicDisk()->put($relative, $encoded);
                } catch (\Throwable $e) {
                    $result['skipped'][] = ['format' => $format, 'purpose' => $purpose,
                                            'reason' => 'derivative could not be written to disk'];
                    continue;
                }

                $this->variants->upsert(
                    mediaId:    $id,
                    purpose:    $purpose,
                    format:     $format,
                    width:      (int)($dims['width'] ?? $targetWidth),
                    height:     (int)($dims['height'] ?? 0),
                    bytes:      strlen($encoded),
                    hash:       hash('sha256', $encoded),
                    publicPath: $relative,
                    storagePath: $relative,
                );
                $result['generated']++;
                $result['formats'][] = $format;
                $result['purposes'][] = $purpose;
            }
        }

        $result['formats'] = array_values(array_unique($result['formats']));
        $result['purposes'] = array_values(array_unique($result['purposes']));

        if ($result['generated'] === 0) {
            $result['state'] = 'failed';
            $result['note'] = 'no derivative could be produced';
        } elseif ($result['skipped'] !== []) {
            $result['note'] = sprintf('%d generated, %d skipped', $result['generated'], count($result['skipped']));
        }
        return $result;
    }

    /**
     * Delete every derivative for an asset, from disk and from the database.
     * Used on replace and on hard delete.
     */
    public function purge(int $mediaId): int
    {
        $rows = $this->variants->deleteForMedia($mediaId);
        $removed = 0;
        foreach ($rows as $r) {
            $path = (string)($r['public_path'] ?? '');
            if ($path !== '' && $this->storage->publicDisk()->delete($path)) $removed++;
        }
        return $removed;
    }

    /** Regenerate from the untouched original — the point of §3F.13. */
    public function regenerate(array $media): array
    {
        $this->purge((int)$media['id']);
        return $this->generate($media);
    }

    /**
     * Apply a saved crop to a copy of the source bytes. Returns null when the
     * crop is unusable, in which case the full frame is used rather than
     * failing the whole derivative run.
     *
     * Crop is stored normalised (0..1) so it survives the original being
     * replaced by a different-sized file.
     */
    private function applyCrop(string $bytes, array $crop): ?string
    {
        foreach (['x', 'y', 'width', 'height'] as $k) {
            if (!isset($crop[$k]) || !is_numeric($crop[$k])) return null;
        }
        $x = (float)$crop['x'];
        $y = (float)$crop['y'];
        $w = (float)$crop['width'];
        $h = (float)$crop['height'];
        if ($w <= 0 || $h <= 0 || $x < 0 || $y < 0 || $x + $w > 1.0001 || $y + $h > 1.0001) return null;

        if (Capabilities::hasImagick()) {
            try {
                $im = new \Imagick();
                $im->readImageBlob($bytes);
                $iw = $im->getImageWidth();
                $ih = $im->getImageHeight();
                $im->cropImage(
                    (int)max(1, round($w * $iw)), (int)max(1, round($h * $ih)),
                    (int)round($x * $iw), (int)round($y * $ih),
                );
                $im->setImagePage(0, 0, 0, 0);
                $out = $im->getImagesBlob();
                $im->clear();
                return is_string($out) && $out !== '' ? $out : null;
            } catch (\Throwable) {
                return null;
            }
        }
        if (Capabilities::hasGd()) {
            $src = @imagecreatefromstring($bytes);
            if ($src === false) return null;
            $iw = imagesx($src);
            $ih = imagesy($src);
            $rect = [
                'x' => (int)round($x * $iw), 'y' => (int)round($y * $ih),
                'width' => (int)max(1, round($w * $iw)), 'height' => (int)max(1, round($h * $ih)),
            ];
            $out = @imagecrop($src, $rect);
            imagedestroy($src);
            if ($out === false) return null;
            ob_start();
            @imagepng($out);
            $png = (string)ob_get_clean();
            imagedestroy($out);
            return $png !== '' ? $png : null;
        }
        return null;
    }
}
