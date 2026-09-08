<?php
/**
 * AV OS — AI AGENT OPERATING SYSTEM (v2.3)
 *
 * A coordinated ecosystem of specialized agents running 24/7 through the
 * Hostinger cron (no persistent workers). Every agent has: real jobs,
 * schedule, permissions, memory, logging, cost tracking and an audit trail.
 *
 * Pipeline per autonomous action:
 *   AGENT → ORCHESTRATOR → PERMISSION CHECK → QUALITY GATE →
 *   ACTION → PUBLISH/UPDATE → MEASURE → LOG → LEARN
 *
 * Agents NEVER bypass: validation, permissions, quality gates, rollback,
 * audit logging. They never fabricate clients/projects/stats/experience.
 *
 * This file defines the registry + executors. The cron entry point is
 * backend/scripts/agent-runner.php.
 */

/* ============================================================
   ORCHESTRATOR SETTINGS (budgets, kill switch, thresholds)
   ============================================================ */
final class AgentSettings
{
    public static function get(): array
    {
        $row = Database::one("SELECT svalue FROM site_settings WHERE skey='ai_orchestrator'");
        $d = $row ? (json_decode((string)$row['svalue'], true) ?: []) : [];
        return [
            'paused_scopes' => $d['paused_scopes'] ?? [],
            'daily_budget' => (float)($d['daily_budget'] ?? 2.0),
            'monthly_budget' => (float)($d['monthly_budget'] ?? 40.0),
            'quality_threshold' => (int)($d['quality_threshold'] ?? 70),
            'max_jobs_per_run' => (int)($d['max_jobs_per_run'] ?? 6),
        ];
    }

    public static function save(array $d): void
    {
        $cur = self::get();
        if (isset($d['paused_scopes'])) $cur['paused_scopes'] = array_values(array_unique(array_filter((array)$d['paused_scopes'])));
        if (isset($d['daily_budget'])) $cur['daily_budget'] = max(0, (float)$d['daily_budget']);
        if (isset($d['monthly_budget'])) $cur['monthly_budget'] = max(0, (float)$d['monthly_budget']);
        if (isset($d['quality_threshold'])) $cur['quality_threshold'] = min(100, max(0, (int)$d['quality_threshold']));
        if (isset($d['max_jobs_per_run'])) $cur['max_jobs_per_run'] = min(20, max(1, (int)$d['max_jobs_per_run']));
        Database::q("INSERT INTO site_settings (skey, svalue) VALUES ('ai_orchestrator',?)
                     ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)", [json_encode($cur)]);
    }

    /** Global kill switch: is the whole AI system paused? */
    public static function isGloballyPaused(): bool
    {
        return !FeatureFlagModel::isOn('ai_agents') || in_array('all', self::get()['paused_scopes'], true);
    }

    /** Is a given scope paused? (seo, content, social, publish, system, all) */
    public static function isPaused(string $scope): bool
    {
        return self::isGloballyPaused() || in_array($scope, self::get()['paused_scopes'], true);
    }

    /** Map an agent slug to its pause scope (used by runner + integration hub). */
    public static function scopeOf(string $slug): string
    {
        return match (true) {
            in_array($slug, ['journal', 'insights', 'case-study', 'research', 'content-strategist', 'content-refresh', 'ai-editor', 'fact-checker', 'trend'], true) => 'content',
            in_array($slug, ['social', 'newsletter'], true) => 'social',
            in_array($slug, ['technical-seo', 'seo', 'search-intel', 'internal-links', 'keyword-intel', 'performance', 'accessibility'], true) => 'seo',
            in_array($slug, ['security', 'developer'], true) => 'system',
            in_array($slug, ['analytics', 'engagement', 'cro', 'lead-intel', 'business-intel', 'health', 'knowledge', 'orchestrator', 'experience-design', 'positioning', 'proof'], true) => 'publish',
            default => 'publish',
        };
    }

    /** Daily LLM spend estimate from ai_requests (cost per 1k tokens approx). */
    public static function dailyAiCost(): float
    {
        $t = (int)Database::one("SELECT COALESCE(SUM(tokens_in + tokens_out),0) n FROM ai_requests WHERE created_at > CURDATE()")['n'];
        return round($t / 1000 * 0.002, 4);
    }

