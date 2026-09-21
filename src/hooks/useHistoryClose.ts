import { useEffect } from 'react';
import { readOrigin, storePending, getFallbackForPath, isValidInternalPath, sanitizeTargetUrl } from '../lib/navigationReturn';

/**
 * Global inner-page Close/Back — exact origin + section + scroll restoration.
 * EmailJS / CMS untouched. Handles all 23 React routes and CMS-generated links
 * via sessionStorage origin capture (see useOriginCapture in SiteChrome).
 * Direct visits with no valid origin fallback to parent/listing/homepage.
 */
export function useHistoryClose(): void {
  useEffect(() => {
    const closes = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-history-close]'));
    if (!closes.length) return;

    const handlers: Array<{ el: HTMLAnchorElement; fn: (e: MouseEvent) => void }> = [];

    closes.forEach((close) => {
      const onClick = (event: MouseEvent) => {
        // Only left-click without modifiers
        if (event.button !== 0) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

        event.preventDefault();

        const currentPath = location.pathname;
        let targetUrl: string | null = null;
        let pendingOrigin: import('../lib/navigationReturn').NavOrigin | null = null;

        // 1) Try stored origin (captured on previous page's link click)
        try {
          const origin = readOrigin();
          const fallbackPath = getFallbackForPath(currentPath);
          const sanitizedFallback = sanitizeTargetUrl(fallbackPath) ?? '/';

          if (origin && isValidInternalPath(origin.fromPath)) {
            const originPath = origin.fromPath;
            // Avoid navigating to self
            const normCurrent = (() => {
              try {
                return new URL(currentPath, location.origin).pathname;
              } catch {
                return currentPath;
              }
            })();
            const normOrigin = (() => {
              try {
                return new URL(originPath, location.origin).pathname;
              } catch {
                return originPath;
              }
            })();
            const same = normCurrent === normOrigin || `${normCurrent}/` === normOrigin || normCurrent === `${normOrigin}/`;
            if (!same) {
              pendingOrigin = origin;
              const search = origin.fromSearch || '';
              // Clean URL: pathname + search only — section/hash stays internal in pendingOrigin for scroll restore, never exposed in URL
              const raw = `${origin.fromPath}${search}`;
              targetUrl = sanitizeTargetUrl(raw) ?? sanitizedFallback;
            } else {
              targetUrl = sanitizedFallback;
              pendingOrigin = {
                fromPath: sanitizedFallback,
                fromSearch: '',
                fromHash: '',
                fromSection: '',
                fromScrollY: 0,
                ts: Date.now(),
              };
            }
          } else {
            targetUrl = sanitizedFallback;
            // For fallback we still store pending so no leftover stale scroll
            pendingOrigin = null;
          }

          // If origin was stale/missing, targetUrl is fallback; no pending needed for scroll (fallback is top)
          // Still set history restoration to manual so browser doesn't jump.
          try {
            if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
          } catch {
            // ignore
          }

          if (pendingOrigin && targetUrl && targetUrl !== sanitizedFallback) {
            // This is a true origin return — store pending so destination can restore exact scroll
            storePending(pendingOrigin);
            // Use replace to avoid duplicate history (Home -> Orange -> Home would otherwise add entry)
            // replace keeps history clean: Orange is replaced by Home, back goes to page before Home
            location.replace(targetUrl);
            return;
          }

          // Direct fallback: no pending scroll (or pending for fallback if it was homepage section)
          // For fallback that is homepage, we still want to clear any stale pending
          try {
            sessionStorage.removeItem('av:nav:pendingRestore');
          } catch {
            // ignore
          }

          // If target is same as href already present, use that
          const href = close.getAttribute('href');
          const fallbackToUse = targetUrl ?? (href ? sanitizeTargetUrl(href) ?? '/' : '/');
          location.replace(fallbackToUse);
        } catch {
          // Absolute fallback: use href or homepage
          const href = close.getAttribute('href') || getFallbackForPath(currentPath);
          const safe = sanitizeTargetUrl(href) ?? '/';
          try {
            sessionStorage.removeItem('av:nav:pendingRestore');
          } catch {
            // ignore
          }
          location.replace(safe);
        }
      };

      close.addEventListener('click', onClick);
      handlers.push({ el: close, fn: onClick });
    });

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    };
  }, []);
}
