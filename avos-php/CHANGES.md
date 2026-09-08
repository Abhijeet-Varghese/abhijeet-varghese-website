<!-- WORKING POLICY (user directive, 2026-08-12): ALL further edits happen
     in v2.4.20 — the single live/working version. No new version lines, no
     renames. Keep AV_VERSION = 2.4.20; bump the asset cache-bust when
     frontend files change; release tarballs stay AVOS-2.4.20-*. -->

## v2.4.20-r3 · FULL AUDIT + CURSOR/FONT REMOVAL + PORTFOLIO NAV + RESPONSIVE

User directive (5 items):

1. **Full about-page audit (design/layout/creative/technical).** Ran the
   complete battery + a fresh extended geometry sweep. Fixed everything
   found: the story compass overlapped the nav's bottom edge at tablet
   widths (2px) — pushed to top:96px; case_nav test updated for the new
   nav. Battery green end-to-end (below).
2. **Custom cursor removed site-wide.** The reticle (dot/ring/label),
   `cursor: none`, the `about-cur` gating and the pointermove/lerp loop
   are gone from CSS and JS — verified 0 occurrences in template and
   published files. Default cursor everywhere; data-cur attributes left
   inert.
3. **Pondar font removed.** "Pondar" was a phantom name (no @font-face
   existed — it already fell through to Poppins). Both references
   (nav brand + footer name) now use "Poppins" directly. Verified 0
   occurrences.
4. **Portfolio menu item added.** Added "Portfolio" to the primary nav
   and the footer Menu column (after Case Studies), in the canonical
   seed + DB. Mobile menu numbers it 04. Linked to case-studies.html —
   the live portfolio page — so no broken links (verified in link
   audit). Note: when a dedicated portfolio page is built, point this
   item at it.
5. **Responsive across all devices.** New extended sweep: 22 sizes from
   320×568 to 2560×1440, including landscape/short-height (844×390,
   1024×600, 1366×640) — zero horizontal overflow, hero/statement/stage/
   card-content/what/now/curious/credits all fit. Plus the standard
   responsive suite (11 widths × 7 pages) clean.

**Battery (all green):** about_qa ALL CLEAN · layout audit ALL CLEAN
(6 widths) · resp_ext ALL CLEAN (22 sizes) · case_nav PASS (Portfolio) ·
hybrid ALL CLEAN · axe 0/12 · responsive 0 · links 0 · apple-pass
intact · nums_final (mobile menu 01–04 incl. Portfolio) · E2E fresh
133/133 · journeys 14/14 · doctor SYSTEM READY · mirror identical.

## v2.4.20-r3 — THE STORY REBORN ("THE LONG TAKE")

The Story/About page was recreated from scratch as one continuous cinematic
canvas — "beyond Apple" per the master spec. Architecture, chapter copy,
nav/footer chrome, the dedicated About image system and every QA hook are
preserved; the visual + interaction layer is entirely new:

**The concept — the layout enacts the story.** "The frame kept getting
bigger" is now physical: the page opens inside a film aperture (corner
ticks, reel tag, letterbox bars), expands into an asymmetric editorial
spread with the portrait bleeding off the right edge, then six full-bleed
reel chapters whose stills bleed alternately off the left/right edges, and
closes with the house lights up.

- Continuous canvas: a fixed reel of chapter stills advances beneath the
  whole page (scroll-scrubbed), world-light mixes continuously per chapter
  (no hard color switches), film grain finishes the frame.
- Theater prologue: aperture + ticks + REEL 001 tag + letterbox bars that
  lift on scroll; title at 7vw with -0.055em tracking; roles crawl.
- Identity hub: gallery plaque, manifesto-led spread, hairline-ruled
  stats/facts bands, THE ZOOM-OUT stage (1.08 overscan → pull-back scrub),
  scroll-advanced filmstrip with sprocket strips.
- Evolution: rows with giant outlined numerals + hover stills; scenes with
  sticky chapter rail (overflow:clip keeps sticky alive), world-colored
  light, scene-painted giant numerals, alternating edge-bleeding stills;
  the STORY→REALITY chain becomes a signal line that travels with scroll.
- Intertitles, house-lights closing, circular credits portrait, compass
  pill with materialArrive, custom reticle cursor (EXPLORE/OPEN).
- Apple physics: pointer-down press feedback, interruptible critically
  damped spring accordion (velocity handoff), rAF-scrubbed parallax,
  reduced-motion final states, reduced-transparency solid materials.

**Engine:** PublishEngine about* blocks rebuilt (DOM contract intact —
about_qa, hybrid_qa, e2e all green); styles.css About section rewritten
as one coherent system (was 2,000 lines of accumulated layers); main.js
About engine rewritten (springs, single rAF loop, continuous atmo mix).

**Battery (all green):** E2E fresh 133/133 · integration 67/67 · failure
20/20 · journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 ·
admin 48/48 · booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0/12
pages · responsive 0/11 widths · links 0/61 · about_qa ALL CLEAN ·
hybrid ALL CLEAN · experience 13 widths · doctor SYSTEM READY · mirror
byte-identical. Cache-bust: 2.4.20-ccd0a4.

## v2.4.20-r3 · APPLE FULL-PAGE PASS (apple-design skill · whole page)

The entire About page was audited against the apple-design skill and
every interactive surface upgraded:

- **Response (kill latency):** press feedback is now delegated to ALL
  interactive elements — links included (nav, skip, page-close, footer,
  CTA) — firing on pointer-down in 100 ms, never on release; pages
  press with a quiet opacity dip instead of scale (layout-safe).
- **Materials (translucency = hierarchy):** the compass sheet now
  MATERIALIZES (scale 0.94 → 1 + fade + origin at its trigger) instead
  of an instant toggle, and mirrors the same path on the way out
  (spatial consistency); the larger surface reads thicker (blur 28px,
  deeper shadow). The sticky chapter rail became a translucent card
  (blur 14px, radius 16px, hairline) while floating over the scene.
- **Direct manipulation:** every chapter still leans toward the pointer
  (±9px/±6px, velocity-smoothed, springs home on leave) — previously
  only the Interaction chapter.
- **Multimodal:** quiet haptic tick (10ms) on accordion commit and
  compass open — Android only, never under reduced motion.
- **Typography:** `font-optical-sizing: auto` on the page; reveals tuned
  from the old 1s ease to the critically-damped curve (.16,1,.3,1).
- **A11y:** keyboard focus now reveals the chapter hover still; reduced
  transparency → solid paper sections and solid glass; `prefers-contrast`
  → near-solid materials with defined borders.

## v2.4.20-r3 · EVOLUTION → 3D FILM STACK + INTERLUDES AS CARDS

The 3D Evolution Stack (user-supplied design) is fully integrated, with
the interludes now cards too — eight cards in the stack:

- **Cards 01–06** — the six chapters with their current dedicated About
  images and current copy (label top-right, number + option name top-left,
  and at the BOTTOM of each card: note · headline in three film lines ·
  supporting line · per-chapter extras: ch03 statement, ch04 signal chain,
  ch06 duo).
- **Card 07** — interlude "THE DISTANCE BETWEEN THE IDEA AND REALITY."
  (after Experience) · **Card 08** — interlude "GOOD IDEAS HAVE TO SURVIVE
  REALITY." (after Leadership) — both as full cards with the quote as a
  serif title, distinct notes ("The distance" / "The survival"), ✦ ✦ ✦
  mark, number watermark.
- **Motion:** hinge-open at the bottom edge, lerped scroll progress (rAF,
  interruptible), pointer camera drift, image parallax + shadow scaling on
  open, blur falloff into the stack, world-light follows the active card,
  progress rail (01–08) + compass in sync, compass seeks into the stack.
- **Reduced motion:** the eight cards render as static stacked frames.
- **No repeated copy:** interlude notes are unique; dup_audit clean.
- Minimal hero (giant two lines + chips + skip + crawl) and the full
  11-item cleanup remain in place; What/Now redesigned; credits clean.

**Battery (all green):** about_qa ALL CLEAN (8 cards, stack checks, system
chain, duo, axe on stage, mobile) · layout audit ALL CLEAN (6 widths:
hero minimal, 8 cards, stage 900/900) · hybrid ALL CLEAN · axe 0/12 ·
responsive 0 · links 0 · apple-pass (press, sheet, stack, camera drift) ·
dup_audit clean · journeys 14/14 · doctor SYSTEM READY · mirror identical.

## v2.4.20-r3 · EVOLUTION → 3D FILM STACK (user-supplied design)

The evolution section was rebuilt with the user's 3D Evolution Stack
design (scroll-choreographed sticky stage), integrated with both skills:

- **The stack:** six cards hinge open as the visitor scrolls through an
  880vh runway; the bottom edge is the hinge; each card carries its
  current dedicated About image (unchanged), the chapter number + name
  (meta, top-left), the label (category, top-right), and at the BOTTOM
  of the card: the note (eyebrow), the headline in three film lines, the
  supporting line, plus each chapter's extras — ch03 statement, ch04
  signal chain (STORY→REALITY micro-row), ch06 duo.
- **Motion (apple-design):** rAF loop with lerped progress (interruptible,
  velocity-aware), ease-in-out open / ease-out rise, pointer camera
  (the stage drifts with the cursor), image parallax + shadow scaling on
  open, blur falloff into the deep stack.
- **Choreography:** world-light follows the active card (continuous atmo
  mix), the progress rail (left edge, 01–06 + fill) and the compass stay
  in sync; compass items seek directly into the stack.
- **Accessibility:** reduced motion renders the cards as static stacked
  frames (no transforms, no runway); axe 0 on the stage; keyboard
  visible focus retained.
- **Copy/images unchanged:** every headline, label, note, supporting
  line, the statement, the 7-node chain and the duo — all verbatim; the
  same dedicated About images; interludes follow the stack.

**Battery (all green):** about_qa ALL CLEAN (6 cards, card-03 stack
checks, system chain, duo, axe stage, mobile) · layout audit ALL CLEAN
(6 widths: hero minimal, 6 cards, stage 900/900) · hybrid ALL CLEAN ·
axe 0/12 · responsive 0 · links 0 · apple-pass (press, sheet, stack,
camera drift) · dup_audit clean · journeys 14/14 · doctor SYSTEM READY.

## v2.4.20-r3 · MINIMAL CLEANUP — 11-ITEM DIRECTIVE

User directive executed: minimal, clean, beyond-Apple, zero repeated copy.

