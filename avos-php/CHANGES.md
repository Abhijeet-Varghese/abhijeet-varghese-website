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
- Stylesheet fingerprint re-hashed on every page (`styles.css?v=2.4.20-d48550315ad5`).

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
- 47 admin views render with 0 JS errors / 0 failing API calls.

**Verification (private copy of the former battery run from outside the repo)**
- link audit 0 broken · static integrity clean · full-site responsive 24 routes × 25 sizes clean ·
  visual precision clean · accessibility/resilience clean · axe 0/0 · chrome consistency clean ·
  Orange Business clean · performance budget clean · contact/booking/case-nav/history-close PASS ·
  doctor SYSTEM READY · frontend→CMS sync clean.
