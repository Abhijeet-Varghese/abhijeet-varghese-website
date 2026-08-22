<?php
declare(strict_types=1);
namespace AvOS\Content;

use AvOS\Api\ApiException;

/**
 * Canonical public path for a piece of routable content (Phase 3E §3E.11).
 *
 * EVIDENCE, not invention. `frontend/src/routes/routes.json` — the single route
 * registry — shows the live site uses FLAT paths for every content type:
 *
 *   /story                                                   (page)
 *   /case-study-immersive-solutions-for-the-indian-army      (project)
 *   /experience-design/orange-...-briefing-center            (project, nested)
 *   /essay-technology-should-feel-human                      (article)
 *   /journal-what-a-year-of-ai-enabled-production-taught-me  (article)
 *
 * There is NO `/projects/{slug}` or `/articles/{slug}` prefix in production.
 * Inventing one here would have broken every existing canonical, so the rule
 * is: default path = "/" + slug, with an optional explicit multi-segment
 * override, which is exactly what reproduces the Orange case study's path.
 *
 * This class does not maintain a registry. `page_routes` is the runtime table
 * and `routes.json` is the build-time registry; both remain authoritative.
 */
final class RoutePath
{
    public const MAX_LENGTH = 500;
    private const MAX_SEGMENTS = 4;

    /**
     * @param string $explicit optional caller-supplied path override
     */
    public static function build(string $slug, string $explicit = ''): string
    {
        if ($explicit === '') {
            Slug::assertValid($slug);
            return '/' . $slug;
        }
        self::assertValidPath($explicit);
        return self::normalise($explicit);
    }

    public static function normalise(string $path): string
    {
        $p = '/' . trim($path, '/');
        return $p === '/' ? '/' : rtrim($p, '/');
    }

    /** @return array<string,string> */
    public static function errors(string $path, string $field = 'route_path'): array
    {
        if ($path === '' || $path[0] !== '/') return [$field => 'must start with /'];
        if (strlen($path) > self::MAX_LENGTH) {
            return [$field => 'must be ' . self::MAX_LENGTH . ' characters or fewer'];
        }
        if (str_contains($path, '//')) return [$field => 'must not contain an empty segment'];
        if (str_contains($path, '?') || str_contains($path, '#')) {
            return [$field => 'must not contain a query string or fragment'];
        }
        if (str_contains($path, '..')) return [$field => 'must not contain a relative segment'];

        $segments = array_values(array_filter(explode('/', trim($path, '/')), static fn($s) => $s !== ''));
        if ($segments === []) return [$field => 'must have at least one segment'];
        if (count($segments) > self::MAX_SEGMENTS) {
            return [$field => 'must have at most ' . self::MAX_SEGMENTS . ' segments'];
        }
        foreach ($segments as $i => $seg) {
            // Only the LAST segment is checked against the reserved list: a
            // reserved word is only dangerous when it is the whole first path
            // element, which the first-segment check below covers.
            $errs = Slug::errors($seg, $field);
            if ($errs !== []) {
                return [$field => 'segment "' . $seg . '" ' . reset($errs)];
            }
            unset($i);
        }
        return [];
    }

    public static function assertValidPath(string $path, string $field = 'route_path'): void
    {
        $errors = self::errors($path, $field);
        if ($errors !== []) throw ApiException::validation($errors);
    }
}
