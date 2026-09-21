import { useEffect } from 'react';
import { captureCurrentOrigin, storeOrigin, isValidInternalPath } from '../lib/navigationReturn';

/**
 * Global origin capture — runs on every page (via SiteChrome).
 * Captures fromPath/fromHash/fromScrollY/fromSection on internal same-origin
 * link clicks and stores in sessionStorage for the destination's close button.
 * CMS links auto-captured via delegated listener, no hardcoding.
 */
export function useOriginCapture(): void {
  useEffect(() => {
    function shouldCapture(anchor: HTMLAnchorElement): boolean {
      // Ignore close buttons
      if (anchor.hasAttribute('data-history-close') || anchor.closest('[data-history-close]')) return false;
      // Ignore external, mailto, tel, hash-only, download, blank
      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('data:')) return false;
      if (anchor.hasAttribute('download')) return false;
      if (anchor.target === '_blank') return false;
      // Resolve URL
      let url: URL;
      try {
        url = new URL(anchor.href, location.origin);
      } catch {
        return false;
      }
      if (url.origin !== location.origin) return false;
      // Same-page hash navigation — not a page change
      const curr = new URL(location.href);
      if (url.pathname === curr.pathname && url.search === curr.search && url.hash && url.hash !== curr.hash) {
        // This is in-page jump; we still want to not capture? But hash nav is not inner page nav
        // Skip capture for pure hash same-page, as it doesn't open inner page
        return false;
      }
      // Same URL (including same path+search) — not navigation
      if (url.pathname === curr.pathname && url.search === curr.search && url.hash === curr.hash) return false;
      if (!isValidInternalPath(url.pathname + url.search + url.hash)) return false;
      return true;
    }

    function onClick(e: MouseEvent) {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (e.defaultPrevented) return;
      const target = e.target as Element | null;
      if (!target) return;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!shouldCapture(anchor)) return;
      // Capture origin before navigation (left click without preventDefault)
      try {
        const origin = captureCurrentOrigin(anchor);
        storeOrigin(origin);
      } catch {
        // ignore
      }
    }

    // Capture phase to run before other handlers may preventDefault
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}

/**
 * Restore pending scroll after close navigation.
 * Runs on every page.
 */
export function useScrollRestore(): void {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Only if pending exists and matches current path
      const raw = sessionStorage.getItem('av:nav:pendingRestore');
      if (!raw) return;
      let pending: import('../lib/navigationReturn').NavOrigin | null = null;
      try {
        pending = JSON.parse(raw);
      } catch {
        return;
      }
      if (!pending || typeof pending.fromPath !== 'string') return;

      // Validate same-origin already stored correctly, but double check
      // Normalize for match
      const cur = location.pathname;
      const pend = pending.fromPath;
      const normalize = (p: string) => {
        try {
          return new URL(p, location.origin).pathname;
        } catch {
          return p;
        }
      };
      const curN = normalize(cur);
      const pendN = normalize(pend);
      const match = curN === pendN || `${curN}/` === pendN || curN === `${pendN}/`;
      if (!match) return;

      // Prevent browser's default hash jump interfering with exact Y restoration
      try {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      } catch {
        // ignore
      }

      // Wait for stable then scroll
      const { waitForStable, clearPending } = await import('../lib/navigationReturn');
      if (cancelled) return;
      await waitForStable();
      if (cancelled) return;

      const targetY = typeof pending.fromScrollY === 'number' ? pending.fromScrollY : 0;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        window.scrollTo({ top: targetY, left: 0, behavior: prefersReduced ? 'auto' : 'auto' });
      } catch {
        window.scrollTo(0, targetY);
      }

      // Verify and retry once
      setTimeout(() => {
        if (cancelled) return;
        const after = window.scrollY;
        if (Math.abs(after - targetY) > 4) {
          try {
            window.scrollTo(0, targetY);
          } catch {
            // ignore
          }
        }
      }, 140);

      // Clear pending after a short delay to allow verification
      setTimeout(() => {
        if (!cancelled) clearPending();
      }, 600);

      // Do NOT expose restoration hash in URL — keep visible URL clean (pathname+search only).
      // Section/scroll state is restored from pendingOrigin internally via scrollTo.
    }

    // Run after a tick to allow React hydration
    const id = window.setTimeout(() => {
      void run();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);
}
