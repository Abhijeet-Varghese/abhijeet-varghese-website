# MILESTONE 2 — STORY / EVOLUTION

> **Status: COMPLETE.** Story/Evolution fully migrated and verified
> **pixel-identical** to production; homepage bundle splitting implemented and
> measured. Per instruction, Milestone 3 has **not** been started.

---

## MIGRATED

| Route | pageId | Status |
|---|---|---|
| `/` (`index.html`) | `home` | ✅ (M1, re-verified) |
| `/story.html` | `story` | ✅ **Migrated this milestone** |

`story.html` now renders via React (build-time SSR) + a dedicated client chunk.
Story/Evolution code is **never** imported by the homepage bundle.

## VISUAL FIDELITY (old vs new, Playwright + ImageMagick RMSE, reduced-motion for determinism)

| Capture | 1440 | 1920 | 390 |
|---|---|---|---|
| Prologue (hero) | **0** | **0** | **0** |
| Identity (act-01) | **0** | — | — |
| Evolution (acts) | **0** | — | — |
| Credits | **0** | — | — |
| **Full page** | **0** | **0** | **0** |

Every capture is **0 RMSE = pixel-identical**. No layout, typography, colour,
imagery, or positioning differences. One real bug was caught and fixed during
verification: the production `.page-close` control (`data-history-close`,
46×46 fixed close button) was initially missed — restored, after which all
diffs went to 0.

## EVOLUTION — implementation

The 3D film stack is ported **1:1** (identical constants, easing, paint order,
world-light tint, camera lerp) into a self-contained `Evolution.tsx` driven by a
**single coordinated `requestAnimationFrame` loop**:

- **Compositor-only** per-frame work: `transform` / `opacity` / `visibility` /
  `z-index` — no layout, no paint, no filter/shadow animation.
- Cards **sleep offscreen** (`visibility:hidden` + `will-change` cleared) and
  the loop **halts when the stack leaves the viewport or the tab is hidden**
  (IntersectionObserver + `visibilitychange`).
- Pointer camera is lerped and **skipped once settled**; `fine-pointer` gated.
- `prefers-reduced-motion`: no loop runs; cards render in CSS default order
  (frame 01 visible) — **content preserved, no movement**.
- Atmosphere (`#aboutAtmo`) + compass (`#aboutCompassNum/Name`) updates are
  written only on active-card change, not per frame.

Also ported: prologue title-line parallax, identity-portrait parallax,
"zoom-out" stage scrub (`--zp` + label states + ghost fade), stat counter,
prologue marquee play/pause gate, press states, and the contextual
`avos:nav-origin` / `avos:nav-restore` behaviour (typed React replacement).
The no-op `body.dataset.env` write (no CSS consumer in production) was omitted.

## PERFORMANCE (before vs after)

Scripted scroll through the Evolution runway (1440px):

| Metric | OLD (main.js) | NEW (React/Vite) |
|---|---|---|
| Avg frame | 19.52 ms | **19.03 ms** |
| p95 frame | 33.40 ms | **33.30 ms** |
| Dropped frames (>25ms) | 23 | **19** |

Equivalent-or-better (the port removed the old monolithic `main.js`'s extra
competing scroll listeners). Both run ~52–60 fps through the 480vh runway.

- **JS**: homepage — see BUNDLE below. Story page JS: 8.31 KB gz (was: full
  41 KB `main.js` for every page).
- **CSS**: 26.86 KB gz shared (single stylesheet, unchanged visual output).
- **LCP / CLS / INP**: not meaningfully measurable on the static preview
  (PHP backend/analytics absent); hero image + body font are preloaded to bound
  LCP. No layout-shift-prone changes were introduced (0-pixel diffs imply no
  CLS regression vs production).

## BUNDLE

**Homepage initial JS:**

| | Value |
|---|---|
| BEFORE | 78.13 KB gz (single monolithic chunk) |
| AFTER | **77.14 KB gz** (shared 67.08 + home 10.06) |
| Story page | 75.39 KB gz (shared 67.08 + story 8.31) — Evolution isolated |
| Booking calendar | **4.46 KB gz, lazy-loaded** (deferred until contact nears viewport) |

