# STAGING Premium Transformation — Implementation Plan
**Staging only — https://next.abhijeetvarghese.com — baseline 3cf5c41**
**Date: 2026-09-21 — Do not push to main/hostinger until validated**

> Desktop ≥901 frozen visually. No redesign of approved order (Hero→Trust→Capabilities→Featured Work→Point of View→Journey→Coda→Method→Now→Contact→Footer). Premium = typography/spacing/motion/responsiveness/performance/SEO/conversion, not more effects.

---

## 0. Pingdom HAR Baseline (provided summary)

* Page size ~258.9 KB, 14 requests, Load 2.82s, Fully loaded 3.62s, HTML ~1.03s TTFB
* CSS `styles.css` 122.7 KB raw / 40 KB transferred, `home-mobile.css` 46.8 KB raw / 14.8 KB transferred — two blocking CSS, ~0.8–1.1s each
* React JS `~80.5 KB` raw / 31.9 KB transferred (Vite hashed chunk)
* Inter Tight `inter-tight-normal.woff2` vs `inter-tight-normal.woff2?v=4` — duplicate URL → double download
* JS/CSS responses observed `no-cache` despite `.htaccess` `immutable` → HCDN cache MISS for static
* HCDN upstream wait ~700–850ms for small static (fonts, CSS, JS) → suggests PHP interception or missed Hostinger cache

**Goal:** LCP <2.5s, INP <200ms, CLS <0.1, substantially better where practical, without sacrificing immersive animations.

---

## Phase 1 — Performance Engineering — ROOT CAUSES & FIXES

### A. Static Asset Caching — `no-cache` vs `immutable`

**Current:**
* `abhijeetvarghese/.htaccess` has *two* identical `<IfModule mod_headers>` + `<IfModule mod_expires>` blocks (duplicated). First block sets `css|js` → `public, max-age=31536000, immutable`, `woff2|avif|webp|jpeg|png|svg|mp4` → same. Second block duplicates `mod_expires`. `FilesMatch \.html$` → `no-cache, must-revalidate` correct (HTML must stay deploy-safe).
* `avos-php/public_html/.htaccess` sets `css|js` → `immutable` but `woff2|avif|webp|jpeg|png|svg|mp4` → `public, max-age=2592000` (30 days, *not* immutable) — **mismatch**. Vite hashed `/_react/*.js|css` should be `immutable` 1yr, fonts/images versioned but currently 30 days vs 1yr. HAR shows `no-cache` for CSS/JS → either HCDN ignores `.htaccess` or `mod_headers` not active, or `FilesMatch` regex `\.html$` vs `\.(?:css|js)$` ordering? Apache `Header set` vs `Header always set` vs CDN.
* HTML correctly `no-cache` (good).

**Fix:**
1. Deduplicate `abhijeetvarghese/.htaccess` (remove second `mod_expires`/`mod_headers` duplicate).
2. Align both `.htaccess` to single source: `css|js|woff2|avif|webp|jpeg|png|svg|mp4` → `public, max-age=31536000, immutable` for hashed/versioned immutable assets. Keep `html` → `no-cache, must-revalidate` + `ExpiresByType text/html 0`.
3. Add explicit `/_react/` override: `Header set Cache-Control "public, max-age=31536000, immutable"` for `/_react/*` (Vite content-hashed — never changes without filename change).
4. Verify via `curl -I https://next…/_react/*.js` → `cache-control: public, max-age=31536000, immutable` + `cf-cache-status: HIT`/`HIT` vs `MISS`. Document BEFORE/AFTER.
5. Do **not** cache `search-index.json` or `/api/*` as immutable — keep `no-cache` for dynamic.

**Risk:** Low — HTML stays `no-cache`, hashed assets immutable by definition (filename changes on content change). Verify HCDN respects `Cache-Control`.

---

### B. Hostinger/HCDN Latency — 700–850ms upstream wait for static

