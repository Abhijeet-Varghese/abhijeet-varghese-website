<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3E §3E.29: REAL HTTP verification of the content API.
 *
 *   AVOS_HTTP_BASE=http://127.0.0.1:8199 php avos-php/tests/next/content-http.php
 *
 * Every assertion below goes over a socket to the real front controller
 * (`public-next/api/index.php`) — no service is called directly. That is the
 * whole point: Phase 3D found a bug (missing security headers on 404/405) that
 * only a real request could reveal.
 *
 * SKIPs, never silently passes, when no server is listening.
 *
 * Fixtures are synthetic and marked `zzz-avos-http-`; the suite deletes them.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Auth\PasswordHasher;
use AvOS\Database\Connection;
use AvOS\Identity\UserRepository;

final class H
{
    public static int $pass = 0, $fail = 0, $skip = 0;
    public static function group(string $g): void
    { echo "\n  {$g}\n  " . str_repeat('-', 72) . "\n"; }
    public static function ok(string $n, bool $c): void
    { $c ? self::$pass++ : self::$fail++; printf("    %-60s %s\n", substr($n, 0, 60), $c ? 'PASS' : 'FAIL'); }
    public static function eq(string $n, mixed $a, mixed $b): void
    {
        if ($a !== $b) { self::$fail++;
            printf("    %-60s FAIL  (%s != %s)\n", substr($n, 0, 60),
                substr(var_export($a, true), 0, 50), substr(var_export($b, true), 0, 50)); return; }
        self::ok($n, true);
    }
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
}

$base = rtrim((string)(getenv('AVOS_HTTP_BASE') ?: 'http://127.0.0.1:8199'), '/');
$cookieJar = tempnam(sys_get_temp_dir(), 'avos-http-');

/**
 * One real request. Uses the curl binary rather than the curl extension so the
 * test has no PHP extension dependency.
 *
 * @return array{status:int,headers:array<string,string>,body:array|null,raw:string}
 */
$req = static function (string $method, string $path, ?array $json = null, array $headers = [])
    use ($base, $cookieJar): array {
    $cmd = ['curl', '-sS', '-i', '-X', escapeshellarg($method),
            '-c', escapeshellarg($cookieJar), '-b', escapeshellarg($cookieJar),
            '--max-time', '15'];
    foreach ($headers as $k => $v) {
        $cmd[] = '-H';
        $cmd[] = escapeshellarg($k . ': ' . $v);
    }
    if ($json !== null) {
        $cmd[] = '-H';
        $cmd[] = escapeshellarg('Content-Type: application/json');
        $cmd[] = '--data-binary';
        $cmd[] = escapeshellarg((string)json_encode($json, JSON_UNESCAPED_SLASHES));
    }
    $cmd[] = escapeshellarg($base . $path);

    $raw = (string)shell_exec(implode(' ', $cmd) . ' 2>/dev/null');
    // Skip any 100-continue / redirect preambles.
    $parts = preg_split("/\r\n\r\n/", $raw);
    $bodyRaw = array_pop($parts) ?? '';
    $headBlock = array_pop($parts) ?? '';

    $status = 0;
    $hdrs = [];
    foreach (preg_split("/\r?\n/", $headBlock) ?: [] as $line) {
        if (preg_match('#^HTTP/[\d.]+ (\d{3})#', $line, $m) === 1) { $status = (int)$m[1]; continue; }
        if (str_contains($line, ':')) {
            [$k, $v] = explode(':', $line, 2);
            $hdrs[strtolower(trim($k))] = trim($v);
        }
    }
    $decoded = json_decode($bodyRaw, true);
    return ['status' => $status, 'headers' => $hdrs,
            'body' => is_array($decoded) ? $decoded : null, 'raw' => $bodyRaw];
};

/* ---------------------------- reachability ------------------------------ */
H::group('3E.29 real HTTP — reachability');

$probe = $req('GET', '/api/v1/system/health');
if ($probe['status'] === 0) {
    H::skip('all HTTP tests', 'no server at ' . $base);
    echo "\n  " . str_repeat('=', 74) . "\n";
    printf("  PASS %d   FAIL %d   SKIP %d\n", H::$pass, H::$fail, H::$skip);
    echo '  ' . str_repeat('=', 74) . "\n\n";
    exit(0);
}
H::eq('health endpoint answers over HTTP', $probe['status'], 200);
H::ok('response carries a request id header', ($probe['headers']['x-request-id'] ?? '') !== '');

