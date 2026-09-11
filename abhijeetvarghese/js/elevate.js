/* ============================================================
   AV ELEVATE v3.0 — interaction layer
   Reveals · magnetic buttons · tilt · counters · nav intelligence
   cursor glow · back-to-top · scroll spy. All rAF-throttled,
   transform/opacity only, reduced-motion aware. No dependencies.
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const rAF = (fn) => { let t = false; return (...a) => { if (!t) { t = true; requestAnimationFrame(() => { t = false; fn(...a); }); } }; };

  /* ---------- 0. hero atmosphere: aurora orbs (decorative) ---------- */
  const hero = $(".hp-hero");
  if (hero && !reduced && !$(".e-aurora", hero)) {
    const a = document.createElement("div");
    a.className = "e-aurora"; a.setAttribute("aria-hidden", "true");
    a.innerHTML = "<i></i><i></i><i></i>";
    hero.prepend(a);
  }

  /* ---------- 1. hero staggered entrance ---------- */
  if (hero) {
    const seq = [".hp-hero__name-line", ".hp-hero__portrait", ".hp-hero__copy > *", ".hp-hero__lede"]
      .flatMap((s) => $$(s, hero));
    seq.forEach((el, i) => el.style.setProperty("--e-d", Math.min(0.08 + i * 0.09, 1.2) + "s"));
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-in")));
  }

  /* ---------- 2. reveals: [data-elevate] + auto-enhance ---------- */
  // Auto-enhance major blocks on inner pages (zero markup changes needed).
  $$("main section[id]:not(#hero) > h2, main section[id]:not(#hero) > header, .page-hero > *").forEach((el, i) => {
    if (!el.hasAttribute("data-elevate") && !el.hasAttribute("data-reveal")) {
      el.setAttribute("data-elevate", "up");
      el.style.setProperty("--e-d", Math.min(i * 0.05, 0.3) + "s");
    }
  });
  // Stagger groups: children rise in sequence.
  $$("[data-elevate-stagger]").forEach((g) => {
    [...g.children].forEach((el, i) => {
      if (!el.hasAttribute("data-elevate")) {
        el.setAttribute("data-elevate", "up");
        el.style.setProperty("--e-d", Math.min(i * 0.08, 0.8) + "s");
      }
    });
  });
  const targets = $$("[data-elevate]");
  if (targets.length && !reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("is-in"));
  }

  /* ---------- 3. nav intelligence: REVOKED (v3.1.3) — nav keeps base
     always-visible behavior; no is-scrolled / nav-hidden classes. ---------- */

  /* ---------- 4. magnetic buttons + tilt cards (fine pointers) ---------- */
  if (finePointer && !reduced) {
    $$(".btn--accent, .e-top").filter((el) => !el.closest(".site-nav")).forEach((el) => {
      const strength = 0.28;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * strength).toFixed(1) + "px");
        el.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * strength).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 10).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- 5. animated counters ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const run = (el) => {
      const end = parseFloat(el.dataset.count), dec = el.dataset.decimals ? 1 : 0;
      const suffix = el.dataset.suffix || "", dur = 1400, t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = (end * e).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      reduced ? (el.textContent = end + suffix) : requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window && !reduced) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.5 });
      counters.forEach((c) => io.observe(c));
    } else counters.forEach(run);
  }

  /* ---------- 6. scroll spy: REVOKED (v3.1.3) with the nav revoke. ---------- */

  /* ---------- 7. back to top ---------- */
  const top = document.createElement("button");
  top.className = "e-top"; top.type = "button"; top.setAttribute("aria-label", "Back to top");
  top.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3M3.5 8.5 9 3l5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(top);
  addEventListener("scroll", rAF(() => top.classList.toggle("show", scrollY > innerHeight * 0.9)), { passive: true });
  top.addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));

  /* ---------- 8. cursor glow ---------- */
  if (finePointer && !reduced) {
    const g = document.createElement("div");
    g.className = "e-glow"; g.setAttribute("aria-hidden", "true");
    document.body.appendChild(g);
    let x = innerWidth / 2, y = innerHeight / 3, tx = x, ty = y, shown = false;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; g.classList.add("on"); }
    }, { passive: true });
    (function follow() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      g.style.transform = `translate3d(${x - 260}px, ${y - 260}px, 0)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- 9. hero parallax (portrait drifts subtly) ---------- */
  const portrait = $(".hp-hero__portrait");
  if (hero && portrait && !reduced) {
    const onScroll = () => {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        portrait.style.translate = `0 ${(scrollY * -0.06).toFixed(1)}px`;
      }
    };
    addEventListener("scroll", rAF(onScroll), { passive: true });
  }
  /* ---------- 10. current-page indication: REVOKED (v3.1.3) with the nav
     revoke; hardcoded aria-current in markup (pre-existing) is untouched. --- */

  /* ---------- 11. form error identification + success focus (P1-b) ----------
     Enhances the booking form's .is-invalid/.is-flagged states with text
     errors (WCAG 3.3.1), aria-invalid/describedby wiring, and focus
     management — without touching the form's own validation engine. */
  const eForm = $("#contactForm");
  if (eForm) {
    const msgs = {
      cfName: "Please enter your name.",
      cfEmail: "Please enter a valid email address.",
      cfMobile: "Please enter a valid mobile number.",
      cfPhoneWrap: "Please enter a valid mobile number.",
      dateTrigger: "Please choose a date for your intro call.",
      tslots: "Please choose a preferred time slot.",
    };
    const errId = (el) => "e-err-" + (el.id || "field");
    const ensureErr = (el) => {
      el.setAttribute("aria-invalid", "true");
      const id = errId(el);
      if (!document.getElementById(id)) {
        const p = document.createElement("p");
        p.className = "e-field-error"; p.id = id; p.setAttribute("role", "alert");
        p.textContent = msgs[el.id] || "Please complete this field.";
        el.insertAdjacentElement("afterend", p);
        const d = (el.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
        if (!d.includes(id)) { d.push(id); el.setAttribute("aria-describedby", d.join(" ")); }
      }
    };
    const clearErr = (el) => {
      el.removeAttribute("aria-invalid");
      const id = errId(el);
      const n = document.getElementById(id);
      if (n) n.remove();
      const d = (el.getAttribute("aria-describedby") || "").split(" ").filter((x) => x && x !== id);
      d.length ? el.setAttribute("aria-describedby", d.join(" ")) : el.removeAttribute("aria-describedby");
    };
    let focusing = false;
    new MutationObserver((muts) => {
      muts.forEach((m) => {
        const t = m.target;
        if (!(t instanceof Element)) return;
        const bad = t.classList.contains("is-invalid") || t.classList.contains("is-flagged");
        if (bad && msgs[t.id]) ensureErr(t);
        else if (!bad && msgs[t.id]) clearErr(t);
      });
      const firstBad = eForm.querySelector(".is-invalid, .is-flagged");
      if (firstBad && !focusing) {
        focusing = true;
        // non-field flagged groups (slot box, phone wrap) need a tabindex to receive focus
        if (!/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(firstBad.tagName)) firstBad.setAttribute("tabindex", "-1");
        setTimeout(() => { firstBad.focus({ preventScroll: true }); focusing = false; }, 450);
      }
    }).observe(eForm, { attributes: true, subtree: true, attributeFilter: ["class"] });

    const done = $("#bookDone");
    if (done) {
      new MutationObserver(() => {
        if (done.hidden) return;
        const h = done.querySelector("h2, h3") || done;
        h.setAttribute("tabindex", "-1");
        setTimeout(() => h.focus({ preventScroll: true }), 450);
      }).observe(done, { attributes: true, attributeFilter: ["hidden"] });
    }
  }

  /* ---------- 12. nav material state (v3.2.0) ----------
     Visual-only scroll state (nav NEVER hides — base intent + Apple
     behavior) + resize guard that closes the mobile menu when the
     viewport grows back to desktop. */
  const eNav = $(".site-nav");
  if (eNav) {
    const onNavScroll = () => eNav.classList.toggle("is-scrolled", scrollY > 24);
    addEventListener("scroll", rAF(onNavScroll), { passive: true });
    onNavScroll();
  }
  const eMenu = $("#mobileMenu");
  const eMenuClose = $("#mobileClose");
  if (eMenu && eMenuClose) {
    const deskMQ = matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => { if (deskMQ.matches && !eMenu.hidden) eMenuClose.click(); };
    if (deskMQ.addEventListener) deskMQ.addEventListener("change", closeOnDesktop);
    addEventListener("resize", rAF(closeOnDesktop), { passive: true });
  }

  /* ---------- 13. intelligent nav visibility (v3.3.1) ----------
     Hide on meaningful scroll DOWN, show on meaningful scroll UP.
     Peak/valley hysteresis on scroll POSITION (not per-event deltas):
     immune to event granularity and direction jitter — slow trackpads,
     shaky fingers and 120Hz micro-slices behave identically to fast
     swipes. v3.3.0's delta accumulator dropped sub-2px deltas and reset
     on every reversal, so slow realistic scrolling never hid the nav.
     Same thresholds/overrides: FOCUS + MENU + HOVER force VISIBLE. */
  const vNav = document.querySelector(".site-nav");
  if (vNav) {
    const HIDE_AFTER = 16; // net downward travel from valley before hiding
    const SHOW_AFTER = 8;  // net upward travel from peak before showing
    const TOP_Y = 4;       // at/below this scroll depth → always visible
    const TOP_LOCK = 140;  // never hide above this depth (no instant vanish)
    let hidden = false;
    let valley = window.scrollY || 0; // lowest y seen while visible
    let peak = valley;                // highest y seen while hidden
    let focusWithin = false, menuOpen = false, hovering = false;
    const apply = (hide) => {
      if (hide === hidden) return;
      hidden = hide;
      vNav.classList.toggle("nav-hidden", hide);
    };
    const sync = () => { valley = peak = window.scrollY || 0; };
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y <= TOP_Y) { sync(); apply(false); return; }
      if (focusWithin || menuOpen) { sync(); apply(false); return; }
      if (!hidden) {
        if (y < valley) valley = y;         // new low → rebase, never punish
        if (hovering) { valley = y; return; } // never hide mid-interaction
        if (y - valley >= HIDE_AFTER && y > TOP_LOCK) { apply(true); peak = y; }
      } else {
        if (y > peak) peak = y;             // new high → rebase, never punish
        if (peak - y >= SHOW_AFTER) { apply(false); valley = y; }
      }
    };
    vNav.addEventListener("focusin", () => { focusWithin = true; sync(); apply(false); });
    vNav.addEventListener("focusout", () => { focusWithin = false; sync(); });
    const vInner = vNav.querySelector(".site-nav__inner");
    if (vInner) {
      vInner.addEventListener("pointerenter", () => { hovering = true; });
      vInner.addEventListener("pointerleave", () => { hovering = false; sync(); });
    }
    const vMenu = document.getElementById("mobileMenu");
    if (vMenu) {
      menuOpen = !vMenu.hidden;
      new MutationObserver(() => {
        menuOpen = !vMenu.hidden;
        sync();
        if (menuOpen) apply(false);
      }).observe(vMenu, { attributes: true, attributeFilter: ["hidden"] });
    }
    window.addEventListener("scroll", rAF(onScroll), { passive: true });
    onScroll(); // clean initial state: visible at top on every page load
  }
})();
