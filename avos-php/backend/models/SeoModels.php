<?php
/**
 * AV OS — SEO + Intelligence engine (v2.2)
 *
 * KeywordModel        : keywords, clusters, rankings, cannibalization,
 *                      intent classification, opportunity scoring
 * SeoCrawlerModel     : technical crawl of the GENERATED static site
 *                      (titles, descriptions, H1, canonical, images, alt,
 *                      broken internal links, orphans) → seo_audits/seo_issues
 * IntelligenceModel   : engagement scores, CTA intelligence, conversion
 *                      funnel, content decay, next-actions, daily brief,
 *                      weekly report, social drafts
 *
 * All scores are internal AV OS estimates — never presented as Google metrics.
 */

/* ============================================================
   KEYWORDS / CLUSTERS / RANKINGS
   ============================================================ */
final class KeywordModel
{
    /* ---------- clusters ---------- */
    public static function clusters(): array
    {
        $rows = Database::all("SELECT kc.*, (SELECT COUNT(*) FROM keywords k WHERE k.cluster_id=kc.id) keyword_count
                               FROM keyword_clusters kc ORDER BY kc.name");
        // attach keywords per cluster
        foreach ($rows as &$c) {
            $c['keywords'] = Database::all("SELECT id, keyword, intent, priority, search_volume, current_position, target_url FROM keywords WHERE cluster_id=? ORDER BY priority DESC", [$c['id']]);
        }
        return $rows;
    }

    public static function clusterSave(?int $id, array $d): int
    {
        $name = trim((string)($d['name'] ?? ''));
        if ($name === '') return 0;
        if ($id) {
            Database::q("UPDATE keyword_clusters SET name=?, pillar_url=?, description=? WHERE id=?",
                [$name, $d['pillar_url'] ?? '', $d['description'] ?? '', $id]);
            return $id;
        }
        Database::q("INSERT INTO keyword_clusters (name, pillar_url, description) VALUES (?,?,?)",
            [$name, $d['pillar_url'] ?? '', $d['description'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function clusterDelete(int $id): void
    {
        Database::q("UPDATE keywords SET cluster_id=NULL WHERE cluster_id=?", [$id]);
        Database::q("DELETE FROM keyword_clusters WHERE id=?", [$id]);
    }

    /* ---------- keywords ---------- */
    public static function keywords(array $opts = []): array
    {
        $where = []; $params = [];
        if (!empty($opts['cluster_id'])) { $where[] = "k.cluster_id=?"; $params[] = (int)$opts['cluster_id']; }
        if (!empty($opts['intent'])) { $where[] = "k.intent=?"; $params[] = $opts['intent']; }
        $w = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $limit = min(500, max(1, (int)($opts['limit'] ?? 200)));
        return Database::all(
            "SELECT k.*, kc.name cluster_name FROM keywords k LEFT JOIN keyword_clusters kc ON kc.id=k.cluster_id $w ORDER BY k.priority DESC, k.search_volume DESC LIMIT $limit",
            $params
        );
    }

    public static function keywordSave(?int $id, array $d): int
    {
        $kw = trim((string)($d['keyword'] ?? ''));
        if ($kw === '') return 0;
        $intent = self::classifyIntent($kw, (string)($d['intent'] ?? ''));
        if ($id) {
            Database::q("UPDATE keywords SET keyword=?, intent=?, topic=?, cluster_id=?, country=?, language=?, priority=?, difficulty=?, search_volume=?, trend=?, current_position=?, target_position=?, target_url=?, primary_keyword=? WHERE id=?",
                [$kw, $intent, $d['topic'] ?? '', !empty($d['cluster_id']) ? (int)$d['cluster_id'] : null,
                 $d['country'] ?? 'IN', $d['language'] ?? 'en',
                 min(100, max(0, (int)($d['priority'] ?? 50))),
                 min(100, max(0, (int)($d['difficulty'] ?? 0))),
                 max(0, (int)($d['search_volume'] ?? 0)), (int)($d['trend'] ?? 0),
                 max(0, (int)($d['current_position'] ?? 0)), max(1, (int)($d['target_position'] ?? 10)),
                 $d['target_url'] ?? '', (int)($d['primary_keyword'] ?? 0), $id]);
            return $id;
        }
        Database::q("INSERT INTO keywords (keyword, intent, topic, cluster_id, country, language, priority, difficulty, search_volume, trend, current_position, target_position, target_url, primary_keyword)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [$kw, $intent, $d['topic'] ?? '', !empty($d['cluster_id']) ? (int)$d['cluster_id'] : null,
             $d['country'] ?? 'IN', $d['language'] ?? 'en',
             min(100, max(0, (int)($d['priority'] ?? 50))),
             min(100, max(0, (int)($d['difficulty'] ?? 0))),
             max(0, (int)($d['search_volume'] ?? 0)), (int)($d['trend'] ?? 0),
             max(0, (int)($d['current_position'] ?? 0)), max(1, (int)($d['target_position'] ?? 10)),
             $d['target_url'] ?? '', (int)($d['primary_keyword'] ?? 0)]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function keywordDelete(int $id): void
    {
        Database::q("DELETE FROM keyword_rankings WHERE keyword_id=?", [$id]);
        Database::q("DELETE FROM keywords WHERE id=?", [$id]);
    }

    /** Rule-based search-intent classification (deterministic, explainable). */
    public static function classifyIntent(string $kw, string $fallback = ''): string
    {
        $k = strtolower($kw);
        $local = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'pune', 'chennai', 'hyderabad', 'near me'];
        if ($fallback !== '' && in_array($fallback, ['informational', 'commercial', 'transactional', 'navigational', 'local'], true)) {
            return $fallback;
        }
        foreach ($local as $l) if (str_contains($k, $l)) return 'local';
        if (str_contains($k, 'abhijeetvarghese') || str_contains($k, 'abhijeet varghese')) return 'navigational';
        if (preg_match('/\b(hire|book|buy|contact|quote|pricing?|cost|order)\b/', $k)) return 'transactional';
        if (preg_match('/\b(consultant|agency|services?|company|studio|freelancer)\b/', $k)) return 'commercial';
        if (preg_match('/\b(what|how|why|vs|guide|best|example|tips|definition|benefits?)\b/', $k)) return 'informational';
        return 'informational';
    }

    /* ---------- rankings ---------- */
    public static function rankings(int $keywordId, int $days = 90): array
    {
        return Database::all(
            "SELECT * FROM keyword_rankings WHERE keyword_id=? AND recorded_at > CURDATE() - INTERVAL ? DAY ORDER BY recorded_at",
            [$keywordId, $days]
        );
    }

    public static function rankingRecord(int $keywordId, array $d): int
    {
        $pos = max(0, (int)($d['position'] ?? 0));
        $date = $d['recorded_at'] ?? date('Y-m-d');
        $device = ($d['device'] ?? 'desktop') === 'mobile' ? 'mobile' : 'desktop';
        Database::q("INSERT INTO keyword_rankings (keyword_id, url, position, country, device, recorded_at) VALUES (?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE position=VALUES(position), url=VALUES(url)",
            [$keywordId, $d['url'] ?? '', $pos, $d['country'] ?? 'IN', $device, $date]);
        // keep keyword.current_position in sync
        Database::q("UPDATE keywords SET current_position=? WHERE id=?", [$pos, $keywordId]);
        return (int)Database::pdo()->lastInsertId() ?: 1;
    }

    public static function rankingHistory(int $days = 30): array
    {
        return Database::all(
            "SELECT kr.recorded_at, kr.position, kr.device, k.keyword, k.target_url
             FROM keyword_rankings kr JOIN keywords k ON k.id=kr.keyword_id
             WHERE kr.recorded_at > CURDATE() - INTERVAL ? DAY ORDER BY kr.recorded_at DESC LIMIT 200",
            [$days]
        );
    }

    /* ---------- cannibalization ---------- */
    public static function cannibalization(): array
    {
        // normalize: lowercase, strip plurals/gerunds and filler words so
        // "experience design consultant" vs "experience design consulting"
        // are treated as the same target
        $norm = function (string $k): string {
            $k = strtolower(trim($k));
            $k = preg_replace('/\b(a|an|the|of|for|in|on|and|to)\b/', ' ', $k);
            $k = preg_replace('/s\b/', '', $k);   // plural → singular FIRST (keeps matching symmetric)
            $k = preg_replace('/\b(consulting|consultant|agency|agencies|designing|designer|designers|building|creating|services?|studio|company|companies)\b/', '', $k);
            return trim(preg_replace('/\s+/', ' ', $k));
        };
        $rows = Database::all("SELECT id, keyword, target_url, intent FROM keywords WHERE primary_keyword=1 AND target_url != ''");
        $groups = [];
        foreach ($rows as $r) {
            $groups[$norm($r['keyword'])][] = $r;
        }
        $out = [];
        foreach ($groups as $normKw => $items) {
            $urls = array_values(array_unique(array_map(fn($i) => $i['target_url'], $items)));
            if (count($urls) > 1) {
                $out[] = [
                    'keyword' => $items[0]['keyword'],
                    'urls' => $urls,
                    'count' => count($urls),
                    'recommendation' => 'Multiple URLs target the same keyword — merge into one authoritative page, 301 the others, or differentiate by intent.',
                ];
            }
        }
        return $out;
    }

    /* ---------- opportunity scoring (internal estimate) ---------- */
    public static function opportunityScore(array $k): int
    {
        $vol = min(1, log10(1 + (int)($k['search_volume'] ?? 0)) / 5);           // 0..~0.7
        $intentW = match ($k['intent'] ?? 'informational') {
            'transactional' => 1.0, 'commercial' => 0.9, 'local' => 0.85, 'navigational' => 0.6, default => 0.6,
        };
        $diff = 1 - min(1, (int)($k['difficulty'] ?? 0) / 100);                  // lower difficulty → higher
        $pos = (int)($k['current_position'] ?? 0);
        $posW = $pos === 0 ? 0.8 : ($pos > 30 ? 0.6 : ($pos > 10 ? 0.3 : 0.15)); // untapped/weak → higher
        $priority = (int)($k['priority'] ?? 50) / 100;
        // business-value boost for portfolio-relevant terms
        $kb = strtolower($k['keyword'] ?? '');
        $biz = preg_match('/experience (centre|center)|consulting|immersive|enterprise|creative director|brand experience|design leadership/', $kb) ? 1 : 0.7;
        $score = round(100 * (0.35 * $vol + 0.25 * $intentW + 0.2 * $diff + 0.2 * $posW) * (0.5 + 0.5 * $priority) * $biz);
        return min(100, max(0, $score));
    }

    public static function opportunities(int $limit = 50): array
    {
        $rows = self::keywords(['limit' => 500]);
        $out = [];
        foreach ($rows as $k) {
            $s = self::opportunityScore($k);
            if ($s < 20) continue;
            $out[] = [
                'keyword_id' => (int)$k['id'], 'keyword' => $k['keyword'], 'intent' => $k['intent'],
                'cluster' => $k['cluster_name'] ?? '', 'search_volume' => (int)$k['search_volume'],
                'difficulty' => (int)$k['difficulty'], 'current_position' => (int)$k['current_position'],
                'target_url' => $k['target_url'] ?? '', 'score' => $s,
                'reason' => self::opportunityReason($k, $s),
            ];
        }
        usort($out, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($out, 0, $limit);
    }

    private static function opportunityReason(array $k, int $s): string
    {
        $bits = [];
        if ((int)($k['search_volume'] ?? 0) > 500) $bits[] = 'search demand';
        if (($k['intent'] ?? '') !== 'informational') $bits[] = ($k['intent'] ?? '') . ' intent';
        if ((int)($k['current_position'] ?? 0) === 0) $bits[] = 'not yet ranking';
        elseif ((int)($k['current_position'] ?? 0) > 20) $bits[] = 'weak position ' . $k['current_position'];
        if ((int)($k['difficulty'] ?? 0) < 40) $bits[] = 'low difficulty';
        return $bits ? implode(' · ', $bits) : 'untapped opportunity';
    }
}

/* ============================================================
   TECHNICAL SEO CRAWLER (runs over the GENERATED static site)
   ============================================================ */
final class SeoCrawlerModel
{
    public static function crawl(?int $userId = null): array
    {
        $siteDir = AV_SITE_OUT;
        $pages = glob($siteDir . '/*.html') ?: [];
        $issues = [];
        $files = [];
        foreach ($pages as $f) $files[basename($f)] = true;

        $titles = []; $descs = []; $h1count = []; $canonMap = [];
        foreach ($pages as $f) {
            $name = basename($f);
            $html = (string)file_get_contents($f);
            $url = '/' . $name;
            $add = function (string $type, string $sev, string $detail) use (&$issues, $url): void {
                $issues[] = ['url' => $url, 'issue_type' => $type, 'severity' => $sev, 'detail' => mb_substr($detail, 0, 480)];
            };
            // title
            preg_match('/<title>([^<]*)<\/title>/i', $html, $m);
            $title = trim($m[1] ?? '');
            if ($title === '') $add('missing_title', 'critical', 'Page has no <title>');
            else {
                $len = mb_strlen($title);
                if ($len < 30) $add('short_title', 'warning', "Title only {$len} chars");
                elseif ($len > 65) $add('long_title', 'info', "Title {$len} chars (ideal 30–65)");
                $titles[] = $title;
            }
            // meta description
            preg_match('/<meta name="description" content="([^"]*)"/i', $html, $m);
            $desc = trim($m[1] ?? '');
            if ($desc === '') $add('missing_description', 'warning', 'No meta description');
            else {
                $len = mb_strlen($desc);
                if ($len < 70 || $len > 165) $add('bad_description_length', 'info', "Description {$len} chars (ideal 70–165)");
                $descs[] = $desc;
            }
            // H1
            preg_match_all('/<h1[^>]*>(.*?)<\/h1>/is', $html, $mh);
            $n = count($mh[1] ?? []);
            if ($n === 0) $add('missing_h1', 'critical', 'No H1 heading');
            elseif ($n > 1) $add('multiple_h1', 'warning', "$n H1 headings");
            // canonical
            preg_match('/<link rel="canonical" href="([^"]*)"/i', $html, $m);
            $canon = $m[1] ?? '';
            if ($canon === '') $add('missing_canonical', 'critical', 'No canonical URL');
            elseif (!str_ends_with($canon, $url)) $add('canonical_mismatch', 'warning', "Canonical $canon ≠ page $url");
            if ($canon !== '') $canonMap[$canon][] = $url;
            // OG image
            preg_match('/<meta property="og:image" content="([^"]*)"/i', $html, $m);
            if (empty($m[1])) $add('missing_og_image', 'info', 'No Open Graph image');
            // images + alt
            preg_match_all('/<img[^>]*>/i', $html, $mi);
            foreach ($mi[0] as $img) {
                if (!preg_match('/alt="[^"]*"/i', $img)) {
                    $add('image_missing_alt', 'warning', 'An <img> lacks alt text');
                    break;
                }
                if (preg_match('/src="([^"]+)"/i', $img, $ms)) {
                    $src = $ms[1];
                    if (!str_starts_with($src, 'data:') && !str_starts_with($src, 'http')) {
                        $p = $siteDir . '/' . ltrim(parse_url($src, PHP_URL_PATH) ?: $src, '/');
                        if (!is_file($p)) $add('broken_image', 'critical', "Missing asset $src");
                    }
                }
            }
            // broken internal links
            if (preg_match_all('/href="([^"#]+\.html)"/i', $html, $ml)) {
                foreach (array_unique($ml[1]) as $href) {
                    if (str_starts_with($href, 'http')) continue;
                    $t = basename(parse_url($href, PHP_URL_PATH) ?: '');
                    if ($t !== '' && !isset($files[$t]) && $t !== basename($url)) {
                        $add('broken_internal_link', 'warning', "Links to missing $href");
                    }
                }
            }
            $h1count[$name] = $n;
        }
        // duplicates
        $dup = array_count_values($titles);
        foreach ($dup as $t => $n) if ($n > 1) $issues[] = ['url' => '/', 'issue_type' => 'duplicate_title', 'severity' => 'warning', 'detail' => "“$t” used on $n pages"];
        $dup = array_count_values($descs);
        foreach ($dup as $d => $n) if ($n > 1) $issues[] = ['url' => '/', 'issue_type' => 'duplicate_description', 'severity' => 'info', 'detail' => "Same meta description on $n pages"];
        // orphans: pages not linked from any other page
        $linked = [];
        foreach ($pages as $f) {
            $html = (string)file_get_contents($f);
            if (preg_match_all('/href="([^"#]+\.html)"/i', $html, $ml)) {
                foreach ($ml[1] as $h) $linked[basename(parse_url($h, PHP_URL_PATH) ?: '')] = true;
            }
        }
        foreach ($pages as $f) {
            $n = basename($f);
            if ($n === '404.html') continue;
            if (!isset($linked[$n])) $issues[] = ['url' => '/' . $n, 'issue_type' => 'orphan_page', 'severity' => 'info', 'detail' => 'Not linked from any other page'];
        }

        // canonical collision detection: two pages must never share one canonical
        foreach ($canonMap as $c => $urls) {
            if (count($urls) > 1) {
                $issues[] = ['url' => implode(' + ', $urls), 'issue_type' => 'canonical_collision',
                             'severity' => 'critical', 'detail' => count($urls) . " pages resolve to the same canonical: $c"];
            }
        }
        // score
        $weights = ['critical' => 4, 'warning' => 1.5, 'info' => 0.5];
        $penalty = 0;
        foreach ($issues as $i) $penalty += $weights[$i['severity']] ?? 1;
        $score = max(0, min(100, (int)round(100 - $penalty * 2.5)));
        $id = 0;
        try {
            Database::q("INSERT INTO seo_audits (score, pages_crawled, issues_found, summary, created_by) VALUES (?,?,?,?,?)",
                [$score, count($pages), count($issues), json_encode(['weights' => $weights]), $userId]);
            $id = (int)Database::pdo()->lastInsertId();
            foreach ($issues as $i) {
                Database::q("INSERT INTO seo_issues (audit_id, url, issue_type, severity, detail) VALUES (?,?,?,?,?)",
                    [$id, $i['url'], $i['issue_type'], $i['severity'], $i['detail']]);
            }
        } catch (Throwable $e) { /* crawl report still returned below */ }
        return ['audit_id' => $id, 'score' => $score, 'pages_crawled' => count($pages), 'issues_found' => count($issues), 'issues' => $issues];
    }

    public static function lastAudit(): ?array
    {
        return Database::one("SELECT * FROM seo_audits ORDER BY id DESC LIMIT 1");
    }

    public static function openIssues(int $limit = 200): array
    {
        return Database::all("SELECT * FROM seo_issues WHERE status='open' ORDER BY FIELD(severity,'critical','warning','info'), id DESC LIMIT $limit");
    }

    public static function issueSetStatus(int $id, string $status): void
    {
        if (in_array($status, ['open', 'fixed', 'ignored'], true)) {
            Database::q("UPDATE seo_issues SET status=? WHERE id=?", [$status, $id]);
        }
    }

    /* ---------- content decay (real analytics comparison) ---------- */
    public static function contentDecay(int $days = 30): array
    {
        $out = [];
        $rows = Database::all(
            "SELECT path, COUNT(*) n FROM analytics_events
             WHERE created_at > NOW() - INTERVAL ? DAY AND event_type IN ('pageview','essay_view','journal_view','case_study_view','project_view')
             GROUP BY path ORDER BY n DESC LIMIT 30",
            [$days]
        );
        foreach ($rows as $r) {
            $prev = (int)Database::one(
                "SELECT COUNT(*) n FROM analytics_events
                 WHERE created_at BETWEEN NOW() - INTERVAL ? DAY AND NOW() - INTERVAL ? DAY AND path=? AND event_type IN ('pageview','essay_view','journal_view','case_study_view','project_view')",
                [$days * 2, $days, $r['path']]
            )['n'];
            $cur = (int)$r['n'];
            if ($prev > 5 && $cur < $prev * 0.8) {
                $out[] = ['path' => $r['path'], 'current' => $cur, 'previous' => $prev, 'decline_pct' => round((1 - $cur / $prev) * 100)];
            }
        }
        return $out;
    }
}

/* ============================================================
   INTELLIGENCE (engagement · funnel · next actions · briefs)
   ============================================================ */
final class IntelligenceModel
{
    /* ---------- engagement score per page (internal estimate) ---------- */
    public static function engagement(int $days = 30): array
    {
        $rows = Database::all(
            "SELECT COALESCE(path,'/') path,
                    SUM(event_type='pageview' OR event_type LIKE '%_view') views,
                    SUM(event_type='cta_click') ctas,
                    SUM(event_type IN ('scroll_depth','video_play','gallery_open','site_search')) engages
             FROM analytics_events WHERE created_at > NOW() - INTERVAL ? DAY GROUP BY path ORDER BY views DESC LIMIT 30",
            [$days]
        );
        $maxViews = 1;
        foreach ($rows as $r) $maxViews = max($maxViews, (int)$r['views']);
        $out = [];
        foreach ($rows as $r) {
            $leads = (int)Database::one("SELECT COUNT(*) n FROM leads WHERE page=? AND created_at > NOW() - INTERVAL ? DAY", [$r['path'], $days])['n'];
            $score = min(100, round(
                50 * ((int)$r['views'] / $maxViews) +
                20 * min(1, (int)$r['ctas'] / max(1, (int)$r['views']) * 20) +
                15 * min(1, (int)$r['engages'] / max(1, (int)$r['views']) * 10) +
                15 * min(1, $leads)
            ));
            $out[] = ['path' => $r['path'], 'views' => (int)$r['views'], 'cta_clicks' => (int)$r['ctas'],
                      'engagement_events' => (int)$r['engages'], 'leads' => $leads, 'score' => $score];
        }
        usort($out, fn($a, $b) => $b['score'] <=> $a['score']);
        return $out;
    }

    /* ---------- CTA intelligence ---------- */
    public static function ctaIntelligence(int $days = 90): array
    {
        $rows = Database::all(
            "SELECT path, COALESCE(content_id,'') AS content, COUNT(*) n FROM analytics_events
             WHERE event_type='cta_click' AND created_at > NOW() - INTERVAL ? DAY
             GROUP BY path, content_id ORDER BY n DESC LIMIT 30",
            [$days]
        );
        $out = [];
        foreach ($rows as $r) {
            $leads = (int)Database::one("SELECT COUNT(*) n FROM leads WHERE page=? AND created_at > NOW() - INTERVAL ? DAY", [$r['path'], $days])['n'];
            $out[] = ['page' => $r['path'], 'cta' => $r['content'], 'clicks' => (int)$r['n'], 'leads' => $leads,
                      'conversion_rate' => $r['n'] > 0 ? round($leads / $r['n'] * 100, 1) : 0];
        }
        return $out;
    }

    /* ---------- conversion funnel ---------- */
    public static function funnel(int $days = 90): array
    {
        $visitors = (int)Database::one("SELECT COUNT(DISTINCT visitor_id) n FROM analytics_events WHERE created_at > NOW() - INTERVAL ? DAY", [$days])['n'];
        $contentViews = (int)Database::one("SELECT COUNT(*) n FROM analytics_events WHERE created_at > NOW() - INTERVAL ? DAY AND (event_type LIKE '%_view' OR event_type='pageview')", [$days])['n'];
        $ctas = (int)Database::one("SELECT COUNT(*) n FROM analytics_events WHERE event_type='cta_click' AND created_at > NOW() - INTERVAL ? DAY", [$days])['n'];
        $leads = (int)Database::one("SELECT COUNT(*) n FROM leads WHERE created_at > NOW() - INTERVAL ? DAY", [$days])['n'];
        $meetings = (int)Database::one("SELECT COUNT(*) n FROM meetings WHERE created_at > NOW() - INTERVAL ? DAY AND status NOT IN ('cancelled','no_show')", [$days])['n'];
        $proposals = (int)Database::one("SELECT COUNT(*) n FROM proposals WHERE created_at > NOW() - INTERVAL ? DAY AND status NOT IN ('draft')", [$days])['n'];
        $won = (int)Database::one("SELECT COUNT(*) n FROM opportunities WHERE stage='won' AND created_at > NOW() - INTERVAL ? DAY", [$days])['n'];
        $stages = [
            ['stage' => 'Visitors', 'count' => $visitors],
            ['stage' => 'Content views', 'count' => $contentViews],
            ['stage' => 'CTA clicks', 'count' => $ctas],
            ['stage' => 'Leads', 'count' => $leads],
            ['stage' => 'Meetings', 'count' => $meetings],
            ['stage' => 'Proposals', 'count' => $proposals],
            ['stage' => 'Won', 'count' => $won],
        ];
        foreach ($stages as $i => $s) {
            $prev = $stages[$i - 1]['count'] ?? $visitors;
            $stages[$i]['rate'] = $i === 0 ? 100 : ($prev > 0 ? round($s['count'] / $prev * 100, 1) : 0);
        }
        return $stages;
    }

    /* ---------- WHAT SHOULD I DO NEXT? engine ---------- */
    public static function nextActions(int $limit = 10): array
    {
        $actions = [];
        // 0. REAL search-console quick wins (positions 4–20, real impressions)
        foreach (SearchConsoleModel::quickWins(5) as $w) {
            $actions[] = ['priority' => 'high', 'impact' => $w['opportunity_score'],
                          'title' => "Improve “{$w['query']}” (position {$w['position']}, {$w['impressions']} impressions)",
                          'reason' => implode(' | ', array_slice($w['recommendations'], 0, 2)),
                          'type' => 'search_quick_win', 'target' => $w['query']];
        }
        // 1. SEO opportunities (open)
        foreach (KeywordModel::opportunities(10) as $o) {
            $actions[] = ['priority' => 'high', 'impact' => $o['score'], 'title' => "Create/optimize content for “{$o['keyword']}”",
                          'reason' => $o['reason'] . " (opportunity {$o['score']}/100)", 'type' => 'seo_opportunity', 'target' => $o['target_url'] ?: $o['keyword']];
        }
        // 2. content decay
        foreach (SeoCrawlerModel::contentDecay(30) as $d) {
            $actions[] = ['priority' => 'high', 'impact' => 80, 'title' => "Refresh {$d['path']}",
                          'reason' => "Traffic declined {$d['decline_pct']}% vs the previous period", 'type' => 'content_decay', 'target' => $d['path']];
        }
        // 3. broken links from last audit
        $issues = SeoCrawlerModel::openIssues(50);
        $broken = array_values(array_filter($issues, fn($i) => $i['issue_type'] === 'broken_internal_link' || $i['issue_type'] === 'broken_image'));
        if ($broken) {
            $actions[] = ['priority' => 'medium', 'impact' => 70, 'title' => count($broken) . ' broken link(s) detected',
                          'reason' => $broken[0]['detail'], 'type' => 'broken_link', 'target' => $broken[0]['url']];
        }
        // 4. missing metadata
        $noMeta = array_values(array_filter($issues, fn($i) => in_array($i['issue_type'], ['missing_title', 'missing_description', 'missing_h1', 'missing_canonical'], true)));
        if ($noMeta) {
            $actions[] = ['priority' => 'medium', 'impact' => 60, 'title' => count($noMeta) . ' pages missing critical metadata',
                          'reason' => 'e.g. ' . $noMeta[0]['issue_type'] . ' on ' . $noMeta[0]['url'], 'type' => 'seo_metadata', 'target' => ''];
        }
        // 5. high-value leads needing follow-up
        $warm = Database::all("SELECT id, name, score FROM leads WHERE status IN ('new','contacted') AND score >= 70 ORDER BY score DESC LIMIT 5");
        if ($warm) {
            $actions[] = ['priority' => 'high', 'impact' => 85, 'title' => "Follow up with " . count($warm) . " high-value lead(s)",
                          'reason' => implode(', ', array_map(fn($l) => $l['name'] . " ({$l['score']})", $warm)), 'type' => 'lead_followup', 'target' => ''];
        }
        // 6. unviewed proposals
        $unviewed = (int)Database::one("SELECT COUNT(*) n FROM proposals WHERE status='sent' AND sent_at < NOW() - INTERVAL 3 DAY")['n'];
        if ($unviewed > 0) {
            $actions[] = ['priority' => 'medium', 'impact' => 55, 'title' => "$unviewed proposal(s) sent 3+ days ago without being viewed",
                          'reason' => 'Worth a gentle follow-up', 'type' => 'proposal_followup', 'target' => ''];
        }
        // 7. stale content (no version in 180 days — SQL time compare, TZ-safe)
        $stale = 0;
        foreach (['pages', 'projects', 'articles'] as $key) {
            $v = Database::one("SELECT MAX(created_at) m FROM versions WHERE entity='store' AND entity_id=? AND created_at < NOW() - INTERVAL 180 DAY", [$key]);
            if ($v && $v['m']) $stale++;
        }
        if ($stale > 0) {
            $actions[] = ['priority' => 'low', 'impact' => 40, 'title' => "$stale content area(s) untouched for 6+ months",
                          'reason' => 'Review and refresh for freshness signals', 'type' => 'stale_content', 'target' => ''];
        }
        usort($actions, fn($a, $b) => ($b['impact'] ?? 0) <=> ($a['impact'] ?? 0));
        return array_slice($actions, 0, $limit);
    }

    /* ---------- daily brief (real data; AI prose optional) ---------- */
    public static function dailyBrief(): array
    {
        $a = AnalyticsModel::summary(1);
        $prev = AnalyticsModel::summary(2)['pageviews'] - $a['pageviews'];
        $leads = LeadModel::count(['days' => 1]);
        $top = Database::one("SELECT path, COUNT(*) n FROM analytics_events WHERE created_at > NOW() - INTERVAL 7 DAY AND event_type IN ('pageview','essay_view','journal_view','case_study_view') GROUP BY path ORDER BY n DESC LIMIT 1");
        $issues = SeoCrawlerModel::lastAudit();
        $actions = self::nextActions(3);
        $brief = [
            'date' => date('Y-m-d'),
            'traffic_today' => $a['pageviews'],
            'traffic_delta_pct' => $prev > 0 ? round(($a['pageviews'] - $prev) / $prev * 100, 1) : 0,
            'leads_today' => $leads,
            'top_content' => $top ? $top['path'] : null,
            'seo_score' => $issues ? (int)$issues['score'] : null,
            'open_seo_issues' => $issues ? (int)$issues['issues_found'] : 0,
            'recommended_actions' => array_map(fn($x) => $x['title'], $actions),
            'search' => SearchConsoleModel::overview(7),
            'positioning_health' => (int)round(IntelligenceMetricModel::positioningHealth()['score']),
            'agent_activity' => (int)Database::one("SELECT COUNT(*) n FROM ai_agent_jobs WHERE created_at > NOW() - INTERVAL 24 HOUR")['n'],
        ];
        return $brief;
    }

    /* ---------- weekly growth report ---------- */
    public static function weeklyReport(): array
    {
        $cur = AnalyticsModel::summary(7);
        $prevViews = (int)Database::one("SELECT COUNT(*) n FROM analytics_events WHERE created_at BETWEEN NOW() - INTERVAL 14 DAY AND NOW() - INTERVAL 7 DAY AND event_type IN ('pageview','essay_view','journal_view','case_study_view')")['n'];
        $leadsCur = (int)Database::one("SELECT COUNT(*) n FROM leads WHERE created_at > NOW() - INTERVAL 7 DAY")['n'];
        $leadsPrev = (int)Database::one("SELECT COUNT(*) n FROM leads WHERE created_at BETWEEN NOW() - INTERVAL 14 DAY AND NOW() - INTERVAL 7 DAY")['n'];
        $top = Database::all("SELECT path, COUNT(*) n FROM analytics_events WHERE created_at > NOW() - INTERVAL 7 DAY AND event_type IN ('pageview','essay_view','journal_view','case_study_view') GROUP BY path ORDER BY n DESC LIMIT 5");
        $worst = Database::all("SELECT path, COUNT(*) n FROM analytics_events WHERE created_at > NOW() - INTERVAL 7 DAY AND event_type IN ('pageview','essay_view','journal_view','case_study_view') GROUP BY path ORDER BY n ASC LIMIT 5");
        $leadQuality = Database::one("SELECT ROUND(AVG(score)) s, COUNT(*) n FROM leads WHERE created_at > NOW() - INTERVAL 7 DAY");
        $rankings = KeywordModel::rankingHistory(7);
        $improved = 0;
        foreach ($rankings as $r) if ((int)$r['position'] <= 10) $improved++;
        return [
            'week' => date('Y-m-d', strtotime('-7 days')) . ' → ' . date('Y-m-d'),
            'pageviews' => (int)$cur['pageviews'],
            'pageviews_delta_pct' => $prevViews > 0 ? round(((int)$cur['pageviews'] - $prevViews) / $prevViews * 100, 1) : 0,
            'leads' => $leadsCur,
            'leads_delta_pct' => $leadsPrev > 0 ? round(($leadsCur - $leadsPrev) / $leadsPrev * 100, 1) : 0,
            'avg_lead_score' => (int)($leadQuality['s'] ?? 0),
            'top_content' => $top,
            'worst_content' => $worst,
            'keywords_top10' => $improved,
            'recommended' => array_map(fn($x) => $x['title'], self::nextActions(5)),
        ];
    }

    /* ---------- social drafts (drafts only — never auto-post) ---------- */
    public static function socialDraft(array $d, ?int $userId): array
    {
        $contentType = $d['content_type'] ?? 'case_study';
        $contentId = (string)($d['content_id'] ?? '');
        $platform = in_array($d['platform'] ?? '', ['linkedin', 'instagram', 'x', 'newsletter'], true) ? $d['platform'] : 'linkedin';
        $project = null;
        foreach (ContentStore::get('projects') as $p) {
            if ((string)($p['id'] ?? '') === $contentId || stripos((string)($p['title'] ?? ''), $contentId) !== false) { $project = $p; break; }
        }
        $title = $project['title'] ?? 'this project';
        $client = $project['client'] ?? '';
        $outcome = is_string($project['outcome'] ?? '') ? $project['outcome'] : ($project['summary'] ?? '');
        $metric = is_array($project['metrics'] ?? null) ? implode(', ', array_slice($project['metrics'], 0, 3)) : '';
        $draft = match ($platform) {
            'linkedin' => "“{$title}” for {$client} — {$outcome} {$metric}\n\nWhat made it work: clarity, structure, and design that earns trust in complex environments.\n\nIf you're building something people need to understand deeply — let's talk.\n\n#ExperienceDesign #CreativeLeadership #EnterpriseInnovation",
            'instagram' => "{$title} — {$client} ✨\n\n{$outcome}\n\n{$metric}\n\n#experiencedesign #designleadership #creativetechnology #brandexperience",
            'x' => "{$title} for {$client}: {$outcome} {$metric}\n\nDesign that makes complexity feel clear. #Design #Innovation",
            'newsletter' => "## {$title} — {$client}\n\n{$outcome}\n\n{$metric}\n\n_This is a draft for review — nothing posts automatically._",
            default => $title,
        };
        Database::q("INSERT INTO social_drafts (content_type, content_id, platform, draft, status, created_by) VALUES (?,?,?,?,'draft',?)",
            [$contentType, $contentId, $platform, $draft, $userId]);
        $id = (int)Database::pdo()->lastInsertId();
        Audit::log($userId, 'social_draft_created', 'social', (string)$id, ['platform' => $platform]);
        return ['id' => $id, 'platform' => $platform, 'draft' => $draft, 'status' => 'draft', 'note' => 'Draft only — never posted automatically.'];
    }

    public static function socialDrafts(): array
    {
        return Database::all("SELECT * FROM social_drafts ORDER BY id DESC LIMIT 50");
    }

    public static function socialDraftStatus(int $id, string $status): void
    {
        if (in_array($status, ['draft', 'approved', 'posted'], true)) {
            Database::q("UPDATE social_drafts SET status=? WHERE id=?", [$status, $id]);
        }
    }
}
