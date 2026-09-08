# AV OS — URL Architecture & Clean-URL Routing

The CMS derives **one canonical URL per public entity**. Editors never maintain
redirect files, canonical tags, sitemap entries or internal links by hand — the
publisher computes all of them from a single route registry.

**Single source of truth:** `backend/publish/RouteRegistry.php` (read-only,
side-effect free). The publisher (`PublishEngine`), sitemap, canonical/OG tags,
JSON-LD URLs, internal links, redirects, the `.htaccess` 301 rules and the
`routes.json` manifest all read from it.

---

## Canonical policy — trailing-slash directory URLs

Every indexable public page lives at a trailing-slash directory URL and is
written to `<dir>/index.html`:

| Entity | Canonical URL | Output file |
|---|---|---|
| Home | `/` | `index.html` |
| Story / About | `/story/` | `story/index.html` |
| Experience | `/experience/` | `experience/index.html` |
| Portfolio (film reel) | `/portfolio/` | `portfolio/index.html` |
| Case studies index | `/case-studies/` | `case-studies/index.html` |
| Recruiters | `/for-recruiters/` | `for-recruiters/index.html` |
| Contact | `/contact/` | `contact/index.html` |
| Consulting | `/consulting/` | `consulting/index.html` |
| Insights / Journal indexes | `/insights/`, `/journal/` | `…/index.html` |
| Legal / Sitemap | `/privacy-policy/`, `/terms/`, `/sitemap/` | `…/index.html` |
| Case study | `/case-studies/<project-slug>/` | `case-studies/<slug>/index.html` |
| Essay | `/essays/<slug>/` | `essays/<slug>/index.html` |
| Journal post | `/journal/<slug>/` | `journal/<slug>/index.html` |

Established project slugs are preserved (no production URL changes for work that
already had a clean route): Orange → `/case-studies/orange-business/`, BPCL →
`/case-studies/bharat-petroleum-corporation-limited/`, Indian Army →
`/case-studies/indian-army/`.

The browser URL is `/portfolio/` — never `/portfolio.html`. Flat `.html` URLs
and old paths are **legacy URLs** that 301 to the canonical route.

---

## How a route is built

`RouteRegistry::build($site, $isDue)` iterates pages, published projects and due
articles and produces one record per entity:

```
id, type (page|project|article), slug, canonical (/…/),
output (…/index.html), template, title, redirects[]
```

- **Pages** → `/<slug>/`
- **Case studies** → `/case-studies/<slug>/` (slug from `caseStudySlug`, then the
  established per-id mapping, then a `case-studies/…` custom path, then
  slugified title)
- **Articles** → `/essays/<slug>/` or `/journal/<slug>/`

### Slug generation
`RouteRegistry::slugify()` lowercases, collapses non `[a-z0-9]` to `-`, trims.
Project slugs preserve existing canonical directories; new titles are slugified
safely (empty → fallback id). Reserved top-level segments cannot be claimed by
content (`admin`, `api`, `install`, `media`, `assets`, `css`, `js`, `storage`,
primary sections — see `RouteRegistry::RESERVED`).

---

## Automatic redirects (no hand-maintained stubs)

Each route declares legacy URLs that must 301 to its canonical path. The
publisher emits them two ways so they work on every host:

1. **Apache/Hostinger:** real `301` rules in the generated `.htaccess`
   (`writeSiteHtaccess()`), e.g.
   `RewriteRule ^portfolio\.html/?$ /portfolio/ [R=301,L]`.
2. **Static / dev (`php -S` or any static host):** a tiny host-neutral HTML
   redirect **stub** (`redirectStub()`) carrying `rel=canonical`,
   `robots: noindex,follow` and `location.replace(...)`.

Redirects generated automatically include:
- `<slug>.html` → `/<slug>/` for every page
- `case-study-<title>.html` and editor `legacyPaths` → `/case-studies/<slug>/`
- Orange's old `/experience-design/orange-business-executive-briefing-center/` →
  `/case-studies/orange-business/`
