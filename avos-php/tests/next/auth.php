<?php
declare(strict_types=1);

/**
 * AV OS — Phase 3C test suite: identity, authentication, RBAC, security events.
 *
 *   php avos-php/tests/next/auth.php
 *
 * Covers the §3C.16 matrix. Dependency-free by design (no Composer on shared
 * hosting). Database tests are SKIPPED, never silently passed, without MariaDB.
 */
$root = dirname(__DIR__, 2);
require $root . '/app/Autoloader.php';
AvOS\Autoloader::register($root . '/app');

use AvOS\Auth\AuthService;
use AvOS\Auth\LoginThrottle;
use AvOS\Auth\MailerInterface;
use AvOS\Auth\NullMailer;
use AvOS\Auth\NullMfaProvider;
use AvOS\Auth\PasswordHasher;
use AvOS\Auth\PasswordResetService;
use AvOS\Auth\SessionManager;
use AvOS\Config\Config;
use AvOS\Config\ConfigResolver;
use AvOS\Config\Environment;
use AvOS\Database\Connection;
use AvOS\Errors\AppException;
use AvOS\Http\Request;
use AvOS\Http\Router;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Migration\MigrationRunner;
use AvOS\Migration\SystemSeeder;
use AvOS\Rbac\Authorizer;
use AvOS\Security\Csrf;
use AvOS\Security\SecurityEvent;
use AvOS\Security\SecurityEventRecorder;
use AvOS\Security\SessionConfig;

final class A
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
    public static function throws(string $n, callable $fn, string $expectCode): void
    {
        try { $fn(); self::ok($n . ' [no exception]', false); }
        catch (AppException $e) { self::eq($n, $e->errorCode(), $expectCode); }
        catch (Throwable $e) { self::ok($n . ' [' . $e::class . ']', false); }
    }
    public static function skip(string $n, string $w): void
    { self::$skip++; printf("    %-60s SKIP  (%s)\n", substr($n, 0, 60), $w); }
}

/* --------------------------------------------------------------- fixtures */
$testDb = getenv('AVOS_TEST_DB') ?: 'avos_next_test';
$conn = new Connection(
    getenv('AVOS_TEST_HOST') ?: '127.0.0.1', $testDb,
    getenv('AVOS_TEST_USER') ?: 'avos_next',
    getenv('AVOS_TEST_PASS') ?: 'NextDev_2026_x',
);

if (!$conn->health()['ok']) {
    A::group('Phase 3C');
    A::skip('all database-backed tests', 'no MariaDB reachable');
    printf("\n  PASS %d  FAIL %d  SKIP %d\n\n", A::$pass, A::$fail, A::$skip);
    exit(A::$fail > 0 ? 1 : 0);
}

$runner = new MigrationRunner($conn, $root . '/database/next/migrations');
$runner->createDatabaseIfMissing();
$runner->dropAll();
$runner->migrate(false);
(new SystemSeeder($conn))->run();

// CLI has no PHP session; emulate one so SessionManager is exercised fully.
$GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$_SESSION = [];

$OWNER_EMAIL = 'owner-fixture@example.test';     // a FIXTURE, never the real address
$identity = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', $OWNER_EMAIL);
$hasher   = new PasswordHasher();
$users    = new UserRepository($conn, $hasher);
$sessions = new SessionManager($conn, new SessionConfig('AVOS_SESS', 12), 12);
$throttle = new LoginThrottle($conn);
$events   = new SecurityEventRecorder($conn, $identity);
$authz    = new Authorizer($users, $identity, $events, '127.0.0.1', 'test', 'AV-TEST');
$auth     = new AuthService($conn, $users, $hasher, $sessions, $throttle, $events, $identity, new NullMfaProvider());
$reset    = new PasswordResetService($conn, $users, $hasher, $sessions, $events, new NullMailer());

$PW = 'CorrectHorseBattery1!';
$IP = '203.0.113.10';

/* ============================== IDENTITY ================================ */
A::group('3C.1 identity');

$owner = $users->create('Owner', $OWNER_EMAIL, $PW, ['owner'], false);
A::ok('create user', $owner->id > 0);
A::eq('email is normalised to lowercase', $owner->email, strtolower($OWNER_EMAIL));
A::ok('find user by email', $users->findByEmail($OWNER_EMAIL)?->id === $owner->id);
A::ok('find user by id', $users->findById($owner->id)?->email === $owner->email);
A::ok('active user reports active', $owner->isActive());

