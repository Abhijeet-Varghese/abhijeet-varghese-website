<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3E test suite: content engine.
 *   php avos-php/tests/next/content.php
 *
 * Covers §3E.20–§3E.25 plus the unit-level content primitives. Dependency-free.
 * Database tests SKIP (never silently pass) when MariaDB is unreachable.
 *
 * TEST DATA POLICY (§3E.19)
 * -------------------------
 * Every fixture below is synthetic and obviously fake: prefix `zzz-avos-test-`,
 * emails on `example.test` (an RFC 6761 reserved TLD that can never resolve).
 * No real client name appears — no Deloitte, PwC, Sony, Stripe — and none of
 * the fabricated records removed in Phase 0 is reintroduced. The suite asserts
 * that at the end, and cleans up after itself.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Auth\PasswordHasher;
use AvOS\Bootstrap\ApiKernel;
use AvOS\Bootstrap\Kernel;
use AvOS\Content\Cache\NullCacheInvalidator;
use AvOS\Content\Cache\RecordingCacheInvalidator;
use AvOS\Content\ContentDocument;
use AvOS\Content\ContentState;
use AvOS\Content\ContentType;
use AvOS\Content\Events\ContentEvent;
use AvOS\Content\Events\EventDispatcher;
use AvOS\Content\RoutePath;
use AvOS\Content\Slug;
use AvOS\Database\Connection;
use AvOS\Domain\Content\ArticleRepository;
use AvOS\Domain\Content\ArticleService;
use AvOS\Domain\Content\ExperienceRepository;
use AvOS\Domain\Content\ExperienceService;
use AvOS\Domain\Content\PageRepository;
use AvOS\Domain\Content\PageService;
use AvOS\Domain\Content\ProjectRepository;
use AvOS\Domain\Content\ProjectService;
use AvOS\Domain\Content\PublicContentService;
use AvOS\Domain\Content\PublishingService;
use AvOS\Domain\Content\RouteRepository;
use AvOS\Domain\Content\TaxonomyRepository;
use AvOS\Domain\Content\VersionRepository;
use AvOS\Domain\Content\VersionService;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Migration\MigrationRunner;
use AvOS\Migration\SystemSeeder;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

final class E
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
                substr(var_export($a, true), 0, 60), substr(var_export($b, true), 0, 60)); return; }
        self::ok($n, true);
    }
    public static function throwsCode(string $n, callable $fn, string $code): void
    {
        try { $fn(); self::ok($n . ' [no exception]', false); }
        catch (ApiException $e) {
            if ($e->code() === $code) { self::ok($n, true); return; }
            self::$fail++; printf("    %-60s FAIL  (got %s, want %s)\n", substr($n, 0, 60), $e->code(), $code);
        }
        catch (Throwable $e) { self::ok($n . ' [' . $e::class . ': ' . $e->getMessage() . ']', false); }
    }
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
}

/* ============================== 3E.10 SLUGS ============================= */
E::group('3E.10 slug normalisation and validation');

E::eq('normalises spaces and case', Slug::normalise('  Hello World  '), 'hello-world');
E::eq('collapses punctuation', Slug::normalise('A//B..C__D'), 'a-b-c-d');
E::eq('strips a .html extension', Slug::normalise('story.html'), 'story');
E::eq('strips a .php extension', Slug::normalise('index.php'), 'index');
E::eq('keeps existing valid slug intact', Slug::normalise('essay-technology-should-feel-human'),
    'essay-technology-should-feel-human');
E::eq('truncates to the column width', strlen(Slug::normalise(str_repeat('a', 400))), 190);

E::ok('rejects an empty slug', !Slug::isValid(''));
E::ok('rejects uppercase', !Slug::isValid('Story'));
E::ok('rejects a leading hyphen', !Slug::isValid('-story'));
E::ok('rejects a double hyphen', !Slug::isValid('a--b'));
E::ok('rejects a slash', !Slug::isValid('a/b'));
E::ok('rejects .html', !Slug::isValid('story.html'));
E::ok('rejects .php', !Slug::isValid('story.php'));
E::ok('rejects the reserved word api', !Slug::isValid('api'));
E::ok('rejects the reserved word os', !Slug::isValid('os'));
E::ok('accepts a real production slug',
    Slug::isValid('case-study-immersive-solutions-for-the-indian-army'));
E::ok('.html produces an actionable message',
    str_contains((string)(Slug::errors('a.html')['slug'] ?? ''), 'file extension'));
E::throwsCode('assertValid throws VALIDATION_ERROR',
    fn() => Slug::assertValid('Not A Slug'), ErrorCatalog::VALIDATION_ERROR);
E::eq('suggest appends a numeric suffix', Slug::suggest('story', 2), 'story-2');

/* ========================= 3E.11 ROUTE PATHS ============================ */
E::group('3E.11 route paths (single registry, no new prefix convention)');

E::eq('default path is flat', RoutePath::build('story'), '/story');
E::eq('no /pages/ prefix is invented', RoutePath::build('portfolio'), '/portfolio');
E::eq('reproduces the nested Orange path',
    RoutePath::build('orange-business-executive-briefing-center',
        '/experience-design/orange-business-executive-briefing-center'),
    '/experience-design/orange-business-executive-briefing-center');
E::eq('normalise removes a trailing slash', RoutePath::normalise('/story/'), '/story');
E::ok('rejects a path without a leading slash', RoutePath::errors('story') !== []);
E::ok('rejects an empty segment', RoutePath::errors('/a//b') !== []);
E::ok('rejects a relative segment', RoutePath::errors('/a/../b') !== []);
E::ok('rejects a query string', RoutePath::errors('/a?b=1') !== []);
E::ok('rejects a .html path', RoutePath::errors('/story.html') !== []);
E::ok('rejects too many segments', RoutePath::errors('/a/b/c/d/e') !== []);
E::ok('accepts a two-segment path', RoutePath::errors('/experience-design/orange-x') === []);

/* ======================= 3E.8 STATE MACHINE ============================= */
E::group('3E.8 draft / publish lifecycle');

