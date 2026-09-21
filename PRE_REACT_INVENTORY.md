# Pre-React Functionality Inventory — Golden Master (6b2683f)

Baseline: `6b2683f` (legacy `abhijeetvarghese/case-studies/*/index.html` still untouched, before `39f4d28` React migration). The SHA `110df5b3...` was not resolvable in this repo; `6b2683f` is the last commit where the 3 individual case studies were 100% legacy (listing already React, but individual still legacy). Audited files at `6b2683f` via `git show`.

---

## Orange Business — `/case-studies/orange-business/`

**HTML:** `abhijeetvarghese/case-studies/orange-business/index.html` (437 lines)
- `body.orange-business-case ob-page mobile-chrome`
- `header.site-nav` + `mobileMenu` (SiteChrome)
- `main#main > article` with 11 `tracked` sections: `ob-hero` (01), `why` (02), `role` (03), `experience` (04), `system` (05), `room-response` (06), `action` (07), `purpose` (08), `delivery` (09), `outcome` (10), `ob-closing` (11)
- Hero: `ob-hero__eyebrow`, `ob-hero__title` split lines, `ob-hero__deck`, `figure.ob-pano` with `ob-pano__frame > ob-pano__scroller > ob-pano__track > img.ob-pano__img (1280×422, /assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp, fetchPriority high) + 3× `button.ob-pin` (`left:34.8%/49.8%`, `48.8%/45.5%`, `58%/65.6%`, `data-n/data-title/data-desc`), `figcaption.ob-pano__details` with `panoText/panoTitle/panoDesc` + `hint 19.0760° N`
- `ob-facts` (CLIENT/WHAT/WHERE/ROLE + 30 SEC READ)
- Why, Role (6× chain buttons Strategy→Site), Experience (7× stages Arrive→Converse with `ob-stages__list` + `ob-stages__panel`), System, Room Response (`.room-response` with `response-visitor/curtains/lights/mode` + toggle), Action (`.ob-media` with tabs `overview/entry/rotoscope/videowall/VR` + 5× `ob-media__frame` each `video.evidence-video` `poster` + `source mp4?v=4.4.2`), Purpose (6× `purpose-strip` buttons), Delivery, Outcome, Closing, `summary-dialog`

**CSS:** `/css/styles.css?v=4.6.1`, `/css/elevate.css`, `/css/orange-business-case-study.css?v=4.4.1` (85k, `:root --ob-*`, `.ob-pano__scroller overflow-x:auto scrollbar-width:none scroll-snap`, `.ob-pano__track width:max(100%,680px)`, `.ob-pin` 34px ping 2.4s, `.ob-hero is-in` stagger 0.05–1.45s, `.reveal is-in`, `room-response` 7fr/5fr etc.), `mobile-chrome.css`, `mobile-menu-panel.css`

**JS:** `/js/main.js`, `/js/orange-business-case-study.js?v=4.4.1` (13 lines minified, handles `hero is-in`, `pins` `selectPin` + tour `setInterval 4200` + `IntersectionObserver 0.5`, `stageBtns` `data-b`→innerHTML, `room` `data-state` toggle, `tabs/frames` `is-active` + video `load/play/pause` + `IntersectionObserver 0.15`, `reveal` 0.16 + `closing`, `role-chain`, `purpose-strip`, `architecture-branches`, `summary-dialog`), `/js/elevate.js`, `/js/mobile-chrome.js`

**Media:** `panoramic-1280.webp` (LCP, preload high), `panoramic.jpeg` fallback, 5× `mp4` (`overview/entry/rotoscope/videowall/VR.mp4` with poster), no gallery.

**Interactive:** Pins (3), stages (7), room toggle, media tabs (5 videos), purpose strip (6), role chain (6), architecture (if any), dialog, reveals, hero stagger.

**Current React (39f4d28):** `OrangeBusinessContent` via `dangerouslySetInnerHTML` of `main` inner (preserves HTML), `useOrangeBusinessMotion` is faithful port (covers all except panorama 180° broken by `react-orange-business.css` `.ob-pano__track{width:100%}` at 900 → no scroll). Fix: restore `width:max(100%,680px)` + `overflow-x:auto` + `cursor:grab`.

---

## BPCL — `/case-studies/bharat-petroleum-corporation-limited/`

**HTML:** `abhijeetvarghese/case-studies/bharat-petroleum-corporation-limited/index.html` (499 lines + dynamic)
- `body.bpcl-case mobile-chrome`
- `hero` with `picture source type webp` `night-720/1100/1672` + `img#heroImg night-1280.jpg 1672×941 high`
- `challenge` `cols#challengeCopy` empty (filled by `content.js`), `strategyList#strategyList` empty, `bridge#bridge`, `contribution#contribution`, `modelMeta#modelMeta`
- `miniature` `viewer#viewer` `viewerStage#viewerStage` `viewerTag/ViewerCount` `viewerPrev/Next/Dots/Inspect` + `dn#dn` `dnFrame#dnFrame` `dnNight/dnDay` + `dn__handle`
- `blueprint` `blueprintViewer` etc., `walkthrough` `frame01-1920.webp` + video `Bpcl Final.mp4` (55M, `assets/video/Bpcl Final.mp4` with space), `content.js` populates many sections.
- After `</main>`: 9× `script src="/case-studies/bharat-petroleum-corporation-limited/assets/js/config.js?v=4.4.5"` (no defer, defines `window.BPCL`/`BPCL_ASSETS`), then `core.js`, `navigation.js`, `imageViewer.js`, `dayNightSlider.js`, `blueprintViewer.js`, `walkthrough.js?v=4.4.4`, `content.js`, `scrollAnimations.js` (all `defer`), plus `main.js`, `elevate.js`, `mobile-chrome.js`

