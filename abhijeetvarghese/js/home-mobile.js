/* ==========================================================================
   AV — HOME MOBILE / TABLET MOTION LAYER  ·  v2.0.0
   --------------------------------------------------------------------------
   Touch-only choreography for the homepage (body.home-arena, ≤1080px):
     1. Featured-work reel — vertical scroll steps through the three case
        plates; the pan is QUANTISED so every plate settles perfectly
        centred and fully inside the viewport (complete artwork, never
        cropped), gliding between rests with a self-terminating ease.
     2. Capabilities deck — covered plates compress and dim (--squash).
     3. Journey spine — the hairline draws itself; era nodes ignite.
     4. Footer closing chapter — scenes ignite (.is-in) as they enter.
     5. Menu stagger indices.
   One rAF-throttled scroll handler serves 1–3. Everything degrades to a
   static stacked composition without JS, with reduced motion, on squat
   landscape viewports, or above the touch tier.
   ========================================================================== */
(() => {
  "use strict";
  if (!document.body.classList.contains("home-arena")) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touchMQ = matchMedia("(max-width: 700px)");   /* MOBILE only — tablet+ stays original */
  const squatMQ = matchMedia("(max-width: 700px) and (max-height: 560px) and (orientation: landscape)");

  /* ------------------------------------------------ menu stagger indices */
  $$(".mobile-menu__list li").forEach((li, i) => li.style.setProperty("--mi", i));

  /* ------------------------------------------------------------- elements */
  const workSec = $("#work");
  const workStage = $(".work-stage", workSec || document);
  const workFilm = $("#workFilm");
  const cases = workFilm ? $$(".case", workFilm) : [];
  const hudNum = $("#workHudNum");
  const hudBar = $("#workHudBar");
  const capCards = $$(".cap-list .cap");
  const journeyTrack = $("#journeyTrack");
  const journeyEras = journeyTrack ? $$(".era", journeyTrack) : [];
  const journeyBar = $("#journeyBar");
  const journeyNum = $("#journeyBarNum");

  /* --------------------------------------------------------- reel arming */
  let pinOn = false;
  const armPin = () => {
    const on = touchMQ.matches && !reduced && !squatMQ.matches && !!workFilm;
    if (on === pinOn) return;
    pinOn = on;
    document.body.classList.toggle("hm-pin", on);
    if (!on && workFilm) {
      workFilm.style.transform = "";
      cases.forEach(c => { c.classList.remove("is-active"); c.style.removeProperty("--work-px"); });
      if (hudBar) hudBar.style.transform = "scaleX(0.001)";
      if (workSec) workSec.style.removeProperty("--work-runway");
      wCur = wTarget = 0;
    }
    measure();
  };

  /* ------------------------------------------- nav ink tier (light/dark)
     The floating instrument crosses light and dark chapters; the tier under
     it decides its ink. Zones are cached offsets, refreshed with measures. */
  const siteNav = $(".site-nav");
  let tierZones = [];
  const measureTiers = () => {
    tierZones = $$("#main > section, #main > div > section, footer.footer--arena").map(el => ({
      top: docY(el), bot: docY(el) + el.offsetHeight, light: el.classList.contains("t-light")
    }));
  };

  /* -------------------------------------------------------------- measures
     Plate centres are measured with the film untransformed; each plate's
     rest shift puts its centre on the stage centre. Symmetric film padding
     (CSS) makes the first and last rests exact.                           */
  let wPinStart = 0, wShift = 1, wStageW = 0, wPinLen = 1;
  let wRests = [0];
  let wCur = 0, wTarget = 0, wRaf = 0;
  const docY = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
  const setFilm = x => { workFilm.style.transform = "translate3d(" + (-x).toFixed(1) + "px,0,0)"; };
  const measure = () => {
    if (pinOn && workSec && workFilm && workStage) {
      wStageW = workFilm.clientWidth || workSec.clientWidth;
      wShift = Math.max(workFilm.scrollWidth - wStageW, 1);
      wPinStart = docY(workStage);
      const prev = workFilm.style.transform;
      workFilm.style.transform = "none";
      const fr = workFilm.getBoundingClientRect();
      wRests = cases.map(c => {
        const r = c.getBoundingClientRect();
        return clamp(wStageW / 2 - (r.left - fr.left + r.width / 2), -wShift, 0) * -1;
      });
      workFilm.style.transform = prev;
      /* one held beat of scroll per plate, plus a closing breath */
      const step = clamp(innerHeight * 0.9, 440, 980);
      wPinLen = Math.max((cases.length - 1) * step + innerHeight * 0.5, 1);
      const runway = (wPinStart - docY(workSec)) + wPinLen + innerHeight;
      workSec.style.setProperty("--work-runway", runway.toFixed(0) + "px");
    } else if (workSec) {
      workSec.style.removeProperty("--work-runway");
    }
    measureTiers();
  };

  /* the glide: eases toward the active rest, then stops (no idle loops) */
  const settle = () => {
    wRaf = 0;
    const d = wTarget - wCur;
    if (Math.abs(d) < 0.4) { wCur = wTarget; setFilm(wCur); return; }
    wCur += d * 0.14;
    setFilm(wCur);
    wRaf = requestAnimationFrame(settle);
  };

  /* ------------------------------------------------------- journey ignite */
  let litCount = 0;
  if (journeyEras.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting || e.target.classList.contains("is-lit")) return;
        e.target.classList.add("is-lit");
        litCount++;
        if (journeyNum) journeyNum.textContent = String(litCount).padStart(2, "0") + " / " + String(journeyEras.length).padStart(2, "0");
        if (journeyBar) journeyBar.style.transform = "scaleX(" + (litCount / journeyEras.length).toFixed(3) + ")";
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    journeyEras.forEach(e => io.observe(e));
  }

  /* ------------------------------------------------- footer scene ignite */
  if ("IntersectionObserver" in window && touchMQ.matches) {
    const fio = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        fio.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    $$(".footer--arena .footer__inner, .footer--arena .footer__line, .footer--arena .footer__links a[href=\"/contact/\"], .footer--arena .footer__brandtop")
      .forEach(el => fio.observe(el));
  }

  /* -------------------------------------------------------- frame handler */
  let curTier = "";
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;

    /* 0 — nav ink tier (mobile instrument only) */
    if (siteNav && tierZones.length && touchMQ.matches) {
      const probe = y + 40;
      let light = false;
      for (const z of tierZones) if (probe >= z.top && probe < z.bot) { light = z.light; break; }
      const t = light ? "light" : "dark";
      if (t !== curTier) { curTier = t; siteNav.setAttribute("data-tier", t); }
    }

    /* 1 — the reel: quantised pan while the stage is pinned */
    if (pinOn && workFilm && cases.length) {
      const p = clamp((y - wPinStart) / wPinLen, 0, 1);
      const pos = p * (cases.length - 1);
      const q = clamp(Math.round(pos), 0, cases.length - 1);
      wTarget = wRests[q] || 0;
      if (!wRaf && Math.abs(wTarget - wCur) >= 0.4) wRaf = requestAnimationFrame(settle);
      const f = clamp(pos - q, -0.5, 0.5);
      cases.forEach((c, i) => {
        c.classList.toggle("is-active", i === q);
        c.style.setProperty("--work-px", (i === q ? (-f * 18).toFixed(1) : "0") + "px");
      });
      if (hudNum) hudNum.textContent = String(q + 1).padStart(2, "0");
      if (hudBar) hudBar.style.transform = "scaleX(" + Math.max(p, 0.001).toFixed(3) + ")";
    }

    /* 2 — the deck: how much of each plate the next one has covered */
    if (touchMQ.matches) for (let i = 0; i < capCards.length - 1; i++) {
      const r = capCards[i].getBoundingClientRect();
      const n = capCards[i + 1].getBoundingClientRect();
      capCards[i].style.setProperty("--squash", clamp((r.bottom - n.top) / Math.max(r.height, 1), 0, 1).toFixed(3));
    }

    /* 3 — the spine */
    if (journeyTrack && touchMQ.matches) {
      const r = journeyTrack.getBoundingClientRect();
      journeyTrack.style.setProperty("--spine", clamp((vh * 0.7 - r.top) / Math.max(r.height, 1), 0, 1).toFixed(3));
    }
  };

  let ticking = false;
  const wake = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };

  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", () => { measure(); wake(); }, { passive: true });
  touchMQ.addEventListener?.("change", () => { armPin(); wake(); });
  squatMQ.addEventListener?.("change", () => { armPin(); wake(); });
  addEventListener("load", () => { measure(); wake(); }, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(() => { measure(); wake(); }).observe(document.documentElement);
  if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); wake(); });

  /* QA hook — lets the visual harness jump to each plate's resting state */
  window.__avWork = () => ({ pinStart: wPinStart, pinLen: wPinLen, rests: wRests, stageW: wStageW, pinOn });

  /* date sheet: the touch backdrop is the overlay itself — a tap on it (not its
     children) closes the sheet through the existing trigger plumbing */
  const datePop = document.getElementById("datePop");
  const dateTrigger = document.getElementById("dateTrigger");
  if (datePop && dateTrigger) {
    datePop.addEventListener("click", (e) => {
      if (e.target === datePop && touchMQ.matches && datePop.classList.contains("is-open")) dateTrigger.click();
    });
  }

  armPin();
  measure();
  onScroll();
})();
