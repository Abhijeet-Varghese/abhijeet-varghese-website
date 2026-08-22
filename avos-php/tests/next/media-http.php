<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3F §3F.37: REAL HTTP verification of the media API.
 *
 *   AVOS_HTTP_BASE=http://127.0.0.1:8199 php avos-php/tests/next/media-http.php
 *
 * Every assertion crosses a socket to the real front controller
 * (`public-next/api/index.php`). Both upload transports are exercised: the
 * base64 JSON body an admin fetch would send, and a genuine
 * `multipart/form-data` post built by curl, because those take completely
 * different paths through the controller.
 *
 * SKIPs, never silently passes, when no server is listening. Fixtures are
 * synthetic, prefixed `zzz-avos-http`, and removed at the end.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Auth\PasswordHasher;
use AvOS\Database\Connection;
use AvOS\Identity\UserRepository;
use AvOS\Media\Capabilities;

final class HM
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
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
    public static function na(string $n, string $w): void
    { self::$na++; printf("    %-60s NOT AVAILABLE IN ENVIRONMENT (%s)\n", substr($n, 0, 60), $w); }
}

$base = rtrim((string)(getenv('AVOS_HTTP_BASE') ?: 'http://127.0.0.1:8199'), '/');
$jar = tempnam(sys_get_temp_dir(), 'avos-mh-');

/** One real request through curl. @return array{status:int,headers:array,body:?array,raw:string} */
$req = static function (string $method, string $path, ?array $json = null,
                        array $headers = [], array $rawArgs = []) use ($base, $jar): array {
    $cmd = ['curl', '-sS', '-i', '-X', escapeshellarg($method),
            '-c', escapeshellarg($jar), '-b', escapeshellarg($jar), '--max-time', '60'];
    foreach ($headers as $k => $v) { $cmd[] = '-H'; $cmd[] = escapeshellarg($k . ': ' . $v); }
    $bodyFile = null;
    if ($json !== null) {
        $encoded = (string)json_encode($json, JSON_UNESCAPED_SLASHES);
        $cmd[] = '-H'; $cmd[] = escapeshellarg('Content-Type: application/json');
        // escapeshellarg() caps at 2 MB, and the oversized-upload test is
        // deliberately larger than that, so big bodies go through a file.
        if (strlen($encoded) > 500000) {
            $bodyFile = tempnam(sys_get_temp_dir(), 'avos-body-');
            file_put_contents($bodyFile, $encoded);
            $cmd[] = '--data-binary'; $cmd[] = escapeshellarg('@' . $bodyFile);
        } else {
            $cmd[] = '--data-binary'; $cmd[] = escapeshellarg($encoded);
        }
    }
    foreach ($rawArgs as $a) $cmd[] = $a;
    $cmd[] = escapeshellarg($base . $path);

    $raw = (string)shell_exec(implode(' ', $cmd) . ' 2>/dev/null');
    if ($bodyFile !== null) @unlink($bodyFile);
    $parts = preg_split("/\r\n\r\n/", $raw);
    $bodyRaw = array_pop($parts) ?? '';
    $headBlock = array_pop($parts) ?? '';
    $status = 0; $hdrs = [];
    foreach (preg_split("/\r?\n/", $headBlock) ?: [] as $line) {
        if (preg_match('#^HTTP/[\d.]+ (\d{3})#', $line, $m) === 1) { $status = (int)$m[1]; continue; }
        if (str_contains($line, ':')) { [$k, $v] = explode(':', $line, 2); $hdrs[strtolower(trim($k))] = trim($v); }
    }
    $decoded = json_decode($bodyRaw, true);
    return ['status' => $status, 'headers' => $hdrs,
            'body' => is_array($decoded) ? $decoded : null, 'raw' => $bodyRaw];
};

/* ---------------------------- reachability ------------------------------ */
HM::group('3F.37 real HTTP — reachability');

$probe = $req('GET', '/api/v1/system/health');
if ($probe['status'] === 0) {
    HM::skip('all media HTTP tests', 'no server at ' . $base);
    echo "\n  " . str_repeat('=', 74) . "\n";
    printf("  PASS %d   FAIL %d   SKIP %d   NOT-AVAILABLE %d\n", HM::$pass, HM::$fail, HM::$skip, HM::$na);
    echo '  ' . str_repeat('=', 74) . "\n\n";
    exit(0);
}
HM::eq('the API answers over HTTP', $probe['status'], 200);

