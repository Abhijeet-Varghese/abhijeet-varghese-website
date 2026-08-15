# ABOUT / STORY — Page-Specific Design System Overrides

> Source: ui-ux-pro-max-skill design-system workflow · page override for MASTER.md
> Project: Abhijeet Varghese — experience-led digital portrait
> Rev: r3 — "THE LONG TAKE" (2026-08-14) — full from-scratch rebuild

## Tuning
- **Variance:** 10/10 · **Motion:** 10/10 · **Density:** 3/10
- Intent: one continuous cinematic canvas. The page is a single film —
  never a stack of sections. Highly art-directed, spacious, editorial,
  premium; zero template aesthetics.

## The Concept — the layout enacts the story
"The frame kept getting bigger" is PHYSICAL: the page opens inside a film
aperture (corner ticks, reel tag, letterbox bars) → expands into an
asymmetric editorial spread (portrait bleeding off the right edge) → six
full-bleed reel chapters whose stills bleed alternately left/right → house
lights up for the credits. Composition = narrative.

## Continuous Canvas (fixed layers, in z-order)
| Layer | Behaviour |
|---|---|
| `.about-atmo` (z0) | world-light, **continuously mixed** per viewport overlap — never hard-switched |
| `.about-reel` (z0) | 12 chapter stills (grayscale, 0.11) advancing with scroll progress |
| `.about-grain` (z45) | SVG fractal-noise film grain, opacity .05 |
| sections (z1) | dark = transparent (canvas shows); light = paper at .965 |
| nav / compass / cursor | 100 / 90 / 9990 |

## Experience Arc (emotional sequence)
ARRIVAL (theater) → CURIOSITY (aperture) → IDENTITY (spread) →
UNDERSTANDING (stats bridge) → DISCOVERY (six reel chapters) →
REALIZATION (intertitles) → POSITIONING (converge) → FUTURE (now) →
CONNECTION (credits) → fin.

## Visual Worlds (light enters the room — scroll-interpolated)
| Scene | World | RGB |
|---|---|---|
| Prologue | deep ink | — |
| 01 Motion | electric blue | 77,141,255 |
| 02 Interaction | cyan | 0,183,212 |
| 03 Environment | indigo/violet | 139,124,246 |
| 04 Experience | amber | 230,170,60 |
| 05 People | coral | 232,112,90 |
| 06 Leadership | graphite-lavender | 140,134,168 |
| Credits | paper (house lights) | — |

## Spatial System
- `--edge`: container→viewport offset (auto-computed) — stills bleed
  EXACTLY to the screen edge, alternating sides per chapter (odd right,
  even left).
- Sticky chapter rail (top 106px) inside scenes — the sheet is a CSS
  **subgrid** spanning both scene tracks so the head is a true 250px
  side rail beside the body (never a full-width banner); the spring
  panel uses `overflow-y: clip; overflow-x: visible` so vertical clip
  never cuts the horizontal still bleeds nor kills sticky.
- Layout integrity is machine-checked: layout_audit.js opens all six
  chapters at 390/768/1024/1281/1440/1920 and asserts 0 overflow,
  6/6 rails, flush+ painted bleeds (hit-test), title/content inside the
  aperture, compass clear of the nav (drops below nav on tablets, docks
  at the bottom on phones).
- Ghost numerals: scene-painted via `::before { content: attr(data-num) }`
  so the `.about-act__ghost` span stays inert (0×0, z0, display none).

## Signature Interactions
1. THEATER: letterbox bars lift, aperture breathes + fades, title lines
   drift at different speeds (rAF).
2. THE ZOOM-OUT: 1.08 overscan → pull-back scrub with depth-memory ghosts,
   labels 01 Frame → 04 Experience.
3. SPRING ACCORDION: critically damped height spring (response .52s,
   damping 1.0), interruptible, velocity handoff; single-open; auto-unfold
   on scroll pause (desktop only, manual exploration wins).
4. SIGNAL CHAIN: STORY→REALITY line travels with scroll (--sysdone),
   nodes light `is-read`.
5. FILMSTRIP: scroll-advanced reel with sprocket strips (no CSS loop).
6. COMPASS: museum pill, materialArrive, chapter num/name/progress.
7. CURSOR: reticle with EXPLORE/OPEN labels (fine pointers only).

## Tokens (about-page scoped)
- `--track-display -0.055em · --track-head -0.04em · --track-body 0`
- `--lead-display .94 · --lead-head 1.02 · --lead-body 1.75`
- `--ease-out cubic-bezier(.16,1,.3,1)` · press feedback 100ms on
  pointer-down (never on release)
- Type: Inter Tight 700 display / Instrument Serif italic statements /
  Inter Tight body 16.5px/1.75
- Radii 4–14px · hairlines · one accent per world (--world)

## Image System
- Dedicated namespace: /assets/about/ (about-motion, about-experience,
  about-environment, about-people, about-leadership, about-credits) —
  NO recycling from any other page; only hero-portrait.webp (approved
  identity asset) is reused.
- The reel reuses the same six stills as background-image (decorative,
  grayscale, 0.11).

## Non-negotiables
- Native scroll (no hijack) · reduced-motion = final states visible ·
  content readable without JS · contrast 4.5:1 (marquee crawl, labels) ·
  visible focus · keyboard nav · no horizontal overflow (390px checked) ·
  menu + footer identical to homepage · compass museum-like · cursor
  desktop-only · axe 0 violations on the open scene.
