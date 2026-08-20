import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { PAGES } from './pages';
import { initNavOrigin } from './lib/nav-origin';
import './styles/app.css';

/**
 * Client entry — hydrates the statically-rendered page. The page id is read
 * from the root element's data-page attribute (set by the prerender step).
 */
const root = document.getElementById('root');
const pageId = root?.dataset.page ?? 'home';
const entry = PAGES[pageId];

// Mark JS as loaded: disables the reveal-failsafe (mirrors legacy main.js).
document.documentElement.classList.add('js-ok');
document.body.classList.add('is-ready');

if (!entry) {
  throw new Error(`Unknown page id "${pageId}"`);
}

initNavOrigin();

const { Component } = entry;

if (root && root.childElementCount > 0) {
  hydrateRoot(
    root,
    <StrictMode>
      <Component />
    </StrictMode>,
  );
} else {
  createRoot(root as HTMLElement).render(
    <StrictMode>
      <Component />
    </StrictMode>,
  );
}
