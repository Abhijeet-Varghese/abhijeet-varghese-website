/* ═══════════════════════════════════════════════════════════════
   NAVIGATION — section list, active state, progress, mobile bar
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$, $$ = A.$$;

  var secs = C.SECTIONS.map(function (s) {
    return { n: s.n, name: s.name, el: document.getElementById(s.id) };
  }).filter(function (s) { return s.el; });
  if (!secs.length) return;

  /* desktop nav — the five movements, not all eight sections */
  var list = $('#navList'), links = [], navIdx = [];
  var NAVDEF = C.NAV || C.SECTIONS;
  if (list) {
    NAVDEF.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (!el) return;
      navIdx.push(secs.findIndex(function (x) { return x.el === el; }));
      var li = document.createElement('li');
      li.innerHTML = '<a href="#' + s.id + '"><i>' + s.n + '</i>' + s.name + '</a>';
      list.appendChild(li);
      links.push(li.querySelector('a'));
    });
  }

  /* mobile bar */
  var bar = document.createElement('div');
  bar.className = 'mobbar';
  bar.innerHTML =
    '<span class="mono mobbar__now" id="mobNow">' + secs[0].name + '</span>' +
    '<span class="mobbar__jump">' +
      '<button class="btn" id="mobPrev" type="button" aria-label="Previous section">↑</button>' +
      '<button class="btn" id="mobNext" type="button" aria-label="Next section">↓</button>' +
    '</span>';
  document.body.appendChild(bar);

  var sig = $('#navSignal'), now = $('#mobNow'), cur = -1, navCur = -1;
  function set(i) {
    if (i === cur || i < 0) return;
    cur = i;
    /* highlight the nav destination that owns this section */
    var k = -1;
    for (var j = 0; j < navIdx.length; j++) if (navIdx[j] >= 0 && navIdx[j] <= i) k = j;
    if (k !== navCur) {
      navCur = k;
      links.forEach(function (a, j2) { a.classList.toggle('is-active', j2 === k); });
    }
    if (sig) sig.textContent = secs[i].n;
    if (now) now.textContent = secs[i].name;
  }
  set(0);

  /* jump */
  function jump(dir) {
    var i = A.clamp(cur + dir, 0, secs.length - 1);
    secs[i].el.scrollIntoView({ behavior: A.RM ? 'auto' : 'smooth', block: 'start' });
    set(i);
  }
  var mp = $('#mobPrev'), mn = $('#mobNext');
  if (mp) mp.addEventListener('click', function () { jump(-1); });
  if (mn) mn.addEventListener('click', function () { jump(1); });

  /* ── per-frame update: active section, progress, topbar ───────── */
  var bar1 = $('#progressBar'), topbar = $('#topbar');
  var doc = document.documentElement, vh = window.innerHeight, lastTop = -1;

  A.onScroll(function () {
    var y = window.pageYOffset;

    /* progress */
    if (bar1) {
      var max = doc.scrollHeight - vh;
      bar1.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }

    /* topbar solid only after the hero */
    if (topbar) {
      var solid = y > window.innerHeight * 0.6;
      if (solid !== lastTop) { lastTop = solid; topbar.classList.toggle('is-solid', solid); }
    }

    /* active section = the one crossing the upper third */
    var best = -1, bestTop = -Infinity;
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].el.getBoundingClientRect();
      if (r.top <= vh * 0.34 && r.bottom > vh * 0.34) { best = i; break; }
      if (r.top <= vh * 0.34 && r.top > bestTop) { bestTop = r.top; best = i; }
    }
    if (best >= 0) set(best);
  });

  window.addEventListener('resize', function () { vh = window.innerHeight; }, { passive: true });

  /* in-page anchors */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: A.RM ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
})();