/* --------------------------- fixture user ------------------------------- */
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1',
    getenv('AVOS_TEST_DB') ?: 'avos_next_dev',
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);
$PW = 'HttpFixture_2026!x';
$EMAIL = 'zzz-avos-http-editor@example.test';
$users = new UserRepository($conn, new PasswordHasher());
$conn->run('DELETE FROM users WHERE email = ?', [$EMAIL]);
$editorId = $users->create('ZZZ HTTP Editor', $EMAIL, $PW, ['editor'], false)->id;

/* ------------------------- unauthenticated ------------------------------ */
H::group('3E.16 / 3E.24 public surface over HTTP (no session)');

$r = $req('GET', '/api/v1/content');
H::eq('GET /api/v1/content is public', $r['status'], 200);
H::ok('public summary reports counts only',
    isset($r['body']['data']['published']) && !isset($r['body']['data']['items']));

foreach (['/api/v1/content/pages', '/api/v1/content/projects',
          '/api/v1/content/articles', '/api/v1/content/experience'] as $p) {
    H::eq("GET {$p} is public", $req('GET', $p)['status'], 200);
}

foreach (['/api/v1/pages', '/api/v1/projects', '/api/v1/articles', '/api/v1/experience'] as $p) {
    $u = $req('GET', $p);
    H::eq("GET {$p} without a session is 401", $u['status'], 401);
    H::eq("  …and the error code is UNAUTHORIZED", $u['body']['error']['code'] ?? '', 'UNAUTHORIZED');
}
H::eq('POST /api/v1/pages without a session is 401', $req('POST', '/api/v1/pages', ['title' => 'x'])['status'], 401);
H::eq('DELETE /api/v1/pages/1 without a session is 401', $req('DELETE', '/api/v1/pages/1')['status'], 401);

$nf = $req('GET', '/api/v1/content/pages/zzz-avos-http-does-not-exist');
H::eq('an unknown public slug is 404', $nf['status'], 404);
H::eq('security headers are present on a 404',
    $nf['headers']['x-content-type-options'] ?? '', 'nosniff');

$ma = $req('DELETE', '/api/v1/content/pages');
H::eq('a wrong verb on a public route is 405', $ma['status'], 405);
H::eq('security headers are present on a 405',
    $ma['headers']['x-content-type-options'] ?? '', 'nosniff');

/* ------------------------------ login ----------------------------------- */
H::group('3E.29 authenticated content lifecycle over HTTP');

$login = $req('POST', '/api/v1/auth/login', ['email' => $EMAIL, 'password' => $PW]);
H::eq('login succeeds', $login['status'], 200);
$csrf = (string)($login['body']['data']['csrf_token'] ?? '');
H::ok('login returned a CSRF token', $csrf !== '');
$CT = ['X-CSRF-Token' => $csrf];

$list = $req('GET', '/api/v1/pages');
H::eq('GET /api/v1/pages with a session is 200', $list['status'], 200);
H::ok('the list is paginated', isset($list['body']['data']['pagination']['per_page']));

/* ------------------------------- CSRF ----------------------------------- */
$noCsrf = $req('POST', '/api/v1/pages', ['title' => 'ZZZ AVOS HTTP No CSRF']);
H::eq('a mutating request without a CSRF token is 419', $noCsrf['status'], 419);
H::eq('  …and the code is CSRF_FAILED', $noCsrf['body']['error']['code'] ?? '', 'CSRF_FAILED');

$badCsrf = $req('POST', '/api/v1/pages', ['title' => 'ZZZ AVOS HTTP Bad CSRF'],
    ['X-CSRF-Token' => str_repeat('0', 48)]);
H::eq('a wrong CSRF token is 419', $badCsrf['status'], 419);

/* ------------------------------ CREATE ---------------------------------- */
$create = $req('POST', '/api/v1/pages', [
    'title' => 'ZZZ AVOS HTTP Page',
    'slug'  => 'zzz-avos-http-page',
    'excerpt' => 'synthetic http fixture',
    'content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'http v1']]]],
], $CT);
H::eq('POST creates a page with 201', $create['status'], 201);
$pid = (int)($create['body']['data']['id'] ?? 0);
H::ok('the created page has an id', $pid > 0);
H::eq('the created page is a draft', $create['body']['data']['status'] ?? '', 'draft');
H::eq('the envelope carries a top-level request_id',
    isset($create['body']['request_id']) && is_string($create['body']['request_id']), true);
