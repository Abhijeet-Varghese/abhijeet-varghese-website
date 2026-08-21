import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { ROUTES } from './route-registry.mjs';

/**
 * §103 PUBLIC URL ACCEPTANCE TEST — enforced, not aspirational.
 *
 * Crawls the built site and FAILS THE BUILD if any public URL, internal link,
 * canonical or sitemap entry carries an implementation extension, or if any
 * internal link is broken. Runs in CI and locally via `npm run verify:urls`.
 */
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

const BANNED_EXT = /\.(html?|php|aspx?|jsp|cgi)(?:[?#]|$)/i;
const SKIP = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;
/** Assets legitimately keep their extensions; only *pages* must be clean. */
const ASSET = /\.(css|js|mjs|json|woff2?|ttf|otf|webp|avif|png|jpe?g|gif|svg|ico|pdf|mp4|webm|mov|xml|txt|glb|gltf|hdr)(?:[?#]|$)/i;

const failures = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const exists = (p) => stat(p).then(() => true).catch(() => false);

/** Resolve an internal href to a file on disk, honouring directory indexes. */
async function resolves(href) {
  const path = href.split(/[?#]/)[0] || '/';
  if (path === '/') return exists(resolve(dist, 'index.html'));
  const rel = path.replace(/^\//, '');
  if (await exists(resolve(dist, rel))) {
    return (await stat(resolve(dist, rel))).isFile() || exists(resolve(dist, rel, 'index.html'));
  }
  return exists(resolve(dist, rel, 'index.html'));
}

async function main() {
  const files = (await walk(dist)).filter((f) => f.endsWith('.html'));

  // ---- 1) every registry route is present at its clean location ----
  for (const r of ROUTES) {
    if (!(await exists(resolve(dist, r.out)))) fail(r.out, `registry route "${r.id}" not emitted`);
  }

  // ---- 2) no page file may sit at a legacy *.html public path ----
  for (const f of files) {
    const rel = relative(dist, f);
    if (rel !== '404.html' && rel.endsWith('.html') && !rel.endsWith('/index.html') && rel !== 'index.html') {
      fail(rel, 'page emitted at an extension URL (must be <slug>/index.html)');
    }
  }

  // ---- 3) crawl links, canonicals, og:url ----
  for (const f of files) {
    const rel = relative(dist, f);
    const html = await readFile(f, 'utf8');

    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const h of hrefs) {
      if (SKIP.test(h) || ASSET.test(h)) continue;
      if (BANNED_EXT.test(h)) fail(rel, `internal link carries an extension → ${h}`);
      else if (h.startsWith('/') && !(await resolves(h))) fail(rel, `broken internal link → ${h}`);
    }

    for (const m of html.matchAll(/<link rel="canonical" href="([^"]+)"/g)) {
      if (BANNED_EXT.test(m[1])) fail(rel, `canonical carries an extension → ${m[1]}`);
      if (/[^/]\/$/.test(new URL(m[1]).pathname)) fail(rel, `canonical has a trailing slash → ${m[1]}`);
    }
    for (const m of html.matchAll(/<meta property="og:url" content="([^"]+)"/g)) {
      if (BANNED_EXT.test(m[1])) fail(rel, `og:url carries an extension → ${m[1]}`);
    }
  }

  // ---- 4) sitemap must be clean, complete and free of duplicates ----
  const sm = await readFile(resolve(dist, 'sitemap.xml'), 'utf8').catch(() => '');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) fail('sitemap.xml', 'missing or empty');
  for (const l of locs) if (BANNED_EXT.test(l)) fail('sitemap.xml', `extension URL → ${l}`);
  const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
  if (dupes.length) fail('sitemap.xml', `duplicate canonical URLs → ${[...new Set(dupes)].join(', ')}`);
  const expected = ROUTES.filter((r) => r.sitemap).length;
  if (locs.length !== expected) fail('sitemap.xml', `expected ${expected} urls, found ${locs.length}`);

  // ---- report ----
  console.log(`\n§103 URL acceptance — ${files.length} pages · ${locs.length} sitemap urls`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} violation(s):`);
    for (const f of failures.slice(0, 40)) console.error('  ' + f);
    if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
    process.exit(1);
  }
  console.log('✓ zero extension URLs · zero broken internal links · sitemap clean\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
