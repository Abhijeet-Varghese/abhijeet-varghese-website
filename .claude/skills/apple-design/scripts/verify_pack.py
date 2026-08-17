#!/usr/bin/env python3
"""Offline structural validation for the Apple design-system reference pack."""
from pathlib import Path
import csv
import re

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "SKILL.md",
    "references/hig-index.md",
    "references/ios-ipados.md",
    "references/macos.md",
    "references/watchos.md",
    "references/tvos.md",
    "references/visionos.md",
    "references/foundations.md",
    "references/liquid-glass.md",
    "references/components-patterns-inputs.md",
    "references/accessibility.md",
    "references/resources.md",
    "data/platform-metrics.csv",
]
missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
if missing:
    raise SystemExit("Missing files: " + ", ".join(missing))

text = "\n".join((ROOT / p).read_text(encoding="utf-8") for p in REQUIRED if p.endswith(".md"))
platforms = ["iOS", "iPadOS", "macOS", "watchOS", "tvOS", "visionOS"]
for platform in platforms:
    if platform not in text:
        raise SystemExit(f"Missing platform guidance: {platform}")

urls = re.findall(r"https://developer\.apple\.com/[^\s)]+", text)
if len(urls) < 20:
    raise SystemExit(f"Expected at least 20 official Apple links, found {len(urls)}")

with (ROOT / "data/platform-metrics.csv").open(newline="", encoding="utf-8") as fh:
    rows = list(csv.DictReader(fh))
if {r["platform"] for r in rows} != set(platforms):
    raise SystemExit("Platform metrics must contain exactly six Apple platforms")
for row in rows:
    for key in ("default_text_pt", "minimum_text_pt", "default_target_pt", "minimum_target_pt"):
        if int(row[key]) <= 0:
            raise SystemExit(f"Invalid {key} for {row['platform']}")

print(f"Apple design pack OK: {len(REQUIRED)} files, {len(platforms)} platforms, {len(urls)} official links")
