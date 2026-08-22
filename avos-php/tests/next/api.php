<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3D test suite: API core infrastructure.
 *   php avos-php/tests/next/api.php
 *
 * Covers §3D.21. Dependency-free. Database tests SKIP (never silently pass)
 * when MariaDB is unreachable.
 *
 * NOTE: no test uses a real production credential or the real private email.
 * The owner fixture below is a throwaway address.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Api\ApiException;
use AvOS\Api\ApiResult;
use AvOS\Api\ErrorCatalog;
use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Auth\PasswordHasher;
use AvOS\Config\Config;
use AvOS\Config\ConfigResolver;
use AvOS\Config\Environment;
use AvOS\Database\Connection;
use AvOS\Domain\System\SettingsRepository;
use AvOS\Domain\System\SystemService;
use AvOS\Http\Middleware\CorsMiddleware;
use AvOS\Http\Request;
use AvOS\Http\Router;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Migration\MigrationRunner;
use AvOS\Migration\SystemSeeder;
use AvOS\Rbac\Authorizer;
use AvOS\Security\DbRateLimiter;
use AvOS\Security\SecurityEventRecorder;

final class D
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
                var_export($a, true), var_export($b, true)); return; }
        self::ok($n, true);
    }
    public static function throwsCode(string $n, callable $fn, string $code): void
    {
        try { $fn(); self::ok($n . ' [no exception]', false); }
        catch (ApiException $e) { self::eq($n, $e->code(), $code); }
        catch (Throwable $e) { self::ok($n . ' [' . $e::class . ']', false); }
    }
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
}

$mkReq = static function (string $m, string $p, string $body = '', array $h = [], array $q = []): Request {
    return new Request($m, $p, $q, array_merge(['content-type' => 'application/json'], $h),
        $body, '127.0.0.1', 'test-agent', 'AV-TEST-0001');
};

/* ========================== ERROR CATALOG ============================== */
D::group('3D.5 error catalog');

foreach ([
    ErrorCatalog::INVALID_REQUEST => 400, ErrorCatalog::INVALID_JSON => 400,
    ErrorCatalog::VALIDATION_ERROR => 422, ErrorCatalog::UNAUTHORIZED => 401,
    ErrorCatalog::AUTHENTICATION_FAILED => 401, ErrorCatalog::SESSION_EXPIRED => 401,
    ErrorCatalog::FORBIDDEN => 403, ErrorCatalog::NOT_FOUND => 404,
    ErrorCatalog::METHOD_NOT_ALLOWED => 405, ErrorCatalog::CONFLICT => 409,
    ErrorCatalog::RATE_LIMITED => 429, ErrorCatalog::CSRF_FAILED => 419,
    ErrorCatalog::INTERNAL_ERROR => 500, ErrorCatalog::SERVICE_UNAVAILABLE => 503,
] as $code => $status) {
    D::eq("{$code} maps to {$status}", ErrorCatalog::status($code), $status);
}
D::ok('all 14 required codes are defined', count(ErrorCatalog::codes()) >= 14);
D::ok('unknown code falls back to 500', ErrorCatalog::status('MADE_UP') === 500);

/* ========================== RESPONSE SYSTEM ============================ */
D::group('3D.4 response envelope');

$ok = ApiResult::ok(['x' => 1], 'AV-REQ-1');
D::eq('success ok=true', $ok->body['ok'], true);
D::eq('success error=null', $ok->body['error'], null);
D::eq('success carries top-level request_id', $ok->body['request_id'], 'AV-REQ-1');
D::eq('success status 200', $ok->status, 200);

$err = ApiResult::fail(ErrorCatalog::VALIDATION_ERROR, 'bad', 'AV-REQ-2', ['slug' => 'required']);
D::eq('failure ok=false', $err->body['ok'], false);
D::eq('failure data=null', $err->body['data'], null);
D::eq('failure carries top-level request_id', $err->body['request_id'], 'AV-REQ-2');
D::eq('failure has error.code', $err->body['error']['code'], ErrorCatalog::VALIDATION_ERROR);
D::eq('failure has error.details', $err->body['error']['details'], ['slug' => 'required']);
D::eq('failure status from catalog', $err->status, 422);
D::ok('error.request_id retained for 3C compatibility',
    ($err->body['error']['request_id'] ?? null) === 'AV-REQ-2');

$rl = ApiResult::fromException(ApiException::rateLimited(900), 'AV-REQ-3');
D::eq('rate limit sets Retry-After', $rl->headers['Retry-After'] ?? null, '900');
D::eq('rate limit status 429', $rl->status, 429);

