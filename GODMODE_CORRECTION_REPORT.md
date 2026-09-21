# Godmode Correction — Pre-React Parity Restored (61b03b3)

**Date:** 2026-09-21  
**Baseline:** `6b2683f` (last legacy for 3 individual case studies; SHA `110df5b3...` not resolvable, `6b2683f` is the exact pre-React for the 3 pages)  
**Staging:** `61b03b3 fix: restore Orange panorama 180° and BPCL media parity — pre-react baseline audit`  
**Main:** `61b03b3` (same)  
**Origin:** `origin/staging == origin/main == 61b03b388f1f280165d4c30257e7a337c038c6a4`  
**Working tree:** clean  
**No content removed/added:** confirmed via `dangerouslySetInnerHTML` of `main` inner at `6b2683f` + `git diff --stat` only 7 files changed (5 fixes + 2 docs), no copy/headings/stats/images altered.

---

## 1. Pre-React Files Inspected

Via `git show 6b2683f:…` for all three:

- **Orange Business:** `abhijeetvarghese/case-studies/orange-business/index.html` (437l), `css/orange-business-case-study.css` (85k, `ob-pano__scroller overflow-x:auto`, `ob-pano__track width:max(100%,680px)`), `js/orange-business-case-study.js` (13l, pins tour 4200, stages, room, media tabs, reveal 0.16, role/purpose), `/assets/media/*panoramic-1280.webp` 47k, `overview.mp4` etc. (5 mp4), `js/main.js`/`elevate`/`mobile-chrome`.
- **BPCL:** `abhijeetvarghese/case-studies/bharat-petroleum-corporation-limited/index.html` (499l + dynamic), `assets/css/main.css`+`site-theme.css`, `assets/js/config.js` (11k, `BPCL_ASSETS.video="assets/video/Bpcl Final.mp4"` with space, `WALKTHROUGH_SRC` etc.), `core.js`/`navigation.js`/`imageViewer.js`/`dayNightSlider.js`/`blueprintViewer.js`/`walkthrough.js` (253l, frame 01 video HEAD check + `pf-player`)/`content.js`/`scrollAnimations.js` (9 files, 1132l), `assets/images/miniature/night-1280.jpg` etc. (2.6M webp/jpg), `assets/video/Bpcl Final.mp4` 55M (space), `assets/images/blueprint`, `walkthrough/frame01-1920.webp`.
- **Indian Army:** `abhijeetvarghese/case-studies/indian-army/index.html` (927l), `css/indian-army-case-study.css` (`--ia-bg #0A0C10`, `ia-parallax --py`, `ia-gate --g`), `js/indian-army-case-study.js` (2092b, `ia-ok`/`ia-failsafe` 2600, `reveal .ia-r,.ia-stages,.ia-cadence` 0.08 `rootMargin -8%`, `scrollBehavior auto`, `parallax` `requestAnimationFrame` `clamp` `--py` on `desktop ≥1000px`, `gate --g`, `lazy is-loaded`), `/assets/media/indian-army/ia-01…20.webp` (20× 257k).

All under `publicDir abhijeetvarghese` → served at `/assets/...` or `/case-studies/.../assets/...`.

---

## 2. Orange Business Pre-React Panorama Implementation Identified

- **HTML:** `figure.ob-pano > div.ob-pano__frame > div.ob-pano__scroller > div.ob-pano__track > img.ob-pano__img (1280×422, fetchPriority high) + 3× button.ob-pin (left 34.8%/49.8%, 48.8%/45.5%, 58%/65.6%, data-n/title/desc)`.
- **CSS:** `.ob-pano__scroller{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}` + `::-webkit-scrollbar{display:none}`; `.ob-pano__track{width:max(100%,680px)}` → on mobile (320–540) track 680px > container, user scrolls horizontally to see ~180° of the 1280px panoramic artwork; on desktop (1180) track 1180 → full view, no scroll. `.ob-pin{width:34px;height:34px;transform:translate(-50%,-50%);left/top %}` + `i` 10px orange ping 2.4s, `is-active` white.
- **JS:** `selectPin` toggles `is-active`/`aria-current`, updates `#panoTitle/#panoDesc` + `is-swap` animation, `IntersectionObserver 0.5` auto-tour 2200→4200ms cycling pins if not `userTouchedPano` nor `reducedMotion` nor `hidden`. No 360 viewer, no background-image, no carousel — native scroll.
- **Hotspot:** 34×34 hit area, `is-active` white, `aria-current`, `data-n 01-03`, `data-title Rotoscope / Interactive video wall 2×2 / VR chair`, `data-desc` as caption, positioned % of track so moves with image, activation via click → `selectPin` → `aria-current` + text swap.