**CSS:** `/css/elevate.css`, `/css/styles.css`, `/case-studies/bharat-petroleum-corporation-limited/assets/css/main.css?v=4.4.4` (114 lines), `site-theme.css`, `mobile-*`

**JS:** 9 files (total 1132 lines): `config.js` (registry of all filenames, coordinates 0-100%, `BPCL_ASSETS.video="assets/video/Bpcl Final.mp4"`, `ORIGIN`, `WALKTHROUGH_SRC`, `WALKTHROUGH_VIDEO true`, `WALKTHROUGH_META 4:40`), `core.js` (100 lines, `APP.path()`), `navigation.js` (107), `imageViewer.js` (185), `dayNightSlider.js` (48), `blueprintViewer.js` (114), `walkthrough.js` (253, handles `video` with space → `%20`), `content.js` (103, populates `#challengeCopy` etc.), `scrollAnimations.js` (42)

**Media:** `miniature/night-720/1100/1672.webp` + `night-1280.jpg`, `day-720/1100/1672.webp` + `day-1280.jpg`, `m1-4` etc., `blueprint-1672.webp` etc., `walkthrough/frame01-1920.webp` etc., `video/Bpcl Final.mp4` (H264 1920×1080 4:40, space in name, 55M), `og` etc. All under `/case-studies/bharat-petroleum-corporation-limited/assets/...` (publicDir `abhijeetvarghese` → served at `/case-studies/...`).

**Interactive:** Hero, challenge/strategy (populated), miniature viewer (7 views, prev/next/dots/inspect, lightbox), day/night slider (range input → clipPath), blueprint viewer (tabs), walkthrough (tabs + video player with `video.play` + poster, or frames if video missing), scroll reveals, navigation.

**Current React (39f4d28):** `BpclContent` is static snapshot of `main` inner at build time → empty `#challengeCopy` etc. remain empty (no `content.js` to populate). `useBpclMotion` is simplified approximation (handles reveal, dayNight handle via `input`, blueprint/walkthrough tabs via `is-active`, viewer lightbox) but does NOT load the 9 legacy JS, does not populate content, does not handle video `Bpcl%20Final.mp4` correctly, does not handle 55M video lazy, does not handle `APP.path()`. Result: media broken, sections empty, interactions partial.

**Root cause:** React did not load the 9 legacy JS files; static snapshot without JS population = broken media.

---

## Indian Army — `/case-studies/indian-army/`

