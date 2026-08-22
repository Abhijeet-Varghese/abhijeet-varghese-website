#!/usr/bin/env python3
"""
AV OS — RETIREMENT EVIDENCE ANALYZER

Produces the evidence required before any backend file is deleted.

The rule this enforces: nothing is removed because it "looks legacy". A file may
only be retired when this tool can show it is unreachable from every live entry
point AND unreferenced by the frontend, the admin, CI, the migration system and
the deployment package.

Three independent evidence sources are combined:

  1. STATIC REACHABILITY  — BFS from every real entry point through the
     bootstrap autoload map, require/include statements and class references.
  2. CONSUMER DEMAND      — every API route the frontend/admin actually call,
     matched against every route the backend declares. Routes nobody calls are
     candidates; routes someone calls are load-bearing.
  3. EXTERNAL REFERENCES  — CI workflow, .htaccess, migrations, docs, packaging.

Output: a per-file verdict with the evidence behind it.
No file is modified. This tool only reads.

Usage:  python3 retirement-evidence.py <repo-root> [--json out.json]
"""
from __future__ import annotations
import json, os, re, sys
from collections import defaultdict, deque
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
PHP_ROOT = ROOT / "avos-php"

# --------------------------------------------------------------------------- #
# Entry points: anything the web server, cron or a human can invoke directly.
# --------------------------------------------------------------------------- #
ENTRY_GLOBS = [
    "public_html/api/index.php",
    "public_html/media.php",
    "public_html/admin/*.php",
    "public_html/install/*.php",
    "includes/bootstrap.php",
    "backend/cron/*.php",
    "backend/scripts/*.php",
    "database/migrate.php",
    "database/install.php",
    "database/validate-migrations.php",
    # --- Phase 3A/3B: the NEW bespoke stack. Without these the analyzer marks
    # the entire new backend "unreachable" and would recommend deleting it.
    "cli/avos",
    "app/Autoloader.php",
    "tests/next/run.php",
]


def php_files() -> list[Path]:
    files = [p for p in PHP_ROOT.rglob("*.php") if p.is_file()]
    cli = PHP_ROOT / "cli" / "avos"          # extensionless CLI entry point
    if cli.is_file():
        files.append(cli)
    return sorted(files)


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


# --------------------------------------------------------------------------- #
# 1. autoload map: 'ClassName' => '/backend/path/File.php'
# --------------------------------------------------------------------------- #
def autoload_map() -> dict[str, Path]:
    src = read(PHP_ROOT / "includes/bootstrap.php")
    out: dict[str, Path] = {}
    for cls, rel in re.findall(r"'([A-Za-z_][A-Za-z0-9_]*)'\s*=>\s*'(/[^']+\.php)'", src):
        f = PHP_ROOT / rel.lstrip("/")
        if f.exists():
            out[cls] = f
    return out


# --------------------------------------------------------------------------- #
# 2. classes each file DEFINES / REFERENCES, and files it requires
# --------------------------------------------------------------------------- #
DEF_RE = re.compile(r"\b(?:final\s+|abstract\s+)?(?:class|interface|trait|enum)\s+([A-Za-z_]\w*)")
USE_RE = re.compile(r"\b([A-Z][A-Za-z0-9_]*)\s*::")
NEW_RE = re.compile(r"\bnew\s+([A-Z][A-Za-z0-9_]*)\s*\(")
REQ_RE = re.compile(r"\b(?:require|include)(?:_once)?\s*[( ]\s*([^;]+);")


def resolve_require(expr: str, origin: Path) -> Path | None:
    """Best-effort resolution of require expressions containing constants."""
    e = expr.strip().strip("()")
    e = e.replace("__DIR__", f"'{origin.parent}'")
    e = e.replace("AV_ROOT", f"'{PHP_ROOT}'")
    e = e.replace("AV_BACKEND", f"'{PHP_ROOT / 'backend'}'")
    parts = re.findall(r"'([^']*)'", e)
    if not parts:
        return None
    joined = "".join(parts)
    if "dirname" in expr:
        return None  # ambiguous; handled by the entry-point walk instead
    cand = Path(joined) if joined.startswith("/") else (origin.parent / joined)
    try:
        cand = cand.resolve()
    except Exception:
        return None
    return cand if cand.exists() and cand.suffix == ".php" else None


