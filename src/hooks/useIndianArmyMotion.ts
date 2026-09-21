import { useEffect } from 'react';

/**
 * Indian Army — faithful reproduction of /js/indian-army-case-study.js
 * Pre-React golden master: handles ia-ok/failsafe, reveals (ia-r, ia-stages, ia-cadence) with 0.08 threshold,
 * scrollBehavior auto, parallax (ia-parallax --py) on desktop ≥1000px via requestAnimationFrame + clamp,
 * gate (ia-gate --g), and lazy image is-loaded.
 * No stages/tabs invented — legacy does not have them; we preserve exactly.
 */
export function useIndianArmyMotion() {
  useEffect(() => {
    const doc = document;
    const root = doc.documentElement;
    const body = doc.body;

    // Legacy guard — ensure body has indian-army-case (React puts it on <main>, legacy expects on body)
    if (body && !body.classList.contains('indian-army-case')) {
      body.classList.add('indian-army-case');
    }
    // Also ensure main has it (already there via App)
    const main = doc.getElementById('main');
    if (main && !main.classList.contains('indian-army-case')) {
      main.classList.add('indian-army-case');
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const $$ = (sel: string, ctx: Document | Element = doc) =>
      Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)) as HTMLElement[];
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

    root.classList.add('ia-ok');
    const failsafe = window.setTimeout(() => root.classList.add('ia-failsafe'), 2600);

    const revealEls = $$('.ia-r, .ia-stages, .ia-cadence');
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && !reduce.matches) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-in');
              io!.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      revealEls.forEach((el) => io!.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }

    root.style.scrollBehavior = 'auto';

    const parallaxEls = $$('.ia-parallax');
    const gate = doc.querySelector('.ia-gate') as HTMLElement | null;
    const desktop = window.matchMedia('(min-width: 1000px)');
    let ticking = false;

    const frame = () => {
      ticking = false;
      const vh = window.innerHeight || 1;
      if (reduce.matches) return;
      if (desktop.matches) {
        parallaxEls.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const center = r.top + r.height / 2;
          const t = clamp((center - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
          el.style.setProperty('--py', (t * -16).toFixed(2) + 'px');
        });
      }
      if (gate) {
        const g = gate.getBoundingClientRect();
        const start = vh * 0.85;
        const end = vh * 0.15 - g.height * 0.2;
        const p = clamp((start - g.top) / (start - end), 0, 1);
        gate.style.setProperty('--g', p.toFixed(4));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (desktop.addEventListener) desktop.addEventListener('change', onScroll);
    // Also handle legacy addListener for older browsers
    if ((desktop as unknown as { addListener?: (cb: () => void) => void }).addListener) {
      (desktop as unknown as { addListener: (cb: () => void) => void }).addListener(onScroll);
    }
    frame();

    $$(".ia-fig__frame img[loading='lazy']").forEach((img) => {
      const image = img as HTMLImageElement;
      if (image.complete) {
        image.classList.add('is-loaded');
        return;
      }
      image.addEventListener(
        'load',
        () => image.classList.add('is-loaded'),
        { once: true },
      );
    });

    return () => {
      clearTimeout(failsafe);
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (desktop.removeEventListener) desktop.removeEventListener('change', onScroll);
      if ((desktop as unknown as { removeListener?: (cb: () => void) => void }).removeListener) {
        (desktop as unknown as { removeListener: (cb: () => void) => void }).removeListener(onScroll);
      }
    };
  }, []);
}
