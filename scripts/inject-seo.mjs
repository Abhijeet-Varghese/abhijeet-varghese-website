// Build-time SEO pass: ensures canonical + og:url are absolute in dist/index.html
// (title/description/JSON-LD come from the source index.html, which mirrors the
// approved legacy head; settings.metaDescription can be injected from snapshot).
import { readFileSync, writeFileSync } from 'node:fs';
const SITE = 'https://abhijeetvarghese.com/';
const p = new URL('../dist/index.html', import.meta.url);
let html = readFileSync(p, 'utf8');
if (!/rel="canonical"/.test(html)) html = html.replace('</head>', `  <link rel="canonical" href="${SITE}">\n</head>`);
if (!/property="og:url"/.test(html)) html = html.replace('</head>', `  <meta property="og:url" content="${SITE}">\n</head>`);
writeFileSync(p, html);
console.log('seo pass ok');
