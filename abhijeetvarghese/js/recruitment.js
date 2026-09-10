/* ============================================================
   RECRUITER — experience layer
   One visual system (the creative-system constellation),
   one-at-a-time reveals, a project switcher, and the
   recruiter form. Transform/opacity only · rAF-driven ·
   respects prefers-reduced-motion.
   ============================================================ */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- act indicator (Recruiter 01 / 07) ---------- */
  const actEl = $("#rAct");
  const actNum = $("#rActNum");
  const actSections = $$("[data-act]");
  if (actEl && actNum && actSections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) actNum.textContent = String(e.target.dataset.act || "01").padStart(2, "0");
      }
    }, { rootMargin: "-38% 0px -55% 0px", threshold: 0 });
    actSections.forEach((s) => io.observe(s));
    window.addEventListener("scroll", () => {
      actEl.classList.toggle("is-on", window.scrollY > 120);
    }, { passive: true });
  }

  /* ---------- rail — active section tracking ---------- */
  const rail = $("#rRail");
  if (rail && "IntersectionObserver" in window) {
    const links = $$(".r-rail__link[data-rail]", rail);
    const sections = links
      .map((l) => document.getElementById(l.dataset.rail))
      .filter(Boolean);
    const setActive = (id) =>
      links.forEach((l) => l.classList.toggle("is-active", l.dataset.rail === id));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- hero constellation: line draw + node glow + parallax ---------- */
  const cnode = $("#rHeroConstellation");
  if (cnode) {
    const draw = () => cnode.classList.add("is-drawn");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { draw(); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(cnode);
    } else draw();

    $$(".r-cnode", cnode).forEach((g) => {
      g.addEventListener("pointerenter", () => cnode.classList.add("is-node-hot"));
      g.addEventListener("pointerleave", () => cnode.classList.remove("is-node-hot"));
    });

    const viz = $("#rHeroViz");
    if (viz && finePointer && !reduced) {
      const layers = [
        { el: cnode, depth: 10 },
        { el: $(".r-hero__frags", viz), depth: 5 }
      ].filter((l) => l.el);
      let raf = null, cx = 0, cy = 0, tx = 0, ty = 0;
      const loop = () => {
        raf = null;
        cx += (tx - cx) * 0.06;
        cy += (ty - cy) * 0.06;
        for (const l of layers) {
          l.el.style.transform = `translate3d(${(cx * l.depth).toFixed(2)}px, ${(cy * l.depth).toFixed(2)}px, 0)`;
        }
      };
      window.addEventListener("pointermove", (e) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
  }

  /* ---------- stage: scroll parallax + progress rail + cursor light ---------- */
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

  /* ---------- HOW I THINK — one-at-a-time reveal (click/tap + hover preview) ---------- */
  const think = $("#rThink");
  if (think) {
    const items = $$(".r-think__item", think);
    let locked = -1;
    const setOpen = (i, lock) => {
      items.forEach((el, j) => {
        const on = j === i;
        el.classList.toggle("is-open", on);
        el.querySelector(".r-think__head").setAttribute("aria-expanded", String(on));
        el.querySelector(".r-think__clip").setAttribute("aria-hidden", String(!on));
      });
      if (lock) locked = i;
    };
    setOpen(-1, false);
    items.forEach((el, i) => {
      el.querySelector(".r-think__head").addEventListener("click", () => {
        if (locked === i && el.classList.contains("is-open")) { locked = -1; setOpen(-1, true); }
        else setOpen(i, true);
      });
      if (finePointer && !reduced) {
        el.addEventListener("pointerenter", () => setOpen(i, false));
        el.addEventListener("pointerleave", () => { if (locked !== i) setOpen(locked, false); });
      }
    });
  }

  /* ---------- WHAT I CAN OWN — one selected category at a time ---------- */
  const own = $("#rOwn");
  if (own) {
    const cards = $$(".r-own__card", own);
    const select = (i) => {
      cards.forEach((c, j) => {
        const on = j === i;
        c.classList.toggle("is-selected", on);
        c.querySelector(".r-own__head").setAttribute("aria-expanded", String(on));
      });
    };
    cards.forEach((c, i) => {
      c.addEventListener("click", () => select(i));
    });
  }

  /* ---------- WORK IS THE PROOF — project switcher ---------- */
  const tabs = $$(".r-proj-tab");
  const panels = $$(".r-proj__panel");
  if (tabs.length && panels.length) {
    const set = (i) => {
      tabs.forEach((t, j) => t.setAttribute("aria-selected", String(j === i)));
      panels.forEach((p, j) => p.classList.toggle("is-active", j === i));
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => set(i));
      t.addEventListener("keydown", (e) => {
        let k = -1;
        if (e.key === "ArrowRight") k = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") k = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") k = 0;
        else if (e.key === "End") k = tabs.length - 1;
        if (k >= 0) { e.preventDefault(); set(k); tabs[k].focus(); }
      });
    });
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
        $("#rfRole").value.trim() ? "Role / opportunity: " + $("#rfRole").value.trim() : "",
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
        try { window.avTrack({ event_type: "recruiter_contact_submit", content: saved ? "success" : "fallback" }); } catch (err) {}
      }
      if (saved) {
        form.reset();
        setNote("Received — I'll reply from hi@abhijeetvarghese.com. Thank you.", true);
      } else {
        setNote("I couldn't save that just now. Please email hi@abhijeetvarghese.com directly.", false);
      }
    });
  }
})();
