# Global Case Study Card System — Refinement Report (v2)

Rebuilt the Case Study card as a **single global system**, no longer scoped to the
`/case-studies/` listing. The same `CaseStudyCard` now renders identically everywhere a
Case Study appears as a card — most importantly the **homepage Featured Work** section,
which previously used a different, content-sized treatment.

---

## A. ALL CASE STUDY CARD LOCATIONS

| Location | Component (before) | Dimension (before) | Component (after) |
|---|---|---|---|
| `/case-studies/` listing (3 cards) | new `.case__*` (page-scoped) | 481 × 283 | **global CaseStudyCard** |
| Homepage → Featured Work (3 cards) | old `.case__*` (varied) | 429/560/394 × … | **global CaseStudyCard** |
| Portfolio page | `.portfolio-piece` editorial index (asymmetric tiles, index numerals, "View project ↗") | variable | **distinct index — NOT a card** (kept as its own deliberate visual language) |
| Case-study detail pages | immersive layouts (`why-cards`, `closing-media`) | n/a | **no cards** |
| Experience pages | separate system | n/a | **kept separate** |

The only true **card** instances were the listing and homepage; both now share the global card.

## B. COMPONENT

One global card style, reused by both HTML pages (no JS, no per-project components):

- Markup: `.case__card > .case__card__in > [ .case__cat · .case__client · .case__title ·
  .case__card__foot[ .case__work · .case__card-cta ] ]`
- CSS: a single global rule set in `css/styles.css` (§ **CASE STUDY CARD — GLOBAL SYSTEM**),
  applied to `.case__*` (no page scoping). Verified these classes are used **only** for
  case-study cards site-wide, so they are safe to style globally.
- Data model: `CaseStudyCard(clientCategory, clientName, description, workCategory, image, href)`.

The surrounding **section** layout stays context-specific (homepage keeps its split header +
sequential image panels; the listing keeps its own structure) — only the CARD is identical.

## C. CARD DIMENSIONS

| Breakpoint | Card (w × h) |
|---|---|
| 1280px (locked target) | **481 × 283** |
| 1024px | 410 × 241 |
| 768px | 340 × 200 |
| 390px (mobile) | 324px fluid width, natural height |

Geometry is content-independent: `width: clamp(340px, 40vw, 481px)` + `aspect-ratio: 481/283`;
container-query (`cqw`) typography scales the card as one unit, so the long Bharat Petroleum
Corporation Limited name / description / work category can never change its footprint.

## D. COPY — final

| 01 · Category | 02 · Client | 03 · Description | 04 · Work | 05 · CTA |
|---|---|---|---|---|
| Telecom & Digital Services | **Orange Business** | New Executive Briefing Center | Experience Design · Creative Technology | Explore case study → |
| Energy & Industrial | **Bharat Petroleum Corporation Limited** (2 lines) | Intuitive Experiences for Industrial Environments | Experience Design · Spatial Visualization | Explore case study → |
| Defence & Government | **Indian Army** | Immersive Solutions for Mission-Critical Environments | Immersive Experience · Creative Technology | Explore case study → |

## E. FILES CHANGED

- `abhijeetvarghese/css/styles.css` — converted the card rule set from `body.case-listing`-scoped to **global**.
- `abhijeetvarghese/index.html` — replaced 3 Featured Work cards with the same global CaseStudyCard.
- `abhijeetvarghese/case-studies/index.html` — updated Orange category to "Telecom & Digital Services".
- `avos-php/public_html/site/` × (3) — mirrors of the above.

(No files deleted; no images touched; no new dependencies; no JS changes.)

## F. HOMEPAGE

**Confirmed.** Featured Work now renders the **same** global CaseStudyCard as the listing
(verified identical dimensions/hierarchy/CTA at all breakpoints). Surrounding section layout intact.

## G. CASE STUDIES

**Confirmed.** `/case-studies/` uses the same global CaseStudyCard (481 × 283 desktop).

## H. RELATED SECTIONS

**Confirmed.** Full sweep found no other Case Study card instances. The Portfolio page's
`.portfolio-piece` is a distinct editorial *index* (asymmetric tiles, index numerals, "View
project ↗"), and the case-detail `case-coming` block is a placeholder — neither is a
Case Study card and neither was converted. Experience stays a separate system.

## I. URL VERIFICATION

- Orange Business → `case-studies/orange-business/` → **PASS**
- Bharat Petroleum Corporation Limited → `case-studies/bharat-petroleum-corporation-limited/` → **PASS**
- Indian Army → `case-studies/indian-army/` → **PASS**

## J. FULL-NAME VERIFICATION

**PASS** — no visible "BPCL" on any card. The only "bpcl" occurrence is the asset **filename**
`case-bpcl.webp` (internal technical identifier; alt text uses the full name).

## K. BUILD

**PASS** — only HTML/CSS changed; static site, no build step required; `node --check` passes on all JS.

## L. CONSOLE

**PASS** — zero console errors beyond the pre-existing static-preview `/api/analytics` 501s (present on every page; no AV OS backend in preview).

## M. BROKEN LINKS

**PASS** — all card `href`s resolve to canonical case-study paths; routing-aware crawl found no broken internal references.

## N. DESKTOP VISUAL QA

**PASS** — 1280px: all cards 481×283 (both pages); 1024px: 410×241; 768px: 340×200. No clipping, no overflow.

## O. MOBILE VISUAL QA

**PASS** — 390px: fluid width, no horizontal overflow, no clipping, full Bharat Petroleum Corporation Limited wraps to clean two lines, CTA accessible.

## P. REGRESSION TEST

**PASS** — homepage layout, nav, animations, and non-Case-Study sections all intact; all routes 200, no overflow; Experience and Portfolio unchanged.
