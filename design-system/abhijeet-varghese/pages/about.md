# ABOUT / STORY — Page-Specific Design System Override

> Project: Abhijeet Varghese — experience-led digital portrait
> Live line: v2.4.20 · “The Long Take”
> Updated: 2026-08-16 — First Frame hero redesign

## Creative intent

- **Variance:** 10/10
- **Motion:** 10/10 with complete reduced-motion fallbacks
- **Density:** 3/10
- The page is one cinematic canvas: premium, spacious, editorial and authored—not a stack of portfolio templates.

## Dual-skill synthesis

Applied `ui-ux-pro-max` and `apple-design` together:

- UI/UX Pro Max supplied the scroll-storytelling pattern, high variance/high motion/low density dials, responsive edge matrix, focus-not-obscured checks and natural text-layout requirements.
- The generated Brutalism/pink recommendation was rejected as off-brand; recommendations are evidence, not commands. The approved navy/paper/azure identity remains authoritative.
- Apple principles guide purpose, agency, familiarity, simplicity, craft and delight.
- Liquid Glass is limited to functional chrome (navigation and compass); card copy uses a denser standard content material.
- Motion is interruptible, time-based, reduced-motion safe, offscreen-gated and frame-rate independent.
- Fixed chrome is compensated by scroll padding; focus remains visible and mobile navigation traps/restores focus.

## The concept

“The frame kept getting bigger” is physical:

1. **The First Frame** opens as an editorial film title: nested blueprint frames, three typographic beats, concise context, discipline rail and an invitation into the story.
2. The identity spread moves from biography to proof.
3. The zoom-out expands frame → interaction → environment → experience.
4. Eight 3D film cards turn six career chapters and two interludes into one scroll sequence.
5. Quiet paper/dark editorial movements resolve the story into practice, current focus and contact.

## Hero — The First Frame

### Composition

- Deep ink projection field with restrained electric-blue/violet light.
- Fine technical grid and three nested frames establish scale without adding imagery.
- Metadata rail: `About / The First Frame` and `2014 — Now`.
- H1 is three beats:
  - `I DIDN'T`
  - `START OUT`
  - `DESIGNING EXPERIENCES.` in outlined Instrument Serif.
- A concise authored line explains the VFX/animation origin and the eventual zoom-out.
- Four disciplines form a quiet dotted rail rather than decorative pills.
- `Enter the story` is the single directional action.
- The role crawl remains a low-volume cinematic baseline.

### Behaviour

- Three title lines separate at progressively deeper scroll rates.
- Blueprint/frame breathing is ambient only and disabled under reduced motion.
- The Story compass remains hidden for the entire hero and appears only after it leaves the viewport.
- No image is used in the hero; the identity portrait remains exclusive to the following spread.
- No custom cursor. Native system cursors remain visible everywhere.

### Responsive rules

- Desktop: full-height composition, asymmetric context at upper right and discipline rail at the base.
- Tablet: context drops below the title and the frame expands beyond the container.
- Phone portrait: metadata simplifies, title remains three beats, disciplines become a two-column rail.
- Phone landscape (≤700×480): metadata, disciplines and crawl are removed; title, context and CTA fit within exactly one viewport.
- Short tablet/desktop landscape: disciplines and crawl are removed; context stays right and CTA stays lower left.

## Continuous canvas

| Layer | Behaviour |
|---|---|
| `.about-atmo` | Fixed world light; colour follows the active chapter |
| `.about-reel` | Decorative fixed reel using six dedicated About stills twice |
| `.about-grain` | Low-opacity film grain; pointer-events disabled |
| content sections | Dark projection surfaces alternate with warm paper |
| navigation / compass | Site chrome above the canvas; no cursor overlay |

## Visual worlds

| Card | World | Accent |
|---|---|---|
| 01 Motion | electric blue | `#4D8DFF` |
| 02 Interaction | cyan | `#00B7D4` |
| 03 Environment | violet | `#8B7CF6` |
| 04 Experience | amber | `#E6AA3C` |
| 05 People | coral | `#E8705A` |
| 06 Creative Leadership | graphite lavender | `#9A93B8` |
| 07–08 Interludes | projection blue | `#6EA8FF` |
| Credits | warm paper | — |

## 3D stack

- Full-viewport sticky stage; world capped at 1250×720px.
- Cards hinge from the lower edge.
- Chapter content sits in a bottom glass plate.
- Interludes remain glass-free and vertically centred.
- Card 08 receives a final hold.
- Compact landscape receives a taller world and tighter internal spacing.
- Reduced motion converts all eight cards into static sequential frames.
- The animation loop sleeps offscreen and while the document is hidden.

## Typography

- Display/body: **Inter Tight**
- Editorial statements: **Instrument Serif**
- Brand/chrome: **Poppins**
- Pondar must not appear in runtime output.
- Display tracking: approximately `-0.055em` to `-0.062em`.
- Body copy maintains a readable measure and at least 1.6 line-height.

## Image system

- Dedicated namespace: `/assets/about/`.
- Approved chapter stills: motion, experience, environment, people, leadership and credits.
- The identity portrait may reuse `hero-portrait.webp` in the identity spread only.
- No case-study, essay, journal or working-session imagery is recycled into the About narrative.

## Accessibility and interaction

- One H1 with a logical H2/H3 hierarchy.
- Native scrolling; no scroll hijack.
- Native cursor only; no `cursor:none` or cursor overlays.
- Visible focus states and keyboard-operable compass/mobile navigation.
- Minimum 44px primary touch targets.
- WCAG AA contrast target.
- `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` respected.
- Page remains readable without JavaScript.

## Certification matrix

Verify at minimum:

- 280×653, 320×480, 320×568, 360×640, 390×844
- 568×320, 667×375, 844×390, 1024×600, 1366×640
- 768×1024, 834×1112, 1024×768
- 1280, 1366, 1440, 1536, 1680, 1920 and 2560 widths
- 3440×1440 and 3840×2160

For every size: zero horizontal overflow, complete H1, context inside the hero, CTA reachable, hero compass hidden, all eight evolution cards present and closing sections contained.

## Non-negotiables

- No custom cursor or `data-cur` remnants.
- No Pondar font references.
- Portfolio remains in desktop navigation, mobile navigation and footer.
- Navigation and footer remain identical to the homepage.
- No fabricated clients, outcomes, awards or statistics.
- Source, template and published output remain synchronised.
- About QA, responsive, axe and link audits remain green.
