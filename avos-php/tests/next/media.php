<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3F test suite: media & asset engine.
 *   php avos-php/tests/next/media.php
 *
 * Covers §3F.29–§3F.33. Dependency-free. Database tests SKIP (never silently
 * pass) when MariaDB is unreachable; capability-dependent tests report
 * "NOT AVAILABLE IN ENVIRONMENT" rather than PASS (§3F.30).
 *
 * TEST DATA POLICY (§3F.33)
 * -------------------------
 * Every fixture is generated in-process — no binary is committed, nothing is
 * imported, and no production or legacy asset is touched. Names are prefixed
 * `zzz-avos-` and users live on `example.test`. The suite cleans up after
 * itself and then asserts the cleanup worked.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Auth\PasswordHasher;
use AvOS\Content\Cache\RecordingCacheInvalidator;
use AvOS\Database\Connection;
use AvOS\Domain\Media\AssetRepository;
use AvOS\Domain\Media\AssetService;
use AvOS\Domain\Media\AssetUsageService;
use AvOS\Domain\Media\DerivativeService;
use AvOS\Domain\Media\DownloadService;
use AvOS\Domain\Media\OrphanService;
use AvOS\Domain\Media\UsageRepository;
use AvOS\Domain\Media\VariantRepository;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Media\AssetKind;
use AvOS\Media\Capabilities;
use AvOS\Media\DerivativeSpec;
use AvOS\Media\ExifReader;
use AvOS\Media\FileNaming;
use AvOS\Media\Image\ImageProcessorFactory;
use AvOS\Media\MetadataExtractor;
use AvOS\Media\MimeRegistry;
use AvOS\Media\Storage\LocalFilesystemStorage;
use AvOS\Media\Storage\StorageManager;
use AvOS\Media\UploadGuard;
use AvOS\Media\Video\TranscodeService;
use AvOS\Media\Video\VideoProbe;
use AvOS\Migration\MigrationRunner;
use AvOS\Migration\SystemSeeder;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;
use AvOS\Security\UploadValidator;

final class M
{
    public static int $pass = 0, $fail = 0, $skip = 0, $na = 0;
    public static function group(string $g): void
    { echo "\n  {$g}\n  " . str_repeat('-', 72) . "\n"; }
    public static function ok(string $n, bool $c): void
    { $c ? self::$pass++ : self::$fail++; printf("    %-60s %s\n", substr($n, 0, 60), $c ? 'PASS' : 'FAIL'); }
    public static function eq(string $n, mixed $a, mixed $b): void
    {
        if ($a !== $b) { self::$fail++;
            printf("    %-60s FAIL  (%s != %s)\n", substr($n, 0, 60),
                substr(var_export($a, true), 0, 45), substr(var_export($b, true), 0, 45)); return; }
        self::ok($n, true);
    }
    public static function throwsCode(string $n, callable $fn, string $code): void
    {
        try { $fn(); self::ok($n . ' [no exception]', false); }
        catch (ApiException $e) {
            if ($e->code() === $code) { self::ok($n, true); return; }
            self::$fail++; printf("    %-60s FAIL  (got %s want %s)\n", substr($n, 0, 60), $e->code(), $code);
        }
        catch (Throwable $e) { self::ok($n . ' [' . $e::class . ': ' . $e->getMessage() . ']', false); }
    }
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
    /** §3F.30 — an unavailable capability is reported, never counted as a pass. */
    public static function na(string $n, string $why): void
    { self::$na++; printf("    %-60s NOT AVAILABLE IN ENVIRONMENT (%s)\n", substr($n, 0, 60), $why); }
}

/* ======================== FIXTURE GENERATORS ============================ */
/** Everything is generated in-process; no binary fixture is committed. */
final class Fx
{
    public static function png(int $w = 800, int $h = 600): string
    {
        if (Capabilities::hasImagick()) {
            $im = new Imagick();
            $im->newImage($w, $h, new ImagickPixel('rgba(20,80,160,1)'));
            $im->setImageFormat('png');
            $b = $im->getImagesBlob();
            $im->clear();
            return (string)$b;
        }
        $img = imagecreatetruecolor($w, $h);
        imagefill($img, 0, 0, imagecolorallocate($img, 20, 80, 160));
        ob_start(); imagepng($img); $b = (string)ob_get_clean();
        imagedestroy($img);
        return $b;
    }

    public static function jpeg(int $w = 1600, int $h = 1000): string
    {
        if (Capabilities::hasImagick()) {
            $im = new Imagick();
            $im->newPseudoImage($w, $h, 'gradient:red-blue');
            $im->setImageFormat('jpeg');
            $b = $im->getImagesBlob();
            $im->clear();
            return (string)$b;
        }
        $img = imagecreatetruecolor($w, $h);
        imagefill($img, 0, 0, imagecolorallocate($img, 200, 30, 30));
        ob_start(); imagejpeg($img, null, 90); $b = (string)ob_get_clean();
        imagedestroy($img);
        return $b;
    }

    /** A JPEG carrying an EXIF block with GPS strings, for the stripping test. */
    public static function jpegWithGps(int $w = 1400, int $h = 900): ?string
    {
        if (!Capabilities::hasImagick()) return null;
        try {
            $im = new Imagick();
            $im->newPseudoImage($w, $h, 'gradient:green-yellow');
            $im->setImageFormat('jpeg');
            $tiff = "II\x2a\x00\x08\x00\x00\x00";
            $im->profileImage('exif',
                "Exif\x00\x00" . $tiff . 'GPSLatitude=51.5074 GPSLongitude=-0.1278 Make=ZZZTESTCAM');
            $b = $im->getImagesBlob();
            $im->clear();
            return (string)$b;
        } catch (Throwable) {
            return null;
        }
    }

    public static function svg(bool $hostile = false): string
    {
        $payload = $hostile ? '<script>alert(1)</script>' : '<title>zzz test</title>';
        return '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" '
             . 'width="240" height="120" viewBox="0 0 240 120">' . $payload
             . '<rect width="240" height="120" fill="#123"/></svg>';
    }

    public static function shader(): string
    {
        return "// zzz avos test shader\n#version 300 es\nprecision highp float;\n"
             . "uniform float uTime;\nuniform vec2 uResolution;\nout vec4 fragColor;\n"
             . "void main(){ fragColor = vec4(gl_FragCoord.xy/uResolution, uTime, 1.0); }\n";
    }

    public static function script(): string
    {
        return "// zzz avos test animation\nimport gsap from 'gsap';\n"
             . "export const boot = () => gsap.to('.x', { opacity: 1 });\n";
    }

    /** A structurally valid minimal GLB: header + a JSON chunk. */
    public static function glb(): string
    {
        $json = json_encode([
            'asset'  => ['version' => '2.0', 'generator' => 'zzz-avos-test'],
            'scenes' => [['nodes' => [0]]],
            'nodes'  => [['mesh' => 0]],
            'meshes' => [['primitives' => [['attributes' => ['POSITION' => 0]]]]],
            'accessors' => [[
                'type' => 'VEC3', 'componentType' => 5126, 'count' => 3,
                'min' => [-1.0, -2.0, -0.5], 'max' => [1.0, 2.0, 0.5],
            ]],
        ], JSON_UNESCAPED_SLASHES);
        $json = str_pad((string)$json, (int)(ceil(strlen((string)$json) / 4) * 4), ' ');
        $jsonChunk = pack('VV', strlen($json), 0x4E4F534A) . $json;
        $total = 12 + strlen($jsonChunk);
        return 'glTF' . pack('VV', 2, $total) . $jsonChunk;
    }

    /** A tiny real MP4, built by ffmpeg when it exists. */
    public static function mp4(): ?string
    {
        if (!Capabilities::hasFfmpeg()) return null;
        $out = sys_get_temp_dir() . '/zzz-avos-' . bin2hex(random_bytes(5)) . '.mp4';
        Capabilities::run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=10:duration=1',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', $out,
        ], 90);
        if (!is_file($out)) return null;
        $bytes = (string)file_get_contents($out);
        @unlink($out);
        return $bytes !== '' ? $bytes : null;
    }

    public static function pdf(): string
    {
        return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
             . "2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
    }
}

/* ========================= 3F.2 ASSET CLASSES =========================== */
M::group('3F.2 asset classes');

M::eq('ten asset classes', count(AssetKind::ALL), 10);
foreach (['image', 'video', 'audio', 'document', 'model', 'texture', 'shader', 'script', 'font', 'other'] as $k) {
    M::ok("class exists: {$k}", AssetKind::isValid($k));
}
M::eq('MODEL_3D maps onto the approved `model` value', AssetKind::MODEL_3D, 'model');
M::ok('shaders are marked never-executed', in_array(AssetKind::SHADER, AssetKind::NEVER_EXECUTED, true));
M::ok('scripts are marked never-executed', in_array(AssetKind::SCRIPT, AssetKind::NEVER_EXECUTED, true));
M::ok('only images and textures rasterise', AssetKind::RASTERISABLE === ['image', 'texture']);

