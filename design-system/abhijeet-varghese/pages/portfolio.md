# PORTFOLIO — Page-Specific Design System Override

> Dedicated experience page. This page is intentionally different from `case-studies/`
> and intentionally different from every other page on the site.
> **Superseded compositions:** the "visual index" gallery and the vertical case-study
> grid are retired as of the REEL build. See `PORTFOLIO-REEL-HANDOVER.md` for the full
> rationale and QA evidence.

## Purpose

- **Portfolio:** one continuous cinematic narrative — *see the work → understand the
  practice → see the trust → discover more → go deeper → close*. The page itself is a
  piece of work, not a database view.
- **Case Studies:** slower narrative evidence focused on challenge, approach, role and outcome.

Never merge the two pages or point both navigation items to one URL.

## Composition (the narrative, in order)

| # | Section | Class | Anchor | Role in the story |
|---|---|---|---|---|
| 01 | Portfolio | `.pf-overture` | `#portfolio` | Opening frame. Label top, title centred, film credits bottom. |
| 02 | The film | `.pf-film` | `#film` | The portfolio reel — the statement. |
| 03 | The context | `.pf-context` | `#context` | Exhibition credits + one editorial paragraph. |
| 04 | Practice spectrum | `.portfolio-practice` | `#practice` | **Established chapter — preserved verbatim.** |
| 05 | Selected organisations | `.portfolio-proof` | `#clients` | **Established chapter — preserved verbatim.** |
| 06 | Seam | `.pf-seam` | — | Wordless transition into the second act (`aria-hidden`). |
| 07 | Beyond the reel | `.pf-beyond` | `#beyond` | "There is more." |
| 08 | More work | `.pf-soon` | `#more-work` | Intentional COMING SOON state. |
| 09 | Case studies | `.pf-runway` | `#case-studies` | **Cinematic horizontal runway** → existing footer. |

Forbidden pattern: hero → cards → cards → footer. Every section must earn its place.

**There is no Next Project section.** The runway is the final major statement; the page
closes directly into the site footer. Do not add a CTA section between Case Studies and
the footer.

## Preserved chapters (04 and 05)

These two sections are **byte-for-byte identical to `origin/main`** — same markup, same
classes, same copy, same client order, same logo assets, same typography, same
`data-reveal` behaviour, same `t-dark` / `t-light` themes. Their CSS continues to come
from the site's own `styles.css`; it was never forked.

The page layer contains **no** rules for them except three integration devices:

| Rule | Purpose |
|---|---|
| `.pf-fade` (`.pf-fade--to-light` / `--to-dark`) | Carries the page between the near-black chapters and the paper-coloured clients chapter. |
| `.pf-railnav.is-light` | The fixed chapter rail inverts while over the paper chapter, otherwise it is invisible there. |
| `.portfolio-proof header > p { color: #2E5AAC }` | Accessibility fix: the shared eyebrow azure is 1.66:1 on paper; the section's own deep azure is 6.1:1. |

Do not restyle, re-card, re-order or "modernise" these sections. Build transitions around
them instead.

## The runway (09)

The visitor travels through a large horizontal canvas. Projects are **scenes**, not
cards: each takes the frame, recedes, and hands over while the next is already entering.

### Framing

The track is framed so the sequence opens and closes on a centred scene — the opening
scene is centred as the stage takes hold, the final project is centred as it lets go.
Both are derived from live DOM geometry in JS, so they hold at any viewport size.

### Camera, not slider

Vertical scroll sets a target; the track eases toward it (0.18 damping per frame) so the
movement carries inertia. The rAF loop stops when settled and parks entirely when the
section is off-screen.

### Depth

| Layer | Movement |
|---|---|
| Card | `translateX(rel × 14px)` — **no scale**, so every card is the same size on screen |
| Media image | `scale(1.02 → 1.08)` with focus — inside the fixed 16:9 frame |
| Veil | opacity lifts as focus rises (`0.92 → 0.34`) |

Focus resolves a scene by lifting a veil rather than by blurring — cheap, and no filter
cost. **Focus emphasis is perceptual only** (opacity, veil, and the image zoom *inside* the fixed
frame). Card dimensions **and rendered size** never change — there is deliberately no scale
transform on the card, so three cards on screen are always exactly the same size. All of it is decoration: `--f` and `--rel` default to neutral, so with JS off, under
reduced motion, or on a small screen every card is simply present.

### One component, three projects

> Asymmetric scenes, per-project compositions, differing image sizes and differing vertical
> positions are **rejected**. Do not reintroduce.

Every case study uses the identical component. Only the data changes.

```
IMAGE        16:9 — always, whatever the source artwork
CATEGORY     client category
CLIENT       client name
PROJECT      project details
WORK         work category
CTA          View case study →
```

| Requirement | Mechanism |
|---|---|
| Identical width | one shared rule — `clamp(300px, 44vw, 440px)` |
| Identical rendered size | **no scale transform** — `translate3d` only |
| Identical height | track `align-items: stretch`; body a flex column |
| Identical frame | `aspect-ratio: 16/9; overflow: hidden` |
| CTA aligned across cards | `margin-top: auto` |
| Copy length can't shift layout | `.pf-card__project { min-height: 2 lines }` |
| Number never drifts | CSS counter on `.pf-card`, reset on the track |

Adding a case study = one more `.pf-card` with the same five fields in the same order. There
is no `.pf-card--01`, no `.pf-project--02` — **nothing is per-project**.

