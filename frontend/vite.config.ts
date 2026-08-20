import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Vite MPA build. Each public route is an HTML entry (added as more pages are
 * migrated). `npm run build` produces a fully static site (no Node runtime).
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'index.html'),
        story: resolve(rootDir, 'story.html'),
        portfolio: resolve(rootDir, 'portfolio.html'),
        'case-studies': resolve(rootDir, 'case-studies.html'),
        'case-bpcl': resolve(rootDir, 'case-study-intuitive-experiences-for-industrial-environments.html'),
        'case-army': resolve(rootDir, 'case-study-immersive-solutions-for-the-indian-army.html'),
        orange: resolve(rootDir, 'experience-design/orange-business-executive-briefing-center/index.html'),
        contact: resolve(rootDir, 'contact.html'),
        consulting: resolve(rootDir, 'consulting.html'),
        'for-recruiters': resolve(rootDir, 'for-recruiters.html'),
        insights: resolve(rootDir, 'insights.html'),
        journal: resolve(rootDir, 'journal.html'),
        search: resolve(rootDir, 'search.html'),
        'privacy-policy': resolve(rootDir, 'privacy-policy.html'),
        terms: resolve(rootDir, 'terms.html'),
        '404': resolve(rootDir, '404.html'),
        'essay-technology-should-feel-human': resolve(rootDir, 'essay-technology-should-feel-human.html'),
        'essay-ai-isnt-replacing-creativity': resolve(rootDir, 'essay-ai-isnt-replacing-creativity.html'),
        'essay-designing-experiences-people-remember': resolve(rootDir, 'essay-designing-experiences-people-remember.html'),
        'essay-why-enterprise-experiences-fail': resolve(rootDir, 'essay-why-enterprise-experiences-fail.html'),
        'journal-what-a-year-of-ai-enabled-production-taught-me': resolve(rootDir, 'journal-what-a-year-of-ai-enabled-production-taught-me.html'),
        'journal-the-experience-centre-as-a-strategic-instrument': resolve(rootDir, 'journal-the-experience-centre-as-a-strategic-instrument.html'),
      },
    },
  },
});