**Current audit:**
* `abhijeetvarghese/.htaccess` RewriteEngine handles *only* HTML clean-URLs and legacy aliases (`RewriteCond %{REQUEST_FILENAME} !-f` + `!-d` checks before `…/.html` and legacy `RewriteRule`). Static `css/js/fonts/images` should bypass PHP — they are real files (`-f` true) so `RewriteRule ^(.+)/$ $1.html [END]` should not trigger. Good.
* `avos-php/public_html/.htaccess` has `RewriteRule ^media/(.+)$ media.php` and `RewriteCond %{REQUEST_URI} !^/(admin|api|install|media)(/|$)` before generic engine — static frontend should bypass `backend`. Good.
* `router.php` (dev `php -S`) mirrors same: `if (str_starts_with($path,'/api/')) → api`, `if (str_starts_with($path,'/media/')) → media.php`, else static via `avServeStatic($real)` — not for Hostinger Apache, but shows intent static ≠ PHP.
* No SSR, no Node runtime — good (Hostinger static).
* **Suspects for 700ms:**
  * Duplicate `mod_expires`/`mod_headers` parsing cost per request (minor).
  * Hostinger **HCDN cache MISS** for `styles.css`/`home-mobile.css`/`fonts` — suggests HCDN not caching because `Cache-Control: no-cache` observed (so HCDN respects `no-cache` and proxies to origin every time → 700ms).
  * Potential `RewriteCond` backtrack for `assets|css|js` rescue rules: `RewriteCond %{DOCUMENT_ROOT}/$2/$3 -f` with `RewriteRule ^([^/]+)/(assets|css|js)/(.*)$ /$2/$3 [END]` — extra filesystem `stat` per request for nested legacy URLs (e.g., `/case-studies/assets/...`). Not for homepage but adds per-request overhead.
  * No `Brotli`/`deflate` mismatch? Both `.htaccess` set `AddOutputFilterByType BROTLI_COMPRESS` + `DEFLATE` for `text/html/css/js/json/xml/svg` — HCDN may double-compress or vary.
  * No `HTTP/2` push needed; `preload` for fonts/images is via `<link rel="preload">` in `index.html` (hero-portrait.webp, inter-tight, instrument-serif). Check if preload is correct.

**Fix:**
1. Fix caching (A) → HCDN will cache → 700ms → ~50ms HIT. Primary fix.
2. Audit Hostinger hPanel → **Cache Manager** + **HCDN → Cache → Cache-Control** must be `Respect origin` (not `Bypass`). Ensure `Brotli` enabled at edge, `HTTP/2` + `HTTP/3` on.
3. Add `Header merge Vary "Accept-Encoding"` already present — keep.
4. Verify `Content-Type` `font/woff2` correctly served (no `text/plain` misroute via `media.php`).
5. Do **not** route `*.woff2|*.css|*.js|*.webp|*.avif` through `media.php` or `api` — already bypassed, verify via `curl -I` `x-powered-by` absent for static.

**Measurement:** `curl -w "%{time_starttransfer} %{time_total} %{http_code} %{size_download} %{url_effective}\n" -o /dev/null -s https://next…/assets/fonts/inter-tight-normal.woff2` BEFORE vs AFTER, plus `cf-cache-status` / `x-hcdn-cache-status`.

---

### C. Duplicate Font Requests

**Current:**
* Preload in `index.html`: `<link rel="preload" href="/assets/fonts/inter-tight-normal.woff2" as="font" crossorigin>` and `<link rel="preload" href="/assets/fonts/instrument-serif-italic.woff2?v=4" as="font">`
* CSS `@font-face` in `abhijeetvarghese/css/styles.css` likely `src: url('/assets/fonts/inter-tight-normal.woff2?v=4')` (versioned) vs preload without `?v=4` → browser treats as **two distinct URLs** → double download (HAR confirms).
* Also `src-backups/css/*` vs `abhijeetvarghese/css/*` duplication — but `src-backups` is source, `abhijeetvarghese/css` is deployed minified, per `UI-UX-RULEBOOK`. Check all `@font-face` across `abhijeetvarghese/css/*.css`, `public` etc., plus React `index.html` preload.

