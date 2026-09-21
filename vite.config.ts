import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const legacyRoot = resolve(projectRoot, 'abhijeetvarghese');
const apiTarget = process.env.VITE_DEV_API_PROXY ?? 'http://127.0.0.1:8093';
const storyEntry = resolve(projectRoot, 'story/index.html');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
};

/**
 * Vite owns `/` (the React homepage) and `/story/` (the React Story page).
 * Existing clean URLs for untouched static inner pages remain usable in development; production keeps
 * their existing Apache rewrite rules via the copied .htaccess/public files.
 */
type Next = (error?: unknown) => void;
type LegacyMiddleware = (request: IncomingMessage, response: ServerResponse, next: Next) => void;

interface LegacyServer {
  middlewares: {
    use: (handler: LegacyMiddleware) => void;
  };
}

function attachLegacyRoutes(server: LegacyServer): void {
  server.middlewares.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      next();
      return;
    }

    const rawUrl = request.url ?? '/';
    const pathname = decodeURIComponent(rawUrl.split('?')[0] ?? '/');
    // Story is now a Vite multi-page entry. Keep its canonical trailing-slash
    // URL out of the legacy `.html` fallback so development and preview use
    // the React document exactly as production's real /story/ directory does.
    if (pathname === '/story' || pathname === '/story.html' || pathname === '/story/index.html') {
      response.statusCode = 301;
      response.setHeader('Location', '/story/');
      response.end();
      return;
    }
    if (pathname === '/story/') {
      next();
      return;
    }
    if (
      pathname === '/' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/media/') ||
      extname(pathname) !== '' ||
      pathname.includes('\0')
    ) {
      next();
      return;
    }

    const safePath = normalize(pathname).replace(/^([/\\])+/, '');
    if (safePath.startsWith('..')) {
      next();
      return;
    }

    const withoutTrailingSlash = safePath.replace(/[\\/]$/, '');
    const candidates = [
      join(legacyRoot, safePath, 'index.html'),
      join(legacyRoot, `${withoutTrailingSlash}.html`),
    ];
    const file = candidates.find((candidate) => {
      try {
        return existsSync(candidate) && statSync(candidate).isFile();
      } catch {
        return false;
      }
    });

    if (!file) {
      next();
      return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', mimeTypes[extname(file)] ?? 'application/octet-stream');
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(file).pipe(response);
  });
}

function legacyInnerPages(): Plugin {
  return {
    name: 'serve-untouched-legacy-inner-pages',
    configureServer(server) {
      attachLegacyRoutes(server);
    },
    configurePreviewServer(server) {
      attachLegacyRoutes(server);
    },
  };
}

export default defineConfig({
  plugins: [react(), legacyInnerPages()],
  // Preserve all legacy assets and inner-page templates without making them
  // part of the React bundle. Vite's root index.html overwrites only homepage.
  publicDir: 'abhijeetvarghese',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/admin': { target: apiTarget, changeOrigin: true },
      '/media': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: ['.e2b.app'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: '_react',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        story: storyEntry,
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
