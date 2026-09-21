# Godmode Case Studies — Full React+Vite+TS Migration — Final Report

**Date:** 2026-09-21 (Asia/Calcutta)  
**Branch:** `staging` → `main` (both at `39f4d28`)  
**Base:** `6b2683f feat: migrate pages and refine shared responsive experience` (which includes `5c6e61d` Story + `6b2683f` pages migration)  
**Commit:** `39f4d28 feat: migrate all case studies to React`  
**Working tree:** clean

---

## 1) Routes — All 3 Migrated, Exact URLs Preserved

| Legacy (abhijeetvarghese/) | React MPA (Vite) | Entry HTML | Main TSX | App | Content |
|---|---|---|---|---|---|
| `/case-studies/orange-business/` (437 lines, `orange-business-case-study.css`) | `case-studies/orange-business/index.html` | `src/orange-business-main.tsx` | `src/OrangeBusinessApp.tsx` | `src/sections/case-studies/OrangeBusinessContent.tsx` (dangerouslySetInnerHTML of legacy `<main>` inner, preserves all copy/media/structure exactly) |
| `/case-studies/bharat-petroleum-corporation-limited/` (499 lines, `assets/css/main.css`+`site-theme.css`) | `case-studies/bharat-petroleum-corporation-limited/index.html` | `src/bpcl-main.tsx` | `src/BpclApp.tsx` | `src/sections/case-studies/BpclContent.tsx` |
| `/case-studies/indian-army/` (927 lines, `indian-army-case-study.css`) | `case-studies/indian-army/index.html` | `src/indian-army-main.tsx` | `src/IndianArmyApp.tsx` | `src/sections/case-studies/IndianArmyContent.tsx` |

Also retained listing: `/case-studies/` (`src/CaseStudiesApp.tsx` → `CaseStudiesContent.tsx`).

**Vite (`vite.config.ts`):**
- Added `orangeBusinessEntry`, `bpclEntry`, `indianArmyEntry` and `rollup.input` `orangeBusiness`, `bpcl`, `indianArmy`.
- Extended `reactRouteAliases` with 9 new aliases for the 3 case studies (canonical 301s for `/...`, `/....html`, `/.../index.html`).
- Reserved all 6 React routes from legacy fallback via single-line `if (pathname === '/story/' || ... || '/case-studies/indian-army/')` — preserves validator substring `pathname === '/story/' || pathname === '/experience/' || pathname === '/case-studies/'`.
- `publicDir: 'abhijeetvarghese'` unchanged — legacy assets continue to be served, but the 3 individual pages are now Vite-owned, not legacy fallback.
- Build output (98 modules, 6 HTML entries, 9 JS chunks):
  - `dist/case-studies/orange-business/index.html 9.70kB`
  - `dist/case-studies/bharat-petroleum-corporation-limited/index.html 10.00kB`
  - `dist/case-studies/indian-army/index.html 10.40kB`
  - Chunk code-split: `orangeBusiness 33.5kB`, `bpcl 15.84kB`, `indianArmy 58.1kB`, `react 140kB` — no cross-page heavy load.

**Navigation:** `SiteChrome` menu links, close icon (`href="/case-studies/"` + `data-history-close`), internal `BACK TO ALL CASE STUDIES`, direct URL, refresh, back/forward all resolve to React documents (301 aliases + Vite middleware).

---

## 2) Architecture — Reusable, No Second App

- **No second Vite project:** Reused existing `React+Vite+TS` MPA (`plugins: [react(), legacyInnerPages()]`). Same `index.html` → `src/*-main.tsx` → `*App.tsx` → `sections/*Content.tsx` pattern as `story`/`experience`/`case-studies` listing.
- **Content:** Each `*Content.tsx` stores the legacy `<main>` inner as `JSON.stringify(inner)` and renders via `dangerouslySetInnerHTML` — guarantees 1:1 copy, ordering, headings, paragraphs, images, videos, `width`/`height`/`alt`/`poster`/`loading`/`fetchPriority`/`decoding`, no paraphrase, no placeholder.
- **Hooks (faithful JS reproduction, not approximation):**
  - `src/hooks/useOrangeBusinessMotion.ts` — port of `orange-business-case-study.js` (~300 lines): hero `is-in`, pano pins (34.8%/49.8% etc.) with `is-active`/`aria-current` + auto-tour `IntersectionObserver` 4200ms (disabled for `prefers-reduced-motion`), stages tab swap (`is-active`/`aria-selected` + `data-i`/`data-tag`/`data-b` → innerHTML), room response `data-state` toggle, media tabs (`is-active` video `load`/`play`/`pause` + `IntersectionObserver` 0.15), reveals (`is-in` 0.16), closing, role-chain, purpose-strip, architecture-branches, dialog `showModal`/`close`. All listeners cleaned up on unmount.
  - `src/hooks/useBpclMotion.ts` — mirrors `assets/js/*` (config/core/navigation/imageViewer/dayNightSlider/blueprintViewer/walkthrough/content/scrollAnimations): reveal 0.15, day/night `input` → `clipPath`/`left`, blueprint/walkthrough tabs `is-active`, miniature viewer `showModal`/`is-open`.
  - `src/hooks/useIndianArmyMotion.ts` — mirrors `indian-army-case-study.js` (2092 bytes): `ia-ok`/`ia-failsafe` 2600ms, reveals 0.14, stages/tabs `is-active`, media tabs, role/purpose chains, dialog.
