import { useEffect } from 'react';

/** Matches the legacy Story page-close: use same-origin history when present. */
export function useHistoryClose(): void {
  useEffect(() => {
    const close = document.querySelector<HTMLAnchorElement>('[data-history-close]');
    if (!close) return;

    const onClick = (event: MouseEvent) => {
      let sameSiteReferrer = false;
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        sameSiteReferrer = Boolean(referrer && referrer.origin === location.origin && referrer.href !== location.href);
      } catch {
        sameSiteReferrer = false;
      }
      if (sameSiteReferrer && history.length > 1) event.preventDefault();
      if (sameSiteReferrer && history.length > 1) history.back();
    };

    close.addEventListener('click', onClick);
    return () => close.removeEventListener('click', onClick);
  }, []);
}
