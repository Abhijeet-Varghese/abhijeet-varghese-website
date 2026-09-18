import { useEffect } from 'react';
// Featured Work stage: desktop reel (transform-driven case plates + HUD) and
// the ≤700 touch film (scroll-snap; artwork fully visible — object-fit:contain
// is enforced by CSS, JS only syncs HUD state). No layout-thrash loops.
export default function useWorkStage() {
  useEffect(() => {
    const workFilm = document.getElementById('workFilm');
    if (!workFilm) return undefined;
    const cases = Array.from(workFilm.querySelectorAll('.case'));
    const hudNum = document.getElementById('workHudNum');
    const hudBar = document.getElementById('workHudBar');
    const touchMQ = window.matchMedia('(max-width: 700px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!cases.length) return undefined;
    let active = 0;
    const setActive = (i) => {
      if (i === active) return;
      active = i;
      cases.forEach((c, k) => c.classList.toggle('is-active', k === i));
      if (hudNum) hudNum.textContent = String(i + 1).padStart(2, '0');
      if (hudBar) hudBar.style.transform = `scaleX(${((i + 1) / cases.length).toFixed(3)})`;
    };
    cases.forEach((c, i) => {
      c.addEventListener('mouseenter', () => { if (!touchMQ.matches) setActive(i); });
      c.addEventListener('click', () => setActive(i), { passive: true });
    });
    setActive(0);
    let raf = 0;
    const onScroll = () => {
      if (!touchMQ.matches || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = window.innerWidth / 2; let best = 0; let bestD = Infinity;
        cases.forEach((c, i) => { const r = c.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
        setActive(best);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (!reduced) {
      const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && touchMQ.matches) onScroll(); }); }, { threshold: 0.2 });
      cases.forEach((c) => io.observe(c));
    }
    window.__avWork = { setActive, count: cases.length };
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
}
