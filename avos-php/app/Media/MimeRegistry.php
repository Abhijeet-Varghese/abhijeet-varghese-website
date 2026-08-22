<?php
declare(strict_types=1);
namespace AvOS\Media;

use AvOS\Security\UploadValidator;

/**
 * The media allow-list: extension ⇄ MIME ⇄ asset class (Phase 3F §3F.6).
 *
 * Relationship to Phase 3A's `Security\UploadValidator`: that class remains the
 * single source of the DENY list (`BLOCKED_EXT`) and this class imports it
 * rather than restating it — a second copy of a deny list is how one of them
 * silently falls behind. The media ALLOW list is a superset of
 * UploadValidator's because Phase 3F adds asset classes (scripts, fonts, more
 * audio) that did not exist when it was written. A test asserts the two never
 * contradict each other.
 *
 * Three independent checks, because any one of them alone is bypassable:
 *   1. extension        — attacker-controlled, so it is necessary but never sufficient
 *   2. sniffed MIME     — from the actual bytes via fileinfo, not the request header
 *   3. magic signature  — the first bytes, for formats that have a stable one
 */
final class MimeRegistry
{
    /**
     * extension => [kind, [acceptable sniffed MIME prefixes], canonical mime]
     *
     * @var array<string,array{0:string,1:string[],2:string}>
     */
    private const ALLOW = [
        // ---- images -------------------------------------------------------
        'jpg'  => [AssetKind::IMAGE, ['image/jpeg'], 'image/jpeg'],
        'jpeg' => [AssetKind::IMAGE, ['image/jpeg'], 'image/jpeg'],
        'png'  => [AssetKind::IMAGE, ['image/png'], 'image/png'],
        'webp' => [AssetKind::IMAGE, ['image/webp'], 'image/webp'],
        'avif' => [AssetKind::IMAGE, ['image/avif'], 'image/avif'],
        'gif'  => [AssetKind::IMAGE, ['image/gif'], 'image/gif'],
        // SVG is a separately controlled type (§3F.8): it is XML that can carry
        // script, so it gets its own sanitiser pass in UploadGuard.
        'svg'  => [AssetKind::IMAGE, ['image/svg+xml', 'text/xml', 'application/xml', 'text/plain'], 'image/svg+xml'],

        // ---- textures -----------------------------------------------------
        'hdr'  => [AssetKind::TEXTURE, ['image/vnd.radiance', 'application/octet-stream', 'text/plain'], 'image/vnd.radiance'],
        'ktx2' => [AssetKind::TEXTURE, ['image/ktx2', 'application/octet-stream'], 'image/ktx2'],
        'exr'  => [AssetKind::TEXTURE, ['image/x-exr', 'application/octet-stream'], 'image/x-exr'],

        // ---- video --------------------------------------------------------
        'mp4'  => [AssetKind::VIDEO, ['video/mp4', 'application/mp4'], 'video/mp4'],
        'webm' => [AssetKind::VIDEO, ['video/webm'], 'video/webm'],
        'mov'  => [AssetKind::VIDEO, ['video/quicktime'], 'video/quicktime'],

        // ---- audio --------------------------------------------------------
        'mp3'  => [AssetKind::AUDIO, ['audio/mpeg'], 'audio/mpeg'],
        'wav'  => [AssetKind::AUDIO, ['audio/x-wav', 'audio/wav'], 'audio/wav'],
        'ogg'  => [AssetKind::AUDIO, ['audio/ogg', 'application/ogg', 'video/ogg'], 'audio/ogg'],
        'm4a'  => [AssetKind::AUDIO, ['audio/mp4', 'audio/x-m4a', 'video/mp4'], 'audio/mp4'],

        // ---- documents ----------------------------------------------------
        'pdf'  => [AssetKind::DOCUMENT, ['application/pdf'], 'application/pdf'],
        'txt'  => [AssetKind::DOCUMENT, ['text/plain'], 'text/plain'],
        'md'   => [AssetKind::DOCUMENT, ['text/markdown', 'text/plain'], 'text/markdown'],
        'csv'  => [AssetKind::DOCUMENT, ['text/csv', 'text/plain', 'application/csv'], 'text/csv'],
        'zip'  => [AssetKind::DOCUMENT, ['application/zip'], 'application/zip'],

        // ---- 3D -----------------------------------------------------------
        'glb'  => [AssetKind::MODEL_3D, ['model/gltf-binary', 'application/octet-stream'], 'model/gltf-binary'],
        'gltf' => [AssetKind::MODEL_3D, ['model/gltf+json', 'application/json', 'text/plain'], 'model/gltf+json'],
        'obj'  => [AssetKind::MODEL_3D, ['text/plain', 'application/octet-stream'], 'model/obj'],

        // ---- shaders (data, NEVER executed) -------------------------------
        'glsl' => [AssetKind::SHADER, ['text/plain'], 'text/plain'],
        'frag' => [AssetKind::SHADER, ['text/plain'], 'text/plain'],
        'vert' => [AssetKind::SHADER, ['text/plain'], 'text/plain'],

        // ---- scripts (data, NEVER executed by PHP) ------------------------
        'js'   => [AssetKind::SCRIPT, ['text/plain', 'application/javascript', 'text/javascript'], 'text/javascript'],
        'json' => [AssetKind::SCRIPT, ['application/json', 'text/plain'], 'application/json'],

        // ---- fonts --------------------------------------------------------
        'woff'  => [AssetKind::FONT, ['font/woff', 'application/font-woff', 'application/octet-stream'], 'font/woff'],
        'woff2' => [AssetKind::FONT, ['font/woff2', 'application/octet-stream'], 'font/woff2'],
        'ttf'   => [AssetKind::FONT, ['font/ttf', 'application/x-font-ttf', 'application/octet-stream'], 'font/ttf'],
        'otf'   => [AssetKind::FONT, ['font/otf', 'application/x-font-otf', 'application/octet-stream'], 'font/otf'],
    ];

