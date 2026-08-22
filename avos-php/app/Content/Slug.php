<?php
declare(strict_types=1);
namespace AvOS\Content;

use AvOS\Api\ApiException;

/**
 * Slug normalisation and validation (Phase 3E §3E.10).
 *
 * The §103 clean-URL system is authoritative: a URL never carries a file
 * extension, so a slug can never contain a dot. That is enforced twice — once
 * by the character pattern and once by an explicit extension check, because the
 * explicit check produces a message a human can act on.
 */
final class Slug
{
    public const MAX_LENGTH = 190;

    /** lowercase alphanumerics separated by single hyphens; no leading/trailing hyphen */
    private const PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /** Extensions §30/§103 forbid in any public URL segment. */
    private const FORBIDDEN_EXTENSIONS = ['.html', '.htm', '.php', '.asp', '.aspx', '.jsp', '.cgi', '.xml'];

    /** Paths the new content engine may never claim — they belong to the app. */
    private const RESERVED = [
        'api', 'os', 'admin', 'install', 'assets', 'static',
        'sitemap', 'robots', 'favicon', 'null', 'undefined', 'true', 'false',
    ];

    /**
     * Deterministic normalisation. Transliteration is intentionally limited to
     * ASCII folding of common accents: guessing at other scripts would silently
     * mangle content, so a slug that normalises to nothing is rejected instead.
     */
    public static function normalise(string $raw): string
    {
        $s = trim($raw);
        if ($s === '') return '';

        // Strip an accidental extension before anything else.
        foreach (self::FORBIDDEN_EXTENSIONS as $ext) {
            if (str_ends_with(strtolower($s), $ext)) {
                $s = substr($s, 0, -strlen($ext));
            }
        }

        $s = strtolower($s);
        $folded = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
        if (is_string($folded) && $folded !== '') $s = strtolower($folded);

        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
        $s = trim($s, '-');
        $s = preg_replace('/-{2,}/', '-', $s) ?? '';

        return substr($s, 0, self::MAX_LENGTH);
    }

    public static function isValid(string $slug): bool
    {
        if ($slug === '' || strlen($slug) > self::MAX_LENGTH) return false;
        if (preg_match(self::PATTERN, $slug) !== 1) return false;
        if (in_array($slug, self::RESERVED, true)) return false;
        return true;
    }

    /** @return array<string,string> field => message (empty when valid) */
    public static function errors(string $slug, string $field = 'slug'): array
    {
        if ($slug === '') return [$field => 'is required'];
        if (strlen($slug) > self::MAX_LENGTH) {
            return [$field => 'must be ' . self::MAX_LENGTH . ' characters or fewer'];
        }
        foreach (self::FORBIDDEN_EXTENSIONS as $ext) {
            if (str_contains(strtolower($slug), $ext)) {
                return [$field => 'must not contain a file extension such as ' . $ext];
            }
        }
        if (str_contains($slug, '/')) return [$field => 'must not contain a slash'];
        if (preg_match(self::PATTERN, $slug) !== 1) {
            return [$field => 'must be lowercase letters, digits and single hyphens'];
        }
        if (in_array($slug, self::RESERVED, true)) {
            return [$field => 'is reserved by the application'];
        }
        return [];
    }

    public static function assertValid(string $slug, string $field = 'slug'): void
    {
        $errors = self::errors($slug, $field);
        if ($errors !== []) throw ApiException::validation($errors);
    }

    /**
     * A collision suggestion. Returned in the CONFLICT details so the caller
     * can retry deliberately — the engine never silently renames, because a
     * silently changed URL is an SEO incident.
     */
    public static function suggest(string $slug, int $attempt): string
    {
        $suffix = '-' . max(2, $attempt);
        return substr($slug, 0, self::MAX_LENGTH - strlen($suffix)) . $suffix;
    }
}
