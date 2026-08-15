/* ============================================================
   AV OS — core: router, shell, palette, theme, shortcuts, UI kit
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- UI kit ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const icon = (name, size = 17) => {
    const P = {
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 2.6 4 5.8 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.8-4-9s1.2-6.4 4-9z"/>',
      layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
      doc: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 12h6M9 16h6"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
      film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
      quote: '<path d="M8 6H5a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2a2 2 0 0 0 2-2v-6H6M22 6h-3a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2a2 2 0 0 0 2-2v-6h-3"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      bar: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      spark: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>',
      shield: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',
      save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
      refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
      copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
      hide: '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1M2 2l20 20"/>',
      send: '<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>',
      check: '<path d="m4 12.5 5 5L20 6"/>',
      chevL: '<path d="m15 18-6-6 6-6"/>',
      chevR: '<path d="m9 18 6-6-6-6"/>',
      grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
      upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
      download: '<path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
      folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>',
      tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
      users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 14.5a6.5 6.5 0 0 1 4 5.5"/>',
      key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 8.8-8.8M14 9l3 3M17 6l2.5 2.5"/>',
      db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
      zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
      moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
      x: '<path d="m6 6 12 12M18 6 6 18"/>',
      arrowR: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
      arrowL: '<path d="M20 12H4m6-6-6 6 6 6"/>',
      up: '<path d="m6 15 6-6 6 6"/>',
      down: '<path d="m6 9 6 6 6-6"/>',
      home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"/><path d="M9 22V12h6v10"/>',
      chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 9v9M17 5v13"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      ai: '<path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="4"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-1.4 1-1.4 1.9v.3M12 17.5h.01"/>',
      card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
      sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
      play: '<path d="m7 4 13 8-13 8V4z"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.grid}</svg>`;
  };

  const toast = (msg, type = "ok", timeout = 3200) => {
    let box = $(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (type === "error" ? " toast--error" : type === "accent" ? " toast--accent" : "");
    t.innerHTML = `${icon(type === "error" ? "x" : type === "accent" ? "spark" : "check", 17)}<span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 320); }, timeout);
  };

  const modal = ({ title, body, actions }) => {
    const bd = document.createElement("div");
    bd.className = "modal-backdrop";
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal__head"><h3 class="modal__title">${title}</h3>
          <button class="icon-btn" data-close>${icon("x", 16)}</button></div>
        <div class="modal__body">${body}</div>
        ${actions ? `<div class="modal__foot">${actions}</div>` : ""}
      </div>`;
    document.body.appendChild(bd);
    const close = () => bd.remove();
    bd.addEventListener("click", e => { if (e.target === bd) close(); });
    $("[data-close]", bd).addEventListener("click", close);
    return { el: bd, close, root: $(".modal", bd) };
  };

  const confirmDlg = (title, body, onYes, danger = true) => {
    const m = modal({
      title,
      body: `<p style="color:var(--ink-2);font-size:13.5px;line-height:1.6">${body}</p>`,
      actions: `<button class="btn btn--ghost" data-no>Cancel</button>
                <button class="btn ${danger ? "btn--danger-soft" : "btn--primary"}" data-yes>${danger ? "Delete" : "Confirm"}</button>`
    });
    $("[data-no]", m.el).addEventListener("click", m.close);
    $("[data-yes]", m.el).addEventListener("click", () => { m.close(); onYes(); });
  };

  /* ---------- Nav model ---------- */
  AV.nav = [
    { group: "Workspace", items: [
      { id: "dashboard", label: "Dashboard", icon: "grid" },
      { id: "knowledge", label: "Knowledge Search", icon: "search" },
      { id: "notifications", label: "Notifications", icon: "bell" }
    ]},
    { group: "Build", items: [
      { id: "homepage", label: "Homepage Builder", icon: "home" },
      { id: "pages", label: "Pages", icon: "doc" },
      { id: "navigation", label: "Navigation", icon: "menu" },
      { id: "projects", label: "Projects", icon: "briefcase" },
      { id: "casestudies", label: "Case Studies", icon: "layers" },
      { id: "clients", label: "Clients", icon: "users" },
      { id: "thinking", label: "Thinking", icon: "quote" },
      { id: "journal", label: "Journal", icon: "pen" },
      { id: "futurelab", label: "Future Lab", icon: "spark" }
    ]},
    { group: "Business", items: [
      { id: "crm", label: "CRM Pipeline", icon: "target" },
      { id: "contacts", label: "Contacts", icon: "users" },
      { id: "companies", label: "Companies", icon: "briefcase" },
      { id: "meetings", label: "Meetings", icon: "calendar" },
      { id: "bizprojects", label: "Business Projects", icon: "layers" },
      { id: "proposals", label: "Proposals", icon: "doc" },
      { id: "campaigns", label: "Campaigns", icon: "target" },
      { id: "automations", label: "Automations", icon: "zap" }
    ]},
    { group: "Grow", items: [
      { id: "media", label: "Media", icon: "image" },
      { id: "downloads", label: "Downloads", icon: "download" },
      { id: "testimonials", label: "Testimonials", icon: "check" },
      { id: "speaking", label: "Speaking", icon: "play" },
      { id: "forms", label: "Forms", icon: "card" },
      { id: "bookings", label: "Bookings", icon: "calendar" },
      { id: "leads", label: "Leads", icon: "target" },
      { id: "seo", label: "SEO", icon: "search" },
      { id: "keywords", label: "Keywords", icon: "key" },
      { id: "opportunities", label: "Opportunities", icon: "target" },
      { id: "engagement", label: "Engagement", icon: "spark" },
      { id: "analytics", label: "Analytics", icon: "chart" },
      { id: "research", label: "Research", icon: "search" },
      { id: "socialhub", label: "Social & Tracking", icon: "users" }
    ]},
    { group: "Intelligence", items: [
      { id: "aiagents", label: "AI Agents", icon: "zap" },
      { id: "aistudio", label: "AI Studio", icon: "ai" },
      { id: "copilot", label: "AI Copilot", icon: "spark" },
      { id: "analytics", label: "Analytics", icon: "chart" },
      { id: "knowledge", label: "Knowledge", icon: "book" },
      { id: "designsystem", label: "Design System", icon: "sliders" },
      { id: "knowledgegraph", label: "Knowledge & Truth", icon: "layers" }
    ]},
    { group: "System", items: [
      { id: "publishing", label: "Publishing", icon: "send" },
      { id: "versions", label: "Versions", icon: "clock" },
      { id: "notifications", label: "Notifications", icon: "bell" },
      { id: "platform", label: "Platform", icon: "zap" },
      { id: "health", label: "Health", icon: "shield" },
      { id: "security", label: "Security", icon: "key" }
    ]},
    { group: "System", items: [
      { id: "users", label: "Users", icon: "users" },
      { id: "emailtemplates", label: "Email Templates", icon: "mail" },
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "backups", label: "Backups", icon: "db" },
      { id: "integrations", label: "Integrations", icon: "zap" },
      { id: "logs", label: "Logs", icon: "list" }
    ]}
  ];

  /* ---------- Router ---------- */
  const routes = {};      // id -> renderer (returns HTML string)
  const afterFns = {};    // id -> fn(viewEl) for post-render binding
  let current = null;

  AV.router = {
    register(id, renderer) { routes[id] = renderer; },
    after(id, fn) { afterFns[id] = fn; },
    go(id, params) {
      const r = routes[id];
      if (!r) { console.warn("no route", id); return; }
      current = { id, params: params || {} };
      const qs = params ? new URLSearchParams(params).toString() : "";
      location.hash = id + (qs ? "?" + qs : "");
      render();
      $(".view").scrollTop = 0;
    },
    current: () => current,
    title(id) {
      const flat = AV.nav.flatMap(g => g.items).find(i => i.id === id);
      return flat ? flat.label : "AV OS";
    }
  };

  /* ---------- Shell ---------- */
  const renderShell = () => {
    const app = $(".app");
    app.innerHTML = `
      ${sidebarHTML()}
      <div class="sb-scrim" id="sbScrim" hidden></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn sb-toggle" id="sbToggle" aria-label="Toggle sidebar" style="display:none">${icon("menu")}</button>
          <nav class="crumb" aria-label="Breadcrumb"><span>AV OS</span>${icon("chevR", 12)}<b id="crumbLabel">Dashboard</b></nav>
          <div class="topbar__spacer"></div>
          <button class="search-btn" id="paletteBtn" aria-label="Search and commands">
            ${icon("search", 15)}<span>Search or run a command…</span><kbd>⌘K</kbd>
          </button>
          <button class="icon-btn" id="helpBtn" aria-label="How do I…? guide" title="How do I…?">?</button>
          <button class="icon-btn" id="themeBtn" aria-label="Toggle theme">${icon("moon")}</button>
          <div style="position:relative">
            <button class="icon-btn" id="notifBtn" aria-label="Notifications">${icon("bell")}<span class="dot" id="notifDot"></span></button>
            <div class="pop" id="notifPop" hidden></div>
          </div>
          <span class="chip chip--ok" id="apiStatus" style="display:none;cursor:default" title="Backend connection">${icon("check", 11)} Backend</span>
          <span class="chip chip--muted" id="pubStatus" style="display:none;cursor:default" title="Publishing status">${icon("send", 11)} LIVE</span>
          <button class="avatar-lg" id="avatarBtn" aria-label="Account">AV</button>
        </header>
        <main class="view" id="view"></main>
      </div>`;
    bindShell();
  };

  const sidebarHTML = () => `
    <aside class="sidebar" id="sidebar" aria-label="Primary">
      <div class="sidebar__head">
        <div class="sidebar__logo">AV</div>
        <div style="min-width:0">
          <p class="sidebar__title">AV <em>OS</em></p>
          <p class="sidebar__sub">Creative Intelligence</p>
        </div>
        <button class="sidebar__collapse" id="sbCollapse" aria-label="Collapse sidebar">${icon("chevL", 15)}</button>
      </div>
      <nav class="sidebar__nav" id="sidebarNav"></nav>
      <div class="sidebar__foot">
        <div class="avatar">AV</div>
        <div style="min-width:0">
          <p class="sidebar__foot-name">Abhijeet Varghese</p>
          <p class="sidebar__foot-role">Super Admin</p>
        </div>
      </div>
    </aside>`;

  const renderSidebar = () => {
    const nav = $("#sidebarNav");
    nav.innerHTML = AV.nav.map(g => `
      <p class="sidebar__group">${g.group}</p>
      ${g.items.map(i => `
        <button class="sidebar__item${current?.id === i.id ? " is-active" : ""}" data-route="${i.id}">
          ${icon(i.icon)}<span>${i.label}</span>${i.badge ? `<span class="badge">${i.badge}</span>` : ""}
        </button>`).join("")}
    `).join("");
    $$("[data-route]", nav).forEach(b => b.addEventListener("click", () => AV.router.go(b.dataset.route)));
  };

  const bindShell = () => {
    $("#sbCollapse").addEventListener("click", () => {
      const app = $(".app");
      app.classList.toggle("sb-collapsed");
      if (innerWidth <= 1024) app.classList.remove("sb-collapsed");
      AV.store.set("settings", { ...AV.store.get("settings"), sidebarCollapsed: app.classList.contains("sb-collapsed") });
    });
    $("#sbToggle").addEventListener("click", () => {
      $(".app").classList.toggle("sb-open");
      $("#sbScrim").hidden = !$(".app").classList.contains("sb-open");
    });
    $("#sbScrim").addEventListener("click", () => {
      $(".app").classList.remove("sb-open");
      $("#sbScrim").hidden = true;
    });
    $("#themeBtn").addEventListener("click", toggleTheme);
    $("#helpBtn").addEventListener("click", () => {
      const m = modal({
        title: "How do I…?",
        body: `<div style="display:grid;gap:14px;font-size:13px;line-height:1.6">
          ${[
            ["Edit my homepage", "Homepage Builder → pick the Hero section → Edit. Change headline, lede, buttons and the portrait image from your media library."],
            ["Change the hero picture", "Homepage Builder → Hero → Edit → tap a thumbnail under “Portrait / hero image”. Upload new images in Media first."],
            ["Publish the website", "Publishing → Publish (or enable auto-publish in Platform → Feature flags; every save then publishes automatically)."],
            ["Add a project / case study", "Projects → New project → fill Challenge / Approach / Role / Outcome → Publish. It appears in Featured Work + Case Studies."],
            ["See who contacted me", "Leads → the CRM pipeline shows every enquiry, score and follow-up task. Calendly bookings land here automatically."],
            ["Connect Search Console / GA4 / Calendly", "Integrations → find the service → Configure → paste the key/ID → Save + Test. Status only shows CONNECTED after a real check."],
            ["Let the AI agents work", "AI Agents → check the dashboard, run cycles, pause scopes. Agents draft content — nothing publishes without your review."],
            ["Fix a broken page / roll back", "Publishing → Deployments → Rollback restores the previous live site; Backups → Restore brings back content and leads."],
            ["Where is everything stored?", "Public site = static files in public_html/site. Content = MySQL (content_store). Uploads = private storage, served via /media."],
          ].map(([q, a]) => `<div><b style="color:var(--ink-1)">${q}</b><p style="color:var(--ink-3);margin-top:2px">${a}</p></div>`).join("")}
        </div>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    $("#paletteBtn").addEventListener("click", openPalette);
    $("#avatarBtn").addEventListener("click", () => {
      const m = modal({
        title: "Account",
        body: `
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div class="avatar" style="width:52px;height:52px;font-size:18px;background:linear-gradient(135deg,var(--accent),var(--azure));color:#fff;display:grid;place-items:center;border-radius:50%">AV</div>
            <div><p style="font-weight:600;font-size:15px">Abhijeet Varghese</p>
            <p style="color:var(--ink-3);font-size:12.5px">hi@abhijeetvarghese.com</p>
            <span class="chip chip--accent" style="margin-top:6px">Super Admin</span></div>
          </div>
          <div class="field"><label>Full name</label><input value="Abhijeet Varghese"></div>
          <div class="field" style="margin-top:12px"><label>Email</label><input value="hi@abhijeetvarghese.com"></div>`,
        actions: `<button class="btn btn--ghost" data-close2>Close</button><button class="btn btn--primary" data-save>Save changes</button>`
      });
      $("[data-close2]", m.el).addEventListener("click", m.close);
      $("[data-save]", m.el).addEventListener("click", () => { m.close(); toast("Profile updated"); });
    });
    $$(".icon-btn", $("#notifBtn").parentElement);
    $("#notifBtn").addEventListener("click", e => {
      e.stopPropagation();
      const pop = $("#notifPop");
      pop.hidden = !pop.hidden;
      if (!pop.hidden) {
        const ns = AV.store.get("notifications");
        const unread = ns.filter(n => n.unread);
        pop.innerHTML = `
          <div class="pop__head"><p class="pop__title">Notifications</p>
            <button class="btn btn--sm btn--soft" id="markAll">Mark all read</button></div>
          <div class="pop__list">
            ${ns.map(n => `<div class="pop-item" ${n.unread ? 'style="background:var(--accent-soft)"' : ""}>
              <div class="pop-item__icon">${icon(n.icon === "lead" ? "target" : n.icon === "book" ? "calendar" : n.icon === "seo" ? "search" : n.icon === "ai" ? "ai" : n.icon === "backup" ? "db" : "chart")}</div>
              <div><p class="pop-item__text">${n.text}</p><p class="pop-item__time">${n.time}</p></div>
            </div>`).join("")}
          </div>`;
        $("#markAll", pop).addEventListener("click", () => {
          AV.store.set("notifications", ns.map(n => ({ ...n, unread: false })));
          $("#notifDot").style.display = "none";
          pop.innerHTML = `<div class="empty" style="padding:26px"><p style="font-size:13px">All caught up ✦</p></div>`;
        });
      }
    });
    document.addEventListener("click", e => {
      if (!e.target.closest("#notifBtn") && !$("#notifPop").hidden) $("#notifPop").hidden = true;
    });
    const unreadCount = AV.store.get("notifications").filter(n => n.unread).length;
    if (!unreadCount) $("#notifDot").style.display = "none";
  };

  const toggleTheme = () => {
    const s = AV.store.get("settings");
    s.theme = s.theme === "dark" ? "light" : "dark";
    AV.store.set("settings", s);
    applyTheme();
    $("#themeBtn").innerHTML = icon(s.theme === "dark" ? "sun" : "moon");
  };

  const applyTheme = () => {
    const s = AV.store.get("settings");
    document.documentElement.dataset.theme = s.theme || "light";
    if ($("#themeBtn")) $("#themeBtn").innerHTML = icon(s.theme === "dark" ? "sun" : "moon");
  };

  /* ---------- Backend status + publish ---------- */
  AV.emitStatus = (state) => {
    const el = $("#apiStatus");
    if (!el) return;
    const states = {
      connected: ["ok", "Database connected"],
      saved:     ["ok", "DRAFT SAVED — not published"],
      publishing:["accent", "Publishing…"],
      published: ["ok", "PUBLISHED"],
      "local-draft": ["warn", "OFFLINE LOCAL DRAFT"],
      "save-failed": ["danger", "SAVE FAILED"],
      conflict:  ["danger", "CONFLICT — reload or overwrite"],
    };
    const [cls, label] = states[state] || (AV.api.connected ? states.connected : states["local-draft"]);
    el.style.display = "inline-flex";
    el.className = "chip chip--" + cls;
    el.innerHTML = `${icon(state === "publishing" ? "refresh" : "check", 11)} ${label}`;
  };
  AV.publishSite = async () => {
    const r = await AV.api.publish();
    if (r.ok) toast(`Website published — ${r.pages || "?"} pages, ${r.articles || "?"} articles regenerated`, "accent");
    else toast("Publish failed — " + (r.error || "server unreachable"), "error");
  };

  /* ---------- publish status chip (poll /api/system/publishing) ---------- */
  const refreshPubStatus = async () => {
    const el = $("#pubStatus");
    if (!el) return;
    try {
      const r = await fetch("/api/system/publishing", { credentials: "same-origin" });
      const d = await r.json();
      if (!d.ok || !d.data) return;
      const q = d.data.queue && d.data.queue.current;
      const ls = d.data.live_sync || {};
      let label = "LIVE", cls = "chip--ok";
      if (q && q.status === "processing") { label = "PUBLISHING"; cls = "chip--accent"; }
      else if (q && q.status === "failed") { label = "FAILED"; cls = "chip--danger"; }
      else if (ls.failures >= 3) { label = "ATTENTION"; cls = "chip--warn"; }
      else if (ls.last_publish) {
        const secs = Math.round((Date.now() - new Date(ls.last_publish.replace(" ", "T")))/1000);
        if (secs < 120) label = "LIVE · " + secs + "s ago";
      }
      el.className = "chip " + cls;
      el.innerHTML = `${icon("send", 11)} ${label}`;
      el.style.display = "inline-flex";
      el.title = ls.last_publish ? "Last published " + ls.last_publish : "Publishing status";
    } catch (e) { /* keep last state */ }
  };
  setInterval(refreshPubStatus, 15000);
  setTimeout(refreshPubStatus, 2500);

  /* ---------- Command palette ---------- */
  const paletteCommands = () => {
    const cmds = [];
    AV.nav.flatMap(g => g.items).forEach(i => cmds.push({ t: i.label, d: "Open view", k: "", icon: i.icon, run: () => AV.router.go(i.id) }));
    cmds.push({ t: "Toggle theme", d: "Light / dark", k: "⌘⇧L", icon: "moon", run: toggleTheme });
    cmds.push({ t: "Create project", d: "New case study", k: "", icon: "plus", run: () => AV.router.go("projects", { action: "new" }) });
    cmds.push({ t: "Create article", d: "Essay or journal", k: "", icon: "plus", run: () => AV.router.go("thinking", { action: "new" }) });
    cmds.push({ t: "Upload media", d: "Open media library", k: "", icon: "upload", run: () => AV.router.go("media", { action: "upload" }) });
    cmds.push({ t: "Run backup", d: "Snapshot now", k: "", icon: "refresh", run: () => AV.router.go("backups", { action: "backup" }) });
    cmds.push({ t: "Publish website", d: "Regenerate the live site", k: "\u2318\u21E7P", icon: "send", run: () => AV.publishSite() });
    cmds.push({ t: "Open knowledge search", d: "Ask anything", k: "⌘⇧F", icon: "search", run: () => AV.router.go("knowledge") });
    cmds.push({ t: "Reset demo data", d: "Restore seed content", k: "", icon: "refresh", run: () => { AV.store.reset(); location.reload(); } });
    return cmds;
  };

  const openPalette = (initial = "") => {
    const bd = document.createElement("div");
    bd.className = "cmd";
    let items = paletteCommands();
    bd.innerHTML = `
      <div class="cmd__box" role="dialog" aria-label="Command palette">
        <div class="cmd__input-wrap">${icon("search", 18)}<input class="cmd__input" id="cmdInput" placeholder="Type a command or search…" value="${esc(initial)}">
          <button class="icon-btn" id="cmdClose">${icon("x", 15)}</button></div>
        <div class="cmd__list" id="cmdList"></div>
      </div>`;
    document.body.appendChild(bd);
    const input = $("#cmdInput", bd);
    const list = $("#cmdList", bd);
    let selected = 0;

    const render = () => {
      const q = input.value.trim().toLowerCase();
      const filtered = items.filter(c => (c.t + " " + c.d).toLowerCase().includes(q));
      selected = Math.min(selected, Math.max(filtered.length - 1, 0));
      list.innerHTML = !filtered.length
        ? `<p class="cmd__empty">No results for “${esc(input.value)}”</p>`
        : filtered.map((c, i) => `
          <div class="cmd__item${i === selected ? " is-selected" : ""}" data-i="${i}">
            ${icon(c.icon)}<div style="min-width:0"><p class="t">${c.t}</p><p class="desc">${c.d}</p></div>
            ${c.k ? `<span class="k">${c.k}</span>` : ""}
          </div>`).join("");
      $$(".cmd__item", list).forEach(el => el.addEventListener("click", () => { run(filtered[+el.dataset.i]); }));
    };
    const run = c => { if (!c) return; bd.remove(); c.run(); };
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => {
      const opts = $$(".cmd__item", list);
      if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, opts.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(selected - 1, 0); render(); }
      else if (e.key === "Enter") { e.preventDefault(); const el = opts[selected]; if (el) run(items.filter(c => (c.t + " " + c.d).toLowerCase().includes(input.value.trim().toLowerCase()))[+el.dataset.i]); }
      else if (e.key === "Escape") bd.remove();
    });
    bd.addEventListener("click", e => { if (e.target === bd) bd.remove(); });
    $("#cmdClose", bd).addEventListener("click", () => bd.remove());
    input.focus();
    render();
  };

  /* ---------- Render view ---------- */
  const render = () => {
    const id = current?.id || "dashboard";
    renderSidebar();
    $("#crumbLabel").textContent = AV.router.title(id);
    const view = $("#view");
    view.innerHTML = routes[id] ? routes[id](current.params) : `<p>Missing view</p>`;
    if (afterFns[id]) afterFns[id](view);
    view.scrollTop = 0;
  };

  /* ---------- Keyboard ---------- */
  document.addEventListener("keydown", e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === "l") { e.preventDefault(); toggleTheme(); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); AV.publishSite(); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); AV.router.go("knowledge"); }
    else if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); $(".app").classList.toggle("sb-collapsed"); }
    else if (e.key === "Escape") { $(".sb-scrim")?.click(); }
  });

  /* ---------- Global search access ---------- */
  AV.openPalette = openPalette;
  AV.ui = { icon, toast, modal, confirmDlg, esc, $, $$ };

  /* ---------- Init ---------- */
  const init = () => {
    applyTheme();
    renderShell();
    const s = AV.store.get("settings");
    if (s.sidebarCollapsed && innerWidth > 1024) $(".app").classList.add("sb-collapsed");
    AV.router.go(location.hash.slice(1) || "dashboard");
  };
  let lastRawHash = "";
  /* pull the authoritative content from the backend once, then re-render */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else setTimeout(boot, 0);
  async function boot() {
    const authed = await AV.api.session();
    if (!authed) { location.href = "/admin/login.php"; return; }
    if (AV.sessionMustChange) { location.href = "/admin/change-password.php"; return; }
    await AV.api.pull();
    AV.emitStatus();
    render();
    applyTheme();
  }

  window.addEventListener("hashchange", () => {
    const raw = location.hash.slice(1);
    if (!raw || raw === lastRawHash) return;
    lastRawHash = raw;
    const [id, qs] = raw.split("?");
    if (!id) return;
    const params = {};
    if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
    AV.router.go(id, params);
  });
  lastRawHash = location.hash.slice(1);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