**What changed (spec's "correction"):**

1. **Route-level splitting** — per-page client entries (`entry-home.tsx`,
   `entry-story.tsx`). The homepage no longer ships Story/Evolution/Portfolio/
   Contact-page code. Story is now an isolated **8.31 KB** chunk.
2. **Interaction-level lazy loading** — the custom calendar is a `React.lazy`
   chunk (`ContactBook-*.js`) mounted only when the contact section approaches
   the viewport; a static no-JS form (native `POST /api/public/lead`) is the
   SSR + Suspense fallback.
3. **Homepage-only motion split** — `parallax`/`journey`/`hero` moved to
   `home-motion.ts` so other routes don't load it.

**Honest note on the <30 KB target:** the remaining 67 KB shared chunk is
dominated by the React runtime — `react-dom` alone is ~48–55 KB gz
(`react-dom-client.production.js` = 95 KB gz untree-shaken; `react` 4.4 KB;
`scheduler` 2.5 KB) plus ~12 KB shared chrome. **Full React hydration cannot
fit under 30 KB gz.** The only paths to the target are (a) `preact/compat`
(drop-in, ~10 KB runtime → homepage ≈ 22 KB gz), or (b) no runtime React on
content pages (build-time SSR only + vanilla islands). Per the spec's own
guardrails ("do not introduce unnecessary complexity merely to satisfy a bundle
number"; "do not add libraries simply because they are popular"), neither was
applied unilaterally — flagging both as an explicit decision point before
Milestone 3.

## CODE SPLITTING

- **Routes**: `entry-home.tsx` / `entry-story.tsx` → separate Vite entries →
  separate chunks (`index-*.js`, `story-*.js`).
- **Interaction**: `React.lazy` booking calendar (IntersectionObserver-gated).
- **Shared**: `app-*.js` = react + react-dom + cross-route chrome (Layout,
  Nav, Footer, PageClose, SocialIcon, nav-origin, reveal/progress/active-nav).

## MOBILE

No horizontal overflow at **320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 /
1920 / 2560 / 3840** (all 0 px). 390px full-page diff vs production: **0**.
The production stylesheet already defines the intentional mobile Evolution
composition (compass relocates to `bottom: 18px` ≤700px, stage geometry adjusts
per breakpoint) — preserved verbatim, not "scaled desktop".

## ACCESSIBILITY

Preserved: single `h1`, labelled sections, `aria-hidden` decorative layers
(atmo/reel/grain/blueprint/hinge/shadow), compass is a `<nav aria-label>` with
`aria-expanded`/`aria-controls` and Escape-to-close + focus return, `role=status`
`aria-live` form note, visible focus ring, `prefers-reduced-motion` and
`prefers-reduced-transparency`/`prefers-contrast` CSS paths, skip link, focus
trap in mobile menu. Evolution content is in DOM + crawlable (scroll is
enhancement, not content).

## SEO

Story head (prerendered): title, meta description, keywords, robots,
theme-color, canonical (`/story.html`), Open Graph, Twitter card, `AboutPage`
JSON-LD, font preload, favicon. All present in the static output.

## BACKEND

**Unchanged.** No files under `avos-php/` or `avos-data/` modified. PHP 8.4 +
MariaDB + CMS + admin + auth + email + AI + calendar/booking remain intact.
Story is a static React/Vite page; no dynamic data on this route.

## CLEANUP

Nothing removed yet — the legacy `abhijeetvarghese/story.html` and its
`main.js`/`styles.css` remain the production path (removal is Milestone 3,
after full-site migration passes). No obsolete-file removal is claimed.

## REGRESSION

Story: **0-pixel** across all captures. Homepage: hero **0**, contact differs
only by the spec-mandated form-field change (added Mobile number, removed
Organization — documented since M1). Backend: no changes.

## SCORE

- **Visual fidelity** — 10/10 (0 RMSE everywhere)
- **Architecture** — 9/10 (MPA + SSG + route/interaction splitting; runtime
  bundle is the one open item, see BUNDLE note)
- **Performance** — 9/10 (Evolution equivalent-or-better; bundle splitting
  delivered; react-dom floor blocks the <30 KB aspiration)
- **UX** — 10/10 (behaviour 1:1, verified functionally)
- **Accessibility** — 9/10 (all existing affordances preserved)
- **Maintainability** — 9/10 (typed content, single coordinated frame loop,
  clear route registry)

## PRODUCTION

**NOT DEPLOYED.** Staging/preview only.

> Per instruction, Milestone 3 (portfolio + case studies, then contact page,
> articles, legal/utility pages, then legacy removal + full regression) has
> **not** been started.
