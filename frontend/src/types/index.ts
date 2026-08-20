/**
 * Shared domain types for the AV OS frontend.
 *
 * These mirror the PHP/CMS `content_store` shape (see avos-data/site.json)
 * so the Vite build can consume the same published content snapshot the
 * backend emits. Nothing privileged (drafts, users, leads, tokens) is ever
 * represented here.
 */

export type Theme = 'light' | 'dark';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: string;
  noindex?: boolean;
  jsonLd?: object;
}

export interface NavLink {
  label: string;
  href: string;
  /** optional numbered index used in the mobile menu (e.g. "01") */
  index?: string;
  /** marks the link as the current page */
  active?: boolean;
}

export interface FooterColumn {
  label: string;
  links: NavLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  /** inline SVG path data rendered for the icon */
  icon: 'linkedin' | 'instagram' | 'whatsapp' | 'youtube' | 'behance';
}

export interface ChromeData {
  brandLabel: string;
  brandHref: string;
  logoUrl: string;
  primary: NavLink[];
  mobile: NavLink[];
  cta: NavLink;
  footer: {
    line: string;
    email: string;
    emailHref: string;
    phone: string;
    phoneHref: string;
    availability: string;
    columns: FooterColumn[];
    social: SocialLink[];
    copyright: string;
    note: string;
  };
}

export interface Revealable {
  reveal?: boolean;
  revealDelay?: number;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  image?: string;
  href: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  image?: string;
  href: string;
  date?: string;
  kind: 'essay' | 'journal';
}

export interface Client {
  name: string;
  logo: string;
}

export interface Capability {
  title: string;
  description: string;
}

export interface Era {
  name: string;
  description: string;
}

export interface CaseStudySummary {
  title: string;
  category: string;
  summary: string;
  image: string;
  href: string;
}

/** A fully described public route for the route manifest / prerender step. */
export interface RouteSpec {
  /** filesystem path of the generated HTML, relative to dist/ */
  file: string;
  /** public URL path (e.g. "/", "/story.html") */
  path: string;
  pageId: string;
  seo: SeoData;
  bodyClass?: string;
}
