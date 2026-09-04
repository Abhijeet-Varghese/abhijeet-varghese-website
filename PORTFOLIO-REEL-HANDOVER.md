# PORTFOLIO — HANDOVER (v3.0 “one component, three projects”)

The Portfolio page is a curated creative journey, not a project database. It runs as one
continuous cinematic narrative:

> **SHOW → DEFINE → VALIDATE → DISCOVER → EXPLORE → CLOSE**

Built against **`origin/main` @ `37e2fdd`** (fetched from
`https://github.com/Abhijeet-Varghese/abhijeet-varghese-website`). Every shared file in the
working tree was synced to that commit before the Portfolio work was re-applied on top.

Three files, nothing else touched:

| File | Role |
|---|---|
| `abhijeetvarghese/portfolio.html` | markup — 9 movements, head/nav/footer from upstream |
| `abhijeetvarghese/css/portfolio-reel.css` | page-scoped `.pf-*` layer, loads **after** `styles.css` |
| `abhijeetvarghese/js/portfolio-reel.js` | page motion, loads **after** `main.js` |

Mirrors (kept byte-identical):
`avos-php/site-template/css/portfolio-reel.css`,
`avos-php/site-template/js/portfolio-reel.js`,
`avos-php/public_html/site/portfolio.html`.

---

## 01 — The nine movements

| # | Section | Class | Anchor | Role in the story |
|---|---|---|---|---|
| 01 | Portfolio | `.pf-overture` | `#portfolio` | Opening frame. Label top, title centred, film credits bottom. |
| 02 | The film | `.pf-film` | `#film` | The reel — the statement. Everything after expands on it. |
| 03 | The context | `.pf-context` | `#context` | Exhibition credits + one editorial paragraph. |
| 04 | Practice spectrum | `.portfolio-practice` | `#practice` | **Established chapter — preserved verbatim.** |
| 05 | Selected organisations | `.portfolio-proof` | `#clients` | **Established chapter — preserved verbatim.** |
| 06 | Seam | `.pf-seam` | — | Wordless transition into the second act (`aria-hidden`). |
| 07 | Beyond the reel | `.pf-beyond` | `#beyond` | “There is more.” |
| 08 | More work | `.pf-soon` | `#more-work` | Intentional COMING SOON state. |
| 09 | Case studies | `.pf-runway` | `#case-studies` | **Cinematic horizontal runway**, then the existing footer. |

**There is no Next Project section, and no CTA section between Case Studies and the footer.**
The runway is the final major statement; the page closes straight into the site footer.

Transitions 04↔05 are carried by two `.pf-fade` bands (`.pf-fade--to-light`,
`.pf-fade--to-dark`), so the near-black chapters hand over to the paper-coloured clients
chapter instead of cutting into it.

---

## 02 — Preserved chapters (do not restyle)

`.portfolio-practice` and `.portfolio-proof` are **byte-for-byte identical to
`origin/main`**. Verified programmatically: with the two integration attributes the
chapter rail needs (`id` and `data-pf-chapter`) stripped out, both sections compare equal
to the upstream original.

Preserved exactly: the six practice items and their verbatim descriptions; the header
“The medium changes. The work is always about clarity.”; all sixteen client names in
source order with their real logo assets; the original logo grid, proportions and `alt`
text; the original typography, spacing, sticky header and `data-reveal` behaviour; the
`t-dark` / `t-light` themes and the `container` system.

Their CSS continues to come from the site's own `styles.css` — it was never forked.
`portfolio-reel.css` contains **no** rules for these two sections beyond the three below.

### The three exceptions

| Rule | Reason |
|---|---|
| `.pf-fade` bands | Integration only — transitions into and out of the chapters. |
| `.pf-railnav.is-light` | The fixed chapter rail inverts while it sits over the paper chapter, otherwise it is invisible there. |
| `.portfolio-proof header > p { color: #2E5AAC }` | **Accessibility fix, not restyling.** The eyebrow colour is shared with the dark chapters; on paper it measured **1.66:1**. The section's own deep azure (already used for its serif line) gives **6.1:1**. Same role in the hierarchy. |