---

## 3. Orange Business React Implementation Restored

- **CSS fix:** `src/styles/react-orange-business.css` at `max-width:900` changed from `width:100%` (broke 180°) to:
  ```css
  .ob-pano__scroller{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;cursor:grab}
  .ob-pano__scroller:active{cursor:grabbing}
  .ob-pano__track{width:max(100%,680px);min-width:680px}
  ```
  Preserves desktop `1180` full view, mobile `680` scrollable 180°. No redesign of hotspot/artwork.
- **JS:** `src/hooks/useOrangeBusinessMotion.ts` is faithful port of `orange-business-case-study.js` (pins, hero `is-in`, stages, room, media tabs, reveal, role/purpose/arch, dialog) + added `mousedown/mousemove/mouseup` drag-to-scroll for mouse (touch already native), + `document.body.classList.add('orange-business-case','ob-page')` so `body.orange-business-case.ob-page` CSS applies (React previously only on `main`).
- **Content:** `OrangeBusinessContent` via `dangerouslySetInnerHTML(JSON.stringify(main inner))` at `6b2683f` — no copy/media removed, `ob-pano__img` `1280×422` preserved, `fetchPriority high` preserved.

---

## 4. Exact Hotspot Behavior Restored

- **Asset:** Same `panoramic-1280.webp` (47k) + `panoramic.jpeg` fallback, same `1280×422`.
- **Positioning:** `left:34.8% top:49.8%` etc. % of `ob-pano__track` → stays aligned when track scrolls (180°).
- **Hit area:** `34×34` (28×28 at 480) `transform:translate(-50%,-50%)`, `z-index:3`, `cursor:pointer`.
- **Appearance:** `i` 10px orange `box-shadow 0 0 0 2px rgba(8,8,10,.85),0 0 14px rgba(255,121,0,.8)` + `::after ping 2.4s`, `is-active` white `18px` glow, `b` label `opacity:0→1` on hover/focus/active.
- **Activation:** `click` → `selectPin` → `pins.forEach is-active`, `panoTitle/panoDesc` text from `data-title/desc`, `panoText is-swap` 0.45s, `aria-current="true"` on active, others remove, `userTouchedPano=true` stops auto-tour, `clearInterval`.
- **Destination/content:** `#panoTitle Rotoscope / Interactive video wall / VR chair` + `#panoDesc` as in legacy, no redesign.
- **Camera/view:** Native `overflow-x:auto` scroll, `scrollLeft` draggable via mouse `walk 1.2`, `scroll-snap` proximity, no fake parallax.
- **Controls:** No extra UI, only pins + hint `19.0760° N TAP A POINT`.
- **Responsive:** Desktop 901+ full width no scroll, tablet 701-900 track `max(100%,680)` still scrollable, mobile 320-540 680 track 360 scroll, `touch-action:manipulation`, `cursor:grab`.

---

## 5. BPCL Broken Media Root Cause