**Client name** is sized to hold `Bharat Petroleum Corporation Limited` on one line at the
largest readable size: `clamp(1.04rem, 2.44vw, 1.53rem)` with `-0.022em` tracking. Verified
one line at all 26 widths from 360 → 1920 px, filling 87–89 % of the card.

**Image treatment:** `cover` by default; `contain` only where the artwork is branded and must
not be cropped (BPCL). The 16:9 frame is identical either way.

### Orientation

`01 / 03` counter plus a hairline progress bar. Count is derived from the DOM. **No
arrows, no dots — it is not a carousel.**

## Visual language

- Navy/paper/azure brand system; the page runs on the deep end of it
  (`#05070D` void, `#080F22` deep, `#EFF0EA` ink, `#6EA8FF`/`#9CC2FF` azure, `#F7F5EF` paper).
- Inter Tight for display and body; Instrument Serif *italic* for editorial contrast only.
- Type scale is deliberately extreme: display `clamp(3.1rem, 9.6vw, 11.5rem)`, tracking
  `-0.055em`, line-height `0.84`. Body stays calm.
- Whitespace is an active element; the page is allowed to feel quiet between movements.
- Depth comes from **scale differences, masking and light** — never drop shadows, never
  floating glass cards, never neon, never AI gradients, never particles.
- Restrained technical details only: project numbering, 10px uppercase labels with a
  leading rule, hairlines, corner frame marks on the film, a chapter rail, `01 / 03`.

## Rhythm

HIGH IMPACT (film) → QUIET (metadata) → INFORMATION (practice) → CREDIBILITY (clients) →
ANTICIPATION (more work) → PAUSE (coming soon) → HIGH IMPACT + DEPTH (runway) → CLOSURE
(footer). If everything is loud, nothing is important.

## Motion grammar (a closed set)

| Behaviour | Where | Implementation |
|---|---|---|
| REVEAL | section copy | existing `data-reveal` (main.js) |
| TEXT | all major headings | `.pf-line > i` masked line reveal, `data-pf-open` |
| EXPANSION | the film | shutters slide, stage `0.955 → 1`, media `1.14 → 1` |
| SCRUB | seam, film exit, rail | `--p / --o / --o2 / --exit` from one rAF loop |
| TRAVEL | the runway | damped track translation + per-scene focus |
| MICRO | links, CTA, cursor | 0.35–0.6s, `--ease-out` |

Timing: major media 1.4–2.1s, text 1.25s, micro-interactions 0.35–0.6s.
Easing: `cubic-bezier(0.16, 1, 0.3, 1)` entrances, `cubic-bezier(0.22, 1, 0.36, 1)` state.
Animate `transform`/`opacity` only — **0 layouts** during scroll.

## Media art direction

- Crops are chosen per asset, never uniform.
- **No image is displayed above its native resolution.** Measured display ÷ native:
  BPCL 0.43, Orange 0.48, Indian Army 1.00.
- The BPCL artwork (1672×941) uses **`object-fit: contain`** so the complete supplied
  artwork is always visible. The media box matches its aspect ratio, so there are no
  letterbox bars. Never crop it.
- The portfolio film is click-to-load: a local poster frame, then the
  `youtube-nocookie` embed. Zero third-party requests until the visitor presses play.

## Empty state (More Work)

`moreWork = []` in `js/portfolio-reel.js`. While empty the intentional COMING SOON
composition renders — abstract drifting media fragments, slow light movement, film grain,
a curation status line and a single CTA. Never fake content, thumbnails, client names or
project descriptions. Populate the array (schema documented in the JS — video, YouTube,
image, motion, 3D, brand film, immersive, installation, digital, experimental; each with a
`layout` of `feature | half | wide | portrait`) and the section renders itself with no
component changes.

## Interaction

- Native links and visible focus states. Hover is decoration, never the only way in.
- Runway hover: media `1.04`, title brightens, CTA rule and arrow travel. Guarded by
  `(hover: hover) and (pointer: fine)`.
- The runway is never a scroll trap: keyboard focus scrolls the page so the focused scene
  lands centred; on touch it is a native snap region.
- Custom cursor is a ring with a label (`PLAY` / `VIEW`), fine pointers only, hidden
  entirely under `prefers-reduced-motion`.

## Responsive

- Desktop ≥1201px: full cinematic cards, chapter rail, pinned runway.
- 900–1200px: rail hidden; the card system is unchanged.
- <900px: single column, no parallax, no cursor; the runway releases to a native,
  snap-scrolling region with large immersive panels.
- Short viewports (`max-height: 700px`) also release the pin.
- Verified at 320 / 390 / 834 / 1366 / 1600 / 1920 / 2560 and heights 620–1300.
  `scrollWidth === clientWidth` everywhere — the only horizontal movement is inside the
  runway's own container.

## Accessibility

- One `h1`; each movement heading is `h2`; each client/project is `h3` inside `article`.
- The decorative seam, chapter rail and cursor are `aria-hidden` / inert.
- axe-core (WCAG 2.1 AA): **0 violations** at desktop and mobile.
- `prefers-reduced-motion`: every animation off, every element in its final state.
- No-JS: the complete hierarchy renders — masking, shutters and fades never gate content.
- Minimum 44px primary targets; body text ≥4.5:1, large text ≥3:1.

## Canonical URLs

- Portfolio: `portfolio.html`
- Case Studies listing: `case-studies/`
- Case study detail: `case-studies/{slug}/`
  - `case-studies/bharat-petroleum-corporation-limited/`
  - `case-studies/orange-business/`
  - `case-studies/indian-army/`
- Experience: `experience/`
- Portfolio film: `https://youtu.be/R1O0VanJfTo`
