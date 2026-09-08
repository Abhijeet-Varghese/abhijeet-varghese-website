# BPCL Integration + Site-Wide URL/Naming Standardization — Implementation Plan

Source of truth: repo `abhijeetvarghese/` (the served static site, mirrored byte-identical
to `avos-php/public_html/site/`). Work is done at the **static layer** per the "do not touch
CMS/backend/AV OS" rule. PHP is not installed, so PublishEngine cannot run here — the static
pages are edited directly and the publish caveat is documented.

## A. Canonical URL architecture

```
Experience                 /experience/                     (kept separate; not case studies)
Case Studies              /case-studies/
  Orange Business         /case-studies/orange-business/
  Bharat Petroleum Corp Ltd /case-studies/bharat-petroleum-corporation-limited/
  Indian Army             /case-studies/indian-army/
```

Clean-URL dirs (`index.html`), matching the existing `experience-design/orange-business-executive-briefing-center/` precedent.

## B. Legacy → canonical redirects (no chains)

| Legacy | → Canonical |
|---|---|
| `/case-study-intuitive-experiences-for-industrial-environments.html` | `/case-studies/bharat-petroleum-corporation-limited/` |
| `/case-study-immersive-solutions-for-the-indian-army.html` | `/case-studies/indian-army/` |
| `/case-study-enterprise-technology-made-understandable.html` | `/case-studies/orange-business/` |
| `/experience-design/orange-business-executive-briefing-center/` | `/case-studies/orange-business/` |
| `/case-studies.html` | `/case-studies/` |
| `/experience.html` | `/experience/` |
| `/experience-design/bpcl-palakkad/` | `/case-studies/bharat-petroleum-corporation-limited/` (safety) |

Implemented as `.htaccess` 301 rules (Apache) + static `<meta http-equiv=refresh>`/`location.replace` fallback stub pages (so direct loads work on any host), each pointing straight to the canonical target.

## C. BPCL page — global design-system integration

- Uses **global chrome**: `.site-nav` header + `.footer--arena` footer, loading `css/styles.css`, `css/tokens.css`, `js/main.js`.
- Adds a **case-study scoped module**: `case-studies/bharat-petroleum-corporation-limited/style.css` + `app.js`, self-contained assets under the page dir (so no collision with the global asset tree).
- Re-themes the immersive experience (miniature viewer, day/night, blueprint viewer, walkthrough, close-ups) to the site's palette (`#080F22`, `#6EA8FF` azure, `#F7F5EF` paper, `#0C1330` text) and typography (Inter Tight / Instrument Serif). Preserves ALL content, imagery, interactions, sequencing.
- User-facing name is **“Bharat Petroleum Corporation Limited”** everywhere. No visible “BPCL”; the abbreviation only remains in internal file paths / JS identifiers / alt-safe tech names.

## D. Full-name naming pass (user-facing)

Replace visible “BPCL” → “Bharat Petroleum Corporation Limited” in: listing cards (Case Studies, Home/Work, Portfolio), page title, meta/OG/JSON-LD, breadcrumb, sitemap, search-index, and the BPCL page itself. Filenames (`case-bpcl.webp`, `bpcl-case-study.js`) may keep the abbreviation internally.

## E. Files

- **Replaced:** 3 legacy case-study `.html` pages → clean-URL dirs; `case-studies.html`, `experience.html` → redirects.
- **Added:** `case-studies/` listing + 3 case-study dirs + BPCL assets + BPCL css/js.
- **Modified for integration:** nav, footer, all internal links, `sitemap.xml`, `sitemap.html`, `search-index.json`, `robots.txt`, `.htaccess`, `og`/canonical/JSON-LD metadata.
- **Not touched:** CMS content store, PublishEngine, DB, APIs, AV OS, unrelated project pages.

## F. Verification

Static link crawl of all pages; asset crawl; `node --check` on all JS; Playwright render of `/`, `/case-studies/`, `/experience/`, and all 3 canonical case-study URLs at desktop + mobile; console-error + overflow checks; broken-asset crawl; confirm no visible “BPCL”.