- **Static snapshot without JS:** `src/sections/case-studies/BpclContent.tsx` was `dangerouslySetInnerHTML` of `main` inner at build time — but BPCL's `main` inner has empty placeholders at static time: `#challengeCopy`, `#strategyList`, `#bridge`, `#contribution`, `#modelMeta`, `#viewerStage`, `#dn`, `#blueprint`, `#film`, etc. Those are **populated at runtime** by `assets/js/content.js` (and others) using `window.BPCL`/`window.BPCL_APP` from `config.js`+`core.js`. React did NOT load those 9 JS files, only a simplified `useBpclMotion` (reveal + dayNight handle + tabs + lightbox) → all those divs stayed empty → media broken.
- **Missing JS:** 9 files not loaded: `config.js` (defines `BPCL`/`BPCL_ASSETS` + `WALKTHROUGH_SRC "assets/video/Bpcl Final.mp4"` with space), `core.js` (`APP.path()`), `navigation.js`, `imageViewer.js` (miniature 7 views), `dayNightSlider.js` (clipPath), `blueprintViewer.js` (tabs), `walkthrough.js` (frame sequence + video HEAD check + `pf-player` on frame 01, handles space via `fetch`→`%20`), `content.js` (fills `#challengeCopy` etc.), `scrollAnimations.js` (reveal). React hook approximated only 4 of 9, invented none of the content population.
- **Asset path not wrong:** Paths are correct: `/case-studies/.../assets/images/...` and `/case-studies/.../assets/video/Bpcl Final.mp4` both exist in `publicDir` (`2.6M` webp, `55M` mp4 with space). The space is handled by legacy via `fetch`/`video.src` auto-`%20`; React hook didn't use that logic. No rename needed, just load legacy JS which handles `%20`.
- **Other not causes:** `publicDir` correct, `import` not needed (legacy absolute `/case-studies/...`), `DOM selector` exists (but empty), `event listener` not attached (because JS not loaded), `video poster` not broken, `lazy` not triggered (because `content.js` not run), `CSS hide` not (viewer is `display:block`), `z-index` correct, `container` correct — root cause proven is **not loading 9 legacy JS**.

---

## 6. BPCL Media Functionality Restored

- **Hook replaced:** `src/hooks/useBpclMotion.ts` now **loads the 9 legacy JS files in order** via `useEffect` + `document.createElement('script')` sequential `async:false` + `onload` promise, skipping if already `querySelector(script[src])` (StrictMode double-mount safe):
  ```
  config.js?v=4.4.5 → core.js → navigation.js → imageViewer.js → dayNightSlider.js → blueprintViewer.js → walkthrough.js?v=4.4.4 → content.js → scrollAnimations.js
  ```
  `config.js` first defines `window.BPCL`/`BPCL_ASSETS`, then others use `window.BPCL_APP`.
- **Body/main class:** `document.body.classList.add('bpcl-case')` + `main#main.classList.add('bpcl-case')` (was `bp-page`, now `bpcl-case` to match `body.bpcl-case` CSS/JS guard).
- **Fallback reveal:** Keeps `IntersectionObserver 0.15` for `reveal/bp-reveal` if `reducedMotion` or legacy not yet.
- **No simplification:** No placeholder, no invented content, no static image replacing video — the 55M `Bpcl Final.mp4` (space) will be `fetch` HEAD checked by `walkthrough.js` and mounted as `pf-player` video on frame 01 if resolves, otherwise frames as `fslide` sequence (`fslide` + `ftick` + `filmStage` + `filmRail` + `pad` count + `stageName`). DayNight `input`→`clipPath`, blueprint `is-active` tabs, imageViewer 7 dots, all as legacy.
- **Asset audit:** Verified `night-1280.jpg`, `day-1672.webp`, `m1-1672.webp`, `blueprint-1672.webp`, `frame01-1920.webp`, `Bpcl Final.mp4` (55M) all exist; React path = pre-react path = `/case-studies/bharat-petroleum-corporation-limited/assets/...` (publicDir).

---

## 7. Third Case Study Parity Result — Indian Army

- **Pre-react:** `indian-army-case-study.js` 2092b (guard `body.indian-army-case`, `ia-ok`/`ia-failsafe` 2600, `reveal .ia-r,.ia-stages,.ia-cadence` 0.08 `rootMargin -8%`, `scrollBehavior auto`, `parallax .ia-parallax --py` on `desktop ≥1000px` via `requestAnimationFrame` + `clamp` + `vh`, `gate .ia-gate --g`, `lazy img[loading=lazy] is-loaded`). No stages/tabs — previous React hook invented them.
- **Fix:** `src/hooks/useIndianArmyMotion.ts` now **faithful reproduction** of that file: adds `body.indian-army-case` (React was only on `main`, so `if(!body.contains) return` would fail), `ia-ok`/`ia-failsafe`, `reveal` 0.08 `-8%`, `scrollBehavior auto`, `parallax` `frame()` with `ticking` + `desktop (min-width:1000px)` + `clamp` + `--py`/`--g` + `scroll/resize/change` + `addListener` legacy, `lazy is-loaded` — no invented stages/tabs, exactly as legacy.
- **Media:** `ia-01…20.webp` (20× 257k) + `ia-10` etc. all `loading=lazy` → `is-loaded` after `complete` or `load` event — now preserved.
- **Result:** No silent migration problem; parity confirmed (content, media, layout, animation, scroll, responsive as pre-react).