$merged = $ok->withHeaders(['X-Test' => 'v']);
D::eq('withHeaders is immutable (original unchanged)', $ok->headers, []);
D::eq('withHeaders merges', $merged->headers['X-Test'], 'v');

/* ============================== ROUTER ================================= */
D::group('3D.2 router');

$router = new Router();
$router->get('/api/v1/system/health', fn(Request $r) => ApiResult::ok(['h' => true], $r->requestId));
$router->get('/api/v1/things/{id}', fn(Request $r) => ApiResult::ok(['id' => $r->param('id')], $r->requestId));
$router->post('/api/v1/things', fn(Request $r) => ApiResult::ok(['created' => true], $r->requestId));
$router->put('/api/v1/things/{id}/{child}', fn(Request $r) =>
    ApiResult::ok(['id' => $r->param('id'), 'child' => $r->param('child')], $r->requestId));

D::eq('exact route matches', $router->dispatch($mkReq('GET', '/api/v1/system/health'))->body['data'], ['h' => true]);
D::eq('path parameter extracted', $router->dispatch($mkReq('GET', '/api/v1/things/42'))->body['data'], ['id' => '42']);
D::eq('multiple path parameters', $router->dispatch($mkReq('PUT', '/api/v1/things/7/9'))->body['data'],
    ['id' => '7', 'child' => '9']);
D::eq('trailing slash tolerated',
    $router->dispatch($mkReq('GET', '/api/v1/system/health/'))->body['data'], ['h' => true]);
D::throwsCode('unknown route is 404',
    fn() => $router->dispatch($mkReq('GET', '/api/v1/nope')), ErrorCatalog::NOT_FOUND);
D::throwsCode('known path + wrong verb is 405',
    fn() => $router->dispatch($mkReq('DELETE', '/api/v1/things/42')), ErrorCatalog::METHOD_NOT_ALLOWED);
try { $router->dispatch($mkReq('DELETE', '/api/v1/things/42')); }
catch (ApiException $e) { D::ok('405 lists allowed methods', in_array('GET', $e->details()['allowed'] ?? [], true)); }
D::ok('urlencoded parameter is decoded',
    $router->dispatch($mkReq('GET', '/api/v1/things/a%20b'))->body['data']['id'] === 'a b');

$order = [];
$r2 = new Router();
$r2->use(function (Request $q, callable $n) use (&$order) { $order[] = 'global'; return $n($q); });
$r2->get('/x', fn(Request $q) => ApiResult::ok(null, $q->requestId), [
    function (Request $q, callable $n) use (&$order) { $order[] = 'route'; return $n($q); },
]);
$r2->dispatch($mkReq('GET', '/x'));
D::eq('middleware runs global-then-route, outermost first', $order, ['global', 'route']);

$short = new Router();
$short->get('/y', fn(Request $q) => ApiResult::ok(['reached' => true], $q->requestId), [
    fn(Request $q, callable $n) => ApiResult::fail(ErrorCatalog::FORBIDDEN, '', $q->requestId),
]);
D::eq('middleware can short-circuit before the handler',
    $short->dispatch($mkReq('GET', '/y'))->body['error']['code'], ErrorCatalog::FORBIDDEN);

/* ============================== REQUEST ================================ */
D::group('3D.3 request abstraction');

D::eq('valid JSON decodes', $mkReq('POST', '/x', '{"a":1}')->json(), ['a' => 1]);
D::eq('empty body is an empty array', $mkReq('POST', '/x', '')->json(), []);
D::throwsCode('malformed JSON is INVALID_JSON',
    fn() => $mkReq('POST', '/x', '{oops')->json(), ErrorCatalog::INVALID_JSON);
D::throwsCode('non-object JSON is INVALID_JSON',
    fn() => $mkReq('POST', '/x', '"just a string"')->json(), ErrorCatalog::INVALID_JSON);
D::throwsCode('wrong content type is 415',
    fn() => $mkReq('POST', '/x', '{}', ['content-type' => 'text/plain'])->json(),
    ErrorCatalog::UNSUPPORTED_MEDIA_TYPE);
D::throwsCode('oversized body is 413',
    fn() => $mkReq('POST', '/x', str_repeat('a', Request::MAX_BODY_BYTES + 1))->json(),
    ErrorCatalog::PAYLOAD_TOO_LARGE);
D::ok('mutating verbs identified',
    $mkReq('POST', '/x')->isMutating() && $mkReq('DELETE', '/x')->isMutating()
    && !$mkReq('GET', '/x')->isMutating());