1. **Hero redesigned** — the minimal title card: giant two-line statement
   (solid + outlined serif), role chips, skip link, crawl. Removed: tag
   pill, "The Story" eyebrow, role line (per #4).
2. **Evolution stripped** — all REEL tags and the giant scene numerals
   are gone; chapter eyebrows are now just rule + name. The six compact
   film frames remain (backdrop, veil, copy on film, spine + nodes).
3. **"The Story" title and "A little context" eyebrow removed.**
4. **The role line under the giant two lines removed** (chips kept).
5. **The identity plaque box before "A little context" removed** — the
   name/role now live only in the credits signature + footer (no dupes).
6. **Full-page audit** — axe 0/12, responsive 0, layout audit ALL CLEAN
   (hero minimal, 6/6 frames painted+bleed), about_qa ALL CLEAN.
7. **Credits marquee removed.**
8. **"fin." removed.**
9. **Credits background image + circular portrait removed** — credits is
   now quote · role · signature · CTA on paper.
10. **Zero repeated copy** — removed: the philosophy section (its lines
    duplicated the ch03 statement and interlude), the ch06 statement
    ("I'M A CREATIVE PERSON FIRST." = the credo), the ch06 converge (role
    words = the hero chips), the hub portrait figcaption, the credits
    portrait figcaption. dup_audit.js: content sentences appear exactly
    once; only functional labels repeat (nav CTA, compass wayfinding).
    Meta description rewritten to not echo the bio.
11. **"What I actually do" + "Now" redesigned** — What: minimal directory
    (no numbers, no arrows; hairline rows, hover indent + tint). Now:
    split editorial grid (statement left, quiet ruled copy right).

**Battery (all green):** about_qa ALL CLEAN · layout audit ALL CLEAN
(6 widths) · dup_audit ALL CLEAN · hybrid ALL CLEAN · axe 0/12 ·
responsive 0 · links 0 · apple-pass behaviors intact (press, sheet,
lean, full-bleed, no reel/numeral) · journeys 14/14 · doctor SYSTEM
READY · mirror identical.

## v2.4.20-r3 · HERO MINIMAL + EVOLUTION FULLY SCRAPPED

**Hero — the minimal title card.** The theater (aperture, ticks, letterbox
bars, logo watermark, marquee) is gone. The hero is now: corner tag
(REEL 001 — THE STORY) · eyebrow · one giant two-line statement (solid +
outlined serif) · role line · skip link. The canvas (reel, grain,
world-light) carries the cinema; the four support lines and four role
chips are dropped (their information lives in the storyboard bio and the
identity plaque). Title lines drift at different speeds on scroll.

**Evolution — fully scrapped accordion → six consecutive film frames.**
No triggers, no panels, no springs, no hover previews, no sticky rail.
Each chapter is now a full-bleed, near-viewport-height frame you scroll
through: the dedicated still is the backdrop (dimmed), world-light veils
it, the giant numeral floats over the film, the REEL tag sits top-right,
and the copy sits directly on the frame (eyebrow · label · headline ·
supporting line · statements · system chain · converge · duo · Next —).
The reel spine still runs the section, filling with scroll; each frame's
node lights with its world color. Interludes remain as title cards.
The compass now scrolls to frames. QA rewritten for the new structure.

**Battery (all green):** about_qa ALL CLEAN (6 scenes, axe on the frame
scene 0 violations, mobile recompose) · layout audit ALL CLEAN (6 widths:
hero minimal, 6/6 full-bleed frames, 6/6 painted, 6/6 bleed) · hybrid
ALL CLEAN · axe 0/12 · responsive 0 · links 0 · apple-pass behaviors
intact · journeys 14/14 · doctor SYSTEM READY · mirror identical.

## v2.4.20-r3 · REDESIGN — STORY HUB · EVOLUTION · WHAT I ACTUALLY DO

User-approved redesign pass (both skills). Final state per user decisions:
evolution backdrop scenes + glass sheet + permanent chapter thumbs
APPROVED; "What I actually do" filmography APPROVED; hub text RESTORED to
full copy (only the two commanded removals stand); meta description fixed.

**Removed (user command):**
- The by-the-numbers band above the evolution (12+/65+/100+ live on in
  the identity hub).
- The filmstrip below the zoom-out stage.

**Evolution — full-bleed film frames (approved):**
- Every collapsed chapter row is now a frame cell: the chapter's still is
  PERMANENTLY visible (no longer hover-only), the ghost numeral moved to
  the left, hover lifts the thumb and tints its border with the world
  color.
- Opening a chapter plays a full-bleed scene (≥1281px): the still becomes
  the backdrop, world-light veils it (radial + gradient), the numeral
  floats over the film, and the sheet is a glass panel (blur 18px) with
  the sticky chapter rail inside. ≤1280 keeps the composed in-flow layout.
- The figure moved to scene level in the engine (backdrop containment);
  QA updated accordingly (scene-level image check).

**What I actually do — filmography (approved):**
- The single desc line became a numbered index (01–06): Films ·
  Interactive Experiences · VR/XR · Experience Centres · Physical
  Installations · Brand Systems — hairline rows, hover: row indents, item
  darkens, arrow slides in (Apple physics). Two-column editorial grid
  with the statement on the left.

**Copy audit (about page, user-approved):**
- FIXED: prologue role rendered a literal "&amp;" (double-escaped
  fallback) — now "Creative Director & Experience Designer"; regression
  check added to about_qa (entity-leak).
- FIXED (approved): meta description "then frame became interaction" →
  "then the frame became interaction" (seed + content_store).
- No other issues found — the authored copy is clean.

**Battery (all green):** about_qa ALL CLEAN (full-hub assertions +
whatRows 6 + entity-leak) · layout audit ALL CLEAN (6 widths × 6
chapters, rails/paint/bleed) · hybrid ALL CLEAN · axe 0/12 · responsive
0 · links 0 · journeys 14/14 · doctor SYSTEM READY · mirror identical.
Cache-bust: 2.4.20-a67c09.

## v2.4.20-r3 · LAYOUT INTEGRITY SWEEP (both skills · 6 viewports)

Systematic multi-viewport geometry audit (390/768/1024/1281/1440/1920,
every chapter open, hit-tested at the pixel level) found and fixed real
layout defects:

- **Chapter rail was not a rail.** `.about-act__head` lived inside the
  sheet column, so the sticky "rail" rendered as a full-width banner
  above the body. The sheet is now a CSS **subgrid** spanning both scene
  tracks: head = true 250px sticky side rail, body = content column,
  "Next —" pinned under the body. Verified rails 6/6 at every width.
- **Stills were clipped at the container edge.** The panel's vertical
  clip (needed for the height spring) also cut the horizontal bleeds —
  the "bleeding off the edge" effect was invisible past the container.
  Panel now uses `overflow-y: clip; overflow-x: visible` (visible+clip
  is a legal pair; clip never creates a scroll container, so sticky
  survives). Figures now painted flush at the viewport edge, hit-test
  verified.
- **Prologue title overflowed the aperture at ≥1720px** ("I DIDN'T
  START OUT" exceeded the 1240px frame) — display cap tightened to
  6.6rem; longest line fits at every width.
- **Aperture frame crossed the copy** when content grew taller than the
  fixed 74svh box — the aperture now WRAPS the content (auto height,
  decorative spans individually aria-hidden), so the frame can never cut
  through text; on phones it becomes a full-bleed frame.
- **Compass collided with the nav row** at 768–1024px — drops below the
  nav on tablets; docks at the bottom like a home indicator on phones,
  sheet opening upward from the trigger.
- Sheet returns to auto placement in the single-column mobile scene
  (no implicit grid column).

**Verification:** layout_audit ALL CLEAN (6 widths × 6 chapters, 0
overflow, 6/6 rails, 6/6 bleeds painted) · about_qa ALL CLEAN · hybrid
ALL CLEAN · experience 13 widths · axe 0/12 · responsive 0 · links 0 ·
journeys 14/14 · doctor SYSTEM READY · Apple-pass behaviors intact
(press, sheet, lean, rail material) · mirror identical. Cache-bust:
2.4.20-bd85f2.



## v2.4.20 — SINGLE-ROW FOOTER (arena finale · merged single-row)

Per request — this revision is named v2.4.20 (the next number on the kept
v2.4.19 line). It carries the merged arena footer work that previously
lived as 2.6.3-r2/r3/r4:

**The merge (v2.6.3 + v2.6.4 footer, one design):**
- From v2.6.4: single-row layout — brand · Menu · Resources · Social ·
  Legal on one line at desktop (≥1200px), left-aligned link stacks, the
  bottom strip (© · Built on AV OS · Back to top) in `space-between`
  across the full width, the "Social" column dedupe (exactly one Social
  block; classic footer on inner pages keeps every CMS column), tablet
  (861–1199px) = brand row + columns row, mobile (≤860px) = centered
  stacked fallback.
- From v2.6.3: the fa-scene statement band (rule · name · serif tagline)
  above the footer, dark `#05070D`, availability dot, hairline borders.

**Responsive fix (wrap bug):** the single row previously only fit at
≥1320px; preview-pane widths (~1201px) wrapped into a broken "3 columns +
Social dangling" second row. Gap tightened to `clamp(28px,3.2vw,56px)`,
columns to `flex:0 1 150px`, tablet breakpoint fixed at ≤1199px. Verified
861–1440px: no partial wrap anywhere, 0 overflow at every width.
hybrid_qa asserts single-row at 1201px and 1440px.

**Version consolidation:** the 2.6.3-r2/r3/r4 numbers are retired — this
build ships as `2.4.20`. Archives kept: AVOS-2.4.19 · AVOS-2.4.20 (live).

Battery at release: E2E 133/133 · hybrid_qa ALL CLEAN · experience 13
widths · axe 0 · responsive 0 · links 0 · doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE: ACT SCENES (cinematic, compact)

The Story page was rebuilt as a short immersive film (19,632px → 10,859px,
−45%) with every word of content preserved byte-for-byte (verified by the
new about_scenes_qa suite — 0 missing strings):

- **Opener** — the signature cinematic hero, tightened to one viewport.
- **Acts index** — one screen, seven "doors" (01 · Frame → 07 · Creative
  Leadership) with hover/active states; clicking glides to the scene.
- **Seven act scenes** — ghost outlined numeral, act name + note head, the
  authored content in a tight editorial flow: kinetic chain/zoom/duo
  paragraphs, in-scene statement moments, epics as compact title cards,
  compact figures, 2-column question/ledger lists, the logo wall.
- **Finale** — finale statement + closing CTA band.
- **Acts progress rail** — fixed right-edge "ACT 0X / 07" indicator that
  tracks the scene in the middle band (IntersectionObserver), hidden on
  mobile.
- Scenes alternate dark/light with `background: var(--cb)` per scene.

**Bugs fixed:** (1) aboutProse injected the literal text "data-reveal"
into paragraphs starting with a bare `<p>` (pre-existing since v2.4.10 —
present in v2.4.19 too); the injector now handles `<p>` and
`<p class=…>` correctly. (2) axe color-contrast on the new scenes (the
light scenes had no background of their own) — fixed by painting each
scene with its theme background.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages incl.
story) · responsive 0 (11 widths) · 0 broken links · about_scenes_qa ALL
CLEAN · hybrid_qa ALL CLEAN · experience 13 widths · doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE: BEYOND APPLE RECONSTRUCTION (apple-design × ui-ux-pro-max)

Full reconstruction layer applying BOTH installed skills:

**Apple Design skill installed** (`~/.claude/skills/apple-design/` — fluid
interfaces, springs, materials, optical typography, reduced-motion) and
its rules applied on top of the ui-ux-pro-max system:

1. **Optical typography (size-specific tracking, §15):** a token system
   --track-display -0.055em → --track-micro +0.24em, with leading that
   tracks inversely (display 0.96 → body 1.7). Large display tightens as
   it grows; body sits near 0; micro labels breathe with positive
   tracking. Verified: display ≤ -0.03em, body normal/0.
2. **Instant press feedback (§1):** every button gets a JS
   pointer-down → `.is-pressing` state (scale .985, 100ms) — feedback
   on press, never on release; works on touch; CSS :active complements.
3. **Interruptible, spring-like motion (§3):** accordion panels and
   previews use critically-damped easing (cubic-bezier(.16,1,.3,1));
   close mirrors open with a faster, inverse curve (symmetric paths);
   no locked input states anywhere.
4. **Material chrome (§12):** compass material "arrives" (scale + blur
   → settle, not plain fade); nav links get a vibrancy weight bump over
   glass; compass list drops the hard border for a soft shadow;
   **prefers-reduced-transparency** makes the glass near-solid.
5. **Craft (§7):** consistent radius tokens, layered shadows on
   portrait/figures, tightened quote/curious tracking.

QA extended (display tracking, body tracking, material keyframe, press
feedback pointerdown) — ALL CLEAN. Page uses its dedicated about image
system, worlds, identity hub, crisp chapters, compass, zoom-out —
everything preserved and elevated.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: EXPERIENCE-LED SYSTEM (skill workflow + dedicated image system)

Per the experience-led master spec:

**1. UI/UX Pro Max design-system workflow executed + persisted:**
- `design-system/abhijeet-varghese/MASTER.md` (generated by the skill's
  `--design-system --persist` workflow) and `pages/about.md` (page
  override: Variance 9/10 · Motion 9/10 · Density 3/10, experience arc,
  visual worlds, spatial three-layer system, zoom-out signature, tokens,
  image system rules, non-negotiables).

**2. Dedicated About image namespace created — `/assets/about/`:**
six art-directed WebP visuals (30–119KB each) purpose-built for the page:
`about-motion` (graphite/electric-blue film frame), `about-environment`
(indigo architectural space), `about-experience` (amber/ultramarine
layered system), `about-people` (warm collaboration), `about-leadership`
(violet monumental), `about-credits` (quiet desk). Wired into the film
strip (replacing recycled case/essay images), each chapter's floating
figure (world-matched), the zoom-out canvas (about-environment), and a
new soft atmospheric backdrop behind the credits. **Verified: the page
now uses ZERO recycled imagery** — the only remaining non-about asset is
the approved identity portrait (spec-allowed). QA asserts: ≥6 about
images, 0 recycled.

**3. Experience system node activation restored:** the STORY → AUDIENCE
→ INTERACTION → SPACE → TECHNOLOGY → PRODUCTION → REALITY progression
activates node-by-node as the visitor scrolls (accent dot scales in,
label tints) — the system visibly grows (IO threshold 0.7, reduced-motion
final states).

**4. Semantic tokens:** about-page scoped tokens (--mo-* motion scale,
--radius-card/media, --hairline) centralize the values.

**5. Fixed:** `media()` path mapping for the new namespace (assets/about/
resolves correctly — link audit 61 checks, ZERO broken).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: SKILL-APPLIED LAYOUT (ui-ux-pro-max)

Installed the `ui-ux-pro-max-skill` agent skill into the workspace
(~/.claude/skills — searchable design intelligence: 79 styles, 192
palettes, 74 font pairings, 119 UX guidelines, motion presets) and
applied its verified recommendations to the About page layout:

**Skill matches applied:**
- Style: Minimalism & Swiss Style (whitespace, grid, high contrast,
  single accent, no decoration) — confirmed and sharpened.
- Pattern: Immersive/Interactive Experience — its required affordances
  now exist:
  - **Skip option**: a quiet "Jump to the story ↓" link under the
    prologue cue (verified: href #act-01) — impatient visitors never
    trapped in the arrival sequence.
  - **Pause-when-offscreen**: the zoom-out scrub, the film strip pan and
    both role marquees (prologue + credits) now pause via
    IntersectionObserver gates while offscreen and resume on view
    (verified: film off=paused → on=running, credits marquee paused
    offscreen, zoom still fills 1.08 at top). Reduced-motion keeps the
    final states with animations disabled.
- Typography: hierarchy kept (display serif statements, 700 Poppins
  headlines, 16.5px body, letterspaced uppercase micro-labels) with
  tightened measures (max 24ch headlines, 50–72ch bodies) for editorial
  rhythm.
- Pre-delivery checklist: cursor:pointer on all interactive elements,
  hover/chevron transitions tuned to 200–250ms, focus-visible + contrast
  re-verified (axe 0), no emoji icons.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: MASTER REBUILD (immersive digital portrait)

Per the master-rebuild spec — implemented directly:

**Prologue (entering a film):** headline reads as two cinematic lines
("I DIDN'T START OUT" / "DESIGNING EXPERIENCES." outlined serif), four
short supporting lines (VFX and animation were my entry point…), the
role line, the four-role small line, scroll cue, role marquee, logo
watermark — no long paragraph, a hook.

**Summary = substance (identity hub):** logo · name · role · positioning
· portrait · "I design experiences by thinking beyond the frame."
statement · three-paragraph bio · "How should this be experienced?"
typographic moment · 12+ / 65+ / 100+ (count-up, editorial row) ·
Education (BA — VFX & Animation) · Continuously learning (Meta /
University of Virginia / Digital Transformation) · Works across (9
creative territories, two columns) · "I'm a creative person first."
credo — an editorial identity system, not a résumé card. Plus the
kinetic band, zoom-out stage and film strip remain.

**Evolution = crisp visual story:** all six chapters (01 Motion … 06
Creative Leadership) with the spec's headlines ("I learned to think in
time.", "Then the frame started responding.", "Then the screen wasn't
enough.", "Then everything had to work together.", "Because experiences
are for people.", "Then the work became bigger than the idea."), one
supporting sentence and a micro-label (FRAME · TIMING · MOVEMENT etc.).
Chapter 04 carries the STORY → AUDIENCE → INTERACTION → SPACE →
TECHNOLOGY → PRODUCTION → REALITY system progression; chapter 06 ends
with the duo + "I'M A CREATIVE PERSON FIRST." Interludes (IDEA → REALITY
and GOOD IDEAS) placed after Experience and Leadership.

**Closing movement:** philosophy (three statements) → WHAT I ACTUALLY DO
→ NOW → STILL CURIOUS (five lines + note) → credits (portrait, quote,
signature, CTA, fin.) — complexity → clarity → quiet.

**Chrome:** nav + footer pixel-identical to the homepage; worlds'
palettes retained; zoom canvas filled (1.08 overscan); compass + cursor
+ reduced-motion intact. Chapter figures removed (typographic chapters —
no recycled imagery; the only images are the identity portrait, the
zoom-stage canvas and the film strip).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (identity hub,
labels, system names, philosophy/what/now/curious) · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: EVOLUTION v3 (editorial spread · filled zoom · ultra stats)

Final layout overhaul per repeated feedback:

1. **Stats — ultra big + bold** — 12+ / 65+ / 100+ now render at
   ~8.8rem, weight 700, −0.055em tracking, tabular numerals, serif "+"
   at 0.36em. One row, undeniable scale.

2. **Evolution inner — editorial spread (redesigned v3):** the open
   chapter is now one flowing feature, not a two-column grid:
   - No sticky rail, no ghost numerals — the scene opens with a hairline
     rule, a small "CHAPTER 0X" eyebrow + world dot, and a GIANT feature
     title (up to 5.6rem, weight 700, −0.05em) with the note beneath.
   - Content flows in a single editorial measure (64ch) with **figures
     floated right (294–340px) and the text wrapping around them** —
     full-bleed figures stay full-width for the Environment space.
   - Statements become **centered serif-italic moments** (up to 3.1rem)
     with generous whitespace above/below; leadership's duo is two
     quiet stacked lines (struck-through question → answer) before the
     centered statement; questions are serif lines with numbered
     markers; the logo wall is a quiet row.
   - Trigger rows quieter: small accent numerals (no stroke), names up
     to 3rem, thin chevrons.

3. **Zoom-out canvas — image now truly FILLS first:** the decorative
   inset border overlay (the "boxed" look) is REMOVED; the canvas is
   taller (420–620px / 62vh); the frame starts at **1.08 overscan** so
   the image bleeds past every edge from the first pixel, then the
   camera pulls back to 0.80 as the four stages light. Verified live:
   scale 1.08, image = canvas (1382×1382 at 1440).

4. **Summary keeps more than the evolution** — unchanged: the summary
   holds the kicker, drop-cap lede, kinetic chain/zoom band, portrait
   with chip caption, zoom-out stage, and the film strip; the evolution
   is the minimal index + feature interiors.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (zoom overscan 1.08,
stats ≥130px, floated figure, centered serif statements, flow sheet) ·
hybrid ALL CLEAN · experience 13 widths · doctor SYSTEM READY · mirror
auto-synced.

### v2.4.20 — ABOUT PAGE: APPLE-LANGUAGE PASS (clarity · bold type · minimal)

Full design-language audit against Apple's visual principles and applied:

**Typography (bold, tight, precise):** prologue title weight 700 with
-0.045em tracking; chapter names 600/-0.035em (index) and 700/-0.04em
(open); kicker 1.4–2rem; opening prose 1.2–1.4rem/1.66; body prose
16.5px/1.68 in muted with strong accents; statements 1.7–2.4rem weight
600 tight. The hierarchy reads at a glance.

**Stats: big + bold (per directive)** — 12+ / 65+ / 100+ now render at
~7.6rem, weight 700, -0.05em tracking, tabular numerals, serif "+" at
0.36em; labels letterspaced below. Single row kept.

**Evolution inner — minimal, modern, airy (redesigned):**
- Ghost numerals, chapter count, progress hairline and the hard scene
  gradients removed — the scenes are clean `var(--cb)` with one soft
  radial accent light (8% of the world accent) at the top-right.
- The sticky chapter rail stays (number eyebrow · bold name · plain
  note) beside a single-measure body (max 620px), small 400px rounded
  figures, quiet "Next —" bridges. All six chapters identical in
  structure — palette is the only atmosphere.
- Decorative noise removed: blueprint hairlines (prologue), film grain
  (acts/interlude), watermark logo faded to 5.5%, marquee dots muted.

**Zoom-out: image FILLS the canvas first (per directive)** — the frame
starts at scale 1 (image covers the full canvas) and the camera pulls
back to 0.78 as the four stage labels light. Verified: scaleX 1.000,
image = canvas 1280×1280 at the top; QA asserts fill.

**Summary keeps more (per directive):** the summary remains the dense
editorial section (kicker, lede with drop cap, kinetic chain/zoom band,
portrait with chip caption, the zoom-out stage, the film strip) while
the evolution is now the minimal index — more in the summary, less in
the chapters.

**Global Apple touches:** generous section padding (96–150px), ::selection
accent tint, precise 2px focus rings, rounded 16–24px imagery, muted
secondary text, one accent per world, restrained motion.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (zoom filled, stats
≥90px, ghost hidden, unified scenes) · hybrid ALL CLEAN · experience 13
widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: FIVE-FIX PASS (zoom canvas · stats row · unified chapters · portrait · logo)

Per user directives:

1. **Zoom-out canvas fixed** — the image now FILLS the canvas: the frame
   is taller (360–560px), the photo is absolutely positioned to cover
   every pixel (verified: image = frame, 1182×449 at 1440), and the
   scroll scale range widened 0.66 → 1.41 so the zoom feels like a
   camera pull instead of a small picture.
2. **Stats in ONE single row** — 12+ / 65+ / 100+ sit side-by-side in a
   3-column row (verified: `397.875px 397.875px 397.875px`, same row),
   strong tabular numerals (~6rem) with the serif "+" and letterspaced
   labels beneath; count-up retained; stacks on mobile.
3. **Evolution inner sections unified** — every chapter now shares the
   same layout: the sticky chapter rail + body with a **small framed
   figure (440px max) and the text around it**. Removed the per-world
   figure treatments (motion playhead/corner ticks/pan, interaction
   dashed outline, environment full-bleed + caption pill + statement
   overlap, experience asymmetric corners + dot grid, people warm frame,
   leadership mat), the per-world statement accents (uppercase/serif/
   underline/centered) and the leadership stacked duo — all chapters now
   read as one consistent editorial system with the world's palette and
   ghost-accent as the only atmosphere. Verified: env figure 440px,
   statement left pull-quote, caption static.
4. **Summary portrait redesigned** — the grid flipped: prose left,
   **portrait right (sticky, 430px column)** with the caption as a
   floating white chip overlapping the image's bottom-left corner
   (verified: portrait at 930px vs text 80px, chip absolute overlapping).
   Mobile: portrait centered, caption back in flow.
5. **"AV" text replaced by the real logo** — the prologue watermark is
   now the actual logo.png (grayscale, brightened, 8% opacity, 190–340px)
   sitting quietly behind the typography (verified: assets/logo.png at
   340px). Mobile keeps a smaller 150px version.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (logo watermark,
portrait last, 3-col stats, unified env sheet/caption/duo/statements,
no dot grid) · hybrid ALL CLEAN · experience 13 widths · doctor SYSTEM
READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: CONSISTENCY + WORLD ENHANCEMENT (per user)

Per directives:

1. **Hero portrait removed** — the opening is now pure typographic
   arrival: monogram, word-by-word sentence, roles, scroll cue, marquee.
   The portrait lives in the summary + film strip + credits instead
   (negative space, no profile card).
2. **Menu bar identical to the homepage on every page** — the About-page
   light/dark nav adaptation is removed; the nav is the homepage's dark
   glass pill everywhere, always.
3. **Footer identical to the homepage everywhere** — the About-page
   footer glow, padding override and container z-index are removed; the
   footer is pixel-identical to the homepage on all pages (dark
   #05070D, single row, space-between bottom strip). Verified:
   footer ::before none, bg rgb(5,7,13), 4 cols.
4. **Inner sections of all evolution chapters enhanced** (content
   untouched):
   - the ghost numeral takes the world's accent stroke (electric blue →
     cyan → indigo → ultramarine → coral → graphite) instead of a
     neutral outline;
   - each chapter eyebrow gains a world-identity dot (accent ring);
   - per-world figure language — motion: accent border + playhead +
     corner ticks; interaction: dashed "hot-zone" outline + lift;
     environment: full-bleed space + caption pill; experience:
     blueprint asymmetric corners; people: warm rounded frame + coral
     shadow; leadership: thin monochrome mat;
   - per-world statement accents — motion: uppercase kinetic tracking;
     interaction: serif italic; people: serif italic in accent; 
     experience: underline draws in-view;
   - **next-chapter bridges**: each scene ends with a hairline
     "Next — Interaction/…/Credits →" (spatial continuity).
5. **Layout audit** — stats labels take the accent when active; the acts
   head breathes after the taller stat beats; QA extended (frag gone,
   nav = homepage dark glass in light scenes, footer glow gone, 6 next
   bridges ending "Next — Credits", per-world ghost strokes differ,
   eyebrow dot present) and stabilized (defensive click vs auto-unfold).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (3/3 runs) · hybrid
ALL CLEAN · experience 13 widths · doctor SYSTEM READY · mirror
auto-synced.

### v2.4.20 — ABOUT PAGE: OVERDRIVE 2 (convergence · film strip · system grid)

Continuing the art-direction pass — the four remaining spec beats:

**The convergence (leadership climax):** before "I'M A CREATIVE PERSON
FIRST." the four real disciplines — Creative Direction · Experience
Design · Immersive Technology · Visual Storytelling (existing role
words, never invented) — sit scattered and blurred, then **converge to
the centre and resolve** (staggered 0.09s, blur→0) as the statement
lands. Verified live: in-view → opacity 1, transform 0, blur 0.

**The film strip (image continuity):** between the summary and the
numbers, a slow-panning reel of the four real images — portrait → Orange
Business work → experience centre → working session — bridges the story
worlds (46s alternate pan, mask-faded edges, purely decorative,
reduced-motion static). Verified live: filmstripPan, mid-pan at −84px.

**The systemic grid (experience world):** the Experience chapter gains a
faint dot-grid texture over its lighting (mask-faded), and each question
node pulses softly when read (2.4s ring) — the chapter now reads as a
system growing, not a list.

**The interlude rule (IDEA → REALITY):** the hairline draws in (scaleX
0→1, 1.4s, delayed 0.25s) and the ✦ ✦ ✦ mark fades in a beat later (1s
delay) — the pause breathes. Verified live: rule matrix(1), mark 1.

QA extended: converge (4 words, exact text), filmstrip (4 imgs +
animation), dot grid (radial-gradient), interlude rule transform.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: CREATIVE OVERDRIVE (art-direction layer)

Per the overdrive directive — not more animation, more ART DIRECTION.
Content, sections, chapter order untouched (about_qa 0 missing).

**The atmospheric layer:** a fixed full-page film of color
(`#aboutAtmo`) bleeds across the entire journey — its radial lighting
interpolates from the current world's palette (electric blue → cyan →
indigo → ultramarine/amber → coral → graphite-violet) with a 1.6s eased
transition, so color moves physically between chapters instead of
switching as backgrounds. Opacity adapts to light/dark env.

**Film entrance:** the opening sentence now assembles word by word —
"I didn't" / "start out" / "designing" / "experiences." rise through
masks with staggered delays (0.15–0.6s), the final group in outlined
serif. The portrait fragment drifts and grows opposite the type.

**Zoom-out with depth memory:** the FRAME→INTERACTION→ENVIRONMENT→
EXPERIENCE scrub now leaves the previous frames behind — two ghost image
layers persist faintly (blurred, darkened, scaled) as the camera pulls
back (verified: ghost1 opacity 0.19 at zp .78, ghost2 0.03) — the
evolution layers visibly stack like memory.

**Stats as scale beats:** the numbers are no longer a grid — each
12+ / 65+ / 100+ becomes a cinematic beat that fills the viewport
(~15rem), the label drops to a tiny letterspaced caption, and the number
nearest the viewport centre dominates (deterministic rAF picker,
verified sequence 12+ → 65+ → 100+).

**Per-world layouts (no repetition):**
- Motion: a playhead line sweeps the frame (7s), corner ticks, image pan.
- Interaction: the composition leans toward the cursor (±10px, rAF
  eased, pointer-fine only).
- Environment: single-column sheet — the experience-centre image spans
  the full container as SPACE, the caption becomes a floating pill on
  the image, and the violet statements overlap the frame bottom
  (typography crossing the boundary).
- Experience: the eight questions sit on a system rail with a gradient
  connector that grows as each question is read (--qdone, verified
  0.5 at 4/8).
- Leadership: the positioning statement scales in from .94 with
  letter-spacing settling to -0.02em — monumental, no decoration.

**Interlude:** statements settle from a slight scale with a 1.6s ease —
a breathing cinematic pause.

Fixes: stat-beat IO replaced by a deterministic centre picker; env
full-bleed abandoned for a container-spanning layout (no overflow, no
fragile viewport math); auto-unfold now respects manual exploration
(only auto-opens when nothing is open — single-open can't be overridden
by scroll); QA extended (atmo, 4 word groups, 2 ghosts, stat grid/size,
env sheet/caption, lead transform).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: LAYER 5 (arrival · unfolding story · climax states)

Continuing the immersive build — the remaining spec beats:

**Portrait entering the story (prologue):** a framed fragment of the real
portrait sits in the opening scene — it fades in, drifts left-and-down
opposite to the title lines, slowly grows (scale 0.96→1.05) and passes
out of frame as you scroll into the story (verified live: is-in +
transform at scroll). Hidden on tablet/mobile; static under reduced
motion.

**SCROLL = narrative — chapters unfold themselves:** on desktop (≥1081px,
no reduced motion), pausing on a chapter row for ~0.9s auto-opens it
(previous chapter closes — single-open preserved). Fast scrolling never
triggers it; manually closing a chapter opts it out of auto-opening.
Verified: pause on chapter 03 → it opens. Touch/mobile stays click-only.

**Experience questions — sequential emphasis:** the eight questions dim
at rest and light up one-by-one as they enter the reading band
(IO threshold 0.6 → is-read; verified 4/8 read at mid-scroll).

**Leadership climax — two visual states:** "Does it look good?" leads
(the struck-through line at full presence) while "Does it work?" waits
dimmed below; when the positioning statement enters, the states flip —
"Does it work?" resolves to full color as the lead dims, then
"I'M A CREATIVE PERSON FIRST." takes the frame.

**The quiet ending:** the final "still curious / still learning"
paragraphs of the leadership chapter are marked .is-quiet — softer
14.5px/1.85 type, hairline top rule, narrower measure — the story
quiets before the credits.

**Stats:** numerals scaled up (to ~5.8rem) with a soft ink glow; each
cell gets a hairline that draws out on hover/reveal.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (frag, quiet ending,
duo, 8 questions) · hybrid ALL CLEAN · experience 13 widths · doctor
SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: IMMERSIVE STORY EXPERIENCE V2 (cinematic worlds)

Full experience-layer rebuild of the About page. Content, section
architecture and chapter order untouched (about_qa: 0 missing strings,
same sections, same six chapters). Everything below is presentation.

**Visual worlds (no dark/light alternation):** each chapter is now its
own environment with its own palette and ambient lighting —
01 Motion = deep ink + electric blue (motion-lab frame-corner ticks on
the figure, slow image pan) · 02 Interaction = cool light + cyan ·
03 Environment = deep indigo + violet (the two statements become huge
centered cinematic typography events) · 04 Experience = paper +
ultramarine (the 8 questions become large serif lines with numbered
markers, one dominating at a time) · 05 People = warm neutral + coral
(image-first, human) · 06 Creative Leadership = graphite + ivory
("Does it look good?" / "Does it work?" stacked as two visual states,
then "I'M A CREATIVE PERSON FIRST." as a full centered positioning
statement at up to 5rem). Smooth background transitions between worlds.

**Zoom-out stage (the signature interaction):** inside the summary, a
scroll-scrubbed FRAME → INTERACTION → ENVIRONMENT → EXPERIENCE sequence —
a framed view of the experience-centre imagery expands (scale 0.5→1.12)
and the four stage labels light up as you scroll. Verified live:
--zp 0.33→0.91, labels 2→4.

**Story compass:** a fixed top-center pill (chapter number · name ·
progress hairline · dropdown of all six chapters). Appears once the
prologue is passed, updates live with scroll (04 · Experience, fill
0.667 verified), opens a chapter list for direct navigation (selecting
opens the chapter), Esc closes, adapts its colors to the light/dark
world, hidden on tablet/mobile.

**Scroll-driven dominance:** the chapter in view is visually current —
others recede (opacity .5, subtle scale), the current one leads. Ties
and instant jumps handled; reduced-motion and mobile keep everything
fully visible.

**Nav adaptation (real dual theme):** a rAF-throttled geometry check
sets body[data-env] = light|dark from the section occupying the most
viewport pixels; the site nav (and compass) smoothly switch to dark
type on ivory glass in light scenes and light type in dark scenes.
Verified: frame:light · acts:dark · credits:light · back to dark.

**Post-credits footer:** the about page's arena footer gains an ambient
radial glow at its top edge (deep ink + atmospheric blue) and the "fin."
marks the end with a slow tracking-expand — content identical.

**Cinematic interlude:** "THE DISTANCE BETWEEN THE IDEA AND REALITY."
scales to ~5.6rem with wider tracking, longer breathing space and a
slower parallax — a real pause before the next chapter.

**Cursor:** portrait and figures now carry EXPLORE (images invite
exploration); chapters keep OPEN. Restrained dot/ring unchanged.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 (11 widths) · 0 broken links · about_qa ALL CLEAN (worlds,
zoom stage, compass 6 items, questions single-column, duo stacked,
statement sizes, env-centered statements, footer glow) · hybrid ALL
CLEAN · experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: STATS + SUMMARY REDESIGN + AUDIT (per user)

Per directives:

1. **Real numbers** — the by-the-numbers band now shows the actual
   figures: **12+ Years of practice · 65+ Clients served · 100+ Projects
   delivered** (3 cells, count-up keeps the "+" suffix as a serif-italic
   accent, aria-label carries the final value). Verified post-count:
   12+ / 65+ / 100+.
2. **Summary redesign** — the Frame summary is now an editorial profile
   spread: a section head (✦ Summary label + hairline, big serif-italic
   kicker statement), then a two-column grid with the **portrait on the
   left (sticky, layered offset frame, caption)** and the lede prose on
   the right (drop cap), and the **chain + zoom lines moved into a
   full-width kinetic band** below (hairline top rule, oversized display
   type, stepped zoom). Verified: portrait left of flow, sticky, kinetic
   full-width below, mobile stacks with 0 overflow.
3. **Side rail removed** — the fixed right-edge chapter rail (nav,
   ticks, name, observer) is gone from markup, CSS and JS.
4. **"01" ghost removed from the summary** — the outlined numeral behind
   the portrait is gone (the AV watermark was removed with it for a clean
   background).
5. **Audit pass** — axe 0 (12 pages + open scene), responsive 0 (11
   widths), 0 broken links, 0 overflow at 1440/390, footer geometry
   unchanged, reduced-motion respected; all other about-page features
   (marquee, interludes, cursor, spotlight, pull-quotes, Fig numbering,
   progress hairline, credits) verified intact via about_qa.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 · responsive 0 ·
0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN · experience 13
widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: LAYER 4 (cursor · marquee bookend · rail name · spotlight)

Continuing the about page elevation — the interaction layer:

**Custom cursor with contextual labels (about page):** the arena cursor
system now also activates on the About page (pointer-fine only, JS-gated
via a `.about-cur` body class so a JS failure never leaves the cursor
hidden; reduced-motion disables it). Labels are authored into the markup
via `data-cur`: **OPEN** on every chapter trigger (6), **VIEW** on the
summary portrait. Verified: ring + dot render, body cursor:none, labels
switch on hover.

**Credits marquee — the narrative bookend:** the closing credits now end
with the same role crawl that opens the page, running in **reverse** (52s,
mask-faded, hover-pauses, reduced-motion safe) — the story opens and
closes with the same motion.

**Rail chapter name:** the fixed chapter rail now shows the **current
chapter's name** vertically beside the number (updates live with the
scroll observer — verified "Experience" at chapter 04; hidden on
tablet/mobile).

