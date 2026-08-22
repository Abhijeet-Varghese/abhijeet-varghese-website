<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Api\Pagination;
use AvOS\Api\QuerySpec;
use AvOS\Content\Cache\CacheInvalidatorInterface;
use AvOS\Database\Connection;
use AvOS\Media\AssetKind;
use AvOS\Media\Capabilities;
use AvOS\Media\DerivativeSpec;
use AvOS\Media\FileNaming;
use AvOS\Media\MetadataExtractor;
use AvOS\Media\Storage\StorageManager;
use AvOS\Media\UploadGuard;
use AvOS\Media\Video\VideoProbe;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

/**
 * The asset domain service (Phase 3F §3F.1).
 *
 * Controller → **Service** → Repository → Storage. No filesystem call is made
 * outside the storage driver and no SQL is written outside the repositories.
 *
 * ---------------------------------------------------------------------------
 * FILESYSTEM/DATABASE CONSISTENCY (§3F.31, §3F.32) — the important part
 * ---------------------------------------------------------------------------
 * A filesystem write cannot join a database transaction, so "write the file and
 * insert the row" has a window where the two can disagree. The order chosen
 * here makes every failure mode safe:
 *
 *   1. inspect the bytes            — nothing is written until they are valid
 *   2. write the file to PRIVATE    — atomic (temp + rename), so no half file
 *   3. INSERT the row               — inside a transaction
 *   4. on DB failure: DELETE THE FILE, then rethrow
 *
 * The result is that the database is authoritative. A row without a file is
 * impossible (the file is written first). A file without a row is possible only
 * if step 4's cleanup itself fails — and that leftover is precisely what the
 * orphan report exists to surface, so it is visible rather than silent.
 *
 * There is deliberately no path that reports success when the two disagree.
 * ---------------------------------------------------------------------------
 */
final class AssetService
{
    /** Fallback when `media.max_upload_mb` is missing from settings. */
    private const DEFAULT_MAX_MB = 20;

    public function __construct(
        private readonly Connection $db,
        private readonly AssetRepository $assets,
        private readonly VariantRepository $variants,
        private readonly UsageRepository $usage,
        private readonly StorageManager $storage,
        private readonly DerivativeService $derivatives,
        private readonly MetadataExtractor $metadata,
        private readonly VideoProbe $videoProbe,
        private readonly FileNaming $naming,
        private readonly AuditLogger $audit,
        private readonly CacheInvalidatorInterface $cache,
        private readonly Authorizer $authz,
        private readonly int $maxUploadBytes,
        private readonly string $requestId = '',
    ) {}

    public function maxUploadBytes(): int { return $this->maxUploadBytes; }

    public static function resolveMaxBytes(Connection $db): int
    {
        $mb = $db->scalar("SELECT svalue FROM site_settings WHERE skey = 'media.max_upload_mb'");
        $mb = is_numeric($mb) ? (int)$mb : self::DEFAULT_MAX_MB;
        return max(1, $mb) * 1024 * 1024;
    }

    // ------------------------------------------------------------- reads

    public function listAdmin(array $query): array
    {
        $query += ['order' => 'desc'];
        $spec = (new QuerySpec(AssetRepository::FILTERABLE, AssetRepository::SORTABLE, 'created_at'))
            ->apply($query);
        $page = Pagination::fromQuery($query);
        $res = $this->assets->paginate($spec, $page, publicOnly: false);

        $ids = array_map(static fn(array $r): int => (int)$r['id'], $res['items']);
        $variantsByMedia = [];
        foreach ($this->variants->forMediaIds($ids) as $v) {
            $variantsByMedia[(int)$v['media_id']][] = $v;
        }

        $items = array_map(function (array $r) use ($variantsByMedia): array {
            $v = $variantsByMedia[(int)$r['id']] ?? [];
            return $this->assets->toAdmin($r, VariantRepository::toPublicList($v));
        }, $res['items']);

        return $page->envelope($items, $res['total']);
    }

