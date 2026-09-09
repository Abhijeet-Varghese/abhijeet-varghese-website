<!-- WORKING POLICY: ALL edits happen in v2.4.20 — the single live/working
     version. No new version lines, no renames. Keep AV_VERSION = 2.4.20;
     bump the asset cache-bust (12-char SHA-256 fingerprint) when frontend
     files change. This file records the CURRENT variant only — superseded
     revisions are removed when the code they describe is removed. -->

## v2.4.20-r9 · CURRENT VARIANT ONLY — DOCS, TESTS AND OLD-VERSION CODE REMOVED

**Removed from the repository**
- `docs/` (root, archived design-system notes + one-off reports), `avos-php/docs/` (13 guides),
  `tests/` (Playwright + shell + PHP/Python QA battery) and its `package.json`/`package-lock.json`.
  The repo now contains only the shipped website, the AV OS backend + admin, the two runbooks
  and this changelog.
- `avos-php/database/schema.sql` — a stale copy of migration 001 (missing the lead
  country/phone columns); the migrations directory is the only schema source.
- `avos-php/public_html/admin/app/media/` — 13 duplicate/outdated copies of site assets
  (one was a 500-px logo that no longer matched the site). `/admin/app/media/*` and `/media/*`
  already resolve through `media.php` → uploads, then `<site>/assets/`; nothing was reachable
  through the folder.
- `AV_INSTALL` / `AV_VERSIONS` constants and the `storage/versions/` directory (never read).
- `.gitignore` entries for the removed trees (Playwright output, node_modules, deployments, versions).

**Public website — old-version code purged (verified against a live render of all 24 routes
at 5 viewports with CSS rule-usage tracking + a static selector scan of HTML/JS)**
- `css/styles.css`: 162 rules whose selectors no longer exist anywhere removed (previous
  portfolio hero/index/piece/CTA design, `.story-timeline`, `.pull-quote`, `.case-detail__*`,
  `.case-gallery*`, `.about-prose`/`.about-statement`/`.about-list`/`.about-figure` family,
  `.about-frame__eyebrow`, `.about-compass__bar`, `.about-system`, …). 4143 → 3745 lines.
  All version-history banners (`v2.4.1 …`, `ROLLBACK COMPAT (kept bugfixes from v2.5.0)`,
  `(v2.4.13)`, `(v2.6)` …) rewritten to describe what the block IS, not which release added it.
- `css/portfolio-reel.css` + `js/portfolio-reel.js` + `portfolio.html`: the dormant
  "More Work" editorial grid (empty `moreWork[]` array, `renderMoreWork()`, `.pf-work--*`
  layouts, `.pf-case--lead/bleed/offset` breakpoints, `[data-pf-morework]` mount) removed —
  the Coming-Soon panel is the shipped state. Reel asset versions moved from the legacy
  `?v=2.5.0-reel` tag to the standard content fingerprint.
- BPCL sub-site `main.css`: unused `.foot`, `.foot__h`, `.foot__nav*`, `.foot__legal` rules
  (page uses the shared arena footer).
- Stylesheet fingerprint re-hashed on every page (`styles.css?v=2.4.20-8d66bbde8bed`, `main.js?v=2.4.20-413ff5a8256b`).

**AV OS admin — demo/seed leftovers replaced by live data**
- `data.js`: the 330-line v1 demo seed (fake visitors, meetings with "Acme Inc", leads,
  submissions, logs, backups, integrations, AI prompts, two never-published journal articles
  pointing at non-existent images) replaced by an empty store skeleton; the content store
  pulled from `/api/content` is the only data source.
- Notification bell (`core.js`) now reads `GET /api/notifications` and posts
  `notifications/read-all` — it previously rendered the localStorage seed forever.
- "Reset demo data" palette command → "Reload from database".
- Removed mock-only views with no backend: **Future Lab**, **Speaking**, **Knowledge search**
  (the real knowledge base lives under Platform › Knowledge; ⌘⇧F and the palette entry now
  open that tab). **Downloads** and **Testimonials** now render the records mirrored from the
  static site instead of hard-coded rows. Orphaned `.kb-result*` CSS removed.
- Deep links with a tab (`#platform?tab=knowledge`) now open that tab on a cold load, and the
  Platform tab strip no longer hard-codes Webhooks as active.
- 46 admin views render with 0 JS errors / 0 failing API calls.

**Backend — API surface reduced to what the static site and the admin actually call**
- Public content API removed: `GET /api/site`, `/api/pages(/slug)`, `/api/projects(/slug)`,
  `/api/posts(/slug)`, the whole `/api/v1/*` block and `POST /api/public/submit`. The website
  is static HTML; it only calls `POST /api/public/lead` and `POST /api/analytics/track`.
  Public surface is now exactly: auth login/logout, session, public/lead, analytics/track.
- Admin routes with no caller in the admin app removed together with their handlers and
  model methods: `forms/*` (+ the Forms view, `FormModel`, backup/restore of
  `form_submissions` — nothing wrote that table once `public/submit` was gone),
  `crm/tasks`, `crm/restore`, `scoring/rules`, `business/milestones`, `business/documents`,
  `webhooks/deliveries`, `analytics/content`, `search` (+ `SearchModel`),
  `seo/internal-links`, `intelligence/daily-brief|weekly-report|social-drafts`,
  `system/doctor`, `search-console/*` (7), `knowledge-graph/edge`, `links/click`,
  `outcomes`, `dev-intel`, `knowledge-ingest`. 55 routes → 0 dead. Agents/cron keep the model
  methods they call directly (`SearchConsoleModel::overview/queries/quickWins/croCandidates`,
  `OutcomeModel::record`, `DevIntelModel::signals`, `KnowledgeIngestModel::record`, …).
- `PUT /api/content` key allow-list is one constant (`ApiController::CONTENT_KEYS`) matching
  the real store keys; the phantom `forms/analytics/availability/notifications/dashboard`
  entries are gone.
- `Installer`: the unused opt-in JSON `seed_file` path removed — install mirrors the static
  site, full stop. `backend/scripts/remove-dummy-content.php` and `prod-cleanup.php` (test-data
  scrubbers for the deleted battery) removed; runbooks updated.

**Admin — account & booking**
- Avatar button opens a live **Account** modal (name / e-mail / role from `/api/session`)
  with Users and **Sign out** (`POST /api/auth/logout`, local cache cleared, back to login).
  Sidebar footer and avatar initials come from the session instead of hard-coded text.
- Website booking widget: the "live availability" plumbing (`/api/availability` fetch,
  month cache, `is-unavail`/`is-off` states) had no backend endpoint and was dead on every
  request; removed from `main.js`/`styles.css`, and the hint under the time slots now says
  what actually happens ("All standard times shown — final confirmation happens at booking").
  Booking on `/` and `/contact.html` verified end-to-end (date → slot → `public/lead` → done state).

**Verification (private copy of the former battery run from outside the repo)**
- link audit 0 broken · static integrity clean · full-site responsive 24 routes × 25 sizes clean ·
  visual precision clean · accessibility/resilience clean · axe 0/0 · chrome consistency clean ·
  Orange Business clean · performance budget clean · contact/booking/case-nav/history-close PASS ·
  doctor SYSTEM READY · frontend→CMS sync clean · admin 46 views 0 errors · functional suite PASS.