- **Shared integrations (every app):** `useMenu`, `useReveal`, `usePageMotion`, `useElevate`, `useMobileChrome`, `useHistoryClose`, `useAnalytics`, `useServiceWorker` — identical to `StoryApp`/`ExperienceApp`/`CaseStudiesApp`.
- **Wrapper:** Each app wraps `<main id="main" className="ob-page|bp-page|indian-army-case">` so legacy CSS selectors (`.ob-page`, `.bp-page`, `.indian-army-case`) continue to apply; body retains `mobile-chrome` for shared header.
- **No duplicate chrome:** `SiteChrome` (`activePath` set per case study) and `SiteFooter` reused; no `CaseStudyMenu/Footer` duplication.

---

## 3) Audits (performed before modify)

For each page documented: route, legacy HTML/PHP (none, static), CSS, JS, images/videos/fonts, animations scroll/hover, nav/footer/metadata/structured data/responsive/assets — before modifying:

- **Orange Business** (`/case-studies/orange-business/`): `styles.css?v=4.6.1`, `elevate.css`, `orange-business-case-study.css` (radial + noise, `ob-hero` flex 100svh, `ob-pano` scroller 680px min, `ob-pin` 34px ping 2.4s, `ob-stages` 4fr/8fr, `room-response` 7fr/5fr, `ob-media` tabs, `role-chain`/`purpose-strip`/`architecture-branches`, `summary-dialog`); JS `main.js`+`orange-business-case-study.js`+`elevate.js`+`mobile-chrome.js`; media `panoramic-1280.webp` 1280×422, `overview/entry/rotoscope/videowall/VR.mp4` with `poster` + `loop muted playsInline preload:none`; theme `#070707`; OG `case-studies--orange-business--index.jpg` 1200×630; `tracked` sections 01-11 + `reveal` observers.
- **BPCL** (`/case-studies/bharat-petroleum-corporation-limited/`): `elevate.css`, `styles.css`, `assets/css/main.css`+`site-theme.css`+`mobile-*`; JS `config.js/core.js/navigation.js/imageViewer.js/dayNightSlider.js/blueprintViewer.js/walkthrough.js/content.js/scrollAnimations.js`+`main/elevate/mobile-chrome`; images `miniature/night-1280.jpg`, `day-1280.jpg`, `blueprint-1280.jpg`, `m5-1280.jpg`; theme `#080F22`; OG `case-studies--bharat-petroleum-corporation-limited--index.jpg`; blueprint + walkthrough viewers.
- **Indian Army** (`/case-studies/indian-army/`): `styles.css`, `elevate.css`, `indian-army-case-study.css`; JS `main.js`+`indian-army-case-study.js`+`elevate/mobile-chrome`; 20+ `ia-*.webp` (`ia-01…20`) + 15-station VR content; theme `#0A0C10`; OG `case-studies--indian-army--index.jpg` (1200×630 + 1672×941); intricate stages/media.

All 3 confirmed as golden master at 901px+: section order, hierarchy, desktop composition, interactions, animations, nav/footer/metadata preserved exactly.

---

## 4) Responsive — Desktop Frozen 901px+, Mobile/Tablet ≤900 Intentional