    /**
     * Magic byte signatures, checked where a format has a stable one. This is
     * what catches a polyglot: a file whose sniffed MIME looks acceptable but
     * whose leading bytes are something else entirely.
     *
     * @var array<string,array<int,array{0:int,1:string}>> ext => [[offset, bytes], …]
     */
    private const SIGNATURES = [
        'jpg'  => [[0, "\xFF\xD8\xFF"]],
        'jpeg' => [[0, "\xFF\xD8\xFF"]],
        'png'  => [[0, "\x89PNG\r\n\x1a\n"]],
        'gif'  => [[0, 'GIF87a'], [0, 'GIF89a']],
        'webp' => [[0, 'RIFF'], [8, 'WEBP']],
        'pdf'  => [[0, '%PDF-']],
        'zip'  => [[0, "PK\x03\x04"]],
        'glb'  => [[0, 'glTF']],
        'mp3'  => [[0, 'ID3'], [0, "\xFF\xFB"], [0, "\xFF\xF3"], [0, "\xFF\xF2"]],
        'wav'  => [[0, 'RIFF'], [8, 'WAVE']],
        'woff' => [[0, 'wOFF']],
        'woff2' => [[0, 'wOF2']],
        'ttf'  => [[0, "\x00\x01\x00\x00"], [0, 'true']],
        'otf'  => [[0, 'OTTO']],
        'ktx2' => [[0, "\xABKTX 20\xBB"]],
        'exr'  => [[0, "\x76\x2F\x31\x01"]],
        'mp4'  => [[4, 'ftyp']],
        'mov'  => [[4, 'ftyp'], [4, 'moov']],
    ];

    /** Extensions whose bytes are legitimately text and may contain angle brackets. */
    public const TEXTUAL = ['txt', 'md', 'csv', 'glsl', 'frag', 'vert', 'js', 'json', 'gltf', 'obj', 'svg'];

    /** @return string[] */
    public static function extensions(): array { return array_keys(self::ALLOW); }

    public static function isAllowedExtension(string $ext): bool
    { return isset(self::ALLOW[strtolower($ext)]); }

    public static function kindFor(string $ext): string
    { return self::ALLOW[strtolower($ext)][0] ?? AssetKind::OTHER; }

    public static function canonicalMime(string $ext): string
    { return self::ALLOW[strtolower($ext)][2] ?? 'application/octet-stream'; }

    /** @return string[] */
    public static function acceptedMimes(string $ext): array
    { return self::ALLOW[strtolower($ext)][1] ?? []; }

    /**
     * MIME types fileinfo may reasonably return for a TEXTUAL asset but which
     * must never be accepted for one, because they describe active content.
     */
    private const TEXT_NEVER = ['text/html', 'text/x-php', 'application/x-httpd-php', 'text/x-perl',
                                'text/x-python', 'text/x-shellscript', 'application/x-executable'];

    public static function mimeMatches(string $ext, string $sniffed): bool
    {
        $sniffed = strtolower($sniffed);
        foreach (self::acceptedMimes($ext) as $prefix) {
            if (str_starts_with($sniffed, strtolower($prefix))) return true;
        }

        // Textual assets need a wildcard. libmagic classifies source code by
        // what it LOOKS like, not by its extension: a GLSL shader comes back as
        // `text/x-c`, an OBJ mesh as `text/plain`, a JS bundle as
        // `application/javascript`. Pinning those to `text/plain` would reject
        // every real shader and script — this was caught by an actual upload
        // failing, not by review.
        //
        // Safety does not rest on the sniffed subtype: it rests on the
        // extension allow-list, the executable deny list, the content scan for
        // script markers, and the fact that these bytes are only ever served as
        // inert data. Active-content subtypes are still refused outright.
        if (in_array($ext, self::TEXTUAL, true)) {
            if (in_array($sniffed, self::TEXT_NEVER, true)) return false;
            if (str_starts_with($sniffed, 'text/')) return true;
        }
        return false;
    }

    public static function hasSignature(string $ext): bool
    { return isset(self::SIGNATURES[strtolower($ext)]); }

    /** True when the leading bytes match every declared signature slot. */
    public static function signatureMatches(string $ext, string $bytes): bool
    {
        $ext = strtolower($ext);
        if (!isset(self::SIGNATURES[$ext])) return true;   // nothing to check

        // Slots at the same offset are alternatives; different offsets are all
        // required. `webp` needs RIFF at 0 AND WEBP at 8; `mp3` accepts any of
        // three headers at 0.
        $byOffset = [];
        foreach (self::SIGNATURES[$ext] as [$offset, $magic]) $byOffset[$offset][] = $magic;

        foreach ($byOffset as $offset => $alternatives) {
            $matched = false;
            foreach ($alternatives as $magic) {
                if (substr($bytes, $offset, strlen($magic)) === $magic) { $matched = true; break; }
            }
            if (!$matched) return false;
        }
        return true;
    }

    /**
     * Guard against drift: nothing this registry allows may appear in the
     * Phase 3A deny list. Asserted by the test suite.
     * @return string[] offending extensions
     */
    public static function conflictsWithDenyList(): array
    {
        return array_values(array_intersect(
            array_map('strtolower', self::extensions()),
            array_map('strtolower', UploadValidator::BLOCKED_EXT),
        ));
    }
}
