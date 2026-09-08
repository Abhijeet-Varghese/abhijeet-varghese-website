#!/usr/bin/env python3
"""Orange Business listing thumbnail preservation and publishing invariant."""
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'abhijeetvarghese'
SITE = ROOT / 'avos-php/public_html/site'
NAME = 'case-orange-experience-in-action.webp'
ALT = 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail'
issues = []

seed = json.loads((ROOT / 'avos-data/site.json').read_text())
project = next(item for item in seed['projects'] if item.get('id') == 'prj-1')
if project.get('image') != f'media/{NAME}': issues.append('canonical project image path differs')
if project.get('imageAlt') != ALT: issues.append('canonical project image alt differs')
if project.get('preserveFrame') is not True: issues.append('preserveFrame flag missing')

for root in [SOURCE, ROOT/'avos-php/site-template', SITE]:
    image_path = root / 'assets' / NAME
    if not image_path.is_file():
        issues.append(f'missing {image_path.relative_to(ROOT)}')
        continue
    image = Image.open(image_path)
    if image.size != (1536, 1024): issues.append(f'{image_path}: dimensions {image.size}')

for relative in ['index.html','case-studies.html','portfolio.html']:
    soup = BeautifulSoup((SITE/relative).read_text(), 'html.parser')
    images = [img for img in soup.select('img') if (img.get('src') or '').endswith(NAME)]
    if len(images) != 1: issues.append(f'{relative}: expected one thumbnail, found {len(images)}')
    elif images[0].get('alt') != ALT: issues.append(f'{relative}: thumbnail alt differs')

for relative in ['index.html','case-studies.html']:
    soup = BeautifulSoup((SITE/relative).read_text(), 'html.parser')
    panel = soup.select_one('#case-prj-1 .case__panel')
    if not panel or panel.get('data-parallax') != '0': issues.append(f'{relative}: authored frame parallax not disabled')

css = (SITE/'css/styles.css').read_text()
if f'img[src$="{NAME}"]' not in css or 'object-fit: contain' not in css:
    issues.append('contain-frame CSS missing')
if 'scale: 1 !important' not in css or 'transform: none !important' not in css:
    issues.append('zoom suppression CSS missing')

if issues:
    print('ORANGE THUMBNAIL QA: ISSUES')
    for issue in issues: print(' -', issue)
    sys.exit(1)
print('ORANGE THUMBNAIL QA: ALL CLEAN — full 1536×1024 frame, zero parallax/zoom, 3 listing surfaces')
