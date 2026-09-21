import { useEffect } from 'react';

/**
 * Faithful React/TypeScript reproduction of /js/orange-business-case-study.js
 * Preserves desktop interactions exactly at 901px+, with touch/perf adaptations via CSS.
 */
export function useOrangeBusinessMotion() {
  useEffect(() => {
    const $ = (s: string, r: Document | Element = document) => r.querySelector(s) as HTMLElement | null;
    const $$ = (s: string, r: Document | Element = document) => [...r.querySelectorAll(s)] as HTMLElement[];
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    const hero = $('.ob-hero');
    if (hero) {
      requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
    }

    const pins = $$('.ob-pin');
    const panoTitle = $('#panoTitle');
    const panoDesc = $('#panoDesc');
    const panoText = $('#panoText');
    let tourTimer: number | null = null;
    let tourIdx = 0;
    let userTouchedPano = false;

    const selectPin = (pin: HTMLElement) => {
      if (!pin) return;
      pins.forEach((p) => p.classList.toggle('is-active', p === pin));
      if (panoTitle) panoTitle.textContent = (pin.dataset.title as string) ?? '';
      if (panoDesc) panoDesc.textContent = (pin.dataset.desc as string) ?? '';
      if (panoText) {
        panoText.classList.remove('is-swap');
        void (panoText as unknown as { offsetWidth: number }).offsetWidth;
        panoText.classList.add('is-swap');
      }
      pins.forEach((p) => {
        if (p !== pin) p.removeAttribute('aria-current');
      });
      pin.setAttribute('aria-current', 'true');
    };

    const pinListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (pins.length && panoTitle) {
      pins.forEach((pin) => {
        const fn = () => {
          userTouchedPano = true;
          if (tourTimer) {
            clearInterval(tourTimer);
            tourTimer = null;
          }
          selectPin(pin);
        };
        pin.addEventListener('click', fn);
        pinListeners.push({ el: pin, fn });
      });

      if (!reducedMotion) {
        const panoFig = $('.ob-pano');
        if (panoFig && 'IntersectionObserver' in window) {
          const ob = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) {
              if (tourTimer) {
                clearInterval(tourTimer);
                tourTimer = null;
              }
              return;
            }
            if (userTouchedPano || tourTimer) return;
            setTimeout(() => {
              if (userTouchedPano || tourTimer || document.hidden) return;
              tourTimer = window.setInterval(() => {
                if (document.hidden) return;
                tourIdx = (tourIdx + 1) % pins.length;
                selectPin(pins[tourIdx]);
              }, 4200);
            }, 2200);
          }, { threshold: 0.5 });
          ob.observe(panoFig);
        }
      }
    }

    // Stages
    const stageBtns = $$('.ob-stages__list button');
    const stagePanel = $('.ob-stages__panel') as HTMLElement | null;
    const stageListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (stageBtns.length && stagePanel) {
      const stageBody = $('.ob-stages__body', stagePanel);
      stageBtns.forEach((btn) => {
        const fn = () => {
          stageBtns.forEach((b) => {
            b.classList.toggle('is-active', b === btn);
            b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
          });
          stagePanel.dataset.i = btn.dataset.i as string;
          const lis = (btn.dataset.b || '').split('|').filter(Boolean).map((t) => '<li>' + t + '</li>').join('');
          if (stageBody) {
            stageBody.innerHTML = '<span class="ob-stages__tag">' + (btn.dataset.tag ?? '') + '</span>' + '<h3>' + (btn.dataset.i ?? '') + ' — ' + (btn.dataset.title ?? '') + '</h3>' + '<p>' + (btn.dataset.desc ?? '') + '</p>' + '<ul>' + lis + '</ul>';
            stageBody.classList.remove('is-swap');
            void (stageBody as unknown as { offsetWidth: number }).offsetWidth;
            stageBody.classList.add('is-swap');
          }
        };
        btn.addEventListener('click', fn);
        stageListeners.push({ el: btn, fn });
      });
    }

    // Room response
    const room = document.querySelector('.room-response') as HTMLElement | null;
    const roomToggle = document.querySelector('.response-toggle') as HTMLElement | null;
    let roomListener: (() => void) | null = null;
    if (room && roomToggle) {
      const setRoom = (active: boolean) => {
        (room as HTMLElement).dataset.state = active ? 'active' : 'standby';
        const v = room.querySelector('.response-visitor') as HTMLElement | null;
        const cu = room.querySelector('.response-curtains') as HTMLElement | null;
        const li = room.querySelector('.response-lights') as HTMLElement | null;
        const mo = room.querySelector('.response-mode') as HTMLElement | null;
        if (v) v.textContent = active ? 'DETECTED' : 'NO VISITOR';
        if (cu) cu.textContent = active ? 'CLOSED' : 'OPEN';
        if (li) li.textContent = active ? 'ON' : 'OFF';
        if (mo) mo.textContent = active ? 'ACTIVE' : 'STANDBY';
        if (roomToggle.firstChild) (roomToggle.firstChild as Text).textContent = active ? 'LEAVE ROOM ' : 'ENTER ROOM ';
        roomToggle.setAttribute('aria-pressed', String(active));
        roomToggle.setAttribute('aria-label', active ? 'Set room to standby' : 'Activate room response');
      };
      setRoom(false);
      roomListener = () => setRoom(room.dataset.state !== 'active');
      roomToggle.addEventListener('click', roomListener);
    }

    // Media tabs
    const tabs = $$('.ob-media__tabs button');
    const frames = $$('.ob-media__frame');
    const stageEl = $('.ob-media__stage');
    const tabListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    let mediaObserver: IntersectionObserver | null = null;
    if (tabs.length && frames.length) {
      frames.forEach((fr) => {
        const src = $('source', fr) as HTMLSourceElement | null;
        const vid = $('video', fr) as HTMLVideoElement | null;
        const mark = () => $('.ob-media__vid', fr)?.classList.add('is-missing');
        if (src) src.addEventListener('error', mark);
        if (vid) vid.addEventListener('error', mark, true);
      });
      const activeVideo = () => $('.ob-media__frame.is-active video') as HTMLVideoElement | null;
      tabs.forEach((tab) => {
        const fn = () => {
          tabs.forEach((t) => {
            t.classList.toggle('is-active', t === tab);
            t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
          });
          frames.forEach((fr) => {
            const on = fr.id === tab.dataset.target;
            fr.classList.toggle('is-active', on);
            const v = $('video', fr) as HTMLVideoElement | null;
            if (v && !on) v.pause();
          });
          const v = activeVideo();
          if (v) {
            v.load();
            v.play?.().catch(() => {});
          }
        };
        tab.addEventListener('click', fn);
        tabListeners.push({ el: tab, fn });
      });
      if (stageEl && 'IntersectionObserver' in window) {
        mediaObserver = new IntersectionObserver(([e]) => {
          const v = activeVideo();
          if (!v) return;
          if (e.isIntersecting) {
            if (v.readyState === 0) v.load();
            v.play?.().catch(() => {});
          } else {
            v.pause();
          }
        }, { threshold: 0.15 });
        mediaObserver.observe(stageEl);
      }
    }

    // Reveal
    const reveals = $$('.reveal, .ob-reveal');
    let revealObserver: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && reveals.length) {
      revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.16 });
      reveals.forEach((el) => revealObserver!.observe(el));
      const closing = $('.ob-closing');
      if (closing) {
        const cob = new IntersectionObserver(([e], obs) => {
          if (e.isIntersecting) {
            closing.classList.add('is-in');
            obs.disconnect();
          }
        }, { threshold: 0.3 });
        cob.observe(closing);
      }
    } else {
      reveals.forEach((el) => el.classList.add('is-in'));
      $('.ob-closing')?.classList.add('is-in');
    }

    // Role chain
    const roleBtns = $$('.role-chain button');
    const roleOut = $('.role-chain-output p');
    const roleListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (roleBtns.length && roleOut) {
      roleBtns.forEach((btn) => {
        const fn = () => {
          roleBtns.forEach((b) => b.classList.toggle('active', b === btn));
          roleOut.textContent = (btn.dataset.copy as string) || '';
        };
        btn.addEventListener('click', fn);
        roleListeners.push({ el: btn, fn });
      });
    }

    // Purpose
    const purposeBtns = $$('.purpose-strip button');
    const purposeListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (purposeBtns.length) {
      const exp = $('.purpose-output > div:first-child p');
      const bus = $('.purpose-output > div:last-child p');
      purposeBtns.forEach((btn) => {
        const fn = () => {
          purposeBtns.forEach((b) => b.classList.toggle('active', b === btn));
          if (exp) exp.textContent = (btn.dataset.experience as string) || '';
          if (bus) bus.textContent = (btn.dataset.business as string) || '';
        };
        btn.addEventListener('click', fn);
        purposeListeners.push({ el: btn, fn });
      });
    }

    // Architecture
    const arcBtns = $$('.architecture-branches button');
    const arcListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (arcBtns.length) {
      const outB = $('.architecture-output b');
      const outP = $('.architecture-output > div:nth-child(2) p');
      const outE = $('.architecture-output > div:nth-child(3) p');
      const outBus = $('.architecture-output > div:nth-child(4) p');
      arcBtns.forEach((btn) => {
        const fn = () => {
          arcBtns.forEach((b) => b.classList.toggle('active', b === btn));
          if (outB) outB.textContent = (btn.dataset.title as string) || '';
          if (outP) outP.textContent = (btn.dataset.what as string) || '';
          if (outE) outE.textContent = (btn.dataset.experience as string) || '';
          if (outBus) outBus.textContent = (btn.dataset.business as string) || '';
        };
        btn.addEventListener('click', fn);
        arcListeners.push({ el: btn, fn });
      });
    }

    // Dialog
    const dialog = $('.summary-dialog') as HTMLDialogElement | null;
    const openBtns = $$('.summary-open');
    const closeBtn = dialog?.querySelector('.dialog-close') as HTMLElement | null;
    const openListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    openBtns.forEach((btn) => {
      const fn = () => dialog?.showModal();
      btn.addEventListener('click', fn);
      openListeners.push({ el: btn, fn });
    });
    const closeFn = () => dialog?.close();
    closeBtn?.addEventListener('click', closeFn);
    const dialogClick = (e: Event) => {
      if (e.target === dialog) dialog?.close();
    };
    dialog?.addEventListener('click', dialogClick);

    return () => {
      if (tourTimer) clearInterval(tourTimer);
      pinListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      stageListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      if (roomToggle && roomListener) roomToggle.removeEventListener('click', roomListener);
      tabListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      mediaObserver?.disconnect();
      revealObserver?.disconnect();
      roleListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      purposeListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      arcListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      openListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      closeBtn?.removeEventListener('click', closeFn);
      dialog?.removeEventListener('click', dialogClick);
    };
  }, []);
}
