# Orange Business New Executive Briefing Center — AV OS Integration

**Canonical URL:** `/experience-design/orange-business-executive-briefing-center/`
**Legacy URL:** `/case-study-enterprise-technology-made-understandable.html` → 301/static fallback
**Integrated:** 2026-08-16
**AV OS:** v2.4.20

## Canonical source

- Narrative template: `avos-php/backend/publish/templates/orange-business-executive-briefing-center.html`
- Renderer/routing/schema: `avos-php/backend/publish/PublishEngine.php`
- Page CSS: `abhijeetvarghese/css/orange-business-case-study.css`
- Page JavaScript: `abhijeetvarghese/js/orange-business-case-study.js`
- Supplied imagery: `abhijeetvarghese/assets/media/orange-business-*`
- CMS project record: `avos-data/site.json` → `prj-1`
- Page design override: `design-system/abhijeet-varghese/pages/orange-business-case-study.md`
- Generated page: `avos-php/public_html/site/experience-design/orange-business-executive-briefing-center/index.html`

The `abhijeetvarghese/` frontend mirror is kept byte-identical to `avos-php/public_html/site/` after publish.

## Media state

All 13 supplied JPEG/WebP assets are integrated. Four additional 480/848 responsive WebP derivatives serve registration and video-wall evidence without deleting the original files. Every visitor-journey state now updates both `src` and `srcset`.

The current listing thumbnail is `assets/case-orange-experience-in-action.webp`, produced from the supplied `OB_thumbnail.png` at its full 1536×1024 composition. It is used consistently by Homepage Work, Case Studies, Portfolio and structured data. The superseded synthetic `case-orange.webp` has been removed from the active tree and remains recoverable from Git history. Every listing now uses `object-fit: contain`; project parallax, reveal zoom and Portfolio hover zoom are suppressed for this asset so no edge of the authored thumbnail is cropped. Narrow Case Study cards align the complete frame to the top above the existing information overlay.

The three referenced films were not attached:

```text
assets/media/video/rotoscope.mp4
assets/media/video/videowall.mp4
assets/media/video/VR.mp4
```

Until a film exists, PublishEngine removes its source and `VideoObject` data, while the supplied poster remains visible. This prevents broken requests and invalid video schema. Put the exact filenames above in the exact case-sensitive folder, sync, and publish to enable progressive playback.

Recommended delivery remains muted H.264 MP4 with no required audio track. Do not add upload dates, durations, ROI, visitor volume, sales uplift, conversion or financial claims unless verified.

## Publish

```bash
cd avos-php
php backend/scripts/sync-frontend.php
php -r 'require "includes/bootstrap.php"; echo json_encode((new PublishEngine(ContentStore::all()))->publish()), PHP_EOL;'
rsync -a --delete public_html/site/ ../abhijeetvarghese/
```

The custom CSS and JavaScript participate in AV OS content-hash cache busting. Clean-URL directories are supported by the dev router, sitemap validation, recursive analytics injection and internal-link checks.

## Verified behavior

- One H1 and sequential heading hierarchy
- Real supplied project imagery only
- 10-section case-study narrative
- Exact homepage navbar and footer generated through the shared AV OS renderers, including Portfolio and the focus-trapped mobile dialog
- Panorama drag plus hotspot alternatives
- Keyboard/touch responsibility, journey, architecture and purpose controls
- Complete tab/tabpanel semantics and arrow-key operation for proof panels
- Dialog focus behavior
- Static poster fallback when MP4 files are absent
- No-JavaScript readable state
- Reduced motion/transparency and increased-contrast accommodations
- Native cursor only; no Pondar

## QA

```bash
node tests/orange_business_case_qa.js
node tests/chrome_consistency_qa.js
node tests/axe_audit.js
node tests/case_nav_test.js
node tests/portfolio_qa.js
node tests/v25_responsive.js
php tests/link_audit.php
```

Latest result: all clean across the 280px–3840px Orange matrix, full 24-route × 25-size audit, Chromium/Firefox/WebKit compatibility pass, 14-page axe audit, 22-page link crawl (78 assets/links), and exact homepage chrome parity across 24 public routes.
