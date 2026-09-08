# AV OS — Integration Hub & Data Intelligence (v2.4)

The Integration Hub is the single registry + dispatcher for every external connection.
Its core rules:

1. **`CONNECTED` is only ever set after a real, successful provider request.** The
   vocabulary is: `CONNECTED` / `CONFIGURED` / `NOT CONNECTED` / `AUTH REQUIRED` /
   `RATE LIMITED` / `ERROR` / `DISABLED` / `UNAVAILABLE` / `LIMITED — MANUAL /
   APPROVAL REQUIRED` / `MANUAL`.
2. **Secrets are encrypted at rest** (`aes-256-cbc` with `AV_ENC_KEY`, stored as a JSON
   envelope in `integrations.config_enc`). They are never returned by any API, never
   written to logs, and credential-looking URL query parameters are redacted from the
   call log.
3. **Free-first**: native APIs, free tiers, RSS and open standards before anything paid.
   Deterministic work (404 detection, metadata audits, sitemap validation, duplicate
   detection, image dimensions) is always done internally — never with AI/API credits.
4. **Failures never break the website**: log → retry → fallback → continue.

---

## Architecture

```
EXTERNAL WORLD (GSC · GA4 · Clarity · Cloudflare · Calendly · GitHub · Drive · Notion ·
                YouTube · Trends · RSS · SMTP · WhatsApp …)
        │
INTEGRATION HUB (registry + adapters + api_cache + integration_calls + rate limits)
        │  normalized data
AV OS DATA LAYER (search_console_* · intelligence_metrics · research_items ·
                  knowledge_graph · facts · case_study_scores · dev_* · trackable_links)
        │
AI AGENT OS (31 agents, tool permissions, memory, outcomes)
        │
ACTION ENGINE → QUALITY GATE → PUBLISH → LIVE SITE → ANALYTICS → AGENT MEMORY → NEXT DECISION
```

## Registry

`integrations` table (extended in migration 020). Each row exposes:

| Field | Meaning |
|---|---|
| `status` | Honest state (see vocabulary above) |
| `enabled` | Master switch (UI + API) |
| `authentication_type` | `none`, `api_key`, `oauth2`, `api_token`, `smtp`, `manual`, `rss` |
| `capabilities` | JSON — what this connection can do on the user's tier |
| `free_tier` | `free` / `limited` / `paid` |
| `rate_limit` | JSON — documented limits of the provider |
| `last_sync_at / last_success_at / last_failure_at / last_error` | Health |
| `sync_interval_minutes` | Cron cadence (0 = manual only) |
| `config_enc` | Encrypted secrets (never read back) |
| `configuration` | Public config (measurement IDs, site URL, folders…) |

## Adapters

All adapters implement `IntegrationAdapterInterface`:
`code()`, `test(config)` (real request), `sync(config)` (pull + normalize + store),
`triggers()` (which agent jobs to enqueue after a successful sync), `publicType()`
(works without credentials), `capabilities()`.

| Code | Provider | Auth | Free tier reality | Sync cadence |
|---|---|---|---|---|
| `gsc` | Google Search Console | service-account JWT / OAuth | free; 16k rows/day | daily |
| `ga4` | Google Analytics 4 | service-account JWT / OAuth | free Data API quota | daily |
| `gtm` | Google Tag Manager | manual (container ID) | free; snippet only | — |
| `bing` | Bing Webmaster | API key | free | daily |
| `clarity` | Microsoft Clarity | OAuth (API preview) | free; LIMITED until API stable | daily |
| `cloudflare` | Cloudflare | API token | free | 3 h |
| `calendly` | Calendly | PAT | free; bookings → CRM via shared webhook path | hourly |
| `github` | GitHub | none (public) / PAT | free; 60 req/h unauth, 5000 authed | 3 h |
| `drive` | Google Drive | service account | free; approved folders only | weekly |
| `notion` | Notion | integration token | free personal | weekly |
| `youtube` | YouTube | none (channel RSS) | free; videos, titles, dates | daily |
| `trends` | Google Trends | none (official RSS) | free | hourly |
| `rss` | RSS research engine | none | free, open standard | hourly |
| `linkedin` | LinkedIn | manual | posting needs approved app → drafts + manual publish | — |
| `instagram` | Instagram | manual | Graph API needs Business account + app → drafts + manual | — |
| `behance` | Behance | manual | portfolio reference only | — |
| `dribbble` | Dribbble | manual | portfolio reference only | — |
| `canva` | Canva | manual | Connect API needs app approval → template workflow | — |
| `whatsapp` | WhatsApp | none (click-to-chat) / Cloud API | free click-to-chat links; optional Cloud API | hourly |
| `email` | SMTP (Hostinger/Gmail) | SMTP | free | — |
| `openai/claude/gemini` | AI providers | API key | existing `ai_providers` table state | — |

