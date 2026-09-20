import { useEffect } from 'react';

function reveal(element: Element): void {
  // `in-view` is the exact class used by the original main.js / styles.css
  // reveal contract. Other `is-in` scenes (footer, loader, elevation) are
  // intentionally owned by their respective source-equivalent hooks.
  element.classList.add('in-view');
}

/** One-shot viewport reveals and stagger timing for the approved CSS system. */
export function useReveal(): void {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    // main.js adds this as soon as its real runtime is available. It keeps the
    // original HTML failsafe scoped to a genuinely stalled page rather than
    // prematurely revealing every off-screen chapter during a normal visit.
    root.classList.add('js-ok');

    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const base = Number.parseFloat(group.dataset.dbase ?? '0') || 0;
      Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]')).forEach((element, index) => {
        element.style.setProperty('--d', `${(base + Math.min(index * 0.06, 0.6)).toFixed(2)}s`);
      });
    });

    if (reduced || !('IntersectionObserver' in window)) {
      revealNodes.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    revealNodes.forEach((node) => observer.observe(node));

    // This is the actual main.js recovery, not a substitute reveal system:
    // after 1.4 seconds, only items already in the viewport are unblocked.
    // Future chapters stay eligible for their real IntersectionObserver entry.
    const viewportRecovery = window.setTimeout(() => {
      const viewportHeight = window.innerHeight;
      revealNodes
        .filter((node) => !node.classList.contains('in-view'))
        .forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.top < viewportHeight * 0.94 && rect.bottom > 0) reveal(node);
        });
    }, 1400);

    return () => {
      window.clearTimeout(viewportRecovery);
      observer.disconnect();
    };
  }, []);
}
