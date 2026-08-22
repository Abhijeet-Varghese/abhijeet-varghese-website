<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Content\Cache\CacheInvalidatorInterface;
use AvOS\Content\ContentDocument;
use AvOS\Content\ContentState;
use AvOS\Content\ContentType;
use AvOS\Content\Events\ContentEvent;
use AvOS\Content\Events\EventDispatcher;
use AvOS\Content\RoutePath;
use AvOS\Database\Connection;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

/**
 * The publishing service (Phase 3E §3E.9).
 *
 * Publishing is the only path from private content to a public URL, so it is
 * the one place worth being pedantic:
 *
 *   1. permission          publishing.publish (checked here as well as in
 *                          middleware — defence in depth, not duplication of
 *                          logic: both call the one Authorizer)
 *   2. state transition    validated by ContentState, never assigned directly
 *   3. preflight           content must PASS validation to go live (§3E.14:
 *                          "invalid content must never reach the published
 *                          state"). Failures return 409 with the failing checks.
 *   4. route activation    inside the same transaction as the status change,
 *                          so a published page without a route is impossible
 *   5. version snapshot    always
 *   6. audit               always
 *   7. cache signals       content + route (+ navigation when a route moved)
 *   8. event               emitted AFTER commit, so a listener can never see
 *                          a publish that later rolled back
 *
 * No queue, no Redis, no external service. The event abstraction is what the
 * Phase 3P queue will subscribe to.
 */
final class PublishingService
{
    /** @param array<string,ContentService> $services keyed by content type */
    public function __construct(
        private readonly Connection $db,
        private readonly array $services,
        private readonly VersionRepository $versions,
        private readonly RouteRepository $routes,
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
        return $this->services[$type]
            ?? throw ApiException::notFound('Unknown content type.');
    }

    /**
     * Dry run of every publish gate. Exposed so the admin can show why a
     * publish would fail BEFORE attempting it.
     *
     * @return array{ok:bool,checks:array<string,array{ok:bool,detail:string}>}
     */
    public function preflight(string $type, int $id): array
    {
        $repo = $this->serviceFor($type)->repository();
        $row = $repo->findById($id);
        if ($row === null) throw ApiException::notFound('Content not found.');

        $checks = [];

        $title = trim((string)($row['title'] ?? ''));
        $checks['title'] = ['ok' => $title !== '', 'detail' => $title !== '' ? 'present' : 'title is empty'];

        if ($repo->hasSlug()) {
            $slug = (string)($row['slug'] ?? '');
            $slugErrors = \AvOS\Content\Slug::errors($slug);
            $checks['slug'] = [
                'ok' => $slugErrors === [],
                'detail' => $slugErrors === [] ? $slug : (string)reset($slugErrors),
            ];
        }

        $transitionOk = ContentState::canTransition((string)$row['status'], ContentState::PUBLISHED);
        $checks['state'] = [
            'ok' => $transitionOk,
            'detail' => $transitionOk
                ? $row['status'] . ' → published'
                : 'cannot publish from ' . $row['status'],
        ];

        // The stored document must still parse. A row edited outside the API
        // (a migration, a manual SQL fix) could otherwise publish broken JSON.
        $docOk = true;
        $docDetail = 'valid';
        foreach ($repo->writable() as $col => $kind) {
            if ($kind !== 'json' || !array_key_exists($col, $row)) continue;
            try {
                ContentDocument::validate(ContentDocument::decode($row[$col]), $col);
            } catch (ApiException $e) {
                $docOk = false;
                $docDetail = $col . ': ' . $e->getMessage();
            }
        }
        $checks['content'] = ['ok' => $docOk, 'detail' => $docDetail];

        if ($repo->hasSlug() && ContentType::isRoutable($type)) {
            $path = $this->pathFor($type, $id, $row);
            $taken = $this->routes->pathTakenByOther($path, $type, $id);
            $checks['route'] = [
                'ok' => !$taken,
                'detail' => $taken ? $path . ' is already claimed by other content' : $path,
            ];
        }

        $ok = true;
        foreach ($checks as $c) if (!$c['ok']) $ok = false;
        return ['ok' => $ok, 'checks' => $checks];
    }

