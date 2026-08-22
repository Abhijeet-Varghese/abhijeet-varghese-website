<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\RoutePath;

/**
 * Projects and case studies (Phase 3E §3E.3).
 *
 * The Orange case study proves why `route_path` must exist: its live URL is
 * `/experience-design/orange-business-executive-briefing-center`, a nested path
 * that "/" + slug cannot produce. Its bespoke template is likewise preserved
 * rather than flattened into `default` (DOMAIN-MODEL §4).
 */
final class ProjectService extends ContentService
{
    public const TEMPLATES = ['default', 'case-study', 'orange', 'gallery', 'minimal'];

    protected function extraValidation(array $input, array $coerced, ?array $existing): array
    {
        $errors = [];

        if ($existing === null && trim((string)($coerced['title'] ?? '')) === '') {
            $errors['title'] = 'is required';
        }
        if (isset($coerced['title']) && trim((string)$coerced['title']) === '') {
            $errors['title'] = 'must not be empty';
        }

        if (isset($coerced['template']) && !in_array($coerced['template'], self::TEMPLATES, true)) {
            $errors['template'] = 'must be one of: ' . implode(', ', self::TEMPLATES);
        }

        $from = $coerced['year_from'] ?? ($existing['year_from'] ?? null);
        $to   = $coerced['year_to']   ?? ($existing['year_to']   ?? null);
        foreach (['year_from' => $from, 'year_to' => $to] as $field => $year) {
            if ($year === null) continue;
            $y = (int)$year;
            if ($y < 1900 || $y > 2100) $errors[$field] = 'must be between 1900 and 2100';
        }
        if ($from !== null && $to !== null && !isset($errors['year_from']) && !isset($errors['year_to'])
            && (int)$to < (int)$from) {
            $errors['year_to'] = 'must not be earlier than year_from';
        }

        if (array_key_exists('route_path', $input) && is_string($input['route_path']) && $input['route_path'] !== '') {
            $errors += RoutePath::errors($input['route_path']);
        }

        // A case study is a project with a flag. It is not a second entity, and
        // it must actually say something — an empty case study is the failure
        // mode the current site already has.
        $isCase = array_key_exists('is_case_study', $coerced)
            ? (bool)$coerced['is_case_study']
            : (bool)($existing['is_case_study'] ?? false);
        if ($isCase) {
            $summary = $coerced['summary'] ?? ($existing['summary'] ?? null);
            if ($summary === null || trim((string)$summary) === '') {
                $errors['summary'] = 'is required for a case study';
            }
        }

        return $errors;
    }
}
