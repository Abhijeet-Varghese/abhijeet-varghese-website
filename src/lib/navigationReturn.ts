/**
 * Global navigation return — exact origin + section + scroll restoration.
 * EmailJS / CMS / design are untouched. This is navigation behavior only.
 *
 * Origin is captured on any internal link click (same-origin, left-click, no
 * modifier) and stored in sessionStorage. Inner pages' close button reads that
 * origin, validates it (same-origin, not external), stores it as pending
 * restore, and navigates via location.replace to the clean origin path
 * (pathname+search only — hash/section stays internal). The origin page,
 * on load, reads pending restore and scrolls to exact Y after layout is
 * stable (fonts, images, loader). No visible hash pollution.
 *
 * No SMTP/EmailJS changes, no redesign, no legacy deletion.
 */

export interface NavOrigin {
  fromPath: string;
  fromSearch: string;
  fromHash: string;
  fromSection: string;
  fromScrollY: number;
  ts: number;
}

const ORIGIN_KEY = 'av:nav:origin';
const PENDING_KEY = 'av:nav:pendingRestore';

// Fallback map for direct visits (no valid origin). Values are same-origin paths.
// Homepage sections use hash so scroll restoration can also target the section element.
const FALLBACK_MAP: Record<string, string> = {
  '/story/': '/',
  '/experience/': '/',
  '/case-studies/': '/',
  '/case-studies/orange-business/': '/case-studies/',
  '/case-studies/bharat-petroleum-corporation-limited/': '/case-studies/',
  '/case-studies/indian-army/': '/case-studies/',
  '/portfolio/': '/',
  '/contact/': '/',
  '/insights/': '/',
  '/insights/technology-should-feel-human/': '/insights/',
  '/insights/ai-isnt-replacing-creativity/': '/insights/',
  '/insights/designing-experiences-people-remember/': '/insights/',
  '/insights/why-enterprise-experiences-fail/': '/insights/',
  '/consulting/': '/',
  '/recruiter/': '/',
  '/journal/': '/',
  '/journal-what-a-year-of-ai-enabled-production-taught-me/': '/journal/',
  '/journal-the-experience-centre-as-a-strategic-instrument/': '/journal/',
  '/privacy-policy/': '/',
  '/terms/': '/',
  '/sitemap/': '/',
  '/search/': '/',
};

function normalizePath(path: string): string {
  try {
    const url = new URL(path, location.origin);
    const p = url.pathname;
    // Ensure trailing slash for known routes where canonical has it (except root already "/")
    // We keep as-is but for lookup we try both with and without trailing slash
    return p;
  } catch {
    return path;
  }
}

export function isValidInternalPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return false;
  // Block protocol injection like "https:" or "http:"
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !trimmed.startsWith('/')) return false;
  // Block traversal
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return false;
  try {
    const url = new URL(trimmed, location.origin);
    if (url.origin !== location.origin) return false;
    // Path must start with /
    if (!url.pathname.startsWith('/')) return false;
    // Length guard
    if (url.pathname.length > 200 || url.href.length > 500) return false;
    return true;
  } catch {
    return false;
  }
}

