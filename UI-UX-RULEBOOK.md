# AV Website — Global UI/UX Rulebook v1.0
> Single source of truth for design-system decisions. Benchmark: Apple HIG quality, AV brand expression.
> Principle: **standardize the fundamentals, preserve the expression.**

## 1. Typography tokens
| Role | Spec | Notes |
|---|---|---|
| Display / H1 | page-specific (hero compositions exempt) | Always exactly one `h1` per page |
| H2 | section titles — never skip (h1→h2→h3) | Fixed P1-a: insights/journal/consulting/contact/case-studies retagged |
| H3 | card titles, subsections | |
| Body | Inter Tight, 1.02rem/1.75 (`.prose`) | |
| Meta/label | Poppins 0.625–0.6875rem, +0.07em tracking, uppercase for eyebrows | |
| Serif accent | Instrument Serif italic for emphasis only | Never for body/UI |
| Scale rule | New sizes must reuse existing steps; no new arbitrary px values | P3: migrate strays to scale over time |

## 2. Spacing tokens
- Section rhythm: `clamp()` vertical padding (e.g. `clamp(56px, 9vh, 90px)`); anchor offset `--scroll-pad: 96px` (`scroll-padding-top` + `scroll-margin-top` on `[id]`).
- Hit-area rule: visual size may be small, but interactive targets get invisible padding to **≥44px** (see `.nav-links a`, `.footer__links a`, `.link-arrow` patterns).

## 3. Layout rules
- Max content width: **1280px** (`--container-width`); shared `.container` / `.e-next__in` pattern.
- Left edges align to container; no page-specific gutters without reason.
- Breakpoints (canonical): **360 / 480 / 560 / 700 / 900 / 1080** (max-width) + 1600/2048 for ultra-wide. New code uses these only (elevate layer aligned to 700px).

## 4. Color tokens (semantic roles → values)
| Role | Dark surfaces | Light surfaces |
|---|---|---|
| Background | `#080F22` / `#05070D` | `#F7F5EF` / `#FBFAF6` |
| Primary text | `#EFF0EA` | `#0C1330` |
| Secondary text | `#96A0BE` (7.3:1 ✓) | `#59617A` (5.6:1 ✓) |
| Accent/interactive | `#6EA8FF` azure | `#2E5AAC` (6.6:1 on white ✓) |
| Success/error | — | error `#C23B3B` (5.3:1 ✓), always paired with icon + text, never color alone |
| Min small-text on near-black | `#8A8A8A` (was `#777`, fixed P2) | — |
- Contrast floor: 4.5:1 text, 3:1 large/UI. Verified pairs logged in audit (all pass).

## 5. Button rules
- Base `.btn`: pill 999px, 17px/30px padding (~55px tall), 15px/500.
- Variants: `--accent` (primary CTA), `--ghost` (glass secondary), `--small` (nav, ≥44px tall), `--block` (full-width), `--wide` (flex-fill, v3.1).
- Case-study systems (`.ia-btn`, BPCL `.btn` scope): visually distinct by design, must still provide hover + `:focus-visible` (verified).
- Icon buttons (`.vnav`, zoom, player): keep `aria-label`, visible hover, focus ring.
- Icon/text buttons (`.tslot`, `.exp-job__more`, `.date-trigger`): all carry hover/focus/active (verified).
- States required: default, hover, focus-visible, active, disabled (`:disabled` + `aria-disabled`), loading (`.is-loading` spinner + label change).

## 6. Link rules
- Nav links: 14px/500, animated azure underline on hover **and** `aria-current="page"` (auto-set by `elevate.js` §10).
- Inline prose links: accent color + 1px underline (`.prose a`) — never `inherit`-invisible.
- Card links: whole-card hover (lift + glow + img zoom), arrow nudge `translateX(4–8px)`.
- External links: same treatment; no underline removal.

## 7. Navigation rules
- Primary: Story · Experience · Case Studies · Portfolio + `Start a conversation` CTA — identical on every page (recruitment adds self-link; intentional).
- Mobile menu: full-screen dialog, focus trap, **Escape closes**, focus returns to toggle (verified in `main.js`).
- Inner pages: `.page-close` + `data-history-close` (history.back() w/ href fallback) on all 21 inner pages.
- Case studies: back link + **Next case study footer** (v3.1, order = index order: Orange → BPCL → Army → Orange) + All case studies link.
- Breadcrumbs: JSON-LD on all major pages (rich results), no visual crumb bar (deliberate minimalism).

## 8. Interaction states (checklist for every control)
Default → hover (visual change ≤0.35s) → focus-visible (azure ring, never `outline:none` without replacement) → active/pressed → disabled → loading → success → error (text + icon + `role="alert"`).

## 9. Motion rules
- Curves: `--ease-out: cubic-bezier(0.22,1,0.36,1)` (entrances), `--ease-io`, `--ease-spring` (playful only). No bare `ease` in new code.
- Durations: hover 0.25–0.35s · reveals 0.7s · hero choreography 1.1s · ambient 7–30s.
- Transform/opacity only on animated properties; `will-change` sparingly; rAF-throttled scroll handlers.
- Classification: keep functional/feedback/spatial/storytelling; cut anything delaying interaction.
- `prefers-reduced-motion`: kill parallax/ambient/spatial; keep fades + all functional feedback (covered in every stylesheet + both JS layers).

## 10. Accessibility rules
- Landmarks: header/nav/main/footer on all content pages (error pages: main only, intentional).
- Headings: strict h1→h2→h3, no skips (audited all 25 pages).
- Forms: visible `<label>` per field, `aria-invalid` + `aria-describedby` + text error on failure, focus first error, focus success heading (v3.1 §11).
- Touch: ≥44px targets; nothing hover-only (tilt/magnetic/glow are pointer:fine progressive enhancement).
- Media: 100% alt coverage; decorative = `aria-hidden`; videos get toggle + captions where narrative.

## 11. Responsive rules
- Adapt, don't shrink: hero compositions reflow, grids collapse, tables/cards stack.
- No horizontal overflow at 360px; touch targets grow on coarse pointers.
- Mobile nav replaces desktop nav <700px; CTA persists in mobile menu actions.

## 12. Form rules (booking/contact)
One screen, no navigation away. Novalidate + custom engine: inline errors (text+icon), loading label ("Sending your request…"), disabled-while-sending, success panel with focus + summary, failure restores form with values intact. Never leave user wondering if it sent.

## 13. Media rules
- Content images: `loading="lazy" decoding="async"`, explicit width/height (CLS=0).
- Hero/LCP: `fetchpriority="high"` + preload; logos eager (tiny, above fold).
- Format: webp first, jpeg fallback via `<picture>` where art-directed.

## 14. Component rules
- Reveal: `[data-reveal]` (base) + `[data-elevate]` (layer) — never both on one node; `.js-ok` gates animation, `reveal-failsafe` guarantees visibility.
- New shared UI goes in `css/elevate.css` / `js/elevate.js` (versioned `?v=` — immutable 1-yr cache!). Page CSS stays page-scoped.
- Backend sync parses: `.brand__name`, `.hp-hero__tagline/.hp-hero__avail`, `nav.site-nav__inner` links, `footer .footer__col/.footer__label/.footer__copy`, `section#clients img[src*=logos/]`, first `h1`, `essay|journal-*.html` filenames, `case-studies/<slug>/` dirs. **Do not rename/remove these hooks.**

