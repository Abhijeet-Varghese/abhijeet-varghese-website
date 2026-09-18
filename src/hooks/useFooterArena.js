import { useEffect } from 'react';
// ≤700 footer "arena": pins the closing chapter (body.hm-pin) while the
// footer is engaged — behavior ported from home-mobile.js.
export default function useFooterArena() {
  useEffect(() => {
    const footer = document.querySelector('footer.footer--arena');
    if (!footer) return undefined;
    const mq = window.matchMedia('(max-width: 700px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      const on = mq.matches && !reduced && e.isIntersecting && e.intersectionRatio > 0.15;
      document.body.classList.toggle('hm-pin', on);
      footer.classList.toggle('is-in', on);
    }, { threshold: [0, 0.15, 0.5] });
    io.observe(footer);
    return () => io.disconnect();
  }, []);
}
