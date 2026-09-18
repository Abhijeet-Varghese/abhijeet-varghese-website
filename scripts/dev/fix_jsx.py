import re, sys
VOID={'br','img','input','hr','path','circle','rect','line','polyline','polygon','ellipse','source','use','stop','area','base','col','embed','track','wbr'}
def fix(path):
    s=open(path).read()
    m=re.match(r'export default function (\w+)\(\) \{\n  return \(\n    <>\n(.*)\n    </>\n  \);\n\}\n$', s, re.S)
    if not m: print(path,'skip'); return
    name, jsx = m.group(1), m.group(2)
    out=[]; stack=[]; pos=0
    for tm in re.finditer(r'<(/?)([A-Za-z][A-Za-z0-9:_-]*)((?:"[^"]*"|\'[^\']*\'|[^<>"\'])*?)(/?)>', jsx):
        out.append(jsx[pos:tm.start()]); pos=tm.end()
        closing, tag, selfc = tm.group(1), tm.group(2).lower(), tm.group(4)
        if tag in VOID or selfc: out.append(tm.group(0)); continue
        if not closing: stack.append(tag); out.append(tm.group(0))
        else:
            if stack and stack[-1]==tag: stack.pop(); out.append(tm.group(0))
            elif tag in stack:
                while stack and stack[-1]!=tag: out.append(f'</{stack.pop()}>')
                stack.pop(); out.append(tm.group(0))
    out.append(jsx[pos:])
    while stack: out.append(f'</{stack.pop()}>')
    open(path,'w').write(f'export default function {name}() {{\n  return (\n    <>\n{"".join(out)}\n    </>\n  );\n}}\n')
    print(path,'fixed')
for p in sys.argv[1:]: fix(p)
