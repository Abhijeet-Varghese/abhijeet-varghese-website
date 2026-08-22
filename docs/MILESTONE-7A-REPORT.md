# MILESTONE 7A — STAGING ARCHITECTURE

> **Status: repository-side READY · Hostinger-side BLOCKED (information required).**
> No deployment, no push of `main`/`hostinger`, no legacy moves. The safe
> React/Vite staging pipeline is built and locally validated; the only remaining
> step is the Hostinger-side configuration, which requires information this
> repository cannot provide.

---

## CURRENT DEPLOYMENT — PRESERVED

```
main  →  .github/workflows/deploy-staging.yml  →  subtree abhijeetvarghese/  →  hostinger (force)
```

The legacy workflow (`deploy-staging.yml`) is **byte-for-byte untouched**
(0-line diff vs base) and remains the rollback path. `hostinger` branch is
untouched. `abhijeetvarghese/` is untouched.

## NEW DEPLOYMENT — READY (repo side)

```
staging-react-vite  →  .github/workflows/deploy-react-vite-staging.yml
   → npm ci + typecheck + Vite build
   → validate (25 routes + secret scan + leak check)
   → package frontend/dist + avos-php backend
   → force-push NEW branch `staging-react-vite-deploy`  (never hostinger, never main)
   → upload tarball artifact (SFTP fallback)
```

## WORKFLOW

- **New workflow:** `.github/workflows/deploy-react-vite-staging.yml`
- **Trigger:** push to `staging-react-vite` only (+ `workflow_dispatch`)
- **Deployment target:** new branch `staging-react-vite-deploy` (NOT `hostinger`)
- **Secrets used:** none (implicit `GITHUB_TOKEN`, `permissions: contents: write`)

## BRANCHES

- `staging-react-vite` — created locally from `feat/react-ts-vite-migration`
  (commit `6360814`); contains the full migration + the new workflow. **Not yet
  pushed** (per spec: hold until Hostinger config confirmed + your go-ahead).
- `main`, `hostinger`, `arena/*` — untouched.
- `staging-react-vite-deploy` — will be created by the workflow on first run.

## FRONTEND

- **React:** PASS · **TypeScript:** PASS (`tsc --noEmit`) · **Vite:** PASS
- **25 routes:** PASS (`find frontend/dist -name '*.html'` = 25, all key files present)

## BACKEND

- **PHP:** PASS locally (8.4, all 7 changed files lint clean; `pdo_mysql/curl/mbstring/gd` present)
- **MariaDB:** PASS locally (11.8; migrations 27 + canonical seed; lead persisted)
- **Admin:** PASS — the package **includes** `public_html/admin/` + `api/` + `install/` + `media.php` (verified in the package dry-run). Whether the backend is *already* installed on Hostinger staging is **unknown** — the package ships it regardless, so it is complete either way.

## PUBLISH PIPELINE

`PublishEngine::publish()` → `publishViteBuild()` in **vite mode** (auto-detected).
Verified: `PUBLISH OK mode=vite pages=13 articles=6` **with `abhijeetvarghese/`
moved away** — the pipeline does not read the legacy frontend. `AV_VITE_DIST` =
`frontend/dist`, `AV_FRONTEND_MODE` auto-detects `vite`.

## BOOKING

PASS — `POST /api/public/lead` → MariaDB (`status=new, score=65`), honeypot
spam-drop, empty-name → 422. No Calendly, on-site submit, pending-approval copy.

## CALENDAR

**BLOCKED (unchanged from M7).** No Google/Microsoft Calendar provider code and no
`/api/public/availability` endpoint exist in this backend. The custom calendar runs
in static mode (time optional). Live provider free/busy + event creation is **not
implemented** — flagged, not faked.

## SEO

PASS (repo side) — canonical/title/description/OG/Twitter/JSON-LD intact; staging
`noindex` is a **Hostinger-side** step (see required config below). The staging
package uses the same absolute canonicals as production, so staging **must** be
blocked from indexing at the host (robots/noindex/`.htaccess`) — documented as a
required Hostinger step, not silently baked into the shared build.

## SECURITY

PASS — secret scan clean (no keys/tokens/credentials in `dist`), no dev/leak files
(`*.php/*.ts/*.map/.env*`), no PHP tags in static HTML, `config.local.php` excluded
from the package (verified absent in the dry-run).

## PACKAGE DRY-RUN

Simulated the workflow's assemble step: package tree contains `backend/`,
`includes/`, `database/`, `storage/` (empty writable skeleton), `public_html/`
(admin/api/install/media.php/.htaccess), and `public_html/site/` = 25 Vite routes
with hashed assets. **No** `config.local.php`, **no** legacy `css/`/`js/`.

## VALIDATION NOTES (honest)

- `git diff --check` reports trailing whitespace **only** in verbatim-copied,
  locked content (binary Resume PDF, OFL license `.txt`, and the ported
  `styles.css`) — not introduced by the migration, and altering them would violate
  "do not modify content/design." Left as-is.

## PRODUCTION

**NOT TOUCHED.** No push to `main`/`hostinger`, no `public_html/site/` change
(reverted), no DNS, no credential changes.

## HOSTINGER

**NO DEPLOYMENT YET.**

## LEGACY

`abhijeetvarghese/` — **PRESERVED** (rollback safety net; next milestone moves it).

---

## FINAL VERDICT

**Repository-side: READY.** **End-to-end: BLOCKED — Hostinger-side information required before any push/deploy:**

1. **Does the existing Hostinger Git deployment pull `hostinger` into staging or
   production?** (audit could not determine this — it is not encoded in the repo)
2. **Can a second Hostinger Git deployment be created** pointing at the new
   `staging-react-vite-deploy` branch (or must deployment be SFTP/FTP)?
3. **Staging domain + document root** — confirm `next.abhijeetvarghese.com` (or the
   actual staging domain) and that the root `.htaccess` rewrite model (`/` → `site/`)
   applies.
4. **Staging MariaDB** — a dedicated staging database must be provisioned; the
   package must NOT be pointed at the production DB. (`BLOCKED — STAGING DATABASE
   REQUIRED` until confirmed.)
5. **Staging `config.local.php`** — staging DB credentials + `AV_ENC_KEY` +
   `AV_FRONTEND_MODE=vite` must be set on the host (never committed).
6. **Staging SEO isolation** — robots/noindex must be enforced at the host so
   staging does not compete with production.

None of the above can be determined from this repository. Once those are answered
by someone with Hostinger access, the branch can be pushed (`staging-react-vite`)
and the workflow will build + package + publish to `staging-react-vite-deploy`
without touching `hostinger` or `main`.

**STOP.** No deploy. No delete. No move of the old frontend. No push of `main`.
No push of `hostinger`.
