"""Wire the additive, shared responsive system into all canonical Insight detail pages."""
from pathlib import Path
root=Path('/home/user/abhijeet-varghese-website/abhijeetvarghese/insights')
slugs=['technology-should-feel-human','ai-isnt-replacing-creativity','designing-experiences-people-remember','why-enterprise-experiences-fail']
css='<link rel="stylesheet" href="/css/insight-responsive-system.css?v=2.0.0">'
js='<script src="/js/insight-responsive-system.js?v=2.0.0" defer></script>'
for slug in slugs:
    path=root/slug/'index.html'; text=path.read_text(encoding='utf-8')
    text=text.replace(css,'').replace(js,'')
    text=text.replace('</head>',css+'</head>',1)
    text=text.replace('</body>',js+'</body>',1)
    path.write_text(text,encoding='utf-8')
    print('wired',path)
