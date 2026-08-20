import { useEffect } from 'react';

/**
 * Homepage-only scroll motion: `[data-parallax]` scrub, the horizontal
 * #journey pin (≥901px), and the hero "is-past" state. Kept out of the shared
 * chunk so other routes don't pay for it.
 */
export function useHomeMotion(): void {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    onScrollThrottled();

    return () => {
      window.removeEventListener('scroll', onScrollThrottled);
      window.removeEventListener('resize', onResize);
      journeyMQ.removeEventListener?.('change', onScroll);
    };
  }, []);
}