> The 1.66:1 eyebrow is a pre-existing defect on the live site, not something introduced
> here. It should ideally be fixed globally in `styles.css`; the override is scoped to
> this page so no other route changes behaviour.

---

## 03 — Case studies: the runway

Vertical scroll drives travel through a horizontal canvas. **Every project uses the same
component.** The cinematic quality comes from the movement, the scale and the pacing — never
from giving one project a different card.

> Previous direction (asymmetric scenes, per-project compositions, varying image sizes and
> vertical positions) is **rejected**. Do not reintroduce it.

### One component, different data

```html
<article class="pf-scene pf-card">
  <a class="pf-card__link" href="…" data-cursor="View">
    <span class="pf-card__num" aria-hidden="true"></span>   <!-- number is a CSS counter -->
    <figure class="pf-card__media">                        <!-- 16:9, always -->
      <img … data-fit="contain">                           <!-- contain only where artwork needs it -->
      <span class="pf-card__veil" aria-hidden="true"></span>
    </figure>
    <div class="pf-card__body">                            <!-- flex column, CTA anchored bottom -->
      <p class="pf-card__category">…</p>       <!-- 01 -->
      <h3 class="pf-card__client">…</h3>       <!-- 02 -->
      <p class="pf-card__project">…</p>        <!-- 03 -->
      <p class="pf-card__work">…</p>           <!-- 04 -->
      <span class="pf-card__cta">…</span>      <!-- 05 · margin-top: auto -->
    </div>
  </a>
</article>
```

Adding a case study = appending one more `.pf-card` with the same five fields in the same
order. There is no `.pf-card--01`, no `.pf-project--02` — **nothing is per-project**.

### What the component enforces

| Requirement | Mechanism |
|---|---|
| Identical width | one shared rule — `width: clamp(300px, 44vw, 440px)` |
| Identical **rendered** size | **no scale transform** — `translate3d` only, so cards never differ on screen |
| Identical height | track is `align-items: stretch`; body is a flex column |
| Identical 16:9 frame | `.pf-card__media { aspect-ratio: 16/9; overflow: hidden }` |
| CTA aligned across cards | `.pf-card__cta { margin-top: auto }` |
| Copy length can't shift anything | `.pf-card__project { min-height: 2 lines }` |
| Number never drifts | CSS counter incremented on `.pf-card`, reset on the track |
| Unequal source artwork | `object-fit: cover`; `contain` only where the artwork demands it |

### Client-name typography

`Bharat Petroleum Corporation Limited` must sit on **one line** on desktop, at the largest
size that still fits. The name is sized in `vw` so it tracks the card, then capped:

```css
font-size: clamp(1.04rem, 2.44vw, 1.53rem);
letter-spacing: -0.022em;
```

Measured across 26 viewport widths from 360 → 1920 px: **one line at every width**, filling
**87–89 % of the card** — maximum readable size with a real safety margin.

### Image treatment

| Project | Source | Frame | Fit | Downscale |
|---|---|---|---|---|
| Bharat Petroleum Corporation Limited | 1672×941 | 16:9 | **`contain`** — branded artwork, never cropped | 0.26× |
| Orange Business | 1536×1024 | 16:9 | `cover` | 0.29× |
| Indian Army | 640×427 | 16:9 | `cover` | 0.69× |

Nothing is upscaled. The BPCL frame is 16:9 exactly like the others; `contain` costs ~0.1 %
because the artwork is 1.776:1. With `cover`, Orange and Army crop vertically — Army loses
about 19 % of its height, which is the price of the shared frame.

### Framing

The sequence **opens and closes on a centred scene**: the opening scene is dead centre as the
stage takes hold (`p = 0`), the final project dead centre as it lets go (`p = 1`). Both are
computed from live DOM geometry, so they hold at any size. Measured at 1600×900:

