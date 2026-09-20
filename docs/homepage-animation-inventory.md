# Homepage animation and interaction inventory

**Scope:** React homepage only. The untouched homepage in `abhijeetvarghese/` is the
source of truth. This is an implementation and browser-state inventory, not a list
of proposed replacement animations.

**Audit date:** 2026-09-20

## Golden-master sources audited

- `abhijeetvarghese/index.html` — head/runtime sequencing, loader, homepage
  markup, data attributes, script order, and inline tracker.
- `abhijeetvarghese/js/main.js` — reveal logic, shared scroll state, Journey,
  Hero state/pointer behavior, menu, booking, service worker.
- `abhijeetvarghese/js/elevate.js` — elevation, top button, tilt/magnetic
  pointer behavior, nav direction handling, form accessibility, kinetic and
  Navigation API progressive enhancements.
- `abhijeetvarghese/js/home-mobile.js` — phone-only reel, deck, Journey,
  footer scenes, nav ink tier, and date-sheet backdrop behavior.
- `abhijeetvarghese/css/styles.css`, `elevate.css`, `hero-v6.css`, and
  `home-mobile.css` — class contracts, media-query choreography, keyframes,
  fallbacks, hover transitions, and reduced-motion rules.

The React `index.html` loads that same legacy homepage CSS cascade in the same
order. React-only CSS is limited to approved migration deltas in
`src/styles/react-home.css`.

## Runtime-state contract and source → React mapping

