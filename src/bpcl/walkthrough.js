/* BPCL micro-app engine module: walkthrough.js — ported (IIFE unwrapped where
   present, asset paths rebased to /assets/bpcl/). Called in legacy order. */
export default function initBpclWalkthrough() {

  'use strict';
  var A = window.BPCL_APP, C = A.C;
  var $ = A.$, $$ = A.$$;

  /* ── the frame sequence ──────────────────────────────────────── */
  var root = $('#film'); if (!root) return;
  var stage = $('#filmStage'), rail = $('#filmRail'), countEl = $('#filmCount'), capEl = $('#filmCap');
  var prev = $('#filmPrev'), next = $('#filmNext');
  /* Frames listed in C.DUPLICATE_FRAMES are held out of the sequence. */
  var dupes = C.DUPLICATE_FRAMES || [];
  var frames = C.FRAMES.filter(function (f) { return dupes.indexOf(f.n) < 0; });
  var n = frames.length, i = -1, slides = [];
  /* Set by the film block below: called with the new index on every
     real frame change (ticks, arrows, keys, swipe — all via show()). */
  var onFrameChange = null;

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
    if (onFrameChange) onFrameChange(k);
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

  /* ── video — frame 01 only, armed in config ────────────────────
     The film mounts only when the file resolves (HEAD check). It
     plays ONLY on frame 01: there the pf-player facade (portfolio
     player UI) covers the stage; every other frame shows its own
     picture. Leaving frame 01 — ticks, arrows, keyboard and swipe
     all funnel through show() — pauses and rewinds the film
     automatically; returning to 01 restores the poster facade.
     Styles: assets/css/main.css § pf-player.                       */
  if (C.WALKTHROUGH_VIDEO && C.WALKTHROUGH_SRC) {
    var frame = $('#filmFrame');
    var POSTER = '/assets/bpcl/images/walkthrough/frame01-1280.jpg';

    var mount = function () {
      var player = document.createElement('div');
      player.className = 'pf-player';
      player.setAttribute('data-pf-player', '');
      frame.appendChild(player);

      var video = null, ioBound = false;

      var stopFilm = function () {
        if (!video) return;
        if (!video.paused) video.pause();
        try { video.currentTime = 0; } catch (err) {}
      };

      var ensureVideo = function () {
        if (video) return video;
        video = document.createElement('video');
        video.className = 'film__video';
        video.controls = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('poster', POSTER);
        video.setAttribute('preload', 'auto');
        var meta = C.WALKTHROUGH_META || {};
        if (meta.w) { video.width = meta.w; video.height = meta.h; }
        video.setAttribute('aria-label', '3D architectural walkthrough of the BPCL Palakkad Top Installation');
        /* pause when scrolled away */
        if (!ioBound && 'IntersectionObserver' in window) {
          ioBound = true;
          new IntersectionObserver(function (e) {
            if (!e[0].isIntersecting && video && !video.paused) video.pause();
          }, { threshold: 0.05 }).observe(frame);
        }
        return video;
      };

      var toVideo = function () {
        player.innerHTML = '';
        player.appendChild(ensureVideo());
        player.classList.add('is-playing');
        /* if the asset can't actually be served, drop the film and
           stay on the pictures rather than leave a dead control */
        video.addEventListener('error', function () {
          frame.classList.remove('is-film');
          if (player.parentNode) player.parentNode.removeChild(player);
          onFrameChange = null;
        }, { once: true });
        video.src = C.WALKTHROUGH_SRC;
        video.play().catch(function () {});
      };

      var toFacade = function () {
        stopFilm();
        player.innerHTML = '';
        player.classList.remove('is-playing');
        player.appendChild(buildFacade());
      };

      function buildFacade() {
        var poster = document.createElement('button');
        poster.className = 'pf-player__poster';
        poster.type = 'button';
        poster.setAttribute('aria-label', 'Play the walkthrough film: BPCL Palakkad Top Installation');

        var img = document.createElement('img');
        img.src = POSTER;
        img.alt = '';
        img.width = 1280; img.height = 720;
        img.decoding = 'async'; img.loading = 'lazy';

        var scrim = document.createElement('span');
        scrim.className = 'pf-player__scrim';
        scrim.setAttribute('aria-hidden', '');

        var play = document.createElement('span');
        play.className = 'pf-player__play';
        play.setAttribute('aria-hidden', '');
        play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg><b>Play film</b>';

        poster.appendChild(img);
        poster.appendChild(scrim);
        poster.appendChild(play);
        poster.addEventListener('click', toVideo);
        return poster;
      }

      /* frame 01 = film · every other frame = its picture */
      onFrameChange = function (k) {
        if (k === 0) {
          frame.classList.add('is-film');
          toFacade();                    /* always a fresh poster — leaving rewinds */
        } else {
          frame.classList.remove('is-film');
          stopFilm();                                    /* auto-stop + rewind */
        }
      };

      toFacade();                                        /* initial state: poster + play chip */

      /* swipe navigates from the film too (the stage's own swipe
         handler is hidden while .is-film). Drags starting on the
         video's bottom control strip are left to the player. */
      var sx = null;
      player.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('video')) {
          var r = player.getBoundingClientRect();
          sx = (e.clientY - r.top > r.height - 48) ? null : e.clientX;
        } else {
          sx = e.clientX;
        }
      });
      player.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 45) {
          /* no click after the swipe — Chrome would toggle-play the film */
          var swallow = function (ev) {
            ev.stopPropagation(); ev.preventDefault();
            player.removeEventListener('click', swallow, true);
          };
          player.addEventListener('click', swallow, true);
          e.preventDefault();
          show(i + (dx < 0 ? 1 : -1));
        }
      });

      onFrameChange(i);                                  /* i is 0 unless the visitor navigated during the HEAD check */
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

}
