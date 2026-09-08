<?php
/**
 * AV OS — INTEGRATION + INTELLIGENCE API (v2.4)
 * All routes are wired in ApiController; every handler here goes through
 * the same requireAuth + CSRF middleware (except public click tracking).
 */
final class IntegrationController
{
    /* ================= registry ================= */
    public static function index(): void
    {
        $rows = IntegrationHub::all();
        // overlay AI provider real state (openai/claude/gemini)
        foreach ($rows as &$r) {
            if (in_array($r['code'], ['openai', 'claude', 'gemini'], true)) {
                $p = Database::one("SELECT enabled, is_default FROM ai_providers WHERE code=?", [$r['code']]);
                $hasKey = (int)Database::one("SELECT (api_key_enc IS NOT NULL AND api_key_enc != '') has FROM ai_providers WHERE code=?", [$r['code']])['has'];
                $r['enabled'] = $p ? (int)$p['enabled'] : 0;
                $r['status'] = !$hasKey ? 'not_connected' : ($p && (int)$p['enabled'] ? 'configured' : 'disabled');
            }
        }
        Response::json([
            'items' => $rows,
            'health' => IntegrationHub::health(),
            'calls' => IntegrationLog::recent('', 12),
        ]);
    }

    public static function save(string $code): void
    {
        $d = Input::body();
        IntegrationHub::saveConfig($code, $d);
        Audit::log(Auth::user()['id'] ?? null, 'integration_config', 'integration', $code, ['fields' => array_keys($d)]);
        Response::json(['saved' => true, 'integration' => IntegrationHub::byCode($code)]);
    }

    public static function setEnabled(string $code, bool $enabled): void
    {
        IntegrationHub::setEnabled($code, $enabled);
        Audit::log(Auth::user()['id'] ?? null, 'integration_toggle', 'integration', $code, ['enabled' => $enabled]);
        Response::json(['enabled' => $enabled]);
    }

    public static function test(string $code): void
    {
        $res = IntegrationHub::testOne($code);
        Audit::log(Auth::user()['id'] ?? null, 'integration_test', 'integration', $code, ['ok' => $res['ok'] ?? false]);
        Response::json($res);
    }

    public static function sync(string $code): void
    {
        $res = IntegrationHub::syncOne($code, 'manual');
        Audit::log(Auth::user()['id'] ?? null, 'integration_sync', 'integration', $code, ['ok' => $res['ok'] ?? false, 'imported' => $res['imported'] ?? 0]);
        Response::json($res);
    }

    public static function agentGraph(): void
    {
        Response::json(['graph' => IntegrationHub::toolGraph()]);
    }

    public static function calls(): void
    {
        $provider = trim((string)($_GET['provider'] ?? ''));
        $limit = min(200, max(1, (int)($_GET['limit'] ?? 50)));
        Response::json(['calls' => IntegrationLog::recent($provider, $limit)]);
    }

    /* ================= search console ================= */
    public static function scOverview(): void
    {
        Response::json(SearchConsoleModel::overview((int)($_GET['days'] ?? 28)));
    }

    public static function scQueries(): void
    {
        Response::json(['items' => SearchConsoleModel::queries(min(500, max(1, (int)($_GET['limit'] ?? 100))), (string)($_GET['source'] ?? ''))]);
    }

    public static function scPages(): void
    {
        Response::json(['items' => SearchConsoleModel::pages(min(500, max(1, (int)($_GET['limit'] ?? 100))))]);
    }

    public static function scQuickWins(): void
    {
        Response::json(['items' => SearchConsoleModel::quickWins(min(100, max(1, (int)($_GET['limit'] ?? 20))))]);
    }

    public static function scOpportunities(): void
    {
        Response::json(['items' => SearchConsoleModel::opportunities(min(50, max(1, (int)($_GET['limit'] ?? 15))))]);
    }

    public static function scCro(): void
    {
        Response::json(['items' => SearchConsoleModel::croCandidates(min(50, max(1, (int)($_GET['limit'] ?? 10))))]);
    }

    public static function scImport(): void
    {
        $d = Input::body();
        $csv = (string)($d['csv'] ?? '');
        $source = ($d['source'] ?? 'google') === 'bing' ? 'bing' : 'google';
        if ($csv === '') Response::error('CSV content is required (paste the Search Console export)', 422, 'VALIDATION');
        $res = SearchConsoleModel::importCsv($csv, $source);
        Audit::log(Auth::user()['id'] ?? null, 'search_import', 'search_console', $source, $res);
        Response::json($res);
    }

