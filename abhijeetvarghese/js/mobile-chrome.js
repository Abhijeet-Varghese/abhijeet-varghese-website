/* ========================================================================
   AV — SHARED MOBILE CHROME
   ------------------------------------------------------------------------
   Applies the existing homepage mobile menu/footer choreography to inner
   pages. It intentionally does not alter the menu or footer markup.
   ======================================================================== */
(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const touchMQ = window.matchMedia("(max-width: 700px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Match the established homepage menu entrance cadence. */
  $$(".mobile-menu__list li").forEach((item, index) => {
    item.style.setProperty("--mi", String(index));
  });

  /* The original home chrome changes its ink as it crosses a light chapter.
     Apply the same non-invasive behaviour on pages which use .t-light. */
  const siteNav = $(".site-nav");
  let tierZones = [];

  const docY = (element) => {
    let top = 0;
    let current = element;
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent;
    }
    return top;
  };

  const measureTiers = () => {
    tierZones = $$("#main > section, #main > article > section, #main > div > section, footer.footer--arena")
      .map((element) => ({
        top: docY(element),
        bottom: docY(element) + element.offsetHeight,
        light: element.classList.contains("t-light"),
      }));
  };

  let currentTier = "";
  const updateTier = () => {
    if (!siteNav || !touchMQ.matches || !tierZones.length) return;
    const probe = window.scrollY + 40;
    let light = false;
    for (const zone of tierZones) {
      if (probe >= zone.top && probe < zone.bottom) {
        light = zone.light;
        break;
      }
    }
    const nextTier = light ? "light" : "dark";
    if (nextTier !== currentTier) {
      currentTier = nextTier;
      siteNav.setAttribute("data-tier", nextTier);
    }
  };

  /* Recreate the homepage footer's on-enter scene trigger. With reduced
     motion or no IntersectionObserver support, show all scenes immediately. */
  const revealFooterScenes = () => {
    if (!touchMQ.matches) return;
    const targets = $$(
      ".footer--arena .footer__inner, .footer--arena .footer__line, .footer--arena .footer__links a[href='/contact/'], .footer--arena .footer__brandtop"
    );
    if (!targets.length) return;

    const reveal = (element) => element.classList.add("is-in");
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    targets.forEach((target) => {
      if (!target.classList.contains("is-in")) observer.observe(target);
    });
  };

  let ticking = false;
  const wake = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateTier();
    });
  };

  const measure = () => {
    measureTiers();
    wake();
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("load", measure, { passive: true });
  touchMQ.addEventListener?.("change", () => {
    measure();
    revealFooterScenes();
  });

  if (document.fonts?.ready) document.fonts.ready.then(measure);
  measure();
  revealFooterScenes();
})();
