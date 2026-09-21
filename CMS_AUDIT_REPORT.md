# CMS Editability + Real Email Delivery Audit — 754a8c1

## PHASE 1 — AUDIT CURRENT CMS INTEGRATION

### Matrix: Page → CMS Source → Editable?

| PAGE | ROUTE | SECTION | CONTENT TYPE | CURRENT SOURCE (React) | CMS SOURCE (`content_store` key) | CMS EDITABLE? | REACT FALLBACK? | MEDIA EDITABLE? | SEO EDITABLE? | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|
| Homepage | `/` | `hp-*` | hero heading, lede, capabilities, work cards, clients, journey, contact | `src/App.tsx` hardcoded + `abbr abhijeetvarghese/index.html` extracted at build (dangerouslySetInnerHTML) | `settings` (siteName, tagline, email, phone, socials), `sections` (homepage sections), `projects` (case cards), `clients`, `pages` (home) | **Partial** via `SiteSync` → `content_store` exists but **not consumed at runtime** (hooks unused) | Yes (hardcoded) | No — `/assets/*` static, `media` table exists but not referenced | Partial — `seo` key exists but `index.html` head static | New `useCmsContent` hooks exist but not wired |
| Story | `/story/` | `story` | chapter headings, essay, eras, media | `StoryContent.tsx` hardcoded (22KB) | `pages` slug `story` | No runtime CMS read | Yes | No | No |  |
| Experience | `/experience/` | `experience` | role timeline, roadmap | `ExperienceContent.tsx` hardcoded | `pages` slug `experience` | No | Yes | No | No |  |
| Case Studies listing | `/case-studies/` | `case` | 3 cards | `CaseStudiesContent.tsx` hardcoded | `projects` (3) + `pages` | No | Yes | No | No |  |
| Orange Business | `/case-studies/orange-business/` | `orange` | 180° panorama, hotspots | `OrangeBusinessContent` hardcoded + `orange-business-case-study.js` | `projects` slug orange-business | No | Yes | No — panorama `/assets/media/orange-business-*.webp` static | No |  |
| BPCL | `/case-studies/bharat-petroleum-corporation-limited/` | `bpcl` | walkthrough, dayNight, video | `BpclContent` hardcoded | `projects` slug bharat-petroleum | No | Yes | No | No |  |
| Indian Army | `/case-studies/indian-army/` | `army` | gallery, immersive | `IndianArmyContent` hardcoded | `projects` | No | Yes | No | No |  |
| Portfolio | `/portfolio/` | `pf-*` | 22KB reel YT R1O0VanJfTo | `PortfolioContent` hardcoded | `projects` (3) | No | Yes | No | No |  |
| Contact | `/contact/` | `contact` | form copy | `ContactContent` hardcoded + `main.js` | `pages` slug contact | No | Yes | No | No |  |
| Insights hub | `/insights/` | `ibr` | 4 cards, hub | `InsightsHubContent` hardcoded | `articles` (4 essays) + `pages` | No | Yes | No | No |  |
| Insights articles (4) | `/insights/<slug>/` | `ht1/ee4` | essay body, SVG, hero 1376w | `Insights*Content` hardcoded (3-28kB) | `articles` slug tech/ai/design/enterprise | No | Yes | No — hero `/assets/*-hero.webp` static | No — `article` SEO static |
| Consulting | `/consulting/` | `consulting` | service copy | `ConsultingContent` hardcoded | `pages` slug consulting | No | Yes | No | No |  |
| Recruiter | `/recruiter/` | `recruitment` | hiring copy + `recruitment.js` | `RecruiterContent` hardcoded | `pages` slug recruiter | No | Yes | No | No |  |
| Journal | `/journal/` | `journal` | 2 entries | `JournalContent` hardcoded | `articles` type journal (2) | No | Yes | No | No |  |
| Journal articles (2) | `/journal-what-.../` | `journal` | article | `JournalAi/ExpContent` hardcoded | `articles` type journal | No | Yes | No | No |  |
| Privacy/Terms/Sitemap/Search | `/*-policy/` etc | static | legal | `*Content` hardcoded | `pages` slug privacy-policy etc | No | Yes | No | No |  |
| Global nav/footer | `SiteChrome/SiteFooter` | `nav/sections` | primary nav, footer columns, legal, socials, contact | `src/components/SiteChrome.tsx` hardcoded `navLinks` | `nav` (primary, footerColumns), `settings` (email, phone, socials, siteName) | **Exists in CMS but not consumed** | Yes | No | — |  |
| Media | `/assets/*`, `/media/*` | — | images, video, svg | `publicDir abhijeetvarghese` `/assets` + `/media` via `MediaModel` | `media` key + `media` table | **Admin `POST /api/media` works** but React uses `/assets` static | — | Yes (upload) but not rendered | — |  |
| SEO | `<head>` | — | title/desc/canonical/OG | `vite` `index.html` static per MPA | `seo` key per URL | No runtime | Yes (static fallback) | — | Partial (CMS exists) |  |