**Cursor spotlight:** moving the pointer over the evolution section
lights a soft radial spotlight that follows the cursor (CSS vars --sx/--sy
set on pointermove, 7.5% alpha, fades in/out on enter/leave, pointer-fine
only). Verified live (spot-on + var set).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (about-cur, rail
name, credits marquee, 6× data-cur OPEN, data-cur VIEW) · hybrid ALL
CLEAN · experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — ABOUT PAGE: LAYER 3 (editorial detail + interactions)

Continuing the about page elevation — the immersive layer:

**By-the-numbers count-up:** the stats band numbers now count up with an
eased animation when they enter the viewport (IntersectionObserver, 1.1s,
reduced-motion safe; chapters stay zero-padded "06"; aria-label carries
the final value). Verified live: 12 · 16 · 3 · 06.

**Interactive chapter rail:** the fixed rail is now a <nav> with six
clickable tick dots along the progress line — clicking a tick opens that
chapter (verified: tick 03 → panel opens, tick lights, rail number
updates). Active tick is lit while scrolling.

**Prologue identity + entrance:** a giant serif "AV" monogram ghost sits
behind the title card; the two title lines reveal with a masked
clip-path rise (pure CSS, staggered 0.14s, reduced-motion safe — no
transform conflict with the scroll parallax).