| card | centre lands at | off-centre | focus |
|---|---|---|---|
| 01 Bharat Petroleum Corporation Limited | p = 0.383 | 0 px | **1.000** |
| 02 Orange Business | p = 0.691 | 0 px | **1.000** |
| 03 Indian Army | p = 1.000 | 0 px | **1.000** |

### Camera, not slider

Vertical scroll sets a *target*; the track eases toward it (0.18 damping per frame) so the
movement carries inertia and reads as a camera travelling rather than a slider snapping. It
settles within ~0.35 px and the rAF loop stops when settled — no continuous work.

### Depth

| Layer | Movement |
|---|---|
| Card | `translateX(rel × 14px)` — **no scale**, so every card is the same size on screen |
| Media image | `scale(1.02 → 1.08)` with focus — inside the fixed 16:9 frame |
| Veil | opacity lifts as focus rises (`0.92 → 0.34`) |

**Focus emphasis is perceptual only** — and it must never change rendered size. An earlier
build scaled the focused card `0.955 → 1.0`; that passed every layout assertion (layout width
was identical) while making cards visibly different sizes on screen. The scale is gone. Cards
now differ only by opacity (`0.55 → 1`), the veil, and the image zoom *inside* the fixed frame.

`qa/cards.js` now asserts rendered (post-transform) size, not just layout size.
Driven by two custom properties, `--f` (focus) and `--rel` (distance from centre), defaulting
to neutral. With JS off, under reduced motion, or on a small screen, every scene is simply
present.

### Orientation

`01 / 03` counter plus a hairline progress bar. **The count is derived from the DOM**
(`.pf-card` elements), never hard-coded. No arrows, no dots — it is not a carousel.

### Release

After the last project the runway empties into a tail of quiet track, the pin releases, and
the page returns to normal vertical scrolling straight into the footer. **No Next Project
section** — no next/related/recommended CTA of any kind.

### Fallbacks — the runway is never a trap

| Condition | Behaviour |
|---|---|
| `max-width: 900px` | Pin released. Native snap-scrolling region, horizontal swipe, all cards visible. |
| `max-height: 700px` | Same — short windows never pin. |
| `prefers-reduced-motion` | Same — no scroll choreography at all. |
| No JS | Same — the markup is a scroll region from the start. |

Verified in all four: pin `static`, viewport `overflow-x: auto`, `scroll-snap-type: x
mandatory`, every card at opacity 1 with `--f: 1`, no transforms, no arrows, region reachable
to its end, all three links intact.

---

## 04 — Content integrity

Nothing on this page is invented. Sources, in order of authority:

1. **`case-studies/index.html`** (the global card system) — client names, project titles,
   disciplines, sectors, imagery and `alt` text.
2. **The case-study detail pages** — BPCL hero lede; Indian Army stub copy.
3. **`avos-data/site.json`** → `clients[]` — cross-checked for the client list.
4. **`git show origin/main:abhijeetvarghese/portfolio.html`** — the practice spectrum and
   client list, extracted verbatim.

**No fabricated projects, clients, awards, statistics, testimonials, roles, dates,
descriptions or video titles.** Where information is unavailable it is omitted.

### Canonical routes (from upstream `main`)

| Project | Route |
|---|---|
| Bharat Petroleum Corporation Limited | `case-studies/bharat-petroleum-corporation-limited/` |
| Orange Business | `case-studies/orange-business/` |
| Indian Army | `case-studies/indian-army/` |

The retired `case-study-*.html` pages are now meta-refresh redirect stubs; the Portfolio
links directly to the canonical routes.

### BPCL artwork

The supplied branded artwork is `assets/case-bpcl.webp`, **1672×941**, and is rendered with
**`object-fit: contain`** so the complete artwork is always visible — never cropped. The
media box is sized to the artwork's own aspect ratio, so `contain` and `cover` coincide
and there are no letterbox bars.

The client is shown as **Bharat Petroleum Corporation Limited**, not “BPCL”, per upstream.

