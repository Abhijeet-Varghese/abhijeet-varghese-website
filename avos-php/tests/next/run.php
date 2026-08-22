#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3A/3B test suite.
 *
 * Deliberately dependency-free (no PHPUnit): Hostinger shared hosting cannot
 * run composer, and the CI image should not need it either. Run with:
 *
 *   php avos-php/tests/next/run.php
 *
 * Requires a reachable MariaDB and a disposable test database; database tests
 * are skipped (not silently passed) when one is unavailable.
 */

$root = dirname(__DIR__, 2);                 // avos-php
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Config\ConfigResolver;
use AvOS\Config\Environment;
use AvOS\Config\Config;
use AvOS\Database\Connection;
use AvOS\Migration\MigrationRunner;
use AvOS\Migration\SchemaValidator;
use AvOS\Migration\SystemSeeder;
use AvOS\Security\AuditEvent;
use AvOS\Security\Csrf;
use AvOS\Security\Encoder;
use AvOS\Security\PathGuard;
use AvOS\Security\UploadValidator;
use AvOS\Security\Validator;
use AvOS\Security\ArrayRateLimiter;

final class T
{
    public static int $pass = 0;
    public static int $fail = 0;
    public static int $skip = 0;
    private static string $group = '';

    public static function group(string $g): void
    { self::$group = $g; echo "\n  " . $g . "\n  " . str_repeat('-', 72) . "\n"; }

    public static function ok(string $name, bool $cond): void
    {
        $cond ? self::$pass++ : self::$fail++;
        printf("    %-60s %s\n", substr($name, 0, 60), $cond ? 'PASS' : 'FAIL');
    }

    public static function eq(string $name, mixed $a, mixed $b): void
    {
        $c = $a === $b;
        if (!$c) { printf("    %-60s FAIL  (%s != %s)\n", substr($name, 0, 60),
            var_export($a, true), var_export($b, true)); self::$fail++; return; }
        self::ok($name, true);
    }

    public static function skip(string $name, string $why): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($name, 0, 60), $why); }
}

/* ============================ 3A · CONFIG RESOLVER ====================== */
T::group('3A.4 private configuration resolver');

// Isolate: these tests must not be influenced by the caller's environment.
putenv('AV_CONFIG_FILE=');
putenv('AV_PRIVATE_DIR=');

$r = new ConfigResolver('/home/u1/public_html/next');
T::ok('rejects /public_html/... as private (the staging trap)',
    $r->isWebExposed('/home/u1/public_html/avos-private'));
T::ok('accepts a true account-root private dir',
    !$r->isWebExposed('/home/u1/avos-private'));
T::ok('treats anything at/below the app root as exposed',
    $r->isWebExposed('/home/u1/public_html/next/config.local.php'));
T::ok('also rejects htdocs / www / public segments',
    $r->isWebExposed('/srv/www/x') && $r->isWebExposed('/a/htdocs/b') && $r->isWebExposed('/a/public/b'));

$tmp = sys_get_temp_dir() . '/avos_cfg_' . bin2hex(random_bytes(4));
@mkdir($tmp . '/avos-private', 0775, true);
file_put_contents($tmp . '/avos-private/config.local.php',
    "<?php\n\$env='testing';\n\$db=['host'=>'h','name'=>'n','user'=>'u','pass'=>'p'];\n\$encKey='" . str_repeat('k', 40) . "';\n");
@mkdir($tmp . '/public_html/next', 0775, true);

$r2 = new ConfigResolver($tmp . '/public_html/next');
T::eq('finds the non-exposed ancestor avos-private/', $r2->source(), ConfigResolver::SOURCE_ANCESTOR);
T::ok('reports the resolved config as outside the web root', $r2->isConfigOutsideWebRoot());

putenv('AV_CONFIG_FILE=' . $tmp . '/avos-private/config.local.php');
$r3 = new ConfigResolver('/tmp/anyroot');
T::eq('honours an explicit AV_CONFIG_FILE', $r3->source(), ConfigResolver::SOURCE_ENV_FILE);

