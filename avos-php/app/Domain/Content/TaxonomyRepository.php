<?php
declare(strict_types=1);
namespace AvOS\Domain\Content;

use AvOS\Api\ApiException;
use AvOS\Content\Slug;
use AvOS\Database\Connection;

/**
 * Categories and tags for articles (Phase 3E §3E.12).
 *
 * ONLY the relationships the approved schema already contains:
 *   article → category   (article_categories, n:m)
 *   article → tag        (article_tags, n:m)
 *
 * DEFERRED — documented, not built, because no table represents them:
 *   project → tag        (no project_tags table)
 *   page → category      (no page_categories table)
 *   article → related article
 * See PHASE-3E-REPORT.md §Deferred relationships.
 */
final class TaxonomyRepository
{
    public function __construct(private readonly Connection $db) {}

    /** Resolve a name or slug to an existing term; create it if absent. */
    public function ensureCategory(string $nameOrSlug): int
    {
        return $this->ensure('categories', $nameOrSlug, true);
    }

    public function ensureTag(string $nameOrSlug): int
    {
        return $this->ensure('tags', $nameOrSlug, false);
    }

    private function ensure(string $table, string $nameOrSlug, bool $ordered): int
    {
        $name = trim($nameOrSlug);
        if ($name === '') throw ApiException::validation([$table => 'term must not be empty']);
        if (mb_strlen($name) > 190) throw ApiException::validation([$table => 'term is too long']);

        $slug = Slug::normalise($name);
        if (!Slug::isValid($slug)) {
            throw ApiException::validation([$table => 'term "' . $name . '" does not produce a usable slug']);
        }

        $id = $this->db->scalar('SELECT id FROM ' . $table . ' WHERE slug = ?', [$slug]);
        if ($id !== null && $id !== false) return (int)$id;

        $sql = $ordered
            ? 'INSERT INTO ' . $table . ' (slug, name, position) VALUES (?,?,0)'
            : 'INSERT INTO ' . $table . ' (slug, name) VALUES (?,?)';
        $this->db->run($sql, [$slug, $name]);
        return (int)$this->db->pdo()->lastInsertId();
    }

    /** @param string[] $terms replaces the whole set (idempotent) */
    public function setArticleCategories(int $articleId, array $terms): void
    {
        $ids = array_values(array_unique(array_map(fn(string $t): int => $this->ensureCategory($t), $terms)));
        $this->db->run('DELETE FROM article_categories WHERE article_id = ?', [$articleId]);
        foreach ($ids as $cid) {
            $this->db->run(
                'INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (?,?)',
                [$articleId, $cid],
            );
        }
    }

    /** @param string[] $terms */
    public function setArticleTags(int $articleId, array $terms): void
    {
        $ids = array_values(array_unique(array_map(fn(string $t): int => $this->ensureTag($t), $terms)));
        $this->db->run('DELETE FROM article_tags WHERE article_id = ?', [$articleId]);
        foreach ($ids as $tid) {
            $this->db->run('INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (?,?)', [$articleId, $tid]);
        }
    }

    /** @return string[] slugs */
    public function categorySlugs(int $articleId): array
    {
        return array_column($this->db->all(
            'SELECT c.slug FROM article_categories ac
               JOIN categories c ON c.id = ac.category_id
              WHERE ac.article_id = ? ORDER BY c.position, c.slug',
            [$articleId],
        ), 'slug');
    }

    /** @return string[] slugs */
    public function tagSlugs(int $articleId): array
    {
        return array_column($this->db->all(
            'SELECT t.slug FROM article_tags at2
               JOIN tags t ON t.id = at2.tag_id
              WHERE at2.article_id = ? ORDER BY t.slug',
            [$articleId],
        ), 'slug');
    }

    /** Referential guard used by ProjectService before writing client_id. */
    public function clientExists(int $clientId): bool
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM clients WHERE id = ? AND deleted_at IS NULL',
            [$clientId],
        ) > 0;
    }

    public function mediaExists(int $mediaId): bool
    {
        return (int)$this->db->scalar('SELECT COUNT(*) FROM media WHERE id = ?', [$mediaId]) > 0;
    }

    public function userExists(int $userId): bool
    {
        return (int)$this->db->scalar(
            'SELECT COUNT(*) FROM users WHERE id = ? AND deleted_at IS NULL',
            [$userId],
        ) > 0;
    }
}
