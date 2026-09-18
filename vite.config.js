import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production is static hosting (Hostinger) — the build output is plain files.
// /api and /admin are served by the PHP backend (Apache rewrites in prod,
// proxied here in dev so the browser only ever talks to one origin).
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
      '/admin': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
      '/media': { target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8093', changeOrigin: true },
      // Legacy static assets (122 MB — never bundled; served from the site dir)
      '/assets': { target: 'http://127.0.0.1:8092', changeOrigin: true },
      '/fonts': { target: 'http://127.0.0.1:8092', changeOrigin: true },
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