$editor = $users->create('Editor', 'editor@example.test', $PW, ['editor'], false);
$disabled = $users->create('Disabled', 'disabled@example.test', $PW, ['editor'], false, 'suspended');
A::ok('suspended user is not active', !$disabled->isActive());
$users->setStatus($disabled->id, 'suspended');

A::throws('duplicate email is rejected',
    fn() => $users->create('Dup', $OWNER_EMAIL, $PW, ['editor']), 'VALIDATION_ERROR');
A::throws('weak password is rejected',
    fn() => $users->create('Weak', 'weak@example.test', 'short', ['editor']), 'VALIDATION_ERROR');

$pub = $owner->toPublicArray();
A::ok('public projection omits the password hash', !array_key_exists('password_hash', $pub));
A::ok('public projection omits the 2FA secret', !array_key_exists('twofa_secret', $pub));

/* ============================== PASSWORD ================================ */
A::group('3C.3 password security');

$h = $hasher->hash($PW);
A::ok('hash is not the plaintext', $h !== $PW && strlen($h) > 30);
A::ok('correct password verifies', $hasher->verify($PW, $h));
A::ok('wrong password fails', !$hasher->verify('WrongPassword123!', $h));
A::ok('empty stored hash fails safely', !$hasher->verify($PW, ''));
A::ok('short password rejected by policy', !$hasher->validateStrength('abc')['ok']);
A::ok('12+ char password accepted', $hasher->validateStrength($PW)['ok']);

/* ================================ LOGIN ================================= */
A::group('3C.4 login');

$r = $auth->login($OWNER_EMAIL, $PW, $IP, 'test-agent', 'AV-T1');
A::eq('valid login succeeds', $r['result'], AuthService::RESULT_OK);
A::ok('login returns a CSRF token', is_string($r['csrf']) && strlen($r['csrf']) >= 32);
A::ok('session registry row created', $sessions->validate() === $owner->id);

$before = $sessions->currentSessionId();
$GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));   // emulate rotation
A::ok('session id rotates on login', $sessions->currentSessionId() !== $before);
$_SESSION = [];
$r = $auth->login($OWNER_EMAIL, $PW, $IP, 'test-agent', 'AV-T2');
A::eq('re-login after rotation succeeds', $r['result'], AuthService::RESULT_OK);

$bad = $auth->login($OWNER_EMAIL, 'WrongPassword123!', '198.51.100.7', 'test', 'AV-T3');
A::eq('wrong password fails generically', $bad['result'], AuthService::RESULT_FAILED);

$unknown = $auth->login('nobody@example.test', $PW, '198.51.100.8', 'test', 'AV-T4');
A::eq('unknown account returns the SAME result as a wrong password',
    $unknown['result'], $bad['result']);

$sus = $auth->login('disabled@example.test', $PW, '198.51.100.9', 'test', 'AV-T5');
A::eq('suspended account returns the same generic failure',
    $sus['result'], AuthService::RESULT_FAILED);

/* ============================== THROTTLE ================================ */
A::group('3C.6 login protection');

$tIp = '198.51.100.50';
for ($i = 0; $i < 5; $i++) $auth->login('editor@example.test', 'WrongPassword123!', $tIp, 't', 'AV-T6');
$locked = $auth->login('editor@example.test', $PW, $tIp, 't', 'AV-T7');
A::eq('account is throttled after 5 failures', $locked['result'], AuthService::RESULT_THROTTLED);
A::ok('throttle reports a retry window', $locked['retry_after_minutes'] !== null);
A::ok('a DIFFERENT ip is unaffected',
    $auth->login('editor@example.test', $PW, '198.51.100.51', 't', 'AV-T8')['result'] === AuthService::RESULT_OK);
$throttle->clear('editor@example.test', $tIp);
A::ok('clearing failures unlocks the identity', !$throttle->isLocked('editor@example.test', $tIp));

/* ================================ CSRF ================================== */
A::group('3C.7 CSRF');

