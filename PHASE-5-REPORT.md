# PHASE 5 — React Admin Foundation: Final Report

> Status: **React admin foundation built, tested in a real browser, committed.
> NOT pushed to GitHub** — pushing requires a fine-grained PAT (none was
> supplied this turn; see §U). Public website + legacy admin verified unaffected.

---

## A · Phase 5 architecture

A standalone React 19 + TypeScript + Vite SPA at `admin/`, mounted at `/os/`
(hash-routed → zero `.htaccess` changes, Hostinger-safe), coexisting with the
legacy PHP admin at `/admin/`. Clear module boundaries:

```
admin/src/
├── api/        typed client + module APIs (auth/content/system)
├── auth/       AuthProvider (existing backend session)
├── permissions/usePermissions (RBAC UX; backend authoritative)
├── state/      ui (theme/toasts/palette/sidebar) + editor (save-state)
├── hooks/      useApi (server state) + useDebounce + useContentDoc
├── ui/         primitives (buttons/inputs/toggle/badge/table/dialog/toast)
├── components/ command palette, data table, save-state badge
├── layout/     AppShell (topbar + sidebar + main + env badge + user menu)
├── navigation/ nav model (permission-gated)
├── modules/    dashboard, projects, articles, clients, experience, pages,
│               navigation, media, settings, revisions
└── features.ts capability/feature-flag foundation (future modules gated OFF)
```

## B · Files created

51 new files under `admin/` (app shell, 11 modules, API client, auth/RBAC/state
providers, design tokens, 2 serve/test scripts, tests) + `tests/phase5-admin-verify.mjs`.

## C · Files modified

`avos-php/backend/controllers/ApiController.php` — **additive only**: added the 5
Phase-4 migrated collections (`experience`, `story`, `orange`, `page_content`,
`page_seo`) to `saveContent()`'s `$allowed` list, so they are editable through
the same `content.write` path. No other backend change.

## D · Files deleted

None.

## E · Admin routes

`/os/#/login` · `/dashboard` · `/projects` · `/projects/:slug` · `/articles` ·
`/articles/:slug` · `/clients` · `/experience` · `/pages` · `/navigation` ·
`/media` · `/settings` · `/revisions`. Public website routes untouched.

## F · API endpoints consumed (all existing, none changed/broken)

`GET /api/session` · `POST /api/auth/login` · `POST /api/auth/logout` ·
`GET /api/status` · `GET /api/content` · `PUT /api/content` ·
`GET /api/versions/{key}` · `POST /api/versions/{key}/restore` ·
`GET /api/media` · `GET /api/search` · `GET /api/flags` · `GET /api/deployments`.

## G · Authentication

Reuses the existing backend session (`AuthProvider` bootstraps `GET /api/session`,
captures CSRF; `Login` posts `/api/auth/login`). Session expiry/401 → `ApiError`
(`UNAUTHENTICATED`) → `setOnUnauthorized` clears the session and the shell
redirects to `/login`. No parallel auth system.

## H · RBAC

Frontend gating only (`usePermissions.can()` + `Guard` component on routes;
nav items filtered by permission). Backend remains authoritative — every
mutation is re-validated server-side. CSRF header injected on all mutations.

## I · Dashboard

Real data: content counts (projects/articles/clients/pages) from `GET /api/content`,
website health from `GET /api/status`, recent deployments from `GET /api/deployments`,
quick actions. Unavailable metrics render "Unavailable" — nothing fabricated.

## J · Content modules

- **Projects**: list (search/filter/sort/status/featured) + full editor (save via `PUT /api/content` with optimistic-concurrency `base_versions`).
- **Articles**: list + editor (title/slug/category/date/status/excerpt + body→paragraphs).
- **Clients**: list + add/edit dialog (name/industry/logo).
- **Experience**: list + add/edit dialog (role/company/date/location/summary).
- **Pages**: read-only list (title/slug/template/status/SEO presence) — visual editing is Phase 6.
- **Navigation**: edit primary links + CTA (saves `content_store.nav`).
- **Media**: library foundation (list/search/filter/preview metadata from `/api/media`).
- **Settings**: general/brand/SEO/social (saves `content_store.settings`).
- **Revisions**: pick a collection → list versions → restore (existing `versions` system).