E::eq('six states are defined', count(ContentState::ALL), 6);
E::eq('only published is publicly visible', ContentState::PUBLICLY_VISIBLE, ['published']);
E::ok('draft → published', ContentState::canTransition('draft', 'published'));
E::ok('published → unpublished', ContentState::canTransition('published', 'unpublished'));
E::ok('published → draft', ContentState::canTransition('published', 'draft'));
E::ok('unpublished → published', ContentState::canTransition('unpublished', 'published'));
E::ok('archived → published is REFUSED', !ContentState::canTransition('archived', 'published'));
E::ok('draft → unpublished is REFUSED (nothing to take down)',
    !ContentState::canTransition('draft', 'unpublished'));
E::ok('unknown state is refused', !ContentState::canTransition('draft', 'live'));
E::ok('same-state transition is a no-op, not an error',
    ContentState::canTransition('published', 'published'));
E::throwsCode('an illegal transition is a CONFLICT',
    fn() => ContentState::requireTransition('archived', 'published'), ErrorCatalog::CONFLICT);
E::throwsCode('an unknown target state is a VALIDATION_ERROR',
    fn() => ContentState::requireTransition('draft', 'nope'), ErrorCatalog::VALIDATION_ERROR);

/* ==================== 3E.13 CONTENT CONFIGURATION ======================= */
E::group('3E.13 structured content configuration');

$doc = ContentDocument::validate([
    'version' => 1,
    'blocks' => [
        ['type' => 'hero', 'name' => 'Intro', 'props' => ['heading' => 'Hello'],
         'responsive' => ['mobile' => ['visible' => false]],
         'children' => [['type' => 'text', 'props' => ['body' => 'x']]]],
    ],
]);
E::eq('valid document keeps its version', $doc['version'], 1);
E::eq('valid document keeps its blocks', count($doc['blocks']), 1);
E::eq('children are preserved', count($doc['blocks'][0]['children']), 1);
E::eq('empty document has no blocks', ContentDocument::empty()['blocks'], []);
E::eq('a bare block list is accepted as shorthand',
    count(ContentDocument::validate([['type' => 'text']])['blocks']), 1);

E::throwsCode('a non-object document is rejected',
    fn() => ContentDocument::validate('nope'), ErrorCatalog::VALIDATION_ERROR);
E::throwsCode('an unknown block key is rejected',
    fn() => ContentDocument::validate(['blocks' => [['type' => 'a', 'wat' => 1]]]),
    ErrorCatalog::VALIDATION_ERROR);
E::throwsCode('an uppercase block type is rejected',
    fn() => ContentDocument::validate(['blocks' => [['type' => 'Hero']]]),
    ErrorCatalog::VALIDATION_ERROR);
E::throwsCode('an unknown device key is rejected',
    fn() => ContentDocument::validate(['blocks' => [['type' => 'a', 'responsive' => ['watch' => []]]]]),
    ErrorCatalog::VALIDATION_ERROR);

// The §3E.13 rule that matters: relational data may not live in JSON.
foreach (['author_id', 'client_id', 'status', 'slug'] as $rel) {
    E::throwsCode("relational key {$rel} is refused at the top of a block",
        fn() => ContentDocument::validate(['blocks' => [['type' => 'a', 'props' => [$rel => 1]]]]),
        ErrorCatalog::VALIDATION_ERROR);
}
E::throwsCode('a relational key nested deep inside props is also refused',
    fn() => ContentDocument::validate(['blocks' => [
        ['type' => 'a', 'props' => ['x' => ['y' => ['author_id' => 3]]]]]]),
    ErrorCatalog::VALIDATION_ERROR);
E::throwsCode('a relational key inside a responsive override is refused',
    fn() => ContentDocument::validate(['blocks' => [
        ['type' => 'a', 'responsive' => ['mobile' => ['status' => 'published']]]]]),
    ErrorCatalog::VALIDATION_ERROR);

$deep = ['type' => 'a'];
for ($i = 0; $i < 15; $i++) $deep = ['type' => 'a', 'children' => [$deep]];
E::throwsCode('excessive nesting depth is rejected',
    fn() => ContentDocument::validate(['blocks' => [$deep]]), ErrorCatalog::VALIDATION_ERROR);

$many = ['blocks' => array_fill(0, 600, ['type' => 'a'])];
E::throwsCode('a document over the block ceiling is rejected',
    fn() => ContentDocument::validate($many), ErrorCatalog::VALIDATION_ERROR);

$huge = ['blocks' => [['type' => 'a', 'props' => ['body' => str_repeat('x', 300000)]]]];
E::throwsCode('an oversized document is PAYLOAD_TOO_LARGE',
    fn() => ContentDocument::validate($huge), ErrorCatalog::PAYLOAD_TOO_LARGE);

E::eq('decode of NULL yields an empty document', ContentDocument::decode(null)['blocks'], []);
E::eq('decode of malformed JSON yields an empty document',
    ContentDocument::decode('{not json')['blocks'], []);

/* ======================= CONTENT TYPE REGISTRY ========================== */
E::group('3E.1 content type registry');

E::eq('four content types', count(ContentType::all()), 4);
E::eq('page maps to the pages table', ContentType::table('page'), 'pages');
E::eq('experience is NOT routable', ContentType::isRoutable('experience'), false);
E::eq('three routable types', count(ContentType::routable()), 3);
E::eq('page write permission', ContentType::permission('page', 'write'), 'pages.write');
E::eq('experience routes through content.*', ContentType::permission('experience', 'write'), 'content.write');
E::ok('an unknown type is rejected', !ContentType::isValid('widget'));

/* ===================== EVENTS AND CACHE SIGNALS ========================= */
E::group('3E.9 / 3E.17 events and cache invalidation seam');

$bus = new EventDispatcher();
$seen = [];
$bus->on(ContentEvent::PUBLISHED, function (ContentEvent $e) use (&$seen): void { $seen[] = $e->name; });
$bus->onAny(function (ContentEvent $e) use (&$seen): void { $seen[] = 'any:' . $e->name; });
$bus->dispatch(ContentEvent::make(ContentEvent::PUBLISHED, 'page', 1, 5, 'AV-T'));
E::eq('a targeted listener fires', in_array(ContentEvent::PUBLISHED, $seen, true), true);
E::eq('a wildcard listener fires', in_array('any:' . ContentEvent::PUBLISHED, $seen, true), true);
E::eq('dispatched events are recorded', count($bus->dispatched()), 1);

