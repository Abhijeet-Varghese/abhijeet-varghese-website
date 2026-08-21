import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { ROUTES as REGISTRY } from './route-registry.mjs';

/** pageId → clean output path (single source of truth: src/routes/registry.ts) */
const CLEAN_OUT = new Map(REGISTRY.map((r) => [r.id, r.out]));
const written = [];

/**
 * Build-time static generation (SSG).
 *
 * After `vite build` (client) and `vite build --ssr` (server), this script
 * walks the route manifest, renders each route to real HTML via the server
 * bundle, and splices the output into the Vite-built HTML entry. The result
 * is a fully static site with crawlable content — never a blank #root.
 *
 * Route manifest (one entry per public route; each has exactly one owner):
 */
const ROUTES = [
  { file: 'index.html', pageId: 'home' },
  { file: 'story.html', pageId: 'story' },
  { file: 'portfolio.html', pageId: 'portfolio' },
  { file: 'case-studies.html', pageId: 'case-studies' },
  { file: 'case-study-intuitive-experiences-for-industrial-environments.html', pageId: 'case-bpcl' },
  { file: 'case-study-immersive-solutions-for-the-indian-army.html', pageId: 'case-army' },
  { file: 'experience-design/orange-business-executive-briefing-center/index.html', pageId: 'orange' },
  { file: 'contact.html', pageId: 'contact' },
  { file: 'consulting.html', pageId: 'consulting' },
  { file: 'for-recruiters.html', pageId: 'for-recruiters' },
  { file: 'insights.html', pageId: 'insights' },
  { file: 'journal.html', pageId: 'journal' },
  { file: 'search.html', pageId: 'search' },
  { file: 'sitemap.html', pageId: 'sitemap' },
  { file: 'experience.html', pageId: 'experience' },
  { file: 'privacy-policy.html', pageId: 'privacy-policy' },
  { file: 'terms.html', pageId: 'terms' },
  { file: '404.html', pageId: 'not-found' },
  { file: 'essay-technology-should-feel-human.html', pageId: 'essay-technology-should-feel-human' },
  { file: 'essay-ai-isnt-replacing-creativity.html', pageId: 'essay-ai-isnt-replacing-creativity' },
  { file: 'essay-designing-experiences-people-remember.html', pageId: 'essay-designing-experiences-people-remember' },
  { file: 'essay-why-enterprise-experiences-fail.html', pageId: 'essay-why-enterprise-experiences-fail' },
  { file: 'journal-what-a-year-of-ai-enabled-production-taught-me.html', pageId: 'journal-what-a-year-of-ai-enabled-production-taught-me' },
  { file: 'journal-the-experience-centre-as-a-strategic-instrument.html', pageId: 'journal-the-experience-centre-as-a-strategic-instrument' },
];

const root = resolve(import.meta.dirname, '..');

async function main() {
  const server = await import(resolve(root, 'dist-server', 'entry-server.js'));
  const renderPage = server.renderPage;

  for (const route of ROUTES) {
    const builtPath = resolve(root, 'dist', route.file);
    let html = await readFile(builtPath, 'utf8');

    const rendered = renderPage(route.pageId);

    // Head (SEO meta, canonical, OG, JSON-LD, font/image preloads)
    html = html.replace('<!--HEAD-->', rendered.head);

    // Body content (real, crawlable markup)
    html = html.replace('<!--APP-->', rendered.body);

    // Body class (page-specific, e.g. "home-arena")
    html = html.replace('<body id="top">', `<body id="top" class="${rendered.bodyClass}">`);

    // Privacy-respecting analytics (static, runs without the React bundle)
    html = html.replace('<!--ANALYTICS-->', `<script>${rendered.analytics}</script>`);

    // §28: write the page at its clean, extensionless location
    // (directory-index form, so any static host serves it without rewrites).
    const target = CLEAN_OUT.get(route.pageId) ?? route.file;
    const targetPath = resolve(root, 'dist', target);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, html, 'utf8');
    written.push({ pageId: route.pageId, from: route.file, to: target });
    if (target !== route.file) await rm(builtPath, { force: true });
    console.log(`✓ ${target.padEnd(62)} ← ${route.pageId}`);
  }

  // Sanity: no unresolved markers should remain.
  let failed = false;
  for (const route of ROUTES) {
    const html = await readFile(resolve(root, 'dist', CLEAN_OUT.get(route.pageId) ?? route.file), 'utf8');
    for (const marker of ['<!--HEAD-->', '<!--APP-->', '<!--ANALYTICS-->']) {
      if (html.includes(marker)) {
        failed = true;
        console.error(`✗ ${route.file}: unresolved marker ${marker}`);
      }
    }
  }
  if (failed) process.exit(1);
  console.log('Prerender complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