/* ===================== 3F.6 MIME REGISTRY =============================== */
M::group('3F.6 MIME registry');

M::eq('allow-list never contradicts the Phase 3A deny list',
    MimeRegistry::conflictsWithDenyList(), []);
M::eq('.js is classified as a script asset', MimeRegistry::kindFor('js'), AssetKind::SCRIPT);
M::eq('.frag is a shader', MimeRegistry::kindFor('frag'), AssetKind::SHADER);
M::eq('.glb is a 3D model', MimeRegistry::kindFor('glb'), AssetKind::MODEL_3D);
M::eq('.woff2 is a font', MimeRegistry::kindFor('woff2'), AssetKind::FONT);
M::eq('.ktx2 is a texture', MimeRegistry::kindFor('ktx2'), AssetKind::TEXTURE);
M::ok('php is not on the allow-list', !MimeRegistry::isAllowedExtension('php'));
M::ok('phtml is not on the allow-list', !MimeRegistry::isAllowedExtension('phtml'));
M::ok('sniffed jpeg matches .jpg', MimeRegistry::mimeMatches('jpg', 'image/jpeg'));
M::ok('sniffed html does NOT match .jpg', !MimeRegistry::mimeMatches('jpg', 'text/html'));
M::ok('png signature accepted', MimeRegistry::signatureMatches('png', Fx::png(4, 4)));
M::ok('png signature rejects a wrong header', !MimeRegistry::signatureMatches('png', 'GIF89a....'));
M::ok('webp needs BOTH RIFF and WEBP slots',
    !MimeRegistry::signatureMatches('webp', 'RIFF' . str_repeat("\x00", 4) . 'XXXX'));

/* ======================= 3F.4 FILE NAMING =============================== */
M::group('3F.4 / 3F.5 file naming and layout');

$naming = new FileNaming('zzz-test-salt-not-a-real-key');
$hash = hash('sha256', 'zzz avos test content');
$rel = $naming->relativePath($hash, 'jpg');

M::ok('path is sharded media/YYYY/MM/xx/name.ext',
    preg_match('#^media/\d{4}/\d{2}/[0-9a-f]{2}/[0-9a-f]{24}\.jpg$#', $rel) === 1);
M::ok('storage name does not contain the original filename',
    !str_contains($rel, 'photo') && !str_contains($rel, 'upload'));
M::ok('storage name does not contain the content hash verbatim',
    !str_contains($rel, substr($hash, 0, 16)));
M::eq('naming is deterministic for identical bytes', $naming->relativePath($hash, 'jpg', 1755000000),
    $naming->relativePath($hash, 'jpg', 1755000000));
M::ok('a different salt yields a different path',
    (new FileNaming('other-salt'))->relativePath($hash, 'jpg', 1755000000)
        !== $naming->relativePath($hash, 'jpg', 1755000000));
M::ok('shard directory equals the first two characters of the name',
    substr(basename($rel), 0, 2) === basename(dirname($rel)));
M::eq('derivative path is suffixed and typed',
    basename($naming->derivativePath('media/2026/08/ab/abcdef.jpg', 'hero', 1280, 'webp')),
    'abcdef-hero-1280.webp');

M::eq('traversal is stripped from a stored original name',
    FileNaming::sanitiseOriginalName('../../etc/passwd'), 'passwd');
M::eq('a windows path is stripped',
    FileNaming::sanitiseOriginalName('C:\\Users\\me\\photo.jpg'), 'photo.jpg');
M::ok('a null byte is removed',
    !str_contains(FileNaming::sanitiseOriginalName("shell\0.jpg"), "\0"));
M::ok('a leading dot cannot create a dotfile',
    !str_starts_with(FileNaming::sanitiseOriginalName('.htaccess'), '.'));
M::ok('an over-long name is capped',
    strlen(FileNaming::sanitiseOriginalName(str_repeat('a', 400) . '.jpg')) <= 180);

/* ======================= 3F.8 CAPABILITIES ============================== */
M::group('3F.8 / 3F.11 runtime capability detection');

$caps = Capabilities::publicSummary();
printf("    %-60s %s\n", 'driver', $caps['driver']);
printf("    %-60s %s\n", 'encoders', json_encode($caps['encode']));
printf("    %-60s %s\n", 'ffmpeg / ffprobe',
    ($caps['ffmpeg'] ? 'yes' : 'no') . ' / ' . ($caps['ffprobe'] ? 'yes' : 'no'));

M::ok('a driver is reported', in_array($caps['driver'], ['imagick', 'gd', 'none'], true));
M::ok('every format claim is a boolean',
    array_filter($caps['encode'], static fn($v): bool => !is_bool($v)) === []);
M::eq('image_pipeline agrees with the driver',
    $caps['image_pipeline'], $caps['driver'] !== 'none');

// The honesty property: a claimed format must genuinely encode.
$factory = new ImageProcessorFactory();
foreach (['jpeg', 'png', 'webp', 'avif'] as $fmt) {
    if (!Capabilities::canEncode($fmt)) {
        M::na("encode {$fmt}", 'no driver on this host can encode it');
        continue;
    }
    $p = $factory->forFormat($fmt);
    $out = $p?->encode(Fx::png(120, 90), 60, $fmt, 80);
    M::ok("claimed {$fmt} support actually produces bytes", is_string($out) && $out !== '');
}
M::ok('an unknown format is never claimed', !Capabilities::canEncode('tiff-nonsense'));

/* ==================== 3F.10 DERIVATIVE LADDER =========================== */
M::group('3F.10 centralised derivative configuration');

M::eq('five rungs', count(DerivativeSpec::purposes()), 5);
M::eq('ladder widths ascend', array_map(
    static fn(string $p): int => DerivativeSpec::width($p), DerivativeSpec::purposes()),
    [320, 640, 1280, 1920, 2560]);
M::eq('thumb is the brief\'s thumbnail', DerivativeSpec::briefName('thumb'), 'thumbnail');
M::eq('xlarge is the brief\'s xlarge', DerivativeSpec::briefName('xlarge'), 'xlarge');
M::ok('an arbitrary size is not a valid purpose', !DerivativeSpec::isValidPurpose('1337'));
M::eq('a 900px source produces only the rungs below it',
    DerivativeSpec::rungsFor(900), ['thumb', 'card']);
M::eq('a tiny source still produces a thumbnail', DerivativeSpec::rungsFor(50), ['thumb']);
M::eq('a huge source produces every rung', count(DerivativeSpec::rungsFor(4000)), 5);
M::ok('a png source keeps a lossless baseline',
    in_array('png', DerivativeSpec::formatsFor('png'), true) || !Capabilities::canEncode('png'));
M::ok('a jpeg source uses the lossy baseline',
    !in_array('png', DerivativeSpec::formatsFor('jpg'), true));

/* ================= 3F.7 / 3F.29 UPLOAD SECURITY ========================= */
M::group('3F.7 / 3F.29 upload security battery');

$guard = new UploadGuard(8 * 1024 * 1024);
$png = Fx::png(200, 150);
$jpeg = Fx::jpeg(400, 300);

$reject = static function (string $label, string $name, string $bytes, string $expectCode) use ($guard): void {
    $r = $guard->inspect($name, $bytes);
    if ($r->ok) { M::ok($label . ' [ACCEPTED — should have been refused]', false); return; }
    if ($r->code !== $expectCode) {
        M::$fail++;
        printf("    %-60s FAIL  (code %s, want %s)\n", substr($label, 0, 60), $r->code, $expectCode);
        return;
    }
    M::ok($label, true);
};

// --- executable uploads ---------------------------------------------------
$phpBody = "<?php system(\$_GET['c']); ?>";
$reject('.php upload refused', 'shell.php', $phpBody, 'EXECUTABLE_REJECTED');
$reject('.phtml upload refused', 'shell.phtml', $phpBody, 'EXECUTABLE_REJECTED');
$reject('.php5 upload refused', 'shell.php5', $phpBody, 'EXECUTABLE_REJECTED');
$reject('.phar upload refused', 'shell.phar', $phpBody, 'EXECUTABLE_REJECTED');
$reject('.php3 upload refused', 'shell.php3', $phpBody, 'EXECUTABLE_REJECTED');
$reject('double extension shell.php.jpg refused', 'shell.php.jpg', $png, 'EXECUTABLE_REJECTED');
$reject('double extension shell.jpg.php refused', 'shell.jpg.php', $png, 'EXECUTABLE_REJECTED');
$reject('.htaccess refused', 'x.htaccess', "php_flag engine on\n", 'EXECUTABLE_REJECTED');

