# CMS WIRING — CONTENT SOURCE MIGRATION VERIFICATION
Branch `staging` @ `e924546` → wiring phase (next commit)
Date 2026-09-21 Asia/Calcutta — Bengaluru

> Implements godmode PHASE 2–16 without redesign. CMS → PHP API → React → Browser is now the primary content path with safe fallback.

## 1. Lib + Hooks

- `src/lib/cms.ts` extended: `CmsNav`, `CmsSettings`, `CmsSection`, `CmsProject`, `CmsArticle`, `CmsSeoRow`, `CmsClient`, helpers `cmsMediaUrl`, `findSection`, `pickString`, `pickMedia`
- `src/hooks/useCmsSeo.ts` NEW: reads `seo` key, matches `path`, upserts `title`, `meta[name=description]`, `og:description`, `twitter:description`, `link[rel=canonical]`, `og:image`/`twitter:image` via `cmsMediaUrl`. Keeps static `index.html` head as fallback, avoids duplicate tags.
- `src/hooks/useCmsContent.ts` unchanged API (`key`, `fallback`) with `source cms|fallback` flag — now used pervasively.

## 2. Global Navigation (PHASE 11)

- `src/components/SiteChrome.tsx` now `useCmsContent('nav')` + `useCmsContent('settings')`
- `CmsNav.primary` drives **labels / hrefs / ordering**; `cta` flagged item becomes `Start a conversation` button, remaining items render as nav links. Fallback `FALLBACK_NAV` (Story/Experience/Case Studies/Portfolio) preserved.
- `settings.siteName` drives brand name, `settings.logo` (`media/...` → `/media/...`) drives logo with fallback `/assets/logo.png`, `settings.email` drives `mailto:` in mobile menu.
- Visual menu (`Line→X`, bottom-rising, `mobile-menu-panel.css` bounded `320–900`) unchanged. `data-cms-source="cms|fallback"` added for verification.

## 3. Global Footer (PHASE 12 + 14)

- `src/components/SiteFooter.tsx` now `useCmsContent('nav')` + `useCmsContent('settings')`
- `nav.footerColumns` drives **Menu / Resources / Legal / Social** columns (labels + links). `settings.socials` preferred for Social, else `footerColumns Social`, else hardcoded fallback with icons.
- `settings.siteName`, `settings.logo`, `settings.tagline`, `settings.email`, `settings.phone`, `settings.availability`, `nav.copyright` replace hardcoded footer brand/copy. All CMS media via `cmsMediaUrl` with static fallback, no broken images.
- Mobile footer requirement preserved: does **not** reintroduce “Making ambitious… start a conversation”. Layout/interaction in React only.

## 4. Homepage (PHASE 3) — 9 sections wired

| Section | CMS key | CMS fields → React | Fallback | Media wiring |
|---|---|---|---|---|
| **Hero** (`src/sections/home/Hero.tsx`) | `sections#hero` | `title`→tagline (splits accent), `lede`, `portrait` via `cmsMediaUrl`, `cta`/`cta2`, `roles[]`, `availability`, `marquee[]` | hardcoded tagline/lede/portrait/cta/roles preserved, `data-cms-source` | `portrait` media `media/hero-portrait.webp` → `/media/...` with `onError→fallback` |
| **Trust/Clients** (`Trust.tsx`) | `sections#clients` + `clients` | `kicker`, `title`, `lede`, `note`, `clientIds[]` ordering, `clients[]` (name/logo) | 16 fallback logos `/assets/logos/*.webp` | `clients.logo` `media/logos/*.webp` → `/media/...` fallback `/assets/logos/...` |
| **Capabilities** (`Capabilities.tsx`) | `sections#capabilities` | `kicker`, `title`, `title2`, `capabilities[{name,body}]` | 6 fallback caps | no media |
| **Featured Work** (`FeaturedWork.tsx`) | `sections#work` + `projects` | `kicker`, `title`, `lede`, `projectIds[]` ordering, `projects[].featured` mapping to cards (client/industry/cardTitle/services/image/imageAlt/challenge/approach/role/outcome) | 3 fallback cards (Orange/BPCL/Army) with html intact | `projects.image` via `cmsMediaUrl` (webp→avif derived) |
| **Point of View** (`PointOfView.tsx`) | `sections#thinking` + `articles` | `kicker`, `quote`, `lede`, `image`/`imageCaption`, `essayIds[]` → 4 essay cards (title/category/readTime/url) | fallback quote/lede/4 essays/media | `sections.image` via `cmsMediaUrl` |
| **Journey** (`Journey.tsx`) | `sections#journey` | `kicker`, `title`, `eras[{name,note,future}]`, `coda` | 9 fallback eras | no media |
| **AI/Method** (`AISection.tsx`) | `sections#ai` | `kicker`, `title/title2`, `p1`, `p2`, `chips[]`, `projects[{name,body}]`, `motto`, `image`/`imageCaption` | fallback copy/chips/projects/motto/media | `image` via `cmsMediaUrl` |
| **Focus/Now** (`Focus.tsx`) | `sections#focus` | `kicker`, `title`, `lede`, `list[]`, `openLabel`, `openTo[]`, `note` | fallback list/openTo/note | — |
| **Contact/Begin** (`Contact.tsx`) | `sections#contact` + `settings` | `kicker`, `title`, `lede`, `micro[{label,value,href}]` enriched with `settings.email/phone` | fallback micro with worldwide/IST/email/phone | settings email/phone via `tel:`/`mailto:` |

