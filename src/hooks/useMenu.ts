import { useEffect } from 'react';

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hidden && element.getClientRects().length > 0);
}

/** Accessible mobile menu controller retained against the approved markup. */
export function useMenu(): void {
  useEffect(() => {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('navToggle');
    const closeButton = document.getElementById('mobileClose');
    if (!(menu instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement)) return;

    let returnFocus: HTMLElement | null = null;
    let closeTimer = 0;
    let openFrame = 0;
    let openFrameInner = 0;

    const setOpen = (open: boolean, restoreFocus = true) => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (open === isOpen) return;
      window.clearTimeout(closeTimer);
      if (!open) {
        window.cancelAnimationFrame(openFrame);
        window.cancelAnimationFrame(openFrameInner);
        openFrame = 0;
        openFrameInner = 0;
      }

      if (open) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        menu.hidden = false;
        document.body.style.overflow = 'hidden';
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        // Preserve the approved two-RAF staging, but do not allow a queued
        // open frame to revive the dialog after an early Escape or close tap.
        openFrame = requestAnimationFrame(() => {
          openFrameInner = requestAnimationFrame(() => {
            if (toggle.getAttribute('aria-expanded') === 'true' && !menu.hidden) {
              menu.classList.add('is-open');
            }
          });
        });
        focusableWithin(menu)[0]?.focus({ preventScroll: true });
        return;
      }

      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      closeTimer = window.setTimeout(() => {
        if (!menu.classList.contains('is-open')) menu.hidden = true;
      }, 450);
      if (restoreFocus && returnFocus) {
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
    };

    const onToggle = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    const onClose = () => setOpen(false);
    const onMenuClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target === menu) {
        setOpen(false);
        return;
      }
      if (target?.closest('a')) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableWithin(menu);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const onViewportChange = () => {
      if (!mobileQuery.matches) setOpen(false);
    };

    menu.hidden = true;
    Array.from(menu.querySelectorAll<HTMLElement>('.mobile-menu__list li')).forEach((item, index) => {
      item.style.setProperty('--mi', String(index));
    });
    toggle.addEventListener('click', onToggle);
    closeButton?.addEventListener('click', onClose);
    menu.addEventListener('click', onMenuClick);
    document.addEventListener('keydown', onKeyDown);
    mobileQuery.addEventListener?.('change', onViewportChange);

    return () => {
      window.clearTimeout(closeTimer);
      window.cancelAnimationFrame(openFrame);
      window.cancelAnimationFrame(openFrameInner);
      toggle.removeEventListener('click', onToggle);
      closeButton?.removeEventListener('click', onClose);
      menu.removeEventListener('click', onMenuClick);
      document.removeEventListener('keydown', onKeyDown);
      mobileQuery.removeEventListener?.('change', onViewportChange);
      menu.classList.remove('is-open');
      menu.hidden = true;
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };
  }, []);
}
