import { useEffect } from 'react';
// Intro loader: html.av-loading gates the hero; the loader panel merges out
// (.av-loader.is-merge) then hides. hero-settled marks the intro complete.
export default function useLoader() {
  useEffect(() => {
    const d = document.documentElement;
    const loader = document.querySelector('.av-loader');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      if (loader) loader.classList.add('is-merge');
      setTimeout(() => {
        if (loader) { loader.classList.add('is-hidden'); loader.setAttribute('aria-hidden', 'true'); setTimeout(() => loader.remove(), 400); }
        d.classList.remove('av-loading');
        setTimeout(() => d.classList.add('hero-settled'), reduced ? 0 : 400);
      }, reduced ? 0 : 900);
    };
    const t = setTimeout(finish, reduced ? 200 : 2400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(finish, reduced ? 0 : 500));
    return () => clearTimeout(t);
  }, []);
}
