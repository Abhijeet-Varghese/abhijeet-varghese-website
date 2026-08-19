/* ============================================================
   ABHIJEET VARGHESE — interaction layer
   Reveals, parallax, active-nav tracking, journey scrub,
   mobile menu, single-screen booking card.
   ============================================================ */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* mark JS as live — CSS reveal system only activates behind this class.
     Also marks the bundle as loaded: this disables the head-script failsafe,
     so scroll reveals keep their animation after the 2.6 s failsafe window. */
  document.documentElement.classList.add("js");
  document.documentElement.classList.add("js-ok");

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Inner-page close — always return to the exact originating section.
     Preference order:
       1. same-tab in-site navigation  → history.back() (native scroll restoration)
       2. remembered return point      → navigate to it and restore the scroll
          (covers new tabs, reloads and direct visits within the session)
       3. href fallback                → homepage (untouched default) ---------- */
  const INNER_PAGE = /(^|\/)(case-study-[\w-]+\.html|essay-[\w-]+\.html|journal-[\w-]+\.html)$|\/experience-design\//;
  const isInnerUrl = u => {
    try { const x = new URL(u, location.href); return x.origin === location.origin && INNER_PAGE.test(x.pathname); }
    catch { return false; }
  };

  /* listing pages — remember where an inner page was opened from */
  document.addEventListener("click", e => {
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(href)) return;
    if (!isInnerUrl(href)) return;
    try {
      sessionStorage.setItem("av:return", JSON.stringify({ url: location.href.split("#")[0], y: Math.round(window.scrollY), t: Date.now() }));
    } catch { /* private mode — the href fallback still works */ }
  }, true);

  /* listing pages — restore a remembered position after returning */
  try {
    const pending = JSON.parse(sessionStorage.getItem("av:scroll") || "null");
    if (pending && typeof pending.y === "number" && pending.url === location.href.split("#")[0] && Date.now() - (pending.t || 0) < 3e5) {
      sessionStorage.removeItem("av:scroll");
      const jump = () => window.scrollTo({ top: pending.y, behavior: "auto" });
      if ("requestIdleCallback" in window) requestIdleCallback(jump, { timeout: 400 }); else setTimeout(jump, 120);
    }
  } catch { /* ignore */ }

  const readReturn = () => {
    try {
      const r = JSON.parse(sessionStorage.getItem("av:return") || "null");
      return r && r.url && Date.now() - (r.t || 0) < 3e5 ? r : null;
    } catch { return null; }
  };

  $$("[data-history-close]").forEach(btn => {
    const ret = readReturn();
    if (ret) { try { btn.setAttribute("href", new URL(ret.url, location.href).href); } catch { /* keep fallback */ } }
    btn.addEventListener("click", event => {
      let sameSiteReferrer = false;
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        sameSiteReferrer = !!referrer && referrer.origin === location.origin && referrer.href !== location.href;
      } catch { sameSiteReferrer = false; }
      /* 1 — came here in this tab: native back restores route + scroll exactly */
      if (sameSiteReferrer && history.length > 1) {
        event.preventDefault();
        history.back();
        return;
      }
      /* 2 — opened in a new tab / reloaded / referrer stripped: use the
             remembered origin and restore its scroll position on arrival */
      const r = readReturn();
      if (r) {
        event.preventDefault();
        try { sessionStorage.setItem("av:scroll", JSON.stringify({ url: r.url, y: r.y, t: Date.now() })); } catch { /* ignore */ }
        location.href = r.url;
        return;
      }
      /* 3 — no context at all: keep the authored href (homepage) */
    });
  });

  /* ---------- Booking — single screen, popover calendar, live availability ----------
     The calendar stays closed until the visitor clicks the date field (popover).
     Availability is fetched from the AV OS backend when available; otherwise the
     form falls back to the standard slot list. */
  /* Live-availability via the AV OS backend (/api/availability) — empty =
     static slot list with graceful fallback messaging (no console noise). */
  const AVAIL_ENDPOINT = "";

  const bookForm  = $("#contactForm");
  if (bookForm) {
  try {
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

  let chosenSlot = null;
  let selectedDate = null;
  let dateOpen = false;
  let availMode = "static";            // "static" | "live"
  const availCache = new Map();        // "YYYY-MM" -> { "YYYY-MM-DD": ["HH:MM", ...] }

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
    if (selectedDate && chosenSlot) {
      summary.classList.add("is-set");
      summaryTx.innerHTML = `<strong>${fmtLong(selectedDate)} · ${chosenSlot} IST</strong>&nbsp;— 30 min intro call`;
    } else if (selectedDate) {
      summary.classList.remove("is-set");
      summaryTx.innerHTML = `${fmtLong(selectedDate)} —&nbsp;now pick a time`;
    } else if (chosenSlot) {
      summary.classList.remove("is-set");
      summaryTx.innerHTML = `${chosenSlot} IST —&nbsp;now pick a day`;
    } else {
      summary.classList.remove("is-set");
      summaryTx.textContent = "Pick a day and a time";
    }
  };

  /* ---- popover open / close (calendar is closed until the field is clicked) ---- */
  const openDate = () => {
    if (dateOpen) return;
    dateOpen = true;
    datePop.hidden = false;
    dateTrigger.setAttribute("aria-expanded", "true");
    dateTrigger.classList.add("is-open");
    requestAnimationFrame(() => requestAnimationFrame(() => datePop.classList.add("is-open")));
  };
  const closeDate = () => {
    if (!dateOpen) return;
    dateOpen = false;
    datePop.classList.remove("is-open");
    dateTrigger.setAttribute("aria-expanded", "false");
    dateTrigger.classList.remove("is-open");
    setTimeout(() => { if (!dateOpen) datePop.hidden = true; }, 320);
  };
  dateTrigger.addEventListener("click", e => {
    e.stopPropagation();
    dateOpen ? closeDate() : openDate();
  });
  datePop.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => closeDate());
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDate(); });

  /* ---- availability: live from the scheduler backend via proxy ---- */
  const fetchMonth = async (y, m) => {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    if (availCache.has(key)) { availMode = "live"; return; }
    if (!AVAIL_ENDPOINT) { availMode = "static"; return; }
    try {
      const res = await fetch(`${AVAIL_ENDPOINT}?month=${key}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("proxy not deployed");
      const data = await res.json();
      if (!data || data.fallback) throw new Error("proxy fallback");
      availCache.set(key, data.days || {});
      availMode = "live";
    } catch {
      availMode = "static";
    }
    renderCal();
    applySlotAvailability();
  };
  const dayAvail = d => {
    if (availMode !== "live" || !d) return null;
    const cache = availCache.get(monthKey(d));
    return cache ? (cache[iso(d)] || []) : null;
  };

  /* ---- calendar (rendered inside the popover) ---- */
  const renderCal = () => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
    dpTitle.textContent = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    dpPrev.disabled = viewMonth <= minMonth;
    dpNext.disabled = new Date(y, m + 1, 1) >= maxMonth;
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
        if (cache && av) cell.title = `${av.length} time${av.length > 1 ? "s" : ""} available`;
        cell.addEventListener("click", () => {
          selectedDate = d;
          fDate.value = iso(d);
          dateTriggerTx.textContent = fmtShort(d);
          dateTrigger.classList.add("is-set");
          unflagCf(dateTrigger); $(".datepick", bookForm).classList.remove("is-flagged");
          closeDate();
          renderCal();
          applySlotAvailability();
          updateSummary();
        });
      }
      dpGrid.appendChild(cell);
    }
  };
  dpPrev.addEventListener("click", () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCal(); fetchMonth(viewMonth.getFullYear(), viewMonth.getMonth());
  });
  dpNext.addEventListener("click", () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCal(); fetchMonth(viewMonth.getFullYear(), viewMonth.getMonth());
  });

  /* ---- time slots — filtered by live availability when available ---- */
  const applySlotAvailability = () => {
    const av = dayAvail(selectedDate);
    if (availMode === "live" && selectedDate && av) {
      slotBtns.forEach(b => {
        const on = av.includes(b.dataset.slot);
        b.disabled = !on;
        b.classList.toggle("is-off", !on);
        b.title = on ? "" : "Unavailable on this day";
      });
      if (chosenSlot && !av.includes(chosenSlot)) {
        slotBtns.forEach(x => { x.classList.remove("is-active"); x.setAttribute("aria-checked", "false"); });
        chosenSlot = null;
        updateSummary();
      }
    } else {
      slotBtns.forEach(b => { b.disabled = false; b.classList.remove("is-off"); b.removeAttribute("title"); });
    }
    if (slotHint) {
      if (availMode === "live" && selectedDate) {
        slotHint.textContent = av && av.length
          ? `${av.length} time${av.length > 1 ? "s" : ""} available this day`
          : "No times left on this day — pick another date.";
      } else if (availMode === "live") {
        slotHint.textContent = "Times update with live availability.";
      } else {
        slotHint.textContent = "All standard times shown — final confirmation happens at booking.";
      }
    }
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
    unflagCf(slotBox); chosenSlot = s.dataset.slot;
    updateSummary();
  };
  slotBtns.forEach((s, i) => {
    s.tabIndex = i === 0 ? 0 : -1;
    s.addEventListener("click", () => { selectSlot(s); s.focus({ preventScroll: true }); });
  });
  slotBox.addEventListener("keydown", e => {
    const items = slotBtns.filter(b => !b.disabled);
    if (!items.length || !items.includes(document.activeElement)) return;
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const idx = items.indexOf(document.activeElement);
    const cols = 3;
    let next;
    switch (e.key) {
      case "ArrowRight": next = items[(idx + 1) % items.length]; break;
      case "ArrowLeft":  next = items[(idx - 1 + items.length) % items.length]; break;
      case "ArrowDown":  next = items[Math.min(idx + cols, items.length - 1)]; break;
      case "ArrowUp":    next = items[Math.max(idx - cols, 0)]; break;
      case "Home":       next = items[0]; break;
      case "End":        next = items[items.length - 1]; break;
    }
    selectSlot(next); next.focus({ preventScroll: true });
  });

  /* ---- submit — one screen, scheduler in the backend ---- */
  const flagCf = el => {
    el.classList.add("is-invalid");
    el.setAttribute("aria-invalid", "true");
    el.addEventListener("input", () => { el.classList.remove("is-invalid"); el.removeAttribute("aria-invalid"); }, { once: true });
  };
  const unflagCf = el => { el.classList.remove("is-invalid"); el.removeAttribute("aria-invalid"); };
  const readForm = () => ({
    name: $("#cfName").value.trim(),
    email: $("#cfEmail").value.trim(),
    org: $("#cfOrg").value.trim(),
    msg: $("#cfMsg").value.trim()
  });
  const notesHref = f =>
    "mailto:hi@abhijeetvarghese.com" +
    "?subject=" + encodeURIComponent(`Intro call request — ${f.name}${f.org ? ` (${f.org})` : ""} · ${fmtLong(selectedDate)} ${chosenSlot} IST`) +
    "&body=" + encodeURIComponent([
      `Name: ${f.name}`,
      `Email: ${f.email}`,
      `Organization: ${f.org || "—"}`,
      `Requested slot: ${fmtLong(selectedDate)} at ${chosenSlot} IST`,
      f.msg ? `Context notes:\n${f.msg}` : ""
    ].filter(Boolean).join("\n"));
  const submitBtn = $("#bookSubmit");

  bookForm.addEventListener("submit", async e => {
    e.preventDefault();
    const f = readForm();
    let ok = true;
    if (!f.name) { flagCf($("#cfName")); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { flagCf($("#cfEmail")); ok = false; }
    if (!selectedDate) { dateTrigger.classList.add("is-flagged"); dateTrigger.setAttribute("aria-invalid", "true"); openDate(); ok = false; }
    if (!chosenSlot) { slotBox.classList.add("is-flagged"); slotBox.setAttribute("aria-invalid", "true"); ok = false; }
    if (!ok) {
      const bad = bookForm.querySelector(".is-invalid") || dateTrigger || slotBox;
      bad.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      return;
    }

    /* — save the request in place; never navigate to a third-party scheduler — */
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.innerHTML = "Sending your request…";
    }
    if (cfNote) {
      cfNote.textContent = "Saving your details — one moment.";
      cfNote.classList.remove("is-set");
    }

    /* save the lead to the AV OS CRM first (never blocks the booking) */
    const utm = new URLSearchParams(location.search);
    const leadPayload = {
      name: f.name,
      email: f.email,
      organization: f.org,
      message: [
        f.msg,
        `Requested intro call: ${fmtLong(selectedDate)} at ${chosenSlot} IST`
      ].filter(Boolean).join("\n\n"),
      project_type: "intro call request",
      source: "website",
      page: location.pathname,
      referrer: document.referrer || "",
      utm_source: utm.get("utm_source") || "",
      utm_medium: utm.get("utm_medium") || "",
      utm_campaign: utm.get("utm_campaign") || "",
      utm_term: utm.get("utm_term") || "",
      utm_content: utm.get("utm_content") || ""
    };
    let leadSaved = false;
    try {
      const lr = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload)
      });
      leadSaved = lr.ok;
    } catch { leadSaved = false; }
    if (!leadSaved) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.innerHTML = "Send booking request";
      }
      if (cfNote) {
        cfNote.textContent = "I couldn't save the request just now. Please email hi@abhijeetvarghese.com.";
        cfNote.classList.remove("is-set");
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.innerHTML = "Send booking request";
    }
    if (cfNote) {
      cfNote.textContent = "Request saved — no external calendar opened.";
      cfNote.classList.add("is-set");
    }
    $("#doneSummary").textContent =
      `Thanks${f.name ? `, ${f.name}` : ""}. Your request for ${fmtLong(selectedDate)} at ${chosenSlot} IST is saved.`;
    $("#doneMail").href = notesHref(f);
    $("#doneMail").textContent = f.msg ? "Send additional context" : "Send a note by email";
    bookView.hidden = true;
    bookDone.hidden = false;
    bookDone.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  });

  const bookAgain = $("#bookAgain");
  if (bookAgain) bookAgain.addEventListener("click", () => {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove("is-loading"); submitBtn.innerHTML = "Send booking request"; }
    bookForm.reset();
    chosenSlot = null; selectedDate = null;
    slotBtns.forEach((s, i) => {
      s.classList.remove("is-active", "is-off");
      s.disabled = false;
      s.tabIndex = i === 0 ? 0 : -1;
    });
    slotBox.classList.remove("is-flagged");
    dateTrigger.classList.remove("is-set", "is-flagged");
    dateTriggerTx.textContent = "Choose a date";
    closeDate();
    $$(".is-invalid", bookForm).forEach(el => unflagCf(el));
    unflagCf(dateTrigger); unflagCf(slotBox);
    viewMonth = new Date(minMonth);
    renderCal(); applySlotAvailability(); updateSummary();
    if (cfNote) {
      cfNote.textContent = "Your preferred time will be confirmed personally by email.";
      cfNote.classList.remove("is-set");
    }
    bookDone.hidden = true;
    bookView.hidden = false;
  });

  /* keep "today" honest if the tab stays open past midnight */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (+t !== +today) { today.setTime(t.getTime()); renderCal(); }
  });

  renderCal();
  fetchMonth(today.getFullYear(), today.getMonth());   // warm the availability cache
  } catch (err) {
    /* a booking-widget element moved — degrade this feature only, never the page */
    console.warn("[booking] init skipped:", err);
  }
  }

  /* ---------- Stagger delays (groups can declare a base delay) ---------- */
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

    /* watchdog — anything visible that IO hasn't caught within a beat is revealed anyway */
    setTimeout(() => {
      const vh = window.innerHeight;
      revealEls.filter(el => !el.classList.contains("in-view")).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add("in-view");
      });
    }, 1400);
  }

  /* ---------- Nav + progress + parallax (single rAF loop) ---------- */
  const nav = $("#siteNav");
  const progress = $("#progress");
  let ticking = false;

  const parallaxEls = $$("[data-parallax]").map(el => {
    const img = el.querySelector("img");
    const requested = Number.parseFloat(el.dataset.parallax);
    const speed = Number.isFinite(requested) ? requested : 0.05;
    // A value of zero preserves authored edge-to-edge artwork without zooming
    // or translating it; all other project media keeps the existing parallax.
    if (speed === 0) {
      if (img) { img.style.willChange = "auto"; img.style.scale = "1"; img.style.transform = "none"; }
      return null;
    }
    if (img) { img.style.willChange = "transform"; img.style.scale = "1.13"; }
    return { el, target: img || el, speed };
  }).filter(Boolean);

  /* journey horizontal scrub refs */
  const journeySec  = $("#journey");
  const journeyPin  = $("#journeyPin");
  const journeyTrack = $("#journeyTrack");
  const journeyBar  = $("#journeyBar");
  const journeyBarNum = $("#journeyBarNum");
  const journeyMQ   = window.matchMedia("(min-width: 901px)");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-visible", y > 90);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    if (!prefersReduced) {
      const vh = window.innerHeight;
      for (const p of parallaxEls) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const center = r.top + r.height / 2 - vh / 2;
        p.target.style.transform = `translate3d(0, ${(center * p.speed).toFixed(2)}px, 0)`;
      }
    }

    /* journey — horizontal era strip, driven by vertical scroll */
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
          if (journeyBarNum.textContent !== era + " / " + eraTotal) journeyBarNum.textContent = era + " / " + eraTotal;
        }
      } else {
        journeyTrack.style.transform = "";
        if (journeyBar) journeyBar.style.transform = "";
      }
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(onScroll), { passive: true });
  journeyMQ.addEventListener?.("change", onScroll);
  onScroll();

  /* ============================================================
     ABOUT — BEYOND APPLE (full-page pass): instant press feedback
     on pointer-down for EVERY interactive element — links included
     (delegated, interruptible, 100 ms; never waits for release)
     ============================================================ */
  if (document.body.classList.contains("about-page")) {
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
  }

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    /* --- count-up — the by-the-numbers live in the identity hub --- */
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

    /* --- marquee gate — pause the crawl while offscreen --- */
    const mqTracks = $$(".about-prologue__mq-track");
    if (mqTracks.length) {
      const mqGate = new IntersectionObserver(es => {
        es.forEach(e => { e.target.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
      }, { threshold: 0.02 });
      mqTracks.forEach(t => mqGate.observe(t));
    }

    /* --- the three title beats separate at increasing depth as the
       opening frame gives way to the identity spread --- */
    const aboutScrubbers = [];
    let aboutScrubTick = false;
    const queueAboutScrub = () => {
      if (aboutScrubTick) return;
      aboutScrubTick = true;
      requestAnimationFrame(() => { for (const fn of aboutScrubbers) fn(); aboutScrubTick = false; });
    };
    const pl = document.getElementById("prologue");
    const plLines = pl ? $$(".about-prologue__line", pl) : [];
    const heroDepth = [-0.055, -0.095, -0.14];
    const onTheater = () => {
      const y = window.scrollY, vh = window.innerHeight;
      if (y < vh * 1.3 && !prefersReduced) {
        plLines.forEach((ln, i) => ln.style.transform = `translate3d(0, ${(y * (heroDepth[i] ?? -0.14)).toFixed(1)}px, 0)`);
      } else if (!prefersReduced) {
        plLines.forEach(ln => ln.style.transform = "");
      }
    };

    /* --- portrait parallax — a quiet editorial drift as the visitor
       scrolls through the identity spread --- */
    const portrait = document.querySelector('.about-frame__portrait img');
    if (portrait && !prefersReduced) {
      const onPortrait = () => {
        const r = portrait.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        const p = clamp((vh * 0.6 - r.top) / (r.height + vh * 0.6), 0, 1);
        portrait.style.transform = `scale(1.06) translate3d(0, ${(-5 + p * 10).toFixed(1)}px, 0)`;
      };
      aboutScrubbers.push(onPortrait);
      onPortrait();
    }

    /* --- zoom-out stage: frame expands as the visitor scrolls --- */
    const zoomStage = document.getElementById("aboutZoomStage");
    const zoomFrame = document.getElementById("aboutZoomFrame");
    const zoomLabels = $$("#aboutZoomLabels li");
    if (zoomStage && zoomFrame) {
      const onZoom = () => {
        if (prefersReduced) return;
        const r = zoomStage.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh * 0.62 - r.top) / (r.height * 0.9 + vh * 0.4), 0, 1);
        zoomFrame.style.setProperty("--zp", p.toFixed(3));
        const stage = Math.min(Math.floor(p * 4) + 1, 4);
        zoomLabels.forEach((l, i) => l.classList.toggle("is-on", i + 1 <= stage));
        const g1 = document.getElementById("aboutZoomGhost1");
        const g2 = document.getElementById("aboutZoomGhost2");
        if (g1) { g1.style.opacity = Math.max(0, (p - 0.4) * 0.5).toFixed(3); g1.style.transform = `scale(${(1.06 + p * 0.12).toFixed(3)})`; }
        if (g2) { g2.style.opacity = Math.max(0, (p - 0.72) * 0.5).toFixed(3); g2.style.transform = `scale(${(1.02 + p * 0.2).toFixed(3)})`; }
      };
      aboutScrubbers.push(onZoom);
      onZoom();
    }

    /* --- env: light/dark world → nav adaptation --- */
    const envSections = [
      [".about-frame", "light"], [".about-acts", "dark"], [".about-interlude", "dark"],
      [".about-what", "light"], [".about-now", "dark"], [".about-curious", "light"], [".about-credits", "light"],
    ].map(([sel, env]) => ({ el: document.querySelector(sel), env })).filter(x => x.el);
    const computeEnv = () => {
      const vh = window.innerHeight, vw = window.innerWidth;
      let best = null, bestArea = 0;
      for (const { el, env } of envSections) {
        const r = el.getBoundingClientRect();
        const w = Math.min(r.right, vw) - Math.max(r.left, 0);
        const h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        const area = Math.max(w, 0) * Math.max(h, 0);
        if (area > bestArea) { best = env; bestArea = area; }
      }
      if (best) document.body.dataset.env = best;
    };
    aboutScrubbers.push(computeEnv);
    queueAboutScrub();
    window.addEventListener("scroll", queueAboutScrub, { passive: true });
    window.addEventListener("resize", queueAboutScrub, { passive: true });

    /* ============================================================
       THE EVOLUTION — 3D FILM STACK (scroll-choreographed)
       Eight cards (six chapters + two interludes) hinge open as the
       visitor scrolls; the fine-pointer camera drifts subtly; the
       world-light and compass follow the active card. A gated, time-based
       rAF loop stays interruptible and sleeps offscreen; reduced motion
       renders static sequential frames.
       ============================================================ */
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
    const compassIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!compass) continue;
        if (e.isIntersecting) {
          compass.classList.remove("is-show");
          compass.hidden = true;
        } else {
          compass.hidden = false;
          requestAnimationFrame(() => compass.classList.add("is-show"));
        }
      }
    }, { threshold: 0 });
    if (compass && prologue) compassIO.observe(prologue);

    /* the sheet materializes from its trigger and mirrors the same
       path on the way out (Apple §7 spatial consistency) */
    if (compassBtn && compassList) {
      const openList = () => {
        compassBtn.setAttribute("aria-expanded", "true");
        compassList.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => compassList.classList.add("is-show")));
        if (!prefersReduced && navigator.vibrate) navigator.vibrate(8);
      };
      const closeList = () => {
        compassBtn.setAttribute("aria-expanded", "false");
        compassList.classList.remove("is-show");
        compassList.classList.add("is-closing");
        setTimeout(() => {
          if (!compassList.classList.contains("is-show")) { compassList.hidden = true; }
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
    const evo3dShadows = $$(".about-evo3d__shadow");
    const evo3dCamera = $(".about-evo3d__camera");

    /* compass navigation — seek into the stack */
    if (compassList) {
      $$("button[data-act]", compassList).forEach(b => b.addEventListener("click", () => {
        const idx = parseInt(b.dataset.act, 10) || 1;
        if (evo3dScroll && evo3dCards.length) {
          const scrollable = Math.max(evo3dScroll.offsetHeight - window.innerHeight, 1);
          const top = evo3dScroll.getBoundingClientRect().top + window.scrollY;
          const cardPoint = idx === 1 ? 0 : (idx - 1) + 0.12;
          const targetY = Math.max(top + scrollable * (cardPoint / (evo3dCards.length + 1.2)), 0);
          window.scrollTo({ top: targetY, behavior: prefersReduced ? "auto" : "smooth" });
        } else {
          const act = document.querySelector('.about-evo3d__card[data-act="' + b.dataset.act + '"]');
          if (act) act.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
        }
        compassBtn.setAttribute("aria-expanded", "false");
        compassList.hidden = true;
      }));
    }

    if (evo3d && evo3dCards.length && !prefersReduced) {
      const TOTAL = evo3dCards.length;
      const CARD_DEPTH = 220, STACK_Y = 26, OPEN_ANGLE = 82, EXIT_Y = 125, EXIT_Z = 460, SCALE_STEP = 0.034;
      const cN = (v, a, b) => Math.max(a, Math.min(b, v));
      const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const getProgress = () => {
        const runway = evo3dScroll || evo3d;
        const r = runway.getBoundingClientRect();
        const scrollable = Math.max(runway.offsetHeight - window.innerHeight, 1);
        return cN(-r.top / scrollable, 0, 1);
      };
      const syncCompass = active => {
        if (!compassNum) return;
        const num = String(active).padStart(2, "0");
        if (compassNum.textContent !== num) compassNum.textContent = num;
        const meta = evo3dCards[active - 1].querySelector(".about-evo3d__meta span:last-child");
        if (compassName) {
          const name = meta ? meta.textContent.trim() : num;
          if (compassName.textContent !== name) compassName.textContent = name;
        }
      };

      /* --- performance contract ------------------------------------------
         (1) every per-card style write goes through a cache: identical values
             are never written twice, so an idle frame costs nothing.
         (2) blur filters are never animated frame-to-frame (animated blur
             forces a re-raster of every card texture — the old jank source);
             depth is carried by translateZ, scale and opacity alone.
         (3) the rAF loop sleeps when nothing is moving (progress unchanged
             and camera settled); scroll/pointer/resize/visibility wake it. */
      const cardState = evo3dCards.map(() => ({ transform: "", opacity: "", zIndex: "", visibility: "", img: "", shTransform: "", shOpacity: "" }));
      const write = (el, cache, key, value) => {
        if (cache[key] === value) return;
        cache[key] = value;
        el.style[key] = value;
      };
      const updateStack = () => {
        const cardProgress = Math.min(currentProgress * (TOTAL + 1.2), TOTAL - 1);
        const inView = currentProgress > 0.001 && currentProgress < 0.999;
        const active = cN(Math.floor(cardProgress) + 1, 1, TOTAL);
        setAtmo(inView ? (evo3dCards[active - 1].dataset.world || null) : null);
        syncCompass(active);

        for (let index = 0; index < TOTAL; index++) {
          const card = evo3dCards[index];
          const cs = cardState[index];
          const isFront = index === active - 1;
          card.classList.toggle("is-front", isFront);
          const relative = index - cardProgress;

          if (relative < -1) {                                   /* flown out */
            write(card, cs, "visibility", "hidden");
            write(card, cs, "transform", `translate3d(0, ${-EXIT_Y}vh, ${EXIT_Z}px) rotateX(-${OPEN_ANGLE}deg) rotateY(-6deg) scale(.86)`);
            write(card, cs, "opacity", "0");
            write(card, cs, "zIndex", "0");
            continue;
          }
          write(card, cs, "visibility", "visible");

          if (relative <= 0) {                                   /* hinging open */
            const t = easeInOut(Math.abs(relative));
            write(card, cs, "transform", `translate3d(0, ${(-t * EXIT_Y).toFixed(2)}vh, ${(t * EXIT_Z).toFixed(2)}px) rotateX(${(-t * OPEN_ANGLE).toFixed(2)}deg) rotateY(${(-t * 6).toFixed(2)}deg) rotateZ(${(t * 1.5).toFixed(2)}deg) scale(${(1 - t * 0.07).toFixed(4)})`);
            write(card, cs, "opacity", (1 - Math.max(0, t - 0.9) * 10).toFixed(3));
            write(card, cs, "zIndex", "1000");
            if (evo3dImages[index]) write(evo3dImages[index], cs, "img", `translateZ(35px) scale(${(1.12 + t * 0.2).toFixed(4)}) translateY(${(t * 7).toFixed(2)}%)`);
            if (evo3dShadows[index]) {
              write(evo3dShadows[index], cs, "shTransform", `translateZ(${(-300 + t * 220).toFixed(1)}px) rotateX(72deg) scale(${(1 + t * 0.5).toFixed(4)})`);
              write(evo3dShadows[index], cs, "shOpacity", (0.72 - t * 0.58).toFixed(3));
            }
            continue;
          }

          if (relative < 1.5) {                                  /* rising into place */
            const t = easeOut(cN(1 - (relative - 1), 0, 1));
            write(card, cs, "transform", `translate3d(0, ${(STACK_Y - t * STACK_Y).toFixed(2)}px, ${(-CARD_DEPTH + t * CARD_DEPTH).toFixed(2)}px) rotateX(${(0.65 - t * 0.65).toFixed(3)}deg) rotateY(${(-0.35 + t * 0.35).toFixed(3)}deg) scale(${(0.966 + t * 0.034).toFixed(4)})`);
            write(card, cs, "opacity", (0.9 + t * 0.1).toFixed(3));
            write(card, cs, "zIndex", "999");
            if (evo3dImages[index]) write(evo3dImages[index], cs, "img", `translateZ(35px) scale(${(1.14 - t * 0.02).toFixed(4)})`);
            continue;
          }

          const depth = Math.min(relative, 6);                   /* resting stack */
          write(card, cs, "transform", `translate3d(0, ${(depth * STACK_Y).toFixed(2)}px, ${(-depth * CARD_DEPTH).toFixed(2)}px) rotateX(${(depth * 0.65).toFixed(2)}deg) rotateY(${(-depth * 0.35).toFixed(2)}deg) scale(${(1 - depth * SCALE_STEP).toFixed(4)})`);
          write(card, cs, "opacity", Math.max(0, 1 - depth * 0.11).toFixed(3));
          write(card, cs, "zIndex", String(900 - index));
          if (evo3dImages[index]) write(evo3dImages[index], cs, "img", "translateZ(35px) scale(1.12)");
        }
      };

      let targetProgress = 0, currentProgress = 0;
      let stackVisible = false, stackRunning = false;
      let lastFrame = performance.now();
      let cameraX = 0, cameraY = 0, cameraTx = 0, cameraTy = 0;
      const finePointer = window.matchMedia("(pointer: fine)").matches;

      const animate = now => {
        if (!stackVisible || document.hidden) { stackRunning = false; return; }
        const dt = Math.min(Math.max((now - lastFrame) / 1000, 1 / 240), 0.25);
        lastFrame = now;

        targetProgress = getProgress();
        /* direct 1:1 scroll tracking: no damping between wheel and card */
        const moved = Math.abs(targetProgress - currentProgress) > 1e-4;
        if (moved) {
          currentProgress = targetProgress;
          updateStack();
        }

        let cameraMoved = false;
        if (finePointer) {
          const blend = 1 - Math.exp(-3 * dt);
          cameraX += (cameraTx - cameraX) * blend;
          cameraY += (cameraTy - cameraY) * blend;
          const dx = Math.abs(cameraTx - cameraX), dy = Math.abs(cameraTy - cameraY);
          if (dx > 0.008 || dy > 0.008) {
            cameraMoved = true;
            if (evo3dCamera) evo3dCamera.style.transform = `rotateX(${cameraY.toFixed(3)}deg) rotateY(${cameraX.toFixed(3)}deg)`;
          }
        }

        if (!moved && !cameraMoved) { stackRunning = false; return; }   /* sleep until woken */
        requestAnimationFrame(animate);
      };

      const startStack = () => {
        if (stackRunning || !stackVisible || document.hidden) return;
        lastFrame = performance.now();
        stackRunning = true;
        requestAnimationFrame(animate);
      };
      const stackObserver = new IntersectionObserver(entries => {
        stackVisible = !!entries[0]?.isIntersecting;
        if (stackVisible) startStack();
      }, { rootMargin: "20% 0px", threshold: 0 });
      stackObserver.observe(evo3dScroll || evo3d);
      window.addEventListener("scroll", startStack, { passive: true });
      window.addEventListener("resize", () => { currentProgress = -1; startStack(); }, { passive: true });
      document.addEventListener("visibilitychange", () => { if (!document.hidden) startStack(); });
      if (finePointer) {
        window.addEventListener("pointermove", e => {
          cameraTx = (e.clientX / window.innerWidth - 0.5) * 6;
          cameraTy = (e.clientY / window.innerHeight - 0.5) * -4;
          startStack();
        }, { passive: true });
      }
      currentProgress = targetProgress = getProgress();   /* first paint */
      updateStack();

      /* one rAF loop for the remaining scroll scrubbers */
      aboutScrubbers.push(onTheater);
      queueAboutScrub();
    } else {
      /* no 3D (reduced motion / missing) — quiet scroll scrubbers only */
      aboutScrubbers.push(onTheater);
      queueAboutScrub();
    }

  /* ============================================================
     COMPACT / MOBILE MENU (≤900px)
     ============================================================ */
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
    /* leaving the mobile breakpoint closes the menu */
    mobileMQ.addEventListener?.("change", () => { if (!mobileMQ.matches) setMenu(false); });
  }



  /* ---------- Experience page — "View all responsibilities" toggle ---------- */
  $$(".exp-job__more").forEach(btn => {
    const list = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (list) list.hidden = open;
    });
  });

  /* ---------- Experience page — scroll-linked timeline fill ---------- */
  const expTimeline = document.getElementById("expTimeline");
  if (expTimeline) {
    const expMark = () => {
      const r = expTimeline.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(Math.max((vh * 0.9 - r.top) / (r.height * 0.6), 0), 1);
      document.body.classList.toggle("exp-scrolled", p > 0.02);
      expTimeline.style.setProperty("--exp-fill", p.toFixed(3));
    };
    window.addEventListener("scroll", () => requestAnimationFrame(expMark), { passive: true });
    window.addEventListener("resize", expMark, { passive: true });
    expMark();
  }


  /* ============================================================
     HOMEPAGE HYBRID — hero + cursor (2.4.20)
     ============================================================ */
  const arenaRoot = document.body.classList.contains("home-arena");
  const aboutRoot = document.body.classList.contains("about-page");
  if (arenaRoot || aboutRoot) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.toggle("arena-reduce", reduced);
    if (aboutRoot) document.body.classList.toggle("about-reduce", reduced);

    /* hero first-scroll transformation */
    const heroEl = document.getElementById("hero");
    const arenaHeroPast = () => {
      if (heroEl) heroEl.classList.toggle("is-past", window.scrollY > window.innerHeight * 0.28);
    };
    let arenaRaf = false;
    window.addEventListener("scroll", () => {
      if (!arenaRaf) { requestAnimationFrame(() => { arenaHeroPast(); arenaRaf = false; }); arenaRaf = true; }
    }, { passive: true });
    window.addEventListener("resize", arenaHeroPast, { passive: true });
    arenaHeroPast();

  }

})();
