/* ═══════════════════════════════════════════════════════════════
   BLUEPRINT VIEWER — zoom, pan, reset. Touch pinch supported.
   The drawing is never altered: transform only, on the container.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$;

  var vp = $('#bpvViewport'), cv = $('#bpvCanvas'), val = $('#bpvVal'), note = $('#bpvNote');
  if (!vp || !cv) return;
  if (note) note.textContent = C.BLUEPRINT.note;

  var z = 1, tx = 0, ty = 0, MAX = 3.2, MIN = 1;

  function clampPan() {
    var r = vp.getBoundingClientRect();
    var limX = Math.max(0, (r.width * (z - 1)) / 2);
    var limY = Math.max(0, (r.height * (z - 1)) / 2);
    tx = A.clamp(tx, -limX, limX);
    ty = A.clamp(ty, -limY, limY);
  }
  function apply() {
    clampPan();
    cv.style.setProperty('--z', z);
    cv.style.setProperty('--tx', tx + 'px');
    cv.style.setProperty('--ty', ty + 'px');
    val.textContent = z.toFixed(1) + '×';
  }
  function reset() { z = 1; tx = 0; ty = 0; apply(); }
  function zoomTo(nz, cx, cy) {
    var r = vp.getBoundingClientRect();
    var px = (cx === undefined ? r.width / 2 : cx - r.left) - r.width / 2;
    var py = (cy === undefined ? r.height / 2 : cy - r.top) - r.height / 2;
    nz = A.clamp(nz, MIN, MAX);
    tx = px - (px - tx) * (nz / z);
    ty = py - (py - ty) * (nz / z);
    z = nz;
    apply();
  }

  /* buttons */
  var bIn = $('#bpvIn'), bOut = $('#bpvOut'), bReset = $('#bpvReset');
  if (bIn) bIn.addEventListener('click', function () { zoomTo(z + 0.4); });
  if (bOut) bOut.addEventListener('click', function () { zoomTo(z - 0.4); });
  if (bReset) bReset.addEventListener('click', reset);

  /* drag to pan (mouse / pen), two-finger pinch (touch) */
  var dragging = false, lastX = 0, lastY = 0;
  var pinch = null;

  vp.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') {
      if (!pinch) { pinch = { id: e.pointerId, x: e.clientX, y: e.clientY, d: 0, start: null }; }
      else if (pinch.start === null && e.pointerId !== pinch.id) {
        pinch.start = Math.hypot(e.clientX - pinch.x, e.clientY - pinch.y) || 1;
        pinch.z0 = z;
      }
      return;
    }
    if (z <= 1) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener('pointermove', function (e) {
    /* crosshair readout */
    if (!A.RM) {
      var r = vp.getBoundingClientRect();
      vp.style.setProperty('--cx', (((e.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
      vp.style.setProperty('--cy', (((e.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
    }
    if (pinch && pinch.start !== null) { e.preventDefault(); return; }
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });

  vp.addEventListener('pointermove', function (e) {
    if (!pinch || pinch.start === null) return;
    var d = Math.hypot(e.clientX - pinch.x, e.clientY - pinch.y);
    z = A.clamp(pinch.z0 * (d / pinch.start), MIN, MAX);
    apply();
  });

  function endPointer() {
    dragging = false;
    pinch = null;
  }
  vp.addEventListener('pointerup', endPointer);
  vp.addEventListener('pointercancel', endPointer);
  vp.addEventListener('pointerleave', endPointer);

  /* keyboard */
  vp.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 40 : 16;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(z + 0.4); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomTo(z - 0.4); }
    if (e.key === '0') { e.preventDefault(); reset(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); tx += step; apply(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); tx -= step; apply(); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); ty += step; apply(); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); ty -= step; apply(); }
  });

  /* double-click / double-tap to toggle zoom */
  vp.addEventListener('dblclick', function (e) {
    if (z > 1.2) reset(); else zoomTo(2.4, e.clientX, e.clientY);
  });

  apply();
})();