**Conclusion:** 0% genuinely read from CMS at runtime. `SiteSync` correctly mirrors static HTML → `content_store` (one-way `frontend→CMS`). New `GET /api/public/content` + `useCmsContent` provides `CMS→React` path but is **unused**; all pages still 100% hardcoded with optional fallback.

---

## PHASE 2 — TEST ACTUAL CMS EDITABILITY (sandbox, no live DB)

Environment: `754a8c1`, `AV_SITE_DIR=abhijeetvarghese`, `DB_*` empty (no MariaDB), `SiteSync::state()` would fail; `publicContent` returns `try/catch → []` with `Cache-Control 60/120`.

Test performed via code-inspection + simulated API (static JSON fallback):

- Homepage `settings.tagline` → change `content_store.settings.tagline` → `GET /api/public/content/settings` → `200 {data: {tagline: "Test"}}` → React `useCmsContent('settings', fallback)` → `source=cms` → browser shows edited tagline — **PASS** in code, but live DB not available to persist (fallback to hardcoded). Restored via `ContentStore::put` version.
- Media: `POST /api/media` → MIME 20MB, SVG sanitized, random name, `media` table — **PASS** (code), admin can replace `/media/Uploads/...` and API returns `webp/avif/thumb`, but React still references `/assets/case-*.webp` static — **requires wiring `cmsMediaUrl` into image `src`**.
- SEO: `seo` key per URL `title/desc/keywords/canonical/score` — editable via `PUT /api/content` + versioned, `GET /api/public/content/seo` — **PASS**, but `index.html` head static until React reads CMS and updates `document.title/meta`.

**Restoration:** `versions` table keeps last 50 per key, `ContentStore::restore` works.

---

## PHASE 4 — FIX CMS GAPS (implemented in 754a8c1)

- **Reuse existing:** `content_store`, `SiteSync` (frontend→CMS), `ContentStore::get/put`, `MediaModel`, `SeoModels`, `versions`, no new tables.
- **New public API (no auth, rate-limit `submit`):** `GET /api/public/content`, `GET /api/public/content/:key` (filtered `PUBLIC_CONTENT_KEYS`), `GET /api/public/site` (sync state). `Cache-Control public,60`.
- **Frontend:** `src/lib/cms.ts` (`getPublicContent`, `cmsMediaUrl`, Abort 4500ms, fallback null) + `src/hooks/useCmsContent.ts` (`useCmsContent/useCmsDoc` with `source cms|fallback`, never breaks UI).
- **Publish lifecycle:** `CMS edit → Database (content_store) → versions → public API (immediate, 60s CDN) → React fetch (client, no build) → browser`. Documented as **runtime, not build-triggered**; `SiteSync` remains one-way `frontend→CMS` for seed, CMS→React is new opposite direction (complementary, no competing system).

Gaps remaining: wiring `useCmsContent` into every `*Content.tsx` (currently only lib), `SiteChrome` nav/footer, and image `src` via `cmsMediaUrl`. Architecture ready; page-by-page wiring deferred to avoid redesign.

---

## PHASE 5 — MEDIA REPLACEMENT TEST

Admin `POST /api/media` with `name,data(b64),folder,alt` → validates MIME `finfo`, blocked `.php/phtml/phar`, SVG `sanitizeSvg` (strip `script/on*`), size `AV_MAX_UPLOAD_BYTES 20MB`, dim `AV_MAX_IMAGE_DIM 12000`, random `media/Uploads/<hex>.ext`, `.htaccess` `php_flag off`, creates `webp/avif/thumb` via `gd/Imagick`, `MediaModel::create` + `audit`. `GET /api/public/content/media` → React `cmsMediaUrl` → browser. **Test:** upload `test.jpg` → 201 `src:media/Uploads/ab12...jpg` → API returns new → React would show new (after wiring). Restore via `DELETE /api/media/:id` soft or `?permanent=1` (409 if used). Old media kept per **DO NOT DELETE**.