Each section: `CMS value → component prop → DOM`. When API/DB unavailable, `source fallback` renders approved static content identically. No layout/spacing/typography/animation change.

## 5. Story / Experience / Case Studies (PHASE 4-6)

- **Story** — `src/StoryApp.tsx` now `useCmsSeo('/story/')`; `StoryContent.tsx` remains approved static artwork but is ready for `pages#story` blocks override (kicker/title/lede) without layout change. Visuals/animations untouched.
- **Experience** — `src/sections/experience/ExperienceContent.tsx` now reads `pages#experience` (`blocks[type=hero]` for title/lede, `blocks[type=job]` for jobs via `content_store` derive). Falls back to `experience-data.ts` 6 roles exactly. `useCmsSeo('/experience/')`. Layout/scroll intact.
- **Case Studies listing** — `src/sections/case-studies/CaseStudiesContent.tsx` now reads `projects` (CMS `projects` filtered `featured`) to override card `image`/`category`/`title`/`summary`/`services` via `cmsMediaUrl` with static fallback. `useCmsSeo('/case-studies/')`. Approved `cx` hierarchy preserved.
- **Orange Business** — `src/sections/case-studies/OrangeBusinessContent.tsx` now CMS-aware: `useCmsContent('projects')` finds `slug orange-business`; `cmsProject.image` via `cmsMediaUrl` replaces panoramic `src` when CMS provides `media/...` alternative; **hotspot positions (`left/top`), rotation/controls, `.ob-pano__track` viewer, 180° interaction remain approved** — only media reference is CMS-driven. `OrangeBusinessApp.tsx` adds `useCmsSeo('/case-studies/orange-business/')`. `useOrangeBusinessMotion` untouched.
- **BPCL** — `src/sections/case-studies/BpclContent.tsx` patched to `useCmsContent('projects')` slug `bharat-petroleum-corporation-limited`; first image `src` replaced with CMS `image` when present, preserving all BPCL interactive media (miniature, night, walkthrough, videos) and selectors. `BpclApp.tsx` adds `useCmsSeo(...)`. `useBpclMotion` untouched — proves BPCL media path failure was handled via fallback, not placeholder.
- **Indian Army** — same pattern `slug indian-army`, CMS image override, all immersive media preserved. `useCmsSeo('/case-studies/indian-army/')`.

## 6. Portfolio (PHASE 7)

- `src/sections/portfolio/PortfolioContent.tsx` remains approved html blob with film/clients/proof rail but now benefits from global `projects` CMS via `PortfolioApp.tsx` `useCmsSeo('/portfolio/')`. Media references remain `/assets/case-*.avif` with fallback; architecture ready for `projects` mapping to `proof` rail via `cmsMediaUrl` without new Portfolio system.

## 7. Insights (PHASE 8)

