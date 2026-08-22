<?php
/**
 * AV OS v2 — business models: CRM, projects, proposals, analytics,
 * automation, notifications, webhooks, api keys, feature flags.
 */

/* ============================================================
   CRM
   ============================================================ */
final class CrmModel
{
    public static function createCompany(array $d): int
    {
        Database::q("INSERT INTO companies (name, website, industry, size, country, notes) VALUES (?,?,?,?,?,?)",
            [$d['name'], $d['website'] ?? '', $d['industry'] ?? '', $d['size'] ?? '', $d['country'] ?? '', $d['notes'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function companies(): array
    {
        return Database::all("SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY created_at DESC");
    }
    public static function updateCompany(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['name','website','industry','size','country','notes'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE companies SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function deleteCompany(int $id): void { TrashModel::trash('companies', $id); }

    public static function createContact(array $d): int
    {
        Database::q("INSERT INTO contacts (company_id, name, email, phone, role, linkedin, notes) VALUES (?,?,?,?,?,?,?)",
            [$d['company_id'] ?? null, $d['name'], $d['email'] ?? '', $d['phone'] ?? '', $d['role'] ?? '', $d['linkedin'] ?? '', $d['notes'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function contacts(): array
    {
        return Database::all("SELECT c.*, co.name company_name FROM contacts c LEFT JOIN companies co ON co.id=c.company_id ORDER BY c.created_at DESC");
    }
    public static function updateContact(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['company_id','name','email','phone','role','linkedin','notes'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE contacts SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function deleteContact(int $id): void { TrashModel::trash('contacts', $id); }

    public static function createOpportunity(array $d): int
    {
        Database::q("INSERT INTO opportunities (lead_id, contact_id, company_id, title, value, currency, stage, probability, expected_close, source, campaign, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            [$d['lead_id'] ?? null, $d['contact_id'] ?? null, $d['company_id'] ?? null, $d['title'], $d['value'] ?? 0, $d['currency'] ?? 'INR',
             $d['stage'] ?? 'new', $d['probability'] ?? 10, $d['expected_close'] ?? null, $d['source'] ?? '', $d['campaign'] ?? '', $d['notes'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function opportunities(): array
    {
        return Database::all("SELECT o.*, c.name company_name, l.name lead_name FROM opportunities o
            LEFT JOIN companies c ON c.id=o.company_id LEFT JOIN leads l ON l.id=o.lead_id
            WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC");
    }
    public static function updateOpportunity(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['lead_id','contact_id','company_id','title','value','currency','stage','probability','expected_close','source','campaign','notes'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE opportunities SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function deleteOpportunity(int $id): void { TrashModel::trash('opportunities', $id); }

    public static function pipelineSummary(): array
    {
        return Database::all("SELECT stage, COUNT(*) n, COALESCE(SUM(value),0) total FROM opportunities GROUP BY stage");
    }

    public static function createMeeting(array $d): int
    {
        Database::q("INSERT INTO meetings (lead_id, contact_id, opportunity_id, subject, scheduled_at, duration_min, type, status, notes, outcome) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [$d['lead_id'] ?? null, $d['contact_id'] ?? null, $d['opportunity_id'] ?? null, $d['subject'] ?? $d['title'] ?? 'Meeting', $d['scheduled_at'] ?? null,
             $d['duration_min'] ?? 30, $d['type'] ?? 'video', $d['status'] ?? 'scheduled', $d['notes'] ?? '', $d['outcome'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function meetings(): array
    {
        return Database::all("SELECT m.*, l.name lead_name FROM meetings m LEFT JOIN leads l ON l.id=m.lead_id
            WHERE m.deleted_at IS NULL ORDER BY m.scheduled_at DESC");
    }
    public static function updateMeeting(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['subject','scheduled_at','duration_min','type','status','notes','outcome'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE meetings SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function deleteMeeting(int $id): void { TrashModel::trash('meetings', $id); }

    public static function addActivity(string $type, int $id, string $act, string $summary): void
    {
        Database::q("INSERT INTO activities (entity_type, entity_id, type, summary, created_by) VALUES (?,?,?,?,?)",
            [$type, $id, $act, $summary, Auth::user()['id'] ?? null]);
    }
    public static function activities(string $type, int $id): array
    {
        return Database::all("SELECT * FROM activities WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC LIMIT 100", [$type, $id]);
    }

    public static function createTask(array $d): int
    {
        Database::q("INSERT INTO tasks (title, description, entity_type, entity_id, due_at, status, priority, assignee, created_by) VALUES (?,?,?,?,?,?,?,?,?)",
            [$d['title'], $d['description'] ?? '', $d['entity_type'] ?? '', $d['entity_id'] ?? 0, $d['due_at'] ?? null,
             $d['status'] ?? 'todo', $d['priority'] ?? 'medium', $d['assignee'] ?? null, Auth::user()['id'] ?? null]);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function tasks(?string $status = null): array
    {
        $sql = "SELECT * FROM tasks";
        $p = [];
        if ($status) { $sql .= " WHERE status=?"; $p[] = $status; }
        $sql .= " ORDER BY created_at DESC LIMIT 200";
        return Database::all($sql, $p);
    }
    public static function updateTask(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['title','description','due_at','status','priority'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE tasks SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function deleteTask(int $id): void { TrashModel::trash('tasks', $id); }

    /* ---- lead scoring (configurable) ---- */
    public static function scoreLead(array $lead): int
    {
        $score = (int)($lead['score'] ?? 50);
        $rules = Database::all("SELECT * FROM lead_scoring_rules WHERE enabled=1 ORDER BY sort");
        $hay = strtolower(($lead['company'] ?? '') . ' ' . ($lead['email'] ?? '') . ' ' . ($lead['lead_type'] ?? '') . ' ' . ($lead['source'] ?? ''));
        foreach ($rules as $r) {
            $mv = strtolower($r['match_value']);
            switch ($r['match_field']) {
                case 'email_domain':
                    $dom = strtolower(substr((string)($lead['email'] ?? ''), strpos((string)($lead['email'] ?? ''), '@') ?: 0));
                    if ($mv === '' && preg_match('/@(gmail|yahoo|hotmail|outlook)\./', $dom)) break; // personal domain = no boost
                    if ($mv === '' || str_contains($dom, $mv)) $score += (int)$r['points'];
                    break;
                case 'lead_type': if ($mv === '' || str_contains($hay, $mv)) $score += (int)$r['points']; break;
                case 'project_type': if ($mv === '' || str_contains($hay, $mv)) $score += (int)$r['points']; break;
                case 'source': if ($mv === '' || str_contains($hay, $mv)) $score += (int)$r['points']; break;
                case 'referral': if ($mv === '' || str_contains($hay, 'referral')) $score += (int)$r['points']; break;
                case 'timeline': if ($mv === '' || str_contains($hay, $mv)) $score += (int)$r['points']; break;
                case 'budget': if ($mv === '' || str_contains($hay, $mv)) $score += (int)$r['points']; break;
            }
        }
        return max(0, min(100, $score));
    }
    public static function scoringRules(): array { return Database::all("SELECT * FROM lead_scoring_rules ORDER BY sort"); }
    public static function saveScoringRule(int $id, array $d): void
    {
        if ($id) Database::q("UPDATE lead_scoring_rules SET name=?, match_field=?, match_value=?, points=?, enabled=?, sort=? WHERE id=?", [$d['name'], $d['match_field'], $d['match_value'], (int)$d['points'], (int)($d['enabled'] ?? 1), (int)($d['sort'] ?? 0), $id]);
        else Database::q("INSERT INTO lead_scoring_rules (name, match_field, match_value, points, enabled, sort) VALUES (?,?,?,?,?,?)", [$d['name'], $d['match_field'], $d['match_value'], (int)$d['points'], (int)($d['enabled'] ?? 1), (int)($d['sort'] ?? 0)]);
    }
    public static function deleteScoringRule(int $id): void { Database::q("DELETE FROM lead_scoring_rules WHERE id=?", [$id]); }
}

/* ============================================================
   PROJECTS (business)
   ============================================================ */
final class BusinessProjectModel
{
    public static function create(array $d): int
    {
        Database::q("INSERT INTO projects (client_id, company_id, title, status, budget, currency, start_date, end_date, team, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [$d['client_id'] ?? null, $d['company_id'] ?? null, $d['title'], $d['status'] ?? 'scoping', $d['budget'] ?? 0, $d['currency'] ?? 'INR',
             $d['start_date'] ?? null, $d['end_date'] ?? null, json_encode($d['team'] ?? []), $d['notes'] ?? '']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function all(): array
    {
        return Database::all("SELECT p.*, c.name company_name FROM projects p LEFT JOIN companies c ON c.id=p.company_id
            WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC");
    }
    public static function update(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['client_id','company_id','title','status','budget','currency','start_date','end_date','notes'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if (isset($d['team'])) { $sets[] = 'team=?'; $p[] = json_encode($d['team']); }
        if ($sets) { $p[] = $id; Database::q("UPDATE projects SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function delete(int $id): void { TrashModel::trash('projects', $id); }
    public static function milestones(int $projectId): array { return Database::all("SELECT * FROM project_milestones WHERE project_id=? ORDER BY due_at", [$projectId]); }
    public static function addMilestone(int $projectId, array $d): int
    {
        Database::q("INSERT INTO project_milestones (project_id, title, due_at, status) VALUES (?,?,?,?)", [$projectId, $d['title'], $d['due_at'] ?? null, $d['status'] ?? 'pending']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function updateMilestone(int $id, array $d): void
    {
        Database::q("UPDATE project_milestones SET title=?, due_at=?, status=? WHERE id=?", [$d['title'], $d['due_at'] ?? null, $d['status'] ?? 'pending', $id]);
    }
    public static function deleteMilestone(int $id): void { Database::q("DELETE FROM project_milestones WHERE id=?", [$id]); }
    public static function documents(int $projectId): array { return Database::all("SELECT * FROM project_documents WHERE project_id=? ORDER BY created_at DESC", [$projectId]); }
    public static function addDocument(int $projectId, array $d): int
    {
        Database::q("INSERT INTO project_documents (project_id, title, media_id, kind) VALUES (?,?,?,?)", [$projectId, $d['title'], $d['media_id'] ?? null, $d['kind'] ?? 'file']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function deleteDocument(int $id): void { Database::q("DELETE FROM project_documents WHERE id=?", [$id]); }
}

/* ============================================================
   PROPOSALS
   ============================================================ */
final class ProposalModel
{
    public static function create(array $d): int
    {
        Database::q("INSERT INTO proposals (opportunity_id, client_name, title, scope, deliverables, timeline, investment, currency, terms, validity_days, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [$d['opportunity_id'] ?? null, $d['client_name'], $d['title'], $d['scope'] ?? '', json_encode($d['deliverables'] ?? []),
             $d['timeline'] ?? '', $d['investment'] ?? 0, $d['currency'] ?? 'INR', $d['terms'] ?? '', $d['validity_days'] ?? 30, $d['status'] ?? 'draft']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function all(): array { return Database::all("SELECT * FROM proposals WHERE deleted_at IS NULL ORDER BY created_at DESC"); }
    public static function find(int $id): ?array { return Database::one("SELECT * FROM proposals WHERE id=?", [$id]); }
    public static function update(int $id, array $d): void
    {
        $sets = []; $p = [];
        foreach (['client_name','title','scope','timeline','investment','currency','terms','validity_days','status'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = $d[$f]; }
        }
        if (isset($d['deliverables'])) { $sets[] = 'deliverables=?'; $p[] = json_encode($d['deliverables']); }
        if (isset($d['status']) && $d['status'] === 'sent') { $sets[] = 'sent_at=NOW()'; }
        if ($sets) { $p[] = $id; Database::q("UPDATE proposals SET " . implode(',', $sets) . " WHERE id=?", $p); }
    }
    public static function delete(int $id): void { TrashModel::trash('proposals', $id); }
}

/* ============================================================
   ANALYTICS (first-party)
   ============================================================ */
final class AnalyticsModel
{
    public static function track(array $e): void
    {
        Database::q("INSERT INTO analytics_events (site_id, event_type, path, referrer, utm_source, utm_medium, utm_campaign, device, country, visitor_id, content_id) VALUES (1,?,?,?,?,?,?,?,?,?,?)",
            [$e['event_type'], $e['path'] ?? '/', $e['referrer'] ?? '', $e['utm_source'] ?? '', $e['utm_medium'] ?? '', $e['utm_campaign'] ?? '',
             $e['device'] ?? '', $e['country'] ?? '', $e['visitor_id'] ?? '', $e['content_id'] ?? '']);
        if (!empty($e['content_id'])) {
            Database::q("INSERT INTO content_metrics (content_type, content_id, views, unique_views) VALUES (?,?,1,1)
                ON DUPLICATE KEY UPDATE views=views+1, unique_views=unique_views+IF(?=1,1,0)",
                [$e['content_type'] ?? 'page', $e['content_id'], $e['new_visitor'] ? 1 : 0]);
        }
    }

    public static function summary(int $days = 30): array
    {
        return [
            'pageviews' => (int)Database::one("SELECT COUNT(*) n FROM analytics_events WHERE event_type='pageview' AND created_at > NOW() - INTERVAL ? DAY", [$days])['n'],
            'visitors' => (int)Database::one("SELECT COUNT(DISTINCT visitor_id) n FROM analytics_events WHERE created_at > NOW() - INTERVAL ? DAY", [$days])['n'],
            'leads' => (int)Database::one("SELECT COUNT(*) n FROM leads WHERE created_at > NOW() - INTERVAL ? DAY", [$days])['n'],
            'meetings' => (int)Database::one("SELECT COUNT(*) n FROM meetings WHERE scheduled_at > NOW() - INTERVAL ? DAY", [$days])['n'],
            'conversion' => 0.0,
        ];
    }
    public static function topPages(int $days = 30, int $limit = 10): array
    {
        return Database::all("SELECT path, COUNT(*) views, COUNT(DISTINCT visitor_id) uniques FROM analytics_events
            WHERE event_type='pageview' AND created_at > NOW() - INTERVAL ? DAY GROUP BY path ORDER BY views DESC LIMIT ?", [$days, $limit]);
    }
    public static function sources(int $days = 30): array
    {
        return Database::all("SELECT COALESCE(NULLIF(utm_source,''),'direct') source, COUNT(*) n FROM analytics_events
            WHERE created_at > NOW() - INTERVAL ? DAY GROUP BY source ORDER BY n DESC LIMIT 10", [$days]);
    }
    public static function daily(int $days = 30): array
    {
        return Database::all("SELECT DATE(created_at) d, COUNT(*) n FROM analytics_events
            WHERE event_type='pageview' AND created_at > NOW() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY d", [$days]);
    }
    public static function campaigns(int $days = 90): array
    {
        return Database::all("SELECT utm_campaign campaign, COUNT(*) visits, SUM(event_type='lead') leads
            FROM analytics_events WHERE utm_campaign<>'' AND created_at > NOW() - INTERVAL ? DAY
            GROUP BY utm_campaign ORDER BY visits DESC", [$days]);
    }
    public static function contentMetrics(): array
    {
        return Database::all("SELECT * FROM content_metrics ORDER BY views DESC LIMIT 50");
    }
    public static function recordConversion(string $contentId, string $contentType = 'page'): void
    {
        Database::q("INSERT INTO content_metrics (content_type, content_id, leads) VALUES (?,?,1)
            ON DUPLICATE KEY UPDATE leads=leads+1", [$contentType, $contentId]);
    }
}

/* ============================================================
   AUTOMATION ENGINE
   ============================================================ */
final class AutomationModel
{
    public static function all(): array { return Database::all("SELECT * FROM automations ORDER BY created_at DESC"); }
    public static function create(array $d): int
    {
        Database::q("INSERT INTO automations (name, trigger_event, conditions, actions, enabled) VALUES (?,?,?,?,?)",
            [$d['name'], $d['trigger_event'], json_encode($d['conditions'] ?? []), json_encode($d['actions'] ?? []), (int)($d['enabled'] ?? 1)]);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function update(int $id, array $d): void
    {
        Database::q("UPDATE automations SET name=?, trigger_event=?, conditions=?, actions=?, enabled=? WHERE id=?",
            [$d['name'], $d['trigger_event'], json_encode($d['conditions'] ?? []), json_encode($d['actions'] ?? []), (int)($d['enabled'] ?? 1), $id]);
    }
    public static function delete(int $id): void { Database::q("DELETE FROM automations WHERE id=?", [$id]); }

    private static int $loopGuard = 0;
    private const MAX_RUNS_PER_REQUEST = 5;

    /** Run all automations for an event with a context payload. Returns run ids. */
    public static function run(string $event, array $context): array
    {
        self::$loopGuard++;
        if (self::$loopGuard > self::MAX_RUNS_PER_REQUEST) {
            ErrorModel::log('warning', 'automation', "Loop guard tripped on event '$event' — execution stopped");
            return [];
        }
        $runs = [];
        $rules = Database::all("SELECT * FROM automations WHERE enabled=1 AND trigger_event=?", [$event]);
        foreach ($rules as $rule) {
            $conds = json_decode($rule['conditions'] ?: '[]', true) ?: [];
            if (!self::matches($conds, $context)) continue;
            $results = [];
            foreach (json_decode($rule['actions'] ?: '[]', true) ?: [] as $action) {
                $results[] = self::executeAction($action, $context);
            }
            Database::q("UPDATE automations SET run_count=run_count+1, last_run_at=NOW() WHERE id=?", [$rule['id']]);
            Database::q("INSERT INTO automation_runs (automation_id, entity_type, entity_id, result, success) VALUES (?,?,?,?,1)",
                [$rule['id'], $context['entity_type'] ?? '', $context['entity_id'] ?? '', json_encode($results)]);
            $runs[] = $rule['id'];
        }
        return $runs;
    }

    private static function matches(array $conds, array $ctx): bool
    {
        foreach ($conds as $k => $v) {
            $val = $ctx[$k] ?? null;
            if ($k === 'score_min') {
                // contexts carry the lead score under 'score'
                $val = $ctx['score_min'] ?? $ctx['score'] ?? null;
                if ($val === null || (int)$val < (int)$v) return false;
                continue;
            }
            if ($k === 'days_min' && ($val === null || (int)$val < (int)$v)) return false;
            if ($k === 'status' && $val !== $v) return false;
        }
        return true;
    }

    private static function executeAction(array $action, array $ctx): array
    {
        $type = $action['type'] ?? '';
        switch ($type) {
            case 'notification':
                NotificationModel::push(
                    EmailModel::render($action['title'] ?? 'AV OS notification', $ctx),
                    EmailModel::render($action['body'] ?? '', $ctx)
                );
                return ['ok' => true, 'action' => 'notification'];
            case 'task':
                $t = $action['title'] ?? 'Follow up';
                $tid = CrmModel::createTask(['title' => $t, 'priority' => $action['priority'] ?? 'medium',
                    'entity_type' => $ctx['entity_type'] ?? '', 'entity_id' => (int)($ctx['entity_id'] ?? 0)]);
                return ['ok' => true, 'action' => 'task', 'task_id' => $tid];
            case 'webhook':
                $url = $action['url'] ?? '';
                if ($url) WebhookModel::deliverRaw($url, $ctx['event'] ?? 'event', $ctx);
                return ['ok' => true, 'action' => 'webhook'];
            case 'email':
                $to = $action['to'] ?? ($ctx['email'] ?? '');
                if ($to) {
                    $vars = $ctx + [
                        'site_name' => AV_SITE_URL,
                        'admin_url' => AV_SITE_URL . '/admin/',
                        'lead_name' => $ctx['name'] ?? '',
                        'lead_email' => $ctx['email'] ?? '',
                        'lead_score' => $ctx['score'] ?? 0,
                        'inactive_days' => $ctx['inactive_days'] ?? 0,
                    ];
                    $id = EmailModel::queue('follow_up', $to, '', '', $vars);
                    return ['ok' => true, 'action' => 'email', 'email_log_id' => $id];
                }
                return ['ok' => true, 'action' => 'email', 'note' => 'no recipient in context'];
            default:
                return ['ok' => false, 'action' => $type, 'note' => 'unknown action'];
        }
    }

    /**
     * Cron/manual sweep for the lead.inactive trigger.
     * Fires automations whose trigger_event='lead.inactive' and whose
     * days_min condition matches leads with no activity for >= N days.
     * Each lead fires at most once per 24h per rule (no notification spam).
     */
    public static function runInactive(): array
    {
        $rules = Database::all("SELECT * FROM automations WHERE enabled=1 AND trigger_event='lead.inactive'");
        $checked = 0;
        $fired = 0;
        foreach ($rules as $rule) {
            $conds = json_decode($rule['conditions'] ?: '[]', true) ?: [];
            $min = (int)($conds['days_min'] ?? 7);
            if ($min < 1) $min = 1;
            $leads = Database::all(
                "SELECT id, name, company, email, score, status, created_at,
                        TIMESTAMPDIFF(DAY, COALESCE(updated_at, created_at), NOW()) AS inactive_days
                 FROM leads
                 WHERE status NOT IN ('won','lost','archived')
                   AND TIMESTAMPDIFF(DAY, COALESCE(updated_at, created_at), NOW()) >= ?
                 ORDER BY id",
                [$min]
            );
            foreach ($leads as $l) {
                $recent = Database::one(
                    "SELECT id FROM automation_runs
                     WHERE automation_id=? AND entity_type='lead.inactive' AND entity_id=?
                       AND created_at > NOW() - INTERVAL 1 DAY",
                    [$rule['id'], $l['id']]
                );
                if ($recent) continue;
                $ctx = [
                    'entity_type' => 'lead', 'entity_id' => (int)$l['id'], 'event' => 'lead.inactive',
                    'lead_id' => (int)$l['id'], 'name' => $l['name'], 'email' => $l['email'] ?? '',
                    'company' => $l['company'] ?? '', 'score' => (int)$l['score'],
                    'status' => $l['status'], 'days_min' => (int)$l['inactive_days'],
                    'inactive_days' => (int)$l['inactive_days'],
                ];
                if (!self::matches($conds, $ctx)) continue;
                $results = [];
                foreach (json_decode($rule['actions'] ?: '[]', true) ?: [] as $action) {
                    $results[] = self::executeAction($action, $ctx);
                }
                Database::q("UPDATE automations SET run_count=run_count+1, last_run_at=NOW(), last_check_at=NOW() WHERE id=?", [$rule['id']]);
                Database::q("INSERT INTO automation_runs (automation_id, entity_type, entity_id, result, success) VALUES (?,?,?,?,1)",
                    [$rule['id'], 'lead.inactive', $l['id'], json_encode($results)]);
                $fired++;
            }
            Database::q("UPDATE automations SET last_check_at=COALESCE(last_check_at, NOW()) WHERE id=?", [$rule['id']]);
            $checked++;
        }
        return ['rules_checked' => $checked, 'actions_fired' => $fired, 'at' => date('c')];
    }

    public static function runs(): array
    {
        return Database::all("SELECT r.*, a.name automation_name FROM automation_runs r JOIN automations a ON a.id=r.automation_id ORDER BY r.id DESC LIMIT 100");
    }

    /** Dry-run one rule with a sample context: actions are evaluated and logged, NOT executed. */
    public static function runTest(array $rule): array
    {
        $conds = json_decode($rule['conditions'] ?: '[]', true) ?: [];
        $actions = json_decode($rule['actions'] ?: '[]', true) ?: [];
        $sample = ['entity_type' => 'lead', 'entity_id' => 0, 'event' => $rule['trigger_event'],
                   'name' => 'Sample lead', 'email' => 'sample@example.com', 'company' => 'Sample Co',
                   'score' => (int)($conds['score_min'] ?? 85), 'status' => 'new',
                   'days_min' => (int)($conds['days_min'] ?? 7), 'inactive_days' => (int)($conds['days_min'] ?? 7)];
        $matched = self::matches($conds, $sample);
        $planned = [];
        foreach ($actions as $a) {
            $planned[] = ['type' => $a['type'] ?? '?', 'title' => $a['title'] ?? '', 'would_execute' => $matched];
        }
        Database::q("INSERT INTO automation_runs (automation_id, entity_type, entity_id, result, success) VALUES (?, 'test', 0, ?, 1)",
            [$rule['id'], json_encode(['test_mode' => true, 'matched' => $matched, 'planned' => $planned])]);
        return ['ok' => true, 'rule' => $rule['name'], 'conditions_match' => $matched, 'planned_actions' => $planned];
    }
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
final class NotificationModel
{
    public static function push(string $title, string $body = '', string $type = 'info', ?int $userId = null, string $link = ''): int
    {
        Database::q("INSERT INTO notifications (user_id, type, title, body, link) VALUES (?,?,?,?,?)", [$userId, $type, $title, $body, $link]);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function all(?int $userId = null, int $limit = 100): array
    {
        $sql = "SELECT * FROM notifications";
        $p = [];
        if ($userId) { $sql .= " WHERE user_id=? OR user_id IS NULL"; $p[] = $userId; }
        $sql .= " ORDER BY created_at DESC LIMIT $limit";
        return Database::all($sql, $p);
    }
    public static function markRead(int $id): void { Database::q("UPDATE notifications SET read_at=NOW() WHERE id=?", [$id]); }
    public static function markAllRead(?int $userId): void
    {
        if ($userId) Database::q("UPDATE notifications SET read_at=NOW() WHERE (user_id=? OR user_id IS NULL) AND read_at IS NULL", [$userId]);
        else Database::q("UPDATE notifications SET read_at=NOW() WHERE read_at IS NULL");
    }
    public static function unreadCount(?int $userId): int
    {
        $p = [];
        $sql = "SELECT COUNT(*) n FROM notifications WHERE read_at IS NULL";
        if ($userId) { $sql .= " AND (user_id=? OR user_id IS NULL)"; $p[] = $userId; }
        return (int)Database::one($sql, $p)['n'];
    }
}

/* ============================================================
   WEBHOOKS
   ============================================================ */
final class WebhookModel
{
    public static function all(): array { return Database::all("SELECT * FROM webhooks ORDER BY created_at DESC"); }
    public static function create(array $d): int
    {
        Database::q("INSERT INTO webhooks (endpoint, secret, events, status) VALUES (?,?,?,?)",
            [$d['endpoint'], $d['secret'] ?? '', json_encode($d['events'] ?? []), $d['status'] ?? 'active']);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function update(int $id, array $d): void
    {
        Database::q("UPDATE webhooks SET endpoint=?, events=?, status=? WHERE id=?", [$d['endpoint'], json_encode($d['events'] ?? []), $d['status'] ?? 'active', $id]);
    }
    public static function delete(int $id): void { Database::q("DELETE FROM webhooks WHERE id=?", [$id]); }

    /** Fire a signed webhook to all registered endpoints for the event. */
    public static function dispatch(string $event, array $payload): void
    {
        $hooks = Database::all("SELECT * FROM webhooks WHERE status='active'");
        foreach ($hooks as $h) {
            $evts = json_decode($h['events'] ?: '[]', true) ?: [];
            if ($evts && !in_array($event, $evts, true)) continue;
            self::deliverRaw($h['endpoint'], $event, $payload, $h['secret'], (int)$h['id']);
        }
    }

    public static function deliverRaw(string $url, string $event, array $payload, string $secret = '', ?int $hookId = null): void
    {
        $body = json_encode(['event' => $event, 'data' => $payload, 'timestamp' => time()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $sig = $secret !== '' ? hash_hmac('sha256', $body, $secret) : '';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-AVOS-Signature: ' . $sig],
            CURLOPT_POSTFIELDS => $body,
        ]);
        $res = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($hookId) {
            Database::q("INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, success) VALUES (?,?,?,?,?)",
                [$hookId, $event, $body, $status, $status >= 200 && $status < 300 ? 1 : 0]);
            Database::q("UPDATE webhooks SET last_delivery=NOW() WHERE id=?", [$hookId]);
        }
    }

    public static function deliveries(int $hookId): array
    {
        return Database::all("SELECT * FROM webhook_deliveries WHERE webhook_id=? ORDER BY id DESC LIMIT 50", [$hookId]);
    }
}

/* ============================================================
   API KEYS
   ============================================================ */
final class ApiKeyModel
{
    public static function create(string $name, array $permissions = []): array
    {
        $key = 'av_' . bin2hex(random_bytes(16));
        $prefix = substr($key, 0, 8);
        Database::q("INSERT INTO api_keys (name, key_hash, key_prefix, permissions, created_by) VALUES (?,?,?,?,?)",
            [$name, hash('sha256', $key), $prefix, json_encode($permissions), Auth::user()['id'] ?? null]);
        return ['key' => $key, 'prefix' => $prefix];   // full key shown ONCE
    }
    public static function all(): array { return Database::all("SELECT id, name, key_prefix, permissions, last_used_at, created_by, revoked, created_at FROM api_keys ORDER BY created_at DESC"); }
    public static function verify(string $key): bool
    {
        $row = Database::one("SELECT id FROM api_keys WHERE key_hash=? AND revoked=0", [hash('sha256', $key)]);
        if (!$row) return false;
        Database::q("UPDATE api_keys SET last_used_at=NOW() WHERE id=?", [$row['id']]);
        return true;
    }
    public static function revoke(int $id): void { Database::q("UPDATE api_keys SET revoked=1 WHERE id=?", [$id]); }
}

/* ============================================================
   FEATURE FLAGS
   ============================================================ */
final class FeatureFlagModel
{
    public static function all(): array { return Database::all("SELECT * FROM feature_flags ORDER BY flag"); }
    public static function isOn(string $flag): bool
    {
        $r = Database::one("SELECT enabled FROM feature_flags WHERE flag=?", [$flag]);
        return $r ? (bool)$r['enabled'] : false;
    }
    public static function set(string $flag, bool $on): void
    {
        Database::q("INSERT INTO feature_flags (flag, enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE enabled=?", [$flag, $on ? 1 : 0, $on ? 1 : 0]);
    }
}

/* ============================================================
   KNOWLEDGE BASE
   ============================================================ */
final class KnowledgeModel
{
    public static function all(): array { return Database::all("SELECT * FROM knowledge_items ORDER BY created_at DESC"); }
    public static function create(array $d): int
    {
        Database::q("INSERT INTO knowledge_items (title, body, category, tags) VALUES (?,?,?,?)", [$d['title'], $d['body'] ?? '', $d['category'] ?? 'general', json_encode($d['tags'] ?? [])]);
        return (int)Database::pdo()->lastInsertId();
    }
    public static function update(int $id, array $d): void
    {
        Database::q("UPDATE knowledge_items SET title=?, body=?, category=?, tags=? WHERE id=?", [$d['title'], $d['body'] ?? '', $d['category'] ?? 'general', json_encode($d['tags'] ?? []), $id]);
    }
    public static function delete(int $id): void { Database::q("DELETE FROM knowledge_items WHERE id=?", [$id]); }
    public static function search(string $q): array
    {
        $like = '%' . $q . '%';
        return Database::all("SELECT id, title, body, category FROM knowledge_items WHERE title LIKE ? OR body LIKE ? OR category LIKE ? ORDER BY created_at DESC LIMIT 20", [$like, $like, $like]);
    }

    /** Upsert knowledge ingested from an external source (Drive/Notion) with attribution. */
    public static function upsertFromSource(string $sourceType, string $sourceId, string $title, string $body, array $meta = []): int
    {
        Database::q("INSERT INTO knowledge_items (title, body, category, tags, source_type, source_id, source_url, source_hash, source_modified)
                     VALUES (?,?,?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), category=VALUES(category),
                     tags=VALUES(tags), source_url=VALUES(source_url), source_hash=VALUES(source_hash),
                     source_modified=VALUES(source_modified)",
            [mb_substr($title, 0, 190), mb_substr($body, 0, 60000), (string)($meta['category'] ?? 'external'),
             json_encode(['source' => $meta['source'] ?? $sourceType]), $sourceType, mb_substr($sourceId, 0, 190),
             mb_substr((string)($meta['source_url'] ?? ''), 0, 600), mb_substr((string)($meta['hash'] ?? ''), 0, 64),
             mb_substr((string)($meta['modified'] ?? ''), 0, 40)]);
        $row = Database::one("SELECT id FROM knowledge_items WHERE source_type=? AND source_id=?", [$sourceType, $sourceId]);
        return $row ? (int)$row['id'] : 0;
    }

    public static function sources(): array
    {
        return Database::all("SELECT source_type, COUNT(*) n, MAX(created_at) last FROM knowledge_items WHERE source_type != 'manual' GROUP BY source_type");
    }
}

/* ============================================================
   SYSTEM ERRORS
   ============================================================ */
final class ErrorModel
{
    public static function log(string $level, string $source, string $message, array $context = []): void
    {
        try {
            Database::q("INSERT INTO system_errors (level, source, message, context) VALUES (?,?,?,?)", [$level, $source, mb_substr($message, 0, 2000), json_encode($context)]);
        } catch (Throwable $e) { /* never break the request */ }
    }
    public static function all(int $limit = 100): array { return Database::all("SELECT * FROM system_errors ORDER BY id DESC LIMIT $limit"); }
    public static function clear(): void { Database::q("DELETE FROM system_errors"); }
}

/* ============================================================
   EMAIL LOG
   ============================================================ */
final class EmailModel
{
    /** Render {variables} in a template string. */
    public static function render(string $text, array $vars = []): string
    {
        foreach ($vars as $k => $v) {
            $text = str_replace('{' . $k . '}', (string)$v, $text);
        }
        return $text;
    }

    /**
     * Queue + attempt delivery. When $template matches an enabled row in
     * email_templates, subject/body are rendered from it with $vars.
     * Delivery is best-effort via PHP mail() (Hostinger-compatible);
     * SMTP can be layered on without changing this contract.
     */
    public static function queue(string $template, string $recipient, string $subject, string $body, array $vars = []): int
    {
        $tpl = EmailTemplateModel::getBySlug($template);
        if ($tpl) {
            $subject = self::render($tpl['subject'], $vars);
            $body = self::render($tpl['body'], $vars);
        }
        Database::q("INSERT INTO email_log (template, recipient, subject, status) VALUES (?,?,?,'queued')", [$template, $recipient, $subject]);
        $id = (int)Database::pdo()->lastInsertId();
        // delivery: SMTP when configured (server-side credentials), else PHP mail()
        $ok = false;
        $err = '';
        try {
            $smtp = SiteConfig::get('smtp');
            if (!empty($smtp['host'])) {
                $client = SmtpClient::fromConfig($smtp + ['from' => $smtp['from'] ?: 'no-reply@abhijeetvarghese.com']);
                $r = $client->send($recipient, $subject, $body);
                $ok = $r['ok'];
                $err = $r['error'] ?? '';
            } else {
                $ok = @mail($recipient, $subject, $body, "From: AV OS <no-reply@abhijeetvarghese.com>\r\nContent-Type: text/plain; charset=UTF-8");
            }
        } catch (Throwable $e) {
            $ok = false;
            $err = $e->getMessage();
        }
        Database::q("UPDATE email_log SET status=?, sent_at=NOW(), error=? WHERE id=?", [$ok ? 'sent' : 'failed', mb_substr($err, 0, 480), $id]);
        return $id;
    }
    public static function all(int $limit = 100): array { return Database::all("SELECT * FROM email_log ORDER BY id DESC LIMIT $limit"); }
}

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */
final class SearchModel
{
    public static function search(string $q): array
    {
        $like = '%' . $q . '%';
        $out = ['pages' => [], 'projects' => [], 'articles' => [], 'clients' => [], 'leads' => [], 'media' => [], 'knowledge' => [], 'contacts' => [], 'companies' => []];
        $doc = ContentStore::all();
        foreach (($doc['pages'] ?? []) as $p) {
            if (stripos($p['title'] ?? '', $q) !== false || stripos($p['slug'] ?? '', $q) !== false) $out['pages'][] = ['id' => $p['id'] ?? '', 'title' => $p['title'] ?? '', 'slug' => $p['slug'] ?? ''];
        }
        foreach (($doc['projects'] ?? []) as $p) {
            if (stripos($p['title'] ?? '', $q) !== false || stripos($p['client'] ?? '', $q) !== false) $out['projects'][] = ['id' => $p['id'] ?? '', 'title' => $p['title'] ?? '', 'client' => $p['client'] ?? ''];
        }
        foreach (($doc['articles'] ?? []) as $a) {
            if (stripos($a['title'] ?? '', $q) !== false || stripos($a['excerpt'] ?? '', $q) !== false) $out['articles'][] = ['id' => $a['id'] ?? '', 'title' => $a['title'] ?? ''];
        }
        foreach (($doc['clients'] ?? []) as $c) {
            if (stripos($c['name'] ?? '', $q) !== false) $out['clients'][] = ['id' => $c['id'] ?? '', 'name' => $c['name'] ?? ''];
        }
        foreach (LeadModel::all() as $l) {
            if (stripos($l['name'] ?? '', $q) !== false || stripos($l['company'] ?? '', $q) !== false || stripos($l['email'] ?? '', $q) !== false) $out['leads'][] = ['id' => $l['id'], 'name' => $l['name'] ?? '', 'company' => $l['company'] ?? ''];
        }
        foreach (MediaModel::all() as $m) {
            if (stripos($m['original_name'] ?? '', $q) !== false || stripos($m['alt_text'] ?? '', $q) !== false) $out['media'][] = ['id' => $m['id'], 'name' => $m['original_name'] ?? ''];
        }
        foreach (KnowledgeModel::search($q) as $k) $out['knowledge'][] = $k;
        foreach (CrmModel::contacts() as $c) {
            if (stripos($c['name'] ?? '', $q) !== false || stripos($c['email'] ?? '', $q) !== false) $out['contacts'][] = ['id' => $c['id'], 'name' => $c['name'] ?? ''];
        }
        foreach (CrmModel::companies() as $c) {
            if (stripos($c['name'] ?? '', $q) !== false) $out['companies'][] = ['id' => $c['id'], 'name' => $c['name'] ?? ''];
        }
        return $out;
    }
}

/* ============================================================
   EMAIL TEMPLATES (server-side, CMS-editable)
   ============================================================ */
final class EmailTemplateModel
{
    public static function all(): array
    {
        return Database::all("SELECT id, slug, name, subject, body, enabled, updated_at FROM email_templates ORDER BY name");
    }

    public static function getBySlug(string $slug): ?array
    {
        return Database::one("SELECT * FROM email_templates WHERE slug=? AND enabled=1", [$slug]);
    }

    public static function save(int $id, array $d): void
    {
        Database::q("UPDATE email_templates SET name=?, subject=?, body=?, enabled=? WHERE id=?",
            [$d['name'] ?? '', $d['subject'] ?? '', $d['body'] ?? '', (int)($d['enabled'] ?? 1), $id]);
    }

    public static function setEnabled(int $id, bool $on): void
    {
        Database::q("UPDATE email_templates SET enabled=? WHERE id=?", [(int)$on, $id]);
    }
}

/* ============================================================
   CAMPAIGN MANAGER (attribution + reporting)
   ============================================================ */
final class CampaignModel
{
    public static function all(): array
    {
        return Database::all("SELECT c.*,
            (SELECT COUNT(*) FROM leads l WHERE l.utm_campaign=c.utm_campaign) lead_count,
            (SELECT COUNT(*) FROM analytics_events e WHERE e.utm_campaign=c.utm_campaign AND e.event_type='page_view') visitor_count
            FROM campaigns c ORDER BY c.created_at DESC");
    }

    public static function create(array $d): int
    {
        Database::q("INSERT INTO campaigns (name, utm_source, utm_medium, utm_campaign, status, budget, description, start_date, end_date)
                     VALUES (?,?,?,?,?,?,?,?,?)",
            [$d['name'], $d['utm_source'] ?? '', $d['utm_medium'] ?? '', $d['utm_campaign'] ?? '',
             $d['status'] ?? 'active', (float)($d['budget'] ?? 0), $d['description'] ?? '',
             $d['start_date'] ?: null, $d['end_date'] ?: null]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function update(int $id, array $d): void
    {
        Database::q("UPDATE campaigns SET name=?, utm_source=?, utm_medium=?, utm_campaign=?, status=?, budget=?, description=?, start_date=?, end_date=? WHERE id=?",
            [$d['name'] ?? '', $d['utm_source'] ?? '', $d['utm_medium'] ?? '', $d['utm_campaign'] ?? '',
             $d['status'] ?? 'active', (float)($d['budget'] ?? 0), $d['description'] ?? '',
             $d['start_date'] ?: null, $d['end_date'] ?: null, $id]);
    }

    public static function delete(int $id): void
    {
        Database::q("DELETE FROM campaigns WHERE id=?", [$id]);
    }
}

/* ============================================================
   CONTENT HEALTH (checks run against real stored content)
   ============================================================ */
final class HealthModel
{
    /** Automated content-health audit over content_store + media + versions. */
    public static function contentHealth(): array
    {
        $doc = ContentStore::all();
        $issues = [];
        $collections = [
            'pages' => ['Pages', ($doc['pages'] ?? []), 'title'],
            'projects' => ['Projects', ($doc['projects'] ?? []), 'title'],
            'articles' => ['Journal', ($doc['articles'] ?? []), 'title'],
        ];

        $missingTitle = []; $missingDesc = []; $dupTitles = []; $thin = [];
        $seen = [];
        foreach ($collections as $key => [$label, $items, $titleField]) {
            foreach ($items as $it) {
                $name = $it[$titleField] ?? '(untitled)';
                $seo = $it['seo'] ?? [];
                if (empty($seo['title'])) $missingTitle[] = "$label · $name";
                if (empty($seo['desc'])) $missingDesc[] = "$label · $name";
                $t = strtolower(trim($name));
                if ($t !== '') {
                    $seen[$key][$t] = ($seen[$key][$t] ?? 0) + 1;
                }
                $bodyLen = 0;
                foreach (($it['blocks'] ?? []) as $b) {
                    $c = $b['content'] ?? [];
                    $bodyLen += strlen(strip_tags((string)($c['lede'] ?? ''))) + strlen(strip_tags((string)($c['body'] ?? '')));
                    foreach (($c['paragraphs'] ?? []) as $p) $bodyLen += strlen(strip_tags((string)$p));
                }
                $bodyLen += strlen(strip_tags((string)($it['excerpt'] ?? ''))) + strlen(strip_tags((string)($it['body'] ?? '')));
                if ($key === 'pages' && count($it['blocks'] ?? []) < 2) $thin[] = "$label · $name (only " . count($it['blocks'] ?? []) . " block)";
                if ($key !== 'pages' && $bodyLen < 200) $thin[] = "$label · $name (thin body)";
            }
        }
        foreach ($seen as $key => $counts) {
            foreach ($counts as $t => $n) {
                if ($n > 1) $dupTitles[] = $collections[$key][0] . " · “" . ucfirst($t) . "” ×{$n}";
            }
        }

        $noAlt = [];
        foreach (MediaModel::all() as $m) {
            if (trim((string)($m['alt_text'] ?? '')) === '' && ($m['type'] ?? '') !== 'svg') $noAlt[] = $m['original_name'] ?? "media#{$m['id']}";
        }

        $stale = [];
        $keysMap = ['pages' => 'Pages', 'projects' => 'Projects', 'articles' => 'Journal'];
        foreach ($keysMap as $key => $label) {
            $v = Database::one("SELECT MAX(created_at) m FROM versions WHERE entity='store' AND entity_id=?", [$key]);
            if ($v && $v['m'] && strtotime($v['m']) < time() - 365 * 86400) $stale[] = "$label (no update in over a year)";
        }
        if (empty(($doc['settings']['ogImage'] ?? ''))) $issues[] = ['key' => 'missing_og', 'label' => 'No global Open Graph image set', 'count' => 1, 'items' => ['settings.ogImage is empty — social shares will fall back to a placeholder']];

        $checks = [
            ['key' => 'missing_seo_title', 'label' => 'Missing SEO title', 'items' => $missingTitle],
            ['key' => 'missing_meta_desc', 'label' => 'Missing meta description', 'items' => $missingDesc],
            ['key' => 'duplicate_titles', 'label' => 'Duplicate titles', 'items' => $dupTitles],
            ['key' => 'thin_content', 'label' => 'Thin content', 'items' => $thin],
            ['key' => 'media_no_alt', 'label' => 'Media missing alt text', 'items' => array_slice($noAlt, 0, 50)],
            ['key' => 'stale_content', 'label' => 'Stale content (>1 year)', 'items' => $stale],
        ];
        $total = 0;
        foreach ($checks as $c) { $total += count($c['items']); }
        $score = max(0, 100 - $total * 4);
        return ['score' => $score, 'total_issues' => $total, 'checks' => $checks, 'generated_at' => date('c')];
    }
}

/* ============================================================
   AI USAGE (real data from ai_requests)
   ============================================================ */
final class AiUsageModel
{
    public static function usage(int $days = 30): array
    {
        $since = date('Y-m-d H:i:s', time() - $days * 86400);
        $total = (int)(Database::one("SELECT COUNT(*) n FROM ai_requests WHERE created_at >= ?", [$since])['n']);
        $ok = (int)(Database::one("SELECT COUNT(*) n FROM ai_requests WHERE created_at >= ? AND ok=1", [$since])['n']);
        $tokensIn = (int)(Database::one("SELECT COALESCE(SUM(tokens_in),0) n FROM ai_requests WHERE created_at >= ?", [$since])['n']);
        $tokensOut = (int)(Database::one("SELECT COALESCE(SUM(tokens_out),0) n FROM ai_requests WHERE created_at >= ?", [$since])['n']);
        $byDay = Database::all("SELECT DATE(created_at) day, COUNT(*) n FROM ai_requests WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day", [$since]);
        $byProvider = Database::all("SELECT COALESCE(provider,'?') provider, COUNT(*) n FROM ai_requests WHERE created_at >= ? GROUP BY provider ORDER BY n DESC", [$since]);
        $byAction = Database::all("SELECT COALESCE(action,'?') action, COUNT(*) n FROM ai_requests WHERE created_at >= ? GROUP BY action ORDER BY n DESC LIMIT 12", [$since]);
        return ['days' => $days, 'total_calls' => $total, 'ok_calls' => $ok, 'failed_calls' => $total - $ok,
                'tokens_in' => $tokensIn, 'tokens_out' => $tokensOut, 'by_day' => $byDay, 'by_provider' => $byProvider, 'by_action' => $byAction];
    }
}

/* ============================================================
   DEPLOYMENT HISTORY + ROLLBACK
   ============================================================ */
final class DeploymentModel
{
    private const SNAPSHOT_DIR = 'deployments';
    private const KEEP = 3; // live + 2 previous snapshots

    public static function snapshotsDir(): string
    {
        $dir = AV_STORAGE . '/' . self::SNAPSHOT_DIR;
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        return $dir;
    }

    /** Copy a site directory into a snapshot (excludes nothing; media is small). */
    public static function storeSnapshot(string $srcDir): string
    {
        $dest = self::snapshotsDir() . '/site-' . bin2hex(random_bytes(6));
        @mkdir($dest, 0775, true);
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($srcDir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if ($f->isDir()) { @mkdir($dest . '/' . substr($f->getPathname(), strlen($srcDir)), 0775, true); continue; }
            $rel = substr($f->getPathname(), strlen($srcDir));
            @copy($f->getPathname(), $dest . '/' . $rel);
        }
        return $dest;
    }

    /** Record a publish. Marks previous live rows superseded. Caps snapshots. */
    public static function record(?int $userId, string $note, ?string $siteSnapshot): int
    {
        Database::q("UPDATE deployments SET status='superseded' WHERE status='live'");
        $content = json_encode(ContentStore::all(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        Database::q("INSERT INTO deployments (version, status, created_by, note, site_snapshot, content_snapshot)
                     VALUES (?, 'live', ?, ?, ?, ?)",
            [substr(hash('sha256', random_bytes(16)), 0, 12), $userId, $note, $siteSnapshot ?? '', $content]);
        $id = (int)Database::pdo()->lastInsertId();
        self::prune();
        return $id;
    }

    public static function markRolledBack(int $id): void
    {
        Database::q("UPDATE deployments SET status='rolled_back' WHERE id=?", [$id]);
    }

    public static function all(int $limit = 20): array
    {
        return Database::all("SELECT d.*, u.name user_name FROM deployments d LEFT JOIN users u ON u.id=d.created_by ORDER BY d.id DESC LIMIT $limit");
    }

    public static function live(): ?array
    {
        return Database::one("SELECT * FROM deployments WHERE status='live' ORDER BY id DESC LIMIT 1");
    }

    /** Keep at most KEEP snapshots on disk (oldest removed). */
    private static function prune(): void
    {
        $dirs = glob(self::snapshotsDir() . '/site-*') ?: [];
        rsort($dirs); // newest first (random names — use mtime instead)
        usort($dirs, fn($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($dirs, self::KEEP) as $d) {
            self::rmDir($d);
        }
    }

    public static function rmDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($it as $f) {
            $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
        }
        @rmdir($dir);
    }

    /**
     * Roll back to the previous live deployment: restores the previous site
     * snapshot (atomic swap), restores the content snapshot (each key becomes
     * a new version), audits + notifies. Returns the restored deployment.
     */
    public static function rollback(?int $userId): array
    {
        $cur = self::live();
        if (!$cur) throw new RuntimeException('No live deployment to roll back from');
        $prev = Database::one("SELECT * FROM deployments WHERE status='superseded' AND site_snapshot != '' AND id < ? ORDER BY id DESC LIMIT 1", [$cur['id']]);
        if (!$prev) throw new RuntimeException('No previous deployment available');
        if ($prev['site_snapshot'] === '' || !is_dir($prev['site_snapshot'])) {
            throw new RuntimeException('Previous site snapshot is missing on disk');
        }

        $out = AV_SITE_OUT;
        $tmp = AV_CACHE . '/site-rollback-tmp-' . bin2hex(random_bytes(4));
        // atomic-ish swap: current → tmp, snapshot → live, snapshot displaced
        // current (so the rollback itself is reversible), drop tmp
        if (is_dir($out)) rename($out, $tmp);
        if (!rename($prev['site_snapshot'], $out)) {
            if (is_dir($tmp)) rename($tmp, $out);
            throw new RuntimeException('Rollback swap failed');
        }
        $displacedSnapshot = is_dir($tmp) ? self::storeSnapshot($tmp) : null;
        if (is_dir($tmp)) self::rmDir($tmp);

        // restore content (each key gets a fresh version — history is preserved)
        $snap = json_decode((string)$prev['content_snapshot'], true) ?: [];
        foreach ($snap as $key => $value) {
            ContentStore::put($key, is_array($value) ? $value : [], $userId, "rollback to deployment #{$prev['id']}");
        }

        self::markRolledBack((int)$cur['id']);
        // the previous deployment is now live again; its snapshot was consumed;
        // the displaced current site is snapshotted into the new deployment row
        $newId = self::record($userId, "Rollback to deployment #{$prev['id']}", $displacedSnapshot);
        Database::q("UPDATE deployments SET note=? WHERE id=?", ["Rollback to deployment #{$prev['id']}", $newId]);
        Audit::log($userId, 'publish_rollback', 'site', (string)$prev['id'], ['deployment' => (int)$cur['id']]);
        NotificationModel::push('Rollback complete', "Restored deployment #{$prev['id']} (" . substr($prev['version'], 0, 8) . ")", 'publish');
        return ['restored_deployment' => (int)$prev['id'], 'new_deployment' => $newId, 'content_keys' => count($snap)];
    }
}

/* ============================================================
   SOFT DELETE (trash / restore / permanent) — business data is
   never destroyed by normal CMS actions. Allowlisted tables only.
   ============================================================ */
final class TrashModel
{
    private const TABLES = [
        'leads' => 'leads', 'contacts' => 'contacts', 'companies' => 'companies',
        'opportunities' => 'opportunities', 'meetings' => 'meetings', 'tasks' => 'tasks',
        'proposals' => 'proposals', 'projects' => 'projects', 'media' => 'media',
    ];

    public static function isAllowed(string $table): bool
    {
        return isset(self::TABLES[$table]);
    }

    /** Soft delete: sets deleted_at, row hidden from all default queries. */
    public static function trash(string $table, int $id): bool
    {
        if (!self::isAllowed($table)) return false;
        $st = Database::q("UPDATE `$table` SET deleted_at=NOW(), updated_at=NOW() WHERE id=? AND deleted_at IS NULL", [$id]);
        return $st->rowCount() > 0;
    }

    public static function restore(string $table, int $id): bool
    {
        if (!self::isAllowed($table)) return false;
        $st = Database::q("UPDATE `$table` SET deleted_at=NULL, updated_at=NOW() WHERE id=? AND deleted_at IS NOT NULL", [$id]);
        return $st->rowCount() > 0;
    }

    /** Authorized permanent deletion. Caller is responsible for guards (e.g. media usage). */
    public static function permanent(string $table, int $id): bool
    {
        if (!self::isAllowed($table)) return false;
        $st = Database::q("DELETE FROM `$table` WHERE id=?", [$id]);
        return $st->rowCount() > 0;
    }

    public static function trashedCount(string $table): int
    {
        if (!self::isAllowed($table)) return 0;
        return (int)Database::one("SELECT COUNT(*) n FROM `$table` WHERE deleted_at IS NOT NULL")['n'];
    }
}

/* ============================================================
   INBOUND WEBHOOKS — Calendly ingestion (spec §12)
   Signed payloads (Calendly-Webhook-Signature), timestamp
   tolerance, event-ID idempotency, mapping into CRM.
   ============================================================ */
final class InboundWebhookModel
{
    private const SOURCE = 'calendly';
    private const TOLERANCE = 300; // seconds — Calendly docs recommend 180; 300 tolerates retries

    /* ---------- signing key (encrypted at rest) ---------- */
    public static function calendlyKey(): string
    {
        $row = Database::one("SELECT config_enc FROM integrations WHERE code='calendly'");
        if (!$row || empty($row['config_enc'])) return '';
        // versioned envelope (v3 AES-GCM now; v2 CBC still readable) via the hub
        $cfg = IntegrationHub::open((string)$row['config_enc']);
        return (string)($cfg['signing_key'] ?? '');
    }

    public static function saveCalendlyKey(string $key): void
    {
        // shared secret envelope (IntegrationHub v2) — status 'configured' until a
        // real inbound event verifies the key (honesty rule: never claim CONNECTED blindly)
        $outer = IntegrationHub::seal(['signing_key' => $key]);
        Database::q("INSERT INTO integrations (code, label, config_enc, status, authentication_type, category, capabilities, free_tier)
                     VALUES ('calendly','Calendly',?,'configured','api_key','business',JSON_OBJECT('webhook','inbound bookings'),'free')
                     ON DUPLICATE KEY UPDATE config_enc=VALUES(config_enc),
                     status=CASE WHEN status='connected' THEN 'configured' ELSE status END,
                     authentication_type='api_key', category='business',
                     capabilities=JSON_OBJECT('webhook','inbound bookings'), free_tier='free',
                     enabled=1, updated_at=NOW()", [$outer]);
    }

    /* ---------- ledger ---------- */
    public static function events(int $limit = 50): array
    {
        return Database::all("SELECT * FROM inbound_events ORDER BY id DESC LIMIT " . min(200, max(1, $limit)));
    }

    /* ---------- processing ---------- */
    public static function processCalendly(string $rawBody, ?string $header): array
    {
        $key = self::calendlyKey();
        if ($key === '') {
            return ['ok' => false, 'error' => 'Calendly signing key not configured', 'code' => 503];
        }
        // 1) signature + timestamp verification
        if ($header === null || !preg_match('/t=(\d+),v1=([a-f0-9]{64})/', $header, $m)) {
            self::log('', 'invalid', '', 'missing/malformed signature header');
            return ['ok' => false, 'error' => 'Invalid signature header', 'code' => 401];
        }
        $ts = (int)$m[1];
        $sig = $m[2];
        if (abs(time() - $ts) > self::TOLERANCE) {
            self::log('', 'invalid', '', "timestamp outside tolerance (t=$ts)");
            return ['ok' => false, 'error' => 'Timestamp outside tolerance', 'code' => 401];
        }
        $expected = hash_hmac('sha256', $ts . '.' . $rawBody, $key);
        if (!hash_equals($expected, $sig)) {
            self::log('', 'invalid', '', 'signature mismatch');
            return ['ok' => false, 'error' => 'Signature mismatch', 'code' => 401];
        }
        // 2) parse + idempotency key
        $payload = json_decode($rawBody, true);
        if (!is_array($payload) || empty($payload['event'])) {
            self::log('', 'invalid', '', 'unparseable payload');
            return ['ok' => false, 'error' => 'Invalid payload', 'code' => 422];
        }
        $event = $payload['event'];
        $inv = $payload['payload']['invitee'] ?? [];
        $eventId = $event . ':' . ($inv['uuid'] ?? hash('sha256', $rawBody));
        // 3) ledger insert (unique key = idempotency barrier)
        $st = Database::q("INSERT IGNORE INTO inbound_events (source, event_id, event_type, payload, status)
                     VALUES (?,?,?,?,'received')", [self::SOURCE, $eventId, $event, mb_substr($rawBody, 0, 60000)]);
        if ($st->rowCount() === 0) {
            // existing event: processed/duplicate → skip (idempotent); failed → retry (bounded by the ledger)
            $prev = Database::one("SELECT status FROM inbound_events WHERE source=? AND event_id=?", [self::SOURCE, $eventId]);
            if ($prev && $prev['status'] === 'failed') {
                Database::q("UPDATE inbound_events SET status='received', error='' WHERE source=? AND event_id=?", [self::SOURCE, $eventId]);
            } else {
                Database::q("UPDATE inbound_events SET status='duplicate' WHERE source=? AND event_id=?", [self::SOURCE, $eventId]);
                // echo the existing side effects (idempotent response) so retries are safe for callers
                $dup = ['ok' => true, 'event' => $event, 'status' => 'duplicate'];
                if ($event === 'invitee.created' && !empty($inv['uuid'])) {
                    $m = Database::one("SELECT id, lead_id FROM meetings WHERE external_event_id=? AND deleted_at IS NULL", [$inv['uuid']]);
                    if ($m) { $dup['meeting_id'] = (int)$m['id']; $dup['lead_id'] = (int)$m['lead_id']; }
                }
                return $dup;   // dedup — no side effects
            }
        }
        // 4) map into CRM
        try {
            $result = match ($event) {
                'invitee.created' => self::handleCreated($payload),
                'invitee.canceled' => self::handleCanceled($payload),
                default => ['note' => "unhandled event type: $event"],
            };
        } catch (Throwable $e) {
            Database::q("UPDATE inbound_events SET status='failed', error=?, processed_at=NOW() WHERE source=? AND event_id=?", [mb_substr($e->getMessage(), 0, 480), self::SOURCE, $eventId]);
            ErrorModel::log('error', 'inbound_calendly', $e->getMessage(), ['event_id' => $eventId]);
            return ['ok' => false, 'error' => 'Processing failed', 'code' => 500];
        }
        Database::q("UPDATE inbound_events SET status='processed', processed_at=NOW() WHERE source=? AND event_id=?", [self::SOURCE, $eventId]);
        Audit::log(null, 'inbound_webhook', 'calendly', $eventId, ['event' => $event]);
        return ['ok' => true, 'event' => $event, 'status' => 'processed'] + $result;
    }

    private static function handleCreated(array $payload): array
    {
        $inv = $payload['payload']['invitee'] ?? [];
        $evt = $payload['payload']['event_type'] ?? [];
        $sched = $inv['scheduled_event'] ?? [];
        $email = filter_var($inv['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: '';
        $name = trim((string)($inv['name'] ?? 'Calendly invitee'));
        $start = $sched['start_time'] ?? null;
        $end = $sched['end_time'] ?? null;
        $eventName = $evt['name'] ?? $sched['name'] ?? 'Intro call';
        $extId = (string)($inv['uuid'] ?? '');
        $notes = trim(($sched['location'] ?? '') . ' ' . ($inv['cancel_url'] ?? ''));
        $duration = 30;
        if ($start && $end) $duration = max(15, (int)((strtotime($end) - strtotime($start)) / 60));
        return self::upsertBooking($eventName, $start, $extId, $notes, $name, $email, $duration, $inv['text_reminder_number'] ?? '');
    }

    /**
     * Shared Calendly booking → CRM path (webhook AND API sync).
     * Idempotent by external event id; never duplicates leads/meetings.
     */
    public static function upsertBooking(string $eventName, ?string $start, string $extId, string $notes,
                                         string $name = 'Calendly invitee', string $email = '',
                                         int $duration = 30, string $phone = ''): array
    {
        $email = filter_var($email, FILTER_VALIDATE_EMAIL) ?: '';
        // lead: find by email, else create (never duplicate)
        $lead = $email !== '' ? LeadModel::findRecentByEmail($email, 24 * 365) : null;
        if (!$lead) {
            $lid = LeadModel::create([
                'name' => $name, 'company' => '', 'email' => $email, 'phone' => $phone,
                'lead_type' => mb_substr($eventName, 0, 60), 'message' => 'Booked via Calendly', 'source' => 'calendly',
                'status' => 'contacted', 'score' => CrmModel::scoreLead(['lead_type' => $eventName, 'source' => 'calendly', 'score' => 50]),
            ]);
            CrmModel::addActivity('lead', $lid, 'created', 'Lead created from Calendly booking');
            $leadId = $lid;
        } else {
            $leadId = (int)$lead['id'];
        }
        CrmModel::addActivity('lead', $leadId, 'meeting_scheduled', "Calendly booking: {$eventName}");

        // meeting: upsert by external event id (invitee uuid)
        $existing = $extId !== '' ? Database::one("SELECT id FROM meetings WHERE external_event_id=? AND deleted_at IS NULL", [$extId]) : null;
        if ($existing) {
            Database::q("UPDATE meetings SET subject=?, scheduled_at=?, duration_min=?, status='confirmed', notes=? WHERE id=?",
                [$eventName, $start ? date('Y-m-d H:i:s', strtotime($start)) : null, $duration, $notes, (int)$existing['id']]);
            $mid = (int)$existing['id'];
        } else {
            Database::q("INSERT INTO meetings (lead_id, subject, scheduled_at, duration_min, type, status, notes, external_event_id)
                         VALUES (?,?,?,?,'video','confirmed',?,?)",
                [$leadId, $eventName, $start ? date('Y-m-d H:i:s', strtotime($start)) : null, $duration, $notes, $extId]);
            $mid = (int)Database::pdo()->lastInsertId();
        }
        NotificationModel::push('Meeting booked via Calendly', "{$name} · {$eventName} · " . ($start ? date('d M H:i', strtotime($start)) : '?'), 'lead');
        return ['lead_id' => $leadId, 'meeting_id' => $mid];
    }

    private static function handleCanceled(array $payload): array
    {
        $inv = $payload['payload']['invitee'] ?? [];
        $extId = (string)($inv['uuid'] ?? '');
        $mid = 0;
        if ($extId !== '') {
            $m = Database::one("SELECT id, lead_id FROM meetings WHERE external_event_id=? AND deleted_at IS NULL", [$extId]);
            if ($m) {
                $mid = (int)$m['id'];
                Database::q("UPDATE meetings SET status='cancelled', updated_at=NOW() WHERE id=?", [$mid]);
                if (!empty($m['lead_id'])) CrmModel::addActivity('lead', (int)$m['lead_id'], 'meeting_cancelled', 'Calendly booking cancelled');
                NotificationModel::push('Meeting cancelled', (string)($inv['name'] ?? 'Invitee') . ' cancelled their booking', 'lead');
            }
        }
        return ['meeting_id' => $mid];
    }

    private static function log(string $eventId, string $status, string $type, string $error): void
    {
        try {
            Database::q("INSERT INTO inbound_events (source, event_id, event_type, status, error) VALUES (?,?,?,?,?)",
                [self::SOURCE, $eventId !== '' ? $eventId : 'invalid-' . bin2hex(random_bytes(6)), $type, $status, mb_substr($error, 0, 480)]);
        } catch (Throwable $e) { /* ledger must never crash the request */ }
    }
}

/* ============================================================
   SITE CONFIG — server-side settings (SMTP etc.), encrypted at
   rest in site_settings, never serialized to the browser.
   ============================================================ */
final class SiteConfig
{
    public static function get(string $key): array
    {
        $row = Database::one("SELECT svalue FROM site_settings WHERE skey=?", [$key]);
        if (!$row || $row['svalue'] === '') return [];
        $outer = json_decode((string)$row['svalue'], true) ?: [];
        if (isset($outer['enc'])) {
            return json_decode(AiService::decrypt((string)$outer['enc']), true) ?: [];
        }
        return $outer; // legacy plain JSON (non-secret keys)
    }

    public static function save(string $key, array $value): void
    {
        $enc = json_encode(['enc' => AiService::encrypt(json_encode($value, JSON_UNESCAPED_SLASHES))], JSON_UNESCAPED_SLASHES);
        Database::q("INSERT INTO site_settings (skey, svalue) VALUES (?,?) ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)", [$key, $enc]);
    }

    /** Exposed view — never includes secrets. */
    public static function safe(string $key): array
    {
        $cfg = self::get($key);
        $out = [];
        foreach ($cfg as $k => $v) {
            if (in_array($k, ['password', 'secret', 'api_key', 'token'], true)) { $out[$k] = ''; continue; }
            $out[$k] = $v;
        }
        $out['has_password'] = !empty($cfg['password']);
        return $out;
    }
}

/* ============================================================
   LOCKING (flock-based — no Redis, Hostinger-safe)
   ============================================================ */
final class Lock
{
    /** @return resource|null lock handle; null when already held */
    public static function acquire(string $name, bool $blocking = false)
    {
        $dir = AV_STORAGE . '/locks';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $h = @fopen($dir . '/' . $name . '.lock', 'c');
        if (!$h) return null;
        if (!flock($h, $blocking ? LOCK_EX : LOCK_EX | LOCK_NB)) {
            fclose($h);
            return null;
        }
        return $h;
    }

    public static function release($h): void
    {
        if (is_resource($h)) { flock($h, LOCK_UN); fclose($h); }
    }
}

/* ============================================================
   PUBLISH SETTINGS (retention, toggles — server-side)
   ============================================================ */
final class PublishSettings
{
    public static function get(): array
    {
        $row = Database::one("SELECT svalue FROM site_settings WHERE skey='publish'");
        $d = $row ? (json_decode((string)$row['svalue'], true) ?: []) : [];
        return [
            'retention' => max(2, min(50, (int)($d['retention'] ?? 10))),
            'db_backups' => max(1, min(30, (int)($d['db_backups'] ?? 5))),
        ];
    }

    public static function save(array $d): void
    {
        $cur = self::get();
        if (isset($d['retention'])) $cur['retention'] = max(2, min(50, (int)$d['retention']));
        if (isset($d['db_backups'])) $cur['db_backups'] = max(1, min(30, (int)$d['db_backups']));
        Database::q("INSERT INTO site_settings (skey, svalue) VALUES ('publish',?)
                     ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)", [json_encode($cur)]);
    }
}

/* ============================================================
   PUBLISH QUEUE (debounce/coalescing + visibility)
   ============================================================ */
final class PublishQueue
{
    /** Enqueue a publish job — coalesces: one queued job per type. */
    public static function enqueue(string $type = 'publish', ?int $userId = null, string $trigger = 'cms_save', string $note = ''): int
    {
        $row = Database::one("SELECT id FROM publish_queue WHERE type=? AND status='queued' ORDER BY id LIMIT 1", [$type]);
        if ($row) {
            Database::q("UPDATE publish_queue SET requested_by=?, trigger_name=?, note=?, created_at=NOW() WHERE id=?", [$userId, $trigger, $note, (int)$row['id']]);
            return (int)$row['id'];
        }
        Database::q("INSERT INTO publish_queue (type, status, requested_by, trigger_name, note) VALUES (?,'queued',?,?,?)",
            [$type, $userId, $trigger, $note]);
        return (int)Database::pdo()->lastInsertId();
    }

    public static function markProcessing(int $id): void
    {
        Database::q("UPDATE publish_queue SET status='processing', started_at=NOW() WHERE id=?", [$id]);
    }

    public static function complete(int $id, string $note = ''): void
    {
        Database::q("UPDATE publish_queue SET status='completed', completed_at=NOW(), note=? WHERE id=?", [$note, $id]);
    }

    public static function fail(int $id, string $error): void
    {
        Database::q("UPDATE publish_queue SET status='failed', completed_at=NOW(), error=? WHERE id=?", [mb_substr($error, 0, 480), $id]);
    }

    /** Take the oldest queued job and mark it processing (single consumer). */
    public static function take(string $type = 'publish'): ?array
    {
        $row = Database::one("SELECT id FROM publish_queue WHERE type=? AND status='queued' ORDER BY id LIMIT 1", [$type]);
        if (!$row) return null;
        $st = Database::q("UPDATE publish_queue SET status='processing', started_at=NOW() WHERE id=? AND status='queued'", [(int)$row['id']]);
        if ($st->rowCount() === 0) return null;   // another process took it
        return Database::one("SELECT * FROM publish_queue WHERE id=?", [(int)$row['id']]);
    }

    /** Failed jobs older than 5 min may be retried by the next cycle. */
    public static function requeueStale(): void
    {
        Database::q("UPDATE publish_queue SET status='queued', error='' WHERE status='failed' AND completed_at < NOW() - INTERVAL 5 MINUTE");
    }

    public static function status(): array
    {
        $q = Database::one("SELECT status, created_at, started_at, completed_at, error, trigger_name FROM publish_queue WHERE type='publish' ORDER BY id DESC LIMIT 1");
        $history = Database::all("SELECT id, status, trigger_name, note, error, created_at, started_at, completed_at FROM publish_queue ORDER BY id DESC LIMIT 20");
        return ['current' => $q, 'history' => $history];
    }

    private const DEBOUNCE_SECONDS = 2;

    /**
     * Drain all queued jobs of a type by running one publish (coalescing).
     * Rapid saves within the debounce window coalesce into one job: the first
     * save publishes immediately, subsequent saves within ~2s just refresh
     * the queued job, and the watcher/cron (or the next save after the
     * window) performs the actual build. Publish is always atomic + locked.
     *
     * $manual = true (admin "Publish" button): bypasses the debounce and
     * waits for the publish lock so a manual publish always completes
     * synchronously.
     */
    public static function drainAndPublish(?int $userId = null, string $trigger = 'cms_save', bool $manual = false): array
    {
        if (!$manual) {
            // debounce: if a publish completed within the window, keep the job queued.
            // Compared in SQL (MySQL NOW()) to avoid PHP/MySQL timezone drift.
            $lastDone = Database::one(
                "SELECT id FROM publish_queue WHERE type='publish' AND status='completed'
                 AND completed_at > NOW() - INTERVAL ? SECOND ORDER BY id DESC LIMIT 1",
                [self::DEBOUNCE_SECONDS]
            );
            if ($lastDone) {
                return ['ran' => false, 'reason' => 'debounce window', 'queued' => true];
            }
        }
        $job = self::take('publish');
        if (!$job) return ['ran' => false, 'reason' => 'nothing queued'];
        $lock = Lock::acquire('publish', $manual);
        if (!$lock) {
            // another publish is running — requeue our job and return
            Database::q("UPDATE publish_queue SET status='queued' WHERE id=?", [(int)$job['id']]);
            return ['ran' => false, 'reason' => 'publish already in progress'];
        }
        try {
            // collapse any other queued jobs created while we were waiting
            Database::q("DELETE FROM publish_queue WHERE type='publish' AND status='queued' AND id != ?", [(int)$job['id']]);
            $engine = new PublishEngine(ContentStore::all());
            $r = $engine->publish();
            self::complete((int)$job['id'], "{$r['pages']} pages, {$r['articles']} articles");
            return ['ran' => true, 'pages' => $r['pages'], 'articles' => $r['articles'], 'job_id' => (int)$job['id']];
        } catch (Throwable $e) {
            self::fail((int)$job['id'], $e->getMessage());
            try { ErrorModel::log('error', 'publish', $e->getMessage(), ['job' => (int)$job['id'], 'request_id' => defined('AV_REQUEST_ID') ? AV_REQUEST_ID : '']); } catch (Throwable $x) {}
            return ['ran' => false, 'error' => $e->getMessage()];
        } finally {
            Lock::release($lock);
        }
    }
}
