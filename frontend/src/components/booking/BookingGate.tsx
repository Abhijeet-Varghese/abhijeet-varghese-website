import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { StaticContactForm } from './StaticContactForm';

/**
 * Progressive-enhancement gate for the booking form.
 *
 * - SSR + initial hydration render the static form (complete markup, native
 *   POST action) — matches the prerendered HTML exactly.
 * - Once the contact section nears the viewport, the interactive `ContactBook`
 *   chunk is lazy-imported and swaps in (visually identical upgrade).
 *
 * This keeps the custom calendar out of the homepage's critical JS (spec:
 * "split calendar").
 */
const LazyContactBook = lazy(() => import('./ContactBook').then((m) => ({ default: m.ContactBook })));

export function BookingGate() {
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {near ? (
        <Suspense fallback={<StaticContactForm />}>
          <LazyContactBook />
        </Suspense>
      ) : (
        <StaticContactForm />
      )}
    </div>
  );
}
