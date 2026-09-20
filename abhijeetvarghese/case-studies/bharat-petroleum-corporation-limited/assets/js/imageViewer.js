/* ═══════════════════════════════════════════════════════════════
   IMAGE VIEWER — the seven miniature photographs
   Large image · subtle nav · counter · keyboard · swipe · lazy
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$, $$ = A.$$;

  var root = $('#viewer'); if (!root) return;
  var stage = $('#viewerStage'), tag = $('#viewerTag'), count = $('#viewerCount');
  var dots = $('#viewerDots'), prev = $('#viewerPrev'), next = $('#viewerNext');
  var items = C.MINIATURE, n = items.length, i = -1;
  var slides = [];

  /* slides: only the first is materialised; the rest load on demand */
  items.forEach(function (m, k) {
    var d = document.createElement('div');
    d.className = 'vslide';
    d.setAttribute('role', 'group');
    d.setAttribute('aria-label', m.tag + ' of the physical miniature');
    d.innerHTML = A.picture(m.file, '(max-width:900px) 96vw, 92vw', m.alt, k === 1);
    stage.appendChild(d);
    slides.push(d);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vdot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', m.tag);
    b.addEventListener('click', function () { show(k); });
    dots.appendChild(b);
  });

  var dotEls = $$('.vdot', dots);

  function load(k) {
    [k, k + 1, k - 1, (k + 2) % n].forEach(function (j) {
      if (j >= 0 && j < n) A.materialise(slides[j]);
    });
  }

  function show(k, announce) {
    k = A.clamp(k, 0, n - 1);
    if (k === i) return;
    i = k;
    load(k);
    slides.forEach(function (s, j) {
      s.classList.toggle('is-on', j === k);
      s.setAttribute('aria-hidden', j === k ? 'false' : 'true');
    });
    dotEls.forEach(function (d, j) {
      d.classList.toggle('is-on', j === k);
      d.setAttribute('aria-selected', j === k ? 'true' : 'false');
    });
    tag.textContent = items[k].tag;
    count.textContent = A.pad(k + 1) + ' / ' + A.pad(n);
    if (announce !== false && A.onViewerChange) A.onViewerChange(items[k].file, k);
  }

  if (prev) prev.addEventListener('click', function () { show(i - 1); });
  if (next) next.addEventListener('click', function () { show(i + 1); });

  /* keyboard — arrow keys while the viewer has focus within */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    if (e.key === 'Home')       { e.preventDefault(); show(0); }
    if (e.key === 'End')        { e.preventDefault(); show(n - 1); }
  });

  /* touch swipe */
  var sx = 0, sy = 0, tracking = false;
  stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; tracking = true; });
  stage.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', function () { tracking = false; });

  /* start on the strongest overall view */
  show(1, false);
  A.viewer = { show: show, index: function () { return i; }, slides: slides, items: items,
               current: function () { return items[i]; } };

  /* ── INSPECTION OVERLAY ───────────────────────────────────────────
     Full-viewport examination of the current photograph. Zoom to
     2× and drag to pan; one close control, Escape, or a click on
     the backdrop returns to the page. Nothing else is added to the
     image itself.                                                   */
  (function inspect() {
    var trigger = $('#viewerInspect');
    if (!trigger) return;

    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Full-size inspection of the physical miniature');
    lb.hidden = true;
    lb.innerHTML =
      '<div class="lb__stage" id="lbStage"><div class="lb__pan" id="lbPan"></div></div>' +
      '<div class="lb__ui">' +
        '<span class="mono lb__tag" id="lbTag"></span>' +
        '<button class="btn" id="lbZoom" type="button" aria-pressed="false">2×</button>' +
        '<button class="btn" id="lbClose" type="button" aria-label="Close inspection">CLOSE</button>' +
      '</div>';
    document.body.appendChild(lb);

    var pan = $('#lbPan', lb), tagEl = $('#lbTag', lb), zBtn = $('#lbZoom', lb), cBtn = $('#lbClose', lb);
    var z = 1, tx = 0, ty = 0, drag = false, lx = 0, ly = 0, lastFocus = null;
    var downX = 0, downY = 0, moved = false;

    function apply() {
      pan.style.setProperty('--z', z);
      pan.style.setProperty('--tx', tx + 'px');
      pan.style.setProperty('--ty', ty + 'px');
      zBtn.textContent = z > 1 ? '1×' : '2×';
      zBtn.setAttribute('aria-pressed', z > 1 ? 'true' : 'false');
      lb.classList.toggle('is-zoomed', z > 1);
    }
    function clamp() {
      var r = lb.getBoundingClientRect();
      var lx2 = Math.max(0, (r.width * (z - 1)) / 2), ly2 = Math.max(0, (r.height * (z - 1)) / 2);
      tx = A.clamp(tx, -lx2, lx2); ty = A.clamp(ty, -ly2, ly2);
    }

    function open() {
      var item = A.viewer.current();
      pan.innerHTML = A.picture(item.file, '100vw', item.alt, true);
      A.materialise(pan);
      tagEl.textContent = item.tag + ' · PHYSICAL MINIATURE';
      z = 1; tx = 0; ty = 0; apply();
      lb.hidden = false;
      document.body.classList.add('is-locked');
      lastFocus = document.activeElement;
      cBtn.focus();
    }
    function close() {
      lb.hidden = true;
      pan.innerHTML = '';
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    trigger.addEventListener('click', open);
    cBtn.addEventListener('click', close);
    zBtn.addEventListener('click', function () { z = z > 1 ? 1 : 2; if (z === 1) { tx = 0; ty = 0; } apply(); });
    /* A drag ends with a click on the stage. Without this guard, panning a
       zoomed image dismissed the overlay instead of moving it. */
    lb.addEventListener('click', function (e) {
      if (moved) { moved = false; return; }
      if (e.target === lb || e.target.classList.contains('lb__stage')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); A.viewer.show(i - 1); var it = A.viewer.current();
                                    pan.innerHTML = A.picture(it.file, '100vw', it.alt, true); A.materialise(pan);
                                    tagEl.textContent = it.tag + ' · PHYSICAL MINIATURE'; }
      if (e.key === 'ArrowRight') { e.preventDefault(); A.viewer.show(i + 1); var it2 = A.viewer.current();
                                    pan.innerHTML = A.picture(it2.file, '100vw', it2.alt, true); A.materialise(pan);
                                    tagEl.textContent = it2.tag + ' · PHYSICAL MINIATURE'; }
    });

    var stage = $('#lbStage', lb);
    stage.addEventListener('pointerdown', function (e) {
      downX = e.clientX; downY = e.clientY; moved = false;
      if (z <= 1) return;
      drag = true; lx = e.clientX; ly = e.clientY;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (e) {
      if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) moved = true;
      if (!drag) return;
      tx += e.clientX - lx; ty += e.clientY - ly;
      lx = e.clientX; ly = e.clientY; clamp(); apply();
    });
    stage.addEventListener('pointerup', function () { drag = false; });
    stage.addEventListener('pointercancel', function () { drag = false; });
  })();
})();