- `essay-<slug>.html` → `/essays/<slug>/`, `journal-<slug>.html` → `/journal/<slug>/`

DB-managed redirects (`redirects` table) override auto rules. The bare no-slash
form (`/portfolio`) is normalised to trailing slash by Apache `mod_dir` (and the
dev router) automatically, so no stub is emitted that would collide with the
canonical `<slug>/index.html`.

**Validation prevents loops/chains/shadowing** (`RouteRegistry::validate()`):
duplicate canonical routes, duplicate output paths, a redirect targeting a
missing route, a self-loop, or a redirect whose source shadows another canonical
route all fail the build before anything is published.

---

## Internal link resolution

`RouteRegistry::hrefMap($routes)` builds a lookup of every known internal href
(flat `.html`, no-extension, directory, legacy) → canonical root-relative path.
`resolveInternalHref()` and `PublishEngine::finalizeAttr()` convert links in
rendered HTML to canonical root-relative URLs, e.g.:

```
story.html                 → /story/
experience/                → /experience/
case-studies/bpcl…/        → /case-studies/bharat-petroleum-corporation-limited/
```

`finalizeDocument()` runs on every generated page and:
- rewrites internal `href/src/action/poster/data-*` links to canonical routes,
- **root-relativises asset references** (`css|js|assets|fonts|media`, including
  `srcset`/`imagesrcset`) so nested directory URLs never break relative paths —
  the site is served at host root, so `/css/…`, `/js/…`, `/assets/…` resolve from
  any depth (no `../` guessing),
- rewrites `<link rel=canonical>` and `og:url` to the route's canonical URL,
- rewrites self/legacy references inside inline JSON-LD to the canonical URL.

External URLs, `//`, `mailto:`/`tel:`, anchors and explicit `../` depth prefixes
(used by the depth-2 Orange template) are left untouched.

---

## Sitemap / robots / canonical / structured data

- **`sitemap.xml`** is generated from the route registry — one `<loc>` per
  published canonical route (home priority 1.0, pages 0.9, case studies 0.8,
  articles 0.7). Drafts, scheduled-but-not-due, redirects, 404, admin/api and
  search are excluded. `verifyPublishedSite()` confirms every `<loc>` maps to a
  real file and no private path appears.
- **Canonical tags** and **og:url** are route-derived (root + canonical path),
  deterministic, HTTPS/host from `AV_SITE_URL`, trailing-slash, no query string.
- **JSON-LD** self URLs (`@id`, `url`, `mainEntityOfPage`, breadcrumb `item`s)
  are normalised to canonical URLs. Breadcrumb structure follows the route
  hierarchy (Home › Case Studies › <Project>).
- **robots.txt** disallows `/admin/`, `/api/`, `/install/`; preview responses
  carry `noindex,noarchive` + `no-store` (Phase A). The 404 returns a real HTTP
  404 (`ErrorDocument 404 /404.html` + dev router) — unknown paths never become
  valid pages.

---

## Route manifest

Every publish writes **`routes.json`** at the site root:

```
{ generated_at, site, routes: [ { id, type, template, route, url, output, title, redirects[] } ] }
```

Used for QA, sitemap/redirects, analytics and future search/internal-linking.

---

## Adding a new page / changing a slug

1. Create/rename the content entity in the CMS with a title; the slug is derived
   automatically (editor can override). Do **not** hand-create HTML files.
2. On publish, `RouteRegistry` assigns the route, output dir, canonical, sitemap
   entry and internal-link mapping automatically.
3. **Changing a slug** creates a legacy redirect from the old URL automatically
   (old `.html`/directory → new canonical); the collision validator stops the
   publish if the new route is taken or a loop would result.
4. Bespoke pages register a template in `TemplateRegistry`; they receive route
   info through the same `finalizeDocument()` path — no per-template URL logic.

## Adding a new content type URL rule
Add a branch in `RouteRegistry::build()` mapping the type to its base path
(e.g. `/essays/`), include its legacy forms in its `redirects[]`, and the rest
(output, sitemap, links, redirects) follows automatically.