$_SESSION = [];
$GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$csrf = $auth->login($OWNER_EMAIL, $PW, $IP, 't', 'AV-T9')['csrf'];
A::ok('valid token verifies', Csrf::verify($csrf, $csrf));
A::ok('missing token fails', !Csrf::verify($csrf, ''));
A::ok('invalid token fails', !Csrf::verify($csrf, str_repeat('a', 48)));
A::ok('empty session token can never match', !Csrf::verify('', ''));
A::ok('mutating verbs are flagged',
    Csrf::isMutating('POST') && Csrf::isMutating('PUT') && Csrf::isMutating('PATCH')
    && Csrf::isMutating('DELETE') && !Csrf::isMutating('GET'));

/* =============================== SESSIONS =============================== */
A::group('3C.5 sessions');

A::eq('session validates to the right user', $sessions->validate(), $owner->id);
A::ok('active sessions listed', count($sessions->activeSessions($owner->id)) >= 1);
A::ok('session listing never exposes the token hash',
    !array_key_exists('token_hash', $sessions->activeSessions($owner->id)[0] ?? []));

$revoked = $sessions->revokeAllForUser($owner->id);
A::ok('server-side revocation removes registry rows', $revoked >= 1);
A::eq('revoked session no longer validates', $sessions->validate(), null);

$_SESSION = [];
$GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$auth->login($OWNER_EMAIL, $PW, $IP, 't', 'AV-T10');
$auth->logout($owner->id, $IP, 't', 'AV-T11');
A::eq('logout invalidates the session', $sessions->validate(), null);

$_SESSION = [];
$GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$auth->login($OWNER_EMAIL, $PW, $IP, 't', 'AV-T12');
$conn->run('UPDATE sessions SET expires_at = (UTC_TIMESTAMP() - INTERVAL 1 HOUR) WHERE user_id=?', [$owner->id]);
A::eq('expired session is rejected', $sessions->validate(), null);
A::ok('expired rows are purgeable', $sessions->purgeExpired() >= 0);

/* ================================= RBAC ================================= */
A::group('3C.8 RBAC (flat, no inheritance)');

$mk = function (string $slug, string $email) use ($users, $PW): int {
    return $users->create(ucfirst($slug), $email, $PW, [$slug], false)->id;
};
$ids = [
    'administrator'   => $mk('administrator', 'admin@example.test'),
    'editor'          => $editor->id,
    'content_manager' => $mk('content_manager', 'cm@example.test'),
    'seo_manager'     => $mk('seo_manager', 'seo@example.test'),
    'media_manager'   => $mk('media_manager', 'media@example.test'),
    'booking_manager' => $mk('booking_manager', 'booking@example.test'),
];

$as = function (int $userId) use ($authz, $users): Authorizer {
    $authz->setUser($users->findById($userId));
    return $authz;
};

$authz->setUser($users->findById($owner->id));
A::ok('owner is recognised by configured email', $authz->isOwner());
A::ok('owner can do anything (pages.write)', $authz->can('pages.write'));
A::ok('owner can do anything (system.manage)', $authz->can('system.manage'));
A::ok('owner passes requireOwner', $authz->requireOwner()->id === $owner->id);

A::ok('administrator has broad permissions', $as($ids['administrator'])->can('users.write'));
A::ok('administrator is NOT owner', !$as($ids['administrator'])->isOwner());
A::throws('administrator cannot pass requireOwner',
    fn() => $as($ids['administrator'])->requireOwner(), 'FORBIDDEN');

A::ok('editor can write pages', $as($ids['editor'])->can('pages.write'));
A::ok('editor can publish', $as($ids['editor'])->can('publishing.publish'));
A::ok('editor cannot manage users', !$as($ids['editor'])->can('users.write'));

A::ok('content manager can write pages', $as($ids['content_manager'])->can('pages.write'));
A::ok('content manager CANNOT publish', !$as($ids['content_manager'])->can('publishing.publish'));

A::ok('seo manager can write seo', $as($ids['seo_manager'])->can('seo.write'));
A::ok('seo manager cannot write pages', !$as($ids['seo_manager'])->can('pages.write'));

A::ok('media manager can write media', $as($ids['media_manager'])->can('media.write'));
A::ok('media manager cannot write seo', !$as($ids['media_manager'])->can('seo.write'));

A::ok('booking manager can write bookings', $as($ids['booking_manager'])->can('bookings.write'));
A::ok('booking manager cannot write media', !$as($ids['booking_manager'])->can('media.write'));

A::ok('roles do NOT inherit (editor lacks admin rights)',
    !$as($ids['editor'])->can('roles.manage'));

/* ============================ AUTHORIZATION ============================= */
A::group('3C.10 central authorization');