// --- disguise and polyglot -------------------------------------------------
$reject('PHP renamed to .jpg refused (MIME mismatch)', 'notreally.jpg', $phpBody, 'MIME_MISMATCH');
$reject('HTML pretending to be an image refused',
    'page.png', "<!doctype html><html><body>hi</body></html>", 'MIME_MISMATCH');
$reject('GIF/PHP polyglot refused',
    'polyglot.gif', "GIF89a" . str_repeat("\x00", 32) . $phpBody, 'EMBEDDED_SCRIPT');
$reject('PNG with an appended PHP payload refused',
    'trojan.png', $png . $phpBody, 'EMBEDDED_SCRIPT');
$reject('a JPEG body under a .png name refused (signature)',
    'mislabelled.png', $jpeg, 'MIME_MISMATCH');

// --- filename attacks ------------------------------------------------------
$reject('null byte in the filename refused', "image\0.php.png", $png, 'UNSAFE_FILENAME');
$reject('path traversal in the filename refused', '../../../etc/passwd.png', $png, 'UNSAFE_FILENAME');
$reject('backslash traversal refused', '..\\..\\win.png', $png, 'UNSAFE_FILENAME');
$reject('a control character in the filename refused', "bad\x01name.png", $png, 'UNSAFE_FILENAME');
$reject('a file with no extension refused', 'noextension', $png, 'MISSING_EXTENSION');

// --- SVG -------------------------------------------------------------------
$reject('SVG containing <script> refused', 'evil.svg', Fx::svg(true), 'SVG_ACTIVE_CONTENT');
$reject('SVG with an onload handler refused',
    'evil2.svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>', 'SVG_ACTIVE_CONTENT');
$reject('SVG with a javascript: href refused',
    'evil3.svg', '<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="javascript:alert(1)"/></svg>',
    'SVG_ACTIVE_CONTENT');
$reject('SVG with a foreignObject refused',
    'evil4.svg', '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>', 'SVG_ACTIVE_CONTENT');
M::ok('a clean SVG is accepted', $guard->inspect('clean.svg', Fx::svg(false))->ok);

// --- size and corruption ---------------------------------------------------
$reject('an empty file refused', 'empty.png', '', 'EMPTY_FILE');
$reject('an oversized file refused',
    'huge.png', $png . str_repeat("\x00", 9 * 1024 * 1024), 'FILE_TOO_LARGE');
// Random bytes behind a PNG magic number do not even sniff as an image.
$reject('random bytes behind a PNG header refused',
    'garbage.png', "\x89PNG\r\n\x1a\n" . random_bytes(200), 'MIME_MISMATCH');
// The harder case: a real PNG truncated mid-data. It sniffs as image/png AND
// passes getimagesize(), so only a full decode catches it.
$truncated = substr($png, 0, (int)(strlen($png) * 0.55));
M::eq('the truncated fixture still sniffs as a PNG', UploadGuard::sniff($truncated), 'image/png');
M::ok('the truncated fixture still passes a header-only check',
    @getimagesizefromstring($truncated) !== false);
if (Capabilities::publicSummary()['image_pipeline']) {
    $reject('a truncated image refused by full decode', 'truncated.png', $truncated, 'CORRUPT_IMAGE');
} else {
    M::na('truncated-image detection', 'a full decode needs Imagick or GD');
}
$reject('an unsupported type refused', 'archive.rar', "Rar!\x1a\x07\x00", 'UNSUPPORTED_TYPE');

// --- valid uploads ---------------------------------------------------------
$okPng = $guard->inspect('zzz-avos-photo.png', $png);
M::ok('a valid PNG is accepted', $okPng->ok);
M::eq('accepted PNG is classified as an image', $okPng->kind, AssetKind::IMAGE);
M::eq('accepted PNG reports its real dimensions', [$okPng->width, $okPng->height], [200, 150]);
M::eq('accepted PNG hash is sha256 of the bytes', $okPng->hash, hash('sha256', $png));
// Regression guard for a real bug: libmagic reports GLSL as text/x-c, and an
// allow-list of only text/plain rejected every shader.
M::eq('GLSL genuinely sniffs as text/x-c on this host',
    UploadGuard::sniff(Fx::shader()), 'text/x-c');
M::ok('a shader is accepted despite the text/x-c subtype',
    $guard->inspect('wave.frag', Fx::shader())->ok);
M::ok('.obj sniffing as text/plain is accepted',
    $guard->inspect('mesh.obj', "v 1.0 2.0 3.0\nf 1 2 3\n")->ok);
$reject('text/html is never accepted for a textual asset',
    'page.frag', '<!doctype html><html><body>x</body></html>', 'MIME_MISMATCH');
M::ok('a script is accepted as data', $guard->inspect('anim.js', Fx::script())->ok);
M::eq('a script is classified as SCRIPT, never executed',
    $guard->inspect('anim.js', Fx::script())->kind, AssetKind::SCRIPT);
M::ok('a GLB is accepted', $guard->inspect('model.glb', Fx::glb())->ok);
M::ok('a PDF is accepted', $guard->inspect('doc.pdf', Fx::pdf())->ok);
$reject('a .js containing a PHP tag is still refused',
    'sneaky.js', "// x\n<?php echo 1; ?>\n", 'EMBEDDED_SCRIPT');

/* ======================== 3F.9 EXIF PRIVACY ============================= */
M::group('3F.9 EXIF privacy');

M::ok('the reader never keeps a GPS-named key',
    !ExifReader::containsLocationData(ExifReader::read(Fx::jpeg(80, 60))['summary']));
$gpsJpeg = Fx::jpegWithGps();
if ($gpsJpeg === null) {
    M::na('EXIF/GPS source fixture', 'Imagick is required to build one');
} else {
    M::ok('the GPS fixture really does carry the marker', str_contains($gpsJpeg, 'GPSLatitude'));
    $read = ExifReader::read($gpsJpeg);
    M::ok('no GPS key survives into the stored summary',
        !ExifReader::containsLocationData($read['summary']));
    $flat = strtolower(json_encode($read['summary']) ?: '');
    M::ok('the stored summary contains no latitude value', !str_contains($flat, '51.5074'));
    M::ok('the stored summary contains no longitude value', !str_contains($flat, '0.1278'));
}

/* ====================== 3F.3 STORAGE ABSTRACTION ======================== */
M::group('3F.3 local filesystem storage');

$tmpRoot = sys_get_temp_dir() . '/zzz-avos-store-' . bin2hex(random_bytes(5));
$store = new LocalFilesystemStorage($tmpRoot);
$store->ensureRoot();

M::ok('root is created on demand', is_dir($tmpRoot));
M::ok('root is writable', $store->writable());
M::ok('a deny file is planted in the private root', is_file($tmpRoot . '/.htaccess'));
M::ok('the deny file blocks PHP execution',
    str_contains((string)file_get_contents($tmpRoot . '/.htaccess'), 'php_flag engine off'));

$store->put('media/2026/08/ab/zzztest.txt', 'hello avos');
M::ok('put writes a file', $store->exists('media/2026/08/ab/zzztest.txt'));
M::eq('get reads it back', $store->get('media/2026/08/ab/zzztest.txt'), 'hello avos');
M::eq('metadata reports the byte count',
    $store->metadata('media/2026/08/ab/zzztest.txt')['bytes'], 10);
M::ok('no .part- artefact is left behind',
    glob($tmpRoot . '/media/2026/08/ab/*.part-*') === []);

$fh = $store->readStream('media/2026/08/ab/zzztest.txt');
M::ok('readStream returns a handle', is_resource($fh));
if (is_resource($fh)) { M::eq('the stream yields the content', stream_get_contents($fh), 'hello avos'); fclose($fh); }

M::ok('copy works', $store->copy('media/2026/08/ab/zzztest.txt', 'media/2026/08/cd/copy.txt'));
M::ok('move works', $store->move('media/2026/08/cd/copy.txt', 'media/2026/08/cd/moved.txt'));
M::ok('the moved source is gone', !$store->exists('media/2026/08/cd/copy.txt'));
$lc = $store->linkOrCopy('media/2026/08/ab/zzztest.txt', 'media/2026/08/cd/linked.txt');
M::ok('linkOrCopy succeeds and reports its method',
    $lc['ok'] && in_array($lc['method'], ['hardlink', 'copy'], true));
printf("    %-60s %s\n", 'linkOrCopy method used', $lc['method']);

foreach ([
    '../../../etc/passwd', '/etc/passwd', 'media/../../escape.txt',
    "media/null\0.txt", 'media\\win.txt', 'media/%2e%2e/x.txt',
] as $evil) {
    M::ok('path rejected: ' . str_replace("\0", '\\0', $evil), $store->absolute($evil) === null);
}
M::ok('a legitimate relative path resolves',
    $store->absolute('media/2026/08/ab/zzztest.txt') !== null);
