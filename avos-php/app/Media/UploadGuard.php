<?php
declare(strict_types=1);
namespace AvOS\Media;

use AvOS\Security\UploadValidator;

/**
 * Upload security (Phase 3F §3F.6, §3F.7).
 *
 * Nothing about an upload is trusted: not the extension, not the
 * `Content-Type` header, not the filename, not the declared size. Every claim
 * is re-derived from the bytes.
 *
 * The checks run in a fixed order, cheapest and most decisive first, and the
 * FIRST failure wins — so a `.php` never reaches the MIME sniffer and a
 * traversal attempt never reaches the filesystem.
 *
 *   1  size            — empty, or over the configured ceiling
 *   2  filename shape  — null bytes, traversal, control characters
 *   3  extension       — final extension AND every dotted part against the
 *                        Phase 3A deny list, which kills `evil.php.jpg`
 *   4  allow-list      — MimeRegistry must know the extension
 *   5  sniffed MIME    — from the bytes via fileinfo, matched to the extension
 *   6  magic signature — leading bytes, which is what catches a polyglot
 *   7  content scan    — PHP open tags, and for SVG the whole active-content set
 *   8  decodability    — an image must actually decode, so a corrupt or
 *                        pretend image is rejected before it reaches storage
 *
 * The result of a PASS is a value object carrying the *derived* truth: real
 * MIME, normalised extension, asset class, sha256. Callers use those and never
 * re-read the request.
 */
final class UploadGuard
{
    /** Absolute ceiling regardless of configuration — a sanity backstop. */
    public const HARD_MAX_BYTES = 512 * 1024 * 1024;

    /**
     * Active content in SVG. SVG is XML that browsers execute, so it is treated
     * as a script container that happens to draw pictures. Any hit is a
     * rejection rather than a sanitise: silently stripping part of a file the
     * author uploaded is its own kind of surprise.
     */
    private const SVG_FORBIDDEN = [
        '<script', '</script', 'javascript:', 'data:text/html',
        '<foreignobject', '<iframe', '<embed', '<object', '<use xlink:href="http',
        '<!entity', '<!doctype svg system', 'xlink:href="javascript',
        'onload=', 'onerror=', 'onclick=', 'onmouseover=', 'onfocus=', 'onbegin=',
        'onanimationstart=', 'onload =',
    ];

    /** Executable markers that must never appear in a stored asset. */
    private const SCRIPT_MARKERS = ['<?php', '<?=', '<%', '#!/usr/bin', '#!/bin/'];

    public function __construct(private readonly int $maxBytes) {}