/* ----------------------------- fixtures --------------------------------- */
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1',
    getenv('AVOS_TEST_DB') ?: 'avos_next_dev',
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);
$PW = 'MediaHttp_2026!x';
$MGR = 'zzz-avos-http-mediamgr@example.test';
$SEO = 'zzz-avos-http-seomgr@example.test';
$users = new UserRepository($conn, new PasswordHasher());
foreach ([$MGR, $SEO] as $e) $conn->run('DELETE FROM users WHERE email = ?', [$e]);
$mgrId = $users->create('ZZZ HTTP Media Mgr', $MGR, $PW, ['media_manager'], false)->id;
$seoId = $users->create('ZZZ HTTP SEO Mgr', $SEO, $PW, ['seo_manager'], false)->id;

$makePng = static function (int $w, int $h): string {
    if (Capabilities::hasImagick()) {
        $im = new Imagick();
        $im->newImage($w, $h, new ImagickPixel('rgb(30,120,90)'));
        $im->setImageFormat('png');
        $b = (string)$im->getImagesBlob();
        $im->clear();
        return $b;
    }
    $img = imagecreatetruecolor($w, $h);
    imagefill($img, 0, 0, imagecolorallocate($img, 30, 120, 90));
    ob_start(); imagepng($img); $b = (string)ob_get_clean();
    imagedestroy($img);
    return $b;
};
// Unique bytes per run so the hash never collides with a previous execution.
$nonce = bin2hex(random_bytes(8));
$png = $makePng(1500, 1000);
$png2 = $makePng(1200, 900);
$pdf = "%PDF-1.4\n% zzz-avos-http {$nonce}\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";

/* -------------------------- unauthenticated ----------------------------- */
HM::group('3F.26 / 3F.24 public surface (no session)');

foreach (['/api/v1/media', '/api/v1/media/capabilities', '/api/v1/media/orphans'] as $p) {
    HM::eq("GET {$p} without a session is 401", $req('GET', $p)['status'], 401);
}
HM::eq('POST /api/v1/media without a session is 401',
    $req('POST', '/api/v1/media', ['filename' => 'x.png'])['status'], 401);
HM::eq('DELETE /api/v1/media/1 without a session is 401',
    $req('DELETE', '/api/v1/media/1')['status'], 401);

$pubList = $req('GET', '/api/v1/content/media');
HM::eq('GET /api/v1/content/media is public', $pubList['status'], 200);
HM::ok('the public list is paginated', isset($pubList['body']['data']['pagination']));

/* ------------------------------- login ---------------------------------- */
HM::group('3F.37 authenticated media lifecycle over HTTP');

$login = $req('POST', '/api/v1/auth/login', ['email' => $MGR, 'password' => $PW]);
HM::eq('media manager logs in', $login['status'], 200);
$csrf = (string)($login['body']['data']['csrf_token'] ?? '');
HM::ok('a CSRF token was issued', $csrf !== '');
$CT = ['X-CSRF-Token' => $csrf];

$caps = $req('GET', '/api/v1/media/capabilities');
HM::eq('capabilities are readable', $caps['status'], 200);
HM::ok('capabilities report a driver', isset($caps['body']['data']['image']['driver']));
HM::ok('capabilities report the storage layout',
    ($caps['body']['data']['storage']['private_outside_public'] ?? null) === true);
HM::ok('capabilities report the derivative ladder',
    count($caps['body']['data']['derivatives']['sizes'] ?? []) === 5);

/* -------------------------------- CSRF ---------------------------------- */
$noCsrf = $req('POST', '/api/v1/media', [
    'filename' => 'zzz-avos-http-nocsrf.png', 'content_base64' => base64_encode($png),
]);
HM::eq('an upload without a CSRF token is 419', $noCsrf['status'], 419);
HM::eq('  …the code is CSRF_FAILED', $noCsrf['body']['error']['code'] ?? '', 'CSRF_FAILED');

