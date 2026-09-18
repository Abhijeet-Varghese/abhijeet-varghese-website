import re, json, os, sys
SRC='abhijeetvarghese/'
REN={'class':'className','for':'htmlFor','tabindex':'tabIndex','colspan':'colSpan','rowspan':'rowSpan',
'stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','fill-rule':'fillRule',
'clip-rule':'clipRule','stop-color':'stopColor','stop-opacity':'stopOpacity','stroke-dasharray':'strokeDasharray',
'stroke-dashoffset':'strokeDashoffset','fill-opacity':'fillOpacity','stroke-opacity':'strokeOpacity','xlink:href':'xlinkHref',
'text-anchor':'textAnchor','font-size':'fontSize','font-family':'fontFamily','font-weight':'fontWeight',
'autocomplete':'autoComplete','maxlength':'maxLength','srcset':'srcSet','datetime':'dateTime','contenteditable':'contentEditable',
'inputmode':'inputMode','novalidate':'noValidate','readonly':'readOnly'}
VOID={'br','img','input','hr','path','circle','rect','line','polyline','polygon','ellipse','source','use','stop','area','base','col','embed','track','wbr'}
def style_obj(s):
    d={}
    for part in s.split(';'):
        if not part.strip(): continue
        k,_,v=part.partition(':'); d[k.strip()]=v.strip()
    return 'style={{' + ', '.join(f'{json.dumps(k)}: {json.dumps(v)}' for k,v in d.items()) + '}}'
def fix_tag(m):
    full=m.group(0); name=m.group(1); attrs=full[1+len(name):-1]; selfc=full.endswith('/>')
    out=[]
    for am in re.finditer(r'\s([A-Za-z_:][-A-Za-z0-9_:.]*)(?:=(?:"([^"]*)"|\'([^\']*)\'|(\S+)))?', attrs):
        a=am.group(1); v=am.group(2) if am.group(2) is not None else (am.group(3) if am.group(3) is not None else am.group(4))
        al=a.lower()
        if al.startswith(('data-','aria-')):
            out.append(f'{al}="{v}"' if v is not None else f'{al}="{{true}}"'); continue
        ja=REN.get(al,a)
        if v is None: out.append(f'{ja}="{{true}}"')
        elif al=='style': out.append(' '+style_obj(v))
        else:
            v=v.replace('{','{{').replace('}','}}') if ('{' in v or '}' in v) else v
            out.append(f'{ja}="{v}"')
    attrstr=' '.join(' '.join(out).split())
    if attrstr: attrstr=' '+attrstr
    close=' />' if (selfc or name.lower() in VOID) else '>'
    return f'<{name}{attrstr}{close}'
def conv_body(body):
    body=re.sub(r'<script\b.*?</script>','',body,flags=re.S)
    body=re.sub(r'<!--.*?-->','',body,flags=re.S)
    body=re.sub(r'<([A-Za-z][A-Za-z0-9:_-]*)((?:"[^"]*"|\'[^\']*\'|[^<>"\'])*?)/?>', fix_tag, body)
    body=re.sub(r'"((?:id|className|aria-[a-z]+|data-[a-z-]+)=)', r'" \1', body)
    body=body.replace('="{true}"','={true}')
    return body
PAGES=[
 ('Search','search.html','/search/'),
 ('SitemapPage','sitemap.html','/sitemap/'),
 ('CaseBPCL','case-studies/bharat-petroleum-corporation-limited/index.html','/case-studies/bharat-petroleum-corporation-limited/'),
]
meta=json.load(open('src/data/pageMeta.json'))
os.makedirs('src/pages/inner',exist_ok=True)
for name,f,route in PAGES:
    s=open(SRC+f).read()
    head=s[s.find('<head'):s.find('</head>')]
    battr=re.search(r'<body([^>]*)>',s).group(1)
    bcls=re.search(r'class="([^"]+)"',battr)
    body=s[s.find('<body'):]
    body=body[body.find('>')+1: body.rfind('</body>')]
    body=re.sub(r'<header class="site-nav".*?</header>','',body,flags=re.S)
    body=re.sub(r'<div class="mobile-menu".*?</div>\s*(?=<main|<section|<footer|$)','',body,flags=re.S,count=1)
    body=re.sub(r'<a class="skip-link".*?</a>','',body,flags=re.S)
    body=re.sub(r'<footer class="[^"]*footer[^"]*".*?</footer>','',body,flags=re.S)
    jsx=conv_body(body).strip()
    open(f'src/pages/inner/{name}.jsx','w').write(f'export default function {name}() {{\n  return (\n    <>\n{jsx}\n    </>\n  );\n}}\n')
    meta[name]={'route':route,'bodyClass':bcls.group(1) if bcls else '',
      'title':(re.search(r'<title>(.*?)</title>',head,re.S) or [None,''])[1],
      'description':(re.search(r'<meta name="description" content="([^"]*)"',head) or [None,''])[1],
      'canonical':'https://abhijeetvarghese.com'+route,
      'og':re.findall(r'<meta property="(og:[a-z:]+)" content="([^"]*)"',head),
      'twitter':re.findall(r'<meta name="(twitter:[a-z]+)" content="([^"]*)"',head),
      'jsonld':re.findall(r'<script type="application/ld\+json">(.*?)</script>',head,re.S),
      'css':re.findall(r'<link rel="stylesheet" href="([^"?]+)',head)}
    print(name, len(jsx), meta[name]['css'])
json.dump(meta,open('src/data/pageMeta.json','w'),indent=1,ensure_ascii=False)
