<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Content\Cache\CacheInvalidatorInterface;
use AvOS\Content\ContentDocument;
use AvOS\Content\ContentState;
use AvOS\Content\Events\ContentEvent;
use AvOS\Content\Events\EventDispatcher;
use AvOS\Content\Slug;
use AvOS\Database\Connection;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

/**
 * Shared content business logic (Phase 3E §3E.1).
 *
 * Controllers hold no business rules; they parse a request, call one method
 * here and return the result. Repositories hold no business rules either; they
 * hold SQL. Everything in between — validation, slug policy, versioning
 * policy, audit, events, cache signals — lives in this class and its four
 * subclasses.
 *
 * ---------------------------------------------------------------------------
 * VERSION CREATION POLICY (§3E.7) — the exact, documented rule
 * ---------------------------------------------------------------------------
 * A version IS created on:
 *   1. create        — always, version 1, note "created"
 *   2. update        — ONLY when the sha256 of the versioned payload changes
 *   3. publish       — always (status is part of the payload, so it changes)
 *   4. unpublish     — always
 *   5. restore       — always, as a NEW version equal to the restored payload
 *
 * A version is NOT created for:
 *   - a read of any kind
 *   - an update whose payload checksum is unchanged (a no-op save)
 *   - soft delete (audited, but the content did not change)
 *   - route hit counters, cache signals, audit writes
 *   - reordering that does not alter a versioned column
 *
 * Rule 2 is what stops an editor's autosave from producing a thousand
 * identical versions, and it is checksum-based rather than heuristic so it
 * cannot silently miss a real change.
 * ---------------------------------------------------------------------------
 */
abstract class ContentService
{
    public function __construct(
        protected readonly Connection $db,
        protected readonly AbstractContentRepository $repo,
        protected readonly VersionRepository $versions,
        protected readonly TaxonomyRepository $refs,
        protected readonly AuditLogger $audit,
        protected readonly EventDispatcher $events,
        protected readonly CacheInvalidatorInterface $cache,
        protected readonly Authorizer $authz,
        protected readonly string $requestId = '',
    ) {}

    public function repository(): AbstractContentRepository { return $this->repo; }
    public function type(): string { return $this->repo->type(); }

    /** Type-specific validation beyond the generic coercion. @return array<string,string> */
    protected function extraValidation(array $input, array $coerced, ?array $existing): array { return []; }

    /** Relational side-writes (tags, categories). Runs inside the transaction. */
    protected function afterWrite(int $id, array $input, bool $created): void {}

    /** Extra fields to attach to an output row (e.g. tags). */
    protected function decorate(array $row, array $out, bool $public): array { return $out; }

    // ------------------------------------------------------------- reads

    /** Authenticated management list — may include drafts. */
    public function listAdmin(array $query): array
    {
        // The repository declares its default direction; the client may still
        // override it with ?order=.
        $query += ['order' => $this->repo->defaultOrder()];
        $spec = (new QuerySpec($this->repo->filterable(), $this->repo->sortable(), $this->repo->defaultSort()))
            ->apply($query);
        $page = Pagination::fromQuery($query);
        $res = $this->repo->paginate($spec, $page, publishedOnly: false);

        $items = array_map(function (array $r): array {
            return $this->decorate($r, $this->repo->toAdmin($r), false);
        }, $res['items']);

        return $page->envelope($items, $res['total']);
    }

    public function getAdmin(int $id): array
    {
        $row = $this->repo->findById($id);
        if ($row === null) throw ApiException::notFound('Content not found.');
        return $this->decorate($row, $this->repo->toAdmin($row), false);
    }

    // ------------------------------------------------------------- writes

    /** @param array<string,mixed> $input decoded request body */
    public function create(array $input): array
    {
        $actor = $this->authz->userId();
        $data = $this->coerce($input, null);

        if ($this->repo->hasSlug()) {
            $slug = $this->resolveSlug($input, $data, null);
            $data['slug'] = $slug;
        }
        // A create is ALWAYS a draft. Publication is a separate, permissioned
        // action — otherwise `POST {status:"published"}` would bypass
        // publishing.publish entirely.
        $data['status'] = ContentState::DRAFT;
        $data['published_at'] = null;
        $data['created_by'] = $actor;
        $data['updated_by'] = $actor;
        if (array_key_exists('author_id', $this->repo->writable()) && !isset($data['author_id'])) {
            $data['author_id'] = $actor;
        }

        $id = $this->db->transaction(function () use ($data, $input, $actor): int {
            $id = $this->repo->insert($data);
            $this->afterWrite($id, $input, true);
            $fresh = $this->repo->findById($id) ?? [];
            $this->versions->append($this->type(), $id, $this->repo->versionPayload($fresh), $actor, 'created');
            return $id;
        });

        $row = $this->repo->findById($id) ?? [];
        $this->audit->log($actor, $this->type() . '.create', $this->type(), $id,
            null, $this->auditSnapshot($row));
        $this->events->dispatch(ContentEvent::make(
            ContentEvent::CREATED, $this->type(), $id, $actor, $this->requestId,
            ['status' => ContentState::DRAFT],
        ));
        $this->cache->contentChanged($this->type(), $id);

        return $this->decorate($row, $this->repo->toAdmin($row), false);
    }