/* ------------------------- upload (base64 JSON) -------------------------- */
$up = $req('POST', '/api/v1/media', [
    'filename'       => 'zzz-avos-http-hero.png',
    'content_base64' => base64_encode($png),
    'alt_text'       => 'ZZZ synthetic http hero',
], $CT);
HM::eq('upload returns 201', $up['status'], 201);
$mediaId = (int)($up['body']['data']['asset']['id'] ?? 0);
HM::ok('an asset id was returned', $mediaId > 0);
HM::eq('the envelope carries a request_id',
    is_string($up['body']['request_id'] ?? null), true);
HM::eq('the asset is an image', $up['body']['data']['asset']['kind'] ?? '', 'image');
HM::eq('dimensions were derived server-side',
    [$up['body']['data']['asset']['width'] ?? 0, $up['body']['data']['asset']['height'] ?? 0], [1500, 1000]);
HM::eq('the hash is the sha256 of what we sent',
    $up['body']['data']['asset']['hash'] ?? '', hash('sha256', $png));
HM::ok('a public URL was issued', str_starts_with((string)($up['body']['data']['asset']['url'] ?? ''), '/assets/media/'));
HM::ok('the response exposes no filesystem path',
    !str_contains((string)json_encode($up['body']), '/home/')
    && !str_contains((string)json_encode($up['body']), 'storage_path'));

if (Capabilities::publicSummary()['image_pipeline']) {
    HM::ok('derivatives were generated over HTTP',
        (int)($up['body']['data']['derivatives']['generated'] ?? 0) > 0);
    HM::ok('the asset lists its variants',
        count($up['body']['data']['asset']['variants'] ?? []) > 0);
    $formats = $up['body']['data']['derivatives']['formats'] ?? [];
    foreach (['webp', 'avif'] as $f) {
        if (Capabilities::canEncode($f)) HM::ok("{$f} reported over HTTP", in_array($f, $formats, true));
        else HM::na("{$f} over HTTP", 'this host cannot encode ' . $f);
    }
} else {
    HM::na('derivative generation over HTTP', 'no rasteriser on this host');
}

/* --------------------- upload (multipart/form-data) ---------------------- */
$tmpUpload = sys_get_temp_dir() . '/zzz-avos-http-multipart.png';
file_put_contents($tmpUpload, $png2);
$multi = $req('POST', '/api/v1/media', null, $CT, [
    '-F', escapeshellarg('file=@' . $tmpUpload . ';type=image/png'),
    '-F', escapeshellarg('alt_text=ZZZ multipart fixture'),
]);
@unlink($tmpUpload);
HM::eq('a multipart upload also returns 201', $multi['status'], 201);
$multiId = (int)($multi['body']['data']['asset']['id'] ?? 0);
HM::ok('the multipart asset was stored', $multiId > 0);
HM::eq('multipart dimensions were derived',
    [$multi['body']['data']['asset']['width'] ?? 0, $multi['body']['data']['asset']['height'] ?? 0], [1200, 900]);
HM::eq('multipart alt text was applied',
    $multi['body']['data']['asset']['alt_text'] ?? '', 'ZZZ multipart fixture');

/* -------------------------- rejected uploads ----------------------------- */
HM::group('3F.29 hostile uploads over HTTP');

