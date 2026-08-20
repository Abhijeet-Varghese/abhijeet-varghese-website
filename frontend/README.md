# AV OS — React + TypeScript + Vite frontend (MPA · static build)

Migration of the hand-authored HTML/CSS/JS frontend to React + TypeScript + Vite,
preserving the **exact** current design, palette (Deep Navy / Warm Paper / Azure),
typography (Inter Tight + Instrument Serif), and PHP + MariaDB backend.

## Principles

- **Architecture upgrade, not a redesign.** The production site is the visual
  source of truth. Content, colors, type, motion and UX are ported 1:1.
- **MPA, not an SPA.** Every public route is its own statically-generated HTML
  entry (Vite `rollupOptions.input`). Existing URLs are preserved.
- **Real HTML at build time.** A build-time SSR step (`scripts/prerender.mjs`)
  renders each route with `react-dom/server`, so the published HTML contains
  crawlable content — never a blank `#root`. Hydration adds interactivity.
- **PHP stays the backend.** All dynamic data (contact, availability, booking,
  auth, admin, AI, analytics) remains a PHP/`/api/*` call. No secrets in the
  frontend.

## Commands

```bash
npm install
npm run dev          # Vite dev server
npm run build        # vite build (client) + SSR build + prerender → dist/
npm run preview      # serve dist/ statically
npm run typecheck    # tsc --noEmit (strict)
```

`npm run build` is deterministic and produces a fully static `dist/` (HTML, CSS,
JS, assets) — no Node runtime required in production.

## Layout

```
frontend/
  index.html                # homepage HTML entry (<!--HEAD-->/<!--APP--> markers)
  src/
    entry-client.tsx        # hydration entry (reads data-page)
    entry-server.tsx        # build-time renderer (renderPage → head + body)
    pages/                  # one dir per route; pages/index.ts = route registry
    sections/home/          # homepage section components
    components/
      chrome/               # Nav, Footer, SkipLink, Progress, SocialIcon
      booking/ContactBook.tsx   # custom calendar + lead form
      Layout.tsx, Arrow.tsx
    content/                # typed content (chrome.ts, home.ts, seo.ts)
    lib/                    # scroll.ts (reveal/parallax/progress), nav-origin.ts, analytics.ts
    types/                  # shared domain types
    styles/
      tokens.css            # design tokens + chapter themes (locked palette)
      base.css              # @font-face + reset + base + layout
      styles.css            # components + pages (ported verbatim)
      app.css               # entry (@import tokens → base → styles)
  scripts/prerender.mjs     # static generation (route manifest lives here)
  public/assets/            # images, fonts, logo, resume (copied from production)
```

## Content pipeline

MariaDB/CMS → PHP snapshot → JSON → Vite build → static HTML. The frontend
consumes a typed snapshot (`src/content/*.ts`); privileged data (drafts, users,
leads, OAuth tokens, keys) is never part of the snapshot.

## Booking / contact

- `POST /api/public/lead` — form submits here (never redirects to Calendly).
- Fields: Name · Mobile Number · Email · Message · Calendar (date) · Time Slot ·
  Submit. No Organization field.
- Booking is a **request** (pending approval): the confirmation reflects the
  admin-approval workflow; it never falsely confirms a slot.
- Calendar is rendered client-side (lazy, no critical-path cost).