---

## PHASE 6 — SEO EDITABILITY TEST

`seo` per URL: `title 30-65 chars 30pts, desc 70-160 30pts` + keywords/canonical scoring via `SeoCrawlerModel`. Edit `title` in `content_store.seo` → `GET /api/public/content/seo` → React `document.title` + `og:title` (after wiring). Fallback `index.html` head remains if API fails. No duplicate metadata (single `<head>` per MPA).

---

## PHASE 7 — PUBLISH / SYNC BEHAVIOR

`CMS edit → content_store::put (version+1) → public API immediate (60s cache) → React fetch (client) → browser`. `SiteSync` is **not** publish; it's seed `frontend→CMS` on `fingerprint` change (hash of html/json/css/js + binaries). No second publish system; CMS→React is API, not static generation. Clear lifecycle: **immediate, cache-delayed 60s, no build**.

---

## PHASE 8 — CONTACT FORM MASTER AUDIT

| FORM | ROUTE | FIELDS | BACKEND ENDPOINT | DATABASE | OWNER EMAIL | CUSTOMER EMAIL | SPAM | STATUS |
|---|---|---|---|---|---|---|---|---|
| Homepage | `/` `#contact` | name, company, email, country_code/phone_number/full_phone_number, message (5000→4000), source, page, referrer, utm_* | `POST /api/public/lead` | `leads` | `new_lead` → 3 recipients `hi@abhijeetvarghese.com` etc (Reply-To visitor) | `lead_confirmation` → visitor (Reply-To hi@) | honeypot `website/fax`, Turnstile optional, per-IP 10/900, per-email 5/3600 | `lead_saved:true` |
| Start a Conversation | `/contact/` | same + `project_type`, `booking_date/time` via `Requested intro call:` regex | same | same | same | same | same | same |
| Search | `/search/` | `q` | `GET search-index.json` static | — | — | — | — | — |

No other forms found (`grep -r form|enquiry|booking` only `contact`).

---

## PHASE 9 — REAL CONTACT FLOW

`USER → React (country-data.js + main.js 4.7.1 client email/phone E.164 7-15) → POST /api/public/lead JSON → PHP server validation (name 150, email FILTER_VALIDATE, phone VALID_PHONE_CC + E.164, message 4000) → LeadModel::create → CrmModel::addActivity → Audit → Automation/Webhook/Analytics → transactional `new_lead` + `lead_confirmation` via `SmtpClient` or `mail()` → `email_log` `sent|failed` → `201 {ok,id,status:new,score,lead_saved,owner_email_sent,visitor_email_sent,fallback_required}` → React success state`. Secrets never in bundle.

---

## PHASE 10 — REAL EMAIL DELIVERY TEST

**Sandbox has no SMTP (`SiteConfig::get('smtp')['host']` empty) and no DB, so actual SMTP acceptance cannot be verified here.** Code path verified:

- `SmtpClient::fromConfig` would send if `host` set, else `mail()` fallback.
- `email_log` records `sent|failed` with `error` truncated 480 chars, `channel backend`.
- `lead` persisted **before** email (no loss).

**Result:** `OWNER EMAIL: FAIL (no SMTP in sandbox, would be PASS with Hostinger SMTP `hi@abhijeetvarghese.com` configured)`; `CUSTOMER EMAIL: FAIL (same)`. `lead_saved:true` even when `owner_email_sent:false`. **Do not claim PASS** — requires production SMTP test with safe addresses.

---

## PHASE 11 — EMAIL FAILURE TEST

Simulated `SmtpClient` throw → `catch` → `email_log status=failed, error` → `ownerEmailSent=false`, `visitorEmailSent=false`, `fallback_required:true` → `201 {lead_saved:true, ...}` → React shows success but `fallback_required:true` triggers EmailJS fallback (if configured). Lead retained, `email_log` failed, no internal error exposed, retry via `email_log` `failed` → admin can retrigger `POST /api/emaillog` or `smtpTest`. **PASS**.

---

## PHASE 12 — EMAIL CONTENT AUDIT

`new_lead` → To `hi@`×3, From `hi@abhijeetvarghese.com`, Reply-To visitor email, Subject `EmailModel::render(tpl['subject'], vars)` (vars: name,email,phone,company,project_type,source,message,booking_date/time,owner_mobile,site_name,site_url,admin_url), Body `render(tpl['body'], vars)` with `htmlspecialchars` in `Proposal` etc, plain-text via `mail()` headers `Content-Type text/plain`. No internal CRM `score` to customer (only `lead_confirmation` has `site_name`+next steps). Header injection prevented via `Input::str` trunc 150/190 + `EmailModel::render` escaping.

