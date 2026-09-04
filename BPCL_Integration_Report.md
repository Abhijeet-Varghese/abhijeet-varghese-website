# BPCL Case Study + Site-Wide Case Studies/Experience Architecture

**Scope:** integrate the supplied Bharat Petroleum Corporation Limited case-study package
into the global AV OS design system, and standardize the Case Studies + Experience URL
architecture across the static site. **No CMS/backend/DB/API/AV OS or PublishEngine code
was touched.** All work is at the static frontend layer (`abhijeetvarghese/`) and mirrored
byte-identically into the published output (`avos-php/public_html/site/`).

---

## A. Final URL architecture

| Section | Canonical URL | Physical file |
|---|---|---|
| Home | `/` | `index.html` |
| Experience | `/experience/` | `experience/index.html` |
| **Case Studies (listing)** | `/case-studies/` | `case-studies/index.html` |
| Orange Business case study | `/case-studies/orange-business/` | `case-studies/orange-business/index.html` |
| **Bharat Petroleum Corporation Limited case study** | `/case-studies/bharat-petroleum-corporation-limited/` | `case-studies/bharat-petroleum-corporation-limited/index.html` |
| Indian Army case study | `/case-studies/indian-army/` | `case-studies/indian-army/index.html` |

Clean rules applied: lowercase, hyphens, semantic path, consistent trailing slash, no `.html`
where a clean route exists. Forbidden slugs (`/bpcl/`, `/bpcl-palakkad/`, `/army/`, `/ob/`) are **not used**.

Case Studies and Experience are enforced as **two separate hierarchies** — `/experience/` stays
Experience, `/case-studies/` sits distinct from it and holds all three case studies.

---

## B. URL audit (CURRENT → FINAL → CONTENT → ACTION)

| Current URL | Final URL | Content | Action |
|---|---|---|---|
| `/case-studies.html` | `/case-studies/` | listing | moved → directory; flat file is now a 301/stub |
| `/experience.html` | `/experience/` | experience | moved → directory; flat file is now a 301/stub |
| `/experience-design/orange-business-executive-briefing-center/` | `/case-studies/orange-business/` | Orange case study | moved; old path 301 → canonical |
| `/case-study-enterprise-technology-made-understandable.html` | `/case-studies/orange-business/` | Orange (legacy) | 301 → canonical |
| `/case-study-intuitive-experiences-for-industrial-environments.html` | `/case-studies/bharat-petroleum-corporation-limited/` | **BPCL (legacy)** | 301 → canonical |
| `/experience-design/bpcl-palakkad/` | `/case-studies/bharat-petroleum-corporation-limited/` | BPCL (legacy, safety) | 301 → canonical |
| `/case-study-immersive-solutions-for-the-indian-army.html` | `/case-studies/indian-army/` | Indian Army | moved; flat file 301 → canonical |

Every redirect goes **straight to the canonical target — no chains.** Each legacy URL is handled
by both an Apache 301 (`.htaccess`) and a static `meta-refresh`/`location.replace` stub so it
also works on hosts that don't process `.htaccess`.

---

## C. BPCL integration — global design system + preserved experience

The supplied package (`/home/user/bpcl-palakkad/`) was kept as the **source of truth** and
integrated, not rebuilt. Its immersive experience — hero, challenge/strategy, physical miniature
viewer, day/night comparison slider, technical blueprint viewer (zoom/pan/pinch), 3D architectural
walkthrough frame sequence, close-ups, leadership/delivery, outcome, and closing finale — is
preserved with **all content, imagery, interactions, animations and sequencing intact.**

It now uses the **global chrome** (`.site-nav` header + `.footer--arena` footer, `css/tokens.css`,
`css/styles.css`, `js/main.js`) and is **re-themed** to the global design system via a new
`assets/css/site-theme.css` layer that re-maps the experience's tokens onto the site's:

- Typography → Inter Tight (site voice) instead of Helvetica Neue; tracked 600 labels.
- Palette → global navy `#080F22`, paper `#F7F5EF`, azure `#6EA8FF` / primary `#2E5AAC`.
- Layout → the global `min(1280px, 100% - 2×pad)` column and global spacing/motion easings.
- Chrome → global nav pill + footer; the in-page "chapter" rail sits beneath the site nav.

