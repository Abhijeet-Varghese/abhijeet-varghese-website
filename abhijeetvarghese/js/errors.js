/* ============================================================
   AV — CUSTOM ERROR EXPERIENCE SYSTEM · interaction layer
   ============================================================
   Configuration-driven. One shared architecture renders all eight
   states; the only thing that differs per route is the `data-error`
   value and the ERROR_CONFIG entry that drives:
     · the atmosphere variant (injected SVG centrepiece)
     · the ambient particle field tuning
     · the accent colour + which micro-interactions stay on

   It deliberately does NOT hand-roll the design system — it reuses
   the site's fonts, tokens, .btn / .page-close components, the
   data-reveal system and the prefers-reduced-motion contract.
   ============================================================ */
(() => {
  "use strict";

  // If an unexpected runtime error occurs, surface it as a body class so the
  // CSS reveal-failsafe can force the content visible — the page must never
  // appear blank even if this script partially fails.
  const fail = (e) => {
    document.body.classList.add("js-error");
    // eslint-disable-next-line no-console
    if (window.console && console.error) console.error("[errors]", e);
  };
  window.addEventListener("error", (e) => fail(e.error || e.message));
  window.addEventListener("unhandledrejection", (e) => fail(e.reason));

  const doc = document.documentElement;
  const body = document.body;
  const code = (body.getAttribute("data-error") || "").toLowerCase();
  if (!code) return;

  doc.classList.add("js");
  doc.classList.add("js-ok");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine   = window.matchMedia("(pointer: fine)").matches;
  body.classList.add("av-error", `error--${code}`);
  if (reduce) body.classList.add("av-reduce");

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ============================================================
     ERROR_CONFIG — the eight alternate states
     ============================================================ */
  const cfg = {
    "404":  { scene: "anomaly",     label: "Navigation anomaly",    retryable: false, count: 64,  drift: 0.10, connect: 0 },
    "403":  { scene: "restricted",  label: "Access restricted",     retryable: false, count: 40,  drift: 0.07, connect: 0 },
    "500":  { scene: "unstable",    label: "Unexpected interruption", retryable: true, count: 54, drift: 0.16, connect: 0.12 },
    "502":  { scene: "interrupted", label: "Bad gateway",           retryable: true, count: 50,  drift: 0.12, connect: 0.18 },
    "503":  { scene: "calibrate",   label: "Service unavailable",   retryable: true, count: 48,  drift: 0.06, connect: 0 },
    "504":  { scene: "timeout",     label: "Gateway timeout",       retryable: true, count: 44,  drift: 0.11, connect: 0.14 },
    "maintenance": { scene: "assemble", label: "System · Calibrating", retryable: false, count: 66, drift: 0.05, connect: 0.10 },
    "offline":     { scene: "signal",    label: "No connection",         retryable: true, count: 26,  drift: 0.03, connect: 0.05 }
  }[code] || { scene: "anomaly", label: "Not found", retryable: false, count: 60, drift: 0.10, connect: 0 };

  /* the kicker chip is authored in the HTML; keep it in sync where easy */
  const kick = $(".error-kicker .chapter__tag");
  if (kick) kick.textContent = cfg.label;

  /* ============================================================
     ATMOSPHERE LAYERS — inject the extra light fields / cursor lamp
     (kept in JS so the authored HTML stays lean; CSS provides the
     no-JS fallback of the base scene)
     ============================================================ */
  const scene = $(".error-scene");
  if (scene && !$(".error-scene__aurora")) {
    scene.insertAdjacentHTML("afterbegin",
      '<div class="error-scene__aurora" aria-hidden="true"></div>' +
      '<div class="error-scene__horizon" aria-hidden="true"></div>' +
      '<div class="error-scene__cursor" aria-hidden="true"></div>');
  }
  const cursorLamp = $(".error-scene__cursor");

  /* the code echo duplicates the digits via attr(data-code) */
  const codeEl = $(".error-code");
  if (codeEl && cfg.scene !== "assemble" && cfg.scene !== "signal") {
    codeEl.setAttribute("data-code", code === "maintenance" ? "" : code.toUpperCase());
  }

  /* ============================================================
     ATMOSPHERE — per-state SVG centrepiece (lightweight, CSS-animated)
     ============================================================ */
  const A = "#6EA8FF", B = "#96A0BE", C = "#EFF0EA";
  const art = {
    anomaly: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-ring" opacity="0.5">
          <circle cx="450" cy="320" r="250" stroke="${A}" stroke-width="1" stroke-dasharray="2 10"/>
          <circle cx="450" cy="320" r="300" stroke="${B}" stroke-width="0.7" opacity="0.5"/>
          <circle cx="450" cy="320" r="210" stroke="${A}" stroke-width="0.7" opacity="0.3" stroke-dasharray="1 14"/>
        </g>
        <g class="art-fold">
          <path d="M450 180 610 270 610 400 450 500 290 400 290 270Z" stroke="${A}" stroke-width="1"/>
          <path d="M450 180 560 300 450 500 340 300Z" stroke="${C}" stroke-width="0.7" opacity="0.7"/>
          <path d="M290 270 450 180M290 400 450 500M610 270 450 180M610 400 450 500" stroke="${B}" stroke-width="0.6" opacity="0.5"/>
          <path d="M450 180 450 500M290 270 610 270M290 400 610 400" stroke="${B}" stroke-width="0.5" opacity="0.35"/>
        </g>
        <g class="art-way">
          <path d="M430 320h40M450 300v40" stroke="${C}" stroke-width="1.2" opacity="0.85"/>
          <circle cx="450" cy="320" r="4" fill="${C}"/>
          <circle cx="450" cy="320" r="12" stroke="${A}" stroke-width="0.8" opacity="0.8"/>
          <circle class="art-ping" cx="450" cy="320" r="12" stroke="${A}" stroke-width="0.8" opacity="0"/>
        </g>
        <g class="art-datum" opacity="0.7">
          <circle cx="200" cy="180" r="3" fill="${A}"/>
          <circle cx="720" cy="150" r="2.4" fill="${C}" opacity="0.6"/>
          <circle cx="150" cy="470" r="2.2" fill="${C}" opacity="0.5"/>
          <circle cx="760" cy="430" r="3" fill="${A}"/>
          <circle cx="520" cy="90" r="2" fill="${C}" opacity="0.5"/>
        </g>
      </svg>`,
    restricted: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-gate">
          <path d="M360 150v340M540 150v340" stroke="${A}" stroke-width="1"/>
          <circle cx="450" cy="320" r="128" stroke="${B}" stroke-width="0.8" stroke-dasharray="3 8"/>
          <circle cx="450" cy="320" r="176" stroke="${A}" stroke-width="0.7" opacity="0.6"/>
          <path class="art-gatestroke" d="M322 320h256" stroke="${C}" stroke-width="0.7" opacity="0.6"/>
        </g>
        <g class="art-lock" opacity="0.9">
          <rect x="432" y="300" width="36" height="44" rx="7" stroke="${A}" stroke-width="1"/>
          <path d="M441 300v-8a9 9 0 0 1 18 0v8" stroke="${A}" stroke-width="1"/>
          <circle cx="450" cy="322" r="3.4" fill="${C}"/>
          <circle class="art-ping" cx="450" cy="322" r="20" stroke="${A}" stroke-width="0.7" opacity="0"/>
        </g>
        <g class="art-node" opacity="0.6">
          <circle cx="210" cy="170" r="2.6" fill="${C}"/>
          <circle cx="690" cy="150" r="2.2" fill="${C}"/>
          <circle cx="210" cy="470" r="2.2" fill="${C}"/>
          <circle cx="690" cy="470" r="2.6" fill="${A}"/>
        </g>
        <g class="art-energy" opacity="0.4">
          <path d="M380 320h140" stroke="${C}" stroke-width="0.8" stroke-dasharray="1 14"/>
        </g>
      </svg>`,
    unstable: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-slices">
          <path class="s1" d="M450 120 560 200 450 320 340 200Z" stroke="${A}" stroke-width="1"/>
          <path class="s2" d="M450 320 560 200 600 400 450 520Z" stroke="${B}" stroke-width="0.8"/>
          <path class="s3" d="M450 320 340 200 300 400 450 520Z" stroke="${A}" stroke-width="0.8"/>
          <path class="s4" d="M450 120 340 200 300 400 450 320Z" stroke="${C}" stroke-width="0.7" opacity="0.7"/>
        </g>
        <g class="art-threads" opacity="0.6">
          <path d="M450 320 450 520" stroke="${C}" stroke-width="0.6"/>
          <path d="M450 320 560 200" stroke="${C}" stroke-width="0.6"/>
          <path d="M450 320 340 200" stroke="${C}" stroke-width="0.6"/>
        </g>
        <!-- signal-spike dish — instability readout -->
        <g opacity="0.55">
          <path d="M360 470h20M420 470h20M480 470h20M540 470h20" stroke="${B}" stroke-width="1"/>
          <path d="M380 470V430M440 470V450M500 470V414M560 470V440" stroke="${A}" stroke-width="1.2"/>
          <path d="M360 486h200" stroke="${B}" stroke-width="0.5" opacity="0.5"/>
        </g>
      </svg>`,
    interrupted: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-node">
          <circle cx="230" cy="320" r="22" stroke="${A}" stroke-width="1"/>
          <circle cx="230" cy="320" r="5" fill="${A}"/>
          <circle class="art-ping" cx="230" cy="320" r="22" stroke="${A}" stroke-width="0.6" opacity="0"/>
        </g>
        <g class="art-node">
          <circle cx="670" cy="320" r="22" stroke="${B}" stroke-width="1"/>
          <circle cx="670" cy="320" r="5" fill="${B}"/>
        </g>
        <path class="art-line" d="M252 320h150" stroke="${A}" stroke-width="1.2" stroke-dasharray="5 7"/>
        <path class="art-line" d="M498 320h150" stroke="${A}" stroke-width="1.2" stroke-dasharray="5 7"/>
        <rect class="art-break" x="434" y="316" width="32" height="8" rx="4" fill="none" stroke="${C}" stroke-width="0.8" opacity="0.85"/>
        <circle class="art-packet" cx="252" cy="320" r="3" fill="${C}"/>
        <g class="art-flux" opacity="0.5">
          <path d="M252 320h168M498 320h172" stroke="${A}" stroke-width="0.5" stroke-dasharray="2 18"/>
        </g>
      </svg>`,
    calibrate: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-spin">
          <circle cx="450" cy="300" r="150" stroke="${A}" stroke-width="1" stroke-dasharray="2 12"/>
          <circle cx="450" cy="300" r="190" stroke="${B}" stroke-width="0.6" stroke-dasharray="1 16" opacity="0.7"/>
        </g>
        <g class="art-spin">
          <circle cx="450" cy="300" r="120" stroke="${C}" stroke-width="0.7" stroke-dasharray="40 220" opacity="0.85"/>
          <circle cx="450" cy="300" r="70" stroke="${A}" stroke-width="0.6" stroke-dasharray="120 320" opacity="0.6"/>
        </g>
        <circle class="art-pulse" cx="450" cy="300" r="58" stroke="${A}" stroke-width="0.8" opacity="0.7"/>
        <circle class="art-progress" cx="450" cy="300" r="90" fill="none" stroke="${A}" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="565" stroke-dashoffset="565" style="--pd:565" opacity="0.9"/>
        <circle cx="450" cy="300" r="6" fill="${A}"/>
      </svg>`,
    timeout: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <path class="art-travel" d="M170 400 C 360 240 560 240 730 330" stroke="${A}" stroke-width="1" stroke-dasharray="4 10"/>
        <g class="art-node">
          <circle cx="170" cy="400" r="18" stroke="${B}" stroke-width="1"/>
          <circle cx="170" cy="400" r="4" fill="${B}"/>
        </g>
        <g class="art-node">
          <circle cx="730" cy="330" r="18" stroke="${A}" stroke-width="1"/>
          <circle cx="730" cy="330" r="4" fill="${A}"/>
          <path d="M730 302v56M702 330h56" stroke="${A}" stroke-width="0.7" opacity="0.6"/>
        </g>
        <circle class="art-ghost" cx="560" cy="316" r="3" fill="${C}"/>
        <circle class="art-fade3" cx="680" cy="330" r="3" fill="${A}"/>
        <g opacity="0.4">
          <path d="M170 400h30" stroke="${B}" stroke-width="0.6"/>
          <path d="M700 330h30" stroke="${A}" stroke-width="0.6"/>
        </g>
      </svg>`,
    assemble: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-frag">
          <path class="f1" d="M450 140 520 210 450 300 380 210Z" stroke="${A}" stroke-width="1"/>
          <path class="f2" d="M450 440 520 500 450 560 380 500Z" stroke="${B}" stroke-width="0.8"/>
          <path class="f3" d="M250 320 320 290 320 360 250 340Z" stroke="${C}" stroke-width="0.7" opacity="0.8"/>
          <path class="f4" d="M650 300 720 320 680 380 620 360Z" stroke="${A}" stroke-width="0.8"/>
        </g>
        <g class="art-grid" opacity="0.5">
          <path d="M250 150 250 500M320 130 320 500M380 200 380 480M450 120 450 560M520 130 520 500M580 200 580 480M650 150 650 500" stroke="${B}" stroke-width="0.6"/>
        </g>
        <g class="art-blue" opacity="0.5">
          <path d="M450 140 520 210 450 300 380 210 450 140" stroke="${A}" stroke-width="0.8" fill="none"/>
        </g>
        <g class="art-spin">
          <circle cx="450" cy="320" r="170" stroke="${A}" stroke-width="0.8" stroke-dasharray="2 12" opacity="0.6"/>
        </g>
        <g class="art-mark" opacity="0.7">
          <path d="M450 250v28M450 362v28M380 320h28M492 320h28" stroke="${C}" stroke-width="0.7"/>
        </g>
      </svg>`,
    signal: `
      <svg viewBox="0 0 900 640" fill="none" aria-hidden="true">
        <g class="art-node" opacity="0.5">
          <circle cx="230" cy="320" r="16" stroke="${B}" stroke-width="1"/>
          <circle cx="230" cy="320" r="4" fill="${B}"/>
        </g>
        <path class="art-fade" d="M246 320h140" stroke="${B}" stroke-width="0.8" stroke-dasharray="3 9"/>
        <path class="art-fade2" d="M446 320h140" stroke="${B}" stroke-width="0.8" stroke-dasharray="3 9"/>
        <circle class="art-node art-pulse" cx="670" cy="320" r="13" stroke="${A}" stroke-width="0.9" opacity="0.5"/>
        <g class="art-meter" opacity="0.5">
          <path d="M250 340h180" stroke="${B}" stroke-width="0.5" opacity="0.4"/>
          <path d="M270 340v-10M310 340v-18M350 340v-26M390 340v-14M430 340v-20" stroke="${A}" stroke-width="1"/>
        </g>
      </svg>`
  };

  const artWrap = $("#errArt");
  if (artWrap && art[cfg.scene]) {
    artWrap.innerHTML = art[cfg.scene];
    /* let the injection paint, then fade in */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      artWrap.classList.add("is-ready");
    }));
  }

  /* ============================================================
     AMBIENT PARTICLES — one lightweight rAF loop (canvas)
     ============================================================ */
  const canvas = $("#errCanvas");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, pts = [], raf = null, dpr = 1, visible = true;
    const DPRCAP = 1.5;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPRCAP);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(cfg.count, Math.round((W * H) / 26000));
      pts = new Array(target).fill(0).map(() => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.6 + Math.random() * 1.6,
        a: 0.12 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * cfg.drift,
        vy: (Math.random() - 0.5) * cfg.drift,
        tw: Math.random() * Math.PI * 2
      }));
    };

    const step = () => {
      if (!visible) { raf = null; return; }
      ctx.clearRect(0, 0, W, H);
      const col = cfg.connect > 0 ? "110,168,255" : "148,170,230";
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
        p.tw += 0.02;
        const a = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${a.toFixed(3)})`;
        ctx.fill();
      }
      if (cfg.connect > 0) {
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 130 * 130) {
              const alpha = (1 - Math.sqrt(d2) / 130) * 0.12;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
              ctx.strokeStyle = `rgba(${col},${alpha.toFixed(3)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => { if (!raf) { visible = true; raf = requestAnimationFrame(step); } };
    const stop  = () => { visible = false; if (raf) { cancelAnimationFrame(raf); raf = null; } };

    resize();
    start();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  /* ============================================================
     POINTER PARALLAX — scene layers drift with a fine pointer
     ============================================================ */
  if (fine && !reduce) {
    const layers = [
      [$("#errArt"), 0.05],
      [$(".error-scene__grid"), 0.02],
      [$(".error-scene__glow"), 0.012]
    ].filter(([el]) => el);
    const glowAlt = $(".error-scene__glow.alt");
    let px = 0, py = 0, rx = 0, ry = 0, raf = null;
    window.addEventListener("pointermove", e => {
      px = (e.clientX / window.innerWidth - 0.5);
      py = (e.clientY / window.innerHeight - 0.5);
      if (!raf) raf = requestAnimationFrame(() => {
        rx = lerp(rx, px, 0.08); ry = lerp(ry, py, 0.08);
        for (const [el, f] of layers) {
          if (el) el.style.transform = `translate3d(${(-rx * f * 100).toFixed(2)}px, ${(-ry * f * 100).toFixed(2)}px, 0)`;
        }
        if (glowAlt) glowAlt.style.transform = `translate3d(${(ry * 44).toFixed(2)}px, ${(rx * 30).toFixed(2)}px, 0)`;
        raf = null;
      });
    }, { passive: true });

    /* cursor lamp — a soft reveal that follows the pointer */
    if (cursorLamp) {
      let lraf = false;
      window.addEventListener("pointermove", e => {
        if (lraf) return;
        lraf = requestAnimationFrame(() => {
          cursorLamp.style.setProperty("--cx", e.clientX + "px");
          cursorLamp.style.setProperty("--cy", e.clientY + "px");
          lraf = false;
        });
      }, { passive: true });
    }

    /* tilt the error code gently toward the pointer */
    if (codeEl && cfg.scene !== "assemble" && cfg.scene !== "signal") {
      codeEl.classList.add("is-tilted");
      let traf = false;
      window.addEventListener("pointermove", e => {
        if (traf) return;
        traf = requestAnimationFrame(() => {
          const r = codeEl.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          codeEl.style.transform = `perspective(1000px) rotateX(${(-dy * 5).toFixed(1)}deg) rotateY(${(dx * 6).toFixed(1)}deg)`;
          traf = false;
        });
      }, { passive: true });
      codeEl.addEventListener("pointerleave", () => { codeEl.style.transform = ""; }, { passive: true });
    }
  }

  /* ============================================================
     ACTIONS — retry / back behaviour
     ============================================================ */
  $$("[data-action='back']").forEach(b => b.addEventListener("click", () => {
    const ref = document.referrer;
    if (ref && new URL(ref).origin === location.origin && history.length > 1) history.back();
    else window.location.href = b.getAttribute("href") || "/";
  }));
  $$("[data-action='retry']").forEach(b => b.addEventListener("click", () => window.location.reload()));

  /* ============================================================
     OFFLINE — graceful recovery + connection re-establishment
     ============================================================ */
  if (cfg.retryable && code !== "offline") {
    const tryAgainWhenOnline = () => {
      if (navigator.onLine) {
        /* the reconnection banner is transient; allow the visitor to act or stay */
        body.classList.add("is-online");
      }
    };
    window.addEventListener("online", tryAgainWhenOnline);
  }

  /* ============================================================
     REVEAL — staged entrance on load (uses the site's data-reveal)
     ============================================================ */
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el, i) => el.style.setProperty("--d", `${(0.1 + Math.min(i * 0.09, 0.6)).toFixed(2)}s`));
  if (reduce) {
    revealEls.forEach(el => el.classList.add("in-view"));
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() =>
      revealEls.forEach(el => el.classList.add("in-view"))
    ));
  }

  /* ============================================================
     SERVICE WORKER — offline fallback (secure contexts only)
     ============================================================ */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
})();
