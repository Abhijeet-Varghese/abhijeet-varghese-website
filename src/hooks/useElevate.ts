import { useEffect } from 'react';

/** Supplementary approved micro-interactions formerly supplied by elevate.js. */
export function useElevate(): void {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    // The compact trigger is the active navigation surface through the full
    // phone/tablet tier. Keep its directional hysteresis out of 901px+.
    const mobileChromeQuery = window.matchMedia('(max-width: 900px)');
    const cleanup: Array<() => void> = [];

    const hero = document.querySelector<HTMLElement>('.hp-hero');
    let aurora: HTMLElement | null = null;
    if (hero && !reduced && !hero.querySelector('.e-aurora')) {
      aurora = document.createElement('div');
      aurora.className = 'e-aurora';
      aurora.setAttribute('aria-hidden', 'true');
      aurora.innerHTML = '<i></i><i></i><i></i>';
      hero.prepend(aurora);
    }

    // Exact generic elevate.js pass. The present homepage's chapter markup
    // already uses data-reveal (and therefore produces no extra live targets),
    // but retain the source behavior rather than silently deleting it.
    document
      .querySelectorAll<HTMLElement>('main section[id]:not(#hero) > h2, main section[id]:not(#hero) > header, .page-hero > *')
      .forEach((element, index) => {
        if (!element.hasAttribute('data-elevate') && !element.hasAttribute('data-reveal')) {
          element.setAttribute('data-elevate', 'up');
          element.style.setProperty('--e-d', `${Math.min(index * 0.05, 0.3)}s`);
        }
      });
    document.querySelectorAll<HTMLElement>('[data-elevate-stagger]').forEach((group) => {
      Array.from(group.children).forEach((element, index) => {
        if (!(element instanceof HTMLElement) || element.hasAttribute('data-elevate')) return;
        element.setAttribute('data-elevate', 'up');
        element.style.setProperty('--e-d', `${Math.min(index * 0.08, 0.8)}s`);
      });
    });
    const elevationTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-elevate]'));
    const elevationObserver = elevationTargets.length && !reduced && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-in');
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        )
      : null;
    if (elevationObserver) elevationTargets.forEach((target) => elevationObserver.observe(target));
    else elevationTargets.forEach((target) => target.classList.add('is-in'));
    cleanup.push(() => elevationObserver?.disconnect());

    // elevate.js owns the optional kinetic entrance separately from ordinary
    // chapter reveals. There is no kinetic target on the current homepage,
    // but retain its loader gate and its exact one-shot observer contract.
    const kinetic = hero?.querySelector<HTMLElement>('[data-kinetic]')
      ?? document.querySelector<HTMLElement>('[data-kinetic]');
    let kineticObserver: IntersectionObserver | null = null;
    let kineticWait = 0;
    if (kinetic && 'IntersectionObserver' in window) {
      kineticObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-inview');
            kineticObserver?.disconnect();
          });
        },
        { threshold: 0.4 },
      );
      const observeKinetic = () => kineticObserver?.observe(kinetic);
      if (document.documentElement.classList.contains('av-loading')) {
        kineticWait = window.setInterval(() => {
          if (!document.documentElement.classList.contains('av-loading')) {
            window.clearInterval(kineticWait);
            kineticWait = 0;
            observeKinetic();
          }
        }, 60);
      } else {
        observeKinetic();
      }
      const accent = kinetic.querySelector<HTMLElement>('[data-kinetic-accent]');
      if (accent && !accent.dataset.kBound) {
        accent.dataset.kBound = '1';
        const words = (accent.textContent ?? '').trim().split(/\s+/).filter(Boolean);
        accent.setAttribute('aria-label', (accent.textContent ?? '').trim());
        accent.textContent = '';
        words.forEach((word, index) => {
          const span = document.createElement('span');
          span.className = 'k-w';
          span.textContent = word;
          span.setAttribute('aria-hidden', 'true');
          span.style.setProperty('--k-d', `${(1.15 + index * 0.12).toFixed(2)}s`);
          accent.append(span);
          if (index < words.length - 1) accent.append(document.createTextNode(' '));
        });
      }
    }
    const applyKineticFailsafe = () => {
      if (!document.documentElement.classList.contains('reveal-failsafe')) return;
      document.querySelectorAll<HTMLElement>('[data-kinetic]:not(.is-inview)').forEach((element) => element.classList.add('is-inview'));
    };
    applyKineticFailsafe();
    document.addEventListener('readystatechange', applyKineticFailsafe);
    cleanup.push(() => {
      if (kineticWait) window.clearInterval(kineticWait);
      kineticObserver?.disconnect();
      document.removeEventListener('readystatechange', applyKineticFailsafe);
    });

    const top = document.createElement('button');
    top.className = 'e-top';
    top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3M3.5 8.5 9 3l5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(top);
    const onTop = () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    top.addEventListener('click', onTop);
    cleanup.push(() => top.removeEventListener('click', onTop));

    let scrollFrame = 0;
    let navFrame = 0;
    const nav = document.getElementById('siteNav');
    let hidden = false;
    let valley = window.scrollY;
    let peak = valley;
    let focusWithin = false;
    let hovering = false;
    let menuOpen = false;
    const setHidden = (value: boolean) => {
      if (!nav || hidden === value) return;
      hidden = value;
      nav.classList.toggle('nav-hidden', value);
    };
    const syncDirection = () => {
      valley = window.scrollY;
      peak = valley;
    };
    const updateNav = () => {
      navFrame = 0;
      if (!nav) return;
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
      const y = window.scrollY;
      const mobileChrome = mobileChromeQuery.matches;
      // Directional hysteresis makes small touch corrections inert. The larger
      // mobile distances are intentionally independent of desktop behaviour.
      const hideThreshold = mobileChrome ? 32 : 16;
      const revealThreshold = mobileChrome ? 16 : 8;
      const minimumHideY = mobileChrome ? 96 : 140;
      if (y <= 4) {
        syncDirection();
        setHidden(false);
        return;
      }
      // Touch navigation keeps DOM focus after a tap; it must not permanently
      // suppress direction-based hiding once the menu has closed. A real open
      // menu remains an explicit hard stop at every viewport.
      if ((!mobileChrome && focusWithin) || menuOpen) {
        syncDirection();
        setHidden(false);
        return;
      }
      if (!hidden) {
        if (y < valley) valley = y;
        if (hovering) {
          valley = y;
          return;
        }
        if (y - valley >= hideThreshold && y > minimumHideY) {
          setHidden(true);
          peak = y;
        }
      } else {
        if (y > peak) peak = y;
        if (peak - y >= revealThreshold) {
          setHidden(false);
          valley = y;
        }
      }
    };
    const onScroll = () => {
      if (!scrollFrame) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          top.classList.toggle('show', window.scrollY > window.innerHeight * 0.9);
        });
      }
      if (!navFrame) navFrame = requestAnimationFrame(updateNav);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanup.push(() => window.removeEventListener('scroll', onScroll));

    if (nav) {
      const navInner = nav.querySelector<HTMLElement>('.site-nav__inner');
      const menu = document.getElementById('mobileMenu');
      const onFocusIn = () => {
        focusWithin = true;
        syncDirection();
        setHidden(false);
      };
      const onFocusOut = () => {
        focusWithin = false;
        // In the compact tier a tap can dispatch focusout immediately after a
        // real scroll has begun. Do not erase that directional distance: the
        // trigger must still hide on the downstroke and reveal on reversal.
        if (!mobileChromeQuery.matches) syncDirection();
      };
      const onPointerEnter = (event: PointerEvent) => {
        // Coarse-pointer taps must not become a sticky desktop-hover state;
        // otherwise the next touch scroll cannot hide the compact trigger.
        if (!finePointer || event.pointerType !== 'mouse') return;
        hovering = true;
      };
      const onPointerLeave = (event: PointerEvent) => {
        if (!finePointer || event.pointerType !== 'mouse') return;
        hovering = false;
        syncDirection();
      };
      nav.addEventListener('focusin', onFocusIn);
      nav.addEventListener('focusout', onFocusOut);
      navInner?.addEventListener('pointerenter', onPointerEnter);
      navInner?.addEventListener('pointerleave', onPointerLeave);
      cleanup.push(() => {
        nav.removeEventListener('focusin', onFocusIn);
        nav.removeEventListener('focusout', onFocusOut);
        navInner?.removeEventListener('pointerenter', onPointerEnter);
        navInner?.removeEventListener('pointerleave', onPointerLeave);
      });
      if (menu) {
        const menuObserver = new MutationObserver(() => {
          menuOpen = !menu.hidden;
          syncDirection();
          if (menuOpen) setHidden(false);
        });
        menuObserver.observe(menu, { attributes: true, attributeFilter: ['hidden'] });
        cleanup.push(() => menuObserver.disconnect());
      }
    }

    if (finePointer && !reduced) {
      document.querySelectorAll<HTMLElement>('.btn--accent, .e-top').forEach((element) => {
        if (element.closest('.site-nav')) return;
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          element.style.setProperty('--mx', `${((event.clientX - rect.left - rect.width / 2) * 0.28).toFixed(1)}px`);
          element.style.setProperty('--my', `${((event.clientY - rect.top - rect.height / 2) * 0.28).toFixed(1)}px`);
        };
        const onLeave = () => {
          element.style.setProperty('--mx', '0px');
          element.style.setProperty('--my', '0px');
        };
        element.addEventListener('pointermove', onMove);
        element.addEventListener('pointerleave', onLeave);
        cleanup.push(() => {
          element.removeEventListener('pointermove', onMove);
          element.removeEventListener('pointerleave', onLeave);
        });
      });
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((element) => {
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          element.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
          element.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
        };
        const onLeave = () => {
          element.style.setProperty('--rx', '0deg');
          element.style.setProperty('--ry', '0deg');
        };
        element.addEventListener('pointermove', onMove);
        element.addEventListener('pointerleave', onLeave);
        cleanup.push(() => {
          element.removeEventListener('pointermove', onMove);
          element.removeEventListener('pointerleave', onLeave);
        });
      });
    }

    // Preserve the original progressive Navigation API enhancement. It has no
    // effect in browsers without same-document view transitions, and only
    // annotates an existing transition with the nav type when supported.
    try {
      const transitionDocument = document as unknown as Record<string, unknown>;
      const navigationWindow = window as unknown as Record<string, unknown>;
      if (Boolean(transitionDocument.startViewTransition) && Boolean(navigationWindow.navigation)) {
        const tagNavigationTransition = (event: Event) => {
          const transition = (event as Event & { viewTransition?: { types?: { add: (type: string) => void } } }).viewTransition;
          if (!transition) return;
          try {
            transition.types?.add('nav');
          } catch {
            // Match elevate.js: unsupported transition type sets are ignored.
          }
        };
        window.addEventListener('pageswap', tagNavigationTransition);
        window.addEventListener('pagereveal', tagNavigationTransition);
        cleanup.push(() => {
          window.removeEventListener('pageswap', tagNavigationTransition);
          window.removeEventListener('pagereveal', tagNavigationTransition);
        });
      }
    } catch {
      // Navigation API is intentionally optional.
    }

    onScroll();
    updateNav();
    return () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (navFrame) cancelAnimationFrame(navFrame);
      cleanup.forEach((dispose) => dispose());
      top.remove();
      aurora?.remove();
    };
  }, []);
}
