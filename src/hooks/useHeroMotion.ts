import { useEffect } from 'react';

interface Fragment {
  element: HTMLElement;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  targetX: number;
  targetY: number;
  clear: boolean;
  phase: number;
  speed: number;
}

/** Fine-pointer hero field / portrait / variable-type interaction. */
export function useHeroMotion(): void {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('.hp6-stage');
    const hero = document.getElementById('hero');
    if (!stage || !hero) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const disposers: Array<() => void> = [];
    const listen = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K,
      listener: (event: WindowEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, listener as EventListener, options);
      disposers.push(() => target.removeEventListener(type, listener as EventListener, options));
    };

    // Portrait follows a fine-pointer only; coarse touch remains completely
    // static, matching the original progressive enhancement.
    const well = document.querySelector<HTMLElement>('.hp6-frame__well');
    let portraitFrame = 0;
    if (well && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let heroTop = 0;
      let heroWidth = 1;
      let heroHeight = 1;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      const measurePortrait = () => {
        const rect = hero.getBoundingClientRect();
        heroTop = rect.top + window.scrollY;
        heroWidth = Math.max(rect.width, 1);
        heroHeight = Math.max(rect.height, 1);
      };
      const animatePortrait = () => {
        portraitFrame = 0;
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        well.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
          portraitFrame = requestAnimationFrame(animatePortrait);
        }
      };
      const requestPortrait = () => {
        if (!portraitFrame) portraitFrame = requestAnimationFrame(animatePortrait);
      };
      const onPortraitMove = (event: PointerEvent) => {
        targetX = (event.clientX / heroWidth - 0.5) * 12;
        targetY = ((event.clientY - (heroTop - window.scrollY)) / heroHeight - 0.5) * 9;
        requestPortrait();
      };
      const onPortraitLeave = () => {
        targetX = 0;
        targetY = 0;
        requestPortrait();
      };
      measurePortrait();
      listen(window, 'resize', measurePortrait, { passive: true });
      listen(window, 'load', measurePortrait, { passive: true });
      listen(hero, 'pointermove', onPortraitMove, { passive: true });
      listen(hero, 'pointerleave', onPortraitLeave, { passive: true });
    }

    const fragments: Fragment[] = Array.from(document.querySelectorAll<HTMLElement>('.hp6-field span')).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        baseX: rect.left + rect.width / 2 + window.scrollX,
        baseY: rect.top + rect.height / 2 + window.scrollY,
        x: 0,
        y: 0,
        previousX: Number.POSITIVE_INFINITY,
        previousY: Number.POSITIVE_INFINITY,
        targetX: 0,
        targetY: 0,
        clear: false,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.35,
      };
    });
    const letters = Array.from(document.querySelectorAll<HTMLElement>('.hp6-name .hp6-l'));
    let letterCenters: Array<{ x: number; y: number }> = [];
    let weights = letters.map(() => 620);
    const measureLetters = () => {
      const baseScroll = window.scrollY;
      letterCenters = letters.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + baseScroll };
      });
    };
    if (letters.length) {
      measureLetters();
      listen(window, 'resize', measureLetters, { passive: true });
      listen(window, 'load', measureLetters, { passive: true });
    }

    let stageVisible = true;
    let pointerX = -10000;
    let pointerY = -10000;
    let pointerAt = -1000000000;
    let frameNumber = 0;
    let lettersSettled = false;
    let heroFrame = 0;
    let lastActivity = performance.now();

    const wake = () => {
      lastActivity = performance.now();
      if (!heroFrame && stageVisible && !document.hidden) heroFrame = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        stageVisible = entry.isIntersecting;
        if (stageVisible) wake();
      },
      { threshold: 0 },
    );
    observer.observe(stage);

    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerAt = performance.now();
      lettersSettled = false;
      wake();
    };
    const onScroll = () => wake();
    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    listen(window, 'pointermove', onPointer, { passive: true });
    listen(window, 'scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    disposers.push(() => document.removeEventListener('visibilitychange', onVisibility));

    function animate(now: number): void {
      heroFrame = 0;
      if (!stageVisible || document.hidden || window.scrollY > window.innerHeight * 1.3 || now - lastActivity > 3000) return;
      frameNumber += 1;
      const time = now / 1000;
      fragments.forEach((fragment) => {
        const ambient = 9;
        const ambientX = Math.sin(time * fragment.speed + fragment.phase) * ambient;
        const ambientY = Math.cos(time * fragment.speed * 0.8 + fragment.phase) * ambient;
        const centerX = fragment.baseX + fragment.x + ambientX - window.scrollX;
        const centerY = fragment.baseY + fragment.y + ambientY - window.scrollY;
        const dx = pointerX - centerX;
        const dy = pointerY - centerY;
        const near = dx * dx + dy * dy < 190 * 190;
        if (near !== fragment.clear) {
          fragment.clear = near;
          fragment.element.classList.toggle('is-clear', near);
        }
        fragment.targetX = near ? ambientX * -0.2 : ambientX;
        fragment.targetY = near ? ambientY * -0.2 : ambientY;
        fragment.x += (fragment.targetX - fragment.x) * 0.1;
        fragment.y += (fragment.targetY - fragment.y) * 0.1;
        if (Math.abs(fragment.x - fragment.previousX) > 0.05 || Math.abs(fragment.y - fragment.previousY) > 0.05) {
          fragment.previousX = fragment.x;
          fragment.previousY = fragment.y;
          fragment.element.style.transform = `translate3d(${fragment.x.toFixed(2)}px, ${fragment.y.toFixed(2)}px, 0)`;
        }
      });

      if (letters.length && !lettersSettled && frameNumber % 3 === 0) {
        let maxGap = 0;
        letters.forEach((letter, index) => {
          const center = letterCenters[index];
          if (!center) return;
          const dx = pointerX - center.x;
          const dy = pointerY - (center.y - window.scrollY);
          const distanceSquared = dx * dx + dy * dy;
          const bump = 130 * Math.exp(-distanceSquared / (150 * 150));
          const targetWeight = Math.max(560, Math.min(700, 620 + bump));
          const weight = weights[index] + (targetWeight - weights[index]) * 0.22;
          maxGap = Math.max(maxGap, Math.abs(targetWeight - weights[index]));
          if (Math.abs(weight - weights[index]) > 1.2) {
            weights[index] = weight;
            letter.style.fontVariationSettings = `'wght' ${weight.toFixed(1)}`;
          }
        });
        if (maxGap < 0.75 && now - pointerAt > 700) lettersSettled = true;
      }
      heroFrame = requestAnimationFrame(animate);
    }

    wake();
    return () => {
      observer.disconnect();
      disposers.forEach((dispose) => dispose());
      if (heroFrame) cancelAnimationFrame(heroFrame);
      if (portraitFrame) cancelAnimationFrame(portraitFrame);
      weights = [];
    };
  }, []);
}
