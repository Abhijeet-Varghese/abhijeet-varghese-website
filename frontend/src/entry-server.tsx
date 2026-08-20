import { renderToString } from 'react-dom/server';
import { PAGES } from './pages';
import { buildHead } from './content/seo';
import { ANALYTICS_SCRIPT } from './lib/analytics';

export interface RenderedPage {
  head: string;
  body: string;
  bodyClass: string;
  analytics: string;
  preloads: { href: string; as: 'font' | 'image'; type?: string; fetchPriority?: string }[];
}

/**
 * Build-time static renderer. Produces the complete inner content of
 * <head> and <div id="root"> for a route so that the published HTML carries
 * real, crawlable content — never a blank #root.
 */
export function renderPage(pageId: string): RenderedPage {
  const entry = PAGES[pageId];
  if (!entry) throw new Error(`Unknown page id "${pageId}"`);

  const body = renderToString(<entry.Component />);
  const preloads = [
    { href: 'assets/fonts/inter-tight-normal.woff2', as: 'font' as const, type: 'font/woff2' },
    { href: 'assets/hero-portrait.webp', as: 'image' as const, fetchPriority: 'high' },
  ];
  const head = buildHead(entry.seo, { preloads });

  return { head, body, bodyClass: entry.bodyClass, analytics: ANALYTICS_SCRIPT, preloads };
}