**Editorial detail:**
- In-scene statements become pull-quotes (2px accent left border +
  indent).
- Figures in chapters are auto-numbered "Fig. 0X — " via CSS counters
  (presentation only — authored captions untouched; empty captions show
  no prefix).
- Film grain overlay (feTurbulence, 3.5%) on the dark evolution and
  interlude bands.
- Hover-preview frames carry a chapter stamp (outlined pill with the
  act number).
- Micro-interactions: logo tiles lift on hover, list rows indent, the
  credits portrait scales slightly.

**Bug found & fixed (important):** `--ease-out` was only defined inside
`body.home-arena`, so every transition/animation using `var(--ease-out)`
was silently invalid on all other pages (about page title reveal,
chevron rotation, preview slide, portrait frame, scene entrance — and
the homepage's own scoped value shadowed the same). Globalized to
`:root` — verified: title reveal now runs (animation prologueLine,
clip fully opens) and chevron transitions are live (0.45s).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (monogram, 6 ticks,
count attrs, preview stamp, Fig numbering, pull-quote border) · hybrid
ALL CLEAN · experience 13 widths · doctor SYSTEM READY · mirror
auto-synced.

### v2.4.20 — ABOUT PAGE: IMMERSIVE LAYER 2 (motion + narrative depth)

Continuing the about page elevation — deeper immersion and creativity:

**By the numbers band (derived, never fabricated):** after the summary, a
hairline-separated stats strip computes real figures from the content
store — years of practice (earliest employment year → 2026), clients
served, published case studies, chapters — as large tabular-numeral
Poppins figures with letterspaced micro-labels.

**Epic interludes:** the two epic statements ("THE DISTANCE BETWEEN THE
IDEA AND REALITY." / "GOOD IDEAS HAVE TO SURVIVE REALITY.") are lifted
out of the chapter body and become full-bleed cinematic pauses between
chapters — radial glow, hairline rule, serif-italic display with
scroll parallax, ✦ ✦ ✦ mark. A global queue spreads them one per
chapter break for rhythm.

**Scroll depth choreography (reduced-motion safe):**
- Prologue title lines drift at different speeds as you leave (line 1
  −0.10×, outline line −0.20×) while the role marquee slides down
  (+0.22×) — parallax depth, verified live (−30px / −60px / +66px @300px).
- Ghost numerals (summary + chapter scenes) get data-parallax drift.
- Open chapter: reading-progress hairline in the sticky head fills with
  scroll position (verified 0.69 → 1.00 through chapter 04).
- Scene entrance animation (fade + rise) on expand.

**Editorial detail:** drop cap (serif, accent) on the summary's first
paragraph; giant serif "AV" watermark behind the summary spread;
blueprint hairlines across the prologue; soft curtain radii where the
light summary meets the dark evolution and the dark evolution meets the
light credits (28px top radius, −26px overlap); hover-preview images
breathe (scale 1.07); a quiet "fin." mark at the end of the credits.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN (stats 4, interludes
2 with both texts, fin, progress hairline, watermark, curtains) ·
hybrid ALL CLEAN · experience 13 widths · doctor SYSTEM READY · mirror
auto-synced.

### v2.4.20 — ABOUT PAGE: WORLD-CLASS ELEVATION (editorial-cinematic)

Per request — the About page was elevated from functional to
award-level editorial-cinematic design. Every authored word is preserved
(about_qa 0 missing); only presentation changed:

**Prologue (opening title card):**
- Title scaled to ~7rem Poppins with the final line as a giant
  text-stroke outline ("designing *experiences.*" in outlined serif) —
  classic film-title contrast. Fixed a latent bug: the 3-line template
  referenced an unset line (blank row); the title is now exactly two
  lines.
- Roles kept as separated small caps, plus a slow 44s **role marquee**
  crawling along the bottom edge (mask-faded, ✦ separators, reduced-
  motion safe) and a "Scroll into the story" cue with an animated line.

**Summary (Act 01 · Frame):**
- Giant outlined "01" ghost numeral behind the spread, a "Summary"
  micro-label with hairline, serif-italic kicker.
- Portrait: sticky, with a double-frame offset border that expands on
  hover (portfolio-standard detail), soft shadow, caption below.

**Evolution (the centerpiece):**
- Outlined chapter numerals (fill on hover/open), display names up to
  ~4.6rem, "+" chevron that rotates 90° on hover / 45° when open, name
  slides on hover — a true cinematic chapter index.
- Hover preview frames are bigger (300px), enter with a slight rotation
  that settles.
- Open scenes: radial glow backdrop, larger ghost numeral, sticky
  chapter rail, body type at 16px/1.72 (international reading
  standards), epics as inset title cards, rounded figures.
- Section header gains a serif-italic "06 Chapters" meta.
- **Fixed chapter rail** on the right edge (desktop): shows the current
  chapter number + vertical gradient fill as you scroll (Intersection-
  Observer driven, hidden on mobile).

**Credits:** portrait ring, larger serif quote, letterspaced role,
signature, CTA — tightened spacing.

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages) ·
responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY · mirror auto-synced.

### v2.4.20 — SITE MIRROR (abhijeetvarghese folder auto-sync)

Per request — the workspace mirror folder can no longer go stale:

- `PublishEngine::publish()` now calls `mirrorSite()` after every
  successful publish: the generated site is copied into `AV_MIRROR_DIR`
  (defined in config.local.php → `/home/user/abhijeetvarghese`, dev only;
  never configured in production). Covers every publish path — admin
  Publish button, auto-publish cron, API.
- Mirror failure is logged but never rolls back or fails a good publish.
- Manual helper `backend/scripts/mirror-site.php` (dev-only, excluded
  from release tarballs) refreshes the mirror without republishing.
- Verified end-to-end: force republish → mirror's cache-bust updates and
  all 23 HTML + css/js/assets are byte-identical to the published site.

### v2.4.20 — DEEP CLEANUP (dead code · files · assets)

Per request — workspace + codebase purged of everything unused:

**CSS (−~14 KB):** removed the entire legacy `.hero` design system (the
About page no longer uses a hero) — base block, v2.4.1 availability
chip/halo/caption, media-query hero rules (tablet/mobile/tiny/landscape/
tablet-landscape/mid-desktop/ultrawide/4K), reduced-motion + print hero
rules, the old `.about-body--closing` finale, `.footer__topline`, the
bare `.marquee` wrapper + hover-pause (homepage tracks use
`.hp-hero__marquee`), the `.about-statement--finale` variant (finale now
lives in credits), and stale hero/journey comments. Kept `.hero__roles-item`
(shared with the homepage hero) and all CMS-conditional styles.

**JS (−2.7 KB):** removed the hero word-by-word title splitter (`.w`/`.wi`),
the `plateIO` clip-path observer, and the hero scroll-exit transitions —
all targeted elements that no longer exist.

**Assets (−46 files):** orphaned logo `.png` + `.avif` variants (pages use
`.webp`), `essays/*.jpg|webp` and `journal/*.jpg` + journal-01/02.webp
subfolder duplicates (root `.webp` files are the live ones; journal-03/04
kept — referenced by draft articles). Removed from site-template,
public_html/site and the abhijeetvarghese mirror. Font OFL license texts
kept. Link audit after purge: ZERO broken links/assets.

**Files:** removed stale footer-width probes (fw_audit*) and all
screenshots (previews/ — regenerable). Verified the 12 "unreferenced"
PHP files are all intentional cron/CLI entry points (documented in
DEPLOY-HOSTINGER-PHP.md) — kept. System docs in avos-php/docs kept.

Battery after purge: E2E 133/133 · integration 67/67 · failure 20/20 ·
journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin
48/48 · booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages)
· responsive 0 · 0 broken links · about_qa ALL CLEAN · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE v5 + SITEWIDE FOOTER (per user directives)

