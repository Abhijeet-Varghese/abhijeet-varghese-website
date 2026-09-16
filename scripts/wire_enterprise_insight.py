from pathlib import Path
root=Path('/home/user/abhijeet-varghese-website')
site=root/'abhijeetvarghese'
new='/insights/why-enterprise-experiences-fail/'
old='/essay-why-enterprise-experiences-fail/'

# The insight directory is canonical everywhere readers or search crawlers discover it.
for rel in ['index.html','insights.html','search-index.json','sitemap.html','insights/technology-should-feel-human/index.html','insights/ai-isnt-replacing-creativity/index.html','insights/designing-experiences-people-remember/index.html']:
    p=site/rel
    s=p.read_text()
    s=s.replace(old,new)
    p.write_text(s)

# Make listings describe the finished strategic pillar, not the previous placeholder.
p=site/'insights.html';s=p.read_text();s=s.replace('<em>04</em><span>Enterprise · 9 min</span>','<em>04</em><span>Enterprise · 15 min</span>').replace('Jargon, org charts and inherited complexity — the three silent killers.','Why strategy, people, content, design and systems must connect into one coherent journey.');p.write_text(s)
p=site/'index.html';s=p.read_text();s=s.replace('<span class="essay__tag">Enterprise · 9 min</span>','<span class="essay__tag">Enterprise · 15 min</span>');p.write_text(s)
p=site/'sitemap.html';s=p.read_text();s=s.replace('<span>Essay · Enterprise</span>','<span>Essay · Enterprise Experience</span>');p.write_text(s)
p=site/'search-index.json';s=p.read_text();s=s.replace('"excerpt": "Jargon, org charts and inherited complexity — the three silent killers.",\n   "url": "/insights/why-enterprise-experiences-fail/"','"excerpt": "Why strategy, people, content, design and systems must connect into one coherent journey.",\n   "url": "/insights/why-enterprise-experiences-fail/"');p.write_text(s)
p=site/'sitemap.xml';s=p.read_text();s=s.replace('https://abhijeetvarghese.com/essay-why-enterprise-experiences-fail.html</loc><lastmod>2026-09-10','https://abhijeetvarghese.com/insights/why-enterprise-experiences-fail/</loc><lastmod>2026-09-16');p.write_text(s)

# Keep direct files as a no-JS-friendly redirect fallback for legacy links.
legacy='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/insights/why-enterprise-experiences-fail/"><link rel="canonical" href="https://abhijeetvarghese.com/insights/why-enterprise-experiences-fail/"><meta name="robots" content="noindex, follow"><title>Why Enterprise Experiences Fail</title></head><body><p>This insight has moved to <a href="/insights/why-enterprise-experiences-fail/">Why Enterprise Experiences Fail</a>.</p></body></html>\n'''
(site/'essay-why-enterprise-experiences-fail.html').write_text(legacy)

# Both production rewrite configurations must have exactly the same legacy canonical behaviour.
for p in [site/'.htaccess',root/'avos-php/public_html/.htaccess']:
    s=p.read_text()
    rule='RewriteRule ^essay-why-enterprise-experiences-fail(?:\\.html)?/?$ /insights/why-enterprise-experiences-fail/ [R=301,L]'
    if rule not in s:
        needle='RewriteRule ^essay-technology-should-feel-human(?:\\.html)?/?$ /insights/technology-should-feel-human/ [R=301,L]'
        if needle not in s: raise RuntimeError(f'Missing redirect anchor in {p}')
        s=s.replace(needle,needle+'\n'+rule)
    p.write_text(s)

# Mirror the redirect and extraction logic in the PHP built-in dev router / CMS sync.
p=root/'avos-php/router.php';s=p.read_text();needle="    'essay-technology-should-feel-human.html' => '/insights/technology-should-feel-human/',"
if "'essay-why-enterprise-experiences-fail'" not in s:
    s=s.replace(needle,needle+"\n    'essay-why-enterprise-experiences-fail' => '/insights/why-enterprise-experiences-fail/',\n    'essay-why-enterprise-experiences-fail.html' => '/insights/why-enterprise-experiences-fail/',")
p.write_text(s)

p=root/'avos-php/backend/core/SiteSync.php';s=p.read_text()
s=s.replace("$title = self::txt($x, \"(//*[contains(@class,'article-hero__title')])[1]\") ?: ($it['title'] ?? self::titleFromHead($head['title'], ''));","$title = self::txt($x, \"(//*[contains(@class,'article-hero__title')])[1]\");\n            if ($title === '') $title = self::txt($x, \"(//*[contains(@class,'ee4-hero')]//h1)[1]\");\n            if ($title === '') $title = ($it['title'] ?? self::titleFromHead($head['title'], ''));")
s=s.replace("if ($tag === '') $tag = self::txt($x, \"(//*[contains(@class,'ht1-hero')]//*[contains(@class,'chapter__tag')])[1]\");","if ($tag === '') $tag = self::txt($x, \"(//*[contains(@class,'ht1-hero')]//*[contains(@class,'chapter__tag')])[1]\");\n            if ($tag === '') $tag = self::txt($x, \"(//*[contains(@class,'ee4-hero')]//*[contains(@class,'chapter__tag')])[1]\");")
s=s.replace("contains(@class,'ai2') or contains(@class,'ht1')]//*[contains(@class,'me-copy') or contains(@class,'me2-prose') or contains(@class,'ai2-prose') or contains(@class,'ht1-prose')]//p", "contains(@class,'ai2') or contains(@class,'ht1') or contains(@class,'ee4')]//*[contains(@class,'me-copy') or contains(@class,'me2-prose') or contains(@class,'ai2-prose') or contains(@class,'ht1-prose') or contains(@class,'ee4-prose')]//p")
s=s.replace("if ($img === '') $img = self::attr($x, \"(//*[contains(@class,'article-hero')]//img)[1]\", 'src');","if ($img === '') $img = self::attr($x, \"(//*[contains(@class,'article-hero')]//img)[1]\", 'src');\n            if ($img === '') $img = self::attr($x, \"(//*[contains(@class,'ee4-hero')]//img)[1]\", 'src');")
p.write_text(s)
print('Wired canonical links, redirects, listings, sitemap and CMS extraction for Insight 04')