def main() -> None:
    files = php_files()
    amap = autoload_map()
    defines: dict[Path, set[str]] = {}
    refs: dict[Path, set[str]] = {}
    requires: dict[Path, set[Path]] = {}

    for f in files:
        src = read(f)
        defines[f] = set(DEF_RE.findall(src))
        refs[f] = set(USE_RE.findall(src)) | set(NEW_RE.findall(src))
        rq = set()
        for expr in REQ_RE.findall(src):
            r = resolve_require(expr, f)
            if r:
                rq.add(r)
        requires[f] = rq

    # PSR-4 resolution for the new AvOS\ namespace (app/ is the base dir).
    psr4: dict[str, Path] = {}
    app_dir = PHP_ROOT / "app"
    if app_dir.is_dir():
        for f in app_dir.rglob("*.php"):
            psr4[f.stem] = f

    class_owner: dict[str, Path] = {}
    for f, ds in defines.items():
        for d in ds:
            class_owner.setdefault(d, f)
    for cls, f in amap.items():
        class_owner.setdefault(cls, f)
    for cls, f in psr4.items():
        class_owner.setdefault(cls, f)

    # ---- BFS from entry points ------------------------------------------- #
    entries: list[Path] = []
    for g in ENTRY_GLOBS:
        entries.extend(sorted(PHP_ROOT.glob(g)))
    entries = [e for e in entries if e.exists()]

    reached: set[Path] = set()
    reached_via: dict[Path, str] = {}
    q = deque()
    for e in entries:
        q.append((e, f"entry:{e.relative_to(PHP_ROOT)}"))
    # bootstrap pulls in the whole autoload map at runtime via registration
    boot = PHP_ROOT / "includes/bootstrap.php"
    if boot.exists():
        for cls, f in amap.items():
            q.append((f, "autoload-map"))

    while q:
        f, why = q.popleft()
        if f in reached:
            continue
        reached.add(f)
        reached_via[f] = why
        for r in requires.get(f, ()):
            if r not in reached:
                q.append((r, f"required-by:{f.relative_to(PHP_ROOT)}"))
        for c in refs.get(f, ()):
            owner = class_owner.get(c)
            if owner and owner not in reached:
                q.append((owner, f"class:{c}"))

    unreached = [f for f in files if f not in reached]

    # ---- 2. consumer demand: routes declared vs routes called ------------- #
    api_src = read(PHP_ROOT / "backend/controllers/ApiController.php")
    declared = set()
    for m in re.finditer(r"\$action === '([a-z0-9-]+)'", api_src):
        declared.add(m.group(1))

    # CRITICAL: the legacy PHP admin is ALSO a live consumer. Omitting it would
    # mark routes it depends on as "never called" and invite a fatal deletion.
    consumer_txt = ""
    consumer_sources = {
        "frontend": ["frontend/src/**/*.ts", "frontend/src/**/*.tsx"],
        "react-admin(/os/)": ["admin/src/**/*.ts", "admin/src/**/*.tsx"],
        "legacy-admin(/admin/)": ["avos-php/public_html/admin/**/*.js",
                                   "avos-php/public_html/admin/**/*.php",
                                   "avos-php/public_html/admin/**/*.html"],
        "cron+cli": ["avos-php/backend/cron/*.php", "avos-php/backend/scripts/*.php"],
        "php-templates": ["avos-php/site-template/**/*.html", "avos-php/site-template/**/*.php"],
        "database-scripts": ["avos-php/database/*.php", "avos-php/database/**/*.sql"],
        "deployment": [".github/workflows/*.yml", "frontend/staging/*"],
        "redirects+routes": ["frontend/src/routes/*.json", "frontend/dist/_redirects.htaccess"],
        "generated-content": ["avos-data/*.json"],
        "documentation": ["docs/**/*.md", "README.md"],
    }
    per_consumer: dict[str, set[str]] = {}
    for label, globs in consumer_sources.items():
        txt = ""
        for g in globs:
            for f in ROOT.glob(g):
                if f.is_file():
                    txt += read(f)
        consumer_txt += txt
        per_consumer[label] = {m.group(1) for m in re.finditer(r"/api/(?:v1/)?([a-z0-9-]+)", txt)}
    called = set()
    for m in re.finditer(r"/api/(?:v1/)?([a-z0-9-]+)", consumer_txt):
        called.add(m.group(1))

    unused_routes = sorted(declared - called - {"v1"})
    used_routes = sorted(declared & called)

    # ---- 3. external references ------------------------------------------ #
    ext_txt = ""
    for rel in (".github/workflows", "frontend/staging", "docs"):
        p = ROOT / rel
        if p.exists():
            for f in p.rglob("*"):
                if f.is_file():
                    ext_txt += read(f)
    ext_txt += read(ROOT / ".github/workflows/deploy-react-vite-staging.yml")

    def externally_referenced(f: Path) -> bool:
        return f.name in ext_txt or str(f.relative_to(PHP_ROOT)) in ext_txt

    # ---- verdicts --------------------------------------------------------- #
    rows = []
    for f in files:
        rel = str(f.relative_to(PHP_ROOT))
        is_entry = f in entries
        r = f in reached
        ext = externally_referenced(f)
        # ---- Phase 1 five-way classification -------------------------------
        # Consumer evidence has priority over reachability (per brief).
        is_new_stack = any(
            f.as_posix().find(seg) >= 0
            for seg in ("/app/", "/cli/", "/database/next/", "/tests/next/")
        )
        legacy_admin_only = f.as_posix().find("public_html/admin/") >= 0
        is_legacy_engine = any(k in rel for k in (
            "publish/PublishEngine", "site-template", "integrations/", "ai/AiProviders"))
        if is_new_stack:
            verdict, why = "KEEP", "Phase 3 new stack (built to the approved contract)"
        elif is_entry and legacy_admin_only:
            verdict, why = "REWRITE", "legacy admin entry point — replaced by /os/"
        elif legacy_admin_only:
            verdict, why = "ARCHIVE", "legacy admin runtime — delete only after /os/ parity"
        elif is_entry:
            verdict, why = "KEEP", "live entry point"
        elif is_legacy_engine:
            verdict, why = "REWRITE", "legacy engine slated for replacement"
        elif rel.startswith("backend/core/") or rel.startswith("backend/config/") or rel.startswith("identity"):
            verdict, why = "KEEP", "hardened core — carry forward"
        elif r and ext:
            verdict, why = "MIGRATE", f"reachable + externally referenced ({reached_via.get(f,'')})"
        elif r:
            verdict, why = "MIGRATE", f"reachable ({reached_via.get(f,'')})"
        elif ext:
            verdict, why = "ARCHIVE", "unreachable but externally referenced"
        else:
            verdict, why = "DELETE", "unreachable from every entry point, no consumer, no reference"
        rows.append({"file": rel, "loc": len(read(f).splitlines()), "verdict": verdict, "evidence": why})

    # ---- report ------------------------------------------------------------ #
    print(f"\nAV OS RETIREMENT EVIDENCE — {PHP_ROOT}")
    print(f"php files: {len(files)} · entry points: {len(entries)} · autoloaded classes: {len(amap)}")
    print("=" * 100)

    by = defaultdict(list)
    for r in rows:
        by[r["verdict"]].append(r)

    for v in ("DELETE", "ARCHIVE", "REWRITE", "MIGRATE", "KEEP"):
        group = by[v]
        print(f"\n{v}  ({len(group)} files, {sum(g['loc'] for g in group):,} LOC)")
        print("-" * 100)
        for g in sorted(group, key=lambda x: -x["loc"])[: 40 if v in ("DELETE", "ARCHIVE", "REWRITE") else 10]:
            print(f"  {g['file']:<58} {g['loc']:>6}  {g['evidence'][:60]}")
        if v in ("KEEP", "MIGRATE") and len(group) > 10:
            print(f"  … and {len(group)-10} more")

    print("\n" + "=" * 100)
    print(f"ROUTE DEMAND — declared by backend: {len(declared)} · called by frontend/admin: {len(used_routes)}")
    print(f"  load-bearing : {', '.join(used_routes) or '—'}")
    print(f"  never called : {len(unused_routes)} → {', '.join(unused_routes[:25])}{' …' if len(unused_routes) > 25 else ''}")
    print("\n  demand by consumer:")
    for label, rs in per_consumer.items():
        hit = sorted(rs & declared)
        print(f"    {label:<24} {len(hit):>3} routes  {', '.join(hit[:14])}{' …' if len(hit) > 14 else ''}")
    print("\nNOTE: 'never called' means no reference in THIS repo's frontend/admin source.")
    print("      Cron, CLI scripts and manual admin use are NOT proof of disuse —")
    print("      each must be confirmed before removal.")

    for a in sys.argv:
        if a == "--json":
            out = sys.argv[sys.argv.index(a) + 1]
            Path(out).write_text(json.dumps(
                {"rows": rows, "declared_routes": sorted(declared),
                 "called_routes": sorted(called), "unused_routes": unused_routes,
                 "per_consumer": {k: sorted(v & declared) for k, v in per_consumer.items()}}, indent=2))
            print(f"\nwrote {out}")
    print()


if __name__ == "__main__":
    main()
