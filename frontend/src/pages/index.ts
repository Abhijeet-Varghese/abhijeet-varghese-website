import type { ComponentType } from 'react';
import type { SeoData } from '@/types';
import { Home } from './home/Home';
import { HOME_SEO } from '@/content/seo';

export interface PageEntry {
  Component: ComponentType;
  seo: SeoData;
  bodyClass: string;
}

/**
 * Route registry — one entry per public route (single frontend owner each).
 * Mirrors the route manifest in scripts/prerender.mjs and the PHP publish
 * snapshot. Only routes with a migrated component appear here; the remaining
 * production routes are listed in the route manifest for tracking.
 */
export const PAGES: Record<string, PageEntry> = {
  home: {
    Component: Home,
    seo: HOME_SEO,
    bodyClass: 'home-arena',
  },
};

export type PageId = keyof typeof PAGES;
