import { useEffect } from 'react';

/**
 * Contact / Start a Conversation — loads legacy form runtime
 * (country-data.js, emailjs-fallback.js, main.js) which handles:
 * - country code dropdown (+91 etc.)
 * - phone validation
 * - email validation
 * - date/time pickers (dateTrigger, dpGrid, time slots)
 * - submit to /api/public/lead + EmailJS fallback
 * - success/error/loading states
 * - analytics
 * Preserves all validation, API, and backend safety as in pre-react.
 */
export function useContactMotion() {
  useEffect(() => {
    document.body.classList.add('contact-page');
    const main = document.getElementById('main');
    if (main) main.classList.add('contact-page');

    const scripts = [
      '/js/country-data.js?v=4.4.1',
      '/js/emailjs-fallback.js?v=1.2.1',
      '/js/main.js?v=4.7.1',
    ];
    const elements: HTMLScriptElement[] = [];
    let cancelled = false;

    const load = async () => {
      for (const src of scripts) {
        if (cancelled) break;
        if (document.querySelector(`script[src="${src}"]`)) continue;
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.defer = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed ${src}`));
          elements.push(s);
          document.body.appendChild(s);
        });
      }
    };
    load().catch((e) => console.error('[Contact] legacy', e));

    return () => {
      cancelled = true;
    };
  }, []);
}