| Original function / source | Target, class or CSS variable | Trigger and timing in the original | Desktop / touch behavior | React owner and current mapping | Verified state |
| --- | --- | --- | --- | --- | --- |
| Inline head script, `index.html` | `html.js`; `html.reveal-failsafe` | Add `js` synchronously; arm `reveal-failsafe` at **3400 ms** | Same at every viewport; it is a stalled-runtime fallback | `index.html` does the same; `useReveal` adds `js-ok` only after the normal runtime mounts | 1440×900 original and React: `js js-ok av-done hero-settled reveal-failsafe` after normal startup |
| Inline loader script | `html.av-loading`, `.av-loader`, `.av-j.is-in`, `.av-loader.is-merge`, `html.av-done` | Words begin at **120 + i×60 ms**; merge **720 ms**; complete **1450 ms** (reduced: merge then complete **450 ms**); hard complete **3500 ms**; remove loader **750 ms** later | Same scene; CSS reduced-motion branch removes word scatter | The source-equivalent loader shell and inline timer live in React `index.html`, outside `#root`; `useLoader.ts` only performs the matching Hero gate | Mutation-timed 1440×900 runs: source/React loader completion **1492.3/1508.9 ms**, Hero `is-in` **1628.1/1625.0 ms** |
| `elevate.js` Hero flip + `hero-v6.css` | `#hero.is-in`; `html.hero-settled` | Two RAFs after loader completion; settled flag **1600 ms** later when motion is allowed | Hero-v6 CSS supplies its staged title/frame/lede/actions/roles/availability/cue transitions | `useLoader.ts`; shared legacy `hero-v6.css` | `is-in` and Hero-v6 animations match in initial-state comparison |
| `main.js` reveal groups | `--d` on each grouped `[data-reveal]` | `base + min(index×0.06, 0.6)` seconds | Same rule | `useReveal.ts` | 11 groups and group delay values match |
| `main.js` reveal observer | `[data-reveal].in-view` | `IntersectionObserver`: threshold **0.15**, root margin `0px 0px -6% 0px`; unobserve after first intersection | Same; reduced/no-IO makes all visible | `useReveal.ts`; uses only `in-view` (not an invented `is-in`) | Scroll-state comparison matches progressive per-section reveal counts |
| `main.js` recovery timer | unresolved visible `[data-reveal].in-view` | At **1400 ms**, reveal only elements with `top < vh×.94` and `bottom > 0` | Same; future chapters remain hidden until actually entered | `useReveal.ts` | At 3.65–4.7 s on a stationary top-of-page load, 0/110 reveal targets were in-view in both source and React |
| Generic CSS failsafe, `styles.css` | `html.js.reveal-failsafe:not(.js-ok) [data-reveal]` | Applies only if normal JS has not marked `js-ok` | Same | Existing source CSS plus the restored `js-ok` contract | Regression test explicitly prevents a normal-page blanket reveal |
| `hero-v6.css` independent failsafe | `.hp6-*` fail-safe selectors | `html.reveal-failsafe` can unhide Hero-v6 if runtime stalls | Same | Shared source CSS, unchanged | Preserved separately from generic section reveal behavior |
| `main.js` shared scroll updater | `#siteNav.is-visible`, `#progress` `scaleX()` | Nav visible after `scrollY > 90`; progress quantized in 0.0005 increments | Same | `usePageMotion.ts` | Desktop/tablet wheel, reverse wheel, scrollbar, and top-reset verification passed |
| `main.js` shared parallax | `[data-parallax] img` inline `scale`, `will-change`, `translate3d` | Default speed `.05`; per-item `data-parallax`; skips offscreen work | Same; disabled for reduced motion | `usePageMotion.ts` | Non-case Thinking image reports original-style `translate3d`; zero-speed first case remains static |
| `main.js` Journey | `#journeyTrack` `translate3d`, `#journeyBar` `scaleX` | On `min-width: 901px`, based on `(scrollY - journeyTop) / (sectionHeight - vh)` | Desktop horizontal/pinned track; ≤900 px keeps the stacked CSS fallback | `usePageMotion.ts` | Mid-track source/React transforms matched exactly at 1440×900; tablet fallback verified at 768/834/900 |
| `main.js` Hero parking | `html.hero-parked` | Hero `IntersectionObserver`, root margin `12% 0px` | Pauses portrait/marquee CSS animations offscreen | `usePageMotion.ts` | Present in top/bottom scroll state samples |
| `main.js` arena mode | `body.arena-reduce`; `#hero.is-past` | Reduced class reflects media preference; Hero past state is `scrollY > innerHeight×.28`, refreshed on scroll/resize | Same; Hero cue retires shortly after leaving opening scene | `usePageMotion.ts` | Past state, reverse reset, resize behavior, and reduced motion covered by browser regression |
| `main.js` Hero portrait pointer | `.hp6-frame__well` inline `translate3d` | Fine hover pointer only; target ±6 px/±4.5 px, eased by `.08`; return on leave | Fine pointer only; touch stays static | `useHeroMotion.ts` | Desktop pointer test verifies live `translate3d`; touch/tablet static fallback preserved |
| `main.js` Hero field/type pointer loop | `.hp6-field span.is-clear`, inline fragment transform, `.hp6-l` `font-variation-settings` | Ambient 9 px field drift; pointer-clear radius 190 px; letters update every third frame and settle after inactivity | Runs only when Hero visible, document visible, within 1.3 viewport heights, and motion allowed | `useHeroMotion.ts` | Source calculation and lifecycle ported; pointer interaction inspected with fine-pointer harness |
| `elevate.js` automatic elevation | generated `[data-elevate="up"]`, `--e-d`, `.is-in` | Targets direct non-Hero section `h2`/`header` or `.page-hero > *` only when not already reveal-owned; observer threshold .12 / bottom margin -8% | Same | `useElevate.ts` ports the generic pass and observer | Current homepage has **0 live automatic elevation targets** in both DOMs; port remains for exact source behavior |
| `elevate.js` aurora | injected `.e-aurora > i` | Inserted for non-reduced Hero | Final `styles.css` overrides its drift animation to `none !important` | `useElevate.ts` inserts the source DOM enhancement | Aurora DOM count matches; drift was deliberately **not** reintroduced because it is disabled by final source CSS |
| `elevate.js` magnetic buttons / tilt | `.btn--accent`, `.e-top` `--mx/--my`; `[data-tilt]` `--rx/--ry` | Fine pointer only; magnetic strength `.28`; tilt ±5 deg | No coarse-pointer motion | `useElevate.ts` | Three live Homepage tilt targets; source equations retained |
| `elevate.js` top button | `.e-top.show` | Show after `scrollY > innerHeight×.9`; click native smooth top unless reduced | Same | `useElevate.ts` | Seen in desktop/mobile bottom-state checks |
| `elevate.js` navigation chrome | `.site-nav.is-scrolled`, `.nav-hidden` | Scrolled at >24; direction hysteresis 16/8 px after 140 px; focus/menu/hover protect visibility | Desktop source behavior retained. Mobile keeps the explicitly approved hide-down/show-up behavior with touch hysteresis | `useElevate.ts`, `useMenu.ts` | Fast-down / slow-up mobile touch tests at all requested phone sizes passed |
| `elevate.js` kinetic enhancement | `[data-kinetic].is-inview`, optional word spans | Waits for loader then threshold .4; fail-safe reacts to `reveal-failsafe` | Same | `useElevate.ts` | Current homepage has **0 kinetic targets**; source semantics retained without putting kinetic code into ordinary reveal logic |
| `elevate.js` Navigation API | `pageswap` / `pagereveal` transition type `nav` | Feature-gated by `document.startViewTransition` and `window.navigation` | Progressive only | `useElevate.ts` | Ported as a feature-gated enhancement |
| `main.js` menu controller | `#mobileMenu.hidden`, `.is-open`, button ARIA/overflow/focus trap | Immediate first-menu-item focus; two-RAF opening class; close hides after **450 ms** and restores trigger focus for Escape, close, link, and breakpoint paths | Mobile menu only | `useMenu.ts` | Source focus/timer contract plus mobile menu open/close/lock and nav visibility tested on all nine phone sizes |
| `main.js` booking/calendar/country controls | date/country popups, slot classes, validation, success view/focus | Native events, explicit calendar and field state updates; reduced-motion-aware scrolls | Same controls at all sizes; `home-mobile.js` turns a tap on the open date-sheet backdrop into the existing trigger-close path | `useBooking.ts` | Source popup/render contracts, date/slot copy spacing, country lazy population, success copy, and post-submit button markup are preserved; touch backdrop close remains present |
| `elevate.js` form accessibility layer | `aria-invalid`, generated `.e-field-error`, focus after validation/success | Mutation-observed field state; invalid focus is delayed **450 ms**; success heading focus is delayed **450 ms** | Same | `useBooking.ts` | Ported alongside the booking state machine; browser regression protects the original delayed invalid-focus handoff |
| `home-mobile.js` reel arming | `body.hm-pin`, `--work-runway` | `max-width:700px`, not reduced, not squat landscape, and film exists | Phone pinned reel; tablet and desktop retain original normal layout | `useMobileHomeMotion.ts` | All requested phone viewports report armed pin and no nested scroll container; reduced motion reports no pin |
| `home-mobile.js` reel rests and glide | `#workFilm translate3d`, `.case.is-active`, HUD | Rest positions center each plate; pin length `(caseCount−1)×clamp(vh×.9,440,980)+vh×.5`; glide factor `.14` | Phone only; squat/reduced fall back to stacked plates | `useMobileHomeMotion.ts` | At 390×844 original/react rest positions: `[20, 390.5, 761]`; active index, film transform, and HUD state match |
| `home-mobile.js` QA state hook | `window.__avWork()` fields `pinStart`, `pinLen`, `rests`, `stageW`, `pinOn` | Read-only instrumentation after reel measurement | Phone only | `useMobileHomeMotion.ts` exposes the exact legacy names plus non-breaking React aliases | 390×844 reports matching pin length/rests/stage/pinned state |
| `home-mobile.js` artwork micro-shift | `--work-px` on cases/pictures | Source gives active artwork up to ±9 px during a reel transition | Phone only | **Intentionally omitted** in `useMobileHomeMotion.ts`; React never writes `--work-px` | Approved locked-thumbnail exception; reel and plate choreography remain intact |
| `home-mobile.js` capability deck | `.cap` `--squash` | Per scroll frame, overlap ratio between card and next card | Touch tier | `useMobileHomeMotion.ts` | Values match source samples (including `1.000`, `.890` at Work entry) |
| `home-mobile.js` Journey | `#journeyTrack --spine`, `.era.is-lit`, Journey bar | Spine based on 70% viewport probe; era IO root margin `-42% 0px -42% 0px` | Touch/stacked Journey | `useMobileHomeMotion.ts` | Mid-Journey source/React spine `.944/.945` and lit sequence match; removed numeric counter is an approved label removal |
| `home-mobile.js` nav ink tier | `#siteNav[data-tier]` | Probe at `scrollY + 40` against cached light/dark section zones | Touch tier | `useMobileHomeMotion.ts` | Source/React tier changes agree through Work and Journey |
| `home-mobile.js` footer scenes | `.footer__inner.is-in`, `.footer__line.is-in`, contact link and `.footer__brandtop.is-in` | IO threshold .15, bottom root margin -12%; one-shot | Touch tier | `useMobileHomeMotion.ts` | Footer scenes activate; no extra footer-level class is used |
| CSS-only interactions | Hero marquee, cue, card/image/link hover, footer/link hover, chip/card transitions, native `html { scroll-behavior:smooth }` | Source CSS classes/pseudo-states, no JS animation engine | CSS media queries preserve touch/reduced fallbacks | Legacy CSS remains loaded; no Lenis/GSAP/Framer substitute | Desktop wheel/scrollbar, pointer, reduced-motion and overflow browser checks passed |
| Inline analytics and `main.js` service worker | event tracker; interaction-armed `/sw.js` registration | Tracker events; first pointerdown/keydown/touchstart arms worker; download/download-attribute branch returns before CTA/external tracking | Same | `useAnalytics.ts`, `useServiceWorker.ts` | Source event gate, mutually exclusive Resume `download` event, and endpoint contract retained; test harness mocks analytics only because preview has no API backend |

