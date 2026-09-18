// SSG: renders every migrated route from the CMS snapshot and writes
// dist/<route>/index.html (per-route head: title/meta/canonical/OG/JSON-LD +
// body class) plus the home page inlined into dist/index.html. Crawlers and
// first paint get full content with zero JS; hydration takes over live.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
execSync('npx vite build --ssr src/entry-server.jsx --outDir dist-ssr --logLevel error', { stdio: 'inherit' });
const { render } = await import('../dist-ssr/entry-server.js');
const meta = JSON.parse(readFileSync(new URL('../src/data/pageMeta.json', import.meta.url), 'utf8'));

const base = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

// home (already has the approved head) — inline prerendered markup
const home = render('/');
writeFileSync(new URL('../dist/index.html', import.meta.url), base.replace('<div id="root"></div>', `<div id="root">${home}</div>`));
console.log('prerender ok — home bytes:', home.length);

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
for (const [name, m] of Object.entries(meta)) {
  const route = m.route.replace(/\/$/, '');
  let html = base;
  // fresh head per route: strip home-only meta, then inject this route's
  html = html.replace(/<title>.*?<\/title>/s, `<title>${m.title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${m.description}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(m.canonical || 'https://abhijeetvarghese.com' + m.route)}">`);
  html = html.replace(/<meta property="og:[^"]*" content="[^"]*">\s*/g, '');
  html = html.replace(/<meta name="twitter:[^"]*" content="[^"]*">\s*/g, '');
  html = html.replace(/<script type="application\/ld\+json"[^>]*>.*?<\/script>\s*/gs, '');
  const og = (m.og || []).map(([k, v]) => `  <meta property="${k}" content="${v}">`).join('\n');
  const tw = (m.twitter || []).map(([k, v]) => `  <meta name="${k}" content="${v}">`).join('\n');
  const ld = (m.jsonld || []).map((j) => `  <script type="application/ld+json">${j}</script>`).join('\n');
  html = html.replace('</head>', `${og}\n${tw}\n${ld}\n</head>`);
  html = html.replace(/<body id="top" class="home-arena">/, `<body id="top" class="${esc(m.bodyClass || '')}">`);
  const markup = render(m.route);
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  const dir = route.replace(/^\//, '');
  mkdirSync(new URL(`../dist/${dir}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`../dist/${dir}/index.html`, import.meta.url), html);
  console.log('route', m.route, 'bytes', markup.length);
}
rmSync(new URL('../dist-ssr', import.meta.url), { recursive: true, force: true });
console.log('prerender complete');
