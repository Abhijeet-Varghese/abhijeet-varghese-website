<?php
declare(strict_types=1);
namespace AvOS\Migration;

use AvOS\Database\Connection;
use AvOS\Errors\AppException;
use Throwable;

/**
 * Migration engine (Phase 2 §3B.1).
 *
 * Migrations are `.sql` files named `NNN_name.sql` containing an `-- @UP`
 * section and an optional `-- @DOWN` section.
 *
 * IMPORTANT — MariaDB DDL is NOT transactional. A `CREATE TABLE` cannot be
 * rolled back by a transaction. This engine therefore:
 *   • applies statements one at a time and records the exact statement index
 *     that failed, so partial state is visible rather than silently accepted;
 *   • marks the migration `failed` in the ledger and refuses to continue;
 *   • never reports success for a partially-applied migration.
 * That is the honest behaviour on this platform; claiming atomic DDL would be
 * a lie. Data-only migrations (seeders) DO run in a transaction.
 *
 * Migrations are immutable: a checksum is recorded at apply time and a changed
 * file is reported as tampered rather than silently re-run.
 */
final class MigrationRunner
{
    public const LEDGER = 'avos_migrations';

    public function __construct(
        private readonly Connection $db,
        private readonly string $migrationsDir,
    ) {}

    // ---------------------------------------------------------------- ledger

