import { useEffect } from 'react';
// Site chrome: progress bar, nav visibility on scroll direction, section spy.
export default function useChrome() {
  useEffect(() => {
    const progress = document.getElementById('progress');
    const nav = document.getElementById('siteNav');
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const zones = Array.from(document.querySelectorAll('#main > section, #main section[id]'));
    let lastY = window.scrollY; let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        if (progress) progress.style.transform = `scaleX(${Math.min(y / max, 1).toFixed(4)})`;
        if (nav) {
          nav.classList.toggle('is-visible', y < 40 || y < lastY || y < window.innerHeight * 0.5);
          nav.classList.toggle('nav-hidden', y > 400 && y > lastY && !nav.classList.contains('is-open'));
          nav.classList.toggle('is-scrolled', y > 24);
        }
        lastY = y;
        let current = '';
        for (const z of zones) { if (z.getBoundingClientRect().top <= window.innerHeight * 0.35) current = z.id; }
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
}
