/**
 * AV OS — static content snapshot (PublishedSnapshot / StaticFallback).
 *
 * This is NOT a new source of truth. It re-exports the existing
 * `src/content/*` modules (the same data the components currently render) as
 * one `ContentDocument`, so that:
 *
 *   1. the runtime loader has a last-known-good fallback (build-time/no-JS),
 *   2. the parity checker can diff static vs runtime content, and
 *   3. the content source can be swapped without touching component code.
 *
 * The static modules are kept verbatim this phase (Phase 3 §13) — removal is
 * a later, explicitly-approved step once runtime parity is proven.
 */
import * as home from './home';
import * as chrome from './chrome';
import * as projects from './projects';
import * as articles from './articles';
import * as experience from './experience';
import * as story from './story';
import * as orange from './orange';
import * as pages from './pages';
import * as seo from './seo';

export interface ContentDocument {
  home: typeof home;
  chrome: typeof chrome;
  projects: typeof projects;
  articles: typeof articles;
  experience: typeof experience;
  story: typeof story;
  orange: typeof orange;
  pages: typeof pages;
  seo: typeof seo;
}

export const STATIC_CONTENT: ContentDocument = {
  home,
  chrome,
  projects,
  articles,
  experience,
  story,
  orange,
  pages,
  seo,
};

export type ContentCollection = keyof ContentDocument;
