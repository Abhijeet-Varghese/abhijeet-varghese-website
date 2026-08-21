#!/usr/bin/env python3
"""
AV OS — HTTP security probe (§88 §4 §5 §20).

Probes a running server for direct access to sensitive resources and records
what ACTUALLY happens over HTTP — not what an .htaccess rule claims.

A path FAILS if it returns 200 and the body looks like source/config/secret
material. 403/404 pass. 200 on a legitimately public path passes.

Never prints secret values: findings are reported as category + masked marker.

  python3 security-probe.py [base_url] [--json out.json]
"""
import json, re, sys, urllib.error, urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "http://127.0.0.1:8080").rstrip("/")

# (path, must_be_blocked) — must_be_blocked=False means "should stay reachable"
PROBES = [
    # ---- configuration & secrets -------------------------------------------
    ("/config.local.php", True), ("/config.php", True),
    ("/backend/config/config.php", True), ("/.env", True), ("/.env.local", True),
    # ---- private PHP engine -------------------------------------------------
    ("/backend/", True), ("/backend/core/Auth.php", True),
    ("/backend/core/Database.php", True), ("/backend/controllers/ApiController.php", True),
    ("/backend/models/BusinessModels.php", True), ("/backend/ai/AiProviders.php", True),
    ("/backend/scripts/doctor.php", True), ("/backend/cron/maintenance.php", True),
    ("/includes/", True), ("/includes/bootstrap.php", True),
    # ---- database -----------------------------------------------------------
    ("/database/", True), ("/database/schema.sql", True), ("/database/provision.sql", True),
    ("/database/install.php", True), ("/database/migrate.php", True),
    ("/database/migrations/001_initial.sql", True),
    # ---- storage / logs / backups ------------------------------------------
    ("/storage/", True), ("/storage/logs/", True), ("/storage/logs/php-error.log", True),
    ("/storage/backups/", True), ("/storage/uploads/", True),
    # ---- vcs / build metadata ----------------------------------------------
    ("/.git/", True), ("/.git/config", True), ("/.git/HEAD", True), ("/.gitignore", True),
    ("/package.json", True), ("/package-lock.json", True), ("/composer.json", True),
    ("/composer.lock", True), ("/node_modules/", True), ("/yarn.lock", True), ("/pnpm-lock.yaml", True),
    # ---- templates / internal ----------------------------------------------
    ("/site-template/", True), ("/tests/", True), ("/scripts/", True), ("/docs/", True),
    ("/private/", True), ("/backups/", True),
    # ---- dumps / archives ---------------------------------------------------
    ("/backup.sql", True), ("/dump.sql.gz", True), ("/site.zip", True),
    ("/config.php.bak", True), ("/index.html.bak", True), ("/error.log", True),
    # ---- traversal attempts (§11) ------------------------------------------
    ("/media.php?f=../../config.local.php", True),
    ("/media.php?f=..%2f..%2fconfig.local.php", True),
    ("/media.php?f=..%252f..%252fconfig.local.php", True),
    ("/media.php?f=/etc/passwd", True),
    ("/media.php?f=....//....//config.local.php", True),
    ("/api/../config.local.php", True),
    ("/api/..%2fconfig.local.php", True),
    # ---- MUST REMAIN PUBLIC (regression guards) ----------------------------
    ("/", False), ("/story", False), ("/portfolio", False), ("/contact", False),
    ("/case-studies", False), ("/experience", False), ("/journal", False),
    ("/insights", False), ("/privacy-policy", False), ("/terms", False),
    ("/sitemap.xml", False), ("/robots.txt", False), ("/search-index.json", False),
    ("/os/", False), ("/os/index.html", False),
    ("/api/session", False),
]

# Signatures that indicate leaked source / config / secret material.
LEAK_PATTERNS = [
    (r"<\?php", "PHP source"),
    (r"\$db\s*=\s*\[", "DB config array"),
    (r"DB_PASS|DB_USER|DB_NAME|DB_HOST", "DB credential key"),
    (r"AV_ENC_KEY|encKey", "encryption key reference"),
    (r"SMTP_PASS|smtp_pass", "SMTP credential"),
    (r"CREATE TABLE|INSERT INTO", "SQL schema/dump"),
    (r"ref:\s*refs/heads|\[core\]", "git metadata"),
    (r"\"dependencies\"\s*:", "package manifest"),
    (r"BEGIN (RSA|OPENSSH|PRIVATE) KEY", "private key"),
    (r"root:x:0:0", "system passwd file"),
    (r"Index of /", "directory listing"),
]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "avos-security-probe/1.0"})
    try:
        r = urllib.request.urlopen(req, timeout=15)
        return r.status, r.read(200_000).decode("utf-8", "replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        try:
            body = e.read(20_000).decode("utf-8", "replace")
        except Exception:
            body = ""
        return e.code, body, dict(e.headers or {})
    except Exception as ex:
        return 0, f"ERROR {ex}", {}


def classify(body):
    """Return list of leak categories found (never the values themselves)."""
    return sorted({label for pat, label in LEAK_PATTERNS if re.search(pat, body, re.I)})


def main():
    results, failures = [], []
    for path, must_block in PROBES:
        code, body, _ = fetch(BASE + path)
        leaks = classify(body) if code == 200 else []
        if must_block:
            ok = code in (401, 403, 404) or (code == 200 and not leaks)
            verdict = "BLOCKED" if code in (401, 403, 404) else ("200-no-leak" if ok else "EXPOSED")
        else:
            ok = code == 200
            verdict = "OK" if ok else f"BROKEN({code})"
        results.append({"path": path, "status": code, "expect": "block" if must_block else "public",
                        "verdict": verdict, "leaks": leaks, "ok": ok})
        if not ok:
            failures.append(results[-1])

    blocked = sum(1 for r in results if r["expect"] == "block")
    public = len(results) - blocked
    print(f"\nAV OS HTTP security probe → {BASE}")
    print(f"{len(results)} probes · {blocked} must-block · {public} must-stay-public\n")
    print(f"{'path':52}{'code':>6}  {'verdict':<14} leaks")
    print("-" * 100)
    for r in results:
        mark = "" if r["ok"] else "   ✗"
        leaks = ",".join(r["leaks"]) if r["leaks"] else "-"
        print(f"{r['path'][:50]:52}{r['status']:>6}  {r['verdict']:<14} {leaks}{mark}")
    print("-" * 100)

    exposed = [r for r in failures if r["expect"] == "block"]
    broken = [r for r in failures if r["expect"] == "public"]
    print(f"\nEXPOSED (must be blocked): {len(exposed)}")
    for r in exposed:
        print(f"   ✗ {r['path']}  → {r['status']}  [{', '.join(r['leaks']) or 'reachable'}]")
    print(f"BROKEN (must stay public): {len(broken)}")
    for r in broken:
        print(f"   ✗ {r['path']}  → {r['status']}")

    for a in sys.argv:
        if a.startswith("--json"):
            out = sys.argv[sys.argv.index(a) + 1]
            with open(out, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\nwrote {out}")

    print()
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
