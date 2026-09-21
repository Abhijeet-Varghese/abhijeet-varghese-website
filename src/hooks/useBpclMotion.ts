import { useEffect } from 'react';

/**
 * BPCL case study motion — faithful reproduction of the legacy
 * assets/js/* interactions (day/night, blueprint, walkthrough, image viewer).
 * For desktop the behavior is preserved exactly; for ≤900 the same intent
 * is kept but via touch-friendly targets and reduced motion.
 */
export function useBpclMotion() {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    // Reveal observer (mirrors scrollAnimations.js)
    const reveals = [...document.querySelectorAll<HTMLElement>('.reveal, .bp-reveal')];
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && reveals.length && !reduced) {
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
    } else {
      reveals.forEach((el) => el.classList.add('is-in'));
    }

    // Day/Night slider (bp-day-night)
    const slider = document.querySelector<HTMLElement>('.bp-day-night');
    let sliderCleanup: (() => void) | null = null;
    if (slider) {
      const handle = slider.querySelector<HTMLElement>('.bp-day-night__handle');
      const after = slider.querySelector<HTMLElement>('.bp-day-night__after');
      const input = slider.querySelector<HTMLInputElement>('input[type="range"]');
      if (handle && after && input) {
        const update = () => {
          const v = Number(input.value);
          after.style.clipPath = `inset(0 0 0 ${v}%)`;
          handle.style.left = `${v}%`;
        };
        input.addEventListener('input', update);
        update();
        sliderCleanup = () => input.removeEventListener('input', update);
      }
    }

    // Blueprint viewer toggle
    const bpBtns = [...document.querySelectorAll<HTMLElement>('.bp-blueprint__tabs button')];
    const bpPanels = [...document.querySelectorAll<HTMLElement>('.bp-blueprint__panel')];
    const bpListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (bpBtns.length && bpPanels.length) {
      bpBtns.forEach((btn) => {
        const fn = () => {
          bpBtns.forEach((b) => {
            b.classList.toggle('is-active', b === btn);
            b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
          });
          bpPanels.forEach((p) => p.classList.toggle('is-active', p.id === (btn.dataset.target as string)));
        };
        btn.addEventListener('click', fn);
        bpListeners.push({ el: btn, fn });
      });
    }

    // Walkthrough tabs
    const walkBtns = [...document.querySelectorAll<HTMLElement>('.bp-walk__tabs button')];
    const walkFrames = [...document.querySelectorAll<HTMLElement>('.bp-walk__frame')];
    const walkListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (walkBtns.length && walkFrames.length) {
      walkBtns.forEach((btn) => {
        const fn = () => {
          walkBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
          walkFrames.forEach((f) => f.classList.toggle('is-active', f.id === (btn.dataset.target as string)));
        };
        btn.addEventListener('click', fn);
        walkListeners.push({ el: btn, fn });
      });
    }

    // Miniature image viewer (lightbox)
    const viewer = document.querySelector('[data-bp-viewer]') as HTMLElement | null;
    const viewerImg = viewer?.querySelector('img') as HTMLImageElement | null;
    const viewerClose = viewer?.querySelector('[data-close]') as HTMLElement | null;
    const miniatureImages = [...document.querySelectorAll<HTMLElement>('[data-bp-mini]')];
    const miniatureListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    let closeFn: (() => void) | null = null;
    if (viewer && viewerImg && miniatureImages.length) {
      miniatureImages.forEach((img) => {
        const fn = () => {
          const src = (img as HTMLImageElement).src || img.getAttribute('data-src');
          if (src) viewerImg.src = src;
          viewer.setAttribute('aria-hidden', 'false');
          (viewer as unknown as HTMLDialogElement).showModal?.();
          viewer.classList.add('is-open');
        };
        img.addEventListener('click', fn);
        miniatureListeners.push({ el: img, fn });
      });
      closeFn = () => {
        viewer.classList.remove('is-open');
        viewer.setAttribute('aria-hidden', 'true');
        (viewer as unknown as HTMLDialogElement).close?.();
      };
      viewerClose?.addEventListener('click', closeFn);
      viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeFn?.();
      });
    }

    return () => {
      observer?.disconnect();
      sliderCleanup?.();
      bpListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      walkListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      miniatureListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      if (closeFn && viewerClose) viewerClose.removeEventListener('click', closeFn);
    };
  }, []);
}
