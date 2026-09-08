/* ═══════════════════════════════════════════════════════════════
   WALKTHROUGH — the 3D architectural visualization, kept
   completely separate from the miniature photography.
   Video first if present (poster → click → load); otherwise the
   frames play as one cinematic sequence.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$, $$ = A.$$;

  /* ── the frame sequence ──────────────────────────────────────── */
  var root = $('#film'); if (!root) return;
  var stage = $('#filmStage'), rail = $('#filmRail'), countEl = $('#filmCount'), capEl = $('#filmCap');
  var prev = $('#filmPrev'), next = $('#filmNext');
  /* frame 02 is byte-identical to frame 01 in the supplied set
     (md5 52b3546d…). It is held out rather than shown twice.      */
  var dupes = C.DUPLICATE_FRAMES || [];
  var frames = C.FRAMES.filter(function (f) { return dupes.indexOf(f.n) < 0; });
  var n = frames.length, i = -1, slides = [];

  /* Captions are keyed to the real frame number, never to the array
     position — held-out duplicates must not renumber the sequence. */
  function stageName(f) {
    var num = parseInt(f.n, 10);
    var st = C.WALKTHROUGH_STAGES || [];
    for (var s = 0; s < st.length; s++) {
      if (num >= st[s].from && num <= st[s].to) return st[s].name;
    }
    return 'FRAME ' + f.n;
  }

  frames.forEach(function (f, k) {
    var d = document.createElement('div');
    d.className = 'fslide';
    d.setAttribute('role', 'group');
    d.setAttribute('aria-label', 'Walkthrough frame ' + f.n);
    d.innerHTML = A.picture(f.file, '(max-width:900px) 96vw, 92vw', f.alt, k === 0);
    stage.appendChild(d);
    slides.push(d);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ftick';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Frame ' + f.n);
    b.addEventListener('click', function () { show(k); });
    rail.appendChild(b);
  });
  var ticks = $$('.ftick', rail);

  function load(k) {
    [k, k + 1, k - 1].forEach(function (j) { if (j >= 0 && j < n) A.materialise(slides[j]); });
  }
  function show(k) {
    k = A.clamp(k, 0, n - 1);
    if (k === i) return;
    i = k;
    load(k);
    slides.forEach(function (s, j) {
      s.classList.toggle('is-on', j === k);
      s.setAttribute('aria-hidden', j === k ? 'false' : 'true');
    });
    ticks.forEach(function (t, j) {
      t.classList.toggle('is-on', j === k);
      t.setAttribute('aria-selected', j === k ? 'true' : 'false');
    });
    countEl.textContent = A.pad(k + 1) + ' / ' + A.pad(n);
    capEl.textContent = '3D ARCHITECTURAL WALKTHROUGH — ' + stageName(frames[k]);
  }
  if (prev) prev.addEventListener('click', function () { show(i - 1); });
  if (next) next.addEventListener('click', function () { show(i + 1); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    if (e.key === 'Home')       { e.preventDefault(); show(0); }
    if (e.key === 'End')        { e.preventDefault(); show(n - 1); }
  });
  var sx = null;
  stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) show(i + (dx < 0 ? 1 : -1));
  });
  show(0);

  /* ── video, armed in config; mounts only when the file resolves ──
     The player is enabled by WALKTHROUGH_VIDEO (config.js). A quick
     existence check on WALKTHROUGH_SRC decides whether to mount the
     player or keep the placeholder frame sequence — so dropping the
     MP4 into assets/video/ (or repointing WALKTHROUGH_SRC) is all
     that's needed to go live; nothing else has to change. If the
     file is absent — or `fetch` is unavailable — the frames remain
     and no broken control is ever shown. */
  if (C.WALKTHROUGH_VIDEO && C.WALKTHROUGH_SRC) {
    var frame = $('#filmFrame');

    var mount = function () {
      var video = document.createElement('video');
      video.className = 'film__video';
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('preload', 'none');          /* nothing loads until asked */
      video.setAttribute('poster', 'assets/images/walkthrough/frame01-1280.jpg');
      var meta = C.WALKTHROUGH_META || {};
      if (meta.w) { video.width = meta.w; video.height = meta.h; }
      video.setAttribute('aria-label', '3D architectural walkthrough of the BPCL Palakkad Top Installation');
      video.controls = true;
      var btn = document.createElement('button');
      btn.className = 'film__play';
      btn.type = 'button';
      btn.innerHTML = '<span class="film__playico" aria-hidden="true"></span><span class="mono">PLAY WALKTHROUGH FILM</span>';
      btn.addEventListener('click', function () {
        /* if the asset can't actually be served, drop the player and
           restore the frame sequence rather than leave a dead control */
        video.addEventListener('error', function () {
          frame.classList.remove('has-video');
          if (btn.parentNode) btn.parentNode.removeChild(btn);
          if (video.parentNode) video.parentNode.removeChild(video);
        });
        video.preload = 'auto';
        video.src = C.WALKTHROUGH_SRC;
        video.play().catch(function () {});
        btn.remove();
        frame.classList.add('has-video');
      });
      frame.appendChild(video);
      frame.appendChild(btn);
      /* pause when scrolled away */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) {
          if (!e[0].isIntersecting && !video.paused) video.pause();
        }, { threshold: 0.05 }).observe(frame);
      }
    };

    if (window.fetch) {
      fetch(C.WALKTHROUGH_SRC, { method: 'HEAD' })
        .then(function (res) { if (res.ok) mount(); })
        .catch(function () { /* file not reachable — keep the frames */ });
    }
  }

  /* ── close-ups ──────────────────────────────────────────────── */
  var cu = $('#closeups');
  if (cu) {
    (C.CLOSEUPS || []).forEach(function (id, k) {
      var idx = -1;
      frames.forEach(function (f, j) { if (f.n === id) idx = j; });
      var f = frames[idx];
      if (!f) return;
      var fig = document.createElement('figure');
      fig.innerHTML = A.picture(f.file, k === 0 ? '(max-width:820px) 96vw, 58vw' : '(max-width:820px) 96vw, 36vw', f.alt, false) +
        '<figcaption>' + stageName(f) + '</figcaption>';
      cu.appendChild(fig);
    });
    A.materialise(cu);   /* outside the viewer: hand them to native lazy-loading */
  }
})();