1. **Footer unified sitewide** — the arena footer (dark #05070D, single
   row: brand · Menu · Resources · Legal + icon Social, space-between
   bottom strip) is now THE footer on every page (homepage, story,
   experience, case studies, contact, 404, articles). The classic
   multi-column footer branch was removed from the renderer; CSS scoping
   moved from `body.home-arena .footer` to `.footer--arena` so it applies
   everywhere. Verified identical on contact.html (bg rgb(5,7,13), 4
   columns, single row).
2. **Frame title removed** — the summary section ("Frame") no longer
   carries the act title; the lede + chain/zoom paragraphs + sticky
   portrait now read as a plain "about me" summary, opening with the
   Frame note as a serif-italic kicker line (copy preserved).
3. **Evolution renumbered from 01** — the accordion chapters are now
   numbered 01–06 (Motion → Creative Leadership), labels "Chapter", with
   a "01 / 06" counter in each scene head.
4. **Hover preview on every chapter** — hovering a collapsed row floats
   that chapter's first frame beside it (absolute image, fade+slide,
   pointer-events none, hidden on mobile).
5. **Inner scene redesign (creative)** — each expanded chapter is an
   editorial sheet: giant stroked ghost numeral behind the content,
   two-column grid with a sticky chapter rail (number eyebrow, Poppins
   display title, serif-italic note, chapter counter) beside the full
   content flow; images, statements, epics and lists keep their authored
   order. Stacked on tablet/mobile.
6. **Typography per international standards** — display set to the
   loaded Poppins stack (removed the never-loaded "Pondar" first-choice),
   body prose 15.5px/1.7, serif-italic notes, uppercase micro-labels
   with wide tracking, balanced measure ≤58ch.

Battery: E2E 133/133 · integration 67/67 (standalone) · failure 20/20 ·
journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin
48/48 · booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages +
open scene) · responsive 0 · 0 broken links · about_qa ALL CLEAN (frame
title gone, chapters 01–06, hover preview opacity 1, ghost + sticky
head, footer identical on contact, images 7/7) · hybrid ALL CLEAN ·
experience 13 widths · doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE: THE STORY (Frame summary + expandable acts)

Per user directives:
1. **Act 01 · Frame is now a summary section, always visible on the page**
   — the lede (moved off the page in the previous pass) returns inside it;
   the section shows eyebrow/title/note + the kinetic chain/zoom paragraphs
   + the authored portrait (sticky on desktop). No click needed.
2. **Acts 02–07 expand below — no overlays, no new pages.** The strip rows
   became an accordion (number + name + rotating "+" chevron). Clicking a
   section opens its full content inline beneath the trigger (smooth
   grid-rows animation, single-open behaviour, aria-expanded, focus ring).
   **Images in every section:** acts already carrying imagery keep it;
   Interaction gets the BPCL project frame and Creative Leadership gets
   the Indian Army frame (real work, authored captions) — every one of the
   seven sections now has at least one image.
3. **The "Making ambitious ideas impossible to misunderstand." band above
   the footer is removed** — the fa-scene block is gone from the renderer
   and the stylesheet (all pages; the arena footer now starts directly).

Also cleaned: the overlay controller JS, the act-overlay/fa-scene CSS
(duplicated block from a bad merge was excised — file back to a single
EXPERIENCE + CURSOR + ABOUT section), hybrid_qa updated (fa-scene absence).

Battery: E2E 133/133 · integration 67/67 (standalone) · failure 20/20 ·
journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin
48/48 · booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages +
open panel) · responsive 0 · 0 broken links · about_qa ALL CLEAN (frame
visible, lede on page, 6 triggers, images 7/7, inline expand, single-
open, no overlays, no fa-scene) · hybrid ALL CLEAN · experience 13 widths
· doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE: THE FILM, TIGHTER (visible page stripped)

Per repeated feedback ("still a lot of content"), the visible About page
was stripped to the bare cinematic skeleton — the full narrative now lives
inside the act scenes, not on the page:

