from pathlib import Path
import re

root=Path('/home/user/abhijeet-varghese-website/abhijeetvarghese')
pages={
 'technology-should-feel-human':'ht1-closing__links',
 'ai-isnt-replacing-creativity':'ai2-closing__links',
 'designing-experiences-people-remember':'me2-final__links',
 'why-enterprise-experiences-fail':'ee4-final__links',
}
links=[
 ('01','Technology Should Feel Human','Technology → Human Experience','technology-should-feel-human'),
 ('02','AI Isn’t Replacing Creativity','AI Capability → Human Judgment','ai-isnt-replacing-creativity'),
 ('03','Designing Experiences People Remember','Experience → Emotion → Memory','designing-experiences-people-remember'),
 ('04','Why Enterprise Experiences Fail','Systems → Alignment → Experience','why-enterprise-experiences-fail'),
]

def series(current):
 items=[]
 for number,title,territory,slug in links:
  cur=' aria-current="page"' if slug==current else ''
  items.append(f'<a class="insight-series__item" href="/insights/{slug}/"{cur}><span class="insight-series__number">{number}</span><span><strong class="insight-series__title">{title}</strong><small>{territory}</small></span></a>')
 return '''<section class="insight-series" aria-labelledby="insight-series-title"><div class="container"><header class="insight-series__head"><div><p class="insight-series__eyebrow">The Insight Series</p><h2 id="insight-series-title">One philosophy. <em>Four perspectives.</em></h2></div><p>Technology becomes valuable when human intent, creative judgment, memorable experience and enterprise systems are designed as one connected whole.</p></header><nav class="insight-series__nav" aria-label="Explore all insights">''' + ''.join(items) + '''</nav></div></section>'''

for slug,oldclass in pages.items():
 p=root/'insights'/slug/'index.html'; s=p.read_text()
 # A page-local final link list is superseded by the same all-four global series block.
 pat=r'<nav class="'+re.escape(oldclass)+r'"[^>]*>.*?</nav>'
 s,n=re.subn(pat,'',s,flags=re.S)
 if n!=1: raise RuntimeError(f'Expected one terminal nav in {slug}; got {n}')
 if 'href="/css/insight-series.css?v=1.0.0"' not in s:
  marker='</head>'
  s=s.replace(marker,'<link rel="stylesheet" href="/css/insight-series.css?v=1.0.0">'+marker,1)
 if 'class="insight-series"' not in s:
  pos=s.rfind('</main>')
  if pos==-1: raise RuntimeError(f'No main close in {slug}')
  s=s[:pos]+series(slug)+'\n'+s[pos:]
 p.write_text(s)

# Source/deployed pair follows the other scope-specific stylesheets.
(root/'../src-backups/css').mkdir(parents=True,exist_ok=True)
(root/'../src-backups/css/insight-series.css').write_text((root/'css/insight-series.css').read_text())
print('Standardised all four terminal Insight Series components')
