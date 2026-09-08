#!/usr/bin/env python3
"""BPCL/Indian Army placeholder and Evolution pacing invariants."""
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'avos-php/public_html/site'
SEED = json.loads((ROOT / 'avos-data/site.json').read_text())
issues = []

projects = {item['id']: item for item in SEED['projects']}
expected = {
    'prj-2': 'case-study-intuitive-experiences-for-industrial-environments.html',
    'prj-3': 'case-study-immersive-solutions-for-the-indian-army.html',
}
for project_id, filename in expected.items():
    if projects[project_id].get('comingSoon') is not True:
        issues.append(f'{project_id}: comingSoon flag missing')
    page = SITE / filename
    if not page.is_file():
        issues.append(f'{filename}: missing')
        continue
    soup = BeautifulSoup(page.read_text(), 'html.parser')
    if len(soup.select('h1')) != 1:
        issues.append(f'{filename}: H1 count')
    if not soup.select_one('.case-coming'):
        issues.append(f'{filename}: coming-soon section missing')
    if 'coming soon' not in soup.get_text(' ', strip=True).lower():
        issues.append(f'{filename}: status copy missing')
    if soup.select_one('.case-detail__meta'):
        issues.append(f'{filename}: unfinished detail leaked')

css = (ROOT / 'abhijeetvarghese/css/styles.css').read_text()
js = (ROOT / 'abhijeetvarghese/js/main.js').read_text()
if 'height: 480vh' not in css or 'height: 440vh' not in css:
    issues.append('Evolution runway pacing not updated')
if 'currentProgress = targetProgress' not in js:
    issues.append('Evolution direct scroll response missing')
if 'card.style.visibility = "hidden"' not in js:
    issues.append('Exited Evolution cards are not compositor-gated')

if issues:
    print('COMING SOON / EVOLUTION QA: ISSUES')
    for issue in issues: print(' -', issue)
    sys.exit(1)
print('COMING SOON / EVOLUTION QA: ALL CLEAN — 2 placeholders; 480/440vh pacing; direct scroll tracking')
