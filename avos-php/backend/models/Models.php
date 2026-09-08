<?php
/**
 * AV OS — ContentStore: the CMS document model over MySQL.
 * One JSON document per entity area; atomic load/save with versioning.
 */
final class ContentStore
{
    /** Full site document merged from content_store rows */
    public static function all(): array
    {
        $rows = Database::all("SELECT key_name, data FROM content_store");
        $doc = [];
        foreach ($rows as $r) {
            $doc[$r['key_name']] = json_decode($r['data'], true) ?? [];
        }
        return $doc;
    }

    public static function get(string $key): array
    {
        $r = Database::one("SELECT data FROM content_store WHERE key_name=?", [$key]);
        return $r ? (json_decode($r['data'], true) ?? []) : [];
    }

    public static function put(string $key, array $value, ?int $userId = null, string $note = ''): void
    {
        Database::q(
            "INSERT INTO content_store (key_name, data, updated_by) VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE data=VALUES(data), updated_by=VALUES(updated_by)",
            [$key, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $userId]
        );
        // version snapshot (keep last 50 per entity)
        $v = (int)(Database::one("SELECT COALESCE(MAX(version),0)+1 v FROM versions WHERE entity='store' AND entity_id=?", [$key])['v']);
        Database::q(
            "INSERT INTO versions (entity, entity_id, version, data, user_id, note) VALUES ('store',?,?,?,?,?)",
            [$key, $v, json_encode($value), $userId, $note]
        );
        Database::q(
            "DELETE FROM versions WHERE entity='store' AND entity_id=? AND version <= (
               SELECT m FROM (SELECT COALESCE(MAX(version),0)-50 m FROM versions WHERE entity='store' AND entity_id=?) t)",
            [$key, $key]
        );
    }

    public static function versions(string $key): array
    {
        return Database::all("SELECT version, note, created_at FROM versions WHERE entity='store' AND entity_id=? ORDER BY version DESC LIMIT 50", [$key]);
    }

    public static function restore(string $key, int $version): bool
    {
        $r = Database::one("SELECT data FROM versions WHERE entity='store' AND entity_id=? AND version=?", [$key, $version]);
        if (!$r) return false;
        self::put($key, json_decode($r['data'], true) ?? [], Auth::user()['id'] ?? null, "restored v{$version}");
        return true;
    }
}

final class MediaModel
{
    public static function create(array $m, ?int $userId): int
    {
        Database::q(
            "INSERT INTO media (filename, original_name, type, mime, size, width, height, folder, alt_text, tags, url, webp_url, avif_url, thumb_url, created_by)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [$m['filename'], $m['original_name'], $m['type'], $m['mime'] ?? '', $m['size'] ?? 0, $m['width'] ?? 0, $m['height'] ?? 0,
             $m['folder'] ?? 'Uploads', $m['alt_text'] ?? '', json_encode($m['tags'] ?? []),
             $m['url'], $m['webp_url'] ?? null, $m['avif_url'] ?? null, $m['thumb_url'] ?? null, $userId]
        );
        return (int)Database::pdo()->lastInsertId();
    }

    public static function all(array $opts = []): array
    {
        $where = [empty($opts['trashed']) ? "deleted_at IS NULL" : "deleted_at IS NOT NULL"];
        $params = [];
        $limit = min(100, max(1, (int)($opts['limit'] ?? 100)));
        $page = max(1, (int)($opts['page'] ?? 1));
        if (!empty($opts['folder'])) { $where[] = "folder=?"; $params[] = $opts['folder']; }
        if (!empty($opts['type'])) { $where[] = "type=?"; $params[] = $opts['type']; }
        if (!empty($opts['q'])) { $where[] = "(original_name LIKE ? OR alt_text LIKE ? OR tags LIKE ?)"; $p = '%' . $opts['q'] . '%'; array_push($params, $p, $p, $p); }
        $off = ($page - 1) * $limit;
        return Database::all(
            "SELECT * FROM media WHERE " . implode(' AND ', $where) . " ORDER BY created_at DESC LIMIT $limit OFFSET $off",
            $params
        );
    }

    public static function find(int $id): ?array
    {
        return Database::one("SELECT * FROM media WHERE id=?", [$id]);
    }

    public static function delete(int $id): void
    {
        Database::q("DELETE FROM media WHERE id=?", [$id]);
    }
}

