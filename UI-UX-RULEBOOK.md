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