### More work — the empty state

`moreWork = []` in `js/portfolio-reel.js`. While empty the intentional COMING SOON
composition renders: slow abstract media fragments, drifting light, film grain, a
curation status line and one CTA. **No** fake thumbnails, project names, stock images or
descriptions.

The array is the whole extension point. It supports video, YouTube, image, motion, 3D,
brand film, immersive, interactive installation, digital experience and experimental
entries, each with a `layout` of `feature | half | wide | portrait`. Populate it and the
section renders itself — **no component changes.**

---

## 05 — Art direction

**Cinematic · futuristic · immersive · premium · human.** The futuristic quality comes
from composition, typography, motion, spatial interaction and precision.

Forbidden, and none of it is present: cyberpunk · neon · excessive glow · purple/blue AI
gradients · sci-fi HUDs · gaming UI · glassmorphism · random particles · floating cards ·
3D blobs · lens flares · giant custom cursors · scroll hijacking · fake 3D chrome · loud
gradients · excessive parallax.

Palette is the brand system only: near-black `#05070D`, deep charcoal `#080F22`,
off-white `#EFF0EA`, muted grey `#96A0BE`, azure `#6EA8FF` / `#9CC2FF`, paper `#F7F5EF`.
Type is Inter Tight with Instrument Serif italic for editorial contrast.

**The final creative test:** strip every piece of decoration and the underlying
typography, composition, imagery, spacing and hierarchy must already be excellent.

### Rhythm

HIGH IMPACT (film) → QUIET (metadata) → INFORMATION (practice) → CREDIBILITY (clients) →
ANTICIPATION (more work) → PAUSE (coming soon) → HIGH IMPACT + DEPTH (runway) → CLOSURE
(footer). If everything is loud, nothing is important.

---

## 06 — Motion grammar (a closed set)

| Behaviour | Where | Implementation |
|---|---|---|
| REVEAL | section copy | existing `data-reveal` (`main.js`) |
| TEXT | major headings | `.pf-line > i` masked line reveal, `data-pf-open` |
| EXPANSION | the film | shutters slide, stage `0.955 → 1`, media `1.14 → 1` |
| SCRUB | seam, film exit, rail | `--p / --o / --o2 / --exit` from one rAF loop |
| TRAVEL | the runway | damped track translation + per-scene focus |
| MICRO | links, arrows, cursor | 0.35–0.6s, `--ease-out` |

Only `transform` and `opacity` animate. The page measures **0 layouts** during scroll.

---

## 07 — Performance

* Below-fold imagery is `loading="lazy" decoding="async"`.
* The reel is **click-to-load**: local poster first, then the `youtube-nocookie` embed.
  Zero third-party requests until the visitor presses play.
* **No image is displayed above its native resolution.** Measured display ÷ native:
  BPCL 0.43, Orange 0.48, Indian Army 1.00 (exactly native at 1920).
* GPU transforms only; the runway's rAF loop stops when settled and parks entirely when
  the section is off-screen.
* No new dependencies. Static HTML, CSS and vanilla JS, like the rest of the site.

---

## 08 — Accessibility

* One `h1`; each movement heading is `h2`; each client/project is `h3` inside `article`.
  (Counted: 1 × `h1`, 7 × `h2`, 9 × `h3`.)
* Decorative seam, chapter rail and cursor are `aria-hidden` / inert.
* Every image has meaningful `alt` (`imgsNoAlt: 0`); no empty links.
* Visible focus states; minimum 44px primary targets.
* **Keyboard:** tabbing through the runway reaches all three project links; the
  `focusin` handler scrolls the page so each focused scene lands centred (verified at
  focus `0.999` once settled).
* **axe-core (WCAG 2.1 AA): 0 violations** at desktop and mobile.
* `prefers-reduced-motion`: every animation off, every element in its final state;
  content order and reachability unchanged.

---

## 09 — Responsive

