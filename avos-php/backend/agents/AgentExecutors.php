<?php
/**
 * AV OS — AGENT EXECUTORS.
 * Every agent's real work. Rule-based + SQL first (cheap, deterministic);
 * the LLM is only invoked where reasoning adds value AND a provider key is
 * configured. All outputs are recorded in the job + memory.
 */
final class AgentExecutors
{
    /** Dispatch a job to its agent executor. Returns ['ok','actions'=>int,'output'=>..,'tokens'=>..,'cost'=>..] */
    public static function run(string $slug, array $input = []): array
    {
        return match ($slug) {
            'analytics' => self::analytics(),
            'health' => self::health(),
            'technical-seo' => self::technicalSeo(),
            'seo' => self::seo(),
            'search-intel' => self::searchIntel(),
            'internal-links' => self::internalLinks(),
            'content-refresh' => self::contentRefresh(),
            'research' => self::research(),
            'content-strategist' => self::contentStrategist(),
            'journal' => self::journal($input),
            'insights' => self::insights($input),
            'case-study' => self::caseStudy(),
            'engagement' => self::engagement(),
            'cro' => self::cro(),
            'lead-intel' => self::leadIntel(),
            'business-intel' => self::businessIntel(),
            'social' => self::social(),
            'newsletter' => self::newsletter(),
            'knowledge' => self::knowledge(),
            'ai-editor' => self::aiEditor(),
            'orchestrator' => self::orchestrator(),
            'keyword-intel' => self::keywordIntel(),
            'trend' => self::trend(),
            'fact-checker' => self::factChecker(),
            'experience-design' => self::experienceDesign(),
            'positioning' => self::positioning(),
            'proof' => self::proof(),
            'developer' => self::developer(),
            'security' => self::securityAgent(),
            'performance' => self::performance(),
            'accessibility' => self::accessibility(),
            default => ['ok' => false, 'actions' => 0, 'output' => ['error' => "unknown agent $slug"]],
        };
    }