putenv('AV_CONFIG_FILE=' . $tmp . '/definitely-missing.php');
$r4 = new ConfigResolver('/tmp/anyroot');
T::eq('invalid AV_CONFIG_FILE fails loudly, never downgrades',
    $r4->source(), ConfigResolver::SOURCE_INVALID);

putenv('AV_CONFIG_FILE=');
$empty = sys_get_temp_dir() . '/avos_empty_' . bin2hex(random_bytes(4)) . '/deep/root';
@mkdir($empty, 0775, true);
$r5 = new ConfigResolver($empty);
T::eq('no config anywhere resolves to an empty path', $r5->resolve(), '');

// legacy in-web-root config is found but flagged.
// Isolated root: if it sat under $tmp it would find the avos-private/ fixture
// above it and correctly prefer that, which is not what this case tests.
$legacyRoot = sys_get_temp_dir() . '/avos_legacy_' . bin2hex(random_bytes(4)) . '/app';
@mkdir($legacyRoot, 0775, true);
file_put_contents($legacyRoot . '/config.local.php', "<?php\n\$env='testing';\n");
$r6 = new ConfigResolver($legacyRoot);
T::eq('legacy in-web-root config is used but labelled', $r6->source(), ConfigResolver::SOURCE_LEGACY);
T::ok('legacy config reported as NOT outside the web root', !$r6->isConfigOutsideWebRoot());

/* ============================ 3A · PRODUCTION GUARDS ==================== */
T::group('3A.3 production guards');

// A real private config file must exist, otherwise the guard legitimately
// reports 'no configuration file was found' and the fixture is testing itself.
$guardRoot = sys_get_temp_dir() . '/avos_guard_' . bin2hex(random_bytes(4));
@mkdir($guardRoot . '/avos-private', 0775, true);
file_put_contents($guardRoot . '/avos-private/config.local.php', "<?php\n");
@mkdir($guardRoot . '/app', 0775, true);

$mk = static function (array $vars, string $env = 'production') use ($guardRoot): Config {
    putenv('AV_CONFIG_FILE=' . $guardRoot . '/avos-private/config.local.php');
    putenv('AV_PRIVATE_DIR=');
    putenv('DB_HOST='); putenv('DB_NAME='); putenv('DB_USER='); putenv('DB_PASS='); putenv('AV_ENC_KEY=');
    $res = new ConfigResolver($guardRoot . '/app');
    return Config::build($res, $vars, new Environment($env));
};

$good = ['db' => ['host' => 'h', 'name' => 'n', 'user' => 'u', 'pass' => 'p'], 'encKey' => str_repeat('k', 40)];
T::eq('valid production config has no problems', $mk($good)->productionProblems(), []);

$p = $mk(['db' => ['host' => 'h', 'name' => '', 'user' => '', 'pass' => ''], 'encKey' => str_repeat('k', 40)])->productionProblems();
T::ok('missing db name/user is rejected', in_array('database credentials are not configured', $p, true));

$p = $mk(['db' => ['host' => 'h', 'name' => 'n', 'user' => 'u', 'pass' => ''], 'encKey' => str_repeat('k', 40)])->productionProblems();
T::ok('empty db password is rejected', in_array('database password is empty', $p, true));

$p = $mk(['db' => ['host' => 'h', 'name' => 'n', 'user' => 'u', 'pass' => 'p'], 'encKey' => ''])->productionProblems();
T::ok('missing encryption key is rejected', in_array('encryption key is not set', $p, true));

$p = $mk(['db' => ['host' => 'h', 'name' => 'n', 'user' => 'u', 'pass' => 'p'], 'encKey' => 'short'])->productionProblems();
T::ok('short encryption key is rejected', in_array('encryption key is too short (32+ characters required)', $p, true));

