// SSG for '/': builds an SSR bundle, renders the home page from the CMS
// snapshot, and inlines it into dist/index.html so crawlers + first paint get
// full content even before hydration (inner routes stay legacy-static).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
execSync('npx vite build --ssr src/entry-server.jsx --outDir dist-ssr --logLevel error', { stdio: 'inherit' });
const { render } = await import('../dist-ssr/entry-server.js');
const markup = render('/');
const p = new URL('../dist/index.html', import.meta.url);
let html = readFileSync(p, 'utf8');
html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
writeFileSync(p, html);
rmSync(new URL('../dist-ssr', import.meta.url), { recursive: true, force: true });
console.log('prerender ok — bytes:', markup.length);
