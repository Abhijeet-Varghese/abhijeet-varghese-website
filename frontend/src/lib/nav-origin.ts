/**
 * Contextual origin / close behaviour (typed React replacement for the legacy
 * `avos:nav-origin` / `avos:nav-restore` sessionStorage flow).
 *
 * Inner pages (case studies, essays, journal entries) opened from a section
 * must close back to the exact originating route + section + scroll position —
 * never a hard redirect to the homepage hero.
 */

const ORIGIN_KEY = 'avos:nav-origin';
const RESTORE_KEY = 'avos:nav-restore';

interface OriginSnapshot {
  path: string;
  href: string;
  hash: string;
  y: number;
  section: string;
  t: number;
}

function readJSON<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null') as T | null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function snapshotOrigin(): OriginSnapshot {
  let section = '';
  document.querySelectorAll<HTMLElement>('main [id], section[id]').forEach((el) => {
    if (el.getBoundingClientRect().top <= 140) section = el.id;
  });
  return {
    path: location.pathname + location.search,
    href: location.href,
    hash: location.hash,
    y: Math.round(window.scrollY || 0),
    section,
    t: Date.now(),
  };
}

export function restoreOriginOnce(): void {
  const restore = readJSON<OriginSnapshot>(RESTORE_KEY);
  if (!restore) return;
  sessionStorage.removeItem(RESTORE_KEY);
  const apply = () => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    if (restore.section) {
      const el = document.getElementById(restore.section);
      if (el) {
        el.scrollIntoView();
        root.style.scrollBehavior = prev;
        return;
      }
    }
    if (typeof restore.y === 'number') window.scrollTo(0, restore.y);
    root.style.scrollBehavior = prev;
  };
  requestAnimationFrame(() => requestAnimationFrame(apply));
  window.addEventListener('pageshow', apply, { once: true });
}

let initialized = false;

/**
 * Attach the origin-capture + close/back listeners. Called once at app root
 * (idempotent — safe under StrictMode double-invoke).
 */
export function initNavOrigin(): void {
  if (typeof document === 'undefined' || initialized) return;
  initialized = true;
  restoreOriginOnce();

  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
    if (!a) return;
    // Calendly links are never followed unless explicitly opted in.
    if (/calendly\.com/i.test(a.href) && !a.hasAttribute('data-schedule')) {
      e.preventDefault();
      return;
    }
    if (a.hasAttribute('data-history-close') || a.target === '_blank' || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href') || '';
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
    try {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      writeJSON(ORIGIN_KEY, snapshotOrigin());
    } catch {
      /* ignore */
    }
  });

  const pageClose = document.querySelector<HTMLElement>('[data-history-close]');
  if (pageClose) {
    pageClose.addEventListener('click', (event) => {
      event.preventDefault();
      const origin = readJSON<OriginSnapshot>(ORIGIN_KEY);
      const here = location.pathname + location.search;
      let sameSiteReferrer = false;
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        sameSiteReferrer = !!referrer && referrer.origin === location.origin && referrer.href !== location.href;
      } catch {
        sameSiteReferrer = false;
      }

      if (origin && origin.path && origin.path !== here) {
        writeJSON(RESTORE_KEY, origin);
        sessionStorage.removeItem(ORIGIN_KEY);
        if (sameSiteReferrer && history.length > 1) {
          history.back();
          return;
        }
        const dest = origin.path + (origin.hash || (origin.section ? `#${origin.section}` : ''));
        location.assign(dest);
        return;
      }

      if (sameSiteReferrer && history.length > 1) {
        history.back();
        return;
      }
      location.assign(pageClose.getAttribute('href') || '/');
    });
  }
}