    public function update(int $id, array $input): array
    {
        $actor = $this->authz->userId();
        $existing = $this->repo->findById($id);
        if ($existing === null) throw ApiException::notFound('Content not found.');

        $data = $this->coerce($input, $existing);

        // §3E.8: status is NEVER assignable through update. It moves only via
        // publish / unpublish / restore, which are separately permissioned.
        if (array_key_exists('status', $input)) {
            throw new ApiException(
                ErrorCatalog::CONFLICT,
                'Status is changed through the publish and unpublish actions, not through update.',
                ['status' => 'read-only on this endpoint',
                 'actions' => ['publish', 'unpublish']],
            );
        }

        $slugChanged = false;
        $oldSlug = (string)($existing['slug'] ?? '');
        if ($this->repo->hasSlug() && array_key_exists('slug', $input)) {
            $newSlug = $this->resolveSlug($input, $data, $existing);
            $slugChanged = $newSlug !== $oldSlug;
            $data['slug'] = $newSlug;
        }
        $data['updated_by'] = $actor;

        $before = $this->repo->versionPayload($existing);

        $versionCreated = $this->db->transaction(function () use ($id, $data, $input, $actor, $before): int {
            $this->repo->update($id, $data);
            $this->afterWrite($id, $input, false);
            $fresh = $this->repo->findById($id) ?? [];
            $after = $this->repo->versionPayload($fresh);

            // POLICY RULE 2: version only on a real content change.
            if (VersionRepository::checksumOf($after) === VersionRepository::checksumOf($before)) {
                return 0;
            }
            return $this->versions->append($this->type(), $id, $after, $actor, 'updated');
        });

        $row = $this->repo->findById($id) ?? [];
        $this->audit->log($actor, $this->type() . '.update', $this->type(), $id,
            $this->auditSnapshot($existing), $this->auditSnapshot($row));

        if ($slugChanged) {
            $this->audit->log($actor, $this->type() . '.slug_change', $this->type(), $id,
                ['slug' => $oldSlug], ['slug' => $data['slug']]);
            $this->events->dispatch(ContentEvent::make(
                ContentEvent::SLUG_CHANGED, $this->type(), $id, $actor, $this->requestId,
                ['from' => $oldSlug, 'to' => (string)$data['slug']],
            ));
            $this->cache->routeChanged('/' . $data['slug']);
        }

        $this->events->dispatch(ContentEvent::make(
            ContentEvent::UPDATED, $this->type(), $id, $actor, $this->requestId,
            ['version_created' => $versionCreated > 0],
        ));
        $this->cache->contentChanged($this->type(), $id);

        return $this->decorate($row, $this->repo->toAdmin($row), false);
    }

    /**
     * Soft delete. The row survives so its route can become a 301 and so its
     * version history — which must outlive the entity (§3E.21, "no destructive
     * deletion of history") — still has something to point at.
     */
    public function delete(int $id): array
    {
        $actor = $this->authz->userId();
        $existing = $this->repo->findById($id);
        if ($existing === null) throw ApiException::notFound('Content not found.');

        $this->db->transaction(function () use ($id, $actor): void {
            $this->repo->softDelete($id, $actor);
        });

        $this->audit->log($actor, $this->type() . '.delete', $this->type(), $id,
            $this->auditSnapshot($existing), null);
        $this->events->dispatch(ContentEvent::make(
            ContentEvent::DELETED, $this->type(), $id, $actor, $this->requestId,
        ));
        $this->cache->contentChanged($this->type(), $id);
        if ($this->repo->hasSlug()) $this->cache->routeChanged('/' . (string)$existing['slug']);

        return ['deleted' => true, 'id' => $id, 'versions_retained' => $this->versions->count($this->type(), $id)];
    }

    // -------------------------------------------------------- validation

