<?php
declare(strict_types=1);
namespace AvOS\Security;

/** Output encoding helpers. Context matters — never one generic escape. */
final class Encoder
{
    public static function html(mixed $v): string
    { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

    public static function attr(mixed $v): string
    { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

    /** Safe for embedding inside a <script> block. */
    public static function json(mixed $v): string
    {
        return (string)json_encode(
            $v,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT,
        );
    }

    /** Only http/https/mailto/tel survive; everything else becomes ''. */
    public static function url(string $url): string
    {
        $u = trim($url);
        if ($u === '') return '';
        if (preg_match('#^(https?:|mailto:|tel:|/)#i', $u) !== 1) return '';
        return filter_var($u, FILTER_SANITIZE_URL) ?: '';
    }

    public static function slug(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
        return trim($s, '-');
    }
}
