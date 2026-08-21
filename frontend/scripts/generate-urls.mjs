import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROUTES, urlFor } from './route-registry.mjs';
import LEGACY from '../src/routes/legacy-redirects.json' with { type: 'json' };

/**
 * Generate sitemap.xml, robots.txt and the legacy→clean redirect map
 * (brief §31, §32) from the route registry — never hand-maintained.
 *
 * Runs after prerender. `SITE_ORIGIN` env overrides the production origin
 * (staging passes its own so the sitemap never advertises production URLs).
 */
const ORIGIN = (process.env.SITE_ORIGIN || 'https://abhijeetvarghese.com').replace(/\/$/, '');
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

function sitemap() {
  const urls = ROUTES.filter((r) => r.sitemap)
    .map((r) => {
      const loc = urlFor(ORIGIN, r);
      const pr = r.priority !== undefined ? `<priority>${r.priority}</priority>` : '';
      const cf = r.changefreq ? `<changefreq>${r.changefreq}</changefreq>` : '';
      return `  <url><loc>${loc}</loc>${cf}${pr}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Apache rules: one permanent redirect per legacy URL, plus extension
 * stripping and a no-trailing-slash policy (§30). Emitted as a fragment that
 * the deploy .htaccess includes verbatim.
 */
function redirects() {
  const lines = [
    '# ── AV OS clean-URL engine — GENERATED, DO NOT EDIT ──────────────────',
    '# Source: frontend/src/routes/routes.json → scripts/generate-urls.mjs',
    '',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    '',
    '  # 1) Legacy extension URLs → clean canonical (301, §31)',
  ];
  for (const r of ROUTES) {
    if (!r.legacy || r.legacy === r.clean) continue;
    const from = r.legacy.replace(/^\//, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    lines.push(`  RewriteRule ^${from}$ ${r.clean} [R=301,L]`);
  }
  if (LEGACY.length) {
    lines.push('', '  # 1b) Retired URLs with no page of their own');
    for (const r of LEGACY) {
      const from = r.from.replace(/^\//, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      lines.push(`  RewriteRule ^${from}$ ${r.to} [R=${r.status || 301},L]`);
    }
  }

  lines.push(
    '',
    '  # 2) Any other *.html request → extensionless equivalent (301)',
    '  RewriteCond %{THE_REQUEST} \\s/(.+?)\\.html[\\s?] [NC]',
    '  RewriteRule ^ /%1 [R=301,L]',
    '',
    '  # 3) Strip trailing slashes, except the site root (§30)',
    '  RewriteCond %{REQUEST_FILENAME} !-d',
    '  RewriteRule ^(.+?)/$ /$1 [R=301,L]',
    '',
    '  # 4) Serve the directory-index file for a clean URL (internal, no redirect)',
    '  RewriteCond %{REQUEST_FILENAME} !-f',
    '  RewriteCond %{REQUEST_FILENAME} !-d',
    '  RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f',
    '  RewriteRule ^(.+?)/?$ /$1/index.html [L]',
    '</IfModule>',
    '',
  );
  return lines.join('\n');
}

async function main() {
  await writeFile(resolve(dist, 'sitemap.xml'), sitemap(), 'utf8');
  await writeFile(resolve(dist, '_redirects.htaccess'), redirects(), 'utf8');

  // robots.txt: staging is already forced to Disallow by CI; only add the
  // sitemap pointer when this is a production origin.
  const robotsPath = resolve(dist, 'robots.txt');
  let robots = await readFile(robotsPath, 'utf8').catch(() => 'User-agent: *\nAllow: /\n');
  if (!robots.includes('Disallow: /') && !robots.includes('Sitemap:')) {
    robots = robots.trimEnd() + `\nSitemap: ${ORIGIN}/sitemap.xml\n`;
    await writeFile(robotsPath, robots, 'utf8');
  }

  const n = ROUTES.filter((r) => r.sitemap).length;
  const red = ROUTES.filter((r) => r.legacy && r.legacy !== r.clean).length;
  console.log(`\nURL engine: sitemap.xml (${n} urls) · ${red} legacy 301s · origin ${ORIGIN}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
