/* ============================================================
   RECRUITMENT — page-level interaction layer
   Hero pointer parallax, act indicator, systems-diagram draw,
   AI-collapse visual, recruiter form submit.

   Performance rules (shared with the error-page work):
   - one passive pointermove listener + one rAF loop
   - transform/opacity only, no per-frame layout reads
   - everything respects prefers-reduced-motion
   ============================================================ */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- act indicator (RECRUITMENT 01 / 08) ---------- */
  const actEl = $("#rAct");
  const actNum = $("#rActNum");
  const actSections = $$("[data-act]");
  if (actEl && actNum && actSections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          actNum.textContent = String(e.target.dataset.act || "01").padStart(2, "0");
        }
      }
    }, { rootMargin: "-38% 0px -55% 0px", threshold: 0 });
    actSections.forEach((s) => io.observe(s));
    window.addEventListener("scroll", () => {
      actEl.classList.toggle("is-on", window.scrollY > 120);
    }, { passive: true });
  }

  /* ---------- hero pointer parallax (fine pointer only) ---------- */
  const viz = $("#rHeroViz");
  if (viz && finePointer && !reduced) {
    const layers = $$(".r-hero__constellation, .r-hero__frags", viz).map((el, i) => ({
      el, depth: i === 0 ? 14 : 8
    }));
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const move = (e) => {
      cx = e.clientX / window.innerWidth - 0.5;
      cy = e.clientY / window.innerHeight - 0.5;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = null;
          tx += (cx - tx) * 0.06;
          ty += (cy - ty) * 0.06;
          for (const l of layers) {
            l.el.style.transform = `translate3d(${(tx * l.depth).toFixed(2)}px, ${(ty * l.depth).toFixed(2)}px, 0)`;
          }
        });
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
  }

  /* ---------- systems diagram: draw the spine, light the nodes ---------- */
  const sys = $("#rSys");
  if (sys) {
    const steps = $$(".r-sys__step", sys);
    const light = () => {
      sys.classList.add("is-drawn");
      if (reduced) { steps.forEach((s) => s.classList.add("is-lit")); return; }
      steps.forEach((s, i) => setTimeout(() => s.classList.add("is-lit"), 260 + i * 120));
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { light(); io.disconnect(); }
        }
      }, { threshold: 0.35 });
      io.observe(sys);
    } else { light(); }
  }

  /* ---------- AI collapse visual ---------- */
  const ai = $("#rAi");
  if (ai) {
    const w = ai.clientWidth || 600;
    const h = ai.clientHeight || 300;
    const seedX = w * 0.5, seedY = h * 0.56;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 26; i++) {
      const n = document.createElement("span");
      n.className = "r-ai__node r-ai__collapse";
      const x = w * (0.06 + Math.random() * 0.88);
      const y = h * (0.05 + Math.random() * 0.86);
      const d = Math.hypot(seedX - x, seedY - y);
      if (d < 26) continue;
      n.style.left = `${x}px`;
      n.style.top = `${y}px`;
      n.style.setProperty("--tx", `${(seedX - x).toFixed(0)}px`);
      n.style.setProperty("--ty", `${(seedY - y).toFixed(0)}px`);
      n.style.animationDelay = `${(Math.random() * 6).toFixed(2)}s`;
      n.style.animationDuration = `${(4 + Math.random() * 5).toFixed(2)}s`;
      frag.appendChild(n);
    }
    const seed = document.createElement("span");
    seed.className = "r-ai__seed";
    const label = document.createElement("span");
    label.className = "r-ai__label";
    label.textContent = "exploration → judgement → one direction";
    ai.append(frag, seed, label);
  }

  /* ---------- recruiter form ---------- */
  const form = $("#recruitForm");
  if (form) {
    const note = $("#rfNote");
    const btn = $("#rfSubmit");
    const setNote = (msg, ok) => {
      note.textContent = msg;
      note.classList.toggle("is-ok", !!ok);
      note.classList.toggle("is-err", ok === false);
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#rfName").value.trim();
      const email = $("#rfEmail").value.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNote("Please add your name and a valid email so I can reply.", false);
        (name ? $("#rfEmail") : $("#rfName")).focus();
        return;
      }
      const utm = new URLSearchParams(location.search);
      const message = [
        $("#rfRole").value.trim() ? `Role / opportunity: ${$("#rfRole").value.trim()}` : "",
        $("#rfLoc").value.trim() ? `Location: ${$("#rfLoc").value.trim()}` : "",
        $("#rfMsg").value.trim()
      ].filter(Boolean).join("\n\n");
      const payload = {
        name, email,
        organization: $("#rfOrg").value.trim(),
        message,
        project_type: "recruitment inquiry",
        source: "recruitment page",
        page: location.pathname,
        referrer: document.referrer || "",
        utm_source: utm.get("utm_source") || "",
        utm_medium: utm.get("utm_medium") || "",
        utm_campaign: utm.get("utm_campaign") || "",
        utm_term: utm.get("utm_term") || "",
        utm_content: utm.get("utm_content") || ""
      };
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";
      let saved = false;
      try {
        const r = await fetch("/api/public/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        saved = r.ok;
      } catch { saved = false; }
      btn.disabled = false;
      btn.innerHTML = label;
      if (window.avTrack) {
        try { window.avTrack({ event_type: "recruiter_contact_submit", content: saved ? "success" : "fallback" }); } catch (e) {}
      }
      if (saved) {
        form.reset();
        setNote("Received — I'll reply from hi@abhijeetvarghese.com. Thank you.", true);
      } else {
        setNote("I couldn't save that just now. Please email hi@abhijeetvarghese.com directly.", false);
      }
    });
  }
  /* ---------- recruiter rail — active chapter tracking ---------- */
  const rail = $("#rRail");
  if (rail && "IntersectionObserver" in window) {
    const links = $$(".r-rail__link[data-rail]", rail);
    const sections = [];
    links.forEach((l) => {
      const sec = document.getElementById(l.dataset.rail);
      if (sec) sections.push({ id: l.dataset.rail, sec });
    });
    const setActive = (id) => links.forEach((l) => l.classList.toggle("is-active", l.dataset.rail === id));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setActive(e.target.id);
      }
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach((s) => io.observe(s.sec));
  }

  /* ---------- immersive: constellation lines glow while a node is hovered ---------- */
  const constellation = $(".r-hero__constellation");
  if (constellation && finePointer && !reduced) {
    constellation.addEventListener("pointerenter", () => constellation.classList.add("is-node-hot"), { passive: true });
    constellation.addEventListener("pointerleave", () => constellation.classList.remove("is-node-hot"), { passive: true });
  }

  /* ---------- immersive: systems diagram — hovering a node reveals its neighbours ---------- */
  const sysEl = $("#rSys");
  if (sysEl && !reduced) {
    const sysSteps = $$(".r-sys__step", sysEl);
    const sysClear = () => {
      sysSteps.forEach((s) => s.classList.remove("is-hot", "is-neighbor"));
      sysEl.classList.remove("is-neighbor-on");
    };
    const sysActivate = (el) => {
      sysClear();
      const i = sysSteps.indexOf(el);
      el.classList.add("is-hot");
      if (sysSteps[i - 1]) sysSteps[i - 1].classList.add("is-neighbor");
      if (sysSteps[i + 1]) sysSteps[i + 1].classList.add("is-neighbor");
      sysEl.classList.add("is-neighbor-on");
    };
    sysSteps.forEach((el) => {
      el.addEventListener("pointerenter", () => sysActivate(el));
      el.addEventListener("focusin", () => sysActivate(el));
    });
    sysEl.addEventListener("pointerleave", sysClear);
    sysEl.addEventListener("focusout", (e) => {
      if (!sysEl.contains(e.relatedTarget)) sysClear();
    });
  }

  /* ---------- exclusive accordions — native <details name> polyfill ---------- */
  if (document.createElement("details").name === undefined) {
    document.addEventListener("toggle", (e) => {
      const d = e.target;
      if (d && d.open && d.name) {
        $$(`details[name="${d.name}"]`).forEach((o) => { if (o !== d) o.open = false; });
      }
    }, true);
  }
})();