Verified at **320 / 390 / 834 / 1366 / 1600 / 1920 / 2560** and heights 620–1300.
`scrollWidth === clientWidth` at every size tested — no horizontal page overflow. The only
intentional horizontal movement is inside the runway's own scroll container.

* Desktop ≥1201px: full asymmetric compositions, chapter rail, pinned runway.
* 900–1200px: compositions tighten, rail hidden.
* <900px: single column, no custom cursor, runway becomes a native snap region.

---

## 10 — QA evidence

Harness in `/home/user/qa` (Playwright + axe-core). Current run: **114 checks, 0 failures.**

| Script | Result | What it proves |
|---|---|---|
| `cards.js` | **84 / 84** | Every §32 requirement: 16:9 frame, identical width & height, identical field order, identical CTA, CTA alignment, `contain` only for BPCL, no upscaling, live counter, one-line BPCL, reserved text area, no per-project classes |
| `qc.js` | **30 / 30** | Reel, pin/release, all three routes, reduced motion, overflow, console, assets |
| `sweep.js` | 26 widths | Client name is one line from 360 → 1920 px, filling 87–89 % of the card |
| `centre.js` | 3 / 3 | Each card centres to 0–1 px, focus 1.000 |
| `render.js` | — | Rendered (post-transform) size at 9 scroll positions — all identical |
| `ratio.js` | — | Media frame is exactly 16:9 (440 × 247.5, deviation 0.0000) |
| `peak.js` | — | Fine focus sampling (61 samples) + keyboard convergence |
| `layout.js` | — | Internal box dump, proving the vertical rhythm |
| `shoot.js` | 48 shots | 4 viewports × 12 frames; overflow, heading and alt audit |
| `final.js` | 9 chapters | Chapter order and heading outline; h1 = 1 |
| `degr.js` | pass | Reduced-motion, no-JS and keyboard parity |
| `a11y.js` | 0 violations | axe-core at desktop and mobile |
| `routes.js` | 11 routes | Every other route 200 with no horizontal overflow |
| `smooth.js` | — | Median 16.7 ms, p95 33.4 ms, worst 49.9 ms, **0 frames >50 ms**, **0 layout shifts** |
| `seo.js` | **75 / 75** | §28 SEO brief: one H1, heading hierarchy, title/description length + content, single canonical, robots, complete OG + Twitter, JSON-LD `@graph` and `@id` wiring, raw-HTML crawlability (JS never run), image alt/lazy policy, case-study anchors, internal-link resolution, overflow at 3 widths |

Integrity checks:

* `.portfolio-practice` and `.portfolio-proof` **content byte-identical** to `origin/main`
  (`37e2fdd`) — the only delta is two attributes added to the *wrapper* tags
  (`id="practice"`, `id="clients"` and `data-pf-chapter`), which are the hooks the
  chapter progress indicator reads. No inner markup, class or style was touched.
* Global case-study card system **unmodified** — `case-studies/index.html`, `css/styles.css`,
  all three detail pages, `index.html`, `js/main.js` all show zero changes
* Only `portfolio.html` is modified; `css/portfolio-reel.css` and `js/portfolio-reel.js` are
  new files that upstream does not have, so nothing upstream can regress
* All three mirrors in `avos-php/` byte-identical to the source

Known local-preview noise (not a page defect): `main.js` posts analytics to
`/api/analytics/track`, which a static server answers with 501. Ignore it.

---

## 11 — Open items found upstream (not introduced here)

1. **`case-army.webp` is 640×427** but `case-studies/index.html` declares it
   `width="1536" height="1024"`. The declared dimensions do not match the file, which
   will cause layout shift on the listing page. The Portfolio declares the true 640×427.
2. **Indian Army project title differs between pages** — the listing card says
   “Immersive Solutions for Mission-Critical Environments”, the detail page says
   “Immersive Solutions for the Indian Army”. The Portfolio uses the listing title (the
   global card system). Worth reconciling.
