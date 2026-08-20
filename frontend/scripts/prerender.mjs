import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

    await writeFile(builtPath, html, 'utf8');
    console.log(`✓ ${route.file} — prerendered (${route.pageId})`);
  }

  // Sanity: no unresolved markers should remain.
  let failed = false;
  for (const route of ROUTES) {
    const html = await readFile(resolve(root, 'dist', route.file), 'utf8');
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