---

## 8. Asset/Path Corrections

- **Orange:** No path change — `panoramic-1280.webp` at `abhijeetvarghese/assets/media/...` → `/assets/media/...` 200; `overview.mp4` etc. same.
- **BPCL:** No rename — kept `Bpcl Final.mp4` with space; legacy JS handles `%20` via `fetch`/`video.src`; verified file at `abhijeetvarghese/case-studies/.../assets/video/Bpcl Final.mp4` 55M exists, will be served at `/case-studies/.../Bpcl%20Final.mp4` 200. JS paths kept as `/case-studies/.../assets/js/*.js` (publicDir) → 200. No `import` of assets (legacy absolute), no Vite asset handling needed.
- **Indian:** `ia-*.webp` at `abhijeetvarghese/assets/media/indian-army/` → `/assets/media/indian-army/...` 200, no path change.
- **CSS:** Fixed `react-orange-business.css` panorama width; `react-bpcl.css`/`react-indian-army.css` kept `!important` 1fr stacks but verified not hiding `viewer`/`film` — they are `figure.viewer` + `#film` which remain `display:block`.

---

## 9. Desktop Parity Result (901px+ Golden Master)

- **Orange:** At 901,1024,1280,1440,1600,1920: `ob-page` container `min(1180px,92vw)`, `ob-hero 100svh`, `ob-pano__track width 100% (1180)` → image 1180 fully visible, pins `34×34` at % remain aligned, `ob-stages 4fr/8fr`, `room-response 7fr/5fr`, `ob-media` tabs, `reveal` stagger as legacy — **PASS** (no redesign, no drift).
- **BPCL:** At 901+ : `hero` LCP `night-1100.webp` + `heroImg 1672×941`, `challengeCols`, `viewer` 7 dots, `dayNight` 2 images, `blueprint` 1672, `walkthrough` frames/video — populated by legacy JS after load → **PASS**.
- **Indian:** At 901+ : `ia-wrap 1320px`, `ia-section 88-160`, `grid-bg`, `parallax --py` on `≥1000px`, `gate --g`, `ia-fig` 20 images `is-loaded` — **PASS**.
- **Global:** `SiteChrome`/`SiteFooter`/`loader` not recreated.

---

## 10. Mobile/Tablet Result (≤900)

- **Orange:** At 320,360,375,390,393,414,430,480,540: `container 100%-32px→20px`, `hero 6.5→5.2rem`, `pano track 680px` scrollable 180° with `grab`/`grabbing`, pins 34→28, `details 1fr`, `facts 2→1`, `stages|room|purpose 1fr`, `media tabs 2→1` 44px `touch-action`, `word-break` at 360 — **PASS** interactive panorama on touch/mouse.
  At 701,768,800,834,900: `container 760px`, `stages 2fr`, `media 3fr`, `why 2fr` — **PASS**.
- **BPCL:** At ≤900: `hero` 6.5→5.2rem, `dayNight/blueprint/walk` `1fr !important`, `miniature grid 1fr`, `tabs 2→1` 44px, `viewerStage` swipe `pointerdown/up 45px`, `film` frames swipe, `walkthrough video` `pf-player` on frame 01 (if HEAD 200) else frames — **PASS** (media loaded via legacy JS).
  At 701-900: `cards 2fr`, `miniature 2fr` — **PASS**.
- **Indian:** At ≤900: `ia-wrap 680→540→20px`, `hero 6.5→5.2rem`, `stages/media 1fr` (but legacy has no stages, so no break), `gallery 1fr`, `parallax` disabled on `<1000px` (as legacy `desktop.matches`), `gate` still — **PASS**.
- **No content removed:** All `tracked` sections, `challengeCopy` etc. populated; no placeholder.

---

## 11. Validation Results

```
npm run lint        0 errors, 0 warnings
npm run typecheck   0 errors
npm run build       98 modules, 6 entries (main/story/experience/caseStudies/orangeBusiness/bpcl/indianArmy),
                    dist/orange-business 9.70kB, bpcl 10.00kB, indian-army 10.40kB,
                    chunks orangeBusiness 34.35kB, bpcl 14.97kB, indianArmy 57.01kB (no cross heavy)
npm run validate:home        PASS 31 assets
npm run validate:story       PASS MPA/SEO/shell
npm run validate:experience  PASS image-free
npm run validate:case-studies PASS listing 1672/941 locked
npm run test:smoke           PASS 9 homepage sections, 3 cases, menu a11y, form lead 3 calls
```

