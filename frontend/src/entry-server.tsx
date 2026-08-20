import { renderToString } from 'react-dom/server';
import { PAGES, type PreloadSpec } from './pages';
import { buildHead } from './content/seo';
import { ANALYTICS_SCRIPT } from './lib/analytics';

export interface RenderedPage {
  head: string;
  body: string;
  bodyClass: string;
  analytics: string;
}

/** Default font preload (self-hosted Inter Tight). */
const FONT_PRELOAD: PreloadSpec = { href: 'assets/fonts/inter-tight-normal.woff2', as: 'font', type: 'font/woff2' };

/**
 * Build-time static renderer. Produces the complete inner content of
 * <head> and <div id="root"> for a route so that the published HTML carries
 * real, crawlable content — never a blank #root.
 */
export function renderPage(pageId: string): RenderedPage {
  const entry = PAGES[pageId];
  if (!entry) throw new Error(`Unknown page id "${pageId}"`);

  const body = renderToString(<entry.Component />);
  const preloads: PreloadSpec[] = entry.preloads ?? [FONT_PRELOAD];
  const head = buildHead(entry.seo, { preloads });

  return { head, body, bodyClass: entry.bodyClass, analytics: ANALYTICS_SCRIPT };
}
