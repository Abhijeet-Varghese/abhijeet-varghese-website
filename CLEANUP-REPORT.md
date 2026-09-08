# AV OS — SAFE CLEANUP REPORT

**Scope:** repository and runtime audit for AV OS v2.4.20
**Policy:** safe cleanup · preserve design toolkit · curate tests · keep immutable migrations

## Removed obsolete visual/debug artifacts

The previous screenshot/debug iteration files and superseded one-off visual tests were removed. The retained suite covers public responsiveness, accessibility, navigation, About, Experience, Portfolio, Orange Business, performance, browser compatibility, backend journeys and security.

## Dead frontend code removed

- Removed unreferenced legacy `_hero-reborn.css` and `_reel-reborn.css` files from source, template and generated output.
- Removed the superseded synthetic `case-orange.webp`; the current cache-safe Orange thumbnail is `case-orange-experience-in-action.webp`.
- Kept all active CSS/JS, original client evidence, responsive media derivatives, local fonts and font licence files.

## Generated endpoint ownership corrected

- `robots.txt` and `sitemap.xml` are generated exclusively by `PublishEngine`.
- Removed stale copies from `site-template`.
- Removed robots/sitemap from frontend asset synchronization, preventing generated output from being pulled back into template source.

## Curated tests

Removed obsolete output-only checks whose coverage is fully superseded by authoritative fail-fast suites:

- `enh_check.js`
- `final_check.js`
- `hybrid_qa.js`
- `modal_footer_audit.js`
- `nums_final.js`

Retained dedicated tests for About, Experience, Portfolio, Orange Business, thumbnail framing, full-site responsive geometry, visual precision, accessibility resilience, browser compatibility, performance budgets, navigation, forms, admin views, links and backend/security journeys.

## Duplicate helpers

- Removed the hard-coded `dev-tools/restore-canonical.php` duplicate.
- Removed the narrower, undocumented `load-page-seeds.php` helper.
- Retained one canonical restore command: `php backend/scripts/restore-canonical.php`.

## Runtime Git hygiene

Removed these generated runtime artifacts from Git tracking while keeping them ignored and available to local runtime processes:

- installer marker
- auto-publish/frontend manifests
- frontend sync state
- publish/sync lock files
- deployment snapshots, caches, logs, backups and uploads

## Intentionally retained

These are required history, source evidence or active capabilities—not dead files:

- All 27 immutable database migrations
- `schema.sql` and migration validation tooling
- Git history and `CHANGES.md`
- Content version/restore infrastructure
- Current generated static site
- Canonical frontend source and `site-template`
- Hostinger deployment documentation
- Core regression and integration tests
- `.claude/skills` design toolkit
- Font licence files
- Draft/review article assets
- Original Orange Business evidence images, including JPEG fallbacks

## Verification targets

| Check | Required result |
|---|---|
| PHP/JavaScript syntax | Clean |
| Static integrity | Clean |
| Visual precision | 24 routes / 77 sections clean |
| Full responsive matrix | Clean |
| Axe | 0 critical/serious/moderate |
| Native cursor audit | Clean |
| Link/assets | 0 broken |
| Admin sweep | 48/48 clean |
| Source ↔ published mirror | Byte-identical |
| Tracked ignored files | 0 |
| Live deployments/snapshots | 1 / 1 |

## Local test authentication

Use environment-local test credentials supplied at install time. Credentials and runtime markers are intentionally excluded from version control and must never be reused in production.
