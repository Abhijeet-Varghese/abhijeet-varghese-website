<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * Runtime capability detection (Phase 3F §3F.8, §3F.11, §3F.14).
 *
 * The rule this class exists to enforce: **never claim a capability that was
 * not proven at runtime.** Not "Imagick is loaded so AVIF works" — Imagick can
 * be built without an AVIF delegate. Not "imageavif() exists so AVIF works" —
 * the function can exist and still fail on this libgd build.
 *
 * So every format claim is proven by ENCODING A 1×1 PIXEL and checking the
 * bytes came back. It costs microseconds once per process and it is the
 * difference between an API that reports the truth and one that promises an
 * AVIF derivative that never appears.
 *
 * On Hostinger shared hosting the answers may differ from any development box.
 * They are therefore computed on the server, never hardcoded, and surfaced
 * through the API so an operator can see what their host actually supports.
 */
final class Capabilities
{
    private static ?array $cache = null;

    /** Force re-detection. Tests use this; nothing else should need it. */
    public static function reset(): void { self::$cache = null; }

    /** @return array<string,mixed> */
    public static function all(): array
    {
        if (self::$cache !== null) return self::$cache;

        $imagick = self::detectImagick();
        $gd      = self::detectGd();

        $formats = [];
        foreach (['jpeg', 'png', 'webp', 'avif', 'gif'] as $fmt) {
            $formats[$fmt] = [
                'imagick' => $imagick['available'] && in_array($fmt, $imagick['formats'], true),
                'gd'      => $gd['available'] && in_array($fmt, $gd['formats'], true),
            ];
            $formats[$fmt]['any'] = $formats[$fmt]['imagick'] || $formats[$fmt]['gd'];
        }

        $ff = self::detectFfmpeg();

        return self::$cache = [
            'imagick'   => $imagick,
            'gd'        => $gd,
            'formats'   => $formats,
            'ffmpeg'    => $ff,
            'exif'      => extension_loaded('exif'),
            'fileinfo'  => extension_loaded('fileinfo'),
            // The image pipeline needs ONE working rasteriser, not a specific one.
            'image_pipeline' => $imagick['available'] || $gd['available'],
        ];
    }

    public static function canEncode(string $format): bool
    { return (bool)(self::all()['formats'][strtolower($format)]['any'] ?? false); }

    public static function hasImagick(): bool { return (bool)self::all()['imagick']['available']; }
    public static function hasGd(): bool      { return (bool)self::all()['gd']['available']; }
    public static function hasFfmpeg(): bool  { return (bool)self::all()['ffmpeg']['ffmpeg']; }
    public static function hasFfprobe(): bool { return (bool)self::all()['ffmpeg']['ffprobe']; }

    /** Client-safe summary: booleans and version strings only, never a path. */
    public static function publicSummary(): array
    {
        $c = self::all();
        return [
            'image_pipeline'  => $c['image_pipeline'],
            'driver'          => $c['imagick']['available'] ? 'imagick'
                               : ($c['gd']['available'] ? 'gd' : 'none'),
            'imagick'         => $c['imagick']['available'],
            'imagick_version' => $c['imagick']['version'],
            'gd'              => $c['gd']['available'],
            'gd_version'      => $c['gd']['version'],
            'encode'          => array_map(static fn(array $f): bool => $f['any'], $c['formats']),
            'ffmpeg'          => $c['ffmpeg']['ffmpeg'],
            'ffprobe'         => $c['ffmpeg']['ffprobe'],
            'transcoding'     => $c['ffmpeg']['ffmpeg'],
            'exif'            => $c['exif'],
        ];
    }

    // ------------------------------------------------------------- detection

    private static function detectImagick(): array
    {
        if (!extension_loaded('imagick') || !class_exists(\Imagick::class)) {
            return ['available' => false, 'version' => '', 'formats' => []];
        }
        try {
            $version = (string)(\Imagick::getVersion()['versionString'] ?? '');
            $declared = array_map('strtolower', \Imagick::queryFormats());
            $formats = [];
            foreach (['jpeg', 'png', 'webp', 'avif', 'gif'] as $fmt) {
                if (!in_array($fmt, $declared, true)) continue;
                if (self::imagickCanReallyEncode($fmt)) $formats[] = $fmt;
            }
            return ['available' => true, 'version' => $version, 'formats' => $formats];
        } catch (\Throwable) {
            return ['available' => false, 'version' => '', 'formats' => []];
        }
    }

