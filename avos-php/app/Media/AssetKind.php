<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * Asset classes (Phase 3F §3F.2).
 *
 * The ten classes the brief names, mapped onto the approved `media.kind` ENUM.
 * MODEL_3D maps to the existing `model` value rather than adding a synonym —
 * two spellings of the same concept is how enums rot.
 *
 * Nothing in this class decides whether a file is SAFE. That is MimeRegistry's
 * job, and it is deliberately a separate concern: classification answers "what
 * is this?", validation answers "may we keep it?".
 */
final class AssetKind
{
    public const IMAGE    = 'image';
    public const VIDEO    = 'video';
    public const AUDIO    = 'audio';
    public const DOCUMENT = 'document';
    public const MODEL_3D = 'model';      // brief's MODEL_3D
    public const TEXTURE  = 'texture';
    public const SHADER   = 'shader';
    public const SCRIPT   = 'script';
    public const FONT     = 'font';
    public const OTHER    = 'other';

    public const ALL = [
        self::IMAGE, self::VIDEO, self::AUDIO, self::DOCUMENT, self::MODEL_3D,
        self::TEXTURE, self::SHADER, self::SCRIPT, self::FONT, self::OTHER,
    ];

    /**
     * Classes whose bytes are INERT DATA and must never be interpreted by the
     * server. Enumerated so the rule is visible rather than implied.
     */
    public const NEVER_EXECUTED = [self::SHADER, self::SCRIPT, self::MODEL_3D, self::TEXTURE, self::OTHER];

    /** Classes that can produce raster derivatives. */
    public const RASTERISABLE = [self::IMAGE, self::TEXTURE];

    public static function isValid(string $kind): bool
    { return in_array($kind, self::ALL, true); }

    /** Human label, used in API responses and the future admin. */
    public static function label(string $kind): string
    {
        return match ($kind) {
            self::MODEL_3D => '3D model',
            self::SCRIPT   => 'Script',
            self::SHADER   => 'Shader',
            default        => ucfirst($kind),
        };
    }

    public static function isRasterisable(string $kind): bool
    { return in_array($kind, self::RASTERISABLE, true); }
}
