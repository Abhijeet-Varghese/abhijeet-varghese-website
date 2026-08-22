<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Content\ContentState;
use AvOS\Database\Connection;

/**
 * Runtime route registry access (Phase 3E §3E.11).
 *
 * This is NOT a second route registry. `frontend/src/routes/registry.ts` +
 * `routes.json` remain the single build-time registry for the static site, and
 * `page_routes` — created in migration 005, long before this phase — is the
 * runtime table those routes are reconciled against in Phase 3F/3R. This class
 * only reads and writes that existing table.
 *
 * `uq_route_path` makes a duplicate published URL structurally impossible, and
 * `uq_route_entity (entity_type, entity_id, is_canonical)` makes two canonicals
 * for one entity impossible. Neither is enforced in PHP, because a PHP check
 * can be bypassed and a unique key cannot.
 */
final class RouteRepository
{
    public function __construct(private readonly Connection $db) {}

    public function findByPath(string $path): ?array
    {
        return $this->db->one('SELECT * FROM page_routes WHERE path = ?', [$path]);
    }

    public function findActiveByPath(string $path): ?array
    {
        return $this->db->one(
            "SELECT * FROM page_routes WHERE path = ? AND status = 'active'",
            [$path],
        );
    }

    public function findCanonicalFor(string $entityType, int $entityId): ?array
    {
        return $this->db->one(
            'SELECT * FROM page_routes WHERE entity_type = ? AND entity_id = ? AND is_canonical = 1',
            [$entityType, $entityId],
        );
    }

    /** Is $path claimed by anyone other than this entity? */
    public function pathTakenByOther(string $path, string $entityType, int $entityId): bool
    {
        $row = $this->findByPath($path);
        if ($row === null) return false;
        return !((string)$row['entity_type'] === $entityType && (int)$row['entity_id'] === $entityId);
    }

    /**
     * Create or move the canonical route for an entity and activate it.
     * Returns the route id. Called only by PublishingService.
     */
    public function activate(string $entityType, int $entityId, string $path, string $template): int
    {
        $existing = $this->findCanonicalFor($entityType, $entityId);

        if ($existing === null) {
            $this->db->run(
                "INSERT INTO page_routes (path, entity_type, entity_id, template, is_canonical, status)
                 VALUES (?,?,?,?,1,'active')",
                [$path, $entityType, $entityId, $template],
            );
            return (int)$this->db->pdo()->lastInsertId();
        }

        $old = (string)$existing['path'];
        if ($old !== $path) {
            // A moved canonical leaves a 301 behind. DOMAIN-MODEL §3: a URL that
            // once worked must never start returning 404.
            $this->addRedirect($old, $path, 'canonical moved by publish');
        }
        $this->db->run(
            "UPDATE page_routes SET path = ?, template = ?, status = 'active' WHERE id = ?",
            [$path, $template, (int)$existing['id']],
        );
        return (int)$existing['id'];
    }

    /**
     * Take a route out of service without releasing the path. The row stays so
     * the URL remains reserved and Phase 3S can turn it into a 301 rather than
     * letting another entity claim it.
     */
    public function deactivate(string $entityType, int $entityId): ?string
    {
        $existing = $this->findCanonicalFor($entityType, $entityId);
        if ($existing === null) return null;
        $this->db->run(
            "UPDATE page_routes SET status = 'disabled', in_sitemap = 0 WHERE id = ?",
            [(int)$existing['id']],
        );
        return (string)$existing['path'];
    }

    public function addRedirect(string $from, string $to, string $note = ''): void
    {
        if ($from === $to) return;
        $this->db->run(
            'INSERT INTO redirects (from_path, to_path, status_code, note)
             VALUES (?,?,301,?)
             ON DUPLICATE KEY UPDATE to_path = VALUES(to_path), note = VALUES(note), enabled = 1',
            [$from, $to, substr($note, 0, 255)],
        );
    }

    public function findRedirect(string $from): ?array
    {
        return $this->db->one('SELECT * FROM redirects WHERE from_path = ? AND enabled = 1', [$from]);
    }

    /**
     * Resolve a public path to live content.
     * Returns null unless the route is active AND the entity is published —
     * an active route pointing at unpublished content must not leak it.
     */
    public function resolvePublic(string $path): ?array
    {
        $route = $this->findActiveByPath($path);
        if ($route === null) return null;
        $type = (string)$route['entity_type'];
        $id = (int)$route['entity_id'];
        if ($type === 'system' || $id === 0) return null;

        $table = match ($type) {
            'page' => 'pages', 'project' => 'projects', 'article' => 'articles',
            default => null,
        };
        if ($table === null) return null;

        $ok = (int)$this->db->scalar(
            'SELECT COUNT(*) FROM ' . $table . ' WHERE id = ? AND deleted_at IS NULL AND status = ?',
            [$id, ContentState::PUBLISHED],
        );
        if ($ok === 0) return null;

        return [
            'path'        => (string)$route['path'],
            'entity_type' => $type,
            'entity_id'   => $id,
            'template'    => (string)$route['template'],
        ];
    }
}
