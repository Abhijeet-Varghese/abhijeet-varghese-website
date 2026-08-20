/**
 * Milestone 4 domain types — articles, legal/utility pages, search, and the
 * booking/lead API contract. Mirrors the PHP/CMS content shape; nothing
 * privileged is represented.
 */

import type { SeoData } from './index';

export type ArticleKind = 'essay' | 'journal';

export interface Article {
  slug: string;
  kind: ArticleKind;
  title: string;
  /** meta description + article hero lede */
  excerpt: string;
  /** hero meta tag, e.g. "AI · 8 min" */
  tag: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  /** body paragraphs; empty string = blank line (<p>&nbsp;</p>) */
  paragraphs: string[];
  /** ISO date shown in the byline and used for JSON-LD datePublished */
  date: string;
  /** back-link label, e.g. "← All insights" */
  backLabel: string;
  backHref: string;
  /** optional "Keep reading" related link */
  related?: { title: string; href: string; label: string };
  seo: SeoData;
}

export interface IndexEntry {
  /** leading serif numeral, e.g. "01" */
  num: string;
  title: string;
  tag: string;
  excerpt: string;
  href: string;
}

export interface LegalSection {
  heading: string;
  body: string;
}

export interface SearchResult {
  type: string;
  title: string;
  excerpt: string;
  url: string;
  tags: string;
}

/* ---------- Booking / lead API contract (PHP /api/public/lead) ---------- */

export interface Lead {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** optional preferred date (ISO) + time (HH:mm) appended to message */
  preferredTime?: string;
  projectType: 'intro call request' | 'website message';
  source: 'website';
  page: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** honeypot — always empty; any value → spam drop server-side */
  website: '';
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface BookingRequest {
  id: number;
  status: BookingStatus;
  score: number;
}

export interface CalendarSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface Availability {
  date: string;
  slots: CalendarSlot[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: 'spam';
  duplicate?: boolean;
}