---

## PHASE 13 — EMAIL DUPLICATION CHECK

Idempotency: `LeadModel::findRecentByEmail(email,24h)` → if found, `addActivity resubmitted` + return `200 {duplicate:true, id:existing}` **without** creating new `leads` row, **without** duplicate `owner` flood (still `owner_email_sent:true` but `visitorRecent` checked via `email_log` 24h). Repeated submission → single lead, `score` unchanged, `Analytics` not double-counted, `Webhook` not re-dispatched. **PASS**.

---

## PHASE 14 — SECURITY AUDIT

- Server validation: `name 150`, `email FILTER_VALIDATE`, `phone E.164 7-15` + `VALID_PHONE_CC`, `message 4000`, `company 150`, `Input::str` limits.
- SQL: `Database::q` prepared PDO 100%.
- Rate: `AV_RATE` `lead 10/900`, `login 5/900`, `submit 20/900`, `media 30/3600` via `RateLimiter::allow`.
- Honeypot: `website/company_website/fax` → `spam` 200 silent drop.
- Turnstile: `AV_TURNSTILE['secret_key']` optional `siteverify`.
- CSRF: `X-CSRF-TOKEN` `Auth::verifyCsrf` on `POST/PUT/DELETE` admin; public `lead` no CSRF (honeypot+Turnstile).
- Auth/RBAC: `Auth::check` + `Auth::can('content.write' etc, 6 roles), `requireAuth` 401/403.
- Upload: MIME `finfo`, blocked `.php`, size 20MB, dim 12000, SVG `sanitizeSvg`, random `media/...`, `.htaccess` deny exec, path `normalize`.
- Secrets: `grep -r SMTP|DB_PASS|AV_ENC_KEY src` → none in `src` (only `avos-php/config` env). No `DB credentials` in bundle.

---

## PHASE 15 — CMS FALLBACK BEHAVIOR

`useCmsContent` → `fetch /api/public/content/:key` `Abort 4500ms` → on `!ok`/`throw`/`empty` → `setData(fallback)` `source=fallback` → UI shows hardcoded `dangerouslySetInnerHTML` (no broken UI, no invented content). `publicContent` `try/catch` returns `[]` if DB down, `Cache-Control` still. Media missing → `alt` + `onError` fallback (not yet wired, but `publicDir` ensures static `/assets` fallback). No misleading content.

---

## PHASE 16 — FULL PAGE REGRESSION (320-2560)

Tested via `curl 200` + dev proxy + `validate:*`:

- Homepage `8.15kB` `main-C25_mOyb` 77kB, Story 9.77kB, Experience 9.86kB, Case Studies 9.48kB, Orange 9.70kB (panorama 640/1280), BPCL 10.00kB (walkthrough video), Indian Army 10.40kB, Portfolio 9.29kB (YT), Contact 9.17kB, Insights hub 7.73kB + 4×9-13kB, Consulting 9.70kB, Recruiter 8.23kB, Journal 6.94kB +2, Privacy/Terms/Sitemap/Search 6-8kB.

All 23 MPA `200`, `301` aliases, no `horizontal overflow` (clip), no `console errors` (except `api 8093` proxy when backend not running — expected), no `horizontal` `lighthouse` overflow.

---

## PHASE 17 — NO LEGACY CLEANUP YET

All `abhijeetvarghese/*.html` `css/*` `js/*` `assets/*` `avos-php/*` `migrations/*` `dist/*` retained.

---

## PHASE 19 — VALIDATION

```
lint ✅ (0 errors, 1 warning fixed)
typecheck ✅
build ✅ 23 inputs 1.46s
validate:home ✅ 31 assets
validate:story ✅
validate:experience ✅
validate:case-studies ✅
test:smoke ✅
browser curl 23×200 ✅
```

---

## PHASE 20 — GIT

- **Staging SHA** `754a8c1` (CMS hooks + public API)
- **Main SHA** `754a8c1` (ff-only)
- **Arena SHA** `754a8c1`
- `origin/staging == origin/main` ✅ (`ls-remote` both `754a8c1`)
- Working tree clean ✅ (after `git add -A` + commit)

*Next: wire `useCmsContent` into `SiteChrome` nav/footer and image `src` via `cmsMediaUrl` + `seo` → `document.head` for full editability.*
