<?php
/**
 * AV OS — MIGRATION RUNNER (single authoritative implementation).
 *
 * Used by:
 *   - database/migrate.php            (CLI)
 *   - backend/core/Installer.php      (web + CLI installers)
 *
 * Invariants enforced here (see docs/database.md):
 *   - Migrations are immutable history: a file whose checksum changed after
 *     being recorded is refused.
 *   - `USE <db>` statements inside migration files are SKIPPED (they hardcode
 *     the dev database name and break on any differently-named production
 *     database). The runner already selects the target database beforehand.
 *   - CREATE / DROP / ALTER DATABASE statements are REFUSED for any pending
 *     file — migrations must be portable.
 *   - Statements that fail only because the object already exists
 *     ("already exists" / "Duplicate entry" / "Duplicate column/key name")
 *     are skipped so re-runs are safe on any MySQL/MariaDB.
 */

final class MigrationRunner
{
    /**
     * @param PDO   $pdo connection WITHOUT a selected database (we create/select it)
     * @param string $dbName target database
     * @param string $dir   migrations directory
     * @return array{applied:int, skipped:int, total:int, files:array}
     */
    public static function run(PDO $pdo, string $dbName, string $dir): array
    {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$dbName}`");

        // tracking table
        $pdo->exec("CREATE TABLE IF NOT EXISTS schema_migrations (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          checksum CHAR(64) NOT NULL
        ) ENGINE=InnoDB");

        $files = glob($dir . '/*.sql') ?: [];
        sort($files);

        $applied = 0; $skippedStmts = 0; $total = 0;
        foreach ($files as $f) {
            $name = basename($f);
            $checksum = hash_file('sha256', $f);
            $rec = $pdo->query("SELECT checksum FROM schema_migrations WHERE name=" . $pdo->quote($name))->fetch(PDO::FETCH_COLUMN);

            if ($rec !== false) {
                if ($rec !== $checksum) {
                    throw new RuntimeException(
                        "DRIFT {$name}: file changed after it was recorded (recorded " . substr($rec, 0, 12) .
                        ", now " . substr($checksum, 0, 12) . "). Migrations are immutable — ship a new numbered migration."
                    );
                }
                continue;
            }

            $statements = self::sqlSplit((string)file_get_contents($f));
            foreach ($statements as $stmt) {
                $stmt = trim($stmt);
                if ($stmt === '') continue;
                $body = trim(preg_replace('/^--[^\n]*(\n|$)/m', '', $stmt));
                if ($body === '') continue;

                // invariant: portable migrations only
                if (preg_match('/^(CREATE|DROP|ALTER)\s+DATABASE\b/i', $body)) {
                    throw new RuntimeException(
                        "INVALID MIGRATION {$name}: contains {$stmt} — migrations must be portable " .
                        "(no CREATE/DROP/ALTER DATABASE; the runner selects the target database)."
                    );
                }
                // invariant: `USE <db>` hardcodes a database name — skip explicitly
                if (preg_match('/^USE\s+`?[\w$]+`?;?$/i', $body)) {
                    $skippedStmts++;
                    continue;
                }

                try {
                    $pdo->exec($stmt);
                    $applied++;
                } catch (Throwable $e) {
                    $msg = $e->getMessage();
                    if (str_contains($msg, 'already exists') || str_contains($msg, 'Duplicate entry')
                        || str_contains($msg, 'Duplicate column name') || str_contains($msg, 'Duplicate key name')) {
                        $skippedStmts++;
                        continue;
                    }
                    throw new RuntimeException("FAIL {$name}: {$msg} — " . substr($stmt, 0, 100));
                }
            }
            $pdo->exec("INSERT INTO schema_migrations (name, checksum) VALUES (" . $pdo->quote($name) . ", " . $pdo->quote($checksum) . ")");
            $total++;
        }
        return ['applied' => $applied, 'skipped' => $skippedStmts, 'total' => $total, 'files' => array_map('basename', $files)];
    }

    /** Split SQL into statements (respects quotes, -- comments, /* * / comments). */
    public static function sqlSplit(string $sql): array
    {
        $out = []; $cur = ''; $n = strlen($sql); $q = null; $lc = false; $bc = false;
        for ($i = 0; $i < $n; $i++) {
            $c = $sql[$i]; $nxt = $sql[$i + 1] ?? '';
            if ($lc) { $cur .= $c; if ($c === "\n") $lc = false; continue; }
            if ($bc) { $cur .= $c; if ($c === '*' && $nxt === '/') { $cur .= $nxt; $i++; $bc = false; } continue; }
            if ($q) { $cur .= $c; if ($c === '\\' && $nxt !== '') { $cur .= $nxt; $i++; continue; } if ($c === $q) $q = null; continue; }
            if ($c === '-' && $nxt === '-') { $lc = true; $cur .= $c; continue; }
            if ($c === '/' && $nxt === '*') { $bc = true; $cur .= $c; continue; }
            if ($c === "'" || $c === '"' || $c === '`') { $q = $c; $cur .= $c; continue; }
            if ($c === ';') { $out[] = $cur; $cur = ''; continue; }
            $cur .= $c;
        }
        if (trim($cur) !== '') $out[] = $cur;
        return $out;
    }

    /** Validate a migrations directory against the portability invariants (CI). */
    public static function validate(string $dir): array
    {
        $violations = [];
        foreach (glob($dir . '/*.sql') ?: [] as $f) {
            foreach (self::sqlSplit((string)file_get_contents($f)) as $stmt) {
                $body = trim(preg_replace('/^--[^\n]*(\n|$)/m', '', trim($stmt)));
                if ($body === '') continue;
                if (preg_match('/^(CREATE|DROP|ALTER)\s+DATABASE\b/i', $body)) {
                    $violations[] = basename($f) . ': ' . substr($body, 0, 80);
                }
            }
        }
        return $violations;
    }
}