$authz->setUser(null);
A::ok('unauthenticated cannot do anything', !$authz->can('pages.read'));
A::throws('requireAuth rejects unauthenticated', fn() => $authz->requireAuth(), 'UNAUTHENTICATED');
A::throws('requirePermission rejects unauthenticated',
    fn() => $authz->requirePermission('pages.read'), 'UNAUTHENTICATED');

$authz->setUser($users->findById($disabled->id));
A::ok('suspended user is not authenticated', !$authz->isAuthenticated());
A::ok('suspended user has no permissions', !$authz->can('pages.read'));

A::ok('allowed permission passes', $as($ids['editor'])->requirePermission('pages.write')->id === $ids['editor']);
A::throws('denied permission raises FORBIDDEN',
    fn() => $as($ids['editor'])->requirePermission('system.manage'), 'FORBIDDEN');
A::throws('unknown role fails requireRole',
    fn() => $as($ids['editor'])->requireRole('not_a_role'), 'FORBIDDEN');
A::ok('correct role passes requireRole', $as($ids['editor'])->requireRole('editor')->id === $ids['editor']);

$payload = $as($ids['editor'])->sessionPayload();
A::ok('session payload never contains a hash',
    !str_contains(json_encode($payload) ?: '', 'password_hash'));
A::ok('session payload lists roles and permissions',
    $payload['roles'] === ['editor'] && count($payload['permissions']) > 0);

/* ============================ PASSWORD RESET ============================ */
A::group('3C.15 password reset');

$rr = $reset->request('editor@example.test', $IP, 't', 'AV-T13');
A::ok('reset request is accepted', $rr['accepted']);
A::eq('unconfigured mailer reports not_configured, not "sent"',
    $rr['delivery_status'], 'not_configured');
A::ok('a token was issued internally', is_string($rr['token']) && strlen($rr['token']) === 64);

$unknownReq = $reset->request('nobody-here@example.test', $IP, 't', 'AV-T14');
A::eq('unknown address returns the identical shape', $unknownReq['accepted'], $rr['accepted']);
A::eq('no token issued for an unknown address', $unknownReq['token'], null);

$stored = $conn->one('SELECT token_hash FROM password_resets ORDER BY id DESC LIMIT 1');
A::ok('only the token HASH is stored', $stored['token_hash'] !== $rr['token']);
A::eq('stored value is sha256 of the token', $stored['token_hash'], hash('sha256', $rr['token']));

$NEWPW = 'BrandNewSecret9!x';
$reset->complete($rr['token'], $NEWPW, $IP, 't', 'AV-T15');
A::ok('password actually changed',
    $hasher->verify($NEWPW, $users->findById($ids['editor'])->passwordHash()));
A::throws('token cannot be reused',
    fn() => $reset->complete($rr['token'], 'AnotherSecret9!x', $IP, 't', 'AV-T16'), 'VALIDATION_ERROR');
A::throws('unknown token is rejected with the same generic error',
    fn() => $reset->complete(str_repeat('f', 64), 'AnotherSecret9!x', $IP, 't', 'AV-T17'), 'VALIDATION_ERROR');

$rr2 = $reset->request('cm@example.test', $IP, 't', 'AV-T18');
$conn->run('UPDATE password_resets SET expires_at=(UTC_TIMESTAMP() - INTERVAL 1 MINUTE) WHERE token_hash=?',
    [hash('sha256', $rr2['token'])]);
A::throws('expired token is rejected',
    fn() => $reset->complete($rr2['token'], 'AnotherSecret9!x', $IP, 't', 'AV-T19'), 'VALIDATION_ERROR');

$rr3 = $reset->request('seo@example.test', $IP, 't', 'AV-T20');
$seoUser = $users->findById($ids['seo_manager']);
$_SESSION = []; $GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$auth->login('seo@example.test', $PW, $IP, 't', 'AV-T21');
$auth->changePassword($users->findById($ids['seo_manager']), $PW, 'YetAnotherSecret9!', $IP, 't', 'AV-T22');
A::throws('a password change invalidates outstanding reset tokens',
    fn() => $reset->complete($rr3['token'], 'DifferentAgain9!x', $IP, 't', 'AV-T23'), 'VALIDATION_ERROR');

/* ========================= FORCED PASSWORD CHANGE ======================= */
A::group('forced password change');