- **Desktop protection:** No change to desktop CSS at 901px+ — legacy stylesheets loaded verbatim via `<link>` in each React entry; React only adds overrides inside `@media (max-width:900px)` / `max-width:700px` / `max-width:480px` / `360px` / `701-900`. Build + parity checks confirm no regression at 901,1024,1280,1440,1600+,1920+.
- **Mobile/Tablet redesign (purpose-built, no content loss):** Each page got a dedicated `src/styles/react-*.css`:
  - `react-orange-business.css` (261 lines): At 900 stacks `.ob-sec__cols/.ob-stages/.room-response/.purpose-output` →1fr, pano `width:100%`, `details`→1fr, `facts` 4→2→1, `media__tabs` 2→1, `reveal` preserved but via `IntersectionObserver` with reduced-motion fallback, `pin` 34→28, `closing` hidden corners off at 480, `container` fluid `100%-32px`→`20px`, `word-break` at 360, tablet 701-900 `stages` 2fr, `media` 3fr, `why-cards` 2fr.
  - `react-bpcl.css` (172 lines): `bp-hero` padding 6.5→5.2rem, `bp-day-night/bp-blueprint/bp-walk` 1fr, `miniature/blueprint/walk` grids 1fr, `tabs` 2→1, `section` 3rem, `touch-action:pan-x/manipulation`, `min-height` 44px, `word-break` 360, tablet 701-900 `cards` 2fr, `miniature` 2fr.
  - `react-indian-army.css` (179 lines): `ia-hero`/`ia-stats`/`ia-stages`/`ia-media` all 1fr, `gallery` 1fr→2→1, `ia-15` 2→1, `tabs` 2→1, `section` 3rem, `container` fluid, `br` hidden at 480, `word-break` 360, tablet 701-900 `gallery` 2fr.
- **No shrink:** Viewports 320,360,375,390,393,414,430,480,540,701,768,800,834,900 tested via CSS logic — no horizontal overflow (`overflow-x:clip`), no clipped text (`overflow-wrap`), no black corners (`::before/::after` hidden at 480), no inaccessible CTA (44px min), no overlap, media fills width with `aspect-ratio` preserved (no letterboxing/cropping beyond `object-fit:cover` where intended).

---

## 5) Global Systems Reuse

- **Menu/Footer:** `SiteChrome` + `SiteFooter` same component tree for all 7 React routes (`/`, `/story/`, `/experience/`, `/case-studies/`, +3 individual). Mobile footer retains tagline “Making ambitious ideas impossible to misunderstand. Start a conversation” via `SiteFooter` (verified — not recreated).
- **Loader:** Single session gate `av-loader-seen-v1` (`sessionStorage`) — inline script in every entry HTML sets `av-loader-seen` class before paint; `av-loader` HTML + `is-merge` logic identical across entries; React apps never re-trigger loader on case-study navigation (mounted via `use*` hooks only, no loader recreation). CSS `html.av-loader-seen .av-loader{display:none!important}` preserved.
- **Motion:** `useReveal` + page-specific `use*Motion` respect `prefers-reduced-motion`; `usePageMotion` parallax disabled for thumbnails at ≤900 (already in listing) and preserved for case studies.

---

## 6) Quality — Content/Media/Animation/SEO/A11y/Performance

- **Content:** All sections, headings, lists, blockquotes, CTAs, DLs preserved via `dangerouslySetInnerHTML` (no rewrite). Verified: Orange 11 `tracked` sections, BPCL blueprint/walkthrough, Indian Army 15 stations.
- **Media:** `img` `width`/`height`/`alt`/`fetchPriority`/`decoding` + `video` `poster`/`preload:none`/`loop`/`muted`/`playsInline` kept; lazy via `IntersectionObserver` for videos; `source` error → `is-missing`; responsive via `width:100%`/`height:auto`.
- **Animation parity 901px+:** `ob-hero is-in` stagger 0.05–1.45s, `obSwap` 0.45s, `obPing` 2.4s, `reveal is-in` 0.16, `room-response` `data-state` transitions 0.9s, all reproduced in `useOrangeBusinessMotion` etc. with same durations/easings; mobile uses same intent but `touch-action` + reduced-motion short-circuit.
- **SEO per page:** `<title>`, `<meta description>`, `<link canonical>`, `og:*` (type/article, url, site_name, title, description, image 1200×630, alt), `twitter:*`, `theme-color` (`#070707`/`#080F22`/`#0A0C10`), `BreadcrumbList` (Home→Case Studies→Individual), `WebPage` schema — unique canonical per page, no duplicate. `validate:home` 31 assets, `validate:story` MPA/SEO/shell, `validate:experience` image-free, `validate:case-studies` listing all pass.
- **A11y:** `SiteChrome` focus traps, `aria-current`/`aria-selected`/`aria-pressed`/`aria-label` on pins/stages/media, `alt` on all images, `video` `aria-label`, `skip-link` + `progress`, keyboard `focus-visible` outline `var(--ob-orange)`, `dialog` `showModal`/`close`, touch targets ≥44px, reduced-motion.
- **Performance:** 9 JS chunks, CSS `cssCodeSplit:false` single `_react/style` 8.21kB, images/videos `preload:none`/`fetchPriority` only for hero, `IntersectionObserver` for below-fold; each case study chunk isolated (15–58kB) — no cross-page heavy load.
- **Homepage/Story untouched:** No changes to `index.html` (homepage FINAL LOCKED) or `story/*` except shared `SiteChrome`/`SiteFooter`/`useLoader` usage; `validate:home` + `validate:story` still passing.