## 15. Finding log (audit → fix)
| ID | Severity | Finding | Status |
|---|---|---|---|
| P1-a | Major | Skipped heading levels (h1→h3) on 5 pages | ✅ Fixed v3.1 (retags + pixel-identical aliases) |
| P1-b | Major | Form errors: class-only, no text/aria/focus | ✅ Fixed v3.1 (observer layer) |
| P1-c | Major | `aria-current` on 8/25 pages only | ✅ Fixed v3.1 (auto-set + styles) |
| P2-a | Minor | `.btn--wide` used but undefined | ✅ Defined v3.1 |
| P2-b | Minor | No next-project path in case studies | ✅ Added shared `.e-next` footers |
| P2-c | Minor | `#777` small text on near-black (~4.3:1) | ✅ Bumped to `#8A8A8A` |
| P2-d | Minor | Elevate breakpoint 720px off-system | ✅ Aligned to 700px |
| — | — | Contrast (9 pairs), landmarks, focus trap+return, Escape, tap targets, footers, prose links, back behavior, reduced-motion, loading states | ✅ Verified, no action |
| P3 | Enhancement | Normalize legacy `ease`/durations; rationalize type scale strays | 📋 Rulebook-captured, opportunistic |
| P0 | Critical | — | None found 🎉 |

## 16. Forensic QA v3.1.2 — independent re-verification (2026-09-10)
Second-pass audit distrusted all v3.1 claims and re-tested with headless Chromium
(screenshots, post-JS DOM, virtual-time, console sweep, live API test). Findings:
| ID | Severity | Finding | Status |
|---|---|---|---|
| F-P1-a | Major | Elevate scroll-spy crashed on page-URL hrefs (`querySelector("story.html")`), killing §§7–11 (back-to-top, aria-current, form-error layer) on every page | ✅ Fixed: hash-only spy + `getElementById`; verified e-top renders, aria-current 1→2 |
| F-P1-b | Major | First pass missed h1→h3 skips on for-recruiters, privacy, terms (only 10 pages sampled) | ✅ Fixed: retagged + `.prose h2` alias; all 32 pages re-verified, 0 skips |
| F-P2-a | Minor | Flagged non-field groups (slot box, phone wrap) couldn't receive focus | ✅ Fixed: `tabindex="-1"` before focus |
| F-P3-a | Enhancement | No stuck-invisible insurance for hero/elevate layer | ✅ Added: failsafe CSS forces visible under `.reveal-failsafe` |
| F-P3-b | Enhancement | tokens.css + BPCL assets unversioned under immutable cache | ✅ Versioned `?v=3.1.0` |
| F-P3-c | Enhancement | Sticky 3D stage used `100vh` only | ✅ Added `100svh` progressive enhancement |
| — | — | 10/10 pages console-clean; 22/22 sitemap URLs 200; lead API 422-invalid/ok-valid round-trip verified with zero-trace cleanup; screenshots verified desktop+mobile rendering | ✅ Evidence captured in `qa/shots/` |
| Intentional | — | No radial/spatial nav component exists (nav = primary + mobile dialog + page-close + footer); orange case study uses 1440px container vs 1280px elsewhere (deliberate cinematic canvas) | 📋 Documented, no action |

## 17. Nav revoke v3.1.3 (owner request — navbar restored to base)
All elevate-layer navbar changes revoked: glass/blur, hide-on-scroll, link-underline
animation, brand hover, scroll-spy, auto `aria-current`. Rationale honored: base
`styles.css` documents the nav as intentionally always-visible on this multi-page
site. Remaining elevate presence in nav: 3 guard rules restoring exact base CTA
rendering + magnetic exclusion for nav buttons. Pre-existing hardcoded
`aria-current` (8 pages) untouched. Verified: 0 injected nav classes in rendered
DOM, aria back to hardcoded-only, console clean, screenshot confirmed.

## 18. Nav Apple-level v3.2.0 (additive refinement, revoke honored)
Frosted `blur(20px) saturate(180%)` material, `.is-scrolled` material-deepening
(visual only — nav NEVER hides), hardcoded `aria-current` styled in base
`.is-active` language (no injection), brand/toggle/CTA press tactility, mobile
resize-to-desktop auto-close. Base underline animation, geometry and CTA design
untouched. Verified: screenshots (incl. Story active state), DOM, console.

