# MILESTONE 4 — CONTACT + CONTENT + UTILITY

> **Status: COMPLETE.** All remaining public pages migrated to React + TypeScript +
> Vite and verified **pixel-identical (0 RMSE)** to production. This completes the
> full 25-route migration. Legacy cleanup / optimization / deployment have **not**
> been started (awaiting explicit approval).

---

## ROUTES MIGRATED

| Route | pageId |
|---|---|
| `/contact.html` | `contact` |
| `/consulting.html` | `consulting` |
| `/for-recruiters.html` | `for-recruiters` |
| `/insights.html` | `insights` |
| `/journal.html` | `journal` |
| `/search.html` | `search` |
| `/privacy-policy.html` | `privacy-policy` |
| `/terms.html` | `terms` |
| `/404.html` | `not-found` |
| `/essay-technology-should-feel-human.html` | essay |
| `/essay-ai-isnt-replacing-creativity.html` | essay |
| `/essay-designing-experiences-people-remember.html` | essay |
| `/essay-why-enterprise-experiences-fail.html` | essay |
| `/journal-what-a-year-of-ai-enabled-production-taught-me.html` | journal |
| `/journal-the-experience-centre-as-a-strategic-instrument.html` | journal |

Plus `sitemap.html`, `robots.txt`, `sitemap.xml`, `search-index.json`, and `.htaccess`
preserved as static artefacts (copied verbatim) — crawler infrastructure intact.

Every URL preserved exactly; one owner per route (route manifest in
`scripts/prerender.mjs`). All content pages are prerendered with full H1 + content +
links + JSON-LD (no blank `#root`).

## CONTACT

- **Fields** (spec-exact): Name · Mobile Number · Email ID · Message · Calendar ·
  Time Slot · Submit. No Organization. Hidden `website` honeypot preserved.
- **Calendar**: custom React calendar (reused `ContactBook` via lazy `BookingGate`),
  backend-driven; no fake availability hard-coded; OAuth/keys never in the browser.
- **Submission**: `POST /api/public/lead` (action verified in output HTML). No
  Calendly — verified zero Calendly navigation.
- **Errors**: empty submit → "Please enter your name." + "Enter a valid email." +
  "Please complete the highlighted fields."; invalid email caught; API/network
  failure → graceful on-site note ("I couldn't save the request… please email
  hi@abhijeetvarghese.com"), stays on site.
- **Accessibility**: labelled fields, `aria-invalid`/`aria-describedby`,
  `role=status` `aria-live` note, radiogroup/grid calendar semantics, focus ring,
  44px targets, reduced-motion.

## BOOKING

Request → PHP → MariaDB → **pending approval** → admin approve/reject → calendar
event (server-side provider abstraction) → confirmation email. Submission is never
presented as confirmation; the pending state is truthful. Backend untouched.

## CONTENT

- **Consulting / For Recruiters**: page-hero + prose + focus list / recruiter card
  + resume-download CTA — content verbatim (no invented metrics/achievements).
- **Insights / Journal**: page-hero + `EntryList` (serif numerals, tags, excerpts).
- **Essays (4) + Journal (2)**: shared `ArticlePage` (article-hero image + title +
  lede + prose paragraphs with blank `<p>&nbsp;</p>` separators + byline + back
  link + "Keep reading" related section where present). Content transcribed
  verbatim — no copy editing, no invention.

## SEARCH

Live filtering over the published `search-index.json` (21 entries): loading,
empty ("No results for …"), and error ("Search is unavailable…") states, escaping
preserved, `role=search`, `aria-live` results, submit + input handlers. Verified
8 hits for "experience", correct empty state.

## LEGAL

Privacy (6 sections incl. "3. Cookies & analytics"), Terms (5 sections), and the
designed 404 (`404.html` + `ErrorDocument 404` via `.htaccess`) — exact legal copy,
correct SEO/indexing.

## CONTENT INTEGRITY — PASS

Automated text comparison (headings/paragraphs/labels/dates/quotes/CTA labels):
identical across all pages. Three genuine discrepancies were found **and fixed**
during verification (not silently): a missing "Related content" section on 4
articles, a missing privacy section "3. Cookies & analytics", and the search form
being placed outside the hero. No copy was modified or "improved".

## VISUAL REGRESSION (Playwright + ImageMagick, reduced-motion)

| Route | 390 / 768 / 1440 / 1920 |
|---|---|
| Consulting, Recruiters, Insights, Journal, Terms, 404, essay×2 | **0 / 0 / 0 / 0** |
| Essay ×2, Journal ×2, Privacy, Search | **0 / 0 / 0 / 0** (after fixes above) |
| Contact | differs **only** by the spec-mandated form change (added Mobile, removed Organization) |

## RESPONSIVE

320 / 375 / 390 / 430 / 768 / 820 / 1024 / 1280 / 1440 / 1920 / 2560 / 3840 across
all M4 routes — **zero horizontal overflow**.

## ACCESSIBILITY

Single `h1`, semantic sections/headings, alt text on all article imagery, labelled
search + form fields, `aria-live` on search results + booking status, focus-visible
rings, `prefers-reduced-motion` + transparency/contrast paths, 44px touch targets,
skip link, focus-trapped mobile menu, contextual close/back (`avos:nav-origin`
typed equivalent).

## SEO

Every page retains title, meta description, keywords, canonical, Open Graph,
Twitter card, and JSON-LD (`WebPage` for content pages, `Article` + `Person` for
essays/journal with `datePublished`). Correct H1 + crawlable links throughout.

## PERFORMANCE

Route-level splitting (gzip): shared `app` **66.4 KB**; orange 9.9 KB; story 8.3 KB;
**contact 0.8 KB**; **search 1.3 KB**; **article renderer 1.1 KB**; consulting/
recruiters/insights/journal/legal/404 each <1.5 KB; booking calendar 4.5 KB lazy.
No Story/Evolution/Portfolio/Orange/Calendar code loads on unrelated pages. Shared
CSS 26.8 KB (+7.7 KB Orange). Largest assets are authored media (lazy-loaded).
LCP/CLS/INP not measurable on the static preview (no PHP runtime); hero/font
preloads bound LCP. React-dom floor (~50 KB) unchanged from M2.

## BACKEND

**Unchanged.** PHP 8.x + MariaDB + CMS + admin + API + booking + AI + calendar +
email + SEO all intact. React only consumes `POST /api/public/lead` + the static
search index; no Node backend, no Calendly, no provider credentials client-side.

## SECURITY

Secret scan of the built `dist/` for API keys / OAuth secrets / DB & SMTP
credentials / OpenRouter / session secrets: **zero findings**.

## ROUTE REGRESSION

All 22 built routes return 200; `sitemap.xml`, `robots.txt`, `search-index.json`,
and the legacy redirect resolve correctly; no accidental 404s.

## CLEANUP

Nothing removed. Legacy `abhijeetvarghese/` frontend remains the production path
until the full migration passes (cleanup is the next stage, pending approval).

## GIT

```
<commit> feat(content): migrate contact, consulting, recruiters, insights, journal, search, legal, 404 + essays/articles
```

## PRODUCTION

**NOT DEPLOYED.**

## FINAL VERDICT

**Does the complete migrated Contact + Content + Utility layer now run on React +
TypeScript + Vite while preserving the current design, color theme, content, UX and
PHP + MariaDB backend?**

**YES.**