H::eq('the envelope has ok=true', $create['body']['ok'] ?? null, true);
H::ok('the envelope has error=null',
    array_key_exists('error', $create['body'] ?? []) && $create['body']['error'] === null);

/* -------------------------- validation errors --------------------------- */
$bad = $req('POST', '/api/v1/pages', ['title' => '', 'slug' => 'bad slug.html'], $CT);
H::eq('an invalid create is 422', $bad['status'], 422);
H::eq('  …with VALIDATION_ERROR', $bad['body']['error']['code'] ?? '', 'VALIDATION_ERROR');
H::ok('  …and a details map naming the field',
    is_array($bad['body']['error']['details'] ?? null) && $bad['body']['error']['details'] !== []);

$dupe = $req('POST', '/api/v1/pages', ['title' => 'ZZZ Dup', 'slug' => 'zzz-avos-http-page'], $CT);
H::eq('a duplicate slug is 409', $dupe['status'], 409);
H::eq('  …with CONFLICT', $dupe['body']['error']['code'] ?? '', 'CONFLICT');

$badJson = $req('POST', '/api/v1/pages', null,
    $CT + ['Content-Type' => 'application/json']);
H::ok('an empty body is handled without a 500', $badJson['status'] < 500);

/* --------------------------- READ / UPDATE ------------------------------ */
$show = $req('GET', '/api/v1/pages/' . $pid);
H::eq('GET the page by id', $show['status'], 200);
H::eq('  …returns the draft to an authenticated reader', $show['body']['data']['status'] ?? '', 'draft');

$patch = $req('PATCH', '/api/v1/pages/' . $pid, ['title' => 'ZZZ AVOS HTTP Page v2'], $CT);
H::eq('PATCH updates the page', $patch['status'], 200);
H::eq('  …and the title changed', $patch['body']['data']['title'] ?? '', 'ZZZ AVOS HTTP Page v2');