    /**
     * @param string $originalName the client-supplied filename — untrusted
     * @param string $bytes        the actual file content
     * @return UploadInspection
     */
    public function inspect(string $originalName, string $bytes): UploadInspection
    {
        $fail = static fn(string $code, string $reason): UploadInspection
            => UploadInspection::rejected($code, $reason);

        // ---- 1 · size --------------------------------------------------
        $size = strlen($bytes);
        if ($size === 0) return $fail('EMPTY_FILE', 'The file is empty.');
        $ceiling = min($this->maxBytes, self::HARD_MAX_BYTES);
        if ($size > $ceiling) {
            return $fail('FILE_TOO_LARGE', sprintf(
                'The file is %s, which exceeds the %s limit.',
                self::human($size), self::human($ceiling),
            ));
        }

        // ---- 2 · filename shape ----------------------------------------
        if (str_contains($originalName, "\0")) {
            return $fail('UNSAFE_FILENAME', 'The filename contains a null byte.');
        }
        if (preg_match('/[\x00-\x1F\x7F]/', $originalName) === 1) {
            return $fail('UNSAFE_FILENAME', 'The filename contains control characters.');
        }
        if (str_contains($originalName, '..')) {
            return $fail('UNSAFE_FILENAME', 'The filename contains a path traversal sequence.');
        }
        if (str_contains($originalName, '/') || str_contains($originalName, '\\')) {
            return $fail('UNSAFE_FILENAME', 'The filename contains a path separator.');
        }

        $safeName = FileNaming::sanitiseOriginalName($originalName);
        $ext = strtolower((string)pathinfo($safeName, PATHINFO_EXTENSION));
        if ($ext === '') return $fail('MISSING_EXTENSION', 'The file has no extension.');

        // ---- 3 · deny list, every dotted part ---------------------------
        $blocked = array_map('strtolower', UploadValidator::BLOCKED_EXT);
        if (in_array($ext, $blocked, true)) {
            return $fail('EXECUTABLE_REJECTED', 'Executable file types are not accepted.');
        }
        foreach (explode('.', strtolower($safeName)) as $part) {
            // Catches evil.php.jpg, evil.phtml.png, archive.phar.zip.
            if ($part !== '' && in_array($part, $blocked, true)) {
                return $fail('EXECUTABLE_REJECTED',
                    'Executable file types are not accepted, including as a secondary extension.');
            }
        }

        // ---- 4 · allow-list ---------------------------------------------
        if (!MimeRegistry::isAllowedExtension($ext)) {
            return $fail('UNSUPPORTED_TYPE', 'This file type is not supported.');
        }
        $kind = MimeRegistry::kindFor($ext);

        // ---- 5 · sniffed MIME -------------------------------------------
        $sniffed = self::sniff($bytes);
        if (!MimeRegistry::mimeMatches($ext, $sniffed)) {
            return $fail('MIME_MISMATCH', sprintf(
                'The file content (%s) does not match its .%s extension.', $sniffed, $ext,
            ));
        }

        // ---- 6 · magic signature ----------------------------------------
        if (!MimeRegistry::signatureMatches($ext, $bytes)) {
            return $fail('SIGNATURE_MISMATCH',
                'The file does not begin with the expected signature for its type.');
        }

        // ---- 7 · content scan -------------------------------------------
        // Binary formats must contain no script marker anywhere; a GIF/PHP
        // polyglot passes both the sniffer and the signature check and dies here.
        $isTextual = in_array($ext, MimeRegistry::TEXTUAL, true);
        if (!$isTextual) {
            $lower = strtolower($bytes);
            foreach (self::SCRIPT_MARKERS as $marker) {
                if (str_contains($lower, $marker)) {
                    return $fail('EMBEDDED_SCRIPT',
                        'Executable markup was found inside the file.');
                }
            }
        } else {
            // Textual assets may contain angle brackets legitimately, but never
            // a PHP open tag — nothing in a shader, model or stylesheet needs one.
            $head = strtolower(substr($bytes, 0, 8192));
            if (str_contains($head, '<?php') || str_contains($head, '<?=')) {
                return $fail('EMBEDDED_SCRIPT', 'Executable markup was found inside the file.');
            }
        }

        if ($ext === 'svg') {
            $lower = strtolower($bytes);
            foreach (self::SVG_FORBIDDEN as $needle) {
                if (str_contains($lower, $needle)) {
                    return $fail('SVG_ACTIVE_CONTENT',
                        'The SVG contains active content (script, event handler or external reference).');
                }
            }
        }

        // ---- 8 · decodability -------------------------------------------
        $width = null;
        $height = null;
        if ($kind === AssetKind::IMAGE && $ext !== 'svg') {
            $info = @getimagesizefromstring($bytes);
            if ($info === false) {
                // getimagesize does not know AVIF on every build; fall back to
                // the real decoder before calling the file corrupt.
                $probe = self::probeWithDecoder($bytes);
                if ($probe === null) {
                    return $fail('CORRUPT_IMAGE', 'The image could not be decoded.');
                }
                [$width, $height] = $probe;
            } else {
                $width = (int)$info[0];
                $height = (int)$info[1];
                if ($width < 1 || $height < 1) {
                    return $fail('CORRUPT_IMAGE', 'The image reports invalid dimensions.');
                }
                // getimagesize only reads the HEADER, so a truncated or
                // corrupted image sails past it and then fails later during
                // derivative generation — leaving an asset that uploaded
                // "successfully" but can never be processed. A full decode here
                // is the only way to promise that an accepted image is usable.
                if (!self::decodesFully($bytes)) {
                    return $fail('CORRUPT_IMAGE',
                        'The image header is valid but its data is truncated or corrupt.');
                }
            }
        }
        if ($ext === 'svg') {
            [$width, $height] = self::svgDimensions($bytes);
        }

        return UploadInspection::accepted(
            originalName: $safeName,
            extension:    $ext,
            mime:         $sniffed !== '' ? $sniffed : MimeRegistry::canonicalMime($ext),
            kind:         $kind,
            bytes:        $size,
            hash:         hash('sha256', $bytes),
            width:        $width,
            height:       $height,
        );
    }