    /* ================= research engine ================= */
    public static function researchSources(): void
    {
        Response::json(['items' => ResearchModel::sources()]);
    }

    public static function researchSourceSave(?int $id): void
    {
        $d = Input::body();
        $id = ResearchModel::sourceSave($id, $d);
        Audit::log(Auth::user()['id'] ?? null, 'research_source', 'research', $id ?: 'new', ['name' => $d['name'] ?? '']);
        Response::json(['id' => $id]);
    }

    public static function researchSourceDelete(int $id): void
    {
        ResearchModel::sourceDelete($id);
        Response::json(['deleted' => true]);
    }

    public static function researchFetch(): void
    {
        $sources = Database::all("SELECT id FROM research_sources WHERE enabled=1");
        $imported = 0; $errors = [];
        foreach ($sources as $s) {
            try { $imported += ResearchModel::fetchSource((int)$s['id']); }
            catch (Throwable $e) { $errors[] = $e->getMessage(); }
        }
        Audit::log(Auth::user()['id'] ?? null, 'research_fetch', 'research', '', ['imported' => $imported]);
        Response::json(['imported' => $imported, 'errors' => array_slice($errors, 0, 5)]);
    }

    public static function researchItems(): void
    {
        Response::json(['items' => ResearchModel::items(min(500, max(1, (int)($_GET['limit'] ?? 100))), (int)($_GET['days'] ?? 30))]);
    }

