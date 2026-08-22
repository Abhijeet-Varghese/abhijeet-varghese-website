#!/usr/bin/env python3
"""
AV OS — PRIVATE IDENTITY LEAK GUARD (§3)

Fails the build if the private owner email — or any other personal address that
is not the approved public one — appears in a client-visible artifact.

The private address is deliberately NOT hardcoded here. It is read from the
environment (CI secret `AV_OWNER_EMAIL`) precisely so the literal never enters
the repository, the git history or the deployment package. When the variable is
absent the structural checks still run, and the guard says so rather than
silently passing.

Client-visible surfaces checked:
  frontend build · admin build · deployment package · HTML · JS · JSON ·
  JSON-LD · sitemap · robots · source maps · public API fixtures

Usage:
  AV_OWNER_EMAIL=... python3 identity-leak-guard.py <path> [<path> ...]
"""
from __future__ import annotations
import os, re, sys
from pathlib import Path

OWNER = (os.environ.get("AV_OWNER_EMAIL") or "").strip().lower()
PUBLIC_ALLOWED = {
    "hi@abhijeetvarghese.com",
    "no-reply@abhijeetvarghese.com",
}
# Placeholders that legitimately appear in form UI / examples.
PLACEHOLDER_OK = re.compile(
    r"^(you|name|email|your\.?name|first\.last|someone|user|admin|test|example|hello)@"
    r"(company|example|domain|yourdomain|mail|test|acme)\.(com|org|net|test|dev|io)$", re.I)

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

TEXTUAL = re.compile(r"\.(html?|js|mjs|cjs|json|xml|txt|css|map|svg|webmanifest)$", re.I)
SKIP_DIR = re.compile(r"(node_modules|/\.git/|/vendor/)")

# Personal-mailbox providers must never appear in a client artifact.
PERSONAL_PROVIDER = re.compile(
    r"@(gmail|googlemail|yahoo|hotmail|outlook|live|proton(mail)?|icloud|aol|zoho|yandex)\.", re.I)


def scan(root: Path):
    findings = []
    checked = 0
    for p in root.rglob("*"):
        if not p.is_file() or SKIP_DIR.search(str(p)) or not TEXTUAL.search(p.name):
            continue
        checked += 1
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        low = text.lower()

        # 1) the configured owner address — the primary check
        if OWNER and OWNER in low:
            findings.append((p, "OWNER EMAIL", mask(OWNER)))

        # 2) any personal-provider mailbox
        for m in EMAIL_RE.finditer(text):
            addr = m.group(0)
            al = addr.lower()
            if al in PUBLIC_ALLOWED or PLACEHOLDER_OK.match(al):
                continue
            if PERSONAL_PROVIDER.search(al):
                findings.append((p, "PERSONAL MAILBOX", mask(addr)))
    return findings, checked


def mask(addr: str) -> str:
    user, _, dom = addr.partition("@")
    keep = user[:2] if len(user) > 2 else user[:1]
    return f"{keep}{'*' * max(1, len(user) - len(keep))}@{dom}"


def main() -> None:
    targets = [Path(a) for a in sys.argv[1:] if not a.startswith("-")]
    if not targets:
        print("usage: identity-leak-guard.py <path> [<path> ...]")
        sys.exit(2)

    print("\nAV OS — private identity leak guard")
    print(f"  owner address configured : {'yes' if OWNER else 'NO (structural checks only)'}")

    total, files = [], 0
    for t in targets:
        if not t.exists():
            print(f"  skip (missing): {t}")
            continue
        f, c = scan(t)
        files += c
        total += f
        print(f"  scanned {c:>5} files in {t}")

    print("-" * 78)
    if total:
        print(f"FAIL — {len(total)} leak(s):")
        for p, kind, masked in total[:40]:
            print(f"   {kind:<17} {masked:<28} {p}")
        sys.exit(1)

    print(f"PASS — no private or personal address in {files} client-visible files")
    if not OWNER:
        print("NOTE: AV_OWNER_EMAIL was not supplied, so the owner-specific check")
        print("      did not run. Set it as a CI secret for full coverage.")
    print()


if __name__ == "__main__":
    main()
