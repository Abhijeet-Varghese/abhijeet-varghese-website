import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';

// Production is static hosting (Hostinger) — the build output is plain files.
// /api and /admin are served by the PHP backend (Apache rewrites in prod,
// proxied here in dev so the browser only ever talks to one origin).
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    // dev-only: serve the media library (repo-root assets/) at /assets/*
    {
      name: 'serve-assets',
      configureServer(server) {
        const mime = { '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0];
          if (!url.startsWith('/assets/')) return next();
          const f = path.join(process.cwd(), 'assets', url.slice('/assets/'.length));
          if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return next();
          res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream');
          fs.createReadStream(f).pipe(res);
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
      '/admin': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
      '/media': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 2048,
    cssCodeSplit: false, // single sheet keeps the approved cascade order intact
    rollupOptions: isSsrBuild ? {} : {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}));
