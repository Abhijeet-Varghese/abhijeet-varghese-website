<?php
declare(strict_types=1);
namespace AvOS\Database;

use AvOS\Config\Config;
use AvOS\Errors\DatabaseException;
use PDO;
use PDOException;
use Throwable;

/**
 * Database connection (Phase 2 §3A.7).
 *
 * PDO, prepared statements, utf8mb4, exceptions on error, emulation OFF so
 * placeholders are bound server-side. Lazily connects: constructing this object
 * must not require a reachable database (the CLI needs to run `status` against
 * a server that may be down and report honestly).
 *
 * There is deliberately no method that accepts a caller-built SQL fragment
 * containing user input. Query building belongs in repositories (Phase 3F+).
 */
final class Connection
{
    private ?PDO $pdo = null;
    private int $transactionDepth = 0;

    public function __construct(
        private readonly string $host,
        private readonly string $name,
        private readonly string $user,
        private readonly string $pass,
        private readonly string $charset = 'utf8mb4',
        private readonly int $port = 3306,
    ) {}

    public static function fromConfig(Config $c): self
    {
        return new self(
            (string)$c->get('database.host'),
            (string)$c->get('database.name'),
            (string)$c->get('database.user'),
            (string)$c->get('database.pass'),
            (string)$c->get('database.charset', 'utf8mb4'),
            (int)$c->get('database.port', 3306),
        );
    }

    /** Connect without selecting a database — needed to CREATE it. */
    public function serverPdo(): PDO
    {
        return $this->makePdo(sprintf('mysql:host=%s;port=%d;charset=%s', $this->host, $this->port, $this->charset));
    }

    public function pdo(): PDO
    {
        if ($this->pdo === null) {
            if ($this->name === '') {
                throw new DatabaseException('Database name is not configured.');
            }
            $this->pdo = $this->makePdo(sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $this->host, $this->port, $this->name, $this->charset,
            ));
        }
        return $this->pdo;
    }

    private function makePdo(string $dsn): PDO
    {
        try {
            return new PDO($dsn, $this->user, $this->pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
                // Strict mode: silent truncation is a data-integrity bug.
                PDO::MYSQL_ATTR_INIT_COMMAND =>
                    "SET SESSION sql_mode='STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION', time_zone='+00:00'",
            ]);
        } catch (PDOException $e) {
            // Never surface the DSN or credentials.
            throw new DatabaseException('Database connection failed.');
        }
    }

    public function databaseName(): string { return $this->name; }

    /** @param array<int|string,mixed> $params */
    public function run(string $sql, array $params = []): \PDOStatement
    {
        $st = $this->pdo()->prepare($sql);
        $st->execute($params);
        return $st;
    }

    public function one(string $sql, array $params = []): ?array
    {
        $row = $this->run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public function all(string $sql, array $params = []): array
    {
        return $this->run($sql, $params)->fetchAll();
    }

    public function scalar(string $sql, array $params = []): mixed
    {
        return $this->run($sql, $params)->fetchColumn();
    }

    /**
     * Nested-safe transaction. MariaDB cannot nest, so inner scopes use
     * savepoints; only the outermost commit is real.
     */
    public function transaction(callable $fn): mixed
    {
        $this->begin();
        try {
            $result = $fn($this);
            $this->commit();
            return $result;
        } catch (Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function begin(): void
    {
        if ($this->transactionDepth === 0) $this->pdo()->beginTransaction();
        else $this->pdo()->exec('SAVEPOINT sp' . $this->transactionDepth);
        $this->transactionDepth++;
    }

    public function commit(): void
    {
        if ($this->transactionDepth === 0) return;
        $this->transactionDepth--;
        if ($this->transactionDepth === 0) $this->pdo()->commit();
        else $this->pdo()->exec('RELEASE SAVEPOINT sp' . $this->transactionDepth);
    }

    public function rollback(): void
    {
        if ($this->transactionDepth === 0) return;
        $this->transactionDepth--;
        if ($this->transactionDepth === 0) {
            if ($this->pdo()->inTransaction()) $this->pdo()->rollBack();
        } else {
            $this->pdo()->exec('ROLLBACK TO SAVEPOINT sp' . $this->transactionDepth);
        }
    }

    public function inTransaction(): bool { return $this->transactionDepth > 0; }

    /** Health check for diagnostics. Never leaks credentials. */
    public function health(): array
    {
        try {
            $t0 = microtime(true);
            $version = (string)$this->serverPdo()->query('SELECT VERSION()')->fetchColumn();
            $connectMs = (int)round((microtime(true) - $t0) * 1000);

            $dbExists = false;
            $tables = 0;
            if ($this->name !== '') {
                $st = $this->serverPdo()->prepare(
                    'SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?'
                );
                $st->execute([$this->name]);
                $dbExists = ((int)$st->fetchColumn()) > 0;
                if ($dbExists) {
                    $st = $this->serverPdo()->prepare(
                        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?'
                    );
                    $st->execute([$this->name]);
                    $tables = (int)$st->fetchColumn();
                }
            }
            return [
                'ok' => true, 'server_version' => $version, 'connect_ms' => $connectMs,
                'database_exists' => $dbExists, 'table_count' => $tables,
            ];
        } catch (Throwable) {
            return ['ok' => false, 'server_version' => null, 'connect_ms' => null,
                    'database_exists' => false, 'table_count' => 0];
        }
    }
}
