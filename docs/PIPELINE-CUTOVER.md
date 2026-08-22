# AV OS — Frontend Pipeline Cutover (Vite mode)

This documents the Phase 5 route-ownership map and Phase 19 rollback procedure
for the React/Vite cutover.

## Route ownership (no ambiguity)

| Path | Owner |
|---|---|
| All 25 public routes (`/`, `/story.html`, `/portfolio.html`, … `/experience-design/orange-business-executive-briefing-center/`) | **Vite build** (`frontend/dist/`) |
| `/api/*` (lead, submit, analytics, auth, admin endpoints) | **PHP** (`avos-php/public_html/api/`) |
| `/admin/*` | **PHP** (`avos-php/public_html/admin/`) |
| `/install/*` | **PHP** (`avos-php/public_html/install/`) |
| `/media/*` | **PHP** (`avos-php/public_html/media.php`) |
| `sitemap.xml`, `robots.txt`, `search-index.json` | **Vite build** (static artefacts in `dist/`) |

Backend endpoints (booking APIs, calendar providers, auth, email, AI, SEO
generation) remain PHP + MariaDB — unchanged.

## New pipeline (Vite mode)

```
CMS (MariaDB content_store)
   ↓  export-snapshot.php  (published-only JSON)
frontend/src/content/*.ts   (typed snapshot, committed)
   ↓  npm run build         (build-time only — NOT on Hostinger)
frontend/dist/               (complete static site, 25 routes)
   ↓  PublishEngine::publishViteBuild()  (validate → atomic swap → verify → rollback)
public_html/site/            (generated public site)
```

- `AV_FRONTEND_MODE` = `vite` (auto-detected when `frontend/dist/index.html` + `assets/` exist).
- `AV_VITE_DIST` = `frontend/dist` (env-overridable).
- `publish()` auto-delegates to `publishViteBuild()` in Vite mode; legacy renderers
  remain for backward compatibility (force with `AV_FRONTEND_MODE=legacy`).

## Rollback procedure (Phase 19)

A failed Vite build never produces a partially-published site — `publishViteBuild()`
reuses the existing atomic-swap + auto-rollback machinery:

1. **Atomic swap** — the validated build is staged, then `rename()`-swapped into
   `public_html/site/`. The previous site is kept as `storage/cache/site-old-*`
   until the new build passes post-publish verification.
2. **Auto-rollback** — if post-publish verification fails, `DeploymentModel::rollback()`
   restores the previous published site.
3. **Fallback** — flip `AV_FRONTEND_MODE=legacy` (env) to revert to the pre-migration
   PublishEngine HTML renderers at any time; no code change required.

## Legacy decision (Phase 18)

`abhijeetvarghese/` is now **SAFE TO REMOVE** in Vite mode (proven by the isolation
test: doctor + publish + snapshot export all succeed with it moved away). It is
**kept in this commit** because:
- it is still the legacy-mode fallback source, and
- physical removal is gated behind the staging deployment (per milestone spec).

Recommended next stage: after staging QA passes, remove `abhijeetvarghese/` +
`site-template/` in a separate controlled commit and set `AV_FRONTEND_MODE=vite`
permanently (drop the legacy renderers later).