## DOM/data-attribute audit

After intentional label removals are excluded, live homepage motion attributes match
the original exactly:

| Attribute | Original | React |
| --- | ---: | ---: |
| `[data-reveal]` | 110 | 110 |
| `[data-reveal-group]` | 11 | 11 |
| `[data-parallax]` | 5 | 5 |
| `[data-frame]` | 1 | 1 |
| `[data-slot]` | 8 | 8 |
| `[data-theme]` | 1 | 1 |
| `[data-tilt]` | 3 | 3 |
| live `[data-elevate]` | 0 | 0 |
| live `[data-kinetic]` | 0 | 0 |

A previously accidental React `data-reveal` on `.logo-wall` was removed. The
original group owns only its 16 logo children; adding a parent reveal changed
its timing and compounded its visual entrance.

## Featured Work frame-fit analysis

All three supplied artwork assets are `1672 × 941` (`1.77683:1`).

- **Desktop/tablet (≥701 px):** `.case__panel` is the intended 16:9 visual
  frame. React uses `object-fit: cover; object-position: center` only inside
  the three case frames. The picture and image fill the panel content box and
  React writes no scroll transform to either artwork. The maximum measured
  encoder/frame rounding crop was **0.278%** at 768×1024 and **0.175%** at
  common 1440+ frames; no dark matte seam is exposed.
