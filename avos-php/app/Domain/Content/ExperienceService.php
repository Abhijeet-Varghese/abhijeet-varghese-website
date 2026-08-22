<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;

/**
 * Experience — the ordered career timeline (Phase 3E §3E.5).
 *
 * "Preserve the semantic meaning of the existing Experience content. Do not
 * invent replacement content." Nothing is authored here: this service manages
 * empty structure only. The real entries arrive in Phase 3R from the existing
 * source, and `era` + `position` are treated as content because DOMAIN-MODEL §4
 * says the grouping and the order carry meaning.
 *
 * Experience has no slug and no route: entries render inside the single
 * `/experience` page. There is therefore no publish-time route activation.
 */
final class ExperienceService extends ContentService
{
    protected function extraValidation(array $input, array $coerced, ?array $existing): array
    {
        $errors = [];

        if ($existing === null && trim((string)($coerced['title'] ?? '')) === '') {
            $errors['title'] = 'is required';
        }
        if (isset($coerced['title']) && trim((string)$coerced['title']) === '') {
            $errors['title'] = 'must not be empty';
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

        return $errors;
    }

    /**
     * Reorder the timeline. Order is content (§4), so a reorder that actually
     * changes a row DOES create a version — via the normal update path, which
     * applies the checksum rule. Rows whose position is unchanged produce no
     * version at all.
     *
     * @param array<int,int> $positions id => position
     */
    public function reorder(array $positions): array
    {
        if ($positions === []) throw ApiException::validation(['positions' => 'must not be empty']);
        if (count($positions) > 200) throw ApiException::validation(['positions' => 'too many entries']);

        $changed = [];
        foreach ($positions as $id => $pos) {
            $id = (int)$id;
            if (!is_int($pos) && !(is_string($pos) && preg_match('/^\d+$/', $pos) === 1)) {
                throw ApiException::validation(['positions.' . $id => 'must be a non-negative integer']);
            }
            $row = $this->repo->findById($id);
            if ($row === null) throw ApiException::notFound('Experience entry ' . $id . ' not found.');
            if ((int)$row['position'] === (int)$pos) continue;

            $this->update($id, ['position' => (int)$pos]);
            $changed[] = $id;
        }
        return ['reordered' => count($changed), 'ids' => $changed];
    }
}
