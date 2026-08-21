import { useEffect } from 'react';

/**
 * Shared scroll-driven behaviours used by every page (REBUILD, identical
 * visual output):
 *
 *  - reveal-on-scroll (IntersectionObserver, threshold 0.15, -6% rootMargin)
 *  - reveal-group stagger via --d custom property
 *  - reading-progress bar scaleX
 *  - nav "is-visible" past 90px
 *  - active nav link (aria-current)
 *
 * Homepage-only motion (parallax / journey pin / hero "is-past") lives in
 * `home-motion.ts` so it is not shipped to other routes.
 */
export function useSiteChrome(): void {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- active nav link --- */
    const hereFile = (location.pathname.split('/').pop() || '/').replace(/\/$/, '') || '/';
    document
      .querySelectorAll<HTMLAnchorElement>('.nav-links a, .mobile-menu__list a')
      .forEach((a) => {
        const file = (a.getAttribute('href') || '').split('/').pop();
        if (file && file === hereFile) a.setAttribute('aria-current', 'page');
      });

    /* --- reveal-group stagger delays --- */
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const base = parseFloat(group.dataset.dbase || '0');
      group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
        el.style.setProperty('--d', `${(base + Math.min(i * 0.06, 0.6)).toFixed(2)}s`);
      });
    });

    /* --- reveal on scroll --- */
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    let revealIO: IntersectionObserver | undefined;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in-view'));
    } else {
      revealIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('in-view');
              revealIO!.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      revealEls.forEach((el) => revealIO!.observe(el));
      const t = window.setTimeout(() => {
        const vh = window.innerHeight;
        revealEls
          .filter((el) => !el.classList.contains('in-view'))
          .forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('in-view');
          });
      }, 1400);
      window.addEventListener(
        'pagehide',
        () => window.clearTimeout(t),
        { once: true },
      );
    }

    /* --- nav visibility + progress (rAF-scoped) --- */
    const nav = document.getElementById('siteNav');
    const progress = document.getElementById('progress');
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('is-visible', y > 90);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      }
      ticking = false;
    };
    const onScrollThrottled = () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    onScrollThrottled();

    return () => {
      revealIO?.disconnect();
      window.removeEventListener('scroll', onScrollThrottled);
    };
  }, []);
}
