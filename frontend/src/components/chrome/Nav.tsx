import { useCallback, useEffect, useRef, useState } from 'react';
import { CHROME } from '@/content/chrome';
import type { NavLink } from '@/types';

/**
 * Global navigation chrome. Replicates the production nav behaviour exactly:
 * compact focus-trapped mobile dialog ≤900px, desktop chrome above 900px,
 * Escape-to-close, focus return, and body scroll lock.
 */
export function Nav({ activeHref }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);

  const focusables = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return [] as HTMLElement[];
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        "a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])",
      ),
    ).filter((el) => !el.hidden && el.getClientRects().length > 0);
  }, []);

  const close = useCallback(() => {
    setOpen((prev) => {
      if (!prev) return prev;
      const menu = menuRef.current;
      menu?.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(() => {
        if (menu && !menu.classList.contains('is-open')) menu.hidden = true;
      }, 450);
      const ret = returnFocusRef.current;
      if (ret instanceof HTMLElement && typeof ret.focus === 'function') {
        ret.focus({ preventScroll: true });
      }
      return false;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    returnFocusRef.current = document.activeElement;
    menu.hidden = false;
    document.body.style.overflow = 'hidden';
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => menu.classList.add('is-open'));
    });
    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (!items.length) return;
        const firstItem = items[0]!;
        const lastItem = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    const mq = window.matchMedia('(max-width: 900px)');
    const onMq = () => {
      if (!mq.matches) close();
    };
    mq.addEventListener?.('change', onMq);

    return () => {
      cancelAnimationFrame(raf1);
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener?.('change', onMq);
      document.body.style.overflow = '';
      if (menu.classList.contains('is-open')) menu.hidden = true;
    };
  }, [open, close, focusables]);

  const renderLink = (link: NavLink, current: boolean) => (
    <a href={link.href} aria-current={current ? 'page' : undefined}>
      {link.label}
    </a>
  );

  return (
    <header className="site-nav" id="siteNav">
      <nav className="site-nav__inner" aria-label="Primary">
        <a className="brand" href={CHROME.brandHref} aria-label="Abhijeet Varghese — home">
          <img
            className="brand__logo"
            src={CHROME.logoUrl}
            alt="Abhijeet Varghese logo"
            width="36"
            height="36"
            decoding="async"
          />
          <span className="brand__name">{CHROME.brandLabel}</span>
        </a>
        <ul className="nav-links">
          {CHROME.primary.map((link) => (
            <li key={link.href}>{renderLink(link, link.href === activeHref)}</li>
          ))}
        </ul>
        <a className="btn btn--accent btn--small" href={CHROME.cta.href}>
          {CHROME.cta.label}
        </a>
        <button
          className="nav-toggle"
          type="button"
          id="navToggle"
          ref={toggleRef}
          aria-expanded={open}
          aria-controls="mobileMenu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle__line" aria-hidden="true" />
          <span className="nav-toggle__line" aria-hidden="true" />
          <span className="nav-toggle__line" aria-hidden="true" />
        </button>
      </nav>
      <div
        className="mobile-menu"
        id="mobileMenu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden
      >
        <div className="mobile-menu__bar">
          <span className="mobile-menu__title">Menu</span>
          <button
            className="mobile-menu__close"
            type="button"
            id="mobileClose"
            aria-label="Close menu"
            onClick={close}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile">
          <ul className="mobile-menu__list">
            {CHROME.mobile.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={close}>
                  <em>{link.index}</em>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mobile-menu__actions">
            <a className="btn btn--accent btn--block" href={CHROME.cta.href} onClick={close}>
              {CHROME.cta.label}
            </a>
            <a className="mobile-menu__mail" href={CHROME.footer.emailHref} onClick={close}>
              {CHROME.footer.email}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