final class LeadModel
{
    public static function create(array $l): int
    {
        Database::q(
            "INSERT INTO leads (name, company, email, country_code, phone_number, phone, lead_type, message, source, page, referrer,
                                utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                                status, score, tags, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [$l['name'], $l['company'] ?? '', $l['email'] ?? '', $l['country_code'] ?? '', $l['phone_number'] ?? '', $l['phone'] ?? '',
             $l['lead_type'] ?? '', $l['message'] ?? '', $l['source'] ?? '', $l['page'] ?? '', $l['referrer'] ?? '',
             $l['utm_source'] ?? '', $l['utm_medium'] ?? '', $l['utm_campaign'] ?? '',
             $l['utm_term'] ?? '', $l['utm_content'] ?? '',
             $l['status'] ?? 'new', $l['score'] ?? 50,
             json_encode($l['tags'] ?? []), $l['notes'] ?? '']
        );
        return (int)Database::pdo()->lastInsertId();
    }

    public static function all(array $opts = []): array
    {
        $where = [empty($opts['trashed']) ? "deleted_at IS NULL" : "deleted_at IS NOT NULL"];
        $params = [];
        $limit = min(100, max(1, (int)($opts['limit'] ?? 100)));
        $page = max(1, (int)($opts['page'] ?? 1));
        if (!empty($opts['status'])) { $where[] = "status=?"; $params[] = $opts['status']; }
        if (!empty($opts['q'])) { $where[] = "(name LIKE ? OR email LIKE ? OR company LIKE ?)"; $p = '%' . $opts['q'] . '%'; array_push($params, $p, $p, $p); }
        $sort = in_array($opts['sort'] ?? '', ['created_at', 'score', 'name'], true) ? $opts['sort'] : 'created_at';
        $dir = ($opts['dir'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';
        $off = ($page - 1) * $limit;
        return Database::all(
            "SELECT * FROM leads WHERE " . implode(' AND ', $where) . " ORDER BY $sort $dir LIMIT $limit OFFSET $off",
            $params
        );
    }

    public static function count(array $opts = []): int
    {
        $where = [empty($opts['trashed']) ? "deleted_at IS NULL" : "deleted_at IS NOT NULL"];
        $params = [];
        if (!empty($opts['status'])) { $where[] = "status=?"; $params[] = $opts['status']; }
        return (int)Database::one("SELECT COUNT(*) n FROM leads WHERE " . implode(' AND ', $where), $params)['n'];
    }

    public static function findRecentByEmail(string $email, int $hours = 24): ?array
    {
        if ($email === '') return null;
        return Database::one(
            "SELECT * FROM leads WHERE email=? AND deleted_at IS NULL AND created_at > NOW() - INTERVAL ? HOUR ORDER BY id DESC LIMIT 1",
            [$email, $hours]
        );
    }

    public static function update(int $id, array $d): void
    {
        $fields = ['name','company','email','country_code','phone_number','phone','lead_type','message','source','status','score','notes'];
        $sets = [];
        $params = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $params[] = $d[$f]; }
        }
        if (isset($d['tags'])) { $sets[] = "tags=?"; $params[] = json_encode($d['tags']); }
        if (!$sets) return;
        $sets[] = "updated_at=NOW()";
        $params[] = $id;
        Database::q("UPDATE leads SET " . implode(',', $sets) . " WHERE id=?", $params);
    }

    /** Soft delete (restore via TrashModel). */
    public static function delete(int $id): void
    {
        TrashModel::trash('leads', $id);
    }
}

final class FormModel
{
    public static function submit(array $data, ?int $formId = null, string $status = 'new'): int
    {
        Database::q(
            "INSERT INTO form_submissions (form_id, data, status, ip) VALUES (?,?,?,?)",
            [$formId, json_encode($data), $status, Auth::ip()]
        );
        return (int)Database::pdo()->lastInsertId();
    }

    public static function all(): array
    {
        return Database::all("SELECT * FROM form_submissions ORDER BY created_at DESC");
    }

    public static function setStatus(int $id, string $status): void
    {
        Database::q("UPDATE form_submissions SET status=? WHERE id=?", [$status, $id]);
    }
}

final class UserModel
{
    public static function create(string $name, string $email, string $password, int $roleId): int
    {
        Database::q("INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?,?,?,?, 'active')",
            [$name, $email, password_hash($password, PASSWORD_DEFAULT), $roleId]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function all(): array
    {
        return Database::all("SELECT u.id, u.name, u.email, u.status, u.twofa_enabled, u.last_login_at, r.name role_name
                              FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.id");
    }

    public static function setPassword(int $id, string $password): void
    {
        Database::q("UPDATE users SET password_hash=? WHERE id=?", [password_hash($password, PASSWORD_DEFAULT), $id]);
    }
}