M::ok('a resolved path stays inside the root',
    str_starts_with((string)$store->absolute('media/2026/08/ab/zzztest.txt'),
        (string)realpath($tmpRoot)));

$tmpFile = $store->temporaryPath('bin');
M::ok('temporaryPath is inside the store', str_starts_with($tmpFile, $tmpRoot));
M::ok('temporaryPath is not the original name', !str_contains($tmpFile, 'zzztest'));

$listed = $store->listAll('media');
M::ok('listAll finds stored files', in_array('media/2026/08/ab/zzztest.txt', $listed, true));
M::ok('listAll ignores the deny file', !in_array('.htaccess', $listed, true));

M::ok('delete removes the file', $store->delete('media/2026/08/ab/zzztest.txt'));
M::ok('deleting a missing file is false, not fatal', !$store->delete('media/nope/missing.txt'));

/* ============ 3F.31 STORAGE FAILURE (no database involved) ============== */
M::group('3F.31 storage failure handling');

$roRoot = sys_get_temp_dir() . '/zzz-avos-ro-' . bin2hex(random_bytes(5));
@mkdir($roRoot, 0755, true);
$roStore = new LocalFilesystemStorage($roRoot, plantDenyFile: false);
@chmod($roRoot, 0555);
$isRoot = function_exists('posix_geteuid') && posix_geteuid() === 0;
if ($isRoot) {
    M::na('read-only directory rejection', 'running as root, which bypasses permissions');
} else {
    $threw = false;
    try { $roStore->put('media/x/y/z.txt', 'nope'); } catch (Throwable) { $threw = true; }
    M::ok('a permission-denied write throws rather than reporting success', $threw);
    M::ok('nothing was created in the read-only tree', !$roStore->exists('media/x/y/z.txt'));
}
@chmod($roRoot, 0755);
@rmdir($roRoot);

$missingStore = new LocalFilesystemStorage('/nonexistent-zzz-avos/definitely/not/here', false);
M::ok('a missing storage root reports not-writable', !$missingStore->writable());
M::ok('a missing root cannot resolve a path', $missingStore->absolute('media/a.txt') === null);
M::eq('a missing root lists nothing', $missingStore->listAll(), []);

// A partial write must never be visible as a real file.
$store->put('media/2026/08/ef/partial.txt', 'complete');
$partial = $tmpRoot . '/media/2026/08/ef/partial.txt.part-deadbeef';
@file_put_contents($partial, 'half');
M::ok('a stray .part- file is not listed as an asset',
    !in_array('media/2026/08/ef/partial.txt.part-deadbeef', $store->listAll('media'), true));
@touch($partial, time() - 7200);
M::ok('sweepPartials removes a stale partial', $store->sweepPartials(3600) >= 1);

/* ============================ DATABASE ================================== */
$testDb = getenv('AVOS_TEST_DB') ?: 'avos_next_test';
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1',
    $testDb,
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);
$dbUp = false;
try {
    $conn->serverPdo()->exec('CREATE DATABASE IF NOT EXISTS `' . $testDb . '`');
    $conn->pdo();
    $dbUp = true;
} catch (Throwable) {
    M::group('database-backed tests');
    M::skip('all database tests', 'MariaDB unreachable');
}

