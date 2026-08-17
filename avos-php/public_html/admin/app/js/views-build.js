/* ============================================================
   AV OS — views: dashboard, homepage, pages, projects, content
   Pattern: AV.router.register(id, () => html) + AV.router.after(id, view => bind)
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const S = AV.store;
  const R = AV.router;

  /* ============ helpers ============ */
  const spark = (data, w = 120, h = 34) => {
    const max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 6) - 3}`).join(" ");
    return `<svg class="stat__spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const ring = (score, size = 92, stroke = 8) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const off = c - (score / 100) * c;
    const col = score >= 90 ? "var(--ok)" : score >= 75 ? "var(--warn)" : "var(--danger)";
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>`;
  };
  const statusChip = s => {
    const map = { published: ["ok", "Published"], draft: ["warn", "Draft"], hidden: ["muted", "Hidden"], scheduled: ["accent", "Scheduled"], review: ["warn", "In review"], archived: ["muted", "Archived"], contacted: ["accent", "Contacted"], qualified: ["warn", "Qualified"], meeting: ["ok", "Meeting"], new: ["accent", "New"] };
    const [cls, label] = map[s] || ["muted", s];
    return `<span class="chip chip--${cls}"><span class="status-dot status-dot--${cls}"></span>${label}</span>`;
  };

  /* ============ DASHBOARD (real data: analytics, CRM, content, health) ============ */
  R.register("dashboard", () => `
    <div class="dash-hero">
      <div>
        <h2>Good morning, Abhijeet <em>— everything is running.</em></h2>
        <p id="dashHeroSub">Loading live system state…</p>
      </div>
      <div class="actions">
        <button class="btn btn--ghost" data-go="media">${icon("upload")} Upload media</button>
        <button class="btn btn--primary" data-go="projects" data-action="new">${icon("plus")} New project</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px" id="quickStart" hidden>
      <div class="card__head">
        <p class="card__title">${icon("spark", 14)} First time here? — your 6-step start</p>
        <button class="btn btn--sm btn--ghost" id="quickStartHide">Dismiss</button>
      </div>
      <div class="card__body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">
        <a class="btn btn--soft" data-go="homepage">1 · Edit your homepage (hero, image, CTAs)</a>
        <a class="btn btn--soft" data-go="projects">2 · Add a project / case study</a>
        <a class="btn btn--soft" data-go="media">3 · Upload images</a>
        <a class="btn btn--soft" data-go="publishing">4 · Publish the website</a>
        <a class="btn btn--soft" data-go="integrations">5 · Connect GSC / GA4 / Calendly / AI</a>
        <a class="btn btn--soft" data-go="aiagents">6 · Meet your 31 AI agents</a>
      </div>
      <p class="hint" style="margin:10px 16px 4px;font-size:11.5px">Tip: the search bar (⌘K) jumps to any screen. Every save shows a status: <b>DATABASE SAVED</b> · <b>OFFLINE LOCAL DRAFT</b> · <b>PUBLISHING</b> · <b>PUBLISHED</b>.</p>
    </div>

    <div class="grid grid-4" style="margin-bottom:16px" id="dashStats"></div>

    <div class="grid grid-13" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Traffic · page views (30d)</p><span class="chip chip--muted" id="dashTrafficTotal">—</span></div>
        <div class="card__body" style="padding-top:12px" id="dashChart"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">System health</p><span class="chip chip--ok" id="dashHealthChip">—</span></div>
        <div class="card__body">
          <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
            <div class="seo-score-ring" id="dashScoreRing"><span class="num">—</span></div>
            <div style="display:grid;gap:8px;flex:1" id="dashHealthRows"></div>
          </div>
          <button class="btn btn--ghost btn--block" data-go="health">Open health center →</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">What should I do next?</p><span class="chip chip--accent">${icon("spark", 12)} prioritized</span></div>
      <div class="card__body" id="dashNext"></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">AI growth brief</p><button class="btn btn--sm btn--soft" data-go="aiagents">Command center →</button></div>
        <div class="card__body" id="dashBrief"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Autonomous actions</p><span class="chip chip--muted">24h</span></div>
        <div class="card__body" id="dashAgentFeed" style="max-height:240px;overflow-y:auto"></div>
      </div>
    </div>

    <div class="grid grid-13" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Upcoming meetings</p><button class="btn btn--sm btn--soft" data-go="meetings">All</button></div>
        <div class="card__body" id="dashMeetings"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Pipeline</p><button class="btn btn--sm btn--soft" data-go="crm">Open CRM</button></div>
        <div class="card__body" id="dashPipeline"></div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card__head"><p class="card__title">Recent activity</p><button class="btn btn--sm btn--ghost" data-go="logs">Logs</button></div>
        <div class="card__body" style="padding-top:8px" id="dashActivity"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Content status</p><button class="btn btn--sm btn--soft" data-go="pages">Manage</button></div>
        <div class="card__body" style="padding-top:8px" id="dashContent"></div>
      </div>
    </div>`);
  R.after("dashboard", view => {
    const load = async () => {
      const [st, sum, daily, health, leads, meets, pipe, audit, content] = await Promise.all([
        AV.api.get("/api/status"), AV.api.get("/api/analytics/summary?days=30"),
        AV.api.get("/api/analytics/daily?days=30"), AV.api.get("/api/content-health"),
        AV.api.get("/api/leads"), AV.api.get("/api/crm/meetings"),
        AV.api.get("/api/crm/pipeline"), AV.api.get("/api/audit"), AV.api.get("/api/content")
      ]);
      const sys = st.ok && st.data ? st.data : {};
      const sumD = sum.ok && sum.data ? sum.data : { pageviews: 0, visitors: 0, leads: 0, meetings: 0 };
      const h = health.ok && health.data ? health.data : null;
      const leadsArr = (leads.ok && leads.data && leads.data.items) || [];
      const meetsArr = (meets.ok && meets.data) || [];
      const pipeArr = (pipe.ok && pipe.data) || [];
      const auditArr = (audit.ok && audit.data) || [];
      const doc = (content.ok && content.data) || {};

      /* hero line */
      const warm = leadsArr.filter(l => (l.status === "new" || l.status === "contacted") && Number(l.score || 0) >= 70).length;
      const issues = h ? h.total_issues : "?";
      const heroBits = [];
      if (sys.status) heroBits.push(`System: ${esc(sys.status)}`);
      heroBits.push(`Content health: ${h ? h.score + "/100" : "—"}`);
      heroBits.push(`${warm} warm lead(s) need follow-up`);
      heroBits.push(`${issues} content issue(s) open`);
      $("#dashHeroSub", view).textContent = heroBits.join(" · ") + ".";

      /* stat cards */
      const stats = [
        { id: "visitors", label: "Visitors (30d)", value: Number(sumD.visitors || 0).toLocaleString(), icon: "users" },
        { id: "views", label: "Page views (30d)", value: Number(sumD.pageviews || 0).toLocaleString(), icon: "eye" },
        { id: "leads", label: "New leads (30d)", value: Number(sumD.leads || 0).toLocaleString(), icon: "target" },
        { id: "meetings", label: "Meetings (30d)", value: Number(sumD.meetings || 0).toLocaleString(), icon: "calendar" }
      ];
      $("#dashStats", view).innerHTML = stats.map(s => `
        <div class="card card--hover stat">
          <div class="stat__top"><div class="stat__icon">${icon(s.icon)}</div></div>
          <div><p class="stat__value">${s.value}</p><p class="stat__label">${s.label}</p></div>
        </div>`).join("");

      /* traffic chart */
      const dailyArr = (daily.ok && daily.data) || [];
      const max = Math.max(1, ...dailyArr.map(d => d.n));
      $("#dashTrafficTotal", view).textContent = dailyArr.reduce((a, d) => a + d.n, 0) + " views";
      $("#dashChart", view).innerHTML = dailyArr.length
        ? `<div style="display:flex;align-items:flex-end;gap:2px;height:150px">${dailyArr.map(d =>
            `<div title="${esc(d.d)} — ${d.n}" style="flex:1;background:var(--accent);opacity:.75;height:${Math.max(3, Math.round(d.n / max * 100))}%;border-radius:2px 2px 0 0"></div>`).join("")}</div>`
        : `<p style="color:var(--ink-3);font-size:12.5px;padding:20px 0;text-align:center">No page views recorded yet — the analytics snippet is live on the published site.</p>`;

      /* health */
      const hScore = h ? h.score : null;
      $("#dashScoreRing", view).innerHTML = (hScore === null ? `<span class="num">—</span>` : ring(hScore) + `<span class="num" style="color:${hScore >= 80 ? "var(--ok)" : hScore >= 50 ? "var(--warn)" : "var(--danger)"}">${hScore}</span>`);
      $("#dashHealthChip", view).textContent = (sys.status || "?") === "healthy" ? "All systems go" : "Attention needed";
      $("#dashHealthChip", view).className = "chip " + ((sys.status || "") === "healthy" ? "chip--ok" : "chip--warn");
      const rows = [
        ["Database", sys.database === "connected" ? "✓ connected" : sys.database || "—", sys.database === "connected"],
        ["Storage", sys.storage === "writable" ? "✓ writable" : sys.storage || "—", sys.storage === "writable"],
        ["Publish engine", sys.publish === "ready" ? "✓ ready" : sys.publish || "—", sys.publish === "ready"],
        ["Version", "v" + esc(sys.version || "?"), true]
      ];
      $("#dashHealthRows", view).innerHTML = rows.map(([l, v, ok]) => `
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:12px;color:var(--ink-3);width:104px">${l}</span>
          <span class="chip ${ok ? "chip--ok" : "chip--danger"}" style="flex:1">${v}</span>
        </div>`).join("");

      /* meetings */
      const upcoming = meetsArr.filter(m => m.status === "scheduled" || m.status === "confirmed").slice(0, 5);
      $("#dashMeetings", view).innerHTML = upcoming.length
        ? upcoming.map(m => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)">
            <span class="chip chip--muted" style="flex:none">${esc((m.scheduled_at || "").slice(0, 10))}</span>
            <div style="min-width:0;flex:1">
              <p style="font-size:13.5px;font-weight:600">${esc(m.contact_name || m.title || "Meeting")}</p>
              <p style="font-size:12px;color:var(--ink-3)">${esc(m.type || "")} · ${esc((m.scheduled_at || "").slice(11, 16) || "—")}</p>
            </div>
            <span class="chip ${m.status === "confirmed" ? "chip--ok" : "chip--accent"}">${esc(m.status)}</span>
          </div>`).join("")
        : `<p style="color:var(--ink-3);font-size:12.5px;padding:14px 0">No upcoming meetings. Schedule one from the Meetings screen.</p>`;

      /* pipeline */
      const stageOrder = ["new", "contacted", "qualified", "meeting", "proposal", "negotiation", "won", "lost"];
      const pipeMap = {}; pipeArr.forEach(p => pipeMap[p.stage] = p);
      $("#dashPipeline", view).innerHTML = stageOrder.map(st => {
        const p = pipeMap[st] || { n: 0, total: 0 };
        return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:12.5px;border-bottom:1px solid var(--line)">
          <span style="width:96px;color:var(--ink-2)">${esc(st)}</span>
          <div class="prog" style="flex:1"><i style="width:${Math.min(100, (p.n || 0) / Math.max(1, Math.max(...stageOrder.map(s => (pipeMap[s] || {}).n || 0))) * 100)}%"></i></div>
          <b style="width:80px;text-align:right">${p.n || 0} · ₹${Number(p.total || 0).toLocaleString("en-IN")}</b>
        </div>`;
      }).join("");

      /* conversion funnel */
      const funnelStages = [
        ["Visitors (30d)", Number(sumD.visitors || 0)],
        ["Leads (30d)", Number(sumD.leads || 0)],
        ["Meetings", meetsArr.length],
        ["Proposals", 0],
        ["Won", leadsArr.filter(l => l.status === "won").length]
      ];
      $("#dashPipeline", view).innerHTML += `<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
        <p class="card__title" style="margin-bottom:8px">Conversion funnel</p>
        ${funnelStages.map(([lbl, n], i) => {
          const base = funnelStages[0][1] || 1;
          const prev = i === 0 ? base : (funnelStages[i - 1][1] || 0);
          const rate = i === 0 ? 100 : prev > 0 ? Math.round((n / prev) * 100) : 0;
          return `<div style="display:flex;align-items:center;gap:10px;padding:4px 0;font-size:12px">
            <span style="width:110px;color:var(--ink-3)">${lbl}</span>
            <div class="prog" style="flex:1"><i style="width:${Math.min(100, (n / base) * 100)}%"></i></div>
            <b style="width:60px;text-align:right">${n.toLocaleString()}</b>
            <span style="width:44px;text-align:right;color:var(--ink-4)">${i === 0 ? "—" : rate + "%"}</span>
          </div>`;
        }).join("")}
      </div>`;

      /* AI growth brief + agent feed */
      const ag = await AV.api.get("/api/agents/brief");
      if (ag.ok && ag.data) {
        const b = ag.data;
        $("#dashBrief", view).innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            ${[["Traffic", (b.website.traffic_delta_pct >= 0 ? "+" : "") + b.website.traffic_delta_pct + "%"], ["Leads", b.website.leads_today], ["SEO", b.seo.score], ["Agents", b.agents.active + "/" + b.agents.total]].map(([k, v]) => `
              <span class="chip chip--muted" style="font-size:10.5px">${k}: <b>${esc(v)}</b></span>`).join("")}
          </div>
          <p style="font-size:12.5px;font-weight:600">${esc(b.top_recommendation || "—")}</p>
          <p style="font-size:11.5px;color:var(--ink-3);margin-top:4px">${esc(b.agents.jobs_completed_24h || 0)} agent job(s) in the last 24h · ${esc(b.agents.jobs_failed_24h || 0)} failed</p>`;
      }
      const feed = await AV.api.get("/api/agents/memory?limit=6");
      $("#dashAgentFeed", view).innerHTML = (feed.ok && feed.data || []).map(m => `
        <div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:11.5px">
          <span class="chip chip--muted" style="font-size:9px">${esc(m.agent_slug)}</span>
          <span style="color:var(--ink-2)">${esc(m.observation)}</span>
          <span style="display:block;color:var(--accent);font-size:11px">→ ${esc(m.decision)}</span>
        </div>`).join("") || `<p style="color:var(--ink-3);font-size:12px">No agent activity yet.</p>`;

      /* next actions */
      const na = await AV.api.get("/api/intelligence/next-actions?limit=6");
      const acts = (na.ok && na.data) || [];
      $("#dashNext", view).innerHTML = acts.length
        ? acts.map((a, i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line)">
            <span class="chip ${a.priority === "high" ? "chip--accent" : "chip--muted"}" style="font-size:10px;flex:none">${esc(a.priority)}</span>
            <span style="font-weight:600;font-size:13.5px;flex:none;color:${a.impact >= 70 ? "var(--warn)" : "var(--ink-2)"}">${a.impact}</span>
            <div style="flex:1;min-width:0">
              <p style="font-size:13.5px;font-weight:600">${esc(a.title)}</p>
              <p style="font-size:12px;color:var(--ink-3)">${esc(a.reason)}</p>
            </div>
          </div>`).join("")
        : `<p style="color:var(--ink-3);font-size:12.5px;padding:12px 0">No recommendations yet — add keywords and let the site collect data.</p>`;

      /* activity */
      $("#dashActivity", view).innerHTML = auditArr.slice(0, 8).map(a => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
          <div style="flex:1;min-width:0">
            <p style="font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.action)} <span style="color:var(--ink-4)">· ${esc(a.entity)} ${esc(a.entity_id || "")}</span></p>
          </div>
          <span style="font-size:11px;color:var(--ink-4);flex:none">${esc((a.created_at || "").slice(0, 16).replace("T", " "))}</span>
        </div>`).join("") || `<p style="color:var(--ink-3);font-size:12.5px;padding:14px 0">No activity yet.</p>`;

      /* content status */
      const counts = {};
      ["pages", "projects", "articles"].forEach(k => {
        const arr = doc[k] || [];
        const pub = arr.filter(x => (x.status || "draft") === "published").length;
        counts[k] = { total: arr.length, published: pub, drafts: arr.length - pub };
      });
      const drafts = [];
      ["pages", "projects", "articles"].forEach(k => (doc[k] || []).forEach(x => {
        if ((x.status || "draft") !== "published") drafts.push({ k, id: x.id, title: x.title || "(untitled)" });
      }));
      $("#dashContent", view).innerHTML = `
        <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap">
          ${Object.entries(counts).map(([k, v]) => `<span class="chip chip--muted">${esc(k)}: ${v.published} pub · ${v.drafts} draft</span>`).join("")}
        </div>
        ${drafts.slice(0, 5).map(d => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)">
            <div class="section-row__thumb">${icon("pen")}</div>
            <div style="min-width:0;flex:1">
              <p style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.title)}</p>
              <p style="font-size:11px;color:var(--ink-3)">${esc(d.k)} · draft</p>
            </div>
            <button class="btn btn--sm btn--soft" data-open-draft="${d.k}" data-id="${esc(d.id)}">Edit</button>
          </div>`).join("") || `<p style="color:var(--ink-3);font-size:12.5px;padding:14px 0">Nothing in draft — all content published.</p>`}`
    };
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    $$("[data-open-draft]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.openDraft, { id: b.dataset.id })));
    $$("[data-action]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go, { action: b.dataset.action })));
    load();
  });

  /* ============ HOMEPAGE BUILDER ============ */
  R.register("homepage", () => `
    <div class="view__head">
      <div>
        <h1 class="view__title">Homepage <em>builder</em></h1>
        <p class="view__desc">Every section is independently editable — edit, duplicate, hide, schedule, preview and publish without touching code.</p>
      </div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-add-section>${icon("plus")} Add section</button>
        <button class="btn btn--ghost" data-save-draft>${icon("save", 13)} Save draft</button>
        <button class="btn btn--primary" data-publish>${icon("send")} Publish website</button>
      </div>
    </div>
    <div class="card" style="padding:14px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <input class="input" id="secSearch" placeholder="Search sections…" style="flex:1;min-width:160px">
      <div class="seg" id="secFilter">
        <button class="is-active" data-f="all">All</button>
        <button data-f="published">Published</button>
        <button data-f="draft">Draft</button>
        <button data-f="scheduled">Scheduled</button>
        <button data-f="hidden">Hidden</button>
      </div>
    </div>
    <div id="secList"></div>`);
  R.after("homepage", view => {
    try {
      if (!localStorage.getItem("avos-quickstart-done")) $("#quickStart", view).hidden = false;
    } catch (e) {}
    $("#quickStartHide", view)?.addEventListener("click", () => {
      try { localStorage.setItem("avos-quickstart-done", "1"); } catch (e) {}
      $("#quickStart", view).hidden = true;
    });
    $$("#quickStart [data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    const sections = () => [...S.get("sections")].sort((a, b) => a.order - b.order);
    const list = $("#secList", view);
    const render = () => {
      const q = ($("#secSearch", view).value || "").toLowerCase();
      const f = $(".seg button.is-active", view)?.dataset.f || "all";
      list.innerHTML = sections().filter(s => (f === "all" || s.status === f) && s.name.toLowerCase().includes(q)).map(s => `
        <div class="section-row" data-id="${s.id}">
          <span class="section-row__grip">${icon("grip")}</span>
          <div class="section-row__thumb">${icon("layers", 14)}</div>
          <div style="min-width:0">
            <p class="section-row__name">${String(s.order).padStart(2, "0")} · ${esc(s.name)}</p>
            <p class="section-row__id">${esc(s.kicker)} · updated ${esc(s.updated)}</p>
          </div>
          ${statusChip(s.status)}
          <div class="section-row__actions">
            <button data-act="up" title="Move up" aria-label="Move up">${icon("up")}</button>
            <button data-act="down" title="Move down" aria-label="Move down">${icon("down")}</button>
            <button data-act="edit" title="Edit" aria-label="Edit">${icon("pen")}</button>
            <button data-act="dup" title="Duplicate" aria-label="Duplicate">${icon("copy")}</button>
            <button data-act="hide" title="${s.status === "hidden" ? "Unhide" : "Hide"}" aria-label="Toggle visibility">${icon("eye")}</button>
            <button data-act="sched" title="Schedule" aria-label="Schedule">${icon("clock")}</button>
            <button data-act="prev" title="Preview" aria-label="Preview">${icon("eye", 15)}</button>
            <button data-act="del" class="danger" title="Delete" aria-label="Delete">${icon("trash")}</button>
          </div>
        </div>`).join("") || `<div class="empty"><p>No sections match.</p></div>`;

      $$(".section-row", list).forEach(row => {
        const id = row.dataset.id;
        const sec = () => sections().find(x => x.id === id);
        $$("[data-act]", row).forEach(btn => btn.addEventListener("click", () => {
          const act = btn.dataset.act;
          if (act === "up" || act === "down") {
            const arr = sections();
            const i = arr.findIndex(x => x.id === id);
            const j = i + (act === "up" ? -1 : 1);
            if (j < 0 || j >= arr.length) return;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            arr.forEach((x, k) => x.order = k + 1);
            S.save(); render();
          } else if (act === "edit") editSection(sec(), render);
          else if (act === "dup") {
            const s = sec();
            S.set("sections", [...S.get("sections"), { ...s, id: s.id + "-c" + Date.now(), name: s.name + " (copy)", status: "draft", order: Math.max(...S.get("sections").map(x => x.order)) + 1 }]);
            toast(`“${s.name}” duplicated`); render();
          } else if (act === "hide") {
            const s = sec();
            s.status = s.status === "hidden" ? "published" : "hidden";
            S.save(); toast(s.status === "hidden" ? `“${s.name}” hidden from site` : `“${s.name}” visible again`); render();
          } else if (act === "sched") scheduleSection(sec(), render);
          else if (act === "prev") previewSection(sec());
          else if (act === "del") confirmDlg("Delete section?", `“${sec().name}” will be removed from the homepage.`, () => {
            S.set("sections", S.get("sections").filter(x => x.id !== id));
            toast("Section deleted"); render();
          });
        }));
      });
    };
    const mediaChoices = () => (S.get("media") || []).filter(x => x.src).map(x => ({
      src: x.src, name: x.name || x.src.split("/").pop()
    }));
    const editSection = (s, rerender) => {
      const isHero = s.type === "hero";
      const media = mediaChoices();
      const mediaPick = isHero ? `
          <div class="field" style="margin-top:12px"><label>Portrait / hero image — pick from your media library</label>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-height:190px;overflow-y:auto;border:1px solid var(--line);border-radius:12px;padding:10px">
              ${media.map(x => `
                <button class="f-pick" data-src="${esc(x.src)}" title="${esc(x.name)}" style="position:relative;border:2px solid ${(s.portrait || "") === x.src ? "var(--accent)" : "transparent"};border-radius:10px;padding:0;overflow:hidden;aspect-ratio:1">
                  <img src="/${esc(x.src)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
                </button>`).join("") || `<p style="grid-column:1/-1;font-size:11.5px;color:var(--ink-3)">No media yet — upload in Media first.</p>`}
            </div>
            ${media.length ? `<input class="f-portrait" type="hidden" value="${esc(s.portrait || "")}">` : `<input class="f-portrait" value="${esc(s.portrait || "")}" placeholder="media/hero-portrait.webp" style="margin-top:6px">`}
            <p class="hint" style="font-size:11px;color:var(--ink-3);margin-top:6px">Current: <code>${esc(s.portrait || "media/hero-portrait.webp")}</code></p>
          </div>
          <div class="field" style="margin-top:12px"><label>Lede (one line under the headline)</label><textarea class="f-lede" rows="2">${esc(s.lede || "")}</textarea></div>
          <div class="field" style="margin-top:12px"><label>Sub (supporting paragraph)</label><textarea class="f-sub" rows="3">${esc(s.sub || "")}</textarea></div>
          <div class="grid grid-2" style="gap:10px;margin-top:12px">
            <div class="field"><label>Primary button label</label><input class="f-cta-label" value="${esc((s.cta && s.cta.label) || "Explore my work")}"></div>
            <div class="field"><label>Primary button link</label><input class="f-cta-href" value="${esc((s.cta && s.cta.href) || "case-studies.html")}"></div>
          </div>
          <div class="grid grid-2" style="gap:10px;margin-top:10px">
            <div class="field"><label>Secondary button label</label><input class="f-cta2-label" value="${esc((s.cta2 && s.cta2.label) || "Download résumé")}"></div>
            <div class="field"><label>Secondary button link</label><input class="f-cta2-href" value="${esc((s.cta2 && s.cta2.href) || "assets/Abhijeet-Varghese-Resume.pdf")}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Roles (comma separated)</label><input class="f-roles" value="${esc((s.roles || []).join(", "))}"></div>
          <div class="field" style="margin-top:12px"><label>Marquee items (comma separated)</label><input class="f-marquee" value="${esc((s.marquee || []).join(", "))}"></div>` : "";
      const m = modal({
        title: `Edit — ${esc(s.name)}`,
        body: `
          <div class="field"><label>Section name</label><input class="f-name" value="${esc(s.name)}"></div>
          <div class="field" style="margin-top:12px"><label>Kicker / tag</label><input class="f-kicker" value="${esc(s.kicker)}"></div>
          <div class="field" style="margin-top:12px"><label>Heading</label><input class="f-title" value="${esc(s.title)}"></div>
          ${mediaPick}
          <div class="field" style="margin-top:12px"><label>Status</label>
            <select class="f-status">${["published", "draft", "scheduled", "hidden"].map(st => `<option ${s.status === st ? "selected" : ""}>${st}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Section theme</label>
            <div style="display:flex;gap:10px">
              ${[["Light", "#F7F5EF"], ["Dark", "#080F22"], ["White", "#FFFFFF"], ["Navy", "#0B1430"]].map(([lbl, c]) => `
                <button class="f-bg" data-c="${c}" style="display:grid;gap:5px;justify-items:center;font-size:10.5px;color:var(--ink-3)">
                  <span style="width:34px;height:34px;border-radius:10px;background:${c};border:2px solid ${(s.bg || "#F7F5EF") === c ? "var(--accent)" : "var(--line-2)"}"></span>${lbl}
                </button>`).join("")}
            </div></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-save>Save section</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      if (isHero) {
        $$(".f-pick", m.el).forEach(b => b.addEventListener("click", () => {
          $$(".f-pick", m.el).forEach(x => x.style.borderColor = "transparent");
          b.style.borderColor = "var(--accent)";
          $(".f-portrait", m.el).value = b.dataset.src;
        }));
      }
      $("[data-save]", m.el).addEventListener("click", () => {
        const upd = {
          name: $(".f-name", m.el).value.trim() || s.name,
          kicker: $(".f-kicker", m.el).value.trim(),
          title: $(".f-title", m.el).value.trim(),
          status: $(".f-status", m.el).value,
          bg: $(".f-bg.is-sel", m.el)?.dataset.c || s.bg
        };
        if (isHero) {
          upd.lede = $(".f-lede", m.el).value.trim();
          upd.sub = $(".f-sub", m.el).value.trim();
          upd.portrait = $(".f-portrait", m.el).value.trim() || s.portrait || "media/hero-portrait.webp";
          upd.cta = { label: $(".f-cta-label", m.el).value.trim() || "Explore my work", href: $(".f-cta-href", m.el).value.trim() || "case-studies.html" };
          upd.cta2 = { label: $(".f-cta2-label", m.el).value.trim() || "Download résumé", href: $(".f-cta2-href", m.el).value.trim() || "assets/Abhijeet-Varghese-Resume.pdf" };
          upd.roles = $(".f-roles", m.el).value.split(",").map(x => x.trim()).filter(Boolean);
          upd.marquee = $(".f-marquee", m.el).value.split(",").map(x => x.trim()).filter(Boolean);
        }
        Object.assign(s, upd);
        S.save(); toast("Section saved"); m.close(); rerender();
      });
      $$(".f-bg", m.el).forEach(b => b.addEventListener("click", () => {
        $$(".f-bg", m.el).forEach(x => { const sp = x.querySelector("span"); sp.style.borderColor = "var(--line-2)"; x.classList.remove("is-sel"); });
        b.querySelector("span").style.borderColor = "var(--accent)"; b.classList.add("is-sel");
      }));
    };
    const scheduleSection = (s, rerender) => {
      const m = modal({
        title: `Schedule — ${esc(s.name)}`,
        body: `
          <div class="field"><label>Publish date</label><input type="date" class="f-date"></div>
          <div class="field" style="margin-top:12px"><label>Time (IST)</label><input type="time" class="f-time" value="09:00"></div>
          <p style="font-size:12px;color:var(--ink-3);margin-top:12px">The section stays in its current state until the scheduled moment, then flips automatically.</p>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-save>Schedule</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-save]", m.el).addEventListener("click", () => {
        s.status = "scheduled";
        s.scheduledFor = $(".f-date", m.el).value + " · " + $(".f-time", m.el).value;
        S.save(); toast(`“${s.name}” scheduled for ${s.scheduledFor}`); m.close(); rerender();
      });
    };
    const previewSection = s => {
      const dark = s.bg === "#080F22" || s.bg === "#0B1430";
      modal({
        title: `Preview — ${esc(s.name)}`,
        body: `
          <div style="border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden">
            <div style="height:6px;background:linear-gradient(90deg,var(--accent),var(--azure))"></div>
            <div style="padding:34px 28px;background:${s.bg || "#F7F5EF"};color:${dark ? "#EFF0EA" : "#0C1330"}">
              <p style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:${dark ? "#6EA8FF" : "#2E5AAC"}">${esc(s.kicker)}</p>
              <h3 style="font-size:clamp(1.4rem,3vw,2.2rem);font-weight:600;letter-spacing:-.02em;margin-top:10px;line-height:1.1">${esc(s.title)}</h3>
              <p style="margin-top:12px;color:${dark ? "#96A0BE" : "#59617A"};font-size:13px;max-width:46ch">This is how the section appears on the ${dark ? "dark" : "light"} theme, with your live settings applied.</p>
              <div style="margin-top:18px;display:flex;gap:10px">
                <span style="background:#2E5AAC;color:#fff;padding:8px 18px;border-radius:999px;font-size:12px;font-weight:600">Primary action</span>
                <span style="border:1px solid ${dark ? "rgba(148,170,230,.4)" : "rgba(12,19,48,.25)"};padding:8px 18px;border-radius:999px;font-size:12px;font-weight:600">Secondary</span>
              </div>
            </div>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button><a class="btn btn--primary" href="../abhijeetvarghese/index.html" target="_blank" rel="noopener">Open live site</a>`
      });
    };
    $("#secSearch", view).addEventListener("input", render);
    $$("#secFilter button", view).forEach(b => b.addEventListener("click", () => {
      $$("#secFilter button", view).forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active"); render();
    }));
    $("[data-add-section]", view).addEventListener("click", () => {
      const m = modal({
        title: "Add section",
        body: `<div class="field"><label>Section name</label><input class="f-n" placeholder="e.g. Awards"></div>
               <div class="field" style="margin-top:12px"><label>Template</label>
               <select class="f-tpl">${["Hero", "Clients", "Capabilities", "Featured Work", "Thinking", "Journey", "AI", "CTA", "Contact", "Footer", "Custom"].map(t => `<option>${t}</option>`).join("")}</select></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Add section</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", () => {
        const name = $(".f-n", m.el).value.trim() || "New section";
        const arr = S.get("sections");
        S.set("sections", [...arr, { id: "sec-" + Date.now(), name, kicker: "New", status: "draft", updated: "Just now", order: arr.length + 1, title: "New section heading" }]);
        toast("Section added as draft"); m.close(); render();
      });
    });
    $("[data-publish]", view).addEventListener("click", () => AV.publishSite());
    $("[data-save-draft]", view).addEventListener("click", async () => {
      // DB save + version, NO publish (draft mode)
      AV.api.cancelPush();   // drop any pending auto-push first
      const r = await AV.api.send("/api/content", "PUT", Object.assign({}, AV.store.state, { publish: false }));
      if (r.ok) { toast("DRAFT SAVED — not published"); if (AV.emitStatus) AV.emitStatus("saved"); }
      else toast("SAVE FAILED", "error");
    });
    render();
  });

  /* ============ PROJECTS ============ */
  R.register("projects", (p) => p?.id || p?.action === "new" ? projectEditorHTML(p?.id ? S.get("projects").find(x => x.id === p.id) : null) : `
    <div class="view__head">
      <div><h1 class="view__title">Projects</h1>
      <p class="view__desc">Case studies and experiments — structured, searchable, publishable.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-go="casestudies">Case studies</button>
        <button class="btn btn--primary" data-new="projects">${icon("plus")} New project</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <input class="input" id="projSearch" placeholder="Search projects…" style="flex:1;min-width:180px">
      <div class="seg" id="projFilter">
        <button class="is-active" data-f="all">All</button>
        <button data-f="published">Published</button>
        <button data-f="draft">Draft</button>
        <button data-f="scheduled">Scheduled</button>
      </div>
    </div>
    <div class="grid grid-3" id="projGrid"></div>`);
  R.after("projects", view => {
    if ($("[data-back]", view)) { bindProjectEditor(view); return; }
    const render = () => {
      const q = ($("#projSearch", view).value || "").toLowerCase();
      const f = $(".seg button.is-active", view)?.dataset.f || "all";
      $("#projGrid", view).innerHTML = S.get("projects").filter(x => (f === "all" || x.status === f) && (x.title + x.client).toLowerCase().includes(q)).map(x => `
        <div class="card card--hover proj-card">
          <div class="proj-card__img"><img src="${x.image}" alt="" loading="lazy"><span class="chip">${esc(x.client)}</span></div>
          <div class="proj-card__body">
            <p class="proj-card__title">${esc(x.title)}</p>
            <p class="proj-card__meta">${esc(x.industry)} · ${esc(x.year)} · ${esc(x.views)} views</p>
            <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
              ${statusChip(x.status)}
              ${x.featured ? `<span class="chip chip--accent">★ Featured</span>` : ""}
            </div>
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn btn--soft btn--sm" style="flex:1" data-open="${x.id}">${icon("pen", 13)} Edit</button>
              <button class="btn btn--ghost btn--sm" data-star="${x.id}" title="${x.featured ? "Unfeature" : "Feature"}">${icon("spark", 13)}</button>
            </div>
          </div>
        </div>`).join("") || `<div class="empty"><p>No projects match.</p></div>`;
      $$("[data-open]", view).forEach(b => b.addEventListener("click", () => R.go("projects", { id: b.dataset.open })));
      $$("[data-star]", view).forEach(b => b.addEventListener("click", () => {
        const x = S.get("projects").find(y => y.id === b.dataset.star);
        x.featured = !x.featured; S.save(); toast(x.featured ? "Featured on homepage" : "Removed from featured"); render();
      }));
    };
    $("#projSearch", view).addEventListener("input", render);
    $$("#projFilter button", view).forEach(b => b.addEventListener("click", () => {
      $$("#projFilter button", view).forEach(x => x.classList.remove("is-active")); b.classList.add("is-active"); render();
    }));
    $$("[data-new]", view).forEach(b => b.addEventListener("click", () => R.go("projects", { action: "new" })));
    render();
  });

  const projectEditorHTML = p => {
    const proj = p || { id: "prj-" + Date.now(), title: "", client: "", industry: "", status: "draft", year: "2026", featured: false, image: "media/essay-01.webp", summary: "", role: "", challenge: "", approach: "", outcome: "", views: "—", updated: "Just now" };
    return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">
      <button class="btn btn--ghost btn--sm" data-back>${icon("arrowL", 14)} Projects</button>
      <h1 class="view__title" style="font-size:1.4rem">${p ? "Edit project" : "New project"}</h1>
      <span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        ${statusChip(proj.status)}
        <button class="btn btn--primary btn--sm" data-save>${icon("save", 13)} Save</button>
        <button class="btn btn--soft btn--sm" data-publish>${icon("send", 13)} Publish</button>
      </span>
    </div>
    <div class="editor">
      <div class="editor__main">
        <div class="card" style="padding:20px">
          <div class="field"><label>Title <span class="req">*</span></label><input class="f-title" value="${esc(proj.title)}" placeholder="e.g. Orange Business New Executive Briefing Center"></div>
          <div class="field-row" style="margin-top:14px">
            <div class="field"><label>Client</label><input class="f-client" value="${esc(proj.client)}"></div>
            <div class="field"><label>Industry</label><input class="f-industry" value="${esc(proj.industry)}"></div>
          </div>
          <div class="field-row" style="margin-top:14px">
            <div class="field"><label>Year</label><input class="f-year" value="${esc(proj.year)}"></div>
            <div class="field"><label>Role</label><input class="f-role" value="${esc(proj.role)}"></div>
          </div>
          <div class="field" style="margin-top:14px"><label>One-line summary</label><input class="f-summary" value="${esc(proj.summary)}"></div>
          <div class="field" style="margin-top:14px"><label>Challenge</label><textarea class="f-challenge" rows="3">${esc(proj.challenge)}</textarea></div>
          <div class="field" style="margin-top:14px"><label>Approach</label><textarea class="f-approach" rows="3">${esc(proj.approach)}</textarea></div>
          <div class="field" style="margin-top:14px"><label>Outcome</label><textarea class="f-outcome" rows="3">${esc(proj.outcome)}</textarea></div>
          <div class="field" style="margin-top:14px"><label>Cover image</label>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <img id="projCover" src="${proj.image}" style="width:120px;height:76px;object-fit:cover;border-radius:10px;border:1px solid var(--line)" alt="">
              <button class="btn btn--ghost btn--sm" data-pick>${icon("image", 13)} Pick from media</button>
            </div></div>
        </div>
      </div>
      <div class="editor__side">
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:12px">Details</p>
          <div class="field"><label>Status</label><select class="f-status">${["draft", "review", "scheduled", "published"].map(s => `<option ${proj.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Slug</label><input class="f-slug" value="${esc(proj.slug || proj.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))}"></div>
          <div class="field" style="margin-top:12px"><label>Featured on homepage</label>
            <label class="toggle"><input type="checkbox" class="f-featured" ${proj.featured ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label></div>
          <div class="field" style="margin-top:12px"><label>Related articles</label>
            <div style="display:grid;gap:6px">
              ${S.get("articles").filter(a => a.type === "essay").slice(0, 4).map(a => `
                <label style="display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--ink-2);cursor:pointer">
                  <input type="checkbox" style="accent-color:var(--accent)"> ${esc(a.title)}</label>`).join("")}
            </div></div>
        </div>
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:10px">AI helper</p>
          <p style="font-size:12.5px;color:var(--ink-3);line-height:1.55">Draft the challenge, approach and outcome sections from your summary.</p>
          <button class="btn btn--soft btn--block" style="margin-top:10px" data-ai-draft>${icon("ai")} Draft with AI</button>
        </div>
      </div>
    </div>`;
  };
  const bindProjectEditor = view => {
    $("[data-back]", view).addEventListener("click", () => R.go("projects"));
    const read = () => ({
      title: $(".f-title", view).value.trim(), client: $(".f-client", view).value.trim(),
      industry: $(".f-industry", view).value.trim(), year: $(".f-year", view).value.trim(),
      role: $(".f-role", view).value.trim(), summary: $(".f-summary", view).value.trim(),
      challenge: $(".f-challenge", view).value.trim(), approach: $(".f-approach", view).value.trim(),
      outcome: $(".f-outcome", view).value.trim(), status: $(".f-status", view).value,
      slug: $(".f-slug", view).value.trim(), featured: $(".f-featured", view).checked,
      image: $("#projCover", view).getAttribute("src")
    });
    const persist = () => {
      const v = read();
      const id = decodeURIComponent(location.hash.split("id=")[1] || "");
      const projs = S.get("projects");
      let p = projs.find(x => x.id === id);
      if (!p) { p = { id: id || ("prj-" + Date.now()), views: "—", updated: "Just now" }; projs.push(p); }
      Object.assign(p, v, { updated: "Just now" });
      S.set("projects", projs);
      return p;
    };
    $("[data-save]", view).addEventListener("click", () => { persist(); toast("Project saved"); });
    $("[data-publish]", view).addEventListener("click", () => {
      const p = persist(); p.status = "published"; S.save();
      toast("Project published"); setTimeout(() => R.go("projects"), 500);
    });
    $("[data-pick]", view).addEventListener("click", () => {
      const m = modal({
        title: "Pick cover image",
        body: `<div class="media-grid" style="max-height:320px;overflow-y:auto">
          ${S.get("media").map(x => `<div class="media-item" data-src="${x.src}"><div class="media-item__img"><img src="${x.src}" alt="" loading="lazy"></div><div class="media-item__meta"><p class="media-item__name">${esc(x.name)}</p></div></div>`).join("")}
        </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $$(".media-item", m.el).forEach(item => item.addEventListener("click", () => {
        $("#projCover", view).src = item.dataset.src; m.close(); toast("Cover updated");
      }));
    });
    $("[data-ai-draft]", view).addEventListener("click", () => {
      const btn = $("[data-ai-draft]", view);
      btn.disabled = true; btn.innerHTML = `${icon("ai", 13)} Drafting…`;
      setTimeout(() => {
        btn.disabled = false; btn.innerHTML = `${icon("ai", 13)} Draft with AI`;
        if (!$(".f-challenge", view).value) $(".f-challenge", view).value = "Genuinely complex platforms had let complexity become the experience — powerful capability buried under jargon, waiting for a translator.";
        if (!$(".f-approach", view).value) $(".f-approach", view).value = "Translate system architecture into human narratives — experience films, interactive demos and centre experiences that make capability legible.";
        if (!$(".f-outcome", view).value) $(".f-outcome", view).value = "Buyers can finally see, understand — and remember.";
        toast("Draft generated — review before publishing", "accent");
      }, 1500);
    });
  };

  /* ============ CASE STUDIES ============ */
  R.register("casestudies", () => {
    const featured = S.get("projects").filter(x => x.featured || x.status === "published");
    return `
    <div class="view__head">
      <div><h1 class="view__title">Case studies</h1>
      <p class="view__desc">The featured stories on the website — each a structured deep-dive.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-go="projects">All projects</button>
        <button class="btn btn--primary" data-new="projects">${icon("plus")} New case study</button>
      </div>
    </div>
    <div class="grid grid-3">
      ${featured.map(x => `
        <div class="card card--hover proj-card">
          <div class="proj-card__img"><img src="${x.image}" alt="" loading="lazy"><span class="chip">${esc(x.client)}</span></div>
          <div class="proj-card__body">
            <p class="proj-card__title">${esc(x.title)}</p>
            <p class="proj-card__meta">${esc(x.industry)} · ${esc(x.views)} views</p>
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn btn--soft btn--sm" style="flex:1" data-open="${x.id}">${icon("pen", 13)} Edit study</button>
            </div>
          </div>
        </div>`).join("")}
    </div>`;
  });
  R.after("casestudies", view => {
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    $$("[data-new]", view).forEach(b => b.addEventListener("click", () => R.go("projects", { action: "new" })));
    $$("[data-open]", view).forEach(b => b.addEventListener("click", () => R.go("projects", { id: b.dataset.open })));
  });

  /* ============ CLIENTS ============ */
  const clientSeed = [
    { name: "Amazon", monogram: "a", industry: "Technology" }, { name: "Orange Business", monogram: "OB", industry: "Enterprise" },
    { name: "Indian Army", monogram: "IA", industry: "Defence" }, { name: "TATA Advanced Systems", monogram: "TAS", industry: "Defence" },
    { name: "Indian Oil", monogram: "IOC", industry: "Energy" }, { name: "BPCL", monogram: "BP", industry: "Energy" },
    { name: "Samsung SDS", monogram: "SS", industry: "Technology" }, { name: "Sony BBC Earth", monogram: "SBE", industry: "Media" },
    { name: "Nickelodeon", monogram: "N", industry: "Media" }, { name: "Rockwell Automation", monogram: "RA", industry: "Manufacturing" },
    { name: "Govt. of Rajasthan", monogram: "GR", industry: "Government" }, { name: "Metabloqs", monogram: "M", industry: "Emerging" }
  ];
  R.register("clients", () => {
    const clients = S.get("clients") || clientSeed;
    return `
    <div class="view__head">
      <div><h1 class="view__title">Clients</h1>
      <p class="view__desc">The organizations that trusted the work when it mattered.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add client</button></div>
    </div>
    <div class="grid grid-4">
      ${clients.map((c, i) => `
        <div class="card card--hover" style="padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
          ${c.logo
            ? `<img src="/assets/logos/${esc(c.logo)}" alt="${esc(c.name)} logo" style="width:auto;height:38px;max-width:120px;object-fit:contain" loading="lazy">`
            : `<div style="width:52px;height:52px;border-radius:14px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:700;font-size:15px">${esc(c.monogram || c.name.slice(0,2).toUpperCase())}</div>`}
          <div><p style="font-weight:600;font-size:13.5px">${esc(c.name)}</p>
          <p style="font-size:11.5px;color:var(--ink-3)">${esc(c.industry)}</p></div>
          <div style="display:flex;gap:6px">
            <button class="btn btn--sm btn--soft" data-edit="${i}" title="Edit">${icon("pen", 12)}</button>
            <button class="btn btn--sm btn--ghost" data-del="${i}">${icon("trash", 12)}</button>
          </div>
        </div>`).join("")}
    </div>`;
  });
  R.after("clients", view => {
    if (!S.get("clients")) S.set("clients", clientSeed);
    const clients = () => S.get("clients");
    const LOGOS = ["amazon.webp","orange-business.webp","indian-army.webp","tata-advanced-systems.webp","indian-oil.webp","bpcl.webp","samsung-sds.webp","sony-bbc-earth.webp","nickelodeon.webp","rockwell-automation.webp","govt-of-rajasthan.webp","metabloqs.webp","papa-johns.webp","dunkin.webp","jk-lakshmi-cement.webp","regional-express.webp",""];
    const clientModal = (c, isNew) => {
      const m = modal({
        title: isNew ? "Add client" : `Edit — ${esc(c.name)}`,
        body: `<div class="field"><label>Name</label><input class="f-n" value="${esc(c.name || "")}" placeholder="Client name"></div>
               <div class="field" style="margin-top:12px"><label>Industry</label><input class="f-i" value="${esc(c.industry || "")}" placeholder="e.g. Enterprise"></div>
               <div class="field" style="margin-top:12px"><label>Logo file (from the logo wall pool)</label>
                 <input class="f-logo" list="logoList" value="${esc(c.logo || "")}" placeholder="leave blank for monogram">
                 <datalist id="logoList">${LOGOS.map(l => `<option value="${l}">`).join("")}</datalist></div>
               <div style="margin-top:10px;display:flex;align-items:center;gap:12px">
                 <img id="logoPrev" src="${c.logo ? "/assets/logos/" + esc(c.logo) : ""}" alt="" style="height:34px;max-width:120px;object-fit:contain;${c.logo ? "" : "display:none"}">
                 <span class="hint" style="font-size:11px;color:var(--ink-3)">Logos live in the logo wall pool — keep the monogram if no file is set.</span>
               </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>${isNew ? "Add client" : "Save changes"}</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $(".f-logo", m.el).addEventListener("input", () => {
        const v = $(".f-logo", m.el).value.trim();
        const prev = $("#logoPrev", m.el);
        if (v && LOGOS.includes(v)) { prev.src = "/assets/logos/" + v; prev.style.display = ""; }
        else prev.style.display = "none";
      });
      $("[data-s]", m.el).addEventListener("click", () => {
        const name = $(".f-n", m.el).value.trim() || "New client";
        Object.assign(c, {
          name,
          monogram: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
          industry: $(".f-i", m.el).value.trim() || "—",
          logo: $(".f-logo", m.el).value.trim() || null
        });
        S.save(); toast("Client saved"); m.close(); R.go("clients");
      });
    };
    $("[data-add]", view).addEventListener("click", () => {
      const c = {}; clients().push(c); clientModal(c, true);
    });
    $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => clientModal(clients()[+b.dataset.edit], false)));
    $$("[data-del]", view).forEach(b => b.addEventListener("click", () => {
      clients().splice(+b.dataset.del, 1); S.save(); toast("Client removed"); R.go("clients");
    }));
  });

  /* ============ THINKING (essays) ============ */
  R.register("thinking", (p) => p?.id ? articleEditorHTML(p.id === "new" ? null : S.get("articles").find(a => a.id === p.id)) : `
    <div class="view__head">
      <div><h1 class="view__title">Thinking <em>— essays</em></h1>
      <p class="view__desc">Long-form essays on design, AI and enterprise. Rich editor, versions, scheduling.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-go="journal">Journal</button>
        <button class="btn btn--primary" data-new="thinking">${icon("plus")} New essay</button>
      </div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Title</th><th>Category</th><th>Read</th><th>Status</th><th>Views</th><th>Updated</th><th></th></tr></thead>
        <tbody id="artBody"></tbody>
      </table>
    </div>`);
  R.after("thinking", view => {
    if ($("[data-back]", view)) { bindArticleEditor(view); return; }
    const render = () => {
      $("#artBody", view).innerHTML = S.get("articles").filter(a => a.type === "essay").map(a => `<tr>
        <td><p class="cell-main">${esc(a.title)}</p></td>
        <td><span class="chip chip--muted">${esc(a.category)}</span></td>
        <td style="color:var(--ink-3)">${esc(a.readTime)}</td>
        <td>${statusChip(a.status)}</td>
        <td style="color:var(--ink-3)">${esc(a.views)}</td>
        <td style="color:var(--ink-3);font-size:12px">${esc(a.updated)}</td>
        <td><div style="display:flex;gap:4px">
          <button class="icon-btn" style="width:30px;height:30px" data-open="${a.id}">${icon("pen", 14)}</button>
          <button class="icon-btn" style="width:30px;height:30px" data-del="${a.id}">${icon("trash", 14)}</button>
        </div></td>
      </tr>`).join("");
      $$("[data-open]", view).forEach(b => b.addEventListener("click", () => R.go("thinking", { id: b.dataset.open })));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete essay?", "This removes the essay and its URL.", () => {
        S.set("articles", S.get("articles").filter(x => x.id !== b.dataset.del));
        toast("Essay deleted"); render();
      })));
    };
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    $$("[data-new]", view).forEach(b => b.addEventListener("click", () => R.go("thinking", { id: "new" })));
    render();
  });

  const articleEditorHTML = a => {
    const art = a || { id: "art-" + Date.now(), title: "", type: "essay", status: "draft", category: "Design", readTime: "5 min", date: "2026-08-08", image: "media/essay-01.webp", excerpt: "", body: "", views: "—", updated: "Just now" };
    return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">
      <button class="btn btn--ghost btn--sm" data-back>${icon("arrowL", 14)} Essays</button>
      <h1 class="view__title" style="font-size:1.4rem">${a ? "Edit essay" : "New essay"}</h1>
      <span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        ${statusChip(art.status)}
        <button class="btn btn--ghost btn--sm" data-preview>${icon("eye", 13)} Preview</button>
        <button class="btn btn--primary btn--sm" data-save>${icon("save", 13)} Save</button>
      </span>
    </div>
    <div class="editor">
      <div class="editor__main">
        <div class="card" style="padding:20px">
          <div class="field"><label>Title <span class="req">*</span></label><input class="f-title" value="${esc(art.title)}" placeholder="Give it a title that demands to be read"></div>
          <div class="field" style="margin-top:14px"><label>Excerpt</label><textarea class="f-excerpt" rows="2">${esc(art.excerpt)}</textarea></div>
          <div class="field" style="margin-top:14px"><label>Body</label>
            <div class="rich">
              <div class="rich__toolbar" id="richToolbar">
                ${[["bold", "B", "Bold"], ["italic", "I", "Italic"], ["h2", "H2", "Heading"], ["quote", "❝", "Quote"], ["list", "•", "List"], ["code", "</>", "Code"]].map(([id, label, tip]) =>
                  `<button type="button" data-cmd="${id}" title="${tip}" aria-label="${tip}">${id === "bold" ? "<b>B</b>" : id === "italic" ? "<i>I</i>" : label}</button>`).join("")}
                <span style="flex:1"></span>
                <span style="font-size:11px;color:var(--ink-4);align-self:center;padding-right:6px">Markdown supported</span>
              </div>
              <textarea id="fBody" style="width:100%;min-height:300px;border:0;background:none;padding:16px;outline:none;resize:vertical;font-size:14.5px;line-height:1.7;font-family:inherit;color:var(--ink)">${esc(art.body)}</textarea>
            </div>
          </div>
          <div class="field" style="margin-top:14px"><label>Cover</label>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <img id="artCover" src="${art.image}" style="width:120px;height:68px;object-fit:cover;border-radius:10px;border:1px solid var(--line)" alt="">
              <button class="btn btn--ghost btn--sm" data-pick>${icon("image", 13)} Pick from media</button>
            </div></div>
        </div>
      </div>
      <div class="editor__side">
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:12px">Publishing</p>
          <div class="field"><label>Status</label><select class="f-status">${["draft", "review", "scheduled", "published"].map(s => `<option ${art.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Category</label><select class="f-cat">${["Design", "AI", "Experience", "Enterprise", "Journal"].map(c => `<option ${art.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Read time</label><input class="f-time" value="${esc(art.readTime)}"></div>
          <div class="field" style="margin-top:12px"><label>Publish date</label><input type="date" class="f-date" value="${esc(art.date)}"></div>
        </div>
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:12px">SEO</p>
          <div class="field"><label>SEO title</label><input class="f-setitle" value="${esc(art.title)}"></div>
          <div class="field" style="margin-top:10px"><label>Meta description</label><textarea class="f-sedesc" rows="2">${esc(art.excerpt)}</textarea></div>
          <p style="font-size:11px;color:var(--ink-4);margin-top:8px">Estimated score: <b style="color:var(--ok)">94</b></p>
        </div>
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:10px">Version history</p>
          <div style="display:grid;gap:7px">
            ${[["Now", "Current draft"], ["2h ago", "Auto-saved"], ["Yesterday", "“AI polish”"]].map(([t, l]) => `
              <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-2)">
                <span class="status-dot status-dot--accent"></span>${l}<span style="margin-left:auto;color:var(--ink-4)">${t}</span>
              </div>`).join("")}
          </div>
          <button class="btn btn--ghost btn--sm btn--block" style="margin-top:10px" data-versions>View all versions</button>
        </div>
        <div class="card" style="padding:16px">
          <p class="card__title" style="margin-bottom:10px">AI helper</p>
          <button class="btn btn--soft btn--block" data-ai-polish>${icon("ai")} Polish with AI</button>
          <button class="btn btn--ghost btn--block" style="margin-top:8px" data-ai-seo>${icon("search", 13)} Generate SEO meta</button>
        </div>
      </div>
    </div>`;
  };
  const bindArticleEditor = view => {
    $("[data-back]", view).addEventListener("click", () => R.go("thinking"));
    const read = () => ({
      title: $(".f-title", view).value.trim(), excerpt: $(".f-excerpt", view).value.trim(),
      body: $("#fBody", view).value, status: $(".f-status", view).value, category: $(".f-cat", view).value,
      readTime: $(".f-time", view).value, date: $(".f-date", view).value
    });
    const persist = () => {
      const v = read();
      const id = decodeURIComponent(location.hash.split("id=")[1] || "");
      const arts = S.get("articles");
      let a = arts.find(x => x.id === id);
      if (!a) { a = { id: id || ("art-" + Date.now()), type: "essay", image: "media/essay-01.webp", views: "—" }; arts.push(a); }
      Object.assign(a, v, { updated: "Just now" });
      S.set("articles", arts);
      return a;
    };
    $("[data-save]", view).addEventListener("click", () => { persist(); toast("Essay saved"); });
    $("#richToolbar", view).addEventListener("click", e => {
      const btn = e.target.closest("[data-cmd]");
      if (!btn) return;
      const ta = $("#fBody", view);
      const { selectionStart: s, selectionEnd: en } = ta;
      const wrap = { bold: ["**", "**"], italic: ["_", "_"], h2: ["\n## ", ""], quote: ["\n> ", ""], list: ["\n- ", ""], code: ["`", "`"] };
      const [o, c] = wrap[btn.dataset.cmd];
      const sel = ta.value.slice(s, en) || (btn.dataset.cmd === "h2" ? "Heading" : btn.dataset.cmd === "quote" ? "Quote" : btn.dataset.cmd === "list" ? "Item" : "text");
      ta.value = ta.value.slice(0, s) + o + sel + c + ta.value.slice(en);
      ta.focus();
    });
    $("[data-preview]", view).addEventListener("click", () => {
      const v = read();
      modal({
        title: "Preview",
        body: `
          <div style="border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden">
            <img src="${$("#artCover", view).getAttribute("src")}" style="width:100%;height:180px;object-fit:cover" alt="">
            <div style="padding:26px 28px;background:var(--surface)">
              <p style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)">Essay · ${esc(v.readTime)}</p>
              <h3 style="font-family:var(--serif);font-style:italic;font-size:clamp(1.5rem,3vw,2.2rem);margin-top:8px">${esc(v.title)}</h3>
              <p style="color:var(--ink-3);margin-top:10px;font-size:13px">${esc(v.excerpt)}</p>
              <div style="border-left:3px solid var(--accent);padding-left:16px;margin-top:18px;color:var(--ink-2);font-style:italic">${esc(v.body.split("\n\n")[1] || v.body.slice(0, 180))}</div>
            </div>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button>`
      });
    });
    $("[data-pick]", view).addEventListener("click", () => {
      const m = modal({
        title: "Pick cover",
        body: `<div class="media-grid" style="max-height:300px;overflow-y:auto">
          ${S.get("media").map(x => `<div class="media-item" data-src="${x.src}"><div class="media-item__img"><img src="${x.src}" alt="" loading="lazy"></div><div class="media-item__meta"><p class="media-item__name">${esc(x.name)}</p></div></div>`).join("")}
        </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $$(".media-item", m.el).forEach(i => i.addEventListener("click", () => { $("#artCover", view).src = i.dataset.src; m.close(); }));
    });
    $("[data-versions]", view).addEventListener("click", async () => {
      const r = await AV.api.get("/api/versions/articles");
      const list = (r.data || []).filter(v => v.entity_id === "articles");
      if (!r.ok || !list.length) { toast("No versions yet — save first", "accent"); return; }
      const m = modal({
        title: "Version history",
        body: `<div style="display:grid;gap:8px;max-height:50vh;overflow-y:auto">
          ${list.map(v => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px">
              <span class="chip chip--accent">v${v.version}</span>
              <div style="flex:1;min-width:0">
                <p style="font-size:12.5px;font-weight:600">${esc(v.note || "Revision " + v.version)}</p>
                <p style="font-size:11px;color:var(--ink-4)">${esc((v.created_at || "").replace("T", " ").slice(0, 16))}</p>
              </div>
              <button class="btn btn--sm btn--soft" data-restore="${v.version}">${icon("refresh", 12)} Restore</button>
            </div>`).join("")}
        </div>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $$("[data-restore]", m.el).forEach(b => b.addEventListener("click", async () => {
        const rr = await AV.api.send("/api/versions/articles/restore", "POST", { version: +b.dataset.restore });
        if (rr.ok) { toast("Version restored — publish to apply", "accent"); m.close(); }
        else toast("Restore failed: " + (rr.error?.message || "error"), "error");
      }));
    });
    $("[data-ai-polish]", view).addEventListener("click", () => {
      const btn = $("[data-ai-polish]", view);
      btn.disabled = true; btn.innerHTML = `${icon("ai", 13)} Polishing…`;
      setTimeout(() => { btn.disabled = false; btn.innerHTML = `${icon("ai", 13)} Polish with AI`; toast("Polished — 14 improvements applied", "accent"); }, 1600);
    });
    $("[data-ai-seo]", view).addEventListener("click", () => toast("SEO meta generated — title, description, keywords", "accent"));
  };

  /* ============ JOURNAL ============ */
  R.register("journal", () => {
    const arts = S.get("articles").filter(a => a.type === "journal");
    return `
    <div class="view__head">
      <div><h1 class="view__title">Journal</h1>
      <p class="view__desc">Dated notes from the workbench — quick to write, easy to publish.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-go="thinking">Essays</button>
        <button class="btn btn--primary" data-new="thinking">${icon("plus")} New entry</button>
      </div>
    </div>
    <div class="grid grid-2">
      ${arts.map(a => `
        <div class="card card--hover" style="padding:18px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            ${statusChip(a.status)}
            <span style="font-size:11.5px;color:var(--ink-4)">${esc(a.date)} · ${esc(a.readTime)}</span>
          </div>
          <p style="font-weight:600;font-size:14.5px;letter-spacing:-.01em">${esc(a.title)}</p>
          <p style="font-size:12.5px;color:var(--ink-3);margin-top:6px;line-height:1.55">${esc(a.excerpt)}</p>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn--soft btn--sm" data-open="${a.id}">${icon("pen", 13)} Edit</button>
            <button class="btn btn--ghost btn--sm" data-pub="${a.id}">${icon("send", 13)} Publish</button>
          </div>
        </div>`).join("")}
    </div>`;
  });
  R.after("journal", view => {
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    $$("[data-new]", view).forEach(b => b.addEventListener("click", () => R.go("thinking", { id: "new" })));
    $$("[data-open]", view).forEach(b => b.addEventListener("click", () => R.go("thinking", { id: b.dataset.open })));
    $$("[data-pub]", view).forEach(b => b.addEventListener("click", () => {
      const a = S.get("articles").find(x => x.id === b.dataset.pub);
      a.status = "published"; S.save(); toast(`“${a.title}” published`); R.go("journal");
    }));
  });

  /* ============ FUTURE LAB ============ */
  R.register("futurelab", () => `
    <div class="view__head">
      <div><h1 class="view__title">Future Lab</h1>
      <p class="view__desc">Experiments, prototypes and things that don't fit a template yet.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} New experiment</button></div>
    </div>
    <div class="grid grid-3">
      <div class="card card--hover" style="padding:20px;border-top:3px solid var(--accent)">
        <span class="chip chip--accent">AI × Narrative</span>
        <p style="font-weight:600;font-size:15px;margin-top:12px">The Virtual Life</p>
        <p style="font-size:12.5px;color:var(--ink-3);margin-top:6px;line-height:1.6">An AI-crafted narrative world exploring whether generated media can carry genuine emotional weight.</p>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <div class="prog" style="flex:1;min-width:90px"><i style="width:80%"></i></div>
          <span class="chip chip--muted">80%</span>
        </div>
      </div>
      <div class="card card--hover" style="padding:20px;border-top:3px solid var(--azure)">
        <span class="chip chip--accent">Experiential</span>
        <p style="font-weight:600;font-size:15px;margin-top:12px">Immersive Wedding Invitation</p>
        <p style="font-size:12.5px;color:var(--ink-3);margin-top:6px;line-height:1.6">A platform turning a wedding invitation into an explorable, AI-personalized experience for every guest.</p>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <div class="prog" style="flex:1;min-width:90px"><i style="width:60%"></i></div>
          <span class="chip chip--muted">60%</span>
        </div>
      </div>
      <div class="card card--hover" style="padding:20px;border-top:3px solid var(--ok)">
        <span class="chip chip--accent">Research</span>
        <p style="font-weight:600;font-size:15px;margin-top:12px">Clarity Metric Study</p>
        <p style="font-size:12.5px;color:var(--ink-3);margin-top:6px;line-height:1.6">Measuring comprehension as a business metric — a working definition teams can adopt tomorrow.</p>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <div class="prog" style="flex:1;min-width:90px"><i style="width:95%"></i></div>
          <span class="chip chip--muted">95%</span>
        </div>
      </div>
    </div>`);
  R.after("futurelab", view => {
    $("[data-add]", view).addEventListener("click", () => toast("Experiment created — draft", "accent"));
  });
})();
