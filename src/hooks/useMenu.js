import { useEffect } from 'react';
// Mobile menu (≤900 chrome menu + ≤700 typographic MENU): open state, body
// lock, focus trap, Escape, focus return. "Point of View" is not in the mobile
// list (product decision — markup already omits it).
export default function useMenu() {
  useEffect(() => {
    const menu = document.querySelector('.mobile-menu');
    const toggle = document.querySelector('.nav-toggle');
    const close = document.querySelector('.mobile-menu__close');
    if (!menu || !toggle) return undefined;
    let opener = null;
    const set = (open) => {
      menu.classList.toggle('is-open', open);
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { const first = menu.querySelector('a, button'); first && first.focus(); }
      else if (opener) { opener.focus(); opener = null; }
    };
    const onToggle = () => { opener = document.activeElement; set(!menu.classList.contains('is-open')); };
    const onKey = (e) => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); set(false); return; }
      if (e.key === 'Tab') {
        const f = Array.from(menu.querySelectorAll('a[href], button:not([disabled])'));
        if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    menu.hidden = true;
    Array.from(menu.querySelectorAll('.mobile-menu__list li')).forEach((li, i) => li.style.setProperty('--mi', String(i)));
    toggle.addEventListener('click', onToggle);
    if (close) close.addEventListener('click', () => set(false));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', onKey);
    return () => { toggle.removeEventListener('click', onToggle); document.removeEventListener('keydown', onKey); };
  }, []);
}