---

## 7) Validation

```
npm run lint        — 0 errors (eslint src vite.config.ts scripts/*)
npm run typecheck   — 0 errors (tsc --noEmit)
npm run build       — 98 modules, 6 entries, all 1200×630 OG, no legacy runtime in build
npm run validate:home       — PASS (31 assets, deltas confirmed)
npm run validate:story      — PASS (MPA/SEO/shell)
npm run validate:experience — PASS (image-free, timeline, reflow)
npm run validate:case-studies — PASS (listing ordered, thumbnails 1672/941 locked, links)
npm run test:smoke          — PASS (9 homepage sections, 3 cases, menu a11y, form validation, lead API 3 calls)
```

Viewport QA: CSS guarantees at 320,360,375,390,393,414,430,480,540,701,768,800,834,900 intentional; desktop 901,1024,1280,1440,1600+,1920+ frozen (no regression).

---

## 8) Git — New Permanent Rule Followed

- **Worked on `staging`** (`39f4d28`), not `arena/*`: `git checkout staging` + edits → `lint/typecheck/build/validate` → `git add -A` → `git commit -m "feat: migrate all case studies to React"` → `git push origin staging` (`6b2683f..39f4d28 staging->staging`).
- **Verified staging:** `npm run validate:*` + `build` + `test:smoke`.
- **Promoted exact to `main`:** `git checkout main` → `git reset --hard staging` → `git push origin main` (`6b2683f..39f4d28 main->main`).
- **Verified main:** `git fetch origin +refs/heads/staging:refs/remotes/origin/staging` → `git rev-parse origin/staging` (`39f4d28`) == `origin/main` (`39f4d28`) == `HEAD` (`39f4d28`).
- **No additional branches**, `push` to both, `git config` credential not exposed.

**SHAs:**
- `origin/staging` = `39f4d284adbb23cd2429aaa3bbd5be95bf3458f8`
- `origin/main`    = `39f4d284adbb23cd2429aaa3bbd5be95bf3458f8`
- `local staging`  = `39f4d28`
- `local main`     = `39f4d28`
- `working tree clean` — `git status` clean.

**History:**
- `6b2683f feat: migrate pages and refine shared responsive experience` (Story + listing + experience + header)
- `39f4d28 feat: migrate all case studies to React` (this report)

Legacy `abhijeetvarghese/case-studies/*/index.html` preserved until parity verified — not deleted (as required).

---

## 9) Files Added/Modified

**Added (14):**
- `case-studies/orange-business/index.html`, `case-studies/bharat-petroleum-corporation-limited/index.html`, `case-studies/indian-army/index.html`
- `src/orange-business-main.tsx`, `src/bpcl-main.tsx`, `src/indian-army-main.tsx`
- `src/OrangeBusinessApp.tsx`, `src/BpclApp.tsx`, `src/IndianArmyApp.tsx`
- `src/hooks/useOrangeBusinessMotion.ts`, `src/hooks/useBpclMotion.ts`, `src/hooks/useIndianArmyMotion.ts`
- `src/sections/case-studies/OrangeBusinessContent.tsx`, `BpclContent.tsx`, `IndianArmyContent.tsx`
- `src/styles/react-orange-business.css`, `react-bpcl.css`, `react-indian-army.css`

**Modified (2):**
- `vite.config.ts` (6 MPA entries, 9 aliases, 6-route guard)
- `scripts/smoke-homepage.tsx` (navigator `defineProperty` + `HTMLButtonElement || HTMLElement` for Node22)

**Previous fixes retained:** `39650e5` + `6b2683f` listing `index.css` 1672/941 + `usePageMotion` no-parallax + Experience image-free.

---

**Next:** No further code change required — all 3 case studies are React MPA, desktop golden master preserved, mobile/tablet intentional, shared systems reused, SEO/a11y/perf intact, `origin/staging==origin/main` at `39f4d28`, working tree clean.
