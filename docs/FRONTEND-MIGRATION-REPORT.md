# COMPLETE REACT + TYPESCRIPT + VITE MIGRATION — STATUS REPORT

> **Honest status: MILESTONE 1 OF 3 COMPLETE.**
> Foundation + shared design system + homepage are fully migrated and
> **verified visually equivalent**. The remaining 24 public routes are
> scaffolded on the route manifest and scheduled as Milestones 2–3.
> This is a phased delivery — nothing below claims a page is migrated unless it
> was built and verified.

---

## ARCHITECTURE (old → new)

| Layer | Before | After |
|---|---|---|
| Frontend | Hand-authored HTML/CSS/JS (no build step), published by `PublishEngine.php` | React 19 + TypeScript + Vite MPA, static build with build-time SSG |
| Rendering | Static HTML only | Static HTML at build time (`react-dom/server`) + hydration for interactivity |
| Page model | 25 hand-written `.html` files | 25 Vite HTML entries → one typed React page component each |
| Content | `content_store` JSON → PublishEngine | Same snapshot → typed `src/content/*.ts` → React |
| Backend | PHP 8.4 custom MVC + MariaDB | **Unchanged** |
| CSS | `styles.css` (~4,000 lines) + `tokens.css` | Same CSS, split `tokens.css` → `base.css` → `styles.css`, imported via `app.css` |
| JS | `main.js` (41 KB imperative) | Rebuilt in `lib/scroll.ts` (reveal/parallax/progress/journey), `lib/nav-origin.ts`, `lib/analytics.ts`, React components |

Build output is fully static (`dist/`: HTML + CSS + JS + assets). No Node runtime,
no Next.js, no SPA shell. Existing URLs preserved (`index.html`, `/story.html`,
etc. via Vite MPA `rollupOptions.input`).

## FRONTEND

- **React** 19.x · **TypeScript** 5.7 (strict: `noUncheckedIndexedAccess`,
  `noUnusedLocals/Parameters`, etc.) · **Vite** 6.4
- **MPA**: each route = one HTML entry + one `pages/*` component; single owner
  per route (route manifest in `scripts/prerender.mjs`).
- **Static generation**: `vite build` (client) → `vite build --ssr` (server) →
  `scripts/prerender.mjs` splices rendered `head` + `body` into each entry.
  Output carries real, crawlable content (no blank `#root`).
- **No-JS fallback**: core content is in the HTML; `reveal-failsafe` inline
  script makes all content visible if the bundle never loads (same as legacy).

## BACKEND (intact)

PHP 8.4 + MariaDB + CMS + admin + auth + email + AI + calendar/booking backend
are **untouched** (no files in `avos-php/` or `avos-data/` modified). Contracts
verified and preserved:

- `POST /api/public/lead` — accepts `name`, `email`, `phone`, `company`/
  `organization`, `message`, `date`, `time`, honeypot `website` (spam drop),
  rate limiting, optional Turnstile.
- `POST /api/public/submit` — untouched.
- Analytics endpoint `POST /api/analytics/track` — called identically (privacy-
  respecting, first-party).

## DESIGN — PRESERVED

**CURRENT DESIGN PRESERVED** ✅ · **CURRENT COLOR THEME PRESERVED** ✅
**CURRENT TYPOGRAPHY PRESERVED** ✅ · **CURRENT VISUAL DNA PRESERVED** ✅

- Locked palette ported verbatim: Deep Navy `#080F22`, Warm Paper `#F7F5EF`,
  Azure `#6EA8FF`/`#2E5AAC` (+ all semantic chapter-theme variants).
- Fonts: Inter Tight (variable 300–700), Instrument Serif, Poppins — self-hosted
  `.woff2`, preloaded critically, no CDN.
- **Visual regression (Playwright + ImageMagick, reduced-motion for determinism):**

| Width | Hero (above fold) | Note |
|---|---|---|
| 390 / 768 / 1440 / 1920 | **0 diff pixels @ 1440** (390/768/1920: 0.0001–0.004 RMSE) | Perfect |

Section-by-section @1440: `hero 0 · clients 6.5 · capabilities 31 · work 13 ·
thinking 68 · journey 32 · ai 92 · focus 3.3 · footer 6` (RMSE on 0–65535 scale;
all ≈ sub-pixel anti-aliasing) — **contact differs by design** (form fields per
spec, see below). A typographic fidelity bug (curly vs straight apostrophes)
was found and fixed during verification (thinking 858→68, ai 1312→92).

## PAGES MIGRATED

