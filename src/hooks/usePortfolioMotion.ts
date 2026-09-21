import { useEffect } from 'react';

/**
 * Portfolio — faithful reproduction of /js/portfolio-reel.js
 * Handles pf-overture is-open, data-pf-open/data-pf-live via IntersectionObserver,
 * YT player mount (R1O0VanJfTo), film warm preconnect, filmFrame/seam scroll, cursor, and proof rail.
 */
export function usePortfolioMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const $ = (s: string, c: Document | Element = document) => (c || document).querySelector(s) as HTMLElement | null;
    const $$ = (s: string, c: Document | Element = document) => [...(c || document).querySelectorAll(s)] as HTMLElement[];
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

    // body class
    document.body.classList.add('portfolio-page');
    const main = document.getElementById('main');
    if (main) main.classList.add('pf');

    const openTargets = $$('[data-pf-open]');
    const liveTargets = $$('[data-pf-live]');
    let openIO: IntersectionObserver | null = null;
    let liveIO: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      openIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-open');
              openIO!.unobserve(e.target);
            }
          });
        },
        { threshold: 0.22, rootMargin: '0px 0px -8% 0px' },
      );
      openTargets.forEach((el) => openIO!.observe(el));
      liveIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            (e.target as HTMLElement).classList.toggle('is-live', e.isIntersecting);
          });
        },
        { threshold: 0.05 },
      );
      liveTargets.forEach((el) => liveIO!.observe(el));
    } else {
      openTargets.forEach((el) => el.classList.add('is-open'));
      liveTargets.forEach((el) => el.classList.add('is-live'));
    }

    const overture = $('.pf-overture');
    if (overture) {
      requestAnimationFrame(() => overture.classList.add('is-open'));
    }

    const YT_ID = 'R1O0VanJfTo';
    const players = $$('[data-pf-player]');
    const warmYouTube = () => {
      if (document.getElementById('pf-yt-pre')) return;
      ['https://www.youtube-nocookie.com', 'https://www.youtube.com'].forEach((o) => {
        const l = document.createElement('link');
        l.id = 'pf-yt-pre';
        l.rel = 'preconnect';
        l.href = o;
        (l as unknown as HTMLLinkElement).crossOrigin = 'anonymous';
        document.head.appendChild(l);
      });
    };
    const mountPlayer = (host: HTMLElement, autoplay: boolean) => {
      const id = host.getAttribute('data-yt') || YT_ID;
      const frame = document.createElement('iframe');
      frame.className = 'pf-player__frame';
      frame.title = host.getAttribute('data-yt-title') || 'Portfolio reel — Abhijeet Varghese';
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&hl=en&autoplay=${autoplay ? 1 : 0}`;
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      frame.setAttribute('allowfullscreen', 'true');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.loading = 'lazy';
      host.innerHTML = '';
      host.appendChild(frame);
      host.classList.add('is-playing');
      if (autoplay) {
        try {
          frame.focus();
        } catch (_e) {
          void _e;
        }
      }
    };
    players.forEach((host) => {
      const poster = $('.pf-player__poster', host) as HTMLElement | null;
      if (!poster) return;
      poster.addEventListener('click', () => {
        warmYouTube();
        mountPlayer(host as HTMLElement, true);
      });
    });
    const film = $('.pf-film');
    if (film && 'IntersectionObserver' in window) {
      const warmIO = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            warmYouTube();
            warmIO.disconnect();
          }
        },
        { rootMargin: '600px 0px' },
      );
      warmIO.observe(film);
    }

    const filmFrame = $('.pf-film__frame');
    const seam = $('.pf-seam');
    let ticking = false;
    const measure = () => {
      ticking = false;
      const vh = window.innerHeight;
      if (filmFrame && !reduced) {
        const fr = filmFrame.getBoundingClientRect();
        const gate = vh * 0.45;
        const exit = clamp((gate - fr.bottom) / gate, 0, 1);
        filmFrame.style.setProperty('--exit', exit.toFixed(3));
      }
      if (seam && !reduced) {
        const sr = seam.getBoundingClientRect();
        const p = clamp((vh - sr.top) / (vh + sr.height), 0, 1);
        const o = clamp(p / 0.22, 0, 1) * clamp((1 - p) / 0.28, 0, 1);
        seam.style.setProperty('--p', p.toFixed(4));
        seam.style.setProperty('--o', o.toFixed(3));
        seam.style.setProperty('--o2', clamp((p - 0.42) / 0.25, 0, 1).toFixed(3));
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    if (filmFrame || seam) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      measure();
    }

    let cursorCleanup: (() => void) | null = null;
    if (fine && !reduced) {
      const cursor = $('.pf-cursor') as HTMLElement | null;
      const cursorLabel = cursor?.querySelector('.pf-cursor span') as HTMLElement | null;
      if (cursor && cursorLabel) {
        let tx = 0,
          ty = 0,
          cx = 0,
          cy = 0,
          raf: number | null = null,
          moving = false;
        const loop = () => {
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;
          cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
          if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
            raf = requestAnimationFrame(loop);
          } else {
            raf = null;
            moving = false;
          }
        };
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse') return;
          tx = e.clientX;
          ty = e.clientY;
          if (!moving) {
            moving = true;
            raf = requestAnimationFrame(loop);
          }
        };
        const onOver = (e: PointerEvent) => {
          const target = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null;
          if (!target) return;
          cursorLabel.textContent = target.getAttribute('data-cursor') || '';
          cursor.classList.add('is-on', 'is-big');
          document.body.classList.add('pf-cursor-active');
        };
        const onOut = (e: PointerEvent) => {
          const from = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null;
          if (!from) return;
          const to = (e.relatedTarget as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null;
          if (to === from) return;
          cursor.classList.remove('is-on', 'is-big');
          document.body.classList.remove('pf-cursor-active');
        };
        const onBlur = () => {
          cursor.classList.remove('is-on', 'is-big');
          document.body.classList.remove('pf-cursor-active');
        };
        document.addEventListener('pointermove', onMove as EventListener, { passive: true } as AddEventListenerOptions);
        document.addEventListener('pointerover', onOver as EventListener);
        document.addEventListener('pointerout', onOut as EventListener);
        window.addEventListener('blur', onBlur);
        cursorCleanup = () => {
          if (raf) cancelAnimationFrame(raf);
          document.removeEventListener('pointermove', onMove as EventListener);
          document.removeEventListener('pointerover', onOver as EventListener);
          document.removeEventListener('pointerout', onOut as EventListener);
          window.removeEventListener('blur', onBlur);
        };
      }
    }

    // Proof rail (case studies rail) — second IIFE in portfolio-reel.js
    const rail = document.getElementById('pfProofRail') as HTMLElement | null;
    let railCleanup: (() => void) | null = null;
    if (rail) {
      const panels = Array.prototype.slice.call(rail.querySelectorAll('.r-proof__panel')) as HTMLElement[];
      const cur = document.getElementById('pfProofCur') as HTMLElement | null;
      const prev = document.getElementById('pfProofPrev') as HTMLButtonElement | null;
      const next = document.getElementById('pfProofNext') as HTMLButtonElement | null;
      const progress = document.getElementById('pfProofProgress') as HTMLElement | null;
      if (panels.length) {
        let active = 0;
        const sync = (i: number) => {
          active = i;
          panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
          if (cur) cur.textContent = String(i + 1).padStart(2, '0');
          if (prev) prev.disabled = i === 0;
          if (next) next.disabled = i === panels.length - 1;
        };
        const update = () => {
          const mid = rail.scrollLeft + rail.clientWidth / 2;
          let best = 0;
          panels.forEach((p, i) => {
            if (mid >= p.offsetLeft) best = i;
          });
          sync(best);
          if (progress) {
            const max = rail.scrollWidth - rail.clientWidth;
            const rl = rail.scrollLeft;
            progress.style.width = (max > 0 ? (rl / max) * 100 : 0).toFixed(2) + '%';
          }
        };
        const go = (i: number) => {
          const el = panels[i];
          if (!el) return;
          rail.scrollTo({ left: el.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
        };
        const onScroll = () => update();
        const onResize = () => update();
        const onPrev = () => go(Math.max(0, active - 1));
        const onNext = () => go(Math.min(panels.length - 1, active + 1));
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(Math.min(panels.length - 1, active + 1));
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(Math.max(0, active - 1));
          }
        };
        rail.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        if (prev) prev.addEventListener('click', onPrev);
        if (next) next.addEventListener('click', onNext);
        rail.addEventListener('keydown', onKey as EventListener);
        update();
        railCleanup = () => {
          rail.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          if (prev) prev.removeEventListener('click', onPrev);
          if (next) next.removeEventListener('click', onNext);
          rail.removeEventListener('keydown', onKey as EventListener);
        };
      }
    }

    return () => {
      openIO?.disconnect();
      liveIO?.disconnect();
      if (filmFrame || seam) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      cursorCleanup?.();
      railCleanup?.();
    };
  }, []);
}
