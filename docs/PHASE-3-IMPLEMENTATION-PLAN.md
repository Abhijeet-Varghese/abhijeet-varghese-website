# AV OS — Phase 3 Implementation Plan (v1.0)

Built to the Phase 2 contracts. **Nothing in Phase 3 has started.**
Every sub-phase: BUILD → TEST → VERIFY → COMMIT → REPORT, with a rollback point.

---

## 1 · Sequencing (and where it deviates from the brief's order)

| # | Sub-phase | Depends on | Exit gate |
|---|---|---|---|
| **3A** | Core bootstrap: container, kernel, router, middleware pipeline, config resolver, error boundary | — | boots on an empty DB; `/api/v1/system/status` 200 |
| **3B** | Migrations from zero + seeders | 3A | fresh DB → migrate → seed → boot → health green; every migration has a tested `-- DOWN` |
| **3C** | Identity + auth (port the audited `Auth.php`, add empty-CSRF and reset hardening) | 3B | boot matrix + auth tests pass; owner email never in a response |
| **3D** | RBAC: `user_roles`, policies, `requireOwner` | 3C | permission matrix tests; owner-only ops refused for admins |
| **3E** | API core: envelope, validation, rate limit, request id, audit hook | 3D | contract tests for the envelope + all error codes |
| **3F** | Content engine: pages, projects, articles, experience, clients, versions | 3E | CRUD + revision/restore tests |
| **3G** | Routing + redirects + sitemap **(moved earlier)** | 3F | §103 gate green against DB-sourced routes |
| **3H** | Media + variants + usage graph | 3F | upload security tests; `unavailable` honesty when FFmpeg absent |
| **3I** | Page builder: nodes, devices, components, templates | 3G, 3H | four device modes with real override/reset/copy |
| **3J** | SEO engine | 3G | canonical derived, never stored; zero duplicates |
| **3K** | Journal | 3F | scheduling + preview + reading time |
| **3L** | Publishing + cache invalidation | 3G, 3J | preflight → snapshot → publish → verify → rollback |
| **3M** | Queue + email + notifications | 3E | job lifecycle incl. retry/backoff/dead-letter |
| **3N** | Forms + leads + CRM | 3M | public submit returns acknowledgement only |
| **3O** | Booking | 3M | **concurrency test: N parallel holds on one slot → exactly 1 wins** |
| **3P** | WebGL + animations | 3H | masters outside the web root; signed derivative access |
| **3Q** | Admin integration — the 26-route parity backlog | 3F–3P | parity matrix rows reach VERIFIED |
| **3R** | Content migration | 3Q | reconciliation R1–R10 pass |
| **3S** | Parity verification + legacy retirement | 3R | all 15 gates true (below) |
| **3T** | Final cleanup + package | 3S | analyzer shows one backend; package clean |

### Deviations from the brief's suggested order, with reasons

1. **Routing (3G) moved before media/builder.** The route registry is the single
   source of truth for URLs, SEO and publishing; building content without it
   means retrofitting canonical logic three times. §103 must never regress, and
   it is cheapest to keep green if routing lands early.
2. **Queue (3M) moved before forms/booking.** Both depend on queued
   notifications. Building them first would mean synchronous email, then a
   rewrite.
3. **Migration (3R) after admin parity (3Q).** Migrating before the admin can
   manage the data leaves content unreachable if reconciliation surfaces
   problems.

## 2 · Publishing flow (contract)

```
draft ──submit──► review ──approve──► scheduled ──cron──► published ──► archived
  ▲                                        │                  │
  └──────────── rollback (new version) ◄───┴──────────────────┘

publish() = validate → preflight → snapshot(content_versions)
          → activate route → invalidate cache → verify → record deployment
Any step fails → transaction rolls back → 409 with the failing checks.
```

## 3 · Booking flow (contract)

```
availability(PUBLIC, free/busy only)
   ▼
POST /bookings/hold ──► BEGIN
                        SELECT … FOR UPDATE booking_slots WHERE id=?
                        state must be 'free' else 409
                        state → 'held', hold_expires_at = now+10m
                        COMMIT                      ← UNIQUE(resource,starts_at) backstop
   ▼
POST /bookings/confirm ─► held→booked · intake values · queue confirmation
                          (client mail → public address; owner alert → owner address)
   ▼
cancel / reschedule ───► booked→free (+ audit, + notifications)

cron: sweep expired holds → free
```

## 4 · Media pipeline (contract)

```
upload → validate(ext ∩ finfo MIME) → reject executables → sha256 dedupe
  → store master in PRIVATE root (never web root)
  → media row (processing='pending')
  → queue: derive variants (webp/avif; poster/mp4 IF FFmpeg present)
  → GD present? resize : mark 'unavailable' with a reason (never silent)
  → publish derivatives to the web root
  → media_variants rows · usage graph updated on reference
```

## 5 · Queue lifecycle (contract)

```
pending ──claim(FOR UPDATE SKIP LOCKED)──► processing ──► completed
   ▲                                            │
   │                                            ├─fail──► attempts<max ─► pending(available_at=now+backoff)
   └────────────────────────────────────────────┘                       └─ attempts=max ─► dead

cron: * * * * * php backend/cli/queue-run.php --queue=default --max-seconds=50
      flock guards overlap; a run never exceeds the cron interval
backoff: 1m, 5m, 15m, 1h, 6h
timeout: a job reserved > 15m is returned to pending (crash recovery)
```

Hostinger cron commands are documented in `docs/DEPLOY-HOSTINGER-PHP.md` at 3M.

## 6 · Legacy retirement gates (Phase 3S)

`DELETE AUTHORIZATION = FALSE` until **all** are true:

```
[ ]  1. new database builds from zero
[ ]  2. new API works (contract tests green)
[ ]  3. new authentication works
[ ]  4. new RBAC works
[ ]  5. new admin works
[ ]  6. required legacy admin functionality has parity (26 rows VERIFIED)
[ ]  7. content migrated (R1–R10 pass)
[ ]  8. public frontend works against the new backend
[ ]  9. §103 clean URLs green
[ ] 10. security tests pass
[ ] 11. migration reconciliation passes
[ ] 12. verified backup exists
[ ] 13. rollback proven (not merely documented)
[ ] 14. no external consumer depends on a legacy endpoint
[ ] 15. staging access-log evidence reviewed
```

Gate 14 and 15 **REQUIRE STAGING EVIDENCE** — the 8 zero-consumer endpoints
cannot be cleared from the repository alone.

Verification instrument: `tools/retirement-evidence.py` must report zero
consumers for every path being removed, immediately before removal.

## 7 · Testing per sub-phase

Each ships: PHP lint · unit (services) · integration (API contract) ·
security (authz, CSRF, injection, traversal, upload) · regression (§103 +
render parity). No sub-phase is complete on "the screen renders" — the
operation must work against real data.

## 8 · Honest scope

Phase 3 is **not** a single session. Realistic order of magnitude, based on the
26-route parity backlog, the builder, and the migration: several hundred
engineering hours. 3A–3E (foundation through API core) is the first shippable
increment and the point at which the architecture is provable.

Recommended first slice: **3A + 3B**, because they are independently verifiable
(empty DB → boot → health) and de-risk everything downstream.
