<?php
/**
 * AV OS — DATA INTELLIGENCE MODELS (v2.4)
 * Search fusion · research engine · knowledge graph · truth layer
 * case-study intelligence · social registry · trackable links
 * agent outcomes · dev intelligence · knowledge ingestion.
 *
 * All "recent X" comparisons are done in SQL (NOW() - INTERVAL ...)
 * because MySQL timestamps are UTC while PHP runs Asia/Kolkata.
 */

/* ============================================================
   SEARCH CONSOLE / SEARCH FUSION
   ============================================================ */
final class SearchConsoleModel
{
    /** Fused overview: Google + Bing + internal analytics, source-attributed. */
    public static function overview(int $days = 28): array
    {
        $from = date('Y-m-d', strtotime("-{$days} days"));
        $bySource = [];
        foreach (['google', 'bing'] as $src) {
            $r = Database::one(
                "SELECT COALESCE(SUM(clicks),0) clicks, COALESCE(SUM(impressions),0) impressions,
                        COALESCE(AVG(position),0) position
                 FROM search_console_daily WHERE source=? AND ddate>=?", [$src, $from]);
            $bySource[$src] = [
                'clicks' => (int)$r['clicks'], 'impressions' => (int)$r['impressions'],
                'position' => round((float)$r['position'], 1),
                'ctr' => ((int)$r['impressions'] > 0) ? round((int)$r['clicks'] / (int)$r['impressions'] * 100, 2) : 0,
            ];
        }
        $trend = Database::all(
            "SELECT source, ddate, clicks, impressions, position FROM search_console_daily
             WHERE ddate>=? ORDER BY ddate", [$from]);
        $internal = (int)Database::one(
            "SELECT COUNT(*) n FROM analytics_events WHERE event_type='page_view' AND created_at > NOW() - INTERVAL ? DAY",
            [$days])['n'];
        return ['sources' => $bySource, 'trend' => $trend, 'internal_pageviews' => $internal, 'days' => $days];
    }

    /** Top queries with opportunity signal (position 4–20 = quick win band). */
    public static function queries(int $limit = 100, string $source = ''): array
    {
        $src = $source !== '' ? "AND source='" . Database::escape($source) . "'" : '';
        return Database::all(
            "SELECT query, SUM(clicks) clicks, SUM(impressions) impressions,
                    ROUND(AVG(position),1) position,
                    ROUND(SUM(clicks)/NULLIF(SUM(impressions),0)*100,2) ctr,
                    MAX(ddate) last_seen, COUNT(DISTINCT ddate) days_seen
             FROM search_console_queries WHERE ddate >= NOW() - INTERVAL 28 DAY $src
             GROUP BY query ORDER BY impressions DESC LIMIT $limit");
    }

    public static function pages(int $limit = 100): array
    {
        return Database::all(
            "SELECT page, SUM(clicks) clicks, SUM(impressions) impressions,
                    ROUND(AVG(position),1) position,
                    ROUND(SUM(clicks)/NULLIF(SUM(impressions),0)*100,2) ctr, MAX(ddate) last_seen
             FROM search_console_pages WHERE ddate >= NOW() - INTERVAL 28 DAY
             GROUP BY page ORDER BY impressions DESC LIMIT $limit");
    }

    /**
     * Quick wins: queries in position 4–20 with meaningful impressions.
     * Each recommendation is computed from REAL stored data.
     */
    public static function quickWins(int $limit = 20): array
    {
        $rows = self::queries(500);
        $wins = [];
        foreach ($rows as $r) {
            $pos = (float)$r['position'];
            $imp = (int)$r['impressions'];
            $ctr = (float)$r['ctr'];
            if ($pos < 4 || $pos > 20 || $imp < 50) continue;
            $recs = [];
            if ($ctr < 2.0 && $pos <= 15) {
                $recs[] = 'Improve title + meta description (position ' . $pos . ', CTR ' . $ctr . '%)';
            }
            if ($imp > 300 && $pos > 10) {
                $recs[] = 'Content expansion — the query has demand but low visibility';
            }
            if ($pos >= 4 && $pos <= 8) {
                $recs[] = 'SERP positioning — add internal links from authority pages';
            }
            if (!$recs) continue;
            // business relevance: keywords table match
            $kw = KeywordModel::keywords(['limit' => 500]);
            $relevance = 50;
            foreach ($kw as $k) {
                if (mb_stripos($r['query'], $k['keyword']) !== false || mb_stripos($k['keyword'], $r['query']) !== false) {
                    $relevance = min(100, $relevance + 40);
                }
            }
            // opportunity score (0-100): position band + CTR + demand + relevance
            $score = 35;
            if ($pos <= 8) $score += 25; elseif ($pos <= 12) $score += 20; elseif ($pos <= 16) $score += 15; else $score += 10;
            if ($ctr < 2.0) $score += 10; elseif ($ctr <= 5.0) $score += 5;
            if ($imp >= 1000) $score += 10; elseif ($imp >= 300) $score += 5; elseif ($imp >= 100) $score += 2;
            $score += (int)round(($relevance - 50) / 50 * 20);   // 0-20
            $score = min(100, max(5, $score));
            $wins[] = [
                'query' => $r['query'], 'impressions' => $imp, 'clicks' => (int)$r['clicks'],
                'ctr' => $ctr, 'position' => $pos, 'relevance' => $relevance,
                'recommendations' => $recs, 'opportunity_score' => min(100, $score),
            ];
        }
        usort($wins, fn($a, $b) => $b['opportunity_score'] <=> $a['opportunity_score']);
        return array_slice($wins, 0, $limit);
    }

    /** High-traffic + low conversion pages → CRO agent queue. */
    public static function croCandidates(int $limit = 10): array
    {
        $pages = self::pages(200);
        $out = [];
        foreach ($pages as $p) {
            if ((int)$p['impressions'] < 200 || (float)$p['ctr'] < 1.5) continue;
            $slug = trim(parse_url((string)$p['page'], PHP_URL_PATH) ?: '', '/');
            $slug = str_replace(['.html', 'essay-', 'journal-'], ['', '', ''], $slug);
            $leads = (int)Database::one(
                "SELECT COUNT(*) n FROM leads WHERE source_page LIKE ? AND created_at > NOW() - INTERVAL 90 DAY",
                ['%' . $slug . '%'])['n'];
            $out[] = [
                'page' => $p['page'], 'impressions' => (int)$p['impressions'], 'clicks' => (int)$p['clicks'],
                'ctr' => (float)$p['ctr'], 'position' => (float)$p['position'],
                'leads_90d' => $leads,
                'conversion_gap' => $leads === 0 ? 'high' : 'medium',
            ];
        }
        usort($out, fn($a, $b) => $b['impressions'] <=> $a['impressions']);
        return array_slice($out, 0, $limit);
    }

    /** Fused opportunity: search data × keyword registry × business relevance. */
    public static function opportunities(int $limit = 15): array
    {
        $wins = self::quickWins(50);
        $kw = KeywordModel::opportunities(50);
        $out = [];
        foreach (array_slice($wins, 0, $limit) as $w) {
            $out[] = [
                'type' => 'search_quick_win',
                'title' => $w['query'],
                'score' => $w['opportunity_score'],
                'data' => $w,
                'effort' => $w['position'] <= 10 ? 'low' : 'medium',
                'confidence' => min(97, 70 + $w['relevance'] / 5),
            ];
        }
        foreach (array_slice($kw, 0, max(0, $limit - count($out))) as $k) {
            $out[] = [
                'type' => 'keyword_opportunity',
                'title' => $k['keyword'] ?? $k['query'] ?? 'keyword',
                'score' => $k['score'] ?? 50,
                'data' => $k,
                'effort' => $k['effort'] ?? 'medium',
                'confidence' => $k['confidence'] ?? 80,
            ];
        }
        usort($out, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($out, 0, $limit);
    }

    /** Manual import from a Search Console CSV export (free fallback path). */
    public static function importCsv(string $csv, string $source = 'google'): array
    {
        $lines = preg_split('/\r\n|\n|\r/', trim($csv));
        $header = null;
        $imported = 0;
        foreach ($lines as $line) {
            if ($line === '') continue;
            $cols = str_getcsv($line, ',', '"', '\\');
            if ($header === null) { $header = array_map('trim', $cols); continue; }
            $row = array_combine(array_map(fn($h) => strtolower(str_replace([' ', '-'], '_', $h)), $header), $cols);
            $q = trim((string)($row['top_queries'] ?? $row['query'] ?? ''));
            $page = trim((string)($row['page'] ?? ''));
            $ddate = trim((string)($row['date'] ?? ''));
            $clicks = (int)($row['clicks'] ?? 0);
            $imp = (int)($row['impressions'] ?? 0);
            $pos = (float)($row['position'] ?? $row['avg_position'] ?? 0);
            $ctr = $imp ? $clicks / $imp : 0;
            if ($q === '' && $page === '') continue;
            if ($ddate === '') $ddate = date('Y-m-d');
            $ddate = date('Y-m-d', strtotime($ddate));
            if (!$ddate) continue;
            $src = $source === 'bing' ? 'bing' : 'google';
            if ($q !== '') {
                Database::q("INSERT INTO search_console_queries (source, property, query, page, clicks, impressions, ctr, position, ddate, retrieved_at)
                             VALUES (?,?,?,?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions), ctr=VALUES(ctr), position=VALUES(position), retrieved_at=NOW()",
                    [$src, 'import', mb_substr($q, 0, 300), mb_substr($page, 0, 400), $clicks, $imp, $ctr, $pos, $ddate]);
                $imported++;
            }
            if ($page !== '') {
                Database::q("INSERT INTO search_console_pages (source, property, page, clicks, impressions, ctr, position, ddate, retrieved_at)
                             VALUES (?,?,?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions), ctr=VALUES(ctr), position=VALUES(position), retrieved_at=NOW()",
                    [$src, 'import', mb_substr($page, 0, 400), $clicks, $imp, $ctr, $pos, $ddate]);
            }
            Database::q("INSERT INTO search_console_daily (source, property, ddate, clicks, impressions, ctr, position, retrieved_at)
                         VALUES (?,?,?,?,?,?,?,NOW())
                         ON DUPLICATE KEY UPDATE clicks=clicks+VALUES(clicks), impressions=impressions+VALUES(impressions),
                         ctr=(ctr*impressions+VALUES(ctr)*VALUES(impressions))/(impressions+VALUES(impressions)),
                         position=(position*impressions+VALUES(position)*VALUES(impressions))/(impressions+VALUES(impressions)),
                         retrieved_at=NOW()",
                [$src, 'import', $ddate, $clicks, $imp, $ctr, $pos]);
        }
        return ['imported' => $imported];
    }
}

/* ============================================================
   RESEARCH ENGINE (RSS/Atom — free, open standard)
   ============================================================ */
final class ResearchModel
{
    public static function sources(): array
    {
        return Database::all("SELECT * FROM research_sources ORDER BY priority='high' DESC, name");
    }

    public static function sourceSave(?int $id, array $d): int
    {
        $name = trim((string)($d['name'] ?? ''));
        $url = trim((string)($d['rss_url'] ?? ''));
        if ($name === '' || $url === '') throw new RuntimeException('Name and RSS URL are required');
        if (!preg_match('~^https?://~i', $url)) throw new RuntimeException('RSS URL must be http(s)');
        if ($id) {
            Database::q("UPDATE research_sources SET name=?, rss_url=?, topic=?, priority=?, enabled=?, authority=?, relevance=?, freshness=?, trust=? WHERE id=?",
                [$name, $url, (string)($d['topic'] ?? 'general'), (string)($d['priority'] ?? 'medium'), (int)($d['enabled'] ?? 1),
                 (int)($d['authority'] ?? 50), (int)($d['relevance'] ?? 50), (int)($d['freshness'] ?? 50), (int)($d['trust'] ?? 50), $id]);
            return $id;
        }
        Database::q("INSERT INTO research_sources (name, rss_url, topic, priority, enabled, authority, relevance, freshness, trust)
                     VALUES (?,?,?,?,?,?,?,?,?)",
            [$name, $url, (string)($d['topic'] ?? 'general'), (string)($d['priority'] ?? 'medium'), (int)($d['enabled'] ?? 1),
             (int)($d['authority'] ?? 50), (int)($d['relevance'] ?? 50), (int)($d['freshness'] ?? 50), (int)($d['trust'] ?? 50)]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function sourceDelete(int $id): void
    {
        Database::q("DELETE FROM research_sources WHERE id=?", [$id]);
    }

    /** Fetch + store items from one source. Returns number of NEW items. */
    public static function fetchSource(int $id): int
    {
        $src = Database::one("SELECT * FROM research_sources WHERE id=?", [$id]);
        if (!$src) throw new RuntimeException('Source not found');
        if (!(int)$src['enabled']) return 0;
        $res = IntegrationHub::http('GET', $src['rss_url'], [], null, 20, true, 'research');
        if (!$res['ok']) throw new RuntimeException('HTTP ' . $res['status'] . ' ' . ($res['error'] ?? ''));
        $body = $res['body'];
        $items = self::parseFeed($body);
        if (!$items) throw new RuntimeException('No parseable items in feed');
        $new = 0;
        foreach ($items as $it) {
            try {
                Database::q("INSERT INTO research_items (source_id, guid, title, url, author, summary, published_at, fetched_at, processed)
                             VALUES (?,?,?,?,?,?,?,NOW(),0)
                             ON DUPLICATE KEY UPDATE title=VALUES(title), summary=VALUES(summary), processed=0",
                    [$id, mb_substr($it['guid'], 0, 190), mb_substr($it['title'], 0, 300), mb_substr($it['url'], 0, 600),
                     mb_substr($it['author'] ?? '', 0, 120), mb_substr($it['summary'] ?? '', 0, 4000),
                     $it['published'] ? date('Y-m-d H:i:s', $it['published']) : null]);
                $new++;
            } catch (Throwable $e) { /* duplicate guid — skip */ }
        }
        Database::q("UPDATE research_sources SET last_fetched=NOW(), last_error='' WHERE id=?", [$id]);
        return $new;
    }

    /** Parse RSS 2.0 / Atom / RDF into normalized items. */
    public static function parseFeed(string $body): array
    {
        $items = [];
        $xml = @simplexml_load_string($body);
        if ($xml === false) return [];
        // Atom
        if (isset($xml->entry)) {
            foreach ($xml->entry as $e) {
                $items[] = [
                    'guid' => (string)($e->id ?? ('atom:' . md5((string)$e->title))),
                    'title' => trim((string)$e->title),
                    'url' => (string)$e->link['href'],
                    'author' => trim((string)($e->author->name ?? '')),
                    'summary' => trim(strip_tags((string)($e->summary ?? $e->content ?? ''))),
                    'published' => strtotime((string)($e->published ?? $e->updated ?? '')),
                ];
            }
            return $items;
        }
        // RSS 2.0
        if (isset($xml->channel->item)) {
            foreach ($xml->channel->item as $e) {
                $items[] = [
                    'guid' => (string)($e->guid ?? ('rss:' . md5((string)$e->link . (string)$e->title))),
                    'title' => trim((string)$e->title),
                    'url' => (string)$e->link,
                    'author' => trim((string)($e->author ?? $e->creator ?? '')),
                    'summary' => trim(strip_tags((string)($e->description ?? ''))),
                    'published' => strtotime((string)$e->pubDate),
                ];
            }
            return $items;
        }
        // RDF
        $ns = $xml->getNamespaces(true);
        $rdf = $xml->children($ns['rdf'] ?? 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
        foreach ($rdf->item ?? [] as $e) {
            $items[] = [
                'guid' => 'rdf:' . md5((string)$e->link),
                'title' => trim((string)$e->title),
                'url' => (string)$e->link,
                'author' => '',
                'summary' => trim(strip_tags((string)$e->description)),
                'published' => null,
            ];
        }
        return $items;
    }

    public static function items(int $limit = 100, int $days = 30): array
    {
        return Database::all(
            "SELECT ri.*, rs.name source_name, rs.topic, rs.authority
             FROM research_items ri LEFT JOIN research_sources rs ON rs.id = ri.source_id
             WHERE ri.created_at > NOW() - INTERVAL ? DAY
             ORDER BY ri.published_at IS NULL, ri.published_at DESC LIMIT $limit", [$days]);
    }

    /** Unprocessed items → used by the Research agent. */
    public static function unprocessed(int $limit = 30): array
    {
        return Database::all("SELECT * FROM research_items WHERE processed=0 ORDER BY id DESC LIMIT $limit");
    }

    public static function markProcessed(array $ids): void
    {
        if (!$ids) return;
        $in = implode(',', array_map('intval', $ids));
        Database::q("UPDATE research_items SET processed=1 WHERE id IN ($in)");
    }
}

/* ============================================================
   KNOWLEDGE GRAPH
   ============================================================ */
final class KnowledgeGraphModel
{
    public static function upsertNode(string $type, string $id, string $label, array $props = [], string $source = 'system'): void
    {
        Database::q("INSERT INTO knowledge_graph (entity_type, entity_id, label, properties, source)
                     VALUES (?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE label=VALUES(label), properties=VALUES(properties)",
            [$type, $id, mb_substr($label, 0, 200), json_encode($props, JSON_UNESCAPED_UNICODE), $source]);
    }

    public static function upsertEdge(string $fromType, string $fromId, string $toType, string $toId, string $relation, int $weight = 1, string $evidence = '', int $verified = 0): void
    {
        Database::q("INSERT INTO knowledge_edges (from_type, from_id, to_type, to_id, relation, weight, evidence, verified)
                     VALUES (?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE weight=VALUES(weight), evidence=VALUES(evidence)",
            [$fromType, $fromId, $toType, $toId, $relation, $weight, mb_substr($evidence, 0, 300), $verified]);
    }

    public static function nodes(): array
    {
        return Database::all("SELECT * FROM knowledge_graph ORDER BY entity_type, label");
    }

    public static function edges(): array
    {
        return Database::all("SELECT * FROM knowledge_edges ORDER BY id DESC LIMIT 500");
    }

    /** All context reachable from an entity (breadth-limited). */
    public static function context(string $type, string $id, int $depth = 2): array
    {
        $out = [];
        $seen = [];
        $frontier = [[$type, $id, 0]];
        while ($frontier) {
            [$t, $i, $d] = array_shift($frontier);
            $key = $t . ':' . $i;
            if (isset($seen[$key]) || $d > $depth) continue;
            $seen[$key] = true;
            $node = Database::one("SELECT * FROM knowledge_graph WHERE entity_type=? AND entity_id=?", [$t, $i]);
            if ($node) $out[] = $node;
            if ($d >= $depth) continue;
            foreach (Database::all(
                "SELECT to_type, to_id, relation FROM knowledge_edges WHERE from_type=? AND from_id=? UNION ALL
                 SELECT from_type, from_id, relation FROM knowledge_edges WHERE to_type=? AND to_id=?",
                [$t, $i, $t, $i]) as $e) {
                if ($e['to_type'] === $t && $e['to_id'] === $i) {
                    $frontier[] = [$e['from_type'], $e['from_id'], $d + 1];
                } else {
                    $frontier[] = [$e['to_type'], $e['to_id'], $d + 1];
                }
            }
        }
        return $out;
    }

    /** Build the base graph from real site content (idempotent). */
    public static function buildFromContent(): int
    {
        $doc = ContentStore::all();
        $n = 0;
        foreach (($doc['projects'] ?? []) as $p) {
            $slug = (string)($p['slug'] ?? '');
            if (!$slug) continue;
            self::upsertNode('project', $slug, (string)($p['title'] ?? $slug), ['year' => $p['year'] ?? '', 'tags' => $p['tags'] ?? []], 'content');
            self::upsertNode('person', 'abhijeet', 'Abhijeet Varghese', [], 'content');
            self::upsertEdge('person', 'abhijeet', 'project', $slug, 'led', 3, 'project record', 1);
            foreach (($p['tags'] ?? []) as $tag) {
                self::upsertNode('technology', strtolower((string)$tag), (string)$tag, [], 'content');
                self::upsertEdge('project', $slug, 'technology', strtolower((string)$tag), 'uses', 1, 'project tags', 1);
            }
            if (!empty($p['client'])) {
                self::upsertNode('client', strtolower((string)$p['client']), (string)$p['client'], [], 'content');
                self::upsertEdge('person', 'abhijeet', 'client', strtolower((string)$p['client']), 'worked_with', 3, 'project record', 1);
                self::upsertEdge('project', $slug, 'client', strtolower((string)$p['client']), 'for', 2, 'project record', 1);
            }
            $n++;
        }
        foreach (($doc['articles'] ?? []) as $a) {
            $slug = (string)($a['slug'] ?? '');
            if (!$slug) continue;
            self::upsertNode('article', $slug, (string)($a['title'] ?? $slug), ['category' => $a['category'] ?? ''], 'content');
            self::upsertEdge('person', 'abhijeet', 'article', $slug, 'wrote', 2, 'article record', 1);
            $n++;
        }
        foreach (($doc['clients'] ?? []) as $c) {
            $name = (string)($c['name'] ?? '');
            if (!$name) continue;
            self::upsertNode('client', strtolower($name), $name, [], 'content');
            self::upsertEdge('person', 'abhijeet', 'client', strtolower($name), 'worked_with', 2, 'client record', 1);
            $n++;
        }
        return $n;
    }
}

/* ============================================================
   TRUTH LAYER (facts)
   ============================================================ */
final class FactsModel
{
    public static function all(string $status = '', int $limit = 200): array
    {
        $where = $status !== '' ? "WHERE status=" . Database::quote($status) : '';
        return Database::all("SELECT * FROM facts $where ORDER BY FIELD(status,'verified','inferred','unverified','external','opinion','deprecated'), id DESC LIMIT $limit");
    }

    public static function create(array $d): int
    {
        Database::q("INSERT INTO facts (claim, status, category, evidence, source, confidence, created_by)
                     VALUES (?,?,?,?,?,?,?)",
            [mb_substr((string)($d['claim'] ?? ''), 0, 2000), (string)($d['status'] ?? 'unverified'),
             (string)($d['category'] ?? 'general'), (string)($d['evidence'] ?? ''), (string)($d['source'] ?? ''),
             (int)($d['confidence'] ?? 50), (string)($d['created_by'] ?? 'system')]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function updateStatus(int $id, string $status, string $verifiedBy = ''): void
    {
        Database::q("UPDATE facts SET status=?, verified_by=? WHERE id=?", [$status, $verifiedBy, $id]);
    }

    public static function delete(int $id): void
    {
        Database::q("DELETE FROM facts WHERE id=?", [$id]);
    }

    /** Classify an AI-generated claim against the truth layer. */
    public static function classify(string $claim): array
    {
        $facts = self::all('', 500);
        foreach ($facts as $f) {
            $a = mb_strtolower(trim($f['claim']));
            $b = mb_strtolower(trim($claim));
            if ($a !== '' && $b !== '' && (str_contains($a, $b) || str_contains($b, $a)) && mb_strlen($b) >= 12) {
                return ['status' => $f['status'], 'matched' => $f['claim'], 'confidence' => (int)$f['confidence']];
            }
        }
        // keyword-based heuristics for numbers/claims we can never invent
        if (preg_match('/(\d+%|\d+ projects|\d+ clients|\d+ years?)/i', $claim)) {
            return ['status' => 'unverified', 'matched' => '', 'confidence' => 30];
        }
        return ['status' => 'unverified', 'matched' => '', 'confidence' => 40];
    }

    /** Seed verified facts from the REAL content store (site truth). */
    public static function seedFromContent(): int
    {
        $doc = ContentStore::all();
        $n = 0;
        $settings = $doc['settings'] ?? [];
        $name = (string)($settings['site_name'] ?? 'Abhijeet Varghese');
        $role = (string)($settings['role'] ?? 'Experience Design Consultant');
        $n += (int)self::ensure('owner', 'The owner of abhijeetvarghese.com is ' . $name, 'verified', 'site settings', 'content_store', 100);
        $n += (int)self::ensure('positioning', $name . ' is positioned as a ' . $role, 'verified', 'site settings', 'content_store', 100);
        foreach (($doc['projects'] ?? []) as $p) {
            if (!empty($p['client']) && !empty($p['title'])) {
                $n += (int)self::ensure('client', 'Project "' . $p['title'] . '" was delivered for ' . $p['client'], 'verified', 'project record', 'content_store', 95);
            }
        }
        return $n;
    }

    private static function ensure(string $category, string $claim, string $status, string $source, string $createdBy, int $confidence): bool
    {
        $exists = Database::one("SELECT id FROM facts WHERE claim=? LIMIT 1", [$claim]);
        if ($exists) return false;
        Database::q("INSERT INTO facts (claim, status, category, source, confidence, created_by)
                     VALUES (?,?,?,?,?,?)", [$claim, $status, $category, $source, $confidence, $createdBy]);
        return true;
    }
}

/* ============================================================
   CASE STUDY INTELLIGENCE
   ============================================================ */
final class CaseStudyModel
{
    private const DIMENSIONS = ['context', 'challenge', 'role', 'strategy', 'process', 'execution', 'leadership', 'technology', 'outcome', 'visual_evidence'];

    public static function scoreProject(array $project): array
    {
        $dims = [];
        foreach (self::DIMENSIONS as $d) {
            $val = match ($d) {
                'context' => !empty($project['context']) || !empty($project['summary']) || !empty($project['lede']),
                'challenge' => !empty($project['challenge']) || !empty($project['problem']),
                'role' => !empty($project['role']) || !empty($project['my_role']),
                'strategy' => !empty($project['strategy']) || !empty($project['approach']),
                'process' => !empty($project['process']) || !empty($project['method']),
                'execution' => !empty($project['execution']) || !empty($project['details']),
                'leadership' => !empty($project['leadership']) || !empty($project['responsibilities']),
                'technology' => !empty($project['tech']) || !empty($project['technologies']) || !empty($project['tags']),
                'outcome' => !empty($project['outcome']) || !empty($project['results']) || !empty($project['impact']),
                'visual_evidence' => !empty($project['images']) || !empty($project['gallery']) || !empty($project['cover']),
                default => false,
            };
            $dims[$d] = $val ? 1 : 0;
        }
        $score = (int)round(array_sum($dims) / count($dims) * 100);
        $missing = array_keys(array_filter($dims, fn($v) => !$v));
        return ['score' => $score, 'dimensions' => $dims, 'missing' => $missing];
    }

    public static function refreshAll(): int
    {
        $doc = ContentStore::all();
        $n = 0;
        foreach (($doc['projects'] ?? []) as $p) {
            $slug = (string)($p['slug'] ?? ($p['id'] ?? ''));
            if ($slug === '') $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', (string)($p['title'] ?? 'prj')), '-'));
            if ($slug === '') continue;
            $r = self::scoreProject($p);
            Database::q("INSERT INTO case_study_scores (project_slug, project_title, score, dimensions, missing)
                         VALUES (?,?,?,?,?)
                         ON DUPLICATE KEY UPDATE project_title=VALUES(project_title), score=VALUES(score),
                         dimensions=VALUES(dimensions), missing=VALUES(missing)",
                [$slug, (string)($p['title'] ?? $slug), $r['score'], json_encode($r['dimensions']),
                 json_encode($r['missing'])]);
            $n++;
        }
        return $n;
    }

    public static function all(): array
    {
        return Database::all("SELECT * FROM case_study_scores ORDER BY score ASC, project_title");
    }

    public static function average(): int
    {
        $r = Database::one("SELECT ROUND(AVG(score),0) a FROM case_study_scores");
        return (int)$r['a'];
    }
}

/* ============================================================
   SOCIAL PROFILE REGISTRY
   ============================================================ */
final class SocialProfileModel
{
    public static function all(): array
    {
        return Database::all("SELECT * FROM social_profiles ORDER BY platform");
    }

    public static function save(string $platform, array $d): void
    {
        Database::q("INSERT INTO social_profiles (platform, profile_url, display_name, handle, api_availability, connected, capabilities, notes)
                     VALUES (?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE profile_url=VALUES(profile_url), display_name=VALUES(display_name),
                     handle=VALUES(handle), api_availability=VALUES(api_availability), connected=VALUES(connected),
                     capabilities=VALUES(capabilities), notes=VALUES(notes)",
            [$platform, (string)($d['profile_url'] ?? ''), (string)($d['display_name'] ?? ''),
             (string)($d['handle'] ?? ''), (string)($d['api_availability'] ?? 'manual'),
             (int)($d['connected'] ?? 0), json_encode($d['capabilities'] ?? []), (string)($d['notes'] ?? '')]);
    }

    public static function delete(string $platform): void
    {
        Database::q("DELETE FROM social_profiles WHERE platform=?", [$platform]);
    }

    /** Mark connected only after a real verification (YouTube RSS etc.). */
    public static function setConnected(string $platform, bool $connected): void
    {
        Database::q("UPDATE social_profiles SET connected=?, last_sync=NOW() WHERE platform=?", [(int)$connected, $platform]);
    }
}

/* ============================================================
   TRACKABLE LINKS (UTM generator + WhatsApp click-to-chat)
   ============================================================ */
final class TrackableLinkModel
{
    public static function all(string $kind = ''): array
    {
        $where = $kind !== '' ? "WHERE kind=" . Database::quote($kind) : '';
        return Database::all("SELECT * FROM trackable_links $where ORDER BY id DESC");
    }

    public static function save(?int $id, array $d): int
    {
        $kind = ($d['kind'] ?? 'utm') === 'whatsapp' ? 'whatsapp' : 'utm';
        $name = trim((string)($d['name'] ?? ''));
        if ($name === '') throw new RuntimeException('Link name is required');
        if ($kind === 'utm') {
            $target = trim((string)($d['target_url'] ?? ''));
            if (!preg_match('~^https?://~i', $target)) throw new RuntimeException('Target URL must be http(s)');
            if ($id) {
                Database::q("UPDATE trackable_links SET name=?, target_url=?, source=?, medium=?, campaign=?, term=?, content=? WHERE id=?",
                    [$name, $target, (string)($d['source'] ?? ''), (string)($d['medium'] ?? ''), (string)($d['campaign'] ?? ''),
                     (string)($d['term'] ?? ''), (string)($d['content'] ?? ''), $id]);
                return $id;
            }
            Database::q("INSERT INTO trackable_links (kind, name, target_url, source, medium, campaign, term, content)
                         VALUES ('utm',?,?,?,?,?,?,?)",
                [$name, $target, (string)($d['source'] ?? ''), (string)($d['medium'] ?? ''), (string)($d['campaign'] ?? ''),
                 (string)($d['term'] ?? ''), (string)($d['content'] ?? '')]);
            return (int)Database::pdo()->lastInsertId();
        }
        $phone = preg_replace('/[^0-9+]/', '', (string)($d['phone'] ?? ''));
        if ($phone === '') throw new RuntimeException('WhatsApp phone number required (with country code, e.g. +919876543210)');
        if ($id) {
            Database::q("UPDATE trackable_links SET name=?, phone=?, message=?, campaign=? WHERE id=?",
                [$name, $phone, (string)($d['message'] ?? ''), (string)($d['campaign'] ?? ''), $id]);
            return $id;
        }
        Database::q("INSERT INTO trackable_links (kind, name, phone, message, campaign) VALUES ('whatsapp',?,?,?,?)",
            [$name, $phone, (string)($d['message'] ?? ''), (string)($d['campaign'] ?? '')]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function delete(int $id): void
    {
        Database::q("DELETE FROM trackable_links WHERE id=?", [$id]);
        Database::q("DELETE FROM link_clicks WHERE link_id=?", [$id]);
    }

    public static function url(array $l): string
    {
        if (($l['kind'] ?? 'utm') === 'whatsapp') {
            $msg = trim((string)($l['message'] ?? ''));
            return 'https://wa.me/' . str_replace('+', '', (string)$l['phone']) . ($msg !== '' ? '?text=' . rawurlencode($msg) : '') .
                   '&utm_source=whatsapp&utm_medium=' . rawurlencode((string)($l['campaign'] ?? 'click-to-chat'));
        }
        $u = $l['target_url'];
        $params = [];
        if (!empty($l['source'])) $params['utm_source'] = $l['source'];
        if (!empty($l['medium'])) $params['utm_medium'] = $l['medium'];
        if (!empty($l['campaign'])) $params['utm_campaign'] = $l['campaign'];
        if (!empty($l['term'])) $params['utm_term'] = $l['term'];
        if (!empty($l['content'])) $params['utm_content'] = $l['content'];
        if ($params) {
            $sep = str_contains($u, '?') ? '&' : '?';
            $u .= $sep . http_build_query($params);
        }
        return $u;
    }

    /** Public click tracking (POST from redirect page or direct hit). */
    public static function trackClick(int $linkId, array $ctx = []): void
    {
        Database::q("UPDATE trackable_links SET clicks=clicks+1 WHERE id=?", [$linkId]);
        Database::q("INSERT INTO link_clicks (link_id, referrer, page, ip, ua, lead_id)
                     VALUES (?,?,?,?,?,?)",
            [$linkId, mb_substr((string)($ctx['referrer'] ?? ''), 0, 300), mb_substr((string)($ctx['page'] ?? ''), 0, 300),
             mb_substr((string)($ctx['ip'] ?? ''), 0, 45), mb_substr((string)($ctx['ua'] ?? ''), 0, 300),
             isset($ctx['lead_id']) ? (int)$ctx['lead_id'] : null]);
    }

    public static function clicks(int $linkId, int $days = 90): array
    {
        return Database::all("SELECT * FROM link_clicks WHERE link_id=? AND created_at > NOW() - INTERVAL ? DAY ORDER BY id DESC LIMIT 100",
            [$linkId, $days]);
    }
}

/* ============================================================
   AGENT OUTCOME MEASUREMENT (real before/after deltas)
   ============================================================ */
final class OutcomeModel
{
    public static function record(string $agentSlug, string $metric, string $entity, string $before, string $after,
                                  ?string $delta = null, ?array $period = null, string $source = '', string $note = ''): void
    {
        Database::q("INSERT INTO agent_outcomes (agent_slug, metric, entity, before_value, after_value, delta, period_start, period_end, source, note)
                     VALUES (?,?,?,?,?,?,?,?,?,?)",
            [$agentSlug, $metric, $entity, $before, $after, $delta ?? '',
             $period[0] ?? null, $period[1] ?? null, $source, mb_substr($note, 0, 300)]);
    }

    public static function recent(string $agentSlug = '', int $limit = 50): array
    {
        if ($agentSlug !== '') {
            return Database::all("SELECT * FROM agent_outcomes WHERE agent_slug=? ORDER BY id DESC LIMIT $limit", [$agentSlug]);
        }
        return Database::all("SELECT * FROM agent_outcomes ORDER BY id DESC LIMIT $limit");
    }

    public static function summary(): array
    {
        $rows = Database::all(
            "SELECT agent_slug, COUNT(*) actions, COUNT(DISTINCT metric) metrics
             FROM agent_outcomes WHERE created_at > NOW() - INTERVAL 30 DAY GROUP BY agent_slug ORDER BY actions DESC");
        return $rows;
    }
}

/* ============================================================
   INTELLIGENCE METRICS (positioning health, external aggregates)
   ============================================================ */
final class IntelligenceMetricModel
{
    public static function put(string $metric, string $scope, float $value, array $details = [], ?string $from = null, ?string $to = null): void
    {
        Database::q("INSERT INTO intelligence_metrics (metric, scope, value, details, period_start, period_end)
                     VALUES (?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE value=VALUES(value), details=VALUES(details)",
            [$metric, $scope, $value, json_encode($details), $from, $to]);
    }

    public static function series(string $metric, int $days = 30): array
    {
        return Database::all("SELECT scope, value, details, period_start FROM intelligence_metrics
                              WHERE metric=? AND (period_start IS NULL OR period_start >= CURDATE() - INTERVAL ? DAY)
                              ORDER BY period_start ASC", [$metric, $days]);
    }

    public static function latest(string $metric): ?array
    {
        return Database::one("SELECT * FROM intelligence_metrics WHERE metric=? ORDER BY id DESC LIMIT 1", [$metric]);
    }

    public static function table(string $metric): array
    {
        return Database::all("SELECT scope, value, details FROM intelligence_metrics WHERE metric=? ORDER BY value DESC", [$metric]);
    }

    /** POSITIONING HEALTH 0–100 (spec §41). Computed from REAL signals. */
    public static function positioningHealth(): array
    {
        $doc = ContentStore::all();
        $settings = $doc['settings'] ?? [];
        $score = 0;
        $checks = [];
        $has = function (array $d, array $keys): bool {
            foreach ($keys as $k) if (!empty($d[$k])) return true;
            return false;
        };
        // 1. who/what/problem/proof answered on the site
        $pairs = [
            ['Who is Abhijeet?', $has($settings, ['role', 'tagline', 'bio']) || $has(($doc['pages']['about'] ?? []), ['title', 'lede']), 20],
            ['What does he do?', $has($doc['services'] ?? [], []) || $has(($doc['pages']['services'] ?? []), ['lede', 'body']) || $has(($doc['sections']['services'] ?? []), ['title', 'body']), 15],
            ['Who should hire him?', $has($doc['sections'] ?? [], ['target']) || $has($doc['pages'] ?? [], ['clients']) || count($doc['clients'] ?? []) > 0, 10],
            ['What problems does he solve?', $has(($doc['pages']['services'] ?? []), ['lede']) || $has(($doc['sections']['services'] ?? []), ['body']), 15],
            ['Proof (projects/case studies)', count($doc['projects'] ?? []) >= 3, 15],
            ['SEO keywords aligned with positioning', count(KeywordModel::keywords(['limit' => 100])) > 0, 10],
            ['Consistent claims (truth layer)', count(FactsModel::all('verified')) > 0, 15],
        ];
        foreach ($pairs as [$label, $ok, $w]) {
            $checks[] = ['label' => $label, 'ok' => (bool)$ok, 'weight' => $w];
            if ($ok) $score += $w;
        }
        $score = min(100, $score);
        self::put('positioning:health', 'site', $score, ['checks' => $checks]);
        return ['score' => $score, 'checks' => $checks, 'updated_at' => date('c')];
    }
}

/* ============================================================
   DEV INTELLIGENCE (GitHub etc.)
   ============================================================ */
final class DevIntelModel
{
    public static function repos(): array
    {
        return Database::all("SELECT * FROM dev_repos ORDER BY pushed_at DESC");
    }

    public static function events(string $kind = '', int $limit = 100): array
    {
        $where = $kind !== '' ? "WHERE kind=" . Database::quote($kind) : '';
        return Database::all("SELECT * FROM dev_events $where ORDER BY created_at DESC LIMIT $limit");
    }

    /** Signals the Developer agent should look at. */
    public static function signals(): array
    {
        return [
            'failed_builds' => Database::all("SELECT * FROM dev_events WHERE kind='workflow' AND state='failure' AND seen=0 ORDER BY id DESC LIMIT 20"),
            'open_issues' => Database::all("SELECT * FROM dev_events WHERE kind='issue' AND state='open' AND seen=0 ORDER BY id DESC LIMIT 20"),
            'stale_repos' => Database::all("SELECT * FROM dev_repos WHERE pushed_at < NOW() - INTERVAL 180 DAY ORDER BY pushed_at LIMIT 10"),
            'recent' => Database::all("SELECT * FROM dev_events WHERE created_at > NOW() - INTERVAL 7 DAY ORDER BY created_at DESC LIMIT 50"),
        ];
    }

    public static function markSeen(array $ids): void
    {
        if (!$ids) return;
        $in = implode(',', array_map('intval', $ids));
        Database::q("UPDATE dev_events SET seen=1 WHERE id IN ($in)");
    }
}

/* ============================================================
   KNOWLEDGE INGESTION LEDGER
   ============================================================ */
final class KnowledgeIngestModel
{
    public static function record(string $type, string $sourceId, string $title, string $kind, string $hash, string $status, string $modified = ''): void
    {
        Database::q("INSERT INTO knowledge_ingest (source_type, source_id, title, kind, content_hash, status, last_modified)
                     VALUES (?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), kind=VALUES(kind), content_hash=VALUES(content_hash),
                     status=VALUES(status), last_modified=VALUES(last_modified), error=''",
            [$type, $sourceId, mb_substr($title, 0, 300), $kind, $hash, $status, mb_substr($modified, 0, 40)]);
    }

    public static function status(string $sourceId): string
    {
        $r = Database::one("SELECT status FROM knowledge_ingest WHERE source_id=?", [$sourceId]);
        return $r ? (string)$r['status'] : '';
    }

    public static function hashOf(string $sourceId): ?string
    {
        $r = Database::one("SELECT content_hash FROM knowledge_ingest WHERE source_id=?", [$sourceId]);
        return $r ? (string)$r['content_hash'] : null;
    }

    public static function ledger(int $limit = 100): array
    {
        return Database::all("SELECT * FROM knowledge_ingest ORDER BY id DESC LIMIT $limit");
    }

    public static function fail(string $sourceId, string $error): void
    {
        Database::q("UPDATE knowledge_ingest SET status='failed', error=? WHERE source_id=?", [mb_substr($error, 0, 400), $sourceId]);
    }
}