$put = $req('PUT', '/api/v1/pages/' . $pid,
    ['content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'http v3']]]]], $CT);
H::eq('PUT updates the page', $put['status'], 200);

$statusAttempt = $req('PATCH', '/api/v1/pages/' . $pid, ['status' => 'published'], $CT);
H::eq('setting status through PATCH is refused with 409', $statusAttempt['status'], 409);

/* ------------------------------ PUBLISH --------------------------------- */
$pre = $req('GET', '/api/v1/pages/' . $pid . '/preflight');
H::eq('preflight is readable', $pre['status'], 200);
H::eq('  …and reports ok', $pre['body']['data']['ok'] ?? null, true);

$pubR = $req('POST', '/api/v1/pages/' . $pid . '/publish', ['note' => 'http test'], $CT);
H::eq('POST publish succeeds', $pubR['status'], 200);
H::eq('  …status is published', $pubR['body']['data']['status'] ?? '', 'published');
H::eq('  …and the flat path was created', $pubR['body']['data']['path'] ?? '', '/zzz-avos-http-page');

$pubRead = $req('GET', '/api/v1/content/pages/zzz-avos-http-page');
H::eq('the page is now publicly readable', $pubRead['status'], 200);
foreach (['id', 'status', 'author_id', 'created_by', 'updated_by', 'deleted_at'] as $leak) {
    H::ok("the public payload omits {$leak}", !array_key_exists($leak, $pubRead['body']['data'] ?? []));
}

$resolve = $req('GET', '/api/v1/content/resolve?path=/zzz-avos-http-page');
H::eq('resolve answers over HTTP', $resolve['status'], 200);
H::eq('  …and matches content', $resolve['body']['data']['match'] ?? '', 'content');

/* ------------------------------ VERSIONS -------------------------------- */
$vers = $req('GET', '/api/v1/pages/' . $pid . '/versions');
H::eq('version list is readable', $vers['status'], 200);
$total = (int)($vers['body']['data']['pagination']['total'] ?? 0);
H::ok('at least 4 versions exist (create, update, update, publish)', $total >= 4);
H::ok('version summaries carry no payload',
    !array_key_exists('payload', $vers['body']['data']['items'][0] ?? ['payload' => 1]));

$v1 = $req('GET', '/api/v1/pages/' . $pid . '/versions/1');
H::eq('a single version is readable', $v1['status'], 200);
H::ok('  …and includes its payload', isset($v1['body']['data']['payload']));
H::eq('an unknown version is 404', $req('GET', '/api/v1/pages/' . $pid . '/versions/999')['status'], 404);

$restore = $req('POST', '/api/v1/pages/' . $pid . '/versions/1/restore', [], $CT);
H::eq('restore succeeds', $restore['status'], 200);
H::eq('  …reports the source version', $restore['body']['data']['restored_from'] ?? 0, 1);
H::eq('  …and appends rather than rewinding',
    (int)($req('GET', '/api/v1/pages/' . $pid . '/versions')['body']['data']['pagination']['total'] ?? 0),
    $total + 1);
H::eq('the restored title is version 1s title',
    $req('GET', '/api/v1/pages/' . $pid)['body']['data']['title'] ?? '', 'ZZZ AVOS HTTP Page');

/* ----------------------------- UNPUBLISH -------------------------------- */
$unpub = $req('POST', '/api/v1/pages/' . $pid . '/unpublish', [], $CT);
H::eq('unpublish succeeds', $unpub['status'], 200);
H::eq('the page is no longer publicly readable',
    $req('GET', '/api/v1/content/pages/zzz-avos-http-page')['status'], 404);
H::eq('but authenticated management read still works',
    $req('GET', '/api/v1/pages/' . $pid)['status'], 200);
H::eq('  …and reports the unpublished state',
    $req('GET', '/api/v1/pages/' . $pid)['body']['data']['status'] ?? '', 'unpublished');
H::eq('resolve no longer serves it',
    $req('GET', '/api/v1/content/resolve?path=/zzz-avos-http-page')['body']['data']['match'] ?? '', 'none');

/* ---------------------------- AUTHORIZATION ----------------------------- */
H::group('3E.23 authorization over HTTP');

// An editor holds no pages.delete, so a real DELETE must be a real 403.
$del = $req('DELETE', '/api/v1/pages/' . $pid, null, $CT);
H::eq('an editor DELETE is 403', $del['status'], 403);
H::eq('  …with FORBIDDEN', $del['body']['error']['code'] ?? '', 'FORBIDDEN');
H::eq('the page still exists after the refused delete',
    $req('GET', '/api/v1/pages/' . $pid)['status'], 200);

$ownerOnly = $req('GET', '/api/v1/system/owner-status');
H::eq('owner-only op fails closed while no owner is configured', $ownerOnly['status'], 403);

/* ------------------------------- LOGOUT --------------------------------- */
$req('POST', '/api/v1/auth/logout', [], $CT);
H::eq('after logout the management API is 401 again',
    $req('GET', '/api/v1/pages')['status'], 401);
H::eq('after logout the public API still works',
    $req('GET', '/api/v1/content/pages')['status'], 200);

/* ------------------------------- CLEANUP -------------------------------- */
H::group('3E.19 HTTP fixture cleanup');

$conn->run("DELETE FROM content_versions WHERE entity_type='page' AND entity_id=?", [$pid]);
$conn->run("DELETE FROM page_routes WHERE path LIKE '/zzz-avos-http-%'");
$conn->run("DELETE FROM redirects WHERE from_path LIKE '/zzz-avos-http-%'");
$conn->run("DELETE FROM pages WHERE slug LIKE 'zzz-avos-http-%'");
$conn->run("DELETE FROM audit_logs WHERE actor_id = ?", [$editorId]);
$conn->run('DELETE FROM sessions WHERE user_id = ?', [$editorId]);
$conn->run('DELETE FROM user_roles WHERE user_id = ?', [$editorId]);
$conn->run('DELETE FROM users WHERE id = ?', [$editorId]);
@unlink($cookieJar);

H::eq('page fixtures removed',
    (int)$conn->scalar("SELECT COUNT(*) FROM pages WHERE slug LIKE 'zzz-avos-http-%'"), 0);
H::eq('user fixture removed',
    (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email = ?", [$EMAIL]), 0);

echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d\n", H::$pass, H::$fail, H::$skip);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(H::$fail > 0 ? 1 : 0);