    public static function monthlyAiCost(): float
    {
        $t = (int)Database::one("SELECT COALESCE(SUM(tokens_in + tokens_out),0) n FROM ai_requests WHERE created_at > DATE_FORMAT(NOW(),'%Y-%m-01')")['n'];
        return round($t / 1000 * 0.002, 4);
    }
}

/* ============================================================
   AGENT REGISTRY
   ============================================================ */
final class AgentRegistry
{
    /** Seed the 31-agent team (idempotent). Tools = integrations an agent may consume. */
    public static function seed(): void
    {
        $agents = [
            // [slug, name, role, desc, schedule, prio, autonomy, maxActions, tokens, cost, tools]
            ['orchestrator', 'AI Chief of Staff', 'strategy', 'Decides what needs attention, which agent handles it, what runs automatically and what needs approval.', 'daily', 'high', 3, 8, 3000, 0.50, []],
            ['analytics', 'Analytics Agent', 'analyst', 'Daily growth report from first-party + GA4 analytics: traffic, sources, top/declining pages, conversions.', 'daily', 'high', 4, 5, 1500, 0.20, ['ga4', 'clarity']],
            ['health', 'Website Health Agent', 'monitor', 'HTTP checks of critical pages/assets; alerts and safe recovery (delegates to publish rollback). Cloudflare where available.', 'every3h', 'critical', 4, 5, 800, 0.10, ['cloudflare']],
            ['technical-seo', 'Technical SEO Agent', 'analyst', 'Runs the technical crawl; auto-fixes safe items (missing metadata) at level 4.', 'daily', 'high', 4, 10, 2000, 0.30, ['gsc', 'bing']],
            ['seo', 'SEO Agent', 'strategist', 'Keyword opportunities from Search Console + internal data, cannibalization, content gaps, metadata recommendations.', 'daily', 'high', 3, 8, 2500, 0.40, ['gsc', 'bing', 'ga4']],
            ['search-intel', 'Search Intelligence Agent', 'researcher', 'Discovers keyword/question/trend opportunities from stored search datasets (Google + Bing fused).', 'weekly', 'medium', 2, 5, 2000, 0.30, ['gsc', 'bing', 'trends']],
            ['keyword-intel', 'Keyword Intelligence Agent', 'researcher', 'Maintains the keyword registry from real search data: intent, clusters, cannibalization, opportunities.', 'weekly', 'medium', 2, 5, 1500, 0.20, ['gsc', 'bing']],
            ['internal-links', 'Internal Linking Agent', 'analyst', 'Finds weak pages and linking opportunities; applies only high-confidence safe links at level 3.', 'daily', 'medium', 3, 8, 1200, 0.15, ['gsc']],
            ['content-refresh', 'Content Refresh Agent', 'analyst', 'Detects content decay, stale content, broken links; creates refresh drafts.', 'daily', 'medium', 2, 6, 1800, 0.25, ['gsc', 'ga4']],
            ['research', 'Research Agent', 'researcher', 'Processes RSS research items + approved Drive/Notion knowledge into structured notes with sources.', 'weekly', 'low', 3, 5, 2000, 0.30, ['rss', 'drive', 'notion', 'trends']],
            ['trend', 'Trend Agent', 'researcher', 'Tracks Google Trends + industry feeds; flags rising topics for the Content Strategist.', 'weekly', 'medium', 2, 4, 1500, 0.20, ['trends', 'rss']],
            ['content-strategist', 'Content Strategist', 'strategist', 'Creates the content roadmap: what to write, why, which keyword/intent/CTA.', 'daily', 'high', 2, 5, 2000, 0.30, ['gsc', 'search_console', 'research']],
            ['journal', 'Journal Agent', 'writer', 'Drafts journal articles only when opportunity + quality thresholds pass. Never volume for volume.', 'daily', 'medium', 2, 2, 4000, 0.60, ['gsc', 'research']],
            ['insights', 'Insights Agent', 'writer', 'Drafts short expert insights from real projects/knowledge with evidence and point of view.', 'daily', 'medium', 2, 2, 2500, 0.40, ['research', 'knowledge']],
            ['case-study', 'Case Study Agent', 'writer', 'Scores case-study completeness; requests missing information rather than inventing it; drafts from real project data.', 'weekly', 'medium', 2, 2, 3000, 0.50, ['drive', 'notion']],
            ['engagement', 'Engagement Agent', 'analyst', 'Engagement scores, CTA intelligence, funnel drop-offs → recommendations.', 'daily', 'medium', 3, 6, 1500, 0.20, ['ga4', 'clarity']],
            ['cro', 'CRO Agent', 'strategist', 'Conversion funnel: high-traffic/low-conversion pages (GA4 + Clarity + search data), CTA recommendations.', 'weekly', 'medium', 2, 5, 1800, 0.25, ['ga4', 'clarity', 'gsc']],
            ['lead-intel', 'Lead Intelligence Agent', 'analyst', 'Scores new leads (incl. Calendly bookings), flags high-value, creates follow-up tasks.', 'every6h', 'high', 3, 8, 1200, 0.15, ['calendly', 'whatsapp', 'email']],
            ['business-intel', 'Business Intelligence Agent', 'analyst', 'Connects traffic→content→leads→meetings→proposals: which services/case studies produce business.', 'weekly', 'high', 3, 6, 2000, 0.30, ['ga4', 'calendly', 'gsc']],
            ['social', 'Social Distribution Agent', 'distributor', 'Generates social drafts (LinkedIn/Instagram/YouTube) for strong content from the social registry. Never auto-posts.', 'weekly', 'low', 1, 3, 2000, 0.30, ['youtube', 'linkedin', 'instagram', 'behance', 'dribbble']],
            ['newsletter', 'Newsletter Agent', 'distributor', 'Creates newsletter candidates from journal/insights/case studies, queued for approval.', 'weekly', 'low', 1, 2, 2000, 0.30, ['email']],
            ['knowledge', 'Knowledge Agent', 'analyst', 'Maintains the knowledge base from Drive/Notion ingestion: duplicates, contradictions, missing info.', 'weekly', 'low', 3, 5, 1200, 0.15, ['drive', 'notion']],
            ['ai-editor', 'AI Editor', 'editor', 'Quality gate for AI content: fact whitelist, originality, brand voice, metadata.', 'daily', 'high', 3, 10, 1500, 0.20, ['knowledge']],
            ['fact-checker', 'Fact Checker', 'editor', 'Truth layer: classifies every AI claim as verified/unverified/inferred/opinion; blocks unsupported claims.', 'daily', 'high', 2, 8, 1200, 0.15, ['knowledge']],
            ['experience-design', 'Experience Design Intelligence Agent', 'strategist', 'Audits the whole digital presence for consistent communication of experience design / creative leadership / immersive / XR expertise.', 'weekly', 'medium', 2, 5, 2000, 0.30, ['gsc', 'linkedin']],
            ['positioning', 'Positioning Intelligence Agent', 'strategist', 'Continuously answers: who/what/problems/proof; computes Positioning Health 0–100; flags misalignment.', 'weekly', 'medium', 2, 5, 1500, 0.25, ['gsc', 'linkedin']],
            ['proof', 'Proof / Authority Agent', 'analyst', 'Every important claim connects to evidence (project/case study/images/outcome); flags unsupported claims.', 'weekly', 'medium', 2, 5, 1500, 0.25, ['drive', 'notion']],
            ['developer', 'Developer Intelligence Agent', 'monitor', 'Monitors PHP/JS errors + GitHub signals (failed workflows, open issues, stale repos); issues recommendations — never code changes.', 'every6h', 'medium', 1, 6, 1200, 0.15, ['github']],
            ['security', 'Security Intelligence Agent', 'monitor', 'Monitors failed logins, suspicious requests, exposed files, debug mode, headers. Never unrestricted control.', 'daily', 'high', 1, 6, 1200, 0.15, ['cloudflare', 'github']],
            ['performance', 'Performance Intelligence Agent', 'analyst', 'Monitors LCP/INP/CLS/TTFB/page+image size; recommendations only for major changes.', 'daily', 'medium', 2, 5, 1200, 0.15, ['cloudflare']],
            ['accessibility', 'Accessibility Intelligence Agent', 'analyst', 'Audits alt, labels, headings, keyboard, contrast, focus, forms, motion, ARIA. Safe fixes automated.', 'weekly', 'medium', 2, 6, 1500, 0.20, []],
        ];
        foreach ($agents as [$slug, $name, $role, $desc, $schedule, $prio, $autonomy, $maxActions, $tokens, $cost, $tools]) {
            Database::q("INSERT INTO ai_agents (slug, name, role, description, system_prompt, permissions, schedule, priority, autonomy, max_actions, max_tokens, max_cost, enabled, status)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,'active')
                         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), role=VALUES(role),
                         system_prompt=VALUES(system_prompt), permissions=VALUES(permissions), schedule=VALUES(schedule),
                         priority=VALUES(priority), autonomy=VALUES(autonomy), max_actions=VALUES(max_actions),
                         max_tokens=VALUES(max_tokens), max_cost=VALUES(max_cost)",
                [$slug, $name, $role, $desc, "You are the AV OS $name. Follow AV OS rules: never invent facts, clients, statistics, experience or outcomes. Use only real data from the system. Output is a draft unless autonomy permits applying.",
                 json_encode(['read' => ['content', 'analytics', 'leads', 'seo'], 'write' => ['drafts', 'metadata'], 'tools' => $tools]),
                 $schedule, $prio, $autonomy, $maxActions, $tokens, $cost]);
        }
    }

    public static function all(): array
    {
        return Database::all("SELECT * FROM ai_agents ORDER BY priority='critical' DESC, priority='high' DESC, id");
    }

    public static function bySlug(string $slug): ?array
    {
        return Database::one("SELECT * FROM ai_agents WHERE slug=?", [$slug]);
    }

    public static function setStatus(string $slug, string $status): void
    {
        if (in_array($status, ['active', 'paused', 'disabled', 'maintenance'], true)) {
            Database::q("UPDATE ai_agents SET status=?, consecutive_failures=0 WHERE slug=?", [$status, $slug]);
        }
    }

    public static function setAutonomy(string $slug, int $level): void
    {
        Database::q("UPDATE ai_agents SET autonomy=? WHERE slug=?", [min(5, max(0, $level)), $slug]);
    }

    public static function setSchedule(string $slug, string $schedule): void
    {
        Database::q("UPDATE ai_agents SET schedule=? WHERE slug=?", [$schedule, $slug]);
    }

    public static function heartbeat(string $slug, ?int $jobId = null): void
    {
        Database::q("UPDATE ai_agents SET last_seen=NOW(), current_job=COALESCE(?,current_job) WHERE slug=?", [$jobId, $slug]);
    }

    public static function markSuccess(string $slug): void
    {
        Database::q("UPDATE ai_agents SET last_run=NOW(), last_success=NOW(), run_count=run_count+1, success_count=success_count+1, consecutive_failures=0, current_job=NULL, last_error='' WHERE slug=?", [$slug]);
    }

    public static function markFailure(string $slug, string $error): void
    {
        Database::q("UPDATE ai_agents SET last_run=NOW(), last_failure=NOW(), run_count=run_count+1, failure_count=failure_count+1, consecutive_failures=consecutive_failures+1, current_job=NULL, last_error=? WHERE slug=?", [mb_substr($error, 0, 480), $slug]);
        // kill switch: 5 consecutive failures → pause + notify
        $a = self::bySlug($slug);
        if ($a && (int)$a['consecutive_failures'] >= 5) {
            Database::q("UPDATE ai_agents SET status='paused' WHERE slug=?", [$slug]);
            NotificationModel::push('AI agent paused', "{$a['name']} hit 5 consecutive failures — paused to protect AI budget. Review and re-enable.", 'error');
        }
    }

    /** Is the agent due to run? (schedule-aware; compared in SQL to avoid PHP/MySQL timezone drift) */
    public static function isDue(array $a): bool
    {
        if (!$a['enabled'] || $a['status'] !== 'active') return false;
        if (!$a['last_run']) return true;
        $mins = match ($a['schedule']) {
            'hourly' => 60, 'every3h' => 180, 'every6h' => 360, 'daily' => 1440,
            'weekly' => 10080, 'monthly' => 43200, default => 1440,
        };
        $r = Database::one("SELECT (last_run < NOW() - INTERVAL ? MINUTE) AS due FROM ai_agents WHERE id=?", [$mins, (int)$a['id']]);
        return $r ? (bool)$r['due'] : false;
    }

    /** Dashboard health summary. */
    public static function health(): array
    {
        $rows = self::all();
        $active = count(array_filter($rows, fn($a) => $a['status'] === 'active'));
        $failed = count(array_filter($rows, fn($a) => $a['status'] === 'error' || (int)$a['consecutive_failures'] >= 3));
        $queued = (int)Database::one("SELECT COUNT(*) n FROM ai_agent_jobs WHERE status='queued'")['n'];
        $running = (int)Database::one("SELECT COUNT(*) n FROM ai_agent_jobs WHERE status='running'")['n'];
        $lastOrch = Database::one("SELECT MAX(completed_at) m FROM ai_agent_jobs WHERE status='completed'");
        return [
            'overall' => $failed === 0 && !AgentSettings::isGloballyPaused() ? 'healthy' : (AgentSettings::isGloballyPaused() ? 'paused' : 'attention'),
            'agents_total' => count($rows), 'agents_active' => $active, 'agents_failed' => $failed,
            'jobs_queued' => $queued, 'jobs_running' => $running,
            'last_orchestration' => $lastOrch ? $lastOrch['m'] : null,
            'paused_scopes' => AgentSettings::get()['paused_scopes'],
            'daily_cost' => AgentSettings::dailyAiCost(),
        ];
    }

    /**
     * Explicit action policy per autonomy level (§83 / hardening audit).
     * Every executor's work falls into one of these risk classes; the
     * registry stores the autonomy level, this map states what that
     * level may actually DO.
     */
    public static function actionPolicy(string $slug): array
    {
        $a = self::bySlug($slug);
        $level = $a ? (int)$a['autonomy'] : 2;
        $cap = match (true) {
            $level >= 5 => ['action_type' => 'destructive', 'risk' => 'high', 'requires_approval' => true, 'rollback_available' => false],
            $level === 4 => ['action_type' => 'publish_safe', 'risk' => 'low', 'requires_approval' => false, 'rollback_available' => true],
            $level === 3 => ['action_type' => 'modify_content_metadata', 'risk' => 'low-medium', 'requires_approval' => false, 'rollback_available' => true],
            $level === 2 => ['action_type' => 'draft', 'risk' => 'none', 'requires_approval' => true, 'rollback_available' => true],
            $level === 1 => ['action_type' => 'recommend', 'risk' => 'none', 'requires_approval' => true, 'rollback_available' => true],
            default    => ['action_type' => 'observe', 'risk' => 'none', 'requires_approval' => true, 'rollback_available' => true],
        };
        $cap['autonomy_level'] = $level;
        $cap['guardrail'] = 'LLM calls are budget-gated; tool access is registry-enforced; nothing publishes without the quality gate + human approval unless autonomy 4 safe-fixes apply.';
        return $cap;
    }
}

