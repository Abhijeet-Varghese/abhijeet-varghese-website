<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * The centralised derivative configuration (Phase 3F §3F.10).
 *
 * "Do NOT generate unlimited arbitrary sizes." There is therefore no API that
 * takes a width. The ladder below is the complete set of sizes the system will
 * ever produce, it lives in exactly one place, and a request cannot add to it.
 *
 * The brief's vocabulary (thumbnail/small/medium/large/xlarge) maps onto the
 * approved `media_variants.purpose` ENUM rather than introducing a second set
 * of names:
 *
 *   thumbnail → thumb    320   grid tiles, admin lists
 *   small     → card     640   cards, mobile 1x
 *   medium    → hero    1280   in-article, laptop
 *   large     → full    1920   full-bleed desktop
 *   xlarge    → xlarge  2560   retina full-bleed
 *
 * Formats are attempted in order of preference. A format that the server cannot
 * encode is SKIPPED and no row is written — §3F.11: an AVIF derivative that
 * failed to encode must never be reported as available.
 */
final class DerivativeSpec
{
    /** purpose => [width, quality, brief's name] */
    public const LADDER = [
        'thumb'  => [320,  78, 'thumbnail'],
        'card'   => [640,  80, 'small'],
        'hero'   => [1280, 82, 'medium'],
        'full'   => [1920, 82, 'large'],
        'xlarge' => [2560, 80, 'xlarge'],
    ];

    /**
     * Preference order. AVIF first because it is smallest, WebP as the broadly
     * supported modern format, then a baseline the whole world can read.
     */
    public const FORMATS = ['avif', 'webp', 'jpeg'];

    /** A PNG source keeps a PNG baseline so transparency survives. */
    public const TRANSPARENT_BASELINE = 'png';

    /** Sources with an alpha channel. */
    public const TRANSPARENT_SOURCES = ['png', 'webp', 'avif', 'gif'];

    /**
     * Upscaling is never useful and always wasteful, so a rung is skipped when
     * the original is not at least this fraction wider than it.
     */
    public const MIN_SOURCE_RATIO = 1.0;

    /** @return string[] */
    public static function purposes(): array { return array_keys(self::LADDER); }

    public static function width(string $purpose): int
    { return self::LADDER[$purpose][0] ?? 0; }

    public static function quality(string $purpose): int
    { return self::LADDER[$purpose][1] ?? 80; }

    public static function briefName(string $purpose): string
    { return self::LADDER[$purpose][2] ?? $purpose; }

    public static function isValidPurpose(string $purpose): bool
    { return isset(self::LADDER[$purpose]); }

    /**
     * The rungs worth generating for a source of the given width. A 900px
     * original produces thumb/card only — never a blurry upscaled 2560.
     *
     * @return string[]
     */
    public static function rungsFor(int $sourceWidth): array
    {
        $out = [];
        foreach (self::LADDER as $purpose => [$width, , ]) {
            if ($sourceWidth >= (int)($width * self::MIN_SOURCE_RATIO)) $out[] = $purpose;
        }
        // Always emit at least a thumbnail, even for a tiny source, so every
        // image has something for a grid tile.
        if ($out === []) $out[] = 'thumb';
        return $out;
    }

    /**
     * Formats to attempt for this source, filtered by what the server can
     * ACTUALLY encode (proven by Capabilities, not assumed from extension
     * loading).
     *
     * @return string[]
     */
    public static function formatsFor(string $sourceExtension): array
    {
        $wanted = self::FORMATS;
        if (in_array(strtolower($sourceExtension), self::TRANSPARENT_SOURCES, true)) {
            // Replace the lossy baseline with PNG so alpha is not flattened.
            $wanted = array_map(
                static fn(string $f): string => $f === 'jpeg' ? self::TRANSPARENT_BASELINE : $f,
                $wanted,
            );
        }
        $out = [];
        foreach ($wanted as $format) {
            if (Capabilities::canEncode($format)) $out[] = $format;
        }
        return array_values(array_unique($out));
    }

    /** What the API reports as the configured ladder, for the admin to render. */
    public static function describe(): array
    {
        $out = [];
        foreach (self::LADDER as $purpose => [$width, $quality, $brief]) {
            $out[] = ['purpose' => $purpose, 'name' => $brief, 'width' => $width, 'quality' => $quality];
        }
        return [
            'sizes'             => $out,
            'formats_preferred' => self::FORMATS,
            'formats_available' => array_values(array_filter(
                array_unique([...self::FORMATS, self::TRANSPARENT_BASELINE]),
                static fn(string $f): bool => Capabilities::canEncode($f),
            )),
        ];
    }
}
