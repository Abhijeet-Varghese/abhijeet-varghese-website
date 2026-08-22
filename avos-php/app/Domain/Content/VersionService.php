<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Api\Pagination;
use AvOS\Content\Cache\CacheInvalidatorInterface;
use AvOS\Content\ContentState;
use AvOS\Content\Events\ContentEvent;
use AvOS\Content\Events\EventDispatcher;
use AvOS\Database\Connection;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

/**
 * Version listing and restore (Phase 3E §3E.12 / §3E.21).
 *
 * Restore is deliberately NOT a rollback. It replays an old payload as a new
 * edit and appends a NEW version, so the history between the restored version
 * and now stays intact and auditable. "No destructive deletion of history."
 *
 * Restore also never changes publication state by itself. Bringing back an old
 * draft must not silently republish it — the caller publishes afterwards, with
 * the publishing permission that requires.
 */
final class VersionService
{
    /** @param array<string,ContentService> $services keyed by content type */
    public function __construct(
        private readonly Connection $db,
        private readonly array $services,
        private readonly VersionRepository $versions,
        private readonly AuditLogger $audit,
        private readonly EventDispatcher $events,
        private readonly CacheInvalidatorInterface $cache,
        private readonly Authorizer $authz,
        private readonly string $requestId = '',
    ) {}


    /**
     * Permission guard that speaks HTTP.
     *
     * The Authorizer is the single source of the decision (Phase 3C), but it
     * raises AppException. Calling it from a service without translating would
     * let a 403 escape as a 500 whenever the service is used outside the HTTP
     * middleware chain — which is exactly how the test suite calls it.
     */
    private function requirePermission(string $code): void
    {
        try {
            $this->authz->requirePermission($code);
        } catch (\AvOS\Errors\AppException $e) {
            throw new ApiException(
                $e->errorCode() === 'UNAUTHENTICATED'
                    ? ErrorCatalog::UNAUTHORIZED
                    : ErrorCatalog::FORBIDDEN,
            );
        }
    }

    private function serviceFor(string $type): ContentService
    {
        return $this->services[$type] ?? throw ApiException::notFound('Unknown content type.');
    }

    /** Version list. Summaries only — payloads need an explicit fetch. */
    public function list(string $type, int $id, array $query): array
    {
        $repo = $this->serviceFor($type)->repository();
        if ($repo->findById($id, includeDeleted: true) === null) {
            throw ApiException::notFound('Content not found.');
        }
        $page = Pagination::fromQuery($query);
        $res = $this->versions->paginate($type, $id, $page);
        return $page->envelope(array_map(
            static fn(array $r): array => VersionRepository::toSummary($r),
            $res['items'],
        ), $res['total']);
    }

    public function get(string $type, int $id, int $version): array
    {
        $repo = $this->serviceFor($type)->repository();
        if ($repo->findById($id, includeDeleted: true) === null) {
            throw ApiException::notFound('Content not found.');
        }
        $row = $this->versions->find($type, $id, $version);
        if ($row === null) throw ApiException::notFound('Version not found.');

        return VersionRepository::toSummary($row)
            + ['payload' => VersionRepository::decodePayload($row)];
    }

    /**
     * Restore version N as a new version.
     *
     * @return array{id:int,type:string,restored_from:int,version:int,status:string}
     */
    public function restore(string $type, int $id, int $version): array
    {
        $this->requirePermission('versions.restore');

        $service = $this->serviceFor($type);
        $repo = $service->repository();

        $current = $repo->findById($id);
        if ($current === null) throw ApiException::notFound('Content not found.');

        $target = $this->versions->find($type, $id, $version);
        if ($target === null) throw ApiException::notFound('Version not found.');

        $payload = VersionRepository::decodePayload($target);
        if ($payload === []) throw ApiException::conflict('That version has no restorable payload.');

        $actor = $this->authz->userId();
        $currentStatus = (string)$current['status'];

        // Status inside a version payload is HISTORY, not an instruction.
        // Restoring must not publish or unpublish anything.
        unset($payload['status']);

        // A restored slug can collide with content created since. Detect it and
        // refuse, rather than restoring a broken duplicate URL.
        if ($repo->hasSlug() && isset($payload['slug'])
            && $repo->slugTaken((string)$payload['slug'], $id)) {
            throw ApiException::conflict(
                'The slug in that version is now used by other content.',
            );
        }

        $data = [];
        foreach ($repo->writable() as $col => $kind) {
            if (!array_key_exists($col, $payload)) continue;
            $v = $payload[$col];
            $data[$col] = match ($kind) {
                'json'    => \AvOS\Content\ContentDocument::encode(
                                is_array($v) ? $v : \AvOS\Content\ContentDocument::empty()),
                'jsonmap' => $v === null ? null : (string)json_encode($v, JSON_UNESCAPED_SLASHES),
                'bool'    => (int)(bool)$v,
                default   => $v,
            };
        }
        $data['updated_by'] = $actor;

        $newVersion = $this->db->transaction(function () use ($repo, $type, $id, $data, $actor, $version): int {
            $repo->update($id, $data);
            $fresh = $repo->findById($id) ?? [];
            return $this->versions->append(
                $type, $id, $repo->versionPayload($fresh), $actor,
                'restored from version ' . $version,
            );
        });

        $this->audit->log($actor, $type . '.version_restore', $type, $id,
            ['version' => (int)($this->versions->latest($type, $id)['version'] ?? 0) - 1],
            ['restored_from' => $version, 'new_version' => $newVersion]);

        $this->cache->contentChanged($type, $id);
        $this->events->dispatch(ContentEvent::make(
            ContentEvent::RESTORED, $type, $id, $actor, $this->requestId,
            ['restored_from' => $version, 'version' => $newVersion],
        ));

        return [
            'id' => $id, 'type' => $type,
            'restored_from' => $version, 'version' => $newVersion,
            // Unchanged by design — see the note above.
            'status' => $currentStatus,
        ];
    }

    /** Guard used by tests and diagnostics: history must only ever grow. */
    public function count(string $type, int $id): int
    { return $this->versions->count($type, $id); }

    public function stateOf(string $type, int $id): string
    {
        $row = $this->serviceFor($type)->repository()->findById($id, includeDeleted: true);
        return $row === null ? ContentState::ARCHIVED : (string)$row['status'];
    }
}
