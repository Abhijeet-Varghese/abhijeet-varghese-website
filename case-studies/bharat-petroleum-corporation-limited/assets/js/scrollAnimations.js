/* ═══════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS — one rAF loop, transform/opacity only.
   Hero: slow push-in.  Finale: slow pullback + fade to black.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var A = window.BPCL_APP;
  var $ = A.$;

  var hero = $('#hero'), heroImg = $('#heroImg');
  var finale = $('#final'), finalImg = $('.finale__media img');
  var vh = window.innerHeight, ticking = false;

  function frame() {
    ticking = false;
    var y = window.pageYOffset;

    if (hero && !A.RM) {
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > -100 && hr.top < vh + 100) {
        hero.style.setProperty('--hp', A.clamp(-hr.top / hr.height, 0, 1).toFixed(4));
      }
    }
    if (finale) {
      var fr = finale.getBoundingClientRect();
      if (fr.top < vh && fr.bottom > 0) {
        var p = A.clamp((vh * 0.7 - fr.top) / (fr.height * 0.8), 0, 1);
        finale.style.setProperty('--fp', p.toFixed(4));
        if (p > 0.12) finale.classList.add('is-in');
      }
    }
    for (var i = 0; i < A.scrollFns.length; i++) A.scrollFns[i]();
  }

  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; request(); }, { passive: true });
  request();
  setTimeout(request, 400);
})();
