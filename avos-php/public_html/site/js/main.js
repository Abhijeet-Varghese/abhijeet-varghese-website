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

  /* ---------- Booking — single screen, popover calendar, live availability ----------
     The calendar stays closed until the visitor clicks the date field (popover).
     Availability is fetched from the AV OS backend when available; otherwise the
     form falls back to the standard slot list. */
  const CALENDLY_URL = "https://calendly.com/abhijeetvarghese/introduction";
  /* Live-availability via the AV OS backend (/api/availability) — empty =
     static slot list with graceful fallback messaging (no console noise). */
  const AVAIL_ENDPOINT = "";

  const bookForm  = $("#contactForm");
  if (bookForm) {
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
          dateTrigger.classList.remove("is-flagged");
          $(".datepick", bookForm).classList.remove("is-flagged");
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
    slotBox.classList.remove("is-flagged");
    chosenSlot = s.dataset.slot;
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
    el.addEventListener("input", () => el.classList.remove("is-invalid"), { once: true });
  };
  const readForm = () => ({
    name: $("#cfName").value.trim(),
    email: $("#cfEmail").value.trim(),
    org: $("#cfOrg").value.trim(),
    msg: $("#cfMsg").value.trim()
  });
  const notesHref = f =>
    "mailto:hi@abhijeetvarghese.com" +
    "?subject=" + encodeURIComponent(`Intro call booked — ${f.name}${f.org ? ` (${f.org})` : ""} · ${fmtLong(selectedDate)} ${chosenSlot} IST`) +
    "&body=" + encodeURIComponent([
      `Name: ${f.name}`,
      `Email: ${f.email}`,
      `Organization: ${f.org || "—"}`,
      `Requested slot: ${fmtLong(selectedDate)} at ${chosenSlot} IST`,
      f.msg ? `Context notes:\n${f.msg}` : ""
    ].filter(Boolean).join("\n"));
  const schedulerUrl = f => {
    const p = new URLSearchParams({ name: f.name, email: f.email });
    if (selectedDate) {
      p.set("date", iso(selectedDate));
      p.set("month", monthKey(selectedDate));
    }
    return `${CALENDLY_URL}?${p.toString()}`;
  };

  const submitBtn   = $("#bookSubmit");
  const fallbackBox = $("#bookFallback");

  /* Load the scheduler widget only when the visitor actually books —
     keeps ~200KB of third-party JS off the critical path. */
  const ensureCalendly = () => new Promise(resolve => {
    if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") return resolve(true);
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    const guard = setTimeout(() => resolve(false), 6000);
    s.onload = () => { clearTimeout(guard); resolve(!!(window.Calendly && window.Calendly.initPopupWidget)); };
    s.onerror = () => { clearTimeout(guard); resolve(false); };
    document.head.appendChild(s);
  });
  const fbScheduler = $("#fbScheduler");
  const fbMail      = $("#fbMail");
  let bookingTimer = null;

  const showFallback = url => {
    if (fbScheduler) fbScheduler.href = url;
    if (fbMail) {
      const f = readForm();
      fbMail.href =
        "mailto:hi@abhijeetvarghese.com" +
        "?subject=" + encodeURIComponent("Booking link — please send me the scheduler link") +
        "&body=" + encodeURIComponent(
          `Name: ${f.name}\nEmail: ${f.email}\nOrganization: ${f.org || "—"}\n` +
          `Requested slot: ${selectedDate ? fmtLong(selectedDate) : ""} ${chosenSlot ? chosenSlot + " IST" : ""}` +
          (f.msg ? `\n\nContext notes:\n${f.msg}` : "")
        );
    }
    if (fallbackBox) fallbackBox.hidden = false;
  };

  bookForm.addEventListener("submit", async e => {
    e.preventDefault();
    const f = readForm();
    let ok = true;
    if (!f.name) { flagCf($("#cfName")); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { flagCf($("#cfEmail")); ok = false; }
    if (!selectedDate) { dateTrigger.classList.add("is-flagged"); openDate(); ok = false; }
    if (!chosenSlot) { slotBox.classList.add("is-flagged"); ok = false; }
    if (!ok) {
      const bad = bookForm.querySelector(".is-invalid") || dateTrigger || slotBox;
      bad.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      return;
    }

    /* — every submit path gives visible feedback, nothing can silently stall — */
    const url = schedulerUrl(f);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.innerHTML = "Booking your call…";
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
      message: f.msg,
      project_type: "intro call",
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
    if (leadSaved && cfNote) {
      cfNote.textContent = "Details saved — opening the scheduler.";
      cfNote.classList.remove("is-set");
    }

    let popupOpened = false;
    try {
      const ready = await ensureCalendly();      // loads the widget on demand
      if (ready) {
        window.Calendly.initPopupWidget({ url });
        popupOpened = true;
      }
    } catch { popupOpened = false; }

    if (bookingTimer) clearTimeout(bookingTimer);
    if (popupOpened) {
      /* popup should be on screen — if we hear nothing within 4s, surface the
         fallback links so the visitor is never left waiting on a blocked window */
      bookingTimer = setTimeout(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove("is-loading"); submitBtn.innerHTML = "Confirm booking"; }
        if (cfNote) { cfNote.textContent = "If the scheduling window didn't open, use the buttons below."; }
        showFallback(url);
      }, 4000);
    } else {
      /* widget unavailable (offline / blocked) — embed the scheduler IN this
         page instead of popping a new tab (no popup-blocker dead ends) */
      openEmbed(url);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove("is-loading"); submitBtn.innerHTML = "Confirm booking"; }
      if (cfNote) { cfNote.textContent = "Calendar opened below — pick a time and confirm there."; }
    }
  });

  /* ---- in-page scheduler embed (fallback when the popup widget is blocked) ---- */
  const bookEmbed = $("#bookEmbed");
  const bookEmbedFrame = $("#bookEmbedFrame");
  const bookEmbedClose = $("#bookEmbedClose");
  let embedTimer = null;
  const openEmbed = url => {
    if (!bookEmbed || !bookEmbedFrame) { showFallback(url); return; }
    const embedUrl = url.split("?")[0] +
      "?embed_domain=" + encodeURIComponent(location.hostname) +
      "&embed_type=Inline" +
      (url.includes("?") ? "&" + url.split("?")[1] : "");
    bookEmbedFrame.src = embedUrl;
    bookEmbed.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => bookEmbed.classList.add("is-open"));
    if (bookEmbedClose) bookEmbedClose.focus({ preventScroll: true });
    /* if the embed itself fails to paint within 10s, show the manual links */
    embedTimer = setTimeout(() => {
      const doc = bookEmbedFrame.contentDocument;
      const blank = !doc || !doc.body || doc.body.innerHTML.trim() === "";
      if (blank) { closeEmbed(); showFallback(url); }
    }, 10000);
  };
  const closeEmbed = () => {
    if (embedTimer) { clearTimeout(embedTimer); embedTimer = null; }
    if (!bookEmbed) return;
    bookEmbed.classList.remove("is-open");
    document.body.style.overflow = "";
    if (bookEmbedFrame) { bookEmbedFrame.src = "about:blank"; }
    setTimeout(() => { bookEmbed.hidden = true; }, 350);
  };
  if (bookEmbedClose) bookEmbedClose.addEventListener("click", closeEmbed);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && bookEmbed && !bookEmbed.hidden) closeEmbed(); });
  /* booking completed inside the embed → celebrate on the page */
  window.addEventListener("message", ev => {
    if (!bookEmbed || bookEmbed.hidden) return;
    const d = ev.data || {};
    if (d.type === "CALENDLY_EVENT_SCHEDULED" || (d.event && d.event.indexOf("scheduled") !== -1)) {
      closeEmbed();
      window.dispatchEvent(new CustomEvent("calendly:event_scheduled"));
    }
  });

  /* fired by the scheduler when the booking completes */
  window.addEventListener("calendly:event_scheduled", () => {
    if (bookingTimer) { clearTimeout(bookingTimer); bookingTimer = null; }
    if (fallbackBox) fallbackBox.hidden = true;
    const f = readForm();
    $("#doneSummary").textContent =
      `Check your inbox${f.name ? `, ${f.name}` : ""} — the invite with your call details is on its way.`;
    $("#doneMail").href = notesHref(f);
    $("#doneMail").textContent = f.msg ? "Send context notes" : "Send a note by email";
    bookView.hidden = true;
    bookDone.hidden = false;
    bookDone.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  });

  $("#bookAgain").addEventListener("click", () => {
    if (bookingTimer) { clearTimeout(bookingTimer); bookingTimer = null; }
    if (fallbackBox) fallbackBox.hidden = true;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove("is-loading"); submitBtn.innerHTML = "Confirm booking"; }
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
    $$(".is-invalid", bookForm).forEach(el => el.classList.remove("is-invalid"));
    viewMonth = new Date(minMonth);
    renderCal(); applySlotAvailability(); updateSummary();
    if (cfNote) {
      cfNote.textContent = "Instant confirmation — your calendar invite lands in your inbox.";
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
  }

  /* ---------- Stagger delays (groups can declare a base delay) ---------- */
  $$("[data-reveal-group]").forEach(group => {
    const base = parseFloat(group.dataset.dbase || "0");
    $$("[data-reveal]", group).forEach((el, i) => {
      el.style.setProperty("--d", `${(base + Math.min(i * 0.06, 0.6)).toFixed(2)}s`);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in-view");
        revealIO.unobserve(e.target);
      }
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach(el => revealIO.observe(el));

  /* watchdog — anything visible that IO hasn't caught within a beat is revealed anyway */
  setTimeout(() => {
    const vh = window.innerHeight;
    $$("[data-reveal]:not(.in-view)").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add("in-view");
    });
  }, 1400);

  /* ---------- Nav + progress + parallax (single rAF loop) ---------- */
  const nav = $("#siteNav");
  const progress = $("#progress");
  let ticking = false;

  const parallaxEls = $$("[data-parallax]").map(el => {
    const img = el.querySelector("img");
    if (img) { img.style.willChange = "transform"; img.style.scale = "1.13"; }
    return { el, target: img || el, speed: parseFloat(el.dataset.parallax) || 0.05 };
  });

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

  /* ============================================================
     ABOUT STORY — "THE LONG TAKE" (v2.4.20-r3 · from scratch)
     count-up · interruptible spring accordion · zoom-out scrub ·
     continuous world light · reel advance · filmstrip · signal
     chain · theater aperture · compass · press feedback
     ============================================================ */
  if (document.body.classList.contains("about-page")) {
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    /* --- press feedback lives on pointer-down, never on release --- */
    $$("button", document.body).forEach(btn => {
      btn.addEventListener("pointerdown", () => btn.classList.add("is-pressing"), { passive: true });
      const clear = () => btn.classList.remove("is-pressing");
      btn.addEventListener("pointerup", clear, { passive: true });
      btn.addEventListener("pointerleave", clear, { passive: true });
      btn.addEventListener("pointercancel", clear, { passive: true });
    });

    /* --- by-the-numbers — count up when the band enters the viewport --- */
    const statNums = $$(".about-stats__item strong[data-count], .about-frame__num strong[data-count]");
    if (statNums.length) {
      const statsIO = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          statsIO.unobserve(e.target);
          const target = parseInt(e.target.dataset.count, 10) || 0;
          const suffix = e.target.dataset.suffix || "";
          const numEl = e.target.querySelector(".about-stats__num, .about-frame__num-val") || e.target;
          const fmt = v => String(v) + suffix;
          if (prefersReduced || target <= 0) { numEl.textContent = String(target); return; }
          const t0 = performance.now();
          const dur = 1100;
          const step = now => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            numEl.textContent = String(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      }, { threshold: 0.4 });
      statNums.forEach(s => statsIO.observe(s));
    }

    /* --- marquee gates — pause the crawls while offscreen --- */
    const mqTracks = $$(".about-prologue__mq-track, .about-credits__mq-track");
    if (mqTracks.length) {
      const mqGate = new IntersectionObserver(es => {
        es.forEach(e => { e.target.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
      }, { threshold: 0.02 });
      mqTracks.forEach(t => mqGate.observe(t));
    }

    /* --- the title card: the two title lines drift at different
       speeds as the visitor scrolls into the page --- */
    const pl = document.getElementById("prologue");
    const plLines = pl ? $$(".about-prologue__line", pl) : [];
    const onTheater = () => {
      const y = window.scrollY, vh = window.innerHeight;
      if (y < vh * 1.3 && !prefersReduced) {
        plLines.forEach((ln, i) => ln.style.transform = `translate3d(0, ${(y * (i === 0 ? -0.08 : -0.16)).toFixed(1)}px, 0)`);
      } else if (!prefersReduced) {
        plLines.forEach(ln => ln.style.transform = "");
      }
    };

    /* --- cursor spotlight over the evolution --- */
    const actsSec = $(".about-acts");
    if (actsSec && !prefersReduced && window.matchMedia("(pointer: fine)").matches) {
      const onSpot = e => {
        const r = actsSec.getBoundingClientRect();
        actsSec.style.setProperty("--sx", (e.clientX - r.left).toFixed(1) + "px");
        actsSec.style.setProperty("--sy", (e.clientY - r.top).toFixed(1) + "px");
      };
      actsSec.addEventListener("pointermove", onSpot, { passive: true });
      actsSec.addEventListener("pointerenter", () => actsSec.classList.add("spot-on"));
      actsSec.addEventListener("pointerleave", () => actsSec.classList.remove("spot-on"));
    }

    /* --- zoom-out stage: frame expands as the visitor scrolls --- */
    const zoomStage = document.getElementById("aboutZoomStage");
    const zoomFrame = document.getElementById("aboutZoomFrame");
    const zoomLabels = $$("#aboutZoomLabels li");
    let zoomVisible = false;
    if (zoomStage && zoomFrame) {
      new IntersectionObserver(es => { zoomVisible = es[0].isIntersecting; }, { threshold: 0.02 }).observe(zoomStage);
      const zoomGhost1 = document.getElementById("aboutZoomGhost1");
      const zoomGhost2 = document.getElementById("aboutZoomGhost2");
      const onZoom = () => {
        if (!zoomVisible || prefersReduced) return;
        const r = zoomStage.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh * 0.62 - r.top) / (r.height * 0.9 + vh * 0.4), 0, 1);
        zoomFrame.style.setProperty("--zp", p.toFixed(3));
        const stage = Math.min(Math.floor(p * 4) + 1, 4);
        zoomLabels.forEach((l, i) => l.classList.toggle("is-on", i + 1 <= stage));
        if (zoomGhost1) {
          zoomGhost1.style.opacity = Math.max(0, (p - 0.4) * 0.5).toFixed(3);
          zoomGhost1.style.transform = `scale(${(1.06 + p * 0.12).toFixed(3)})`;
        }
        if (zoomGhost2) {
          zoomGhost2.style.opacity = Math.max(0, (p - 0.72) * 0.5).toFixed(3);
          zoomGhost2.style.transform = `scale(${(1.02 + p * 0.2).toFixed(3)})`;
        }
      };
      window.addEventListener("scroll", () => requestAnimationFrame(onZoom), { passive: true });
      window.addEventListener("resize", onZoom, { passive: true });
      onZoom();
    }

    /* --- the master reel: the whole story as a strip of film --- */
    const reelTrack = document.getElementById("aboutReelTrack");
    if (reelTrack) {
      const onReel = () => {
        if (prefersReduced) return;
        const doc = document.documentElement;
        const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
        const p = clamp(window.scrollY / maxScroll, 0, 1);
        const maxX = Math.max(reelTrack.scrollWidth - window.innerWidth, 0);
        reelTrack.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px, 0, 0)`;
      };
      window.addEventListener("scroll", () => requestAnimationFrame(onReel), { passive: true });
      window.addEventListener("resize", onReel, { passive: true });
      onReel();
    }

    /* --- env: light/dark world → nav adaptation --- */
    const envSections = [
      [".about-frame", "light"], [".about-credits", "light"],
      [".about-acts", "dark"], [".about-interlude", "dark"],
      [".about-philosophy", "dark"], [".about-what", "light"],
      [".about-now", "dark"], [".about-curious", "light"],
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
    window.addEventListener("scroll", () => requestAnimationFrame(computeEnv), { passive: true });
    window.addEventListener("resize", computeEnv, { passive: true });
    computeEnv();

    /* --- dominance: current chapter leads + CONTINUOUS world light --- */
    const actRows = $$(".about-act[data-act]");
    const atmo = document.getElementById("aboutAtmo");
    const worldRGB = {
      motion: [77, 141, 255], interaction: [0, 183, 212], environment: [139, 124, 246],
      experience: [230, 170, 60], people: [232, 112, 90], leadership: [140, 134, 168],
    };
    let lastAtmo = "";
    const mixAtmo = () => {
      if (!atmo || prefersReduced) return;
      const vh = window.innerHeight;
      let r = 0, g = 0, b = 0, r2 = 0, g2 = 0, b2 = 0, total = 0;
      for (const row of actRows) {
        const rc = row.getBoundingClientRect();
        const vis = Math.max(0, Math.min(rc.bottom, vh) - Math.max(rc.top, 0));
        if (vis <= 0) continue;
        const w = worldRGB[row.dataset.world] || worldRGB.motion;
        const f = vis / vh;
        r += w[0] * f; g += w[1] * f; b += w[2] * f;
        r2 += w[0] * f * 0.5; g2 += w[1] * f * 0.5; b2 += w[2] * f * 0.5;
        total += f;
      }
      if (total < 0.03) return; // keep the previous light (prologue / closing)
      const css = `radial-gradient(900px 620px at 50% 4%, rgba(${Math.round(r / total)},${Math.round(g / total)},${Math.round(b / total)},0.15), transparent 62%), radial-gradient(700px 480px at 12% 94%, rgba(${Math.round(r2 / total)},${Math.round(g2 / total)},${Math.round(b2 / total)},0.08), transparent 60%)`;
      if (css !== lastAtmo) { atmo.style.background = css; lastAtmo = css; }
    };
    const domIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        actRows.forEach(r => r.classList.toggle("is-current", r === e.target));
      }
    }, { threshold: 0.55, rootMargin: "0px 0px -18% 0px" });
    actRows.forEach(r => domIO.observe(r));

    /* --- direct manipulation: every chapter's still leans toward the
       pointer — velocity-smoothed, springs home on leave (Apple §2) --- */
    if (!prefersReduced && window.matchMedia("(pointer: fine)").matches) {
      $$(".about-act__scene").forEach(scene => {
        const fig = $(".about-figure", scene);
        if (!fig) return;
        let lx = 0, ly = 0, tx = 0, ty = 0, lTicking = false;
        const leanTick = () => {
          lx += (tx - lx) * 0.09; ly += (ty - ly) * 0.09;
          if (Math.abs(tx - lx) < 0.05 && Math.abs(ty - ly) < 0.05) { lx = tx; ly = ty; }
          fig.style.transform = `translate3d(${lx.toFixed(2)}px, ${ly.toFixed(2)}px, 0)`;
          lTicking = false;
        };
        scene.addEventListener("pointermove", e => {
          const r = scene.getBoundingClientRect();
          tx = ((e.clientX - r.left) / r.width - 0.5) * 9;
          ty = ((e.clientY - r.top) / r.height - 0.5) * 6;
          if (!lTicking) { lTicking = true; requestAnimationFrame(leanTick); }
        }, { passive: true });
        scene.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!lTicking) { lTicking = true; requestAnimationFrame(leanTick); } }, { passive: true });
      });
    }

    /* --- experience system: nodes read + the signal travels with scroll --- */
    const sysList = $(".about-system");
    if (sysList) {
      const sysIO = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("is-read"); sysIO.unobserve(e.target); }
        }
      }, { threshold: 0.7 });
      sysList.querySelectorAll("li").forEach(li => sysIO.observe(li));
      const onSys = () => {
        if (prefersReduced) return;
        const r = sysList.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4), 0, 1);
        sysList.style.setProperty("--sysdone", p.toFixed(3));
      };
      window.addEventListener("scroll", () => requestAnimationFrame(onSys), { passive: true });
      window.addEventListener("resize", onSys, { passive: true });
      onSys();
    }

    /* --- leadership duo: two visual states --- */
    const duo = $('.about-act__scene[data-world="leadership"] .about-duo');
    const leadState = $('.about-act__scene[data-world="leadership"] .about-statement');
    if (duo) {
      const duoIO = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) { duo.classList.add("is-live"); duoIO.disconnect(); }
        }
      }, { threshold: 0.55 });
      duoIO.observe(duo);
      if (leadState) {
        const stIO = new IntersectionObserver(entries => {
          for (const e of entries) {
            if (e.isIntersecting) { duo.classList.add("is-state-b"); stIO.disconnect(); }
          }
        }, { threshold: 0.45 });
        stIO.observe(leadState);
      }
    }

    /* --- leadership climax: the disciplines converge --- */
    const converge = $(".about-converge");
    if (converge) {
      const cvIO = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) { converge.classList.add("is-live"); cvIO.disconnect(); }
        }
      }, { threshold: 0.5 });
      cvIO.observe(converge);
    }

    /* --- one rAF loop for the remaining scroll scrubbers --- */
    let aboutTicking = false;
    const onAboutScroll = () => {
      onTheater();
      mixAtmo();
      aboutTicking = false;
    };
    window.addEventListener("scroll", () => {
      if (aboutTicking) return;
      aboutTicking = true;
      requestAnimationFrame(onAboutScroll);
    }, { passive: true });
    window.addEventListener("resize", onAboutScroll, { passive: true });
    onAboutScroll();

    /* --- story compass: number · name · progress · direct navigation --- */
    const compass = document.getElementById("aboutCompass");
    const compassBtn = document.getElementById("aboutCompassBtn");
    const compassList = document.getElementById("aboutCompassList");
    const compassNum = document.getElementById("aboutCompassNum");
    const compassName = document.getElementById("aboutCompassName");
    const compassFill = document.getElementById("aboutCompassFill");
    const prologue = document.getElementById("prologue");
    const compassIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!compass) continue;
        compass.hidden = false;
        compass.classList.toggle("is-show", !e.isIntersecting);
      }
    }, { threshold: 0 });
    if (compass && prologue) compassIO.observe(prologue);
    if (compassBtn && compassList) {
      /* the sheet materializes from its trigger and mirrors the same
         path on the way out (Apple §7 spatial consistency) */
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
      $$("button[data-act]", compassList).forEach(b => b.addEventListener("click", () => {
        const act = document.querySelector('.about-act[data-act="' + b.dataset.act + '"]');
        if (act) act.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        closeList();
      }));
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !compassList.hidden) {
          closeList();
          compassBtn.focus();
        }
      });
    }
    const actIO2 = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting || !compass) continue;
        const n = parseInt(e.target.dataset.act, 10) || 1;
        const num = String(n).padStart(2, "0");
        compassNum.textContent = num;
        const nameEl = e.target.querySelector(".about-act__name");
        compassName.textContent = nameEl ? nameEl.textContent.trim() : num;
        compassFill.style.transform = `scaleX(${(n / actRows.length).toFixed(3)})`;
      }
    }, { threshold: 0.35, rootMargin: "0px 0px -30% 0px" });
    actRows.forEach(r => actIO2.observe(r));
  }

  /* ============================================================
     MOBILE MENU (≤700px)
     ============================================================ */
  const navToggle = $("#navToggle");
  const mobileMenu = $("#mobileMenu");
  const mobileMQ = window.matchMedia("(max-width: 700px)");
  if (navToggle && mobileMenu) {
    const setMenu = open => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (open === isOpen) return;
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        mobileMenu.hidden = false;
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => requestAnimationFrame(() => mobileMenu.classList.add("is-open")));
        const firstLink = $("a", mobileMenu);
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        mobileMenu.classList.remove("is-open");
        document.body.style.overflow = "";
        setTimeout(() => { if (!mobileMenu.classList.contains("is-open")) mobileMenu.hidden = true; }, 450);
      }
    };
    navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
    const mobileClose = $("#mobileClose");
    if (mobileClose) mobileClose.addEventListener("click", () => setMenu(false));
    $$("a", mobileMenu).forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") setMenu(false);
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

    /* custom cursor (fine pointers, no reduced motion) */
    if (window.matchMedia("(pointer: fine)").matches && !reduced) {
      const dot = document.createElement("div");
      dot.className = "arena-cur-dot";
      const ring = document.createElement("div");
      ring.className = "arena-cur-ring";
      const label = document.createElement("div");
      label.className = "arena-cur-label";
      document.body.append(dot, ring, label);
      if (aboutRoot) document.body.classList.add("about-cur");
      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      document.addEventListener("pointermove", e => {
        mx = e.clientX; my = e.clientY;
        const t = e.target.closest("[data-cur]");
        if (t) {
          ring.classList.add("is-label");
          label.textContent = t.dataset.cur;
        } else ring.classList.remove("is-label");
        const hot = e.target.closest("a, button, [role='button'], input, select, textarea");
        ring.classList.toggle("is-hover", !!hot && !ring.classList.contains("is-label"));
      }, { passive: true });
      (function curLoop() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
        ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        label.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        requestAnimationFrame(curLoop);
      })();
    }
  }

})();