$p = $mk(['db' => ['host' => 'h', 'name' => 'n', 'user' => 'avos', 'pass' => 'p'], 'encKey' => str_repeat('k', 40)])->productionProblems();
T::ok('known development credentials are rejected', in_array('default development database credentials detected', $p, true));

$cfg = $mk($good, 'local');
T::eq('non-production is not blocked by the guard', (function () use ($cfg) {
    try { $cfg->assertProductionSafe(new Environment('local')); return 'ok'; }
    catch (Throwable) { return 'threw'; }
})(), 'ok');

$report = $mk($good)->safeReport();
T::ok('safeReport exposes booleans, not secrets',
    $report['enc_key_set'] === true && $report['enc_key_strong'] === true
    && !in_array(str_repeat('k', 40), array_map('strval', array_values($report)), true));

// --- amendment A15: $dbNext keeps the two runtimes on separate databases ---
// The legacy backend reads $db from the SAME private file, so $db must stay
// pointed at the legacy database while the new runtime uses its own.
$legacyDb = ['host' => 'lh', 'name' => 'legacy_db', 'user' => 'legacy_u', 'pass' => 'lp', 'charset' => 'utf8mb4'];

$only = $mk(['db' => $legacyDb, 'encKey' => str_repeat('k', 40)]);
T::eq('without $dbNext the legacy $db block is used', $only->get('database.name'), 'legacy_db');
T::eq('without $dbNext the profile reports db', $only->get('config_meta.db_profile'), 'db');

$both = $mk([
    'db'     => $legacyDb,
    'dbNext' => ['name' => 'next_db', 'user' => 'next_u', 'pass' => 'np'],
    'encKey' => str_repeat('k', 40),
]);
T::eq('$dbNext overrides the database name', $both->get('database.name'), 'next_db');
T::eq('$dbNext overrides the database user', $both->get('database.user'), 'next_u');
T::eq('$dbNext inherits unspecified keys from $db', $both->get('database.host'), 'lh');
T::eq('$dbNext inherits the charset from $db', $both->get('database.charset'), 'utf8mb4');
T::eq('the profile reports dbNext when present', $both->get('config_meta.db_profile'), 'dbNext');
T::eq('safeReport exposes the profile name', $both->safeReport()['db_profile'], 'dbNext');
T::ok('safeReport never exposes a database name or password',
    !in_array('next_db', array_map('strval', array_values($both->safeReport())), true)
    && !in_array('np', array_map('strval', array_values($both->safeReport())), true));
T::eq('$dbNext is still subject to the production guard',
    $mk(['db' => $legacyDb, 'dbNext' => ['name' => 'n', 'user' => 'avos', 'pass' => 'p'], 'encKey' => str_repeat('k', 40)])
        ->productionProblems(),
    ['default development database credentials detected']);

// --- debug may be narrowed, never widened -------------------------------
T::ok('production never enables debug', $mk($good, 'production')->isDebug() === false);
T::ok('staging enables debug by default', $mk($good, 'staging')->isDebug() === true);
T::ok('a public staging host can switch debug off from the private config',
    $mk($good + ['debug' => false], 'staging')->isDebug() === false);
putenv('AV_DEBUG=0');
T::ok('AV_DEBUG=0 switches debug off', $mk($good, 'staging')->isDebug() === false);
putenv('AV_DEBUG=1');
T::ok('AV_DEBUG=1 cannot switch debug on in production', $mk($good, 'production')->isDebug() === false);
putenv('AV_DEBUG=');

/* ============================ 3A · SECURITY PRIMITIVES ================== */
T::group('3A.6 security primitives');

T::ok('CSRF rejects empty-vs-empty (audit finding L1)', !Csrf::verify('', ''));
T::ok('CSRF rejects null token', !Csrf::verify('abc', null));
T::ok('CSRF accepts a matching token', Csrf::verify('abc123', 'abc123'));
T::ok('CSRF rejects a mismatch', !Csrf::verify('abc123', 'abc124'));
T::ok('CSRF flags mutating verbs', Csrf::isMutating('post') && Csrf::isMutating('DELETE') && !Csrf::isMutating('GET'));

