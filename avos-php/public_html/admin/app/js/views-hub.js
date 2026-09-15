/* ============================================================
   AV OS v2.4 — INTEGRATION HUB + DATA INTELLIGENCE VIEWS
   Integration Command Center · Research engine · Knowledge
   graph + truth layer · Social hub + trackable links.
   Loaded after the core views and owns the integrations command center.
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const R = AV.router;
  const api = AV.api;

  const STATUS_CLS = {
    connected: "chip--ok",
    configured: "chip--accent",
    not_connected: "chip--muted",
    auth_required: "chip--warn",
    rate_limited: "chip--warn",
    error: "chip--err",
    disabled: "chip--muted",
    unavailable: "chip--muted",
    limited: "chip--warn",
    manual: "chip--muted"
  };

  const fmtAgo = s => {
    if (!s) return "never";
    const t = new Date(String(s).replace(" ", "T") + (String(s).includes("Z") ? "" : "Z")).getTime();
    if (isNaN(t)) return String(s).slice(0, 16);
    const d = (Date.now() - t) / 1000;
    if (d < 60) return "just now";
    if (d < 3600) return Math.floor(d / 60) + "m ago";
    if (d < 86400) return Math.floor(d / 3600) + "h ago";
    return Math.floor(d / 86400) + "d ago";
  };

  /* ============================================================
     INTEGRATIONS — command center (replaces legacy view)
     ============================================================ */
  R.register("integrations", () => `
    <div class="view__head">
      <div><h1 class="view__title">Integration Hub</h1>
      <p class="view__desc">Real connections to your services — every status chip is verified by an actual request. Free-first: native APIs, RSS, open standards, internal fallbacks. No fake "connected" states.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button>
        <button class="btn btn--soft" data-sync-due>${icon("play")} Sync due now</button>
      </div>
    </div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:26px;font-weight:700" id="hubTotal">—</div><div style="font-size:11px;color:var(--ink-4)">integrations</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:26px;font-weight:700;color:var(--ok)" id="hubConnected">—</div><div style="font-size:11px;color:var(--ink-4)">verified connected</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:26px;font-weight:700;color:var(--warn)" id="hubErrors">—</div><div style="font-size:11px;color:var(--ink-4)">in error state</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:26px;font-weight:700" id="hubCalls">—</div><div style="font-size:11px;color:var(--ink-4)">API calls / 24h</div></div></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Registry</p><span class="chip chip--muted">CONNECTED only after a real verified request</span></div>
      <div class="card__body" id="intGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px"></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Agent → tool graph</p><span class="chip chip--muted">which agents may use which integrations</span></div>
        <div class="card__body" id="toolGraph" style="max-height:320px;overflow-y:auto"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Recent API call log</p><button class="btn btn--sm btn--ghost" data-go-calls>${icon("clock", 12)} all</button></div>
        <div class="card__body" id="callLog" style="max-height:320px;overflow-y:auto"></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">AI providers + email delivery</p><span class="chip chip--muted">keys encrypted at rest · never shown again</span></div>
      <div class="card__body" id="aiProvList"></div>
      <div class="card__body" style="border-top:1px solid var(--line);margin-top:6px">
        <div class="grid grid-2" style="gap:10px">
          <div class="field"><label>SMTP host</label><input id="smHost" placeholder="smtp.hostinger.com"></div>
          <div class="field"><label>Port</label><input id="smPort" type="number" value="587"></div>
        </div>
        <div class="grid grid-2" style="gap:10px;margin-top:10px">
          <div class="field"><label>Encryption</label><select id="smEnc"><option value="tls">STARTTLS (587)</option><option value="ssl">SSL (465)</option><option value="none">None (test)</option></select></div>
          <div class="field"><label>Username</label><input id="smUser" autocomplete="off"></div>
        </div>
        <div class="grid grid-2" style="gap:10px;margin-top:10px">
          <div class="field"><label>Password <span class="hint">(blank keeps existing)</span></label><input id="smPass" type="password" autocomplete="new-password"></div>
          <div class="field"><label>From address</label><input id="smFrom" placeholder="no-reply@abhijeetvarghese.com"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn--primary" data-sm-save>${icon("save", 13)} Save SMTP</button>
          <button class="btn btn--soft" data-sm-test>${icon("send", 13)} Test email</button>
          <a class="btn btn--ghost" data-go-calendly>${icon("key", 13)} Calendly signing key →</a>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Data intelligence</p></div>
      <div class="card__body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">
        <a class="btn btn--soft" data-go="research">${icon("search", 13)} Research engine</a>
        <a class="btn btn--soft" data-go="knowledgegraph">${icon("layers", 13)} Knowledge graph + truth</a>
        <a class="btn btn--soft" data-go="socialhub">${icon("users", 13)} Social + trackable links</a>
      </div>
    </div>`);

  R.after("integrations", view => {
    let rows = [];
    const load = async () => {
      const r = await api.get("/api/integrations");
      if (!r.ok) return;
      rows = r.data.items || [];
      const h = r.data.health || {};
      $("#hubTotal", view).textContent = h.total ?? rows.length;
      $("#hubConnected", view).textContent = h.connected ?? 0;
      $("#hubErrors", view).textContent = h.errors ?? 0;
      $("#hubCalls", view).textContent = h.calls_24h ?? 0;
      $("#intGrid", view).innerHTML = rows.map(i => {
        const cls = STATUS_CLS[i.status] || "chip--muted";
        const caps = i.capabilities ? Object.entries(i.capabilities).map(([k, v]) => `<div style="font-size:11px;color:var(--ink-4)"><b style="color:var(--ink-2)">${esc(k)}</b>: ${esc(String(v).slice(0, 90))}</div>`).join("") : "";
        return `
        <div style="border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--surface-2)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <b style="flex:1;font-size:13.5px">${esc(i.name)}</b>
            <span class="chip ${cls}" style="font-size:10px">${esc(i.status_label || i.status)}</span>
          </div>
          <div style="font-size:11px;color:var(--ink-4);margin-bottom:6px">${esc(i.provider || "")} · ${esc(i.category || "")} · auth: ${esc(i.authentication_type || "none")} · ${esc(i.free_tier || "free")} tier</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            <span class="chip chip--muted" style="font-size:10px">sync ${fmtAgo(i.last_sync_at)}</span>
            ${i.last_success_at ? `<span class="chip chip--ok" style="font-size:10px">ok ${fmtAgo(i.last_success_at)}</span>` : ""}
            ${i.last_failure_at ? `<span class="chip chip--err" style="font-size:10px">fail ${fmtAgo(i.last_failure_at)}</span>` : ""}
            ${i.rate_limit ? `<span class="chip chip--muted" style="font-size:10px">${esc(String(i.rate_limit.limit || "")).slice(0, 40)}</span>` : ""}
          </div>
          ${caps ? `<div style="border-top:1px dashed var(--line);padding-top:6px;margin-bottom:8px">${caps}</div>` : ""}
          ${i.last_error ? `<div style="font-size:11px;color:var(--err);margin-bottom:6px">⚠ ${esc(i.last_error.slice(0, 120))}</div>` : ""}
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn--sm btn--soft" data-test="${esc(i.code)}">${icon("zap", 11)} Test</button>
            <button class="btn btn--sm btn--ghost" data-config="${esc(i.code)}">${icon("key", 11)} Configure</button>
            ${i.sync_interval_minutes > 0 && !["openai","claude","gemini"].includes(i.code) ? `<button class="btn btn--sm btn--ghost" data-sync="${esc(i.code)}">${icon("play", 11)} Sync</button>` : ""}
            <button class="btn btn--sm btn--ghost" data-enable="${esc(i.code)}" data-on="${i.enabled ? 1 : 0}">${i.enabled ? "Disable" : "Enable"}</button>
          </div>
        </div>`;
      }).join("");
      $$("[data-test]", view).forEach(b => b.addEventListener("click", async () => {
        toast("Testing connection — real request…", "accent");
        const r = await api.send("/api/integrations/" + b.dataset.test + "/test", "POST", {});
        if (r.ok && r.data && r.data.ok) { toast("Verified — " + (r.data.message || "connected")); load(); }
        else toast((r.data && r.data.error) || "Test failed", "error");
      }));
      $$("[data-sync]", view).forEach(b => b.addEventListener("click", async () => {
        toast("Syncing…", "accent");
        const r = await api.send("/api/integrations/" + b.dataset.sync + "/sync", "POST", {});
        if (r.ok && r.data && r.data.ok) toast("Synced — " + (r.data.message || ""), "ok");
        else toast((r.data && (r.data.error || r.data.message)) || "Sync failed", "error");
        load();
      }));
      $$("[data-enable]", view).forEach(b => b.addEventListener("click", async () => {
        const on = b.dataset.on === "1";
        const r = await api.send("/api/integrations/" + b.dataset.enable + (on ? "/disable" : "/enable"), "POST", {});
        if (r.ok) { toast(on ? "Disabled" : "Enabled"); load(); }
      }));
      $$("[data-config]", view).forEach(b => b.addEventListener("click", () => configModal(b.dataset.config, rows, load)));
    };
    const loadGraph = async () => {
      const r = await api.get("/api/integrations/agent-graph");
      if (!r.ok) return;
      $("#toolGraph", view).innerHTML = (r.data.graph || []).map(g => `
        <div style="padding:7px 0;border-bottom:1px solid var(--line)">
          <div style="font-size:12.5px;font-weight:600">${esc(g.label)} <span style="color:var(--ink-4);font-weight:400">· ${esc(g.agent)}</span></div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
            ${(g.tools || []).map(t => `<span class="chip chip--accent" style="font-size:10px">${esc(t)}</span>`).join("") || `<span class="chip chip--muted" style="font-size:10px">no external tools</span>`}
          </div>
        </div>`).join("");
    };
    const loadCalls = async () => {
      const r = await api.get("/api/integrations/calls?limit=14");
      if (!r.ok) return;
      $("#callLog", view).innerHTML = (r.data.calls || []).map(c => `
        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);font-size:11.5px">
          <span class="chip ${c.success ? "chip--ok" : "chip--err"}" style="font-size:9px">${c.success ? "OK" : "FAIL"}</span>
          <b>${esc(c.provider)}</b><span style="color:var(--ink-4);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.endpoint)}</span>
          <span style="color:var(--ink-4)">${c.duration_ms}ms</span>
          <span style="color:var(--ink-4)">${fmtAgo(c.created_at)}</span>
        </div>`).join("") || `<div style="color:var(--ink-4);font-size:12px;padding:8px 0">No external calls yet — connect an integration or run a sync.</div>`;
    };
    const loadProviders = async () => {
      const r = await api.get("/api/ai/providers");
      if (!r.ok) return;
      const cfg = (r.data && r.data.configured) || [];
      $("#aiProvList", view).innerHTML = cfg.map(p => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)">
          <span style="font-weight:600;width:150px;font-size:13px">${esc(p.label)}</span>
          <code style="font-size:11.5px;color:var(--ink-4);flex:1">${esc(p.model)}</code>
          <span class="chip ${p.has_key ? "chip--ok" : "chip--warn"}">${p.has_key ? "key set ✓" : "no key"}</span>
          <button class="btn btn--sm btn--soft" data-ai-key="${esc(p.code)}" data-ai-label="${esc(p.label)}">${icon("key", 12)} Configure</button>
        </div>`).join("");
      $$("[data-ai-key]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: `API key — ${esc(b.dataset.aiLabel)}`,
          body: `<p style="font-size:12px;color:var(--ink-3);margin-bottom:10px">Encrypted at rest with AV_ENC_KEY; never shown again after saving.</p>
                 <div class="field"><label>API key</label><input type="password" class="f-key" autocomplete="off"></div>
                 <div class="field" style="margin-top:10px"><label>Model (optional)</label><input class="f-model" placeholder="leave blank to keep default"></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save key</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await api.send("/api/ai/providers/" + b.dataset.aiKey, "PUT", { api_key: $(".f-key", m.el).value.trim(), model: $(".f-model", m.el).value.trim() });
          if (r.ok) { toast("Key saved (encrypted)"); m.close(); loadProviders(); } else toast("Save failed", "error");
        });
      }));
    };
    const loadSmtp = async () => {
      const r = await api.get("/api/smtp");
      if (!r.ok) return;
      const c = r.data || {};
      $("#smHost", view).value = c.host || "";
      $("#smPort", view).value = c.port || 587;
      $("#smEnc", view).value = c.encryption || "tls";
      $("#smUser", view).value = c.username || "";
      $("#smFrom", view).value = c.from || "";
    };
    $("[data-refresh]", view).addEventListener("click", () => { load(); loadGraph(); loadCalls(); });
    $("[data-sync-due]", view).addEventListener("click", async () => {
      toast("Syncing due integrations…", "accent");
      const due = rows.filter(i => i.enabled && i.sync_interval_minutes > 0 && !["openai","claude","gemini"].includes(i.code));
      let done = 0, failed = 0;
      for (const i of due.slice(0, 8)) {
        const r = await api.send("/api/integrations/" + i.code + "/sync", "POST", {});
        if (r.ok && r.data && r.data.ok) done++; else failed++;
      }
      toast(`Sync cycle: ${done} ok, ${failed} failed`); load(); loadCalls();
    });
    $("[data-go-calls]", view).addEventListener("click", () => R.go("logs"));
    $("[data-go-calendly]", view).addEventListener("click", () => R.go("platform", { tab: "webhooks" }));
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    $("[data-sm-save]", view).addEventListener("click", async () => {
      const r = await api.send("/api/smtp", "PUT", {
        host: $("#smHost", view).value.trim(), port: $("#smPort", view).value, encryption: $("#smEnc", view).value,
        username: $("#smUser", view).value.trim(), password: $("#smPass", view).value, from: $("#smFrom", view).value.trim()
      });
      toast(r.ok ? "SMTP config saved (credentials encrypted server-side)" : "Save failed", r.ok ? "ok" : "error");
    });
    $("[data-sm-test]", view).addEventListener("click", async () => {
      const r = await api.send("/api/smtp/test", "POST", {});
      toast(r.ok && r.data && r.data.ok ? "SMTP test sent — check inbox + email log" : "SMTP test failed: " + ((r.data && r.data.error) || "error"), r.ok && r.data && r.data.ok ? "ok" : "error");
    });
    load(); loadGraph(); loadCalls(); loadProviders(); loadSmtp();
  });

  const configModal = (code, rows, reload) => {
    const i = rows.find(x => x.code === code);
    if (!i) return;
    const fields = {
      gsc: [["site_url", "Property URL (e.g. https://abhijeetvarghese.com/)", "text", "https://abhijeetvarghese.com/"], ["service_account_json", "Service account JSON (full paste)", "textarea", ""], ["days", "Days to import (3-90)", "number", "28"]],
      ga4: [["property_id", "GA4 property ID (numbers only)", "text", ""], ["service_account_json", "Service account JSON (full paste)", "textarea", ""], ["days", "Days to import (3-90)", "number", "28"]],
      bing: [["api_key", "Bing Webmaster API key", "password", ""], ["site_url", "Site URL", "text", "https://abhijeetvarghese.com/"], ["days", "Days (3-90)", "number", "28"]],
      clarity: [["project_id", "Clarity project ID", "text", ""], ["access_token", "Access token (Azure AD app)", "password", ""]],
      cloudflare: [["api_token", "Cloudflare API token (Zone Read + Analytics Read)", "password", ""], ["zone_id", "Zone ID", "text", ""]],
      calendly: [["api_key", "Calendly Personal Access Token", "password", ""], ["site_url", "Public booking URL", "text", "https://calendly.com/abhijeetvarghese"]],
      github: [["username", "GitHub username (public data needs no token)", "text", "Abhijeet-Varghese"], ["api_key", "Personal access token (optional, raises rate limit)", "password", ""]],
      drive: [["service_account_json", "Service account JSON (Drive read, approved folder)", "textarea", ""], ["folder_id", "Approved folder ID", "text", ""]],
      notion: [["api_key", "Notion integration token", "password", ""], ["approved_page_ids", "Approved page IDs (comma-separated)", "text", ""]],
      youtube: [["handle", "Channel handle", "text", "@AbhijeetVarghese"]],
      trends: [["geo", "Region code for trending searches", "text", "IN"]],
      whatsapp: [["phone_number_id", "Cloud API phone number ID (optional)", "password", ""], ["api_key", "Meta token (optional)", "password", ""]],
      gtm: [["container_id", "GTM container ID", "text", "GTM-MB7FNGJ"]]
    };
    const fs = fields[code] || [];
    const body = fs.map(f => {
      const cur = (i.configuration && i.configuration[f[0]]) || (f[3] || "");
      if (f[2] === "textarea") return `<div class="field"><label>${esc(f[1])}</label><textarea class="f-${f[0]}" rows="5" placeholder="${esc(cur)}" style="font-family:monospace;font-size:11.5px"></textarea></div>`;
      return `<div class="field"><label>${esc(f[1])}</label><input type="${f[2]}" class="f-${f[0]}" value="${esc(cur)}" autocomplete="off"></div>`;
    }).join("");
    const m = modal({
      title: `Configure — ${esc(i.name)}`,
      body: `<div style="font-size:11.5px;color:var(--ink-4);margin-bottom:12px">${esc(i.status_label)} · free tier: ${esc(i.free_tier)} · secrets are encrypted at rest and never exposed.</div>${body}`,
      actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button><button class="btn btn--soft" data-t>Save + Test connection</button>`
    });
    $("[data-c]", m.el).addEventListener("click", m.close);
    const save = async (test) => {
      const payload = {};
      fs.forEach(f => { const v = $(".f-" + f[0], m.el).value.trim(); if (v !== "") payload[f[0]] = v; });
      const r = await api.send("/api/integrations/" + code, "PUT", payload);
      if (!r.ok) { toast("Save failed", "error"); return; }
      toast("Configuration saved (secrets encrypted)");
      if (test) {
        const t = await api.send("/api/integrations/" + code + "/test", "POST", {});
        toast(t.ok && t.data && t.data.ok ? "Connection verified ✓" : (t.data && t.data.error) || "Test failed", t.ok && t.data && t.data.ok ? "ok" : "error");
      }
      m.close(); reload();
    };
    $("[data-s]", m.el).addEventListener("click", () => save(false));
    $("[data-t]", m.el).addEventListener("click", () => save(true));
  };

  /* ============================================================
     RESEARCH — RSS engine + trends
     ============================================================ */
  R.register("research", () => `
    <div class="view__head">
      <div><h1 class="view__title">Research Engine</h1>
      <p class="view__desc">Curated RSS/Atom feeds (free, open standard) + Google Trends. Research only — feed content is never republished verbatim.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button>
        <button class="btn btn--primary" data-fetch>${icon("play")} Fetch all sources</button>
      </div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Sources</p><button class="btn btn--sm btn--soft" data-add-src>${icon("plus", 12)} Add source</button></div>
        <div class="card__body" id="srcList"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Fresh items</p><span class="chip chip--muted">last 30 days</span></div>
        <div class="card__body" id="itemList" style="max-height:560px;overflow-y:auto"></div>
      </div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Google Trends — India</p><span class="chip chip--accent">RSS · no key</span></div>
      <div class="card__body" id="trendList"></div>
    </div>`);

  R.after("research", view => {
    const load = async () => {
      const s = await api.get("/api/research/sources");
      if (s.ok) $("#srcList", view).innerHTML = (s.data.items || []).map(x => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
          <span class="chip ${x.enabled ? "chip--ok" : "chip--muted"}" style="font-size:9px">${x.enabled ? "ON" : "OFF"}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12.5px;font-weight:600">${esc(x.name)}</div>
            <div style="font-size:10.5px;color:var(--ink-4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.rss_url)} · ${esc(x.topic)} · fetched ${fmtAgo(x.last_fetched)}</div>
            ${x.last_error ? `<div style="font-size:10.5px;color:var(--err)">⚠ ${esc(x.last_error.slice(0, 80))}</div>` : ""}
          </div>
          <div style="display:flex;gap:4px">
            <span class="chip chip--muted" style="font-size:9px">a${x.authority}</span>
            <button class="btn btn--sm btn--ghost" data-edit="${x.id}">${icon("settings", 11)}</button>
            <button class="btn btn--sm btn--ghost" data-del="${x.id}">${icon("x", 11)}</button>
          </div>
        </div>`).join("");
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => srcModal(parseInt(b.dataset.edit), load)));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", async () => {
        if (!confirmDlg("Delete this research source?")) return;
        const r = await api.send("/api/research/sources/" + b.dataset.del, "DELETE", {});
        if (r.ok) { toast("Source deleted"); load(); }
      }));
      const it = await api.get("/api/research/items?limit=40");
      if (it.ok) $("#itemList", view).innerHTML = (it.data.items || []).map(x => `
        <div style="padding:6px 0;border-bottom:1px solid var(--line)">
          <a href="${esc(x.url || "#")}" target="_blank" rel="noopener" style="font-size:12.5px;font-weight:600;color:var(--accent)">${esc(x.title)}</a>
          <div style="font-size:10.5px;color:var(--ink-4)">${esc(x.source_name || "")} · ${x.published_at ? fmtAgo(x.published_at) : ""}</div>
          <div style="font-size:11px;color:var(--ink-3);margin-top:2px">${esc(String(x.summary || "").slice(0, 140))}</div>
        </div>`).join("") || `<div style="color:var(--ink-4);padding:10px 0;font-size:12px">No items yet — run "Fetch all sources".</div>`;
      const t = await api.get("/api/trends");
      if (t.ok) $("#trendList", view).innerHTML = (t.data.items || []).slice(0, 12).map(x => `
        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);font-size:12px">
          <span style="color:var(--warn)">▲</span><b style="flex:1">${esc(x.title)}</b><span style="color:var(--ink-4);font-size:10.5px">${x.published_at ? fmtAgo(x.published_at) : ""}</span>
        </div>`).join("");
    };
    const srcModal = (id, reload) => {
      const m = modal({
        title: id ? "Edit source" : "Add RSS source",
        body: `<div class="field"><label>Name</label><input class="f-name" placeholder="UX Collective"></div>
               <div class="field" style="margin-top:8px"><label>RSS/Atom URL</label><input class="f-url" placeholder="https://example.com/feed.xml"></div>
               <div class="field" style="margin-top:8px"><label>Topic</label><input class="f-topic" placeholder="experience design / AI / XR…"></div>
               <div class="grid grid-2" style="gap:8px;margin-top:8px">
                 <div class="field"><label>Priority</label><select class="f-prio"><option>medium</option><option>high</option><option>low</option></select></div>
                 <div class="field"><label>Authority (0-100)</label><input class="f-auth" type="number" value="70"></div>
               </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await api.send(id ? "/api/research/sources/" + id : "/api/research/sources", id ? "PUT" : "POST", {
          name: $(".f-name", m.el).value.trim(), rss_url: $(".f-url", m.el).value.trim(),
          topic: $(".f-topic", m.el).value.trim(), priority: $(".f-prio", m.el).value, authority: $(".f-auth", m.el).value
        });
        if (r.ok) { toast("Source saved"); m.close(); reload(); } else toast((r.error && r.error.message) || "Save failed", "error");
      });
    };
    $("[data-add-src]", view).addEventListener("click", () => srcModal(0, load));
    $("[data-fetch]", view).addEventListener("click", async () => {
      toast("Fetching all feeds (real network)…", "accent");
      const r = await api.send("/api/research/fetch", "POST", {});
      if (r.ok) toast(`Fetched ${r.data.imported || 0} new item(s)`, r.data.errors && r.data.errors.length ? "error" : "ok");
      load();
    });
    $("[data-refresh]", view).addEventListener("click", load);
    load();
  });

  /* ============================================================
     KNOWLEDGE GRAPH + TRUTH LAYER + CASE-STUDY + POSITIONING
     ============================================================ */
  R.register("knowledgegraph", () => `
    <div class="view__head">
      <div><h1 class="view__title">Knowledge Graph & Truth</h1>
      <p class="view__desc">Shared context for every agent. The truth layer classifies every claim as verified / unverified / inferred / opinion / external / deprecated — nothing unsupported ever reaches the public site.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button>
        <button class="btn btn--soft" data-build>${icon("layers", 13)} Rebuild from content</button>
      </div>
    </div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:24px;font-weight:700" id="kgNodes">—</div><div style="font-size:11px;color:var(--ink-4)">graph nodes</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:24px;font-weight:700;color:var(--ok)" id="kgFacts">—</div><div style="font-size:11px;color:var(--ink-4)">verified facts</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:24px;font-weight:700" id="kgCaseAvg">—</div><div style="font-size:11px;color:var(--ink-4)">case-study completeness avg</div></div></div>
      <div class="card"><div class="card__body" style="text-align:center"><div style="font-size:24px;font-weight:700" id="kgPos">—</div><div style="font-size:11px;color:var(--ink-4)">positioning health</div></div></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Truth layer — facts</p><button class="btn btn--sm btn--soft" data-add-fact>${icon("plus", 12)} Add fact</button></div>
      <div class="card__body" id="factList" style="max-height:340px;overflow-y:auto"></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Knowledge graph</p><span class="chip chip--muted">person → client → project → technology</span></div>
        <div class="card__body" id="kgList" style="max-height:360px;overflow-y:auto"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Case study completeness</p><button class="btn btn--sm btn--ghost" data-rescore>${icon("refresh", 12)} rescore</button></div>
        <div class="card__body" id="caseList" style="max-height:360px;overflow-y:auto"></div>
      </div>
    </div>`);

  R.after("knowledgegraph", view => {
    const load = async () => {
      const g = await api.get("/api/knowledge-graph");
      if (g.ok) {
        const nodes = g.data.nodes || [], edges = g.data.edges || [];
        $("#kgNodes", view).textContent = nodes.length;
        const byType = {};
        nodes.forEach(n => { byType[n.entity_type] = (byType[n.entity_type] || 0) + 1; });
        $("#kgList", view).innerHTML =
          `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${Object.entries(byType).map(([t, n]) => `<span class="chip chip--accent" style="font-size:10px">${esc(t)} ×${n}</span>`).join("")}</div>` +
          edges.slice(0, 60).map(e => `
            <div style="font-size:11.5px;padding:4px 0;border-bottom:1px solid var(--line)">
              <b>${esc(e.from_type)}</b> <span style="color:var(--ink-4)">${esc(e.from_id)}</span>
              <span style="color:var(--accent)">→ ${esc(e.relation)} →</span>
              <b>${esc(e.to_type)}</b> <span style="color:var(--ink-4)">${esc(e.to_id)}</span>
              ${e.verified ? `<span class="chip chip--ok" style="font-size:9px">verified</span>` : ""}
            </div>`).join("") || `<div style="color:var(--ink-4);font-size:12px">Run "Rebuild from content" to build the graph from real site data.</div>`;
      }
      const f = await api.get("/api/facts");
      if (f.ok) {
        const facts = f.data.items || [];
        $("#kgFacts", view).textContent = facts.filter(x => x.status === "verified").length;
        $("#factList", view).innerHTML = facts.slice(0, 40).map(x => `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)">
            <span class="chip ${x.status === "verified" ? "chip--ok" : x.status === "deprecated" ? "chip--err" : "chip--warn"}" style="font-size:9px;margin-top:2px">${esc(x.status)}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px">${esc(x.claim)}</div>
              <div style="font-size:10.5px;color:var(--ink-4)">${esc(x.source || "")} · conf ${x.confidence} · by ${esc(x.created_by || "")}</div>
            </div>
            <select class="select" data-fact-status="${x.id}" style="min-height:26px;font-size:11px;width:120px">
              ${["verified","unverified","inferred","opinion","external","deprecated"].map(s => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
            <button class="btn btn--sm btn--ghost" data-fact-del="${x.id}">${icon("x", 11)}</button>
          </div>`).join("");
        $$("[data-fact-status]", view).forEach(s => s.addEventListener("change", async () => {
          const r = await api.send("/api/facts/" + s.dataset.factStatus + "/status", "PUT", { status: s.value });
          if (r.ok) { toast("Fact status updated"); load(); }
        }));
        $$("[data-fact-del]", view).forEach(b => b.addEventListener("click", async () => {
          const r = await api.send("/api/facts/" + b.dataset.factDel, "DELETE", {});
          if (r.ok) { toast("Fact removed"); load(); }
        }));
      }
      const c = await api.get("/api/case-studies/intel");
      if (c.ok) {
        const items = c.data.items || [];
        $("#kgCaseAvg", view).textContent = (c.data.average ?? 0) + "/100";
        $("#caseList", view).innerHTML = items.map(x => `
          <div style="padding:6px 0;border-bottom:1px solid var(--line)">
            <div style="display:flex;align-items:center;gap:8px">
              <b style="flex:1;font-size:12.5px">${esc(x.project_title)}</b>
              <span class="chip ${x.score >= 80 ? "chip--ok" : x.score >= 60 ? "chip--accent" : "chip--warn"}" style="font-size:10px">${x.score}/100</span>
            </div>
            <div style="font-size:10.5px;color:var(--ink-4);margin-top:2px">
              ${x.missing && x.missing.length ? `Missing: <b style="color:var(--warn)">${esc((typeof x.missing === "string" ? JSON.parse(x.missing) : x.missing).join(", "))}</b>` : "Complete — all dimensions covered"}
            </div>
          </div>`).join("") || `<div style="color:var(--ink-4);font-size:12px">No projects scored yet.</div>`;
      }
      const p = await api.get("/api/positioning");
      if (p.ok) {
        $("#kgPos", view).textContent = (p.data.score ?? 0) + "/100";
        $("#kgPos", view).style.color = (p.data.score ?? 0) >= 70 ? "var(--ok)" : "var(--warn)";
      }
    };
    $("[data-refresh]", view).addEventListener("click", load);
    $("[data-build]", view).addEventListener("click", async () => {
      const r = await api.send("/api/knowledge-graph/build", "POST", {});
      if (r.ok) toast(`Graph rebuilt (${r.data.nodes} nodes, ${r.data.facts_seeded} facts seeded)`);
      load();
    });
    $("[data-rescore]", view).addEventListener("click", async () => {
      const r = await api.send("/api/case-studies/intel", "POST", {});
      if (r.ok) { toast(`Scored ${r.data.scored} project(s)`); load(); }
    });
    $("[data-add-fact]", view).addEventListener("click", () => {
      const m = modal({
        title: "Add fact to the truth layer",
        body: `<div class="field"><label>Claim</label><input class="f-claim" placeholder="e.g. Led the Orange Business experience centre engagement"></div>
               <div class="grid grid-2" style="gap:8px;margin-top:8px">
                 <div class="field"><label>Status</label><select class="f-status"><option>verified</option><option>unverified</option><option>inferred</option><option>opinion</option><option>external</option><option>deprecated</option></select></div>
                 <div class="field"><label>Confidence (0-100)</label><input class="f-conf" type="number" value="80"></div>
               </div>
               <div class="field" style="margin-top:8px"><label>Evidence / source</label><input class="f-src" placeholder="project record, site page, client document…"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save fact</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await api.send("/api/facts", "POST", {
          claim: $(".f-claim", m.el).value.trim(), status: $(".f-status", m.el).value,
          confidence: parseInt($(".f-conf", m.el).value || "50"), source: $(".f-src", m.el).value.trim()
        });
        if (r.ok) { toast("Fact added to the truth layer"); m.close(); load(); } else toast("Save failed", "error");
      });
    });
    load();
  });

  /* ============================================================
     SOCIAL HUB — profiles + trackable links (UTM / WhatsApp)
     ============================================================ */
  R.register("socialhub", () => `
    <div class="view__head">
      <div><h1 class="view__title">Social & Tracking</h1>
      <p class="view__desc">Profile registry with honest API reality checks (most platforms need manual publish). Trackable links: UTM generator + WhatsApp click-to-chat with attribution.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button>
        <button class="btn btn--soft" data-social-sync>${icon("play", 13)} Sync public sources</button>
      </div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Social profiles</p><span class="chip chip--muted">API reality-checked</span></div>
        <div class="card__body" id="profList"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Trackable links</p><button class="btn btn--sm btn--soft" data-add-link>${icon("plus", 12)} New link</button></div>
        <div class="card__body" id="linkList" style="max-height:480px;overflow-y:auto"></div>
      </div>
    </div>`);

  R.after("socialhub", view => {
    const load = async () => {
      const p = await api.get("/api/social/profiles");
      if (p.ok) $("#profList", view).innerHTML = (p.data.items || []).map(x => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
          <b style="width:90px;font-size:12.5px">${esc(x.platform)}</b>
          <div style="flex:1;min-width:0">
            <a href="${esc(x.profile_url)}" target="_blank" rel="noopener" style="font-size:11.5px;color:var(--accent)">${esc(x.handle || x.profile_url)}</a>
            <div style="font-size:10px;color:var(--ink-4)">API: ${esc(x.api_availability)} · ${x.last_sync ? "synced " + fmtAgo(x.last_sync) : "never synced"}</div>
          </div>
          <span class="chip ${x.connected ? "chip--ok" : "chip--muted"}" style="font-size:9px">${x.connected ? "verified" : "manual"}</span>
          <button class="btn btn--sm btn--ghost" data-edit-prof="${esc(x.platform)}">${icon("settings", 11)}</button>
        </div>`).join("");
      $$("[data-edit-prof]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: "Edit profile — " + esc(b.dataset.editProf),
          body: `<div class="field"><label>Profile URL</label><input class="f-url" placeholder="https://…"></div>
                 <div class="field" style="margin-top:8px"><label>Handle</label><input class="f-handle"></div>
                 <div class="field" style="margin-top:8px"><label>API availability</label><select class="f-av"><option>available</option><option>limited</option><option>manual</option><option>none</option></select></div>
                 <div class="field" style="margin-top:8px"><label>Notes</label><input class="f-notes"></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await api.send("/api/social/profiles/" + b.dataset.editProf, "PUT", {
            profile_url: $(".f-url", m.el).value.trim(), handle: $(".f-handle", m.el).value.trim(),
            api_availability: $(".f-av", m.el).value, notes: $(".f-notes", m.el).value.trim()
          });
          if (r.ok) { toast("Profile saved"); m.close(); load(); }
        });
      }));
      const l = await api.get("/api/links");
      if (l.ok) $("#linkList", view).innerHTML = (l.data.items || []).map(x => `
        <div style="padding:7px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="chip ${x.kind === "whatsapp" ? "chip--accent" : "chip--muted"}" style="font-size:9px">${x.kind}</span>
            <b style="flex:1;font-size:12.5px">${esc(x.name)}</b>
            <span class="chip chip--muted" style="font-size:9px">${x.clicks || 0} clicks</span>
            <button class="btn btn--sm btn--ghost" data-copy="${esc(x.url)}" title="Copy link">${icon("copy", 11)}</button>
            <button class="btn btn--sm btn--ghost" data-clicks="${x.id}">${icon("chart", 11)}</button>
            <button class="btn btn--sm btn--ghost" data-del-link="${x.id}">${icon("x", 11)}</button>
          </div>
          <div style="font-size:10.5px;color:var(--ink-4);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.url)}</div>
          <div style="font-size:10px;color:var(--ink-4)">${x.kind === "whatsapp" ? `wa.me/${esc(x.phone)} · ${esc(x.campaign || "")}` : `src=${esc(x.source || "")} · med=${esc(x.medium || "")} · cmp=${esc(x.campaign || "")}`}</div>
        </div>`).join("");
      $$("[data-copy]", view).forEach(b => b.addEventListener("click", () => {
        navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy);
        toast("Link copied");
      }));
      $$("[data-clicks]", view).forEach(b => b.addEventListener("click", async () => {
        const r = await api.get("/api/links/" + b.dataset.clicks + "/clicks");
        if (!r.ok) return;
        const c = r.data.clicks || [];
        const m = modal({
          title: "Click log — " + esc(r.data.link.name),
          body: `<div style="font-size:11px;color:var(--ink-4);margin-bottom:8px">Total clicks: <b>${r.data.link.clicks || 0}</b></div>` +
            (c.map(x => `<div style="font-size:11px;padding:4px 0;border-bottom:1px solid var(--line)">${fmtAgo(x.created_at)} · ref: ${esc(x.referrer || "—")} · page: ${esc(x.page || "—")}${x.lead_id ? ` · <b>lead #${x.lead_id}</b>` : ""}</div>`).join("") || `<div style="color:var(--ink-4);font-size:11px">No clicks recorded yet.</div>`),
          actions: `<button class="btn btn--ghost" data-c>Close</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
      }));
      $$("[data-del-link]", view).forEach(b => b.addEventListener("click", async () => {
        const r = await api.send("/api/links/" + b.dataset.delLink, "DELETE", {});
        if (r.ok) { toast("Link deleted"); load(); }
      }));
    };
    $("[data-add-link]", view).addEventListener("click", () => {
      const m = modal({
        title: "New trackable link",
        body: `<div class="field"><label>Kind</label><select class="f-kind"><option value="utm">UTM link</option><option value="whatsapp">WhatsApp click-to-chat</option></select></div>
               <div class="field" style="margin-top:8px"><label>Name</label><input class="f-name" placeholder="LinkedIn post → contact"></div>
               <div class="utm-fields">
                 <div class="field" style="margin-top:8px"><label>Target URL</label><input class="f-target" placeholder="https://abhijeetvarghese.com/contact.html"></div>
                 <div class="grid grid-2" style="gap:8px;margin-top:8px">
                   <div class="field"><label>Source</label><input class="f-source" placeholder="linkedin"></div>
                   <div class="field"><label>Medium</label><input class="f-medium" placeholder="social"></div>
                 </div>
                 <div class="grid grid-2" style="gap:8px;margin-top:8px">
                   <div class="field"><label>Campaign</label><input class="f-campaign" placeholder="case-study-launch"></div>
                   <div class="field"><label>Content</label><input class="f-content" placeholder="orange-business"></div>
                 </div>
               </div>
               <div class="wa-fields" style="display:none">
                 <div class="field" style="margin-top:8px"><label>Phone (with country code)</label><input class="f-phone" placeholder="+919876543210"></div>
                 <div class="field" style="margin-top:8px"><label>Pre-filled message</label><input class="f-message" placeholder="Hi Abhijeet, I found you via…"></div>
                 <div class="field" style="margin-top:8px"><label>Campaign (attribution)</label><input class="f-campaign2" placeholder="instagram"></div>
               </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      const kindEl = $(".f-kind", m.el);
      const toggle = () => {
        const wa = kindEl.value === "whatsapp";
        $(".utm-fields", m.el).style.display = wa ? "none" : "";
        $(".wa-fields", m.el).style.display = wa ? "" : "none";
      };
      kindEl.addEventListener("change", toggle);
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const wa = kindEl.value === "whatsapp";
        const body = wa ? {
          kind: "whatsapp", name: $(".f-name", m.el).value.trim(), phone: $(".f-phone", m.el).value.trim(),
          message: $(".f-message", m.el).value.trim(), campaign: $(".f-campaign2", m.el).value.trim()
        } : {
          kind: "utm", name: $(".f-name", m.el).value.trim(), target_url: $(".f-target", m.el).value.trim(),
          source: $(".f-source", m.el).value.trim(), medium: $(".f-medium", m.el).value.trim(),
          campaign: $(".f-campaign", m.el).value.trim(), content: $(".f-content", m.el).value.trim()
        };
        const r = await api.send("/api/links", "POST", body);
        if (r.ok) { toast("Link created — copy it from the list"); m.close(); load(); }
        else toast((r.error && r.error.message) || "Create failed", "error");
      });
    });
    $("[data-social-sync]", view).addEventListener("click", async () => {
      toast("Syncing public sources (YouTube RSS, WhatsApp links)…", "accent");
      const r = await api.send("/api/social/sync", "POST", {});
      if (r.ok) {
        const parts = Object.entries(r.data || {}).map(([k, v]) => `${k}: ${v.ok ? "ok" : v.error || "failed"}`).join(" · ");
        toast(parts || "done"); load();
      }
    });
    $("[data-refresh]", view).addEventListener("click", load);
    load();
  });
})();