All saves are **draft-only** (`publish:false`); publishing remains a separate
deliberate action via the existing publish path.

## K · Media / L · Settings / M · Revisions

See §J — all built on real endpoints with real data.

## N · Command palette

⌘/Ctrl+K opens the palette; searches navigation + real actions (Dashboard,
Projects, Journal, Media, Settings). No "coming soon" entries.

## O · Tests

- `admin/tests/foundation.test.ts` — **16 unit tests** (permissions/RBAC, save-state,
  feature flags, API client incl. CSRF injection + error envelopes + 401 handling). All pass.
- `tests/phase5-admin-verify.mjs` — **19 browser checks** (Playwright): auth gate,
  login, shell/nav, dashboard, projects list + editor, 6 content modules, command
  palette, theme toggle, logout, public-site regression. All pass.

## P · Browser verification

Real Chromium: login → dashboard → navigation → every module renders **real**
content (verified specific strings) → command palette → theme → logout → public
homepage still renders.

## Q · Performance

Admin bundle **232 KB / 70.6 KB gzip** (route-agnostic single SPA; vendor chunk
split). No per-module code-splitting yet (all 11 modules in one entry — fine at
this size; the builder will introduce lazy routes). Public site unaffected.

## R · Public website regression results

- `frontend` typecheck + build (25 routes): pass.
- Parity: **MISSING 0 · DIFFERENT 0 · UNMAPPED 0** (DERIVED 19).
- Content-layer tests 25/25; backend bridge test 0 failures.
- Phase-4 browser verify (public site): 8/8.
- Legacy PHP admin untouched and still served.

## S · Git commits

`<hash>` — feat(admin): React admin foundation (app shell, API client, auth/RBAC,
dashboard, content modules, media/settings/revisions, command palette, tests).

## T · Git tags

`phase5-admin-foundation-start` (→ 3a63695) · `phase5-admin-foundation-complete` (→ this commit).
Rollback points preserved: `phase4-runtime-cutover-complete`, `hostinger-backup-2026-08-21`.

## U · GitHub branch / V · push result / W · remote verification

**NOT PUSHED.** The deployment branch is `staging-react-vite` (the CI workflow
`deploy-react-vite-staging.yml` builds and force-pushes `staging-react-vite` →
`hostinger`). Pushing requires a fine-grained PAT with **Contents: read+write**
and **Workflows: read+write** — none was supplied this turn, and `origin` was
stripped from the sandbox between turns.

## X · Hostinger deployment status

**NOT AUTOMATICALLY VERIFIED** — no push occurred, so no CI run, and no Hostinger
deployment. This is reported explicitly, not claimed.

## Y · Remaining limitations (honest)

1. **Not pushed/deployed** (blocked on PAT + the pre-existing staging-DB/`AV_ENC_KEY`
   blocker for the backend).
2. **No route-level code-splitting** in the admin yet (single entry at 232 KB —
   acceptable now; builder will lazy-load).
3. **Command palette** lists navigation + core actions only; project/article
   creation via palette is not wired (create flows live in the modules).
4. **Global search** UI is not exposed yet — the typed `contentApi.search()`
   abstraction exists and the backend `/api/search` is verified, but no search
   surface is rendered this phase (the palette covers navigation).
5. **Future modules** (Visual Builder, WebGL, AI, Booking/CRM, Design System,
   Custom Content) are **explicitly NOT implemented** — gated OFF in `features.ts`,
   absent from navigation (no dead links, no "coming soon" UI).

## Z · Rollback procedure

Primary: `git checkout phase4-runtime-cutover-complete` (the admin is fully
additive; the only backend change is the additive `$allowed` list). Secondary:
`phase5-admin-foundation-start`. Legacy `/admin/` was never touched.
