import { useEffect } from 'react';

function documentY(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

/** Shared legacy mobile-chrome enhancement, ported with cleanup for React Story. */
export function useMobileChrome(): void {
  useEffect(() => {
    if (!document.body.classList.contains('mobile-chrome')) return;

    const touchQuery = window.matchMedia('(max-width: 700px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = document.querySelector<HTMLElement>('.site-nav');
    const cleanup: Array<() => void> = [];
    let animationFrame = 0;
    let disposed = false;

    Array.from(document.querySelectorAll<HTMLElement>('.mobile-menu__list li')).forEach((item, index) => {
      item.style.setProperty('--mi', String(index));
    });

    let tierZones: Array<{ top: number; bottom: number; light: boolean }> = [];
    const measureTiers = () => {
      tierZones = Array.from(document.querySelectorAll<HTMLElement>('#main > section, #main > article > section, #main > div > section, footer.footer--arena'))
        .map((element) => ({
          top: documentY(element),
          bottom: documentY(element) + element.offsetHeight,
          light: element.classList.contains('t-light'),
        }));
    };

    let currentTier = '';
    const updateTier = () => {
      if (!nav || !touchQuery.matches || !tierZones.length) return;
      const probe = window.scrollY + 40;
      let light = false;
      for (const zone of tierZones) {
        if (probe >= zone.top && probe < zone.bottom) {
          light = zone.light;
          break;
        }
      }
      const tier = light ? 'light' : 'dark';
      if (tier !== currentTier) {
        currentTier = tier;
        nav.setAttribute('data-tier', tier);
      }
    };

    let footerObserver: IntersectionObserver | null = null;
    const revealFooterScenes = () => {
      footerObserver?.disconnect();
      footerObserver = null;
      if (!touchQuery.matches) return;
      const targets = Array.from(document.querySelectorAll<HTMLElement>(
        '.footer--arena .footer__inner, .footer--arena .footer__brandtop',
      ));
      if (!targets.length) return;
      if (reduced || !('IntersectionObserver' in window)) {
        targets.forEach((target) => target.classList.add('is-in'));
        return;
      }
      footerObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
      );
      targets.forEach((target) => {
        if (!target.classList.contains('is-in')) footerObserver?.observe(target);
      });
    };

    let ticking = false;
    const wake = () => {
      if (ticking) return;
      ticking = true;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        ticking = false;
        updateTier();
      });
    };
    const measure = () => {
      if (disposed) return;
      measureTiers();
      wake();
    };
    const onQueryChange = () => {
      if (disposed) return;
      measure();
      revealFooterScenes();
    };

    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    touchQuery.addEventListener?.('change', onQueryChange);
    document.fonts?.ready.then(measure).catch(() => undefined);
    measure();
    revealFooterScenes();

    cleanup.push(() => window.removeEventListener('scroll', wake));
    cleanup.push(() => window.removeEventListener('resize', measure));
    cleanup.push(() => window.removeEventListener('load', measure));
    cleanup.push(() => touchQuery.removeEventListener?.('change', onQueryChange));

    return () => {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      footerObserver?.disconnect();
      cleanup.forEach((dispose) => dispose());
    };
  }, []);
}
