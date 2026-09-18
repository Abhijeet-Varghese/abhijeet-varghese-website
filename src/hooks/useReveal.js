import { useEffect } from 'react';
// Reveal system: legacy CSS animates [data-reveal] / [data-reveal="img"] once
// the element is in view (class `is-in`), honoring prefers-reduced-motion.
export default function useReveal(deps = []) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (reduced) { nodes.forEach((n) => n.classList.add('is-in')); return undefined; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    nodes.forEach((n) => io.observe(n));
    document.querySelectorAll('[data-reveal-group]').forEach((g) => {
      Array.from(g.children).forEach((c, i) => c.style.setProperty('--rv-i', String(i)));
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
