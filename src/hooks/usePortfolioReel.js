import { useEffect } from 'react';
/* Ported 1:1 from legacy js/portfolio-reel.js */
export default function usePortfolioReel() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const cleanups = [];
    const openTargets = $$('[data-pf-open]');
    const liveTargets = $$('[data-pf-live]');
    let openIO = null, liveIO = null;
    if ('IntersectionObserver' in window) {
      openIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-open'); openIO.unobserve(e.target); } }), { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });
      openTargets.forEach((el) => openIO.observe(el));
      liveIO = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)), { threshold: 0.05 });
      liveTargets.forEach((el) => liveIO.observe(el));
    } else { openTargets.forEach((el) => el.classList.add('is-open')); liveTargets.forEach((el) => el.classList.add('is-live')); }
    const overture = $('.pf-overture');
    if (overture) requestAnimationFrame(() => overture.classList.add('is-open'));
    const YT_ID = 'R1O0VanJfTo';
    const players = $$('[data-pf-player]');
    const warmYouTube = () => { if (document.getElementById('pf-yt-pre')) return; ['https://www.youtube-nocookie.com', 'https://www.youtube.com'].forEach((o) => { const l = document.createElement('link'); l.id = 'pf-yt-pre'; l.rel = 'preconnect'; l.href = o; l.crossOrigin = 'anonymous'; document.head.appendChild(l); }); };
    const mountPlayer = (host, autoplay) => { const id = host.getAttribute('data-yt') || YT_ID; const frame = document.createElement('iframe'); frame.className = 'pf-player__frame'; frame.title = host.getAttribute('data-yt-title') || 'Portfolio reel — Abhijeet Varghese'; frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&playsinline=1&hl=en&autoplay=' + (autoplay ? 1 : 0); frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'); frame.setAttribute('allowfullscreen', 'true'); frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'); frame.loading = 'lazy'; host.innerHTML = ''; host.appendChild(frame); host.classList.add('is-playing'); if (autoplay) { try { frame.focus(); } catch { /* noop */ } } };
    players.forEach((host) => { const poster = $('.pf-player__poster', host); if (!poster) return; const click = () => { warmYouTube(); mountPlayer(host, true); }; poster.addEventListener('click', click); cleanups.push(() => poster.removeEventListener('click', click)); });
    const film = $('.pf-film');
    let warmIO = null;
    if (film && 'IntersectionObserver' in window) { warmIO = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { warmYouTube(); warmIO.disconnect(); } }, { rootMargin: '600px 0px' }); warmIO.observe(film); }
    const filmFrame = $('.pf-film__frame');
    const seam = $('.pf-seam');
    let ticking = false;
    const measure = () => { ticking = false; const vh = window.innerHeight; if (filmFrame && !reduced) { const fr = filmFrame.getBoundingClientRect(); const gate = vh * 0.45; const exit = clamp((gate - fr.bottom) / gate, 0, 1); filmFrame.style.setProperty('--exit', exit.toFixed(3)); } if (seam && !reduced) { const sr = seam.getBoundingClientRect(); const p = clamp((vh - sr.top) / (vh + sr.height), 0, 1); const o = clamp(p / 0.22, 0, 1) * clamp((1 - p) / 0.28, 0, 1); seam.style.setProperty('--p', p.toFixed(4)); seam.style.setProperty('--o', o.toFixed(3)); seam.style.setProperty('--o2', clamp((p - 0.42) / 0.25, 0, 1).toFixed(3)); } };
    const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(measure); };
    if (filmFrame || seam) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); measure(); cleanups.push(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); }); }
    if (fine && !reduced) {
      const cursor = $('.pf-cursor');
      const cursorLabel = cursor && $('span', cursor);
      if (cursor && cursorLabel) {
        let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, moving = false;
        const loop = () => { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(loop); else { raf = null; moving = false; } };
        const pm = (e) => { if (e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY; if (!moving) { moving = true; raf = requestAnimationFrame(loop); } };
        const pover = (e) => { const target = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null; if (!target) return; cursorLabel.textContent = target.getAttribute('data-cursor') || ''; cursor.classList.add('is-on', 'is-big'); document.body.classList.add('pf-cursor-active'); };
        const pout = (e) => { const from = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null; if (!from) return; const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-cursor]') : null; if (to === from) return; cursor.classList.remove('is-on', 'is-big'); document.body.classList.remove('pf-cursor-active'); };
        const blur = () => { cursor.classList.remove('is-on', 'is-big'); document.body.classList.remove('pf-cursor-active'); };
        document.addEventListener('pointermove', pm, { passive: true }); document.addEventListener('pointerover', pover); document.addEventListener('pointerout', pout); addEventListener('blur', blur);
        cleanups.push(() => { document.removeEventListener('pointermove', pm); document.removeEventListener('pointerover', pover); document.removeEventListener('pointerout', pout); removeEventListener('blur', blur); if (raf) cancelAnimationFrame(raf); });
      }
    }
    const rail = document.getElementById('pfProofRail');
    if (rail) {
      const panels = Array.prototype.slice.call(rail.querySelectorAll('.r-proof__panel'));
      const cur = document.getElementById('pfProofCur'); const prev = document.getElementById('pfProofPrev'); const next = document.getElementById('pfProofNext'); const progress = document.getElementById('pfProofProgress');
      if (panels.length) {
        let active = 0;
        const sync = (i) => { active = i; panels.forEach((p, k) => p.classList.toggle('is-active', k === i)); if (cur) cur.textContent = String(i + 1).padStart(2, '0'); if (prev) prev.disabled = i === 0; if (next) next.disabled = i === panels.length - 1; };
        const update = () => { const mid = rail.scrollLeft + rail.clientWidth / 2; let best = 0; panels.forEach((p, i) => { if (mid >= p.offsetLeft) best = i; }); sync(best); if (progress) { const max = rail.scrollWidth - rail.clientWidth; const rl = rail.scrollLeft; progress.style.width = (max > 0 ? (rl / max) * 100 : 0).toFixed(2) + '%'; } };
        const go = (i) => { const el = panels[i]; if (!el) return; rail.scrollTo({ left: el.offsetLeft, behavior: reduced ? 'auto' : 'smooth' }); };
        const scroll = () => update(); const resize = () => update();
        const pclick = () => go(Math.max(0, active - 1)); const nclick = () => go(Math.min(panels.length - 1, active + 1));
        const key = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.min(panels.length - 1, active + 1)); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(0, active - 1)); } };
        rail.addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', resize);
        if (prev) prev.addEventListener('click', pclick); if (next) next.addEventListener('click', nclick);
        rail.addEventListener('keydown', key);
        update();
        cleanups.push(() => { rail.removeEventListener('scroll', scroll); removeEventListener('resize', resize); if (prev) prev.removeEventListener('click', pclick); if (next) next.removeEventListener('click', nclick); rail.removeEventListener('keydown', key); });
      }
    }
    return () => { cleanups.forEach((fn) => fn()); if (openIO) openIO.disconnect(); if (liveIO) liveIO.disconnect(); if (warmIO) warmIO.disconnect(); };
  }, []);
}
