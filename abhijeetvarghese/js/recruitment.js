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
  if (viz && finePointer.matches && !reduced) {
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
      if (saved) {
        form.reset();
        setNote("Received — I'll reply from hi@abhijeetvarghese.com. Thank you.", true);
      } else {
        setNote("I couldn't save that just now. Please email hi@abhijeetvarghese.com directly.", false);
      }
    });
  }
})();
