/* ═══════════════════════════════════════════════════════════════
   DAY / NIGHT SLIDER — the miniature's integrated lighting
   Pointer drag, touch drag, keyboard, ARIA slider
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP;
  var $ = A.$;

  var frame = $('#dnFrame'), handle = $('#dnHandle');
  if (!frame) return;
  var pos = 50, down = false;

  function apply(p) {
    pos = A.clamp(p, 0, 100);
    frame.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', Math.round(pos));
    handle.setAttribute('aria-valuetext', Math.round(pos) + ' percent day');
  }

  function fromEvent(e) {
    var r = frame.getBoundingClientRect();
    apply(((e.clientX - r.left) / r.width) * 100);
  }

  frame.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    e.preventDefault();
    down = true;
    fromEvent(e);
    try { frame.setPointerCapture(e.pointerId); } catch (err) {}
    var mv = function (ev) { if (down) { fromEvent(ev); ev.preventDefault(); } };
    var up = function () { down = false; window.removeEventListener('pointermove', mv); };
    window.addEventListener('pointermove', mv, { passive: false });
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', up, { once: true });
  });

  handle.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 10 : 3;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); apply(pos - step); }
    if (e.key === 'ArrowRight') { e.preventDefault(); apply(pos + step); }
    if (e.key === 'Home')       { e.preventDefault(); apply(8); }
    if (e.key === 'End')        { e.preventDefault(); apply(92); }
  });

  apply(50);
})();
