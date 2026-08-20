import { useEffect } from 'react';

/**
 * Orange Business case study — page-level behaviours ported 1:1 from
 * `js/orange-business-case-study.js`:
 *
 *  - reveal: `.reveal` → `.visible` (IntersectionObserver, threshold .12)
 *  - executive summary <dialog> open/close (showModal/close, backdrop click)
 *  - hero pointer parallax (--hero-image-x, fine pointer only)
 *  - scroll-linked narrative motion (hero media/scale/y/opacity/frame, closing
 *    scale) + top progress bar + nav visibility
 *
 * Respects prefers-reduced-motion (reveals immediately, no hero motion).
 */
export function useOrangePage(): void {
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    motionQuery.addEventListener?.('change', onMotionChange);

    /* --- reveal --- */
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    let revealObserver: IntersectionObserver | undefined;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('visible'));
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            revealObserver?.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
      );
      revealElements.forEach((el) => revealObserver?.observe(el));
    }

    /* --- hero pointer parallax --- */
    const hero = document.querySelector<HTMLElement>('.hero');
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const onHeroPointerMove = (event: PointerEvent) => {
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      hero.style.setProperty('--hero-image-x', `${x * -7}px`);
    };
    const onHeroPointerLeave = () => {
      hero?.style.setProperty('--hero-image-x', '0px');
    };
    if (!reducedMotion && finePointer && hero) {
      hero.addEventListener('pointermove', onHeroPointerMove);
      hero.addEventListener('pointerleave', onHeroPointerLeave);
    }

    /* --- scroll-linked narrative motion --- */
    const progressBar = document.getElementById('progress');
    const nav = document.getElementById('siteNav');
    const closing = document.querySelector<HTMLElement>('.closing');
    const closingImage = document.querySelector<HTMLImageElement>('.closing-media img');
    let frameRequested = false;

    const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
    const sceneProgress = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return clamp((innerHeight - rect.top) / (innerHeight + rect.height));
    };
    const near = (element: HTMLElement | null) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > -innerHeight * 0.2 && rect.top < innerHeight * 1.2;
    };

    const renderScroll = () => {
      const y = scrollY;
      const available = document.documentElement.scrollHeight - innerHeight;
      const page = available > 0 ? y / available : 0;
      if (progressBar) progressBar.style.transform = `scaleX(${page})`;
      if (nav) nav.classList.toggle('is-visible', y > 90);

      if (!reducedMotion && hero) {
        const heroProgress = clamp(y / Math.max(innerHeight, 1));
        hero.style.setProperty('--hero-media-y', `${heroProgress * 18}px`);
        hero.style.setProperty('--hero-scale', String(1 + heroProgress * 0.025));
        hero.style.setProperty('--hero-y', `${heroProgress * -22}px`);
        hero.style.setProperty('--hero-opacity', String(1 - heroProgress * 0.76));
        if (innerWidth > 760) {
          hero.style.setProperty('--frame-top', `${innerHeight * 0.46 * (1 - heroProgress)}px`);
        } else {
          hero.style.removeProperty('--frame-top');
        }
        if (closing && closingImage && near(closing)) {
          closingImage.style.setProperty('--closing-scale', String(1.08 - sceneProgress(closing) * 0.05));
        }
      }
      frameRequested = false;
    };

    const onScroll = () => {
      if (!frameRequested) {
        requestAnimationFrame(renderScroll);
        frameRequested = true;
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    renderScroll();

    return () => {
      motionQuery.removeEventListener?.('change', onMotionChange);
      revealObserver?.disconnect();
      hero?.removeEventListener('pointermove', onHeroPointerMove);
      hero?.removeEventListener('pointerleave', onHeroPointerLeave);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, []);
}