- **Phone (≤700 px):** the panel becomes a complete plate (artwork + plaque),
  not one giant image viewport. Its nested `picture` is explicitly
  `aspect-ratio: 1672 / 941` with a small intentional matte margin; the image
  and picture have identical rendered bounds. `contain` is therefore correct
  here: it displays the complete artwork without letterboxing inside its own
  aspect-matched picture frame. The surrounding plate/panel space is the
  intentional dossier composition, not an empty artwork frame.
- **Motion:** the original phone `--work-px` artwork translation is purposely
  not restored. The film still moves through exact centered rests; each
  individual artwork remains locked.

## Approved lasting differences

1. The Final Chapter pseudo cue remains removed.
2. Section/ordinal and Journey counter number labels remain removed.
3. Featured Work artwork remains locked; original phone `--work-px` thumbnail
   drift remains intentionally disabled.
4. The React desktop/tablet image-fit correction removes the source matte seam
   while preserving the original mobile plate/picture composition.
5. Mobile navigation retains the approved hide-on-down/show-on-up behavior.

## Browser verification performed

All browser checks used the downloaded Chrome executable with a **production
Vite preview**, not only static/build checks. Analytics requests were fulfilled
by the harness because this sandbox does not run the production API; console and
page errors from the actual homepage remained empty. A final unmocked
1440×900/390×844 top-to-bottom network audit found **zero non-analytics failed
or 4xx/5xx requests**; only the expected unavailable preview analytics endpoint
failed.

