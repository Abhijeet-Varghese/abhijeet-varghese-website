import type { ComponentType } from 'react';
import type { SeoData } from '@/types';
import { Home } from './home/Home';
import { StoryPage } from './story/StoryPage';
import { PortfolioPage } from './portfolio/PortfolioPage';
import { CaseStudiesPage } from './case-studies/CaseStudiesPage';
import { ComingSoonCase } from './case-study/ComingSoonCase';
import { OrangePage } from './orange/OrangePage';
import { HOME_SEO, STORY_SEO } from '@/content/seo';
import { PORTFOLIO_SEO, CASE_STUDIES_SEO, PROJECTS, comingSoonSeo } from '@/content/projects';
import { ORANGE_SEO } from '@/content/orange';

export interface PreloadSpec {
  href: string;
  as: 'font' | 'image';
  type?: string;
  fetchPriority?: string;
}

export interface PageEntry {
  Component: ComponentType;
  seo: SeoData;
  bodyClass: string;
  preloads?: PreloadSpec[];
}

const bpcl = PROJECTS.find((p) => p.slug === 'intuitive-experiences-for-industrial-environments')!;
const army = PROJECTS.find((p) => p.slug === 'immersive-solutions-for-the-indian-army')!;

/**
 * Route registry — one entry per public route (single frontend owner each).
 * Used by the build-time renderer (entry-server). Client bundles are split
 * per-route via separate entry files, so this registry is never shipped as a
 * single tree to the browser.
 */
export const PAGES: Record<string, PageEntry> = {
  home: {
    Component: Home,
    seo: HOME_SEO,
    bodyClass: 'home-arena',
    preloads: [
      { href: 'assets/fonts/inter-tight-normal.woff2', as: 'font', type: 'font/woff2' },
      { href: 'assets/hero-portrait.webp', as: 'image', fetchPriority: 'high' },
    ],
  },
  story: {
    Component: StoryPage,
    seo: STORY_SEO,
    bodyClass: 'about-page about-films',
  },
  portfolio: {
    Component: PortfolioPage,
    seo: PORTFOLIO_SEO,
    bodyClass: 'portfolio-page',
  },
  'case-studies': {
    Component: CaseStudiesPage,
    seo: CASE_STUDIES_SEO,
    bodyClass: '',
  },
  'case-bpcl': {
    Component: () => <ComingSoonCase project={bpcl} />,
    seo: comingSoonSeo(bpcl),
    bodyClass: 'case-coming-page',
  },
  'case-army': {
    Component: () => <ComingSoonCase project={army} />,
    seo: comingSoonSeo(army),
    bodyClass: 'case-coming-page',
  },
  orange: {
    Component: OrangePage,
    seo: ORANGE_SEO,
    bodyClass: 'orange-business-case',
    preloads: [
      { href: '../../assets/fonts/inter-tight-normal.woff2', as: 'font', type: 'font/woff2' },
      { href: '../../assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp', as: 'image', type: 'image/webp', fetchPriority: 'high' },
    ],
  },
};

export type PageId = keyof typeof PAGES;