3. **`case-studies/bharat-petroleum-corporation-limited/assets/video/walkthrough.mp4`
   returns 404** — a broken asset on the live BPCL case study.

---

## 12 — Evergreen: no year in the page

The year **2025** was removed from the Portfolio page at the author's request. It was
interpreted as **removal, not update** — no year was substituted in its place, so the
page stays correct without annual edits. Nine occurrences were cleared:

| Where | Before | After |
|---|---|---|
| JSON-LD `VideoObject.name` | `…Portfolio 2025` | `Creative Director Portfolio \| Design, Animation & Immersive Experiences` |
| Overture H1 | `<em>Portfolio 2025</em>` | `<em>Portfolio</em>` |
| `pf-film__stamp` | `Portfolio reel 2025` | `Portfolio reel` |
| `data-yt-title` | `…Portfolio 2025` | `Creative Director Portfolio — Abhijeet Varghese` |
| Play button `aria-label` | `Play the portfolio film: Portfolio 2025` | `Play the portfolio film: Creative Director Portfolio` |
| Poster `alt` | `…Portfolio 2025…` | `Portfolio film — Creative Director Portfolio, a showreel…` |
| `<h2 id="film-title">` | `Portfolio 2025` | `Creative Director Portfolio` |
| Credits row | `<dt>Year</dt><dd>2025</dd>` | **row deleted** (not left empty) |
| `js/portfolio-reel.js` comment | `year: "2025"` | `year: "…"` — matches its `"…"` siblings |

The credits list is now **Role / Disciplines / Location**.

**Still to decide:** three `2026` references remain, because they are true today and two
are boilerplate. Left in place pending the author's call — `2014 — 2026` in the overture,
`Available for select projects — 2026` in the footer, and `© 2026` in the copyright line.

---

## 13 — Dead code removed

Removed only what was **proved** unreferenced — checked against the HTML source, the live
DOM after a full scroll *and* card hover (so JS-applied state classes were present), the
stylesheet and the script. Nothing was deleted on suspicion.

| Removed | Why it was safe |
|---|---|
| `.pf-rule` | 0 elements, 0 matches in `portfolio.html`, 0 in `portfolio-reel.js` |
| `.pf-sec--void` | same |
| `.pf-wrap--narrow` | same |
| `[data-pf-parallax]` selector + its `measure()` loop | 0 matching elements in the HTML, so the loop never executed |
| `compact` (`matchMedia("(max-width: 900px)")`) | existed **only** to gate that parallax loop; removed with it |

Deliberately **kept**, because `qa/unused.js` cannot see them but the code emits them:

* `.pf-work`, `.pf-work__media`, `.pf-work__copy`, `.pf-work__num`, `.pf-work__cat` and
  the four layout variants `.pf-work--feature / --half / --portrait / --wide` — these have
  zero elements right now only because `moreWork = []`. `renderMoreWork()` builds them at
  runtime as `pf-work--{layout}` (line 58). Deleting them would break the documented
  “adding a project = adding data” extension point.
* `.is-light` and `.is-live` — applied by JS, absent from the initial HTML.
* `--deeper` — still consumed by the seam gradient, even though `.pf-sec--void` was its
  other user.

Post-cleanup: CSS **855 lines**, braces **315 / 315**; JS **480 lines**, `node --check`
clean, 0 references to `parallax` or `compact`. Class selectors went 122 → 119.
All 11 keyframes and all 15 custom properties remain in use; all four `data-*` attributes
(`data-cursor`, `data-fit`, `data-yt`, `data-yt-title`) still have consumers.

Regression suites were re-run **after** the removal — see §10, all still green.

---

## 14 — Organic SEO layer

SEO is integrated into the architecture, not layered on top of the design.
**No visual design, animation or existing section content changed.** The
Practice Spectrum, Clients and Case Study card system are untouched.

### Metadata

