# Case Study Card System — Refinement Report

Refined the Case Studies listing card UI so all three cards read as **ONE component / THREE projects**,
not three independently sized cards. Page-scoped so the homepage Featured Work cards (which share the
`.case__*` class names) keep their own documented treatment.

---

## A. COMPONENT

One card component, three data records. No per-project components.

- The listing markup was refactored into a single, repeatable structure
  (`.case__card > .case__card__in > [cat · client · title · foot[work · CTA]]`).
- All geometry/typography lives in **one page-scoped rule set** under `body.case-listing`.
- Content is the only thing that varies per card; the box is content-INDEPENDENT
  (fixed width + `aspect-ratio`, container-query typography).

The card receives: client category, client name, description, work category, image, URL.

## B. CARD DIMENSIONS

| Breakpoint | Card (w × h) |
|---|---|
| 1280px (locked desktop target) | **481 × 283** |
| 1024px | 410 × 241 |
| 768px | 340 × 200 |
| 390px (mobile) | 324px fluid width, natural height |

- Desktop geometry is `width: clamp(340px, 40vw, 481px)` + `aspect-ratio: 481/283`.
- Content length (long client name / description / work category) **cannot** change card size.
- Mobile relaxes to fluid width / natural height (no forced 481px), preserving order, hierarchy,
  padding logic, typography and CTA.

## C. CONTENT — five-field hierarchy

Every card follows the locked order:

1. **Category of client / business** (eyebrow)
2. **Client name** (primary display headline)
3. **Description** (project)
4. **Category of work** (secondary metadata)
5. **Explore case study →** (CTA, anchored to bottom)

## D. COPY — exact final

| 01 · Category (client) | Orange Business · **Executive Technology & Telecom** |
|---|---|
| 02 · Client | **Orange Business** |
| 03 · Description | New Executive Briefing Center |
| 04 · Work | Experience Design · Creative Technology |
| 05 · CTA | Explore case study → |

| 01 · Category (client) | Bharat Petroleum Corporation Limited · **Energy & Industrial** |
|---|---|
| 02 · Client | **Bharat Petroleum Corporation Limited** (wraps to 2 lines) |
| 03 · Description | Intuitive Experiences for Industrial Environments |
| 04 · Work | Experience Design · Spatial Visualization |
| 05 · CTA | Explore case study → |

| 01 · Category (client) | Indian Army · **Defence & Government** |
|---|---|
| 02 · Client | **Indian Army** |
| 03 · Description | Immersive Solutions for Mission-Critical Environments |
| 04 · Work | Immersive Experience · Creative Technology |
| 05 · CTA | Explore case study → |

## E. FILES CHANGED

- `abhijeetvarghese/case-studies/index.html` — refactored 3 cards to the shared component; added `body.case-listing`.
- `abhijeetvarghese/css/styles.css` — appended page-scoped card-system rule set.
- `avos-php/public_html/site/case-studies/index.html` — mirror of the above.
- `avos-php/public_html/site/css/styles.css` — mirror of the above.

(No files deleted; no images touched; no new dependencies.)

## F. URL VERIFICATION

- Orange Business → `case-studies/orange-business/` → **PASS**
- Bharat Petroleum Corporation Limited → `case-studies/bharat-petroleum-corporation-limited/` → **PASS**
- Indian Army → `case-studies/indian-army/` → **PASS**

No `/experience-design/`, no `/bpcl/`, no `/case-studies/bpcl/`, no `/case-studies/army/`.

## G. RESPONSIVE VERIFICATION

- 1280px → **PASS** (481×283 ×3, no clip/overflow)
- 1024px → **PASS** (410×241 ×3)
- 768px → **PASS** (340×200 ×3)
- 390px → **PASS** (fluid, no overflow, full name wraps cleanly, CTA accessible)

## H. BUILD

**PASS** — CSS/HTML only, no JS changes; `node --check` passes on all JS.
No production build step is required for this static site; HTTP smoke test of all routes returned 200.

## I. CONSOLE

**PASS** — 0 errors beyond the pre-existing `/api/analytics/track` 501s (static preview has no AV OS backend; present on every page before this change). No request failures.

## J. BROKEN LINKS / ASSETS

**PASS** — all card links resolve to relative case-study paths; image `src` unchanged. Routing-aware link crawl found 0 broken internal references.

## K. FULL-NAME CHECK

**PASS** — No visible "BPCL". The only occurrence is the asset **filename** `case-bpcl.webp` (an internal technical identifier, explicitly permitted); its `alt` text uses the full client name. All three cards display full names:
`Orange Business`, `Bharat Petroleum Corporation Limited`, `Indian Army`.

## L. VISUAL QA

- All three cards same physical size (481×283): **PASS**
- All three visually consistent (geometry/border/radius/padding/bg/hierarchy/CTA): **PASS**
- Bharat Petroleum Corporation Limited fits elegantly (2-line wrap, optical, not squeezed): **PASS**
- CTA alignment consistent (anchored to bottom, identical): **PASS**

### Do-not list compliance

- Did not enlarge the BPCL card · did not shorten the name · no BPCL visible copy
- One component + three data records (no separate components) · no content-dependent card heights
- No per-card margins · no site redesign · thumbnails untouched · no image regeneration
- URLs unchanged · none moved into Experience · no new visual system · no added copy/metrics
- No new dependencies
