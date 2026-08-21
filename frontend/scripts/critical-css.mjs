import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import Beasties from 'beasties';

/**
 * Critical-CSS inlining (runs after prerender.mjs).
 *
 * Before: every page render-blocks on a ~132 KB stylesheet.
 * After:  each page inlines only the rules its own markup actually uses, and
 *         the full stylesheet loads asynchronously (preload + onload swap,
 *         with a <noscript> fallback so no-JS clients still get full styles).
 *
 * Because the pages are already prerendered to real HTML, Beasties can
 * resolve this statically — no headless browser required.
 */
import { ROUTES as REGISTRY } from './route-registry.mjs';

/** Clean output paths — same single registry the rest of the build uses. */
const ROUTES = REGISTRY.map((r) => r.out);

const root = resolve(import.meta.dirname, '..');
const distDir = resolve(root, 'dist');

async function main() {
  let totalInlined = 0;
  let pages = 0;

  console.log(`\n${'page'.padEnd(58)} ${'inlined'.padStart(9)}`);
  console.log('-'.repeat(70));

  for (const route of ROUTES) {
    const file = resolve(distDir, route);
    const html = await readFile(file, 'utf8');

    // Assets are referenced relatively ("./assets/..."), so Beasties must
    // resolve them from the page's own directory, not just the dist root.
    const beasties = new Beasties({
      path: distDir,
      publicPath: '',
      additionalStylesheets: [],
      preload: 'swap',
      inlineFonts: false,
      preloadFonts: false,
      pruneSource: false,
      mergeStylesheets: false,
      reduceInlineStyles: false,
      logLevel: 'silent',
      // resolve relative hrefs against the page directory
      external: true,
    });

    // vite base is '/', so asset hrefs are already root-absolute and
    // Beasties can resolve them directly against dist/. No rewriting needed.
    const rootRelative = html;

    let out;
    try {
      out = await beasties.process(rootRelative);
    } catch (err) {
      console.error(`✗ ${route}: ${err.message}`);
      continue;
    }

    const restored = out;

    const inlined = [...restored.matchAll(/<style>([\s\S]*?)<\/style>/g)]
      .reduce((n, m) => n + m[1].length, 0);
    totalInlined += inlined;
    pages += 1;

    await writeFile(file, restored, 'utf8');
    console.log(`${route.slice(0, 56).padEnd(58)} ${(inlined / 1024).toFixed(1).padStart(7)}K`);
  }

  console.log('-'.repeat(70));
  console.log(`${pages} pages · average inlined ${(totalInlined / pages / 1024).toFixed(1)}K\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
