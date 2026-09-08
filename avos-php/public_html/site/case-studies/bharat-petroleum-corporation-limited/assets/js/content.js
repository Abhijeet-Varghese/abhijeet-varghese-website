/* ═══════════════════════════════════════════════════════════════
   CONTENT — renders every configured copy block as semantic HTML.
   No filenames, no coordinates: configuration is the only source.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$;

  /* §02 — SITE → MODEL → BLUEPRINT → 3D → EXPERIENCE */
  var bridge = $('#bridge');
  if (bridge) {
    (C.BRIDGE || []).forEach(function (b, i) {
      var s = document.createElement('span');
      s.className = 'bridge__step mono';
      s.innerHTML = (i ? '<i class="bridge__arrow" aria-hidden="true"></i>' : '') + b;
      bridge.appendChild(s);
    });
  }

  /* §02 — the challenge */
  var cc = $('#challengeCopy');
  if (cc) {
    (C.CHALLENGE || []).forEach(function (t, i) {
      var para = document.createElement('p');
      para.className = i === 0 ? 'lede' : 'body';
      para.textContent = t;
      cc.appendChild(para);
    });
  }

  /* §02 — the contribution line */
  var con = $('#contribution');
  if (con && C.CONTRIBUTION) con.textContent = C.CONTRIBUTION;

  /* §02 — strategic response */
  var sl = $('#strategyList');
  if (sl) {
    C.STRATEGY.forEach(function (s, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="n">' + A.pad(i + 1) + '</span><h3>' + s.name + '</h3><p>' + s.copy + '</p>';
      sl.appendChild(li);
    });
  }

  /* §03 — miniature specification */
  var meta = $('#modelMeta');
  if (meta) {
    (C.MODEL_META || []).forEach(function (m) {
      var dt = document.createElement('dt');
      dt.textContent = m.k;
      var dd = document.createElement('dd');
      dd.textContent = m.v;
      meta.appendChild(dt);
      meta.appendChild(dd);
    });
  }

  /* §06 — delivery flow */
  var flow = $('#flow');
  if (flow) {
    C.FLOW.forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = f;
      flow.appendChild(li);
    });
  }

  /* §06 — the four areas of responsibility */
  var areas = $('#areas');
  if (areas) {
    C.LEADERSHIP.forEach(function (a) {
      var art = document.createElement('article');
      art.innerHTML = '<span class="n">' + a.n + '</span><h3>' + a.name + '</h3><p>' + a.copy + '</p>';
      areas.appendChild(art);
    });
  }

  /* §07 — one site, four ways to understand it */
  var out = $('#outcomes');
  if (out) {
    C.OUTCOMES.forEach(function (o) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="n mono">' + o.n + '</span>' +
                     '<h3>' + o.name + '</h3>' +
                     '<p>' + o.copy + '</p>';
      out.appendChild(li);
    });
  }

  /* project information */
  var info = $('#footInfo');
  if (info) {
    C.PROJECT_INFO.forEach(function (i) {
      var dt = document.createElement('dt');
      dt.textContent = i.k;
      var dd = document.createElement('dd');
      dd.textContent = i.v;
      info.appendChild(dt);
      info.appendChild(dd);
    });
  }
})();
