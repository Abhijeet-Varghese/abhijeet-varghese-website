import { useEffect } from 'react';

/**
 * Story (About) page — scroll/chrome behaviours ported from production main.js:
 *  - prologue title-line parallax (hero depth)
 *  - identity portrait parallax
 *  - "zoom-out" stage scrub (--zp + label states + ghost fade)
 *  - stat counter (data-count)
 *  - prologue marquee play/pause gate
 *  - press states (is-pressing) + reduced-motion body class toggles
 *
 * Note: the production env-section detection (body.dataset.env) has no CSS
 * consumer and was omitted — no visual effect, purely dead writes.
 */
export function useAboutPage(): void {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('arena-reduce', prefersReduced);
    document.body.classList.toggle('about-reduce', prefersReduced);

    /* --- press states --- */
    const INTERACTIVE = "a, button, [role='button'], summary";
    const onPointerDown = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest(INTERACTIVE);
      if (t) t.classList.add('is-pressing');
    };
    const pressClear = (e: Event) => {
      const t = (e.target as HTMLElement | null)?.closest(INTERACTIVE);
      if (t) t.classList.remove('is-pressing');
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    const clearEvts = ['pointerup', 'pointerleave', 'pointercancel'] as const;
    clearEvts.forEach((ev) => document.addEventListener(ev, pressClear, { passive: true }));

    /* --- stat counter --- */
    const statNums = Array.from(document.querySelectorAll<HTMLElement>('.about-frame__num strong[data-count]'));
    let statsIO: IntersectionObserver | undefined;
    if (statNums.length) {
      statsIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            statsIO!.unobserve(e.target);
            const target = parseInt((e.target as HTMLElement).dataset.count ?? '', 10) || 0;
            const numEl = (e.target as HTMLElement).querySelector<HTMLElement>('.about-frame__num-val') ?? (e.target as HTMLElement);
            if (prefersReduced || target <= 0) {
              numEl.textContent = String(target);
              return;
            }
            const t0 = performance.now();
            const dur = 1100;
            const step = (now: number) => {
              const p = Math.min((now - t0) / dur, 1);
              numEl.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        },
        { threshold: 0.4 },
      );
      statNums.forEach((s) => statsIO!.observe(s));
    }

    /* --- marquee play/pause gate --- */
    const mqTracks = Array.from(document.querySelectorAll<HTMLElement>('.about-prologue__mq-track'));
    let mqGate: IntersectionObserver | undefined;
    if (mqTracks.length) {
      mqGate = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            (e.target as HTMLElement).style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
          });
        },
        { threshold: 0.02 },
      );
      mqTracks.forEach((t) => mqGate!.observe(t));
    }

    /* --- about chrome scroll loop --- */
    const pl = document.getElementById('prologue');
    const plLines = pl ? Array.from(pl.querySelectorAll<HTMLElement>('.about-prologue__line')) : [];
    const heroDepth = [-0.055, -0.095, -0.14];
    const portrait = document.querySelector<HTMLImageElement>('.about-frame__portrait img');
    const zoomStage = document.getElementById('aboutZoomStage');
    const zoomFrame = document.getElementById('aboutZoomFrame');
    const zoomLabels = Array.from(document.querySelectorAll<HTMLElement>('#aboutZoomLabels li'));
    const g1 = document.getElementById('aboutZoomGhost1');
    const g2 = document.getElementById('aboutZoomGhost2');

    let aboutChromeTick = false;
    const onAboutChrome = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (plLines.length && !prefersReduced) {
        if (y < vh * 1.3) {
          plLines.forEach((ln, i) => {
            ln.style.transform = `translate3d(0, ${(y * (heroDepth[i] ?? -0.14)).toFixed(1)}px, 0)`;
          });
        } else {
          plLines.forEach((ln) => {
            ln.style.transform = '';
          });
        }
      }
      if (portrait && !prefersReduced) {
        const r = portrait.getBoundingClientRect();
        if (r.bottom >= 0 && r.top <= vh) {
          const p = Math.min(Math.max((vh * 0.6 - r.top) / (r.height + vh * 0.6), 0), 1);
          portrait.style.transform = `scale(1.06) translate3d(0, ${(-5 + p * 10).toFixed(1)}px, 0)`;
        }
      }
      if (zoomStage && zoomFrame && !prefersReduced) {
        const r = zoomStage.getBoundingClientRect();
        const p = Math.min(Math.max((vh * 0.62 - r.top) / (r.height * 0.9 + vh * 0.4), 0), 1);
        zoomFrame.style.setProperty('--zp', p.toFixed(3));
        const stage = Math.min(Math.floor(p * 4) + 1, 4);
        zoomLabels.forEach((l, i) => l.classList.toggle('is-on', i + 1 <= stage));
        if (g1) {
          g1.style.opacity = Math.max(0, (p - 0.4) * 0.5).toFixed(3);
          g1.style.transform = `scale(${(1.06 + p * 0.12).toFixed(3)})`;
        }
        if (g2) {
          g2.style.opacity = Math.max(0, (p - 0.72) * 0.5).toFixed(3);
          g2.style.transform = `scale(${(1.02 + p * 0.2).toFixed(3)})`;
        }
      }
    };
    const requestAboutChrome = () => {
      if (aboutChromeTick) return;
      aboutChromeTick = true;
      requestAnimationFrame(() => {
        onAboutChrome();
        aboutChromeTick = false;
      });
    };
    window.addEventListener('scroll', requestAboutChrome, { passive: true });
    window.addEventListener('resize', requestAboutChrome, { passive: true });
    onAboutChrome();

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      clearEvts.forEach((ev) => document.removeEventListener(ev, pressClear));
      statsIO?.disconnect();
      mqGate?.disconnect();
      window.removeEventListener('scroll', requestAboutChrome);
      window.removeEventListener('resize', requestAboutChrome);
      document.body.classList.remove('arena-reduce', 'about-reduce');
    };
  }, []);
}
