/* ═══════════════════════════════════════════════════════════════
   CORE — shared utilities, reveal engine, scroll registry.
   Every other module hangs off window.BPCL_APP.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var APP = window.BPCL_APP = {
    RM: RM,
    C:  window.BPCL,
    A:  window.BPCL_ASSETS,

    $:  function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    norm:  function (v, a, b) { return (v - a) / (b - a); },
    pad:   function (n) { return (n < 10 ? '0' : '') + n; },

    /* scroll callbacks — one rAF loop drives everything */
    scrollFns: [],
    onScroll: function (fn) { this.scrollFns.push(fn); }
  };

  /* ── responsive image paths ───────────────────────────────────── */
  APP.path = function (file) {
    var group = /^frame/.test(file) ? 'walkthrough'
              : file === 'blueprint' ? 'blueprint'
              : 'miniature';
    var widths = /^frame/.test(file) ? [800, 1280, 1920] : [720, 1100, 1672];
    return {
      dir: 'assets/images/' + group + '/' + file,
      srcset: widths.map(function (w) {
        return 'assets/images/' + group + '/' + file + '-' + w + '.webp ' + w + 'w';
      }).join(', '),
      fallback: 'assets/images/' + group + '/' + file + '-1280.jpg',
      w: /^frame/.test(file) ? 1920 : 1672,
      h: /^frame/.test(file) ? 1080 : 941
    };
  };

  /* builds <picture> markup; `eager` materialises the source immediately */
  APP.picture = function (file, sizes, alt, eager) {
    var p = APP.path(file);
    var srcAttr = eager ? 'src' : 'data-src';
    var setAttr = eager ? 'srcset' : 'data-srcset';
    return '<picture>' +
      '<source type="image/webp" ' + setAttr + '="' + p.srcset + '" sizes="' + sizes + '">' +
      '<img ' + srcAttr + '="' + p.fallback + '" alt="' + alt + '" ' +
      'width="' + p.w + '" height="' + p.h + '" ' +
      'loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async" draggable="false">' +
      '</picture>';
  };

  /* materialise a lazily-built image only when it is needed */
  APP.materialise = function (scope) {
    APP.$$('img[data-src]', scope).forEach(function (img) {
      if (img.dataset.done) return;
      img.dataset.done = '1';
      var pic = img.closest('picture');
      if (pic) {
        var s = pic.querySelector('source[data-srcset]');
        if (s) { s.srcset = s.dataset.srcset; delete s.dataset.srcset; }
      }
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  };

  /* ── reveal ───────────────────────────────────────────────────── */
  (function reveals() {
    /* media containers are excluded: shifting them would move the
       imagery and cost CLS */
    var sel = '.label, .display, .close-line, .lede, .body, .cols, .strategy, .contribution,' +
              '.link, .dnwrap, .closeups, .flow, .areas,' +
              '.foot__nav, .foot__info';
    var els = APP.$$(sel).filter(function (el) {
      /* never hide anything already on screen at load */
      return el.getBoundingClientRect().top > window.innerHeight * 0.9;
    });
    if (RM || !('IntersectionObserver' in window)) return;
    els.forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ── hero + finale entrance ───────────────────────────────────── */
  function enter(selector) {
    var el = APP.$(selector);
    if (el) requestAnimationFrame(function () { el.classList.add('is-in'); });
  }
  if (document.readyState === 'complete') enter('.hero');
  else window.addEventListener('load', function () { enter('.hero'); });
  setTimeout(function () { enter('.hero'); }, 1200);
})();
