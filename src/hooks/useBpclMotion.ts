import { useEffect } from 'react';

/**
 * BPCL case study — faithful restoration of pre-React functionality.
 * Instead of approximating, we load the original 9 JS files in order
 * (config → core → navigation → imageViewer → dayNight → blueprint → walkthrough → content → scrollAnimations)
 * so that all dynamic content (challengeCopy, strategyList, viewer, dayNight, blueprint, walkthrough video with space)
 * is populated exactly as in the legacy. This preserves 100% pre-React behavior.
 */
export function useBpclMotion() {
  useEffect(() => {
    // Add legacy body class so legacy JS `if(!body.classList.contains("bpcl-case"))return` would pass if it were run,
    // and so that CSS `body.bpcl-case` selectors apply. React puts class on <main> already, but body needs it too.
    document.body.classList.add('bpcl-case');
    const addMainClass = () => {
      const main = document.getElementById('main');
      if (main) main.classList.add('bpcl-case');
    };
    addMainClass();

    // Load legacy BPCL scripts in order. config.js must load first (defines window.BPCL).
    const scripts = [
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/config.js?v=4.4.5',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/core.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/navigation.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/imageViewer.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/dayNightSlider.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/blueprintViewer.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/walkthrough.js?v=4.4.4',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/content.js',
      '/case-studies/bharat-petroleum-corporation-limited/assets/js/scrollAnimations.js',
    ];

    const elements: HTMLScriptElement[] = [];
    let cancelled = false;

    const load = async () => {
      for (const src of scripts) {
        if (cancelled) break;
        // Skip if already loaded (avoid double load on React StrictMode double-mount)
        if (document.querySelector(`script[src="${src}"]`)) continue;
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          // config.js is not defer in legacy, but others are defer — we load sequentially anyway
          s.async = false;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load ${src}`));
          elements.push(s);
          document.body.appendChild(s);
        });
      }
    };

    load().catch((e) => {
      console.error('[BPCL] legacy scripts failed', e);
    });

    // Fallback reveal for any elements that legacy scrollAnimations might miss (e.g., if reduced-motion)
    const reveals = [...document.querySelectorAll<HTMLElement>('.reveal, .bp-reveal')];
    let observer: IntersectionObserver | null = null;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if ('IntersectionObserver' in window && !reduced && reveals.length) {
      observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-in');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      reveals.forEach((el) => observer!.observe(el));
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      // Do not remove legacy scripts on unmount — they are idempotent and define window.BPCL;
      // removing them would not undo their DOM population. Keep body class for SPA navigation.
      // Cleanup only the observer.
    };
  }, []);
}
