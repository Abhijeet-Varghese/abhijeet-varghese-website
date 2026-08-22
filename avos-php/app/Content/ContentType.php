<?php
declare(strict_types=1);
namespace AvOS\Content;

/**
 * The content type registry (Phase 3E §3E.1).
 *
 * One place that knows which content types exist, which table each lives in,
 * which `content_versions.entity_type` value it uses, and whether it is
 * routable. Every service and controller derives those facts from here so a
 * new type cannot be half-registered.
 */
final class ContentType
{
    public const PAGE       = 'page';
    public const PROJECT    = 'project';
    public const ARTICLE    = 'article';
    public const EXPERIENCE = 'experience';

    /** type => [table, routable, permission domain] */
    private const MAP = [
        self::PAGE       => ['pages',      true,  'pages'],
        self::PROJECT    => ['projects',   true,  'projects'],
        self::ARTICLE    => ['articles',   true,  'articles'],
        // Experience is an ordered timeline rendered inside /experience.
        // It has no slug and no page_route of its own — see DOMAIN-MODEL §4.
        self::EXPERIENCE => ['experience', false, 'content'],
    ];

    /** @return string[] */
    public static function all(): array { return array_keys(self::MAP); }

    public static function isValid(string $type): bool
    { return isset(self::MAP[$type]); }

    public static function table(string $type): string
    { return self::MAP[$type][0] ?? throw new \InvalidArgumentException('Unknown content type'); }

    public static function isRoutable(string $type): bool
    { return (bool)(self::MAP[$type][1] ?? false); }

    /** @return string[] the routable types, in route-resolution order */
    public static function routable(): array
    {
        return array_values(array_filter(self::all(), static fn(string $t): bool => self::isRoutable($t)));
    }

    public static function permissionDomain(string $type): string
    { return self::MAP[$type][2] ?? 'content'; }

    /** Permission code for an action on a type, e.g. page+write => pages.write. */
    public static function permission(string $type, string $action): string
    { return self::permissionDomain($type) . '.' . $action; }
}
