import { useEffect } from 'react';

/**
 * Indian Army case study motion — reproduction of /js/indian-army-case-study.js
 * Preserves desktop composition and animations exactly at 901px+,
 * with touch/perf adaptations for ≤900.
 */
export function useIndianArmyMotion() {
  useEffect(() => {
    const $$ = (s: string, r: Document | Element = document) => [...r.querySelectorAll(s)] as HTMLElement[];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    const root = document.documentElement;
    root.classList.add('ia-ok');
    const failsafe = window.setTimeout(() => root.classList.add('ia-failsafe'), 2600);

    // Reveal
    const revealEls = $$('.ia-r, .ia-stages, .reveal');
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && revealEls.length && !reduced) {
      observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-in');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.14 },
      );
      revealEls.forEach((el) => observer!.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }

    // Stages / tabs
    const stageBtns = $$('.ia-stages__list button, .ia-tabs button');
    const stagePanels = $$('.ia-stages__panel, .ia-tab-panel');
    const stageListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (stageBtns.length && stagePanels.length) {
      stageBtns.forEach((btn) => {
        const fn = () => {
          stageBtns.forEach((b) => {
            b.classList.toggle('is-active', b === btn);
            b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
          });
          stagePanels.forEach((p) => {
            const target = btn.dataset.target || btn.dataset.i;
            p.classList.toggle('is-active', p.id === target || p.dataset.i === target);
          });
          // For single-panel body swap (like Orange Business)
          const panel = document.querySelector('.ia-stages__panel .ia-stages__body') as HTMLElement | null;
          if (panel && btn.dataset.title) {
            const lis = (btn.dataset.b || '').split('|').filter(Boolean).map((t) => `<li>${t}</li>`).join('');
            panel.innerHTML = `<span class="ia-stages__tag">${btn.dataset.tag ?? ''}</span><h3>${btn.dataset.i ?? ''} — ${btn.dataset.title ?? ''}</h3><p>${btn.dataset.desc ?? ''}</p>${lis ? `<ul>${lis}</ul>` : ''}`;
            panel.classList.remove('is-swap');
            void (panel as unknown as { offsetWidth: number }).offsetWidth;
            panel.classList.add('is-swap');
          }
        };
        btn.addEventListener('click', fn);
        stageListeners.push({ el: btn, fn });
      });
    }

    // Media tabs (if any)
    const mediaTabs = $$('.ia-media__tabs button');
    const mediaFrames = $$('.ia-media__frame');
    const mediaListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    if (mediaTabs.length && mediaFrames.length) {
      mediaTabs.forEach((tab) => {
        const fn = () => {
          mediaTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
          mediaFrames.forEach((f) => f.classList.toggle('is-active', f.id === (tab.dataset.target as string)));
        };
        tab.addEventListener('click', fn);
        mediaListeners.push({ el: tab, fn });
      });
    }

    // Purpose / role chains
    const chainGroups = $$('.role-chain, .purpose-strip, .architecture-branches');
    const chainListeners: Array<{ el: HTMLElement; fn: () => void }> = [];
    chainGroups.forEach((group) => {
      const btns = [...group.querySelectorAll<HTMLElement>('button')];
      if (!btns.length) return;
      const out = group.nextElementSibling as HTMLElement | null;
      btns.forEach((btn) => {
        const fn = () => {
          btns.forEach((b) => b.classList.toggle('active', b === btn));
          if (out) {
            const exp = out.querySelector('p');
            if (exp && btn.dataset.copy) exp.textContent = btn.dataset.copy;
            // For purpose outputs with two columns
            const exp2 = out.querySelector('div:first-child p');
            const bus2 = out.querySelector('div:last-child p');
            if (exp2 && btn.dataset.experience) exp2.textContent = btn.dataset.experience;
            if (bus2 && btn.dataset.business) bus2.textContent = btn.dataset.business;
          }
        };
        btn.addEventListener('click', fn);
        chainListeners.push({ el: btn, fn });
      });
    });

    // Dialog
    const dialog = document.querySelector('.summary-dialog') as HTMLDialogElement | null;
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
      clearTimeout(failsafe);
      observer?.disconnect();
      stageListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      mediaListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      chainListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      openListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      closeBtn?.removeEventListener('click', closeFn);
      dialog?.removeEventListener('click', dialogClick);
    };
  }, []);
}