**HTML:** `abhijeetvarghese/case-studies/indian-army/index.html` (927 lines)
- `body.indian-army-case mobile-chrome`
- 20+ sections: `ia-hero`, `ia-stats`, `ia-stages` (15 stations), `ia-media` etc., with `ia-r`, `ia-stages`, `ia-cadence` reveals, `ia-parallax`, `ia-gate`, many `ia-fig__frame img loading=lazy`, `ia-fig` gallery.
- CSS: `/css/styles.css`, `/css/elevate.css`, `/css/indian-army-case-study.css` (1320px container, `--ia-bg #0A0C10`, grid bg, `ia-parallax --py`, `ia-gate --g`)
- JS: `/js/main.js`, `/js/indian-army-case-study.js?v=4.4.1` (2092 bytes, handles `ia-ok`/`ia-failsafe` 2600, `reveal` 0.08 with `rootMargin -8%`, parallax `--py` via `requestAnimationFrame` scroll, `gate --g`, `img loading=lazy is-loaded`), `elevate`, `mobile-chrome`

**Media:** `/assets/media/indian-army/ia-01…20.webp` (20 images) + `og` etc.

**Interactive:** Reveals, parallax (desktop ≥1000px), gate, lazy images, stages/tabs.

**Current React (39f4d28):** `IndianArmyContent` via `dangerouslySetInnerHTML`, `useIndianArmyMotion` is approximation (handles reveals, stages/tabs, but parallax logic is simplified, not via `requestAnimationFrame` with `clamp` etc.). The legacy JS expects `body.indian-army-case` on body, but React puts `indian-army-case` on `<main>` — `if(!body.classList.contains("indian-army-case"))return` would fail if only on main. Current hook bypasses that check, but legacy JS would not run if loaded. Need to ensure body class or hook handles.

---

## Asset Path Audit

| Case | Pre-react path | React path | File exists (publicDir) | Browser (expected) | React usage |
|---|---|---|---|---|---|
| Orange pano | `/assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp` | same | `abhijeetvarghese/assets/media/...1280.webp` exists | 200 | `img src` in `OrangeBusinessContent` |
| Orange video | `/assets/media/overview.mp4?v=4.4.2` etc. (5) | same | `abhijeetvarghese/assets/media/*.mp4` exists | 200 | `source src` in content + `useOrangeBusinessMotion` handles `load/play` |
| BPCL night | `/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1280.jpg` | same | `abhijeetvarghese/case-studies/.../night-1280.jpg` exists (75k, 140k) | 200 | `img#heroImg` in `BpclContent` + `picture source` |
| BPCL day | `.../day-1672.webp` | same | exists | 200 | `dnDay` etc. but `useBpclMotion` simplified |
| BPCL video | `assets/video/Bpcl Final.mp4` (relative in config.js) → `/case-studies/bharat-petroleum-corporation-limited/assets/video/Bpcl Final.mp4` | same | `abhijeetvarghese/.../Bpcl Final.mp4` 55M exists (space) | 200 if encoded as `%20` | `config.js WALKTHROUGH_SRC` → `fetch`/`video.src` should encode, but React hook does not handle |
| BPCL JS | `/case-studies/.../assets/js/config.js` etc. (9) | same | exists | 200 | NOT loaded in React (only `useBpclMotion` approximation) → broken |
| Indian 01 | `/assets/media/indian-army/ia-01.webp` etc. (20) | same | `abhijeetvarghese/assets/media/indian-army/ia-0*.webp` exists | 200 | `img` in `IndianArmyContent` + `useIndianArmyMotion` handles `is-loaded` |

**Key mismatches:**
- BPCL JS not loaded → content not populated, video not mounted, interactions broken.
- BPCL video space → needs `%20` handling (legacy does via `fetch`/`video.src` auto-encode; React hook does not).
- Indian Army body class → legacy JS checks `body.indian-army-case`, React puts class on `main`, so legacy JS would no-op if loaded.
- Orange panorama CSS overridden at ≤900 → `width:100%` breaks 180° scroll.

---

## Inventory Summary

- Orange: 11 sections, 3 pins, 7 stages, 1 room toggle, 5 videos, 6 purpose, 6 role, reveals, hero stagger, dialog — all exists in React but panorama 180° broken.
- BPCL: ~8 sections (hero, challenge, miniature/viewer, dayNight, blueprint, walkthrough, etc.), 7 miniature views, dayNight slider, blueprint tabs, walkthrough video/frames, 9 JS files — React broken (empty + half interactions).
- Indian: ~10 sections, 20 images, parallax/gate, stages, lazy — React partial (no parallax `requestAnimationFrame` as legacy).

**No content removed in legacy vs React snapshot, but functionality missing due to not loading legacy JS and CSS overrides.**

