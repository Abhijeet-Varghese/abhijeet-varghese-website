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
const experienceEntry = resolve(projectRoot, 'experience/index.html');
const caseStudiesEntry = resolve(projectRoot, 'case-studies/index.html');
const orangeBusinessEntry = resolve(projectRoot, 'case-studies/orange-business/index.html');
const bpclEntry = resolve(projectRoot, 'case-studies/bharat-petroleum-corporation-limited/index.html');
const indianArmyEntry = resolve(projectRoot, 'case-studies/indian-army/index.html');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
};

/**
 * Vite owns `/` (the React homepage), `/story/`, `/experience/`, and the
 * Case Studies listing. Existing clean URLs for untouched static inner pages
 * remain usable in development; production keeps their existing Apache rewrite
 * rules via the copied .htaccess/public files.
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
    // These public routes are Vite multi-page entries. Keep their canonical
    // trailing-slash forms out of the legacy fallback so development, preview,
    // and production resolve to the React documents in the same way.
    const reactRouteAliases: Record<string, string> = {
      '/story': '/story/',
      '/story.html': '/story/',
      '/story/index.html': '/story/',
      '/experience': '/experience/',
      '/experience.html': '/experience/',
      '/experience/index.html': '/experience/',
      '/case-studies': '/case-studies/',
      '/case-studies.html': '/case-studies/',
      '/case-studies/index.html': '/case-studies/',
      '/case-studies/orange-business': '/case-studies/orange-business/',
      '/case-studies/orange-business.html': '/case-studies/orange-business/',
      '/case-studies/orange-business/index.html': '/case-studies/orange-business/',
      '/case-studies/bharat-petroleum-corporation-limited': '/case-studies/bharat-petroleum-corporation-limited/',
      '/case-studies/bharat-petroleum-corporation-limited.html': '/case-studies/bharat-petroleum-corporation-limited/',
      '/case-studies/bharat-petroleum-corporation-limited/index.html': '/case-studies/bharat-petroleum-corporation-limited/',
      '/case-studies/indian-army': '/case-studies/indian-army/',
      '/case-studies/indian-army.html': '/case-studies/indian-army/',
      '/case-studies/indian-army/index.html': '/case-studies/indian-army/',
    };
    const canonicalRoute = reactRouteAliases[pathname];
    if (canonicalRoute) {
      response.statusCode = 301;
      response.setHeader('Location', canonicalRoute);
      response.end();
      return;
    }
    if (pathname === '/story/' || pathname === '/experience/' || pathname === '/case-studies/' || pathname === '/case-studies/orange-business/' || pathname === '/case-studies/bharat-petroleum-corporation-limited/' || pathname === '/case-studies/indian-army/') {
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
        experience: experienceEntry,
        caseStudies: caseStudiesEntry,
        orangeBusiness: orangeBusinessEntry,
        bpcl: bpclEntry,
        indianArmy: indianArmyEntry,
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
