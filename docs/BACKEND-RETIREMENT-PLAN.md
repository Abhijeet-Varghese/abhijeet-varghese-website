# AV OS — Backend Retirement Plan (Evidence-Based)

**Produced by:** `tools/retirement-evidence.py` (committed, re-runnable, read-only)
**Repo:** `feat/clean-url-engine` @ `56274a2` · **Nothing deleted. Nothing pushed. Production untouched.**

Your requirement: *old backend → audited → replaced → removed from active
runtime → clean bespoke backend*, with **evidence-based deletion**.

This document is the evidence layer. It exists so that no file is removed
because it "looks legacy".

---

## 0 · The finding that changes the sequencing

My first analyzer run reported **56 of 65 API routes as "never called"**.

That was **wrong, and dangerous.** It only scanned `frontend/src` and
`admin/src`. It did not scan the **legacy PHP admin's JavaScript** — which is
the application currently doing the real work.

Corrected result:

| Consumer | Routes it calls |
|---|---|
| **legacy admin (`/admin/`)** | **52** |
| React admin (`/os/`) | 6 |
| public frontend | 3 |
| cron + CLI | 2 |
| **declared by backend** | **65** |

Acting on the first run would have deleted the backend of the only working
admin. **This is precisely the "mess" you asked to avoid, and it is why the
evidence tool exists rather than a judgement call.**

---

## 1 · What this means for the rebuild

> **The old backend cannot be retired before the legacy admin is replaced.
> They are one unit. 52 of 65 routes exist to serve `/admin/`.**

The React admin at `/os/` implements **6** of those 52.

### The `/os/` parity bar — 46 routes

This is the concrete answer to "what must `/os/` do before the legacy admin can
go". Not a vague standard — this list:

```
agents            ai              aiprompts       analytics       apikeys
audit             automations     backup          backups         business
campaigns         case-studies    content-health  copilot         crm
deployments       diagnostics     emaillog        emailtemplates  engagement
errors            facts           forms           integrations    intelligence
knowledge         knowledge-graph leads           links           notifications
positioning       proposals       publish         redirects       research
security-score    seo             sites           smtp            social
status            sync            trends          users           versions
webhooks
```

Already covered by `/os/`: `auth · content · flags · media · session · system`.

---

## 2 · Static reachability — and its honest limitation

| Verdict | Files | LOC |
|---|---|---|
| KEEP | 46 | 16,259 |
| REVIEW | 0 | 0 |
| RETIRE-CANDIDATE | 2 | 138 |

Only two files are unreachable from every entry point:
`avos-php/router.php` (98 LOC) and `config.local.example.php` (40 LOC — a
template, keep it).

**Limitation I want stated plainly:** `includes/bootstrap.php` registers all 87
classes in an autoload map at boot, so nearly every file is "reachable" by
construction. **Static reachability is therefore a weak deletion signal here.**
It is good for proving something is *unused*; it proves almost nothing about
what is *safe to delete*.

The load-bearing evidence is **consumer demand** (§0), not reachability.

---

## 3 · Routes with no consumer at all (11)

```
dev-intel  knowledge-ingest  outcomes  pages  posts  projects
scoring    search            search-console   site   tag
```

**These are candidates, not verdicts.** Before any is removed:

1. `pages` / `posts` / `projects` / `site` are **public content endpoints** —
   they may be superseded by `/api/v1/content`, but external callers, bookmarks
   or the content bridge could still hit them. Needs a live access-log check on
   staging.
2. `search` / `search-console` may be driven by `search-index.json` at build
   time rather than at runtime.
3. Cron and CLI invoke *classes directly*, not HTTP routes — so "no HTTP caller"
   is not proof of disuse for the code behind them.

**Server access logs are the missing evidence.** I cannot obtain them from here.

---

## 4 · Proposed sequencing (strangler, not big-bang)

Each step is independently verifiable and reversible.

| # | Step | Deletion gate |
|---|---|---|
| 1 | Scaffold the §4 skeleton (`middleware/ services/ repositories/ policies/ validators/`) alongside the existing engine | nothing deleted |
| 2 | `backend/identity/` + centralise 168 emails + CI leak guard | nothing deleted |
| 3 | Migrate `/api/*` → `/api/v1/*` behind deterministic redirects; both consumers are in-repo | old paths kept as redirects |
| 4 | Move domains across one at a time (auth → content → media → leads → …), each behind the existing hardened auth | old path deleted only when its replacement passes tests **and** the evidence tool shows zero consumers |
| 5 | Build the 46 missing `/os/` surfaces | nothing deleted |
| 6 | Re-run evidence tool → legacy admin should drop to **0** consumed routes | **only then** delete `public_html/admin` (1.5 MB) |
| 7 | Delete `PublishEngine.php`, `site-template/`, SaaS adapters | after step 6 |
| 8 | Full local acceptance, then package, then deploy | no Hostinger upload before this |

**Why not big-bang:** the current `core/Auth.php` — audited, no SQL injection,
CSRF everywhere, dual-layer throttling, revocable sessions, correct 2FA gating —
is the strongest code in the repo and you approved its hardening two phases ago.
A ground-up rewrite discards it and opens a regression window on the one
component where regressions are unacceptable. The strangler reaches the same
end state (**old backend fully removed**) without that window.

---

## 5 · Safe to action now, independent of everything above

| Item | Evidence | Risk |
|---|---|---|
| Delete fabricated CRM demo data in `admin/app/js/data.js` | invented Deloitte/PwC/Sony records, no functional role | none |
| `backend/identity/` + email centralisation + CI leak guard | prerequisite for introducing the private address safely | none |
| Move 34 root `*.md` reports into `docs/` | packaging hygiene | none |
| `avos-php/router.php` | unreachable, unreferenced | low — confirm it is not an alternate entry point |

---

## 6 · Still blocking

1. **Sections 5+ of the brief** — testing, migration, acceptance, definition of done.
2. **Deletion authorisation** for §5 items.
3. **Staging access logs** — the only way to prove the 11 orphan routes are truly dead.
4. **Confirm the private email**, which appears nowhere in the repo (unlike
   `u747717869`, which I verified from two independent references).

---

## 7 · Reproduce this

```bash
python3 tools/retirement-evidence.py . --json evidence.json
```

Read-only. Re-run it after every migration step; a domain is only safe to delete
when it reports zero consumers.