export function sanitizeTargetUrl(target: string): string | null {
  if (!isValidInternalPath(target)) return null;
  try {
    const url = new URL(target, location.origin);
    if (url.origin !== location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function getFallbackForPath(currentPath: string): string {
  const norm = normalizePath(currentPath);
  // Direct map
  if (FALLBACK_MAP[norm]) return FALLBACK_MAP[norm];
  // Try with/without trailing slash
  const withSlash = norm.endsWith('/') ? norm : `${norm}/`;
  const withoutSlash = norm.endsWith('/') && norm !== '/' ? norm.slice(0, -1) : norm;
  if (FALLBACK_MAP[withSlash]) return FALLBACK_MAP[withSlash];
  if (FALLBACK_MAP[withoutSlash]) return FALLBACK_MAP[withoutSlash];
  // For insights/journal dynamic fallback: if path starts with /insights/ -> /insights/
  if (norm.startsWith('/insights/')) return '/insights/';
  if (norm.startsWith('/journal')) return '/journal/';
  if (norm.startsWith('/case-studies/')) return '/case-studies/';
  // Default homepage
  return '/';
}

function findSectionIdForElement(el: Element | null): string {
  if (!el) return '';
  const section = el.closest('section[id]');
  if (section && section.id) return section.id;
  const anyId = el.closest('[id]');
  if (anyId && (anyId as HTMLElement).id) {
    const id = (anyId as HTMLElement).id;
    // Avoid generic ids like bookView/bookDone that are not page sections
    if (id && !['bookView', 'bookDone', 'contactForm', 'cfName', 'cfEmail', 'cfOrg', 'cfMobile', 'cfPhoneWrap', 'cfPhoneFull', 'cfCcValue', 'cfMsg', 'dateTrigger', 'dpGrid', 'dpTitle', 'tslots', 'bookSummary', 'bookSubmit', 'cfNote', 'avLoader', 'siteNav', 'mobileMenu', 'main'].includes(id)) {
      return id;
    }
  }
  return '';
}

export function captureCurrentOrigin(anchor: HTMLAnchorElement | null): NavOrigin {
  const fromPath = location.pathname;
  const fromSearch = location.search;
  let fromHash = location.hash || '';
  let fromSection = '';

  if (anchor) {
    const sid = findSectionIdForElement(anchor);
    if (sid) {
      fromSection = sid;
      // Prefer anchor's section hash over current location hash if location hash is empty
      if (!fromHash) fromHash = `#${sid}`;
    }
  }

  // If no section from anchor, try current location hash
  if (!fromSection && fromHash) {
    fromSection = fromHash.replace(/^#/, '');
  }

  // Fallback: try to infer section at current scroll position
  if (!fromSection) {
    // Find section currently in viewport near top
    const sections = Array.from(document.querySelectorAll('section[id]')) as HTMLElement[];
    let best: HTMLElement | null = null;
    let bestTop = Infinity;
    for (const s of sections) {
      const rect = s.getBoundingClientRect();
      // Section whose top is closest to viewport top but not far below
      if (rect.top <= 160 && rect.bottom > 0) {
        const dist = Math.abs(rect.top);
        if (dist < bestTop) {
          bestTop = dist;
          best = s;
        }
      }
    }
    if (best && best.id) {
      fromSection = best.id;
      if (!fromHash) fromHash = `#${best.id}`;
    }
  }

  return {
    fromPath,
    fromSearch,
    fromHash,
    fromSection,
    fromScrollY: Math.round(window.scrollY || document.documentElement.scrollTop || 0),
    ts: Date.now(),
  };
}

export function storeOrigin(origin: NavOrigin): void {
  try {
    sessionStorage.setItem(ORIGIN_KEY, JSON.stringify(origin));
  } catch {
    // ignore storage errors
  }
}

export function readOrigin(): NavOrigin | null {
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NavOrigin;
    if (!parsed || typeof parsed.fromPath !== 'string' || typeof parsed.fromScrollY !== 'number') return null;
    if (!isValidInternalPath(parsed.fromPath)) return null;
    // Stale after 30 minutes
    if (Date.now() - (parsed.ts || 0) > 30 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storePending(origin: NavOrigin): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(origin));
  } catch {
    // ignore
  }
}

export function readPending(): NavOrigin | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NavOrigin;
    if (!parsed || typeof parsed.fromPath !== 'string') return null;
    if (!isValidInternalPath(parsed.fromPath)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function clearOrigin(): void {
  try {
    sessionStorage.removeItem(ORIGIN_KEY);
  } catch {
    // ignore
  }
}

// For testing: allow manual injection
export function setOriginForTest(origin: NavOrigin): void {
  storeOrigin(origin);
}

// Wait for layout stable: fonts, load, loader disappearance
export async function waitForStable(): Promise<void> {
  // Caller decides scrollRestoration mode; we don't force it globally here
  // to avoid breaking native back/forward restoration for non-close navigations.

  const fontsReady = (document as unknown as { fonts?: { ready: Promise<void> } }).fonts?.ready?.catch(() => undefined) ?? Promise.resolve();

  const loadReady = new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });

  // Loader: wait for av-loader to be removed or hidden
  const loaderGone = new Promise<void>((resolve) => {
    const loader = document.getElementById('avLoader');
    if (!loader) {
      resolve();
      return;
    }
    // If already hidden via class or removed
    const check = () => {
      const gone = !document.getElementById('avLoader') || document.documentElement.classList.contains('av-done') || document.documentElement.classList.contains('av-loader-seen');
      if (gone) {
        resolve();
        return;
      }
      // Wait a bit and check again
      setTimeout(check, 100);
    };
    // Max wait 2.5s for loader
    setTimeout(() => resolve(), 2500);
    check();
  });

  await Promise.all([fontsReady, loadReady, loaderGone]);

  // Two RAFs to ensure layout
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  // Extra tick for lazy images that may still be loading
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
}

export async function performRestore(pending: NavOrigin): Promise<boolean> {
  const currentPath = location.pathname;
  const pendingPath = normalizePath(pending.fromPath);
  const curNorm = normalizePath(currentPath);
  // Must match pending path (allow with/without trailing slash)
  const match = pendingPath === curNorm || `${pendingPath}/` === curNorm || pendingPath === `${curNorm}/`;
  if (!match) return false;

  await waitForStable();

  // Try element scroll for section hash if scrollY is 0 or suspicious
  const targetY = pending.fromScrollY;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll to exact Y
  try {
    window.scrollTo({ top: targetY, left: 0, behavior: prefersReduced ? 'auto' : 'auto' });
  } catch {
    window.scrollTo(0, targetY);
  }

  // Double-check after a short delay that we reached target (layout shifts may have moved)
  await new Promise<void>((resolve) => setTimeout(resolve, 120));
  const afterY = window.scrollY;
  if (Math.abs(afterY - targetY) > 4) {
    try {
      window.scrollTo(0, targetY);
    } catch {
      // ignore
    }
  }

  // Keep URL clean — do NOT expose restoration hash. Scroll is restored programmatically from pending state.

  return true;
}
