<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentDocument;

/**
 * Articles — essays and journal entries (Phase 3E §3E.4).
 *
 * Categories and tags arrive as term strings and are resolved to rows in
 * `article_categories` / `article_tags` inside the same transaction as the
 * article write, so an article can never end up half-tagged.
 */
final class ArticleService extends ContentService
{
    public const KINDS = ['essay', 'journal'];

    /** Words per minute used to derive reading time when the author omits it. */
    private const WPM = 220;

    protected function extraValidation(array $input, array $coerced, ?array $existing): array
    {
        $errors = [];

        if ($existing === null && trim((string)($coerced['title'] ?? '')) === '') {
            $errors['title'] = 'is required';
        }
        if (isset($coerced['title']) && trim((string)$coerced['title']) === '') {
            $errors['title'] = 'must not be empty';
        }
        if (isset($coerced['kind']) && !in_array($coerced['kind'], self::KINDS, true)) {
            $errors['kind'] = 'must be one of: ' . implode(', ', self::KINDS);
        }
        if (isset($coerced['excerpt']) && is_string($coerced['excerpt']) && mb_strlen($coerced['excerpt']) > 500) {
            $errors['excerpt'] = 'must be 500 characters or fewer';
        }
        if (isset($coerced['reading_minutes']) && $coerced['reading_minutes'] !== null) {
            $m = (int)$coerced['reading_minutes'];
            if ($m < 0 || $m > 600) $errors['reading_minutes'] = 'must be between 0 and 600';
        }

        foreach (['categories', 'tags'] as $rel) {
            if (!array_key_exists($rel, $input)) continue;
            if (!is_array($input[$rel]) || ($input[$rel] !== [] && !array_is_list($input[$rel]))) {
                $errors[$rel] = 'must be an array of terms';
                continue;
            }
            if (count($input[$rel]) > 25) { $errors[$rel] = 'must contain at most 25 terms'; continue; }
            foreach ($input[$rel] as $t) {
                if (!is_string($t)) { $errors[$rel] = 'must contain only strings'; break; }
            }
        }

        return $errors;
    }

    /**
     * Derive reading_minutes when the author did not set one. Counted from the
     * block document's text, and only ever FILLED IN — never overwritten, so an
     * explicit editorial estimate always wins.
     */
    protected function coerce(array $input, ?array $existing): array
    {
        $out = parent::coerce($input, $existing);

        $explicit = array_key_exists('reading_minutes', $input) && $input['reading_minutes'] !== null;
        $alreadySet = ($existing['reading_minutes'] ?? null) !== null;
        if (!$explicit && !$alreadySet && array_key_exists('body', $out)) {
            $words = self::countWords(ContentDocument::decode((string)$out['body']));
            $out['reading_minutes'] = $words > 0 ? max(1, (int)ceil($words / self::WPM)) : null;
        }
        return $out;
    }

    protected function afterWrite(int $id, array $input, bool $created): void
    {
        if (array_key_exists('categories', $input) && is_array($input['categories'])) {
            $this->refs->setArticleCategories($id, array_map('strval', $input['categories']));
        }
        if (array_key_exists('tags', $input) && is_array($input['tags'])) {
            $this->refs->setArticleTags($id, array_map('strval', $input['tags']));
        }
    }

    protected function decorate(array $row, array $out, bool $public): array
    {
        $id = (int)($row['id'] ?? 0);
        if ($id === 0) return $out;
        $out['categories'] = $this->refs->categorySlugs($id);
        $out['tags'] = $this->refs->tagSlugs($id);
        return $out;
    }

    private static function countWords(array $doc): int
    {
        $text = '';
        $collect = static function (array $nodes) use (&$collect, &$text): void {
            foreach ($nodes as $n) {
                if (!is_array($n)) continue;
                foreach (($n['props'] ?? []) as $v) {
                    if (is_string($v)) $text .= ' ' . $v;
                }
                if (is_array($n['children'] ?? null)) $collect($n['children']);
            }
        };
        $collect($doc['blocks'] ?? []);
        return str_word_count(strip_tags($text));
    }
}
