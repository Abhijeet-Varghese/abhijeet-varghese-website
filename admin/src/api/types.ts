/**
 * AV OS admin — shared API types.
 * These mirror the backend's `{ok, data, error}` envelope and the documented
 * payload shapes. Nothing privileged (passwords, keys, tokens) is typed here.
 */

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: { code?: string; message?: string; request_id?: string } | null;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionData {
  authed: boolean;
  csrf: string;
  must_change_password: boolean;
  permissions: string[];
  '2fa_pending': boolean;
  user: SessionUser | null;
}

export interface LoginData {
  user: { id: number; name: string; role: string };
  must_change_password: boolean;
  must_2fa?: boolean;
}

export interface StatusData {
  status: 'healthy' | 'degraded';
  environment: string;
  database: string;
  storage: string;
  publish: string;
  media: string;
  ai: string;
  ai_providers: number;
  backup: string;
  perf: { avg_ms: number; requests_24h: number } | null;
  version: string;
  authed: boolean;
  user: { name: string; role: string } | null;
  public_site: boolean;
  timestamp: string;
}

export interface Project {
  id?: string;
  slug: string;
  title: string;
  client: string;
  industry: string;
  category?: string;
  status: string;
  featured?: boolean;
  comingSoon?: boolean;
  image: string;
  imageAlt?: string;
  summary: string;
  role: string;
  year: string;
  challenge: string;
  approach: string;
  outcome: string;
  views?: string;
  updated?: string;
  seo?: Record<string, unknown>;
}

export interface Article {
  id?: string;
  slug: string;
  title: string;
  type: string;
  kind?: string;
  status: string;
  category: string;
  readTime?: string;
  date: string;
  image: string;
  imageAlt?: string;
  excerpt: string;
  paragraphs?: string[];
  backLabel?: string;
  backHref?: string;
  seo?: Record<string, unknown>;
}

export interface ClientRecord {
  id?: string;
  name: string;
  industry?: string;
  logo?: string;
  monogram?: string;
}

export interface ExperienceJob {
  id?: string;
  order?: number;
  status?: string;
  date: string;
  role: string;
  roleSub?: string;
  company: string;
  location?: string;
  summary: string;
  disciplines?: string[];
  responsibilities?: string[];
  moreResponsibilities?: string[];
  lead?: boolean;
  last?: boolean;
}

export interface ContentDoc {
  settings: Record<string, unknown>;
  nav: Record<string, unknown>;
  sections: unknown[];
  pages: unknown[];
  projects: Project[];
  articles: Article[];
  clients: ClientRecord[];
  testimonials: unknown[];
  downloads: unknown[];
  media: unknown[];
  seo: unknown[];
  experience: ExperienceJob[];
  story: Record<string, unknown>;
  orange: Record<string, unknown>;
  page_content: Record<string, unknown>;
  page_seo: Record<string, unknown>;
  _versions?: Record<string, number>;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  type: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  folder: string;
  alt_text: string;
  url: string;
  created_at: string;
}

export interface MediaList {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
}

export interface Revision {
  version: number;
  note: string;
  created_at: string;
}

export interface SearchResults {
  pages: unknown[];
  projects: { id: string; title: string; client?: string }[];
  articles: unknown[];
  clients: { id: string; name: string }[];
  leads: unknown[];
  media: unknown[];
  knowledge: unknown[];
  contacts: unknown[];
  companies: unknown[];
}

export interface FeatureFlag {
  flag: string;
  enabled: boolean;
  environment?: string;
}

export interface DeploymentsData {
  [key: string]: unknown;
}

export interface PublishResult {
  pages: number;
  articles: number;
  publish_job?: number;
  time?: string;
  queued?: boolean;
}
