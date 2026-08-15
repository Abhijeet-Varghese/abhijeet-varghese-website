# AV OS — Plug & Play

The whole point: **start once, then everything stays in sync automatically.**

- Run the backend → it provisions the database, installs itself, and serves the site.
- Edit anything in the CMS → the public site regenerates **automatically** (no Publish click).
- Edit the frontend folder (css/js/images/fonts) → the backend **pulls your changes** into its
  template and republishes.
- On Hostinger the same happens via a 1-minute cron job.

---

## Local — one command

```bash
cd avos-php
./start.sh          # macOS / Linux
start.bat           # Windows (needs MySQL running — XAMPP/MAMP)
```

What `start.sh` does automatically:

1. starts MariaDB if it isn't running
2. provisions the `avos` database + user (`database/provision.sql`) on first run
3. creates `config.local.php` from the example if missing
4. runs migrations (idempotent)
5. creates the administrator account on first run (prints a temporary password)
6. starts the backend on **http://localhost:8092** (site + admin + API)
7. starts the **live-sync watcher**: every 60 s it pulls frontend changes and
   auto-publishes content changes (log: `storage/logs/auto-publish.log`)

URLs: `http://localhost:8092/` (site) · `http://localhost:8092/admin/login.php` (CMS) ·
`http://localhost:8092/api/status`

> First run: use the printed temporary password, change it on first login.

## Local — manual start (equivalent)

```bash
php database/migrate.php                      # schema (idempotent)
php database/install.php --admin-email=you@x.com --generate   # first run only
php -S 0.0.0.0:8092 router.php                # backend (site + admin + API)
php backend/scripts/auto-publish.php          # run once, or in a loop / cron
```

## Hostinger — plug & play

Shared hosting is already "always on" — PHP runs via LiteSpeed, MySQL is managed.
The only setup is one-time:

1. **Upload** the project (web root = `public_html/`, the rest private, per
   `docs/deployment-hostinger.md`).
2. **Configure** `config.local.php` (DB credentials, encryption key, `$siteUrl`).
3. **Visit** `https://abhijeetvarghese.com/install/` once → creates the admin
   (or SSH: `php database/install.php --admin-email=... --generate`).
4. **Add one cron job** (hPanel → Advanced → Cron Jobs):

   ```
   * * * * * php /home/uXXXXXX/avos/backend/scripts/auto-publish.php >> /home/uXXXXXX/avos/storage/logs/auto-publish.log 2>&1
   ```

That's it — from then on every CMS save regenerates the live site automatically.

## The sync loop

```
CMS edit ──► MySQL ──► auto-publish (on save + cron) ──► static site ──► live
frontend edit (css/js/assets/fonts) ──► sync-frontend ──► site-template ──► publish ──► live
```

- **Backend → frontend:** toggle "Live sync" in Settings (default ON; also a
  feature flag `auto_publish` under Platform → Feature flags). Every save
  regenerates the site; drafts never leak (the engine only publishes
  `published`/due entities).
- **Frontend → backend:** `Sync frontend` button in Settings, or
  `php backend/scripts/sync-frontend.php`, or automatically every minute by
  the watcher/cron. It pulls css/js/assets/fonts from the frontend folder
  (`$frontendDir` in `config.local.php`, default: the `abhijeetvarghese`
  folder next to `avos-php`) into `site-template/`, then republishes.
- Content (pages, copy, SEO) is always managed in the CMS — the sync only
  pulls design assets, it never overwrites your content.

## Commands

| Command | Purpose |
|---|---|
| `./start.sh` / `start.bat` | everything: DB + migrate + install + server + watcher |
| `php backend/scripts/auto-publish.php` | sync frontend + publish if changed (cron-friendly, flock-safe) |
| `php backend/scripts/sync-frontend.php` | pull frontend assets into the template (one-shot) |
| `php database/migrate.php` | migrations (idempotent, checksummed) |
| `php database/install.php --admin-email=… --generate` | CLI installer (first run) |
| `php backend/scripts/remove-dummy-content.php` | strip demo/test data |

## Troubleshooting

- **"Frontend folder not found"** — set `$frontendDir` in `config.local.php`
  (or `AV_FRONTEND_DIR`) to the folder that holds your css/js/assets.
- **Auto-publish disabled but you want it** — Settings → Publishing → Live
  sync toggle, or Platform → Feature flags → `auto_publish`.
- **Publish fails** — the live site is untouched; the error is in
  System → Health → Errors and a notification is created. Fix and save again.
- **Two instances fighting** — the watcher is flock-protected; only one
  publish runs at a time.

## v2.1 production hardening (this pass)

### Three deployment modes
| Mode | Env | Debug | Use |
|---|---|---|---|
| Local | `APP_ENV=local` or `development` (start.sh sets it) | verbose | `./start.sh` / `start.bat` |
| Staging | `APP_ENV=staging` | verbose | preview/testing, optional auto-publish |
| Production | `APP_ENV=production` (default) | sanitized | live — refuses insecure defaults, HTTPS enforced |

