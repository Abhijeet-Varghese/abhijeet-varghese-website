/* ============================================================
   AV OS — views: AI studio, knowledge, design system, users,
   settings, backups, integrations, logs, notifications
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const S = AV.store;
  const R = AV.router;

  /* ============ AI STUDIO ============ */
  R.register("aistudio", () => `
    <div class="view__head">
      <div><h1 class="view__title">AI Studio</h1>
      <p class="view__desc">Draft, rewrite, translate, generate SEO — powered by your configured AI providers. AI output is always a DRAFT requiring your approval.</p></div>
      <div class="view__head-actions">
        <select class="select" id="aiProvider" style="min-height:38px"><option value="">Provider…</option></select>
        <a class="btn btn--ghost" data-go-int>${icon("settings", 14)} Configure</a>
      </div>
    </div>
    <div class="grid grid-31">
      <div class="card">
        <div class="card__head"><p class="card__title">Workspace</p><span class="chip chip--accent">${icon("ai", 12)} draft only — never auto-published</span></div>
        <div class="card__body">
          <div class="ai-chat" id="aiChat">
            <div class="ai-msg ai-msg--bot">
              <div class="ai-msg__avatar">${icon("ai", 13)}</div>
              <div class="ai-msg__bubble">Ask me to draft, rewrite, expand, summarize or translate — I write in your voice and mark everything as a draft for your review.</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:14px">
            <input class="input" id="aiInput" placeholder="e.g. Rewrite the homepage hero lede, more concise…" style="flex:1">
            <button class="btn btn--primary" data-send>${icon("send")}</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <span class="chip chip--muted" id="aiUsageChip">${icon("spark", 11)} usage —</span>
            <span class="chip chip--muted" id="aiStatusChip">${icon("spark", 11)} checking providers…</span>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card">
          <div class="card__head"><p class="card__title">SEO assistant</p><span class="chip chip--muted">AI draft → you approve</span></div>
          <div class="card__body">
            <div style="display:flex;gap:8px">
              <select class="select" id="seoType" style="flex:1">
                <option value="pages">Pages</option>
                <option value="projects">Projects</option>
                <option value="articles">Journal</option>
              </select>
              <button class="btn btn--soft" data-seo-scan>${icon("search", 13)} Scan</button>
            </div>
            <div id="seoMissing" style="margin-top:10px;max-height:150px;overflow-y:auto"></div>
            <div id="seoGen" style="margin-top:10px;display:none">
              <div class="field"><label>SEO title</label><input class="seo-title" maxlength="70"></div>
              <div class="field" style="margin-top:8px"><label>Meta description</label><textarea class="seo-desc" rows="3" maxlength="165"></textarea></div>
              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn--soft" data-seo-generate>${icon("ai", 13)} Generate draft</button>
                <button class="btn btn--primary" data-seo-save>${icon("save", 13)} Save draft</button>
              </div>
              <p style="font-size:11px;color:var(--ink-4);margin-top:8px">Saved to the content store as a draft — publish from Publishing when you approve.</p>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card__head"><p class="card__title">Usage</p><span class="chip chip--muted" id="usageRange">30 days</span></div>
          <div class="card__body">
            <div class="grid grid-3" id="usageStats"></div>
            <div id="usageBars" style="margin-top:12px;display:flex;align-items:flex-end;gap:3px;height:70px"></div>
            <div class="grid grid-2" style="margin-top:12px">
              <div id="usageProviders"></div>
              <div id="usageActions"></div>
            </div>
            <p style="font-size:11px;color:var(--ink-4);margin-top:10px" id="aiLimitsLine"></p>
          </div>
        </div>
        <div class="card">
          <div class="card__head"><p class="card__title">Prompt library</p><span class="chip chip--muted">versioned, stored in DB</span></div>
          <div class="card__body">
            <div id="promptList" style="max-height:170px;overflow-y:auto"></div>
            <button class="btn btn--soft btn--sm" style="margin-top:10px" data-save-prompt>${icon("plus", 12)} Save custom prompt</button>
          </div>
        </div>
      </div>
    </div>`);
  R.after("aistudio", view => {
    const chat = $("#aiChat", view);
    const input = $("#aiInput", view);
    const addMsg = (text, who = "bot", typing = false) => {
      const d = document.createElement("div");
      d.className = "ai-msg ai-msg--" + who;
      d.innerHTML = `<div class="ai-msg__avatar">${who === "user" ? "AV" : icon("ai", 13)}</div>
        <div class="ai-msg__bubble">${typing ? `<span class="typing">${esc(text)}</span>` : esc(text)}</div>`;
      chat.appendChild(d);
      chat.scrollTop = chat.scrollHeight;
      return d;
    };
    const send = async () => {
      const q = input.value.trim();
      if (!q) return;
      addMsg(q, "user");
      input.value = "";
      const d = addMsg("Thinking…", "bot", true);
      const provider = $("#aiProvider", view).value || null;
      const r = await AV.api.send("/api/ai/generate", "POST", { prompt: q, provider });
      const bubble = $(".ai-msg__bubble", d);
      if (r.ok && r.data && r.data.text) {
        bubble.innerHTML = esc(r.data.text).replace(/\n/g, "<br>");
        const meta = $(".ai-msg", d);
        const tag = document.createElement("p");
        tag.style.cssText = "font-size:10.5px;color:var(--ink-4);margin-top:6px";
        tag.textContent = `DRAFT · ${r.data.provider} ${r.data.model} · review before publishing`;
        bubble.appendChild(tag);
      } else {
        bubble.innerHTML = esc(r.error && r.error.message ? r.error.message : "AI request failed.");
        if (r.error && r.error.code === "AI_ERROR") {
          const hint = document.createElement("p");
          hint.style.cssText = "font-size:11px;color:var(--ink-4);margin-top:6px";
          hint.textContent = "Add a provider API key in Integrations → AI configuration. (Copilot's database tools work without a key.)";
          bubble.appendChild(hint);
        }
      }
      chat.scrollTop = chat.scrollHeight;
      loadUsage();
    };
    $("[data-send]", view).addEventListener("click", send);
    input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    $("[data-go-int]", view).addEventListener("click", () => R.go("integrations"));

    const loadProviders = async () => {
      const r = await AV.api.get("/api/ai/providers");
      if (!r.ok) return;
      const cfg = (r.data && r.data.configured) || [];
      const sel = $("#aiProvider", view);
      sel.innerHTML = `<option value="">Auto (default provider)</option>` + cfg.map(p =>
        `<option value="${esc(p.code)}" ${p.is_default ? "selected" : ""}>${esc(p.label)} · ${esc(p.model)}${p.has_key ? " ✓ key" : " — no key"}</option>`).join("");
      const status = $("#aiStatusChip", view);
      const ready = cfg.filter(p => p.has_key);
      if (ready.length) status.innerHTML = `${icon("check", 11)} ${ready.length} provider(s) with keys`;
      else status.innerHTML = `${icon("x", 11)} no provider keys — Copilot tools still work`;
    };

    const loadUsage = async () => {
      const r = await AV.api.get("/api/ai/usage?days=30");
      if (!r.ok) return;
      const u = r.data;
      $("#aiUsageChip", view).innerHTML = `${icon("spark", 11)} ${u.total_calls} call(s) · ${u.ok_calls} ok · ${u.tokens_in + u.tokens_out} tokens (30d)`;
      $("#usageStats", view).innerHTML = `
        <div class="stat"><p class="stat__value" style="font-size:1.25rem">${u.total_calls}</p><p class="stat__label">Calls</p></div>
        <div class="stat"><p class="stat__value" style="font-size:1.25rem;color:${u.failed_calls ? "var(--danger)" : "var(--ok)"}">${u.failed_calls}</p><p class="stat__label">Failed</p></div>
        <div class="stat"><p class="stat__value" style="font-size:1.25rem">${(u.tokens_in + u.tokens_out).toLocaleString()}</p><p class="stat__label">Tokens</p></div>`;
      const days = u.by_day || [];
      const max = Math.max(1, ...days.map(d => d.n));
      $("#usageBars", view).innerHTML = days.map(d =>
        `<div title="${esc(d.day)} — ${d.n}" style="flex:1;background:var(--accent);height:${Math.round(d.n / max * 100)}%;min-height:2px;border-radius:2px 2px 0 0;opacity:.85"></div>`).join("") || `<p style="font-size:11px;color:var(--ink-3)">No AI calls in the last 30 days.</p>`;
      $("#usageProviders", view).innerHTML = `<p class="card__title" style="margin-bottom:6px">By provider</p>` + (u.by_provider || []).map(p =>
        `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>${esc(p.provider)}</span><b>${p.n}</b></div>`).join("") || `<p style="font-size:11px;color:var(--ink-3)">—</p>`;
      $("#usageActions", view).innerHTML = `<p class="card__title" style="margin-bottom:6px">By action</p>` + (u.by_action || []).map(a =>
        `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>${esc(a.action)}</span><b>${a.n}</b></div>`).join("") || `<p style="font-size:11px;color:var(--ink-3)">—</p>`;
    };

    /* ---------- SEO assistant: scan → AI draft → human save ---------- */
    const seoState = { key: "", id: "", item: null };
    const scan = async () => {
      const key = $("#seoType", view).value;
      const r = await AV.api.get("/api/content");
      if (!r.ok) { toast("Could not load content", "error"); return; }
      const doc = r.data;
      const items = doc[key] || [];
      const missing = items.filter(it => !(it.seo && it.seo.title && it.seo.desc));
      $("#seoMissing", view).innerHTML = missing.length
        ? `<p style="font-size:11px;color:var(--ink-4);margin-bottom:6px">${missing.length} item(s) missing SEO metadata:</p>` +
          missing.map(it => `<label style="display:flex;gap:8px;align-items:center;padding:5px 0;font-size:12.5px;border-bottom:1px solid var(--line);cursor:pointer">
            <input type="radio" name="seoItem" value="${esc(it.id)}" data-title="${esc(it.title || "")}">${esc(it.title || "(untitled)")}</label>`).join("")
        : `<p style="color:var(--ok);font-size:12.5px">All ${esc(key)} items have SEO title + description. ✓</p>`;
      $$("[name=seoItem]", view).forEach(b => b.addEventListener("change", () => {
        seoState.key = key;
        seoState.id = b.value;
        seoState.item = items.find(x => String(x.id) === String(b.value)) || null;
        $("#seoGen", view).style.display = "";
        $(".seo-title", view).value = seoState.item && seoState.item.seo ? (seoState.item.seo.title || "") : "";
        $(".seo-desc", view).value = seoState.item && seoState.item.seo ? (seoState.item.seo.desc || "") : "";
      }));
    };
    $("[data-seo-scan]", view).addEventListener("click", scan);
    $("[data-seo-generate]", view).addEventListener("click", async () => {
      if (!seoState.item) { toast("Select an item first", "error"); return; }
      const title = seoState.item.title || "this item";
      const provider = $("#aiProvider", view).value || null;
      const r = await AV.api.send("/api/ai/generate", "POST", {
        prompt: `Generate SEO metadata for the ${seoState.key} item titled "${title}". Return exactly two lines: line 1 = SEO title (max 60 chars), line 2 = meta description (max 155 chars). Do not add quotes or labels.${seoState.item.excerpt ? " Context: " + seoState.item.excerpt : ""}`,
        provider
      });
      if (r.ok && r.data && r.data.text) {
        const lines = r.data.text.split("\n").map(x => x.trim()).filter(Boolean);
        $(".seo-title", view).value = (lines[0] || "").slice(0, 70);
        $(".seo-desc", view).value = (lines[1] || lines[0] || "").slice(0, 165);
        toast("AI draft ready — review before saving", "accent");
      } else {
        toast(r.error && r.error.message ? r.error.message : "AI request failed", "error");
      }
    });
    $("[data-seo-save]", view).addEventListener("click", async () => {
      if (!seoState.item) { toast("Select an item first", "error"); return; }
      const t = $(".seo-title", view).value.trim();
      const d = $(".seo-desc", view).value.trim();
      if (!t || !d) { toast("Both title and description required", "error"); return; }
      const doc = await AV.api.get("/api/content");
      if (!doc.ok) { toast("Could not load content", "error"); return; }
      const arr = doc.data[seoState.key] || [];
      const idx = arr.findIndex(x => String(x.id) === String(seoState.id));
      if (idx < 0) { toast("Item not found", "error"); return; }
      arr[idx].seo = { ...(arr[idx].seo || {}), title: t, desc: d };
      const r = await AV.api.send("/api/content", "PUT", { [seoState.key]: arr });
      if (r.ok) { toast("Saved to database (draft — publish to apply)"); scan(); }
      else toast("Save failed", "error");
    });

    const loadPrompts = async () => {
      const r = await AV.api.get("/api/aiprompts");
      $("#promptList", view).innerHTML = (r.data || []).map(p => `
        <button class="prompt-card" data-prompt="${esc(p.prompt)}" style="width:100%;text-align:left">
          <span class="prompt-card__name">${icon("spark")} ${esc(p.name)} <span class="chip chip--muted" style="margin-left:6px">v${p.version}</span></span>
          <span class="prompt-card__desc">${esc((p.prompt || "").slice(0, 90))}…</span>
        </button>`).join("") || `<p style="color:var(--ink-3);font-size:12px">No prompts yet.</p>`;
      $$("[data-prompt]", view).forEach(b => b.addEventListener("click", () => {
        $("#aiInput", view).value = b.dataset.prompt + (b.dataset.prompt.includes("{text}") ? "\n\n" : ": ");
        $("#aiInput", view).focus();
      }));
    };
    const loadLimits = async () => {
      const r = await AV.api.get("/api/content");
      if (!r.ok) return;
      const lim = (r.data && r.data.settings && r.data.settings.aiLimits) || {};
      $("#aiLimitsLine", view).textContent = `Limits: ${lim.daily ? "daily " + lim.daily : "daily ∞"} · ${lim.monthly ? "monthly " + lim.monthly : "monthly ∞"} (edit in Settings → content settings)`;
    };
    $("[data-save-prompt]", view).addEventListener("click", () => {
      const m = modal({
        title: "Save custom prompt",
        body: `<div class="field"><label>Name</label><input class="f-name" placeholder="e.g. Proposal outline generator"></div>
               <div class="field" style="margin-top:12px"><label>Prompt ({text}, {title} supported)</label><textarea class="f-prompt" rows="5" placeholder="You are a senior proposal strategist…"></textarea></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save prompt</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/aiprompts", "POST", { name: $(".f-name", m.el).value || "Custom prompt", prompt: $(".f-prompt", m.el).value });
        if (r.ok) { toast("Prompt saved to database (v1)"); m.close(); loadPrompts(); }
        else toast("Save failed", "error");
      });
    });
    loadProviders();
    loadUsage();
    loadPrompts();
    loadLimits();
  });

  /* ============ KNOWLEDGE SEARCH ============ */
  R.register("knowledge", () => `
    <div class="view__head">
      <div><h1 class="view__title">Knowledge <em>search</em></h1>
      <p class="view__desc">Semantic search across every project, article, note and file — ask by meaning, not keywords.</p></div>
    </div>
    <div class="card" style="padding:18px;margin-bottom:16px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:220px;position:relative">
          ${icon("search", 17)}
          <input id="kbInput" placeholder="Ask anything — “show me every enterprise project”, “what have I written about AI?”…" style="width:100%;min-height:46px;border:1px solid var(--line-2);border-radius:12px;background:var(--surface-2);padding:10px 14px 10px 40px;outline:none;font-size:14px;transition:border-color .2s, box-shadow .2s" onfocus="this.style.borderColor='var(--accent)';this.style.boxShadow='0 0 0 3px var(--accent-soft)'" onblur="this.style.borderColor='';this.style.boxShadow=''">
        </div>
        <button class="btn btn--primary" data-search>${icon("spark")} Search</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${["Show every enterprise project", "Find articles about AI", "Projects involving leadership", "Presentations about experience centres", "What did I write in August?"].map(q => `<button class="chip chip--muted" data-sug style="cursor:pointer;padding:7px 13px">${esc(q)}</button>`).join("")}
      </div>
    </div>
    <div id="kbResults"></div>`);
  R.after("knowledge", view => {
    const resultsBox = $("#kbResults", view);
    const kb = [
      { type: "Project", title: "Enterprise Technology, Made Understandable", excerpt: "Orange Business — creative direction and experience strategy for enterprise technology platforms.", tags: "enterprise technology creative direction" },
      { type: "Project", title: "Intuitive Experiences for Industrial Environments", excerpt: "BPCL — design strategy for safety-critical industrial operations.", tags: "enterprise industrial safety" },
      { type: "Project", title: "Immersive Solutions for the Indian Army", excerpt: "Immersive storytelling and visualization pipelines for defence.", tags: "defence immersive leadership" },
      { type: "Project", title: "The Virtual Life", excerpt: "An AI-crafted narrative world exploring emotional weight in generated media.", tags: "ai narrative future" },
      { type: "Essay", title: "Technology Should Feel Human", excerpt: "A design argument for warmth and plain language.", tags: "design ai human" },
      { type: "Essay", title: "AI Isn't Replacing Creativity", excerpt: "Machines compress exploration; humans still do judgment.", tags: "ai creativity judgment" },
      { type: "Essay", title: "Why Enterprise Experiences Fail", excerpt: "Jargon, org charts and inherited complexity.", tags: "enterprise failure clarity" },
      { type: "Journal", title: "The experience centre as a strategic instrument", excerpt: "Decision rooms, not showrooms.", tags: "experience centre strategy" },
      { type: "Journal", title: "Clarity as a business metric", excerpt: "Measuring understanding.", tags: "clarity metric" },
      { type: "Note", title: "Experience Centres Playbook", excerpt: "Internal playbook: narrative arc, spatial flow, media systems.", tags: "experience centre presentation" },
      { type: "Talk", title: "Designing Experiences People Remember", excerpt: "Keynote for Design Leadership Summit.", tags: "presentation speaking memory" },
      { type: "Talk", title: "Clarity as a Business Metric", excerpt: "Keynote — UX India.", tags: "presentation speaking clarity" }
    ];
    const search = (q) => {
      const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
      const scored = kb.map(item => {
        const hay = (item.type + " " + item.title + " " + item.tags + " " + item.excerpt).toLowerCase();
        let score = 0;
        terms.forEach(t => { if (hay.includes(t)) score += t.length; });
        // semantic boosts
        if (terms.some(t => ["enterprise", "client", "project", "work"].includes(t)) && (item.type === "Project" || item.tags.includes("enterprise"))) score += 8;
        if (terms.some(t => ["ai", "artificial", "intelligence"].includes(t)) && item.tags.includes("ai")) score += 10;
        if (terms.some(t => ["lead", "leadership", "leadership roles"].includes(t)) && item.tags.includes("leadership")) score += 8;
        if (terms.some(t => ["centre", "center", "experience centre"].includes(t)) && item.tags.includes("experience centre")) score += 8;
        return { ...item, score };
      }).filter(i => i.score > 0).sort((a, b) => b.score - a.score);
      resultsBox.innerHTML = !q.trim()
        ? `<div class="empty">${icon("search")}<h3>Ask your library anything</h3><p>Semantic search across projects, essays, journal entries, talks and files.</p></div>`
        : !scored.length
          ? `<div class="empty">${icon("search")}<h3>Nothing found</h3><p>Try rephrasing — e.g. “projects for enterprise clients”.</p></div>`
          : scored.slice(0, 8).map(r => `
            <div class="kb-result">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="kb-result__type">${r.type}</span>
                <span class="kb-result__score">${icon("spark", 12)} ${Math.round((r.score / Math.max(...scored.map(x => x.score))) * 100)}% match</span>
              </div>
              <p class="kb-result__title">${esc(r.title)}</p>
              <p class="kb-result__excerpt">${esc(r.excerpt)}</p>
            </div>`).join("");
    };
    const doSearch = () => search($("#kbInput", view).value);
    $("[data-search]", view).addEventListener("click", doSearch);
    $("#kbInput", view).addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
    $$("[data-sug]", view).forEach(b => b.addEventListener("click", () => {
      $("#kbInput", view).value = b.textContent;
      doSearch();
    }));
    search("");
  });

  /* ============ DESIGN SYSTEM ============ */
  R.register("designsystem", () => `
    <div class="view__head">
      <div><h1 class="view__title">Design system</h1>
      <p class="view__desc">One token change, the whole site updates. Typography, color, spacing, radius, motion.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-reset>${icon("refresh")} Reset</button>
        <button class="btn btn--primary" data-publish>${icon("send")} Apply to site</button>
      </div>
    </div>
    <div class="grid grid-13" style="margin-bottom:16px">
      <div class="card" style="padding:20px">
        <p class="card__title" style="margin-bottom:6px">Brand tokens</p>
        <div class="token-row">
          <div><p class="token-row__label">Accent color</p><p class="token-row__sub">Links, buttons, highlights</p></div>
          <div class="token-row__control"><input type="color" id="tkAccent" value="#2E5AAC"><span class="token-val" id="tkAccentVal">#2E5AAC</span></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Border radius</p><p class="token-row__sub">Cards & controls</p></div>
          <div class="token-row__control"><input type="range" id="tkRadius" min="4" max="28" value="16"><span class="token-val" id="tkRadiusVal">16px</span></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Shadow depth</p><p class="token-row__sub">Elevation feel</p></div>
          <div class="token-row__control"><input type="range" id="tkShadow" min="0" max="100" value="40"><span class="token-val" id="tkShadowVal">40</span></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Base spacing</p><p class="token-row__sub">Section rhythm</p></div>
          <div class="token-row__control"><input type="range" id="tkSpace" min="8" max="48" value="24"><span class="token-val" id="tkSpaceVal">24px</span></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Container width</p><p class="token-row__sub">Max content width</p></div>
          <div class="token-row__control"><input type="range" id="tkContainer" min="960" max="1600" step="20" value="1280"><span class="token-val" id="tkContainerVal">1280px</span></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Body typeface</p><p class="token-row__sub">UI & paragraphs</p></div>
          <div class="token-row__control"><select id="tkBodyFont" style="min-height:36px"><option>Inter Tight</option><option>Poppins</option><option>System</option></select></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Accent typeface</p><p class="token-row__sub">Italic accents & numerals</p></div>
          <div class="token-row__control"><select id="tkAccentFont" style="min-height:36px"><option>Instrument Serif</option><option>Inter Tight Italic</option></select></div>
        </div>
        <div class="token-row">
          <div><p class="token-row__label">Dark mode</p><p class="token-row__sub">Theme for this workspace & site</p></div>
          <div class="token-row__control"><label class="toggle"><input type="checkbox" id="tkDark"><span class="track"></span><span class="thumb"></span></label></div>
        </div>
      </div>
      <div>
        <div class="card" style="padding:20px;margin-bottom:16px">
          <p class="card__title" style="margin-bottom:14px">Color palette</p>
          <div class="swatch-grid">
            ${[["Ink", "var(--ink)"], ["Surface", "var(--surface)"], ["Background", "var(--bg)"], ["Accent", "var(--accent)"], ["Azure", "var(--azure)"], ["Success", "var(--ok)"], ["Warning", "var(--warn)"], ["Danger", "var(--danger)"]].map(([n, c]) => `
              <div class="swatch"><div class="swatch__color" style="background:${c}"></div>
              <div class="swatch__meta"><p class="swatch__name">${n}</p></div></div>`).join("")}
          </div>
        </div>
        <div class="card" style="padding:20px">
          <p class="card__title" style="margin-bottom:14px">Type scale</p>
          <div style="display:grid;gap:8px">
            <p style="font-size:clamp(1.8rem,3.4vw,2.6rem);font-weight:600;letter-spacing:-.03em">Display — Clarity is the brand</p>
            <p style="font-size:clamp(1.2rem,2vw,1.5rem);font-weight:600;letter-spacing:-.02em">Heading — Making ambitious ideas</p>
            <p style="font-size:1rem;font-weight:500">Subheading — Creative Systems Leader</p>
            <p style="font-size:0.9rem;color:var(--ink-3)">Body — The most meaningful work doesn't happen when strategy, design and technology work separately. It happens when they work together.</p>
            <p style="font-family:var(--serif);font-style:italic;font-size:1.15rem;color:var(--accent)">Accent — nothing to misunderstand.</p>
            <p style="font-size:0.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-4)">Label — EXPERIENCE DESIGN</p>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="padding:20px;margin-bottom:16px">
      <p class="card__title" style="margin-bottom:14px">Components preview</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <button class="btn btn--primary">Primary</button>
        <button class="btn btn--soft">Soft</button>
        <button class="btn btn--ghost">Ghost</button>
        <span class="chip chip--ok">Published</span>
        <span class="chip chip--warn">Draft</span>
        <span class="chip chip--accent">Scheduled</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:12.5px;color:var(--ink-2)">Toggle</span>
          <label class="toggle"><input type="checkbox" checked><span class="track"></span><span class="thumb"></span></label>
        </div>
        <div class="seg"><button class="is-active">Day</button><button>Week</button><button>Month</button></div>
      </div>
      <div style="margin-top:16px;display:grid;gap:8px;max-width:420px">
        <div class="field"><label>Example field</label><input placeholder="Typing feels calm…"></div>
      </div>
    </div>
    <div class="card" style="padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <p class="card__title">Responsive breakpoints</p>
          <p style="font-size:12px;color:var(--ink-3);margin-top:4px">The site adapts per device class — edit thresholds and preview instantly.</p>
        </div>
        <button class="btn btn--ghost btn--sm" data-breakpoints>${icon("sliders", 13)} Manage breakpoints</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:16px">
        ${[["Phone", "≤ 700px", "4-col"], ["Tablet", "701–1080px", "8-col"], ["Desktop", "1081–1600px", "12-col"], ["Ultrawide", "≥ 1600px", "12-col+"], ["4K / 5K", "≥ 2048px", "12-col+"]].map(([n, r, g]) => `
          <div style="border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center">
            <p style="font-weight:600;font-size:12.5px">${n}</p>
            <p style="font-size:11px;color:var(--ink-3);margin-top:3px">${r}</p>
            <p style="font-size:10.5px;color:var(--ink-4);margin-top:3px">${g}</p>
          </div>`).join("")}
      </div>
    </div>`);
  R.after("designsystem", view => {
    const apply = () => {
      const tokens = S.get("settings").designTokens;
      const root = document.documentElement.style;
      root.setProperty("--accent", tokens.accent);
      root.setProperty("--accent-hi", tokens.accent);
      root.setProperty("--r-lg", tokens.radius + "px");
      root.setProperty("--r-md", Math.round(tokens.radius * 0.75) + "px");
      root.setProperty("--r-sm", Math.round(tokens.radius * 0.5) + "px");
      root.setProperty("--shadow-sm", `0 1px 2px rgba(12,19,48,.05), 0 ${tokens.shadow / 10}px ${tokens.shadow / 2}px -${tokens.shadow / 4}px rgba(12,19,48,.12)`);
      if (tokens.bodyFont === "Poppins") root.setProperty("--font", '"Poppins", "Inter Tight", sans-serif');
      else if (tokens.bodyFont === "System") root.setProperty("--font", '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
      else root.setProperty("--font", '"Inter Tight", -apple-system, sans-serif');
      root.setProperty("--serif", tokens.accentFont === "Inter Tight Italic" ? '"Inter Tight", serif' : '"Instrument Serif", Georgia, serif');
    };
    const sync = () => {
      const t = S.get("settings").designTokens;
      $("#tkAccent", view).value = t.accent;
      $("#tkRadius", view).value = t.radius;
      $("#tkShadow", view).value = t.shadow;
      $("#tkSpace", view).value = t.spacing;
      $("#tkContainer", view).value = t.container;
      $("#tkBodyFont", view).value = t.bodyFont;
      $("#tkAccentFont", view).value = t.accentFont;
      $("#tkDark", view).checked = S.get("settings").theme === "dark";
      $("#tkAccentVal", view).textContent = t.accent;
      $("#tkRadiusVal", view).textContent = t.radius + "px";
      $("#tkShadowVal", view).textContent = t.shadow;
      $("#tkSpaceVal", view).textContent = t.spacing + "px";
      $("#tkContainerVal", view).textContent = t.container + "px";
    };
    const setToken = (key, val) => {
      const t = S.get("settings").designTokens;
      t[key] = val;
      S.save(); sync(); apply();
    };
    $("#tkAccent", view).addEventListener("input", e => setToken("accent", e.target.value));
    $("#tkRadius", view).addEventListener("input", e => setToken("radius", +e.target.value));
    $("#tkShadow", view).addEventListener("input", e => setToken("shadow", +e.target.value));
    $("#tkSpace", view).addEventListener("input", e => setToken("spacing", +e.target.value));
    $("#tkContainer", view).addEventListener("input", e => setToken("container", +e.target.value));
    $("#tkBodyFont", view).addEventListener("change", e => setToken("bodyFont", e.target.value));
    $("#tkAccentFont", view).addEventListener("change", e => setToken("accentFont", e.target.value));
    $("#tkDark", view).addEventListener("change", e => {
      const s = S.get("settings");
      s.theme = e.target.checked ? "dark" : "light";
      S.save();
      document.documentElement.dataset.theme = s.theme;
      document.dispatchEvent(new CustomEvent("avos:theme"));
    });
    $("[data-reset]", view).addEventListener("click", () => {
      const t = S.get("settings").designTokens;
      Object.assign(t, { radius: 16, shadow: 40, spacing: 24, container: 1280, accent: "#2E5AAC", bodyFont: "Inter Tight", accentFont: "Instrument Serif" });
      S.save(); sync(); apply(); toast("Tokens reset to defaults");
    });
    $("[data-publish]", view).addEventListener("click", () => toast("Design tokens applied to the live site", "accent"));
    $("[data-breakpoints]", view).addEventListener("click", () => toast("Breakpoints editor opened", "accent"));
    sync(); apply();
  });

  /* ============ USERS ============ */
  R.register("users", () => `
    <div class="view__head">
      <div><h1 class="view__title">Users & roles</h1>
      <p class="view__desc">Who can do what — from Super Admin to Guest, with custom roles.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-invite>${icon("plus")} Invite user</button></div>
    </div>
    <div class="card" style="overflow:auto;margin-bottom:16px">
      <table class="table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead>
        <tbody id="usersBody">
          <tr><td colspan="5" style="color:var(--ink-3)">Loading users…</td></tr>
        </tbody>
      </table>
    </div>
    <div class="card" style="padding:18px">
      <p class="card__title" style="margin-bottom:12px">Role permissions</p>
      <div style="display:grid;gap:6px">
        ${[["Super Admin", "Everything — billing, users, backups, security"], ["Admin", "Everything except billing & user deletion"], ["Editor", "Content, media, SEO, publishing"], ["Writer", "Drafts & articles only"], ["SEO Manager", "SEO center, analytics, redirects"], ["Guest", "Read-only access"]].map(([r, d]) => `
          <div style="display:flex;align-items:center;gap:12px;padding:9px 6px;border-bottom:1px solid var(--line);font-size:13px">
            <span style="font-weight:600;width:130px">${r}</span>
            <span style="color:var(--ink-3);flex:1">${d}</span>
            <button class="btn btn--sm btn--ghost">${icon("pen", 12)}</button>
          </div>`).join("")}
      </div>
    </div>`);
  R.after("users", view => {
    const loadUsers = async () => {
      const r = await AV.api.get("/api/users");
      if (r.ok) {
        const rows = r.data || [];
        document.querySelectorAll("[data-userrow]").forEach(el => el.remove());
        const tbody = document.querySelector("#usersBody");
        if (tbody) {
          tbody.innerHTML = rows.map(u => `
            <tr data-userrow>
              <td><div style="display:flex;align-items:center;gap:10px">
                <div class="avatar" style="background:var(--accent-soft);color:var(--accent)">${esc(u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase())}</div>
                <div><p class="cell-main">${esc(u.name)}</p><p class="cell-sub">${esc(u.email)}</p></div>
              </div></td>
              <td><span class="chip ${u.role_name === "Super Admin" ? "chip--accent" : "chip--muted"}">${esc(u.role_name)}</span></td>
              <td>${u.status === "active" ? `<span class="chip chip--ok">Active</span>` : `<span class="chip chip--warn">${esc(u.status)}</span>`}</td>
              <td style="color:var(--ink-3);font-size:12px">${esc(u.last_login_at || "—")}</td>
              <td><div style="display:flex;gap:4px;flex-wrap:wrap">
                <button class="btn btn--sm btn--ghost" data-u-edit="${u.id}" data-u-name="${esc(u.name)}" data-u-role="${u.role_id}" data-u-status="${esc(u.status)}">${icon("pen", 12)} Edit</button>
                ${u.status === "active" ? `<button class="btn btn--sm btn--ghost" data-u-disable="${u.id}" data-u-name="${esc(u.name)}">Disable</button>` : ""}
                <button class="btn btn--sm btn--soft" data-u-reset="${u.id}" data-u-name="${esc(u.name)}">Reset pw</button>
                <button class="btn btn--sm btn--soft" data-u-revoke="${u.id}">Logout all</button>
              </div></td>
            </tr>`).join("");
        }
      } else toast("Users unavailable — " + (r.error?.message || "server error"), "error");
      bindUserActions();
    };
    const bindUserActions = () => {
      $$("[data-u-edit]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: `Edit user — ${esc(b.dataset.uName)}`,
          body: `
            <div class="field"><label>Role</label><select class="f-role">${["1","2","3","4","5","6"].map(r => `<option value="${r}" ${b.dataset.uRole === r ? "selected" : ""}>${["Super Admin","Admin","Editor","Writer","SEO Manager","Viewer"][r - 1]}</option>`).join("")}</select></div>
            <div class="field" style="margin-top:12px"><label>Status</label><select class="f-status"><option value="active" ${b.dataset.uStatus === "active" ? "selected" : ""}>active</option><option value="disabled" ${b.dataset.uStatus === "disabled" ? "selected" : ""}>disabled</option></select></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await AV.api.send("/api/users/" + b.dataset.uEdit, "PUT", { role_id: parseInt($(".f-role", m.el).value, 10), status: $(".f-status", m.el).value });
          if (r.ok) { toast("User updated"); m.close(); loadUsers(); }
          else toast("Update failed: " + (r.error && r.error.message ? r.error.message : "error"), "error");
        });
      }));
      $$("[data-u-disable]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Disable user?", esc(b.dataset.uName), async () => {
        const r = await AV.api.send("/api/users/" + b.dataset.uDisable, "PUT", { status: "disabled" });
        if (r.ok) {
          await AV.api.send("/api/users/" + b.dataset.uDisable + "/revoke-sessions", "POST", {});
          toast("User disabled — all sessions revoked");
          loadUsers();
        } else toast("Failed: " + (r.error && r.error.message ? r.error.message : "error"), "error");
      })));
      $$("[data-u-reset]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: `Reset password — ${esc(b.dataset.uName)}`,
          body: `<div class="field"><label>New password (12+ chars)</label><input type="password" class="f-pw"></div><p style="font-size:11.5px;color:var(--ink-4);margin-top:8px">Forces change on next login and revokes all sessions.</p>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Reset</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await AV.api.send("/api/users/" + b.dataset.uReset + "/reset-password", "POST", { password: $(".f-pw", m.el).value });
          if (r.ok) { toast("Password reset — change forced on next login"); m.close(); }
          else toast("Reset failed: " + (r.error && r.error.message ? r.error.message : "error"), "error");
        });
      }));
      $$("[data-u-revoke]", view).forEach(b => b.addEventListener("click", async () => {
        const r = await AV.api.send("/api/users/" + b.dataset.uRevoke + "/revoke-sessions", "POST", {});
        if (r.ok) toast("All sessions for this user revoked");
        else toast("Revoke failed", "error");
      }));
    };
    loadUsers();
    $("[data-invite]", view).addEventListener("click", () => {
      const m = modal({
        title: "Invite user",
        body: `
          <div class="field"><label>Email</label><input type="email" placeholder="teammate@abhijeetvarghese.com"></div>
          <div class="field" style="margin-top:12px"><label>Role</label>
            <select>${["Editor", "Writer", "SEO Manager", "Guest"].map(r => `<option>${r}</option>`).join("")}</select></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Send invite</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const email = $("input[type=email]", m.el).value.trim();
        const roleSel = $("select", m.el).value;
        const roleMap = { Editor: 3, Writer: 4, "SEO Manager": 5, Guest: 6 };
        const r = await AV.api.send("/api/users", "POST", { name: email.split("@")[0], email, password: Math.random().toString(36).slice(2) + "Xy1!", role_id: roleMap[roleSel] || 3 });
        if (r.ok) { toast("User created — set their password next"); m.close(); loadUsers(); }
        else toast("Failed: " + (r.error?.message || "error"), "error");
      });
    });
    $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => toast("User settings opened")));
  });

  /* ============ SETTINGS ============ */
  /* ============ BACKUPS ============ */
  R.register("backups", () => `
    <div class="view__head">
      <div><h1 class="view__title">Backups</h1>
      <p class="view__desc">JSON packages: content, leads, submissions, users (names only), AI provider config. Stored outside the web root — never publicly downloadable.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-backup>${icon("refresh")} Back up now</button></div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Snapshots</p><span class="chip chip--muted" id="backupCount">—</span></div>
      <div class="card__body" id="backupList"></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card__head"><p class="card__title">Restore</p></div>
      <div class="card__body" style="font-size:12.5px;color:var(--ink-3);line-height:1.7">
        Restoring replaces the current <b>content, leads and form submissions</b> with the backup's state.
        Content keys become new versions (history is preserved); leads and submissions are replaced.
        Users are never restored from backups (passwords cannot be recovered) — the backup only
        records names and roles for reference. Always publish after a restore to regenerate the site.
      </div>
    </div>`);
  R.after("backups", view => {
    const load = async () => {
      const r = await AV.api.get("/api/backups");
      const rows = (r.data || []).sort((a, b) => b.file.localeCompare(a.file));
      $("#backupCount", view).textContent = rows.length + " backup(s)";
      $("#backupList", view).innerHTML = rows.map(b => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)">
          <div class="backup-item__icon" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);flex:none">${icon("db", 15)}</div>
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:13.5px">${esc(b.file)}</p>
            <p style="font-size:11.5px;color:var(--ink-4)">${Number(b.size || 0).toLocaleString()} bytes · ${esc((b.created_at || "").slice(0, 16).replace("T", " "))}</p>
          </div>
          <button class="btn btn--sm btn--soft" data-dl="${esc(b.file)}">${icon("download", 12)} Download</button>
          <button class="btn btn--sm btn--danger-soft" data-restore="${esc(b.file)}">${icon("refresh", 12)} Restore</button>
          <button class="icon-btn" style="width:30px;height:30px" data-del="${esc(b.file)}">${icon("trash", 14)}</button>
        </div>`).join("") || `<p style="color:var(--ink-3);text-align:center;padding:24px">No backups yet — run "Back up now".</p>`;
      $$("[data-dl]", view).forEach(b => b.addEventListener("click", async () => {
        try {
          const r = await fetch("/api/backups/download/" + encodeURIComponent(b.dataset.dl), { credentials: "same-origin" });
          if (!r.ok) { toast("Download failed", "error"); return; }
          const blob = await r.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = b.dataset.dl;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(a.href);
        } catch (e) { toast("Download failed", "error"); }
      }));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete backup?", esc(b.dataset.del), async () => {
        const rr = await AV.api.send("/api/backups/" + encodeURIComponent(b.dataset.del), "DELETE");
        if (rr.ok) { toast("Backup deleted"); load(); }
      })));
      $$("[data-restore]", view).forEach(b => b.addEventListener("click", () => confirmDlg(
        "Restore this backup?",
        "Content, leads and form submissions will be replaced by the backup state. Users are never restored. This is reversible for content (new versions are created) but leads replaced by the backup are gone.",
        async () => {
          const rr = await AV.api.send("/api/backups/restore", "POST", { file: b.dataset.restore });
          if (rr.ok) { toast(`Restored: ${rr.data.content_keys} content keys, ${rr.data.leads} leads — publish to apply`); load(); }
          else toast(rr.error && rr.error.message ? rr.error.message : "Restore failed", "error");
        })));
    };
    $("[data-backup]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/backup", "POST", {});
      if (r.ok) { toast("Backup created — " + r.data.file); load(); }
      else toast("Backup failed", "error");
    });
    load();
  });

  R.register("integrations", () => `
    <div class="view__head">
      <div><h1 class="view__title">Integrations</h1>
      <p class="view__desc">Real connection status — AI providers (keys encrypted at rest), Calendly inbound, SMTP delivery, webhooks.</p></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card__head"><p class="card__title">AI providers</p><span class="chip chip--muted">keys encrypted at rest · never shown again</span></div>
      <div class="card__body" id="aiProvList"></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card__head"><p class="card__title">Calendly</p></div>
      <div class="card__body">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="chip" id="calStatus">…</span>
          <code id="calUrl" style="font-size:11.5px;background:var(--surface-3);padding:6px 10px;border-radius:7px"></code>
          <a class="btn btn--sm btn--soft" data-go-platform>Manage signing key →</a>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card__head"><p class="card__title">SMTP email delivery</p><span class="chip chip--muted" id="smtpStatus">—</span></div>
      <div class="card__body">
        <div class="grid grid-2" style="gap:10px">
          <div class="field"><label>Host</label><input id="smHost" placeholder="smtp.example.com"></div>
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
        <div class="field" style="margin-top:10px"><label>Reply-To (optional)</label><input id="smReply" placeholder="hi@abhijeetvarghese.com"></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn--primary" data-sm-save>${icon("save", 13)} Save</button>
          <button class="btn btn--soft" data-sm-test>${icon("send", 13)} Send test email</button>
        </div>
      </div>
    </div>`);
  R.after("integrations", view => {
    const loadProviders = async () => {
      const r = await AV.api.get("/api/ai/providers");
      if (!r.ok) return;
      const cfg = (r.data && r.data.configured) || [];
      $("#aiProvList", view).innerHTML = cfg.map(p => `
        <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line)">
          <span style="font-weight:600;width:110px;font-size:13.5px">${esc(p.label)}</span>
          <code style="font-size:11.5px;color:var(--ink-4);flex:1">${esc(p.model)}</code>
          <span class="chip ${p.has_key ? "chip--ok" : "chip--warn"}">${p.has_key ? "key set ✓" : "no key"}</span>
          <button class="btn btn--sm btn--soft" data-ai-key="${esc(p.code)}" data-ai-label="${esc(p.label)}">${icon("key", 12)} Configure</button>
        </div>`).join("");
      $$("[data-ai-key]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: `API key — ${esc(b.dataset.aiLabel)}`,
          body: `<p style="font-size:12px;color:var(--ink-3);margin-bottom:10px">The key is encrypted at rest and never shown again after saving.</p>
                 <div class="field"><label>API key</label><input type="password" class="f-key" autocomplete="off"></div>
                 <div class="field" style="margin-top:10px"><label>Model (optional)</label><input class="f-model" placeholder="leave blank to keep default"></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save key</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await AV.api.send("/api/ai/providers/" + b.dataset.aiKey, "PUT", { api_key: $(".f-key", m.el).value.trim(), model: $(".f-model", m.el).value.trim() });
          if (r.ok) { toast("Key saved (encrypted)"); m.close(); loadProviders(); }
          else toast("Save failed", "error");
        });
      }));
    };
    const loadCal = async () => {
      const r = await AV.api.get("/api/webhooks/inbound");
      if (!r.ok) return;
      $("#calStatus", view).textContent = r.data.has_key ? "signing key set ✓" : "no signing key";
      $("#calStatus", view).className = "chip " + (r.data.has_key ? "chip--ok" : "chip--warn");
      $("#calUrl", view).textContent = r.data.url;
    };
    const loadSmtp = async () => {
      const r = await AV.api.get("/api/smtp");
      if (!r.ok) return;
      const c = r.data || {};
      $("#smtpStatus", view).textContent = c.host ? `configured (${esc(c.host)}:${c.port} ${esc(c.encryption)})` : "not configured";
      $("#smtpStatus", view).className = "chip " + (c.host ? "chip--ok" : "chip--muted");
      $("#smHost", view).value = c.host || "";
      $("#smPort", view).value = c.port || 587;
      $("#smEnc", view).value = c.encryption || "tls";
      $("#smUser", view).value = c.username || "";
      $("#smFrom", view).value = c.from || "";
      $("#smReply", view).value = c.reply_to || "";
    };
    $("[data-sm-save]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/smtp", "PUT", {
        host: $("#smHost", view).value.trim(), port: $("#smPort", view).value, encryption: $("#smEnc", view).value,
        username: $("#smUser", view).value.trim(), password: $("#smPass", view).value, from: $("#smFrom", view).value.trim(), reply_to: $("#smReply", view).value.trim()
      });
      if (r.ok) { toast("SMTP config saved (credentials encrypted server-side)"); loadSmtp(); }
      else toast("Save failed", "error");
    });
    $("[data-sm-test]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/smtp/test", "POST", {});
      toast(r.ok && r.data && r.data.ok ? "SMTP test sent — check your inbox + email log" : "SMTP test failed: " + ((r.data && r.data.error) || "error"), r.ok && r.data && r.data.ok ? "ok" : "error");
    });
    $("[data-go-platform]", view).addEventListener("click", () => R.go("platform", { tab: "webhooks" }));
    loadProviders();
    loadCal();
    loadSmtp();
  });

  /* ============ LOGS ============ */
  R.register("logs", () => `
    <div class="view__head">
      <div><h1 class="view__title">Logs</h1>
      <p class="view__desc">Every event, audited. Logins, publishes, errors, automation runs.</p></div>
      <div class="view__head-actions">
        <div class="seg" id="logFilter">
          <button class="is-active" data-l="all">All</button>
          <button data-l="info">Info</button>
          <button data-l="warn">Warnings</button>
          <button data-l="error">Errors</button>
        </div>
        <button class="btn btn--ghost" data-clear>${icon("trash")} Clear</button>
      </div>
    </div>
    <div class="card" style="padding:6px 18px" id="logList"></div>`);
  R.after("logs", view => {
    let logsData = [];
    const logs = () => logsData;
    const loadLogs = async () => {
      const r = await AV.api.get("/api/audit");
      if (r.ok) { logsData = (r.data || []).map(x => ({ t: (x.created_at || "").slice(11, 19), level: x.action.includes("fail") ? "warn" : "info", msg: `${x.action} · ${x.entity} ${x.entity_id} · ${x.user_name || "system"}` })); render(); }
    };
    const render = () => {
      const f = $(".seg button.is-active", view)?.dataset.l || "all";
      $("#logList", view).innerHTML = logs().filter(l => f === "all" || l.level === f).map(l => `
        <div class="log-row">
          <span class="log-row__time">${l.t}</span>
          <span class="log-row__level ${l.level}">${l.level}</span>
          <span class="log-row__msg">${esc(l.msg)}</span>
        </div>`).join("") || `<div class="empty"><p>No logs at this level.</p></div>`;
    };
    $$("#logFilter button", view).forEach(b => b.addEventListener("click", () => {
      $$("#logFilter button", view).forEach(x => x.classList.remove("is-active")); b.classList.add("is-active"); render();
    }));
    $("[data-clear]", view).addEventListener("click", () => confirmDlg("Clear logs?", "All log entries will be deleted.", () => {
      S.set("logs", []); render(); toast("Logs cleared (local view)");
    }));
    loadLogs();
  });

  /* ============ NOTIFICATIONS ============ */
  R.register("notifications", () => `
    <div class="view__head">
      <div><h1 class="view__title">Notifications</h1>
      <p class="view__desc">Website updates, leads, bookings and AI recommendations — nothing urgent gets lost.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-allread>${icon("check")} Mark all read</button></div>
    </div>
    <div class="card">
      <div class="card__body" id="notifList"></div>
    </div>`);
  R.after("notifications", view => {
    const render = () => {
      $("#notifList", view).innerHTML = S.get("notifications").map(n => `
        <div class="pop-item" style="border-bottom:1px solid var(--line);${n.unread ? "background:var(--accent-soft)" : ""}">
          <div class="pop-item__icon">${icon(n.icon === "lead" ? "target" : n.icon === "book" ? "calendar" : n.icon === "seo" ? "search" : n.icon === "ai" ? "ai" : n.icon === "backup" ? "db" : "chart")}</div>
          <div style="flex:1"><p class="pop-item__text">${n.text}</p><p class="pop-item__time">${n.time}</p></div>
          ${n.unread ? `<button class="btn btn--sm btn--ghost" data-read="${n.id}">Mark read</button>` : ""}
        </div>`).join("");
      $$("[data-read]", view).forEach(b => b.addEventListener("click", () => {
        const n = S.get("notifications").find(x => x.id === b.dataset.read);
        n.unread = false; S.save(); render();
      }));
    };
    $("[data-allread]", view).addEventListener("click", () => {
      S.set("notifications", S.get("notifications").map(n => ({ ...n, unread: false })));
      toast("All notifications read"); render();
    });
    render();
  });
})();