    public static function sniff(string $bytes): string
    {
        if (!function_exists('finfo_open')) return '';
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        if ($fi === false) return '';
        $mime = finfo_buffer($fi, $bytes);
        finfo_close($fi);
        return is_string($mime) ? strtolower($mime) : '';
    }

    /**
     * Decode the whole image, not just its header. Returns true when no
     * rasteriser is installed: refusing every image on a host without Imagick
     * or GD would be worse than accepting one that cannot be verified, and the
     * asset's `processing` state already reports that derivatives are
     * unavailable there.
     */
    private static function decodesFully(string $bytes): bool
    {
        if (Capabilities::hasImagick()) {
            try {
                $im = new \Imagick();
                $im->readImageBlob($bytes);
                // Touching a pixel forces the data chunk to be read, which is
                // what a header-only check misses.
                $im->getImagePixelColor(0, 0);
                $im->clear();
                return true;
            } catch (\Throwable) {
                return false;
            }
        }
        if (Capabilities::hasGd()) {
            $img = @imagecreatefromstring($bytes);
            if ($img === false) return false;
            imagedestroy($img);
            return true;
        }
        return true;   // nothing available to verify with
    }

    /** @return array{0:int,1:int}|null */
    private static function probeWithDecoder(string $bytes): ?array
    {
        if (Capabilities::hasImagick()) {
            try {
                $im = new \Imagick();
                $im->readImageBlob($bytes);
                $w = $im->getImageWidth();
                $h = $im->getImageHeight();
                $im->clear();
                if ($w > 0 && $h > 0) return [$w, $h];
            } catch (\Throwable) { /* fall through */ }
        }
        if (Capabilities::hasGd()) {
            $img = @imagecreatefromstring($bytes);
            if ($img !== false) {
                $w = imagesx($img);
                $h = imagesy($img);
                imagedestroy($img);
                if ($w > 0 && $h > 0) return [$w, $h];
            }
        }
        return null;
    }

    /** @return array{0:int|null,1:int|null} */
    private static function svgDimensions(string $bytes): array
    {
        $head = substr($bytes, 0, 4096);
        $w = null;
        $h = null;
        if (preg_match('/\bwidth\s*=\s*"([0-9.]+)/i', $head, $m) === 1) $w = (int)round((float)$m[1]);
        if (preg_match('/\bheight\s*=\s*"([0-9.]+)/i', $head, $m) === 1) $h = (int)round((float)$m[1]);
        if (($w === null || $h === null)
            && preg_match('/viewBox\s*=\s*"[\s0-9.\-]*?([0-9.]+)[\s,]+([0-9.]+)"/i', $head, $m) === 1) {
            $w ??= (int)round((float)$m[1]);
            $h ??= (int)round((float)$m[2]);
        }
        return [$w !== null && $w > 0 ? $w : null, $h !== null && $h > 0 ? $h : null];
    }

    public static function human(int $bytes): string
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024) . ' KB';
        return $bytes . ' B';
    }
}
