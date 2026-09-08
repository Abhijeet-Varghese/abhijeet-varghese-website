# AV OS — Template Registry, Preview & Asset Manifest (Phase A)

This documents the publishing safety rails added in **Phase A**. They make the
CMS a safe home for bespoke creative templates (the Recruiters page is the
reference implementation) without forcing exceptional pages into generic blocks.

---

## 1. The single source of truth — `TemplateRegistry`

`backend/publish/TemplateRegistry.php` is the **only** place that knows which
templates the publisher can render. It defines two families:

- **Page templates** — entries in the `pages` content collection (key = the page
  record's `template` field).
- **Project templates** — entries in the `projects` collection (key =
  `caseStudyTemplate`, with the legacy `prj-1 → orange-business-ebc` default).

Each entry declares:

| field | meaning |
|---|---|
| `key` | exact value stored in CMS content (`template` / `caseStudyTemplate`) |
| `display` | human label for the admin selector |
| `kind` | `static` (canonical file in `publish/templates/`), `method` (dedicated engine method), or `blocks` (generic block renderer) |
| `renderer` | `PublishEngine` method name (null for blocks) |
| `file` | canonical template filename (static kind only) |
| `bodyClass` | optional body class (informational) |
| `dedicated` | true for static/method — these **never** silently fall back to blocks |
| `assets` | `{css:[…], js:[…]}` page-scoped asset manifest (relative to the site root) |

**Registered page templates:** `Recruiters, About, Experience, Portfolio,
Contact, Blog Index, Page`.
**Registered project templates:** `orange-business-ebc, case-study, coming-soon`.

Both `PublishEngine` and the admin API (`GET /api/templates`) read from this one
class — there is no second, drift-prone list.

---

## 2. Renderer dispatch (PublishEngine)

`PublishEngine::renderPage()` flow:

```
page record (template field)
   → TemplateRegistry::page($key)          // null → throw (loud failure)
   → TemplateRegistry::validatePage($key)  // renderer + canonical file + assets exist
   → dedicated? → call registry renderer method (renderRecruiters, renderAbout, …)
   → otherwise → generic block renderer (Page / Contact / Blog Index)
```

Case studies use the same pattern via `TemplateRegistry::resolveProjectKey()` +
`validateProject()` inside `renderCaseStudy()`.

An **up-front validation pass** runs at the start of `buildSite()` for every due
page and project, before any file is written, so a bad template aborts into the
staging build only.

### Fallback behavior (the fix)

- **Unknown / misspelled dedicated template → publish throws.** It does **not**
  downgrade to generic blocks. Error names the page title, slug, the bad
  template value, and the list of valid templates.
- Because publish is **atomic** (build → validate → `rename` swap → health check
  → auto-rollback), a failed build never replaces the live site.
- Generic `blocks`/`Page`/`Contact`/`Blog Index` remain the intentional
  fallback for ordinary content pages.

---

## 3. Real preview (same renderer as publish)

`GET /api/preview/page/{slug}` — **requires authentication** (`content.read`).

It instantiates the same `PublishEngine` on the current content document and
calls **`renderPage()`** — the exact method a publish uses. There is no forked
`renderForPreview()`; preview and publish share one rendering path. Preview-only
wrapping (`wrapPreview()`) adds, without touching renderer output:

- `<base href="/">` so relative `css/js/fonts/images` resolve on whichever host
  served the preview (dev or prod), keeping asset parity with the published page;
- `<meta name="robots" content="noindex,nofollow,noarchive">` + `X-Robots-Tag`
  response header + `Cache-Control: no-store` — drafts are never indexed/cached;
- analytics is **not** run in preview (the analytics snippet is only injected
  during the on-disk publish; the endpoint also defensively neutralises any
  `api/analytics/track` reference).

**Parity:** the rendered `<main>` for preview and publish is byte-identical;
`<title>`, canonical, Open Graph and JSON-LD are emitted by the same code. The
only intentional differences are the preview security/asset signals above.

The admin **Pages → Info** modal now has a **“Preview (publisher render)”**
button that opens this URL, and its **Template** dropdown is populated from
`GET /api/templates`. An unrecognised template is shown as
`⚠ <value> — unrecognised template` and is never silently rewritten.

Security notes:
- Preview is behind session auth; unauthenticated requests get **401**.
- Drafts are allowed for editors (previews show current/draft content) but the
  response is noindex/no-store and not publicly reachable.
- No temporary files are written; preview renders in-memory only.

---

## 4. Per-page asset / head manifest

Global assets are owned by the shell/head:
- `css/styles.css` and `js/main.js` are emitted for every page by
  `head()` / `shell()`.

Page-scoped assets are declared **once**, in the registry entry's `assets`
(`css[]`, `js[]`). A static template renders them through placeholders:

- `{{PAGE_CSS}}` → `<link rel="stylesheet" href="css/<file>?v={hash}">`
- `{{PAGE_JS}}`  → `<script src="js/<file>?v={hash}" defer></script>`

The hash is the same **content-based `assetVersion()`** used for global assets
(sha256 over every file under `site-template/css` and `…/js`), so page assets are
cache-busted deterministically and are never duplicated with global ones.

The registry also **validates** that every declared asset exists in the
canonical `site-template/` asset tree — a missing page CSS/JS file fails the
build loudly instead of 404-ing on the live site.

Recruiters manifest (declared in the registry, resolved at publish):

| type | file |
|---|---|
| css | `css/for-recruiters.css` |
| js  | `js/for-recruiters.js` |

The canonical template `backend/publish/templates/for-recruiters.html` now uses
`{{PAGE_CSS}}` / `{{PAGE_JS}}` instead of hard-coding the includes.

---

## 5. Publish validation & failure behavior

`PublishEngine::publish()`:

1. Builds into a unique staging dir (validates all templates first).
2. `validateBuild()` — required files, every due page/article/case exists,
   **no unresolved `{{…}}` placeholders or leaked PHP**, no PHP files in output.
3. `internalLinkCheck()` — broken internal links abort the build.
4. Atomic `rename` swap; on failure the previous site is restored.
5. Post-publish health check with automatic rollback + notification.

A template failure (unknown key, missing renderer method, missing canonical
file, or missing declared asset) throws during step 1/2 with a precise message;
production is untouched.

---

## 6. How to add a future bespoke template

```
1. Create the canonical markup
   backend/publish/templates/<page>.html
   Use placeholders: {{SITE_URL}} {{ASSET_VERSION}} {{STRUCTURED_DATA}}
                     {{SITE_CHROME}} {{SITE_FOOTER}} {{PAGE_CSS}} {{PAGE_JS}}
                     ({{ANALYTICS}} left empty — analytics auto-injects)

2. Put page assets in the frontend (abhijeetvarghese/css, js) — sync-frontend
   copies them into site-template/ (they are versioned + validated from there).

3. Add a renderer method to PublishEngine, e.g. render<Name>()
   (loads the template, builds STRUCTURED_DATA, substitutes placeholders,
    injects {{PAGE_CSS}}/{{PAGE_JS}} via pageAssetTags('<Key>','css'|'js')).

4. Register it in TemplateRegistry::pageTemplates()
   key / display / kind:'static' / renderer / file / dedicated:true / assets{}.

5. Set the CMS page record's `template` to the registry key
   (admin Pages → Info → Template, or content API).

6. Preview:  GET /api/preview/page/<slug>   (authenticated)
   Publish:  POST /api/publish  (or auto-publish on save)

7. Regression: publish three times → SHA-256 of html/css/js must be identical;
   Playwright: assets 200, no JS errors, no horizontal overflow (desktop+mobile),
   keyboard + reduced-motion, axe 0 violations, canonical/JSON-LD present.
```

A `method`-kind template (dedicated renderer without a static file) and the
generic `blocks` kind follow the same registry entry shape.

---

## 7. What Phase A deliberately did NOT change

- No page was migrated or redesigned. Recruiters visuals/copy are unchanged
  (the only template change is CSS/JS includes now come from `{{PAGE_CSS}}/{{PAGE_JS}}`).
- Home, Story, Experience, Portfolio, Contact, Case Studies remain on their
  existing renderers (registered and validated, not migrated).
- No historical project/AI/AVGC-XR claims were altered.
- Global head/SEO/analytics and shared chrome/footer are unchanged; the manifest
  and preview integrate with them rather than replacing them.
