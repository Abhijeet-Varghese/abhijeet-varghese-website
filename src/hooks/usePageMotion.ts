import { useEffect } from 'react';

interface ParallaxItem {
  host: HTMLElement;
  target: HTMLElement;
  speed: number;
  top: number;
  height: number;
  lastY: number | null;
}

function documentY(element: HTMLElement): number {
  let y = 0;
  let current: HTMLElement | null = element;
  while (current) {
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return y;
}

/**
 * Desktop / shared scroll work from the legacy homepage. Case-study images
 * are deliberately excluded: their frames remain in the same stage/reel, but
 * their artwork is no longer independently translated.
 */
export function usePageMotion(): void {
  useEffect(() => {
    const nav = document.getElementById('siteNav');
    const progress = document.getElementById('progress');
    const journey = document.getElementById('journey');
    const journeyPin = document.getElementById('journeyPin');
    const journeyTrack = document.getElementById('journeyTrack');
    const journeyBar = document.getElementById('journeyBar');
    const hero = document.getElementById('hero');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktopJourney = window.matchMedia('(min-width: 901px)');
    const homeArena = document.body.classList.contains('home-arena');
    // Retain the original homepage runtime state even where the current
    // stylesheet has no active selector for it; it is part of the reduced-
    // motion contract rather than a substitute animation implementation.
    if (homeArena) document.body.classList.toggle('arena-reduce', reduced);

    const parallax: ParallaxItem[] = [];
    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((host) => {
      // Approved focused change: every Featured Work thumbnail is fixed inside
      // its pre-existing case panel. Do not change the panel, film, or stage.
      if (host.matches('.case__panel') || host.closest('.case__panel')) {
        // Do not write a scroll transform to the case artwork. The scoped CSS
        // locks its <picture> at zero while preserving the image's normal
        // entry reveal and all case/stage movement around it.
        const picture = host.querySelector<HTMLElement>('picture');
        picture?.style.setProperty('transform', 'none', 'important');
        picture?.style.setProperty('will-change', 'auto');
        return;
      }

      const requested = Number.parseFloat(host.dataset.parallax ?? '0.05');
      const speed = Number.isFinite(requested) ? requested : 0.05;
      const image = host.querySelector<HTMLElement>('img');
      if (speed === 0) {
        if (image) {
          image.style.willChange = 'auto';
          image.style.setProperty('transform', 'none');
          image.style.setProperty('scale', '1');
        }
        return;
      }
      const target = image ?? host;
      target.style.willChange = 'transform';
      target.style.setProperty('scale', '1.13');
      parallax.push({ host, target, speed, top: 0, height: 0, lastY: null });
    });

    let viewportHeight = window.innerHeight;
    let maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
    let journeyTop = 0;
    let journeyTotal = 0;
    let journeyShift = 0;
    let lastScrollY = Number.NEGATIVE_INFINITY;
    let lastProgress = Number.NaN;
    let lastNavState: boolean | null = null;
    let frame = 0;
    let resizeFrame = 0;
    let mounted = true;

    const measure = () => {
      viewportHeight = window.innerHeight;
      maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
      if (journey instanceof HTMLElement) {
        journeyTop = documentY(journey);
        journeyTotal = Math.max(journey.offsetHeight - viewportHeight, 0);
        journeyShift = journeyTrack instanceof HTMLElement && journeyPin instanceof HTMLElement
          ? Math.max(journeyTrack.scrollWidth - journeyPin.clientWidth + 40, 0)
          : 0;
      }
      parallax.forEach((item) => {
        const previousTransform = item.target.style.transform;
        item.target.style.transform = 'none';
        const rect = item.host.getBoundingClientRect();
        item.top = rect.top + window.scrollY;
        item.height = rect.height;
        item.target.style.transform = previousTransform;
        item.lastY = null;
      });
    };

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      // Legacy homepage choreography compresses the hero and retires its
      // scroll cue shortly after the visitor leaves the opening composition.
      // Keep this ahead of the scroll-value bailout so viewport resizes also
      // refresh the threshold without requiring a second user scroll.
      if (hero instanceof HTMLElement && homeArena) {
        hero.classList.toggle('is-past', scrollY > viewportHeight * 0.28);
      }
      if (Math.abs(scrollY - lastScrollY) < 0.5) return;
      lastScrollY = scrollY;

      const navVisible = scrollY > 90;
      if (nav && navVisible !== lastNavState) {
        nav.classList.toggle('is-visible', navVisible);
        lastNavState = navVisible;
      }
      if (progress instanceof HTMLElement) {
        const raw = Math.min(scrollY / maxScroll, 1);
        const quantized = Math.round(raw * 2000) / 2000;
        if (quantized !== lastProgress) {
          progress.style.transform = `scaleX(${quantized})`;
          lastProgress = quantized;
        }
      }
      if (!reduced) {
        parallax.forEach((item) => {
          const center = item.top + item.height / 2 - scrollY - viewportHeight / 2;
          if (center < -viewportHeight * 1.2 || center > viewportHeight * 1.2) return;
          const translateY = Number((center * item.speed).toFixed(2));
          if (translateY === item.lastY) return;
          item.target.style.transform = `translate3d(0, ${translateY}px, 0)`;
          item.lastY = translateY;
        });
      }

      if (journey instanceof HTMLElement && journeyPin instanceof HTMLElement && journeyTrack instanceof HTMLElement) {
        if (desktopJourney.matches && !reduced && journeyTotal > 0) {
          const progressValue = Math.min(Math.max((scrollY - journeyTop) / journeyTotal, 0), 1);
          journeyTrack.style.transform = `translate3d(${(-progressValue * journeyShift).toFixed(1)}px, 0, 0)`;
          if (journeyBar instanceof HTMLElement) {
            journeyBar.style.transform = `scaleX(${progressValue.toFixed(3)})`;
          }
        } else {
          journeyTrack.style.transform = '';
          if (journeyBar instanceof HTMLElement) journeyBar.style.transform = '';
        }
      }
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        measure();
        requestUpdate();
      });
    };

    const heroObserver = hero && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => document.documentElement.classList.toggle('hero-parked', !entry.isIntersecting),
          { rootMargin: '12% 0px' },
        )
      : null;
    if (hero && heroObserver) heroObserver.observe(hero);

    const resizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(onResize)
      : null;
    resizeObserver?.observe(document.documentElement);

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize, { passive: true });
    desktopJourney.addEventListener?.('change', onResize);
    document.fonts?.ready.then(() => {
      if (mounted) onResize();
    }).catch(() => undefined);

    measure();
    update();

    return () => {
      mounted = false;
      if (frame) cancelAnimationFrame(frame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      desktopJourney.removeEventListener?.('change', onResize);
      heroObserver?.disconnect();
      resizeObserver?.disconnect();
      hero?.classList.remove('is-past');
    };
  }, []);
}
