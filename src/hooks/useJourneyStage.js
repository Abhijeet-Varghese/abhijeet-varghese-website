import { useEffect } from 'react';
// Journey: sticky pin, horizontal track shift bound to section progress,
// progress bar + era counter ("02 / 05"), waypoint is-lit states.
export default function useJourneyStage() {
  useEffect(() => {
    const journeySec = document.getElementById('journey');
    const journeyPin = document.getElementById('journeyPin');
    const journeyTrack = document.getElementById('journeyTrack');
    const journeyBar = document.getElementById('journeyBar');
    const journeyBarNum = document.getElementById('journeyBarNum');
    if (!(journeySec && journeyPin && journeyTrack)) return undefined;
    const eras = Array.from(journeySec.querySelectorAll('.era'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let jTotal = 0; let jMaxShift = 0;
    const measure = () => {
      jTotal = Math.max(journeySec.offsetHeight - window.innerHeight, 0);
      jMaxShift = Math.max(journeyTrack.scrollWidth - journeyPin.clientWidth + 40, 0);
    };
    measure();
    window.addEventListener('resize', measure);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = journeySec.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const jP = jTotal ? Math.min(Math.max(-rect.top / jTotal, 0), 1) : 0;
        if (!reduced) journeyTrack.style.transform = `translate3d(${(-jP * jMaxShift).toFixed(1)}px, 0, 0)`;
        if (journeyBar) journeyBar.style.transform = `scaleX(${jP.toFixed(3)})`;
        const eraCount = eras.length || 1;
        const era = Math.min(Math.max(Math.ceil(jP * eraCount), 1), eraCount);
        if (journeyBarNum) {
          const label = String(era).padStart(2, '0') + ' / ' + String(eraCount).padStart(2, '0');
          if (journeyBarNum.textContent !== label) journeyBarNum.textContent = label;
        }
        eras.forEach((el, i) => el.classList.toggle('is-lit', i < era));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure); if (raf) cancelAnimationFrame(raf); };
  }, []);
}
