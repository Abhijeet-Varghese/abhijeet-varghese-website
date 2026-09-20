import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

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
 * Touch choreography ported from the approved homepage motion layer.
 * The only purposeful divergence is that it never sets `--work-px`: the
 * gallery film still pans through cases, but each case's artwork stays locked
 * in its own matte/frame.
 */
export function useMobileHomeMotion(): void {
  useEffect(() => {
    if (!document.body.classList.contains('home-arena')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchQuery = window.matchMedia('(max-width: 700px)');
    const squatQuery = window.matchMedia('(max-width: 700px) and (max-height: 560px) and (orientation: landscape)');
    const workSection = document.getElementById('work');
    const workStage = workSection?.querySelector<HTMLElement>('.work-stage') ?? null;
    const workFilm = document.getElementById('workFilm');
    const cases = workFilm ? Array.from(workFilm.querySelectorAll<HTMLElement>('.case')) : [];
    const hudNumber = document.getElementById('workHudNum');
    const hudBar = document.getElementById('workHudBar');
    const capabilityCards = Array.from(document.querySelectorAll<HTMLElement>('.cap-list .cap'));
    const journeyTrack = document.getElementById('journeyTrack');
    const journeyEras = journeyTrack ? Array.from(journeyTrack.querySelectorAll<HTMLElement>('.era')) : [];
    const journeyBar = document.getElementById('journeyBar');
    const nav = document.getElementById('siteNav');
    const footer = document.querySelector<HTMLElement>('footer.footer--arena');
    const footerInner = footer?.querySelector<HTMLElement>('.footer__inner') ?? null;

    let pinned = false;
    let stageWidth = 0;
    let shift = 1;
    let pinStart = 0;
    let pinLength = 1;
    let rests = [0];
    let current = 0;
    let target = 0;
    let settleFrame = 0;
    let scrollFrame = 0;
    let resizeFrame = 0;
    let currentTier = '';
    let tierZones: Array<{ top: number; bottom: number; light: boolean }> = [];

    const setFilm = (x: number) => {
      if (workFilm instanceof HTMLElement) workFilm.style.transform = `translate3d(${-x.toFixed(1)}px, 0, 0)`;
    };

    const measureTiers = () => {
      tierZones = Array.from(document.querySelectorAll<HTMLElement>('#main > section, #main > div > section, footer.footer--arena'))
        .map((element) => {
          const top = documentY(element);
          return { top, bottom: top + element.offsetHeight, light: element.classList.contains('t-light') };
        });
    };

    const measure = () => {
      if (pinned && workSection instanceof HTMLElement && workStage instanceof HTMLElement && workFilm instanceof HTMLElement) {
        stageWidth = workFilm.clientWidth || workSection.clientWidth;
        shift = Math.max(workFilm.scrollWidth - stageWidth, 1);
        pinStart = documentY(workStage);
        const previous = workFilm.style.transform;
        workFilm.style.transform = 'none';
        const filmRect = workFilm.getBoundingClientRect();
        rests = cases.map((caseElement) => {
          const caseRect = caseElement.getBoundingClientRect();
          return clamp(stageWidth / 2 - (caseRect.left - filmRect.left + caseRect.width / 2), -shift, 0) * -1;
        });
        workFilm.style.transform = previous;
        const step = clamp(window.innerHeight * 0.9, 440, 980);
        pinLength = Math.max((cases.length - 1) * step + window.innerHeight * 0.5, 1);
        const runway = (pinStart - documentY(workSection)) + pinLength + window.innerHeight;
        workSection.style.setProperty('--work-runway', `${runway.toFixed(0)}px`);
      } else if (workSection instanceof HTMLElement) {
        workSection.style.removeProperty('--work-runway');
      }
      measureTiers();
    };

    const settle = () => {
      settleFrame = 0;
      const delta = target - current;
      if (Math.abs(delta) < 0.4) {
        current = target;
        setFilm(current);
        return;
      }
      current += delta * 0.14;
      setFilm(current);
      settleFrame = requestAnimationFrame(settle);
    };

    const armPin = () => {
      const nextPinned = touchQuery.matches && !reduced && !squatQuery.matches && workFilm instanceof HTMLElement;
      if (nextPinned === pinned) return;
      pinned = nextPinned;
      document.body.classList.toggle('hm-pin', pinned);
      if (!pinned && workFilm instanceof HTMLElement) {
        workFilm.style.transform = '';
        cases.forEach((caseElement) => {
          caseElement.classList.remove('is-active');
          // Defensive cleanup for stale markup/scripts; this migration never
          // assigns this property so thumbnails cannot drift.
          caseElement.style.removeProperty('--work-px');
        });
        if (hudBar instanceof HTMLElement) hudBar.style.transform = 'scaleX(0.001)';
        if (workSection instanceof HTMLElement) workSection.style.removeProperty('--work-runway');
        current = 0;
        target = 0;
      }
      measure();
    };

    let litCount = 0;
    const eraObserver = 'IntersectionObserver' in window && journeyEras.length
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting || entry.target.classList.contains('is-lit')) return;
              entry.target.classList.add('is-lit');
              litCount += 1;
              if (journeyBar instanceof HTMLElement) {
                journeyBar.style.transform = `scaleX(${(litCount / journeyEras.length).toFixed(3)})`;
              }
            });
          },
          { rootMargin: '-42% 0px -42% 0px', threshold: 0 },
        )
      : null;
    journeyEras.forEach((era) => eraObserver?.observe(era));

    // The touch footer stages its closing line, contact action and signature
    // independently. Those remaining scene triggers retain the approved
    // mobile choreography without introducing an extra footer cue.
    const footerScenes = footer
      ? [
          footerInner,
          ...Array.from(footer.querySelectorAll<HTMLElement>('.footer__line, .footer__links a[href="/contact/"], .footer__brandtop')),
        ].filter((element): element is HTMLElement => element instanceof HTMLElement)
      : [];
    const footerObserver = 'IntersectionObserver' in window && footerScenes.length
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const scene = entry.target as HTMLElement;
              scene.classList.add('is-in');
              footerObserver?.unobserve(scene);
            });
          },
          { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
        )
      : null;
    const observeFooterScenes = () => {
      if (!touchQuery.matches) return;
      footerScenes.forEach((scene) => {
        if (!scene.classList.contains('is-in')) footerObserver?.observe(scene);
      });
    };
    observeFooterScenes();

    const update = () => {
      scrollFrame = 0;
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;

      if (nav instanceof HTMLElement && tierZones.length && touchQuery.matches) {
        const probe = scrollY + 40;
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
      }

      if (pinned && workFilm instanceof HTMLElement && cases.length) {
        const progress = clamp((scrollY - pinStart) / pinLength, 0, 1);
        const position = progress * (cases.length - 1);
        const activeIndex = clamp(Math.round(position), 0, cases.length - 1);
        target = rests[activeIndex] ?? 0;
        if (!settleFrame && Math.abs(target - current) >= 0.4) settleFrame = requestAnimationFrame(settle);
        cases.forEach((caseElement, index) => {
          caseElement.classList.toggle('is-active', index === activeIndex);
          // Intentionally no --work-px image translation here.
        });
        if (hudNumber) hudNumber.textContent = String(activeIndex + 1).padStart(2, '0');
        if (hudBar instanceof HTMLElement) hudBar.style.transform = `scaleX(${Math.max(progress, 0.001).toFixed(3)})`;
      }

      if (touchQuery.matches) {
        for (let index = 0; index < capabilityCards.length - 1; index += 1) {
          const card = capabilityCards[index];
          const nextCard = capabilityCards[index + 1];
          const cardRect = card.getBoundingClientRect();
          const nextRect = nextCard.getBoundingClientRect();
          const squash = clamp((cardRect.bottom - nextRect.top) / Math.max(cardRect.height, 1), 0, 1);
          card.style.setProperty('--squash', squash.toFixed(3));
        }
        if (journeyTrack instanceof HTMLElement) {
          const rect = journeyTrack.getBoundingClientRect();
          const spine = clamp((viewportHeight * 0.7 - rect.top) / Math.max(rect.height, 1), 0, 1);
          journeyTrack.style.setProperty('--spine', spine.toFixed(3));
        }
      }
    };

    const requestUpdate = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    };
    const onResize = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        measure();
        requestUpdate();
      });
    };
    const onQueryChange = () => {
      armPin();
      observeFooterScenes();
      requestUpdate();
    };

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(document.documentElement);

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize, { passive: true });
    touchQuery.addEventListener?.('change', onQueryChange);
    squatQuery.addEventListener?.('change', onQueryChange);
    document.fonts?.ready.then(onResize).catch(() => undefined);

    armPin();
    measure();
    update();
    // Keep the legacy QA-hook field names as aliases while retaining the
    // clearer React names used by the local regression harness.
    window.__avWork = () => ({
      pinStart,
      pinLength,
      rests,
      stageWidth,
      pinned,
      pinLen: pinLength,
      stageW: stageWidth,
      pinOn: pinned,
    });

    return () => {
      if (settleFrame) cancelAnimationFrame(settleFrame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      touchQuery.removeEventListener?.('change', onQueryChange);
      squatQuery.removeEventListener?.('change', onQueryChange);
      eraObserver?.disconnect();
      footerObserver?.disconnect();
      resizeObserver?.disconnect();
      document.body.classList.remove('hm-pin');
      if (window.__avWork) delete window.__avWork;
    };
  }, []);
}