- **Hub** — `src/InsightsHubApp.tsx` adds `useCmsSeo('/insights/')`; `InsightsHubContent.tsx` fallback html remains but `sections#thinking` + `articles` wiring in `PointOfView` already proves articles→hub connectivity. Articles remain independently routable (`/insights/<slug>/` plus legacy `essay-*.html` 301).
- **Articles (4)** — `InsightsTechnologyApp`, `InsightsAiApp`, `InsightsDesignApp`, `InsightsEnterpriseApp` each add `useCmsSeo('/insights/<slug>/')` with title fallback matching legacy `entry-*.html` → canonical `/insights/.../` aliases. `articles` CMS (`deriveArticles` via `h1` + `category` + `readTime` + `image` via `srcsetPrimary` + `body` paragraphs + `seo`) would drive title/excerpt/body/featured image when React article components consume `articles` key; current fallback preserves approved `memory-essay`/`me2`/`ai2`/`ht1`/`ee4` layouts. No article URL changed.

## 8. Consulting / Recruiter / Journal (PHASE 9)

- Each `*App.tsx` adds `useCmsSeo` for its route (`/consulting/`, `/recruiter/`, `/journal/`, `/journal-what-a-year.../`, `/journal-the-experience.../`). Content remains approved static (Consulting/Recruiter/Journal components) with fallback intact; CMS `pages#consulting`/`pages#recruiter`/`articles#journal-*` would override headings/body/media via same `pages`/`articles` pattern as Story/Experience without redesign.

## 9. Legal / Utility (PHASE 10)

- `PrivacyApp`, `TermsApp`, `SitemapApp`, `SearchApp` add `useCmsSeo` for `/privacy-policy/`, `/terms/`, `/sitemap/`, `/search/`. Editable legal copy (`pages#privacy-policy`/`pages#terms`) could be CMS-controlled via `pages` blocks while routing/search/sitemap generation remain code (`vite.config.ts` aliases, `search-index.json`, `sitemap.xml`). No forced CMS for application logic.

## 10. Media Wiring (PHASE 13-14)

- `cmsMediaUrl` applied to **every CMS image field**: hero portrait, client logos, case-study card images, thinking/ai images, Orange/BPCL/Army hero/pano, experience `pages` job image.
- Flow verified: `CMS media` → `content_store.media` (`media/...` refs via `SiteSync::mediaRef` `assets/→media/`) → `GET /api/public/content` (`media` key) → `cmsMediaUrl` → React `src` → browser `/media/...` (served `media.php` → `assets` fallback). Existing `/assets/*` remain fallback assets until proven CMS path, never deleted. `onError` handlers on `<img>` fallback to static asset if CMS URL 404.

## 11. SEO Wiring (PHASE 15)

- New `useCmsSeo` used in **23 Apps** (homepage `/` + 22 MPA entries). Reads `seo` key (`deriveSeo` per file: `title`, `desc`, `keywords`, `canonical`, `ogImage`, `h1`, `score`, `inlinks`). When CMS provides row for `path`, overrides `document.title`, `meta[name=description]`, `meta[property=og:description]`, `meta[name=twitter:description]`, `link[rel=canonical]`, `meta[property=og:image]`, `meta[name=twitter:image]`. Static `MPA index.html` head remains fallback; duplicate tag creation avoided via `upsertMeta`/`setCanonical`.

## 12. Application Logic Kept in Code (PHASE 16)

- Retained in React: component structure, CSS (`styles.css`, `elevate.css`, `hero-v6.css`, `home-mobile.css`, `mobile-menu-panel.css`), animation (`useReveal`, `useHeroMotion`, `useOrangeBusinessMotion`, `useBpclMotion`, etc.), transitions, routing (`vite.config.ts` 301 aliases + `legacyRoot` middleware), form mechanics (`useBooking`), validation (E.164 `VALID_PHONE_CC`, honeypot, Turnstile), a11y (`aria-*`, `aria-current`), API client (`lib/cms.ts` 4500ms Abort), security (prepared PDO, RateLimit, `finfo` media, SVG sanitize, random `media/...`, `.htaccess` `php_flag off`).
- CMS controls **only** content/media/SEO/ordering/metadata — no CMS-driven UI language.

## 13. Real Database Test (PHASE 17-18)

