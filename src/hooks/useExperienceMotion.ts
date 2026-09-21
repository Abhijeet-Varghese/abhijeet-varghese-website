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

/** Exact Experience-page expansions and timeline state from legacy main.js. */
export function useExperienceMotion(): void {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    document.querySelectorAll<HTMLButtonElement>('.exp-job__more').forEach((button) => {
      const listId = button.getAttribute('aria-controls');
      const list = listId ? document.getElementById(listId) : null;
      const count = list?.querySelectorAll(':scope > li').length ?? 0;
      const baseLabel = count ? `View all ${count} responsibilities` : 'View all responsibilities';
      const label = button.querySelector<HTMLElement>('.exp-job__more-label');
      if (label && count) label.textContent = baseLabel;

      const onClick = () => {
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (list instanceof HTMLElement) {
          list.hidden = open;
          list.classList.toggle('is-hidden', open);
        }
        const currentLabel = button.querySelector<HTMLElement>('.exp-job__more-label');
        if (currentLabel) currentLabel.textContent = open ? baseLabel : 'Show fewer responsibilities';
        button.classList.toggle('is-open', !open);
      };

      button.addEventListener('click', onClick);
      cleanups.push(() => button.removeEventListener('click', onClick));
    });

    const timeline = document.getElementById('expTimeline');
    if (!(timeline instanceof HTMLElement)) {
      return () => cleanups.forEach((cleanup) => cleanup());
    }

    let timelineTop = 0;
    let timelineHeight = 1;
    let frame = 0;
    const measure = () => {
      timelineTop = documentY(timeline);
      timelineHeight = Math.max(timeline.offsetHeight, 1);
    };
    const mark = () => {
      frame = 0;
      const viewportHeight = window.innerHeight || 1;
      const progress = Math.min(Math.max((viewportHeight * 0.9 - (timelineTop - window.scrollY)) / (timelineHeight * 0.6), 0), 1);
      document.body.classList.toggle('exp-scrolled', progress > 0.02);
      timeline.style.setProperty('--exp-fill', progress.toFixed(3));
    };
    const onScroll = () => {
      // The legacy listener schedules one visual update per scroll dispatch.
      // Coalescing still produces its exact calculated frame while avoiding a
      // growing queue under React development tooling.
      if (!frame) frame = window.requestAnimationFrame(mark);
    };
    const onResize = () => {
      measure();
      mark();
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    mark();

    cleanups.push(() => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      window.removeEventListener('resize', onResize);
      document.body.classList.remove('exp-scrolled');
      timeline.style.removeProperty('--exp-fill');
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
}