## 19. Intelligent nav visibility v3.3.0 (auto-hide — supersedes §§17–18 hide rules)
Per explicit new owner requirement (hide on scroll DOWN, show on scroll UP),
the v3.1.3 revoke and the v3.2.0 never-hides rule are REVERSED for hide
behavior only — v3.2.0 material/tactility rules stay in force. Single shared
implementation: `elevate.js` §13 state machine + `elevate.css` transform rules.
Thresholds: 2px jitter deadband; hide after 16px accumulated down-travel past
140px depth; show after 8px up-travel; ≤4px always visible. Force-visible
overrides: keyboard focus in nav, mobile menu open (`hidden`-attr observer),
pointer hover on pill. Reduced-motion: instant show/hide, behavior kept.
**Structural law: the hide transform + `will-change` live on
`.site-nav__inner`, NEVER on `header.site-nav` — the header must not become a
containing block (P0: first cut put `will-change` on the header and collapsed
the viewport-fixed `#mobileMenu` into the 68px header box; focus landed
off-screen and the close button was untappable. Found + fixed in QA before
delivery; menu re-verified fullscreen 390×844 with working open/close/focus).**
Verified with real Chromium (Playwright, `qa/nav_test.py` + `qa/menu_test2.py`):
14/14 state-machine assertions, 8/8 widths (pill fully above viewport when
hidden, y=14/10 at top), reduced-motion (`transition 0.01ms`, still hides),
touch open/close, focus-reveal on "Story", zero console errors. Harness notes:
`--virtual-time-budget` delivers no scroll events/rAF (unusable for scroll
behavior — use real-time runs); never issue parallel same-file edits
(last-write-wins silently dropped half this fix once).
Nav regression sweep (`qa/nav_regression.py`, 8 major pages × desktop+mobile):
auto-hide, menu open/close, console silence, no-overflow — all pass. Two
findings fixed: (1) touch-only `e.target.closest is not a function` on
about-page menu taps → optional-chaining guard in main.js (bumped
`main.js?v=2.4.21` on 23 pages for the immutable cache); (2)
recruitment.html inline menu fork never added `.is-open`, so its mobile menu
opened invisible with body scroll-locked → fork now follows the shared
open/close contract. Known gaps, left intentionally: fork still lacks focus
trap/return + Escape; the styles.css nav comment-only edit ships without a
`?v=` bump (zero functional delta — rides with the next styles change).
Whole-site verification (`qa/nav_allpages.py`): static audit 32/32 files
consistent (elevate 3.3.0 on every page incl. error shells; main.js 2.4.21
on all 23 loader pages; subdir `../` paths correct); runtime 24/24 nav
pages pass auto-hide/menu/console/overflow (indian-army self-scrolls to
y=376 on load, so its hidden-at-load nav is correct per spec; the BPCL
`walkthrough.mp4` 404 is a missing owner-supplied asset referenced from
that page's config.js, not a nav issue).
BPCL chapter rail (`header.topbar`, fixed, page-scoped): it stayed pinned
while the pill hid, reading as a broken nav — now hides/shows in sync via
pure CSS driven by shared `.nav-hidden`
(`.site-nav.nav-hidden ~ .topbar`, `site-theme.css?v=3.1.1`, zero JS).
REVERTED per owner (`site-theme.css?v=3.1.2`): only the global menu pill
auto-hides — the BPCL chapter rail stays pinned as originally designed.
v3.3.1 (§13 rewrite): the delta-accumulator dropped sub-2px events and reset
on every reversal, so slow trackpad/finger scrolling never hid the nav
(proven with `qa/realistic_scroll.py` — 1px streams to y378 stayed visible)
— replaced with peak/valley position hysteresis (same 16/8/140/4 thresholds
and FOCUS/MENU/HOVER overrides); `elevate.js?v=3.3.1` on 32 pages; realistic
suite + `nav_test` + 24-page sweep all green.

## 20. Release v3.4.0 — "award-gap execution" (2026-09-12)
Ten-item execution following the full-stack audit. Every change additive or a
verified-correct byproduct; no rename of any CMS sync hook (§14 hooks intact).

1. **OG/social cards (P1-1 fix)** — 24 brand-built 1200×630 JPEG cards in
   `assets/og/` (paper #F7F5EF, Poppins eyebrow, Inter Tight 620 title, ghosted
   serif "av" motif; portrait variant for home). All 24 content pages now carry
   `og:image` **JPEG** + `og:image:type/width/height/alt`; twitter:image aligned.
   WebP og:image (silent breakage on WhatsApp/FB/LinkedIn) eliminated.
2. **View Transitions (cross-doc)** — `<meta name="view-transition"
   content="same-origin">` on all 32 pages; root out 0.25s / in 0.4s;
   `header.site-nav` captured as named group `nav` (types.add on
   pageswap/pagereveal, try/catch) so chrome persists. Chromium-only, silent
   elsewhere, reduced-motion gated.
3. **Signature hero kinetic** — `[data-kinetic]` tagline: line wipe (0.7s,
   --cb-colored ::after, right→left origin swap) → per-word accent wipes
   (.k-w spans injected by elevate.js §14 with aria-label preserved) → azure
   underline draw (::before, 0.6s @1.75s). One IO (.is-inview) drives all CSS.
   Insurance: html.reveal-failsafe kills any not-yet-triggered wipe overlay
   (text can never stay covered); prefers-reduced-motion = instant underline.
4. **CSP + hardening** — dev router `avFrontHeaders()` (CSP default-src 'self'
   + unsafe-inline for the hand-authored inline boot/JSON-LD; no
   frame-ancestors/upgrade locally so proxied previews + http dev keep working)
   and prod .htaccess (same + frame-ancestors 'self' + upgrade-insecure-requests,
   Header always). `header_remove('X-Powered-By')` in router + `Header unset`
   in .htaccess. Verified live: CSP/Referrer/Permissions present, fingerprint gone.
5. **PWA** — `manifest.webmanifest` (standalone, maskable icon, 2 shortcuts);
   icon set `assets/icons/` (32/192/512/maskable-512/apple-touch, brand
   monogram: navy rounded square, Instrument Serif italic "AV", azure period).
   SW registration moved to errors.js-style guard + main.js v3.4.0 user-gesture
   arming (Chrome M127+ offscreen-SW policy). sw shell → av-offline-v2.
6. **Token consolidation (P2-2 fix)** — tokens.css (orphan artifact, consumed
   by nothing, contradicted styles.css) RETIRED; its 5 possibly-referenced
   tokens are canonical in styles.css :root with a provenance comment. 0
   dangling references (verified; remaining hits are prose comments only).
7. **Font subset (P3-3 fix)** — Inter Tight italic pyftsubset'd to core
   Latin+symbol ranges: 101,484 → 56,288 B (−45%). Display italic remains
   Instrument Serif (verified by usage scan).
8. **AVIF trial (P3-6)** — 9 AVIF variants (full 1672w + 800/1280 for the case
   trio): 48–65% smaller than WebP at q50. Wired via `<source type="image/avif">`
   on index/portfolio/recruiter/case-studies index (12 slots). webp fallback intact.
9. **aria-current precision pass (P2-1 resolved with nuance)** — verification
   showed nav-represented pages already correct (story/experience/case-studies/
   portfolio/3 case-study details = 7). Actual gap was index.html only — brand
   link now carries aria-current="page". Non-nav pages (essays/contact/…)
   correctly have none (aria-current marks membership in the nav set).
10. **Cache architecture** — fonts bumped 30d → 1yr immutable (Expires +
    FilesMatch), matching the versioned-asset law (they never change).
    Known follow-ups: BPCL walkthrough.mp4 still owner-supplied (graceful gate
    stands); AVIF not yet wired into srcset pages' `<picture>` upgrades where
    variants were missing (all wired now), strict-CSP nonce migration (remove
    unsafe-inline) deferred until inline boot scripts are externalized.
Verification: all 38 routes correct (200/301/true-error statuses), all new
assets 200 + correct MIME, versions ?v=3.4.0 sitewide, JS syntax-clean
(node --check), CSS braces balanced, manifest JSON-valid, tokens.css 404.

## 21. Hero v4 — "Interlocked Planes" (2026-09-12, homepage only)
Full redesign of the homepage hero. Page-scoped layer `css/hero-v4.css?v=1.0.3`
(index-only) + hero module in `main.js?v=3.5.0`. Old `.hp-hero__stage` markup
fully replaced; **sync hooks preserved** (`.hp-hero__tagline` with data-kinetic,
`.hp-hero__avail`, `section#hero`, marquee, cue); LCP img attrs untouched
(preload + fetchpriority still valid — same `assets/hero-portrait.webp`).

Composition: eyebrow row (role + live IST clock, Intl Asia/Kolkata, 20s tick,
aria-hidden) → interlocked composite — "Abhijeet" solid BEHIND the arched
portrait (999/999/26 radius), "Varghese" IN FRONT (stroke outline that fills
post-entrance, -webkit-text-stroke @supports fallback), azure brand period
pops at 1.85s → statement grid tucked up into the portrait's negative space
(LEFT column only; roles column neutralizes the tuck with matching padding so
it starts below the portrait's bottom edge — verified `role1Top 749 >
portraitBottom 730`) → index roles list (serif numerals) → avail row.
Scroll drift: three planes separate (back −0.10 / front −0.045 / portrait
micro-scale), rAF-coalesced, bounded at 1.25vh, inline transforms live on the
OUTER line wrappers only (never the mask text — entrance owns that).

Laws honored: html.js-gated initial states; reveal-failsafe forces every
choreographed node final; prefers-reduced-motion = everything instant + drift
disabled; entrance choreography via §1's `.is-in` double-rAF (§12 hp-rise
stagger is inert on index — old hooks gone — and untouched elsewhere);
transform/opacity only; zero dependencies; canonical breakpoints (1080/900/
700/560; clock hides ≤560, cue hides ≤700, plate hides ≤700; 360px overflow
= 0px). `elevate.js` §14 word-split fix: original accent text node is CLEARED
before `.k-w` injection (doubled-text bug caught in screenshot QA);
`elevate.css` kinetic rules: ALL wipe overlays + triggers now html.js-gated at
matched specificity (noscript = no overlays + underline present; the (0,2,1)
base was beating the (0,2,0) `.is-inview` trigger — caught via computed
`matrix(1,0,0,1,0,0)` on a "cleared" overlay). elevate.css v3.4.2 /
elevate.js v3.4.1 sitewide.

Source-order law (new entry): **page-layer overrides that add padding to an
element whose base rule uses the `padding` shorthand MUST appear after that
base rule — the cascade is source-order-anchored at equal specificity.**
First cut placed the ≥901px block before `.hp4-roles { padding: 0 }` and the
shorthand silently reset the override; CSSOM walk caught it.

QA evidence (headless Chromium, real-time): desktop 1440 + mobile 390/360
screenshots (entrance-complete + scrolled states), accent text node verified
single, wipe transforms verified cleared, collision checks (no portrait/text
overlap at 1440), 17-page console sweep clean (only expected 404s: owner
walkthrough.mp4 + deliberate probe), h1×1, brand aria-current, mobile menu
open/close/focus intact, 360px overflow 0px. Screenshots in `qa/`.

## 22. Hero v5 — "The Opening Titles" (2026-09-12, homepage only, supersedes §21 visuals)
Fully custom film-main-title hero. Page layer `css/hero-v5.css?v=2.0.7`
(index-only; hero-v4.css RETIRED) + engine in `main.js?v=3.6.0`. Concept: the
owner's craft origin (VFX → film) as the design language itself.
Sequence: azure projector scan-line sweeps once (1.5s) → letters "develop"
outline→ink as the beam passes (--i stagger, 55ms/letter, -webkit-text-stroke
@supports-fallback to opacity) → portrait DEVELOPS inside a 35mm film-frame
module (sprocket strips, AV·35MM/FRAME 24A/ISO 800 meta caption; blur/exposure
→ neutral + one light-leak sweep) → serif tagline's accent gets a hand-drawn
SVG azure flourish (pathLength-normalized dash draw @2.05s) → statement grid,
index roles, availability → marquee.
INTERACTIVE (all rAF-coalesced, reduced-motion off-switches):
(1) Variable-weight FIELD on the name — ambient wave + pointer gaussian bump
    via font-variation-settings on the already-loaded Inter Tight wght axis
    (zero bytes added; centers cached per layout, re-projected per frame).
(2) Bespoke cursor RING (hover+fine only, JS-created, aria-hidden) — lerps
    after the pointer, becomes a camera frame (bracket ticks + radius morph)
    over a/button/[data-frame].
(3) Live IST slate clock + "SCENE 01" counter.
Scroll exit (is-past @0.28vh): title lines part ±4vw like a dissolving title
card; frame pushes in 1.05 scale/0.8deg.

LAWS + NEW LAWS learned here:
· **Same-node class selectors**: `#hero` carries `.hp-hero.hp5.is-in` —
  `.hp-hero.is-in .hp5 .x` is IMPOSSIBLE (descendant ≠ self). All such
  selectors rewritten `.hp-hero.is-in .x`. Caught because entrance ran on the
  2.6s failsafe instead of the choreography (opacity timeline analysis).
· **Cascade rebalance**: after the fix, base `html.js .hp5 .x` (0,3,1) beat
  the trigger `.hp-hero.is-in .x` (0,3,0) → triggers re-prefixed `html.js`
  (0,4,1). ALWAYS rebalance trigger specificity when you gate base states on
  html.js.
· Geometry law (§21) extended: absolutely-positioned frame reserves height
  via `.hp5-title { min-height: frame×1.20 }` (neutralized ≤700px where the
  frame re-enters flow); the grid tuck is calibrated to the name-to-reserve
  slack (−0.17, validated at 1440/1920/1280/1366×900/1080/800/768/720 + 390/
  360 mobile; avail ≤ fold at every pair via two short-viewport media layers).
· Mobile: frame drops into flow with sprockets alive; clock hides ≤560,
  cue ≤700; 360px overflow = 0.
QA: 16/16 letters develop; no-JS = letters visible + underline present;
reduced-motion = scan/leak gone, everything instant; entrance timeline
measured (top 1.5s → lede 2.5s → roles 2.8s → avail 3.4s); weight field
reacts (610 near / 607.6 far); 17-page console sweep clean (expected 404s
only); mobile menu open/close re-verified (prior "failure" was a harness
race — transition-still menu closes clean, single hidden event); sync hooks
(.hp-hero__tagline w/o data-kinetic, .hp-hero__avail, #hero, marquee) intact
for AV OS SiteSync. Screenshots: qa/v5-*.png (entrance/desktop/pointer/exit/
mobile/1280/1366/no-js/reduced).

## 23. Hero v6 — "RESOLUTION" (2026-09-12, homepage only; supersedes §22 visuals)
Owner-corrected direction: v5's film language read as cinematographer-branded.
v6 makes the hero perform HIS proposition — clarity from complexity. Page layer
`css/hero-v6.css?v=3.0.1` (hero-v5.css RETIRED) + `main.js?v=3.7.0`.
Concept mapping: scattered/blurred letters RESOLVE into registration (autofocus
snap, per-letter deterministic scatter via --dx/--dy/--rot, calibration sweep
replaces projector beam); portrait wears REGISTRATION MARKS (print/design, not
film sprockets) captioned STRATEGY·DESIGN·TECHNOLOGY·AI·PEOPLE — the five
inputs converging on him; one-shot focus-lock blink @2.15s; THE CLARITY FIELD —
the inputs drift as ghost fragments (dot-grid engineering paper backdrop,
radial-masked) and SNAP into alignment + turn azure within the pointer radius
("clarity follows you", per-fragment spring lerp, paused off-screen); roles
redrawn as a NODE CHAIN (connected dots, hover pulse); slate shows
"BENGALURU 12.97° N, 77.59° E" instead of SCENE 01; cursor = focus reticle.
Kept from v3.4/v3.6: variable-weight name field, kinetic tagline + flourish,
IST clock, is-past title-part exit, marquee/cue/avail.
Laws applied from §21/§22: html.js-prefixed triggers (0,4,1) over gated bases
(0,3,1); same-node selector avoided (.hp-hero.is-in .hp6-x); title min-height
reserves the absolute frame (neutralized ≤700px, frame in flow); calibrated
tuck −0.17 + roles offset; two short-viewport layers (≤840/≤780) keep avail ≤
fold at 1366×768/1280×720; fragments masked away from content zones (200deg
gradient mask) + opacity 0.12; ≤700px shows max 5 fragments; 360px overflow 0.
QA (headless Chromium): mid-resolution + settled + clarity-field screenshots;
geometry all-clear at 1440×900; fragments resolve under cursor (is-clear
toggles, 1/near); no-JS letters readable (opacity+filter clear); reduced-motion
= instant registered state, scan/field-motion/cursor off; 17-page console sweep
clean (only the documented owner-asset 404); mobile menu open/close verified.
Screenshots: qa/v6-*.png.

## 24. Hero v6.1 — owner refinements (2026-09-12, four directives)
1. **Slate row REMOVED** (role/clock/coordinates) — .hp6-top markup + all
   grouped choreography references stripped; clock module removed from
   main.js (parallax added in its place; still guarded by .hp6-stage).
2. **Name = the site's original type**: Inter Tight 700 uppercase (was 640).
   Hard no-overlap guarantee: desktop title gets padding-right = frame width
   + gutter, and the name size is derived from the REMAINING column width
   (clamp(min(11vw, (100vw − 2·pad − frame − gutter)/4.6), bounds)). Verified:
   gap > 0 at 1024/1280/1440/1920/2560 (13–31px); tagline/roles/avail checks
   all pass (the 1920 regression from an unclamped override was caught and
   fixed — never derive sizes without min/max bounds).
3. **"People" removed** from the frame caption (STRATEGY · DESIGN ·
   TECHNOLOGY · AI).
4. **Lively portrait**: ultra-slow Ken Burns (16s ease-in-out infinite, starts
   2.6s after resolve; 0% frame = scale(1) clean handoff), sheen sweep every
   9s (::before on the well, img transform stays owned by Ken Burns), and
   pointer parallax on the WELL (lerp 0.08, ±12/9px max, hover+fine only).
   PROOF: 8.4% of frame-region pixels changed across a 5.2s window; parallax
   transform measured live; reduced-motion kills all three (animation:none,
   sheen display:none, JS guard).
hero-v6.css v3.1.1 · main.js v3.7.1 (23 pages). Console sweep clean.
Screenshots: qa/v7-*.png (incl. 1920 ultra-wide + motion-proof diff).

## 25. v6.2 — original name identity + AV loader (2026-09-12)
1. **Name restored to the ORIGINAL treatment**: solid "ABHIJEET" + stroke-
   outline "VARGHESE." (styles.css .hp-hero__name metrics: 700, −0.045em,
   0.9 line-height, original clamp scale + line-two indent). The resolve
   entrance now lands line-one at ink and line-two AT THE OUTLINE STATE
   (scoped overrides in all three terminal layers: is-in / failsafe /
   reduced-motion). No-overlap guarantee retained (padding-right geometry,
   gap verified 13–31px across 1024–2560).
2. **AV LOADER — "RESOLUTION boot"** (index only): first node in <body>,
   paints instantly; serif "AV." wordmark + pulsing azure period, hairline
   progress bar, tabular counter; rAF lerp to a soft target, completes on
   load+MIN(750ms) with 1.8s soft cap (below-fold images never hold it) and
   3.5s hard failsafe; html.av-loading locks scroll, av-done fades + node
   self-removes; html.js gate (no-JS = display:none). **Hero choreography is
   HELD until the lift** — §1 is-in and §14 kinetic trigger poll every 60ms
   for the av-loading class to clear (elevate.js 3.4.3), so the title
   sequence plays in full view. Measured: lift @1.32s on typical loads.
   QA: loader visible+locked at 350ms, removed after fade, line-two lands
   stroke-outline (computed), 5-width overlap sweep green, 360px overflow 0,
   no-JS loader absent, other pages untouched, console clean.
   **CSP note**: our own script-src blocked Playwright's string-eval
   (wait_for_function) — use evaluate polling in QA harnesses.
hero-v6.css v3.2.0 · elevate.js v3.4.3 · index failsafe 3400ms.
Screenshots: qa/v8-loader.png, v8-entrance.png, v8-desktop.png.

## 26. Loader v2 — "SIGNAL FROM NOISE" (2026-09-12, supersedes §25 loader visuals)
Owner brief: the loader must tell the JOURNEY, not read as a loading screen.
Concept: three serif cells cycle like untuned signal (55ms scramble tick,
random A–Z glyphs, blurred + dimmed `.is-noise`) and lock left→right into the
wordmark — A @340ms, V @620ms, azure dot pops @880ms (spring scale-in) — with
a single hairline drawing underneath as the only progress voice. No bar crawl,
no percentage, no spinner: a title card that resolves itself (clarity-from-
complexity, same thesis as the hero). Deterministic beat: complete @1.3s,
lift ~1.32s measured, self-removes. 3.5s hard failsafe retained; reduced-motion
= the resolved wordmark instantly (no scramble, dot pre-set); html.js-gated
(no-JS = display:none); scroll locks via html.av-loading; hero choreography
still held until lift (elevate.js 3.4.3 gate unchanged).
Bug caught in QA: the dot cell has no data-ch → states[2] undefined crash;
lock handler now guards index vs states.length and toggles the dot explicitly.
QA: zero pageerrors, lift 1320ms, loader removed, scroll locked during boot,
other pages untouched, 360px overflow 0. Screenshots qa/v9-*.png (noise →
locking → settled).
hero-v6.css v3.3.0 · index.html loader block v2.

## 27. v6.3 — journey loader v3 + perf pass + dot removal (2026-09-12)
Owner directives (all executed):
1. **LOADER v3 "THE JOURNEY CONVERGES"**: the nine Journey-era disciplines
   (Graphic Design · Animation · Storytelling · Experience Design · Immersive
   Tech · Creative Leadership · Enterprise Innovation · AI · Future) surface
   one by one (95ms cadence, blur 8px → 0) at scattered vmin-proportional
   coordinates (--x/--y units × --r responsive radius); at 1.26s all converge
   into center with per-item 0.022s stagger while "Abhijeet Varghese" (serif
   italic, letter-spacing 0.3em → 0.015em) materializes underneath; hold ~0.9s;
   fade → homepage. Deterministic 2.4s complete + 3.5s hard failsafe. The
   loader IS the Journey chapter — same nine disciplines, resolved into the
   name. Ambient layer: 2 random labels stay blurred as depth texture.
   Reduced-motion: name directly, words display:none. No-JS: hidden.
2. **Hero dot REMOVED** (".": owner directive) — hp6-dot span + all 13
   dot/cursor CSS rule fragments deleted; "VARGHESE" now ends at the outlined
   final E. No-overlap re-verified (gaps 13–31px @1024–2560).
3. **PERF PASS "ULTRA FAST"**: (a) BOTH custom cursors removed — elevate.js
   §8 glow (a never-idle rAF loop) + main.js §4 focus-reticle; CSS rules
   removed (e-glow token var kept: buttons still use it). (b) woff2 subset to
   Latin via fontTools (248→142KB; poppins 49→8KB; inter-normal 92→52KB;
   inter-italic resisted — not TOFU-safe to strip, kept). (c) ALL css/js
   minified in place (535→397KB). (d) sw.js → av-offline-v3. Result:
   **homepage 638KB/29 reqs → 359KB/13 reqs (−44% bytes, −55% requests)**.
4. **Language audit**: entire site + AV OS admin verified English
   (html lang="en" everywhere, zero non-English UI strings; only ©, é in
   "résumé" [standard], 🇮🇳 flag in phone selector [intentional]). Any non-
   English text the owner sees is their AI tool's UI chrome, not this site.
**LAW (§27.1 — minify deploy)**: read source BEFORE opening for write; a
`open(w)` placed ahead of `read` truncates the file (this destroyed the live
css/js once; restored from src-backups/ + redeployed). Pretty sources live in
repo-root src-backups/ (css/js/fonts) — edit THERE, minify into abhijeetvarghese/.
**LAW (§27.2 — excision)**: removing a JS `if () { … }` block by slicing from
header-comment to `})();` can orphan the block's own closer — always
node --check after excision (caught: elevate.js glow removal left `})();
` + `}`).
main.js v3.8.0 · elevate.js v3.4.4 · styles.css v3.5.0 · elevate.css v3.4.3 ·
hero-v6.css v3.4.0 · sw av-offline-v3. Screenshots qa/v10-*.png.
Admin temp password (this recycle): bedb5e623186be1041f62c3c.

## 28. "The website lost the design" — ROOT-CAUSE FIX (2026-09-12)
**Diagnosis**: the site on the server was NEVER broken (fresh-browser QA,
screenshots, computed styles: design fully intact on every page). The owner
saw a broken site because router.php served css/js with
`Cache-Control: public, max-age=31536000, immutable`. During the §27 deploy,
live css/js were briefly empty (the truncation incident). Any browser that
fetched in that window cached 0-byte stylesheets as IMMUTABLE-for-a-year and
kept serving them across ordinary reloads → "lost the design".
**Fix (three layers)**:
1. router.php: css/js/woff/woff2 → `Cache-Control: no-cache, must-revalidate`
   (correct: assets are query-string-version-busted; revalidation costs one
   304). Images keep 30d. VERIFIED on live responses.
2. Version blast: ALL 267 css/js refs site-wide → ?v=4.0.0; the 5 @font-face
   URLs inside styles.css stamped ?v=4 — every poisoned browser-pull is
   forced onto fresh URLs immediately.
3. sw.js → av-offline-v4 (redundant; SW only ever intercepted navigations —
   it never cached sub-resources; audited this round).
Also fixed this round: stray `}` in elevate.css left by the §27 e-glow
excision (browsers swallowed it silently; braces balanced 175/175).
**LAWS**: §28.1 — immutable/1-year caching on version-busted assets is only
safe when the DEPLOY IS ATOMIC; behind a non-atomic dev server use
no-cache + query busting. §28.2 — after ANY css excision assert
braces-open == braces-close (the §27.2 JS analogue, now for CSS too).
Current: ?v=4.0.0 site-wide · sw av-offline-v4 · fonts ?v=4.
Admin temp password: bedb5e623186be1041f62c3c.

## 29. v6.4 — VELOCITY PASS: scroll FPS war + loader/entrance compression (2026-09-12)
Owner brief: homepage still not ultra-fast; hero slow, scroll janky.
**Measured journey (all @4× CPU throttle, Chromium trace-verified):**
First FPS harness read 9–11fps — WRONG: `scroll-behavior: smooth` on html
made every synthetic per-frame scrollTo restart a smooth animation, and the
drop-counter counted total page wall-time. Fixed harness (scrollBehavior auto
+ 800px/s + per-frame dt) → real baseline 57fps avg, drops concentrated
exclusively in the hero's first ~900px (user's instinct was correct).
Ablation (hide-element + style-tag method) isolated the cost: hero motion;
CDP Tracing showed 398–626 RasterTasks per 2.6s scroll = continuous re-raster,
not script (JS was already consolidated).
**Shipped (v4.1.5):**
1. SCROLL ARCHITECTURE: 12 scroll listeners → ONE handler (main.js v3.8.2)
   with strict read-then-write batching (one layout/frame); journey
   scrub geometry (scrollWidth/offsetHeight) cached, measured on
   resize/load only; elevate.js hero parallax IO-gated, zero rect reads.
2. RASTER WAR: backdrop-filters 29→1 (only the OPEN mobile menu keeps
   glass — the one designed moment). Nav glass was DOUBLED (styles.css
   frosted __inner + elevate.css again) → deduped; case-card plate,
   page-close, figcaption, compass, e-top, ghost buttons → solid tints,
   alpha raised to preserve legibility. Blur signature of the name:
   16 per-letter blurs → 2 LINE-level blurs (same resolve-from-noise
   read, 8× fewer filters). Portrait: wrapper layerized (will-change),
   color-grade filter FLATTENED after entrance (hero-settled class,
   +1.6s) because a static filter under a Ken-Burns-animated layer
   re-filters every frame; autofocus blur 14→9px.
3. MOTION RESTS WHILE YOU SCROLL (§29.4): html.is-scrolling gate
   (add on scroll, release after 180ms at rest) pauses Ken Burns + sheen
   and drops the nav frost to a solid tint during scroll — invisible at
   speed, eliminates per-frame re-raster under the blur radius.
   html.hero-parked (IO) pauses ALL hero infinite animation off-screen;
   content-visibility:auto on below-fold chapters (journey excluded —
   sticky scrub measures it).
4. PERCEIVED SPEED: loader 2.4s→1.45s deterministic (scatter 60ms/item,
   merge @720ms); hero entrance ~40% faster (letters 0.3s+0.032i,
   copy block 1.0–1.55s, roles --rd 1.2–1.44s); serif italic PRELOADED
   (was late-binding after fonts); transfer 424KB/15 reqs.
**CAUGHT BY SCREENSHOT**: the serif-preload insertion (done in two rounds)
left `crossorigin>>` in the head — one stray char silently opened <body>
early and DEMOTED every OG meta + all 3 stylesheets into body (invalid
HTML, SEO head broken, stray ">" painted top-left). Fixed; audit now part
of QA (§29.6): head must contain stylesheets+OG+JSON-LD, body starts at
the loader, zero text nodes/metainbody.
**LAWS**: §29.1 one scroll handler per page; reads batched before writes;
per-frame scrollWidth reads forbidden. §29.2 backdrop-filter = per-frame
re-raster of everything behind it — one per page max, only on the design
moment. §29.3 never leave a static filter on an animated layer; blur at
the highest level that preserves the effect (line, not letter). §29.4
ambient motion rests during scroll. §29.5 NEVER benchmark synthetic scroll
without neutralizing scroll-behavior; report wall-time, not frame-count.
§29.6 after ANY head edit: audit head children + body-stray-text.
main.js v3.8.2 · elevate.js v3.4.5 · styles.css v3.5.1 · elevate.css
v3.4.4 · hero-v6.css v3.4.1 · all refs ?v=4.1.5. Screenshots qa/v11-*.

## 30. v6.5 — hero scroll-finishing + Orange Business v5.0 "THE ROOM RESPONDS" (2026-09-12)
1. **HERO SCROLL (final)**: the last per-frame hero mutations removed —
   elevate.js scroll-parallax DELETED (v3.4.6; pointer parallax remains);
   is-past exit-drift transforms + their 0.9s transition removed (huge
   stroked layers); marquee joins the is-scrolling rest gate; frame shadow
   diet 120px→56px (half the raster texture). Hero is now 100%
   mutation-free during scroll: entrance → rest → interaction only.
   Mobile 390 @6× throttle: 44–46fps = emulator software-raster floor
   (same run @1× = 57fps; the throttle ceiling, not the page). Full-page
   drops: 17 → 2 (one mid-page decode, one telemetry artifact); after the
   hero pass the remaining 13,500px are drop-free.
2. **ORANGE BUSINESS v5.0** (css 144→478 lines pretty / 32KB min, js
   +~330 lines, page ?v=5.0.2): concept — the page behaves like the room
   it describes (senses → responds → performs). Design system: ink
   #0C0B09 / paper #F7F4EE / Orange signal #FF7900, serif-italic
   chapter numerals as outline type, hairline-divided plates. New:
   fixed chapter RAIL (IO scroll-spy, inverse-aware); hero rebuilt
   (topline, logo chip on paper, solid+outline stacked title w/
   clip-path entrance, editorial split with live 4-zone panorama map —
   hotspots drive the readout); "THE ROOM" simulator (standby→live:
   curtains part, warmth rises, readouts flip; auto-demo on first view
   0.9s→5.2s, then manual); ROTOSCOPE drag rig (range-driven clip-path,
   staged readout = physical→screen→digital); VIDEO WALL mode
   visualizer (4 layouts rebuild tiles); journey stage kept; purpose
   matrix + architecture explorer reskinned as hairline plates;
   closing on panoramic room. Perf laws §29 held: 1 backdrop-filter
   total (0 on this page), no per-letter blur, transforms/opacity only,
   nothing infinite at rest. QA: hero-in ✓, rail spy ✓, room auto-demo
   timeline measured (live @+1.7s, standby @+6s) ✓, rotoscope ✓,
   wall modes ✓, journey ✓, reduced-motion full baseline ✓, mobile
   overflow 0 ✓, 10-page sweep clean (BPCL 404 = documented owner
   asset gap). Versions: ob css/js ?v=5.0.2, elevate.js v3.4.6,
   hero-v6.css v3.4.2 (?v=4.2.2).
Screenshots: qa/ob-hero.png, ob-room.png, ob-rotoscope.png, ob-wall.png,
ob-closing.png, ob-mobile-*.png.

## 31. Orange v5.1 — TRUTH PASS + room v2 + real video (2026-09-12)
Owner directives: room design rejected → rebuilt; §04 stage images must
match their labels; §07 needs real video for all three; award-class page;
remove the left scroll rail.
**ASSET TRUTH AUDIT (the §04 root cause)**: the SOURCE IMAGES were
mislabeled — "visitor-registration-touchscreen" actually shows the empty
video-wall room; IMMERSE showed a man on a phone (not immersion); RECOGNIZE
and CONVERSE duplicated other stages' exact photos. Law §31.1: never map
copy to an asset by its filename — LOOK at the asset (read_file) before
wiring it to a claim.
Fix (honest, no fabrication): every stage re-mapped to a real photo —
Recognize → new macro crop of the entry display (arrival-display-848,
calibrated crop coords; first crop missed the screen and was discarded),
Immerse → vr-chair-close-848 (chair + headset on table), Converse →
converse-lounge-848 (lounge crop). 7 stages: 5 unique real photos + 2
truthful detail crops; zero synthetic imagery on a client case.
**REAL VIDEO (§07)**: built with ffmpeg zoompan Ken Burns (6s, 1280×720,
H.264 crf27 +faststart) from the REAL stills: orange-rotoscope.mp4 (slow
push-in), orange-wall.mp4 (pull-back reveal), orange-vr.mp4 (drift down to
the chair), 209–239KB each. Wired as muted+loop+playsinline with poster;
IO gate: load() on approach, play in view, pause out — zero bandwidth at
rest (§29 law kept). Panels deduplicated: the video IS the figure now
(rotoscope + VR), wall = video + mode chips narrating the live capture.
**ROOM v2**: owner rejected the boxed panel — rebuilt as a cinematic
full-bleed sensor stage: room panorama desaturated/dark in standby,
parting curtain pair (12px slat texture, 1.9s ease), warmth gradient
rises (2s), color+scale return, 4 status chips ON the image flipping
NONE→PRESENT / CLOSED→OPEN / OFF→ON / STANDBY→LIVE, ghost toggle in the
invite bar; auto-demo on first view (0.9s in, 5.2s back), then manual.
**RAIL REMOVED** (markup + spy JS) — content breathe restored.
QA: room auto-demo live→standby measured ✓; all 3 videos sourced +
playing in view ✓; stage-image mapping truthful ✓; wall modes ✓; mobile
overflow 0, room live ✓; 9-page sweep OK. ?v=5.1.1. Screenshots
qa/ob-room-v2.png, ob-video-rotoscope.png, ob-video-vr.png,
ob-mobile-room.png.

## 32. Orange v6.0 "ONE DARK ROOM" + scroll handler v3.8.3 (2026-09-12)
Owner repeated all five directives → diagnosis: (a) design rejected twice
→ STOP designing on taste; rebuild IN the house language of BPCL/Army
(the pages the owner loves); (b) repeats + rail complaint = stale browser
cache (rail was verifiably removed in §30) → ?v= bumped site-wide.
**Orange v6.0** (?v=6.0.0, css rewritten 304 lines): near-black canvas
#0A0A0B / bone #EDEAE2 / signal orange #FF7F00; full-bleed cinematic hero
("TECHNOLOGY DISAPPEARS. EXPERIENCE REMAINS." — clip-path line entrance,
slow bg settle, shade ramp, meta dots, explore CTA); Army-pattern FACT
STRIP (client/built/where/role + 30-sec dialog); TOP chapter bar
(fixed, appears past hero, IO scroll-spy, dots, mobile = dots only);
two-column editorial acts; all v5 interactions retained (journey truth
mapping, room simulator, 3 live-capture videos, wall modes, purpose
matrix). Rail stays removed. QA: hero-in ✓ bar+spy ✓ room live ✓ video
playing t=3.3 ✓ stage5=vr-chair ✓ mobile overflow 0 ✓.
**Hero scroll — the real culprit (§29.8)**: v3.8.2's is-scrolling gate
FROZE ambient motion during scroll (and resumed 180ms after rest) — on
GPU devices that freeze-resume reads as "the hero is stuck". REVERSED:
transform-only animations are GPU-composited and cost nothing during
scroll — they must keep running. Also: scroll handler now does ZERO
layout reads per frame (v3.8.3) — doc height, parallax offsets
(measured with transforms temporarily cleared), journey offsetTop all
cached on init/resize; handler = arithmetic + change-guarded writes;
progress quantized 1/2000; nav toggle change-only. Verified: ambient
runs during scroll, parallax writes only in-range elements, zero
pageerrors, geometry gap 20 @1920.
**LAW §29.8**: never freeze GPU-composited (transform/opacity-only)
animation in response to scroll — pause only what actually re-rasters,
and only when off-screen. **LAW §29.9**: scroll handlers do zero layout
reads; all geometry re-measured on resize/load only.
main.js v3.8.3 · hero-v6.css v3.4.3 · all refs ?v=4.3.0 · Orange ?v=6.0.0.
Screenshots qa/v6-hero.png, v6-bar.png, v6-hero-final.png, v43-home.png.

## 33. Orange v7.0 "SIGNAL IN THE DARK" (2026-09-13)
Sixth rejection → page fully rebuilt as premium dark cinematic system:
one canvas (#08080A), one signal (#FF7F00), Instrument Serif italics as
the only decoration, film-grain vignette, numbered chapters (01–11).
Owner's section numbering now MATCHES the page badges.
**PANO HERO (new law §31.2)**: real panoramic photo + EXACT hardware
pins — only pins verified by zoom-crop review (entry panel 23.8/56.9,
video wall 34.8/49.8, presentation display 48.8/45.5, table unit
58/65.6, VR chair 66.6/66.4, ceiling sensor 49/9 = @49%,9%). Pedestal
guess DISCARDED (zoom showed decor, not hardware). Details strip under
the pano swaps title+desc per pin; auto-tour advances every 4.2s but
STOPS FOREVER on first user click (intent law). Mobile: native
horizontal pan, pins travel with the image.
**§04 stage switcher = text-only** (owner: remove image placeholder):
7 rows 01–07 → panel swaps tag/title/desc/bullets from data-attrs;
giant ghost numeral watermark; zero images.
**§05 room logic INVERTED (owner spec)**: empty room → curtains OPEN
(standby); visitor enters → curtains CLOSE (private briefing, lights
warm, mode LIVE). Verified cycle standby→live(0.9s)→standby(5.6s).
**§07 media = 5 videos, EXACT server filenames** (owner contract):
01 overview.mp4, 02 entry.mp4, 03 rotoscope.mp4, 04 videowall.mp4,
05 VR.mp4 + filename shown in each info panel. overview/entry missing
→ error-listener flips .is-missing placeholder "FOOTAGE UPLOADING —
OVERVIEW.MP4" (still plays when owner drops files in, zero code
change). rotoscope/videowall/VR.mp4 live now (copies of verified
round-3 footage). **Video gate law §29.10**: user tab-click plays
IMMEDIATELY (intent overrides viewport gate); IO only lazy-loads,
plays in view, pauses out.
Chapter bar = dots+labels, spy via IO; all motion IO/transform-only;
reduced-motion = everything visible, no animation. QA: 9 pages 200 +
zero pageerrors, mobile 390 overflow 0, pins/tour/stages/room/gallery
all verified incl. pause-profiler proof of the gate bug.
Orange ?v=7.0.0; site rest ?v=4.3.0. Shots: qa/v7-hero.png,
v7-stages.png, v7-room-live.png, v7-media-rotoscope.png, v7-mobile-hero.png.
**LAW §31.2**: pins/hotspots on real photography only after zoom-crop
verification of each target; an unverifiable target gets NO pin.

## 34. Orange v7.1.0 — light/dark + owner hardware truth (2026-09-13)
Five directives: (1) Page theme now ALTERNATES light/dark — dark:
hero+pano, 05 system, 07 media, closing; light (#F2EFE8 warm bone):
facts strip, 02 why, 03 role, 04 experience, 08 purpose, 09 delivery,
10 outcome. Mechanism: .ob-light remaps --ob-line/--ob-bone*/--ob-card
CSS variables + bg — components inherit; card literals were first
tokenized to var(--ob-card). (2) §05 untouched. (3) Pins = OWNER'S
hardware truth, 3 only: 01 Rotoscope, 02 Interactive video wall 2×2
(owner corrected my 3×3), 03 Immersive VR chair — entry panel,
pedestal, ceiling sensor REMOVED. Positions unchanged (verified in
pano). (4) Room = two explicit buttons: ENTER closes curtains,
LEAVE opens; 1.6s eased slide + warmth/lights transitions; disabled
state on the inactive button; auto-cycle REMOVED. (5) Chapter bar
removed entirely (nav + CSS + JS; owner removed the page-section nav
he'd asked for in round 4 — his call, logged). QA: pins/tour(3)/
light bg/room enter-leave verified, 0 errors, mobile 0 overflow.
Orange ?v=7.1.0. Shots: qa/v71-hero.png, v71-light.png, v71-room-live.png.
NOTE: env deps do not survive snapshots — reinstall rcssmin/rjsmin/
playwright (`pip install rcssmin rjsmin playwright && playwright
install chromium`) before QA in a fresh session.

## 35. Orange v7.3.0 — original Experience System restored (2026-09-13)
Directive 1 ("same as original file") resolved by FORENSICS, not memory:
the original shipped page lives at git dcf5a1d under
experience-design/orange-business-executive-briefing-center/. Its §05
= .room-response (media 7fr + control 5fr, 06 eyebrow, readout grid
2×2: VISITOR/CURTAINS/LIGHTS/EXPERIENCE, single orange .response-toggle
with knob). Curtain mechanic: edge strips 7% width → 22% on
[data-state=active] (they CLOSE inward), light bars glow white, image
brightens .45→.85. Module RESTORED verbatim, reskinned in v7 tokens.
JS: single toggle, setRoom(active) with original label semantics
(NO VISITOR/DETECTED, OPEN/CLOSED, OFF/ON, STANDBY/ACTIVE,
ENTER/LEAVE ROOM). **QA LAW: assert computed geometry for motion
claims** — curtain width measured 48px (7.0%) ↔ 151px (22.0%) of the
687px media box, both directions, screenshots at both states.
Directive 3 enhancement pass: display type up to 6.4rem, pano
viewfinder corner brackets, real Mumbai coords (19.0760°N 72.8777°E)
in the pano hint, LIVE CAPTURE · LOOPED badge on gallery videos,
warm-paper gradient on .ob-light, hover shadows on light cards,
orange focus-visible rings site-wide. 0 pageerrors, mobile 0 overflow.
Orange ?v=7.3.0. Shots: qa/v73-room-standby.png, v73-room-active.png,
v73-hero.png.
**LAW §35.1**: "same as original" = git-archaeology the original file;
restore its mechanics verbatim, restyle only.

## 36. Orange v7.4.0 — original §05 code + full brand compliance (2026-09-13)
(1) "Same as original CODE" honored literally: entire §05 inner block
(system-intro + architecture-diagram + room-response) transplanted
VERBATIM from git dcf5a1d original file — original classes, data-attrs,
labels ("06 · THE ROOM KNOWS YOU'RE THERE."), readout strings, toggle.
CSS for architecture ported from original stylesheet (white cells,
black EXPERIENCE LAYER/DYNAMIC BACKEND, orange active cell/hover,
orange CONNECTED EXPERIENCE) onto brand vars. Branch click→output-swap
verified (Rotoscope). Law §35.1 upheld — this is what "original" means.
(2) Curtain FULL close: width 0% → 50% per side = 100% coverage;
measured leftPct 50.0 / rightPct 50.0 / coveredPct 100.0 + re-open 0.1.
(3) BRAND SYSTEM: Orange Business = white/black/#FF7900 — canvas #000,
light sections #FFF, signal #FF7900 (computed verified), all warm
cream/amber literals purged. (4) RESPONSIVE MATRIX: 12 viewports
(320/375/390/414/600/768/820/1024/1280/1440/1920/2560) — 0px overflow
on ALL, 0 pageerrors; gridded blocks collapse per breakpoints (branches
4→2→1, output 4→2→1, room stacks <900, gallery stacks <900).
Orange ?v=7.4.0. Shots: qa/v74-hero.png, v74-system.png,
v74-curtain-full.png, v74-320.png.

## 37. Round 9 — journey re-measure, hero read-purge, nav stacking law (2026-09-14)
(1) JOURNEY "stuck": root cause = v3.8.3 froze journey geometry at load
(offsetTop + no re-measure); any late layout shift (lazy images,
content-visibility re-estimates) left jTop stale → scrub dead. FIX:
docY() offsetParent walk (LAYOUT-TRUE, transform-immune — rect+scrollY
is skewed by ancestor parallax transforms, proven by non-monotonic
probe) + ResizeObserver on documentElement + fonts.ready re-measure.
Verified: scaleX .248/.521/.771 at 25/50/75% AFTER a +1500px synthetic
shift. HARNESS TRAP (repeat of §-law): html has scroll-behavior:smooth —
scrollTo without behavior:'instant' animates ~1s and mid-flight reads
poison results. (2) HERO lag: the hp6 "clarity field" rAF loop called
getBoundingClientRect PER FRAGMENT PER FRAME (~30 reads/frame +
unguarded writes) — layout thrash storm. FIX: cached document-space
centers (bx/by), pure-math proximity test, change-guarded writes.
Reads during 3.4s interaction: ~720 → 97 (rest = harness). evo3d loop:
rect-per-frame + querySelector-per-frame → cached geometry + metas.
(3) ORANGE NAV: .ob-page > * { position: relative; z-index: 1 }
(equal specificity, later file) OVERRODE .site-nav's position:fixed →
nav scrolled away. LAW §37.1: page-root stacking rules MUST exempt
fixed chrome — .ob-page > .site-nav/.mobile-menu re-pinned to fixed.
Verified vs Army page (fixed/14 after 3000px scroll).
(4) Audit: 13 pages × desktop+mobile — 0 overflow everywhere, nav
fixed+holding everywhere, /experience/ canonical (not .html),
/api/analytics/track 501 = static-preview artifact (PHP backend in
prod), homepage hp6 "hero-parked" IO pause = legal off-screen pause.
main.js v3.9.0 · all refs ?v=4.4.0.