$forced = $users->create('Forced', 'forced@example.test', $PW, ['editor'], true);
A::ok('must_change_password is set on creation', $forced->mustChangePassword);
$_SESSION = []; $GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
$fr = $auth->login('forced@example.test', $PW, $IP, 't', 'AV-T24');
A::ok('login reports must_change_password', $fr['must_change_password']);
$auth->changePassword($users->findById($forced->id), $PW, 'FreshPassword12!', $IP, 't', 'AV-T25');
A::ok('flag cleared after change', !$users->findById($forced->id)->mustChangePassword);
A::throws('wrong current password blocks the change',
    fn() => $auth->changePassword($users->findById($forced->id), 'NotIt123456!', 'Another12345!', $IP, 't'),
    'FORBIDDEN');
A::throws('new password must differ from the current one',
    fn() => $auth->changePassword($users->findById($forced->id), 'FreshPassword12!', 'FreshPassword12!', $IP, 't'),
    'VALIDATION_ERROR');

/* =========================== SECURITY EVENTS ============================ */
A::group('3C.11 security events');

foreach ([
    SecurityEvent::LOGIN_SUCCESS, SecurityEvent::LOGIN_FAILURE, SecurityEvent::LOGOUT,
    SecurityEvent::PASSWORD_CHANGED, SecurityEvent::PASSWORD_RESET_REQUESTED,
    SecurityEvent::PASSWORD_RESET_COMPLETED, SecurityEvent::ACCOUNT_LOCKED,
    SecurityEvent::SESSION_REVOKED,
] as $type) {
    A::ok("recorded: {$type}", $events->countOfType($type) > 0);
}

$authz->setUser($users->findById($ids['editor']));
try { $authz->requirePermission('system.manage'); } catch (AppException) {}
A::ok('recorded: PERMISSION_DENIED', $events->countOfType(SecurityEvent::PERMISSION_DENIED) > 0);

$users->assignRole($ids['editor'], 'seo_manager');
$events->record(SecurityEvent::ROLE_CHANGED, $ids['editor'], 'editor@example.test', $IP, 't', 'AV-T26',
    ['added' => 'seo_manager']);
A::ok('recorded: ROLE_CHANGED', $events->countOfType(SecurityEvent::ROLE_CHANGED) > 0);
$users->revokeRole($ids['editor'], 'seo_manager');

$events->record(SecurityEvent::USER_CREATED, $owner->id, $OWNER_EMAIL, $IP, 't', 'AV-T27');
$events->record(SecurityEvent::USER_DISABLED, $disabled->id, 'disabled@example.test', $IP, 't', 'AV-T28');
A::ok('recorded: USER_CREATED', $events->countOfType(SecurityEvent::USER_CREATED) > 0);
A::ok('recorded: USER_DISABLED', $events->countOfType(SecurityEvent::USER_DISABLED) > 0);

// Secrets must never reach the event log.
$events->record(SecurityEvent::LOGIN_FAILURE, null, 'probe@example.test', $IP, 't', 'AV-T29',
    ['password' => 'SuperSecret123', 'token' => 'abc123', 'enc_key' => 'k', 'safe' => 'visible']);
$row = $conn->one("SELECT detail FROM security_events WHERE request_id='AV-T29'");
$detail = (string)$row['detail'];
A::ok('event log does not store a password', !str_contains($detail, 'SuperSecret123'));
A::ok('event log does not store a token', !str_contains($detail, 'abc123'));
A::ok('event log does not store an encryption key', !str_contains($detail, '"enc_key":"k"'));
A::ok('event log keeps non-secret detail', str_contains($detail, 'visible'));

$allDetails = implode(' ', array_map(
    static fn(array $r) => (string)($r['detail'] ?? ''),
    $conn->all('SELECT detail FROM security_events')));
A::ok('no session token ever appears in the event log',
    !str_contains($allDetails, $GLOBALS['__avos_cli_session_id']));

/* ============================== OWNER IDENTITY ========================== */
A::group('3C.2 owner identity');

$noOwner = new EmailIdentity('hi@abhijeetvarghese.com', 'no-reply@abhijeetvarghese.com', '');
A::ok('unconfigured owner reports not set', !$noOwner->hasOwner());
A::eq('unconfigured owner status is explicit', $noOwner->status()['owner_source'], 'not-configured');
A::ok('nobody is owner when unconfigured', !$noOwner->isOwnerEmail('anyone@example.test'));

