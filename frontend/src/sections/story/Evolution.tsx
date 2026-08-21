import { useEffect, useRef } from 'react';
import { useContent } from '@/content/provider';

/**
 * Evolution — the 3D film stack. Ported 1:1 from the production
 * `main.js` scroll engine (same constants, same easing, same paint order),
 * rebuilt with a SINGLE coordinated requestAnimationFrame loop.
 *
 * Performance properties (carried over + tightened):
 *  - compositor-only: transform/opacity/visibility/z-index — no layout/paint
 *  - cards exit the loop (visibility:hidden + will-change cleared) when
 *    offscreen behind the stack
 *  - the loop sleeps when the stack is offscreen or the tab is hidden
 *  - pointer camera is lerped and skipped when settled
 *  - prefers-reduced-motion: no loop — cards render in CSS default order
 */
const WORLD_RGB: Record<string, [number, number, number]> = {
  motion: [77, 141, 255],
  interaction: [0, 183, 212],
  environment: [139, 124, 246],
  experience: [230, 170, 60],
  people: [232, 112, 90],
  leadership: [140, 134, 168],
  interlude: [110, 168, 255],
};

const CARD_DEPTH = 220;
const STACK_Y = 26;
const OPEN_ANGLE = 82;
const EXIT_Y = 125;
const EXIT_Z = 460;
const SCALE_STEP = 0.034;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export function Evolution() {
  const { content } = useContent();
  const EVOLUTION_CARDS = content.story.EVOLUTION_CARDS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runway = scrollRef.current;
    const camera = cameraRef.current;
    const cards = cardRefs.current.filter((c): c is HTMLElement => c !== null);
    if (!runway || cards.length === 0 || prefersReduced) return;

    const TOTAL = cards.length;
    const atmo = document.getElementById('aboutAtmo');
    const compassNum = document.getElementById('aboutCompassNum');
    const compassName = document.getElementById('aboutCompassName');
    const images = cards.map((c) => c.querySelector<HTMLImageElement>('.about-evo3d__image'));
    const cardNames = cards.map((card) => {
      const meta = card.querySelector('.about-evo3d__meta span:last-child');
      return meta ? meta.textContent?.trim() ?? '' : '';
    });

    let lastAtmo = '';
    const setAtmo = (world: string | null) => {
      if (!atmo) return;
      let css: string;
      if (!world) {
        css =
          'radial-gradient(900px 620px at 50% 4%, rgba(77,141,255,0.13), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(77,141,255,0.07), transparent 60%)';
      } else {
        const w = WORLD_RGB[world] ?? WORLD_RGB.motion!;
        css = `radial-gradient(900px 620px at 50% 4%, rgba(${w[0]},${w[1]},${w[2]},0.16), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(${Math.round(w[0] * 0.6)},${Math.round(w[1] * 0.6)},${Math.round(w[2] * 0.6)},0.09), transparent 60%)`;
      }
      if (css !== lastAtmo) {
        atmo.style.background = css;
        lastAtmo = css;
      }
    };

    const getProgress = () => {
      const r = runway.getBoundingClientRect();
      const scrollable = Math.max(runway.offsetHeight - window.innerHeight, 1);
      return clamp(-r.top / scrollable, 0, 1);
    };

    let lastProgress = -1;
    let lastActive = 0;
    let stackVisible = false;
    let stackRunning = false;
    let lastFrame = performance.now();
    let mouseX = 0;
    let mouseY = 0;
    let cameraX = 0;
    let cameraY = 0;
    let rafId = 0;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const onPointerMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

    const paintCard = (card: HTMLElement, index: number, relative: number, active: number) => {
      card.classList.toggle('is-front', index === active - 1);
      if (relative < -1.05) {
        if (card.style.visibility !== 'hidden') {
          card.style.visibility = 'hidden';
          card.style.opacity = '0';
          card.style.willChange = 'auto';
        }
        return;
      }
      if (card.style.visibility === 'hidden') {
        card.style.visibility = 'visible';
        card.style.willChange = 'transform, opacity';
      }
      if (relative >= -1 && relative <= 0) {
        const t = easeInOut(Math.abs(relative));
        card.style.transform = `translate3d(0, ${(-t * EXIT_Y).toFixed(2)}vh, ${(t * EXIT_Z).toFixed(2)}px) rotateX(${(-t * OPEN_ANGLE).toFixed(2)}deg) rotateY(${(-t * 6).toFixed(2)}deg) scale(${(1 - t * 0.07).toFixed(4)})`;
        card.style.opacity = (1 - Math.max(0, t - 0.9) * 10).toFixed(3);
        card.style.zIndex = '1000';
        const img = images[index];
        if (img && index === active - 1) {
          img.style.transform = `translateZ(35px) scale(${(1.12 + t * 0.12).toFixed(4)})`;
        }
        return;
      }
      if (relative > 0 && relative < 1.5) {
        const t = easeOut(clamp(1 - (relative - 1), 0, 1));
        card.style.transform = `translate3d(0, ${(STACK_Y - t * STACK_Y).toFixed(2)}px, ${(-CARD_DEPTH + t * CARD_DEPTH).toFixed(2)}px) scale(${(0.966 + t * 0.034).toFixed(4)})`;
        card.style.opacity = (0.9 + t * 0.1).toFixed(3);
        card.style.zIndex = '999';
        return;
      }
      const depth = Math.min(relative, 4);
      card.style.transform = `translate3d(0, ${(depth * STACK_Y).toFixed(2)}px, ${(-depth * CARD_DEPTH).toFixed(2)}px) scale(${(1 - depth * SCALE_STEP).toFixed(4)})`;
      card.style.opacity = Math.max(0, 1 - depth * 0.14).toFixed(3);
      card.style.zIndex = String(900 - index);
    };

    const animate = (now: number) => {
      if (!stackVisible || document.hidden) {
        stackRunning = false;
        cards.forEach((card) => {
          card.style.willChange = 'auto';
        });
        return;
      }
      const dt = Math.min(Math.max((now - lastFrame) / 1000, 1 / 240), 0.05);
      lastFrame = now;
      const progress = getProgress();
      const targetCamX = finePointer ? mouseX * 3 : 0;
      const targetCamY = finePointer ? mouseY * -2 : 0;
      const cameraBlend = 1 - Math.exp(-3 * dt);
      cameraX += (targetCamX - cameraX) * cameraBlend;
      cameraY += (targetCamY - cameraY) * cameraBlend;
      const cameraSettled = Math.abs(targetCamX - cameraX) < 0.02 && Math.abs(targetCamY - cameraY) < 0.02;
      if (Math.abs(progress - lastProgress) < 0.0005 && cameraSettled) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      lastProgress = progress;

      const cardProgress = Math.min(progress * (TOTAL + 1.2), TOTAL - 1);
      const inView = progress > 0.001 && progress < 0.999;
      const active = clamp(Math.floor(cardProgress) + 1, 1, TOTAL);
      if (active !== lastActive) {
        lastActive = active;
        setAtmo(inView ? cards[active - 1]!.dataset.world ?? null : null);
        if (compassNum) compassNum.textContent = String(active).padStart(2, '0');
        if (compassName) compassName.textContent = cardNames[active - 1] ?? String(active).padStart(2, '0');
      }

      cards.forEach((card, index) => paintCard(card, index, index - cardProgress, active));
      if (camera) camera.style.transform = `rotateX(${cameraY.toFixed(3)}deg) rotateY(${cameraX.toFixed(3)}deg)`;
      rafId = requestAnimationFrame(animate);
    };

    const startStack = () => {
      if (stackRunning || !stackVisible || document.hidden) return;
      lastFrame = performance.now();
      lastProgress = -1;
      stackRunning = true;
      cards.forEach((card) => {
        card.style.willChange = 'transform, opacity';
      });
      rafId = requestAnimationFrame(animate);
    };

    const wakeStack = () => {
      const r = runway.getBoundingClientRect();
      stackVisible = r.bottom > 0 && r.top < window.innerHeight;
      if (stackVisible) startStack();
    };

    const stackObserver = new IntersectionObserver(
      (entries) => {
        stackVisible = !!entries[0]?.isIntersecting;
        if (stackVisible) startStack();
      },
      { rootMargin: '10% 0px', threshold: 0 },
    );
    stackObserver.observe(runway);

    const onVisibility = () => {
      if (!document.hidden) wakeStack();
    };

    window.addEventListener('scroll', wakeStack, { passive: true });
    window.addEventListener('resize', wakeStack, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    wakeStack();

    return () => {
      cancelAnimationFrame(rafId);
      stackObserver.disconnect();
      window.removeEventListener('scroll', wakeStack);
      window.removeEventListener('resize', wakeStack);
      document.removeEventListener('visibilitychange', onVisibility);
      if (finePointer) window.removeEventListener('pointermove', onPointerMove);
      cards.forEach((card) => {
        card.style.willChange = 'auto';
        card.style.transform = '';
        card.style.visibility = '';
        card.style.opacity = '';
        card.style.zIndex = '';
      });
    };
  }, []);

  return (
    <section className="about-acts about-evo3d t-dark" id="acts" aria-label="The evolution">
      <div className="container about-evo3d__head">
        <header className="about-acts__head">
          <div className="chapter__meta" data-reveal>
            <span className="chapter__num">✦</span>
            <span className="chapter__rule" />
            <span className="chapter__tag">The Evolution</span>
          </div>
          <h2 className="chapter__title" data-reveal>
            The frame
            <br />
            <em>kept getting bigger.</em>
          </h2>
          <p className="about-acts__hint" data-reveal>
            What started with images gradually became a way of thinking about interactions, spaces, systems and people.
          </p>
        </header>
        <p className="about-acts__meta" aria-hidden="true">
          08 Frames
        </p>
      </div>
      <div className="about-evo3d__scroll" ref={scrollRef}>
        <div className="about-evo3d__stage">
          <div className="about-evo3d__camera" ref={cameraRef}>
            <div className="about-evo3d__world">
              {EVOLUTION_CARDS.map((card, i) => (
                <article
                  key={card.act}
                  className={`about-evo3d__card about-act${card.serif ? ' about-evo3d__card--interlude' : ''}`}
                  data-act={card.act}
                  data-world={card.world}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                >
                  {card.image && (
                    <img
                      className="about-evo3d__image"
                      src={card.image}
                      alt={card.alt ?? ''}
                      width="1312"
                      height="816"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {card.image && <div className="about-evo3d__overlay" aria-hidden="true" />}
                  <div className="about-evo3d__gradient" aria-hidden="true" />
                  <div className="about-evo3d__edge" aria-hidden="true" />
                  <div className="about-evo3d__shadow" aria-hidden="true" />
                  <div className="about-evo3d__hinge" aria-hidden="true" />
                  <div className="about-evo3d__meta" aria-hidden="true">
                    <span className="about-evo3d__meta-line" />
                    <span>{card.meta}</span>
                  </div>
                  {card.category && <div className="about-evo3d__category">{card.category}</div>}
                  <div className="about-evo3d__content">
                    <p className="about-evo3d__note">{card.note}</p>
                    <h3 className={`about-evo3d__title${card.serif ? ' about-evo3d__title--serif' : ''}`}>
                      <span>{card.title[0]}</span>
                      <span>{card.title[1]}</span>
                      <span>{card.title[2]}</span>
                    </h3>
                    {card.desc && <p className="about-evo3d__desc">{card.desc}</p>}
                    {card.stmt && <p className="about-evo3d__stmt">{card.stmt}</p>}
                    {card.system && (
                      <ol className="about-evo3d__system">
                        {card.system.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    )}
                    {card.duo && (
                      <p className="about-evo3d__duo">
                        <span>{card.duo.span}</span>
                        <strong>
                          {card.duo.strong[0]}
                          <em>{card.duo.strong[1]}</em>
                        </strong>
                      </p>
                    )}
                    {card.mark && (
                      <p className="about-evo3d__mark" aria-hidden="true">
                        {card.mark}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
