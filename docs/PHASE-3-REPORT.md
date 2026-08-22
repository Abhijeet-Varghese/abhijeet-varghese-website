# PHASE 3 — Runtime Content Bridge: Final Report

> Status: **implementation complete on staging branch; NOT pushed to Hostinger.**
> The pipeline (MariaDB `content_store` → `GET /api/v1/content` → React loader
> → components) is proven end-to-end in a throwaway local environment. The
> current `content_store` **does not yet reproduce the site** — see §F (parity)
> and §M (limitations). **Stopping here for approval; no Phase 4 work done.**

---

## A · Files changed

**Backend (avos-php):**
- `backend/core/Response.php` — added `Response::jsonCached()` (ETag + 304 +
  `public, max-age` cache headers). First cacheable response in AV OS.
- `backend/controllers/ApiController.php` — added route `GET /api/v1/content`
  → `v1Content()`, plus `contentRevision()` and `publicSettings()` helpers.
- `tests/content_bridge_test.sh` — endpoint test (envelope/structure/published-only/
  ETag-stability/304/leak-scan).

**Frontend (frontend/):**
- `src/content/types.ts` — `ContentDocument` type + `DeepPartial`.
- `src/content/static-snapshot.ts` — `STATIC_CONTENT` (PublishedSnapshot /
  StaticFallback; re-exports the existing `src/content/*` modules verbatim).
- `src/content/schema.ts` — API payload types + `validateContentPayload()`.
- `src/content/adapt.ts` — the executable content mapping (CMS → frontend).
- `src/content/loader.ts` — `ContentLoader` / `ContentCache` / `initContent()` /
  `getContent()` / `getContentState()`; fetch → validate → adapt → merge,
  deliberate fallback, timeout, deep-compact of empty values.
- `src/content/provider.tsx` — `CMSContentProvider` + `useContent()`.
- `scripts/parity-check.ts` — static ↔ runtime parity checker.
- `tests/content-layer.test.ts` — validation/adapter/loader-failure/provider tests.
- `package.json` / `package-lock.json` — added `tsx` (dev-only) to run the above.

**Docs:** `PHASE-3-CONTENT-MAPPING.md`, `PARITY-REPORT.txt`, this report.

## B · API endpoints added/changed

| Endpoint | Change |
|---|---|
| `GET /api/v1/content` | **NEW** — published-only structured content document (schema/schemaVersion/generatedAt/revision + `settings`, `navigation`, `sections`, `pages`, `projects`, `articles`, `clients`, `testimonials`, `media`, `seo`, `downloads`). ETag = SHA-256 of the content (excludes `generatedAt`, so it is stable until content changes). `Cache-Control: public, max-age=60, must-revalidate`. `If-None-Match` → 304. |
| (all others) | unchanged |

Envelope is the standard `{ ok, data, error }`. Public/private boundary: an
explicit top-level allowlist; status-bearing collections filtered to
`status === 'published'`; `settings` reduced to a public allowlist (no
`sidebarCollapsed`, no SMTP/Calendly/notifications). Drafts, leads, users,
tokens, secrets, analytics, forms, availability are never returned.

## C · Database changes

**None.** No migration was applied for Phase 3 (per your directive: the
prepared `028_builder_foundation.sql` was **not** required — the bridge reads
`content_store` + `versions` which already exist). The local throwaway DB was
seeded with `avos-data/site.json` (via `database/install.php`) purely to
exercise the endpoint; nothing was changed in the schema.

## D · Frontend architecture changes

A new **content/data layer** alongside the existing static modules:

```
GET /api/v1/content
      │ validate (schema.ts)
      ▼
adapt (adapt.ts)  ──►  ContentLoader (loader.ts)  ──►  merged ContentDocument
      │                                                    │
      └── fallback ◄── STATIC_CONTENT (static-snapshot) ───┘
                                                           │
                                    CMSContentProvider / useContent (provider.tsx)
```

- Loader: fetch (4s timeout) → validate → adapt → deep-compact empty values →
  merge over static → use. Any failure falls back to static, observably
  (`getContentState()` + console diagnostic).
