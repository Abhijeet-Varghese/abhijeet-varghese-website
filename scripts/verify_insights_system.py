"""Static semantic / architecture verification for the five-page Insights system."""
from html.parser import HTMLParser
from pathlib import Path
import re
ROOT=Path('/home/user/abhijeet-varghese-website/abhijeetvarghese')
ARTICLE_SLUGS=['technology-should-feel-human','ai-isnt-replacing-creativity','designing-experiences-people-remember','why-enterprise-experiences-fail']
class Headings(HTMLParser):
    def __init__(self): super().__init__();self.stack=[];self.data=[]
    def handle_starttag(self,tag,attrs): self.stack.append(tag)
    def handle_endtag(self,tag):
        if self.stack and self.stack[-1]==tag:self.stack.pop()
    def handle_data(self,data):
        active=next((tag for tag in reversed(self.stack) if tag in {'h1','h2'}),None)
        if active:self.data.append((active,data))
def texts(markup,tag):
    p=Headings();p.feed(markup); chunks=[];active=False;buf=[]
    # Simple regex stripping for exact rendered heading text, preserving nested spans/emphasis.
    for item in re.findall(r'<'+tag+r'\b[^>]*>(.*?)</'+tag+r'>',markup,re.I|re.S):
        chunks.append(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',item)).strip())
    return chunks
listing=(ROOT/'insights/index.html').read_text(encoding='utf8')
h1=texts(listing,'h1')
assert h1==['Thinking Beyond the Output.'],h1
assert listing.count('data-insight=')==4
assert len(re.findall(r'<article\b',listing,re.I))==4
for slug in ARTICLE_SLUGS: assert f'href="/insights/{slug}/"' in listing,slug
assert '"@type":"CollectionPage"' in listing and '"numberOfItems":4' in listing
# Preserve the requested semantic sequence without mistaking hero/footer links for the destination sections.
order=[listing.index('<section class="ih8-intro"'),listing.index('>Point of view<'),listing.index('<section class="ih8-hub"'),listing.index('<article class="ih8-feature'),listing.index('<section class="ih8-delivery"'),listing.index('<section class="ih8-contact"'),listing.index('<footer class="footer')]
assert order==sorted(order),order
print('PASS listing: sole required H1, introduction → point of view → insights sequence, four semantic crawlable previews, CollectionPage.')
for slug in ARTICLE_SLUGS:
    html=(ROOT/'insights'/slug/'index.html').read_text(encoding='utf8')
    assert len(texts(html,'h1'))==1,slug
    assert f'https://abhijeetvarghese.com/insights/{slug}/' in html,slug
    assert 'insight-responsive-system.css?v=2.0.0' in html,slug
    assert 'insight-responsive-system.js?v=2.0.0' in html,slug
    assert 'imagesrcset=' in html and '-hero-768.webp 768w' in html,slug
    assert 'fetchpriority="high"' in html,slug
    assert re.search(r'<img[^>]+width="\d+"[^>]+height="\d+"',html),slug
    assert '<section class="insight-series"' in html,slug
    assert '"@type":"Article"' in html,slug
print('PASS articles: canonical Article markup, single H1, responsive eager heroes, related Insight system.')
memory=(ROOT/'insights/designing-experiences-people-remember/index.html').read_text(encoding='utf8')
for phrase in ['One image:', 'One feeling:', 'One idea:', 'One action:', 'One story:']: assert phrase in memory,phrase
ai=(ROOT/'insights/ai-isnt-replacing-creativity/index.html').read_text(encoding='utf8')
assert 'id="ai-framework-06"' in ai and 'Human owns decision?' in ai
enterprise=(ROOT/'insights/why-enterprise-experiences-fail/index.html').read_text(encoding='utf8')
assert 'Framework 10 / The hero framework' in enterprise and 'id="blueprint"' in enterprise
print('PASS critical frameworks: AI 06, Memory 09 explanations, Enterprise Blueprint 10.')
assert (ROOT/'css/insights-hub.css').read_bytes()==(ROOT.parent/'src-backups/css/insights-hub.css').read_bytes()
print('PASS listing CSS backup parity.')
