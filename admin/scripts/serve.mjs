/**
 * AV OS — Phase 5 admin verification server.
 * Serves admin/dist at `/os/` (base prefix) and proxies `/api/*` to the PHP
 * backend. Mirrors the Hostinger layout (static SPA + same-origin PHP API).
 *
 * Usage: node admin/scripts/serve.mjs [port] [apiBase]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.argv[2] ?? 5199);
const API_BASE = process.argv[3] ?? 'http://127.0.0.1:8092';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = decodeURIComponent(url.pathname);

  if (path.startsWith('/api/')) {
    try {
      const r = await fetch(API_BASE + path + (url.search || ''), {
        method: req.method,
        headers: { Accept: 'application/json', Cookie: req.headers.cookie || '', 'Content-Type': req.headers['content-type'] || 'application/json', 'X-CSRF-Token': req.headers['x-csrf-token'] || '' },
        body: req.method === 'GET' ? undefined : await readBody(req),
      });
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json', 'Set-Cookie': r.headers.get('set-cookie') || '' });
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, data: null, error: { code: 'BAD_GATEWAY', message: 'upstream unavailable' } }));
    }
    return;
  }

  let rel = normalize(path).replace(/^\/+/, '');
  if (rel === 'os' || rel.startsWith('os/')) rel = rel.slice(3); // strip /os prefix
  if (rel === '' || rel === '.') rel = 'index.html';
  let file = join(DIST, rel);
  try {
    let s = await stat(file);
    if (s.isDirectory()) file = join(DIST, rel, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    // SPA fallback → index.html
    try {
      const data = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
});

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`admin (Phase 5) → http://127.0.0.1:${PORT}/os/  (api → ${API_BASE})`);
});
