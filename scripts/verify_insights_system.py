"""Static semantic / architecture verification for the Insights five-page system."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / 'abhijeetvarghese'
ARTICLE_SLUGS = [
    'technology-should-feel-human', 'ai-isnt-replacing-creativity',
    'designing-experiences-people-remember', 'why-enterprise-experiences-fail'
]


def heading_text(markup, tag):
    return [re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', item)).strip()
            for item in re.findall(rf'<{tag}\b[^>]*>(.*?)</{tag}>', markup, re.I | re.S)]


listing = (ROOT / 'insights/index.html').read_text(encoding='utf8')
assert heading_text(listing, 'h1') == ['Thinking Beyond the Output.']
assert listing.count('data-insight=') == 4
assert len(re.findall(r'<article\b', listing, re.I)) == 4
assert '<link rel="canonical" href="https://abhijeetvarghese.com/insights/">' in listing
assert '"@type":"CollectionPage"' in listing and '"numberOfItems":4' in listing
assert 'insights-hub.css?v=11.0.0' in listing and 'insights-hub.js?v=11.0.0' in listing

# Executive briefing is a fully semantic, keyboard-operable tab pattern.
assert 'role="tablist"' in listing
for topic in ('human', 'judgment', 'memory', 'system'):
    assert f'id="brief-{topic}"' in listing
    assert f'id="brief-panel-{topic}"' in listing
    assert f'aria-controls="brief-panel-{topic}"' in listing
    assert f'aria-labelledby="brief-{topic}"' in listing
assert listing.count('role="tab"') == 4 and listing.count('role="tabpanel"') == 4

for position, slug in enumerate(ARTICLE_SLUGS, start=1):
    assert f'id="insight-{position:02d}"' in listing
    assert f'href="/insights/{slug}/"' in listing
    assert f'/assets/{slug}-hero-768.webp' in listing
    assert f'/assets/{slug}-hero.webp' in listing
    assert f'alt="' in listing

sequence = [
    listing.index('<section class="ibr-hero"'),
    listing.index('<section class="ibr-premise"'),
    listing.index('<section class="ibr-lenses"'),
    listing.index('<section class="ibr-essays"'),
    listing.index('<article class="ibr-essay"'),
    listing.index('<section class="ibr-practice"'),
    listing.index('<section class="ibr-contact"'),
    listing.index('<footer class="footer'),
]
assert sequence == sorted(sequence)
print('PASS listing: sole H1, executive decision lenses, canonical CollectionPage, four semantic linked perspectives and report sequence.')

for slug in ARTICLE_SLUGS:
    html = (ROOT / 'insights' / slug / 'index.html').read_text(encoding='utf8')
    assert len(heading_text(html, 'h1')) == 1, slug
    assert f'https://abhijeetvarghese.com/insights/{slug}/' in html, slug
    assert 'insight-responsive-system.css?v=2.0.0' in html, slug
    assert 'insight-responsive-system.js?v=2.0.0' in html, slug
    assert 'imagesrcset=' in html and '-hero-768.webp 768w' in html, slug
    assert 'fetchpriority="high"' in html, slug
    assert re.search(r'<img[^>]+width="\d+"[^>]+height="\d+"', html), slug
    assert '<section class="insight-series"' in html, slug
    assert '"@type":"Article"' in html, slug
print('PASS articles: canonical Article markup, single H1, responsive eager heroes and related-Insight system.')

memory = (ROOT / 'insights/designing-experiences-people-remember/index.html').read_text(encoding='utf8')
for phrase in ('One image:', 'One feeling:', 'One idea:', 'One action:', 'One story:'):
    assert phrase in memory, phrase
ai = (ROOT / 'insights/ai-isnt-replacing-creativity/index.html').read_text(encoding='utf8')
assert 'id="ai-framework-06"' in ai and 'Human owns decision?' in ai
enterprise = (ROOT / 'insights/why-enterprise-experiences-fail/index.html').read_text(encoding='utf8')
assert 'Framework 10 / The hero framework' in enterprise and 'id="blueprint"' in enterprise
print('PASS critical frameworks: AI 06, Memory 09 explanations and Enterprise Blueprint 10.')

css = (ROOT / 'css/insights-hub.css').read_text(encoding='utf8')
js = (ROOT / 'js/insights-hub.js').read_text(encoding='utf8')
assert 'ibr-' in css and 'ihx-' not in css
for hook in ('data-ibr-reveal', 'data-decision', 'ibr-rail', 'prefers-reduced-motion'):
    assert hook in js or hook in css, hook
assert 'IntersectionObserver' in js
assert (ROOT / 'css/insights-hub.css').read_bytes() == (ROOT.parent / 'src-backups/css/insights-hub.css').read_bytes()
assert (ROOT / 'js/insights-hub.js').read_bytes() == (ROOT.parent / 'src-backups/js/insights-hub.js').read_bytes()
print('PASS v11 implementation hooks: reveal fallback, decision lenses, reading rail, reduced-motion support and source-backup parity.')