    public function getAdmin(int $id): array
    {
        $row = $this->assets->findById($id);
        if ($row === null) throw ApiException::notFound('Asset not found.');
        return $this->assets->toAdmin(
            $row,
            VariantRepository::toPublicList($this->variants->forMedia($id)),
            $this->usage->rowsFor($id),
        );
    }

    /** Public metadata. A private asset is a 404 here, never a 403. */
    public function getPublic(int $id): array
    {
        $row = $this->assets->findById($id);
        if ($row === null || (string)$row['visibility'] !== 'public') {
            throw ApiException::notFound('Not found.');
        }
        return $this->assets->toPublic(
            $row,
            VariantRepository::toPublicList($this->variants->forMedia($id)),
        );
    }

    public function listPublic(array $query): array
    {
        $query += ['order' => 'desc'];
        // `visibility` is removed from the public filter set so a caller cannot
        // ask for private rows; `paginate(publicOnly: true)` enforces it anyway.
        $filterable = array_values(array_filter(
            AssetRepository::FILTERABLE,
            static fn(string $f): bool => !in_array($f, ['visibility', 'uploaded_by', 'processing'], true),
        ));
        $spec = (new QuerySpec($filterable, AssetRepository::SORTABLE, 'created_at'))->apply($query);
        $page = Pagination::fromQuery($query);
        $res = $this->assets->paginate($spec, $page, publicOnly: true);

        $ids = array_map(static fn(array $r): int => (int)$r['id'], $res['items']);
        $byMedia = [];
        foreach ($this->variants->forMediaIds($ids) as $v) $byMedia[(int)$v['media_id']][] = $v;

        $items = array_map(function (array $r) use ($byMedia): array {
            return $this->assets->toPublic($r, VariantRepository::toPublicList($byMedia[(int)$r['id']] ?? []));
        }, $res['items']);

        return $page->envelope($items, $res['total']);
    }

    // ------------------------------------------------------------ upload

