<?php
/**
 * AV OS — AGENT RUNNER (Hostinger cron, 24/7 autonomous system).
 *
 *   * * * * * php /path/to/backend/scripts/agent-runner.php >> /path/to/storage/logs/agent-runner.log 2>&1
 *
 * Pipeline per run (lightweight, exits fast):
 *   1. flock (no concurrent runs)
 *   2. global kill-switch check (PAUSE ALL AI)
 *   3. seed the agent registry if empty
 *   4. find due agents → enqueue jobs (coalesced)
 *   5. claim + execute up to max_jobs_per_run with heartbeats
 *   6. record results/memory/cost · audit · exit
 */
error_reporting(E_ALL);
$root = dirname(__DIR__, 2);
$lock = fopen(sys_get_temp_dir() . '/avos-agent-runner.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(3); // another run in progress
}
try {
    require $root . '/includes/bootstrap.php';
} catch (Throwable $e) {
    fwrite(STDERR, '[agent-runner] bootstrap failed: ' . $e->getMessage() . "\n");
    exit(1);
}

$started = microtime(true);
$done = [];

try {
    // kill switch
    if (AgentSettings::isGloballyPaused()) {
        printf("[agent-runner] %s — AI agents paused (global kill switch). exit\n", date('c'));
        exit(0);
    }
    // seed registry (31 agents, idempotent)
    $cnt = (int)Database::one("SELECT COUNT(*) n FROM ai_agents")['n'];
    if ($cnt === 0) { AgentRegistry::seed(); $cnt = (int)Database::one("SELECT COUNT(*) n FROM ai_agents")['n']; }

    $settings = AgentSettings::get();
    $max = $settings['max_jobs_per_run'];
    $budgetExhausted = ($settings['daily_budget'] > 0 && AgentSettings::dailyAiCost() >= $settings['daily_budget'])
                    || ($settings['monthly_budget'] > 0 && AgentSettings::monthlyAiCost() >= $settings['monthly_budget']);
    if ($budgetExhausted) {
        printf("[agent-runner] %s — AI budget exhausted (daily ₹%.2f / monthly ₹%.2f); deterministic jobs still run, LLM calls are blocked at the provider gate.\n",
            date('c'), AgentSettings::dailyAiCost(), AgentSettings::monthlyAiCost());
    }
    $agents = AgentRegistry::all();
    $ran = 0;

    // 0. retry failed jobs (bounded: max 3 retries, 5-min backoff)
    Database::q("UPDATE ai_agent_jobs SET status='queued', retry_count=retry_count+1, error='', completed_at=NULL
                 WHERE status='failed' AND retry_count < 3 AND completed_at < NOW() - INTERVAL 5 MINUTE");

    // 1. enqueue due agents
    foreach ($agents as $a) {
        if (AgentRegistry::isDue($a) && !AgentSettings::isPaused(scopeOf($a['slug']))) {
            AgentJobs::enqueue($a['slug'], 'run', [], $a['priority']);
        }
    }

    // 2. execute queued jobs (budget-limited; agent rows re-fetched so a
    // completed run in this batch is never executed twice). Runs any QUEUED
    // job (including retries and event-driven jobs) — the schedule gates
    // enqueueing, not execution.
    $queue = Database::all("SELECT DISTINCT agent_slug FROM ai_agent_jobs WHERE status='queued' ORDER BY id LIMIT " . ($max * 2));
    foreach ($queue as $q) {
        if ($ran >= $max) break;
        $fresh = AgentRegistry::bySlug($q['agent_slug']);
        if (!$fresh) continue;
        if (AgentSettings::isPaused(scopeOf($fresh['slug']))) continue;
        $job = AgentJobs::claim($fresh['slug']);
        if (!$job) continue;
        AgentRegistry::heartbeat($fresh['slug'], (int)$job['id']);
        try {
            $input = json_decode((string)($job['input'] ?? '{}'), true) ?: [];
            // runtime tool-permission enforcement: a job may only consume
            // integrations the agent's registry permissions declare
            $src = (string)($input['source'] ?? '');
            if ($src !== '' && !in_array($src, IntegrationHub::agentTools($fresh['slug']), true)) {
                throw new RuntimeException("Tool '$src' not permitted for agent '{$fresh['slug']}' (registry permissions enforced at runtime)");
            }
            $res = AgentExecutors::run($fresh['slug'], $input);
            // per-agent cost cap flag (post-execution warning; the budget gate
            // prevents spending beyond the global caps)
            if (!empty($res['cost']) && (float)$res['cost'] > (float)$fresh['max_cost']) {
                NotificationModel::push('Agent over per-job cost cap', "{$fresh['name']} spent ₹{$res['cost']} (cap ₹{$fresh['max_cost']})", 'error');
                AgentMemory::remember($fresh['slug'], ['context' => 'cost', 'observation' => "Job cost ₹{$res['cost']} exceeded cap ₹{$fresh['max_cost']}", 'decision' => 'flag + review model tier', 'action' => 'flag', 'result' => 'over budget', 'metric' => 'cost=' . $res['cost'], 'confidence' => 100]);
            }
            AgentJobs::complete((int)$job['id'], $res['output'] ?? []);
            if (!empty($res['ok'])) {
                AgentRegistry::markSuccess($fresh['slug']);
                // audit every agent action
                Audit::log(null, 'agent_run', 'ai_agent', $fresh['slug'], ['job' => (int)$job['id'], 'actions' => (int)($res['actions'] ?? 0), 'output' => array_slice((array)($res['output'] ?? []), 0, 3)]);
            } else {
                throw new RuntimeException($res['output']['error'] ?? 'agent failed');
            }
        } catch (Throwable $e) {
            AgentJobs::fail((int)$job['id'], $e->getMessage());
            AgentRegistry::markFailure($fresh['slug'], $e->getMessage());
            try { ErrorModel::log('error', 'agent:' . $fresh['slug'], $e->getMessage()); } catch (Throwable $x) {}
        }
        $ran++;
        $done[] = $fresh['slug'];
    }

    printf("[agent-runner] %s — %d job(s) executed in %.2fs: %s\n", date('c'), $ran, microtime(true) - $started, $done ? implode(', ', $done) : 'none due');
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, '[agent-runner] ' . $e->getMessage() . "\n");
    exit(2);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}

function scopeOf(string $slug): string
{
    return AgentSettings::scopeOf($slug);
}
