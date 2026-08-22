<?php
declare(strict_types=1);
namespace AvOS\Http\Controllers;

use AvOS\Api\ApiResult;
use AvOS\Domain\System\SystemService;
use AvOS\Http\Request;
use AvOS\Rbac\Authorizer;

/**
 * System endpoints. Thin: no SQL, no business rules, no permission logic.
 */
final class SystemController
{
    public function __construct(
        private readonly SystemService $system,
        private readonly Authorizer $authz,
    ) {}

    /**
     * GET /api/v1/system/health — PUBLIC.
     * Public callers get liveness booleans; authenticated callers additionally
     * get non-secret diagnostics. Neither shape contains a secret.
     */
    public function health(Request $r): ApiResult
    {
        $detailed = $this->authz->isAuthenticated();
        return ApiResult::ok($this->system->health($detailed), $r->requestId);
    }

    /** GET /api/v1/system/settings — requires settings.read. */
    public function listSettings(Request $r): ApiResult
    {
        return ApiResult::ok($this->system->listSettings($r->query, publicOnly: false), $r->requestId);
    }

    /** GET /api/v1/system/settings/{key} — requires settings.read. */
    public function getSetting(Request $r): ApiResult
    {
        return ApiResult::ok($this->system->getSetting($r->param('key'), publicOnly: false), $r->requestId);
    }

    /** GET /api/v1/system/owner-status — OWNER ONLY. Presence booleans only. */
    public function ownerStatus(Request $r): ApiResult
    {
        return ApiResult::ok([
            'owner_confirmed' => true,
            'checked_at'      => gmdate('c'),
        ], $r->requestId);
    }
}