### Direct original → React state comparisons

- **1440×900:** initial 1.0 s, 1.8 s, 3.6 s and 4.6 s loader/reveal samples;
  a class-mutation timing run also measured source/React loader completion at
  **1492.3/1508.9 ms** and Hero entry at **1628.1/1625.0 ms**. Section-by-
  section scroll through Clients, Capabilities, Work, Thinking, Journey entry/
  mid/exit, AI, Focus, Contact and bottom matched. Journey transform and bar
  values matched (for example mid-track `translate3d(-1385px, 0px, 0px)` and
  `scaleX(.5)`).
- **1440×900 animation lifecycle:** at the same point (**350 ms after
  `#hero.is-in`**) source and React exposed the same **89** running browser
  animations: **78** CSS transitions plus the identical eleven named CSS
  keyframes (`arenaGlow`, `e-cue`, `e-ping`, `e-progress-slide`, `hintX`,
  `hp6-draw`, `hp6-live`, `hp6-lock`, `hp6-sheen`, `hp6-sweep`, `mq`).
- **390×844 reduced motion:** source/React loader completion was
  **492.4/506.0 ms**, Hero entry **533.2/528.7 ms**, and loader removal
  **1242.7/1256.5 ms** from navigation start; both retained the static
  reduced-motion fallback.
- **390×844 touch:** source and React reel geometry, rests, active cases, HUD,
  deck squash, nav tier, Journey spine/lit eras, footer scenes, and reverse
  direction were compared. The only state difference was the approved absence
  of source `--work-px` values.
- **390×844 booking/menu controls:** date open/select and touch-backdrop-close
  state, country picker population/selection, invalid-field and `aria-invalid`
  counts, and Escape menu close state were compared directly; the source and
  React states matched.
- **1440×900 booking/analytics:** source and React country lazy/render state,
  date/slot summary markup, 80 ms versus 550 ms invalid-focus state, success
  copy/button reset, and book-again focus were compared. Resume tracking emits
  exactly one `download` payload (not `download` plus `cta_click`).
- The normal-runtime reveal regression is now asserted in
  `scripts/homepage-parity-regression.mjs`: after the 3.4 s head failsafe,
  `js-ok` is present and future `[data-reveal]` targets remain out of view.

### Requested viewport and interaction matrix

- `npm run test:homepage-parity` passed in production preview at tablet
  **768×1024, 834×1112, 900×1200** and desktop **1024×768, 1280×800,
  1366×768, 1440×900, 1600×1000, 1920×1080, 2560×1440**. It verifies top,
  wheel/reverse wheel, scrollbar/bottom reverse, Hero past state, fine pointer,
  non-case parallax, Featured Work frame geometry/lock, Journey entry/mid/exit,
  overflow, console/page errors, and reduced motion at 1440×900 and 390×844.
  It additionally asserts source-equivalent booking country/date/slot/focus/
  success states and mutually exclusive Resume download analytics.
- `npm run test:mobile-scroll` passed in production preview at **320×568,
  360×640, 375×667, 390×844, 393×852, 414×896, 430×932, 480×1040,
  540×720**. It uses genuine CDP touch gestures for jitter, fast down, slow up,
  forward/reverse sticky-reel travel, rapid top return, menu lock, reel entry/
  exit, footer scenes, artwork geometry/lock, overflow and console/page errors.

Build, typecheck, lint, asset validation, and these browser checks passed after
the source-mapping changes recorded above.
