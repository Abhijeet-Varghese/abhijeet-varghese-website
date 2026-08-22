<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Upload validation foundation (SECURITY-ARCHITECTURE §3).
 * Validation only — storage, derivatives and the media domain are Phase 3H.
 */
final class UploadValidator
{
    /** Never storable, regardless of declared MIME. */
    public const BLOCKED_EXT = [
        'php','php3','php4','php5','php7','php8','phtml','pht','phar','phps',
        'cgi','pl','py','sh','bash','asp','aspx','jsp','jspx','htaccess','htpasswd','ini','so','dll','exe',
    ];

    /** extension => acceptable MIME prefixes */
    public const ALLOWED = [
        'png'=>['image/png'], 'jpg'=>['image/jpeg'], 'jpeg'=>['image/jpeg'],
        'webp'=>['image/webp'], 'avif'=>['image/avif'], 'gif'=>['image/gif'],
        'svg'=>['image/svg+xml','text/plain','text/xml','application/xml'],
        'pdf'=>['application/pdf'],
        'mp4'=>['video/mp4'], 'webm'=>['video/webm'], 'mov'=>['video/quicktime'],
        'mp3'=>['audio/mpeg'], 'wav'=>['audio/x-wav','audio/wav'],
        'glb'=>['model/gltf-binary','application/octet-stream'],
        'gltf'=>['model/gltf+json','application/json','text/plain'],
        'hdr'=>['image/vnd.radiance','application/octet-stream'],
        'ktx2'=>['image/ktx2','application/octet-stream'],
        'glsl'=>['text/plain'], 'frag'=>['text/plain'], 'vert'=>['text/plain'],
        'woff'=>['font/woff','application/font-woff'], 'woff2'=>['font/woff2','application/octet-stream'],
        'zip'=>['application/zip'], 'txt'=>['text/plain'], 'md'=>['text/markdown','text/plain'],
    ];

    /** @return array{ok:bool,reason:string,ext:string,mime:string} */
    public static function validate(string $filename, string $bytes, int $maxBytes): array
    {
        $fail = static fn(string $r, string $e = '', string $m = '') =>
            ['ok' => false, 'reason' => $r, 'ext' => $e, 'mime' => $m];

        if ($bytes === '') return $fail('empty file');
        if (strlen($bytes) > $maxBytes) return $fail('file exceeds the size limit');

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($ext === '') return $fail('missing extension');
        if (in_array($ext, self::BLOCKED_EXT, true)) return $fail('executable file type is not allowed', $ext);

        // Double extensions (evil.php.webp) — every part must be clean.
        foreach (explode('.', strtolower($filename)) as $part) {
            if (in_array($part, self::BLOCKED_EXT, true)) {
                return $fail('executable file type is not allowed', $ext);
            }
        }
        if (!array_key_exists($ext, self::ALLOWED)) return $fail('unsupported file type', $ext);

        // Trust content, not the filename.
        $mime = 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $fi = finfo_open(FILEINFO_MIME_TYPE);
            if ($fi !== false) { $mime = (string)finfo_buffer($fi, $bytes); finfo_close($fi); }
        }
        $okMime = false;
        foreach (self::ALLOWED[$ext] as $prefix) {
            if (str_starts_with($mime, $prefix)) { $okMime = true; break; }
        }
        if (!$okMime) return $fail('file content does not match its extension', $ext, $mime);

        // A PHP open tag inside a non-text upload is always hostile.
        if (!in_array($ext, ['txt','md','glsl','frag','vert','gltf','svg'], true)
            && str_contains(substr($bytes, 0, 4096), '<?php')) {
            return $fail('embedded script detected', $ext, $mime);
        }
        return ['ok' => true, 'reason' => '', 'ext' => $ext, 'mime' => $mime];
    }

    /** Storage name never derives from user input. */
    public static function safeStorageName(string $ext): string
    { return bin2hex(random_bytes(8)) . '.' . strtolower($ext); }
}