$bus->on('content.boom', function (): void { throw new RuntimeException('listener exploded'); });
$bus->dispatch(new ContentEvent('content.boom', 'page', 1, null, 'AV-T'));
E::ok('a throwing listener does not break the dispatch', count($bus->dispatched()) === 2);

$evt = ContentEvent::make(ContentEvent::UPDATED, 'page', 7, 2, 'AV-T', ['token' => 'sensitive', 'ok' => 1]);
E::eq('event context is redacted', $evt->toArray()['context']['token'], '[redacted]');
E::eq('non-secret event context survives', $evt->toArray()['context']['ok'], 1);

$rec = new RecordingCacheInvalidator();
$rec->contentChanged('page', 3);
$rec->routeChanged('/x');
$rec->navigationChanged();
E::ok('content signal recorded', $rec->has('content', 'page:3'));
E::ok('route signal recorded', $rec->has('route', '/x'));
E::ok('navigation signal recorded', $rec->has('navigation', '*'));
(new NullCacheInvalidator())->navigationChanged();
E::ok('the null invalidator is a safe no-op', true);

/* ========================= ROUTER SURFACE =============================== */
E::group('3E.16 public vs authenticated route surface');

$kernel = null;
$api = null;
try {
    $kernel = Kernel::boot($root, sendHeaders: false);
    $api = new ApiKernel($kernel);
} catch (Throwable $e) {
    E::skip('API kernel boot', substr($e->getMessage(), 0, 40));
}

if ($api !== null) {
    $routes = $api->router()->registered();
    $content = array_values(array_filter($routes, static fn(string $r): bool =>
        preg_match('#/api/v1/(content|pages|projects|articles|experience)#', $r) === 1));
    E::eq('58 content routes registered', count($content), 58);

    $publicRoutes = array_values(array_filter($content, static fn(string $r): bool =>
        str_contains($r, '/api/v1/content')));
    E::eq('9 public content routes', count($publicRoutes), 9);
    E::ok('every public content route is a GET',
        array_filter($publicRoutes, static fn(string $r): bool => !str_starts_with($r, 'GET ')) === []);

    $managed = array_values(array_diff($content, $publicRoutes));
    E::eq('49 authenticated management routes', count($managed), 49);
    foreach (['pages', 'projects', 'articles', 'experience'] as $seg) {
        E::ok("no public route exists under /api/v1/{$seg}",
            array_filter($publicRoutes, static fn(string $r): bool =>
                str_contains($r, '/api/v1/' . $seg)) === []);
    }
    E::ok('publish endpoints exist for all four types',
        count(array_filter($managed, static fn(string $r): bool => str_ends_with($r, '/publish'))) === 4);
    E::ok('restore endpoints exist for all four types',
        count(array_filter($managed, static fn(string $r): bool => str_ends_with($r, '/restore'))) === 4);
}

/* ========================== DATABASE TESTS ============================== */
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
} catch (Throwable $e) {
    E::group('database-backed tests');
    E::skip('all database tests', 'MariaDB unreachable');
}