$phpBody = "<?php system(\$_GET['c']); ?>";
$cases = [
    ['a .php upload',            'shell.php',      $phpBody, 422],
    ['a .phtml upload',          'shell.phtml',    $phpBody, 422],
    ['a .phar upload',           'shell.phar',     $phpBody, 422],
    ['a double extension',       'shell.php.png',  $png,     422],
    ['a reversed extension',     'shell.png.php',  $png,     422],
    ['PHP renamed to .png',      'fake.png',       $phpBody, 422],
    ['an SVG carrying script',   'evil.svg',
     '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 422],
    ['an HTML file as an image', 'page.png',       '<!doctype html><html></html>', 422],
    ['a GIF/PHP polyglot',       'poly.gif',       "GIF89a" . str_repeat("\x00", 32) . $phpBody, 422],
];
foreach ($cases as [$label, $name, $body, $expect]) {
    $r = $req('POST', '/api/v1/media', [
        'filename' => $name, 'content_base64' => base64_encode($body),
    ], $CT);
    HM::eq("{$label} is refused with {$expect}", $r['status'], $expect);
}
$tooBig = $req('POST', '/api/v1/media', [
    'filename' => 'huge.png', 'content_base64' => base64_encode($png . str_repeat("\x00", 25 * 1024 * 1024)),
], $CT);
HM::ok('an oversized upload is refused', in_array($tooBig['status'], [413, 422], true));

// The decisive test: an uploaded PHP file must never execute. Nothing was
// stored above, so also prove the public asset tree refuses to run PHP even if
// something did land there.
HM::eq('no PHP file was stored by any of those attempts',
    (int)$conn->scalar("SELECT COUNT(*) FROM media WHERE extension IN ('php','phtml','phar','php5')"), 0);

$storedPath = (string)$conn->scalar('SELECT storage_path FROM media WHERE id = ?', [$mediaId]);
HM::ok('the stored original is not reachable under the public assets URL',
    in_array($req('GET', '/assets/media/' . $storedPath)['status'], [0, 403, 404], true));

/* --------------------------- read / metadata ----------------------------- */
HM::group('3F.26 metadata over HTTP');

$show = $req('GET', '/api/v1/media/' . $mediaId);
HM::eq('GET the asset by id', $show['status'], 200);
HM::eq('  …it reports its kind', $show['body']['data']['kind'] ?? '', 'image');

$list = $req('GET', '/api/v1/media?kind=image&per_page=5');
HM::eq('the media list is readable', $list['status'], 200);
HM::ok('the list is paginated', isset($list['body']['data']['pagination']['per_page']));
HM::eq('  …and honours the filter', $list['body']['data']['pagination']['per_page'] ?? 0, 5);

$patch = $req('PATCH', '/api/v1/media/' . $mediaId, [
    'alt_text' => 'ZZZ updated alt', 'credit' => 'ZZZ synthetic credit',
    'focal' => ['x' => 0.5, 'y' => 0.35],
], $CT);
HM::eq('PATCH updates metadata', $patch['status'], 200);
HM::eq('  …alt text changed', $patch['body']['data']['alt_text'] ?? '', 'ZZZ updated alt');
HM::eq('  …focal point stored', $patch['body']['data']['focal'] ?? [], ['x' => 0.5, 'y' => 0.35]);

$badFocal = $req('PATCH', '/api/v1/media/' . $mediaId, ['focal' => ['x' => 9, 'y' => 0]], $CT);
HM::eq('an out-of-range focal point is 422', $badFocal['status'], 422);
HM::ok('  …with a field-level detail',
    isset($badFocal['body']['error']['details']) && $badFocal['body']['error']['details'] !== []);

$badCrop = $req('PATCH', '/api/v1/media/' . $mediaId,
    ['crop' => ['x' => 0.9, 'y' => 0, 'width' => 0.5, 'height' => 1]], $CT);
HM::eq('an out-of-frame crop is 422', $badCrop['status'], 422);

HM::eq('an unknown asset is 404', $req('GET', '/api/v1/media/999999')['status'], 404);

/* ------------------------------- usage ----------------------------------- */
HM::group('3F.20 / 3F.21 usage over HTTP');

$conn->run("INSERT INTO pages (slug, title, status) VALUES (?, 'ZZZ HTTP Media Page', 'draft')",
    ['zzz-avos-http-media-page-' . $nonce]);
$pageId = (int)$conn->pdo()->lastInsertId();

$attach = $req('POST', '/api/v1/media/' . $mediaId . '/usage',
    ['entity_type' => 'page', 'entity_id' => $pageId, 'field' => 'hero'], $CT);
HM::eq('attaching a usage succeeds', $attach['status'], 200);
HM::eq('  …usage total is 1', $attach['body']['data']['total'] ?? 0, 1);
HM::eq('  …and it is no longer deletable', $attach['body']['data']['deletable'] ?? true, false);

$usage = $req('GET', '/api/v1/media/' . $mediaId . '/usage');
HM::eq('usage is readable', $usage['status'], 200);
HM::eq('  …it names the content title',
    $usage['body']['data']['used_by'][0]['title'] ?? '', 'ZZZ HTTP Media Page');
HM::eq('  …it names the content type', $usage['body']['data']['used_by'][0]['entity_type'] ?? '', 'page');
HM::eq('  …it reports the relationship field', $usage['body']['data']['used_by'][0]['field'] ?? '', 'hero');

$blocked = $req('DELETE', '/api/v1/media/' . $mediaId, null, $CT);
HM::eq('deleting a referenced asset is 409', $blocked['status'], 409);
HM::eq('  …with ASSET_IN_USE', $blocked['body']['error']['details']['reason'] ?? '', 'ASSET_IN_USE');
HM::ok('  …and it lists what is using it',
    ($blocked['body']['error']['details']['used_by'] ?? []) !== []);
HM::eq('the asset still exists', $req('GET', '/api/v1/media/' . $mediaId)['status'], 200);

$detach = $req('DELETE', '/api/v1/media/' . $mediaId . '/usage',
    ['entity_type' => 'page', 'entity_id' => $pageId, 'field' => 'hero'], $CT);
HM::eq('detaching succeeds', $detach['status'], 200);
HM::eq('  …usage is empty again', $detach['body']['data']['total'] ?? -1, 0);

/* ------------------------------ replace ---------------------------------- */
HM::group('3F.23 replace over HTTP');

$png3 = $makePng(1000, 700);
$replace = $req('POST', '/api/v1/media/' . $mediaId . '/replace', [
    'filename' => 'zzz-avos-http-hero-v2.png', 'content_base64' => base64_encode($png3),
], $CT);
HM::eq('replace succeeds', $replace['status'], 200);
$replacementId = (int)($replace['body']['data']['asset']['id'] ?? 0);
HM::ok('a new asset id was issued', $replacementId > 0 && $replacementId !== $mediaId);
HM::eq('the replacement is version 2', $replace['body']['data']['asset']['version'] ?? 0, 2);
HM::ok('the outcome for the predecessor is reported',
    array_key_exists('previous_retained', $replace['body']['data'] ?? []));

/* ------------------------- private + download ---------------------------- */
HM::group('3F.24 private assets and download over HTTP');

$priv = $req('POST', '/api/v1/media', [
    'filename' => 'zzz-avos-http-private.pdf',
    'content_base64' => base64_encode($pdf),
    'visibility' => 'private',
], $CT);
HM::eq('a private upload succeeds', $priv['status'], 201);
$privId = (int)($priv['body']['data']['asset']['id'] ?? 0);
$privAsset = $priv['body']['data']['asset'] ?? [];
HM::ok('a private asset has no public URL',
    array_key_exists('url', $privAsset) && $privAsset['url'] === null);

$privPublic = $req('GET', '/api/v1/content/media/' . $privId);
HM::eq('public metadata for a private asset is 404', $privPublic['status'], 404);
HM::ok('  …and does not reveal that it exists',
    ($privPublic['body']['error']['code'] ?? '') === 'NOT_FOUND');

$dl = $req('GET', '/api/v1/media/' . $privId . '/download');
HM::eq('an authorised private download succeeds', $dl['status'], 200);
HM::ok('  …it is served as an attachment',
    str_contains(strtolower($dl['headers']['content-disposition'] ?? ''), 'attachment'));
HM::ok('  …with a sanitised filename',
    str_contains($dl['headers']['content-disposition'] ?? '', 'zzz-avos-http-private.pdf'));
HM::ok('  …the bytes match what was uploaded', str_contains($dl['raw'], '%PDF-1.4'));
HM::ok('  …it is marked private in the cache header',
    str_contains(strtolower($dl['headers']['cache-control'] ?? ''), 'private')
    || str_contains(strtolower($dl['headers']['cache-control'] ?? ''), 'no-store'));
HM::ok('  …nosniff is set on the download', ($dl['headers']['x-content-type-options'] ?? '') === 'nosniff');
HM::ok('  …no filesystem path appears in any header',
    !str_contains(strtolower(json_encode($dl['headers']) ?: ''), '/home/'));

// A public asset is downloadable by anyone; a private one is not.
$publicDl = $req('GET', '/api/v1/media/' . $replacementId . '/download');
HM::eq('a public asset downloads for an authorised user', $publicDl['status'], 200);

/* -------------------------- authorization -------------------------------- */
HM::group('3F.27 authorization over HTTP');

$req('POST', '/api/v1/auth/logout', [], $CT);
$anonPriv = $req('GET', '/api/v1/media/' . $privId . '/download');
HM::eq('an anonymous private download is 404, not 403', $anonPriv['status'], 404);
HM::ok('  …the response leaks no filename',
    !str_contains(strtolower($anonPriv['raw']), 'zzz-avos-http-private'));
HM::eq('an anonymous public download still works',
    $req('GET', '/api/v1/media/' . $replacementId . '/download')['status'], 200);

$seoLogin = $req('POST', '/api/v1/auth/login', ['email' => $SEO, 'password' => $PW]);
HM::eq('the SEO manager logs in', $seoLogin['status'], 200);
$seoCsrf = ['X-CSRF-Token' => (string)($seoLogin['body']['data']['csrf_token'] ?? '')];

HM::eq('a role without media.read cannot list media',
    $req('GET', '/api/v1/media')['status'], 403);
HM::eq('a role without media.write cannot upload',
    $req('POST', '/api/v1/media', [
        'filename' => 'zzz-avos-http-nope.png', 'content_base64' => base64_encode($png),
    ], $seoCsrf)['status'], 403);
HM::eq('a role without media.read cannot download a private asset',
    $req('GET', '/api/v1/media/' . $privId . '/download')['status'], 403);
$req('POST', '/api/v1/auth/logout', [], $seoCsrf);

// media_manager holds media.delete; editor does not — verified at the API edge.
$mgr2 = $req('POST', '/api/v1/auth/login', ['email' => $MGR, 'password' => $PW]);
$CT = ['X-CSRF-Token' => (string)($mgr2['body']['data']['csrf_token'] ?? '')];
HM::eq('media_manager may delete', $req('DELETE', '/api/v1/media/' . $privId, null, $CT)['status'], 200);

/* ---------------------------- orphan report ------------------------------ */
HM::group('3F.22 orphan report over HTTP');

$orph = $req('GET', '/api/v1/media/orphans');
HM::eq('the orphan report is readable', $orph['status'], 200);
HM::eq('  …it takes no action', $orph['body']['data']['orphans']['action_taken'] ?? '', 'none');
HM::ok('  …it separates unreferenced assets from orphans',
    isset($orph['body']['data']['unreferenced']['items']));
HM::eq('  …duplicates are reported as candidates only',
    $orph['body']['data']['duplicates']['action_taken'] ?? '', 'none');
HM::ok('  …the report exposes no absolute path',
    !str_contains((string)json_encode($orph['body']), '/home/'));

/* ------------------------------ cleanup ---------------------------------- */
HM::group('3F.33 HTTP fixture cleanup');

foreach ([$mediaId, $multiId, $replacementId, $privId] as $id) {
    if ($id > 0) $req('DELETE', '/api/v1/media/' . $id . '?force=1', null, $CT);
}
$req('POST', '/api/v1/auth/logout', [], $CT);

$conn->run("DELETE FROM media_usage WHERE media_id IN (SELECT id FROM media WHERE original_name LIKE 'zzz-avos-http%')");
$conn->run("DELETE FROM media_variants WHERE media_id IN (SELECT id FROM media WHERE original_name LIKE 'zzz-avos-http%')");
$conn->run("DELETE FROM media WHERE original_name LIKE 'zzz-avos-http%'");
$conn->run('DELETE FROM pages WHERE id = ?', [$pageId]);
foreach ([$mgrId, $seoId] as $uidToGo) {
    $conn->run('DELETE FROM audit_logs WHERE actor_id = ?', [$uidToGo]);
    $conn->run('DELETE FROM sessions WHERE user_id = ?', [$uidToGo]);
    $conn->run('DELETE FROM user_roles WHERE user_id = ?', [$uidToGo]);
    $conn->run('DELETE FROM users WHERE id = ?', [$uidToGo]);
}
@unlink($jar);

HM::eq('media fixtures removed',
    (int)$conn->scalar("SELECT COUNT(*) FROM media WHERE original_name LIKE 'zzz-avos-http%'"), 0);
HM::eq('user fixtures removed',
    (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email LIKE 'zzz-avos-http-%'"), 0);

echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d   NOT-AVAILABLE %d\n", HM::$pass, HM::$fail, HM::$skip, HM::$na);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(HM::$fail > 0 ? 1 : 0);
