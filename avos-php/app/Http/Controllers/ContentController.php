<?php
declare(strict_types=1);
namespace AvOS\Http\Controllers;

use AvOS\Api\ApiResult;
use AvOS\Domain\Content\ContentService;
use AvOS\Domain\Content\PublishingService;
use AvOS\Domain\Content\VersionService;
use AvOS\Http\Request;

/**
 * The single authenticated content controller (Phase 3E §3E.15).
 *
 * One class serves pages, projects, articles and experience because the HTTP
 * shape is identical for all four; only the injected service differs. Four
 * near-identical controllers would be four places for a security check to
 * drift apart.
 *
 * Thin by rule: no SQL, no permission logic (middleware + Authorizer own that),
 * no business rules. It parses, delegates, and wraps in the Phase 3D envelope.
 */
final class ContentController
{
    /** @param array<string,ContentService> $services keyed by content type */
    public function __construct(
        private readonly array $services,
        private readonly PublishingService $publishing,
        private readonly VersionService $versions,
    ) {}

    private function svc(string $type): ContentService
    {
        return $this->services[$type]
            ?? throw \AvOS\Api\ApiException::notFound('Unknown content type.');
    }

    public function index(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->svc($type)->listAdmin($r->query), $r->requestId);
    }

    public function show(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->svc($type)->getAdmin($r->intParam('id')), $r->requestId);
    }

    public function create(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->svc($type)->create($r->json()), $r->requestId, 201);
    }

    /** PUT and PATCH share a handler: both are partial merges over the row. */
    public function update(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->svc($type)->update($r->intParam('id'), $r->json()), $r->requestId);
    }

    public function destroy(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->svc($type)->delete($r->intParam('id')), $r->requestId);
    }

    public function publish(Request $r, string $type): ApiResult
    {
        $note = (string)($r->json()['note'] ?? '');
        return ApiResult::ok($this->publishing->publish($type, $r->intParam('id'), $note), $r->requestId);
    }

    public function unpublish(Request $r, string $type): ApiResult
    {
        $note = (string)($r->json()['note'] ?? '');
        return ApiResult::ok($this->publishing->unpublish($type, $r->intParam('id'), $note), $r->requestId);
    }

    public function preflight(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->publishing->preflight($type, $r->intParam('id')), $r->requestId);
    }

    public function versionIndex(Request $r, string $type): ApiResult
    {
        return ApiResult::ok($this->versions->list($type, $r->intParam('id'), $r->query), $r->requestId);
    }

    public function versionShow(Request $r, string $type): ApiResult
    {
        return ApiResult::ok(
            $this->versions->get($type, $r->intParam('id'), $r->intParam('version')),
            $r->requestId,
        );
    }

    public function versionRestore(Request $r, string $type): ApiResult
    {
        return ApiResult::ok(
            $this->versions->restore($type, $r->intParam('id'), $r->intParam('version')),
            $r->requestId,
        );
    }

    /** POST /api/v1/experience/reorder */
    public function reorder(Request $r, string $type): ApiResult
    {
        $svc = $this->svc($type);
        if (!$svc instanceof \AvOS\Domain\Content\ExperienceService) {
            throw \AvOS\Api\ApiException::notFound('Reorder is not supported for this content type.');
        }
        $body = $r->json();
        $positions = is_array($body['positions'] ?? null) ? $body['positions'] : [];
        return ApiResult::ok($svc->reorder($positions), $r->requestId);
    }
}