    /* ============ ANALYTICS AGENT ============ */
    private static function analytics(): array
    {
        $brief = IntelligenceModel::dailyBrief();
        $funnel = IntelligenceModel::funnel(7);
        // real GA4 external data where imported
        $ga4 = IntelligenceMetricModel::series('ga4:sessions', 14);
        $ga4Note = $ga4 ? ('GA4 sessions last: ' . end($ga4)['value']) : 'GA4 not imported yet';
        $drop = null;
        foreach ($funnel as $i => $f) if ($i > 0 && $f['rate'] < 25) { $drop = $f; break; }
        $note = $drop ? "Drop-off at {$drop['stage']} ({$drop['rate']}%)" : "Funnel healthy";
        AgentMemory::remember('analytics', ['context' => 'daily', 'observation' => "Traffic {$brief['traffic_delta_pct']}% vs yesterday, {$brief['leads_today']} lead(s)", 'decision' => $note, 'action' => 'recorded growth report', 'result' => json_encode($brief), 'metric' => "traffic_delta={$brief['traffic_delta_pct']}%", 'confidence' => 90]);
        return ['ok' => true, 'actions' => 1, 'output' => ['brief' => $brief, 'drop_off' => $drop], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ WEBSITE HEALTH AGENT ============ */
    private static function health(): array
    {
        $actions = 0;
        $problems = [];
        $siteUrl = rtrim(AV_SITE_URL, '/');
        $paths = ['/', '/story.html', '/experience.html', '/case-studies.html', '/contact.html', '/css/styles.css', '/js/main.js', '/sitemap.xml', '/robots.txt', '/search.html'];
        foreach ($paths as $p) {
            $code = 0;
            $ch = curl_init($siteUrl . $p);
            curl_setopt_array($ch, [CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 8, CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true]);
            curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            $ms = (int)round(curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000);
            curl_close($ch);
            if ($code !== 200) { $problems[] = "$p → HTTP $code"; $actions++; }
            if ($p === '/' && $code === 200 && $ms > 2000) $problems[] = "/ slow ({$ms}ms)";
        }
        if ($problems) {
            NotificationModel::push('Website health alert', implode('; ', array_slice($problems, 0, 5)), 'error');
        }
        AgentMemory::remember('health', ['context' => 'check', 'observation' => count($problems) . " issue(s) across " . count($paths) . " paths", 'decision' => $problems ? 'notified admin' : 'all healthy', 'action' => 'http-check', 'result' => implode('; ', $problems) ?: 'ok', 'metric' => 'issues=' . count($problems), 'confidence' => 95]);
        return ['ok' => true, 'actions' => $actions, 'output' => ['checked' => count($paths), 'problems' => $problems], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ TECHNICAL SEO AGENT ============ */
    private static function technicalSeo(): array
    {
        $actions = 0;
        $crawl = SeoCrawlerModel::crawl(null);
        $issues = array_values(array_filter($crawl['issues'], fn($i) => $i['issue_type'] === 'missing_description'));
        $fixed = [];
        $doc = ContentStore::all();
        foreach ($issues as $iss) {
            $slug = trim($iss['url'], '/');
            $slug = str_replace(['essay-', 'journal-'], '', $slug);
            $slug = str_replace('.html', '', $slug);
            // find the entity by slug and generate a real description from its content
            foreach (['pages', 'projects', 'articles'] as $key) {
                foreach (($doc[$key] ?? []) as $i => $it) {
                    if (($it['slug'] ?? '') !== $slug) continue;
                    $src = strip_tags((string)($it['lede'] ?? $it['excerpt'] ?? $it['summary'] ?? $it['title'] ?? ''));
                    $desc = mb_substr($src, 0, 155);
                    if (mb_strlen($desc) < 40) continue;
                    $seo = $it['seo'] ?? [];
                    $seo['desc'] = $desc;
                    $doc[$key][$i]['seo'] = $seo;
                    $fixed[] = $iss['url'];
                    $actions++;
                    break 2;
                }
            }
        }
        if ($fixed) {
            foreach (['pages', 'projects', 'articles'] as $key) {
                if (isset($doc[$key])) ContentStore::put($key, $doc[$key], null, 'agent: technical-seo auto meta descriptions');
            }
            NotificationModel::push('Technical SEO auto-fix', 'Generated ' . count($fixed) . ' meta description(s) from real content', 'seo');
        }
        AgentMemory::remember('technical-seo', ['context' => 'audit', 'observation' => "Crawl score {$crawl['score']}, {$crawl['issues_found']} issues", 'decision' => count($fixed) . " safe metadata fix(es) applied", 'action' => 'crawl+fix', 'result' => "fixed: " . implode(', ', array_slice($fixed, 0, 5)), 'metric' => "score={$crawl['score']}", 'confidence' => 90]);
        return ['ok' => true, 'actions' => $actions, 'output' => ['score' => $crawl['score'], 'issues' => $crawl['issues_found'], 'auto_fixed' => $fixed], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ SEO AGENT ============ */
    private static function seo(): array
    {
        $actions = 0;
        $opps = KeywordModel::opportunities(5);
        $cann = KeywordModel::cannibalization();
        $decay = SeoCrawlerModel::contentDecay(30);
        // REAL search console quick wins (positions 4-20, real impressions/clicks)
        $wins = SearchConsoleModel::quickWins(8);
        foreach ($wins as $w) {
            AgentMemory::remember('seo', ['context' => 'search-quick-win', 'observation' => "\"{$w['query']}\" pos {$w['position']}, {$w['impressions']} impressions, CTR {$w['ctr']}%", 'decision' => implode(' | ', array_slice($w['recommendations'], 0, 2)), 'action' => 'recommend', 'result' => "opportunity {$w['opportunity_score']}/100", 'metric' => 'impressions=' . $w['impressions'], 'confidence' => min(95, $w['opportunity_score'])]);
            $actions++;
        }
        // outcome: compare impressions/position vs 14 days ago (real before/after)
        $now = SearchConsoleModel::overview(7);
        $before = SearchConsoleModel::overview(28);
        if (($now['sources']['google']['impressions'] ?? 0) > 0) {
            $delta = (($now['sources']['google']['impressions'] ?? 0) - ($before['sources']['google']['impressions'] ?? 0)) / max(1, ($before['sources']['google']['impressions'] ?? 0));
            OutcomeModel::record('seo', 'organic_impressions', 'site', (string)($before['sources']['google']['impressions'] ?? 0), (string)($now['sources']['google']['impressions'] ?? 0),
                round($delta * 100, 1) . '%', [date('Y-m-d', strtotime('-7 days')), date('Y-m-d')], 'search_console', '7d vs prior 7d');
        }
        foreach ($opps as $o) {
            AgentMemory::remember('seo', ['context' => 'opportunity', 'observation' => "Keyword \"{$o['keyword']}\" — {$o['reason']}", 'decision' => $o['score'] >= 70 ? 'HIGH priority' : 'review', 'action' => 'recommend', 'result' => "opportunity {$o['score']}/100", 'metric' => 'score=' . $o['score'], 'confidence' => min(95, $o['score'])]);
            $actions++;
        }
        if ($cann) {
            NotificationModel::push('SEO cannibalization', count($cann) . ' keyword(s) target multiple URLs — merge or differentiate', 'seo');
            $actions++;
        }
        AgentMemory::remember('seo', ['context' => 'summary', 'observation' => count($opps) . " opportunities, " . count($cann) . " cannibalization, " . count($decay) . " decaying", 'decision' => 'recorded opportunities', 'action' => 'analyze', 'result' => 'ok', 'metric' => 'opportunities=' . count($opps), 'confidence' => 85]);
        return ['ok' => true, 'actions' => $actions, 'output' => ['opportunities' => $opps, 'cannibalization' => $cann, 'decay' => $decay], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ SEARCH INTELLIGENCE ============ */
    private static function searchIntel(): array
    {
        // deterministic: surface untracked high-value topics from knowledge + keyword intents
        $topics = ['experience design', 'immersive technology', 'creative technology', 'design leadership', 'enterprise innovation', 'brand experience'];
        $tracked = array_map(fn($k) => strtolower($k['keyword']), KeywordModel::keywords(['limit' => 500]));
        $found = [];
        foreach ($topics as $t) {
            $related = array_values(array_filter($tracked, fn($k) => str_contains($k, $t)));
            if (count($related) < 3) {
                $found[] = ['topic' => $t, 'coverage' => count($related) . ' keyword(s)', 'gap' => 'expand with ' . (3 - count($related)) . ' related keyword(s)'];
            }
        }
        foreach ($found as $f) AgentMemory::remember('search-intel', ['context' => 'gap', 'observation' => "Topic \"{$f['topic']}\" has only {$f['coverage']}", 'decision' => 'content gap', 'action' => 'recommend', 'result' => $f['gap'], 'metric' => 'coverage=' . $f['coverage'], 'confidence' => 75]);
        return ['ok' => true, 'actions' => count($found), 'output' => ['gaps' => $found], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ INTERNAL LINKING AGENT ============ */
    private static function internalLinks(): array
    {
        $weak = [];
        $siteDir = AV_SITE_OUT;
        $pages = glob($siteDir . '/*.html') ?: [];
        $links = [];
        foreach ($pages as $f) {
            $html = (string)file_get_contents($f);
            if (preg_match_all('/href="([^"#]+\.html)"/i', $html, $m)) {
                foreach ($m[1] as $h) {
                    if (str_starts_with($h, 'http')) continue;
                    $t = basename(parse_url($h, PHP_URL_PATH) ?: '');
                    if ($t !== '') $links[$t] = ($links[$t] ?? 0) + 1;
                }
            }
        }
        foreach ($pages as $f) {
            $n = basename($f);
            $c = $links[$n] ?? 0;
            if ($c === 0 && $n !== '404.html' && $n !== 'index.html') $weak[] = '/' . $n;
        }
        foreach ($weak as $w) AgentMemory::remember('internal-links', ['context' => 'orphan', 'observation' => "$w has zero internal links", 'decision' => 'add links from related pages', 'action' => 'recommend', 'result' => 'link from related article/page', 'metric' => 'incoming=0', 'confidence' => 80]);
        return ['ok' => true, 'actions' => count($weak), 'output' => ['orphans' => $weak], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ CONTENT REFRESH AGENT ============ */
    private static function contentRefresh(): array
    {
        $decay = SeoCrawlerModel::contentDecay(30);
        foreach ($decay as $d) AgentMemory::remember('content-refresh', ['context' => 'decay', 'observation' => "{$d['path']} declined {$d['decline_pct']}%", 'decision' => 'refresh recommended', 'action' => 'recommend', 'result' => "refresh with new examples + internal links", 'metric' => "decline={$d['decline_pct']}%", 'confidence' => 85]);
        return ['ok' => true, 'actions' => count($decay), 'output' => ['decay' => $decay], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ RESEARCH AGENT ============ */
    private static function research(): array
    {
        // process REAL unprocessed RSS items into structured research notes (no republishing)
        $items = ResearchModel::unprocessed(20);
        $stored = 0;
        $ids = [];
        foreach ($items as $it) {
            $ids[] = (int)$it['id'];
            $exists = Database::one("SELECT id FROM knowledge_items WHERE source_type='rss' AND source_id=?", [$it['guid']]);
            if ($exists) continue;
            $topic = (string)($it['title'] ?? '');
            Database::q("INSERT INTO knowledge_items (title, body, category, tags, source_type, source_id, source_url)
                         VALUES (?,?,?,?,?,?,?)",
                [mb_substr($topic, 0, 190), 'RSS research note — ' . $topic . "\n\n" . mb_substr((string)$it['summary'], 0, 1500) . "\n\nSource: " . ($it['author'] ?? 'unknown') . " — for research only, never republished verbatim.",
                 'research', json_encode(['rss', 'research-only']), 'rss', $it['guid'], $it['url']]);
            $stored++;
        }
        if ($ids) ResearchModel::markProcessed($ids);
        AgentMemory::remember('research', ['context' => 'rss', 'observation' => "$stored new RSS research note(s)", 'decision' => 'stored with source attribution', 'action' => 'store', 'result' => 'knowledge updated', 'metric' => "notes=$stored", 'confidence' => 85]);
        // curated topic notes (fallback research signal when no feeds yet)
        $topics = ['immersive retail experience', 'experience centre strategy', 'enterprise design leadership', 'AI-enabled creative production', 'XR for training'];
        $stored = 0;
        foreach ($topics as $t) {
            $exists = Database::one("SELECT id FROM knowledge_items WHERE title LIKE ?", ['%' . $t . '%']);
            if ($exists) continue;
            $related = [];
            foreach (ContentStore::get('articles') as $a) if (stripos((string)($a['excerpt'] ?? ''), 'experience') !== false) $related[] = $a['title'];
            Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)",
                ["Research: $t",
                 "Topic note — $t.\nRelevance: emerging area for experience design work.\nIn-system evidence: " . (count($related) ? implode('; ', array_slice($related, 0, 3)) : 'none yet — original research needed') . ".\nSource: AV OS internal research (curated). No external scraping.",
                 'research', json_encode(['research', str_replace(' ', '-', $t)])]);
            $stored++;
        }
        AgentMemory::remember('research', ['context' => 'topics', 'observation' => "$stored new research note(s)", 'decision' => 'stored curated topic notes', 'action' => 'store', 'result' => 'knowledge updated', 'metric' => "notes=$stored", 'confidence' => 70]);
        return ['ok' => true, 'actions' => $stored, 'output' => ['stored' => $stored], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ CONTENT STRATEGIST ============ */
    private static function contentStrategist(): array
    {
        $opps = KeywordModel::opportunities(5);
        $recs = [];
        foreach (array_slice($opps, 0, 3) as $o) {
            $recs[] = ['topic' => $o['keyword'], 'why' => $o['reason'], 'intent' => $o['intent'], 'cta' => 'Discuss a project', 'priority' => $o['score'] >= 70 ? 'high' : 'medium'];
        }
        foreach ($recs as $r) AgentMemory::remember('content-strategist', ['context' => 'roadmap', 'observation' => "Next content: {$r['topic']} ({$r['why']})", 'decision' => $r['priority'] . ' priority', 'action' => 'recommend', 'result' => 'add to content calendar', 'metric' => 'intent=' . $r['intent'], 'confidence' => 80]);
        return ['ok' => true, 'actions' => count($recs), 'output' => ['recommendations' => $recs], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ JOURNAL AGENT (draft only; quality-gated) ============ */
    private static function journal(array $input): array
    {
        $topic = trim((string)($input['topic'] ?? ''));
        if ($topic === '') {
            // pick the top untracked opportunity from the strategist
            $opps = KeywordModel::opportunities(8);
            $used = Database::all("SELECT title FROM knowledge_items WHERE category='journal-drafts' LIMIT 20");
            $usedTitles = array_map(fn($u) => strtolower($u['title']), $used);
            $topic = '';
            foreach ($opps as $o) {
                if (!in_array(strtolower($o['keyword']), $usedTitles, true)) { $topic = $o['keyword']; break; }
            }
            if ($topic === '') return ['ok' => true, 'actions' => 0, 'output' => ['note' => 'no untracked topic — quality over volume'], 'tokens' => 0, 'cost' => 0];
        }
        // knowledge context
        $kb = '';
        foreach (Database::all("SELECT title, body FROM knowledge_items ORDER BY id DESC LIMIT 5") as $k) $kb .= "- {$k['title']}: " . mb_substr(strip_tags((string)$k['body']), 0, 200) . "\n";
        $projects = [];
        foreach (ContentStore::get('projects') as $p) $projects[] = ($p['client'] ?? '') . ' — ' . ($p['title'] ?? '');
        $context = "Topic: $topic\nKnown projects (only these may be referenced): " . implode('; ', array_slice($projects, 0, 6)) . "\nKnowledge:\n$kb";

        $draft = null;
        $tokens = 0; $cost = 0;
        $llm = AiService::chat(
            "You are the AV OS Journal Agent for Abhijeet Varghese (creative systems leader). Write a journal article (600-900 words) on the topic. Requirements: original point of view with real experience; reference ONLY the known projects listed; NO invented statistics, clients, awards or quotes; conversational editorial tone; end with a CTA to contact.html. Return plain text.",
            $context . "\n\nTopic: $topic",
            null, 'journal'
        );
        if ($llm['ok']) {
            $draft = $llm['text'];
            $tokens = (int)($llm['tokens_in'] ?? 0) + (int)($llm['tokens_out'] ?? 0);
            $cost = round($tokens / 1000 * 0.002, 4);
        } else {
            // honest fallback: structured outline from real data (no fake prose)
            $draft = "DRAFT OUTLINE (no LLM key configured — expand in the CMS editor)\n\nTopic: $topic\n\nContext:\n" . $context . "\n\nSuggested structure:\n1. Why this matters now\n2. What I've seen in real engagements\n3. The principle that holds\n4. What to do differently\n5. CTA → contact.html";
        }
        // quality gate
        $gate = AgentQualityGate::evaluate(['title' => ucwords($topic), 'body' => $draft, 'seo' => ['desc' => mb_substr($draft, 0, 155)]]);
        $result = 'quality_gate=' . $gate['score'] . ($gate['pass'] ? ' PASS' : ' FAIL');
        Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)",
            ["Journal draft: $topic", $draft . "\n\n[Agent draft — quality gate {$gate['score']}/100, threshold {$gate['threshold']}]", 'journal-drafts', json_encode(['agent', 'draft', $gate['pass'] ? 'ready' : 'needs-work'])]);
        AgentMemory::remember('journal', ['context' => 'draft', 'observation' => "Drafted \"$topic\"", 'decision' => $gate['pass'] ? 'quality gate passed — ready for review' : 'needs work before review', 'action' => 'draft', 'result' => $result, 'metric' => 'q=' . $gate['score'], 'confidence' => (int)min(95, $gate['score'])]);
        return ['ok' => true, 'actions' => 1, 'output' => ['topic' => $topic, 'quality_score' => $gate['score'], 'pass' => $gate['pass'], 'stored_as' => 'knowledge: journal-drafts', 'note' => 'Draft only — human review + publish required'], 'tokens' => $tokens, 'cost' => $cost];
    }

    /* ============ INSIGHTS AGENT (short expert notes) ============ */
    private static function insights(array $input): array
    {
        $topic = trim((string)($input['topic'] ?? ''));
        $seeds = [
            'What experience centres teach us about clarity',
            'Why enterprise teams misunderstand experience design',
            'The quiet skill of making complex things feel simple',
        ];
        $used = Database::all("SELECT title FROM knowledge_items WHERE category='insight-drafts' LIMIT 30");
        $usedT = array_map(fn($u) => strtolower($u['title']), $used);
        if ($topic === '') {
            foreach ($seeds as $s) if (!in_array(strtolower($s), $usedT, true)) { $topic = $s; break; }
            if ($topic === '') return ['ok' => true, 'actions' => 0, 'output' => ['note' => 'insight queue covered'], 'tokens' => 0, 'cost' => 0];
        }
        $projects = [];
        foreach (ContentStore::get('projects') as $p) $projects[] = ($p['title'] ?? '') . ' (' . ($p['client'] ?? '') . ')';
        $ctx = "Known projects: " . implode('; ', array_slice($projects, 0, 8)) . "\nWrite a 200-350 word expert insight on: $topic";
        $tokens = 0; $cost = 0;
        $draft = '';
        $llm = AiService::chat("You are the AV OS Insights Agent. Write a concise expert insight (200-350 words) from real professional experience. Specific observation + evidence + point of view. NEVER invent facts, clients, numbers or quotes. Reference only the known projects.", $ctx, null, 'insights');
        if ($llm['ok']) { $draft = $llm['text']; $tokens = (int)($llm['tokens_in'] ?? 0) + (int)($llm['tokens_out'] ?? 0); $cost = round($tokens / 1000 * 0.002, 4); }
        else { $draft = "INSIGHT OUTLINE (no LLM key configured)\n\n$topic\n\n1. The observation\n2. Evidence from real work\n3. The point of view\n4. Implication for teams\n5. CTA → contact.html"; }
        $gate = AgentQualityGate::evaluate(['title' => $topic, 'body' => $draft, 'seo' => ['desc' => mb_substr($draft, 0, 155)]]);
        Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)",
            ["Insight draft: $topic", $draft . "\n\n[Agent draft — quality {$gate['score']}/100]", 'insight-drafts', json_encode(['agent', 'insight'])]);
        AgentMemory::remember('insights', ['context' => 'draft', 'observation' => "Insight draft: $topic", 'decision' => 'stored for review', 'action' => 'draft', 'result' => "q={$gate['score']}", 'metric' => 'q=' . $gate['score'], 'confidence' => 80]);
        return ['ok' => true, 'actions' => 1, 'output' => ['topic' => $topic, 'quality_score' => $gate['score'], 'note' => 'Draft only'], 'tokens' => $tokens, 'cost' => $cost];
    }

    /* ============ CASE STUDY AGENT ============ */
    private static function caseStudy(): array
    {
        CaseStudyModel::refreshAll();
        $scores = CaseStudyModel::all();
        $existing = ContentStore::get('projects');
        $drafts = 0;
        foreach ($existing as $p) {
            $slug = (string)($p['slug'] ?? '');
            $scoreRow = null;
            foreach ($scores as $sr) if ($sr['project_slug'] === $slug) { $scoreRow = $sr; break; }
            $score = $scoreRow ? (int)$scoreRow['score'] : 0;
            $hasCase = !empty($p['summary']) && !empty($p['outcome']);
            if (!$hasCase) {
                if ($scoreRow && !empty($scoreRow['missing'])) {
                    AgentMemory::remember('case-study', ['context' => 'incomplete', 'observation' => "Project \"{$p['title']}\" case-study completeness {$score}/100", 'decision' => 'ask the owner for: ' . implode(', ', (array)json_decode((string)$scoreRow['missing'], true)), 'action' => 'request', 'result' => 'incomplete — do not fabricate', 'metric' => 'completeness=' . $score, 'confidence' => 90]);
                }
                continue;
            }
            if ($score < 70) {
                AgentMemory::remember('case-study', ['context' => 'incomplete', 'observation' => "Project \"{$p['title']}\" case-study completeness {$score}/100", 'decision' => 'request missing fields before drafting', 'action' => 'request', 'result' => 'incomplete — do not fabricate', 'metric' => 'completeness=' . $score, 'confidence' => 90]);
                continue;
            }
            $draft = "CASE STUDY DRAFT — {$p['title']} ({$p['client']})\n\nChallenge: {$p['challenge']}\nApproach: {$p['approach']}\nOutcome: {$p['outcome']}\nRole: {$p['role']}\n" . (!empty($p['metrics']) ? "Metrics: " . (is_array($p['metrics']) ? implode(', ', $p['metrics']) : $p['metrics']) . "\n" : "") . "\nCTA → contact.html";
            Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)",
                ["Case study draft: {$p['title']}", $draft, 'case-study-drafts', json_encode(['agent', 'case-study', $p['client'] ?? ''])]);
            AgentMemory::remember('case-study', ['context' => 'draft', 'observation' => "Project \"{$p['title']}\" ready ({$score}/100)", 'decision' => 'draft created', 'action' => 'draft', 'result' => 'stored in knowledge for review', 'metric' => 'completeness=' . $score, 'confidence' => 85]);
            $drafts++;
        }
        return ['ok' => true, 'actions' => $drafts, 'output' => ['drafts' => $drafts, 'note' => 'Drafts only — human review before publishing'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ ENGAGEMENT + CRO AGENTS ============ */
    private static function engagement(): array
    {
        $scores = IntelligenceModel::engagement(30);
        $ctas = IntelligenceModel::ctaIntelligence(30);
        $lowConv = array_values(array_filter($scores, fn($s) => $s['views'] >= 3 && $s['leads'] === 0));
        foreach (array_slice($lowConv, 0, 3) as $p) {
            AgentMemory::remember('engagement', ['context' => 'low-conversion', 'observation' => "{$p['path']}: {$p['views']} views, 0 leads", 'decision' => 'improve CTA + add proof', 'action' => 'recommend', 'result' => 'add case-study evidence + clearer CTA', 'metric' => "views={$p['views']}", 'confidence' => 75]);
        }
        foreach (array_slice($ctas, 0, 3) as $c) {
            AgentMemory::remember('cro', ['context' => 'cta', 'observation' => "CTA on {$c['page']}: {$c['clicks']} clicks, {$c['conversion_rate']}% conversion", 'decision' => $c['conversion_rate'] < 5 && $c['clicks'] > 0 ? 'improve CTA copy/placement' : 'monitor', 'action' => 'recommend', 'result' => 'see CTA intelligence', 'metric' => "conv={$c['conversion_rate']}%", 'confidence' => 70]);
        }
        return ['ok' => true, 'actions' => count($lowConv) + min(3, count($ctas)), 'output' => ['low_conversion' => $lowConv, 'ctas' => array_slice($ctas, 0, 3)], 'tokens' => 0, 'cost' => 0];
    }

    private static function cro(): array
    {
        $out = self::engagement();
        // REAL high-traffic/low-conversion pages from search data
        $cands = SearchConsoleModel::croCandidates(5);
        foreach ($cands as $c) {
            AgentMemory::remember('cro', ['context' => 'search-conversion-gap', 'observation' => "{$c['page']}: {$c['impressions']} impressions, {$c['clicks']} clicks, {$c['leads_90d']} lead(s)", 'decision' => $c['conversion_gap'] === 'high' ? 'CTA visibility issue — add contextual proof + related case study' : 'medium gap — improve CTA', 'action' => 'recommend', 'result' => 'see CRO queue', 'metric' => 'leads=' . $c['leads_90d'], 'confidence' => 80]);
        }
        $out['output']['search_conversion_candidates'] = $cands;
        $out['actions'] += count($cands);
        return $out;
    }

    /* ============ LEAD INTELLIGENCE ============ */
    private static function leadIntel(): array
    {
        $actions = 0;
        $rows = Database::all("SELECT id, name, score, status FROM leads WHERE status IN ('new','contacted') AND deleted_at IS NULL AND score >= 70 ORDER BY score DESC LIMIT 5");
        foreach ($rows as $l) {
            $taskExists = Database::one("SELECT id FROM tasks WHERE entity_type='lead' AND entity_id=? AND title LIKE 'Follow up%' AND status NOT IN ('done','cancelled')", [$l['id']]);
            if (!$taskExists) {
                Database::q("INSERT INTO tasks (title, description, entity_type, entity_id, priority, status) VALUES ('Follow up with high-value lead', ?, 'lead', ?, 'high', 'todo')",
                    ["Lead #{$l['id']} ({$l['name']}) scored {$l['score']} — agent-created follow-up", (int)$l['id']]);
                NotificationModel::push('High-value lead — follow up', "{$l['name']} (score {$l['score']}) — follow-up task created", 'lead');
                $actions++;
            }
            AgentMemory::remember('lead-intel', ['context' => 'lead', 'observation' => "Lead {$l['name']} score {$l['score']}", 'decision' => 'high value — follow up now', 'action' => 'create_task', 'result' => 'task ' . ($taskExists ? 'already exists' : 'created'), 'metric' => "score={$l['score']}", 'confidence' => 90]);
        }
        $prev = Database::one("SELECT COUNT(*) n FROM agent_outcomes WHERE agent_slug='lead-intel' AND metric='high_value_leads'");
        OutcomeModel::record('lead-intel', 'high_value_leads', 'crm', (string)($prev['n'] ?? 0), (string)count($rows), null, [date('Y-m-d', strtotime('-7 days')), date('Y-m-d')], 'crm', 'leads scored >= 70');
        return ['ok' => true, 'actions' => $actions, 'output' => ['high_value' => count($rows), 'tasks_created' => $actions], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ BUSINESS INTELLIGENCE ============ */
    private static function businessIntel(): array
    {
        $out = [];
        // services → leads
        $byType = Database::all("SELECT lead_type, COUNT(*) n FROM leads WHERE deleted_at IS NULL AND lead_type != '' GROUP BY lead_type ORDER BY n DESC LIMIT 5");
        // case studies → leads
        $bySource = Database::all("SELECT source, COUNT(*) n FROM leads WHERE deleted_at IS NULL GROUP BY source ORDER BY n DESC LIMIT 5");
        // traffic source quality
        $srcQuality = Database::all("SELECT utm_source, COUNT(*) n FROM leads WHERE deleted_at IS NULL AND utm_source != '' GROUP BY utm_source ORDER BY n DESC LIMIT 5");
        $out = ['top_services' => $byType, 'top_sources' => $bySource, 'utm_quality' => $srcQuality];
        foreach (array_slice($byType, 0, 3) as $s) AgentMemory::remember('business-intel', ['context' => 'services', 'observation' => "Service \"{$s['lead_type']}\" → {$s['n']} lead(s)", 'decision' => 'emphasize in content strategy', 'action' => 'analyze', 'result' => 'see business intelligence', 'metric' => "leads={$s['n']}", 'confidence' => 85]);
        return ['ok' => true, 'actions' => count($byType), 'output' => $out, 'tokens' => 0, 'cost' => 0];
    }

    /* ============ SOCIAL + NEWSLETTER (draft only) ============ */
    private static function social(): array
    {
        $doc = ContentStore::get('projects');
        $drafts = 0;
        $platforms = array_map(fn($p) => $p['platform'], SocialProfileModel::all());
        foreach (array_slice($doc, 0, 2) as $p) {
            $exists = Database::one("SELECT id FROM social_drafts WHERE content_id=? AND platform='linkedin'", [(string)($p['id'] ?? '')]);
            if ($exists) continue;
            $r = IntelligenceModel::socialDraft(['content_type' => 'case_study', 'content_id' => (string)($p['id'] ?? ''), 'platform' => 'linkedin'], null);
            if ($r['id']) { $drafts++; AgentMemory::remember('social', ['context' => 'draft', 'observation' => "LinkedIn draft for \"{$p['title']}\"", 'decision' => 'queued for approval (never auto-posts)', 'action' => 'draft', 'result' => 'stored', 'metric' => 'draft=1', 'confidence' => 80]); }
        }
        // YouTube videos (real RSS) as content ideas
        $videos = Database::all("SELECT title, url, created_at FROM dev_events WHERE repo='youtube' AND kind='video' ORDER BY created_at DESC LIMIT 3");
        foreach ($videos as $v) {
            AgentMemory::remember('social', ['context' => 'video', 'observation' => "YouTube: {$v['title']}", 'decision' => 'link from website/social posts (approval-gated)', 'action' => 'recommend', 'result' => 'cross-link idea', 'metric' => 'videos=' . count($videos), 'confidence' => 70]);
        }
        return ['ok' => true, 'actions' => $drafts + count($videos), 'output' => ['drafts' => $drafts, 'videos' => $videos, 'platforms_registered' => $platforms, 'note' => 'Drafts only — MANUAL PUBLISH REQUIRED (no auto-posting; social APIs are approval-gated)'], 'tokens' => 0, 'cost' => 0];
    }

    private static function newsletter(): array
    {
        $items = Database::all("SELECT title, body FROM knowledge_items WHERE category IN ('journal-drafts','insight-drafts') ORDER BY id DESC LIMIT 5");
        if (!$items) return ['ok' => true, 'actions' => 0, 'output' => ['note' => 'no drafts to curate'], 'tokens' => 0, 'cost' => 0];
        $subject = 'AV OS digest — ' . date('M Y');
        $body = "NEWSLETTER DRAFT (for approval)\nSubject: $subject\n\n";
        foreach ($items as $i) $body .= "- {$i['title']}: " . mb_substr(strip_tags((string)$i['body']), 0, 120) . "\n";
        $body .= "\nCTA → contact.html";
        Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)", ["Newsletter draft: $subject", $body, 'newsletter-drafts', json_encode(['agent', 'newsletter'])]);
        AgentMemory::remember('newsletter', ['context' => 'digest', 'observation' => 'Newsletter draft from ' . count($items) . ' item(s)', 'decision' => 'queue for approval', 'action' => 'draft', 'result' => 'stored', 'metric' => 'items=' . count($items), 'confidence' => 75]);
        return ['ok' => true, 'actions' => 1, 'output' => ['note' => 'Draft only'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ KNOWLEDGE AGENT ============ */
    private static function knowledge(): array
    {
        $dups = Database::all("SELECT title, COUNT(*) n FROM knowledge_items GROUP BY title HAVING n > 1 LIMIT 10");
        $issues = 0;
        foreach ($dups as $d) { $issues++; AgentMemory::remember('knowledge', ['context' => 'duplicate', 'observation' => "Duplicate knowledge: \"{$d['title']}\" ×{$d['n']}", 'decision' => 'merge duplicates', 'action' => 'flag', 'result' => 'recommend merge', 'metric' => 'dups=' . $d['n'], 'confidence' => 90]); }
        return ['ok' => true, 'actions' => $issues, 'output' => ['duplicates' => $dups], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ AI EDITOR (audits existing agent drafts) ============ */
    private static function aiEditor(): array
    {
        $drafts = Database::all("SELECT id, title, body, category FROM knowledge_items WHERE category IN ('journal-drafts','insight-drafts','case-study-drafts') AND tags NOT LIKE '%edited%' ORDER BY id DESC LIMIT 10");
        $checked = 0;
        foreach ($drafts as $d) {
            $gate = AgentQualityGate::evaluate(['title' => (string)$d['title'], 'body' => (string)$d['body'], 'seo' => ['desc' => '']]);
            Database::q("UPDATE knowledge_items SET tags=? WHERE id=?", [json_encode(['agent', 'edited', $gate['pass'] ? 'approved' : 'needs-work', 'q=' . $gate['score']]), (int)$d['id']]);
            $checked++;
            AgentMemory::remember('ai-editor', ['context' => 'review', 'observation' => "Reviewed \"{$d['title']}\" — quality {$gate['score']}/100", 'decision' => $gate['pass'] ? 'approved for review' : 'needs revision', 'action' => 'quality_gate', 'result' => implode('; ', array_slice($gate['issues'], 0, 2)) ?: 'clean', 'metric' => 'q=' . $gate['score'], 'confidence' => 88]);
        }
        return ['ok' => true, 'actions' => $checked, 'output' => ['reviewed' => $checked], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ CHIEF OF STAFF (orchestrator) ============ */
    private static function orchestrator(): array
    {
        $next = IntelligenceModel::nextActions(5);
        $health = AgentRegistry::health();
        $brief = [
            'date' => date('Y-m-d'),
            'system' => $health,
            'top_recommendation' => $next[0]['title'] ?? 'No urgent actions — keep building authority steadily',
            'recommendation_impact' => $next[0]['impact'] ?? 0,
            'recommendation_reason' => $next[0]['reason'] ?? '',
            'actions' => array_slice($next, 0, 5),
        ];
        AgentMemory::remember('orchestrator', ['context' => 'daily', 'observation' => 'Chief-of-staff daily review', 'decision' => $brief['top_recommendation'], 'action' => 'prioritize', 'result' => count($next) . ' action(s) ranked', 'metric' => 'top_impact=' . $brief['recommendation_impact'], 'confidence' => 85]);
        return ['ok' => true, 'actions' => 1, 'output' => ['brief' => $brief], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ KEYWORD INTELLIGENCE (registry from real search data) ============ */
    private static function keywordIntel(): array
    {
        $actions = 0;
        $wins = SearchConsoleModel::queries(200);
        $existing = KeywordModel::keywords(['limit' => 500]);
        $existingK = array_map(fn($k) => strtolower($k['keyword']), $existing);
        foreach ($wins as $w) {
            $q = strtolower((string)$w['query']);
            if ($q === '' || strlen($q) > 120) continue;
            if (in_array($q, $existingK, true)) continue;
            // register high-value untracked queries (real impressions as volume proxy)
            if ((int)$w['impressions'] < 20) continue;
            KeywordModel::keywordSave(null, [
                'keyword' => $w['query'],
                'intent' => KeywordModel::classifyIntent($w['query']),
                'search_volume' => min(9999, (int)$w['impressions']),   // proxy: real GSC impressions, labeled
                'difficulty' => (int)min(90, max(20, (int)round((float)$w['position'] * 4))),
                'priority' => (int)$w['impressions'] >= 200 ? 'high' : 'medium',
                'notes' => 'Agent-registered from real Search Console data (impressions proxy for volume)',
            ]);
            $existingK[] = $q;
            AgentMemory::remember('keyword-intel', ['context' => 'registry', 'observation' => "Registered untracked query \"{$w['query']}\" ({$w['impressions']} impressions)", 'decision' => 'add to keyword registry', 'action' => 'register', 'result' => 'tracked', 'metric' => 'impressions=' . $w['impressions'], 'confidence' => 90]);
            $actions++;
        }
        return ['ok' => true, 'actions' => $actions, 'output' => ['registered' => $actions, 'note' => 'Volume shown is a real impressions proxy, not a paid-tool estimate'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ TREND AGENT (Google Trends RSS + feeds) ============ */
    private static function trend(): array
    {
        $rows = Database::all("SELECT ri.title, ri.url, ri.summary, rs.name source_name FROM research_items ri
                               LEFT JOIN research_sources rs ON rs.id = ri.source_id
                               WHERE ri.guid LIKE 'trends:%' AND ri.created_at > NOW() - INTERVAL 2 DAY
                               ORDER BY ri.published_at DESC LIMIT 15");
        $flagged = 0;
        foreach (array_slice($rows, 0, 5) as $t) {
            $relevant = preg_match('/design|ai|tech|experience|creative|digital|immersive|virtual|meta/i', (string)$t['title']) || preg_match('/design|ai|tech|experience|creative|digital|immersive|virtual|meta/i', (string)$t['summary']);
            if (!$relevant) continue;
            AgentMemory::remember('trend', ['context' => 'trend', 'observation' => "Trending: {$t['title']}", 'decision' => $relevant ? 'relevant to creative business — flag for content strategist' : 'monitor', 'action' => 'flag', 'result' => 'trend note', 'metric' => 'source=' . $t['source_name'], 'confidence' => 70]);
            $flagged++;
        }
        IntelligenceMetricModel::put('trends:relevant_today', 'rss', $flagged, ['window' => '2 days', 'source' => 'google trends + feeds']);
        return ['ok' => true, 'actions' => $flagged, 'output' => ['trends_checked' => count($rows), 'relevant' => $flagged], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ FACT CHECKER (truth layer) ============ */
    private static function factChecker(): array
    {
        $checked = 0; $blocked = [];
        // audit the most recent agent drafts
        $drafts = Database::all("SELECT id, title, body FROM knowledge_items WHERE category IN ('journal-drafts','insight-drafts','case-study-drafts') ORDER BY id DESC LIMIT 6");
        foreach ($drafts as $d) {
            $claims = [];
            if (preg_match_all('/[^.!?]{40,}[.!?]/u', (string)$d['body'], $m)) $claims = $m[0];
            $unsupported = 0;
            foreach (array_slice($claims, 0, 12) as $c) {
                $cl = FactsModel::classify(trim($c));
                if ($cl['status'] === 'unverified' && $cl['confidence'] >= 30 && preg_match('/\d+%|\d+ projects|\d+ clients|\d+ years|award|ranked|top \d/i', $c)) {
                    $unsupported++;
                }
            }
            $checked++;
            $tag = $unsupported ? 'factcheck-fail' : 'factcheck-pass';
            Database::q("UPDATE knowledge_items SET tags=? WHERE id=?", [json_encode(['agent', 'factchecked', $tag, "unsupported=$unsupported"]), (int)$d['id']]);
            if ($unsupported) $blocked[] = $d['title'];
            AgentMemory::remember('fact-checker', ['context' => 'draft', 'observation' => "\"{$d['title']}\": {$unsupported} unsupported claim(s)", 'decision' => $unsupported ? 'BLOCKED — needs human verification before publishing' : 'claims supported by evidence', 'action' => 'truth_gate', 'result' => $unsupported ? 'blocked' : 'pass', 'metric' => "unsupported=$unsupported", 'confidence' => 92]);
        }
        return ['ok' => true, 'actions' => $checked, 'output' => ['reviewed' => $checked, 'blocked' => $blocked, 'note' => 'Nothing publishes without passing the truth layer'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ EXPERIENCE DESIGN INTELLIGENCE ============ */
    private static function experienceDesign(): array
    {
        $terms = ['experience design', 'creative leadership', 'immersive', 'creative technology', 'XR', 'extended reality', 'brand experience', 'digital experience', 'human-centred', 'experience centre'];
        $doc = ContentStore::all();
        $areas = ['homepage' => [$doc['settings'] ?? [], $doc['sections']['hero'] ?? [], $doc['sections']['about'] ?? []],
                  'about' => [$doc['pages']['about'] ?? [], $doc['sections']['about'] ?? []],
                  'services' => [$doc['pages']['services'] ?? [], $doc['sections']['services'] ?? []],
                  'projects' => $doc['projects'] ?? [],
                  'articles' => $doc['articles'] ?? []];
        $coverage = [];
        foreach ($areas as $name => $data) {
            $text = strtolower(json_encode($data, JSON_UNESCAPED_UNICODE));
            $hits = array_values(array_filter($terms, fn($t) => str_contains($text, strtolower($t))));
            $coverage[$name] = ['terms_found' => $hits, 'coverage' => count($hits) >= 2 ? 'strong' : (count($hits) === 1 ? 'partial' : 'weak')];
        }
        $weak = array_filter($coverage, fn($c) => $c['coverage'] === 'weak');
        foreach ($weak as $area => $c) {
            AgentMemory::remember('experience-design', ['context' => 'positioning', 'observation' => "{$area} barely communicates experience-design expertise", 'decision' => 'add explicit positioning language with proof', 'action' => 'recommend', 'result' => 'rewrite copy with real project evidence', 'metric' => 'coverage=weak', 'confidence' => 80]);
        }
        IntelligenceMetricModel::put('positioning:experience_coverage', 'site', count($coverage) ? (int)round((count($coverage) - count($weak)) / count($coverage) * 100) : 0, ['areas' => $coverage]);
        return ['ok' => true, 'actions' => count($weak), 'output' => ['coverage' => $coverage], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ POSITIONING INTELLIGENCE ============ */
    private static function positioning(): array
    {
        $h = IntelligenceMetricModel::positioningHealth();
        IntelligenceMetricModel::put('positioning:health', 'site', $h['score'], ['checks' => $h['checks']]);
        foreach (array_filter($h['checks'], fn($c) => !$c['ok']) as $c) {
            AgentMemory::remember('positioning', ['context' => 'positioning', 'observation' => $c['label'], 'decision' => 'missing signal — close this gap', 'action' => 'recommend', 'result' => 'add evidence/content', 'metric' => 'weight=' . $c['weight'], 'confidence' => 85]);
        }
        OutcomeModel::record('positioning', 'positioning_health', 'site', '', (string)$h['score'], null, [date('Y-m-d'), date('Y-m-d')], 'content', 'Positioning Health 0-100');
        return ['ok' => true, 'actions' => count(array_filter($h['checks'], fn($c) => !$c['ok'])), 'output' => ['health' => $h], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ PROOF / AUTHORITY ============ */
    private static function proof(): array
    {
        $scores = CaseStudyModel::all();
        $issues = 0;
        foreach ($scores as $s) {
            if ((int)$s['score'] < 60) {
                $missing = (array)json_decode((string)$s['missing'], true);
                AgentMemory::remember('proof', ['context' => 'evidence', 'observation' => "\"{$s['project_title']}\" lacks evidence: " . implode(', ', array_slice($missing, 0, 4)), 'decision' => 'request real evidence — never fabricate', 'action' => 'request', 'result' => 'flag for owner', 'metric' => 'completeness=' . $s['score'], 'confidence' => 92]);
                $issues++;
            }
        }
        // every 'verified' claim on the site must trace to an entity
        $facts = FactsModel::all('verified');
        $nodes = KnowledgeGraphModel::nodes();
        $nodeKeys = array_map(fn($n) => $n['entity_type'] . ':' . $n['entity_id'], $nodes);
        $orphanClaims = 0;
        foreach ($facts as $f) {
            if (preg_match('/"(.*?)" was delivered for/', (string)$f['claim'], $m)) {
                $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/', '-', $m[1]), '-'));
                if (!in_array('project:' . $slug, $nodeKeys, true)) $orphanClaims++;
            }
        }
        return ['ok' => true, 'actions' => $issues + $orphanClaims, 'output' => ['low_evidence' => $issues, 'orphan_claims' => $orphanClaims], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ DEVELOPER INTELLIGENCE (GitHub + PHP/JS errors) ============ */
    private static function developer(): array
    {
        $actions = 0;
        $sig = DevIntelModel::signals();
        foreach (array_slice($sig['failed_builds'], 0, 5) as $e) {
            NotificationModel::push('GitHub workflow failure', "{$e['repo']}: {$e['title']}", 'system');
            AgentMemory::remember('developer', ['context' => 'build', 'observation' => "{$e['repo']} workflow failure: {$e['title']}", 'decision' => 'investigate + fix workflow', 'action' => 'alert', 'result' => 'recommendation: review workflow config', 'metric' => 'kind=workflow', 'confidence' => 85]);
            $actions++;
        }
        foreach (array_slice($sig['open_issues'], 0, 5) as $e) {
            AgentMemory::remember('developer', ['context' => 'issue', 'observation' => "Open issue in {$e['repo']}: {$e['title']}", 'decision' => 'triage', 'action' => 'flag', 'result' => 'recommendation: prioritize or close', 'metric' => 'kind=issue', 'confidence' => 75]);
            $actions++;
        }
        $errors = Database::all("SELECT source, COUNT(*) n FROM system_errors WHERE created_at > NOW() - INTERVAL 24 HOUR GROUP BY source ORDER BY n DESC LIMIT 5");
        foreach ($errors as $e) {
            AgentMemory::remember('developer', ['context' => 'errors', 'observation' => "{$e['n']} system error(s) from {$e['source']} in 24h", 'decision' => 'investigate root cause', 'action' => 'flag', 'result' => 'recommendation: fix repeated exception', 'metric' => 'errors=' . $e['n'], 'confidence' => 80]);
            $actions++;
        }
        DevIntelModel::markSeen(array_merge(array_column($sig['failed_builds'], 'id'), array_column($sig['open_issues'], 'id')));
        return ['ok' => true, 'actions' => $actions, 'output' => ['failed_builds' => count($sig['failed_builds']), 'open_issues' => count($sig['open_issues']), 'error_clusters' => $errors], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ SECURITY INTELLIGENCE ============ */
    private static function securityAgent(): array
    {
        $actions = 0;
        $fails = (int)Database::one("SELECT COUNT(*) n FROM login_attempts WHERE success=0 AND attempted_at > NOW() - INTERVAL 24 HOUR")['n'];
        if ($fails > 10) {
            NotificationModel::push('Security: repeated failed logins', "$fails failed login attempts in 24h — check users + sessions", 'system');
            AgentMemory::remember('security', ['context' => 'auth', 'observation' => "$fails failed logins in 24h", 'decision' => 'review + consider stricter throttling', 'action' => 'alert', 'result' => 'flag for admin', 'metric' => 'fails=' . $fails, 'confidence' => 95]);
            $actions++;
        }
        if (AV_DEBUG) {
            AgentMemory::remember('security', ['context' => 'debug', 'observation' => 'APP IS IN DEBUG MODE (AV_DEBUG=true)', 'decision' => 'disable debug mode in production', 'action' => 'alert', 'result' => 'security risk', 'metric' => 'debug=on', 'confidence' => 100]);
            $actions++;
        }
        // exposed-file probe: private paths must 404
        foreach (['/config.local.php', '/storage/', '/.env', '/database/schema.sql'] as $probe) {
            $ch = curl_init(rtrim(AV_SITE_URL, '/') . $probe);
            curl_setopt_array($ch, [CURLOPT_NOBODY => true, CURLOPT_TIMEOUT => 6, CURLOPT_RETURNTRANSFER => true]);
            curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);
            if ($code !== 404 && $code !== 403) {
                AgentMemory::remember('security', ['context' => 'exposure', 'observation' => "$probe returns HTTP $code", 'decision' => 'block private path', 'action' => 'alert', 'result' => 'exposure risk', 'metric' => 'code=' . $code, 'confidence' => 95]);
                $actions++;
            }
        }
        return ['ok' => true, 'actions' => $actions, 'output' => ['failed_logins_24h' => $fails, 'debug_mode' => AV_DEBUG, 'probes' => 'config/storage/env/schema'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ PERFORMANCE INTELLIGENCE (real measurements) ============ */
    private static function performance(): array
    {
        $checks = [];
        foreach (['/', '/css/styles.css', '/js/main.js', '/images/'] as $p) {
            $ch = curl_init(rtrim(AV_SITE_URL, '/') . $p);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_NOBODY => false]);
            $t0 = microtime(true);
            $body = curl_exec($ch);
            $ttfb = (int)round((microtime(true) - $t0) * 1000);
            $size = (int)curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD);
            curl_close($ch);
            $checks[] = ['path' => $p, 'ttfb_ms' => $ttfb, 'size_bytes' => $size];
            IntelligenceMetricModel::put('perf:ttfb', $p, $ttfb, ['size' => $size], date('Y-m-d'), date('Y-m-d'));
        }
        $slow = array_filter($checks, fn($c) => $c['ttfb_ms'] > 800);
        foreach ($slow as $c) {
            AgentMemory::remember('performance', ['context' => 'ttfb', 'observation' => "{$c['path']} TTFB {$c['ttfb_ms']}ms", 'decision' => 'review caching/hosting layer before redesign', 'action' => 'recommend', 'result' => 'check LiteSpeed cache + image optimization', 'metric' => 'ttfb=' . $c['ttfb_ms'], 'confidence' => 85]);
        }
        return ['ok' => true, 'actions' => count($slow), 'output' => ['checks' => $checks, 'note' => 'LCP/INP/CLS need a browser (CrUX API when key available) — server-side TTFB + size measured here'], 'tokens' => 0, 'cost' => 0];
    }

    /* ============ ACCESSIBILITY INTELLIGENCE (static audit of generated site) ============ */
    private static function accessibility(): array
    {
        $issues = 0;
        $files = glob(AV_SITE_OUT . '/*.html') ?: [];
        $report = [];
        foreach (array_slice($files, 0, 20) as $f) {
            $html = (string)file_get_contents($f);
            $path = basename($f);
            $doc = @new DOMDocument();
            @$doc->loadHTML($html);
            $xp = new DOMXPath($doc);
            $imgs = $xp->query('//img[not(@alt) or @alt=""]');
            $headings = $xp->query('//h1');
            $labels = $xp->query('//input[not(@aria-label) and not(@label) and @type!="hidden" and @type!="submit"]');
            $n = $imgs->length + $headings->length + $labels->length;
            if ($n > 0) {
                $report[] = ['path' => $path, 'missing_alt' => $imgs->length, 'missing_h1' => $headings->length, 'unlabeled_inputs' => $labels->length];
                $issues += $n;
                AgentMemory::remember('accessibility', ['context' => 'audit', 'observation' => "$path: $n a11y issue(s)", 'decision' => 'fix alt/labels (safe) — approve heading changes', 'action' => 'report', 'result' => 'see accessibility report', 'metric' => 'issues=' . $n, 'confidence' => 90]);
            }
        }
        return ['ok' => true, 'actions' => count($report), 'output' => ['pages_audited' => count($files), 'issues' => $issues, 'report' => array_slice($report, 0, 10), 'note' => 'Safe fixes (alt/labels) can be automated at autonomy 4'], 'tokens' => 0, 'cost' => 0];
    }
}
