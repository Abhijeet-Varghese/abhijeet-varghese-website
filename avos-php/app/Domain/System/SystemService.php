<?php
declare(strict_types=1);
namespace AvOS\Domain\System;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Config\Config;
use AvOS\Database\Connection;
use AvOS\Identity\EmailIdentity;

/**
 * Service example (Phase 3D §3D.15). Business rules live here; the controller
 * stays thin and the repository stays SQL-only.
 */
final class SystemService
{
    public function __construct(
        private readonly Connection $db,
        private readonly Config $config,
        private readonly EmailIdentity $identity,
        private readonly SettingsRepository $settings,
    ) {}

    /**
     * Health (Phase 3D §3D.16).
     *
     * Distinguishes application-alive / database-reachable / configuration-valid
     * WITHOUT leaking anything: no host, no username, no path, no key state
     * beyond "set and long enough", no private email.
     *
     * @param bool $detailed only true for authenticated callers
     */
    public function health(bool $detailed = false): array
    {
        $dbOk = false;
        $dbLatency = null;
        try {
            $t0 = microtime(true);
            $this->db->scalar('SELECT 1');
            $dbLatency = (int)round((microtime(true) - $t0) * 1000);
            $dbOk = true;
        } catch (\Throwable) {
            $dbOk = false;
        }

        $configProblems = $this->config->productionProblems();
        $configValid = $configProblems === [];

        $status = $dbOk && $configValid ? 'ok' : ($dbOk ? 'degraded' : 'unhealthy');

        // PUBLIC shape: liveness booleans only.
        $payload = [
            'status'      => $status,
            'application' => 'alive',
            'database'    => $dbOk ? 'reachable' : 'unreachable',
            'config'      => $configValid ? 'valid' : 'invalid',
            'time'        => gmdate('c'),
        ];

        if ($detailed) {
            // AUTHENTICATED shape: still no secrets — booleans and categories.
            $payload['detail'] = [
                'environment'             => $this->config->env(),
                'database_profile'        => (string)$this->config->get('config_meta.db_profile', 'db'),
                'config_source'           => (string)$this->config->get('config_meta.source', 'none'),
                'database_latency_ms'     => $dbLatency,
                'config_outside_webroot'  => (bool)$this->config->get('config_meta.outside_webroot'),
                'private_outside_webroot' => (bool)$this->config->get('config_meta.private_outside_webroot'),
                'enc_key_set'             => (string)$this->config->get('security.enc_key', '') !== '',
                'owner_email_set'         => $this->identity->hasOwner(),
                'config_problem_count'    => count($configProblems),
                'php_version'             => PHP_VERSION,
                'extensions'              => [
                    'pdo_mysql' => extension_loaded('pdo_mysql'),
                    'mbstring'  => extension_loaded('mbstring'),
                    'gd'        => extension_loaded('gd'),
                    'imagick'   => extension_loaded('imagick'),
                ],
            ];
        }
        return $payload;
    }

    /** Paginated settings — demonstrates QuerySpec + Pagination end to end. */
    public function listSettings(array $query, bool $publicOnly): array
    {
        $spec = (new QuerySpec(
            SettingsRepository::FILTERABLE,
            SettingsRepository::SORTABLE,
            'skey',
        ))->apply($query);

        $page = Pagination::fromQuery($query);
        $result = $this->settings->paginate($spec, $page, $publicOnly);

        return $page->envelope($result['items'], $result['total']);
    }

    public function getSetting(string $key, bool $publicOnly): array
    {
        $row = $this->settings->findByKey($key, $publicOnly);
        if ($row === null) throw new ApiException(ErrorCatalog::NOT_FOUND, 'Setting not found.');
        return $row;
    }
}