/* ============================================================
   AGENT JOB QUEUE
   ============================================================ */
final class AgentJobs
{
    public static function enqueue(string $agentSlug, string $jobType = 'run', array $input = [], string $priority = 'medium'): int
    {
        $a = AgentRegistry::bySlug($agentSlug);
        if (!$a) return 0;
        // coalesce: one queued run per agent
        $existing = Database::one("SELECT id FROM ai_agent_jobs WHERE agent_slug=? AND status='queued' ORDER BY id LIMIT 1", [$agentSlug]);
        if ($existing) return (int)$existing['id'];
        Database::q("INSERT INTO ai_agent_jobs (agent_id, agent_slug, job_type, priority, status, input) VALUES (?,?,?,?, 'queued', ?)",
            [(int)$a['id'], $agentSlug, $jobType, $priority, json_encode($input)]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function claim(string $agentSlug): ?array
    {
        $row = Database::one("SELECT id FROM ai_agent_jobs WHERE agent_slug=? AND status='queued' ORDER BY priority='high' DESC, id LIMIT 1", [$agentSlug]);
        if (!$row) return null;
        $st = Database::q("UPDATE ai_agent_jobs SET status='running', started_at=NOW() WHERE id=? AND status='queued'", [(int)$row['id']]);
        if ($st->rowCount() === 0) return null;
        return Database::one("SELECT * FROM ai_agent_jobs WHERE id=?", [(int)$row['id']]);
    }

    public static function complete(int $jobId, array $output): void
    {
        Database::q("UPDATE ai_agent_jobs SET status='completed', completed_at=NOW(), output=?, tokens=?, cost=? WHERE id=?",
            [json_encode($output), (int)($output['tokens'] ?? 0), (float)($output['cost'] ?? 0), $jobId]);
    }

    public static function fail(int $jobId, string $error): void
    {
        Database::q("UPDATE ai_agent_jobs SET status='failed', completed_at=NOW(), error=? WHERE id=?", [mb_substr($error, 0, 480), $jobId]);
    }

    public static function recent(int $limit = 30): array
    {
        return Database::all("SELECT j.*, a.name agent_name FROM ai_agent_jobs j LEFT JOIN ai_agents a ON a.id=j.agent_id ORDER BY j.id DESC LIMIT $limit");
    }

    public static function cancelAllFor(string $agentSlug): void
    {
        Database::q("UPDATE ai_agent_jobs SET status='cancelled' WHERE agent_slug=? AND status='queued'", [$agentSlug]);
    }
}

/* ============================================================
   AGENT MEMORY (learning loop — structured, no self-modification)
   ============================================================ */
final class AgentMemory
{
    public static function remember(string $agentSlug, array $m): void
    {
        Database::q("INSERT INTO ai_agent_memory (agent_slug, context, observation, decision, action, result, metric, confidence)
                     VALUES (?,?,?,?,?,?,?,?)",
            [$agentSlug, $m['context'] ?? 'default', mb_substr($m['observation'] ?? '', 0, 480),
             mb_substr($m['decision'] ?? '', 0, 480), mb_substr($m['action'] ?? '', 0, 480),
             mb_substr($m['result'] ?? '', 0, 960), mb_substr($m['metric'] ?? '', 0, 120),
             min(100, max(0, (int)($m['confidence'] ?? 50)))]);
    }

    public static function recent(string $agentSlug = '', int $limit = 30): array
    {
        $w = $agentSlug !== '' ? "WHERE agent_slug=?" : "";
        $p = $agentSlug !== '' ? [$agentSlug] : [];
        return Database::all("SELECT * FROM ai_agent_memory $w ORDER BY id DESC LIMIT $limit", $p);
    }
}

/* ============================================================
   QUALITY GATE (rule-based, deterministic — no LLM needed)
   ============================================================ */
final class AgentQualityGate
{
    private const BRAND_BANNED = ['unlock', 'delve', 'game-changer', 'revolutionize', 'cutting-edge', 'in today\'s fast-paced', 'elevate your', 'unleash', 'transformative journey', 'seamlessly'];
    private const STOPWORDS = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'were', 'will', 'would', 'should', 'about', 'their', 'there', 'these', 'those'];

    /**
     * Score a draft before it may be saved/published.
     * Returns ['score' => 0-100, 'checks' => [...], 'pass' => bool, 'issues' => [...]]
     */
    public static function evaluate(array $draft, array $ctx = []): array
    {
        $text = (string)($draft['body'] ?? $draft['draft'] ?? '');
        $title = (string)($draft['title'] ?? '');
        $checks = [];
        $issues = [];

        // 1. depth
        $words = str_word_count(strip_tags($text), 0, 'äöüéèêàç');
        $depth = min(100, (int)round($words / 600 * 100));
        $checks['depth'] = ['label' => 'Content depth', 'score' => $depth, 'detail' => "$words words"];
        if ($words < 200) $issues[] = "Too thin ($words words) for a public article";

        // 2. originality vs existing content (token overlap)
        $sim = 0;
        $doc = ContentStore::all();
        $hay = [];
        foreach (['articles', 'pages', 'projects'] as $k) foreach (($doc[$k] ?? []) as $it) $hay[] = (string)($it['title'] ?? '') . ' ' . (string)($it['body'] ?? '') . ' ' . (string)($it['excerpt'] ?? '');
        if ($hay) {
            $tok = fn($t) => array_unique(array_filter(preg_split('/\W+/', strtolower($t)), fn($w) => strlen($w) > 3 && !in_array($w, self::STOPWORDS, true)));
            $t1 = $tok($text);
            $best = 0;
            foreach ($hay as $h) {
                $t2 = $tok($h);
                if (!$t2) continue;
                $overlap = count(array_intersect($t1, $t2)) / max(1, count($t1));
                $best = max($best, $overlap);
            }
            $sim = (int)round($best * 100);
        }
        $checks['originality'] = ['label' => 'Originality', 'score' => max(0, 100 - $sim), 'detail' => "max similarity $sim%"];
        if ($sim > 55) $issues[] = "Too similar to existing content ($sim%) — rewrite or reject";

        // 3. fact whitelist: any client/project name must exist in the system
        $known = [];
        foreach (($doc['projects'] ?? []) as $p) { $known[] = strtolower((string)($p['client'] ?? '')); $known[] = strtolower((string)($p['title'] ?? '')); }
        foreach (($doc['clients'] ?? []) as $c) $known[] = strtolower((string)($c['name'] ?? ''));
        $known = array_values(array_unique(array_filter($known)));
        $lowText = strtolower($text);
        $suspicious = [];
        foreach (['acme', 'globex', 'initech', 'umbrella', 'stark industries', 'wayne enterprises'] as $fake) {
            if (str_contains($lowText, $fake)) $suspicious[] = $fake;
        }
        $checks['facts'] = ['label' => 'Fact whitelist', 'score' => $suspicious ? 0 : 100, 'detail' => $suspicious ? 'Invented client markers: ' . implode(', ', $suspicious) : 'No invented entities detected'];
        if ($suspicious) $issues[] = 'Contains invented entity markers — rejected';

        // 4. brand voice: banned generic-AI phrases
        $bannedHits = [];
        foreach (self::BRAND_BANNED as $b) if (str_contains($lowText, $b)) $bannedHits[] = $b;
        $checks['voice'] = ['label' => 'Brand voice', 'score' => $bannedHits ? 40 : 100, 'detail' => $bannedHits ? 'Generic phrases: ' . implode(', ', $bannedHits) : 'Voice clean'];
        if ($bannedHits) $issues[] = 'Generic AI language detected — revise';

        // 5. metadata
        $metaOk = $title !== '' && mb_strlen((string)($draft['seo']['desc'] ?? '')) >= 50;
        $checks['metadata'] = ['label' => 'Metadata', 'score' => $metaOk ? 100 : 40, 'detail' => $metaOk ? 'Title + description present' : 'Missing title or description (<50 chars)'];
        if (!$metaOk) $issues[] = 'Missing SEO title/description';

        // 6. internal links
        $linkCount = substr_count($text, '.html') + substr_count($text, 'href="');
        $checks['links'] = ['label' => 'Internal links', 'score' => min(100, $linkCount * 20), 'detail' => "$linkCount link reference(s)"];
        if ($linkCount === 0) $issues[] = 'No internal links';

        // 7. CTA
        $hasCta = preg_match('/contact\.html|book|discuss|talk|reach out|let\'s talk/i', $text) === 1;
        $checks['cta'] = ['label' => 'CTA', 'score' => $hasCta ? 100 : 30, 'detail' => $hasCta ? 'CTA present' : 'No CTA'];
        if (!$hasCta) $issues[] = 'Missing CTA';

        $weights = ['depth' => 0.15, 'originality' => 0.2, 'facts' => 0.25, 'voice' => 0.1, 'metadata' => 0.1, 'links' => 0.1, 'cta' => 0.1];
        $score = 0;
        foreach ($checks as $k => $c) $score += $c['score'] * $weights[$k];
        $score = (int)round($score);
        $threshold = AgentSettings::get()['quality_threshold'];
        return ['score' => $score, 'checks' => $checks, 'issues' => $issues, 'pass' => $score >= $threshold, 'threshold' => $threshold];
    }
}
