import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App.jsx';

// Approved cascade — imported byte-identical from the legacy site (order matters).
import './styles/styles.css';
import './styles/elevate.css';
import './styles/hero-v6.css';
import './styles/home-mobile.css';
import './styles/pages.js';

import './analytics/boot.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Service worker: offline fallback only (same sw.js as the static site).
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
