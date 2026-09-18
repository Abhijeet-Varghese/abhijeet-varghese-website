import { useEffect } from 'react';
/* Global "elevate" layer — ported 1:1 from legacy js/elevate.js:
   data-elevate auto-tagging + IO, stagger groups, pointer parallax, tilt,
   counters, back-to-top, nav hide/show valley-peak logic, form a11y errors,
   kinetic blocks + accent word split, desktop menu auto-close. */
export default function useElevate() {
  useEffect(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;
    const rAF = (fn) => { let t = false; return (...a) => { if (!t) { t = true; requestAnimationFrame(() => { t = false; fn(...a); }); } }; };
    const cleanups = [];

    // data-elevate auto-tag + reveal
    $$('main section[id]:not(#hero) > h2, main section[id]:not(#hero) > header, .page-hero > *').forEach((el, i) => {
      if (!el.hasAttribute('data-elevate') && !el.hasAttribute('data-reveal')) { el.setAttribute('data-elevate', 'up'); el.style.setProperty('--e-d', Math.min(i * 0.05, 0.3) + 's'); }
    });
    $$('[data-elevate-stagger]').forEach((g) => {
      [...g.children].forEach((el, i) => { if (!el.hasAttribute('data-elevate')) { el.setAttribute('data-elevate', 'up'); el.style.setProperty('--e-d', Math.min(i * 0.08, 0.8) + 's'); } });
    });
    const targets = $$('[data-elevate]');
    let io = null;
    if (targets.length && !reduced && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach((t) => io.observe(t));
    } else targets.forEach((t) => t.classList.add('is-in'));

    // pointer parallax + tilt
    if (finePointer && !reduced) {
      const par = (e) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)) + 'px'); el.style.setProperty('--my', (((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)) + 'px'); };
      const leave = (e) => { e.currentTarget.style.setProperty('--mx', '0px'); e.currentTarget.style.setProperty('--my', '0px'); };
      $$('.btn--accent, .e-top').filter((el) => !el.closest('.site-nav')).forEach((el) => { el.addEventListener('pointermove', par); el.addEventListener('pointerleave', leave); cleanups.push(() => { el.removeEventListener('pointermove', par); el.removeEventListener('pointerleave', leave); }); });
      const tiltM = (e) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; el.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg'); };
      const tiltL = (e) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); };
      $$('[data-tilt]').forEach((el) => { el.addEventListener('pointermove', tiltM); el.addEventListener('pointerleave', tiltL); cleanups.push(() => { el.removeEventListener('pointermove', tiltM); el.removeEventListener('pointerleave', tiltL); }); });
    }

    // counters
    const counters = $$('[data-count]');
    if (counters.length) {
      const run = (el) => { const end = parseFloat(el.dataset.count), dec = el.dataset.decimals ? 1 : 0; const suffix = el.dataset.suffix || '', dur = 1400, t0 = performance.now(); const step = (t) => { const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = (end * e).toFixed(dec) + suffix; if (p < 1) requestAnimationFrame(step); }; reduced ? (el.textContent = end + suffix) : requestAnimationFrame(step); };
      let cio = null;
      if ('IntersectionObserver' in window && !reduced) { cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }), { threshold: 0.5 }); counters.forEach((c) => cio.observe(c)); } else counters.forEach(run);
      cleanups.push(() => cio && cio.disconnect());
    }

    // back-to-top
    const top = document.createElement('button');
    top.className = 'e-top'; top.type = 'button'; top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3M3.5 8.5 9 3l5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(top);
    const topScroll = rAF(() => top.classList.toggle('show', scrollY > innerHeight * 0.9));
    addEventListener('scroll', topScroll, { passive: true });
    const topClick = () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    top.addEventListener('click', topClick);
    cleanups.push(() => { removeEventListener('scroll', topScroll); top.remove(); });

    // contact-form a11y error wiring (if the page carries the form)
    const eForm = $('#contactForm');
    if (eForm) {
      const msgs = { cfName: 'Please enter your name.', cfEmail: 'Please enter a valid email address.', cfMobile: 'Please enter a valid mobile number.', cfPhoneWrap: 'Please enter a valid mobile number.', dateTrigger: 'Please choose a date for your intro call.', tslots: 'Please choose a preferred time slot.' };
      const errId = (el) => 'e-err-' + (el.id || 'field');
      const ensureErr = (el) => { el.setAttribute('aria-invalid', 'true'); const id = errId(el); if (!document.getElementById(id)) { const p = document.createElement('p'); p.className = 'e-field-error'; p.id = id; p.setAttribute('role', 'alert'); p.textContent = msgs[el.id] || 'Please complete this field.'; el.insertAdjacentElement('afterend', p); const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean); if (!d.includes(id)) { d.push(id); el.setAttribute('aria-describedby', d.join(' ')); } } };
      const clearErr = (el) => { el.removeAttribute('aria-invalid'); const id = errId(el); const n = document.getElementById(id); if (n) n.remove(); const d = (el.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== id); d.length ? el.setAttribute('aria-describedby', d.join(' ')) : el.removeAttribute('aria-describedby'); };
      let focusing = false;
      const mo = new MutationObserver((muts) => {
        muts.forEach((m) => { const t = m.target; if (!(t instanceof Element)) return; const bad = t.classList.contains('is-invalid') || t.classList.contains('is-flagged'); if (bad && msgs[t.id]) ensureErr(t); else if (!bad && msgs[t.id]) clearErr(t); });
        const firstBad = eForm.querySelector('.is-invalid, .is-flagged');
        if (firstBad && !focusing) { focusing = true; if (!/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(firstBad.tagName)) firstBad.setAttribute('tabindex', '-1'); setTimeout(() => { firstBad.focus({ preventScroll: true }); focusing = false; }, 450); }
      });
      mo.observe(eForm, { attributes: true, subtree: true, attributeFilter: ['class'] });
      cleanups.push(() => mo.disconnect());
      const done = $('#bookDone');
      if (done) {
        const mo2 = new MutationObserver(() => { if (done.hidden) return; const h = done.querySelector('h2, h3') || done; h.setAttribute('tabindex', '-1'); setTimeout(() => h.focus({ preventScroll: true }), 450); });
        mo2.observe(done, { attributes: true, attributeFilter: ['hidden'] });
        cleanups.push(() => mo2.disconnect());
      }
    }

    // nav hide/show (valley-peak) + is-scrolled + menu auto-close on desktop
    const vNav = $('.site-nav');
    if (vNav) {
      const HIDE_AFTER = 16, SHOW_AFTER = 8, TOP_Y = 4, TOP_LOCK = 140;
      let hidden = false, valley = window.scrollY || 0, peak = valley, focusWithin = false, menuOpen = false, hovering = false;
      const apply = (hide) => { if (hide === hidden) return; hidden = hide; vNav.classList.toggle('nav-hidden', hide); };
      const sync = () => { valley = peak = window.scrollY || 0; };
      const onScroll = () => { const y = window.scrollY || 0; if (y <= TOP_Y) { sync(); apply(false); return; } if (focusWithin || menuOpen) { sync(); apply(false); return; } if (!hidden) { if (y < valley) valley = y; if (hovering) { valley = y; return; } if (y - valley >= HIDE_AFTER && y > TOP_LOCK) { apply(true); peak = y; } } else { if (y > peak) peak = y; if (peak - y >= SHOW_AFTER) { apply(false); valley = y; } } };
      const fi = () => { focusWithin = true; sync(); apply(false); };
      const fo = () => { focusWithin = false; sync(); };
      vNav.addEventListener('focusin', fi); vNav.addEventListener('focusout', fo);
      const vInner = vNav.querySelector('.site-nav__inner');
      const pe = () => { hovering = true; }; const pl = () => { hovering = false; sync(); };
      if (vInner) { vInner.addEventListener('pointerenter', pe); vInner.addEventListener('pointerleave', pl); }
      const vMenu = document.getElementById('mobileMenu');
      let mo3 = null;
      if (vMenu) { menuOpen = !vMenu.hidden; mo3 = new MutationObserver(() => { menuOpen = !vMenu.hidden; sync(); if (menuOpen) apply(false); }); mo3.observe(vMenu, { attributes: true, attributeFilter: ['hidden'] }); }
      const navScroll = rAF(() => { vNav.classList.toggle('is-scrolled', scrollY > 24); onScroll(); });
      addEventListener('scroll', navScroll, { passive: true });
      navScroll();
      const deskMQ = matchMedia('(min-width: 901px)');
      const eMenuClose = $('#mobileClose');
      const closeOnDesktop = rAF(() => { if (deskMQ.matches && vMenu && !vMenu.hidden && eMenuClose) eMenuClose.click(); });
      if (deskMQ.addEventListener) deskMQ.addEventListener('change', closeOnDesktop);
      addEventListener('resize', closeOnDesktop);
      cleanups.push(() => { removeEventListener('scroll', navScroll); removeEventListener('resize', closeOnDesktop); vNav.removeEventListener('focusin', fi); vNav.removeEventListener('focusout', fo); if (mo3) mo3.disconnect(); });
    }

    // kinetic blocks + accent word split
    const kinetic = $('#hero [data-kinetic]') || $('[data-kinetic]');
    let kio = null;
    if (kinetic && 'IntersectionObserver' in window) {
      kio = new IntersectionObserver((es) => { es.forEach((e) => { if (!e.isIntersecting) return; e.target.classList.add('is-inview'); kio.disconnect(); }); }, { threshold: 0.4 });
      kio.observe(kinetic);
      const acc = kinetic.querySelector('[data-kinetic-accent]');
      if (acc && !acc.dataset.kBound) {
        acc.dataset.kBound = '1';
        const words = acc.textContent.trim().split(/\s+/);
        acc.setAttribute('aria-label', acc.textContent.trim());
        acc.textContent = '';
        words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'k-w'; s.textContent = w; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--k-d', (1.15 + i * 0.12).toFixed(2) + 's'); acc.appendChild(s); if (i < words.length - 1) acc.appendChild(document.createTextNode(' ')); });
      }
    }
    const failsafe = () => { if (document.documentElement.classList.contains('reveal-failsafe')) $$('[data-kinetic]:not(.is-inview)').forEach((el) => el.classList.add('is-inview')); };
    document.addEventListener('readystatechange', failsafe);
    cleanups.push(() => { if (kio) kio.disconnect(); document.removeEventListener('readystatechange', failsafe); if (io) io.disconnect(); });
    return () => { cleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } }); };
  }, []);
}
