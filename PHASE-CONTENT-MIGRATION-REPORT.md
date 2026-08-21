# Content Migration — Final Report

> Status: **migration applied to the throwaway local staging DB only.**
> Parity achieved: **MISSING 0 · DIFFERENT 0 · UNMAPPED 0** (MATCH 1963).
> Frontend NOT cut over to runtime (per directive §16). Stopping for approval.

---

## A · Migrated records

| Content | Count | Destination key |
|---|---|---|
| experience jobs | **6** | `experience` (NEW) |
| story (evolution cards / prologue / identity / what / now / curious / credits / compass) | **8 sub-collections** | `story` (NEW) |
| orange case-study content (summary, strip, hotspots, roleChain, journey, wallCopy, archNodes, purpose, videoModes) | **9 sub-collections** | `orange` (NEW) |
| page content (consulting, recruiters, insights, journal, privacy, terms) | **8** | `page_content` (NEW) |
| per-page SEO | **16** | `page_seo` (NEW) |
| home sections (hero, clients, capabilities, work, thinking, journey, ai, focus, contact) | **9** | `sections` (enriched) |
| projects (published normalized; drafts untouched) | 3 of 6 | `projects` |
| articles (published normalized; drafts untouched) | 6 of 8 | `articles` |
| clients (media normalized) | 16 | `clients` |
| settings + nav | 2 | `settings`, `nav` |

**Total records migrated: 6 experience + 8 story + 9 orange + 8 page-content + 16 SEO + 9 sections + 3 projects + 6 articles + 16 clients + 2 site = 83 records (plus nested sub-items).**

## B · Migrated fields

The parity checker compares every leaf: **1,963 static leaves are byte-identical** between the static snapshot and the adapted runtime content. 12 leaves are classified DERIVED (renderer-derived, not CMS content — see Q).

## C · Missing content resolved

The five collections Phase 3 reported as having "no CMS equivalent" are now represented in `content_store`:
`experience`, `story`, `orange`, `pages` (via `page_content`), and per-page `seo` (via `page_seo`). All copied verbatim from the frontend (no rewriting).

## D · Conflicts discovered

1. **Project status** — CMS `status: "published"` for BPCL/Army vs frontend `status: "coming-soon"` (they render "coming soon" stubs). The CMS already had a `comingSoon: true` flag on both — **not a real conflict**, just two fields. Adapter derives frontend status from `comingSoon`.
2. **Media path** — CMS `media/…` (DAM, files absent) vs frontend `assets/…` (files present). **Conflict resolved to `assets/`** (see G).
3. **Article slug** — CMS `technology-should-feel-human` vs live URL `essay-technology-should-feel-human`. **Resolved to the live URL form** (`<kind>-<slug>`, see F).
4. **Article body** — CMS single `body` string vs frontend `paragraphs[]`. **Resolved to `paragraphs`** (canonical; see §3C below).
5. **Nav "Social" footer column** — duplicated `settings.socials`. **Resolved**: socials live only in `settings.socials`.
6. **Social identity** — CMS `id: s1…s5` vs frontend `icon: linkedin…`. **Resolved to semantic icon ids**.
7. **Extra CMS records** — CMS has 6 projects (2 draft + 1 scheduled) and 8 articles (1 draft + 1 review) beyond the frontend's 3/6. **Not a conflict** — these are legitimate unpublished records, correctly excluded by the published-only API (reported as EXTRA, documented, not deleted).

## E · Conflicts resolved

All 7 above, resolved deterministically in the migration. No copy was rewritten; the only changes are structural (paths, slugs, field shapes, identity names).

## F · Slug normalization

**Canonical convention:** article slugs = `<kind>-<seed-slug>` (`essay-` / `journal-` prefix), matching the live URLs. Project slugs = slugified titles (already canonical for prj-1; **filled** the missing slugs for prj-2 (`intuitive-experiences-for-industrial-environments`) and prj-3 (`immersive-solutions-for-the-indian-army`)). The apostrophe case was preserved: `essay-ai-isnt-replacing-creativity` (not `isn-t`) — the extractor matches by the seed slug, never re-derives from the title.

## G · Media normalization