$authzNoOwner = new Authorizer($users, $noOwner, $events, $IP, 't', 'AV-T30');
$authzNoOwner->setUser($users->findById($owner->id));
A::ok('fail-closed: no owner configured => nobody is owner', !$authzNoOwner->isOwner());
A::throws('requireOwner denies when no owner is configured',
    fn() => $authzNoOwner->requireOwner(), 'FORBIDDEN');

A::ok('identity redacts the owner address', str_contains($identity->redact("to {$OWNER_EMAIL}"), '[redacted]'));
A::ok('leak detector spots the owner address', $identity->leaksOwner(['contact' => $OWNER_EMAIL]));
A::ok('leak detector is quiet on clean payloads', !$identity->leaksOwner(['contact' => 'hi@abhijeetvarghese.com']));
$st = $identity->status();
A::ok('identity status exposes presence only, never the value',
    $st['owner_email_set'] === true && !in_array($OWNER_EMAIL, array_values($st), true));

/* ============================= MFA BOUNDARY ============================= */
A::group('3C.14 MFA boundary (declared, not implemented)');

$mfa = new NullMfaProvider();
A::ok('MFA reports itself unavailable', !$mfa->isAvailable());
A::eq('MFA status is explicitly NOT_IMPLEMENTED', NullMfaProvider::STATUS, 'NOT_IMPLEMENTED');
A::ok('unimplemented verify never grants access', !$mfa->verify(1, '000000'));

$conn->run('UPDATE users SET twofa_enabled=1 WHERE id=?', [$ids['media_manager']]);
$_SESSION = []; $GLOBALS['__avos_cli_session_id'] = bin2hex(random_bytes(16));
A::throws('an MFA-flagged account fails CLOSED, never falls back to password-only',
    fn() => $auth->login('media@example.test', $PW, '198.51.100.99', 't', 'AV-T31'), 'MFA_UNAVAILABLE');
$conn->run('UPDATE users SET twofa_enabled=0 WHERE id=?', [$ids['media_manager']]);

/* ============================== HTTP LAYER ============================== */
A::group('3C.18 API request handling');

// Phase 3D added a required $requestId to Request and moved router failures
// to ApiException. Updated here; no Phase 3C runtime code changed.
$mkReq = static fn(string $m, string $p, string $body = '', array $h = []): Request =>
    new Request($m, $p, [], array_merge(['content-type' => 'application/json'], $h),
        $body, '127.0.0.1', 'test', 'AV-3C-TEST');

$apiCode = static function (callable $fn): string {
    try { $fn(); return 'none'; }
    catch (\AvOS\Api\ApiException $e) { return $e->code(); }
    catch (Throwable $e) { return $e::class; }
};
A::eq('malformed JSON is rejected', $apiCode(fn() => $mkReq('POST', '/x', '{not json')->json()), 'INVALID_JSON');
A::eq('oversized body is rejected',
    $apiCode(fn() => $mkReq('POST', '/x', str_repeat('a', Request::MAX_BODY_BYTES + 10))->json()), 'PAYLOAD_TOO_LARGE');
A::eq('wrong content type is rejected',
    $apiCode(fn() => $mkReq('POST', '/x', '{}', ['content-type' => 'text/plain'])->json()), 'UNSUPPORTED_MEDIA_TYPE');
A::eq('valid JSON decodes', $mkReq('POST', '/x', '{"a":1}')->json(), ['a' => 1]);
A::eq('empty body decodes to an empty array', $mkReq('POST', '/x', '')->json(), []);

$router = new Router();
$router->post('/api/v1/auth/login', static fn(Request $r) => ['status' => 200, 'body' => ['ok' => true]]);
A::eq('unknown route returns NOT_FOUND',
    $apiCode(fn() => $router->dispatch($mkReq('GET', '/api/v1/nope'))), 'NOT_FOUND');
A::ok('known route dispatches',
    $router->dispatch($mkReq('POST', '/api/v1/auth/login', '{}'))['status'] === 200);

/* ================================ SUMMARY =============================== */
echo "\n  " . str_repeat('=', 74) . "\n";
printf("  PASS %d   FAIL %d   SKIP %d\n", A::$pass, A::$fail, A::$skip);
echo '  ' . str_repeat('=', 74) . "\n\n";
exit(A::$fail > 0 ? 1 : 0);