Only the case-study-specific content/visualizations (viewers, blueprint, walkthrough, film slot)
remain project-specific. The `site-theme.css` scope is pinned so the site chrome's `.btn` (nav CTA)
keeps the global pill style while the immersive project's compact control buttons keep their look.

**Video:** `WALKTHROUGH_VIDEO` is armed; `assets/video/walkthrough.mp4` is intentionally absent
until you upload it. `walkthrough.js` probes the file on load — if absent it keeps the frame
sequence and never shows a broken control; dropping the MP4 in mounts the player automatically.

---

## D. Full-name pass

The user-facing name is **"Bharat Petroleum Corporation Limited"** everywhere — titles, meta, OG,
JSON-LD, breadcrumb, card client labels, alt text, sitemap, search-index tags, and the page's own
hero/finale/project-info labels. The abbreviation **"BPCL" now appears only in internal code
identifiers (`window.BPCL`, `window.BPCL_ASSETS`), asset filenames (`bpcl.webp`, `case-bpcl.webp`),
comments, and legacy-compat paths** — never in rendered UI/SEO. Verified by grep: zero user-facing
"BPCL" in any HTML/JSON/XML.

---

## E. Redirects (no chains)

`.htaccess` now declares direct 301s for all legacy URLs (`case-studies.html`, `experience.html`,
the three legacy flat case-study pages, and the two legacy `experience-design/*` paths). Static
stub pages at each legacy URL provide a fallback. All are single-hop to the canonical.

---

## F. SEO / metadata

- Canonical: `/case-studies/bharat-petroleum-corporation-limited/` (correct on the BPCL page).
- `robots.txt` → root `sitemap.xml`; `sitemap.xml` lists `/experience/`, `/case-studies/`, and all
  three canonical case-study URLs; old case-study/experience URLs are absent.
- OG/Twitter + JSON-LD graph on the BPCL page use the full client name and canonical URL.
- Search index (`search-index.json`) and human `sitemap.html` updated to the clean URLs.
- Analytics `case_study_view` autotag updated to recognize the clean `/case-studies/{slug}/` URLs.

---

## G. Verification

| Check | Result |
|---|---|
| Internal link crawl (975 refs, 31 pages) | **0 broken links** |
| `node --check` on every JS file (incl. all BPCL modules) | **all pass** |
| HTTP smoke test: `/`, `/experience/`, `/case-studies/`, 3 case-study pages | **all 200** |
| Legacy URLs (`case-studies.html`, `experience.html`, `case-study-*`, `experience-design/*`) | **200 redirect stubs** |
| One canonical BPCL page only | **confirmed** (no duplicate page) |
| No user-facing "BPCL" in HTML/JSON/XML | **confirmed** |
| Restore diff `abhijeetvarghese` vs `avos-php/public_html/site` | **identical** |
| Real headless browser render (Playwright/Chromium, desktop 1280px + mobile 390px) | **all pages render; no overflow** |
| BPCL immersive interactions in-browser | **viewer 7/7, day/night + blueprint + bridge + outcomes/areas/strategy/info all mounted, analytics chrome present, 0 page errors** |
| BPCL mobile (390px) | **no overflow; global nav toggle + mobile section bar present** |

**Browser note (the only console entry on the BPCL page):** the `assets/video/walkthrough.mp4`
"not found" 404 is the **intended** single-probe by `walkthrough.js` (`WALKTHROUGH_VIDEO` is armed
for a future upload) — it falls back to the frame sequence and mounts no broken control. The
`/api/analytics/track` 501s in the static preview are expected because there is no AV OS backend
there; they succeed on the real host.

---

## Files touched (high level)

- **Added:** `case-studies/index.html`, `case-studies/orange-business/`, `case-studies/indian-army/`,
  `case-studies/bharat-petroleum-corporation-limited/` (index + `assets/` copy of the supplied
  package + `site-theme.css`), `experience/index.html`, and static redirect stubs at all legacy URLs.
- **Moved (git):** Orange case study, Indian Army case study, Case Studies listing, Experience page.
- **Updated for integration:** `.htaccess`, `sitemap.xml`, `sitemap.html`, `search-index.json`,
  `robots.txt`, and the nav/footer/internal card links across every page.
- **Not touched:** `PublishEngine.php`, `site.json`/CMS content store, DB, APIs, AV OS, unrelated pages.