| | Value |
|---|---|
| Title (47 ch) | `Abhijeet Varghese — Creative Director Portfolio` |
| Description (157 ch) | `Creative Director Abhijeet Varghese works across experience design, immersive environments, motion, animation and visual storytelling. Explore selected work.` |
| Canonical | `https://abhijeetvarghese.com/portfolio.html` (single) |
| Robots | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` |

`<meta name="keywords">` was **removed** — Google ignores it and it read as
stuffing. `og:image:width/height/alt`, `og:locale` and `twitter:image:alt` were
added. No `twitter:site`: no verified handle exists anywhere on the site, and
inventing one is not acceptable.

### H1 — the one change inside the display type

The H1 renders **Creative / Director / Portfolio** on three lines and
previously never contained the name. A screen-reader-only span was appended
**last**, so the accessible name reads
*"Creative Director Portfolio — Abhijeet Varghese"*.

> **Why last, not first.** The reveal is keyed to `.pf-line:nth-child(1|2|3)`
> with delays `0.34s / 0.44s / 0.56s`. Inserting anything *before* the lines
> shifts those indices and silently breaks the stagger. Appending after them
> keeps the contract intact. Verified: child indices still `1,2,3`, delays
> still `0.34 / 0.44 / 0.56s`.

This needs a `.pf-sr` utility (added to the page stylesheet) because the site
has no global `sr-only` class — only a homepage-scoped `.hp-hero__seo`.

### Structured data

The two disconnected blocks (CollectionPage + VideoObject) became **one
`@graph`** wired by stable `@id`, so entities consolidate instead of
duplicating:

```
WebSite  <--isPartOf--  WebPage + CollectionPage  --about-->  Person
                              ^
                        isPartOf|
                          VideoObject --author--> Person
```

The `Person` `@id` (`https://abhijeetvarghese.com/#person`) was also added to
`index.html`, which already carried the canonical Person record — consolidating
rather than creating a second, competing entity. All five `sameAs` profiles
were copied verbatim from `index.html`; nothing invented.

Also fixed: the Army CreativeWork said `about: "Defence & Immersive"` while the
visible card said **Defence & Government**. Schema now matches reality.

`uploadDate` is deliberately **absent** — no trustworthy date exists, and
fabricating one is worse than omitting it.

### Content

One editorial sentence added to the Context section, using the existing
`.pf-lede` class so it inherits the current typography exactly:

> *Abhijeet Varghese is a creative director and experience designer working
> across brand, motion, spatial and immersive work — shaping complex ideas into
> experiences people can read at a glance.*

This closes a real gap: before this the name appeared **nowhere in the body
copy**. Nothing fabricated; COMING SOON stays empty.

### Verified

`node qa/seo.js` — **75 / 75**. Covers one H1, no skipped heading levels,
title/description length and content, single canonical, no noindex, complete
OG + Twitter, JSON-LD parses with all five node types and correct `@id`
wiring, no invented uploadDate, crawlability from **raw HTML with JS never
executed**, image alt/width/height/lazy policy, descriptive case-study anchors,
all 17 internal links resolving, no horizontal overflow at three widths.

No regressions: cards 84/84, qc 30/30, 0 axe violations, 16:9 deviation
0.0000, CLS 0.0000, 0 frames >50 ms.

### Needs external verification

1. **Rich Results Test / Search Console** — run the live URL through Google's
   validators. Local tests prove validity, not Google's acceptance.
2. **`uploadDate`** — add once the real YouTube publish date is known.
3. **Sitemap `lastmod`** — `sitemap.xml` carries none anywhere; adding it is a
   site-wide architecture change, out of scope. Portfolio is already present
   at priority `0.9`.

---

## 15 — Adding work later

1. Push entries into `moreWork` in `js/portfolio-reel.js` (schema documented there). The
   COMING SOON state disappears by itself.
2. Add scenes to the `.pf-runway__track`. The counter, progress bar, framing and pin
   length all derive from the DOM — never hard-code the count.
3. Mirror every changed file into **both** `avos-php/site-template/` and
   `avos-php/public_html/site/` (see the table at the top).