/* ============================================================
   EXPERIENCE LAYER — ambient environment
   dust, cursor light, scroll parallax, progress rail
   transform/opacity only · one rAF loop · reduced-motion safe
   ============================================================ */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const stage = document.getElementById("rStage");
  if (!stage) return;

  /* ---------- dust: slow drifting specks ---------- */
  const dust = stage.querySelector(".r-stage__dust");
  if (dust && !reduced) {
    const frag = document.createDocumentFragment();
    const n = window.innerWidth < 700 ? 14 : 26;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("span");
      const size = (1.5 + Math.random() * 2.2).toFixed(1);
      d.style.left = (Math.random() * 100).toFixed(2) + "%";
      d.style.top = (Math.random() * 100).toFixed(2) + "%";
      d.style.width = size + "px";
      d.style.height = size + "px";
      d.style.animationDuration = (14 + Math.random() * 18).toFixed(2) + "s";
      d.style.animationDelay = (-Math.random() * 30).toFixed(2) + "s";
      d.style.opacity = (0.15 + Math.random() * 0.4).toFixed(2);
      frag.appendChild(d);
    }
    dust.appendChild(frag);
  }

  /* ---------- shared rAF loop for parallax + progress + cursor ---------- */
  let scrollY = window.scrollY;
  let docH = 1, viewH = 1;
  let railLen = 1;
  const parallaxEls = [];
  stage.querySelectorAll("[data-parallax]").forEach((el) => {
    parallaxEls.push({ el, f: parseFloat(el.dataset.parallax || "0") });
  });
  const railFill = document.getElementById("rPrailFill");
  const railCap = document.getElementById("rPrailCap");
  const rail = document.getElementById("rPrail");
  const light = document.getElementById("rStageLight");

  const measure = () => {
    docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    viewH = Math.max(1, window.innerHeight);
    railLen = rail && rail.offsetHeight ? rail.offsetHeight : 1;
  };
  measure();
  window.addEventListener("resize", measure, { passive: true });

  let raf = null;
  let tx = -600, ty = -600;   // cursor target
  let cx = -600, cy = -600;   // cursor current (lerped)
  let py = scrollY, y = scrollY; // parallax target/current
  const tick = () => {
    raf = null;
    /* progress */
    const p = Math.min(1, Math.max(0, scrollY / docH));
    if (railFill) railFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    if (railCap && rail) railCap.style.transform = "translateY(" + (p * railLen).toFixed(1) + "px)";
    if (!reduced) {
      /* parallax */
      y += (py - y) * 0.08;
      for (const l of parallaxEls) {
        l.el.style.transform = "translate3d(0," + (y * l.f).toFixed(2) + "px,0)";
      }
      /* cursor light */
      if (light && light.classList.contains("is-on")) {
        cx += (tx - cx) * 0.09;
        cy += (ty - cy) * 0.09;
        light.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      }
    }
  };

  /* schedule from scroll */
  const onScroll = () => {
    scrollY = window.scrollY;
    py = scrollY;
    if (!raf) raf = requestAnimationFrame(tick);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* cursor light — fine pointers only */
  if (light && finePointer && !reduced) {
    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!light.classList.contains("is-on")) light.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
  }
  /* paint first frame */
  onScroll();
})();
