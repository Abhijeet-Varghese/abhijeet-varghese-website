<?php
/**
 * AV OS — INSTALLER (single authoritative implementation).
 *
 * One engine used by BOTH surfaces:
 *   - public_html/install/index.php  (web installer, served at /install/)
 *   - database/install.php           (CLI installer)
 *
 * Steps: connect → create database → run the full migration chain
 * (001→026 via MigrationRunner) → seed canonical content → create the
 * Super Admin → write the lock file so the surface self-disables.
 */

final class Installer
{
    /**
     * @param array $opts {
     *   email, name, password, create_pass (bool), seed_file, lock_path
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

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid admin email.';
        if (!$createPass && strlen($pass) < 12) $errors[] = 'Password must be at least 12 characters.';
        if (empty(AV_DB['name']) || empty(AV_DB['user'])) $errors[] = 'Database not configured — create config.local.php first (see docs/DEPLOY-HOSTINGER-PHP.md).';
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

            // 2. content seed (canonical real content — never test data)
            $seedFile = $opts['seed_file'] ?? (AV_ROOT . '/../avos-data/site.json');
            if (is_file($seedFile) && !$errors) {
                $doc = json_decode((string)file_get_contents($seedFile), true);
                $keys = ['settings','dashboard','sections','pages','projects','articles','media','leads','meetings','availability','forms','submissions','seo','analytics','notifications','users','logs','backups','integrations','clients','testimonials','downloads','nav'];
                $up = $pdo->prepare("INSERT INTO content_store (key_name, data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)");
                foreach ($keys as $k) {
                    if (array_key_exists($k, $doc)) $up->execute([$k, json_encode($doc[$k], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
                }
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
            return ['ok' => true, 'errors' => [], 'temp_pass' => $tempPass, 'email' => $email, 'migrations' => $res];
        } catch (Throwable $e) {
            return ['ok' => false, 'errors' => ['Install failed: ' . $e->getMessage()], 'temp_pass' => '', 'email' => $email];
        }
    }
}
