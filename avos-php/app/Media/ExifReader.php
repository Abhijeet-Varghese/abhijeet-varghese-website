<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * EXIF extraction with a hard privacy rule (Phase 3F §3F.9).
 *
 * "Do not expose EXIF/GPS information publicly."
 *
 * Two separate guarantees, because they solve different problems:
 *
 *  1. **Derivatives are stripped.** The image processors call `stripImage()`
 *     (Imagick) or re-encode from a raw bitmap (GD), so a published derivative
 *     carries no EXIF at all. That protects the person who receives the file.
 *
 *  2. **What we STORE is filtered here.** Only a small allow-list of harmless
 *     technical fields is kept. GPS is not merely omitted from the API response
 *     — it is never written to the database in the first place, so it cannot
 *     leak later through a new endpoint, an export or a backup.
 *
 * The original file keeps its own EXIF: it is immutable and never web-reachable.
 */
final class ExifReader
{
    /** The only fields worth keeping. Everything else is dropped. */
    private const KEEP = [
        'Make', 'Model', 'LensModel', 'Software',
        'DateTimeOriginal', 'ExposureTime', 'FNumber', 'ISOSpeedRatings',
        'FocalLength', 'Orientation', 'ColorSpace',
        'ExifImageWidth', 'ExifImageLength',
    ];

    /**
     * Anything whose key mentions these is refused even if it somehow appears
     * on the allow-list — a belt-and-braces guard against a future edit that
     * adds a location field by mistake.
     */
    private const NEVER = ['gps', 'latitude', 'longitude', 'location', 'geo', 'serial', 'owner', 'artist', 'copyright'];

    /**
     * @return array{summary:array<string,scalar>,had_gps:bool,orientation:int}
     */
    public static function read(string $bytes): array
    {
        $result = ['summary' => [], 'had_gps' => false, 'orientation' => 1];
        if (!function_exists('exif_read_data')) return $result;

        $uri = 'data://image/jpeg;base64,' . base64_encode($bytes);
        $data = @exif_read_data($uri, null, true);
        if (!is_array($data)) return $result;

        // Flatten the sectioned structure exif_read_data returns.
        $flat = [];
        foreach ($data as $section => $values) {
            if (!is_array($values)) { $flat[(string)$section] = $values; continue; }
            foreach ($values as $k => $v) $flat[(string)$k] = $v;
            if (strtoupper((string)$section) === 'GPS' && $values !== []) $result['had_gps'] = true;
        }

        foreach ($flat as $key => $value) {
            if (self::isForbidden((string)$key)) {
                $result['had_gps'] = true;   // location data was present and dropped
                continue;
            }
        }

        foreach (self::KEEP as $key) {
            if (!array_key_exists($key, $flat)) continue;
            if (self::isForbidden($key)) continue;
            $v = $flat[$key];
            if (is_array($v)) continue;
            if (!is_scalar($v)) continue;
            $s = (string)$v;
            if ($s === '' || strlen($s) > 120) continue;
            // Strip control characters: EXIF strings come from cameras and
            // occasionally from a file crafted by hand.
            $result['summary'][$key] = preg_replace('/[\x00-\x1F\x7F]/', '', $s) ?? '';
        }

        $o = (int)($flat['Orientation'] ?? 1);
        $result['orientation'] = ($o >= 1 && $o <= 8) ? $o : 1;

        return $result;
    }

    private static function isForbidden(string $key): bool
    {
        $k = strtolower($key);
        foreach (self::NEVER as $needle) {
            if (str_contains($k, $needle)) return true;
        }
        return false;
    }

    /** Proof for the test suite: no stored key may reference a location. */
    public static function containsLocationData(array $summary): bool
    {
        foreach (array_keys($summary) as $key) {
            if (self::isForbidden((string)$key)) return true;
        }
        return false;
    }
}