    /**
     * @param string $originalName untrusted client filename
     * @param string $bytes        the file content
     * @param array  $options      visibility, alt_text, credit, kind override
     */
    public function upload(string $originalName, string $bytes, array $options = []): array
    {
        $actor = $this->authz->userId();

        // ---- 1 · validate before anything is written -------------------
        $guard = new UploadGuard($this->maxUploadBytes);
        $inspection = $guard->inspect($originalName, $bytes);
        if (!$inspection->ok) {
            $this->audit->log($actor, 'media.upload_rejected', 'media', '0',
                null, ['reason_code' => $inspection->code, 'name' => substr($originalName, 0, 120)], 'failure');
            $status = $inspection->code === 'FILE_TOO_LARGE'
                ? ErrorCatalog::PAYLOAD_TOO_LARGE
                : ErrorCatalog::VALIDATION_ERROR;
            throw new ApiException($status, $inspection->reason, $inspection->toErrorDetails());
        }

        $visibility = ($options['visibility'] ?? 'public') === 'private' ? 'private' : 'public';

        // ---- 2 · duplicate detection (§3F.19) --------------------------
        // The approved schema makes `hash` UNIQUE, so identical bytes cannot be
        // stored twice. Rather than erroring, the existing asset is returned
        // and flagged as a duplicate — nothing is deleted, which is the rule.
        $existing = $this->assets->findByHash($inspection->hash);
        if ($existing !== null) {
            if ($existing['deleted_at'] !== null) {
                // The bytes are already on disk and owned; revive rather than
                // write a second copy.
                $this->assets->restore((int)$existing['id']);
                $this->audit->log($actor, 'media.restore', 'media', (int)$existing['id'],
                    ['deleted' => true], ['deleted' => false, 'via' => 're-upload of identical bytes']);
                $existing = $this->assets->findById((int)$existing['id']) ?? $existing;
            }
            return [
                'duplicate'    => true,
                'duplicate_of' => (int)$existing['id'],
                'message'      => 'Identical bytes are already stored; the existing asset was returned.',
                'asset'        => $this->assets->toAdmin(
                    $existing,
                    VariantRepository::toPublicList($this->variants->forMedia((int)$existing['id'])),
                ),
            ];
        }

        // ---- 3 · write to PRIVATE storage first ------------------------
        $relative = $this->naming->relativePath($inspection->hash, $inspection->extension);
        $this->storage->privateDisk()->put($relative, $bytes);

        // From here on, any failure must remove that file again.
        $publicPath = '';
        $publishMethod = '';
        try {
            if ($visibility === 'public') {
                $published = $this->storage->publish($relative);
                if ($published['ok']) {
                    $publicPath = $published['path'];
                    $publishMethod = $published['method'];
                }
            }

            $absolute = (string)$this->storage->privateDisk()->absolute($relative);
            $meta = $this->metadata->extract($inspection->kind, $inspection->extension, $bytes, $absolute);
            if ($publishMethod !== '') $meta['published_via'] = $publishMethod;

            $width = $inspection->width;
            $height = $inspection->height;
            $durationMs = null;
            if (in_array($inspection->kind, [AssetKind::VIDEO, AssetKind::AUDIO], true)) {
                $probe = $this->videoProbe->probe($absolute);
                if ($probe['available']) {
                    $width ??= $probe['width'];
                    $height ??= $probe['height'];
                    $durationMs = $probe['duration_ms'];
                }
            }

            // ---- 4 · insert the row ------------------------------------
            $id = $this->db->transaction(fn(): int => $this->assets->insert([
                'kind'            => $options['kind'] ?? $inspection->kind,
                'visibility'      => $visibility,
                'original_name'   => $inspection->originalName,
                'storage_path'    => $relative,
                'public_path'     => $publicPath,
                'mime'            => $inspection->mime,
                'extension'       => $inspection->extension,
                'bytes'           => $inspection->bytes,
                'hash'            => $inspection->hash,
                'width'           => $width,
                'height'          => $height,
                'duration_ms'     => $durationMs,
                'alt_text'        => substr((string)($options['alt_text'] ?? ''), 0, 500),
                'credit'          => substr((string)($options['credit'] ?? ''), 0, 255),
                'meta'            => json_encode($meta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'processing'      => 'pending',
                'uploaded_by'     => $actor,
            ]));
        } catch (\Throwable $e) {
            // §3F.32 — the file exists but the row does not. Undo the file so
            // the two never disagree, and never report success.
            $this->storage->privateDisk()->delete($relative);
            if ($publicPath !== '') $this->storage->unpublish($publicPath);

            $this->audit->log($actor, 'media.upload_failed', 'media', '0',
                null, ['stage' => 'database', 'cleaned_up' => true], 'failure');

            if ($e instanceof ApiException) throw $e;
            throw new ApiException(
                ErrorCatalog::INTERNAL_ERROR,
                'The upload could not be recorded and has been rolled back.',
            );
        }

        // ---- 5 · derivatives (best effort, never fails the upload) -----
        $row = $this->assets->findById($id) ?? [];
        $derivative = $this->derivatives->generate($row);
        $this->assets->setProcessing($id, $derivative['state'], $derivative['note']);

        $this->audit->log($actor, 'media.upload', 'media', $id, null, [
            'kind' => $inspection->kind, 'bytes' => $inspection->bytes,
            'extension' => $inspection->extension, 'visibility' => $visibility,
            'derivatives' => $derivative['generated'],
        ]);
        $this->cache->contentChanged('media', $id);

        $fresh = $this->assets->findById($id) ?? $row;
        return [
            'duplicate'   => false,
            'asset'       => $this->assets->toAdmin(
                $fresh,
                VariantRepository::toPublicList($this->variants->forMedia($id)),
            ),
            'derivatives' => $derivative,
        ];
    }

    // ------------------------------------------------------- metadata

    /** Editable metadata only. Bytes, hash, path and kind are not editable. */
    public function updateMetadata(int $id, array $input): array
    {
        $actor = $this->authz->userId();
        $row = $this->assets->findById($id);
        if ($row === null) throw ApiException::notFound('Asset not found.');

        $errors = [];
        $data = [];

        if (array_key_exists('alt_text', $input)) {
            if (!is_string($input['alt_text'])) $errors['alt_text'] = 'must be a string';
            elseif (mb_strlen($input['alt_text']) > 500) $errors['alt_text'] = 'must be 500 characters or fewer';
            else $data['alt_text'] = trim($input['alt_text']);
        }
        if (array_key_exists('credit', $input)) {
            if (!is_string($input['credit'])) $errors['credit'] = 'must be a string';
            elseif (mb_strlen($input['credit']) > 255) $errors['credit'] = 'must be 255 characters or fewer';
            else $data['credit'] = trim($input['credit']);
        }
        if (array_key_exists('original_name', $input)) {
            if (!is_string($input['original_name'])) $errors['original_name'] = 'must be a string';
            else $data['original_name'] = FileNaming::sanitiseOriginalName($input['original_name']);
        }

        // §3F.12 focal point, normalised 0..1.
        foreach (['focal_x' => 'x', 'focal_y' => 'y'] as $column => $key) {
            $value = $input['focal'][$key] ?? $input[$column] ?? null;
            if ($value === null) continue;
            if (!is_numeric($value)) { $errors[$column] = 'must be a number'; continue; }
            $f = (float)$value;
            if ($f < 0 || $f > 1) { $errors[$column] = 'must be between 0 and 1'; continue; }
            $data[$column] = round($f, 4);
        }

        // §3F.13 crop, also normalised, so it survives a replacement.
        $regenerate = false;
        if (array_key_exists('crop', $input)) {
            if ($input['crop'] === null) {
                $data['crop'] = null;
                $regenerate = true;
            } elseif (!is_array($input['crop'])) {
                $errors['crop'] = 'must be an object or null';
            } else {
                $crop = [];
                foreach (['x', 'y', 'width', 'height'] as $k) {
                    if (!isset($input['crop'][$k]) || !is_numeric($input['crop'][$k])) {
                        $errors['crop.' . $k] = 'is required and must be a number';
                        continue;
                    }
                    $crop[$k] = round((float)$input['crop'][$k], 6);
                }
                if (!isset($errors['crop.x'], $errors['crop.y'], $errors['crop.width'], $errors['crop.height'])
                    && count($crop) === 4) {
                    if ($crop['width'] <= 0 || $crop['height'] <= 0) {
                        $errors['crop'] = 'width and height must be greater than 0';
                    } elseif ($crop['x'] < 0 || $crop['y'] < 0
                        || $crop['x'] + $crop['width'] > 1.0001
                        || $crop['y'] + $crop['height'] > 1.0001) {
                        $errors['crop'] = 'must describe a region inside the image';
                    } else {
                        $data['crop'] = json_encode($crop, JSON_UNESCAPED_SLASHES);
                        $regenerate = true;
                    }
                }
            }
        }

        $visibilityChanged = false;
        if (array_key_exists('visibility', $input)) {
            $v = (string)$input['visibility'];
            if (!in_array($v, ['public', 'private'], true)) {
                $errors['visibility'] = 'must be public or private';
            } elseif ($v !== (string)$row['visibility']) {
                $data['visibility'] = $v;
                $visibilityChanged = true;
            }
        }

        if ($errors !== []) throw ApiException::validation($errors);
        if ($data === []) return $this->getAdmin($id);

        $this->db->transaction(function () use ($id, $data): void {
            $this->assets->update($id, $data);
        });

        // Visibility drives whether public bytes exist at all.
        if ($visibilityChanged) {
            $this->applyVisibility($id);
            $this->audit->log($actor, 'media.visibility_change', 'media', $id,
                ['visibility' => (string)$row['visibility']], ['visibility' => $data['visibility']]);
        }

        if ($regenerate) {
            $fresh = $this->assets->findById($id) ?? [];
            $d = $this->derivatives->regenerate($fresh);
            $this->assets->setProcessing($id, $d['state'], $d['note']);
        }

        $this->audit->log($actor, 'media.update', 'media', $id,
            $this->snapshot($row), $this->snapshot($this->assets->findById($id) ?? []));
        $this->cache->contentChanged('media', $id);

        return $this->getAdmin($id);
    }

    /**
     * Make the public tree agree with `visibility`. Going private deletes every
     * public byte — the published copy AND all derivatives — so no guessable
     * URL survives the change.
     */
    private function applyVisibility(int $id): void
    {
        $row = $this->assets->findById($id);
        if ($row === null) return;

        if ((string)$row['visibility'] === 'private') {
            $this->derivatives->purge($id);
            if ((string)$row['public_path'] !== '') {
                $this->storage->unpublish((string)$row['public_path']);
            }
            $this->assets->update($id, ['public_path' => '']);
            $this->assets->setProcessing($id, 'ready', 'private: no public copies');
            return;
        }

        $published = $this->storage->publish((string)$row['storage_path']);
        $this->assets->update($id, ['public_path' => $published['ok'] ? $published['path'] : '']);
        $fresh = $this->assets->findById($id) ?? $row;
        $d = $this->derivatives->regenerate($fresh);
        $this->assets->setProcessing($id, $d['state'], $d['note']);
    }

    // -------------------------------------------------------- replace

    /**
     * §3F.23 — replacement without destroying history.
     *
     * The chosen behaviour, documented rather than assumed: a replacement is a
     * NEW asset row. The old row is retained, marked `replaced_by` the new id,
     * and soft-deleted only if nothing references it. Existing content keeps
     * pointing at the old id and therefore keeps rendering exactly what it
     * rendered before — published pages do not silently change.
     *
     * The alternative (overwrite the bytes in place) was rejected: it would
     * mutate every published page that uses the asset, retroactively and
     * invisibly, which is precisely what the brief forbids.
     */
    public function replace(int $id, string $originalName, string $bytes, array $options = []): array
    {
        $actor = $this->authz->userId();
        $old = $this->assets->findById($id);
        if ($old === null) throw ApiException::notFound('Asset not found.');

        $uploaded = $this->upload($originalName, $bytes, [
            'visibility' => $options['visibility'] ?? (string)$old['visibility'],
            'alt_text'   => $options['alt_text'] ?? (string)$old['alt_text'],
            'credit'     => $options['credit'] ?? (string)$old['credit'],
        ]);

        $newId = (int)$uploaded['asset']['id'];
        if ($newId === $id) {
            // Identical bytes: nothing changed, so nothing is recorded.
            return ['replaced' => false, 'reason' => 'the new file is identical to the current one',
                    'asset' => $uploaded['asset']];
        }

        $usageCount = $this->usage->countFor($id) + count($this->usage->structuralFor($id));

        $this->db->transaction(function () use ($id, $newId, $old, $usageCount): void {
            $this->assets->update($id, [
                'replaced_by' => $newId,
            ]);
            $this->assets->update($newId, ['version' => (int)$old['version'] + 1]);
            // Only retire the old row when nothing points at it. If content
            // still references it, it stays live so those pages keep working.
            if ($usageCount === 0) $this->assets->softDelete($id);
        });

        $this->audit->log($actor, 'media.replace', 'media', $id,
            ['id' => $id, 'hash' => (string)$old['hash']],
            ['replaced_by' => $newId, 'old_retained' => $usageCount > 0, 'references' => $usageCount]);
        $this->cache->contentChanged('media', $id);
        $this->cache->contentChanged('media', $newId);

        return [
            'replaced'          => true,
            'previous_id'       => $id,
            'previous_retained' => $usageCount > 0,
            'references_to_previous' => $usageCount,
            'note' => $usageCount > 0
                ? 'The previous asset is still referenced by published content and has been kept, so nothing changed retroactively. Repoint those references to the new asset when ready.'
                : 'The previous asset had no references and has been retired.',
            'asset' => $this->getAdmin($newId),
        ];
    }

    // --------------------------------------------------------- delete

    /**
     * §3F.20 — a referenced asset is never deleted and references are never
     * silently detached. The caller gets CONFLICT plus the exact list of what
     * is using it, so the conflict is actionable rather than just a refusal.
     */
    public function delete(int $id, bool $force = false): array
    {
        $actor = $this->authz->userId();
        $row = $this->assets->findById($id);
        if ($row === null) throw ApiException::notFound('Asset not found.');

        $references = [...$this->usage->describeFor($id), ...$this->usage->structuralFor($id)];
        if ($references !== []) {
            throw new ApiException(
                ErrorCatalog::CONFLICT,
                sprintf('This asset is used by %d item%s and cannot be deleted.',
                    count($references), count($references) === 1 ? '' : 's'),
                ['reason' => 'ASSET_IN_USE', 'usage_count' => count($references), 'used_by' => $references],
            );
        }

        // Soft delete by default: the bytes stay, so the decision is reversible.
        if (!$force) {
            $this->db->transaction(function () use ($id): void { $this->assets->softDelete($id); });
            $this->derivatives->purge($id);
            if ((string)$row['public_path'] !== '') $this->storage->unpublish((string)$row['public_path']);
            $this->assets->update($id, ['public_path' => '']);

            $this->audit->log($actor, 'media.delete', 'media', $id, $this->snapshot($row), null);
            $this->cache->contentChanged('media', $id);
            return ['deleted' => true, 'mode' => 'soft', 'id' => $id,
                    'note' => 'The file is retained and the asset can be restored.'];
        }

        // Hard delete: database row first, then bytes. If the row survives but
        // the unlink fails, the orphan report will surface the leftover file —
        // the other order could delete bytes that a live row still points at.
        $storagePath = (string)$row['storage_path'];
        $publicPath = (string)$row['public_path'];

        $this->derivatives->purge($id);
        $this->db->transaction(function () use ($id): void { $this->assets->hardDelete($id); });
        if ($publicPath !== '') $this->storage->unpublish($publicPath);
        $removed = $this->storage->privateDisk()->delete($storagePath);

        $this->audit->log($actor, 'media.hard_delete', 'media', $id,
            $this->snapshot($row), ['file_removed' => $removed]);
        $this->cache->contentChanged('media', $id);

        return ['deleted' => true, 'mode' => 'hard', 'id' => $id, 'file_removed' => $removed];
    }

    public function restore(int $id): array
    {
        $actor = $this->authz->userId();
        $row = $this->assets->findById($id, includeDeleted: true);
        if ($row === null) throw ApiException::notFound('Asset not found.');
        if ($row['deleted_at'] === null) return $this->getAdmin($id);

        if (!$this->storage->privateDisk()->exists((string)$row['storage_path'])) {
            throw new ApiException(ErrorCatalog::CONFLICT,
                'The stored file for this asset is missing, so it cannot be restored.');
        }
        $this->assets->restore($id);
        $this->applyVisibility($id);
        $this->audit->log($actor, 'media.restore', 'media', $id, ['deleted' => true], ['deleted' => false]);
        return $this->getAdmin($id);
    }

    // ---------------------------------------------------- capabilities

    /** §3F.38 — what this host can actually do. Booleans and versions only. */
    public function capabilities(): array
    {
        return [
            'image'      => Capabilities::publicSummary(),
            'derivatives' => DerivativeSpec::describe(),
            'video'      => [
                'probe'       => Capabilities::hasFfprobe(),
                'transcoding' => Capabilities::hasFfmpeg(),
                'reason'      => Capabilities::hasFfprobe() ? '' : (new VideoProbe())->unavailableReason(),
            ],
            'storage'    => $this->storage->health(),
            'limits'     => [
                'max_upload_bytes' => $this->maxUploadBytes,
                'max_upload_human' => UploadGuard::human($this->maxUploadBytes),
                'php_upload_max'   => (string)ini_get('upload_max_filesize'),
                'php_post_max'     => (string)ini_get('post_max_size'),
            ],
            'accepted_extensions' => \AvOS\Media\MimeRegistry::extensions(),
            'kinds'               => AssetKind::ALL,
        ];
    }

    private function snapshot(array $row): array
    {
        $keys = ['id', 'kind', 'visibility', 'original_name', 'extension', 'bytes', 'processing'];
        $out = [];
        foreach ($keys as $k) if (array_key_exists($k, $row)) $out[$k] = $row[$k];
        return $out;
    }
}