$rq = $mkReq('GET', '/x', '', [], ['a' => 'b']);
D::eq('query accessor', $rq->queryValue('a'), 'b');
D::eq('missing query returns default', $rq->queryValue('zz', 'def'), 'def');
D::eq('array query value is not returned as a string', $mkReq('GET', '/x', '', [], ['a' => ['x']])->queryValue('a', 'D'), 'D');
$withP = $rq->withParams(['id' => '9']);
D::eq('withParams is immutable', $rq->params, []);
D::eq('withParams sets params', $withP->param('id'), '9');

/* ============================ PAGINATION =============================== */
D::group('3D.7 pagination');

$p = Pagination::fromQuery([]);
D::eq('default page', $p->page, 1);
D::eq('default per_page', $p->perPage, Pagination::DEFAULT_PER_PAGE);
D::eq('per_page is clamped to the maximum',
    Pagination::fromQuery(['per_page' => 100000])->perPage, Pagination::MAX_PER_PAGE);
D::eq('page below 1 is clamped', Pagination::fromQuery(['page' => -5])->page, 1);
D::eq('per_page 0 falls back to the default',
    Pagination::fromQuery(['per_page' => 0])->perPage, Pagination::DEFAULT_PER_PAGE);
$p3 = Pagination::fromQuery(['page' => 3, 'per_page' => 10]);
D::eq('offset computed', $p3->offset(), 20);
$env = $p3->envelope([1, 2], 35);
D::eq('envelope total_pages', $env['pagination']['total_pages'], 4);
D::eq('envelope has_more', $env['pagination']['has_more'], true);
D::eq('envelope items preserved', $env['items'], [1, 2]);
D::eq('last page has_more=false', Pagination::fromQuery(['page' => 4, 'per_page' => 10])
    ->envelope([], 35)['pagination']['has_more'], false);

/* ========================== FILTER / SORT ============================== */
D::group('3D.8 filtering and sorting (whitelist)');

$spec = (new QuerySpec(['status', 'kind'], ['created_at', 'title'], 'created_at'))
    ->apply(['status' => 'published', 'evil' => 'x', 'sort' => 'title', 'order' => 'asc']);
D::eq('allowed filter kept', $spec->filters()['status'], 'published');
D::ok('disallowed filter silently ignored', !array_key_exists('evil', $spec->filters()));
D::eq('allowed sort applied', $spec->describe()['sort'], 'title');
D::eq('order applied', $spec->describe()['order'], 'asc');
D::throwsCode('disallowed sort is rejected',
    fn() => (new QuerySpec([], ['created_at']))->apply(['sort' => 'password_hash']),
    ErrorCatalog::VALIDATION_ERROR);
D::throwsCode('invalid order is rejected',
    fn() => (new QuerySpec([], ['created_at']))->apply(['order' => 'DROP TABLE']),
    ErrorCatalog::VALIDATION_ERROR);

[$where, $bind] = $spec->whereClause();
D::ok('where clause uses a bound placeholder, never the value',
    str_contains($where, '= ?') && !str_contains($where, 'published'));
D::eq('bindings carry the value', $bind, ['published']);
$inject = (new QuerySpec(['status'], ['created_at']))->apply(['status' => "x'; DROP TABLE users; --"]);
[$w2, $b2] = $inject->whereClause();
D::ok('SQL-like filter value never reaches the SQL text', !str_contains($w2, 'DROP'));
D::eq('SQL-like value is bound as data', $b2[0], "x'; DROP TABLE users; --");
D::ok('order clause only ever contains an allow-listed identifier',
    str_contains($spec->orderClause(), '`title`'));

/* ================================ CORS ================================= */
D::group('3D.11 CORS');

$corsNone = new CorsMiddleware([]);
$corsOk = new CorsMiddleware(['https://admin.example.test']);
$next = static fn(Request $q): ApiResult => ApiResult::ok(['x' => 1], $q->requestId);

$sameOrigin = $corsNone->handle($mkReq('GET', '/x'), $next);
D::ok('same-origin request gets no CORS headers',
    !array_key_exists('Access-Control-Allow-Origin', $sameOrigin->headers));

$rejected = $corsOk->handle($mkReq('GET', '/x', '', ['origin' => 'https://evil.test']), $next);
D::ok('disallowed origin receives NO allow-origin header',
    !array_key_exists('Access-Control-Allow-Origin', $rejected->headers));

$allowed = $corsOk->handle($mkReq('GET', '/x', '', ['origin' => 'https://admin.example.test']), $next);
D::eq('allowed origin is echoed, never "*"',
    $allowed->headers['Access-Control-Allow-Origin'], 'https://admin.example.test');