- **Prologue** — title card only: eyebrow, statement title, role tags.
  The three-paragraph lede ("I started by making images…") is no longer
  shown on the page; it opens **Act 01's scene** as the first prose block
  (byte-preserved, styled as the scene's opening line).
- **Film strip** — rows are now pure number + act name + "Play" (the
  per-act note moved out; it stays in each scene's header). Hover preview
  frame kept. Names scale up (cinematic film-menu feel).
- **Scenes / credits** — unchanged (full-screen overlays + end credits).

Page height: 19,632px → 10,859px → 3,366px → **3,072px total** (−84% vs
original; content ≈ 2,050px, the rest is the global footer).

Battery: E2E 133/133 · integration 67/67 (standalone) · failure 20/20 ·
journeys 14/14 · inbound 18/18 · 2FA 21/21 · axe 0 (12 pages + open
scene) · responsive 0 · 0 broken links · about_films_qa ALL CLEAN (incl.
"no lede on page", "lede in act 01", "no strip notes") · hybrid ALL
CLEAN · experience 13 widths · doctor SYSTEM READY.

### v2.4.20 — ABOUT PAGE: THE FILM (no hero · full-screen act scenes)

Second About pass — the page is now a short film. The hero is gone, the
page itself is compact (content ≈ 2,300px; 19,632px → 3,366px total incl.
footer, −83%), and every word of content is preserved byte-for-byte
(about_films_qa — 0 missing strings):

- **Prologue (no hero)** — one compact dark title card: eyebrow "The
  Story", the statement title on two lines (serif em finale), the lede,
  the four role tags.
- **Film strip** — the seven acts (01 · Frame → 07 · Creative Leadership)
  as one editorial rail: number, name, note, "Play" affordance; hover
  lifts the name and reveals the act's first frame as a preview card.
- **Full-screen act scenes** — clicking an act opens it as an immersive
  overlay (dialog, full-viewport): giant ghost numeral, "ACT 0X / 07"
  meta, the act's name + note, the complete authored content (kinetic
  chain/zoom/duo paragraphs, statement moments, epics as dark title
  cards, figures, 2-column question lists, the logo wall), and Previous /
  Next act navigation that wraps 07 → 01. Esc closes, focus returns to
  the act row, Tab is trapped inside the scene, body scroll locks.
- **End credits** — light paper band: framed portrait (with caption),
  rule, the finale quote, role line, signature, "Start a conversation".
- The finale quote + CTA are pulled out of the acts into the credits (no
  duplication). Parallax is disabled inside scenes (their scroll context
  is the overlay panel).

Battery: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
14/14 · inbound 18/18 · 2FA 21/21 · functional 13/13 · admin 48/48 ·
booking 7/7 · case-nav 8/8 · contact-cta 2/2 · axe 0 (12 pages + open
scene) · responsive 0 · 0 broken links · about_films_qa ALL CLEAN ·
hybrid_qa ALL CLEAN · experience 13 widths (renderExperience restored
byte-identical from v2.4.19 after an over-eager cleanup) · doctor SYSTEM
READY.

## v2.4.19 — EXPERIENCE PAGE REBUILT (after sandbox rollback)

The sandbox environment rolled the workspace back to the v2.4.8-era code
tree and wiped the v2.4.16–18 release tarballs. The Experience page
(v2.4.17/18 state) has been rebuilt from the conversation history on the
v2.4.15 base, which survived. The seed file (avos-data/site.json) retained
the six-job Experience page and the About story, so content is identical.

**Rebuilt and verified:**
- `Experience` template dispatch + `renderExperience`/`expJob` (v2.4.18
  immersive renderer: cinematic opening with the outlined "06" numeral,
  meta row, scroll-linked timeline, hover motion).
- The full scoped `body.experience-page` CSS (77 exp rules).
- JS: journey eraCount fix, "View all responsibilities" expand handler,
  scroll-linked `--exp-fill` timeline.
- Admin "Employment entry" block type in Pages → Layout.
- Version → 2.4.19 (cache-bust).

**QA:** experience_qa ALL CLEAN (6/6 jobs, discipline counts
17/11/18/12/15/8, expand PASS, 0 overflow / 0 clipped across 13
viewports) · immersive mechanics verified (numeral geometry, timeline
fill 0.22→1.0, hover transitions) · axe WCAG A/AA 0 · reduced-motion
clean · E2E 133/133 (v2.4.19) · integration 67/67 · failure 20/20 ·
journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional PASS ·
admin 48/48 · responsive 0 · 0 broken links · booking 7/7 ·
About page green · doctor SYSTEM READY.


## v2.4.15 — ABOUT: EVOLUTION SECTION SCROLL FIX

**Reported bug**: in the About page's evolution (journey) section, the act
eras were invisible while scrolling — the section read as mostly blank.

**Root cause** (found with a scroll-position probe at 6 viewports): the
eras carried `data-reveal`, which gates visibility behind an
IntersectionObserver (threshold 0.15, −6% rootMargin). Inside the
scroll-scrubbed, continuously-translating track, that observer fires far
too late: eras only became visible after sliding fully across the
viewport, and the final era ("Creative Leadership") could remain
`opacity: 0` for the entire journey (verified at 1440/1280/1024/901 —
on-screen at scrub end yet invisible).

**Fix** (one line in the About renderer): the era items in
`aboutJourney()` no longer carry `data-reveal`. The horizontal slide is
the motion; eras are always visible. The journey head (meta/title/hint)
keeps its reveal — those are normal-flow elements that reveal correctly.
Homepage journey untouched (same renderer pattern, out of scope).

**Verified**: probe now shows all 7 eras visible at every scrub position
(0→100%) at 1440/1280/1024/901/900/390 · sticky pin + track transform +
bar 01→07 unchanged · E2E 133/133 (v2.4.15) · integration 67/67 ·
failure 20/20 · journeys 14/14 · inbound 18/18 · 2FA 21/21 ·
functional PASS · admin 48/48 · axe 0 (12 pages) · responsive 0 ·
0 broken links · booking 7/7 · doctor SYSTEM READY.


## v2.4.14 — DEAD CODE & FILE REMOVAL

Forensic cleanup pass: removed code that is never reached and files that
are never referenced. Verified dead by static analysis (usage scans across
all PHP/JS/HTML sources) before deletion; the full test battery confirms
zero behavior change. Version bumped for cache-busting.

**Removed — site CSS (`site-template/css/styles.css`, −3.2KB):**
- `.case__ghost` (base + 3 media rules) — markup removed in v2.4.5
- The entire NOTICE OVERLAY component (`.overlay`, `.overlay__backdrop`,
  `.overlay__panel.notice`, `.notice__title/body`, `.overlay__close`) —
  superseded by the booking embed modal; no element uses it
- `.case__cta` (replaced by `.case__card-cta` in v2.4.4)
- `.book-divider`, `.hero__contents`, `.nf`/`.not-found` (404 page uses
  `page-hero`), `.label--accent`, `.link-arrow--light`, `.in-em`

**Removed — site JS (`site-template/js/main.js`, −84 lines):**
- The NOTICE OVERLAY cluster (openOverlay/closeOverlay/trapFocus/
  overlayTraps/isolateOverlay/restoreChrome/pageChrome/lastFocus, the
  `[data-notice]` handler, the `NOTICE` copy object) — dead: no `.overlay`
  or `#notice` element exists anywhere in the generated site

**Removed — admin CSS (`public_html/admin/app/css/avos.css`, −4.6KB):**
- 53 rules for 33 never-referenced classes: activity-item*, ai-tip*,
  ai-msg--user, ai-prompts, avail-day*, avail-grid, avatars, block-card*,
  btn--icon, chart-card, cmd__group-label, dragging, editor-field,
  field-row-3, is-on, lead-card__tags, legend, media-item__check,
  meeting-card__time, rich__area, swatch__hex, toggle-label, view--narrow
  (one `@media (max-width: 420px)` block contained only dead rules and was
  removed whole; the other 3 media blocks are intact)

**Removed — files:**
- `site-template/assets/essays/essay-{01..04}.jpg` and
  `site-template/assets/journal/journal-{01..04}.jpg` (+ their copies in
  `public_html/site/assets/`) — the site renders the .webp versions;
  the .jpg sources had zero references

**Kept (audited, not dead):** all 27 migrations (checksummed), schema.sql
(security-probe canary + reference), provision.sql (start.sh), docs/,
dev-only CLI scripts (excluded from the release), admin media (all
referenced by the admin UI), tokens.css (generated at publish).

**Verified:** hero matrix + journey + overflow identical to v2.4.13
(no behavior change) · E2E 133/133 (v2.4.14) · integration 67/67 ·
failure 20/20 · journeys 14/14 · inbound 18/18 · 2FA 21/21 ·
functional PASS · admin 48/48 · axe 0 (12 pages) · responsive 0 ·
0 broken links · booking 7/7 · doctor SYSTEM READY.


## v2.4.13 — ABOUT PAGE v4: THE HOME THEME (immersive, homepage-native)

The About page now speaks the homepage's own visual language — same hero
composition, marquee, journey strip, chapter rhythm and logo wall. The
seven-act story is preserved verbatim (42/42 paragraphs, 14/14 list items,
all statements) and re-directed through the site's native components.
Only the About page changed; the global design system is untouched.

**The composition (all homepage components):**
- **Hero** — the exact homepage hero: editorial type stack left, art-directed
  portrait plate right with halo + caption, availability chip, roles line,
  two CTAs (Start a conversation / Download résumé), scroll cue and the
  keyword marquee (VFX · Animation · Visual Storytelling · Interactive ·
  AR/VR · Immersive · Experience Design · Creative Leadership).
- **The Evolution** — the homepage journey strip (sticky, horizontal,
  scroll-scrubbed) rebuilt with the seven acts as eras: Frame → Motion →
  Interaction → Environment → Experience → People → Creative Leadership,
  each with a one-line note; progress bar reads "01 / 07" → "07 / 07"
  (the era count is now read from the DOM — homepage stays "09").
- **Acts as chapters** — the seven acts render as alternating t-dark /
  t-light homepage chapters with the standard chapter meta labels, prose,
  cinematic frames and statements inside.
- **Cinematic frames** — real portfolio imagery: essay artwork (Motion),
  the experience centre as an edge-to-edge 21:9 bleed (Environment), Orange
  Business work (Experience), the working-session as an offset documentary
  frame (People) — each with the homepage parallax + masked reveal.
- **Epic title cards** — the two big statements as full-width dark bands.
- **Clients** — the homepage logo wall (same tiles, same hover behavior).
- **Final frame** — ruled, centered serif finale + signature + role line +
  single CTA, transitioning into the existing footer.

**Bugs found & fixed during this pass:**
- The v2.4.1 unscoped `.hero__media { position: relative; }` override had
  crept back into the stylesheet alongside the v2.4.9 scoped fix, breaking
  the desktop hero again (plate pushed below the fold, invisible at load,
  hero inflated to 1443–1896px). Removed the unscoped rule — desktop is a
  proper 100svh composition again; the stacked ≤1080px layout keeps its
  scroll reveal, exactly like the homepage.
- Journey era counter now derives from the DOM (7 acts → "01 / 07").

**Verified:** hero visible at all 8 target resolutions (5 at load, 4 stacked
reveal-on-scroll exactly like the homepage) + unusual aspect ratios · 0
overflow at 14 widths · journey scrub + bar verified at 1440 and mobile
(static vertical) · axe WCAG A/AA 0 (12 pages) · reduced motion clean ·
all 16 images load · E2E 133/133 (v2.4.13) · integration 67/67 · failure
20/20 · journeys 14/14 · inbound 18/18 · 2FA 21/21 · functional PASS ·
admin 48/48 · responsive 0 · 0 broken links · booking 7/7 · doctor
SYSTEM READY.


## v2.4.12 — ABOUT PAGE v3: DIRECTED AS A FILM (seven acts)

The About page is re-directed as a short film in seven acts — same story,
same copy (verified verbatim: 42/42 paragraphs, 14/14 list items), same
identity. Composition, pacing, typography and imagery rebuilt. Only the
About page changed; the global design system is untouched.

**The seven acts** (visual metaphor for the career):
01 · Frame → 02 · Motion → 03 · Interaction → 04 · Environment →
05 · Experience → 06 · People → 07 · Creative Leadership.
Each act opens with a ruled label — numeral in serif italic accent,
act name in tracked caps. All existing copy was re-edited into the arc
(no sentences added or removed; acts replace the old four act labels).

**Direction decisions:**
- **Opening**: asymmetric 7/5 grid — statement left, portrait right in a
  ruled gutter, bleeding to the viewport edge (film-title composition).
  Portrait is an in-flow aspect-ratio grid child — cannot disappear;
  verified visible + intentionally sized at 1920/1440/1366/1280/1024/
  768/390/375 × their heights.
- **Typography disciplined**: sans (Inter Tight) is the primary voice;
  the serif italic is reduced to four accents (hero em, zoom-out final
  line, finale, signature). The evolution chain now uses small tracked
  "LED TO" connectors and color accents instead of repeated serif italics.
- **Rhythm**: text → image → statement → full-bleed visual →
  typographic transition — never three text blocks in a row. Spacing
  68–152px sections; no dead zones (max padding 176px on the two epic
  title cards).
- **Cinematic frames**: real assets only — portrait (hero), essay artwork
  (Motion), experience centre as an edge-to-edge 21:9 bleed (Environment),
  Orange Business work (Experience), working session as an offset
  documentary frame (People). Images can now be set wide / bleed / tall
  in the CMS.
- **Fixed a real bug found during QA**: the reveal system's scale(1.08)
  zoom on [data-reveal="img"] images painted outside the frame and added
  13–55px of horizontal overflow at every width. Clipped at the frame
  boundary — the intended cinematic zoom, zero document overflow.
- **Epic title cards**: "THE DISTANCE BETWEEN THE IDEA AND REALITY." and
  "GOOD IDEAS HAVE TO SURVIVE REALITY." as centered full-width statements
  on a subtle radial glow band.
- **Ending**: final frame — ruled, centered serif finale, signature,
  role line, single conversation CTA; transitions into the existing footer.

**CMS**: all content remains editable in Admin → Pages → Layout; quote
blocks offer statement/serif/question/signature/epic/finale/act styles;
image blocks offer wide/bleed/tall layouts.

**Verified**: hero visible at all 8 target resolutions + unusual aspect
ratios · 0 overflow at 320–1920 (14 widths) · axe WCAG A/AA 0 (12 pages) ·
reduced motion clean · all 16 images load · E2E 133/133 (v2.4.12) ·
integration 67/67 · failure 20/20 · journeys 14/14 · inbound 18/18 ·
2FA 21/21 · functional PASS · admin 48/48 · responsive 0 · 0 broken
links · booking 7/7 · doctor SYSTEM READY.


## v2.4.11 — ABOUT PAGE v2: WORLD-CLASS EDITORIAL LAYOUT

A complete redesign of the About page's design & layout (story.html) —
same story, same copy, dramatically better film. Still only the About
page; no global design, nav, footer, homepage or other page changed.

**Root causes of the v2.4.10 "doesn't look good":**
- The page body class never matched its CSS (`about` vs `body.about-page`),
  so the dark canvas was never applied — sections sat on the light theme.
- Text tokens (var(--cm)/var(--ct)) resolved from the light theme: muted
  text was the light gray, bold text was near-black on dark navy —
  muddy, low-contrast, invisible strong text.
- Statement typography was flat — every statement rendered at the same size.

**The new layout (v2.4.11):**
- **Film-chapter structure**: four act labels — 01 · The Frame / 02 · The
  Interaction / 03 · The Environment / 04 · The Whole Experience — each a
  tiny tracked label with a hairline, mapping the zoom-out narrative.
- **Opening act**: headline up to ~94px with serif-italic accent; the
  portrait bleeds to the right viewport edge on desktop (film-title feel),
  hairline under the frame, small-caps caption; stacks centered on tablet,
  full-width on mobile — can never disappear (in-flow + aspect-ratio).
- **Evolution chain**: each line spans the full container (~1280px) with
  the connector in small italic serif ("Animation *led to* visual
  storytelling.") — no more cramped 620px columns.
- **The zoom-out**: four lines stepping right and growing (39→78px desktop,
  25→44px mobile) — frame → interaction → environment → the whole
  experience; the last line in italic serif accent.
- **Signature statements differentiated**: statement (all-caps ~86px),
  serif italic, question, and two **epic full-bleed title cards**
  ("THE DISTANCE BETWEEN THE IDEA AND REALITY." / "GOOD IDEAS HAVE TO
  SURVIVE REALITY.") at up to ~131px centered on a radial glow band.
- **Does it look good? / Does it work?** — proper two-column contrast with
  a vertical hairline (stacks on mobile).
- **Client strip** labelled "Selected organisations" with hairline rule.
- **Closing** — centered finale: hairline rule, serif-italic "— Abhijeet
  Varghese", small-caps role line, single conversation button.
- **CMS**: quote blocks gained a Style select (statement/serif/question/
  signature/epic/finale/act); closing blocks gained a role line. Fully
  editable in Admin → Pages → Layout.

**Verification:** hero visible + 0 overflow at 320–1920 (11 widths) and
unusual aspect ratios; axe WCAG A/AA 0 violations (12 pages); reduced
motion clean; all 14 images load; E2E 133/133 (v2.4.11) · integration
67/67 · failure 20/20 · journeys 14/14 · inbound 18/18 · 2FA 21/21 ·
functional PASS · admin 48/48 · responsive 0 · 0 broken links ·
booking 7/7 · doctor SYSTEM READY.


## v2.4.10 — ABOUT PAGE: LONG-FORM EDITORIAL NARRATIVE

A single-page redesign of the About page (story.html) — one continuous
story, built inside the existing design system. No other page, section,
component or global style changed.

- **Concept**: "I didn't start out designing experiences." — the narrative
  follows Abhijeet from VFX/animation → visual storytelling → interactive →
  AR/VR → immersive environments → experience design → creative leadership,
  as a gradual zooming-out from frame to interaction to environment to the
  whole experience.
- **Format**: one long-form editorial essay — no cards, no timelines, no
  conventional sections. Opening act (giant headline + cinematic portrait),
  evolution chain (large typographic sentences), serif italic interludes,
  signature statements ("THE MEDIUM CHANGES. THE PROBLEM USUALLY COMES
  FIRST." / "THE DISTANCE BETWEEN THE IDEA AND REALITY." / "GOOD IDEAS HAVE
  TO SURVIVE REALITY." / "SPACE HAS A NARRATIVE TOO." / "I'M A CREATIVE
  PERSON FIRST."), the "Does it look good? / Does it work?" contrast, a
  quiet client strip (real logos only), and a restrained closing
  ("That's the work I'm interested in." — Abhijeet Varghese).
- **Content**: all copy supplied/approved by the client, verbatim. Real
  imagery only (hero portrait, experience centre, working session, real
  client logos). No invented clients, stats, awards or claims.
- **Implementation**: new `About` page template in PublishEngine
  (renderAbout + editorial block renderers) — the page is composed of the
  standard CMS blocks (hero/image/prose/quote/list/logowall/cta) so it stays
  fully editable in Admin → Pages → Layout. All styles scoped under
  `body.about-page`; no global CSS/JS changes.
- **Hero image safety**: the portrait is an in-flow grid/flex child with
  aspect-ratio sizing — it cannot collapse or disappear at any width
  (verified 320→1920 + unusual aspect ratios, portrait & landscape).
- **Accessibility**: semantic headings (h1 → h2), unique landmarks, WCAG
  A/AA axe 0 (official suite), reduced-motion clean, keyboard nav intact.
- **Performance**: hero portrait fetchpriority=high; all below-fold images
  lazy with width/height; no new libraries.
- **Tests**: E2E 133/133 · integration 67/67 · failure 20/20 · journeys
  14/14 · inbound 18/18 · 2FA 21/21 · functional PASS · admin 48/48 ·
  axe 0 (12 pages) · responsive 0 · 0 broken links · booking 7/7 ·
  about-page QA: hero visible at all widths, 0 overflow, 0 console errors.


## v2.4.9 — FORENSIC FRONTEND POLISH (no redesign, no new sections)

Forensic QA + polish pass on the approved v2.4.8 design. The design language,
section structure, order, colors, typography and composition are untouched.

**Hero image invisible at most viewports — ROOT CAUSE FOUND + FIXED (2 bugs + 1 alignment bug):**
- The v2.4.1 `position: relative` override on `.hero__media` (added to anchor the
  halo/caption) defeated the base desktop `position: absolute` composition
  site-wide: on every desktop width the portrait dropped into the document flow
  below the text, landing below the fold, so the clip-path reveal never fired —
  hero inflated to 1369–1766px, portrait invisible at load, scroll cue + marquee
  displaced. Fixed by scoping the override to ≤1080px (where the plate is in-flow
  by design). Desktop is a 100svh composition again; portrait visible at load on
  every desktop viewport.
- Second bug: Chromium computes `intersectionRatio: 0` for clip-path-hidden
  boxes, so the 0.15-threshold reveal observer never fired for the plate — it
  stayed stuck invisible even when scrolled into view (all mobile widths).
  Fixed with a dedicated threshold-0 bounding-box observer for the plate.
- Third (alignment): the base `right: var(--pad-x)` offset applied to the
  in-flow plate, shoving it off-center (−20px mobile / −46px tablet). Reset
  `top`/`right` to auto in the scoped in-flow rule — the plate is dead-center
  again on mobile/tablet.

**Audited and verified clean (no changes needed):**
- Spacing: every chapter section 135px top/bottom (consistent); hero/journey
  differ by design.
- Alignment: containers share the same left edge; page-hero type scale
  identical across all inner pages; footer grid aligned.
- Typography: no clipping/overflow of headlines at any width.
- Images: all load (lazy verified with realistic scroll), width/height attrs,
  correct alt semantics (empty alt is correct where a visible figcaption exists).
- Close button: visible, unobstructed, correct z-index on all pages/viewports.
- Calendly embed modal: full-viewport fixed overlay, centered bar, Escape +
  scroll lock, no overflow (320→1440).
- Journey hint hidden on mobile + reduced-motion: by design (sideways-scroll
  hint is desktop-only).
- Performance: CLS 0, load ~142ms, LCP font preload active, hero image
  fetchpriority=high.
- Console: clean (the only 429s were the analytics rate limiter responding to
  the audit probe itself — 300 events/hr/IP, working as designed).

**Matrix verified:** hero visible at load on 12/13 spec viewports and reveals
correctly on scroll on the remaining one (320 — stacked mobile layout by
design); heroH == 100svh on all desktops.

**Tests:** E2E 133/133 · integration 67/67 · failure 20/20 · journeys 14/14 ·
inbound 18/18 · 2FA 21/21 · functional PASS · admin 48/48 · axe 0 · responsive
0 issues (11 widths × 7 pages) · 0 broken links · booking 7/7 · doctor
SYSTEM READY.


# AV OS changelog

## v2.4.8-r1 — FRONTEND ROLLBACK (v2.5.0 design layer reverted)

User requested rollback to the previous state. The v2.5.0 award-polish
design-system layer is reverted; the platform (CMS/CRM/integrations/AI/
hardening/migrations) is untouched and all suites stay green.

**Reverted (v2.5.0 → v2.4.8 look):**
- Design tokens (`--sp-1..50`, `--ts-*`, `--measure`) removed — base scale restored.
- Global rhythm overrides (chapter padding, head margins) removed.
- Hero editorial composition (serif-italic display, tighter leading, 4px media
  frame, spacing overrides) removed — v2.4.x hero (portrait halo, availability
  chip, caption, 24px media radius) restored.
- Navigation "quiet" restyle removed (blur, 1px underline sweep).
- Client logos: grayscale→color hover, 92px tiles, 2px radius removed —
  v2.4.x logo wall (color logos, 124px tiles, 16px radius) restored.
- Featured work: 16:10 / 4:3 panels, 520px glass card, quiet zoom removed —
  v2.4.x panels (16:8.6 / 16:10.5 / 4:4.6) and card restored.
- Footer brand-finale CTA block (`.footer__cta` label/title/line/btn) removed —
  v2.4.1 "footer v2" (topline, availability chip, columns, bottom bar with
  back-to-top) restored. `settings.footerCta` removed from the canonical seed.
- Button unification (`--lg`, press, focus ring override) removed — base buttons.
- Micro-interactions (link-arrow gap, essay hover) removed.
- Page-hero overrides removed — v2.4.x page-hero styles restored.
- Mobile padding overrides (110px hero, token-driven) removed.

**Kept (v2.4.x-era features — NOT v2.5.0, preserved):**
- v2.4.1–v2.4.5 UX layer: availability chip + portrait halo + hero caption,
  in-page Calendly embed modal, mobile-menu close bar, footer v2, no section
  numbers, dedicated case-study pages, in-card "Explore case study" CTA.
- v2.4.7 card typography (client name is the hero line).
- v2.4.8 cache-busting (`?v=2.4.8-<hash>` on css/js).
- v2.4.2 tap targets, anchor offsets, CLS width/height, LCP font preload.
- v2.4.6 page-close z-index/top fix.
- Invisible layout-safety fix kept from v2.5.0: logo-wall `minmax(0,1fr)`
  tracks + `max-width:100%` images (prevents the v2.4.8 tablet blowout at
  768/820px) — zero visual change.

Version constant back to `2.4.8`. Full battery green after rollback
(see report).


## v2.4.8 — ASSET CACHE-BUSTING

- Generated pages now link `css/styles.css` and `js/main.js` with a version
  query (`?v=2.4.8-<hash>`), so a publish always forces browsers to fetch the
  fresh stylesheet/script instead of a stale 24h-cached copy. This was the
  reason the v2.4.7 card changes (client name bigger than headline, "Explore
  case study →", transparent CTA) sometimes appeared not to apply on repeat
  visits.
- Verified on homepage + case-studies: client 36.8px vs title 19.2px,
  label "Explore case study", CTA background transparent.


## v2.4.7 — FEATURED-WORK CARD TYPOGRAPHY

- Client name is now the hero line of the case card (clamp up to 2.3rem, accent
  color, no pill background); the project title is the smaller supporting line.
- "View case study" renamed to **"Explore case study →"** (arrow icon retained).
- The card CTA is now a transparent text link (accent color, white on hover) —
  no background chip. Applied to homepage featured work + case-studies listing.
- Verified: client 36.8px vs smaller title, transparent CTA, axe 0, 0 broken links.


## v2.4.6 — MOBILE CLOSE-BUTTON OVERLAP FIX

- Inner-page close button (✕) moved below the nav toggle on mobile (top 84px) —
  previously its corner overlapped the hamburger at ≤700px. Verified: no overlap,
  all 14 public routes 200, case-study pages complete, card CTA navigation works.


## v2.4.5 — FEATURED-WORK CARD + NUMBER CLEANUP

- **Featured-work detail container** now reads as exactly 4 stacked lines:
  1. industry (e.g. Enterprise Technology)
  2. client — highlighted pill (e.g. Orange Business)
  3. project title (e.g. Enterprise Technology, Made Understandable)
  4. **View case study** button (inside the container, pill style)
  Applied to the homepage featured work + case-studies listing.
- **Ghost numbers removed from case images** (the big 01/02/03 on the photo) — gone
  from markup entirely.
- **No decorative numbers anywhere**: section numerals (02 · Trust), essay list
  numbers, capability numbers, focus numbers, journey-era numbers, the journey
  progress counter, the hero scroll counter, and the mobile-menu leading numbers
  are all hidden. Labels read clean site-wide. Calendar days/time slots keep their
  functional numerals.
- Verified by browser probes (fresh cache): card lines stack at distinct y
  positions, 0 visible standalone numbers on desktop, mobile menu items clean.
  Regression: E2E 133/133 · axe 0 · 0 broken links (55 assets) · public PASS.


## v2.4.4 — SITE-NAME FIX · PAGE CLOSE BUTTON · CLEAN SECTIONS · CASE-CARD CTA

- **Close button on inner pages**: `.page-close` (✕, returns to home) now actually renders —
  it existed in CSS but was never emitted. Present on every inner page, absent on the
  homepage, hidden under the mobile menu overlay (z-order fixed).
- **Site name corrected**: "Abhijeet Varghese" everywhere (brand, footer, hero alt, SEO) —
  was "AbhijeetVarghese.com". Fixed in DB + canonical seed.
- **Section numbers removed**: chapter numerals (02 · Trust etc.) hidden site-wide; the
  hero scroll-cue counter (01/09) hidden too. Labels read clean: Trust · Capabilities ·
  Featured work · Point of view · Journey · Method · Now · Begin.
- **Featured-work card redesign**: the image detail container now reads
  industry → client (highlighted pill) → title → **View case study** button inside the
  card. Old link below the meta row removed. Applied to homepage + case-studies listing.
- **Thinking section**: all four essays now visible (AI Isn't Replacing Creativity and
  Why Enterprise Experiences Fail were real content stuck in draft/review — published;
  the other journal drafts stay isolated by design).
- Verified: 9/9 browser journey checks · E2E 133/133 · admin 48/48 · axe 0 · 0 broken
  links (55 assets) · booking 7/7 · all 17 public routes 200.


## v2.4.3 — DEDICATED CASE-STUDY PAGES + NAV CLEANUP

- Every published project now gets its own dedicated page (`case-study-{slug}.html`)
  with a page hero (client · industry · year), overview image, Problem/Approach/Role/
  Outcome meta grid, optional gallery, back link and a project CTA. Drafts and
  scheduled projects stay isolated (never generated, never in the sitemap).
- "View case study" buttons (homepage featured work + case-studies listing) now open
  the dedicated page instead of an anchor on the listing.
- Dedicated pages are in the sitemap (priority 0.8), search index, and tracked by the
  first-party analytics `case_study_view` event (existing regex matches the new URLs).
- Nav cleanup: the `cta: true` nav item is no longer duplicated — desktop and mobile
  menus show Story / Experience / Case Studies once, with a single "Start a
  conversation" button in the nav bar (and one in the mobile menu actions).
- Verified: nav → story/experience/case-studies/contact all 200 · case-study pages
  render full detail · E2E 133/133 · admin 48/48 · axe 0 · 0 broken links (51 assets).


## v2.4.2 — DESIGN-EXPERT FRONTEND HARDENING (Big-4/FAANG-grade audit)

Measured audit (Playwright: 15 pages × 4 viewports) — all fixes verified post-change.

- Anchor scroll offset: `scroll-padding-top`/`scroll-margin-top` (96px) — deep links to
  case studies no longer land hidden under the sticky header (verified: targetTop 0 → 192).
- Tap-target hit areas (WCAG 2.5.5): nav links 29px → 45px, footer/contact/micro links
  padded to 41px+, link-arrows 31px → 43px, time slots + date cells ≥44px. Visuals unchanged.
- Hero headline double-period bug ("misunderstand..") fixed — trailing punctuation is
  stripped before the emphasized closing period (all viewports).
- CLS: all logo-wall images now carry width/height (160×48) — no layout shift on load.
- LCP: Inter Tight normal woff2 preloaded in every page head.
- Scroll-behavior smooth (respects prefers-reduced-motion).
- Verified clean: 0px overflow on all pages/viewports, exactly one H1 per page, focus-visible
  ring present, print styles + reduced-motion intact, forms all labelled, booking flow 7/7,
  axe 0 violations / 12 pages, 0 broken links, public-site suite PASS.


## v2.4.1 — HARDENING PASS (deep-audit fixes)

### Single installation engine (was: 3 overlapping implementations)
- New `backend/core/MigrationRunner.php` — ONE migration engine (checksummed, idempotent, portable) used by CLI `database/migrate.php`, CLI installer and the web installer.
- New `backend/core/Installer.php` — ONE install engine (create DB → run migrations 001–027 → seed real content → create admin → lock). Both `database/install.php` and `public_html/install/index.php` are thin wrappers.
- Deleted the duplicate root `install/index.php` (private second installer).
- Installer refuses to run twice on an already-installed database.
- Migration invariants: runner skips legacy `USE <db>` statements explicitly and REFUSES any pending file containing CREATE/DROP/ALTER DATABASE; new `database/validate-migrations.php` CI validator + doctor check.

### Crypto (was: unauthenticated AES-CBC)
- Secrets now use versioned **AES-256-GCM** envelopes (v3: iv+tag+ciphertext) in both the Integration Hub and AI provider key store. Legacy v2-CBC values still decrypt; reads lazily upgrade to v3. Tamper detection verified.

### Rate limiting (was: non-atomic file writes)
- `RateLimiter` is now DB-backed (`rate_limits`, atomic INSERT..ON DUPLICATE KEY UPDATE, bounded by maintenance). No more read-modify-write races.
- Proxy trust model: forwarded IP headers (CF-Connecting-IP / X-Forwarded-For) are only honored when `AV_TRUST_PROXY=1` AND the direct peer is in `AV_TRUSTED_PROXY_RANGES` (CIDR). Default OFF.

### Backup / recovery
- mysqldump credentials go through a chmod-600 `--defaults-extra-file` (never on the command line), deleted immediately after.
- Backup downloads accept both `avos-backup-*.json` (application snapshot) and `db-*.sql` (database dump) with correct content types; traversal-proof.
- Restore is fully validated BEFORE mutating and wrapped in a single transaction (any failure rolls back the entire restore); SQL backups are refused via API with CLI guidance.

### AI agent budget + permissions enforcement
- `AiService::chat` now enforces the daily/monthly budget as a hard gate at the money exit point (0 = hard zero).
- Agent runner enforces tool permissions at runtime: a job may only consume integrations declared in the agent registry (`Tool 'X' not permitted for agent 'Y'`), and per-agent cost caps are flagged.
- Explicit action policy per autonomy level (observe/recommend/draft/modify/publish-safe/destructive) exposed via the agents API.

### Operations
- Retention expanded to 13 operational tables (api_cache 7d, integration_calls 90d, ai_requests/jobs/memory 365d, sessions 90d, login_attempts 7d, rate_limits 1d, …) in maintenance.php.
- `/api/diagnostics` (authenticated) now includes system data: perf, queues, AI budgets, integrations health, agents, tables, migrations, storage.
- CSP + HSTS added (.htaccess for the public site incl. GTM/GA4/Calendly/YouTube allowlist; HSTS on API responses over HTTPS).
- SVG uploads now go through a real DOM-based sanitizer (script/foreignObject/iframe/event-handlers/javascript:/external refs/entities stripped or rejected).
- SEO crawler detects canonical collisions (two pages sharing one canonical = critical issue).

### Workspace hygiene
- Machine files removed (`.local/`, `.sudo_as_admin_successful`); `.gitignore` added (config.local.php, secrets, caches, snapshots, releases).
- Dev DB credentials rotated; production package excludes all dev configs, destructive scripts (prod-cleanup, remove-dummy-content moved to dev-only), duplicate installers, tests, fixtures, snapshots.
- Single canonical source tree (`/home/user/avos-php`); release artifacts live in `/home/user/releases/`.

### Tests
- Integration hub battery extended 61 → 67 (budget gate, tool enforcement, migration validator, DB rate limiter, action policies).
- New `tests/axe_audit.js` — axe-core WCAG 2.1 A/AA browser audit: 12 pages, 0 violations.
- Full battery green: 133/133 E2E · 67/67 integration · 20/20 failure modes · 14/14 journeys · 18/18 inbound · 21/21 2FA · 48/48 admin · 13/13 functional · public site PASS · axe 0 violations · 0 broken links · lint clean · doctor SYSTEM READY.


## v2.4.0 — REAL INTEGRATION HUB + DATA INTELLIGENCE (this pass)

### New — Integration Hub (backend/integrations/, migrations 020–024)
- Integration registry rebuilt: 26 entries (GSC, GA4, GTM, Bing, Clarity, Cloudflare, Calendly, GitHub, Drive, Notion, YouTube, Trends, RSS, LinkedIn, Instagram, Behance, Dribbble, Canva, WhatsApp, Email + 3 AI providers) with real health columns: status, enabled, authentication_type, capabilities, free_tier, quota, rate_limit, last_sync_at/success/failure, last_error, sync_interval_minutes
- Status honesty: `CONNECTED` is ONLY set after a real verified request; vocabulary: CONNECTED / CONFIGURED / NOT CONNECTED / AUTH REQUIRED / RATE LIMITED / ERROR / DISABLED / UNAVAILABLE / LIMITED — MANUAL / APPROVAL REQUIRED / MANUAL
- Secrets stored encrypted at rest (aes-256-cbc, AV_ENC_KEY, JSON envelope), never returned by any API, never logged; credential-looking URL query params are redacted from the call log
- 19 adapter classes behind a shared interface (test/sync/triggers/publicType); every external call logged to integration_calls (provider, endpoint, agent, duration, success, error, request id) and GET reads cached in api_cache (dedupe + quota respect)
- Adapters: Google Search Console (service-account JWT/RS256 OAuth, sites + searchAnalytics query, real normalization), GA4 Data API (daily users/sessions/engaged/pageviews/engagement-rate + page/source/country/device aggregates), Bing Webmaster (API key), Microsoft Clarity (API preview — honest LIMIT), Cloudflare (zone analytics; internal HTTP fallback always on), Calendly (PAT: event types + scheduled events → CRM meetings via the shared idempotent webhook path), GitHub (public API without token + optional PAT; rate-limit aware), Google Drive (approved folders only → knowledge base with hashes + docx text extraction), Notion (approved pages only, states respected), YouTube (public channel RSS — no key), Google Trends (official RSS — no key), RSS engine (any RSS/Atom feed), plus reality-checked manual adapters for LinkedIn/Instagram/Behance/Dribbble/Canva, WhatsApp click-to-chat (trackable links; optional Cloud API), Email (SMTP test)
- Free-first: 404/metadata/duplicates/sitemap checks stay internal; no Semrush/Ahrefs dependency; manual import fallback (Search Console CSV export → search_console_* tables)

### New — Data Intelligence layer (backend/models/IntegrationModels.php)
- Search fusion: search_console_queries/pages/daily (Google + Bing, source-attributed), quick wins (position 4–20 + impressions + CTR + business relevance → opportunity score 0–100), CRO candidates (high impressions + low conversion → CRO agent), fused opportunities engine
- Research engine: research_sources (15 curated quality feeds seeded) + research_items (guid-deduplicated RSS/Atom/RDF parser), never republished — research only
- Knowledge graph: nodes/edges (person → client → project → technology) built from real content; context queries for agents
- Truth layer: facts with verified/unverified/inferred/opinion/external/deprecated states + confidence + evidence; fact-checker blocks unsupported claims; verified facts auto-seeded from real site content
- Case-study intelligence: 10-dimension completeness score per project (context/challenge/role/strategy/process/execution/leadership/technology/outcome/visual evidence), missing-fields requests instead of fabrication
- Positioning Health 0–100 computed from real signals (who/what/problems/proof/keyword alignment/claims consistency)
- Trackable links: UTM generator + WhatsApp click-to-chat with public click tracking + attribution (source → page → lead), click logs
- Agent outcomes: before/after deltas per agent (organic impressions, positioning health, high-value leads…)
- Dev intelligence: GitHub repos/commits/issues + system error clusters → developer agent recommendations; knowledge ingestion ledger (Drive/Notion: file, hash, status)

### New — Agents (registry 21 → 31)
- Added: Keyword Intelligence, Trend, Fact Checker, Experience Design Intelligence, Positioning Intelligence, Proof/Authority, Developer Intelligence, Security Intelligence, Performance Intelligence, Accessibility Intelligence
- Every agent now declares `tools` (integration permissions, e.g. SEO agent → gsc/bing/ga4; CRO → ga4/clarity/gsc; Lead Intel → calendly/whatsapp/email); agent→tool graph API + UI
- Executors consume real data: SEO uses Search Console quick wins + records impression deltas; Analytics includes GA4; Research processes real RSS items with source attribution; Social surfaces YouTube videos with MANUAL PUBLISH REQUIRED labels; CRO uses search-conversion gaps; Case Study uses the completeness engine; Orchestrator brief includes search + positioning + agent activity

### New — API (backend/controllers/IntegrationController.php, ~30 endpoints)
- /api/integrations (GET registry+health, PUT config, POST :code/test|sync|enable|disable), /api/integrations/agent-graph, /api/integrations/calls
- /api/search-console/{overview,queries,pages,quick-wins,opportunities,cro-candidates,import}
- /api/research/{sources,items,fetch}, /api/trends
- /api/knowledge-graph (GET, build, edge), /api/facts (CRUD + status)
- /api/case-studies/intel, /api/social/profiles, /api/social/sync
- /api/links (UTM/WhatsApp CRUD + clicks + PUBLIC click tracking)
- /api/positioning, /api/outcomes, /api/dev-intel, /api/knowledge-ingest

### New — Admin UI (js/views-hub.js, loaded last)
- Integration Hub command center: registry cards with honest status chips, per-integration config modals, Test/Sync/Enable buttons, health stat cards, agent→tool graph, API call log, AI provider keys + SMTP + Calendly signing key (all real)
- Research view: sources CRUD with authority scores, fetch-all, items feed, Google Trends India
- Knowledge & Truth view: graph stats, truth-layer facts with status editor, case-study completeness bars, positioning health
- Social & Tracking view: profile registry with API reality checks, UTM generator, WhatsApp click-to-chat links, click logs
- External measurement injection into the published site: GA4 (G-PSGRJWS4V5), GTM (GTM-MB7FNGJ), Clarity project ID — configured via registry, no credentials in HTML
- Dashboard "what should I do next?" now leads with real Search Console quick wins

### New — Cron
- backend/scripts/integration-sync.php (flock-protected, due-driven, enqueues agent jobs, `*/15 * * * *`)

### Fixed
- knowledge_items unique key collision for manual rows (023)
- api_cache JSON payload constraint (base64 envelope)
- Ga4Adapter closure scope bug; Trends source-id null handling; Calendly shared upsert path
- PHP 8.4 str_getcsv deprecation; agent-runner $done slug bug; SQL timezone drift in nextActions stale check
- Inbound webhook test enum drift (status='available' removed)

### Tests
- tests/integration_hub.sh — 61 assertions: registry honesty, secrets-at-rest, fixture-contract adapters (real JWT/RS256 against documented API shapes), live public APIs (Trends/GitHub/YouTube/RSS), search fusion + CSV import, truth layer, knowledge graph, case-study intel, positioning, trackable links, 31-agent workforce, kill switch, cron, site integrity
- E2E extended 121 → 133; admin sweep 46 → 48 views (all clean); full battery green


## v2.0.1 — AUTONOMOUS QA layer (this pass)

### New
- Soft delete (trash/restore/permanent) for leads, CRM entities, proposals, projects, media + Leads trash UI
- Request IDs (`X-Request-Id`) + perf_log + request-id in every error payload
- Sessions registry: server-side session revocation, active-session tracking, disable/reset/revoke user management with last-Super-Admin guard
- Redirect manager (301/302) → generated into the site .htaccess
- Publish pre-flight report, publish diff, post-publish verification with AUTOMATIC rollback, broken-link gate, draft isolation in all listings/sitemap
- 404.html + security headers on the generated site + same-origin CORS
- Public lead idempotency (24h email dedupe) + CRM activity timelines (status/meeting/proposal/resubmit)
- Content conflict detection (base_versions → 409) + honest save states (DRAFT SAVED / PUBLISHED / OFFLINE LOCAL DRAFT)
- AI: versioned prompt templates (DB), daily/monthly limits, copilot tool-level RBAC
- Automation: dry-run test mode, loop guard, webhook retry-failed (bounded)
- Security score (real checks), data-consistency diagnostics, extended /api/status (media/email/ai/backup/perf)
- Cron: publish-scheduled.php, maintenance.php (retention), all flock-protected
- Media server (/media/*) with traversal/type guards
- Leads pagination/filters/CSV export (formula-safe)
- Contact-form fallback: if the CRM save fails the visitor gets a warning + prefilled mailto (inquiry never lost silently)
- Richer first-party analytics events (cta_click, download)

### Fixed
- Sitemap/robots: drafts leaked into sitemap.xml; robots.txt had a literal {siteUrl} placeholder — both fixed
- Listings (journal/insights/sitemap page/homepage essays) linked draft articles — now filtered by due-status
- Multiple route-ordering bugs (check-inactive, proposals preview/pdf, forms export, webhooks deliveries, users reset/revoke, backups download, leads restore) — specific routes now precede generic ones
- Automation score condition read ctx['score_min'] instead of ctx['score'] — lead.created rules now fire
- Meeting creation validation (422) + activity timeline wiring (route $c segment)
- Web installer now runs migrations 001–007 (fresh installs get the full schema)
- Migration runner: schema_migrations tracking with checksums + immutable-file drift detection
- Auth throttle returns 429 (was 401); Auth::attempt returns consistent 4-tuple
- Media/robots post-publish checks tolerate legitimately small files

### QA (all green on fresh install)
- E2E fresh install chain: 103/103
- Failure-mode battery (DB down, dead webhooks, bad uploads, throttle, CSRF, revoked sessions…): 20/20
- User journeys (CRM, content, AI, rollback): 14/14
- Admin sweep: 45 views, zero console errors · functional UI: 13/13
- Public site: form → CRM → analytics → Calendly fallback, zero page errors
- Link audit: 20 pages, zero broken links/assets

## v2.0.2 — PRODUCTION CERTIFICATION pass

- TOTP 2FA (RFC 6238, pure PHP): setup/enable/disable, recovery codes (hashed,
  single-use), session enforcement, audits, login-page 2FA step — 21/21 tests
- Inbound Calendly webhooks (official signature contract): HMAC verify, replay
  tolerance, idempotency, failed-retry, CRM mapping, ledger UI — 18/18 tests
- SMTP engine (pure-PHP client, encrypted config, queued/sent/failed + error log,
  Integrations UI, test button) — verified against a local SMTP sink incl. failure
- Bulk content operations (Pages UI + API, per-item results, SEO gate, versioned)
- Production cleanup script (dry-run = rolled-back transaction)
- CLI restore tool + full backup→destroy→restore drill (recovery < 5 s)
- Publishing drill (broken template → blocked, production untouched, logged,
  notified) + rollback drill (B→A verified end-to-end)
- Static site served at the web root (production .htaccess + dev router) — 25/25
  URL matrix PASS
- users.status 'disabled' enum fix (user disable/delete previously 500)
- Production-mode instance verified: no stack traces/SQL/paths leaked, file
  exposure scan all 404, authz matrix (editor/viewer/anonymous/revoked/disabled)
- Analytics content events (essay_view, journal_view, case_study_view,
  contact_start) added to the snippet and verified live
- Security score, diagnostics, perf log all reporting real data

## v2.0.3 — DUMMY CONTENT PURGE + CLEAN SEED

- Removed every dummy/demo artifact from the backend: 13 v1 seed keys in
  content_store (fake dashboard stats, leads, meetings, notifications,
  analytics, logs, backups, users, integrations, forms, availability,
  submissions, aiPrompts), all test rows in real tables, test media
  (uploads/E2E), test configs (SMTP sink, Calendly key), test files.
- Sanitized the installer seed (avos-data/site.json): fresh installs are now
  born clean — only real content/config keys (pages, sections, articles,
  projects, clients, testimonials, media, nav, settings, seo, downloads,
  blocks) + 13 real media assets. Broken favicon-test media entry removed.
- Rewired the two remaining seed-driven admin views to real data:
  Forms (→ /api/forms/submissions with status management) and Bookings
  (→ /api/crm/meetings). No admin screen depends on demo content anymore.
- Diagnostics now skips directories (false-positive untracked-file report).
- Re-provisioned the environment after a sandbox reset: fresh install from
  the clean seed → password change → media sync → publish → verified.
- Verification (all on the clean install): 45/45 admin views clean, public
  site tests pass (test lead removed after), link audit 0 broken,
  diagnostics clean (0 issues), site 200.

## v2.1.0 — PLUG & PLAY (live sync)

- `./start.sh` / `start.bat`: one command starts DB + migrations + installer +
  backend + live-sync watcher; prints site/admin/API URLs.
- Auto-publish: new `auto_publish` feature flag (default ON). Every CMS save
  regenerates the public site automatically — verified: edit hero → response
  `auto_published:true` → live site updated with zero manual publish. Toggle in
  Settings (Live sync) and Platform → Feature flags.
- Frontend → backend sync: `backend/scripts/sync-frontend.php` pulls
  css/js/assets/fonts from the frontend folder ($frontendDir / AV_FRONTEND_DIR,
  default ../abhijeetvarghese) into site-template/, then republishes. Settings
  "Sync frontend" button + POST /api/sync/frontend + automatic in the watcher.
- `backend/scripts/auto-publish.php`: flock-protected live-sync engine —
  frontend change → sync+publish; content change → publish. Cron line for
  Hostinger included (every minute).
- saveContent auto-publish: failures never touch the live site — logged +
  notified; response reports auto_published.
- data.js shows "PUBLISHED" status chip + toast when a save auto-published;
  Settings "Save & publish" skips the double publish when live sync is on.
- docs/plug-and-play.md: full quickstart (local + Hostinger + cron).

## v2.1.1 — PRODUCTION HARDENING (zero-maintenance)

- Publish queue (publish_queue table): debounce/coalescing, statuses, history; manual publish synchronous + blocking-lock; 106/106 E2E incl. auto-publish live-sync scenario
- flock locking: storage/locks/{sync,publish}.lock (also used by backup/migration paths)
- Content-aware frontend sync: SHA-256 manifest, dry-run (CLI + API), deletion of removed files, idempotent
- Env modes: local/development/staging (verbose) vs production (sanitized); production guard unchanged
- Doctor: backend/scripts/doctor.php + /api/system/doctor (21 checks) + startup banner in start.sh
- /api/system/publishing (queue + cron self-health) with admin status chip polling every 15 s
- /api/system/publish-settings (auto publish, frontend sync, health check, auto rollback, retention)
- Version retention configurable (PublishSettings, default 10) + backup retention (default 5) + mysqldump support
- Draft mode (publish:false) + Save draft button; installer "already completed" message
- Fix: manual publish no longer swallowed by debounce; MySQL NOW() vs PHP timezone debounce fix; trigger column renamed (reserved word)
- Regression: 106/106 E2E · 20/20 failure modes · 14/14 journeys · 18/18 inbound · 21/21 2FA · 45/45 views · 13/13 UI · links clean

## v2.2.0 — ULTIMATE MASTER BUILD (SEO + Intelligence)

- SEO engine: keywords/clusters/rankings/cannibalization/opportunities/briefs/audit/decay/internal-links/backlinks/competitors (migrations 016-017, 12 new tables)
- Technical SEO crawler over the generated static site (real checks, severity, score, mark-fixed)
- Engagement: 5 new first-party events (gallery/video/scroll/external/search), page scores, CTA intelligence, conversion funnel
- Intelligence: next-actions engine, daily brief, weekly report, social drafts (draft-only)
- Public: search-index.json + /search.html (client-side site search), related-content on articles, sitemap updated
- Version 2.2.0 · auto_publish ON · doctor SYSTEM READY

## v2.3.0 — AI AGENT OPERATING SYSTEM

- 21-agent registry + job queue + memory + orchestrator (migrations 018-019)
- agent-runner.php cron (flock, kill switch, budgets, retries, heartbeats)
- Real executors: analytics, health, technical-seo, seo, search-intel, internal-links,
  content-refresh, research, content-strategist, journal, insights, case-study,
  engagement, cro, lead-intel, business-intel, social, newsletter, knowledge, ai-editor,
  orchestrator
- Deterministic quality gate (depth/originality/fact-whitelist/voice/metadata/links/CTA)
- Event-driven agents (publish → seo+links+social; lead → lead-intel)
- AI Command Center UI + dashboard growth brief + kill switch (PAUSE ALL AI)
- Version 2.3.0