### Publish pipeline (always safe)
```
SAVE → DB COMMIT → VERSION → QUEUE → BUILD STAGING → VALIDATE →
BACKUP CURRENT (snapshot) → ATOMIC SWAP → POST-PUBLISH HEALTH CHECK →
MARK PUBLISHED (or AUTO-ROLLBACK + incident)
```
- **Zero downtime**: builds go to `storage/cache/stage-XXXX`, validate, then one atomic rename. Failure → live untouched.
- **Publish queue + debounce**: rapid saves coalesce into one job (`publish_queue` table, statuses queued/processing/completed/failed). Manual "Publish" bypasses the debounce and is synchronous.
- **Locking**: `storage/locks/{sync,publish}.lock` via flock — concurrent publishes/syncs exit safely (tested).
- **Version retention**: `Admin → Settings → Publishing → Version retention` (default 10) controls how many production snapshots are kept; backup retention default 5 (JSON + optional mysqldump).
- **Auto-failure rollback**: post-publish health check (critical routes + sitemap) → any failure restores the previous deployment automatically, logs an incident, notifies the admin.

### Frontend sync (content-aware)
- SHA-256 per-file manifest (`storage/cache/frontend-manifest.json`) — mtime is not trusted; only real content changes sync.
- Ownership: frontend source owns css/js/assets/fonts/icons/favicon; the CMS owns all content/navigation/SEO. The sync NEVER touches CMS content.
- Dry run: `POST /api/sync/frontend?dry_run=1` or `php backend/scripts/sync-frontend.php --check` (added/modified/deleted/unchanged report).
- Sync loop protection: manifest hashes + sync lock + publish lock + idempotent runs (10 runs without changes → "nothing to do", tested).

### Operations
- **Doctor**: `php backend/scripts/doctor.php` + `GET /api/system/doctor` — 21 checks (PHP, PDO, DB, storage, template, frontend, .htaccess, installer lock, encryption key, production guard, HTTPS, cron state…).
- **Publishing status**: `GET /api/system/publishing` (queue + last publish + failures + health); the admin shell polls it every 15 s and shows LIVE/PUBLISHING/FAILED/ATTENTION; the Publishing view has a Live Sync panel with the same data.
- **Cron self-health**: `auto-publish-state.json` tracks last check/sync/publish/failures/last error; after 3 consecutive failures the watcher backs off.
- **Watchdog**: failures ≥ 3 → "NEEDS ATTENTION" in the Publishing view + status chip.
- **Draft mode**: "Save draft" in the homepage builder sends `publish:false` — DB + version, no publish (race-safe: pending auto-pushes are cancelled first).
- **Installer**: `/install/` returns "Installation already completed." when locked.
- **Backups**: `POST /api/backup` now also writes a full `mysqldump` when available (fallback: JSON package); retention enforced; never publicly accessible.

### Failure-injection tests (all green)
Broken template → publish blocked, live unchanged, queue failed, error logged, notified · concurrent publish → one wins, other requeues · concurrent sync → second exits safely · draft mode → DB saved, site untouched · 100 API calls in 0.92 s · 8 rapid saves → 3 builds (coalesced) · 10 sync runs → idempotent.

## v2.2 — SEO + Intelligence layer (master build)

**SEO Command Center** (Growth → SEO, Keywords, Opportunities; nav updated):
- Keywords with intent classification (rule-based, explainable), clusters (pillar pages),
  volume/difficulty/priority estimates, target URLs, primary-keyword flags.
- Ranking history (weekly position records, movement display).
- Cannibalization detection (normalized keyword matching — "consultant" vs "consulting"
  vs "consultants" → one group; multiple URLs → warning + merge/301 recommendation).
- Opportunity scoring (volume, intent weight, difficulty, current position, priority,
  business value — labeled internal estimate), content briefs (real related-content
  discovery + structure), content decay (real analytics comparison), internal-link audit.
- Technical SEO crawler: `POST /api/seo/audit` crawls the generated static site for
  missing/duplicate titles & descriptions, missing H1/canonical/OG, broken images,
  broken internal links, missing alt, orphan pages → seo_audits + seo_issues with
  severity + score + mark-fixed.
- Backlinks & competitors tracking (manual entry — no scraping).

**Engagement**: first-party events extended (gallery_open, video_play, scroll_depth,
external_link, site_search) in the published snippet; engagement scores per page,
CTA performance (clicks/leads/conversion), conversion funnel (visitor → won).

**Intelligence**: "What should I do next?" engine (SEO opportunities, content decay,
broken links, missing metadata, high-value leads, unviewed proposals, stale content —
prioritized); daily brief; weekly growth report; social drafts (LinkedIn/Instagram/X/
newsletter — DRAFT ONLY, never auto-posted) built from real project data.