    public function publish(string $type, int $id, string $note = ''): array
    {
        $this->requirePermission('publishing.publish');
        $service = $this->serviceFor($type);
        $repo = $service->repository();

        $row = $repo->findById($id);
        if ($row === null) throw ApiException::notFound('Content not found.');

        $from = (string)$row['status'];
        ContentState::requireTransition($from, ContentState::PUBLISHED);

        $pre = $this->preflight($type, $id);
        if (!$pre['ok']) {
            throw new ApiException(
                ErrorCatalog::CONFLICT,
                'Content did not pass publish preflight.',
                ['failed_checks' => array_keys(array_filter($pre['checks'], static fn(array $c): bool => !$c['ok'])),
                 'checks' => $pre['checks']],
            );
        }

        $actor = $this->authz->userId();
        $publishedAt = gmdate('Y-m-d H:i:s');
        $routed = null;

        $version = $this->db->transaction(function () use (
            $repo, $type, $id, $row, $publishedAt, $actor, $note, &$routed
        ): int {
            $repo->setStatus($id, ContentState::PUBLISHED, $publishedAt, $actor);

            if ($repo->hasSlug() && ContentType::isRoutable($type)) {
                $path = $this->pathFor($type, $id, $row);
                $this->routes->activate($type, $id, $path, (string)($row['template'] ?? 'default'));
                $routed = $path;
            }

            $fresh = $repo->findById($id) ?? [];
            return $this->versions->append(
                $type, $id, $repo->versionPayload($fresh), $actor,
                $note !== '' ? $note : 'published',
            );
        });

        $this->audit->log($actor, $type . '.publish', $type, $id,
            ['status' => $from], ['status' => ContentState::PUBLISHED, 'published_at' => $publishedAt]);

        $this->cache->contentChanged($type, $id);
        if ($routed !== null) {
            $this->cache->routeChanged($routed);
            $this->cache->navigationChanged();
        }

        $this->events->dispatch(ContentEvent::make(
            ContentEvent::PUBLISHED, $type, $id, $actor, $this->requestId,
            ['from' => $from, 'version' => $version, 'path' => $routed],
        ));

        return [
            'id' => $id, 'type' => $type, 'status' => ContentState::PUBLISHED,
            'published_at' => $publishedAt, 'version' => $version, 'path' => $routed,
        ];
    }

    public function unpublish(string $type, int $id, string $note = ''): array
    {
        $this->requirePermission('publishing.publish');
        $service = $this->serviceFor($type);
        $repo = $service->repository();

        $row = $repo->findById($id);
        if ($row === null) throw ApiException::notFound('Content not found.');

        $from = (string)$row['status'];
        ContentState::requireTransition($from, ContentState::UNPUBLISHED);

        $actor = $this->authz->userId();
        $routed = null;

        $version = $this->db->transaction(function () use ($repo, $type, $id, $actor, $note, &$routed): int {
            // published_at is cleared: it records "is live since", and the
            // content is no longer live. The version history still holds the
            // moment it was published.
            $repo->setStatus($id, ContentState::UNPUBLISHED, null, $actor);

            if ($repo->hasSlug() && ContentType::isRoutable($type)) {
                $routed = $this->routes->deactivate($type, $id);
            }

            $fresh = $repo->findById($id) ?? [];
            return $this->versions->append(
                $type, $id, $repo->versionPayload($fresh), $actor,
                $note !== '' ? $note : 'unpublished',
            );
        });

        $this->audit->log($actor, $type . '.unpublish', $type, $id,
            ['status' => $from], ['status' => ContentState::UNPUBLISHED]);

        $this->cache->contentChanged($type, $id);
        if ($routed !== null) { $this->cache->routeChanged($routed); $this->cache->navigationChanged(); }

        $this->events->dispatch(ContentEvent::make(
            ContentEvent::UNPUBLISHED, $type, $id, $actor, $this->requestId,
            ['from' => $from, 'version' => $version, 'path' => $routed],
        ));

        return ['id' => $id, 'type' => $type, 'status' => ContentState::UNPUBLISHED, 'version' => $version];
    }

    /**
     * Canonical path for a row.
     *
     * Rule (deterministic, and chosen from evidence rather than taste):
     *   - If a canonical route already exists whose LAST segment equals the
     *     current slug, keep it. That preserves a deliberately nested path —
     *     the live Orange case study lives at
     *     /experience-design/orange-business-executive-briefing-center — across
     *     every republish.
     *   - Otherwise the path is "/" + slug, and RouteRepository::activate()
     *     leaves a 301 behind at the old path.
     */
    private function pathFor(string $type, int $id, array $row): string
    {
        $slug = (string)($row['slug'] ?? '');
        $existing = $this->routes->findCanonicalFor($type, $id);
        if ($existing !== null) {
            $path = RoutePath::normalise((string)$existing['path']);
            $segments = explode('/', trim($path, '/'));
            if (end($segments) === $slug && $slug !== '') return $path;
        }
        return RoutePath::build($slug);
    }
}
