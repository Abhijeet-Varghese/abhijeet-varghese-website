<?php
declare(strict_types=1);
namespace AvOS\Migration;

use AvOS\Database\Connection;

/**
 * Schema validation (Phase 2 §3B.11).
 *
 * Compares the LIVE MariaDB schema against what the migration files declare,
 * and reports differences. It deliberately does NOT correct anything: silent
 * self-healing would hide drift, which is the failure mode this exists to catch.
 *
 * The migration files are the machine-readable source of truth;
 * DATABASE-SCHEMA.md is the human contract that the files implement.
 */
final class SchemaValidator
{
    public function __construct(
        private readonly Connection $db,
        private readonly string $migrationsDir,
    ) {}

    /** Parse expected tables/columns/indexes out of the migration SQL. */
    public function expected(): array
    {
        $tables = [];
        foreach (glob(rtrim($this->migrationsDir, '/') . '/*.sql') ?: [] as $file) {
            $sql = (string)file_get_contents($file);
            $up = MigrationRunner::parse($sql)['up'];
            foreach ($up as $stmt) {
                if (preg_match('/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?\s*\((.*)\)\s*ENGINE/is', $stmt, $m) !== 1) {
                    continue;
                }
                [$name, $body] = [$m[1], $m[2]];
                $cols = [];
                $indexes = [];
                foreach (preg_split('/,\s*\n/', $body) ?: [] as $rawLine) {
                    $l = trim($rawLine);
                    if ($l === '') continue;
                    if (preg_match('/^(UNIQUE\s+KEY|KEY|PRIMARY\s+KEY|CONSTRAINT)/i', $l) === 1) {
                        if (preg_match('/^(?:UNIQUE\s+)?KEY\s+`?(\w+)`?/i', $l, $km) === 1) $indexes[] = $km[1];
                        continue;
                    }
                    if (preg_match('/^`?(\w+)`?\s+([A-Za-z]+)/', $l, $cm) === 1) {
                        $cols[$cm[1]] = strtolower($cm[2]);
                    }
                }
                $tables[$name] = ['columns' => $cols, 'indexes' => $indexes];
            }
        }
        return $tables;
    }

    /**
     * MariaDB has NO native JSON type: `JSON` is an alias for LONGTEXT plus a
     * `json_valid()` CHECK constraint, so information_schema reports longtext.
     * That is correct behaviour, not schema drift. (MySQL 8 differs.)
     */
    private static function typesMatch(string $want, string $live): bool
    {
        if ($live === $want || str_starts_with($live, $want)) return true;
        if ($want === 'json' && $live === 'longtext') return true;
        return false;
    }

    public function validate(): array
    {
        $expected = $this->expected();
        $schema = $this->db->databaseName();

        $liveTables = array_column(
            $this->db->all('SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [$schema]),
            't'
        );
        $liveSet = array_flip($liveTables);

        $missingTables = [];
        $missingColumns = [];
        $wrongTypes = [];
        $missingIndexes = [];

        foreach ($expected as $table => $spec) {
            if (!isset($liveSet[$table])) { $missingTables[] = $table; continue; }

            $liveCols = [];
            foreach ($this->db->all(
                'SELECT COLUMN_NAME AS c, DATA_TYPE AS t FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [$schema, $table]
            ) as $row) {
                $liveCols[$row['c']] = strtolower($row['t']);
            }
            foreach ($spec['columns'] as $col => $type) {
                if (!array_key_exists($col, $liveCols)) { $missingColumns[] = "{$table}.{$col}"; continue; }
                // Compare the base type only; length/attributes are not parsed.
                $want = preg_replace('/\(.*/', '', $type) ?? $type;
                if ($want !== '' && !self::typesMatch($want, $liveCols[$col])) {
                    $wrongTypes[] = "{$table}.{$col}: expected {$want}, found {$liveCols[$col]}";
                }
            }

            $liveIdx = array_unique(array_column(
                $this->db->all(
                    'SELECT INDEX_NAME AS i FROM information_schema.STATISTICS
                     WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [$schema, $table]
                ), 'i'
            ));
            foreach ($spec['indexes'] as $idx) {
                if (!in_array($idx, $liveIdx, true)) $missingIndexes[] = "{$table}.{$idx}";
            }
        }

        // Tables present but not declared. The migration ledger is ours; any
        // other extra table is genuinely unexpected in a fresh database.
        $unexpected = [];
        foreach ($liveTables as $t) {
            if (!isset($expected[$t]) && $t !== MigrationRunner::LEDGER) $unexpected[] = $t;
        }

        $ok = $missingTables === [] && $missingColumns === [] && $wrongTypes === [] && $missingIndexes === [];

        return [
            'ok'                => $ok,
            'expected_tables'   => count($expected),
            'present_tables'    => count($liveTables),
            'missing_tables'    => $missingTables,
            'unexpected_tables' => $unexpected,
            'missing_columns'   => $missingColumns,
            'wrong_types'       => $wrongTypes,
            'missing_indexes'   => $missingIndexes,
        ];
    }
}
