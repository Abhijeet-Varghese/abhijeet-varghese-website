import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Generate the Content-Security-Policy from the ACTUAL build (§88 §14).
 *
 * Inline scripts are allowed by sha256 hash, not by 'unsafe-inline'. The hashes
 * are computed from the emitted HTML at build time, so the policy can never
 * drift out of sync with the code it protects — the same self-maintaining
 * pattern used for the redirect map.
 *
 * Notes:
 *  - <script type="application/ld+json"> blocks are DATA, not executable, and
 *    are not subject to script-src. They are deliberately not hashed.
 *  - style-src keeps 'unsafe-inline': critical CSS inlines a different <style>
 *    per page, so a single static policy cannot enumerate them. Style injection
 *    is a substantially lower-severity vector than script injection.
 *  - 'unsafe-hashes' + the hash of the stylesheet-swap handler is required by
 *    the critical-CSS <link onload="this.rel='stylesheet'"> pattern.
 *  - worker-src/blob: and the WASM note are included so Three.js/WebGL work
 *    when the WebGL studio lands, without a later policy scramble.
 */
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

const EXECUTABLE_TYPE = /type\s*=\s*"(module|text\/javascript|application\/javascript)"/i;
const DATA_TYPE = /type\s*=\s*"[^"]*(ld\+json|json|template|text\/plain)[^"]*"/i;

const sha256 = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

async function main() {
  // The shipped web root contains BOTH builds: the public site (dist/) and the
  // React admin mounted at /os/ (admin/dist/). The admin has its own inline
  // boot script — omitting it would make the CSP break the admin on deploy.
  // The shipped web root contains THREE HTML sources:
  //   dist/                          → public site
  //   ../admin/dist/                 → React admin at /os/
  //   ../avos-php/public_html/admin/ → legacy PHP admin at /admin/ (still shipped)
  // Any one of them omitted here means CSP silently breaks that surface.
  const extraRoots = [
    resolve(root, '..', 'admin', 'dist'),
    resolve(root, '..', 'avos-php', 'public_html', 'admin'),
  ];
  const files = [...(await walk(dist))];
  for (const r of extraRoots) files.push(...(await walk(r).catch(() => [])));
  const scriptHashes = new Set();
  const handlerHashes = new Set();
  let dataBlocks = 0;

  for (const f of files) {
    const html = await readFile(f, 'utf8');

    for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const [, attrs, body] = m;
      if (/\bsrc=/.test(attrs)) continue;          // external → covered by 'self'
      if (DATA_TYPE.test(attrs) && !EXECUTABLE_TYPE.test(attrs)) { dataBlocks++; continue; }
      if (body.trim()) scriptHashes.add(sha256(body));
    }

    // inline event handlers (e.g. the critical-CSS stylesheet swap)
    for (const m of html.matchAll(/\son[a-z]+\s*=\s*"([^"]*)"/gi)) {
      if (m[1].trim()) handlerHashes.add(sha256(m[1]));
    }
  }

  const scriptSrc = [
    "'self'",
    ...[...scriptHashes].sort(),
    ...(handlerHashes.size ? ["'unsafe-hashes'", ...[...handlerHashes].sort()] : []),
  ].join(' ');

  const policy = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  const out = `# ── AV OS Content-Security-Policy — GENERATED, DO NOT EDIT ───────────
# Source: frontend/scripts/generate-csp.mjs (hashes computed from dist/)
# Inline scripts: ${scriptHashes.size} hashed · inline handlers: ${handlerHashes.size} hashed
# JSON-LD data blocks (not executable, not hashed): ${dataBlocks}
#
# WebGL/Three.js note: if a WASM path is added, append 'wasm-unsafe-eval' to
# script-src. blob: worker/child sources are already permitted.
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${policy}"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always set X-Permitted-Cross-Domain-Policies "none"
  Header always unset X-Powered-By
  Header always unset Server
</IfModule>
`;

  await writeFile(resolve(dist, '_csp.htaccess'), out, 'utf8');
  console.log(
    `CSP: ${scriptHashes.size} inline script hash(es) · ${handlerHashes.size} handler hash(es) · ` +
      `${dataBlocks} JSON-LD data blocks ignored`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
