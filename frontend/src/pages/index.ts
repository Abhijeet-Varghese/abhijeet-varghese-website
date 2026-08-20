import type { ComponentType } from 'react';
import type { SeoData } from '@/types';
import { Home } from './home/Home';
import { StoryPage } from './story/StoryPage';
import { HOME_SEO, STORY_SEO } from '@/content/seo';

export interface PageEntry {
  Component: ComponentType;
  seo: SeoData;
  bodyClass: string;
  /** hero image preload (homepage only); story has none */
  heroImagePreload?: string;
}

/**
 * Route registry — one entry per public route (single frontend owner each).
 * Used by the build-time renderer (entry-server). Client bundles are split
 * per-route via separate entry files (entry-home.tsx / entry-story.tsx), so
 * this registry is never shipped to the browser as a single tree.
 */
export const PAGES: Record<string, PageEntry> = {
  home: {
    Component: Home,
    seo: HOME_SEO,
    bodyClass: 'home-arena',
    heroImagePreload: 'assets/hero-portrait.webp',
  },
  story: {
    Component: StoryPage,
    seo: STORY_SEO,
    bodyClass: 'about-page about-films',
  },
};

export type PageId = keyof typeof PAGES;