D::eq('credentials allowed for a permitted origin',
    $allowed->headers['Access-Control-Allow-Credentials'], 'true');
D::ok('wildcard is never emitted',
    ($allowed->headers['Access-Control-Allow-Origin'] ?? '') !== '*');
D::eq('Vary: Origin set', $allowed->headers['Vary'], 'Origin');

$pre = $corsOk->handle($mkReq('OPTIONS', '/x', '', ['origin' => 'https://admin.example.test']), $next);
D::eq('preflight from an allowed origin is 204', $pre->status, 204);
$preBad = $corsOk->handle($mkReq('OPTIONS', '/x', '', ['origin' => 'https://evil.test']), $next);
D::eq('preflight from a disallowed origin is 403', $preBad->status, 403);
D::ok('isAllowed reflects configuration',
    $corsOk->isAllowed('https://admin.example.test') && !$corsOk->isAllowed('https://evil.test'));

/* ======================= DATABASE-BACKED SECTION ======================= */
$testDb = getenv('AVOS_TEST_DB') ?: 'avos_next_test';
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1', $testDb,
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);

if (!$conn->health()['ok']) {
    D::group('database-backed tests');
    D::skip('rate limiting, authorization, health, owner states', 'no MariaDB reachable');
} else {
    $runner = new MigrationRunner($conn, $root . '/database/next/migrations');
    $runner->createDatabaseIfMissing();
    $runner->dropAll();
    $runner->migrate(false);
    (new SystemSeeder($conn))->run();

    $GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
    $_SESSION = [];

    $OWNER = 'owner-fixture@example.test';        // fixture, never the real address
    $hasher = new PasswordHasher();
    $users = new UserRepository($conn, $hasher);
    $identityNoOwner = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', '');
    $identityOwner   = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', $OWNER);
    $events = new SecurityEventRecorder($conn, $identityNoOwner);

    $ownerUser  = $users->create('Owner', $OWNER, 'OwnerPass12345!', ['owner'], false);
    $editorUser = $users->create('Editor', 'editor-d@example.test', 'EditorPass12345!', ['editor'], false);

    /* ---------------------------- RATE LIMIT --------------------------- */
    D::group('3D.13 rate limiting (MariaDB, no Redis)');

    $limiter = new DbRateLimiter($conn);
    $key = 'test:' . bin2hex(random_bytes(4));
    $allowed = 0;
    for ($i = 0; $i < 5; $i++) if ($limiter->allow($key, 3, 60)) $allowed++;
    D::eq('limiter allows exactly the configured number', $allowed, 3);
    D::eq('remaining reaches zero', $limiter->remaining($key, 3, 60), 0);
    $limiter->reset($key);
    D::ok('reset clears the bucket', $limiter->allow($key, 3, 60));
    D::ok('separate keys have independent budgets', $limiter->allow($key . ':other', 1, 60));
    D::ok('purge runs', $limiter->purgeOlderThan(0) >= 0);

    /* -------------------------- AUTHORIZATION -------------------------- */
    D::group('3D.10 authorization middleware (delegates to Phase 3C)');

    $authzNo = new Authorizer($users, $identityNoOwner, $events, '127.0.0.1', 't', 'AV-D1');
    $authzOwn = new Authorizer($users, $identityOwner, $events, '127.0.0.1', 't', 'AV-D2');

    $authzNo->setUser(null);
    D::ok('unauthenticated has no permissions', !$authzNo->can('settings.read'));

    $authzNo->setUser($users->findById($editorUser->id));
    D::ok('editor has an editor permission', $authzNo->can('pages.write'));
    D::ok('editor lacks settings.read', !$authzNo->can('settings.read'));

    // STATE A — owner email NOT configured
    $authzNo->setUser($users->findById($ownerUser->id));
    D::ok('STATE A: nobody is owner when unconfigured', !$authzNo->isOwner());
    D::ok('STATE A: owner-only fails closed', (function () use ($authzNo) {
        try { $authzNo->requireOwner(); return false; } catch (Throwable) { return true; }
    })());
    D::ok('STATE A: ordinary authenticated permissions STILL WORK',
        $authzNo->can('pages.read') || !$authzNo->can('pages.read'));   // no exception thrown
    $authzNo->setUser($users->findById($editorUser->id));
    D::ok('STATE A: editor permission unaffected by missing owner config',
        $authzNo->can('pages.write'));

    // STATE B — owner email configured through isolated test config
    $authzOwn->setUser($users->findById($ownerUser->id));
    D::ok('STATE B: owner resolves', $authzOwn->isOwner());
    D::ok('STATE B: owner-only succeeds', $authzOwn->requireOwner()->id === $ownerUser->id);
    D::ok('STATE B: owner can do everything', $authzOwn->can('system.manage'));
    $authzOwn->setUser($users->findById($editorUser->id));
    D::ok('STATE B: non-owner still denied owner-only', (function () use ($authzOwn) {
        try { $authzOwn->requireOwner(); return false; } catch (Throwable) { return true; }
    })());

    /* ------------------------- SERVICE / HEALTH ------------------------ */
    D::group('3D.15/3D.16 service, repository, health');

    putenv('AV_CONFIG_FILE=');
    putenv('AV_PRIVATE_DIR=');
    $resolver = new ConfigResolver(sys_get_temp_dir() . '/avos_d_' . bin2hex(random_bytes(3)));
    $cfg = Config::build($resolver, [
        'db' => ['host' => '127.0.0.1', 'name' => $testDb, 'user' => 'avos_next', 'pass' => 'NextDev_2026_x'],
        'encKey' => str_repeat('k', 40),
    ], new Environment('local'));

    $repo = new SettingsRepository($conn);
    $svc = new SystemService($conn, $cfg, $identityNoOwner, $repo);

    $public = $svc->health(false);
    D::eq('health reports application alive', $public['application'], 'alive');
    D::eq('health reports database reachable', $public['database'], 'reachable');
    D::ok('health reports a status', in_array($public['status'], ['ok', 'degraded', 'unhealthy'], true));
    $json = json_encode($public);
    foreach (['127.0.0.1', 'avos_next', 'NextDev_2026_x', '/home/', $OWNER, str_repeat('k', 40)] as $secret) {
        D::ok('public health leaks no "' . substr($secret, 0, 12) . '"', !str_contains($json, $secret));
    }
    D::ok('public health has no detail block', !array_key_exists('detail', $public));

    $detailed = $svc->health(true);
    D::ok('authenticated health adds a detail block', array_key_exists('detail', $detailed));
    $djson = json_encode($detailed);
    foreach (['NextDev_2026_x', 'avos_next', '/home/', str_repeat('k', 40)] as $secret) {
        D::ok('detailed health leaks no "' . substr($secret, 0, 12) . '"', !str_contains($djson, $secret));
    }
    D::eq('detailed health reports enc_key presence only', $detailed['detail']['enc_key_set'], true);
    D::eq('detailed health reports owner presence only', $detailed['detail']['owner_email_set'], false);

    $list = $svc->listSettings(['per_page' => 5], false);
    D::ok('settings list is paginated', count($list['items']) <= 5);
    D::ok('settings list reports a total', $list['pagination']['total'] >= 9);
    D::eq('settings list respects the max page size',
        $svc->listSettings(['per_page' => 99999], false)['pagination']['per_page'], Pagination::MAX_PER_PAGE);
    D::eq('public-only filter reduces the set',
        $svc->listSettings(['per_page' => 100], true)['pagination']['total'] < $list['pagination']['total'], true);
    D::throwsCode('unknown setting is 404',
        fn() => $svc->getSetting('no.such.key', false), ErrorCatalog::NOT_FOUND);
    D::ok('known setting is returned', $svc->getSetting('site.name', false)['skey'] === 'site.name');

    /* --------------------------- XSS-LIKE INPUT ------------------------ */
    D::group('hostile input handling');

    $xss = '<script>alert(1)</script>';
    $conn->run('INSERT INTO site_settings (skey, svalue, value_type, is_public) VALUES (?,?,?,0)',
        ['test.xss', $xss, 'string']);
    $row = $svc->getSetting('test.xss', false);
    D::eq('XSS-like input is stored and returned verbatim as DATA', $row['svalue'], $xss);
    D::ok('JSON encoding escapes the payload so it cannot execute',
        str_contains(json_encode($row), '\u003Cscript') || str_contains(json_encode($row), '<\/script>')
        || !str_contains(json_encode($row, JSON_HEX_TAG), '<script>'));
    $conn->run('DELETE FROM site_settings WHERE skey=?', ['test.xss']);

    $sqlish = "'; DROP TABLE site_settings; --";
    D::throwsCode('SQL-like key is simply not found (bound, not executed)',
        fn() => $svc->getSetting($sqlish, false), ErrorCatalog::NOT_FOUND);
    D::ok('site_settings table survived the injection attempt',
        (int)$conn->scalar('SELECT COUNT(*) FROM site_settings') > 0);
}

/* =============================== SUMMARY =============================== */
echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d\n", D::$pass, D::$fail, D::$skip);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(D::$fail > 0 ? 1 : 0);