- The existing `src/content/*` modules are **unchanged** — they remain the
  static fallback (Phase 3 §13). Components are **not** rewritten (§6).
- `typecheck` and the full `npm run build` (25 prerendered routes) pass
  unchanged, confirming no regression in static mode.

## E · Content mappings

Full field-by-field mapping in **`PHASE-3-CONTENT-MAPPING.md`** (the executable
form is `adapt.ts`). Highlights: `challenge→problem`, `industry→category`,
`type→kind`, `body→paragraphs`, `clients.logo→CLIENTS.logos.file` map cleanly;
`slug` prefixes, `href`, media paths, nav/CTA shape, and per-page SEO differ or
are missing. `experience`, `story`, `orange`, `pages`, `seo` have **no** CMS
equivalent.

## F · Static/runtime parity results

Full diff in **`PARITY-REPORT.txt`**. Summary:

| Collection | MATCH | MISSING | EXTRA | DIFFERENT | UNMAPPED |
|---|---|---|---|---|---|
| home | 197 | 31 | 10 | 0 | 0 |
| chrome | 78 | 4 | 6 | 10 | 0 |
| projects | 74 | 0 | 0 | 14 | 0 |
| articles | 580 | 20 | 2 | 46 | 0 |
| experience / story / orange / pages / seo | — | — | — | — | 5 collections |

**TOTALS: MATCH 929 · MISSING 55 · EXTRA 18 · DIFFERENT 70 · UNMAPPED 5
(of 1,975 static leaves).**

The pipeline is proven (content flows end-to-end and ~47% of leaves already
match byte-for-byte within the mapped collections), but **parity does not
pass**: 5 collections have no CMS source and the 4 mapped ones have
structural/value differences. This is the expected "split source-of-truth"
divergence identified in Phase 2.

## G · Route verification

- **Static mode:** `npm run build` prerenders all **25 routes** correctly
  (home, story, portfolio, case-studies, case-bpcl, case-army, orange,
  contact, consulting, for-recruiters, insights, journal, search, sitemap,
  experience, privacy-policy, terms, 404, 4 essays, 2 journal). No change from
  pre-Phase-3 build.
- **Runtime mode (visual parity):** **NOT TESTED / BLOCKED** — the current
  `content_store` cannot reproduce the site (see §F), so a runtime-mode visual
  parity pass is impossible until the content is migrated. I will not claim
  visual parity that cannot be produced. The loader is proven to *render*
  runtime content (provider test), but a full per-route runtime visual check
  is gated on content parity.

## H · Performance measurements

Measured against the local throwaway DB (PHP built-in server):

| Metric | Value |
|---|---|
| `GET /api/v1/content` payload | **54.9 KB** raw / **15.1 KB** gzipped |
| cold response time | ~4–5 ms (local) |
| `If-None-Match` 304 revalidation | ~3.3 ms (local) |
| cache behaviour | ETag (content-stable) + `max-age=60, must-revalidate` |

Payload is comfortably under the Phase-2 "small (<100 KB)" budget; a single
content document is served per page (no per-component queries). If payload
grows later, the split strategy is: keep the single document, add
`stale-while-revalidate`, and (optionally) per-collection `?collections=`
sub-resources — **not needed now**.

## I · Failure / fallback tests

Automated in `tests/content-layer.test.ts` (24 checks, all pass) and
`tests/content_bridge_test.sh` (7 checks, all pass):

| # | Case | Result |
|---|---|---|
| A | API works | runtime content applied ✓ |
| B | API unavailable (network error) | static fallback ✓ |
| C | API returns malformed data | fallback + diagnostic ✓ |
| D | API returns empty content | site stays populated (static), never blank ✓ |
| E | database unavailable (server 500) | clean error envelope + client fallback ✓ |
| F | stale cached content | served from cache within TTL (no refetch) ✓ |
| G | unpublished content | excluded by server AND re-checked client-side ✓ |
| H | invalid media reference | no crash; fallback-safe ✓ |
| — | hung fetch | aborted at 4s timeout → fallback ✓ |

