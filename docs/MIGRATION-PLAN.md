# React + TypeScript + Vite — Frontend Migration Plan

Branch: `feat/react-ts-vite-migration` · Status: **Milestone 4 complete** — all public routes migrated.

## Route manifest (single frontend owner per route)

| # | Route (public URL) | pageId | Status |
|---|---|---|---|
| 1 | `/` (`index.html`) | `home` | ✅ Migrated |
| 2 | `/story.html` | `story` | ✅ Migrated (Evolution 3D film stack) |
| 3 | `/experience.html` | `experience` | ✅ Migrated |
| 4 | `/case-studies.html` | `case-studies` | ✅ Migrated |
| 5 | `/portfolio.html` | `portfolio` | ✅ Migrated |
| 6 | `/contact.html` | `contact` | ✅ Migrated (booking calendar) |
| 7 | `/consulting.html` | `consulting` | ✅ Migrated |
| 8 | `/for-recruiters.html` | `for-recruiters` | ✅ Migrated |
| 9 | `/insights.html` | `insights` | ✅ Migrated |
| 10 | `/journal.html` | `journal` | ✅ Migrated |
| 11 | `/search.html` | `search` | ✅ Migrated (search index) |
| 12 | `/sitemap.html` | `sitemap` | ✅ Migrated |
| 13 | `/privacy-policy.html` | `privacy-policy` | ✅ Migrated |
| 14 | `/terms.html` | `terms` | ✅ Migrated |
| 15 | `/404.html` | `not-found` | ✅ Migrated |
| 16 | `/case-study-immersive-solutions-for-the-indian-army.html` | `case-army` | ✅ Migrated (coming-soon) |
| 17 | `/case-study-intuitive-experiences-for-industrial-environments.html` | `case-bpcl` | ✅ Migrated (coming-soon) |
| 18 | `/case-study-enterprise-technology-made-understandable.html` | `case-redirect` | ✅ Migrated (static redirect) |
| 19–22 | `/essay-*.html` (×4) | `essay-*` | ✅ Migrated |
| 23–24 | `/journal-*.html` (×2) | `journal-*` | ✅ Migrated |
| 25 | `/experience-design/orange-business-executive-briefing-center/` | `orange` | ✅ Migrated (long-form case study) |

All 25 public routes migrated. Remaining stage (awaiting approval): legacy cleanup,
final optimization, production deployment.

## Suggested commit sequence

1. ~~chore: fresh frontend migration baseline~~ (this branch)
2. ~~feat(frontend): add React TypeScript Vite MPA~~ ✅
3. ~~feat(frontend): migrate shared design system~~ ✅ (tokens/base/components CSS)
4. ~~feat(frontend): migrate homepage~~ ✅ (verified: hero 0-pixel diff)
5. ~~feat(frontend): migrate story and evolution (3D film stack port)~~ ✅
6. ~~feat(frontend): migrate portfolio and case studies~~ ✅ (Milestone 3)
7. ~~feat(frontend): migrate contact and booking UI~~ ✅ (Milestone 4)
8. ~~feat(frontend): migrate remaining public pages (essays, journal, legal, 404)~~ ✅ (Milestone 4)
9. refactor(frontend): remove legacy frontend code — **awaiting approval**
10. perf(frontend): optimize assets and bundles — **awaiting approval**
11. test(frontend): add production route and UX validation — **awaiting approval**

## Known findings (documented deviations from the spec's assumptions)

1. **Contact form fields.** Production currently ships `Name · Email · Organization ·
   Message · Date · Time · Submit` (no mobile). The spec requires `Name · Mobile
   Number · Email · Message · Calendar · Time Slot · Submit` and *no Organization*.
   The migration follows the spec (added `phone`, removed `organization`) — the
   backend already accepts `phone` (`Input::str($d,'phone',40)`).
2. **`GET /api/public/availability`** — referenced by the spec but not present in
   the current backend route map (`public/lead` and `public/submit` only) and not
   called by the current frontend (calendar is "static" mode). Preserved current
   behaviour; flagged for a documented backend extension if live availability is
   desired.
3. **Booking** is correctly a *request* (pending approval): confirmation copy reads
   "I'll confirm the requested time by email within 24 hours" — no false confirm.
