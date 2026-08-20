import { useEffect } from 'react';

/**
 * Ports the shared scroll-driven behaviours from the legacy main.js into the
 * React architecture (REBUILD, identical visual output):
 *
 *  - reveal-on-scroll (IntersectionObserver, threshold 0.15, -6% rootMargin)
 *  - reveal-group stagger via --d custom property
 *  - progress bar scaleX
 *  - nav "is-visible" past 90px
 *  - [data-parallax] translate3d scrub
 *  - homepage #journey horizontal pinned scroll (≥901px)
 *  - homepage #hero "is-past" state
 *  - active nav link (aria-current)
 *
 * Respects `prefers-reduced-motion` (reveals immediately, disables parallax +
 * journey scrub) exactly as the legacy layer did.
 */
export function useSiteChrome(): void {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- active nav link --- */
    const hereFile = (location.pathname.split('/').pop() || 'index.html').replace(/\/$/, '') || 'index.html';
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
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in-view'));
    } else {
      const revealIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('in-view');
              revealIO.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      revealEls.forEach((el) => revealIO.observe(el));
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

    /* --- shared rAF scroll loop --- */
    const nav = document.getElementById('siteNav');
    const progress = document.getElementById('progress');
    let ticking = false;

    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
      .map((el) => {
        const img = el.querySelector('img');
        const requested = Number.parseFloat(el.dataset.parallax ?? '');
        const speed = Number.isFinite(requested) ? requested : 0.05;
        if (speed === 0) {
          if (img) {
            img.style.willChange = 'auto';
            img.style.scale = '1';
            img.style.transform = 'none';
          }
          return null;
        }
        if (img) {
          img.style.willChange = 'transform';
          img.style.scale = '1.13';
        }
        return { el, target: (img as HTMLElement | null) ?? el, speed };
      })
      .filter((p): p is { el: HTMLElement; target: HTMLElement; speed: number } => p !== null);

    const journeySec = document.getElementById('journey');
    const journeyPin = document.getElementById('journeyPin');
    const journeyTrack = document.getElementById('journeyTrack');
    const journeyBar = document.getElementById('journeyBar');
    const journeyBarNum = document.getElementById('journeyBarNum');
    const journeyMQ = window.matchMedia('(min-width: 901px)');
    const heroEl = document.getElementById('hero');

    const onScroll = () => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('is-visible', y > 90);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      }

      if (!prefersReduced) {
        const vh = window.innerHeight;
        for (const p of parallaxEls) {
          const r = p.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) continue;
          const center = r.top + r.height / 2 - vh / 2;
          p.target.style.transform = `translate3d(0, ${(center * p.speed).toFixed(2)}px, 0)`;
        }
      }

      if (journeySec && journeyPin && journeyTrack) {
        if (journeyMQ.matches && !prefersReduced) {
          const total = journeySec.offsetHeight - window.innerHeight;
          const r = journeySec.getBoundingClientRect();
          const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0;
          const maxShift = Math.max(journeyTrack.scrollWidth - journeyPin.clientWidth + 40, 0);
          journeyTrack.style.transform = `translate3d(${(-p * maxShift).toFixed(1)}px, 0, 0)`;
          if (journeyBar) journeyBar.style.transform = `scaleX(${p.toFixed(3)})`;
          if (journeyBarNum) {
            const eraCount = Math.max(journeyTrack.children.length, 1);
            const era = String(Math.min(eraCount, Math.round(p * (eraCount - 1)) + 1)).padStart(2, '0');
            const eraTotal = String(eraCount).padStart(2, '0');
            const next = `${era} / ${eraTotal}`;
            if (journeyBarNum.textContent !== next) journeyBarNum.textContent = next;
          }
        } else {
          journeyTrack.style.transform = '';
          if (journeyBar) journeyBar.style.transform = '';
        }
      }

      if (heroEl) heroEl.classList.toggle('is-past', y > window.innerHeight * 0.28);

      ticking = false;
    };

    const onScrollThrottled = () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    };
    const onResize = () => requestAnimationFrame(onScroll);

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    journeyMQ.addEventListener?.('change', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScrollThrottled);
      window.removeEventListener('resize', onResize);
      journeyMQ.removeEventListener?.('change', onScroll);
    };
  }, []);
}