**Fix:**
1. `grep -R "inter-tight" --include="*.css" --include="*.html" abhijeetvarghese/ src/` → inventory every declaration.
2. Choose **ONE canonical URL**: prefer versioned `inter-tight-normal.woff2?v=4.6.1` (matches `CSS?v=4.6.1` cache-bust) or unversioned but consistent. Recommendation: canonical `inter-tight-normal.woff2` (no query) for HTTP/2 cache, or consistent `?v=4.6.1` everywhere — but not both.
3. Update `@font-face src` and `<link preload>` to same URL, keep `crossorigin` for fonts, add `type="font/woff2"`.
4. Verify via HAR: only **one** `inter-tight-normal.woff2` request, `cf-cache-status HIT`.
5. Keep approved typography (`Inter Tight`, `Instrument Serif`, `Poppins Medium`) — no font swap.

**Risk:** Low — URL normalization, no visual change.

---

### D. CSS Architecture

**Current:**
* `index.html` loads 5 CSS: `/css/styles.css?v=4.6.1` (122.7 KB raw, global), `/css/elevate.css?v=4.4.1`, `/css/hero-v6.css?v=4.4.1`, `/css/home-mobile.css?v=4.0.0`, `/css/mobile-menu-panel.css?v=1.0.0` — 5 blocking `link[rel=stylesheet]` in `<head>` (render-blocking).
* `src-backups/css` 15 files vs `abhijeetvarghese/css` deployed — `home-mobile.css` is 46.8 KB raw but only for `≤900` (mobile) — currently loaded blocking on desktop too via `<link>` (waste).
* No `media` attribute for mobile CSS → desktop parses 46.8 KB unused.

