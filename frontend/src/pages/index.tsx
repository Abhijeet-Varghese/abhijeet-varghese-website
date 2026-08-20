import type { ComponentType } from 'react';
import type { SeoData } from '@/types';
import { Home } from './home/Home';
import { StoryPage } from './story/StoryPage';
import { PortfolioPage } from './portfolio/PortfolioPage';
import { CaseStudiesPage } from './case-studies/CaseStudiesPage';
import { ComingSoonCase } from './case-study/ComingSoonCase';
import { OrangePage } from './orange/OrangePage';
import { ContactPage } from './contact/ContactPage';
import { ConsultingPage } from './consulting/ConsultingPage';
import { RecruitersPage } from './recruiters/RecruitersPage';
import { InsightsPage } from './insights/InsightsPage';
import { JournalPage } from './journal/JournalPage';
import { ArticlePage } from './article/ArticlePage';
import { SearchPage } from './search/SearchPage';
import { LegalPage } from './legal/LegalPage';
import { NotFoundPage } from './not-found/NotFoundPage';
import { ExperiencePage } from './experience/ExperiencePage';
import { SitemapPage } from './sitemap/SitemapPage';
import { HOME_SEO, STORY_SEO } from '@/content/seo';
import { PORTFOLIO_SEO, CASE_STUDIES_SEO, PROJECTS, comingSoonSeo } from '@/content/projects';
import { ORANGE_SEO } from '@/content/orange';
import {
  CONTACT_SEO,
  CONSULTING_SEO,
  RECRUITERS_SEO,
  INSIGHTS_SEO,
  JOURNAL_SEO,
  SEARCH_SEO,
  SITEMAP_SEO,
  PRIVACY_SEO,
  TERMS_SEO,
  NOT_FOUND_SEO,
  PRIVACY,
  PRIVACY_PAGE,
  TERMS,
  TERMS_PAGE,
} from '@/content/pages';
import { EXPERIENCE_SEO } from '@/content/experience';
import { ARTICLES_BY_SLUG } from '@/content/articles';

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
  favicon?: string;
}

const bpcl = PROJECTS.find((p) => p.slug === 'intuitive-experiences-for-industrial-environments')!;
const army = PROJECTS.find((p) => p.slug === 'immersive-solutions-for-the-indian-army')!;

const FONT_PRELOAD: PreloadSpec = { href: 'assets/fonts/inter-tight-normal.woff2', as: 'font', type: 'font/woff2' };

/** Article routes (essays + journal entries) generated from the CMS snapshot. */
const ARTICLE_PAGES: Record<string, PageEntry> = {};
for (const a of Object.values(ARTICLES_BY_SLUG)) {
  ARTICLE_PAGES[a.slug] = {
    Component: () => <ArticlePage article={a} />,
    seo: a.seo,
    bodyClass: '',
  };
}

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
      FONT_PRELOAD,
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
    favicon: '../../assets/logo.png',
    preloads: [
      { href: '../../assets/fonts/inter-tight-normal.woff2', as: 'font', type: 'font/woff2' },
      { href: '../../assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp', as: 'image', type: 'image/webp', fetchPriority: 'high' },
    ],
  },
  contact: {
    Component: ContactPage,
    seo: CONTACT_SEO,
    bodyClass: '',
  },
  consulting: {
    Component: ConsultingPage,
    seo: CONSULTING_SEO,
    bodyClass: '',
  },
  'for-recruiters': {
    Component: RecruitersPage,
    seo: RECRUITERS_SEO,
    bodyClass: '',
  },
  insights: {
    Component: InsightsPage,
    seo: INSIGHTS_SEO,
    bodyClass: '',
  },
  journal: {
    Component: JournalPage,
    seo: JOURNAL_SEO,
    bodyClass: '',
  },
  search: {
    Component: SearchPage,
    seo: SEARCH_SEO,
    bodyClass: '',
  },
  sitemap: {
    Component: SitemapPage,
    seo: SITEMAP_SEO,
    bodyClass: '',
  },
  experience: {
    Component: ExperiencePage,
    seo: EXPERIENCE_SEO,
    bodyClass: 'experience-page',
  },
  'privacy-policy': {
    Component: () => (
      <LegalPage
        activeHref="privacy-policy.html"
        num={PRIVACY_PAGE.num}
        title={PRIVACY_PAGE.title}
        lede={PRIVACY_PAGE.lede}
        sections={PRIVACY}
      />
    ),
    seo: PRIVACY_SEO,
    bodyClass: '',
  },
  terms: {
    Component: () => (
      <LegalPage
        activeHref="terms.html"
        num={TERMS_PAGE.num}
        title={TERMS_PAGE.title}
        lede={TERMS_PAGE.lede}
        sections={TERMS}
      />
    ),
    seo: TERMS_SEO,
    bodyClass: '',
  },
  'not-found': {
    Component: NotFoundPage,
    seo: NOT_FOUND_SEO,
    bodyClass: '',
  },
  ...ARTICLE_PAGES,
};

export type PageId = keyof typeof PAGES;
