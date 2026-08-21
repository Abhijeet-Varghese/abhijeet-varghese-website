import { StrictMode, type ComponentType } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { initNavOrigin } from './nav-origin';
import { CMSContentProvider } from '@/content/provider';

/**
 * Shared hydration bootstrap. Each page entry calls this with its own page
 * component, so Vite emits a separate JS chunk per route (route-level
 * splitting) — the homepage never pulls Story/Evolution/etc.
 */
export function hydratePage(Component: ComponentType, pageId: string): void {
  document.documentElement.classList.add('js-ok');
  document.body.classList.add('is-ready');
  initNavOrigin();

  const root = document.getElementById('root');
  if (!root) return;
  root.dataset.page = pageId;

  if (root.childElementCount > 0) {
    hydrateRoot(
      root,
      <StrictMode>
        <CMSContentProvider>
          <Component />
        </CMSContentProvider>
      </StrictMode>,
    );
  } else {
    createRoot(root).render(
      <StrictMode>
        <CMSContentProvider>
          <Component />
        </CMSContentProvider>
      </StrictMode>,
    );
  }
}