    /** Encode one pixel. A declared format that cannot encode is not a format. */
    private static function imagickCanReallyEncode(string $format): bool
    {
        try {
            $im = new \Imagick();
            $im->newImage(1, 1, new \ImagickPixel('white'));
            $im->setImageFormat($format);
            $blob = $im->getImagesBlob();
            $im->clear();
            return is_string($blob) && $blob !== '';
        } catch (\Throwable) {
            return false;
        }
    }

    private static function detectGd(): array
    {
        if (!extension_loaded('gd') || !function_exists('gd_info')) {
            return ['available' => false, 'version' => '', 'formats' => []];
        }
        $info = gd_info();
        $formats = [];
        foreach ([
            'jpeg' => 'imagejpeg', 'png' => 'imagepng', 'gif' => 'imagegif',
            'webp' => 'imagewebp', 'avif' => 'imageavif',
        ] as $fmt => $fn) {
            if (!function_exists($fn)) continue;
            if (self::gdCanReallyEncode($fn)) $formats[] = $fmt;
        }
        return [
            'available' => true,
            'version'   => (string)($info['GD Version'] ?? ''),
            'formats'   => $formats,
        ];
    }

    private static function gdCanReallyEncode(string $fn): bool
    {
        try {
            $img = @imagecreatetruecolor(1, 1);
            if ($img === false) return false;
            ob_start();
            // imageavif()/imagewebp() emit warnings on unsupported builds; the
            // return value plus buffer length is the only reliable signal.
            $ok = @$fn($img);
            $out = (string)ob_get_clean();
            imagedestroy($img);
            return $ok === true && $out !== '';
        } catch (\Throwable) {
            @ob_end_clean();
            return false;
        }
    }

    /**
     * FFmpeg detection. Shared hosting usually forbids proc_open/exec entirely,
     * so the FIRST thing checked is whether shelling out is even permitted —
     * otherwise every probe would silently return "not available" for the wrong
     * reason and an operator could not tell a missing binary from a disabled
     * function.
     */
    private static function detectFfmpeg(): array
    {
        $disabled = array_map('trim', explode(',', (string)ini_get('disable_functions')));
        $canShell = function_exists('proc_open') && !in_array('proc_open', $disabled, true);

        if (!$canShell) {
            return ['ffmpeg' => false, 'ffprobe' => false, 'shell' => false,
                    'reason' => 'proc_open is unavailable or disabled on this host'];
        }
        return [
            'ffmpeg'  => self::binaryWorks('ffmpeg'),
            'ffprobe' => self::binaryWorks('ffprobe'),
            'shell'   => true,
            'reason'  => '',
        ];
    }

    private static function binaryWorks(string $bin): bool
    {
        $out = self::run([$bin, '-version']);
        return $out !== null && str_contains(strtolower($out), 'version');
    }

    /**
     * Run a binary with an ARGUMENT ARRAY — never a shell string. proc_open in
     * array mode does not invoke a shell, so a filename can never become a
     * command no matter what it contains.
     *
     * @param string[] $argv
     */
    public static function run(array $argv, int $timeoutSeconds = 20): ?string
    {
        if (!function_exists('proc_open')) return null;
        $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $pipes = [];
        $proc = @proc_open($argv, $descriptors, $pipes);
        if (!is_resource($proc)) return null;

        $stdout = '';
        $stderr = '';
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);
        $deadline = microtime(true) + $timeoutSeconds;

        while (microtime(true) < $deadline) {
            $stdout .= (string)stream_get_contents($pipes[1]);
            $stderr .= (string)stream_get_contents($pipes[2]);
            $status = proc_get_status($proc);
            if (!$status['running']) break;
            usleep(20000);
        }
        $stdout .= (string)stream_get_contents($pipes[1]);
        $stderr .= (string)stream_get_contents($pipes[2]);

        $status = proc_get_status($proc);
        if ($status['running']) { proc_terminate($proc, 9); }
        foreach ($pipes as $p) { if (is_resource($p)) fclose($p); }
        proc_close($proc);

        return $stdout !== '' ? $stdout : $stderr;
    }
}
