/* Indian Army — Immersive Training & Qualification Ecosystem
   Page behaviour: reveals, chapter navigation, progress, restrained parallax,
   and the digital → physical gate transition. No cursor effects, no particles,
   no constant motion. Respects prefers-reduced-motion. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  if (!body || !body.classList.contains("indian-army-case")) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  root.classList.add("ia-ok");
  setTimeout(function () { root.classList.add("ia-failsafe"); }, 2600);

  /* ---------- Reveals ---------- */
  var revealEls = $$(".ia-r, .ia-stages, .ia-cadence");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Chapter navigation ---------- */
  var nav = doc.getElementById("iaNav");
  var links = nav ? $$("a[href^='#']", nav) : [];
  var chapters = links.map(function (a) { return doc.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  var counter = nav ? nav.querySelector("[data-chapter-current]") : null;
  var total = nav ? nav.querySelector("[data-chapter-total]") : null;
  if (total) total.textContent = String(chapters.length).padStart(2, "0");
  var hero = doc.getElementById("overview");
  var active = -1;

  function setActive(i) {
    if (i === active) return;
    active = i;
    links.forEach(function (a, k) {
      var on = k === i;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
    });
    if (counter) counter.textContent = String(i + 1).padStart(2, "0");
    if (nav && nav.classList.contains("is-hscroll")) {
      var a = links[i];
      if (a && a.scrollIntoView) { try { a.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce.matches ? "auto" : "smooth" }); } catch (err) {} }
    }
  }

  links.forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var target = doc.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      ev.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top: top, behavior: reduce.matches ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", "#" + target.id);
    });
  });

  /* ---------- Parallax + gate + progress (single rAF loop, scroll-driven only) ---------- */
  var parallaxEls = $$(".ia-parallax");
  var gate = doc.querySelector(".ia-gate");
  var desktop = window.matchMedia("(min-width: 1000px)");
  var railNav = window.matchMedia("(min-width: 1600px)");
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight || 1;
    var y = window.pageYOffset;

    // Active chapter: the last chapter whose top has crossed 40% of the viewport
    var idx = 0;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top <= vh * 0.4) idx = i;
    }
    if (chapters.length) setActive(idx);

    // Chapter progress bar
    if (nav) {
      var docH = Math.max(1, root.scrollHeight - vh);
      nav.style.setProperty("--pp", clamp(y / docH, 0, 1).toFixed(4));
      if (hero) {
        var heroBottom = hero.getBoundingClientRect().bottom;
        nav.classList.toggle("is-visible", heroBottom < vh * 0.55);
      }
    }

    if (reduce.matches) return;

    // Parallax: ±16px, desktop only
    if (desktop.matches) {
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var center = r.top + r.height / 2;
        var t = clamp((center - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
        el.style.setProperty("--py", (t * -16).toFixed(2) + "px");
      });
    }

    // Gate: sweep from 0 → 1 while the figure moves through the middle band of the viewport
    if (gate) {
      var g = gate.getBoundingClientRect();
      var start = vh * 0.85;
      var end = vh * 0.15 - g.height * 0.2;
      var p = clamp((start - g.top) / (start - end), 0, 1);
      gate.style.setProperty("--g", p.toFixed(4));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (nav && !railNav.matches) nav.classList.add("is-hscroll");
  if (railNav.addEventListener) railNav.addEventListener("change", function (e) { if (nav) nav.classList.toggle("is-hscroll", !e.matches); onScroll(); });
  if (desktop.addEventListener) desktop.addEventListener("change", onScroll);
  frame();

  /* ---------- Lazy images: swap in full-res once decoded (already handled by srcset) ---------- */
  $$(".ia-fig__frame img[loading='lazy']").forEach(function (img) {
    if (img.complete) { img.classList.add("is-loaded"); return; }
    img.addEventListener("load", function () { img.classList.add("is-loaded"); }, { once: true });
  });
})();