    public function ensureLedger(): void
    {
        $this->db->pdo()->exec(
            'CREATE TABLE IF NOT EXISTS `' . self::LEDGER . '` (
               id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
               migration VARCHAR(190) NOT NULL,
               checksum CHAR(64) NOT NULL,
               state ENUM("applied","failed") NOT NULL DEFAULT "applied",
               statements INT UNSIGNED NOT NULL DEFAULT 0,
               failed_at_statement INT UNSIGNED NULL,
               error VARCHAR(500) NULL,
               duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
               applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               UNIQUE KEY uq_migration (migration)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    public function createDatabaseIfMissing(): void
    {
        $name = $this->db->databaseName();
        if ($name === '') throw new AppException('Database name is not configured.');
        if (preg_match('/^[A-Za-z0-9_]+$/', $name) !== 1) {
            // Identifier cannot be a bound parameter, so it must be validated.
            throw new AppException('Refusing to create a database with an unsafe name.');
        }
        $this->db->serverPdo()->exec(
            "CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
    }

    // ----------------------------------------------------------- discovery

    /** @return array<string,string> filename => absolute path, ordered */
    public function discover(): array
    {
        $files = glob(rtrim($this->migrationsDir, '/') . '/*.sql') ?: [];
        sort($files, SORT_STRING);
        $out = [];
        foreach ($files as $f) $out[basename($f)] = $f;
        return $out;
    }

    /** @return array<string,array> migration => ledger row */
    public function appliedMap(): array
    {
        $this->ensureLedger();
        $rows = $this->db->all('SELECT * FROM `' . self::LEDGER . '`');
        $out = [];
        foreach ($rows as $r) $out[$r['migration']] = $r;
        return $out;
    }

    public function status(): array
    {
        $applied = $this->appliedMap();
        $out = [];
        foreach ($this->discover() as $name => $path) {
            $sum = hash_file('sha256', $path);
            $row = $applied[$name] ?? null;
            $state = 'pending';
            if ($row !== null) {
                $state = $row['state'] === 'failed'
                    ? 'FAILED'
                    : ($row['checksum'] !== $sum ? 'TAMPERED' : 'applied');
            }
            $out[] = ['migration' => $name, 'state' => $state,
                      'applied_at' => $row['applied_at'] ?? null,
                      'statements' => (int)($row['statements'] ?? 0)];
        }
        // A ledger entry with no file is a real integrity problem.
        foreach ($applied as $name => $row) {
            if (!isset($this->discover()[$name])) {
                $out[] = ['migration' => $name, 'state' => 'MISSING-FILE',
                          'applied_at' => $row['applied_at'], 'statements' => (int)$row['statements']];
            }
        }
        return $out;
    }

    // -------------------------------------------------------------- parsing

    /** @return array{up:string[],down:string[]} */
    public static function parse(string $sql): array
    {
        $up = $sql; $down = '';
        if (preg_match('/^--\s*@DOWN\s*$/mi', $sql) === 1) {
            $parts = preg_split('/^--\s*@DOWN\s*$/mi', $sql, 2);
            $up = $parts[0] ?? '';
            $down = $parts[1] ?? '';
        }
        $up = preg_replace('/^--\s*@UP\s*$/mi', '', $up) ?? $up;
        return ['up' => self::statements($up), 'down' => self::statements($down)];
    }

    /** Split on ';' at end-of-line, ignoring comments and blank statements. */
    private static function statements(string $sql): array
    {
        $sql = preg_replace('/^\s*--[^\n]*$/m', '', $sql) ?? $sql;
        $parts = preg_split('/;\s*$/m', $sql) ?: [];
        $out = [];
        foreach ($parts as $p) {
            $p = trim($p);
            if ($p === '') continue;
            // Portability guard: these belong to the runner, not a migration.
            if (preg_match('/^\s*(USE|CREATE\s+DATABASE|DROP\s+DATABASE|ALTER\s+DATABASE)\b/i', $p) === 1) continue;
            $out[] = $p;
        }
        return $out;
    }

    // --------------------------------------------------------------- apply

    /** @return array{applied:string[],skipped:string[],failed:?array,total_ms:int} */
    public function migrate(bool $dryRun = false): array
    {
        $this->createDatabaseIfMissing();
        $this->ensureLedger();

        $applied = $this->appliedMap();
        $result = ['applied' => [], 'skipped' => [], 'failed' => null, 'total_ms' => 0];

        foreach ($this->discover() as $name => $path) {
            $sum = hash_file('sha256', $path);
            if (isset($applied[$name])) {
                if ($applied[$name]['state'] === 'failed') {
                    $result['failed'] = ['migration' => $name,
                        'error' => 'previously failed; resolve before continuing'];
                    return $result;
                }
                if ($applied[$name]['checksum'] !== $sum) {
                    $result['failed'] = ['migration' => $name,
                        'error' => 'checksum mismatch — migrations are immutable'];
                    return $result;
                }
                $result['skipped'][] = $name;     // idempotency
                continue;
            }

            $parsed = self::parse((string)file_get_contents($path));
            if ($dryRun) { $result['applied'][] = $name . ' (dry-run)'; continue; }

            $t0 = microtime(true);
            $index = 0;
            try {
                foreach ($parsed['up'] as $i => $stmt) {
                    $index = $i + 1;
                    $this->db->pdo()->exec($stmt);
                }
                $ms = (int)round((microtime(true) - $t0) * 1000);
                $this->db->run(
                    'INSERT INTO `' . self::LEDGER . '` (migration, checksum, state, statements, duration_ms)
                     VALUES (?,?,"applied",?,?)',
                    [$name, $sum, count($parsed['up']), $ms],
                );
                $result['applied'][] = $name;
                $result['total_ms'] += $ms;
            } catch (Throwable $e) {
                // Record the failure truthfully. DDL already executed cannot be
                // rolled back on MariaDB — the ledger says so explicitly.
                $this->db->run(
                    'INSERT INTO `' . self::LEDGER . '` (migration, checksum, state, statements, failed_at_statement, error)
                     VALUES (?,?,"failed",?,?,?)
                     ON DUPLICATE KEY UPDATE state="failed", failed_at_statement=VALUES(failed_at_statement), error=VALUES(error)',
                    [$name, $sum, count($parsed['up']), $index, substr($e->getMessage(), 0, 500)],
                );
                $result['failed'] = [
                    'migration' => $name,
                    'statement' => $index,
                    'of'        => count($parsed['up']),
                    'error'     => $e->getMessage(),
                    'note'      => 'DDL is not transactional on MariaDB; earlier statements in this file remain applied.',
                ];
                return $result;
            }
        }
        return $result;
    }

    /** Roll back the most recent applied migration using its @DOWN section. */
    public function rollback(int $steps = 1): array
    {
        $this->ensureLedger();
        $rows = $this->db->all(
            'SELECT * FROM `' . self::LEDGER . '` WHERE state="applied" ORDER BY id DESC LIMIT ' . max(1, $steps)
        );
        $out = [];
        foreach ($rows as $row) {
            $path = rtrim($this->migrationsDir, '/') . '/' . $row['migration'];
            if (!is_file($path)) { $out[] = [$row['migration'], 'skipped: file missing']; continue; }
            $parsed = self::parse((string)file_get_contents($path));
            if ($parsed['down'] === []) { $out[] = [$row['migration'], 'skipped: no @DOWN section']; continue; }
            foreach ($parsed['down'] as $stmt) $this->db->pdo()->exec($stmt);
            $this->db->run('DELETE FROM `' . self::LEDGER . '` WHERE id=?', [$row['id']]);
            $out[] = [$row['migration'], 'rolled back'];
        }
        return $out;
    }

    /** Drop every table in the configured database. Guarded by the caller. */
    public function dropAll(): int
    {
        $name = $this->db->databaseName();
        $tables = $this->db->all(
            'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [$name]
        );
        if ($tables === []) return 0;
        $pdo = $this->db->pdo();
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        foreach ($tables as $row) $pdo->exec('DROP TABLE IF EXISTS `' . $row['t'] . '`');
        $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        return count($tables);
    }
}
