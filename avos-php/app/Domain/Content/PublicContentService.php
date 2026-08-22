<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;
use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Content\ContentState;
use AvOS\Content\ContentType;
use AvOS\Content\RoutePath;

/**
 * The public read surface (Phase 3E §3E.16).
 *
 * A SEPARATE service, not a flag on the management service. That separation is
 * the whole point: there is no code path here that can be talked into returning
 * a draft, because published-only is baked into every query rather than passed
 * in as a parameter a caller might get wrong.
 *
 * What a public response never contains — enforced by the repositories'
 * `publicFields()` allow-lists, not by stripping afterwards:
 *   internal ids · author/actor ids · created_by / updated_by · deleted_at
 *   publish_at (scheduling intent) · internal notes · audit records
 *   version history · owner identity · any private configuration
 */
final class PublicContentService
{
    /** @param array<string,ContentService> $services keyed by content type */
    public function __construct(
        private readonly array $services,
        private readonly RouteRepository $routes,
        private readonly TaxonomyRepository $refs,
    ) {}

    private function repo(string $type): AbstractContentRepository
    {
        $svc = $this->services[$type] ?? throw ApiException::notFound('Unknown content type.');
        return $svc->repository();
    }

    /** @return string[] */
    public function types(): array { return ContentType::all(); }

    /**
     * Published index for one type. Status is NOT a filterable field here: a
     * public caller must not be able to ask for `?status=draft` at all.
     */
    public function index(string $type, array $query): array
    {
        $repo = $this->repo($type);
        $filterable = array_values(array_filter(
            $repo->filterable(),
            static fn(string $f): bool => $f !== 'status' && $f !== 'author_id',
        ));
        $query += ['order' => $repo->defaultOrder()];
        $spec = (new QuerySpec($filterable, $repo->sortable(), $repo->defaultSort()))->apply($query);
        $page = Pagination::fromQuery($query);

        $res = $repo->paginate($spec, $page, publishedOnly: true);

        $items = array_map(function (array $r) use ($repo, $type): array {
            $out = $repo->toPublic($r);
            if ($type === ContentType::ARTICLE) {
                $out['categories'] = $this->refs->categorySlugs((int)$r['id']);
                $out['tags'] = $this->refs->tagSlugs((int)$r['id']);
            }
            return $out;
        }, $res['items']);

        return $page->envelope($items, $res['total']);
    }

    /**
     * Published item by slug. A draft, an unpublished item and a slug that
     * never existed are ALL a plain 404 with the same message — an attacker
     * must not be able to distinguish "exists but hidden" from "absent".
     */
    public function bySlug(string $type, string $slug): array
    {
        $repo = $this->repo($type);
        if (!$repo->hasSlug()) throw ApiException::notFound('Not found.');

        $row = $repo->findPublishedBySlug($slug);
        if ($row === null) throw ApiException::notFound('Not found.');

        $out = $repo->toPublic($row);
        if ($type === ContentType::ARTICLE) {
            $out['categories'] = $this->refs->categorySlugs((int)$row['id']);
            $out['tags'] = $this->refs->tagSlugs((int)$row['id']);
        }
        return $out;
    }

    /** The ordered published timeline. Experience has no slug, so no bySlug. */
    public function experience(array $query): array
    {
        $repo = $this->repo(ContentType::EXPERIENCE);
        // Ascending: the timeline reads from position 1 downwards.
        $query += ['order' => 'asc'];
        $spec = (new QuerySpec(['era'], $repo->sortable(), 'position'))->apply($query);
        $page = Pagination::fromQuery($query);
        $res = $repo->paginate($spec, $page, publishedOnly: true);
        return $page->envelope(
            array_map(static fn(array $r): array => $repo->toPublic($r), $res['items']),
            $res['total'],
        );
    }

    /**
     * Path → content resolution (§3E.11). Also answers redirects, so the
     * frontend has one call for "what lives at this URL?".
     */
    public function resolve(string $rawPath): array
    {
        if ($rawPath === '' || $rawPath[0] !== '/') {
            throw ApiException::validation(['path' => 'must start with /']);
        }
        if (strlen($rawPath) > RoutePath::MAX_LENGTH) {
            throw ApiException::validation(['path' => 'is too long']);
        }
        $path = RoutePath::normalise($rawPath);

        $redirect = $this->routes->findRedirect($path);
        if ($redirect !== null) {
            return [
                'match'  => 'redirect',
                'status' => (int)$redirect['status_code'],
                'to'     => (string)$redirect['to_path'],
            ];
        }

        $hit = $this->routes->resolvePublic($path);
        if ($hit === null) return ['match' => 'none', 'status' => 404];

        return [
            'match'    => 'content',
            'status'   => 200,
            'path'     => $hit['path'],
            'type'     => $hit['entity_type'],
            'template' => $hit['template'],
            'content'  => $this->bySlugFromRoute($hit['entity_type'], (int)$hit['entity_id']),
        ];
    }

    private function bySlugFromRoute(string $type, int $id): array
    {
        $repo = $this->repo($type);
        $row = $repo->findPublishedById($id);
        if ($row === null) throw ApiException::notFound('Not found.');
        $out = $repo->toPublic($row);
        if ($type === ContentType::ARTICLE) {
            $out['categories'] = $this->refs->categorySlugs($id);
            $out['tags'] = $this->refs->tagSlugs($id);
        }
        return $out;
    }

    /** Counts of published content per type. Booleans and integers only. */
    public function summary(): array
    {
        $out = [];
        foreach (ContentType::all() as $type) {
            $repo = $this->repo($type);
            $spec = new QuerySpec([], $repo->sortable(), $repo->defaultSort());
            $out[$type] = $repo->paginate($spec, Pagination::fromQuery(['per_page' => 1]), true)['total'];
        }
        return ['published' => $out, 'states_visible_publicly' => ContentState::PUBLICLY_VISIBLE];
    }
}
