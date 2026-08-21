/**
 * AV OS — Phase 4 local verification server.
 *
 * Serves the built Vite site (`frontend/dist`) with `/api/*` proxied to the
 * PHP backend (default http://127.0.0.1:8092) — mirrors the Hostinger staging
 * layout (Vite build as web root + same-origin PHP API).
 *
 * Usage: node scripts/serve-dist.mjs [port] [apiBase]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.argv[2] ?? 8093);
const API_BASE = process.argv[3] ?? 'http://127.0.0.1:8092';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let path = decodeURIComponent(url.pathname);

  // ---- /api/* → PHP backend ----
  if (path.startsWith('/api/')) {
    const upstream = API_BASE + path + (url.search || '');
    try {
      const r = await fetch(upstream, { method: req.method, headers: { 'Accept': 'application/json', 'If-None-Match': req.headers['if-none-match'] || '' } });
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json', 'ETag': r.headers.get('etag') || '', 'Cache-Control': r.headers.get('cache-control') || '' });
      const body = await r.arrayBuffer();
      res.end(Buffer.from(body));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, data: null, error: { code: 'BAD_GATEWAY', message: 'upstream unavailable' } }));
    }
    return;
  }

  // ---- static files from dist ----
  let rel = normalize(path).replace(/^\/+/, '');
  if (rel === '' || rel === '.') rel = 'index.html';
  let file = join(DIST, rel);
  try {
    let s = await stat(file);
    if (s.isDirectory()) {
      if (!rel.endsWith('/')) rel += '/';
      file = join(DIST, rel, 'index.html');
      s = await stat(file);
    }
    const data = await readFile(file);
    const ext = extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    // 404 → dist/404.html
    try {
      const data = await readFile(join(DIST, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`dist server → http://127.0.0.1:${PORT}  (api proxy → ${API_BASE})`);
});