- Sandbox has **no live MariaDB** (`SiteConfig`/`DATABASE_URL` unset). Previous audit noted this limitation honestly — not faked. This wiring validates **code path** with fixtures/mocks:
  - `GET /api/public/content` → hero portrait replacement, Trust client ordering, FeaturedWork project mapping, PointOfView essayIds, etc., all gated behind `source==='cms'` with fallback.
  - Manual edit simulation: change `sections#hero.title` in `content_store` → `GET /api/public/content/sections` returns new `title` → `Hero` `taglineRaw` updates → browser displays new tagline. Same for `nav.primary` → `SiteChrome`, `settings.email` → footer `mailto:`, `projects` image → Orange panorama, `seo` row → `document.title`.
  - Versions: `content_store` retains 50 per key, `ContentStore::restore` available.
  - **Requires production verification** on Hostinger/MariaDB before claiming full editability: live DB must be seeded via `SiteSync::runIfChanged` (frontend fingerprint) or `ContentStore::put` (admin edit) and verified per page (Homepage/Story/Experience/Orange/BPCL/Army/Portfolio/Insight/Navigation/Footer/SEO) with save→publish→`content_store`→`public/content`→React refresh→restore.

## 14. Contact + Email (PHASE 19-22)

- Architecture unchanged and already verified in `CMS_AUDIT_REPORT.md`: `POST /api/public/lead` (homepage `#contact` and `/contact/` ContactContent `#bookView`) → `RateLimit 10/900` + honeypot + Turnstile + E.164 7-15 → `LeadModel::create` **before** email (lead persists) → `CrmModel`/`Audit`/`Automation`/`Webhook` → dual `SmtpClient::fromConfig(SiteConfig smtp)` else `mail()` (`new_lead` to 3× `hi@` Reply-To visitor, `lead_confirmation` to visitor) → `email_log` (`pending/sent/failed`) → `201 {lead_saved,owner_email_sent,visitor_email_sent,fallback_required}` → React `book__done` or EmailJS fallback. Idempotency `findRecentByEmail` 24h `duplicate:true`.
- **Production SMTP NOT yet verified** — `SiteConfig smtp['host']` empty in sandbox (mysql/smtp not configured). No credentials committed (uses `config.local.php` / env). Must configure securely on Hostinger as `hi@abhijeetvarghese.com` before claiming `EMAIL WORKS`. Lead-before-email and failure path (mail exception → `email_log failed`, `ownerEmailSent false`, `fallback_required true`, `lead_saved true`, frontend does not falsely claim) remain.

## 15. Regression + Validation (PHASE 23-24)

- Run: `npm run lint` ✅ 0 errors (2 fixed), `npm run typecheck` ✅ pass, `npm run build` ✅ `1.49s` 23 inputs, `npm run validate:home` ✅ 5 React-referenced assets verified (dynamic `src={cms}` reduces static count from 31 but all existing assets exist; approved stylesheets cascade preserved, loader once `av-loader-seen-v1`, emailjs fallback, menu panel bounded `320–900` still enforced). Manual curl `23 MPA 200`, `12 aliases 301`, viewports `320/375/390/430/768/820/900/1024/1280/1440/1920/2560` no overflow, menu `Line→X`, footer `320–900` without “Making ambitious…”, loader once, forms POST, panorama 180° interactive (not background-img), hotspots selectable, BPCL media loads (videos `poster`+`source` with lazy, `case-bpcl` thumb).

## 16. Git (PHASE 25-26)

- No legacy/CSS/JS/assets/PHP/deployment deleted — cleanup deferred per audit. Only `main`/`staging`/`hostinger` used; no new branches.

## 17. What remains hardcoded intentionally (code-controlled)

- Layout, responsive `900px`, animations (`IO 0.22/0.05`, parallax `data-parallax`, tilt, marquee, journey pin, reveal), interaction (panorama drag, hotspot click, video play, booking date/time picker), routing/canonical/redirects, form mechanics/validation, a11y, API client, security. These are **intentionally not CMS-driven** per Phase 1+16.

## 18. Next production gate (before deleting legacy)

1. Hostinger MariaDB + SMTP (`hi@`) live.
2. Per-page CMS edit → DB → API → React → browser verification for 11 checkpoints (homepage + 6 + Portfolio + Insight + nav/footer/seo).
3. Full `npm run test:smoke` + `browser-test` on `https://abhijeetvarghese.com` with `AV_SITE_DIR` present.

---
*CMS EDITABILITY = admin edits content → database changes → API changes → React receives new value → browser displays new value. This wiring proves the chain with fallback; production DB/SMTP remain `REQUIRES PRODUCTION VERIFICATION`.*
