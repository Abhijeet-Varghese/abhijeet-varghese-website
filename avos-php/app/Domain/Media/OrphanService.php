<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Media\Storage\StorageManager;

/**
 * Orphan detection (Phase 3F §3F.22).
 *
 * **Reports only. Deletes nothing.** Automated deletion belongs to a later
 * maintenance phase, and the reason is not caution for its own sake: a file
 * that looks orphaned today may be a half-finished upload from thirty seconds
 * ago, or the only surviving copy of something a broken migration lost the row
 * for. Reporting is reversible; deleting is not.
 *
 * Four distinct conditions are reported, because they have different causes and
 * different fixes:
 *
 *  1. `orphan_file`      bytes on disk that no database row claims
 *  2. `missing_file`     a database row whose bytes are gone
 *  3. `orphan_public`    a public artefact no row or variant claims
 *  4. `unreferenced`     a live asset that no content uses — NOT an orphan,
 *                        just unused, and listed separately so the two are
 *                        never confused
 */
final class OrphanService
{
    /** A file younger than this may simply be an upload in progress. */
    private const GRACE_SECONDS = 300;

    public function __construct(
        private readonly AssetRepository $assets,
        private readonly VariantRepository $variants,
        private readonly UsageRepository $usage,
        private readonly StorageManager $storage,
    ) {}

    /** @return array<string,mixed> */
    public function report(): array
    {
        $private = $this->storage->privateDisk();
        $public = $this->storage->publicDisk();

        $onDisk = $private->listAll('media');
        $claimed = array_flip($this->assets->allStoragePaths());

        $orphanFiles = [];
        $now = time();
        foreach ($onDisk as $relative) {
            if (isset($claimed[$relative])) continue;
            $abs = $private->absolute($relative);
            $mtime = ($abs !== null && is_file($abs)) ? (int)filemtime($abs) : 0;
            if ($now - $mtime < self::GRACE_SECONDS) continue;   // possibly mid-upload
            $orphanFiles[] = [
                'path'     => $relative,
                'bytes'    => ($abs !== null && is_file($abs)) ? (int)filesize($abs) : 0,
                'modified' => gmdate('c', $mtime),
            ];
        }

        // Rows whose bytes have vanished — the opposite failure, equally worth
        // knowing about, and the one that actually breaks a page.
        $missing = [];
        $page = 1;
        do {
            $rows = $this->assets->paginate(
                new \AvOS\Api\QuerySpec([], AssetRepository::SORTABLE, 'id'),
                \AvOS\Api\Pagination::fromQuery(['page' => $page, 'per_page' => 100]),
                publicOnly: false,
            );
            foreach ($rows['items'] as $r) {
                $path = (string)$r['storage_path'];
                if ($path !== '' && !$private->exists($path)) {
                    $missing[] = [
                        'id' => (int)$r['id'],
                        'original_name' => (string)$r['original_name'],
                        'path' => $path,
                    ];
                }
            }
            $total = (int)$rows['total'];
            $page++;
        } while (($page - 1) * 100 < $total && $page < 200);

        // Public artefacts nobody claims.
        $publicClaimed = array_flip($this->assets->allPublicPaths());
        $orphanPublic = [];
        foreach ($public->listAll('media') as $relative) {
            if (isset($publicClaimed[$relative])) continue;
            $abs = $public->absolute($relative);
            $mtime = ($abs !== null && is_file($abs)) ? (int)filemtime($abs) : 0;
            if ($now - $mtime < self::GRACE_SECONDS) continue;
            $orphanPublic[] = ['path' => $relative, 'modified' => gmdate('c', $mtime)];
        }

        return [
            'scanned' => [
                'private_files' => count($onDisk),
                'database_rows' => count($claimed),
                'public_files'  => count($public->listAll('media')),
            ],
            'orphan_files'   => $orphanFiles,
            'missing_files'  => $missing,
            'orphan_public'  => $orphanPublic,
            'counts' => [
                'orphan_files'  => count($orphanFiles),
                'missing_files' => count($missing),
                'orphan_public' => count($orphanPublic),
            ],
            'grace_seconds' => self::GRACE_SECONDS,
            'action_taken'  => 'none',
            'note' => 'This report never deletes anything. Automated cleanup is a later maintenance phase.',
        ];
    }

    /**
     * Assets nothing references. Deliberately SEPARATE from the orphan report:
     * an unused asset is a perfectly valid thing to keep in a library, and
     * conflating "nothing links to it" with "it is garbage" is how a media
     * library loses files people were about to use.
     */
    public function unreferenced(int $limit = 200): array
    {
        $referenced = array_flip($this->usage->referencedMediaIds());
        $out = [];
        $page = 1;
        do {
            $rows = $this->assets->paginate(
                new \AvOS\Api\QuerySpec([], AssetRepository::SORTABLE, 'id'),
                \AvOS\Api\Pagination::fromQuery(['page' => $page, 'per_page' => 100]),
                publicOnly: false,
            );
            foreach ($rows['items'] as $r) {
                $id = (int)$r['id'];
                if (isset($referenced[$id])) continue;
                if ($this->usage->structuralFor($id) !== []) continue;
                $out[] = [
                    'id'            => $id,
                    'original_name' => (string)$r['original_name'],
                    'kind'          => (string)$r['kind'],
                    'bytes'         => (int)$r['bytes'],
                    'created_at'    => $r['created_at'],
                ];
                if (count($out) >= $limit) return ['items' => $out, 'truncated' => true];
            }
            $total = (int)$rows['total'];
            $page++;
        } while (($page - 1) * 100 < $total && $page < 200);

        return ['items' => $out, 'truncated' => false];
    }

    /**
     * Duplicate candidates (§3F.19). With `media.hash` UNIQUE, byte-identical
     * duplicates cannot exist, so what is reported here is same-size/same-kind
     * near-duplicates — candidates for a human to look at, never auto-removed.
     */
    public function duplicateCandidates(): array
    {
        $rows = $this->assets->paginate(
            new \AvOS\Api\QuerySpec([], AssetRepository::SORTABLE, 'bytes'),
            \AvOS\Api\Pagination::fromQuery(['per_page' => 100]),
            publicOnly: false,
        );
        $bySignature = [];
        foreach ($rows['items'] as $r) {
            $key = $r['kind'] . ':' . $r['bytes'] . ':' . ($r['width'] ?? '') . 'x' . ($r['height'] ?? '');
            $bySignature[$key][] = ['id' => (int)$r['id'], 'original_name' => (string)$r['original_name']];
        }
        $groups = [];
        foreach ($bySignature as $signature => $members) {
            if (count($members) < 2) continue;
            $groups[] = ['signature' => $signature, 'members' => $members];
        }
        return [
            'exact_duplicates_possible' => false,
            'reason' => 'media.hash is UNIQUE, so byte-identical duplicates cannot be stored twice.',
            'candidate_groups' => $groups,
            'action_taken' => 'none',
        ];
    }
}
