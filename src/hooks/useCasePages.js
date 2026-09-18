import { useEffect } from 'react';
/* Ported 1:1 from legacy js/orange-business-case-study.js */
export function useCaseOrange() {
  useEffect(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const cleanups = [];
    const hero = $('.ob-hero');
    if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
    const pins = $$('.ob-pin');
    const panoNum = $('#panoNum'), panoTitle = $('#panoTitle'), panoDesc = $('#panoDesc');
    const panoText = $('#panoText');
    let tourTimer = null, tourIdx = 0, tourAllowed = !reducedMotion, userTouchedPano = false;
    const selectPin = (pin) => { if (!pin) return; pins.forEach((p) => p.classList.toggle('is-active', p === pin)); if (panoNum) panoNum.textContent = pin.dataset.n; if (panoTitle) panoTitle.textContent = pin.dataset.title; if (panoDesc) panoDesc.textContent = pin.dataset.desc; if (panoText) { panoText.classList.remove('is-swap'); void panoText.offsetWidth; panoText.classList.add('is-swap'); } pins.forEach((p) => { if (p !== pin) p.removeAttribute('aria-current'); }); pin.setAttribute('aria-current', 'true'); };
    if (pins.length && panoTitle) {
      pins.forEach((pin) => { const click = () => { userTouchedPano = true; if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } selectPin(pin); }; pin.addEventListener('click', click); cleanups.push(() => pin.removeEventListener('click', click)); });
      if (tourAllowed) {
        const panoFig = $('.ob-pano');
        let pio = null;
        if (panoFig && 'IntersectionObserver' in window) {
          pio = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } return; }
            if (userTouchedPano || tourTimer) return;
            setTimeout(() => { if (userTouchedPano || tourTimer || document.hidden) return; tourTimer = setInterval(() => { if (document.hidden) return; tourIdx = (tourIdx + 1) % pins.length; selectPin(pins[tourIdx]); }, 4200); }, 2200);
          }, { threshold: 0.5 });
          pio.observe(panoFig);
          cleanups.push(() => pio.disconnect());
        }
      }
    }
    const stageBtns = $$('.ob-stages__list button');
    const stagePanel = $('.ob-stages__panel');
    if (stageBtns.length && stagePanel) {
      const stageBody = $('.ob-stages__body', stagePanel);
      stageBtns.forEach((btn) => {
        const click = () => {
          stageBtns.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
          stagePanel.dataset.i = btn.dataset.i;
          const lis = (btn.dataset.b || '').split('|').filter(Boolean).map((t) => '<li>' + t + '</li>').join('');
          stageBody.innerHTML = '<span class="ob-stages__tag">' + btn.dataset.tag + '</span>' + '<h3>' + btn.dataset.i + ' — ' + btn.dataset.title + '</h3>' + '<p>' + btn.dataset.desc + '</p>' + '<ul>' + lis + '</ul>';
          stageBody.classList.remove('is-swap'); void stageBody.offsetWidth; stageBody.classList.add('is-swap');
        };
        btn.addEventListener('click', click); cleanups.push(() => btn.removeEventListener('click', click));
      });
    }
    const room = document.querySelector('.room-response');
    const roomToggle = document.querySelector('.response-toggle');
    if (room && roomToggle) {
      const setRoom = (active) => { room.dataset.state = active ? 'active' : 'standby'; const v = room.querySelector('.response-visitor'); const cu = room.querySelector('.response-curtains'); const li = room.querySelector('.response-lights'); const mo = room.querySelector('.response-mode'); if (v) v.textContent = active ? 'DETECTED' : 'NO VISITOR'; if (cu) cu.textContent = active ? 'CLOSED' : 'OPEN'; if (li) li.textContent = active ? 'ON' : 'OFF'; if (mo) mo.textContent = active ? 'ACTIVE' : 'STANDBY'; if (roomToggle.firstChild) roomToggle.firstChild.textContent = active ? 'LEAVE ROOM ' : 'ENTER ROOM '; roomToggle.setAttribute('aria-pressed', String(active)); roomToggle.setAttribute('aria-label', active ? 'Set room to standby' : 'Activate room response'); };
      setRoom(false);
      const click = () => setRoom(room.dataset.state !== 'active');
      roomToggle.addEventListener('click', click); cleanups.push(() => roomToggle.removeEventListener('click', click));
    }
    const tabs = $$('.ob-media__tabs button');
    const frames = $$('.ob-media__frame');
    const stageEl = $('.ob-media__stage');
    if (tabs.length && frames.length) {
      frames.forEach((fr) => { const src = $('source', fr); const vid = $('video', fr); const mark = () => { const x = $('.ob-media__vid', fr); if (x) x.classList.add('is-missing'); }; if (src) src.addEventListener('error', mark); if (vid) vid.addEventListener('error', mark, true); });
      const activeVideo = () => { const f = $('.ob-media__frame.is-active'); return f ? $('video', f) : null; };
      tabs.forEach((tab) => {
        const click = () => {
          tabs.forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
          frames.forEach((fr) => { const on = fr.id === tab.dataset.targ; fr.classList.toggle('is-active', on); const v = $('video', fr); if (v && !on) v.pause(); });
          const v = activeVideo(); if (v) { v.load(); v.play?.().catch(() => {}); }
        };
        tab.addEventListener('click', click); cleanups.push(() => tab.removeEventListener('click', click));
      });
      let vio = null;
      if (stageEl && 'IntersectionObserver' in window) {
        vio = new IntersectionObserver(([e]) => { const v = activeVideo(); if (!v) return; if (e.isIntersecting) { if (v.readyState === 0) v.load(); v.play?.().catch(() => {}); } else v.pause(); }, { threshold: 0.15 });
        vio.observe(stageEl); cleanups.push(() => vio.disconnect());
      }
    }
    let rio = null, cio = null;
    if ('IntersectionObserver' in window) {
      rio = new IntersectionObserver((entries, obs) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); } }), { threshold: 0.16 });
      $$('.reveal, .ob-reveal').forEach((el) => rio.observe(el));
      const closing = $('.ob-closing');
      if (closing) { cio = new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { closing.classList.add('is-in'); obs.disconnect(); } }, { threshold: 0.3 }); cio.observe(closing); }
      cleanups.push(() => { rio.disconnect(); if (cio) cio.disconnect(); });
    }
    const roleBtns = $$('.role-chain button');
    const roleOut = $('.role-chain-output p');
    if (roleBtns.length && roleOut) roleBtns.forEach((btn) => { const click = () => { roleBtns.forEach((b) => b.classList.toggle('active', b === btn)); roleOut.textContent = btn.dataset.copy || ''; }; btn.addEventListener('click', click); cleanups.push(() => btn.removeEventListener('click', click)); });
    const purposeBtns = $$('.purpose-strip button');
    if (purposeBtns.length) { const exp = $('.purpose-output > div:first-child p'); const bus = $('.purpose-output > div:last-child p'); purposeBtns.forEach((btn) => { const click = () => { purposeBtns.forEach((b) => b.classList.toggle('active', b === btn)); if (exp) exp.textContent = btn.dataset.experience || ''; if (bus) bus.textContent = btn.dataset.business || ''; }; btn.addEventListener('click', click); cleanups.push(() => btn.removeEventListener('click', click)); }); }
    const arcBtns = $$('.architecture-branches button');
    if (arcBtns.length) { const outB = $('.architecture-output b'); const outP = $('.architecture-output > div:nth-child(2) p'); const outE = $('.architecture-output > div:nth-child(3) p'); const outBus = $('.architecture-output > div:nth-child(4) p'); arcBtns.forEach((btn) => { const click = () => { arcBtns.forEach((b) => b.classList.toggle('active', b === btn)); if (outB) outB.textContent = btn.dataset.title || ''; if (outP) outP.textContent = btn.dataset.what || ''; if (outE) outE.textContent = btn.dataset.experience || ''; if (outBus) outBus.textContent = btn.dataset.business || ''; }; btn.addEventListener('click', click); cleanups.push(() => btn.removeEventListener('click', click)); }); }
    const dialog = $('.summary-dialog');
    const openers = $$('.summary-open');
    const dOpen = () => dialog && dialog.showModal && dialog.showModal();
    openers.forEach((btn) => btn.addEventListener('click', dOpen));
    const dCloseEl = dialog ? dialog.querySelector('.dialog-close') : null;
    const dClose = () => dialog && dialog.close && dialog.close();
    if (dCloseEl) dCloseEl.addEventListener('click', dClose);
    const dClick = (e) => { if (e.target === dialog) dialog.close(); };
    if (dialog) dialog.addEventListener('click', dClick);
    cleanups.push(() => { openers.forEach((btn) => btn.removeEventListener('click', dOpen)); if (dCloseEl) dCloseEl.removeEventListener('click', dClose); if (dialog) dialog.removeEventListener('click', dClick); });
    return () => { if (tourTimer) clearInterval(tourTimer); cleanups.forEach((fn) => fn()); };
  }, []);
}