**Canonical media reference = `assets/`** (the Vite build's public asset root — where the files actually live and are served). All CMS `media/…` references were normalized to `assets/…`. No files were copied or duplicated. Full reference map (45 references, **0 missing**, with MIME + dimensions) in **`MEDIA-MAP.md`**.

## H · SEO migration

16 per-page SEO records (home, story, portfolio, case-studies, experience, orange, contact, consulting, recruiters, insights, journal, search, sitemap, privacy, terms, 404) moved from the TS modules into `page_seo`, each a full `SeoData` (meta title/description/canonical/robots/OG title/description/image/jsonLd). **Article SEO and coming-soon SEO are derived** at render time by `articleSeo()`/`comingSoonSeo()` — not stored (documented, classified DERIVED). `SITE_ORIGIN` remains config.

## I · Experience migration

6 jobs → `experience` key, structured records with `id`, `order`, `status`, `company`, `role`, `roleSub`, `date` (range), `location`, `image`, `summary`, `disciplines` (technologies/skills), `responsibilities`, `moreResponsibilities`, `lead`, `last`. The frontend has no separate "achievements" field — responsibilities/moreResponsibilities serve that role (noted, not invented).

## J · Story migration

8 sub-collections → `story`: `evolutionCards` (8 acts), `prologue`, `identity` (statement/beats/question/portrait/numbers/facts/credo/zoomLabels/zoomImage), `what`, `now`, `curious`, `credits`, `compassActs`. Copy preserved verbatim (including the curly-apostrophe variants and the `duo`/`mark`/`system` fields).

## K · Orange migration

9 sub-collections → `orange`: `summary`, `projectStrip`, `hotspots` (4), `roleChain` (6), `journey` (7), `wallDefaultCopy`, `archNodes` (7), `purpose` (6), `videoModes` (4). `withBaseSrcset` stays a frontend helper (renderer). ORANGE_SEO lives in `page_seo.orange`.

## L · Migration script location

- **`frontend/scripts/extract-migration.ts`** — reads the canonical frontend content + `avos-data/site.json`, emits `avos-data/migrated-content.json` (the complete canonical `content_store` target).
- **`avos-php/backend/scripts/migrate-content.php`** — reads the target, applies it idempotently/transactionally/versioned; `--dry-run` reports per-key CREATE/UPDATE/SKIP/MISSING SOURCE/INVALID MEDIA/INVALID RELATIONSHIP with no writes.

## M · Dry-run result

```
settings/UPDATE · nav/UPDATE · sections/UPDATE · projects/UPDATE · articles/UPDATE ·
clients/UPDATE · experience/CREATE · story/CREATE · orange/CREATE ·
page_content/CREATE · page_seo/CREATE
→ 11 keys (6 UPDATE + 5 CREATE), 0 INVALID MEDIA, 0 INVALID RELATIONSHIP
```
Re-run after apply: **0 writes (11 SKIP)** — idempotent.

## N · Database backup result

- `mysqldump` (single-transaction) → `avos-php/storage/backups/db-pre-migration-*.sql.gz` (local).
- Full `content_store` export → `storage/backups/content-pre-migration.json` (local).
- Git tag `phase-migration-backup`.
- **Hostinger production DB backup remains a manual hPanel step** (no host access from here) — not performed, not fabricated.

## O · Git checkpoints

Tags: `phase-migration-start` (→ 81c4bc0), `phase-migration-backup`. Commits on `staging-react-vite` (local, not pushed). `main`, production, and rollback tags untouched.

## P · Parity result

```
collection  MATCH  MISSING  EXTRA  DIFFERENT  DERIVED  UNMAPPED  leaves
home        238    0        0      0          0        0         238
chrome      97     0        0      0          1        0         98
projects    88     0        0      0          0        0         88
articles    637    0        0      0          11       0         648
experience  239    0        0      0          0        0         239
story       195    0        0      0          0        0         195
orange      237    0        0      0          0        0         237
pages       197    0        0      0          0        0         197
seo         35     0        0      0          0        0         35

TOTALS → MATCH 1963 · MISSING 0 · EXTRA 0 · DIFFERENT 0 · DERIVED 12 · UNMAPPED 0
```

**Target achieved: MISSING = 0, DIFFERENT = 0, UNMAPPED = 0.** Full field-level report in `PARITY-REPORT.txt`.

## Q · Remaining differences

**DERIVED = 12** — fields that are renderer-derived or build-time config, not CMS content (excluded from the CMS-managed target by design):
- `articles.ARTICLES[*].seo` ×6 — derived by `articleSeo()` at render time.
- `articles.ARTICLES_BY_SLUG`, `ESSAYS`, `JOURNAL`, `ESSAY_INDEX`, `JOURNAL_INDEX` ×5 — derived index/lookup exports.
- `chrome.CHROME.brandHref` ×1 — build-time chrome (home link `index.html`).

These are explicitly documented; switching them to runtime-derived is a later-phase decision (making the content modules store-backed), not part of this migration.

## R · Rollback procedure

1. **Content**: every write was versioned via `ContentStore::put` → restore any key with the existing Versions UI / `ContentStore::restore(key, version)`.
2. **Full DB**: restore `db-pre-migration-*.sql.gz` (mysql CLI).
3. **Content only**: `ContentStore::put()` each key from `content-pre-migration.json`.
4. **Code**: `git checkout phase-migration-start` (the migration is fully additive; the adapter/loader/parity changes are not wired into any route).
5. **Frontend**: static `src/content/*.ts` unchanged — remains the fallback/rollback.

---

## Content-model decision (§4)

Per the Phase 2 architecture, **no new tables were created** — everything here is
**CONTENT** and belongs in `content_store` (the CMS's authoritative content
store). Layout, components, templates, and design tokens were **not** touched:
- `experience` / `story` / `orange` / `page_content` / `page_seo` → `content_store` (new keys).
- Home sections → `content_store.sections` (enriched, existing key).
- Presentation hints (`num`, `tag`/`kicker`, `index`, `parallax`, `feature`, title-array splits) are carried alongside the copy for faithful parity and flagged for future reclassification into the builder's page/node model — they are **not** silently dropped.