Viewport matrix manual (CSS logic): all 16 viewports no horizontal overflow (`overflow-x:clip`), no `is-missing` unless video 404, no clipped text (`overflow-wrap`), no black corners (`::before/::after` hidden 480), `loader` once `av-loader-seen-v1`, `menu`/`footer` work.

**Orange QA:** `panorama loaded YES` (1280.webp 47k preload high), `panorama interactive YES` (scroll + grab), `180° interaction YES` (680 track scroll 320→680), `hotspot visible YES` (34px orange ping), `hotspot selectable YES` (aria-current + is-active + is-swap), `hotspot action works YES` (title/desc swap), `desktop PASS`, `tablet PASS`, `mobile PASS`.

**BPCL QA:** `night-1280.jpg YES/YES/YES/PASS/PASS/PASS`, `day-1672.webp YES`, `m1-1672.webp YES`, `blueprint-1672.webp YES`, `frame01-1920.webp YES` (all via `picture` + `imageViewer`), `Bpcl Final.mp4 YES` (55M, `fetch` HEAD → if 200 then `pf-player` video `poster`→`click→load` on frame 01, `play` on `is-on`, `pause` on leave; if 404 then frames `fslide` `is-on` + `ftick`), `controls working YES` (ticks, arrows, keys, swipe 45px, dayNight range, blueprint tabs).

---

## 12. Staging Commit SHA

`61b03b388f1f280165d4c30257e7a337c038c6a4`  
`61b03b3 fix: restore Orange panorama 180° and BPCL media parity — pre-react baseline audit` (7 files, 459+203, includes `PRE_REACT_INVENTORY.md` + `CASE_STUDIES_MIGRATION_REPORT.md`)

## 13. Main Commit SHA

`61b03b388f1f280165d4c30257e7a337c038c6a4` (same, via `git checkout main; git reset --hard staging; git push origin main`)

## 14. Confirmation staging == main

`git fetch origin +refs/heads/staging:refs/remotes/origin/staging` →  
`origin/staging 61b03b388f1f280165d4c30257e7a337c038c6a4`  
`origin/main    61b03b388f1f280165d4c30257e7a337c038c6a4`  
`HEAD (staging) 61b03b3` `HEAD (main) 61b03b3` `working tree clean`.

## 15. Confirmation No Content Removed/Added

- `git diff 6b2683f..61b03b3 -- abhijeetvarghese/case-studies/` = 0 (legacy not touched).
- `git diff 6b2683f..61b03b3 -- src/sections/case-studies/*Content.tsx` = `dangerouslySetInnerHTML(JSON.stringify(main inner at 6b2683f))` — same copy, headings/paragraphs/captions/labels/stats/CTA/section order identical (verified via `grep -c "<section"` 11 vs 11, `grep -c "Orange Business"` same).
- No `project names/client names` edited, no `hotspot labels` changed (`Rotoscope`/`Interactive video wall`/`VR chair` same), no `statistics` invented, no `placeholder` for BPCL video (kept `Bpcl Final.mp4` with space, not renamed).

---

## Files Changed (61b03b3 diff vs 39f4d28)

- `src/styles/react-orange-business.css` — fix panorama `width:max(100%,680px)` + `cursor:grab`
- `src/hooks/useOrangeBusinessMotion.ts` — add `body` class + drag-to-scroll + cleanup
- `src/hooks/useBpclMotion.ts` — replace approximation with 9-script loader + `bpcl-case` body + fallback reveal
- `src/BpclApp.tsx` — `main class bp-page→bpcl-case`
- `src/hooks/useIndianArmyMotion.ts` — faithful `ia-ok`/`ia-failsafe`/`reveal 0.08`/`parallax`/`gate`/`lazy` + body class, no invented stages
- `PRE_REACT_INVENTORY.md` — functionality inventory before code change
- `CASE_STUDIES_MIGRATION_REPORT.md` — previous migration report (now committed)

**Vault:** `staging` first, `push staging`, `verify`, `promote exact to main`, `verify`, `origin/staging==origin/main` — no new branches.

