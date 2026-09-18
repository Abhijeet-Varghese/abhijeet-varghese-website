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
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    nodes.forEach((n) => io.observe(n));
    // kinetic blocks (legacy elevate.js): is-inview at 40% visibility
    const kinetic = Array.from(document.querySelectorAll('[data-kinetic]'));
    const kio = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-inview'); kio.unobserve(e.target); }
    }, { threshold: 0.4 });
    kinetic.forEach((n) => kio.observe(n));
    // hero intro gate: legacy adds is-in to .hp-hero right after load
    const hero = document.querySelector('.hp-hero');
    if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
    // failsafe: nothing may stay invisible (legacy reveal-failsafe)
    const failsafe = setTimeout(() => {
      document.documentElement.classList.add('reveal-failsafe');
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((n) => n.classList.add('is-in'));
      document.querySelectorAll('[data-kinetic]:not(.is-inview)').forEach((n) => n.classList.add('is-inview'));
    }, 4000);
    document.querySelectorAll('[data-reveal-group]').forEach((g) => {
      Array.from(g.children).forEach((c, i) => c.style.setProperty('--rv-i', String(i)));
    });
    return () => { clearTimeout(failsafe); io.disconnect(); kio.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