    /**
     * Generic coercion driven by the repository's declared column kinds. A
     * request can only ever set a column the repository declared writable, so
     * an unexpected key is inert rather than dangerous.
     *
     * @return array<string,mixed>
     */
    protected function coerce(array $input, ?array $existing): array
    {
        $errors = [];
        $out = [];

        foreach ($this->repo->writable() as $col => $kind) {
            if (!array_key_exists($col, $input)) continue;
            $v = $input[$col];

            switch ($kind) {
                case 'string':
                    if (!is_string($v) && !is_numeric($v)) { $errors[$col] = 'must be a string'; break; }
                    $s = trim((string)$v);
                    if (mb_strlen($s) > 255) { $errors[$col] = 'must be 255 characters or fewer'; break; }
                    $out[$col] = $s;
                    break;

                case 'text':
                    if ($v === null) { $out[$col] = null; break; }
                    if (!is_string($v)) { $errors[$col] = 'must be a string'; break; }
                    if (strlen($v) > 65535) { $errors[$col] = 'must be 65535 bytes or fewer'; break; }
                    $out[$col] = $v;
                    break;

                case 'int':
                    if ($v === null || $v === '') { $out[$col] = null; break; }
                    if (!is_int($v) && !(is_string($v) && preg_match('/^-?\d+$/', $v) === 1)) {
                        $errors[$col] = 'must be an integer'; break;
                    }
                    $out[$col] = (int)$v;
                    break;

                case 'bool':
                    $out[$col] = (int)(bool)(is_string($v) ? !in_array(strtolower($v), ['', '0', 'false'], true) : $v);
                    break;

                case 'json':
                    $out[$col] = ContentDocument::encode(ContentDocument::validate($v, $col));
                    break;

                case 'jsonmap':
                    if ($v === null) { $out[$col] = null; break; }
                    if (!is_array($v)) { $errors[$col] = 'must be a JSON object'; break; }
                    $enc = (string)json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                    if (strlen($enc) > 65535) { $errors[$col] = 'is too large'; break; }
                    foreach (array_keys($v) as $k) {
                        if (in_array(strtolower((string)$k), ContentDocument::RELATIONAL_KEYS, true)) {
                            $errors[$col . '.' . $k] = 'is a relational field and must not be stored in JSON';
                        }
                    }
                    $out[$col] = $enc;
                    break;

                case 'datetime':
                    if ($v === null || $v === '') { $out[$col] = null; break; }
                    $ts = is_string($v) ? strtotime($v) : false;
                    if ($ts === false) { $errors[$col] = 'must be a valid date/time'; break; }
                    $out[$col] = gmdate('Y-m-d H:i:s', $ts);
                    break;

                case 'ref':
                    if ($v === null || $v === '' || $v === 0 || $v === '0') { $out[$col] = null; break; }
                    if (!is_int($v) && !(is_string($v) && preg_match('/^\d+$/', $v) === 1)) {
                        $errors[$col] = 'must be a numeric id'; break;
                    }
                    $refId = (int)$v;
                    if (!$this->refExists($col, $refId)) {
                        $errors[$col] = 'does not reference an existing record';
                        break;
                    }
                    $out[$col] = $refId;
                    break;
            }
        }

        $errors += $this->extraValidation($input, $out, $existing);
        if ($errors !== []) throw ApiException::validation($errors);
        return $out;
    }

    /** Relational integrity checked in PHP so the client gets 422, not a 500 FK error. */
    protected function refExists(string $column, int $id): bool
    {
        return match ($column) {
            'client_id'                      => $this->refs->clientExists($id),
            'hero_media_id', 'cover_media_id' => $this->refs->mediaExists($id),
            'author_id'                      => $this->refs->userExists($id),
            default                          => true,
        };
    }

    /**
     * Slug policy (§3E.10). Normalise, validate, then check uniqueness. A
     * collision is a CONFLICT with a suggestion — never a silent rename, which
     * would change a URL behind the author's back.
     */
    protected function resolveSlug(array $input, array $coerced, ?array $existing): string
    {
        $explicit = trim((string)($coerced['slug'] ?? $input['slug'] ?? ''));

        if ($explicit !== '') {
            // An EXPLICIT slug is held to the rule, not quietly repaired. Case
            // and stray whitespace are cosmetic and get normalised, but a
            // ".html", a ".php" or a slash changes what URL the author asked
            // for, so it is refused rather than silently rewritten.
            $errors = Slug::errors(strtolower($explicit));
            if ($errors !== []) throw ApiException::validation($errors);
            $slug = Slug::normalise($explicit);
        } else {
            // Derived from the title: normalisation is expected here.
            $source = (string)($coerced['title'] ?? $input['title'] ?? '');
            if ($source === '' && $existing !== null) return (string)$existing['slug'];
            $slug = Slug::normalise($source);
        }
        Slug::assertValid($slug);

        $exceptId = $existing !== null ? (int)$existing['id'] : 0;
        if ($this->repo->slugTaken($slug, $exceptId)) {
            $suggestion = $slug;
            for ($i = 2; $i <= 50; $i++) {
                $candidate = Slug::suggest($slug, $i);
                if (!$this->repo->slugTaken($candidate, $exceptId)) { $suggestion = $candidate; break; }
            }
            throw new ApiException(
                ErrorCatalog::CONFLICT,
                'That slug is already in use.',
                ['slug' => $slug, 'suggestion' => $suggestion],
            );
        }
        return $slug;
    }

    // ------------------------------------------------------------- audit

    /**
     * What goes into audit before/after. Deliberately a small summary rather
     * than the whole row: the full content is already in content_versions, and
     * duplicating a 256 KB document into every audit entry would bloat the log
     * without adding information. AuditEvent::redact() still runs over it.
     */
    protected function auditSnapshot(array $row): array
    {
        $keys = ['id', 'slug', 'title', 'status', 'published_at', 'position', 'era', 'kind'];
        $out = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $row)) $out[$k] = $row[$k];
        }
        return $out;
    }
}