T::ok('PathGuard rejects ../ traversal', !PathGuard::isSafeRelative('../secrets.txt'));
T::ok('PathGuard rejects encoded traversal', !PathGuard::isSafeRelative('..%2fsecret.txt'));
T::ok('PathGuard rejects absolute paths', !PathGuard::isSafeRelative('/etc/passwd'));
T::ok('PathGuard rejects null bytes', !PathGuard::isSafeRelative("a\0b.png"));
T::ok('PathGuard rejects backslashes', !PathGuard::isSafeRelative('a\\b.png'));
T::ok('PathGuard accepts a clean nested path', PathGuard::isSafeRelative('uploads/2026/photo.webp'));

$sandbox = sys_get_temp_dir() . '/avos_pg_' . bin2hex(random_bytes(4));
@mkdir($sandbox . '/sub', 0775, true);
file_put_contents($sandbox . '/sub/ok.png', 'x');
T::ok('PathGuard resolves inside the base dir', PathGuard::resolveWithin($sandbox, 'sub/ok.png') !== null);
T::ok('PathGuard refuses to escape the base dir', PathGuard::resolveWithin($sandbox, '../../etc/passwd') === null);

$php = '<?php echo "x";';
T::ok('upload: .php is blocked', !UploadValidator::validate('a.php', $php, 1_000_000)['ok']);
T::ok('upload: .phtml is blocked', !UploadValidator::validate('a.phtml', $php, 1_000_000)['ok']);
T::ok('upload: double extension a.php.webp is blocked',
    !UploadValidator::validate('a.php.webp', $php, 1_000_000)['ok']);
T::ok('upload: oversize is rejected', !UploadValidator::validate('a.png', str_repeat('x', 100), 10)['ok']);
$png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
T::ok('upload: a real PNG is accepted', UploadValidator::validate('a.png', $png, 1_000_000)['ok']);
T::ok('upload: PNG bytes named .pdf are rejected (MIME mismatch)',
    !UploadValidator::validate('a.pdf', $png, 1_000_000)['ok']);
T::ok('upload: storage name never derives from input',
    preg_match('/^[a-f0-9]{16}\.png$/', UploadValidator::safeStorageName('png')) === 1);

