/* ============================================================
   RECRUITER — "FOLIO" experience layer
   Restrained interactivity: a subtle creative-system visual in
   the hero, progressive-disclosure lists, a horizontal proof
   rail, staggered reveals. Transform/opacity only · rAF-driven ·
   reduced-motion safe. (No magnetic/cursor-following buttons.)
   v8.1.1
   ============================================================ */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- reveal on scroll (with a quiet sibling stagger) ---------- */
  const reveals = $$("[data-reveal]");
  if (reveals.length) {
    if ("IntersectionObserver" in window && !reduced) {
      // stagger reveals that share a parent, so lists cascade in
      const groupCount = new WeakMap();
      reveals.forEach((el) => {
        const parent = el.parentElement;
        if (!parent) return;
        if (!groupCount.has(parent)) groupCount.set(parent, $$("[data-reveal]", parent).length);
        if (groupCount.get(parent) > 1) {
          const idx = Array.prototype.indexOf.call(parent.children, el);
          el.style.transitionDelay = Math.min(idx, 4) * 70 + "ms";
        }
      });
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("is-in"));
    }
  }

  /* ---------- hero node system: proximity ---------- */
  const hero = $("#intro");
  const system = $("#rSystem");
  if (hero && system && fine && !reduced) {
    const nodes = $$(".r-snode", system).map((g) => ({
      g, x: parseFloat(g.dataset.x || "0"), y: parseFloat(g.dataset.y || "0")
    }));
    const spokes = $$(".r-spoke", system);
    const svg = system;
    let active = -1;
    let paused = false;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        for (const e of es) paused = !e.isIntersecting;
      }, { threshold: 0.05 });
      io.observe(hero);
    }
    const clear = () => {
      if (active < 0) return;
      nodes[active].g.classList.remove("is-near");
      if (spokes[active]) spokes[active].classList.remove("r-spoke--hot");
      active = -1;
    };
    hero.addEventListener("pointermove", (e) => {
      if (paused) return;
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const px = (e.clientX - r.left) / r.width * 540;
      const py = (e.clientY - r.top) / r.height * 470;
      let bi = -1, bd = Infinity;
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.x - px, n.y - py);
        if (d < bd) { bd = d; bi = i; }
      });
      if (bi === active) return;
      clear();
      if (bi >= 0 && bd < 90) {
        active = bi;
        nodes[bi].g.classList.add("is-near");
        if (spokes[bi]) spokes[bi].classList.add("r-spoke--hot");
      }
    }, { passive: true });
    hero.addEventListener("pointerleave", clear, { passive: true });
  }

  /* ---------- ambient cursor light (background only) ---------- */
  const light = $("#rStageLight");
  if (light && fine && !reduced) {
    let tx = -500, ty = -500, cx = -500, cy = -500, raf = null;
    const loop = () => {
      raf = null;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      light.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    };
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!light.classList.contains("is-on")) light.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- one-open list behaviour (shared) ---------- */
  function accordion(scopeSel, itemSel, btnSel) {
    const scope = $(scopeSel);
    if (!scope) return;
    const items = $$(itemSel, scope);
    const setOpen = (i) => {
      items.forEach((el, j) => {
        const on = j === i;
        el.classList.toggle("is-open", on);
        el.querySelector(btnSel).setAttribute("aria-expanded", String(on));
      });
      return i;
    };
    items.forEach((el, i) => {
      const btn = el.querySelector(btnSel);
      btn.addEventListener("click", () => setOpen(el.classList.contains("is-open") ? -1 : i));
      btn.addEventListener("focus", () => setOpen(i));
      if (fine && !reduced) {
        el.addEventListener("pointerenter", () => setOpen(i));
        el.addEventListener("pointerleave", () => { if (document.activeElement !== btn) setOpen(-1); });
      }
    });
    return setOpen;
  }

  /* career evolution */
  accordion("#rEvolve", ".r-evolve__item", ".r-evolve__btn");
  /* capabilities */
  accordion("#rCap", ".r-cap__item", ".r-cap__btn");

  /* how I work + spine fill */
  const methodSet = accordion("#rMethod", ".r-method__item", ".r-method__btn");
  const methodFill = $("#rMethodFill");
  const methodItems = $$("#rMethod .r-method__item");
  if (methodSet && methodFill && methodItems.length) {
    const updateFill = () => {
      const open = methodItems.findIndex((el) => el.classList.contains("is-open"));
      const f = open >= 0 ? (open + 1) / methodItems.length : 0;
      methodFill.style.transform = "scaleY(" + f.toFixed(3) + ")";
    };
    methodItems.forEach((el) => {
      el.querySelector(".r-method__btn").addEventListener("click", () => setTimeout(updateFill, 30));
    });
    window.addEventListener("resize", updateFill, { passive: true });
  }

  /* ---------- selected proof: horizontal rail ---------- */
  const rail = $("#rProofRail");
  if (rail) {
    const panels = $$(".r-proof__panel", rail);
    const cur = $("#rProofCur");
    const prev = $("#rProofPrev");
    const next = $("#rProofNext");
    const progress = $("#rProofProgress");
    let active = 0;
    const sync = (i) => {
      active = i;
      panels.forEach((p, j) => p.classList.toggle("is-active", j === i));
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === panels.length - 1;
    };
    const update = () => {
      const rl = rail.scrollLeft;
      let best = 0, bd = Infinity;
      panels.forEach((p, i) => {
        const off = p.getBoundingClientRect().left - rail.getBoundingClientRect().left + rl;
        const d = Math.abs(off - rl);
        if (d < bd) { bd = d; best = i; }
      });
      sync(best);
      if (progress) {
        const max = rail.scrollWidth - rail.clientWidth;
        progress.style.width = (max > 0 ? (rl / max) * 100 : 0).toFixed(2) + "%";
      }
    };
    const go = (i) => {
      const el = panels[i];
      if (!el) return;
      rail.scrollTo({ left: el.offsetLeft, behavior: reduced ? "auto" : "smooth" });
    };
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    if (prev) prev.addEventListener("click", () => go(Math.max(0, active - 1)));
    if (next) next.addEventListener("click", () => go(Math.min(panels.length - 1, active + 1)));
    rail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(Math.min(panels.length - 1, active + 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(Math.max(0, active - 1)); }
    });
    update();
  }
})();
