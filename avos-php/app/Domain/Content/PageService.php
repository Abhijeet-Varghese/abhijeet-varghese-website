<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\RoutePath;

/**
 * Pages (Phase 3E §3E.2).
 *
 * A page's public path is "/" + slug unless an explicit multi-segment
 * `route_path` is supplied. See RoutePath for why: the live registry has no
 * per-type URL prefix, so inventing one would break every canonical.
 */
final class PageService extends ContentService
{
    /** Templates the engine will accept. Extending this list is a Phase 3G job. */
    public const TEMPLATES = ['default', 'landing', 'longform', 'story', 'index', 'legal', 'contact'];

    protected function extraValidation(array $input, array $coerced, ?array $existing): array
    {
        $errors = [];

        $title = $coerced['title'] ?? ($existing['title'] ?? '');
        if ($existing === null && trim((string)$title) === '') {
            $errors['title'] = 'is required';
        }
        if (isset($coerced['title']) && trim((string)$coerced['title']) === '') {
            $errors['title'] = 'must not be empty';
        }

        if (isset($coerced['template']) && !in_array($coerced['template'], self::TEMPLATES, true)) {
            $errors['template'] = 'must be one of: ' . implode(', ', self::TEMPLATES);
        }

        if (array_key_exists('route_path', $input) && is_string($input['route_path']) && $input['route_path'] !== '') {
            $errors += RoutePath::errors($input['route_path']);
        }

        if (isset($coerced['excerpt']) && is_string($coerced['excerpt']) && mb_strlen($coerced['excerpt']) > 500) {
            $errors['excerpt'] = 'must be 500 characters or fewer';
        }

        return $errors;
    }
}