    public static function trends(): void
    {
        $rows = Database::all(
            "SELECT ri.*, rs.name source_name FROM research_items ri
             LEFT JOIN research_sources rs ON rs.id = ri.source_id
             WHERE ri.guid LIKE 'trends:%' ORDER BY ri.published_at DESC LIMIT 50");
        Response::json(['items' => $rows]);
    }

    /* ================= knowledge graph ================= */
    public static function graph(): void
    {
        Response::json(['nodes' => KnowledgeGraphModel::nodes(), 'edges' => KnowledgeGraphModel::edges()]);
    }

    public static function graphBuild(): void
    {
        $n = KnowledgeGraphModel::buildFromContent();
        $f = FactsModel::seedFromContent();
        Response::json(['nodes' => $n, 'facts_seeded' => $f]);
    }

    public static function graphAddEdge(): void
    {
        $d = Input::body();
        if (empty($d['from_type']) || empty($d['from_id']) || empty($d['to_type']) || empty($d['to_id']) || empty($d['relation'])) {
            Response::error('from/to entity and relation are required', 422, 'VALIDATION');
        }
        KnowledgeGraphModel::upsertNode((string)$d['from_type'], (string)$d['from_id'], (string)($d['from_label'] ?? $d['from_id']));
        KnowledgeGraphModel::upsertNode((string)$d['to_type'], (string)$d['to_id'], (string)($d['to_label'] ?? $d['to_id']));
        KnowledgeGraphModel::upsertEdge((string)$d['from_type'], (string)$d['from_id'], (string)$d['to_type'], (string)$d['to_id'],
            (string)$d['relation'], (int)($d['weight'] ?? 1), (string)($d['evidence'] ?? ''), (int)($d['verified'] ?? 0));
        Response::json(['saved' => true]);
    }

    /* ================= truth layer ================= */
    public static function facts(): void
    {
        Response::json(['items' => FactsModel::all((string)($_GET['status'] ?? ''))]);
    }

    public static function factCreate(): void
    {
        $d = Input::body();
        if (trim((string)($d['claim'] ?? '')) === '') Response::error('Claim is required', 422, 'VALIDATION');
        $id = FactsModel::create($d);
        Audit::log(Auth::user()['id'] ?? null, 'fact_create', 'fact', (string)$id, ['status' => $d['status'] ?? 'unverified']);
        Response::json(['id' => $id]);
    }

    public static function factStatus(int $id): void
    {
        $d = Input::body();
        FactsModel::updateStatus($id, (string)($d['status'] ?? 'unverified'), Auth::user()['name'] ?? Auth::user()['email'] ?? '');
        Response::json(['updated' => true]);
    }

    public static function factDelete(int $id): void
    {
        FactsModel::delete($id);
        Response::json(['deleted' => true]);
    }

    /* ================= case study intelligence ================= */
    public static function caseStudyIntel(): void
    {
        Response::json([
            'items' => CaseStudyModel::all(),
            'average' => CaseStudyModel::average(),
            'total' => (int)Database::one("SELECT COUNT(*) n FROM case_study_scores")['n'],
        ]);
    }

    public static function caseStudyRefresh(): void
    {
        $n = CaseStudyModel::refreshAll();
        Response::json(['scored' => $n]);
    }

    /* ================= social ================= */
    public static function socialProfiles(): void
    {
        Response::json(['items' => SocialProfileModel::all()]);
    }

    public static function socialProfileSave(string $platform): void
    {
        $d = Input::body();
        if ($platform === '') $platform = strtolower(trim((string)($d['platform'] ?? '')));
        if ($platform === '') Response::error('Platform is required', 422, 'VALIDATION');
        SocialProfileModel::save($platform, $d);
        Response::json(['saved' => true]);
    }

    public static function socialProfileDelete(string $platform): void
    {
        SocialProfileModel::delete($platform);
        Response::json(['deleted' => true]);
    }

    public static function socialSync(): void
    {
        // YouTube (RSS — free, real) + WhatsApp click-to-chat health
        $out = [];
        $yt = IntegrationHub::syncOne('youtube', 'manual');
        $out['youtube'] = $yt;
        if (!empty($yt['ok'])) SocialProfileModel::setConnected('youtube', true);
        if (!empty($yt['error']) && str_contains($yt['error'], 'unresolved')) SocialProfileModel::setConnected('youtube', false);
        $wa = IntegrationHub::syncOne('whatsapp', 'manual');
        $out['whatsapp'] = $wa;
        Response::json($out);
    }

    /* ================= trackable links ================= */
    public static function links(): void
    {
        $rows = TrackableLinkModel::all((string)($_GET['kind'] ?? ''));
        foreach ($rows as &$r) $r['url'] = TrackableLinkModel::url($r);
        Response::json(['items' => $rows]);
    }

    public static function linkSave(?int $id): void
    {
        $d = Input::body();
        $id = TrackableLinkModel::save($id, $d);
        $row = Database::one("SELECT * FROM trackable_links WHERE id=?", [$id]);
        $row['url'] = TrackableLinkModel::url($row);
        Audit::log(Auth::user()['id'] ?? null, 'link_create', 'trackable_link', (string)$id, ['kind' => $row['kind']]);
        Response::json(['id' => $id, 'link' => $row]);
    }

    public static function linkDelete(int $id): void
    {
        TrackableLinkModel::delete($id);
        Response::json(['deleted' => true]);
    }

    public static function linkClicks(int $id): void
    {
        $row = Database::one("SELECT * FROM trackable_links WHERE id=?", [$id]);
        if (!$row) Response::error('Link not found', 404, 'NOT_FOUND');
        $row['url'] = TrackableLinkModel::url($row);
        Response::json(['link' => $row, 'clicks' => TrackableLinkModel::clicks($id)]);
    }

    /** PUBLIC click tracking — no auth (fires from redirect links on the site). */
    public static function linkTrackPublic(): void
    {
        $linkId = (int)($_GET['id'] ?? 0);
        if ($linkId <= 0) Response::error('Link id required', 422, 'VALIDATION');
        $row = Database::one("SELECT * FROM trackable_links WHERE id=?", [$linkId]);
        if (!$row) Response::error('Link not found', 404, 'NOT_FOUND');
        TrackableLinkModel::trackClick($linkId, [
            'referrer' => (string)($_SERVER['HTTP_REFERER'] ?? ''),
            'page' => (string)($_GET['page'] ?? ''),
            'ip' => (string)($_SERVER['REMOTE_ADDR'] ?? ''),
            'ua' => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
        ]);
        Response::json(['ok' => true, 'redirect' => TrackableLinkModel::url($row)]);
    }

    /* ================= intelligence ================= */
    public static function positioning(): void
    {
        Response::json(IntelligenceMetricModel::positioningHealth());
    }

    public static function outcomes(): void
    {
        Response::json(['items' => OutcomeModel::recent((string)($_GET['agent'] ?? '')), 'summary' => OutcomeModel::summary()]);
    }

    public static function devIntel(): void
    {
        Response::json(['repos' => DevIntelModel::repos(), 'signals' => DevIntelModel::signals()]);
    }

    public static function knowledgeIngest(): void
    {
        Response::json(['items' => KnowledgeIngestModel::ledger(), 'sources' => KnowledgeModel::sources()]);
    }
}
