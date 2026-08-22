# MILESTONE 3 — PORTFOLIO + CASE STUDIES

> **Status: COMPLETE.** Portfolio, Case Studies index, both coming-soon project
> pages, the Orange Business long-form case study, and the legacy redirect page
> are migrated to React + TypeScript + Vite and verified **pixel-identical** to
> production. Milestone 4 has **not** been started.

---

## MIGRATED ROUTES

| Route | pageId | Type |
|---|---|---|
| `/portfolio.html` | `portfolio` | visual index |
| `/case-studies.html` | `case-studies` | narrative index |
| `/case-study-intuitive-experiences-for-industrial-environments.html` | `case-bpcl` | coming-soon |
| `/case-study-immersive-solutions-for-the-indian-army.html` | `case-army` | coming-soon |
| `/experience-design/orange-business-executive-briefing-center/` | `orange` | long-form case study (nested) |
| `/case-study-enterprise-technology-made-understandable.html` | — | static redirect (copied verbatim to `public/`) |

Every URL preserved **exactly** (including the nested Orange directory route).
No new redirects, no slug changes. One owner per route (route manifest in
`scripts/prerender.mjs`).

## PORTFOLIO

Hero (`portfolio-hero`) + 3-piece visual index + practice spectrum (6) + proof
wall (16 logos) + CTA. Migrated with the exact DOM structure, content,
project ordering, metadata (Role/Year), hover/reveal behaviour, and responsive
composition. Practice + logo data re-used from the typed homepage content
module (single source — no duplicate CMS).

## CASE STUDIES

`page-hero` + three cinematic `case` panels (problem/approach/role/outcome) +
"Request the deep dive" note. Preserves the glass case cards, metadata,
`data-parallax` image treatment, and coming-soon CTA behaviour. Reuses the
typed `PROJECTS` record as the single source of truth.

## ORANGE BUSINESS (high-fidelity)

The complete 11-section long-form case study, migrated 1:1 into typed React:

- **Hero** — panoramic `heroAperture` intro, 4 interactive hotspots with live
  output, pointer parallax, client logo, project title, meta-line, author.
- **Project strip** + **30-sec summary `<dialog>`** (showModal/close, backdrop
  click, body scroll lock) — the dialog is rendered **outside `<main>`**,
  matching production DOM order.
- **Why / My Role / Experience / System / Action / Purpose / Delivery /
  Outcome / Closing** — all section content verbatim, with the client-specific
  orange/black visual world preserved via its own CSS chunk (loaded after the
  shared stylesheet, exactly as production).
- **Interactive widgets** — responsibility chain, 7-stage journey (evidence-led
  image transitions with `switching` state), architecture diagram, room-response
  simulation toggle, proof tabs (rotoscope/video-wall/VR, keyboard operable),
  video-wall modes, technology strip — all rebuilt in React with identical
  aria-pressed/aria-selected/live-region semantics.
- **Videos** — the three MP4s remain unsupplied; posters render with no source,
  exactly as production (no media fabricated).
- `prefers-reduced-motion` + no-JS baselines preserved (`.reveal` content is
  readable without JS; reveal `.js` gating matches production).

**Bugs caught & fixed during verification:** a srcset base-prefix bug (only the
first candidate was prefixed), journey stage-title casing (Arrive vs ARRIVE),
video-wall default copy, and a doubled `active` class on the first hotspot.

## VISUAL FIDELITY (Playwright + ImageMagick RMSE, reduced-motion)

| Route | 390 | 768 | 1440 | 1920 |
|---|---|---|---|---|
| Portfolio | **0** | **0** | **0** | **0** |
| Case Studies | **0** | **0** | **0** | **0** |
| Case BPCL (coming-soon) | **0** | **0** | **0** | **0** |
| Case Army (coming-soon) | **0** | **0** | **0** | **0** |
| Orange Business | **0** | **0** | **0** | **0** |

Full-page captures are **0 RMSE = pixel-identical** at every width. (A 768px
fullPage capture initially showed a ~2% residual that was isolated to a
Playwright fullPage stitching artefact — the same region captured as a
fixed-viewport screenshot is **0**; computed styles and page heights are
byte-identical.)

## CONTENT INTEGRITY

