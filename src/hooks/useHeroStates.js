import { useEffect } from 'react';
// Hero lifecycle classes on <html>: hero-parked when the hero leaves the
// viewport (rootMargin 12%) — matches legacy elevate.js behavior.
export default function useHeroStates() {
  useEffect(() => {
    const heroSec = document.getElementById('hero');
    if (!heroSec) return undefined;
    const d = document.documentElement;
    const io = new IntersectionObserver(([e]) => { d.classList.toggle('hero-parked', !e.isIntersecting); }, { rootMargin: '12% 0px' });
    io.observe(heroSec);
    return () => io.disconnect();
  }, []);
}
