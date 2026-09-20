import { useEffect } from 'react';

/**
 * The loader markup/timers live in index.html so they start while the document
 * parses, exactly like the original inline loader. This hook is the matching
 * elevate.js Hero gate: wait for av-loading to clear, then apply the two-RAF
 * Hero entrance and its non-reduced settled state.
 */
export function useLoader(): void {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>('.hp-hero');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let interval = 0;
    let heroFrame = 0;
    let settledTimer = 0;
    let revealed = false;

    const revealHero = () => {
      if (revealed) return;
      revealed = true;
      heroFrame = requestAnimationFrame(() => {
        heroFrame = requestAnimationFrame(() => {
          heroFrame = 0;
          hero?.classList.add('is-in');
          if (!reduced) {
            settledTimer = window.setTimeout(() => root.classList.add('hero-settled'), 1600);
          }
        });
      });
    };

    // This mirrors elevate.js: its Hero flip polls the document loader at 60ms
    // intervals rather than starting a second, React-owned loader sequence.
    if (root.classList.contains('av-loading')) {
      interval = window.setInterval(() => {
        if (!root.classList.contains('av-loading')) {
          window.clearInterval(interval);
          interval = 0;
          revealHero();
        }
      }, 60);
    } else {
      revealHero();
    }

    return () => {
      if (interval) window.clearInterval(interval);
      if (heroFrame) cancelAnimationFrame(heroFrame);
      if (settledTimer) window.clearTimeout(settledTimer);
    };
  }, []);
}