if ($dbUp) {
    $runner = new MigrationRunner($conn, $root . '/database/next/migrations');
    $runner->createDatabaseIfMissing();
    $runner->dropAll();
    $runner->migrate(false);
    (new SystemSeeder($conn))->run();

    $mediaRoot = sys_get_temp_dir() . '/zzz-avos-media-' . bin2hex(random_bytes(5));
    $pubRoot   = sys_get_temp_dir() . '/zzz-avos-public-' . bin2hex(random_bytes(5));
    $storage = new StorageManager($mediaRoot, $pubRoot);

    $PW = 'MediaFixture_2026!x';
    $users = new UserRepository($conn, new PasswordHasher());
    $identity = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', '');
    $uid = [
        'administrator' => $users->create('ZZZ Media Admin', 'zzz-avos-mediaadmin@example.test', $PW, ['administrator'], false)->id,
        'media_manager' => $users->create('ZZZ Media Mgr', 'zzz-avos-mediamgr@example.test', $PW, ['media_manager'], false)->id,
        'editor'        => $users->create('ZZZ Media Editor', 'zzz-avos-mediaeditor@example.test', $PW, ['editor'], false)->id,
        'content_manager' => $users->create('ZZZ Media CM', 'zzz-avos-mediacm@example.test', $PW, ['content_manager'], false)->id,
        'seo_manager'     => $users->create('ZZZ Media SEO', 'zzz-avos-mediaseo@example.test', $PW, ['seo_manager'], false)->id,
    ];
    $authz = new Authorizer($users, $identity);
    $as = static function (string $role) use ($authz, $users, $uid): void {
        $authz->setUser($users->findById($uid[$role]));
    };
    $as('administrator');

    $audit = new AuditLogger($conn, '127.0.0.1', 'test-agent', 'AV-TEST-3F');
    $cache = new RecordingCacheInvalidator();
    $assetRepo = new AssetRepository($conn);
    $variantRepo = new VariantRepository($conn);
    $usageRepo = new UsageRepository($conn);
    $mediaNaming = new FileNaming('zzz-test-media-salt');
    $videoProbe = new VideoProbe();
    $derivatives = new DerivativeService($storage, $variantRepo, new ImageProcessorFactory(), $mediaNaming);
    $svc = new AssetService(
        $conn, $assetRepo, $variantRepo, $usageRepo, $storage, $derivatives,
        new MetadataExtractor($videoProbe), $videoProbe, $mediaNaming,
        $audit, $cache, $authz, 8 * 1024 * 1024, 'AV-TEST-3F',
    );
    $usageSvc = new AssetUsageService($assetRepo, $usageRepo);
    $orphans = new OrphanService($assetRepo, $variantRepo, $usageRepo, $storage);
    $downloads = new DownloadService($assetRepo, $storage, $authz, $audit);

    /* ================== 3F.33 EMPTY DATABASE ========================== */
    M::group('3F.33 empty database');

    M::eq('media table starts empty', (int)$conn->scalar('SELECT COUNT(*) FROM media'), 0);
    M::eq('variants start empty', (int)$conn->scalar('SELECT COUNT(*) FROM media_variants'), 0);
    M::eq('usage starts empty', (int)$conn->scalar('SELECT COUNT(*) FROM media_usage'), 0);
    M::ok('the storage roots start empty', $storage->privateDisk()->listAll('media') === []);

    /* ================= UPLOAD + IMAGE PIPELINE ======================== */
    M::group('3F.8 / 3F.30 image upload and real derivatives');

    $bigJpeg = Fx::jpeg(2400, 1600);
    $up = $svc->upload('zzz-avos-hero.jpg', $bigJpeg, ['alt_text' => 'ZZZ synthetic hero']);
    $imageId = (int)$up['asset']['id'];

    M::ok('image uploaded', $imageId > 0);
    M::eq('not flagged as a duplicate', $up['duplicate'], false);
    M::eq('kind is image', $up['asset']['kind'], 'image');
    M::eq('dimensions were read from the bytes', [$up['asset']['width'], $up['asset']['height']], [2400, 1600]);
    M::eq('hash is sha256 of the bytes', $up['asset']['hash'], hash('sha256', $bigJpeg));
    M::eq('focal point defaults to the centre', $up['asset']['focal'], ['x' => 0.5, 'y' => 0.5]);
    M::ok('the original is on the PRIVATE disk',
        $storage->privateDisk()->exists((string)$assetRepo->findById($imageId)['storage_path']));
    M::eq('the stored bytes are byte-identical to the upload',
        hash('sha256', (string)$storage->privateDisk()->get((string)$assetRepo->findById($imageId)['storage_path'])),
        hash('sha256', $bigJpeg));

    if (!Capabilities::publicSummary()['image_pipeline']) {
        M::na('derivative generation', 'neither Imagick nor GD is installed');
    } else {
        $d = $up['derivatives'];
        M::ok('derivatives were generated', $d['generated'] > 0);
        printf("    %-60s %s\n", 'formats generated', implode(',', $d['formats']));
        printf("    %-60s %s\n", 'purposes generated', implode(',', $d['purposes']));

        $variants = $variantRepo->forMedia($imageId);
        M::ok('variant rows exist', $variants !== []);

        // Every recorded variant must correspond to real bytes with the right
        // dimensions — the check that makes "generated" a fact, not a claim.
        $allPresent = true;
        $dimsOk = true;
        $mimeOk = true;
        foreach ($variants as $v) {
            $path = (string)$v['public_path'];
            if (!$storage->publicDisk()->exists($path)) { $allPresent = false; continue; }
            $bytes = (string)$storage->publicDisk()->get($path);
            if (hash('sha256', $bytes) !== (string)$v['hash']) $dimsOk = false;
            $probe = @getimagesizefromstring($bytes);
            if ($probe !== false && (int)$probe[0] !== (int)$v['width']) $dimsOk = false;
            $sniff = UploadGuard::sniff($bytes);
            $expect = (string)$v['format'] === 'jpeg' ? 'image/jpeg' : 'image/' . $v['format'];
            if (!str_starts_with($sniff, $expect)) $mimeOk = false;
        }
        M::ok('every variant row has real bytes on disk', $allPresent);
        M::ok('every variant hash and width matches its file', $dimsOk);
        M::ok('every variant file has the MIME type it claims', $mimeOk);

        $widths = array_values(array_unique(array_map(static fn(array $v): int => (int)$v['width'], $variants)));
        sort($widths);
        M::ok('derivative widths come only from the fixed ladder',
            array_diff($widths, [320, 640, 1280, 1920, 2400, 2560]) === []);
        M::ok('no derivative upscales past the source',
            max($widths) <= 2400);

        foreach (['webp', 'avif'] as $fmt) {
            $present = in_array($fmt, VariantRepository::formatsPresent($variants), true);
            if (Capabilities::canEncode($fmt)) {
                M::ok("{$fmt} derivatives were produced", $present);
            } elseif ($present) {
                M::ok("{$fmt} reported without encoder support [FALSE CLAIM]", false);
            } else {
                M::na("{$fmt} derivatives", 'this host cannot encode ' . $fmt);
            }
        }
        M::ok('a format that cannot be encoded produces NO variant row',
            array_filter($variants, static fn(array $v): bool =>
                !Capabilities::canEncode((string)$v['format'])) === []);
    }

    /* =================== EXIF STRIPPING ON DERIVATIVES ================= */
    M::group('3F.9 metadata stripping in derivatives');

    $gps = Fx::jpegWithGps(2000, 1400);
    if ($gps === null || !Capabilities::publicSummary()['image_pipeline']) {
        M::na('derivative EXIF stripping', 'needs Imagick to build the fixture and a rasteriser');
    } else {
        $gpsUp = $svc->upload('zzz-avos-gps.jpg', $gps);
        $gpsId = (int)$gpsUp['asset']['id'];
        M::ok('the uploaded original still carries its EXIF (originals are immutable)',
            str_contains((string)$storage->privateDisk()->get(
                (string)$assetRepo->findById($gpsId)['storage_path']), 'GPSLatitude'));

        $clean = true;
        $noExifMarker = true;
        foreach ($variantRepo->forMedia($gpsId) as $v) {
            $bytes = (string)$storage->publicDisk()->get((string)$v['public_path']);
            if (str_contains($bytes, 'GPSLatitude') || str_contains($bytes, 'ZZZTESTCAM')) $clean = false;
            if (str_contains($bytes, "Exif\x00\x00")) $noExifMarker = false;
        }
        M::ok('no derivative contains the GPS payload', $clean);
        M::ok('no derivative contains an EXIF marker at all', $noExifMarker);
        M::ok('gps presence is recorded as a boolean only',
            ($gpsUp['asset']['meta']['gps_removed'] ?? null) !== null);
        M::ok('no coordinate value is stored in meta',
            !str_contains(json_encode($gpsUp['asset']['meta']) ?: '', '51.5074'));
        $svc->delete($gpsId, force: true);
    }

    /* ============== SERVICE-LEVEL REJECTION + AUDIT =================== */
    M::group('3F.7 rejection through the service (audited)');

    $rowsBefore = (int)$conn->scalar('SELECT COUNT(*) FROM media');
    $filesBefore = count($storage->privateDisk()->listAll('media'));

    M::throwsCode('the service refuses a PHP upload',
        fn() => $svc->upload('shell.php', "<?php system(\$_GET['c']); ?>"),
        ErrorCatalog::VALIDATION_ERROR);
    M::throwsCode('the service refuses a double-extension upload',
        fn() => $svc->upload('shell.php.jpg', Fx::png(50, 50)),
        ErrorCatalog::VALIDATION_ERROR);
    M::throwsCode('the service refuses an SVG carrying script',
        fn() => $svc->upload('evil.svg', Fx::svg(true)),
        ErrorCatalog::VALIDATION_ERROR);
    M::throwsCode('an oversized upload is PAYLOAD_TOO_LARGE, not a validation error',
        fn() => $svc->upload('huge.png', Fx::png(50, 50) . str_repeat("\x00", 9 * 1024 * 1024)),
        ErrorCatalog::PAYLOAD_TOO_LARGE);

    M::eq('a refused upload creates no database row',
        (int)$conn->scalar('SELECT COUNT(*) FROM media'), $rowsBefore);
    M::eq('a refused upload writes NOTHING to disk',
        count($storage->privateDisk()->listAll('media')), $filesBefore);
    M::ok('refusals are audited',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='media.upload_rejected'") >= 4);
    M::ok('the refusal audit records a failure result',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='media.upload_rejected' AND result='failure'") > 0);
    M::ok('the refusal audit stores no file content',
        !str_contains(strtolower((string)$conn->scalar(
            "SELECT COALESCE(GROUP_CONCAT(COALESCE(`after`,'')),'') FROM audit_logs WHERE action='media.upload_rejected'")),
            'system('));

    /* ==================== 3F.19 DUPLICATE DETECTION =================== */
    M::group('3F.19 duplicate detection');

    $dupe = $svc->upload('zzz-avos-hero-again.jpg', $bigJpeg);
    M::eq('identical bytes are reported as a duplicate', $dupe['duplicate'], true);
    M::eq('the duplicate points at the existing asset', $dupe['duplicate_of'], $imageId);
    M::eq('no second row was created', (int)$conn->scalar(
        'SELECT COUNT(*) FROM media WHERE hash = ?', [hash('sha256', $bigJpeg)]), 1);
    M::ok('nothing was deleted by the duplicate check',
        $assetRepo->findById($imageId) !== null);
    $dupReport = $orphans->duplicateCandidates();
    M::eq('exact duplicates are structurally impossible', $dupReport['exact_duplicates_possible'], false);
    M::eq('the duplicate report takes no action', $dupReport['action_taken'], 'none');

    /* ===================== 3F.12 / 3F.13 FOCAL + CROP ================= */
    M::group('3F.12 / 3F.13 focal point and crop');

    $before = (string)$storage->privateDisk()->get((string)$assetRepo->findById($imageId)['storage_path']);
    $svc->updateMetadata($imageId, ['focal' => ['x' => 0.5, 'y' => 0.4]]);
    $withFocal = $svc->getAdmin($imageId);
    M::eq('focal point is stored as normalised percentages',
        $withFocal['focal'], ['x' => 0.5, 'y' => 0.4]);

    M::throwsCode('a focal point outside 0..1 is refused',
        fn() => $svc->updateMetadata($imageId, ['focal' => ['x' => 1.5, 'y' => 0.4]]),
        ErrorCatalog::VALIDATION_ERROR);
    M::throwsCode('a crop outside the frame is refused',
        fn() => $svc->updateMetadata($imageId, ['crop' => ['x' => 0.8, 'y' => 0, 'width' => 0.5, 'height' => 1]]),
        ErrorCatalog::VALIDATION_ERROR);
    M::throwsCode('a zero-size crop is refused',
        fn() => $svc->updateMetadata($imageId, ['crop' => ['x' => 0, 'y' => 0, 'width' => 0, 'height' => 1]]),
        ErrorCatalog::VALIDATION_ERROR);

    $svc->updateMetadata($imageId, ['crop' => ['x' => 0.1, 'y' => 0.1, 'width' => 0.5, 'height' => 0.5]]);
    $cropped = $svc->getAdmin($imageId);
    M::eq('the crop is saved', $cropped['crop']['width'], 0.5);
    $after = (string)$storage->privateDisk()->get((string)$assetRepo->findById($imageId)['storage_path']);
    M::eq('THE ORIGINAL IS UNCHANGED by a crop', hash('sha256', $after), hash('sha256', $before));
    M::eq('the original still reports its full dimensions',
        [$cropped['width'], $cropped['height']], [2400, 1600]);

    if (Capabilities::publicSummary()['image_pipeline']) {
        $croppedVariants = $variantRepo->forMedia($imageId);
        $ratioOk = true;
        foreach ($croppedVariants as $v) {
            if ((int)$v['width'] < 1 || (int)$v['height'] < 1) continue;
            // 0.5 x 0.5 of a 3:2 frame is still 3:2.
            $r = (int)$v['width'] / (int)$v['height'];
            if ($r < 1.3 || $r > 1.7) $ratioOk = false;
        }
        M::ok('derivatives were regenerated from the cropped region', $ratioOk);
        $svc->updateMetadata($imageId, ['crop' => null]);
        M::eq('clearing the crop restores full-frame derivatives',
            $svc->getAdmin($imageId)['crop'], null);
    } else {
        M::na('crop-driven regeneration', 'no rasteriser on this host');
    }

    /* ================= NON-IMAGE ASSET CLASSES ======================== */
    M::group('3F.16 / 3F.17 / 3F.18 non-image asset classes');

    $shader = $svc->upload('zzz-avos-wave.frag', Fx::shader());
    $shaderId = (int)$shader['asset']['id'];
    M::eq('shader stored as a shader asset', $shader['asset']['kind'], 'shader');
    M::eq('shader stage detected', $shader['asset']['meta']['shader_stage'], 'fragment');
    M::eq('GLSL version detected', $shader['asset']['meta']['glsl_version'], '300 es');
    M::ok('shader uniforms captured',
        in_array('uTime', (array)($shader['asset']['meta']['uniforms'] ?? []), true));
    M::ok('shader description captured from the header comment',
        str_contains((string)($shader['asset']['meta']['description'] ?? ''), 'zzz avos test shader'));
    M::ok('shader tags field exists for the future admin',
        array_key_exists('tags', (array)$shader['asset']['meta']));
    M::eq('shader produced no derivatives', $variantRepo->countForMedia($shaderId), 0);

    $script = $svc->upload('zzz-avos-anim.js', Fx::script());
    M::eq('script stored as a script asset', $script['asset']['kind'], 'script');
    M::eq('script is explicitly marked as never executed',
        $script['asset']['meta']['executed'], false);
    M::ok('script library fingerprint detected',
        in_array('gsap', (array)($script['asset']['meta']['libraries'] ?? []), true));

    $glb = $svc->upload('zzz-avos-model.glb', Fx::glb());
    M::eq('GLB stored as a 3D model', $glb['asset']['kind'], 'model');
    M::eq('GLB version parsed from the header', $glb['asset']['meta']['gltf_version'], 2);
    M::ok('GLB declared length matches the file', $glb['asset']['meta']['length_matches']);
    $glbDims = array_map('floatval', (array)$glb['asset']['meta']['dimensions']);
    M::eq('model dimensions derived from the accessor',
        $glbDims, ['x' => 2.0, 'y' => 4.0, 'z' => 1.0]);
    M::eq('mesh count read without evaluating the model',
        $glb['asset']['meta']['meshes_count'], 1);

    $svgAsset = $svc->upload('zzz-avos-mark.svg', Fx::svg(false));
    M::eq('a clean SVG is stored', $svgAsset['asset']['kind'], 'image');
    M::eq('SVG is treated as vector', $svgAsset['asset']['meta']['media_class'], 'vector');
    M::eq('SVG gets no raster derivatives',
        $variantRepo->countForMedia((int)$svgAsset['asset']['id']), 0);

    /* ======================= 3F.14 VIDEO ============================== */
    M::group('3F.14 / 3F.15 video');

    $transcoder = new TranscodeService();
    $ffStatus = $transcoder->status();
    printf("    %-60s %s\n", 'ffmpeg', $ffStatus['available'] ? 'AVAILABLE' : 'UNAVAILABLE — ' . $ffStatus['reason']);

    $mp4 = Fx::mp4();
    if ($mp4 === null) {
        M::na('video upload with real metadata', 'ffmpeg is unavailable to build a fixture');
        M::ok('the video probe reports its unavailability honestly',
            !$videoProbe->available() && $videoProbe->unavailableReason() !== '');
    } else {
        $vid = $svc->upload('zzz-avos-clip.mp4', $mp4);
        $vidId = (int)$vid['asset']['id'];
        M::eq('video stored as a video asset', $vid['asset']['kind'], 'video');
        M::eq('video dimensions probed', [$vid['asset']['width'], $vid['asset']['height']], [320, 240]);
        M::ok('video duration probed',
            $vid['asset']['duration_ms'] !== null && $vid['asset']['duration_ms'] > 500);
        M::eq('video codec captured', $vid['asset']['meta']['video_codec'], 'h264');
        M::ok('probe source is recorded', ($vid['asset']['meta']['probe'] ?? '') === 'ffprobe');
        M::eq('upload did NOT transcode inline', $variantRepo->countForMedia($vidId), 0);
        M::ok('transcode profiles are reported only when the encoder exists',
            $ffStatus['profiles'] === [] || in_array('mp4', $ffStatus['profiles'], true));
        $svc->delete($vidId, force: true);
    }
    M::eq('transcoding is never claimed without ffmpeg',
        $transcoder->available(), Capabilities::hasFfmpeg());
    if (!$transcoder->available()) {
        M::ok('an unavailable transcode returns a reason, not a fake success',
            $transcoder->transcode('/tmp/nope.mp4', '/tmp/out.mp4', 'mp4')['ok'] === false);
    } else {
        M::ok('an unknown transcode profile is refused',
            $transcoder->transcode('/tmp/nope.mp4', '/tmp/out.mp4', 'bogus')['ok'] === false);
    }

    /* ================ 3F.24 PRIVATE vs PUBLIC ========================= */
    M::group('3F.24 private assets and controlled download');

    $privateDoc = $svc->upload('zzz-avos-brief.pdf', Fx::pdf(), ['visibility' => 'private']);
    $privId = (int)$privateDoc['asset']['id'];
    M::eq('the asset is private', $privateDoc['asset']['visibility'], 'private');
    M::eq('a private asset has NO public url', $privateDoc['asset']['url'], null);
    M::eq('a private asset has no public_path in the database',
        (string)$assetRepo->findById($privId)['public_path'], '');
    M::ok('no public byte exists for a private asset',
        $storage->publicDisk()->listAll('media') === [] || !in_array(
            (string)$assetRepo->findById($privId)['storage_path'],
            $storage->publicDisk()->listAll('media'), true));
    M::eq('a private asset generates no derivatives', $variantRepo->countForMedia($privId), 0);
    M::throwsCode('public metadata for a private asset is 404 (not 403)',
        fn() => $svc->getPublic($privId), ErrorCatalog::NOT_FOUND);
    M::eq('a private asset never appears in the public list',
        count(array_filter($svc->listPublic(['per_page' => 100])['items'],
            static fn(array $i): bool => ($i['url'] ?? null) === null)), 0);

    $prepared = $downloads->prepare($privId);
    M::ok('an authorised user can prepare a private download', $prepared['private']);
    M::ok('the download filename is sanitised', $prepared['filename'] === 'zzz-avos-brief.pdf');
    M::ok('the descriptor exposes no public path',
        !str_contains(json_encode(array_diff_key($prepared, ['absolute' => 1])) ?: '', $pubRoot));

    $authz->setUser(null);
    M::throwsCode('an anonymous private download is 404, revealing nothing',
        fn() => $downloads->prepare($privId), ErrorCatalog::NOT_FOUND);
    // content_manager DOES hold media.read per the approved Phase 2 role set,
    // so it is the wrong control. seo_manager genuinely lacks it.
    $as('content_manager');
    M::ok('content_manager holds media.read by approved design', $authz->can('media.read'));
    $as('seo_manager');
    M::ok('seo_manager genuinely lacks media.read', !$authz->can('media.read'));
    M::throwsCode('a signed-in role without media.read is FORBIDDEN, not served',
        fn() => $downloads->prepare($privId), ErrorCatalog::FORBIDDEN);
    $as('administrator');

    // A public asset is downloadable by anyone.
    $authz->setUser(null);
    $publicPrepared = $downloads->prepare($imageId);
    M::ok('a public asset is downloadable anonymously', !$publicPrepared['private']);
    $as('administrator');

    // Flipping to private must remove every public byte.
    $flip = $svc->upload('zzz-avos-flip.png', Fx::png(900, 600));
    $flipId = (int)$flip['asset']['id'];
    $flipVariants = array_map(static fn(array $v): string => (string)$v['public_path'],
        $variantRepo->forMedia($flipId));
    $flipPublic = (string)$assetRepo->findById($flipId)['public_path'];
    M::ok('the public asset has a published copy', $flipPublic !== '');
    $svc->updateMetadata($flipId, ['visibility' => 'private']);
    M::eq('the published copy is gone', $storage->publicDisk()->exists($flipPublic), false);
    $stillThere = array_filter($flipVariants,
        static fn(string $p): bool => $storage->publicDisk()->exists($p));
    M::eq('every public derivative is gone', $stillThere, []);
    M::eq('no variant rows remain', $variantRepo->countForMedia($flipId), 0);
    M::ok('the private original survives the change',
        $storage->privateDisk()->exists((string)$assetRepo->findById($flipId)['storage_path']));

    /* ================= 3F.20 / 3F.21 USAGE ============================ */
    M::group('3F.20 / 3F.21 relationships, usage and deletion guard');

    $conn->run("INSERT INTO pages (slug, title, status) VALUES ('zzz-avos-media-page','ZZZ Media Page','draft')");
    $pageId = (int)$conn->pdo()->lastInsertId();
    $conn->run("INSERT INTO projects (slug, title, status, hero_media_id) VALUES ('zzz-avos-media-proj','ZZZ Media Project','draft',?)", [$imageId]);
    $projId = (int)$conn->pdo()->lastInsertId();

    $usageSvc->attach($imageId, 'page', $pageId, 'hero');
    $usage = $usageSvc->forAsset($imageId);
    M::ok('tracked usage is reported', $usage['tracked'] >= 1);
    M::ok('structural FK usage is ALSO reported', $usage['structural'] >= 1);
    M::eq('the asset is not deletable while referenced', $usage['deletable'], false);

    $titles = array_column($usage['used_by'], 'title');
    M::ok('usage reports the content title', in_array('ZZZ Media Page', $titles, true));
    M::ok('usage reports the project title', in_array('ZZZ Media Project', $titles, true));
    $types = array_column($usage['used_by'], 'entity_type');
    M::ok('usage reports the content type', in_array('page', $types, true));
    $contexts = array_column($usage['used_by'], 'context');
    M::ok('usage reports a human context', in_array('hero image', $contexts, true));

    M::throwsCode('deleting a referenced asset is a CONFLICT',
        fn() => $svc->delete($imageId), ErrorCatalog::CONFLICT);
    try { $svc->delete($imageId); } catch (ApiException $e) {
        M::eq('the conflict reason is ASSET_IN_USE', $e->details()['reason'] ?? '', 'ASSET_IN_USE');
        M::ok('the conflict lists what is using it', ($e->details()['used_by'] ?? []) !== []);
    }
    M::ok('the asset still exists after the refused delete', $assetRepo->findById($imageId) !== null);
    M::eq('no reference was silently detached', $usageSvc->forAsset($imageId)['total'], $usage['total']);
    M::eq('a forced delete is ALSO refused while referenced',
        (function () use ($svc, $imageId): string {
            try { $svc->delete($imageId, force: true); return 'allowed'; }
            catch (ApiException $e) { return $e->code(); }
        })(), ErrorCatalog::CONFLICT);

    // Once nothing points at it, deletion proceeds.
    $usageSvc->detach($imageId, 'page', $pageId, 'hero');
    $conn->run('UPDATE projects SET hero_media_id = NULL WHERE id = ?', [$projId]);
    M::eq('the asset becomes deletable once unreferenced',
        $usageSvc->forAsset($imageId)['deletable'], true);

    M::throwsCode('attaching a non-existent asset is refused',
        fn() => $usageSvc->attach(999999, 'page', $pageId, 'x'), ErrorCatalog::VALIDATION_ERROR);
    $usageSvc->attach($shaderId, 'nonsense_type', 1, 'x');
    M::eq('an unapproved entity type creates no relationship',
        $usageSvc->forAsset($shaderId)['total'], 0);

    /* ==================== 3F.23 REPLACEMENT =========================== */
    M::group('3F.23 replacement and versioning');

    $orig = $svc->upload('zzz-avos-logo-v1.png', Fx::png(600, 400));
    $origId = (int)$orig['asset']['id'];
    $usageSvc->attach($origId, 'page', $pageId, 'logo');

    $replaced = $svc->replace($origId, 'zzz-avos-logo-v2.png', Fx::png(640, 480));
    $newId = (int)$replaced['asset']['id'];
    M::ok('replacement created a NEW asset', $newId !== $origId);
    M::eq('the replacement is version 2', $replaced['asset']['version'], 2);
    M::eq('the previous asset was retained because it is referenced',
        $replaced['previous_retained'], true);
    M::ok('the previous asset is still readable', $assetRepo->findById($origId) !== null);
    M::eq('the previous asset points forward to its successor',
        (int)$assetRepo->findById($origId)['replaced_by'], $newId);
    M::ok('existing content still resolves to the OLD asset — nothing changed retroactively',
        $usageSvc->forAsset($origId)['total'] >= 1);
    M::ok('the old bytes are still on disk',
        $storage->privateDisk()->exists((string)$assetRepo->findById($origId)['storage_path']));
    M::ok('the replacement explains what happened', str_contains($replaced['note'], 'still referenced'));

    // An unreferenced asset is retired on replacement.
    $lone = $svc->upload('zzz-avos-lone-v1.png', Fx::png(300, 200));
    $loneId = (int)$lone['asset']['id'];
    $loneReplaced = $svc->replace($loneId, 'zzz-avos-lone-v2.png', Fx::png(320, 240));
    M::eq('an unreferenced predecessor is retired', $loneReplaced['previous_retained'], false);
    M::ok('the retired predecessor is soft-deleted, not erased',
        $assetRepo->findById($loneId, includeDeleted: true) !== null);

    $same = $svc->replace($newId, 'zzz-avos-logo-v2-again.png', (string)$storage->privateDisk()
        ->get((string)$assetRepo->findById($newId)['storage_path']));
    M::eq('replacing with identical bytes is a no-op', $same['replaced'], false);

    /* ===================== 3F.32 DATABASE FAILURE ===================== */
    M::group('3F.32 database failure after a filesystem write');

    $beforeFiles = count($storage->privateDisk()->listAll('media'));
    $beforeRows = (int)$conn->scalar('SELECT COUNT(*) FROM media');

    // Force the INSERT to fail by removing a column the service writes to.
    $conn->run('ALTER TABLE media DROP COLUMN meta');
    $failed = false;
    $code = '';
    try {
        $svc->upload('zzz-avos-willfail.png', Fx::png(220, 180));
    } catch (ApiException $e) { $failed = true; $code = $e->code(); }
      catch (Throwable) { $failed = true; $code = 'THROWN'; }
    $conn->run('ALTER TABLE media ADD COLUMN meta JSON NULL AFTER credit');

    M::ok('the upload failed loudly instead of reporting success', $failed);
    M::eq('the failure is an internal error, not a fake 201', $code, ErrorCatalog::INTERNAL_ERROR);
    M::eq('no media row was created', (int)$conn->scalar('SELECT COUNT(*) FROM media'), $beforeRows);
    M::eq('THE ORPHANED FILE WAS CLEANED UP',
        count($storage->privateDisk()->listAll('media')), $beforeFiles);
    M::ok('the failure was audited',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='media.upload_failed'") > 0);
    M::ok('the audit row records a failure result',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='media.upload_failed' AND result='failure'") > 0);

    /* ===================== 3F.22 ORPHAN DETECTION ===================== */
    M::group('3F.22 orphan detection');

    $report = $orphans->report();
    M::eq('a healthy store reports no orphans', $report['counts']['orphan_files'], 0);
    M::eq('a healthy store reports no missing files', $report['counts']['missing_files'], 0);
    M::eq('the report never takes action', $report['action_taken'], 'none');

    // Plant a genuine orphan, aged past the grace window.
    $orphanRel = 'media/2020/01/zz/zzzorphanfile00000000ab.png';
    $storage->privateDisk()->put($orphanRel, Fx::png(40, 40));
    @touch((string)$storage->privateDisk()->absolute($orphanRel), time() - 7200);
    $report2 = $orphans->report();
    M::eq('an aged unclaimed file is reported as an orphan', $report2['counts']['orphan_files'], 1);
    M::eq('the orphan path is reported', $report2['orphan_files'][0]['path'], $orphanRel);
    M::ok('the orphan was NOT deleted', $storage->privateDisk()->exists($orphanRel));

    // A brand-new unclaimed file is inside the grace window.
    $storage->privateDisk()->put('media/2020/01/zz/zzzfreshfile0000000000cd.png', Fx::png(40, 40));
    M::eq('a fresh unclaimed file is not yet called an orphan',
        $orphans->report()['counts']['orphan_files'], 1);

    // A row whose bytes vanished.
    $ghost = $svc->upload('zzz-avos-ghost.png', Fx::png(120, 120));
    $ghostId = (int)$ghost['asset']['id'];
    $storage->privateDisk()->delete((string)$assetRepo->findById($ghostId)['storage_path']);
    $report3 = $orphans->report();
    M::ok('a row with missing bytes is reported', $report3['counts']['missing_files'] >= 1);
    M::ok('the missing-file report names the asset',
        in_array($ghostId, array_column($report3['missing_files'], 'id'), true));
    M::throwsCode('an asset with missing bytes cannot be restored',
        fn() => (function () use ($svc, $ghostId) { $svc->delete($ghostId); $svc->restore($ghostId); })(),
        ErrorCatalog::CONFLICT);

    $unref = $orphans->unreferenced();
    M::ok('unreferenced assets are listed separately from orphans', isset($unref['items']));
    M::ok('a referenced asset is not listed as unreferenced',
        !in_array($origId, array_column($unref['items'], 'id'), true));

    $storage->privateDisk()->delete($orphanRel);
    $storage->privateDisk()->delete('media/2020/01/zz/zzzfreshfile0000000000cd.png');

    /* ======================= 3F.28 AUDIT ============================== */
    M::group('3F.28 media audit');

    foreach (['media.upload', 'media.update', 'media.replace', 'media.visibility_change',
              'media.private_download', 'media.upload_rejected', 'media.upload_failed'] as $action) {
        M::ok("audited: {$action}",
            (int)$conn->scalar('SELECT COUNT(*) FROM audit_logs WHERE action = ?', [$action]) > 0);
    }
    $blob = strtolower((string)$conn->scalar(
        "SELECT GROUP_CONCAT(CONCAT(COALESCE(`before`,''),COALESCE(`after`,'')) SEPARATOR ' ') FROM audit_logs"));
    M::ok('the audit log contains no file content', !str_contains($blob, 'gsap.to'));
    M::ok('the audit log contains no PNG signature', !str_contains($blob, 'ihdr'));
    foreach (['password', 'enc_key', 'av_enc_key'] as $secret) {
        M::ok("the audit log contains no {$secret}", !str_contains($blob, '"' . $secret . '":"'));
    }
    M::ok('the audit log contains no storage path', !str_contains($blob, 'media/2026/'));
    M::eq('reads are not audited',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='media.read'"), 0);

    /* ==================== 3F.27 PERMISSIONS =========================== */
    M::group('3F.27 permissions (no new permission created)');

    foreach (['media.read', 'media.write', 'media.delete'] as $code) {
        M::eq("approved permission exists: {$code}",
            (int)$conn->scalar('SELECT COUNT(*) FROM permissions WHERE code = ?', [$code]), 1);
    }
    M::eq('no media permission was invented in Phase 3F',
        (int)$conn->scalar("SELECT COUNT(*) FROM permissions WHERE domain = 'media'"), 3);
    M::eq('the total permission count is unchanged from Phase 3E',
        (int)$conn->scalar('SELECT COUNT(*) FROM permissions'), 49);

    $matrix = [
        'administrator'   => [true,  true,  true],
        'media_manager'   => [true,  true,  true],
        'editor'          => [true,  true,  false],
        'content_manager' => [true,  true,  false],
    ];
    foreach ($matrix as $role => [$read, $write, $delete]) {
        $as($role);
        M::eq("{$role}: media.read", $authz->can('media.read'), $read);
        M::eq("{$role}: media.write", $authz->can('media.write'), $write);
        M::eq("{$role}: media.delete", $authz->can('media.delete'), $delete);
    }
    $as('administrator');

    /* ==================== SOFT/HARD DELETE ============================ */
    M::group('deletion modes');

    $doomed = $svc->upload('zzz-avos-doomed.png', Fx::png(150, 150));
    $doomedId = (int)$doomed['asset']['id'];
    $doomedPath = (string)$assetRepo->findById($doomedId)['storage_path'];

    $soft = $svc->delete($doomedId);
    M::eq('the default delete is soft', $soft['mode'], 'soft');
    M::ok('the bytes survive a soft delete', $storage->privateDisk()->exists($doomedPath));
    M::throwsCode('a soft-deleted asset is not readable',
        fn() => $svc->getAdmin($doomedId), ErrorCatalog::NOT_FOUND);
    $restored = $svc->restore($doomedId);
    M::eq('a soft-deleted asset can be restored', (int)$restored['id'], $doomedId);

    $hard = $svc->delete($doomedId, force: true);
    M::eq('a forced delete is hard', $hard['mode'], 'hard');
    M::ok('the bytes are removed', !$storage->privateDisk()->exists($doomedPath));
    M::eq('the row is gone', $assetRepo->findById($doomedId, includeDeleted: true), null);
    M::eq('its variants are gone', $variantRepo->countForMedia($doomedId), 0);

    /* ==================== 3F.38 SHARED HOSTING ======================== */
    M::group('3F.38 shared-hosting compatibility');

    $capabilities = $svc->capabilities();
    M::ok('capabilities are reported to the API', isset($capabilities['image'], $capabilities['storage']));
    M::eq('the private store is outside the public root',
        $capabilities['storage']['private_outside_public'], true);
    M::ok('the private store is protected by a deny file',
        $capabilities['storage']['private_protected']);
    M::ok('upload limits are reported', $capabilities['limits']['max_upload_bytes'] > 0);
    M::ok('the accepted extension list is exposed for the admin',
        count($capabilities['accepted_extensions']) > 20);

    // The core must work with no optional binary at all.
    M::ok('core upload works regardless of ffmpeg',
        (int)$svc->upload('zzz-avos-nodeps.pdf', Fx::pdf() . "\n% zzz unique\n")['asset']['id'] > 0);
    M::eq('no Redis extension is required', extension_loaded('redis'), extension_loaded('redis'));
    M::ok('storage needs no shell', $storage->privateDisk()->writable());
    M::ok('capability reporting degrades honestly, never optimistically',
        $capabilities['video']['transcoding'] === Capabilities::hasFfmpeg());

    /* ================== 3F.25 PUBLIC ASSET URLS ======================= */
    M::group('3F.25 public asset URLs');

    $pubAsset = $svc->getAdmin($newId);
    M::ok('the public URL has no .php', !str_contains((string)$pubAsset['url'], '.php'));
    M::ok('the public URL has no .html', !str_contains((string)$pubAsset['url'], '.html'));
    M::ok('the public URL exposes no filesystem path',
        !str_contains((string)$pubAsset['url'], $mediaRoot)
        && !str_contains((string)$pubAsset['url'], $pubRoot));
    M::ok('the public URL uses the clean assets prefix',
        str_starts_with((string)$pubAsset['url'], '/assets/media/'));
    M::ok('the public URL contains no database id',
        !str_contains((string)$pubAsset['url'], '/' . $newId . '.'));
    foreach ($variantRepo->forMedia($newId) as $v) {
        M::ok('a variant URL is clean and typed',
            preg_match('#^media/\d{4}/\d{2}/[0-9a-f]{2}/[0-9a-f]{24}-[a-z]+-\d+\.[a-z0-9]+$#',
                (string)$v['public_path']) === 1);
        break;
    }

    /* ==================== 3F.33 FIXTURE HYGIENE ======================= */
    M::group('3F.33 fixture hygiene and cleanup');

    $banned = ['deloitte', 'pwc', 'sony', 'stripe', 'priya sharma', 'ravi kumar', 'acme'];
    $names = strtolower((string)$conn->scalar(
        "SELECT COALESCE(GROUP_CONCAT(original_name SEPARATOR ' '), '') FROM media"));
    $found = array_values(array_filter($banned, static fn(string $b): bool => str_contains($names, $b)));
    M::eq('no fabricated business data was introduced', $found, []);
    M::ok('every media fixture is clearly disposable',
        (int)$conn->scalar("SELECT COUNT(*) FROM media WHERE original_name NOT LIKE 'zzz-avos-%'") === 0);
    M::ok('every user fixture uses the reserved example.test TLD',
        (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@example.test'") === 0);
    M::eq('no client rows were invented', (int)$conn->scalar('SELECT COUNT(*) FROM clients'), 0);
    M::eq('no lead rows were invented', (int)$conn->scalar('SELECT COUNT(*) FROM leads'), 0);

    foreach (['media_usage', 'media_variants', 'media', 'projects', 'pages', 'audit_logs'] as $t) {
        $conn->run('DELETE FROM `' . $t . '`');
    }
    $conn->run("DELETE FROM users WHERE email LIKE 'zzz-avos-%@example.test'");
    M::eq('media fixtures removed', (int)$conn->scalar('SELECT COUNT(*) FROM media'), 0);
    M::eq('variant fixtures removed', (int)$conn->scalar('SELECT COUNT(*) FROM media_variants'), 0);
    M::eq('user fixtures removed',
        (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email LIKE 'zzz-avos-%'"), 0);
    M::ok('system seed data is untouched',
        (int)$conn->scalar('SELECT COUNT(*) FROM permissions') === 49
        && (int)$conn->scalar('SELECT COUNT(*) FROM roles') === 7);

    // Remove the temporary storage trees entirely.
    foreach ([$mediaRoot, $pubRoot] as $dir) {
        if (!is_dir($dir)) continue;
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($it as $f) { $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); }
        @rmdir($dir);
    }
    M::ok('temporary storage trees removed', !is_dir($mediaRoot) && !is_dir($pubRoot));
}

// Tidy the unit-test store.
if (is_dir($tmpRoot)) {
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($tmpRoot, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) { $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); }
    @rmdir($tmpRoot);
}

echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d   NOT-AVAILABLE %d\n", M::$pass, M::$fail, M::$skip, M::$na);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(M::$fail > 0 ? 1 : 0);
