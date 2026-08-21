import { apiGet, apiSend } from './client';
import type {
  Article, ClientRecord, ContentDoc, ExperienceJob, Project, Revision, SearchResults,
} from './types';

/**
 * Content API — reads/writes the CMS content document through the existing
 * `GET /api/content` / `PUT /api/content` (content.read / content.write).
 * Mutations send only the changed key + its base version for conflict safety.
 */
export const contentApi = {
  doc: () => apiGet<ContentDoc>('/content', { cache: false }),

  /** Save one content key with optimistic concurrency control. */
  saveKey: (key: keyof ContentDoc, value: unknown, baseVersion?: number) =>
    apiSend<{ ok: boolean; saved: string; draft: boolean }>('PUT', '/content', {
      [key]: value,
      base_versions: baseVersion !== undefined ? { [key]: baseVersion } : undefined,
      publish: false, // draft-only save; publishing is a deliberate separate action
    }),

  publish: (dryRun = false) =>
    apiSend<{ pages: number; articles: number; publish_job?: number }>('POST', `/publish${dryRun ? '?dry_run=1' : ''}`),

  versions: (key: string) => apiGet<Revision[]>(`/versions/${key}`),
  restore: (key: string, version: number) =>
    apiSend<{ ok: boolean }>('POST', `/versions/${key}/restore`, { version }),

  search: (q: string) => apiGet<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
};

/* ---- typed collection helpers (views over the content doc) ---- */
export function projectsOf(doc: ContentDoc): Project[] {
  return Array.isArray(doc.projects) ? doc.projects : [];
}
export function articlesOf(doc: ContentDoc): Article[] {
  return Array.isArray(doc.articles) ? doc.articles : [];
}
export function clientsOf(doc: ContentDoc): ClientRecord[] {
  return Array.isArray(doc.clients) ? doc.clients : [];
}
export function experienceOf(doc: ContentDoc): ExperienceJob[] {
  return Array.isArray(doc.experience) ? doc.experience : [];
}
export function pagesOf(doc: ContentDoc): unknown[] {
  return Array.isArray(doc.pages) ? doc.pages : [];
}
