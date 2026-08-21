import { useEffect, useRef, useState } from 'react';
import { useContent } from '@/content/provider';

/**
 * Story compass pill — materializes once the prologue scrolls away; expands
 * into a chapter list (keyboard + Escape operable). Replicates the production
 * behaviour exactly.
 */
export function Compass() {
  const { content } = useContent();
  const COMPASS_ACTS = content.story.COMPASS_ACTS;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prologue = document.getElementById('prologue');
    const compass = rootRef.current;
    if (!prologue || !compass) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            compass.classList.remove('is-show');
            compass.hidden = true;
          } else {
            compass.hidden = false;
            requestAnimationFrame(() => compass.classList.add('is-show'));
          }
        }
      },
      { threshold: 0 },
    );
    io.observe(prologue);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const jumpTo = (idx: number) => {
    const scroll = document.querySelector<HTMLElement>('.about-evo3d__scroll');
    const cards = document.querySelectorAll<HTMLElement>('.about-evo3d__card');
    if (scroll && cards.length) {
      const scrollable = Math.max(scroll.offsetHeight - window.innerHeight, 1);
      const top = scroll.getBoundingClientRect().top + window.scrollY;
      const cardPoint = idx === 1 ? 0 : idx - 1 + 0.12;
      const targetY = Math.max(top + scrollable * (cardPoint / (cards.length + 1.2)), 0);
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: targetY, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
    setOpen(false);
  };

  return (
    <nav className="about-compass" id="aboutCompass" aria-label="Story compass" ref={rootRef} hidden>
      <button
        className="about-compass__btn"
        type="button"
        id="aboutCompassBtn"
        ref={btnRef}
        aria-expanded={open}
        aria-controls="aboutCompassList"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="about-compass__num" id="aboutCompassNum">
          01
        </span>
        <span className="about-compass__name" id="aboutCompassName">
          Motion
        </span>
        <span className="about-compass__chev" aria-hidden="true">
          ▾
        </span>
      </button>
      <ul className="about-compass__list" id="aboutCompassList" ref={listRef} hidden={!open}>
        {COMPASS_ACTS.map((item) => (
          <li key={item.act}>
            <button type="button" data-act={item.act} onClick={() => jumpTo(parseInt(item.act, 10))}>
              <span className="about-compass__item-num">{item.act}</span>
              <span className="about-compass__item-name">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
