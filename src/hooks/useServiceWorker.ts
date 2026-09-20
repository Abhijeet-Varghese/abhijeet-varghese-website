import { useEffect } from 'react';

/** Defers existing service-worker registration until intentional interaction. */
export function useServiceWorker(): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    let armed = false;
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    const arm = () => {
      if (armed) return;
      armed = true;
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      events.forEach((event) => window.removeEventListener(event, arm));
    };
    events.forEach((event) => window.addEventListener(event, arm, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, arm));
  }, []);
}
