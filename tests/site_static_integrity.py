#!/usr/bin/env python3
"""Static public-site integrity, SEO, media and preservation audit."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "avos-php" / "public_html" / "site"
REDIRECT = "case-study-enterprise-technology-made-understandable.html"
issues: list[str] = []
summary = Counter()

html_files = sorted(SITE.rglob("*.html"))
if not html_files:
    issues.append("generated site has no HTML files")

for path in html_files:
    rel = path.relative_to(SITE).as_posix()
    text = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(text, "html.parser")
    is_redirect = rel == REDIRECT
    summary["pages"] += 1
    summary["images"] += len(soup.select("img"))
    summary["videos"] += len(soup.select("video"))
    summary["forms"] += len(soup.select("form"))
    summary["buttons"] += len(soup.select("button"))

    if "{{" in text or "<?php" in text:
        issues.append(f"{rel}: unresolved template content")
    if not soup.title or not soup.title.get_text(strip=True):
        issues.append(f"{rel}: missing title")
    viewport = soup.select_one('meta[name="viewport"]')
    if not viewport:
        issues.append(f"{rel}: missing viewport")

    if not is_redirect:
        if len(soup.select("h1")) != 1:
            issues.append(f"{rel}: expected exactly one H1, found {len(soup.select('h1'))}")
        if len(soup.select("header.site-nav")) != 1 or len(soup.select("footer.footer--arena")) != 1:
            issues.append(f"{rel}: homepage navbar/footer not shared")
        if soup.select(".case-nav,.case-footer"):
            issues.append(f"{rel}: bespoke public chrome remains")
        for selector, label in [
            ('meta[name="description"]', "description"),
            ('link[rel="canonical"]', "canonical"),
            ('meta[property="og:title"]', "Open Graph title"),
            ('meta[property="og:description"]', "Open Graph description"),
            ('meta[property="og:image"]', "Open Graph image"),
        ]:
            if not soup.select_one(selector):
                issues.append(f"{rel}: missing {label}")

    ids = [node.get("id") for node in soup.select("[id]")]
    duplicates = [item for item, count in Counter(ids).items() if item and count > 1]
    if duplicates:
        issues.append(f"{rel}: duplicate IDs {duplicates}")

    for node in soup.select('script[type="application/ld+json"]'):
        try:
            json.loads(node.string or node.get_text())
        except Exception as exc:
            issues.append(f"{rel}: invalid JSON-LD ({exc})")

    for image in soup.select("img"):
        src = image.get("src", "")
        if image.get("alt") is None:
            issues.append(f"{rel}: image missing alt ({src})")
        if not image.get("width") or not image.get("height"):
            issues.append(f"{rel}: image missing intrinsic dimensions ({src})")

    for video in soup.select("video"):
        if not video.get("poster"):
            issues.append(f"{rel}: video missing poster")
        if video.get("preload") not in ("none", "metadata"):
            issues.append(f"{rel}: video preload is not deferred")
        if not video.has_attr("muted") or not video.has_attr("playsinline"):
            issues.append(f"{rel}: background video lacks muted/playsinline")

    asset_values: list[str] = []
    for node in soup.select("[src],link[href],[poster],[data-image]"):
        asset_values.append(node.get("src") or node.get("href") or node.get("poster") or node.get("data-image") or "")
    for node in soup.select("[srcset],[data-image-srcset]"):
        source_set = node.get("srcset") or node.get("data-image-srcset") or ""
        asset_values.extend(candidate.strip().split()[0] for candidate in source_set.split(",") if candidate.strip())
    for value in asset_values:
        if not value or value.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#")):
            continue
        clean = urlparse(value).path
        target = (path.parent / clean).resolve()
        try:
            target.relative_to(SITE.resolve())
        except ValueError:
            issues.append(f"{rel}: asset traversal outside public root ({value})")
            continue
        if not target.is_file():
            issues.append(f"{rel}: missing referenced asset ({value})")

    for anchor in soup.select('a[target="_blank"]'):
        rels = set(anchor.get("rel") or [])
        if "noopener" not in rels:
            issues.append(f"{rel}: target=_blank link missing noopener")

    for control in soup.select("input,select,textarea"):
        if control.get("type") == "hidden":
            continue
        cid = control.get("id")
        labelled = bool(control.get("aria-label") or control.get("aria-labelledby"))
        if cid and soup.select_one(f'label[for="{cid}"]'):
            labelled = True
        if control.find_parent("label"):
            labelled = True
        if not labelled:
            issues.append(f"{rel}: unlabelled form control ({cid or control.name})")

# Runtime source invariants.
for folder in [SITE / "css", SITE / "js"]:
    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix not in {".css", ".js"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if re.search(r"cursor\s*:\s*none|data-cur|pondar", text, re.I):
            issues.append(f"{path.relative_to(SITE)}: forbidden cursor/Pondar reference")
        if path.suffix == ".css" and text.count("{") != text.count("}"):
            issues.append(f"{path.relative_to(SITE)}: unbalanced CSS braces")

# Preservation counts from canonical current product state.
required = {
    "story.html": ["about-evo3d__card", 8],
    "portfolio.html": ["portfolio-piece", 3],
    "case-studies.html": ["case__panel", 3],
}
for name, (class_name, minimum) in required.items():
    soup = BeautifulSoup((SITE / name).read_text(), "html.parser")
    found = len(soup.select(f".{class_name}"))
    if found < minimum:
        issues.append(f"{name}: preserved component count {found} < {minimum}")

print(
    "STATIC INTEGRITY:",
    f"{summary['pages']} HTML · {summary['images']} images · {summary['videos']} videos ·",
    f"{summary['forms']} forms · {summary['buttons']} buttons",
)
if issues:
    print(f"ISSUES: {len(issues)}")
    for issue in issues[:100]:
        print(" -", issue)
    sys.exit(1)
print("STATIC INTEGRITY: ALL CLEAN")