/* Ported 1:1 from legacy js/indian-army-case-study.js */
export function useCaseArmy() {
  useEffect(() => {
    const doc = document; const root = doc.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    root.classList.add('ia-ok');
    const fs = setTimeout(() => root.classList.add('ia-failsafe'), 2600);
    const revealEls = $$('.ia-r, .ia-stages, .ia-cadence');
    let io = null;
    if ('IntersectionObserver' in window && !reduce.matches) {
      io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealEls.forEach((el) => io.observe(el));
    } else revealEls.forEach((el) => el.classList.add('is-in'));
    root.style.scrollBehavior = 'auto';
    const parallaxEls = $$('.ia-parallax');
    const gate = doc.querySelector('.ia-gate');
    const desktop = window.matchMedia('(min-width: 1000px)');
    let ticking = false;
    const frame = () => { ticking = false; const vh = window.innerHeight || 1; if (reduce.matches) return; if (desktop.matches) { parallaxEls.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; const center = r.top + r.height / 2; const t = clamp((center - vh / 2) / (vh / 2 + r.height / 2), -1, 1); el.style.setProperty('--py', (t * -16).toFixed(2) + 'px'); }); } if (gate) { const g = gate.getBoundingClientRect(); const start = vh * 0.85; const end = vh * 0.15 - g.height * 0.2; const p = clamp((start - g.top) / (start - end), 0, 1); gate.style.setProperty('--g', p.toFixed(4)); } };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
    const dchange = () => onScroll();
    if (desktop.addEventListener) desktop.addEventListener('change', dchange);
    frame();
    const imgs = $$(".ia-fig__frame img[loading='lazy']");
    const onLoad = (img) => () => img.classList.add('is-loaded');
    const fns = [];
    imgs.forEach((img) => { if (img.complete) img.classList.add('is-loaded'); else { const f = onLoad(img); img.addEventListener('load', f, { once: true }); fns.push(() => img.removeEventListener('load', f)); } });
    return () => { clearTimeout(fs); if (io) io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); if (desktop.removeEventListener) desktop.removeEventListener('change', dchange); root.classList.remove('ia-ok', 'ia-failsafe'); root.style.scrollBehavior = ''; fns.forEach((f) => f()); };
  }, []);
}