## Data layer

- `search_console_queries / pages / daily` — Google + Bing, source-attributed,
  opportunity engine: position 4–20 + impressions + CTR + business relevance →
  quick-win score (0–100); CRO candidates: high impressions + low conversion.
- `api_cache` — hash-keyed GET cache (15 min) to respect quotas; never caches secrets.
- `integration_calls` — every external call: provider, endpoint (redacted), agent,
  duration, success, error, request id.
- `research_sources / research_items` — curated RSS/Atom/RDF feeds with authority /
  relevance / freshness / trust; GUID dedupe; research only, never republished.
- `knowledge_graph / knowledge_edges` — person → client → project → technology,
  built from real content; shared agent context.
- `facts` — truth layer; every AI claim is classified; unsupported claims block.
- `case_study_scores` — 10-dimension completeness per project.
- `social_profiles` — platform registry with API reality checks.
- `trackable_links / link_clicks` — UTM generator + WhatsApp click-to-chat with
  public click tracking and lead attribution.
- `intelligence_metrics` — GA4/Cloudflare aggregates, positioning health, perf.
- `agent_outcomes` — real before/after deltas per agent.
- `dev_repos / dev_events` — GitHub signals for the Developer agent.
- `knowledge_ingest` — Drive/Notion ingestion ledger (file, hash, status).

## Cron

```
*/15 * * * * php /home/USERNAME/path/to/backend/scripts/integration-sync.php >> /home/USERNAME/path/to/storage/logs/integration-sync.log 2>&1
```

flock-protected; syncs only due integrations; on success enqueues each adapter's agent
triggers. The public website is never touched by this script.

## Manual setup checklist (free, no paid services)

1. **Search Console**: Google Cloud project → service account → add to Search Console
   property → paste service-account JSON + property URL in Integrations → GSC → Save +
   Test. Or use the CSV export → **manual import** (`/api/search-console/import`).
2. **GA4**: same service account with `analytics.readonly` scope + property ID.
3. **Bing**: Bing Webmaster → Settings → API access → key.
4. **Cloudflare**: My Profile → API Tokens → Zone Read + Analytics Read; zone ID.
5. **Calendly**: Integrations → API → personal token; also set the inbound webhook
   signing key (Platform → Webhooks → Inbound; URL `{site}/api/webhooks/inbound/calendly`).
6. **GitHub**: nothing needed for public data; add a PAT to raise the rate limit.
7. **YouTube**: nothing — public channel RSS (handle-based resolution).
8. **Drive/Notion**: service account / token + approved folder/page IDs.
9. **GA4/GTM/Clarity measurement**: put the public IDs in Integrations → GA4 (measurement
   ID), GTM (container ID), Clarity (project ID); they are injected into the published
   site on the next publish. No credentials are embedded.

## Honest limits (per current free accounts)

- LinkedIn/Instagram/Behance/Dribbble/Canva: **MANUAL** — drafts → approval → human
  publish. Never pretended to auto-post.
- Clarity: metrics API is in preview → **LIMITED** until a working token is available.
- Calendly availability API: not available without API access → the public booking URL
  is always shown and live availability is only claimed when the API verifies it.
- LCP/INP/CLS: need browser/field data (CrUX with a key when available); the
  Performance agent measures real server-side TTFB + payload sizes.