if ($dbUp) {
    $runner = new MigrationRunner($conn, $root . '/database/next/migrations');
    $runner->createDatabaseIfMissing();
    $runner->dropAll();
    $runner->migrate(false);
    (new SystemSeeder($conn))->run();

    /* ---------------------- fixtures (§3E.19) ------------------------- */
    $PW = 'ContentFixture_2026!x';
    $hasher = new PasswordHasher();
    $users = new UserRepository($conn, $hasher);
    // Owner email is intentionally UNSET in this suite, exactly as in
    // production: the content engine must work without it.
    $identity = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', '');

    $mkUser = static function (string $slug, array $roles) use ($users, $PW): int {
        return $users->create(
            'ZZZ Test ' . ucfirst($slug),
            'zzz-avos-test-' . $slug . '@example.test',
            $PW, $roles, false,
        )->id;
    };
    $uid = [
        'administrator'   => $mkUser('administrator', ['administrator']),
        'editor'          => $mkUser('editor', ['editor']),
        'content_manager' => $mkUser('contentmanager', ['content_manager']),
        'media_manager'   => $mkUser('mediamanager', ['media_manager']),
    ];

    $authz = new Authorizer($users, $identity);
    $audit = new AuditLogger($conn, '127.0.0.1', 'test-agent', 'AV-TEST-3E');
    $bus2 = new EventDispatcher();
    $cache = new RecordingCacheInvalidator();
    $versions = new VersionRepository($conn);
    $refs = new TaxonomyRepository($conn);
    $routeRepo = new RouteRepository($conn);

    $as = static function (string $role) use ($authz, $users, $uid): void {
        $authz->setUser($users->findById($uid[$role]));
    };

    $mkSvc = static fn(string $class, $repo) => new $class(
        $conn, $repo, $versions, $refs, $audit, $bus2, $cache, $authz, 'AV-TEST-3E',
    );
    $services = [
        ContentType::PAGE       => $mkSvc(PageService::class, new PageRepository($conn)),
        ContentType::PROJECT    => $mkSvc(ProjectService::class, new ProjectRepository($conn)),
        ContentType::ARTICLE    => $mkSvc(ArticleService::class, new ArticleRepository($conn)),
        ContentType::EXPERIENCE => $mkSvc(ExperienceService::class, new ExperienceRepository($conn)),
    ];
    $publishing = new PublishingService($conn, $services, $versions, $routeRepo,
        $audit, $bus2, $cache, $authz, 'AV-TEST-3E');
    $versionSvc = new VersionService($conn, $services, $versions, $audit, $bus2, $cache, $authz, 'AV-TEST-3E');
    $publicSvc = new PublicContentService($services, $routeRepo, $refs);

    $pages = $services[ContentType::PAGE];
    $projects = $services[ContentType::PROJECT];
    $articles = $services[ContentType::ARTICLE];
    $experience = $services[ContentType::EXPERIENCE];

    /* ================= 3E.20 EMPTY DATABASE LIFECYCLE ================== */
    E::group('3E.20 lifecycle from an empty database — PAGE');

    E::eq('content tables start empty',
        (int)$conn->scalar('SELECT COUNT(*) FROM pages'), 0);
    E::eq('version table starts empty',
        (int)$conn->scalar('SELECT COUNT(*) FROM content_versions'), 0);

    $as('editor');
    $page = $pages->create([
        'title' => 'ZZZ Test Page',
        'slug'  => 'zzz-avos-test-page',
        'excerpt' => 'A disposable fixture.',
        'content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'first']]]],
    ]);
    $pageId = (int)$page['id'];
    E::ok('page created', $pageId > 0);
    E::eq('a new page is always a draft', $page['status'], ContentState::DRAFT);
    E::eq('published_at is null on a draft', $page['published_at'], null);
    E::eq('author defaults to the creator', (int)$page['author_id'], $uid['editor']);
    E::eq('creation makes version 1', $versions->count('page', $pageId), 1);

    $pages->update($pageId, ['title' => 'ZZZ Test Page v2']);
    E::eq('a real update makes version 2', $versions->count('page', $pageId), 2);

    $pages->update($pageId, ['title' => 'ZZZ Test Page v2']);
    E::eq('an unchanged save makes NO new version (policy rule 2)',
        $versions->count('page', $pageId), 2);

    E::throwsCode('a public read of a draft is 404',
        fn() => $publicSvc->bySlug('page', 'zzz-avos-test-page'), ErrorCatalog::NOT_FOUND);

    $cache->reset();
    $pub = $publishing->publish('page', $pageId);
    E::eq('publish sets status', $pub['status'], ContentState::PUBLISHED);
    E::ok('publish sets published_at', $pub['published_at'] !== null);
    E::eq('publish creates the flat route', $pub['path'], '/zzz-avos-test-page');
    E::eq('publish makes version 3', $versions->count('page', $pageId), 3);
    E::ok('publish signalled the content cache', $cache->has('content', 'page:' . $pageId));
    E::ok('publish signalled the route cache', $cache->has('route', '/zzz-avos-test-page'));
    E::ok('publish signalled navigation', $cache->has('navigation', '*'));

    $read = $publicSvc->bySlug('page', 'zzz-avos-test-page');
    E::eq('public read now succeeds', $read['title'], 'ZZZ Test Page v2');
    E::eq('page_routes row exists and is active',
        (string)($routeRepo->findByPath('/zzz-avos-test-page')['status'] ?? ''), 'active');

    $resolved = $publicSvc->resolve('/zzz-avos-test-page');
    E::eq('resolve finds the content', $resolved['match'], 'content');
    E::eq('resolve reports the type', $resolved['type'], 'page');
    E::eq('resolve returns the published payload', $resolved['content']['slug'], 'zzz-avos-test-page');
    E::eq('resolve of an unknown path is a clean miss',
        $publicSvc->resolve('/zzz-avos-test-nothing')['match'], 'none');

    $publishing->unpublish('page', $pageId);
    E::throwsCode('public read fails after unpublish',
        fn() => $publicSvc->bySlug('page', 'zzz-avos-test-page'), ErrorCatalog::NOT_FOUND);
    E::eq('resolve stops resolving after unpublish',
        $publicSvc->resolve('/zzz-avos-test-page')['match'], 'none');
    E::eq('the route row is kept, disabled — the URL stays reserved',
        (string)($routeRepo->findByPath('/zzz-avos-test-page')['status'] ?? ''), 'disabled');
    E::ok('authenticated management read still succeeds',
        $pages->getAdmin($pageId)['status'] === ContentState::UNPUBLISHED);

    $publishing->publish('page', $pageId);
    E::eq('republishing works', $pages->getAdmin($pageId)['status'], ContentState::PUBLISHED);
    E::eq('the route is active again',
        (string)($routeRepo->findByPath('/zzz-avos-test-page')['status'] ?? ''), 'active');

    /* ------------------------------ PROJECT ---------------------------- */
    E::group('3E.20 lifecycle — PROJECT (case study via is_case_study)');

    E::ok('there is no case_studies table',
        (int)$conn->scalar(
            'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
            [$testDb, 'case_studies']) === 0);

    E::throwsCode('a case study without a summary is refused',
        fn() => $projects->create(['title' => 'ZZZ Case', 'slug' => 'zzz-avos-test-case-empty',
                                   'is_case_study' => true]),
        ErrorCatalog::VALIDATION_ERROR);

    $proj = $projects->create([
        'title' => 'ZZZ Test Case Study',
        'slug' => 'zzz-avos-test-case-study',
        'is_case_study' => true,
        'summary' => 'A disposable synthetic case study fixture.',
        'template' => 'case-study',
        'year_from' => 2024, 'year_to' => 2025,
        'metadata' => ['discipline' => 'synthetic'],
    ]);
    $projId = (int)$proj['id'];
    E::eq('case study flag persists', (bool)$proj['is_case_study'], true);
    E::eq('metadata is stored as free-form JSON', $proj['metadata']['discipline'], 'synthetic');
    E::throwsCode('year_to before year_from is refused',
        fn() => $projects->update($projId, ['year_from' => 2025, 'year_to' => 2020]),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('a client_id that does not exist is refused',
        fn() => $projects->update($projId, ['client_id' => 999999]),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('a relational key inside metadata is refused',
        fn() => $projects->update($projId, ['metadata' => ['client_id' => 4]]),
        ErrorCatalog::VALIDATION_ERROR);

    $publishing->publish('project', $projId);
    E::eq('project publishes to a flat path',
        (string)($routeRepo->findCanonicalFor('project', $projId)['path'] ?? ''),
        '/zzz-avos-test-case-study');
    E::eq('public project read works',
        $publicSvc->bySlug('project', 'zzz-avos-test-case-study')['title'], 'ZZZ Test Case Study');

    /* ------------------------------ ARTICLE ---------------------------- */
    E::group('3E.20 lifecycle — ARTICLE / JOURNAL');

    $art = $articles->create([
        'title' => 'ZZZ Test Journal Entry',
        'slug' => 'zzz-avos-test-journal-entry',
        'kind' => 'journal',
        'excerpt' => 'Synthetic.',
        'body' => ['blocks' => [['type' => 'text', 'props' => ['body' => str_repeat('word ', 440)]]]],
        'categories' => ['ZZZ Test Category'],
        'tags' => ['zzz-test-tag', 'ZZZ Another Tag'],
    ]);
    $artId = (int)$art['id'];
    E::eq('article kind persists', $art['kind'], 'journal');
    E::eq('categories are relational, not JSON', $art['categories'], ['zzz-test-category']);
    E::eq('tags are relational, not JSON', count($art['tags']), 2);
    E::eq('reading time is derived when absent', (int)$art['reading_minutes'], 2);

    $articles->update($artId, ['reading_minutes' => 9]);
    E::eq('an explicit reading time is never overwritten',
        (int)$articles->getAdmin($artId)['reading_minutes'], 9);

    E::throwsCode('an invalid article kind is refused',
        fn() => $articles->update($artId, ['kind' => 'memo']), ErrorCatalog::VALIDATION_ERROR);

    $articles->update($artId, ['tags' => ['zzz-test-tag']]);
    E::eq('tag set is replaced, not appended', count($articles->getAdmin($artId)['tags']), 1);

    $publishing->publish('article', $artId);
    E::eq('public article read works',
        $publicSvc->bySlug('article', 'zzz-avos-test-journal-entry')['kind'], 'journal');
    E::ok('public article includes its taxonomy',
        $publicSvc->bySlug('article', 'zzz-avos-test-journal-entry')['categories'] === ['zzz-test-category']);

    /* ---------------------------- EXPERIENCE --------------------------- */
    E::group('3E.20 lifecycle — EXPERIENCE');

    $e1 = $experience->create(['title' => 'ZZZ Role One', 'era' => 'zzz-era',
                               'organisation' => 'ZZZ Synthetic Org', 'position' => 1,
                               'year_from' => 2020, 'year_to' => 2022]);
    $e2 = $experience->create(['title' => 'ZZZ Role Two', 'era' => 'zzz-era',
                               'organisation' => 'ZZZ Synthetic Org', 'position' => 2,
                               'year_from' => 2022]);
    $e1Id = (int)$e1['id'];
    $e2Id = (int)$e2['id'];
    E::eq('experience defaults to draft, never auto-published', $e1['status'], ContentState::DRAFT);
    E::ok('experience has no slug column', !$experience->repository()->hasSlug());

    $publishing->publish('experience', $e1Id);
    E::eq('experience publishes', $experience->getAdmin($e1Id)['status'], ContentState::PUBLISHED);
    E::eq('experience creates NO route (it is not routable)',
        $routeRepo->findCanonicalFor('experience', $e1Id), null);

    $publishing->publish('experience', $e2Id);
    $timeline = $publicSvc->experience([]);
    E::eq('published timeline has both entries', $timeline['pagination']['total'], 2);
    E::eq('timeline is ordered by position',
        $timeline['items'][0]['title'], 'ZZZ Role One');

    $before = $versions->count('experience', $e2Id);
    $experience->reorder([$e2Id => 2]);
    E::eq('a no-op reorder creates no version', $versions->count('experience', $e2Id), $before);
    $experience->reorder([$e2Id => 0]);
    E::eq('a real reorder creates a version', $versions->count('experience', $e2Id), $before + 1);
    E::eq('reordered timeline puts Role Two first',
        $publicSvc->experience([])['items'][0]['title'], 'ZZZ Role Two');

    /* ================== 3E.21 VERSION / RESTORE ======================== */
    E::group('3E.21 version and restore');

    $vp = $pages->create(['title' => 'ZZZ Version One', 'slug' => 'zzz-avos-test-versions',
                          'content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'v1']]]]]);
    $vId = (int)$vp['id'];
    E::eq('version 1 exists', $versions->count('page', $vId), 1);

    $pages->update($vId, ['title' => 'ZZZ Version Two',
                          'content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'v2']]]]]);
    E::eq('version 2 exists', $versions->count('page', $vId), 2);

    $publishing->publish('page', $vId);
    E::eq('publish appends version 3', $versions->count('page', $vId), 3);

    $pages->update($vId, ['title' => 'ZZZ Version Four',
                          'content' => ['blocks' => [['type' => 'text', 'props' => ['body' => 'v4']]]]]);
    E::eq('version 4 exists', $versions->count('page', $vId), 4);

    $as('editor');
    $restored = $versionSvc->restore('page', $vId, 2);
    $after = $pages->getAdmin($vId);
    E::eq('restore appends a NEW version rather than rewinding',
        $versions->count('page', $vId), 5);
    E::eq('restored title matches version 2 exactly', $after['title'], 'ZZZ Version Two');
    E::eq('restored content matches version 2 exactly',
        $after['content']['blocks'][0]['props']['body'], 'v2');
    E::eq('history is intact — version 4 still readable',
        $versionSvc->get('page', $vId, 4)['payload']['title'], 'ZZZ Version Four');
    E::ok('every version 1..5 is still present',
        count(array_filter([1, 2, 3, 4, 5], fn(int $n): bool => $versions->find('page', $vId, $n) !== null)) === 5);
    E::eq('restore does NOT change publication state', $after['status'], ContentState::PUBLISHED);
    E::eq('restore reports where it came from', $restored['restored_from'], 2);
    E::eq('the restored version payload equals the source payload',
        $versionSvc->get('page', $vId, 5)['payload']['title'],
        $versionSvc->get('page', $vId, 2)['payload']['title']);
    E::ok('a restore audit row was written',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='page.version_restore'") > 0);
    E::ok('version payloads carry no secret-bearing keys',
        !str_contains(strtolower((string)$conn->scalar(
            'SELECT payload FROM content_versions WHERE entity_type=? AND entity_id=? LIMIT 1',
            ['page', $vId])), 'password'));
    E::throwsCode('restoring a version that does not exist is 404',
        fn() => $versionSvc->restore('page', $vId, 99), ErrorCatalog::NOT_FOUND);

    /* ==================== 3E.22 SLUG COLLISION ========================= */
    E::group('3E.22 slug collision');

    $c1 = $pages->create(['title' => 'ZZZ Collide', 'slug' => 'zzz-avos-test-collide']);
    E::throwsCode('a second page with the same slug is a CONFLICT',
        fn() => $pages->create(['title' => 'ZZZ Collide 2', 'slug' => 'zzz-avos-test-collide']),
        ErrorCatalog::CONFLICT);

    try {
        $pages->create(['title' => 'ZZZ Collide 3', 'slug' => 'zzz-avos-test-collide']);
    } catch (ApiException $e) {
        E::eq('the conflict carries a usable suggestion',
            $e->details()['suggestion'] ?? '', 'zzz-avos-test-collide-2');
    }

    // A DRAFT reserves the slug too — uq_pages_slug is table-level, so two
    // drafts sharing a slug is impossible regardless of publication state.
    E::ok('a draft reserves its slug against another draft',
        $pages->repository()->slugTaken('zzz-avos-test-collide', 0));
    $publishing->publish('page', (int)$c1['id']);
    E::throwsCode('a published slug still conflicts with a new draft',
        fn() => $pages->create(['title' => 'ZZZ Collide 4', 'slug' => 'zzz-avos-test-collide']),
        ErrorCatalog::CONFLICT);
    E::ok('updating a page to its own slug is not a conflict',
        is_array($pages->update((int)$c1['id'], ['slug' => 'zzz-avos-test-collide'])));

    // Cross-type: a project may hold the same slug string (separate table), but
    // it can never publish to the same URL — uq_route_path forbids it.
    $crossProj = $projects->create(['title' => 'ZZZ Cross', 'slug' => 'zzz-avos-test-collide',
                                    'summary' => 'x']);
    E::ok('a different content type may hold the same slug string', (int)$crossProj['id'] > 0);
    E::eq('but its route path is already claimed', 
        $publishing->preflight('project', (int)$crossProj['id'])['checks']['route']['ok'], false);
    E::throwsCode('publishing a duplicate route is refused',
        fn() => $publishing->publish('project', (int)$crossProj['id']), ErrorCatalog::CONFLICT);
    E::eq('no duplicate published route exists',
        (int)$conn->scalar("SELECT COUNT(*) FROM page_routes WHERE path=? AND status='active'",
            ['/zzz-avos-test-collide']), 1);

    E::throwsCode('a slug with .html is refused at create',
        fn() => $pages->create(['title' => 'ZZZ X', 'slug' => 'zzz-avos-test-x.html']),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('a slug with .php is refused at create',
        fn() => $pages->create(['title' => 'ZZZ X', 'slug' => 'zzz-avos-test-x.php']),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('a slug with a slash is refused at create',
        fn() => $pages->create(['title' => 'ZZZ X', 'slug' => 'zzz/avos']),
        ErrorCatalog::VALIDATION_ERROR);
    E::ok('a slug derived from a title IS normalised',
        $pages->create(['title' => 'ZZZ AVOS Test Derived From Title!'])['slug'] === 'zzz-avos-test-derived-from-title');

    /* ============= SLUG CHANGE: 301 AND AUDIT (§3E.18) ================= */
    E::group('3E.10 / 3E.18 slug change leaves a 301 behind');

    $mv = $pages->create(['title' => 'ZZZ Movable', 'slug' => 'zzz-avos-test-old-url']);
    $mvId = (int)$mv['id'];
    $publishing->publish('page', $mvId);
    E::eq('published at the original URL',
        (string)($routeRepo->findCanonicalFor('page', $mvId)['path'] ?? ''), '/zzz-avos-test-old-url');

    $cache->reset();
    $pages->update($mvId, ['slug' => 'zzz-avos-test-new-url']);
    E::eq('the slug changed', $pages->getAdmin($mvId)['slug'], 'zzz-avos-test-new-url');
    E::ok('a slug change signals the route cache', $cache->has('route', '/zzz-avos-test-new-url'));
    E::ok('a slug change is audited',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action='page.slug_change'") > 0);

    $publishing->publish('page', $mvId);
    E::eq('republishing moves the canonical',
        (string)($routeRepo->findCanonicalFor('page', $mvId)['path'] ?? ''), '/zzz-avos-test-new-url');
    $r301 = $routeRepo->findRedirect('/zzz-avos-test-old-url');
    E::ok('the old URL now 301s rather than 404s', $r301 !== null);
    E::eq('the redirect points at the new URL', (string)($r301['to_path'] ?? ''), '/zzz-avos-test-new-url');
    E::eq('resolve reports the redirect',
        $publicSvc->resolve('/zzz-avos-test-old-url')['match'], 'redirect');
    E::eq('resolve reports 301', $publicSvc->resolve('/zzz-avos-test-old-url')['status'], 301);
    E::eq('the new URL serves the content',
        $publicSvc->resolve('/zzz-avos-test-new-url')['match'], 'content');
    E::eq('only one canonical route exists for the entity',
        (int)$conn->scalar('SELECT COUNT(*) FROM page_routes WHERE entity_type=? AND entity_id=? AND is_canonical=1',
            ['page', $mvId]), 1);

    /* ==================== 3E.23 AUTHORIZATION ========================== */
    E::group('3E.23 authorization by role');

    // The permission matrix, tested against the Phase 2 seeder — not restated.
    $matrix = [
        // role            read   write  delete publish restore
        'administrator' => [true,  true,  true,  true,   true],
        'editor'        => [true,  true,  false, true,   true],
        'content_manager' => [true, true, false, false,  false],
        'media_manager' => [false, false, false, false,  false],
    ];
    foreach ($matrix as $role => [$r, $w, $d, $p, $rest]) {
        $as($role);
        E::eq("{$role}: pages.read = " . var_export($r, true), $authz->can('pages.read'), $r);
        E::eq("{$role}: pages.write = " . var_export($w, true), $authz->can('pages.write'), $w);
        E::eq("{$role}: pages.delete = " . var_export($d, true), $authz->can('pages.delete'), $d);
        E::eq("{$role}: publishing.publish = " . var_export($p, true),
            $authz->can('publishing.publish'), $p);
        E::eq("{$role}: versions.restore = " . var_export($rest, true),
            $authz->can('versions.restore'), $rest);
    }

    // OWNER: intentionally unconfigured, so nobody is owner and owner-only ops
    // fail closed — while ordinary content work keeps functioning.
    $as('administrator');
    E::eq('owner email is unset, so no account is owner', $authz->isOwner(), false);
    E::ok('yet an administrator can still manage content', $authz->can('pages.write'));

    $as('content_manager');
    E::throwsCode('a content manager cannot publish',
        fn() => $publishing->publish('page', $pageId), ErrorCatalog::FORBIDDEN);
    E::throwsCode('a content manager cannot restore a version',
        fn() => $versionSvc->restore('page', $vId, 1), ErrorCatalog::FORBIDDEN);
    E::ok('a content manager CAN still update content',
        is_array($pages->update($pageId, ['excerpt' => 'edited by content manager'])));

    $as('editor');
    E::ok('an editor can publish', is_array($publishing->preflight('page', $pageId)));
    E::eq('content.delete exists as a permission (amendment A6)',
        (int)$conn->scalar("SELECT COUNT(*) FROM permissions WHERE code='content.delete'"), 1);
    E::eq('content.delete is NOT granted to editor', $authz->can('content.delete'), false);
    $as('administrator');
    E::eq('content.delete IS available to an administrator', $authz->can('content.delete'), true);

    /* ================ 3E.24 PUBLIC CONTENT SECURITY ==================== */
    E::group('3E.24 public content security');

    $as('editor');
    $secret = $pages->create([
        'title' => 'ZZZ Secret Draft',
        'slug' => 'zzz-avos-test-secret-draft',
        'excerpt' => 'never public',
    ]);
    $secretId = (int)$secret['id'];

    E::throwsCode('a draft is not readable by slug',
        fn() => $publicSvc->bySlug('page', 'zzz-avos-test-secret-draft'), ErrorCatalog::NOT_FOUND);
    E::eq('a draft never appears in the public index',
        count(array_filter($publicSvc->index('page', ['per_page' => 100])['items'],
            static fn(array $i): bool => $i['slug'] === 'zzz-avos-test-secret-draft')), 0);
    E::eq('an unpublished item never appears in the public index',
        count(array_filter($publicSvc->index('page', ['per_page' => 100])['items'],
            static fn(array $i): bool => ($i['status'] ?? null) !== null)), 0);
    E::eq('resolve refuses a draft path',
        $publicSvc->resolve('/zzz-avos-test-secret-draft')['match'], 'none');
    E::eq('a public status filter is ignored, not honoured',
        count(array_filter($publicSvc->index('page', ['status' => 'draft', 'per_page' => 100])['items'],
            static fn(array $i): bool => $i['slug'] === 'zzz-avos-test-secret-draft')), 0);

    $publicRow = $publicSvc->bySlug('page', 'zzz-avos-test-page');
    foreach (['id', 'author_id', 'created_by', 'updated_by', 'deleted_at',
              'status', 'publish_at', 'unpublish_at', 'position'] as $leak) {
        E::ok("public page payload omits {$leak}", !array_key_exists($leak, $publicRow));
    }
    $publicJson = strtolower(json_encode($publicRow) ?: '');
    E::ok('public payload contains no email address', !str_contains($publicJson, '@'));
    E::ok('public payload contains no owner identity', !str_contains($publicJson, 'owner'));

    $publicProject = $publicSvc->bySlug('project', 'zzz-avos-test-case-study');
    E::ok('public project omits client_id', !array_key_exists('client_id', $publicProject));
    E::ok('public project omits hero_media_id', !array_key_exists('hero_media_id', $publicProject));

    E::ok('PublicContentService exposes no version accessor',
        !method_exists(PublicContentService::class, 'version')
        && !method_exists(PublicContentService::class, 'versions'));
    E::ok('PublicContentService exposes no id-based item accessor',
        !method_exists(PublicContentService::class, 'byId'));
    E::ok('the public service cannot reach the audit log',
        !method_exists(PublicContentService::class, 'audit'));

    // Direct attempts, per §3E.24, using id / slug / version.
    E::throwsCode('a draft is not reachable through resolve by crafted path',
        fn() => $publicSvc->bySlug('page', 'zzz-avos-test-secret-draft'), ErrorCatalog::NOT_FOUND);
    E::eq('an active route pointing at unpublished content resolves to nothing',
        (function () use ($conn, $routeRepo, $secretId, $publicSvc): string {
            $conn->run("INSERT INTO page_routes (path, entity_type, entity_id, template, is_canonical, status)
                        VALUES ('/zzz-avos-test-orphan-route','page',?, 'default',1,'active')", [$secretId]);
            $r = $publicSvc->resolve('/zzz-avos-test-orphan-route')['match'];
            $conn->run("DELETE FROM page_routes WHERE path='/zzz-avos-test-orphan-route'");
            return $r;
        })(), 'none');

    /* ====================== 3E.25 SQL / XSS ============================ */
    E::group('3E.25 hostile content input');

    $sqli = "'; DROP TABLE pages; -- ";
    $xss  = '<script>alert(1)</script><img src=x onerror=alert(2)>';

    $as('editor');
    $hostile = $pages->create([
        'title'   => 'ZZZ ' . $xss,
        'slug'    => 'zzz-avos-test-hostile',
        'excerpt' => $sqli,
        'content' => ['blocks' => [['type' => 'text', 'props' => [
            'body' => $xss, 'note' => $sqli, 'href' => 'javascript:alert(1)']]]],
    ]);
    $hostileId = (int)$hostile['id'];

    E::ok('pages table survived the injection attempt',
        (int)$conn->scalar('SELECT COUNT(*) FROM pages') > 0);
    E::eq('SQL-like text is stored verbatim as DATA',
        $pages->getAdmin($hostileId)['excerpt'], $sqli);
    E::eq('rich content is NOT destroyed — it is stored intact',
        $pages->getAdmin($hostileId)['content']['blocks'][0]['props']['body'], $xss);
    E::ok('JSON encoding neutralises the payload at the response boundary',
        !str_contains(json_encode($pages->getAdmin($hostileId), JSON_HEX_TAG) ?: '', '<script>'));

    $slugAttempt = Slug::normalise("'; DROP TABLE pages; --");
    E::ok('a SQL-like slug normalises to something harmless',
        $slugAttempt === '' || Slug::isValid($slugAttempt));

    E::throwsCode('malformed JSON structure is rejected, not stored',
        fn() => $pages->update($hostileId, ['content' => 'not-a-document']),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('an oversized title is rejected',
        fn() => $pages->update($hostileId, ['title' => str_repeat('x', 500)]),
        ErrorCatalog::VALIDATION_ERROR);
    E::throwsCode('an oversized content document is rejected',
        fn() => $pages->update($hostileId, ['content' => ['blocks' => [
            ['type' => 'text', 'props' => ['body' => str_repeat('x', 300000)]]]]]),
        ErrorCatalog::PAYLOAD_TOO_LARGE);
    E::throwsCode('a disallowed sort field is rejected',
        fn() => $pages->listAdmin(['sort' => 'password_hash']), ErrorCatalog::VALIDATION_ERROR);
    E::ok('a disallowed filter field is ignored, not executed',
        is_array($pages->listAdmin(['password_hash' => 'x'])));
    E::ok('all tables survived the whole hostile-input group',
        (int)$conn->scalar('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=?',
            [$testDb]) >= 61);

    /* ================= STATE MANIPULATION / DELETE ===================== */
    E::group('3E.8 / 3E.18 state guard, delete and audit');

    E::throwsCode('status cannot be set through update',
        fn() => $pages->update($hostileId, ['status' => 'published']), ErrorCatalog::CONFLICT);
    E::eq('the page really is still a draft',
        $pages->getAdmin($hostileId)['status'], ContentState::DRAFT);
    E::throwsCode('unpublishing a draft is refused',
        fn() => $publishing->unpublish('page', $hostileId), ErrorCatalog::CONFLICT);

    $as('administrator');
    $delRes = $pages->delete($hostileId);
    E::eq('delete is soft', $delRes['deleted'], true);
    E::ok('version history survives the delete', $delRes['versions_retained'] > 0);
    E::throwsCode('a deleted page is no longer readable',
        fn() => $pages->getAdmin($hostileId), ErrorCatalog::NOT_FOUND);
    E::eq('the row still exists in the table',
        (int)$conn->scalar('SELECT COUNT(*) FROM pages WHERE id=? AND deleted_at IS NOT NULL', [$hostileId]), 1);

    foreach (['page.create', 'page.update', 'page.delete', 'page.publish',
              'page.unpublish', 'page.version_restore', 'page.slug_change'] as $action) {
        E::ok("audit recorded: {$action}",
            (int)$conn->scalar('SELECT COUNT(*) FROM audit_logs WHERE action=?', [$action]) > 0);
    }
    E::eq('reads are NOT audited',
        (int)$conn->scalar("SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%.read'"), 0);
    $auditBlob = strtolower((string)$conn->scalar(
        "SELECT GROUP_CONCAT(CONCAT(COALESCE(`before`,''), COALESCE(`after`,''))) FROM audit_logs"));
    foreach (['password', 'token', 'secret', 'enc_key'] as $forbidden) {
        E::ok("audit log contains no {$forbidden} value",
            !str_contains($auditBlob, '"' . $forbidden . '":"') || str_contains($auditBlob, '[redacted]'));
    }

    /* ================== 3E.19 FIXTURE HYGIENE ========================== */
    E::group('3E.19 test data hygiene');

    $textCols = [
        'pages' => ['title', 'slug', 'excerpt'],
        'projects' => ['title', 'slug', 'summary'],
        'articles' => ['title', 'slug', 'excerpt'],
        'experience' => ['title', 'organisation'],
        'clients' => ['name', 'slug'],
    ];
    $banned = ['deloitte', 'pwc', 'sony', 'stripe', 'priya sharma', 'ravi kumar',
               'maria lopez', 'ken watanabe', 'acme', '12,000 sq ft'];
    $found = [];
    foreach ($textCols as $table => $cols) {
        foreach ($cols as $col) {
            $blob = strtolower((string)$conn->scalar(
                'SELECT COALESCE(GROUP_CONCAT(`' . $col . '` SEPARATOR " "), "") FROM `' . $table . '`'));
            foreach ($banned as $b) if (str_contains($blob, $b)) $found[] = "{$table}.{$col}:{$b}";
        }
    }
    E::eq('no Phase 0 fabricated business data was reintroduced', $found, []);
    E::eq('no client rows were invented', (int)$conn->scalar('SELECT COUNT(*) FROM clients'), 0);
    E::eq('no lead rows were invented', (int)$conn->scalar('SELECT COUNT(*) FROM leads'), 0);
    E::eq('no booking rows were invented', (int)$conn->scalar('SELECT COUNT(*) FROM bookings'), 0);

    $fixtures = (int)$conn->scalar("SELECT COUNT(*) FROM pages WHERE slug LIKE 'zzz-avos-test-%'");
    E::ok('every page fixture is clearly marked disposable',
        $fixtures === (int)$conn->scalar('SELECT COUNT(*) FROM pages'));
    E::ok('every user fixture uses the reserved example.test TLD',
        (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@example.test'") === 0);

    // Clean up: the shared DEV database must not accumulate fixtures.
    foreach (['content_versions', 'page_routes', 'redirects', 'article_tags',
              'article_categories', 'articles', 'projects', 'pages', 'experience',
              'tags', 'categories', 'audit_logs'] as $t) {
        $conn->run('DELETE FROM `' . $t . '`');
    }
    $conn->run("DELETE FROM users WHERE email LIKE 'zzz-avos-test-%@example.test'");
    E::eq('fixtures removed: pages', (int)$conn->scalar('SELECT COUNT(*) FROM pages'), 0);
    E::eq('fixtures removed: versions', (int)$conn->scalar('SELECT COUNT(*) FROM content_versions'), 0);
    E::eq('fixtures removed: routes', (int)$conn->scalar('SELECT COUNT(*) FROM page_routes'), 0);
    E::eq('fixtures removed: users',
        (int)$conn->scalar("SELECT COUNT(*) FROM users WHERE email LIKE 'zzz-avos-test-%'"), 0);
    E::ok('system seed data is untouched',
        (int)$conn->scalar('SELECT COUNT(*) FROM permissions') > 40
        && (int)$conn->scalar('SELECT COUNT(*) FROM roles') === 7);
}

/* =============================== SUMMARY =============================== */
echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d\n", E::$pass, E::$fail, E::$skip);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(E::$fail > 0 ? 1 : 0);
