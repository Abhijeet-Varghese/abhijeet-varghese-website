# AV OS — Plug & Play

The whole point: **start once, and everything just runs.**

- Run the backend → it provisions the database, installs itself, and serves the
  static website + admin + API from one port.
- The public website is the hand-authored static frontend (`abhijeetvarghese/`),
  served **as-is** — no template, no generator, nothing to publish. Edit → commit →
  deploy. See `docs/static-frontend.md`.
- The CMS/CRM/SEO/agents in the admin work *around* the site (leads from the
  contact form, first-party analytics, SEO crawl of the static files, …).
- On Hostinger the same runs via a couple of cron lines.

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
4. first run: `database/install.php` (schema + seed + admin, prints a temporary
   password); later runs: `database/migrate.php` (idempotent)
5. starts the backend on **http://localhost:8092** (static site + admin + API)
6. starts the **agent watcher**: `agent-runner.php` every 60 s
   (log: `storage/logs/agent-runner.log`)

URLs: `http://localhost:8092/` (site) · `http://localhost:8092/admin/login.php` (CMS) ·
`http://localhost:8092/api/status`

> First run: use the printed temporary password, change it on first login.

## Local — manual start (equivalent)

```bash
php database/install.php --admin-email=you@x.com --generate   # first run only
php database/migrate.php                      # later upgrades (idempotent)
php -S 0.0.0.0:8092 router.php                # static site + admin + API
php backend/scripts/agent-runner.php          # run once, or in a loop / cron
```

## Hostinger — plug & play

Shared hosting is already "always on" — PHP runs via LiteSpeed, MySQL is managed.
The only setup is one-time:

1. **Deploy the website** — push to `main`; the GitHub workflow publishes
   `abhijeetvarghese/` to the `hostinger` branch → web root.
2. **Upload AV OS** (`avos-php/public_html/*` into the same web root, the rest
   private, per `docs/deployment-hostinger.md`).
3. **Configure** `config.local.php` (DB credentials, encryption key, `$siteUrl`,
   `$siteDir` if the site is not the parent folder).
4. **Visit** `https://abhijeetvarghese.com/install/` once → creates the admin
   (or SSH: `php database/install.php --admin-email=... --generate`).
5. **Cron** (hPanel → Advanced → Cron Jobs):

   ```
   * * * * *  php /home/uXXXXXX/avos/backend/scripts/agent-runner.php     >> /home/uXXXXXX/avos/storage/logs/agent-runner.log 2>&1
   */15 * * * * php /home/uXXXXXX/avos/backend/scripts/integration-sync.php >> /home/uXXXXXX/avos/storage/logs/integration-sync.log 2>&1
   ```

## How changes flow

```
website edit (html/css/js/assets) ──► git commit ──► deploy workflow ──► live
CMS edit ──► MySQL content_store (versioned) ──► CRM / SEO / agents / proposals
visitor form ──► POST /api/public/lead ──► CRM lead ──► automations / notifications
```

## Commands

| Command | Purpose |
|---|---|
| `./start.sh` / `start.bat` | everything: DB + install/migrate + server + agent watcher |
| `php backend/scripts/agent-runner.php` | run due agent jobs (cron-friendly, flock-safe) |
| `php backend/scripts/doctor.php` | environment check (site folder, 404 page, .htaccess, DB, storage…) |
| `php database/migrate.php` | migrations (idempotent, checksummed) |
| `php database/install.php --admin-email=… --generate` | CLI installer (first run) |
| `php backend/scripts/remove-dummy-content.php` | strip demo/test data |

## Troubleshooting

- **"Static website folder not found"** — set `$siteDir` in `config.local.php`
  to the folder that holds `index.html` (default: `../abhijeetvarghese`).
- **Edits in the CMS don't show on the site** — expected: the site is static.
  Edit the files in `abhijeetvarghese/` and deploy.
- **A legacy URL 404s** — add a 301 to `abhijeetvarghese/.htaccess` (and to
  `avos-php/public_html/.htaccess` + `router.php` so dev/prod stay in sync).

## Deployment modes

| Mode | Env | Debug | Use |
|---|---|---|---|
| Local | `APP_ENV=local` or `development` (start.sh sets it) | verbose | `./start.sh` / `start.bat` |
| Staging | `APP_ENV=staging` | verbose | preview/testing |
| Production | `APP_ENV=production` (default) | sanitized | live — refuses insecure defaults, HTTPS enforced |

### Operations
- **Doctor**: `php backend/scripts/doctor.php` + `GET /api/system/doctor` — PHP, PDO, DB, storage, static site folder, 404 page, web-root .htaccess, installer lock, encryption key, production guard, HTTPS, cron state.
- **Installer**: `/install/` returns 404 when locked.
- **Backups**: `POST /api/backup` writes a full `mysqldump` when available (fallback: JSON package); retention via Settings → Website & backups (`GET|PUT /api/system/backup-settings`); never publicly accessible.
- **Locking**: `storage/locks/*.lock` via flock — concurrent agent runs exit safely.

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
external_link, site_search) in the site's `js/main.js`; engagement scores per page,
CTA performance (clicks/leads/conversion), conversion funnel (visitor → won).

**Intelligence**: "What should I do next?" engine (SEO opportunities, content decay,
broken links, missing metadata, high-value leads, unviewed proposals, stale content —
prioritized); daily brief; weekly growth report; social drafts (LinkedIn/Instagram/X/
newsletter — DRAFT ONLY, never auto-posted) built from real project data.

**Public site**: `search-index.json` + `/search.html` ship with the static frontend (site chrome,
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