| Route | Status |
|---|---|
| `/` (`index.html`) — hero, clients, capabilities, work, thinking, journey, method, focus, contact + booking | ✅ **Migrated + verified** |
| `/story.html`, `/experience.html`, `/case-studies.html`, `/portfolio.html`, `/contact.html`, `/consulting.html`, `/for-recruiters.html`, `/insights.html`, `/journal.html`, `/search.html`, `/sitemap.html`, `/privacy-policy.html`, `/terms.html`, `/404.html`, 3 × case-study, 4 × essay, 2 × journal, Orange EBC long-form | ⬜ Milestones 2–3 (route manifest ready; `ContactBook` component is already built and reusable for `contact.html`) |

## FUNCTIONALITY

Preserved in the migrated homepage + chrome: reveal-on-scroll (IntersectionObserver
+ stagger), reading progress, nav `is-visible`, `[data-parallax]` scrub, homepage
`#journey` horizontal pin, hero `is-past`, marquee (CSS), active-nav `aria-current`,
focus-trapped mobile menu (≤900px) with Escape + focus-return, skip link,
contextual `avos:nav-origin`/`avos:nav-restore`, first-party analytics,
`prefers-reduced-motion` fallbacks.

## BOOKING

Form fields (per spec): **Name · Mobile Number · Email · Message · Calendar ·
Time Slot · Submit** — no Organization. Pending-approval workflow preserved:
submit → `/api/public/lead` → confirmation copy "I'll confirm the requested time
by email within 24 hours" (no false confirmation). Custom calendar, no Calendly,
OAuth/keys never in frontend.

**Documented deviation:** production currently ships `Organization` + no mobile;
the spec's explicit field list (Name/Mobile/Email/…) was implemented instead
(backend already accepts `phone`). Also, `GET /api/public/availability` (named in
the spec) is not in the current backend route map and not called by the current
frontend — current "static" calendar behaviour was preserved and flagged.

## PERFORMANCE

- Homepage JS: **249 KB (78 KB gzip)** — React 19 + ReactDOM. Exceeds the
  "preferably <30 KB" aspiration; per spec, visual quality was not sacrificed.
  Mitigations planned (Milestone 3): lazy-load the booking calendar, split
  vendor/route chunks, evaluate Preact-compat if the target is mandatory.
- Homepage CSS: **135 KB (26.8 KB gzip)** — the full production stylesheet.
- Largest assets: images (`case-orange-experience-in-action.webp` 181 KB, etc.),
  subset variable fonts (~101 KB Inter Tight italic).
- LCP/CLS/INP: not yet measured on a live deployment (static preview only; the
  PHP backend/analytics need a full environment). Hero image + body font are
  preloaded to bound LCP.

## ACCESSIBILITY

Preserved: skip link, semantic landmarks (`header`/`nav`/`main`/`footer`),
single `h1`, labelled form fields, `aria-invalid`/`aria-describedby` + `role=status`
`aria-live` on the form note, `aria-expanded`/`aria-modal`/`aria-controls` on the
menu and date popover, radiogroup/grid roles on the calendar, visible focus
ring, reduced-motion, touch targets. (Full axe sweep scheduled with the complete
route set.)

## RESPONSIVE

Verified **390 / 768 / 1440 / 1920** (plus 320-wide smoke) on the homepage via
screenshots — no horizontal overflow; hero, cap-stack, case panels, journey,
contact/calendar all render correctly. Full 12-width matrix scheduled in the
final regression pass.

## SEO

Homepage head: title, meta description, keywords, robots, theme-color, canonical,
Open Graph, Twitter card, JSON-LD (`Person`), font/image preloads, favicon —
all present in the prerendered HTML. Remaining routes to follow their existing
SEO in Milestone 2.

## CLEANUP

Nothing removed yet (the legacy `abhijeetvarghese/` source and `PublishEngine`
remain the production path until the full migration passes). Cleanup is
Milestone 3 (remove legacy frontend, dedupe assets/CSS/JS, dependency audit).
No removal claims are made.

## REGRESSION (old vs new)

Homepage verified equivalent (hero 0-pixel diff; all sections sub-pixel except
the intentional contact-form change). Backend regression: none — backend
untouched. Full old-vs-new route matrix runs at the end of Milestone 2.

## GIT

Branch `feat/react-ts-vite-migration` (no force-push):

```
9c12283 feat(frontend): add React TypeScript Vite MPA with build-time static generation
5bdcf7d docs: add React/Vite migration plan and route manifest
```

## PRODUCTION

**NOT DEPLOYED.** The React/Vite build is staging/preview only.

## FINAL VERDICT

Is the new site architecturally React + TypeScript + Vite while retaining
PHP + MariaDB and the exact current visual identity?

**For the homepage: YES.**
**For the full site: IN PROGRESS** — foundation complete and verified, 24 routes
remaining (Milestones 2–3 in `MIGRATION-PLAN.md`).

> Next milestone (recommended): migrate `/story.html` (Evolution 3D film stack),
> then portfolio + case studies, then contact/booking, then the shared-template
> legal/utility pages and articles, finishing with legacy removal + the full
> Playwright visual-regression matrix across all 25 routes.