**Public site**: search-index.json generated at publish + /search.html (site chrome,
client-side search over projects/case studies/essays/journal/services); related-content
section on articles (shared category/tags/title-overlap — never fabricated); sitemap
includes search.html.

**Database**: migration 016 (keywords, keyword_clusters, keyword_rankings, seo_audits,
seo_issues, backlinks, competitors, content_opportunities, social_drafts) + 017
(starter keyword dataset — real, relevant, labeled as estimates).

**API**: /api/seo/* (keywords, clusters, rankings, cannibalization, opportunities,
audit, issues, decay, internal-links, brief, backlinks, competitors),
/api/engagement/* (score, ctas, funnel), /api/intelligence/* (next-actions,
daily-brief, weekly-report, social-drafts) — all permission-gated + audited.

**Tests**: 114/114 E2E (incl. SEO crawl/opportunities/brief/search/social-draft
assertions) · 20/20 failure modes · 14/14 journeys · 18/18 inbound · 21/21 2FA ·
45/45 views (plus keywords/opportunities/engagement) · 13/13 functional · 0 broken
links · PHP+JS lint clean · doctor SYSTEM READY.

## v2.3 — AI AGENT OPERATING SYSTEM (24/7 autonomous growth)

### Infrastructure (all real, cron-driven, Hostinger-safe)
- **21-agent registry** (`ai_agents`): name, role, description, system prompt, permissions
  (JSON), schedule, priority, autonomy level (0–5), max actions/tokens/cost, enabled,
  status, heartbeat (last_run/last_success/last_failure/last_seen/current_job),
  counters + consecutive-failure tracking.
- **Job queue** (`ai_agent_jobs`): queued/running/completed/failed/cancelled, coalesced
  per agent, bounded retries (max 3, 5-min backoff), cost + tokens per job.
- **Memory** (`ai_agent_memory`): every agent records observation → decision → action →
  result → metric → confidence. Structured learning; no self-modification.
- **Orchestrator** (AI Chief of Staff): daily review, prioritizes actions, generates the
  growth brief; kill switch (PAUSE ALL AI + per-scope pause: seo/content/social/publish);
  budgets (daily/monthly, cost tracked from real ai_requests); quality threshold.
- **Scheduler**: hourly/every3h/every6h/daily/weekly/monthly, SQL-timezone-safe,
  resource-aware (max_jobs_per_run per cycle).
- **Cron**: `backend/scripts/agent-runner.php` — flock-locked, checks kill switch, seeds
  registry, enqueues due agents, executes queued jobs, records results, exits. Wired
  into `start.sh` local watcher and documented for Hostinger (one cron line).

### Agents (real executors — SQL/rules first, LLM only where reasoning adds value)
Analytics (daily report + funnel drop-offs) · Website Health (HTTP checks of 10 critical
paths) · Technical SEO (crawl + auto-fix missing meta descriptions from real content) ·
SEO (opportunities/cannibalization/decay) · Search Intelligence (topic-coverage gaps) ·
Internal Linking (orphan detection) · Content Refresh (decay) · Research (curated topic
notes into knowledge) · Content Strategist (roadmap) · Journal (quality-gated drafts,
never volume-for-volume) · Insights (short expert notes from real projects) · Case Study
(drafts from real project data, completeness-scored, never fabricated) · Engagement/CRO
(CTA + funnel analysis) · Lead Intelligence (high-value flagging + follow-up tasks) ·
Business Intelligence (services/sources → leads) · Social/Newsletter (draft only, never
auto-posts) · Knowledge (duplicates) · AI Editor (quality gates over all drafts) ·
Orchestrator.

### Quality gate (deterministic, no LLM needed)
Depth · originality (token-overlap vs existing content) · fact whitelist (rejects invented
client markers like "Acme") · brand voice (banned generic-AI phrases) · metadata ·
internal links · CTA → score 0-100, configurable threshold (default 70). Content agents
save DRAFTS only; publishing always requires human review (or level-4 metadata fixes
which are safe + audited).

### Event-driven
`page.published` → SEO + Internal Links + Social agents enqueued · `lead.created` →
Lead Intelligence. Run via the same cron cycle.

### Admin
AI Agents command center (system health, growth brief, autonomous action feed, agent
cards with status/last-run/success-rate/autonomy, run-now, enable/disable, PAUSE ALL
AI) + dashboard AI growth brief + autonomous actions feed.

### Tests
121/121 E2E (agent registry, runner cycles, memory, jobs, kill switch, growth brief,
drafts) · 20/20 failure modes · 14/14 journeys · 18/18 inbound · 21/21 2FA · 46/46
admin views · 13/13 functional · 0 broken links · lints clean · doctor SYSTEM READY.
