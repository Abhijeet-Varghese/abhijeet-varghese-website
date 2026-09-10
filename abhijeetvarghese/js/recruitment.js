/* ============================================================
   RECRUITER — experience layer
   One creative system. Typography-led chapters.
   Progressive disclosure (hover / tap / scroll), a horizontal
   project rail, and the ambient stage.
   Transform/opacity only · rAF-driven · reduced-motion safe.
   ============================================================ */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- act indicator — chapter number + name ---------- */
  const actEl = $("#rAct");
  const actNum = $("#rActNum");
  const actName = $("#rActName");
  const actSections = $$("[data-act]");
  if (actEl && actNum && actSections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          actNum.textContent = String(e.target.dataset.act || "01").padStart(2, "0");
          if (actName && e.target.dataset.actLabel) actName.textContent = e.target.dataset.actLabel;
        }
      }
    }, { rootMargin: "-40% 0px -52% 0px", threshold: 0 });
    actSections.forEach((s) => io.observe(s));
    window.addEventListener("scroll", () => {
      actEl.classList.toggle("is-on", window.scrollY > 140);
    }, { passive: true });
  }

  /* ---------- hero: constellation, cursor proximity, sheen, parallax ---------- */
  const cnode = $("#rHeroConstellation");
  if (cnode) {
    const draw = () => cnode.classList.add("is-drawn");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { draw(); io.disconnect(); }
      }, { threshold: 0.15 });
      io.observe(cnode);
    } else draw();

    const hero = $("#intro");
    const viz = $("#rHeroViz");
    const sheen = $("#rHeroSheen");
    const stageEl = $(".r-hero__stage");
    const name = document.querySelector(".r-hero__name");
    if (hero && finePointer && !reduced) {
      const nodes = $$(".r-cnode", cnode).map((g) => ({
        g,
        x: parseFloat(g.dataset.x || "0"),
        y: parseFloat(g.dataset.y || "0")
      }));
      const VB = 560;
      const nameF = parseFloat(name ? name.dataset.hparallax || "0" : "0") * 300;

      let raf = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;         // normalised cursor (parallax)
      let sTx = -600, sTy = -600, sX = -600, sY = -600; // sheen
      let near = -1;

      const loop = () => {
        raf = null;
        cx += (tx - cx) * 0.05;
        cy += (ty - cy) * 0.05;
        if (viz) viz.style.transform = `translate3d(${(cx * 12).toFixed(2)}px, ${(cy * 9).toFixed(2)}px, 0)`;
        if (name && nameF) name.style.transform = `translate3d(${(cx * nameF).toFixed(2)}px, ${(cy * nameF).toFixed(2)}px, 0)`;
        if (sheen && sheen.classList.contains("is-on")) {
          sX += (sTx - sX) * 0.12;
          sY += (sTy - sY) * 0.12;
          sheen.style.transform = `translate3d(${sX.toFixed(1)}px, ${sY.toFixed(1)}px, 0)`;
        }
      };

      const onMove = (e) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        if (sheen) {
          if (stageEl) {
            const sr = stageEl.getBoundingClientRect();
            sTx = e.clientX - sr.left;
            sTy = e.clientY - sr.top;
          }
          if (!sheen.classList.contains("is-on")) sheen.classList.add("is-on");
        }
        const r = cnode.getBoundingClientRect();
        if (r.width > 0) {
          const sxp = (e.clientX - r.left) / r.width * VB;
          const syp = (e.clientY - r.top) / r.height * VB;
          let bi = -1, bd = Infinity;
          nodes.forEach((n, i) => {
            const d = Math.hypot(n.x - sxp, n.y - syp);
            if (d < bd) { bd = d; bi = i; }
          });
          if (bi !== near) {
            if (near >= 0) nodes[near].g.classList.remove("is-near");
            near = bi;
            if (near >= 0) nodes[near].g.classList.add("is-near");
            cnode.classList.toggle("is-hot", near >= 0);
          }
        }
        if (!raf) raf = requestAnimationFrame(loop);
      };
      hero.addEventListener("pointermove", onMove, { passive: true });
    }
  }

  /* ---------- short version — word activation on scroll ---------- */
  const stmt = $("#rStatement");
  if (stmt) {
    const words = $$(".r-w", stmt.parentElement);
    let done = false;
    const light = () => {
      if (done) return;
      done = true;
      words.forEach((w, i) => {
        w.style.transitionDelay = (i * 0.14).toFixed(2) + "s";
        w.classList.add("is-lit");
      });
    };
    if (reduced) { words.forEach((w) => w.classList.add("is-lit")); done = true; }
    else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { light(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(stmt);
    } else light();
  }

  /* ---------- HOW I THINK — one stage open at a time ---------- */
  const stages = $("#rStages");
  if (stages) {
    const items = $$(".r-stage-item", stages);
    const setOpen = (i) => {
      items.forEach((el, j) => {
        const on = j === i;
        el.classList.toggle("is-open", on);
        el.querySelector(".r-stage-item__head").setAttribute("aria-expanded", String(on));
        el.querySelector(".r-stage-item__note").setAttribute("aria-hidden", String(!on));
      });
    };
    items.forEach((el, i) => {
      const head = el.querySelector(".r-stage-item__head");
      head.addEventListener("click", () => {
        setOpen(el.classList.contains("is-open") ? -1 : i);
      });
      head.addEventListener("focus", () => setOpen(i));
      if (finePointer && !reduced) {
        el.addEventListener("pointerenter", () => setOpen(i));
        el.addEventListener("pointerleave", () => { if (document.activeElement !== head) setOpen(-1); });
      }
    });
  }

  /* ---------- WHAT I CAN OWN — cursor proximity reveals one phrase ---------- */
  const own = $("#rOwn");
  if (own) {
    const rows = $$(".r-own__row", own);
    const activate = (i) => {
      rows.forEach((r, j) => {
        const on = j === i;
        r.classList.toggle("is-active", on);
        r.querySelector(".r-own__word").setAttribute("aria-expanded", String(on));
      });
      own.classList.toggle("has-active", i >= 0);
    };
    rows.forEach((r, i) => {
      const word = r.querySelector(".r-own__word");
      word.addEventListener("click", () => activate(r.classList.contains("is-active") ? -1 : i));
      word.addEventListener("focus", () => activate(i));
      if (finePointer && !reduced) {
        r.addEventListener("pointerenter", () => activate(i));
        r.addEventListener("pointerleave", () => { if (document.activeElement !== word) activate(-1); });
      }
    });
  }

  /* ---------- SELECTED PROOF — cinematic index + rail ---------- */
  const rail = $("#rProofRail");
  if (rail) {
    const panels = $$(".r-proof__panel", rail);
    const indexItems = $$("#rProofIndex .r-proof__index-item");
    const cur = $("#rProofCur");
    const prev = $("#rProofPrev");
    const next = $("#rProofNext");
    const progress = $("#rProofProgress");
    let active = 0;

    const sync = (i) => {
      active = i;
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === panels.length - 1;
      indexItems.forEach((t, j) => {
        const on = j === i;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
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
    indexItems.forEach((t, i) => {
      t.addEventListener("click", () => go(i));
      t.addEventListener("keydown", (e) => {
        let k = -1;
        if (e.key === "ArrowRight") k = (i + 1) % indexItems.length;
        else if (e.key === "ArrowLeft") k = (i - 1 + indexItems.length) % indexItems.length;
        else if (e.key === "Home") k = 0;
        else if (e.key === "End") k = indexItems.length - 1;
        if (k >= 0) { e.preventDefault(); go(k); indexItems[k].focus(); }
      });
    });
    rail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(Math.min(panels.length - 1, active + 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(Math.max(0, active - 1)); }
    });
    update();
  }

  /* ---------- MY WAY — one principle lit at a time ---------- */
  const way = $("#rWay");
  if (way && "IntersectionObserver" in window && !reduced) {
    const items = $$(".r-way__item", way);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        items.forEach((it) => it.classList.toggle("is-current", it === e.target));
      }
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    items.forEach((it) => io.observe(it));
  }

  /* ---------- ambient stage: parallax + progress + cursor light ---------- */
  const stage = $("#rStage");
  if (stage) {
    const parallaxEls = $$("[data-parallax]", stage).map((el) => ({
      el, f: parseFloat(el.dataset.parallax || "0")
    }));
    const railFill = $("#rPrailFill");
    const railCap = $("#rPrailCap");
    const prail = $("#rPrail");
    const light = $("#rStageLight");

    let docH = 1, railLen = 1;
    const measure = () => {
      docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      railLen = prail && prail.offsetHeight ? prail.offsetHeight : 1;
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    let scrollY = window.scrollY, py = scrollY, y = scrollY, raf = null;
    let tx = -600, ty = -600, cx = -600, cy = -600;
    const tick = () => {
      raf = null;
      const p = Math.min(1, Math.max(0, scrollY / docH));
      if (railFill) railFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
      if (railCap && prail) railCap.style.transform = "translateY(" + (p * railLen).toFixed(1) + "px)";
      if (!reduced) {
        y += (py - y) * 0.08;
        for (const l of parallaxEls) {
          l.el.style.transform = "translate3d(0," + (y * l.f).toFixed(2) + "px,0)";
        }
        if (light && light.classList.contains("is-on")) {
          cx += (tx - cx) * 0.09;
          cy += (ty - cy) * 0.09;
          light.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        }
      }
    };
    const onScroll = () => {
      scrollY = window.scrollY;
      py = scrollY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    if (light && finePointer && !reduced) {
      window.addEventListener("pointermove", (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!light.classList.contains("is-on")) light.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    }
    onScroll();
  }
})();