**Fix (conservative, no visual change):**
1. Inventory `grep -R "home-mobile" --include="*.html"` → currently unconditional.
2. Change `home-mobile.css` to `<link rel="stylesheet" href="/css/home-mobile.css?v=4.0.0" media="(max-width: 900px)">` + `onload` fallback, or keep but add `media` to avoid desktop parse. Similarly `hero-v6.css` is homepage-only — consider loading via `React` code-split for non-home routes (homepage already has `hero-v6`, other routes don't need it — but current `index.html` only is homepage; `case-studies/*/index.html` etc. each have own CSS set — verify per-route CSS not loading homepage-only).
3. Audit dead CSS: `grep -R "class=\""` vs `grep` CSS selectors — use `purgeCSS` dry-run in `scripts/` to find unused rules, but **do not auto-purge** yet. Report `UNUSED` list, then manually remove only proven dead (e.g., `errors.css` if not referenced).
4. Keep `styles.css` as critical global, `elevate.css` as global, but consider `preload` + `rel=stylesheet` with `onload` for non-critical `mobile-menu-panel.css`.
5. Measure `First Contentful Paint` + `Speed Index` BEFORE/AFTER via Lighthouse `mobile`/`desktop` at 375/1280.

**Risk:** Medium — `media` attribute change safe if verified; no merging into mega-bundle to avoid CLS.

---

### E. JavaScript — lean bundle, route-split, lazy

**Current:** Vite `rollup.input` 23 entries, `manualChunks: {react:['react','react-dom']}` → `react-SIwY82C9.js` 140k `main-BwZ2…` 80k, per-route chunks `consulting 33k`, `story 35k`, `orangeBusiness 35k`, `indianArmy 57k`, `recruiter 43k` etc. — good split. `index.html` only loads `react` + `main` for homepage; `story/index.html` loads `story-*` etc. — no homepage JS on case-study routes.
* Global scripts: `main.js` (legacy `abhijeetvarghese/js/main.js` loaded via `usePageMotion` etc.), `elevate.js`, `mobile-chrome.js`, `emailjs-fallback.js` — some loaded via `useBooking`/`useContactMotion` dynamic `document.createElement('script')` (lazy).
* Listeners: `scroll` + `resize` + `IntersectionObserver` + `requestAnimationFrame` in `usePageMotion`, `useHeroMotion` (hp6), `useReveal`, `useMenu` — need audit for passive + `once` + cleanup.

**Fix:**
1. Keep 23-entry split — verify no entry imports another entry's heavy chunk (e.g., `orangeBusiness` panorama only on that route).
2. Lazy `EmailJS` — already deferred `emailjs-fallback.js` via `useBooking` on form interaction, keep.
3. Lazy `panorama`/`viewer` code: `useOrangeBusinessMotion`, `useBpclMotion`, `useIndianArmyMotion` already route-only — verify no global import in `main`.
4. Audit listeners: ensure `addEventListener('scroll',…, {passive:true})` already, `removeEventListener` on unmount, `IntersectionObserver` thresholds `0.15`/`0.5` with `unobserve` after `is-in`, `requestAnimationFrame` throttling (already `requestAnimationFrame` loop for hero fragments with `heroVisible` + `prefers-reduced-motion` guard).
5. Verify no duplicate `react`/`react-dom` via `manualChunks` — good.
6. Measure `TBT`/`INP` via Lighthouse trace, target `INP <200ms`.

**Risk:** Low — mostly verify, not remove.

---

### F. Images — rigorous strategy

**Current:** `216` assets in `abhijeetvarghese/assets`, `hero-portrait.webp` `fetchpriority=high` + `preload`, `case-*` responsive `avif`/`webp`/`800`/`1280`, `about/*` `1312×816` with `width`/`height` + `loading="lazy"` + `decoding="async"` (good), OG `1200×630`.
* Check every `<img>` has `width`/`height` + `alt` (Story has decorative `alt=""` with `aria-hidden` correct), `loading` correct (above-fold `eager` + below-fold `lazy`), `fetchpriority` only for LCP.
* Check `srcset`/`sizes` for responsive — currently `picture` with `avif`/`webp` but not `srcset` for `hero-portrait`; should be `avif→webp→jpg` with `srcset`.
* Check no accidental upscaling: `hero-portrait.webp` maybe 1312×816 displayed at 500×500? Verify dimensions.

**Fix:**
1. Inventory `grep -R "<img" src/ abhijeetvarghese/` → list `width`/`height`/`loading`/`alt`.
2. For LCP: keep `hero-portrait.webp` `preload` + `fetchpriority=high` + `decoding="async"` + `width`/`height` to avoid CLS.
3. For below-fold: ensure `loading="lazy"` + `decoding="async"` (already in `StoryContent` etc.).
4. Audit `avif` vs `webp` size — prefer `avif` where smaller, but keep `webp` fallback via `<picture>`.
5. Do not blindly convert — visual quality preserved.

---

### G. Video — premium but efficient

**Current:** Case studies `orange-business` 5 videos `mp4?v=4.4.2` with `poster`, `bpcl Final.mp4` `55M` `assets/video/Bpcl Final.mp4` (space in name → `%20`), `indian-army` etc. Videos have `preload="metadata"` or `none`? Check `video` tags in `OrangeBusinessContent`, `BpclContent`.

**Fix:**
1. Ensure `preload="none"` or `metadata` + `poster` + `loading` lazy via `IntersectionObserver 0.15` (already `video load/play/pause` on `is-active` tab + `IntersectionObserver`).
2. Verify `Bpcl Final.mp4` `%20` correctly encoded via `BPCL_ASSETS.video` `WALKTHROUGH_SRC`.
3. Ensure no `autoplay` download below fold — currently `video` only `play()` when `is-active` + `IntersectionObserver` visible, good.
4. Mobile: ensure `video` not `autoplay` on `prefers-reduced-motion` or `save-data`.

---

### H. Animation Performance — compositor-friendly

**Current:** `useHeroMotion` fragments `translate3d` + `fontVariationSettings` `'wght'` via `requestAnimationFrame` loop, `well` `translate3d`, `frags` `translate3d`, `wghts` — uses `transform` + `opacity`, `will-change: transform, opacity` on `case__panel` etc., `prefers-reduced-motion` guard (`matchMedia('(prefers-reduced-motion: reduce)')` → `arena-reduce`), `IntersectionObserver` for `in-view`, `pageMotion` `translate3d` for journey track (`--exp-fill`), `parallax` `translate3d` with `0.05`.

**Fix:**
1. Keep `transform`/`opacity` only — no `width`/`height`/`top`/`left` animation in loops.
2. Verify `hero-v6.css` does not trigger `layout` — `transform` is compositor.
3. Add `content-visibility: auto` for below-fold `section` if safe (measure CLS).
4. Ensure `will-change` is set only during animation, not permanently (currently `willChange="transform"` on `case__panel` → should be `auto` after).
5. Verify `prefers-reduced-motion` disables `loop` (`if(reduced) return`) already, good.

---

### I. Core Web Vitals — measured, not fabricated

**Measure:** Lighthouse `mobile` (Moto G4, 4G) + `desktop` at `320/375/390/414/768/820/1024/1280/1366/1440/1920/2560` via `npx lighthouse https://next… --view --output=html` after each fix, compare to HAR baseline `LCP 2.82s`, `TBT`, `CLS`, `FCP`, `TTFB`.

**Target:** `LCP <2.5s` (prefer `<1.8s`), `INP <200ms`, `CLS <0.1`, `FCP <1.8s`, `TTFB <600ms` (currently HTML 1.03s).

---

## Phase 2 — SEO Engineering

*Inventory every indexable route (22 in sitemap + search noindex). For each page determine primary intent/topic/audience/journey/conversion intent.*
*Unique `title`/`meta description`/`H1`/`H2`/`canonical` already per `dist` (verified: all `https://abhijeetvarghese.com/…`, search `noindex` correct, `og:*` correct). Gaps: `Journal` articles have `description: "Compression is the real gift."` (thin) — should be richer but **do not invent copy** — flag as CMS content needing author input, not code.*

*Structured data: `WebSite` + `Person`/`Organization` via `application/ld+json` in `index.html` (already via `VITE`), `BreadcrumbList` per case-study, `Article` for Insights/Journal (check `useCmsSeo` already injects `og:image` + `title`/`description`). Validate JSON-LD via `validator.schema.org`.*

*Internal linking: `Service→Case Study→Insight→Service` via `SiteChrome` + `CaseStudiesContent` `BACK TO ALL` + `InsightsHub` related — audit `grep -R "href=\"/case-studies` etc.*

*No keyword stuffing, no doorway, no spun, no fake location.*

---

## Phase 3 — Lead Generation

*Primary CTA `START A CONVERSATION` (`/contact/`) already via `SiteChrome` `btn--accent` + `Home Contact` `book` + `ContactContent`. Secondary `View case study`, `Explore experience` via `FeaturedWork` etc. Keep `EmailJS` lazy-loaded via `useBooking`.*

*Organic landing: each case-study/insight must have context/authority/evidence/CTA without homepage — already via `dangerouslySetInnerHTML` copy + `SiteChrome`/`Footer` trust.*

---

## Phases 4-7 — A11y, CMS, Mobile, Quality Gates

*Preserve existing CMS `→ API → React` via `useCmsContent`, do not hardcode CMS fields, keep `prefers-reduced-motion`, keyboard `Tab`/`Escape` in menu, `focus` management, `alt` 24, `aria-hidden` decorative.*
*Mobile `≤900` intentionally designed via `home-mobile.css` + `mobile-chrome.css` + `mobile-menu-panel.css` — verify no `overflow-x`.*
*Quality gates: `npm run lint/typecheck/build/validate:home/story/experience/case-studies` + `Lighthouse` + `route crawl` + `broken-link scan` + `cache-header verification` + HAR comparison.*

---

## Deliverable & Staging Rules

* All changes on `staging` only, commit after each phase after `lint/typecheck/build/validate` + Lighthouse, do not push to `main`/`hostinger` until instructed, keep `pre-react-baseline` tag, no new branch.*

