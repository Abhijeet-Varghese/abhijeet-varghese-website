/* ============================================================
   ABHIJEET VARGHESE — interaction layer
   Reveals, parallax, contextual back, booking, Evolution stack.
   ============================================================ */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  document.documentElement.classList.add("js", "js-ok");
  document.body.classList.add("is-ready");

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Contextual origin / close ---------- */
  const ORIGIN_KEY = "avos:nav-origin";
  const RESTORE_KEY = "avos:nav-restore";

  const readJSON = key => {
    try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
  };
  const writeJSON = (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  };

  const snapshotOrigin = () => {
    let section = "";
    for (const el of $$("main [id], section[id]")) {
      if (el.getBoundingClientRect().top <= 140) section = el.id;
    }
    return {
      path: location.pathname + location.search,
      href: location.href,
      hash: location.hash,
      y: Math.round(window.scrollY || 0),
      section,
      t: Date.now()
    };
  };

  const restore = readJSON(RESTORE_KEY);
  if (restore) {
    sessionStorage.removeItem(RESTORE_KEY);
    const apply = () => {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      if (restore.section) {
        const el = document.getElementById(restore.section);
        if (el) { el.scrollIntoView(); root.style.scrollBehavior = prev; return; }
      }
      if (typeof restore.y === "number") window.scrollTo(0, restore.y);
      root.style.scrollBehavior = prev;
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.addEventListener("pageshow", apply, { once: true });
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    if (/calendly\.com/i.test(a.href) && !a.hasAttribute("data-schedule")) {
      e.preventDefault();
      return;
    }
    if (a.hasAttribute("data-history-close") || a.target === "_blank" || a.hasAttribute("download")) return;
    const raw = a.getAttribute("href") || "";
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
    try {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      writeJSON(ORIGIN_KEY, snapshotOrigin());
    } catch { /* ignore */ }
  });

  const pageClose = $("[data-history-close]");
  if (pageClose) {
    pageClose.addEventListener("click", event => {
      event.preventDefault();
      const origin = readJSON(ORIGIN_KEY);
      const here = location.pathname + location.search;
      let sameSiteReferrer = false;
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        sameSiteReferrer = !!referrer && referrer.origin === location.origin && referrer.href !== location.href;
      } catch { sameSiteReferrer = false; }

      if (origin && origin.path && origin.path !== here) {
        writeJSON(RESTORE_KEY, origin);
        sessionStorage.removeItem(ORIGIN_KEY);
        if (sameSiteReferrer && history.length > 1) {
          history.back();
          return;
        }
        const dest = origin.path + (origin.hash || (origin.section ? "#" + origin.section : ""));
        location.assign(dest);
        return;
      }

      if (sameSiteReferrer && history.length > 1) {
        history.back();
        return;
      }
      location.assign(pageClose.getAttribute("href") || "index.html");
    });
  }

  /* ---------- Active nav ---------- */
  const hereFile = (location.pathname.split("/").pop() || "index.html").replace(/\/$/, "") || "index.html";
  $$(".nav-links a, .mobile-menu__list a").forEach(a => {
    const file = (a.getAttribute("href") || "").split("/").pop();
    if (file && file === hereFile) a.setAttribute("aria-current", "page");
  });

  /* ---------- Booking / contact — never leave the site ---------- */
  const bookForm = $("#contactForm");
  if (bookForm) {
    bookForm.setAttribute("action", "/api/public/lead");
    bookForm.setAttribute("method", "post");

    const bookView  = $("#bookView");
    const bookDone  = $("#bookDone");
    const slotBox   = $("#tslots");
    const slotBtns  = $$(".tslot", bookForm);
    const slotHint  = $("#slotHint");
    const dateTrigger   = $("#dateTrigger");
    const dateTriggerTx = $("#dateTriggerText");
    const datePop       = $("#datePop");
    const dpGrid    = $("#dpGrid");
    const dpTitle   = $("#dpTitle");
    const dpPrev    = $("#dpPrev");
    const dpNext    = $("#dpNext");
    const fDate     = $("#cfDate");
    const summary   = $("#bookSummary");
    const summaryTx = $("#bookSummaryText");
    const cfNote    = $("#cfNote");
    const submitBtn = $("#bookSubmit");

    if (cfNote) {
      cfNote.setAttribute("role", "status");
      cfNote.setAttribute("aria-live", "polite");
    }

    let chosenSlot = null;
    let selectedDate = null;
    let dateOpen = false;
    let submitting = false;
    let availMode = "static";
    const availCache = new Map();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 4, 1);
    let viewMonth = new Date(minMonth);

    const fmtLong  = d => d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const fmtShort = d => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    const iso = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const updateSummary = () => {
      if (!summary || !summaryTx) return;
      if (selectedDate && chosenSlot) {
        summary.classList.add("is-set");
        summaryTx.innerHTML = `<strong>${fmtLong(selectedDate)} · ${chosenSlot} IST</strong>&nbsp;— optional preferred time`;
      } else if (selectedDate) {
        summary.classList.remove("is-set");
        summaryTx.innerHTML = `${fmtLong(selectedDate)} — optional; pick a time if you like`;
      } else if (chosenSlot) {
        summary.classList.remove("is-set");
        summaryTx.innerHTML = `${chosenSlot} IST — optional; pick a day if you like`;
      } else {
        summary.classList.remove("is-set");
        summaryTx.textContent = "Time is optional — send a message anytime";
      }
    };

    const openDate = () => {
      if (!datePop || !dateTrigger || dateOpen) return;
      dateOpen = true;
      datePop.hidden = false;
      dateTrigger.setAttribute("aria-expanded", "true");
      dateTrigger.classList.add("is-open");
      requestAnimationFrame(() => requestAnimationFrame(() => datePop.classList.add("is-open")));
    };
    const closeDate = () => {
      if (!datePop || !dateTrigger || !dateOpen) return;
      dateOpen = false;
      datePop.classList.remove("is-open");
      dateTrigger.setAttribute("aria-expanded", "false");
      dateTrigger.classList.remove("is-open");
      setTimeout(() => { if (!dateOpen) datePop.hidden = true; }, 320);
    };
    if (dateTrigger) {
      dateTrigger.addEventListener("click", e => {
        e.stopPropagation();
        dateOpen ? closeDate() : openDate();
      });
    }
    if (datePop) datePop.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", () => closeDate());
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDate(); });

    const renderCal = () => {
      if (!dpGrid || !dpTitle) return;
      const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
      dpTitle.textContent = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      if (dpPrev) dpPrev.disabled = viewMonth <= minMonth;
      if (dpNext) dpNext.disabled = new Date(y, m + 1, 1) >= maxMonth;
      dpGrid.innerHTML = "";
      const offset = (new Date(y, m, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < offset; i++) {
        const pad = document.createElement("span");
        pad.className = "dp-empty"; pad.setAttribute("aria-hidden", "true");
        dpGrid.appendChild(pad);
      }
      const todayISO = iso(new Date());
      const cache = availCache.get(monthKey(viewMonth));
      for (let dNum = 1; dNum <= daysInMonth; dNum++) {
        const d = new Date(y, m, dNum);
        const cell = document.createElement("button");
        cell.type = "button"; cell.className = "dp-day";
        cell.textContent = dNum; cell.setAttribute("role", "gridcell");
        if (iso(d) === todayISO) cell.classList.add("is-today");
        if (selectedDate && iso(d) === iso(selectedDate)) cell.classList.add("is-selected");
        const av = cache ? cache[iso(d)] : null;
        if (d <= today) {
          cell.disabled = true; cell.setAttribute("aria-disabled", "true");
        } else if (cache && av && av.length === 0) {
          cell.disabled = true; cell.classList.add("is-unavail");
          cell.setAttribute("aria-disabled", "true"); cell.title = "Fully booked";
        } else {
          cell.setAttribute("aria-label", fmtLong(d));
          cell.addEventListener("click", () => {
            selectedDate = d;
            if (fDate) fDate.value = iso(d);
            if (dateTriggerTx) dateTriggerTx.textContent = fmtShort(d);
            if (dateTrigger) {
              dateTrigger.classList.add("is-set");
              dateTrigger.classList.remove("is-flagged");
            }
            const pick = $(".datepick", bookForm);
            if (pick) pick.classList.remove("is-flagged");
            closeDate();
            renderCal();
            applySlotAvailability();
            updateSummary();
          });
        }
        dpGrid.appendChild(cell);
      }
    };
    if (dpPrev) dpPrev.addEventListener("click", () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      renderCal();
    });
    if (dpNext) dpNext.addEventListener("click", () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      renderCal();
    });

    const applySlotAvailability = () => {
      slotBtns.forEach(b => { b.disabled = false; b.classList.remove("is-off"); b.removeAttribute("title"); });
      if (slotHint) slotHint.textContent = "Optional — I'll confirm personally by email.";
    };
    const selectSlot = s => {
      slotBtns.forEach(x => {
        x.classList.remove("is-active");
        x.setAttribute("aria-checked", "false");
        x.tabIndex = -1;
      });
      s.classList.add("is-active");
      s.setAttribute("aria-checked", "true");
      s.tabIndex = 0;
      if (slotBox) slotBox.classList.remove("is-flagged");
      chosenSlot = s.dataset.slot;
      updateSummary();
    };
    slotBtns.forEach((s, i) => {
      s.tabIndex = i === 0 ? 0 : -1;
      s.addEventListener("click", () => { selectSlot(s); s.focus({ preventScroll: true }); });
    });

    const flagCf = (el, msg) => {
      if (!el) return;
      el.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      const host = el.closest("label") || el.parentElement;
      if (host && msg) {
        let err = host.querySelector(".cf-error");
        if (!err) {
          err = document.createElement("span");
          err.className = "cf-error";
          err.id = el.id + "-error";
          host.appendChild(err);
          el.setAttribute("aria-describedby", err.id);
        }
        err.textContent = msg;
      }
      el.addEventListener("input", () => {
        el.classList.remove("is-invalid");
        el.removeAttribute("aria-invalid");
        const err = (el.closest("label") || el.parentElement)?.querySelector(".cf-error");
        if (err) err.textContent = "";
      }, { once: true });
    };

    const setNote = (text, ok) => {
      if (!cfNote) return;
      cfNote.textContent = text;
      cfNote.classList.toggle("is-set", !!ok);
      cfNote.classList.toggle("is-error", ok === false);
    };

    const resetSubmit = () => {
      if (!submitBtn) return;
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.innerHTML = 'Send message <svg class="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg>';
    };

    const notesHref = (f, dateLabel) =>
      "mailto:hi@abhijeetvarghese.com" +
      "?subject=" + encodeURIComponent(`Message from ${f.name}${f.org ? ` (${f.org})` : ""}`) +
      "&body=" + encodeURIComponent([
        `Name: ${f.name}`,
        `Email: ${f.email}`,
        `Organization: ${f.org || "—"}`,
        dateLabel ? `Preferred time: ${dateLabel}` : "",
        f.msg ? `Message:\n${f.msg}` : ""
      ].filter(Boolean).join("\n"));

    bookForm.addEventListener("submit", async e => {
      e.preventDefault();
      e.stopPropagation();
      if (submitting) return;

      const hp = bookForm.querySelector("[name='website'], [name='company_website'], #cfWebsite");
      if (hp && hp.value) return;

      const f = {
        name: ($("#cfName")?.value || "").trim(),
        email: ($("#cfEmail")?.value || "").trim(),
        org: ($("#cfOrg")?.value || "").trim(),
        msg: ($("#cfMsg")?.value || "").trim()
      };
      let ok = true;
      if (!f.name) { flagCf($("#cfName"), "Please enter your name."); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { flagCf($("#cfEmail"), "Enter a valid email."); ok = false; }
      if (!ok) {
        const bad = bookForm.querySelector(".is-invalid") || $("#cfName");
        if (bad) bad.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
        setNote("Please complete the highlighted fields.", false);
        return;
      }

      submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        submitBtn.innerHTML = "Sending your message…";
      }
      setNote("Saving your details — one moment.");

      const slotLabel = selectedDate && chosenSlot
        ? `${fmtLong(selectedDate)} at ${chosenSlot} IST`
        : (selectedDate ? fmtLong(selectedDate) : (chosenSlot ? `${chosenSlot} IST` : ""));
      const utm = new URLSearchParams(location.search);
      const leadPayload = {
        name: f.name,
        email: f.email,
        organization: f.org,
        message: [f.msg, slotLabel ? `Preferred time: ${slotLabel}` : ""].filter(Boolean).join("\n\n"),
        project_type: slotLabel ? "intro call request" : "website message",
        source: "website",
        page: location.pathname,
        referrer: document.referrer || "",
        utm_source: utm.get("utm_source") || "",
        utm_medium: utm.get("utm_medium") || "",
        utm_campaign: utm.get("utm_campaign") || "",
        website: ""
      };

      let leadSaved = false;
      let errText = "I couldn't save the request just now. Please email hi@abhijeetvarghese.com.";
      try {
        const lr = await fetch("/api/public/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(leadPayload),
          credentials: "same-origin",
          redirect: "error"
        });
        const raw = await lr.text();
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
        if (body && (body.calendly_url || body.data?.calendly_url)) {
          /* never follow a scheduler URL from the API */
        }
        if (lr.ok && body && body.status !== "spam") leadSaved = true;
        else if (lr.status === 429) errText = "Too many submissions — please try again in a few minutes, or email hi@abhijeetvarghese.com.";
        else if (body && (body.error || body.message)) errText = String(body.error || body.message);
      } catch {
        leadSaved = false;
      }

      submitting = false;
      if (!leadSaved) {
        resetSubmit();
        setNote(errText, false);
        return;
      }

      const doneSummary = $("#doneSummary");
      const doneMail = $("#doneMail");
      if (doneSummary) {
        doneSummary.textContent = slotLabel
          ? `Thanks${f.name ? `, ${f.name}` : ""}. Your message and preferred time (${slotLabel}) are saved.`
          : `Thanks${f.name ? `, ${f.name}` : ""}. Your message is saved — I'll reply by email within 24 hours.`;
      }
      if (doneMail) {
        doneMail.href = notesHref(f, slotLabel);
        doneMail.textContent = f.msg ? "Send additional context" : "Send a note by email";
      }
      const doneNote = $(".book__done-note");
      if (doneNote) {
        doneNote.textContent = slotLabel
          ? "I'll confirm the requested time by email within 24 hours."
          : "I'll reply personally by email within 24 hours.";
      }
      if (bookView) bookView.hidden = true;
      if (bookDone) {
        bookDone.hidden = false;
        bookDone.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      }
      resetSubmit();
      setNote("Message saved on this site — no external calendar opened.", true);
    });

    const again = $("#bookAgain");
    if (again) again.addEventListener("click", () => {
      submitting = false;
      resetSubmit();
      bookForm.reset();
      chosenSlot = null; selectedDate = null;
      slotBtns.forEach((s, i) => {
        s.classList.remove("is-active", "is-off");
        s.disabled = false;
        s.tabIndex = i === 0 ? 0 : -1;
      });
      if (slotBox) slotBox.classList.remove("is-flagged");
      if (dateTrigger) dateTrigger.classList.remove("is-set", "is-flagged");
      if (dateTriggerTx) dateTriggerTx.textContent = "Choose a date";
      closeDate();
      $$(".is-invalid", bookForm).forEach(el => el.classList.remove("is-invalid"));
      $$(".cf-error", bookForm).forEach(el => { el.textContent = ""; });
      viewMonth = new Date(minMonth);
      renderCal(); applySlotAvailability(); updateSummary();
      setNote("Your message stays on this site. Time is optional.");
      if (bookDone) bookDone.hidden = true;
      if (bookView) bookView.hidden = false;
    });

    renderCal();
    applySlotAvailability();
    updateSummary();
  }

  /* ---------- Stagger delays ---------- */
  $$("[data-reveal-group]").forEach(group => {
    const base = parseFloat(group.dataset.dbase || "0");
    $$("[data-reveal]", group).forEach((el, i) => {
      el.style.setProperty("--d", `${(base + Math.min(i * 0.06, 0.6)).toFixed(2)}s`);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("in-view"));
  } else {
    const revealIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          revealIO.unobserve(e.target);
        }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(el => revealIO.observe(el));
    setTimeout(() => {
      const vh = window.innerHeight;
      revealEls.filter(el => !el.classList.contains("in-view")).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add("in-view");
      });
    }, 1400);
  }

  /* ---------- Shared rAF scroll loop ---------- */
  const nav = $("#siteNav");
  const progress = $("#progress");
  let ticking = false;

  const parallaxEls = $$("[data-parallax]").map(el => {
    const img = el.querySelector("img");
    const requested = Number.parseFloat(el.dataset.parallax);
    const speed = Number.isFinite(requested) ? requested : 0.05;
    if (speed === 0) {
      if (img) { img.style.willChange = "auto"; img.style.scale = "1"; img.style.transform = "none"; }
      return null;
    }
    if (img) { img.style.willChange = "transform"; img.style.scale = "1.13"; }
    return { el, target: img || el, speed };
  }).filter(Boolean);

  const journeySec  = $("#journey");
  const journeyPin  = $("#journeyPin");
  const journeyTrack = $("#journeyTrack");
  const journeyBar  = $("#journeyBar");
  const journeyBarNum = $("#journeyBarNum");
  const journeyMQ   = window.matchMedia("(min-width: 901px)");
  const heroEl = $("#hero");
  const expTimeline = $("#expTimeline");
  const aboutPage = document.body.classList.contains("about-page");
  const arenaRoot = document.body.classList.contains("home-arena");

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("is-visible", y > 90);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }

    if (!prefersReduced) {
      const vh = window.innerHeight;
      for (const p of parallaxEls) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const center = r.top + r.height / 2 - vh / 2;
        p.target.style.transform = `translate3d(0, ${(center * p.speed).toFixed(2)}px, 0)`;
      }
    }

    if (journeySec && journeyPin && journeyTrack) {
      if (journeyMQ.matches && !prefersReduced) {
        const total = journeySec.offsetHeight - window.innerHeight;
        const r = journeySec.getBoundingClientRect();
        const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0;
        const maxShift = Math.max(journeyTrack.scrollWidth - journeyPin.clientWidth + 40, 0);
        journeyTrack.style.transform = `translate3d(${(-p * maxShift).toFixed(1)}px, 0, 0)`;
        if (journeyBar) journeyBar.style.transform = `scaleX(${p.toFixed(3)})`;
        if (journeyBarNum) {
          const eraCount = Math.max(journeyTrack.children.length, 1);
          const era = String(Math.min(eraCount, Math.round(p * (eraCount - 1)) + 1)).padStart(2, "0");
          const eraTotal = String(eraCount).padStart(2, "0");
          const next = era + " / " + eraTotal;
          if (journeyBarNum.textContent !== next) journeyBarNum.textContent = next;
        }
      } else {
        journeyTrack.style.transform = "";
        if (journeyBar) journeyBar.style.transform = "";
      }
    }

    if (heroEl) heroEl.classList.toggle("is-past", y > window.innerHeight * 0.28);

    if (expTimeline) {
      const r = expTimeline.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(Math.max((vh * 0.9 - r.top) / (r.height * 0.6), 0), 1);
      document.body.classList.toggle("exp-scrolled", p > 0.02);
      expTimeline.style.setProperty("--exp-fill", p.toFixed(3));
    }

    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(onScroll), { passive: true });
  journeyMQ.addEventListener?.("change", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const navToggle = $("#navToggle");
  const mobileMenu = $("#mobileMenu");
  const mobileMQ = window.matchMedia("(max-width: 900px)");
  if (navToggle && mobileMenu) {
    let menuReturnFocus = null;
    const menuFocusable = () => $$("a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])", mobileMenu)
      .filter(el => !el.hidden && el.getClientRects().length);
    const setMenu = open => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (open === isOpen) return;
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        menuReturnFocus = document.activeElement;
        mobileMenu.hidden = false;
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => requestAnimationFrame(() => mobileMenu.classList.add("is-open")));
        const first = menuFocusable()[0];
        if (first) first.focus({ preventScroll: true });
      } else {
        mobileMenu.classList.remove("is-open");
        document.body.style.overflow = "";
        setTimeout(() => { if (!mobileMenu.classList.contains("is-open")) mobileMenu.hidden = true; }, 450);
        if (menuReturnFocus && typeof menuReturnFocus.focus === "function") menuReturnFocus.focus({ preventScroll: true });
      }
    };
    navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
    const mobileClose = $("#mobileClose");
    if (mobileClose) mobileClose.addEventListener("click", () => setMenu(false));
    $$("a", mobileMenu).forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { setMenu(false); return; }
      if (e.key === "Tab" && navToggle.getAttribute("aria-expanded") === "true") {
        const items = menuFocusable();
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    mobileMQ.addEventListener?.("change", () => { if (!mobileMQ.matches) setMenu(false); });
  }

  /* ---------- Experience extras ---------- */
  $$(".exp-job__more").forEach(btn => {
    const list = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (list) list.hidden = open;
    });
  });

  if (arenaRoot || aboutPage) {
    document.body.classList.toggle("arena-reduce", prefersReduced);
    if (aboutPage) document.body.classList.toggle("about-reduce", prefersReduced);
  }

  /* ---------- ABOUT only — never run this stack on other pages ---------- */
  if (!aboutPage) return;

  const INTERACTIVE = "a, button, [role='button'], summary";
  document.addEventListener("pointerdown", e => {
    const t = e.target.closest(INTERACTIVE);
    if (t) t.classList.add("is-pressing");
  }, { passive: true });
  const pressClear = e => {
    const t = e.target.closest(INTERACTIVE);
    if (t) t.classList.remove("is-pressing");
  };
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev =>
    document.addEventListener(ev, pressClear, { passive: true }));

  const statNums = $$(".about-frame__num strong[data-count]");
  if (statNums.length) {
    const statsIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        statsIO.unobserve(e.target);
        const target = parseInt(e.target.dataset.count, 10) || 0;
        const numEl = e.target.querySelector(".about-frame__num-val") || e.target;
        if (prefersReduced || target <= 0) { numEl.textContent = String(target); return; }
        const t0 = performance.now();
        const dur = 1100;
        const step = now => {
          const p = Math.min((now - t0) / dur, 1);
          numEl.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    statNums.forEach(s => statsIO.observe(s));
  }

  const mqTracks = $$(".about-prologue__mq-track");
  if (mqTracks.length) {
    const mqGate = new IntersectionObserver(es => {
      es.forEach(e => { e.target.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
    }, { threshold: 0.02 });
    mqTracks.forEach(t => mqGate.observe(t));
  }

  const pl = document.getElementById("prologue");
  const plLines = pl ? $$(".about-prologue__line", pl) : [];
  const heroDepth = [-0.055, -0.095, -0.14];
  const portrait = document.querySelector(".about-frame__portrait img");
  const zoomStage = document.getElementById("aboutZoomStage");
  const zoomFrame = document.getElementById("aboutZoomFrame");
  const zoomLabels = $$("#aboutZoomLabels li");
  const g1 = document.getElementById("aboutZoomGhost1");
  const g2 = document.getElementById("aboutZoomGhost2");
  const envSections = [
    [".about-frame", "light"], [".about-acts", "dark"], [".about-interlude", "dark"],
    [".about-what", "light"], [".about-now", "dark"], [".about-curious", "light"], [".about-credits", "light"],
  ].map(([sel, env]) => ({ el: document.querySelector(sel), env })).filter(x => x.el);

  const onAboutChrome = () => {
    const y = window.scrollY, vh = window.innerHeight;
    if (plLines.length && !prefersReduced) {
      if (y < vh * 1.3) {
        plLines.forEach((ln, i) => { ln.style.transform = `translate3d(0, ${(y * (heroDepth[i] ?? -0.14)).toFixed(1)}px, 0)`; });
      } else {
        plLines.forEach(ln => { ln.style.transform = ""; });
      }
    }
    if (portrait && !prefersReduced) {
      const r = portrait.getBoundingClientRect();
      if (r.bottom >= 0 && r.top <= vh) {
        const p = clamp((vh * 0.6 - r.top) / (r.height + vh * 0.6), 0, 1);
        portrait.style.transform = `scale(1.06) translate3d(0, ${(-5 + p * 10).toFixed(1)}px, 0)`;
      }
    }
    if (zoomStage && zoomFrame && !prefersReduced) {
      const r = zoomStage.getBoundingClientRect();
      const p = clamp((vh * 0.62 - r.top) / (r.height * 0.9 + vh * 0.4), 0, 1);
      zoomFrame.style.setProperty("--zp", p.toFixed(3));
      const stage = Math.min(Math.floor(p * 4) + 1, 4);
      zoomLabels.forEach((l, i) => l.classList.toggle("is-on", i + 1 <= stage));
      if (g1) { g1.style.opacity = Math.max(0, (p - 0.4) * 0.5).toFixed(3); g1.style.transform = `scale(${(1.06 + p * 0.12).toFixed(3)})`; }
      if (g2) { g2.style.opacity = Math.max(0, (p - 0.72) * 0.5).toFixed(3); g2.style.transform = `scale(${(1.02 + p * 0.2).toFixed(3)})`; }
    }
    if (envSections.length) {
      const vw = window.innerWidth;
      let best = null, bestArea = 0;
      for (const { el, env } of envSections) {
        const r = el.getBoundingClientRect();
        const w = Math.min(r.right, vw) - Math.max(r.left, 0);
        const h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        const area = Math.max(w, 0) * Math.max(h, 0);
        if (area > bestArea) { best = env; bestArea = area; }
      }
      if (best) document.body.dataset.env = best;
    }
  };
  let aboutChromeTick = false;
  const requestAboutChrome = () => {
    if (aboutChromeTick) return;
    aboutChromeTick = true;
    requestAnimationFrame(() => { onAboutChrome(); aboutChromeTick = false; });
  };
  window.addEventListener("scroll", requestAboutChrome, { passive: true });
  window.addEventListener("resize", requestAboutChrome, { passive: true });
  onAboutChrome();

  /* Evolution — 3D film stack (compositor-only, sleeps offscreen) */
  const atmo = document.getElementById("aboutAtmo");
  const worldRGB = {
    motion: [77, 141, 255], interaction: [0, 183, 212], environment: [139, 124, 246],
    experience: [230, 170, 60], people: [232, 112, 90], leadership: [140, 134, 168],
    interlude: [110, 168, 255],
  };
  let lastAtmo = "";
  const setAtmo = world => {
    if (!atmo) return;
    let css;
    if (!world) {
      css = "radial-gradient(900px 620px at 50% 4%, rgba(77,141,255,0.13), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(77,141,255,0.07), transparent 60%)";
    } else {
      const w = worldRGB[world] || worldRGB.motion;
      css = `radial-gradient(900px 620px at 50% 4%, rgba(${w[0]},${w[1]},${w[2]},0.16), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(${Math.round(w[0] * 0.6)},${Math.round(w[1] * 0.6)},${Math.round(w[2] * 0.6)},0.09), transparent 60%)`;
    }
    if (css !== lastAtmo) { atmo.style.background = css; lastAtmo = css; }
  };

  const compass = document.getElementById("aboutCompass");
  const compassBtn = document.getElementById("aboutCompassBtn");
  const compassList = document.getElementById("aboutCompassList");
  const compassNum = document.getElementById("aboutCompassNum");
  const compassName = document.getElementById("aboutCompassName");
  const prologue = document.getElementById("prologue");
  if (compass && prologue) {
    const compassIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          compass.classList.remove("is-show");
          compass.hidden = true;
        } else {
          compass.hidden = false;
          requestAnimationFrame(() => compass.classList.add("is-show"));
        }
      }
    }, { threshold: 0 });
    compassIO.observe(prologue);
  }

  if (compassBtn && compassList) {
    const openList = () => {
      compassBtn.setAttribute("aria-expanded", "true");
      compassList.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => compassList.classList.add("is-show")));
    };
    const closeList = () => {
      compassBtn.setAttribute("aria-expanded", "false");
      compassList.classList.remove("is-show");
      compassList.classList.add("is-closing");
      setTimeout(() => {
        if (!compassList.classList.contains("is-show")) compassList.hidden = true;
        compassList.classList.remove("is-closing");
      }, 240);
    };
    compassBtn.addEventListener("click", () => {
      if (compassBtn.getAttribute("aria-expanded") === "true") closeList();
      else openList();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !compassList.hidden) {
        closeList();
        compassBtn.focus();
      }
    });
  }

  const evo3d = $(".about-evo3d");
  const evo3dScroll = $(".about-evo3d__scroll");
  const evo3dCards = $$(".about-evo3d__card");
  const evo3dImages = $$(".about-evo3d__card .about-evo3d__image");
  const evo3dCamera = $(".about-evo3d__camera");
  const cardNames = evo3dCards.map(card => {
    const meta = card.querySelector(".about-evo3d__meta span:last-child");
    return meta ? meta.textContent.trim() : "";
  });

  if (compassList) {
    $$("button[data-act]", compassList).forEach(b => b.addEventListener("click", () => {
      const idx = parseInt(b.dataset.act, 10) || 1;
      if (evo3dScroll && evo3dCards.length) {
        const scrollable = Math.max(evo3dScroll.offsetHeight - window.innerHeight, 1);
        const top = evo3dScroll.getBoundingClientRect().top + window.scrollY;
        const cardPoint = idx === 1 ? 0 : (idx - 1) + 0.12;
        const targetY = Math.max(top + scrollable * (cardPoint / (evo3dCards.length + 1.2)), 0);
        window.scrollTo({ top: targetY, behavior: prefersReduced ? "auto" : "smooth" });
      }
      if (compassBtn) compassBtn.setAttribute("aria-expanded", "false");
      if (compassList) compassList.hidden = true;
    }));
  }

  if (evo3d && evo3dCards.length && !prefersReduced) {
    const TOTAL = evo3dCards.length;
    const CARD_DEPTH = 220, STACK_Y = 26, OPEN_ANGLE = 82, EXIT_Y = 125, EXIT_Z = 460, SCALE_STEP = 0.034;
    const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const runway = evo3dScroll || evo3d;
    const getProgress = () => {
      const r = runway.getBoundingClientRect();
      const scrollable = Math.max(runway.offsetHeight - window.innerHeight, 1);
      return clamp(-r.top / scrollable, 0, 1);
    };

    let lastProgress = -1, lastActive = 0;
    let stackVisible = false, stackRunning = false;
    let lastFrame = performance.now();
    let mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer) {
      window.addEventListener("pointermove", e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    const paintCard = (card, index, relative, active) => {
      card.classList.toggle("is-front", index === active - 1);
      if (relative < -1.05) {
        if (card.style.visibility !== "hidden") {
          card.style.visibility = "hidden";
          card.style.opacity = "0";
          card.style.willChange = "auto";
        }
        return;
      }
      if (card.style.visibility === "hidden") {
        card.style.visibility = "visible";
        card.style.willChange = "transform, opacity";
      }
      if (relative >= -1 && relative <= 0) {
        const t = easeInOut(Math.abs(relative));
        card.style.transform = `translate3d(0, ${(-t * EXIT_Y).toFixed(2)}vh, ${(t * EXIT_Z).toFixed(2)}px) rotateX(${(-t * OPEN_ANGLE).toFixed(2)}deg) rotateY(${(-t * 6).toFixed(2)}deg) scale(${(1 - t * 0.07).toFixed(4)})`;
        card.style.opacity = (1 - Math.max(0, t - 0.9) * 10).toFixed(3);
        card.style.zIndex = "1000";
        if (evo3dImages[index] && index === active - 1) {
          evo3dImages[index].style.transform = `translateZ(35px) scale(${(1.12 + t * 0.12).toFixed(4)})`;
        }
        return;
      }
      if (relative > 0 && relative < 1.5) {
        const t = easeOut(clamp(1 - (relative - 1), 0, 1));
        card.style.transform = `translate3d(0, ${(STACK_Y - t * STACK_Y).toFixed(2)}px, ${(-CARD_DEPTH + t * CARD_DEPTH).toFixed(2)}px) scale(${(0.966 + t * 0.034).toFixed(4)})`;
        card.style.opacity = (0.9 + t * 0.1).toFixed(3);
        card.style.zIndex = "999";
        return;
      }
      const depth = Math.min(relative, 4);
      card.style.transform = `translate3d(0, ${(depth * STACK_Y).toFixed(2)}px, ${(-depth * CARD_DEPTH).toFixed(2)}px) scale(${(1 - depth * SCALE_STEP).toFixed(4)})`;
      card.style.opacity = Math.max(0, 1 - depth * 0.14).toFixed(3);
      card.style.zIndex = String(900 - index);
    };

    const animate = now => {
      if (!stackVisible || document.hidden) {
        stackRunning = false;
        evo3dCards.forEach(card => { card.style.willChange = "auto"; });
        return;
      }
      const dt = Math.min(Math.max((now - lastFrame) / 1000, 1 / 240), 0.05);
      lastFrame = now;
      const progress = getProgress();
      const targetCamX = finePointer ? mouseX * 3 : 0;
      const targetCamY = finePointer ? mouseY * -2 : 0;
      const cameraBlend = 1 - Math.exp(-3 * dt);
      cameraX += (targetCamX - cameraX) * cameraBlend;
      cameraY += (targetCamY - cameraY) * cameraBlend;
      const cameraSettled = Math.abs(targetCamX - cameraX) < 0.02 && Math.abs(targetCamY - cameraY) < 0.02;
      if (Math.abs(progress - lastProgress) < 0.0005 && cameraSettled) {
        requestAnimationFrame(animate);
        return;
      }
      lastProgress = progress;

      const cardProgress = Math.min(progress * (TOTAL + 1.2), TOTAL - 1);
      const inView = progress > 0.001 && progress < 0.999;
      const active = clamp(Math.floor(cardProgress) + 1, 1, TOTAL);
      if (active !== lastActive) {
        lastActive = active;
        setAtmo(inView ? (evo3dCards[active - 1].dataset.world || null) : null);
        if (compassNum) compassNum.textContent = String(active).padStart(2, "0");
        if (compassName) compassName.textContent = cardNames[active - 1] || String(active).padStart(2, "0");
      }

      evo3dCards.forEach((card, index) => paintCard(card, index, index - cardProgress, active));
      if (evo3dCamera) evo3dCamera.style.transform = `rotateX(${cameraY.toFixed(3)}deg) rotateY(${cameraX.toFixed(3)}deg)`;
      requestAnimationFrame(animate);
    };

    const startStack = () => {
      if (stackRunning || !stackVisible || document.hidden) return;
      lastFrame = performance.now();
      lastProgress = -1;
      stackRunning = true;
      evo3dCards.forEach(card => { card.style.willChange = "transform, opacity"; });
      requestAnimationFrame(animate);
    };
    const stackObserver = new IntersectionObserver(entries => {
      stackVisible = !!entries[0]?.isIntersecting;
      if (stackVisible) startStack();
    }, { rootMargin: "10% 0px", threshold: 0 });
    stackObserver.observe(runway);
    const wakeStack = () => {
      const r = runway.getBoundingClientRect();
      stackVisible = r.bottom > 0 && r.top < window.innerHeight;
      if (stackVisible) startStack();
    };
    window.addEventListener("scroll", wakeStack, { passive: true });
    window.addEventListener("resize", wakeStack, { passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) wakeStack(); });
    wakeStack();
  }
})();
