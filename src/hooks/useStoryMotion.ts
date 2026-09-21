import { useEffect } from 'react';

function documentY(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function closestInteractive(target: EventTarget | null, selector: string): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(selector) : null;
}

/**
 * Story-only motion port. Its values, timing, observers, progressive fallbacks
 * and compass behavior are carried from the legacy Story page rather than
 * approximated with a generic animation layer.
 */
export function useStoryMotion(): void {
  useEffect(() => {
    if (!document.body.classList.contains('about-page')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('arena-reduce', reduced);
    document.body.classList.toggle('about-reduce', reduced);

    const cleanup: Array<() => void> = [];
    const frames = new Set<number>();
    const timeouts = new Set<number>();
    let disposed = false;

    const schedule = (callback: FrameRequestCallback): number => {
      let frame = 0;
      frame = window.requestAnimationFrame((time) => {
        frames.delete(frame);
        if (!disposed) callback(time);
      });
      frames.add(frame);
      return frame;
    };
    const delay = (callback: () => void, milliseconds: number): number => {
      const timer = window.setTimeout(() => {
        timeouts.delete(timer);
        if (!disposed) callback();
      }, milliseconds);
      timeouts.add(timer);
      return timer;
    };
    const listenWindow = <K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, options?: AddEventListenerOptions) => {
      window.addEventListener(type, listener as EventListener, options);
      cleanup.push(() => window.removeEventListener(type, listener as EventListener));
    };
    const listenDocument = <K extends keyof DocumentEventMap>(type: K, listener: (event: DocumentEventMap[K]) => void, options?: AddEventListenerOptions) => {
      document.addEventListener(type, listener as EventListener, options);
      cleanup.push(() => document.removeEventListener(type, listener as EventListener));
    };

    const interactiveSelector = "a, button, [role='button'], summary";
    const onPress = (event: PointerEvent) => closestInteractive(event.target, interactiveSelector)?.classList.add('is-pressing');
    const clearPress = (event: PointerEvent) => closestInteractive(event.target, interactiveSelector)?.classList.remove('is-pressing');
    listenDocument('pointerdown', onPress, { passive: true });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => listenDocument(type as keyof DocumentEventMap, clearPress as never, { passive: true }));

    const statNumbers = Array.from(document.querySelectorAll<HTMLElement>('.about-frame__num strong[data-count]'));
    if (statNumbers.length) {
      const statsObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            const target = Number.parseInt((entry.target as HTMLElement).dataset.count ?? '', 10) || 0;
            const value = entry.target.querySelector<HTMLElement>('.about-frame__num-val') ?? entry.target as HTMLElement;
            if (reduced || target <= 0) {
              value.textContent = String(target);
              return;
            }
            const started = performance.now();
            const step = (now: number) => {
              const progress = Math.min((now - started) / 1100, 1);
              value.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
              if (progress < 1) schedule(step);
            };
            schedule(step);
          });
        },
        { threshold: 0.4 },
      );
      statNumbers.forEach((number) => statsObserver.observe(number));
      cleanup.push(() => statsObserver.disconnect());
    }

    const marqueeTracks = Array.from(document.querySelectorAll<HTMLElement>('.about-prologue__mq-track'));
    if (marqueeTracks.length) {
      const marqueeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        });
      }, { threshold: 0.02 });
      marqueeTracks.forEach((track) => marqueeObserver.observe(track));
      cleanup.push(() => marqueeObserver.disconnect());
    }

    const prologue = document.getElementById('prologue');
    const prologueLines = prologue ? Array.from(prologue.querySelectorAll<HTMLElement>('.about-prologue__line')) : [];
    const heroDepth = [-0.055, -0.095, -0.14];
    const updateTheater = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.3 && !reduced) {
        prologueLines.forEach((line, index) => {
          line.style.transform = `translate3d(0, ${(y * (heroDepth[index] ?? -0.14)).toFixed(1)}px, 0)`;
        });
      } else if (!reduced) {
        prologueLines.forEach((line) => { line.style.transform = ''; });
      }
    };

    const portrait = document.querySelector<HTMLImageElement>('.about-frame__portrait img');
    if (portrait && !reduced) {
      let top = 0;
      let height = 1;
      const measurePortrait = () => {
        top = documentY(portrait);
        height = Math.max(portrait.offsetHeight, 1);
      };
      const updatePortrait = () => {
        const portraitTop = top - window.scrollY;
        if (portraitTop > window.innerHeight || portraitTop + height < 0) return;
        const progress = clamp((window.innerHeight * 0.6 - portraitTop) / (height + window.innerHeight * 0.6), 0, 1);
        portrait.style.transform = `scale(1.06) translate3d(0, ${(-5 + progress * 10).toFixed(1)}px, 0)`;
      };
      const onPortraitScroll = () => schedule(() => updatePortrait());
      measurePortrait();
      listenWindow('resize', measurePortrait, { passive: true });
      listenWindow('load', measurePortrait, { passive: true });
      listenWindow('scroll', onPortraitScroll, { passive: true });
      listenWindow('resize', updatePortrait, { passive: true });
      updatePortrait();
    }

    const zoomStage = document.getElementById('aboutZoomStage');
    const zoomFrame = document.getElementById('aboutZoomFrame');
    const zoomLabels = Array.from(document.querySelectorAll<HTMLElement>('#aboutZoomLabels li'));
    if (zoomStage && zoomFrame) {
      let top = 0;
      let height = 1;
      let lastProgress = -1;
      let lastStage = -1;
      const ghostOne = document.getElementById('aboutZoomGhost1');
      const ghostTwo = document.getElementById('aboutZoomGhost2');
      const measureZoom = () => {
        top = documentY(zoomStage);
        height = Math.max(zoomStage.offsetHeight, 1);
      };
      const updateZoom = () => {
        if (reduced) return;
        const progress = clamp((window.innerHeight * 0.62 - (top - window.scrollY)) / (height * 0.9 + window.innerHeight * 0.4), 0, 1);
        const stage = Math.min(Math.floor(progress * 4) + 1, 4);
        if (progress === lastProgress && stage === lastStage) return;
        lastProgress = progress;
        lastStage = stage;
        zoomFrame.style.setProperty('--zp', progress.toFixed(3));
        zoomLabels.forEach((label, index) => label.classList.toggle('is-on', index + 1 <= stage));
        if (ghostOne) {
          ghostOne.style.opacity = Math.max(0, (progress - 0.4) * 0.5).toFixed(3);
          ghostOne.style.transform = `scale(${(1.06 + progress * 0.12).toFixed(3)})`;
        }
        if (ghostTwo) {
          ghostTwo.style.opacity = Math.max(0, (progress - 0.72) * 0.5).toFixed(3);
          ghostTwo.style.transform = `scale(${(1.02 + progress * 0.2).toFixed(3)})`;
        }
      };
      const onZoomScroll = () => schedule(() => updateZoom());
      measureZoom();
      listenWindow('resize', measureZoom, { passive: true });
      listenWindow('load', measureZoom, { passive: true });
      listenWindow('scroll', onZoomScroll, { passive: true });
      listenWindow('resize', updateZoom, { passive: true });
      updateZoom();
    }

    const environmentSections: Array<[string, string]> = [
      ['.about-frame', 'light'],
      ['.about-acts', 'dark'],
      ['.about-interlude', 'dark'],
      ['.about-what', 'light'],
      ['.about-now', 'dark'],
      ['.about-curious', 'light'],
      ['.about-credits', 'light'],
    ];
    const environmentGeometry: Array<{ top: number; height: number; environment: string }> = [];
    const measureEnvironment = () => {
      environmentGeometry.length = 0;
      environmentSections.forEach(([selector, environment]) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (element) environmentGeometry.push({ top: documentY(element), height: element.offsetHeight, environment });
      });
    };
    const updateEnvironment = () => {
      const viewport = window.innerHeight;
      const scroll = window.scrollY;
      let environment: string | null = null;
      let largestArea = 0;
      environmentGeometry.forEach((geometry) => {
        const top = geometry.top - scroll;
        const area = Math.min(top + geometry.height, viewport) - Math.max(top, 0);
        if (area > 0 && area > largestArea) {
          environment = geometry.environment;
          largestArea = area;
        }
      });
      if (environment) document.body.dataset.env = environment;
    };
    const onEnvironmentScroll = () => schedule(() => updateEnvironment());
    measureEnvironment();
    listenWindow('resize', measureEnvironment, { passive: true });
    listenWindow('load', measureEnvironment, { passive: true });
    listenWindow('scroll', onEnvironmentScroll, { passive: true });
    listenWindow('resize', updateEnvironment, { passive: true });
    updateEnvironment();

    const atmosphere = document.getElementById('aboutAtmo');
    const worldRgb: Record<string, [number, number, number]> = {
      motion: [77, 141, 255],
      interaction: [0, 183, 212],
      environment: [139, 124, 246],
      experience: [230, 170, 60],
      people: [232, 112, 90],
      leadership: [140, 134, 168],
      interlude: [110, 168, 255],
    };
    const atmosphereGradient = (color: [number, number, number], topOpacity: number, bottomOpacity: number) => (
      `radial-gradient(900px 620px at 50% 4%, rgba(${color[0]},${color[1]},${color[2]},${topOpacity}), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(${Math.round(color[0] * 0.6)},${Math.round(color[1] * 0.6)},${Math.round(color[2] * 0.6)},${bottomOpacity}), transparent 60%)`
    );
    if (atmosphere && !atmosphere.childElementCount) {
      const appendAtmosphere = (name: string, background: string) => {
        const layer = document.createElement('i');
        layer.dataset.atmo = name;
        layer.style.background = background;
        atmosphere.appendChild(layer);
      };
      appendAtmosphere('base', atmosphereGradient([77, 141, 255], 0.13, 0.07));
      Object.keys(worldRgb).forEach((world) => appendAtmosphere(world, atmosphereGradient(worldRgb[world], 0.16, 0.09)));
    }
    let lastAtmosphere = '';
    const setAtmosphere = (world: string | null) => {
      if (!atmosphere) return;
      const name = world ?? 'base';
      if (name === lastAtmosphere) return;
      lastAtmosphere = name;
      Array.from(atmosphere.children).forEach((layer) => layer.classList.toggle('is-on', (layer as HTMLElement).dataset.atmo === name));
    };

    const compass = document.getElementById('aboutCompass');
    const compassButton = document.getElementById('aboutCompassBtn');
    const compassList = document.getElementById('aboutCompassList');
    const compassNumber = document.getElementById('aboutCompassNum');
    const compassName = document.getElementById('aboutCompassName');
    if (compass && prologue) {
      const compassObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            compass.classList.remove('is-show');
            compass.hidden = true;
          } else {
            compass.hidden = false;
            schedule(() => compass.classList.add('is-show'));
          }
        });
      }, { threshold: 0 });
      compassObserver.observe(prologue);
      cleanup.push(() => compassObserver.disconnect());
    }
    if (compassButton && compassList) {
      const openCompass = () => {
        compassButton.setAttribute('aria-expanded', 'true');
        compassList.hidden = false;
        schedule(() => schedule(() => compassList.classList.add('is-show')));
        if (!reduced && navigator.vibrate) navigator.vibrate(8);
      };
      const closeCompass = () => {
        compassButton.setAttribute('aria-expanded', 'false');
        compassList.classList.remove('is-show');
        compassList.classList.add('is-closing');
        delay(() => {
          if (!compassList.classList.contains('is-show')) compassList.hidden = true;
          compassList.classList.remove('is-closing');
        }, 240);
      };
      const onCompassClick = () => {
        if (compassButton.getAttribute('aria-expanded') === 'true') closeCompass();
        else openCompass();
      };
      const onCompassKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !compassList.hidden) {
          closeCompass();
          compassButton.focus();
        }
      };
      compassButton.addEventListener('click', onCompassClick);
      listenDocument('keydown', onCompassKeyDown);
      cleanup.push(() => compassButton.removeEventListener('click', onCompassClick));
    }

    const evolution = document.querySelector<HTMLElement>('.about-evo3d');
    const runway = document.querySelector<HTMLElement>('.about-evo3d__scroll');
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.about-evo3d__card'));
    const cardImages = Array.from(document.querySelectorAll<HTMLImageElement>('.about-evo3d__card .about-evo3d__image'));
    const shadows = Array.from(document.querySelectorAll<HTMLElement>('.about-evo3d__shadow'));
    const camera = document.querySelector<HTMLElement>('.about-evo3d__camera');

    if (compassList) {
      Array.from(compassList.querySelectorAll<HTMLButtonElement>('button[data-act]')).forEach((button) => {
        const onAct = () => {
          const index = Number.parseInt(button.dataset.act ?? '', 10) || 1;
          if (runway && cards.length) {
            const scrollable = Math.max(runway.offsetHeight - window.innerHeight, 1);
            const top = runway.getBoundingClientRect().top + window.scrollY;
            const cardPoint = index === 1 ? 0 : index - 1 + 0.12;
            const target = Math.max(top + scrollable * (cardPoint / (cards.length + 1.2)), 0);
            window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
          } else {
            document.querySelector<HTMLElement>(`.about-evo3d__card[data-act="${button.dataset.act}"]`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
          }
          compassButton?.setAttribute('aria-expanded', 'false');
          compassList.hidden = true;
        };
        button.addEventListener('click', onAct);
        cleanup.push(() => button.removeEventListener('click', onAct));
      });
    }

    if (evolution && cards.length && !reduced) {
      const total = cards.length;
      const cardDepth = 220;
      const stackY = 26;
      const openAngle = 82;
      const exitY = 125;
      const exitZ = 460;
      const scaleStep = 0.034;
      const easeInOut = (value: number) => (value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2);
      const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
      let top = 0;
      let scrollable = 1;
      const measureEvolution = () => {
        const stage = runway ?? evolution;
        top = documentY(stage);
        scrollable = Math.max(stage.offsetHeight - window.innerHeight, 1);
      };
      measureEvolution();
      listenWindow('load', measureEvolution, { passive: true });
      listenWindow('resize', measureEvolution, { passive: true });
      if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(measureEvolution);
        observer.observe(document.documentElement);
        cleanup.push(() => observer.disconnect());
      }
      const progress = () => clamp((window.scrollY - top) / scrollable, 0, 1);
      const cardNames = cards.map((card) => card.querySelector<HTMLElement>('.about-evo3d__meta span:last-child')?.textContent?.trim() ?? '');
      const syncCompass = (active: number) => {
        if (!compassNumber) return;
        compassNumber.textContent = String(active).padStart(2, '0');
        if (compassName) compassName.textContent = cardNames[active - 1] || String(active).padStart(2, '0');
      };
      let stackVisible = false;
      let stackRunning = false;
      let lastFrame = performance.now();
      let mouseX = 0;
      let mouseY = 0;
      let cameraX = 0;
      let cameraY = 0;
      const signatures = cards.map(() => '');
      let lastActive = -1;
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      if (finePointer) {
        const onPointerMove = (event: PointerEvent) => {
          mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        };
        listenWindow('pointermove', onPointerMove, { passive: true });
      }
      let skipFrame = false;
      const animate = (now: number) => {
        if (!stackVisible || document.hidden) {
          stackRunning = false;
          return;
        }
        skipFrame = !skipFrame;
        if (skipFrame) {
          schedule(animate);
          return;
        }
        const delta = Math.min(Math.max((now - lastFrame) / 1000, 1 / 240), 0.25);
        lastFrame = now;
        const currentProgress = progress();
        const cardProgress = Math.min(currentProgress * (total + 1.2), total - 1);
        const inView = currentProgress > 0.001 && currentProgress < 0.999;
        const active = clamp(Math.floor(cardProgress) + 1, 1, total);
        setAtmosphere(inView ? cards[active - 1].dataset.world ?? null : null);
        if (active !== lastActive) {
          syncCompass(active);
          cards.forEach((card, index) => card.classList.toggle('is-front', index === active - 1));
          lastActive = active;
        }
        cards.forEach((card, index) => {
          const relative = index - cardProgress;
          let transform = '';
          let opacity = '';
          let zIndex = '';
          let visibility = '';
          let imageTransform = '';
          let shadowTransform = '';
          let shadowOpacity = '';
          if (relative < -1) {
            visibility = 'hidden';
            transform = `translate3d(0, ${-exitY}vh, ${exitZ}px) rotateX(-${openAngle}deg) rotateY(-6deg) scale(.86)`;
            opacity = '0';
            zIndex = '0';
          } else if (relative >= -1 && relative <= 0) {
            visibility = 'visible';
            const value = easeInOut(Math.abs(relative));
            transform = `translate3d(0, ${(-value * exitY).toFixed(2)}vh, ${(value * exitZ).toFixed(2)}px) rotateX(${(-value * openAngle).toFixed(2)}deg) rotateY(${(-value * 6).toFixed(2)}deg) rotateZ(${(value * 1.5).toFixed(2)}deg) scale(${(1 - value * 0.07).toFixed(4)})`;
            opacity = (1 - Math.max(0, value - 0.9) * 10).toFixed(3);
            zIndex = '1000';
            if (cardImages[index]) imageTransform = `translateZ(35px) scale(${(1.12 + value * 0.2).toFixed(4)}) translateY(${(value * 7).toFixed(2)}%)`;
            if (shadows[index]) {
              shadowTransform = `translateZ(${(-300 + value * 220).toFixed(1)}px) rotateX(72deg) scale(${(1 + value * 0.5).toFixed(4)})`;
              shadowOpacity = (0.72 - value * 0.58).toFixed(3);
            }
          } else if (relative > 0 && relative < 1.5) {
            visibility = 'visible';
            const value = easeOut(clamp(1 - (relative - 1), 0, 1));
            transform = `translate3d(0, ${(stackY - value * stackY).toFixed(2)}px, ${(-cardDepth + value * cardDepth).toFixed(2)}px) rotateX(${(0.65 - value * 0.65).toFixed(3)}deg) rotateY(${(-0.35 + value * 0.35).toFixed(3)}deg) scale(${(0.966 + value * 0.034).toFixed(4)})`;
            opacity = (0.9 + value * 0.1).toFixed(3);
            zIndex = '999';
            if (cardImages[index]) imageTransform = `translateZ(35px) scale(${(1.14 - value * 0.02).toFixed(4)})`;
          } else {
            visibility = 'visible';
            const depth = Math.min(relative, 6);
            transform = `translate3d(0, ${(depth * stackY).toFixed(1)}px, ${(-depth * cardDepth).toFixed(1)}px) rotateX(${(depth * 0.65).toFixed(1)}deg) rotateY(${(-depth * 0.35).toFixed(1)}deg) scale(${(1 - depth * scaleStep).toFixed(3)})`;
            opacity = Math.max(0, 1 - depth * 0.11).toFixed(2);
            zIndex = String(900 - index);
            if (cardImages[index]) imageTransform = 'translateZ(35px) scale(1.12)';
          }
          const signature = `${transform}|${opacity}|${zIndex}|${visibility}|${imageTransform}|${shadowTransform}|${shadowOpacity}`;
          if (signature === signatures[index]) return;
          signatures[index] = signature;
          card.style.visibility = visibility;
          card.style.transform = transform;
          card.style.opacity = opacity;
          card.style.zIndex = zIndex;
          if (imageTransform && cardImages[index]) cardImages[index].style.transform = imageTransform;
          if (shadowTransform && shadows[index]) shadows[index].style.transform = shadowTransform;
          if (shadowOpacity && shadows[index]) shadows[index].style.opacity = shadowOpacity;
        });
        const cameraBlend = 1 - Math.exp(-3 * delta);
        const previousX = cameraX;
        const previousY = cameraY;
        cameraX += ((finePointer ? mouseX * 3 : 0) - cameraX) * cameraBlend;
        cameraY += ((finePointer ? mouseY * -2 : 0) - cameraY) * cameraBlend;
        if (camera && (Math.abs(cameraX - previousX) > 0.004 || Math.abs(cameraY - previousY) > 0.004)) {
          camera.style.transform = `rotateX(${cameraY.toFixed(3)}deg) rotateY(${cameraX.toFixed(3)}deg)`;
        }
        schedule(animate);
      };
      const startStack = () => {
        if (stackRunning || !stackVisible || document.hidden) return;
        cardImages.forEach((image) => { void image.decode?.().catch(() => undefined); });
        lastFrame = performance.now();
        stackRunning = true;
        schedule(animate);
      };
      const stackObserver = new IntersectionObserver((entries) => {
        stackVisible = Boolean(entries[0]?.isIntersecting);
        if (stackVisible) startStack();
      }, { rootMargin: '20% 0px', threshold: 0 });
      const stackRunway = runway ?? evolution;
      stackObserver.observe(stackRunway);
      cleanup.push(() => stackObserver.disconnect());
      let wakeQueued = false;
      const wakeStack = () => {
        if (wakeQueued) return;
        wakeQueued = true;
        schedule(() => {
          wakeQueued = false;
          const viewport = window.innerHeight;
          const scroll = window.scrollY;
          stackVisible = scroll - viewport * 0.2 < top + scrollable && scroll + viewport * 1.2 > top;
          if (stackVisible) startStack();
        });
      };
      const onVisibility = () => { if (!document.hidden) wakeStack(); };
      listenWindow('scroll', wakeStack, { passive: true });
      listenWindow('resize', wakeStack, { passive: true });
      listenDocument('visibilitychange', onVisibility);
      wakeStack();
    }

    let theaterQueued = false;
    const onStoryScroll = () => {
      if (theaterQueued) return;
      theaterQueued = true;
      schedule(() => {
        theaterQueued = false;
        updateTheater();
      });
    };
    const onStoryResize = () => updateTheater();
    listenWindow('scroll', onStoryScroll, { passive: true });
    listenWindow('resize', onStoryResize, { passive: true });
    updateTheater();

    return () => {
      disposed = true;
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
      timeouts.forEach((timer) => window.clearTimeout(timer));
      cleanup.forEach((dispose) => dispose());
      document.body.classList.remove('arena-reduce', 'about-reduce');
    };
  }, []);
}