Server-side DB-down verified manually: `GET /api/v1/content` returns
`{ok:false, error:{code:"SERVER_ERROR", request_id}}` (message sanitized when
`AV_DEBUG=false`).

## J · Publishing behavior

The runtime system is **compatible with the existing publishing engine** — no
publish redesign. Exact flow:

1. **Edit → Save draft:** `PUT /api/content` with `publish:false` writes to
   `content_store` + a `versions` snapshot, but does not publish.
2. **Publish:** `POST /api/publish` → `PublishQueue` → `PublishEngine` rebuilds
   the static shell AND commits a `deployments` snapshot (atomic + reversible).
3. **Published content version changes:** every `ContentStore::put()` bumps the
   per-key `versions` version; `revision` in `/api/v1/content` = `MAX(version)`.
4. **Cache invalidation:** the endpoint ETag is the SHA-256 of the content —
   any content change yields a new ETag, so the next request revalidates
   (304 → fresh). The `max-age=60` bounds staleness for non-revalidating
   clients.
5. **Frontend receives new content:** next page load fetches `/api/v1/content`,
   gets the new ETag/payload, adapts, and renders it; `ContentLoader.revalidate()`
   is available for an explicit refresh (e.g. after a publish event).

Rollback remains the existing `deployments` rollback + `versions` restore.

## K · Git commits

Branch `staging-react-vite` (local; **not pushed** — no PAT supplied this turn):

- `phase3-start` tag → `5e2f16c` (pre-implementation checkpoint)
- `0fae250` — **feat(api)**: `GET /api/v1/content` bridge + `jsonCached()` + endpoint test (`phase3-api-bridge` tag)
- `…` — **feat(frontend)**: content layer (loader/provider/schema/adapt/snapshot) + parity checker + tests (this commit)

## L · Rollback procedure

- **Code:** revert the two commits (or `git checkout phase3-api-bridge~` /
  `phase3-start`). The backend endpoint is additive; the frontend layer is
  additive (not wired into any route). No route, component, or existing
  behavior was modified.
- **Runtime:** the static snapshot is the built-in rollback — if `/api/v1/content`
  is unavailable/invalid, the site renders the static content exactly as today.
- **Database:** nothing changed; no migration to revert.
- **Tags:** `hostinger-backup-2026-08-21` and `archive-arena-apple-experiment`
  are untouched; `main` and production are untouched.

## M · Remaining limitations (honest)

1. **Content parity fails** — the current `content_store` lacks `experience`,
   `story`, `orange`, `pages`, and per-page `seo` content, and the mapped
   collections have structural/value differences (slugs, media paths, body
   format, nav/CTA shape). Closing this is a **data-migration + seed** task.
2. **Components still read static imports.** The loader/provider/parity layer
   is complete and proven, but the ~30 components are not yet switched to
   `useContent()` — that switch is gated on content parity (Phase 2 migration
   step 6) and was deliberately **not** done this phase (§6 "no component
   rewrite").
3. **Runtime visual parity NOT tested** (see §G) — cannot be produced until
   content parity exists; not fabricated.
4. **Backend not live on staging** — the pre-existing blocker (no staging
   MariaDB/`config.local.php`/`AV_ENC_KEY` on Hostinger; no host access from
   here). `STAGING-BACKEND-RUNBOOK.md` still applies.
5. **Derived exports** (`ARTICLES_BY_SLUG`, indexes, the route registry) stay
   static until the content modules become store-backed.
6. **`.html` URL migration** deferred by design (unchanged).

---

**Phase 3 conclusion:** the objective — *prove the existing website can be
CMS-driven safely before building the visual builder* — is **partially
demonstrated**: the pipeline is proven end-to-end and fails safe, but the
website **cannot yet be** CMS-driven because the CMS content does not yet
contain the site content. **Stopping for your decision** on how to reconcile
the content (migrate/seed `content_store` with the full site content), before
any Phase 4 work.
