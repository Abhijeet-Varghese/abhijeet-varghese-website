# AV OS — Publishing

Deterministic, validated, rollback-safe static publishing.

## Pipeline

```
MySQL content_store
   ↓ ContentStore::all() (one consistent snapshot)
PublishEngine
   ↓ render (site-template/ as canonical template source)
   ↓ pages → {slug}.html · articles → essay-|journal-{slug}.html · homepage → index.html (never /.html)
   ↓ css/tokens.css (design tokens → CSS variables) · sitemap.xml · robots.txt
   ↓ first-party analytics snippet injection (/api/analytics/track)
   ↓ asset/media sync (css, js, assets, media)
   ↓ validateBuild (required files, sizes, no placeholders)
   ↓ staging directory (storage/cache/stage-…)
   ↓ ATOMIC SWAP (rename old → backup, rename staging → live)
   ↓ deployment recorded (deployments row + site snapshot + content snapshot)
```

**Any step fails → build stops, current live site stays untouched, `system_errors` logged, failure
notification pushed.**

## Deployment history & rollback

- Every publish records a `deployments` row: version hash, status (live/superseded/rolled_back),
  creator, note, content snapshot (JSON), and a **site snapshot** (copy of the generated site,
  kept: 3 on disk).
- `POST /api/publish/rollback` (permission `publish`):
  1. finds the previous superseded deployment with a valid snapshot,
  2. swaps its site snapshot back into `public_html/site/` (atomic; displaced current site becomes a
     snapshot so the rollback itself is reversible),
  3. restores the content snapshot — **every key becomes a new version** (history preserved),
  4. marks the old deployment `rolled_back`, records a new `live` deployment,
  5. writes an `publish_rollback` audit event + pushes a notification.

Verified end-to-end: publish #1 → edit → publish #2 → rollback → site and DB restored to #1 state,
versions + audit created → republish clean.

## Preview

Draft content is never public. The CMS preview path uses the same renderer/templates as production
(versions API + staging build); unpublished entities are excluded from generation (status check) and
from sitemap.xml.

## Homepage rule

`/` always generates `index.html` from the `sections` document. Pages with empty/home/index slugs are
excluded from generic page generation — no `/.html`, no duplicate homepage outputs.

## Analytics snippet

Every generated page includes a first-party snippet posting `page_view` (visitor_id, path, referrer,
UTMs, device) to `POST /api/analytics/track` (rate-limited 300/h/IP). Dashboard reports real events:
traffic, top pages, sources, campaigns, conversions, content metrics.

## V3 publishing

- **Pre-flight**: `POST /api/publish/preflight` builds to staging (no switch) and returns a real
  report — pages, articles, images, broken links, SEO errors, alt-text warnings. Warnings never
  block; genuine errors do. UI: Publishing → Pre-flight.
- **Diff**: `GET /api/publish/diff` compares current content vs the last deployment snapshot
  (added/modified/removed per collection). UI: Publishing → Diff.
- **Post-publish verification + automatic rollback**: after the atomic swap, critical routes
  (index, css, js, sitemap, robots, 404, story/experience/case-studies/contact) are checked for
  existence/size, and every sitemap URL must map to a file (no draft/admin/api paths). Any failure
  → the previous deployment is restored automatically, an incident is recorded in `system_errors`,
  an audit event and a notification are created. Verified end-to-end.
- **Broken-link gate**: generated HTML is scanned for internal `.html` links that don't exist in the
  build; pre-flight reports them, publish refuses to ship them.
- **Draft isolation**: homepage essay cards, journal/insights listings and the sitemap page render
  only published/due articles — drafts never appear on the public site (verified: seed drafts
  previously leaked — fixed and regression-tested).
- **404 + redirects + headers**: `404.html`, `.htaccess` (ErrorDocument, 301/302 redirect rules from
  the redirect manager, nosniff/frame/referrer/permissions headers), scheduled entities
  (`status: scheduled` + `scheduled_at`) publish when due.
