<?php
/**
 * AV OS — CLI installer (single engine: backend/core/Installer.php).
 *
 * Usage:
 *   php database/install.php [--admin-email=you@domain.com] [--admin-name="Name"]
 *                            [--admin-password=...] [--lock=/abs/path/.installed]
 *
 * If --admin-password is omitted, a secure random temporary password is
 * generated and printed once; the admin must change it on first login.
 * Works where exec() is disabled (pure PDO) — same engine as the web
 * installer at /install/.
 */
$root = dirname(__DIR__);

$opts = [];
foreach (array_slice($argv, 1) as $arg) {
    if (str_starts_with($arg, '--')) {
        [$k, $v] = array_pad(explode('=', substr($arg, 2), 2), 2, '');
        $opts[$k] = $v;
    }
}

// config.php loads config.local.php itself (outside web root, never committed)
require $root . '/backend/config/config.php';   // defines AV_DB, AV_ROOT, AV_ENC_KEY …
require $root . '/backend/core/MigrationRunner.php';
require $root . '/backend/core/Installer.php';

$res = Installer::run([
    'email' => $opts['admin-email'] ?? getenv('AV_ADMIN_EMAIL') ?: '',
    'name' => $opts['admin-name'] ?? 'Abhijeet Varghese',
    'password' => $opts['admin-password'] ?? '',
    'create_pass' => empty($opts['admin-password']),
    'lock_path' => $opts['lock'] ?? ($root . '/install/.installed'),
]);

if (!$res['ok']) {
    foreach ($res['errors'] as $e) fwrite(STDERR, "  ✘ $e\n");
    fwrite(STDERR, "install failed\n");
    exit(1);
}
echo "Install complete.\n";
echo "  Admin email: {$res['email']}\n";
if ($res['temp_pass'] !== '') {
    echo "  Temporary password: {$res['temp_pass']}\n";
    echo "  (copy it now — you will be asked to change it on first login)\n";
} else {
    echo "  Use the password you set (you will be asked to change it on first login).\n";
}
if (!empty($res['migrations'])) {
    echo "  Migrations applied: {$res['migrations']['total']} file(s), {$res['migrations']['applied']} statement(s), {$res['migrations']['skipped']} skip(s)\n";
}
exit(0);