T::eq('encoder escapes HTML', Encoder::html('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
T::eq('encoder blocks javascript: URLs', Encoder::url('javascript:alert(1)'), '');
T::eq('encoder allows https URLs', Encoder::url('https://a.test/x'), 'https://a.test/x');
T::eq('encoder slugifies', Encoder::slug('Hello, World!'), 'hello-world');

$v = new Validator(['email' => 'A@B.CO', 'slug' => 'good-slug', 'n' => '42', 'bad' => 'x']);
T::eq('validator normalises email', $v->email('email'), 'a@b.co');
T::eq('validator accepts a good slug', $v->slug('slug'), 'good-slug');
T::eq('validator casts int within range', $v->int('n', 1, 100), 42);
$v2 = new Validator(['slug' => 'Bad Slug!']);
$v2->slug('slug');
T::ok('validator rejects a bad slug', $v2->fails());
$v3 = new Validator([]);
$v3->string('title', 100, true);
T::ok('validator flags a missing required field', array_key_exists('title', $v3->errors()));

$rl = new ArrayRateLimiter();
for ($i = 0; $i < 3; $i++) $rl->allow('k', 3, 60);
T::ok('rate limiter blocks past the limit', !$rl->allow('k', 3, 60));
T::eq('rate limiter reports remaining', $rl->remaining('k', 3, 60), 0);

$redacted = AuditEvent::redact([
    'email' => 'x@y.z', 'password' => 'hunter2',
    'nested' => ['token' => 'abc', 'enc_key' => 'k', 'safe' => 1],
]);
T::eq('audit redacts password', $redacted['password'], '[redacted]');
T::eq('audit redacts nested token', $redacted['nested']['token'], '[redacted]');
T::eq('audit redacts nested enc_key', $redacted['nested']['enc_key'], '[redacted]');
T::eq('audit keeps non-secret fields', $redacted['nested']['safe'], 1);

/* ============================ 3B · DATABASE ============================= */
T::group('3B database, migrations and schema');

$testDb = getenv('AVOS_TEST_DB') ?: 'avos_next_test';
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1',
    $testDb,
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);
$health = $conn->health();

if (!$health['ok']) {
    T::skip('database tests', 'no MariaDB reachable');
} else {
    $runner = new MigrationRunner($conn, $root . '/database/next/migrations');
    $runner->createDatabaseIfMissing();
    $runner->dropAll();

    $res = $runner->migrate(false);
    T::eq('fresh database: no migration failed', $res['failed'], null);
    T::ok('fresh database: all migrations applied', count($res['applied']) >= 9);

    $again = $runner->migrate(false);
    T::eq('idempotency: second run applies nothing', count($again['applied']), 0);
    T::ok('idempotency: everything reported as already present', count($again['skipped']) >= 9);

    $seed1 = (new SystemSeeder($conn))->run();
    $permBefore = (int)$conn->scalar('SELECT COUNT(*) FROM permissions');
    (new SystemSeeder($conn))->run();
    $permAfter = (int)$conn->scalar('SELECT COUNT(*) FROM permissions');
    T::eq('seeder is idempotent', $permBefore, $permAfter);
    T::ok('seeder created permissions', $seed1['permissions'] > 0);
    T::ok('seeder created roles', $seed1['roles'] > 0);
    T::eq('seeder created NO fabricated leads', (int)$conn->scalar('SELECT COUNT(*) FROM leads'), 0);
    T::eq('seeder created NO fabricated clients', (int)$conn->scalar('SELECT COUNT(*) FROM clients'), 0);
    T::eq('seeder created NO fabricated projects', (int)$conn->scalar('SELECT COUNT(*) FROM projects'), 0);
    T::eq('seeder created NO fabricated testimonials', (int)$conn->scalar('SELECT COUNT(*) FROM testimonials'), 0);

    $report = (new SchemaValidator($conn, $root . '/database/next/migrations'))->validate();
    T::ok('schema validation passes', $report['ok']);
    T::eq('no missing tables', $report['missing_tables'], []);
    T::eq('no missing columns', $report['missing_columns'], []);
    T::eq('no missing indexes', $report['missing_indexes'], []);
    T::eq('no unexpected tables', $report['unexpected_tables'], []);

    // Structural guarantees the contract depends on
    $uq = $conn->one("SHOW INDEX FROM booking_slots WHERE Key_name='uq_slot'");
    T::ok('booking_slots has the double-booking UNIQUE backstop', $uq !== null);
    $uq2 = $conn->one("SHOW INDEX FROM page_routes WHERE Key_name='uq_route_entity'");
    T::ok('page_routes prevents duplicate canonicals', $uq2 !== null);
    $nd = $conn->one("SHOW INDEX FROM builder_node_devices WHERE Key_name='uq_nd'");
    T::ok('builder_node_devices is unique per (node, device)', $nd !== null);
    T::ok('content_versions is unique per (entity, version)',
        $conn->one("SHOW INDEX FROM content_versions WHERE Key_name='uq_cv'") !== null);
    T::eq('projects carries is_case_study (merged table decision)',
        $conn->one("SHOW COLUMNS FROM projects LIKE 'is_case_study'") !== null, true);
    T::eq('no separate case_studies table exists',
        $conn->one('SELECT 1 t FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
            [$testDb, 'case_studies']), null);

    // Transactions
    $conn->run('DELETE FROM site_settings WHERE skey=?', ['__txn_probe']);
    try {
        $conn->transaction(function (Connection $c): void {
            $c->run('INSERT INTO site_settings (skey, svalue) VALUES (?,?)', ['__txn_probe', '1']);
            throw new RuntimeException('rollback me');
        });
    } catch (Throwable) { /* expected */ }
    T::eq('transaction rolls back on exception',
        (int)$conn->scalar('SELECT COUNT(*) FROM site_settings WHERE skey=?', ['__txn_probe']), 0);

    $conn->transaction(fn(Connection $c) => $c->run(
        'INSERT INTO site_settings (skey, svalue) VALUES (?,?)', ['__txn_probe', '1']));
    T::eq('transaction commits on success',
        (int)$conn->scalar('SELECT COUNT(*) FROM site_settings WHERE skey=?', ['__txn_probe']), 1);
    $conn->run('DELETE FROM site_settings WHERE skey=?', ['__txn_probe']);

    // Prepared statements are genuinely parameterised
    $injected = "x'; DROP TABLE site_settings; --";
    $conn->run('INSERT INTO site_settings (skey, svalue) VALUES (?,?)', ['__inj', $injected]);
    T::eq('injection payload is stored as data, not executed',
        (string)$conn->scalar('SELECT svalue FROM site_settings WHERE skey=?', ['__inj']), $injected);
    T::ok('table still exists after the injection attempt',
        $conn->one('SELECT 1 t FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
            [$testDb, 'site_settings']) !== null);
    $conn->run('DELETE FROM site_settings WHERE skey=?', ['__inj']);

    // Controlled migration failure
    $failDir = sys_get_temp_dir() . '/avos_failmig_' . bin2hex(random_bytes(4));
    @mkdir($failDir, 0775, true);
    file_put_contents($failDir . '/001_ok.sql',
        "-- @UP\nCREATE TABLE IF NOT EXISTS _t_ok (id INT UNSIGNED PRIMARY KEY) ENGINE=InnoDB;\n");
    file_put_contents($failDir . '/002_bad.sql',
        "-- @UP\nCREATE TABLE IF NOT EXISTS _t_partial (id INT UNSIGNED PRIMARY KEY) ENGINE=InnoDB;\n"
        . "CREATE TABLE _t_broken ( INVALID SYNTAX HERE );\n");
    $fr = new MigrationRunner($conn, $failDir);
    $fres = $fr->migrate(false);
    T::ok('controlled failure is detected', $fres['failed'] !== null);
    T::eq('failure reports the exact statement index', $fres['failed']['statement'] ?? null, 2);
    $states = [];
    foreach ($fr->status() as $s) $states[$s['migration']] = $s['state'];
    T::eq('ledger marks the migration FAILED (truthful)', $states['002_bad.sql'] ?? null, 'FAILED');
    T::ok('partial state is visible, not hidden',
        $conn->one('SELECT 1 t FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
            [$testDb, '_t_partial']) !== null);
    $retry = $fr->migrate(false);
    T::ok('a failed migration blocks further runs', $retry['failed'] !== null);
    $conn->pdo()->exec('DROP TABLE IF EXISTS _t_ok');
    $conn->pdo()->exec('DROP TABLE IF EXISTS _t_partial');

    // Immutability
    $runner->dropAll();
    $runner->migrate(false);
    $mfile = $root . '/database/next/migrations/008_creative.sql';
    $orig = (string)file_get_contents($mfile);
    file_put_contents($mfile, $orig . "\n-- tamper\n");
    $tampered = $runner->migrate(false);
    file_put_contents($mfile, $orig);
    T::ok('a modified migration is rejected as tampered',
        ($tampered['failed']['error'] ?? '') !== '' && str_contains($tampered['failed']['error'], 'checksum'));

    // Restore a clean database for downstream use
    $runner->dropAll();
    $runner->migrate(false);
    (new SystemSeeder($conn))->run();
}

/* ================================= SUMMARY ============================== */
echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d\n", T::$pass, T::$fail, T::$skip);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(T::$fail > 0 ? 1 : 0);
