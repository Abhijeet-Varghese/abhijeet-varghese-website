# AV OS — CMS

Admin SPA at `/admin/` (login → `app/`). Every screen reads/writes the real API — no localStorage
pretends to be a database. Save states are explicit: **DATABASE SAVED · OFFLINE LOCAL DRAFT · SAVE
FAILED · PUBLISHING · PUBLISHED**.

## Content model

`content_store` holds JSON documents per area: `settings`, `nav`, `sections` (homepage), `pages`,
`projects` (case studies), `articles` (essays/journal), `clients`, `testimonials`, `downloads`,
`forms`, `seo`, `media`, `analytics`, `availability`.

Every `ContentStore::put()` creates a **version** in `versions` (50 kept per entity) — view/restore
from the Versions screen; restoring never destroys history.

## Screens (nav groups)

- **Dashboard** — real stats (visitors/pageviews/leads/meetings 30d), system health, content-health
  score, traffic chart, upcoming meetings, pipeline, recent audit activity, content status.
- **Build** — Homepage builder (9 sections, reorderable), Pages, Navigation, Projects (case study
  editor), Case Studies, Clients, Thinking, Journal, Future Lab.
- **Business** — CRM Pipeline (opportunity stages), Contacts, Companies, Meetings, Business Projects
  (+milestones/documents), Proposals (preview, PDF export, status tracking), Campaigns (UTM manager),
  Automations (+ run-inactivity sweep).
- **Grow** — Media DAM (upload, alt text, usage, where-used), Downloads, Testimonials, Speaking,
  Forms (+ export), Bookings, Leads (scoring, UTM attribution), SEO center (real content-health
  audit + AI-assisted metadata), Analytics (first-party).
- **Intelligence** — AI Studio (real provider chat, usage charts, SEO assistant), AI Copilot
  (tool router), Knowledge, Design System (reference brand tokens — the site's CSS is authored in `css/styles.css`).
- **System** — Website (static-site status + SEO crawl), Versions, Users, Email Templates (+test),
  Notifications, Platform (webhooks, API keys, feature flags, knowledge, errors, email log, sites),
  Health, Security, Settings, Backups (create/list/restore/download/delete), Integrations, Logs.

## Page builder / case study builder

Pages and case studies are structured content: sections/blocks with typed components (hero, prose,
image, gallery, stats, quote, CTA, …). They are **working data** for the CRM, SEO tools, proposals and
agents. The public website is the hand-authored static frontend (`abhijeetvarghese/`) — it is not
rendered from this content. See `docs/static-frontend.md`.

## SEO

Per-entity `seo {title, desc, keywords, og_image}`. SEO center: content-health audit (missing titles,
descriptions, alt text, duplicates, stale/thin content) with a live score, AI-assisted generation
(draft → human save). The technical crawl (`POST /api/seo/audit`) audits the static site's HTML;
`sitemap.xml` + `robots.txt` ship with the frontend.

## Design system

Intelligence → Design System: accent color, radius, shadow, spacing, container width, fonts — a
reference/preview of the brand tokens. The website's CSS lives in `abhijeetvarghese/css/styles.css`
and is edited directly; the tokens are documentation, not a build input.
