import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * AV OS admin — standalone SPA. Built to `dist/` and served alongside the
 * legacy PHP admin (it does not replace it). `/api/*` is proxied to the PHP
 * backend in dev (mirrors the Hostinger layout: static SPA + same-origin API).
 */
export default defineConfig({
  plugins: [react()],
  base: '/os/',
  resolve: {
    alias: { '@': resolve(rootDir, 'src') },
  },
  server: {
    port: 5199,
    proxy: {
      '/api': {
        target: process.env.AVOS_API ?? 'http://127.0.0.1:8092',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
