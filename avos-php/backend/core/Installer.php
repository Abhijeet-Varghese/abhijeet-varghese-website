<?php
/**
 * AV OS — INSTALLER (single authoritative implementation).
 *
 * One engine used by BOTH surfaces:
 *   - public_html/install/index.php  (web installer, served at /install/)
 *   - database/install.php           (CLI installer)
 *
 * Steps: connect → create database → run the full migration chain
 * (via MigrationRunner) → sync the static frontend into the store → create the
 * Super Admin → write the lock file so the surface self-disables.
 */

final class Installer
{
    /**
     * @param array $opts {
     *   email, name, password, create_pass (bool), lock_path
     * }
     * @return array{ok:bool, errors:array, temp_pass:string, email:string}
     */
    public static function run(array $opts): array
    {
        $errors = [];
        $email = strtolower(trim((string)($opts['email'] ?? '')));
        $name = trim((string)($opts['name'] ?? 'Abhijeet Varghese'));
        $pass = (string)($opts['password'] ?? '');
        $createPass = !empty($opts['create_pass']);
        $tempPass = '';
        $warnings = [];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid admin email.';
        if (!$createPass && strlen($pass) < 12) $errors[] = 'Password must be at least 12 characters.';
        if (empty(AV_DB['name']) || empty(AV_DB['user'])) $errors[] = 'Database not configured — create config.local.php first (copy config.local.example.php).';
        if ($errors) return ['ok' => false, 'errors' => $errors, 'temp_pass' => '', 'email' => $email];

        try {
            $db = AV_DB;
            $pdo = new PDO("mysql:host={$db['host']};charset=utf8mb4", $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

            // already installed? (schema_migrations exists with recorded rows)
            try {
                $pdo->exec("USE `{$db['name']}`");
                $prior = (int)$pdo->query("SELECT COUNT(*) FROM schema_migrations")->fetchColumn();
                if ($prior > 0) {
                    return ['ok' => false, 'already_installed' => true,
                            'errors' => ['This database is already installed (' . $prior . ' migrations recorded). The installer refuses to run twice.'],
                            'temp_pass' => '', 'email' => $email];
                }
            } catch (Throwable $e) { /* fresh database — proceed */ }

            // 1. schema + migrations (single engine — MigrationRunner)
            $res = MigrationRunner::run($pdo, $db['name'], AV_ROOT . '/database/migrations');
            if ($res['total'] === 0) {
                $errors[] = 'No migration files found in ' . AV_ROOT . '/database/migrations';
            }

            // 2. mirror the static frontend into the store (frontend = source of truth); never fatal.
            if (!$errors && defined('AV_SITE_DIR') && is_file(AV_SITE_DIR . '/index.html')) {
                try {
                    // install.php loads only config + this class; pull in the runtime autoloader for SiteSync's deps
                    if (!class_exists('SiteSync')) require_once AV_ROOT . '/includes/bootstrap.php';
                    $sync = SiteSync::run(null, true, 'install');
                    if (!$sync['ok']) $warnings[] = 'Frontend sync skipped: ' . implode('; ', $sync['warnings']);
                } catch (Throwable $e) { $warnings[] = 'Frontend sync skipped: ' . $e->getMessage(); }
            }

            // 3. admin user (hashed, forced change on first login)
            if (!$errors) {
                $finalPass = $createPass ? bin2hex(random_bytes(12)) : $pass;
                if ($createPass) $tempPass = $finalPass;
                $st = $pdo->prepare("INSERT INTO users (name, email, password_hash, role_id, status, must_change_password) VALUES (?,?,?,1,'active',1)");
                $st->execute([$name, $email, password_hash($finalPass, PASSWORD_DEFAULT)]);
            }

            // 4. lock this installer surface
            if (!$errors && !empty($opts['lock_path'])) {
                @mkdir(dirname((string)$opts['lock_path']), 0775, true);
                file_put_contents((string)$opts['lock_path'], date('c'));
            }

            if ($errors) return ['ok' => false, 'errors' => $errors, 'temp_pass' => '', 'email' => $email];
            return ['ok' => true, 'errors' => [], 'warnings' => $warnings, 'temp_pass' => $tempPass, 'email' => $email, 'migrations' => $res];
        } catch (Throwable $e) {
            return ['ok' => false, 'errors' => ['Install failed: ' . $e->getMessage()], 'temp_pass' => '', 'email' => $email];
        }
    }
}
