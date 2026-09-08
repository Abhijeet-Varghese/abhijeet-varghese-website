/* ============================================================
   FOR RECRUITERS — page interactions
   Progressive enhancement. All content is fully visible without JS.
   - Hero title sequence (skippable, reduced-motion aware)
   - Contextual cursor (pointer-fine devices only)
   - Scroll reveals via IntersectionObserver
   - Fragment diagram activation
   - Leadership layer accordion
   - AI capability node system
   - FAQ accordion
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- 1. SCROLL REVEALS ---------- */
  var revealEls = document.querySelectorAll(".rp-sr");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. HERO TITLE SEQUENCE ---------- */
  var seq = document.getElementById("rpSeq");
  function finishIntro() {
    root.classList.add("rp-intro-done");
    if (seq) {
      seq.style.transition = "opacity .7s ease";
      seq.style.opacity = "0";
      setTimeout(function () { if (seq.parentNode) seq.parentNode.removeChild(seq); }, 800);
    }
  }
  if (seq && !reduceMotion) {
    root.classList.add("rp-intro");
    var FRAGMENTS = ["STORY", "PEOPLE", "TECHNOLOGY", "CONTENT", "SPACE", "INTERACTION"];
    var stage = [
      { word: "COMPLEXITY", cls: "word", hold: 700 },
      { frags: true },
      { word: "CLARITY", cls: "clarity", hold: 650 },
      { word: "EXPERIENCE", cls: "word", hold: 600 },
      { word: "ABHIJEET VARGHESE", cls: "word", hold: 650 }
    ];
    var introTimers = [];
    function later(fn, ms) { introTimers.push(setTimeout(fn, ms)); }

    later(function () {
      // COMPLEXITY
      var w = document.createElement("span");
      w.className = "rp-seq__word word"; w.textContent = "COMPLEXITY";
      seq.appendChild(w);
      requestAnimationFrame(function () { w.classList.add("on"); });
      later(function () { w.style.transition = "opacity .35s"; w.style.opacity = "0"; }, 700);
    }, 200);

    later(function () {
      // fragments scatter
      FRAGMENTS.forEach(function (f, i) {
        var s = document.createElement("span");
        s.className = "rp-seq__word frag"; s.textContent = f;
        var ang = (i / FRAGMENTS.length) * Math.PI * 2;
        var rad = 32 + (i % 2) * 8;
        s.style.left = (50 + Math.cos(ang) * rad) + "%";
        s.style.top = (50 + Math.sin(ang) * rad * 0.6) + "%";
        s.style.transform = "translate(-50%,-50%)";
        seq.appendChild(s);
        later(function () { s.classList.add("on"); }, i * 90);
      });
    }, 1100);

    later(function () {
      seq.querySelectorAll(".rp-seq__word").forEach(function (s) {
        s.style.transition = "opacity .4s ease, transform .6s cubic-bezier(.2,.7,.2,1)";
        s.style.opacity = "0";
        s.style.transform = "translate(-50%,-50%) scale(.6)";
      });
    }, 2150);

    later(function () {
      var c = document.createElement("span");
      c.className = "rp-seq__word clarity"; c.textContent = "Clarity.";
      seq.appendChild(c);
      requestAnimationFrame(function () { c.classList.add("on"); });
      later(function () { c.style.transition = "opacity .4s"; c.style.opacity = "0"; }, 650);
    }, 2450);

    later(function () {
      var e = document.createElement("span");
      e.className = "rp-seq__word word"; e.textContent = "EXPERIENCE";
      seq.appendChild(e);
      requestAnimationFrame(function () { e.classList.add("on"); });
      later(function () { e.style.transition = "opacity .4s"; e.style.opacity = "0"; }, 600);
    }, 3350);

    later(function () {
      var n = document.createElement("span");
      n.className = "rp-seq__word word"; n.style.color = "#F6F3EC"; n.textContent = "ABHIJEET VARGHESE";
      seq.appendChild(n);
      requestAnimationFrame(function () { n.classList.add("on"); });
    }, 4200);

    later(finishIntro, 5100);

    // skip on user intent
    var skipIntro = function () { introTimers.forEach(clearTimeout); finishIntro(); };
    ["scroll", "keydown", "touchstart", "pointerdown"].forEach(function (ev) {
      window.addEventListener(ev, skipIntro, { once: true, passive: true });
    });
  } else {
    root.classList.add("rp-intro-done");
    if (seq && seq.parentNode) seq.parentNode.removeChild(seq);
  }

  /* ---------- 3. CONTEXTUAL CURSOR ---------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-cursor");
    var cursor = document.getElementById("rpCursor");
    var ring = cursor.querySelector(".rp-cursor__ring");
    var dot = cursor.querySelector(".rp-cursor__dot");
    var label = document.getElementById("rpCursorLabel");
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    window.addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });

    var LABELS = { view: "VIEW", explore: "EXPLORE", open: "OPEN", read: "READ", connect: "CONNECT" };
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursor],a,button") : null;
      if (!t) { cursor.classList.remove("is-label"); label.textContent = ""; return; }
      var key = t.getAttribute("data-cursor") || (t.tagName === "A" ? "open" : "explore");
      if (LABELS[key]) { label.textContent = LABELS[key]; cursor.classList.add("is-label"); }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest("[data-cursor],a,button")) {
        cursor.classList.remove("is-label"); label.textContent = "";
      }
    });
  }

  /* ---------- 4. FRAGMENT DIAGRAM — activate nodes on scroll/hover ---------- */
  var frag = document.getElementById("rpFrag");
  if (frag) {
    var fNodes = frag.querySelectorAll(".rp-frag__node");
    if (!reduceMotion && "IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          fNodes.forEach(function (n, i) { setTimeout(function () { n.classList.add("is-active"); }, 200 + i * 130); });
          fio.disconnect();
        }
      }, { threshold: 0.35 });
      fio.observe(frag);
    } else { fNodes.forEach(function (n) { n.classList.add("is-active"); }); }
  }

  /* ---------- 5. LEADERSHIP LAYERS (accordion, keyboard friendly) ---------- */
  var stackLayers = document.querySelectorAll(".rp-stack__layer");
  stackLayers.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.classList.contains("is-active");
      stackLayers.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-expanded", "false"); });
      if (!open) { btn.classList.add("is-active"); btn.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- 6. AI CAPABILITY SYSTEM ---------- */
  var aiSys = document.getElementById("rpAiSys");
  if (aiSys) {
    var AI_COPY = {
      concept:   ["Concept", "Explore multiple creative directions rapidly — before narrowing toward a stronger idea."],
      image:     ["Image", "Generate and explore visual territories, environments, compositions and art directions."],
      video:     ["Video", "Prototype cinematic language, motion, sequences, transitions and visual ideas."],
      sound:     ["Sound", "Explore musical directions, soundscapes, atmospheres and sonic possibilities."],
      story:     ["Story", "Explore narrative structures, scenarios, characters, scripts and experience journeys."],
      motion:    ["Motion", "Test movement, choreography and timing before a single frame is produced."],
      experience:["Experience", "Explore interactive, adaptive and generative experience ideas."],
      xr:        ["XR", "Explore immersive worlds, environments and future-facing XR concepts."],
      prototype: ["Prototype", "Turn abstract ideas into visual or interactive prototypes quickly."],
      production:["Production", "Accelerate selected parts of the creative workflow, variation and development process."]
    };
    var aiTitle = document.getElementById("rpAiTitle");
    var aiText = document.getElementById("rpAiText");
    var aiNodes = aiSys.querySelectorAll(".rp-ai__node");
    var svg = aiSys.querySelector(".rp-ai__links");
    var center = aiSys.querySelector(".rp-ai__center");

    // draw connector lines from center to each node
    function drawLines() {
      if (!svg) return;
      var sysR = aiSys.getBoundingClientRect();
      var cR = center.getBoundingClientRect();
      var cx = cR.left - sysR.left + cR.width / 2;
      var cy = cR.top - sysR.top + cR.height / 2;
      svg.setAttribute("viewBox", "0 0 " + sysR.width + " " + sysR.height);
      svg.innerHTML = "";
      aiNodes.forEach(function (n) {
        var r = n.getBoundingClientRect();
        var nx = r.left - sysR.left + r.width / 2;
        var ny = r.top - sysR.top + r.height / 2;
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", cx); line.setAttribute("y1", cy);
        line.setAttribute("x2", nx); line.setAttribute("y2", ny);
        svg.appendChild(line);
      });
    }
    drawLines();
    window.addEventListener("resize", function () { requestAnimationFrame(drawLines); });

    function activate(node) {
      var key = node.getAttribute("data-node");
      var copy = AI_COPY[key];
      if (!copy) return;
      aiNodes.forEach(function (n) { n.classList.remove("is-active"); });
      node.classList.add("is-active");
      aiTitle.textContent = copy[0];
      aiText.textContent = copy[1];
    }
    aiNodes.forEach(function (n) {
      n.addEventListener("mouseenter", function () { activate(n); });
      n.addEventListener("focus", function () { activate(n); });
      n.addEventListener("click", function () { activate(n); });
    });
  }

  /* ---------- 7. FAQ ACCORDION ---------- */
  var faqItems = document.querySelectorAll(".rp-faq__item");
  faqItems.forEach(function (item) {
    var q = item.querySelector(".rp-faq__q");
    q.addEventListener("click", function () {
      var open = item.classList.contains("is-open");
      faqItems.forEach(function (it) { it.classList.remove("is-open"); it.querySelector(".rp-faq__q").setAttribute("aria-expanded", "false"); });
      if (!open) { item.classList.add("is-open"); q.setAttribute("aria-expanded", "true"); }
    });
  });
})();