**PASS** — headings, paragraphs, labels, project names, clients, metadata,
quotes and CTA labels all match. Orange (195 nodes) and both coming-soon pages
(14 nodes each) pass with **zero** text-node differences. Portfolio/Case Studies
pass after fixing one case: JSX collapses inter-element whitespace text nodes
that pretty-printed HTML preserves (e.g. the hero `<h1>` spans, the case-card
`<p>`→`<h3>` boundary). These whitespace text nodes are **invisible and
semantically inert** (elements are block/flex siblings; 0-pixel verified), and
the portfolio hero was corrected for exact `textContent` parity. No copy was
changed or "improved".

## RESPONSIVE

Tested **320 / 375 / 390 / 430 / 768 / 820 / 1024 / 1280 / 1440 / 1920 / 2560 /
3840** across all 5 migrated routes — **zero horizontal overflow** (0 px at
every width).

## PERFORMANCE

Route-level code splitting (gzip):

| Chunk | Size |
|---|---|
| shared `app` (react + react-dom + chrome) | 66.4 KB |
| `orange` page chunk | 9.9 KB |
| `orange` CSS (client-specific) | 7.7 KB |
| `story` | 8.3 KB |
| `portfolio` | 1.4 KB |
| `case-studies` | 1.1 KB |
| coming-soon (`case-bpcl`/`case-army`) | 0.25 KB each |
| `ContactBook` (booking calendar) | 4.5 KB — **lazy-loaded** |
| shared CSS | 26.8 KB |

**Portfolio/Case-Studies/Orange/Story code never loads on the homepage.**
Evolution, calendar, booking, and Orange-specific code are all route-isolated.
Largest assets remain the authored media (Orange panoramic ~181 KB jpeg, etc.)
which are lazy-loaded (hero panoramic is the only eager/preloaded image).
LCP/CLS/INP not meaningfully measurable on the static preview (no PHP/analytics
runtime); hero image + body font are preloaded to bound LCP. The react-dom
runtime floor (~50 KB) documented in Milestone 2 persists and is unchanged.

## ACCESSIBILITY

Preserved: single `h1`, semantic sections + headings, alt text on all imagery,
keyboard-operable proof tabs (arrow/Home/End), `aria-pressed`/`aria-selected`/
`aria-controls`/`aria-live` on every interactive widget, `role=tablist/tab/tabpanel`,
`<dialog>` focus management, 44px+ touch targets, focus-visible rings,
`prefers-reduced-motion` + `prefers-reduced-transparency`/`prefers-contrast`
paths, skip link, focus-trapped mobile menu.

## SEO

Every page preserves its production head: title, meta description, keywords,
canonical, Open Graph (incl. `og:image:alt` on Orange), Twitter card, theme-color
(`#070707` on Orange), JSON-LD (`CollectionPage` on Portfolio, `WebPage` on Case
Studies, `WebPage`+`isPartOf` on coming-soon pages, full `@graph` on Orange),
and correct `h1` + crawlable internal links. The legacy redirect page keeps its
`noindex` + canonical + meta-refresh + JS redirect.

## BACKEND

**Unchanged.** No files under `avos-php/` or `avos-data/` modified. PHP 8.x +
MariaDB + CMS + admin + API + AI + calendar/booking + email + SEO remain intact.
React only consumes the existing `POST /api/public/lead` contract (unchanged,
still in the contact/booking component, not on these routes). No Calendly, no
client-side secrets, no fake availability.

## ROUTE REGRESSION

All 6 migrated routes return 200 with correct URLs (verified by curl + Playwright
navigation). No accidental 404s. The legacy `/case-study-enterprise-technology-
made-understandable.html` redirect continues to resolve to the Orange route.

## CLEANUP

Nothing removed. The legacy `abhijeetvarghese/` frontend files (portfolio.html,
case-studies.html, coming-soon pages, Orange page, orange JS/CSS) remain the
production path until the full migration passes (removal is Milestone 4, after
approval). No obsolete-file removal is claimed.

## GIT

```
<commit> feat(projects): migrate Portfolio, Case Studies, Orange + coming-soon pages
```
(logical grouping per the suggested sequence; no force push.)

## PRODUCTION

**NOT DEPLOYED.** Staging/preview only.

## FINAL VERDICT

**Does Portfolio + Case Studies now run through React + TypeScript + Vite while
preserving the exact current visual design, content, color theme and backend
architecture?**

**YES.**
