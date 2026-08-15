/* ============================================================
   AV OS v2 — business views: CRM, projects, proposals,
   analytics, copilot, automation, notifications, platform
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const S = AV.store;
  const R = AV.router;

  /* ============ CRM — pipeline / contacts / companies / meetings / tasks ============ */
  R.register("crm", () => `
    <div class="view__head">
      <div><h1 class="view__title">CRM <em>— pipeline</em></h1>
      <p class="view__desc">Leads, opportunities, contacts, companies and meetings — one business view.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-go="contacts">Contacts</button>
        <button class="btn btn--ghost" data-go="companies">Companies</button>
        <button class="btn btn--ghost" data-go="meetings">Meetings</button>
        <button class="btn btn--primary" data-new-opp>${icon("plus")} New opportunity</button>
      </div>
    </div>
    <div class="grid grid-4" style="margin-bottom:16px">
      ${["new","contacted","qualified","meeting","proposal","negotiation","won","lost"].map(st => `
        <div class="card card--hover" style="padding:14px" data-stage-card="${st}">
          <p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4)">${esc(st)}</p>
          <p style="font-size:1.6rem;font-weight:600;margin-top:6px" data-stage-count="${st}">0</p>
          <p style="font-size:11px;color:var(--ink-3)" data-stage-total="${st}">—</p>
        </div>`).join("")}
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Opportunity</th><th>Company</th><th>Value</th><th>Stage</th><th>Prob.</th><th>Close</th><th></th></tr></thead>
        <tbody id="oppBody"></tbody>
      </table>
    </div>`);
  R.after("crm", view => {
    let opps = [];
    const load = async () => {
      const r = await AV.api.get("/api/crm/opportunities");
      if (r.ok) { opps = r.data || []; render(); }
      const p = await AV.api.get("/api/crm/pipeline");
      if (p.ok) (p.data || []).forEach(s => {
        const c = $(`[data-stage-count="${s.stage}"]`, view);
        const t = $(`[data-stage-total="${s.stage}"]`, view);
        if (c) c.textContent = s.n;
        if (t) t.textContent = "₹" + Number(s.total || 0).toLocaleString("en-IN");
      });
    };
    const render = () => {
      $("#oppBody", view).innerHTML = opps.map(o => `
        <tr>
          <td><p class="cell-main">${esc(o.title)}</p><p class="cell-sub">${esc(o.source || "")} · ${esc(o.campaign || "")}</p></td>
          <td>${esc(o.company_name || o.lead_name || "—")}</td>
          <td><b>${Number(o.value || 0).toLocaleString("en-IN")}</b> ${esc(o.currency || "INR")}</td>
          <td><select class="opp-stage" data-id="${o.id}" style="min-height:32px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface-2);padding:4px 8px;font-size:12.5px">
            ${["new","contacted","qualified","meeting","proposal","negotiation","won","lost","archived"].map(st => `<option ${o.stage === st ? "selected" : ""}>${st}</option>`).join("")}
          </select></td>
          <td>${o.probability}%</td>
          <td style="font-size:12px;color:var(--ink-3)">${esc(o.expected_close || "—")}</td>
          <td><div style="display:flex;gap:4px">
            <button class="icon-btn" style="width:30px;height:30px" data-edit="${o.id}">${icon("pen", 14)}</button>
            <button class="icon-btn" style="width:30px;height:30px" data-del="${o.id}">${icon("trash", 14)}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="7" style="text-align:center;color:var(--ink-3);padding:30px">No opportunities yet.</td></tr>`;
      $$(".opp-stage", view).forEach(sel => sel.addEventListener("change", async () => {
        const r = await AV.api.send("/api/crm/opportunities/" + sel.dataset.id, "PUT", { stage: sel.value });
        if (r.ok) toast("Stage → " + sel.value); load();
      }));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => editOpp(opps.find(o => o.id == b.dataset.edit))));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete opportunity?", "", async () => {
        await AV.api.send("/api/crm/opportunities/" + b.dataset.del, "DELETE");
        toast("Deleted"); load();
      })));
    };
    const editOpp = o => {
      const m = modal({
        title: "Opportunity",
        body: `
          <div class="field"><label>Title</label><input class="f-t" value="${esc(o.title)}"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Value</label><input class="f-v" type="number" value="${o.value}"></div>
            <div class="field"><label>Probability %</label><input class="f-p" type="number" value="${o.probability}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Expected close</label><input class="f-d" type="date" value="${esc(o.expected_close || "")}"></div>
          <div class="field" style="margin-top:12px"><label>Notes</label><textarea class="f-n" rows="3">${esc(o.notes || "")}</textarea></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/crm/opportunities/" + o.id, "PUT", {
          title: $(".f-t", m.el).value, value: $(".f-v", m.el).value, probability: $(".f-p", m.el).value,
          expected_close: $(".f-d", m.el).value, notes: $(".f-n", m.el).value
        });
        if (r.ok) { toast("Opportunity saved"); m.close(); load(); }
      });
    };
    $("[data-new-opp]", view).addEventListener("click", () => {
      const m = modal({
        title: "New opportunity",
        body: `
          <div class="field"><label>Title</label><input class="f-t" placeholder="e.g. Experience Centre Build"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Value (INR)</label><input class="f-v" type="number" value="0"></div>
            <div class="field"><label>Stage</label><select class="f-s">${["new","contacted","qualified","meeting","proposal","negotiation","won"].map(s => `<option>${s}</option>`).join("")}</select></div>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/crm/opportunities", "POST", {
          title: $(".f-t", m.el).value || "New opportunity", value: $(".f-v", m.el).value, stage: $(".f-s", m.el).value
        });
        if (r.ok) { toast("Opportunity created"); m.close(); load(); }
      });
    });
    $$("[data-go]", view).forEach(b => b.addEventListener("click", () => R.go(b.dataset.go)));
    load();
  });

  /* ============ CONTACTS ============ */
  R.register("contacts", () => `
    <div class="view__head">
      <div><h1 class="view__title">Contacts</h1>
      <p class="view__desc">People across the business — clients, recruiters, collaborators.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add contact</button></div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Role</th><th></th></tr></thead>
        <tbody id="contactBody"></tbody>
      </table>
    </div>`);
  R.after("contacts", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/crm/contacts");
      if (!r.ok) return;
      data = r.data || [];
      $("#contactBody", view).innerHTML = data.map(c => `
        <tr>
          <td><p class="cell-main">${esc(c.name)}</p></td>
          <td>${esc(c.company_name || "—")}</td>
          <td style="font-size:12.5px">${esc(c.email || "—")}</td>
          <td style="font-size:12.5px">${esc(c.phone || "—")}</td>
          <td>${esc(c.role || "—")}</td>
          <td><div style="display:flex;gap:4px">
            <button class="icon-btn" style="width:30px;height:30px" data-edit="${c.id}">${icon("pen", 14)}</button>
            <button class="icon-btn" style="width:30px;height:30px" data-del="${c.id}">${icon("trash", 14)}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:30px">No contacts yet.</td></tr>`;
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => edit(data.find(x => x.id == b.dataset.edit))));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete contact?", "", async () => {
        await AV.api.send("/api/crm/contacts/" + b.dataset.del, "DELETE");
        load();
      })));
    };
    const edit = (c) => {
      const m = modal({
        title: "Contact",
        body: `
          <div class="field"><label>Name</label><input class="f-n" value="${esc(c.name)}"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Email</label><input class="f-e" value="${esc(c.email || "")}"></div>
            <div class="field"><label>Phone</label><input class="f-p" value="${esc(c.phone || "")}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Role</label><input class="f-r" value="${esc(c.role || "")}"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        await AV.api.send("/api/crm/contacts/" + c.id, "PUT", {
          name: $(".f-n", m.el).value, email: $(".f-e", m.el).value, phone: $(".f-p", m.el).value, role: $(".f-r", m.el).value
        });
        toast("Saved"); m.close(); load();
      });
    };
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "Add contact",
        body: `<div class="field"><label>Name</label><input class="f-n"></div>
               <div class="field" style="margin-top:12px"><label>Email</label><input class="f-e" type="email"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Add</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/crm/contacts", "POST", { name: $(".f-n", m.el).value, email: $(".f-e", m.el).value });
        if (r.ok) { toast("Contact added"); m.close(); load(); }
      });
    });
    load();
  });

  /* ============ COMPANIES ============ */
  R.register("companies", () => `
    <div class="view__head">
      <div><h1 class="view__title">Companies</h1>
      <p class="view__desc">Organizations in the network — one record, many projects.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add company</button></div>
    </div>
    <div class="grid grid-3" id="companyGrid"></div>`);
  R.after("companies", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/crm/companies");
      if (!r.ok) return;
      data = r.data || [];
      $("#companyGrid", view).innerHTML = data.map(c => `
        <div class="card card--hover" style="padding:18px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:700">${esc((c.name || "?").slice(0, 2).toUpperCase())}</div>
            <div><p style="font-weight:600;font-size:14px">${esc(c.name)}</p>
            <p style="font-size:12px;color:var(--ink-3)">${esc(c.industry || "—")} · ${esc(c.country || "—")}</p></div>
          </div>
          ${c.website ? `<p style="font-size:12px;color:var(--accent);margin-top:10px">${esc(c.website)}</p>` : ""}
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn--sm btn--ghost" data-del="${c.id}">${icon("trash", 12)}</button>
          </div>
        </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><p>No companies yet.</p></div>`;
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete company?", "", async () => {
        await AV.api.send("/api/crm/companies/" + b.dataset.del, "DELETE");
        load();
      })));
    };
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "Add company",
        body: `<div class="field"><label>Name</label><input class="f-n"></div>
               <div class="field" style="margin-top:12px"><label>Industry</label><input class="f-i"></div>
               <div class="field" style="margin-top:12px"><label>Country</label><input class="f-c"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Add</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/crm/companies", "POST", { name: $(".f-n", m.el).value, industry: $(".f-i", m.el).value, country: $(".f-c", m.el).value });
        if (r.ok) { toast("Company added"); m.close(); load(); }
      });
    });
    load();
  });

  /* ============ MEETINGS ============ */
  R.register("meetings", () => `
    <div class="view__head">
      <div><h1 class="view__title">Meetings</h1>
      <p class="view__desc">Every conversation with a lead, contact or opportunity — stored with the CRM relationship.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Log meeting</button></div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Subject</th><th>Lead</th><th>Scheduled</th><th>Status</th><th>Notes</th><th></th></tr></thead>
        <tbody id="meetBody"></tbody>
      </table>
    </div>`);
  R.after("meetings", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/crm/meetings");
      if (!r.ok) return;
      data = r.data || [];
      $("#meetBody", view).innerHTML = data.map(m => `
        <tr>
          <td><p class="cell-main">${esc(m.subject)}</p></td>
          <td>${esc(m.lead_name || "—")}</td>
          <td style="font-size:12.5px">${esc((m.scheduled_at || "").replace("T", " ").slice(0, 16) || "—")}</td>
          <td><select class="meet-status" data-id="${m.id}" style="min-height:30px;border-radius:8px;border:1px solid var(--line-2);font-size:12px;padding:3px 6px">
            ${["scheduled","confirmed","completed","cancelled","no_show","rescheduled"].map(s => `<option ${m.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select></td>
          <td style="font-size:12px;color:var(--ink-3);max-width:220px"><p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.notes || "")}</p></td>
          <td><button class="icon-btn" style="width:30px;height:30px" data-edit="${m.id}">${icon("pen", 14)}</button></td>
        </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:30px">No meetings yet.</td></tr>`;
      $$(".meet-status", view).forEach(sel => sel.addEventListener("change", async () => {
        await AV.api.send("/api/crm/meetings/" + sel.dataset.id, "PUT", { status: sel.value });
        toast("Status → " + sel.value);
      }));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => {
        const m = data.find(x => x.id == b.dataset.edit);
        const mm = modal({
          title: "Meeting notes",
          body: `<div class="field"><label>Notes</label><textarea rows="4">${esc(m.notes || "")}</textarea></div>
                 <div class="field" style="margin-top:12px"><label>Outcome</label><textarea rows="3">${esc(m.outcome || "")}</textarea></div>`,
          actions: `<button class="btn btn--ghost" data-c>Close</button><button class="btn btn--primary" data-s>Save</button>`
        });
        $("[data-c]", mm.el).addEventListener("click", mm.close);
        $("[data-s]", mm.el).addEventListener("click", async () => {
          await AV.api.send("/api/crm/meetings/" + m.id, "PUT", { notes: $("textarea", mm.el).value, outcome: $$("textarea", mm.el)[1].value });
          toast("Saved"); mm.close(); load();
        });
      }));
    };
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "Log meeting",
        body: `<div class="field"><label>Subject</label><input class="f-s"></div>
               <div class="field" style="margin-top:12px"><label>Scheduled at</label><input class="f-d" type="datetime-local"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/crm/meetings", "POST", { subject: $(".f-s", m.el).value || "Meeting", scheduled_at: $(".f-d", m.el).value });
        if (r.ok) { toast("Meeting logged"); m.close(); load(); }
      });
    });
    load();
  });

  /* ============ BUSINESS PROJECTS ============ */
  R.register("bizprojects", () => `
    <div class="view__head">
      <div><h1 class="view__title">Projects <em>— business</em></h1>
      <p class="view__desc">Client engagements with milestones, deliverables and documents. Completed projects can become case studies.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} New project</button></div>
    </div>
    <div class="grid grid-3" id="bizGrid"></div>`);
  R.after("bizprojects", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/business/projects");
      if (!r.ok) return;
      data = r.data || [];
      $("#bizGrid", view).innerHTML = data.map(p => `
        <div class="card card--hover" style="padding:18px;border-top:3px solid ${p.status === "completed" ? "var(--ok)" : p.status === "in_progress" ? "var(--accent)" : "var(--warn)"}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="chip ${p.status === "completed" ? "chip--ok" : p.status === "in_progress" ? "chip--accent" : "chip--warn"}">${esc(p.status)}</span>
            <span style="font-size:11.5px;color:var(--ink-4)">${esc(p.start_date || "—")} → ${esc(p.end_date || "—")}</span>
          </div>
          <p style="font-weight:600;font-size:15px;margin-top:10px">${esc(p.title)}</p>
          <p style="font-size:12px;color:var(--ink-3);margin-top:2px">${esc(p.company_name || "—")}</p>
          <p style="font-size:14px;font-weight:600;margin-top:8px">₹${Number(p.budget || 0).toLocaleString("en-IN")}</p>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn--sm btn--soft" data-open="${p.id}">${icon("pen", 12)} Manage</button>
            <button class="btn btn--sm btn--ghost" data-del="${p.id}">${icon("trash", 12)}</button>
          </div>
        </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><p>No business projects yet.</p></div>`;
      $$("[data-open]", view).forEach(b => b.addEventListener("click", () => openProject(data.find(x => x.id == b.dataset.open))));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete project?", "", async () => {
        await AV.api.send("/api/business/projects/" + b.dataset.del, "DELETE");
        load();
      })));
    };
    const openProject = p => {
      const m = modal({
        title: `Project — ${esc(p.title)}`,
        body: `
          <div class="field"><label>Status</label><select class="f-status">${["lead","scoping","in_progress","on_hold","completed","archived"].map(s => `<option ${p.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Budget (INR)</label><input class="f-budget" type="number" value="${p.budget}"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Start</label><input class="f-start" type="date" value="${esc(p.start_date || "")}"></div>
            <div class="field"><label>End</label><input class="f-end" type="date" value="${esc(p.end_date || "")}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Notes</label><textarea class="f-notes" rows="3">${esc(p.notes || "")}</textarea></div>
          <p style="font-size:11.5px;color:var(--ink-4);margin-top:12px">Milestones, deliverables and documents are managed per project from this card.</p>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        await AV.api.send("/api/business/projects/" + p.id, "PUT", {
          status: $(".f-status", m.el).value, budget: $(".f-budget", m.el).value,
          start_date: $(".f-start", m.el).value, end_date: $(".f-end", m.el).value, notes: $(".f-notes", m.el).value
        });
        toast("Project saved"); m.close(); load();
      });
    };
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "New project",
        body: `<div class="field"><label>Title</label><input class="f-t"></div>
               <div class="field" style="margin-top:12px"><label>Budget (INR)</label><input class="f-b" type="number" value="0"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/business/projects", "POST", { title: $(".f-t", m.el).value || "New project", budget: $(".f-b", m.el).value });
        if (r.ok) { toast("Project created"); m.close(); load(); }
      });
    });
    load();
  });

  /* ============ PROPOSALS ============ */
  R.register("proposals", () => `
    <div class="view__head">
      <div><h1 class="view__title">Proposals</h1>
      <p class="view__desc">Scope, deliverables, investment and terms — preview, send, track.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} New proposal</button></div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Proposal</th><th>Client</th><th>Investment</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody id="propBody"></tbody>
      </table>
    </div>`);
  R.after("proposals", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/proposals");
      if (!r.ok) return;
      data = r.data || [];
      $("#propBody", view).innerHTML = data.map(p => `
        <tr>
          <td><p class="cell-main">${esc(p.title)}</p></td>
          <td>${esc(p.client_name)}</td>
          <td><b>${Number(p.investment || 0).toLocaleString("en-IN")}</b> ${esc(p.currency || "INR")}</td>
          <td><select class="prop-status" data-id="${p.id}" style="min-height:30px;border-radius:8px;border:1px solid var(--line-2);font-size:12px;padding:3px 6px">
            ${["draft","sent","viewed","accepted","rejected","expired"].map(s => `<option ${p.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select></td>
          <td style="font-size:12px;color:var(--ink-3)">${esc((p.created_at || "").slice(0, 10))}</td>
          <td><div style="display:flex;gap:4px">
            <a class="btn btn--sm btn--soft" href="/api/proposals/preview/${p.id}" target="_blank">${icon("eye", 12)} Preview</a>
            <button class="btn btn--sm btn--soft" data-pdf="${p.id}">${icon("download", 12)} PDF</button>
            <button class="icon-btn" style="width:30px;height:30px" data-del="${p.id}">${icon("trash", 14)}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:30px">No proposals yet.</td></tr>`;
      $$(".prop-status", view).forEach(sel => sel.addEventListener("change", async () => {
        await AV.api.send("/api/proposals/" + sel.dataset.id, "PUT", { status: sel.value });
        toast("Status → " + sel.value);
      }));
      $$("[data-pdf]", view).forEach(b => b.addEventListener("click", async () => {
        try {
          const r = await fetch("/api/proposals/pdf/" + b.dataset.pdf, { credentials: "same-origin" });
          if (!r.ok) { toast("PDF generation failed", "error"); return; }
          const blob = await r.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "proposal-" + b.dataset.pdf + ".pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(a.href);
        } catch (e) { toast("PDF generation failed", "error"); }
      }));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete proposal?", "", async () => {
        await AV.api.send("/api/proposals/" + b.dataset.del, "DELETE");
        load();
      })));
    };
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "New proposal",
        body: `
          <div class="field"><label>Client name</label><input class="f-c"></div>
          <div class="field" style="margin-top:12px"><label>Title</label><input class="f-t"></div>
          <div class="field" style="margin-top:12px"><label>Scope</label><textarea class="f-s" rows="3"></textarea></div>
          <div class="field" style="margin-top:12px"><label>Deliverables (one per line)</label><textarea class="f-d" rows="3"></textarea></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Investment (INR)</label><input class="f-i" type="number" value="0"></div>
            <div class="field"><label>Timeline</label><input class="f-tl" placeholder="12 weeks"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Terms</label><textarea class="f-terms" rows="2"></textarea></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const deliverables = $(".f-d", m.el).value.split("\n").map(x => x.trim()).filter(Boolean);
        const r = await AV.api.send("/api/proposals", "POST", {
          client_name: $(".f-c", m.el).value || "Client", title: $(".f-t", m.el).value || "Proposal",
          scope: $(".f-s", m.el).value, deliverables, investment: $(".f-i", m.el).value,
          timeline: $(".f-tl", m.el).value, terms: $(".f-terms", m.el).value
        });
        if (r.ok) { toast("Proposal created"); m.close(); load(); }
      });
    });
    load();
  });

  /* ============ ANALYTICS (first-party) ============ */
  R.register("analytics", () => `
    <div class="view__head">
      <div><h1 class="view__title">Analytics <em>— first-party</em></h1>
      <p class="view__desc">Self-hosted, privacy-respecting: page views, sources, campaigns, conversions. No third-party cookies.</p></div>
    </div>
    <div class="grid grid-4" style="margin-bottom:16px">
      ${[["visitors", "Visitors (30d)"], ["pageviews", "Page views (30d)"], ["leads", "Leads (30d)"], ["meetings", "Meetings (30d)"]].map(([k, l]) => `
        <div class="card card--hover stat" style="padding:16px 18px">
          <p class="stat__value" style="font-size:1.5rem" data-stat="${k}">—</p>
          <p class="stat__label">${l}</p>
        </div>`).join("")}
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Top pages</p></div>
        <div class="card__body" id="topPages"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Traffic sources</p></div>
        <div class="card__body" id="topSources"></div>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card__head"><p class="card__title">Daily views (30d)</p></div>
        <div class="card__body"><svg id="dailyChart" viewBox="0 0 520 140" preserveAspectRatio="none" style="width:100%;height:140px"></svg></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Campaigns</p></div>
        <div class="card__body" id="campaigns"></div>
      </div>
    </div>`);
  R.after("analytics", view => {
    const load = async () => {
      const s = await AV.api.get("/api/analytics/summary?days=30");
      if (s.ok) (s.data || []).forEach?.(() => {});
      if (s.ok && s.data) {
        $('[data-stat="visitors"]', view).textContent = s.data.visitors || 0;
        $('[data-stat="pageviews"]', view).textContent = s.data.pageviews || 0;
        $('[data-stat="leads"]', view).textContent = s.data.leads || 0;
        $('[data-stat="meetings"]', view).textContent = s.data.meetings || 0;
      }
      const p = await AV.api.get("/api/analytics/pages?days=30");
      if (p.ok) $("#topPages", view).innerHTML = (p.data || []).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:12.5px">
          <span style="flex:1;font-family:ui-monospace,monospace;font-size:11.5px;color:var(--ink-2)">${esc(x.path)}</span>
          <b>${x.views}</b>
        </div>`).join("") || `<p style="color:var(--ink-3)">No data yet.</p>`;
      const src = await AV.api.get("/api/analytics/sources?days=30");
      if (src.ok) $("#topSources", view).innerHTML = (src.data || []).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:12.5px">
          <span style="width:80px;color:var(--ink-2)">${esc(x.source)}</span>
          <div class="prog" style="flex:1"><i style="width:${Math.min(100, x.n * 6)}%"></i></div>
          <b>${x.n}</b>
        </div>`).join("") || `<p style="color:var(--ink-3)">No data yet.</p>`;
      const d = await AV.api.get("/api/analytics/daily?days=30");
      if (d.ok) drawDaily(d.data || []);
      const c = await AV.api.get("/api/analytics/campaigns");
      if (c.ok) $("#campaigns", view).innerHTML = (c.data || []).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:12.5px">
          <span style="flex:1;color:var(--ink-2)">${esc(x.campaign)}</span>
          <span style="color:var(--ink-4);font-size:11px">${x.visits} visits</span>
          <b style="color:var(--ok)">${x.leads} leads</b>
        </div>`).join("") || `<p style="color:var(--ink-3)">No campaigns tracked yet.</p>`;
    };
    const drawDaily = data => {
      const svg = $("#dailyChart", view);
      if (data.length < 2) { svg.innerHTML = data.length === 1 ? `<text x="10" y="70" font-size="12" fill="#9aa1b5">${data[0].d}: ${data[0].n} views</text>` : ""; return; }
      const max = Math.max(...data.map(d => d.n), 1);
      const pts = data.map((d, i) => `${(i / (data.length - 1)) * 520},${140 - (d.n / max) * 130}`).join(" ");
      svg.innerHTML = `
        <polygon points="0,140 ${pts} 520,140" fill="rgba(46,90,172,.18)"/>
        <polyline points="${pts}" fill="none" stroke="#2E5AAC" stroke-width="2"/>
        ${data.filter((_, i) => i % 5 === 0).map((d, i) => `<text x="${(i * 5 / (data.length - 1)) * 520}" y="134" font-size="9" fill="#9aa1b5">${d.d.slice(8)}</text>`).join("")}`;
    };
    load();
  });

  /* ============ AI COPILOT ============ */
  R.register("copilot", () => `
    <div class="view__head">
      <div><h1 class="view__title">AI <em>Copilot</em></h1>
      <p class="view__desc">Ask about your business — leads, projects, SEO, pipeline. Every tool is permission-checked; the AI never touches raw SQL.</p></div>
    </div>
    <div class="grid grid-31">
      <div class="card">
        <div class="card__body">
          <div class="ai-chat" id="coChat" style="max-height:440px">
            <div class="ai-msg ai-msg--bot"><div class="ai-msg__avatar">${icon("ai", 13)}</div>
              <div class="ai-msg__bubble">Copilot ready. Try: <i>"Show my recent leads"</i>, <i>"What should I publish next?"</i>, <i>"Which case studies are missing SEO?"</i> or <i>"Draft a case study from the Orange Business project."</i></div></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:14px">
            <input class="input" id="coInput" placeholder="Ask your business…" style="flex:1">
            <button class="btn btn--primary" data-send>${icon("send")}</button>
          </div>
        </div>
      </div>
      <div class="card" style="padding:16px;height:fit-content">
        <p class="card__title" style="margin-bottom:12px">Example commands</p>
        ${["Show my recent leads", "What should I publish next?", "Which case studies are missing SEO metadata?", "Create a draft case study from the Orange Business project", "What are my top performing projects?", "Show all unpublished pages", "Give me a business dashboard summary", "Show my pipeline"].map(c => `
          <button class="prompt-card" style="width:100%;text-align:left;margin-bottom:8px" data-q="${esc(c)}">
            <span class="prompt-card__name">${icon("spark", 13)} ${esc(c)}</span>
          </button>`).join("")}
      </div>
    </div>`);
  R.after("copilot", view => {
    const chat = $("#coChat", view);
    const input = $("#coInput", view);
    const add = (text, who, typing) => {
      const d = document.createElement("div");
      d.className = "ai-msg ai-msg--" + who;
      d.innerHTML = `<div class="ai-msg__avatar">${who === "user" ? "AV" : icon("ai", 13)}</div><div class="ai-msg__bubble">${typing ? `<span class="typing">${esc(text)}</span>` : esc(text).replace(/\n/g, "<br>")}</div>`;
      chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
      return d;
    };
    const ask = async q => {
      add(q, "user");
      const d = add("Thinking…", "bot", true);
      const r = await AV.api.send("/api/copilot", "POST", { query: q });
      const bubble = $(".ai-msg__bubble", d);
      if (r.ok) bubble.innerHTML = esc(r.data?.text || r.text || "No response").replace(/\n/g, "<br>");
      else bubble.innerHTML = `<span style="color:var(--danger)">${esc(r.error?.message || "Copilot unavailable")}</span>`;
      chat.scrollTop = chat.scrollHeight;
    };
    $("[data-send]", view).addEventListener("click", () => { const q = input.value.trim(); if (q) { input.value = ""; ask(q); } });
    input.addEventListener("keydown", e => { if (e.key === "Enter") { const q = input.value.trim(); if (q) { input.value = ""; ask(q); } } });
    $$("[data-q]", view).forEach(b => b.addEventListener("click", () => ask(b.dataset.q)));
  });

  /* ============ AUTOMATIONS ============ */
  R.register("automations", () => `
    <div class="view__head">
      <div><h1 class="view__title">Automations</h1>
      <p class="view__desc">Trigger → condition → action. Stored in the database, executed by the engine.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-inactive>${icon("refresh")} Run inactivity check</button>
        <button class="btn btn--primary" data-add>${icon("plus")} New rule</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Rules</p></div>
      <div class="card__body" id="autoList"></div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Run history</p></div>
      <div class="card__body" id="autoRuns" style="max-height:280px;overflow-y:auto"></div>
    </div>`);
  R.after("automations", view => {
    const load = async () => {
      const r = await AV.api.get("/api/automations");
      if (r.ok) $("#autoList", view).innerHTML = (r.data || []).map(a => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)">
          <label class="toggle" title="Enabled"><input type="checkbox" data-toggle="${a.id}" ${a.enabled ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:13.5px">${esc(a.name)}</p>
            <p style="font-size:11.5px;color:var(--ink-4)">on ${esc(a.trigger_event)} · ran ${a.run_count}× · last ${esc(a.last_run_at || "never")}${a.last_check_at ? ` · sweep ${esc(a.last_check_at)}` : ""}</p>
          </div>
          <button class="btn btn--sm btn--ghost" data-test="${a.id}" title="Dry-run with a sample context — no side effects">${icon("play", 12)} Test</button>
          <button class="icon-btn" style="width:30px;height:30px" data-del="${a.id}">${icon("trash", 14)}</button>
        </div>`).join("") || `<p style="color:var(--ink-3)">No automation rules.</p>`;
      $$("[data-toggle]", view).forEach(b => b.addEventListener("change", async () => {
        await AV.api.send("/api/automations/" + b.dataset.toggle, "PUT", { enabled: b.checked ? 1 : 0 });
        toast(b.checked ? "Rule enabled" : "Rule disabled");
      }));
      $$("[data-test]", view).forEach(b => b.addEventListener("click", async () => {
        const r = await AV.api.send("/api/automations/test/" + b.dataset.test, "POST", {});
        if (r.ok && r.data) {
          const d = r.data;
          toast(`Test: conditions ${d.conditions_match ? "match ✓" : "don't match"} — ${(d.planned_actions || []).length} action(s) would run (dry-run, nothing executed)`);
        } else toast("Test failed", "error");
      }));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete automation?", "", async () => {
        await AV.api.send("/api/automations/" + b.dataset.del, "DELETE");
        load();
      })));
      const rr = await AV.api.get("/api/automations/runs");
      if (rr.ok) $("#autoRuns", view).innerHTML = (rr.data || []).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px">
          <span class="chip ${x.success ? "chip--ok" : "chip--danger"}">${x.success ? "✓" : "✗"}</span>
          <span style="flex:1">${esc(x.automation_name)}</span>
          <span style="color:var(--ink-4);font-size:11px">${esc((x.created_at || "").replace("T", " ").slice(0, 16))}</span>
        </div>`).join("") || `<p style="color:var(--ink-3)">No runs yet.</p>`;
    };
    $("[data-inactive]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/automations/check-inactive", "POST", {});
      if (r.ok) {
        toast(`Inactivity sweep: ${r.data.rules_checked} rule(s) checked, ${r.data.actions_fired} action(s) fired`);
        load();
      } else {
        toast("Sweep failed", "error");
      }
    });
    $("[data-add]", view).addEventListener("click", () => {
      const m = modal({
        title: "New automation rule",
        body: `
          <div class="field"><label>Name</label><input class="f-n" placeholder="e.g. High-value lead follow-up"></div>
          <div class="field" style="margin-top:12px"><label>Trigger event</label>
            <select class="f-t">${["lead.created","lead.updated","lead.inactive","page.published","form.submitted","project.created"].map(e => `<option>${e}</option>`).join("")}</select></div>
          <div class="field" style="margin-top:12px"><label>Condition — min score (optional)</label><input class="f-c" type="number" value="70"></div>
          <div class="field" style="margin-top:12px" id="fDaysWrap"><label>Condition — inactive for at least N days (lead.inactive)</label><input class="f-days" type="number" value="7"></div>
          <div class="field" style="margin-top:12px"><label>Actions</label>
            <select class="f-a" multiple style="min-height:110px">
              <option value="notification" selected>Send notification</option>
              <option value="task">Create follow-up task</option>
              <option value="email">Send follow-up email</option>
            </select></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $(".f-t", m.el).addEventListener("change", () => {
        $("#fDaysWrap", m.el).style.display = $(".f-t", m.el).value === "lead.inactive" ? "" : "none";
      });
      $("#fDaysWrap", m.el).style.display = "none";
      $("[data-s]", m.el).addEventListener("click", async () => {
        const acts = [...$$(".f-a option", m.el)].filter(o => o.selected).map(o => ({ type: o.value, title: o.value === "task" ? "Follow up with lead" : o.value === "email" ? "Follow-up email" : "Automation notification" }));
        const trigger = $(".f-t", m.el).value;
        const conds = trigger === "lead.inactive" ? { days_min: parseInt($(".f-days", m.el).value || "7", 10) } : { score_min: parseInt($(".f-c", m.el).value || "0", 10) };
        const r = await AV.api.send("/api/automations", "POST", { name: $(".f-n", m.el).value || "New rule", trigger_event: trigger, conditions: conds, actions: acts, enabled: 1 });
        if (r.ok) { toast("Automation created"); m.close(); load(); }
      });
    });
    load();
  });

  R.register("notifications", () => `
    <div class="view__head">
      <div><h1 class="view__title">Notifications</h1>
      <p class="view__desc">Leads, meetings, publish results, system alerts.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-allread>${icon("check")} Mark all read</button></div>
    </div>
    <div class="card"><div class="card__body" id="notifBody"></div></div>`);
  R.after("notifications", view => {
    const load = async () => {
      const r = await AV.api.get("/api/notifications");
      if (!r.ok) return;
      $("#notifBody", view).innerHTML = (r.data || []).map(n => `
        <div class="pop-item" style="border-bottom:1px solid var(--line);${n.read_at ? "" : "background:var(--accent-soft)"}">
          <div class="pop-item__icon">${icon(n.type === "error" ? "x" : n.type === "lead" ? "target" : n.type === "publish" ? "send" : "bell")}</div>
          <div style="flex:1"><p class="pop-item__text"><b>${esc(n.title)}</b> — ${esc(n.body || "")}</p>
          <p class="pop-item__time">${esc((n.created_at || "").replace("T", " ").slice(0, 16))}${n.read_at ? "" : " · unread"}</p></div>
          ${n.read_at ? "" : `<button class="btn btn--sm btn--ghost" data-read="${n.id}">Read</button>`}
        </div>`).join("") || `<p style="color:var(--ink-3);text-align:center;padding:30px">No notifications.</p>`;
      $$("[data-read]", view).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/notifications/read/" + b.dataset.read, "POST", {});
        load();
      }));
    };
    $("[data-allread]", view).addEventListener("click", async () => {
      await AV.api.send("/api/notifications/read-all", "POST", {});
      load();
    });
    load();
  });

  /* ============ PLATFORM: webhooks / api keys / flags / knowledge / errors / email / sites ============ */
  R.register("platform", () => `
    <div class="view__head">
      <div><h1 class="view__title">Platform</h1>
      <p class="view__desc">Webhooks, API keys, feature flags, knowledge base, system errors, email log, sites.</p></div>
    </div>
    <div class="tabs" id="platTabs">
      <button class="is-active" data-t="webhooks">Webhooks</button>
      <button data-t="apikeys">API keys</button>
      <button data-t="flags">Feature flags</button>
      <button data-t="knowledge">Knowledge</button>
      <button data-t="errors">Errors</button>
      <button data-t="email">Email log</button>
      <button data-t="sites">Sites</button>
    </div>
    <div id="platPane"></div>`);
  R.after("platform", view => {
    const tabParam = (R.current() || {}).params || {};
    const panes = {
      webhooks: () => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <input class="input" id="whUrl" placeholder="https://your-server.com/hook" style="flex:1;min-width:220px">
            <input class="input" id="whSecret" placeholder="secret (optional)" style="min-width:140px">
            <input class="input" id="whEvents" placeholder="lead.created,page.published" style="flex:1;min-width:180px">
            <button class="btn btn--primary" data-add-wh>${icon("plus", 13)} Add</button>
            <button class="btn btn--ghost" data-retry-wh>${icon("refresh", 13)} Retry failed</button>
          </div>
        </div>
        <div id="whList"></div>
        <div class="card" style="padding:16px;margin-top:14px">
          <p class="card__title" style="margin-bottom:4px">Inbound — Calendly</p>
          <p style="font-size:12px;color:var(--ink-3);margin-bottom:10px">Signed webhooks (invitee.created / invitee.canceled) mapped into leads, meetings and activities. Signature-verified, timestamp-guarded, idempotent.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <code class="chip chip--muted" id="inbUrl" style="font-size:11.5px;padding:7px 10px">…</code>
            <span class="chip" id="inbStatus">…</span>
            <input class="input" id="inbKey" type="password" placeholder="Calendly webhook signing key" style="min-width:220px;flex:1">
            <button class="btn btn--soft" data-save-inb>${icon("save", 13)} Save key</button>
          </div>
          <div id="inbEvents" style="margin-top:12px;font-size:12px;max-height:180px;overflow-y:auto"></div>
        </div>`,
      apikeys: () => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <input class="input" id="akName" placeholder="Key name" style="flex:1;min-width:200px">
            <button class="btn btn--primary" data-add-ak>${icon("plus", 13)} Create key</button>
          </div>
          <p style="font-size:11.5px;color:var(--ink-4);margin-top:8px">Keys are hashed — the full key is shown only once at creation.</p>
        </div>
        <div id="akList"></div>`,
      flags: () => `<div id="flagList"></div>`,
      knowledge: () => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <input class="input" id="knTitle" placeholder="Title" style="flex:1;min-width:200px">
            <input class="input" id="knCat" placeholder="category" style="min-width:120px">
            <button class="btn btn--primary" data-add-kn>${icon("plus", 13)} Add item</button>
          </div>
          <textarea class="input" id="knBody" placeholder="Body…" style="width:100%;margin-top:10px;min-height:70px;resize:vertical"></textarea>
        </div>
        <div id="knList"></div>`,
      errors: () => `<div id="errList"></div>`,
      email: () => `<div id="mailList"></div>`,
      sites: () => `
        <div class="card">
          <div class="card__head"><p class="card__title">Sites</p><span class="chip chip--muted">multi-site ready</span></div>
          <div class="card__body" id="siteList"></div>
        </div>`,
    };
    const show = t => {
      $("#platPane", view).innerHTML = panes[t] ? panes[t]() : "";
      if (t === "webhooks") { loadWebhooks(); loadInbound(); }
      if (t === "apikeys") loadKeys();
      if (t === "flags") loadFlags();
      if (t === "knowledge") loadKnowledge();
      if (t === "errors") loadErrors();
      if (t === "email") loadEmail();
      if (t === "sites") loadSites();
    };
    const loadWebhooks = async () => {
      const r = await AV.api.get("/api/webhooks");
      $("#whList", view).innerHTML = (r.data || []).map(w => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px">
          <span class="chip ${w.status === "active" ? "chip--ok" : "chip--muted"}">${esc(w.status)}</span>
          <code style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(w.endpoint)}</code>
          <span style="font-size:11px;color:var(--ink-4)">${esc((w.events || "").slice(0, 60))}</span>
          <button class="icon-btn" style="width:30px;height:30px" data-del-wh="${w.id}">${icon("trash", 14)}</button>
        </div>`).join("") || `<p style="color:var(--ink-3)">No webhooks.</p>`;
      $$("[data-del-wh]", view).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/webhooks/" + b.dataset.delWh, "DELETE");
        loadWebhooks();
      }));
    };
    const loadKeys = async () => {
      const r = await AV.api.get("/api/apikeys");
      $("#akList", view).innerHTML = (r.data || []).map(k => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px">
          <span style="font-weight:600;font-size:13px;flex:1">${esc(k.name)}</span>
          <code style="font-size:11.5px;color:var(--ink-4)">${esc(k.key_prefix)}••••</code>
          <span style="font-size:11px;color:var(--ink-4)">${k.revoked ? "revoked" : `last used ${esc(k.last_used_at || "never")}`}</span>
          ${k.revoked ? "" : `<button class="btn btn--sm btn--danger-soft" data-revoke="${k.id}">Revoke</button>`}
        </div>`).join("") || `<p style="color:var(--ink-3)">No API keys.</p>`;
      $$("[data-revoke]", view).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/apikeys/" + b.dataset.revoke, "DELETE");
        loadKeys();
      }));
    };
    const loadFlags = async () => {
      const r = await AV.api.get("/api/flags");
      $("#flagList", view).innerHTML = (r.data || []).map(f => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px">
          <label class="toggle"><input type="checkbox" data-flag="${esc(f.flag)}" ${f.enabled ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>
          <div style="flex:1"><p style="font-weight:600;font-size:13px">${esc(f.flag)}</p>
          <p style="font-size:11.5px;color:var(--ink-4)">${esc(f.description || "")}</p></div>
          <span class="chip ${f.enabled ? "chip--ok" : "chip--muted"}">${f.enabled ? "ON" : "OFF"}</span>
        </div>`).join("");
      $$("[data-flag]", view).forEach(b => b.addEventListener("change", async () => {
        await AV.api.send("/api/flags/" + b.dataset.flag, "PUT", { enabled: b.checked });
        toast(b.dataset.flag + " → " + (b.checked ? "ON" : "OFF"));
        loadFlags();
      }));
    };
    const loadKnowledge = async () => {
      const r = await AV.api.get("/api/knowledge");
      $("#knList", view).innerHTML = (r.data || []).map(k => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px">
          <span class="chip chip--muted">${esc(k.category)}</span>
          <span style="font-weight:600;font-size:13px;flex:1">${esc(k.title)}</span>
          <button class="icon-btn" style="width:30px;height:30px" data-del-kn="${k.id}">${icon("trash", 14)}</button>
        </div>`).join("") || `<p style="color:var(--ink-3)">Knowledge base is empty — add your methods, frameworks and experience.</p>`;
      $$("[data-del-kn]", view).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/knowledge/" + b.dataset.delKn, "DELETE");
        loadKnowledge();
      }));
    };
    const loadErrors = async () => {
      const r = await AV.api.get("/api/errors");
      $("#errList", view).innerHTML = `<div class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <p class="card__title">System errors</p><button class="btn btn--sm btn--ghost" data-clear-errs>${icon("trash", 12)} Clear</button></div>
        ${(r.data || []).map(e => `
          <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12px">
            <span class="chip ${e.level === "error" ? "chip--danger" : "chip--warn"}">${esc(e.level)}</span>
            <span style="color:var(--ink-4);width:60px">${esc(e.source)}</span>
            <span style="flex:1;color:var(--ink-2)">${esc(e.message)}</span>
            <span style="color:var(--ink-4);font-size:11px">${esc((e.created_at || "").replace("T", " ").slice(0, 16))}</span>
          </div>`).join("") || `<p style="color:var(--ink-3);text-align:center;padding:20px">No errors logged. ✨</p>`}</div>`;
      $("[data-clear-errs]", view)?.addEventListener("click", async () => {
        await AV.api.send("/api/errors", "DELETE");
        loadErrors();
      });
    };
    const loadEmail = async () => {
      const r = await AV.api.get("/api/emaillog");
      $("#mailList", view).innerHTML = `<div class="card" style="padding:14px">
        ${(r.data || []).map(e => `
          <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px">
            <span class="chip ${e.status === "sent" ? "chip--ok" : e.status === "failed" ? "chip--danger" : "chip--warn"}">${esc(e.status)}</span>
            <span style="flex:1">${esc(e.subject)}</span>
            <span style="color:var(--ink-4)">${esc(e.recipient)}</span>
          </div>`).join("") || `<p style="color:var(--ink-3);text-align:center;padding:20px">No emails logged.</p>`}</div>`;
    };
    const loadInbound = async () => {
      const c = await AV.api.get("/api/webhooks/inbound");
      if (c.ok && c.data) {
        $("#inbUrl", view).textContent = c.data.url;
        const st = $("#inbStatus", view);
        st.textContent = c.data.has_key ? "key set ✓ (encrypted)" : "no signing key";
        st.className = "chip " + (c.data.has_key ? "chip--ok" : "chip--warn");
      }
      const e = await AV.api.get("/api/webhooks/inbound/events?limit=20");
      $("#inbEvents", view).innerHTML = (e.data || []).length
        ? (e.data || []).map(ev => `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);align-items:center">
            <span class="chip ${ev.status === "processed" ? "chip--ok" : ev.status === "duplicate" ? "chip--muted" : "chip--danger"}">${esc(ev.status)}</span>
            <code style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ev.event_type)} · ${esc(ev.event_id)}</code>
            <span style="color:var(--ink-4);font-size:11px">${esc((ev.created_at || "").slice(0, 16).replace("T", " "))}</span>
          </div>`).join("")
        : `<p style="color:var(--ink-3)">No inbound events yet — point your Calendly webhook subscription at the URL above.</p>`;
    };
    $("[data-save-inb]", view)?.addEventListener("click", async () => {
      const k = $("#inbKey", view).value.trim();
      if (!k) { toast("Enter the signing key", "error"); return; }
      const r = await AV.api.send("/api/webhooks/inbound/config", "PUT", { signing_key: k });
      if (r.ok) { toast("Signing key saved (encrypted, never shown again)"); $("#inbKey", view).value = ""; loadInbound(); }
      else toast("Save failed", "error");
    });
    $("[data-retry-wh]", view)?.addEventListener("click", async () => {
      const r = await AV.api.send("/api/webhooks/retry-failed", "POST", {});
      if (r.ok) toast(`Retried ${r.data.retried} failed delivery(ies)`);
      else toast("Retry failed", "error");
      show("webhooks");
    });
    $("[data-add-wh]", view)?.addEventListener("click", async () => {
      await AV.api.send("/api/webhooks", "POST", {
        endpoint: $("#whUrl", view).value, secret: $("#whSecret", view).value,
        events: $("#whEvents", view).value.split(",").map(x => x.trim()).filter(Boolean)
      });
      toast("Webhook added"); show("webhooks");
    });
    $("[data-add-ak]", view)?.addEventListener("click", async () => {
      const r = await AV.api.send("/api/apikeys", "POST", { name: $("#akName", view).value });
      if (r.ok) {
        const m = modal({
          title: "API key created",
          body: `<p style="font-size:13px;color:var(--ink-2)">Store this key now — it will never be shown again:</p>
                 <code style="display:block;background:var(--surface-3);padding:10px 12px;border-radius:8px;margin-top:10px;font-size:12.5px;word-break:break-all">${esc(r.data.key)}</code>`,
          actions: `<button class="btn btn--primary" data-c>I stored it</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        loadKeys();
      }
    });
    $("[data-add-kn]", view)?.addEventListener("click", async () => {
      await AV.api.send("/api/knowledge", "POST", { title: $("#knTitle", view).value, body: $("#knBody", view).value, category: $("#knCat", view).value });
      toast("Knowledge item added"); show("knowledge");
    });
    const loadSites = async () => {
      const r = await AV.api.get("/api/sites");
      $("#siteList", view).innerHTML = (r.data || []).map(s => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)">
          <span class="chip ${s.status === "active" ? "chip--ok" : "chip--muted"}">${esc(s.status)}</span>
          <div style="flex:1">
            <p style="font-weight:600;font-size:13.5px">${esc(s.name)}</p>
            <p style="font-size:11.5px;color:var(--ink-4)">${esc(s.domain)} · theme ${esc(s.theme)}</p>
          </div>
          <span style="font-size:11px;color:var(--ink-4)">since ${esc((s.created_at || "").slice(0, 10))}</span>
        </div>`).join("") || `<p style="color:var(--ink-3)">No sites yet — the first site is created during installation.</p>`;
    };
    $$("#platTabs button", view).forEach(b => b.addEventListener("click", () => {
      $$("#platTabs button", view).forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      show(b.dataset.t);
    }));
    const initial = tabParam.tab || "webhooks";
    const btn = $(`#platTabs [data-t="${initial}"]`, view);
    if (btn) btn.classList.add("is-active");
    show(initial);
  });

  /* ============ HEALTH ============ */
  R.register("health", () => `
    <div class="view__head">
      <div><h1 class="view__title">System health</h1>
      <p class="view__desc">Every subsystem — one glance.</p></div>
      <div class="view__head-actions"><button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button></div>
    </div>
    <div class="grid grid-2" id="healthGrid"></div>`);
  R.after("health", view => {
    const load = async () => {
      const s = await AV.api.get("/api/status");
      const checks = [
        ["API", s.ok, "API responding"],
        ["Database", s.data?.database === "connected", "MySQL connection"],
        ["Storage", s.data?.storage === "writable", "uploads / cache / logs"],
        ["Public site", !!s.data?.public_site, "Generated static site exists"],
        ["Auth", !!s.data?.authed, "Session active"],
        ["Version", true, "v" + (s.data?.version || "?") + " · " + (s.data?.environment || "?")],
      ];
      const extra = [
        ["Backups", "storage/backups", () => fetch("/api/backup").then(r => r.json()).then(d => d.ok).catch(() => false)],
      ];
      const b = await fetch("/api/backup", { method: "POST", headers: { "X-CSRF-Token": AV.api.csrf } }).then(r => r.json()).then(d => d.ok).catch(() => false);
      checks.push(["Backup engine", b, "Create backup works"]);
      checks.push(["Media storage", s.data?.media === "writable", "uploads dir"]);
      checks.push(["Email engine", s.data?.email === "mail() available", "PHP mail() + email_log"]);
      checks.push(["AI", s.data?.ai === "configured", s.data?.ai === "configured" ? "provider key(s) set" : "no provider keys — Copilot tools still work"]);
      checks.push(["Backup dir", s.data?.backup === "writable", "storage/backups"]);
      if (s.data?.perf) checks.push(["API perf", true, "avg " + s.data.perf.avg_ms + "ms · " + s.data.perf.requests_24h + " req/24h"]);
      const dg = await AV.api.get("/api/diagnostics");
      if (dg.ok) checks.push(["Data consistency", dg.data.status === "clean", dg.data.issues + " issue(s): " + JSON.stringify(dg.data.details.duplicate_slugs || [])]);
      $("#healthGrid", view).innerHTML = checks.map(([name, ok, desc]) => `
        <div class="card" style="padding:18px;display:flex;align-items:center;gap:14px">
          <span class="status-dot" style="width:12px;height:12px;background:${ok ? "var(--ok)" : "var(--danger)"}"></span>
          <div style="flex:1"><p style="font-weight:600;font-size:14px">${esc(name)}</p>
          <p style="font-size:12px;color:var(--ink-3)">${esc(desc)}</p></div>
          <span class="chip ${ok ? "chip--ok" : "chip--danger"}">${ok ? "Healthy" : "Check"}</span>
        </div>`).join("");
    };
    $("[data-refresh]", view).addEventListener("click", load);
    load();
  });

  /* ============ SECURITY ============ */
  R.register("security", () => `
    <div class="view__head">
      <div><h1 class="view__title">Security center</h1>
      <p class="view__desc">Sessions, login history, failed attempts, configuration.</p></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card"><div class="card__head"><p class="card__title">Security configuration</p></div>
        <div class="card__body">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px"><span>Session lifetime</span><b>${esc((window.AV && AV.store.get("settings") && AV.store.get("settings").security) || "12 hours")}</b></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px"><span>Login throttling</span><b>5 fails / 15 min</b></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px"><span>CSRF protection</span><b>Active</b></div>
        </div></div>
      <div class="card"><div class="card__head"><p class="card__title">Audit trail</p><button class="btn btn--sm btn--soft" data-go-audit>Full log</button></div>
        <div class="card__body" id="secAudit"></div></div>
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card__head"><p class="card__title">Security score</p><span class="chip chip--muted">computed from real checks</span></div>
      <div class="card__body" id="secScore"></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card__head"><p class="card__title">Two-factor authentication</p><span class="chip chip--muted" id="twofaChip">—</span></div>
      <div class="card__body" id="twofaBox"></div></div>
    <div class="card"><div class="card__head"><p class="card__title">Failed login attempts</p></div>
      <div class="card__body" id="secLogins"></div></div>`);
  R.after("security", view => {
    $("[data-go-audit]", view).addEventListener("click", () => R.go("logs"));
    const loadScore = async () => {
      const r = await AV.api.get("/api/security-score");
      if (!r.ok) return;
      const x = r.data;
      $("#secScore", view).innerHTML = `
        <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
          <div class="seo-score-ring">${icon("shield", 40)}<span class="num" style="color:${x.score >= 80 ? "var(--ok)" : x.score >= 60 ? "var(--warn)" : "var(--danger)"}">${x.score}</span></div>
          <div style="flex:1;min-width:220px">
            ${(x.checks || []).map(c => `
              <div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12.5px">
                <span style="color:${c.ok ? "var(--ok)" : "var(--danger)"}">${c.ok ? "✓" : "✗"}</span>
                <span style="flex:1">${esc(c.label)}</span>
                <span style="color:var(--ink-4);font-size:11px">${esc(c.note || "")}</span>
              </div>`).join("")}
          </div>
        </div>`;
    };
    const load = async () => {
      const r = await AV.api.get("/api/audit");
      const rows = (r.data || []).slice(0, 8);
      $("#secAudit", view).innerHTML = rows.map(a => `
        <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px">
          <span style="color:var(--ink-4);width:76px">${esc((a.created_at || "").slice(11, 19))}</span>
          <span style="flex:1">${esc(a.action)} · ${esc(a.entity)} ${esc(a.entity_id || "")}</span>
          <span style="color:var(--ink-4)">${esc(a.user_name || "system")}</span>
        </div>`).join("") || `<p style="color:var(--ink-3)">No audit entries.</p>`;
    };
    const loadTwofa = async () => {
      const r = await AV.api.get("/api/auth/2fa/status");
      const on = !!(r.ok && r.data && r.data.enabled);
      $("#twofaChip", view).textContent = on ? "ENABLED" : "disabled";
      $("#twofaChip", view).className = "chip " + (on ? "chip--ok" : "chip--muted");
      $("#twofaBox", view).innerHTML = on ? `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <p style="font-size:13px;flex:1;color:var(--ink-2)">TOTP is active — every login requires a code from your authenticator app${r.data.verified_at ? " (verified " + esc((r.data.verified_at || "").slice(0, 16).replace("T", " ")) + ")" : ""}.</p>
          <input class="input" id="twofaOffCode" placeholder="current code" style="min-width:130px">
          <button class="btn btn--danger-soft" data-twofa-off>${icon("x", 13)} Disable</button>
        </div>`
      : `
        <p style="font-size:12.5px;color:var(--ink-3);margin-bottom:10px">Protect the admin with TOTP (RFC 6238). You'll need an authenticator app (Google Authenticator, Aegis, 1Password…). Recovery codes are shown once at enable — store them safely.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <input class="input" type="password" id="twofaPw" placeholder="confirm your password" style="min-width:180px;flex:1">
          <button class="btn btn--primary" data-twofa-on>${icon("shield", 13)} Enable 2FA</button>
        </div>
        <div id="twofaSetup" style="display:none;margin-top:14px;border-top:1px solid var(--line);padding-top:12px"></div>`;
      const onBtn = $("[data-twofa-on]", view);
      if (onBtn) onBtn.addEventListener("click", async () => {
        const pw = $("#twofaPw", view).value;
        if (!pw) { toast("Confirm your password", "error"); return; }
        const r = await AV.api.send("/api/auth/2fa/setup", "POST", { password: pw });
        if (!r.ok) { toast(r.error && r.error.message ? r.error.message : "Setup failed", "error"); return; }
        $("#twofaSetup", view).style.display = "";
        $("#twofaSetup", view).innerHTML = `
          <p class="card__title" style="margin-bottom:8px">Add to your authenticator app</p>
          <p style="font-size:12px;color:var(--ink-3);margin-bottom:10px">Manual entry: use the secret below (or this URI in apps that accept it).</p>
          <code style="display:block;background:var(--surface-3);padding:10px;border-radius:8px;font-size:12px;word-break:break-all;margin-bottom:6px">${esc(r.data.uri)}</code>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
            <code style="background:var(--surface-3);padding:6px 10px;border-radius:6px;font-size:13px;letter-spacing:.08em">${esc(r.data.secret)}</code>
            <button class="btn btn--sm btn--soft" data-copy-secret>${icon("copy", 12)} Copy</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="input" id="twofaCode" placeholder="6-digit code" maxlength="6" style="min-width:140px">
            <button class="btn btn--primary" data-twofa-confirm>${icon("check", 13)} Confirm & enable</button>
          </div>`;
        $("[data-copy-secret]", view).addEventListener("click", () => {
          navigator.clipboard && navigator.clipboard.writeText(r.data.secret);
          toast("Secret copied");
        });
        $("[data-twofa-confirm]", view).addEventListener("click", async () => {
          const rr = await AV.api.send("/api/auth/2fa/enable", "POST", { code: $("#twofaCode", view).value.trim() });
          if (!rr.ok) { toast(rr.error && rr.error.message ? rr.error.message : "Enable failed", "error"); return; }
          const codes = rr.data.recovery_codes || [];
          $("#twofaSetup", view).innerHTML = `
            <p class="card__title" style="color:var(--warn)">Store your recovery codes — shown once</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin:10px 0">${codes.map(c => `<code style="background:var(--surface-3);padding:6px;border-radius:6px;text-align:center;font-size:12px">${esc(c)}</code>`).join("")}</div>
            <button class="btn btn--primary" data-twofa-done>${icon("check", 13)} I saved them</button>`;
          $("[data-twofa-done]", view).addEventListener("click", () => { loadTwofa(); toast("2FA ENABLED — next login requires a code"); });
        });
      });
      const offBtn = $("[data-twofa-off]", view);
      if (offBtn) offBtn.addEventListener("click", async () => {
        const r = await AV.api.send("/api/auth/2fa/disable", "POST", { code: $("#twofaOffCode", view).value.trim() });
        if (r.ok) { toast("2FA disabled"); loadTwofa(); }
        else toast(r.error && r.error.message ? r.error.message : "Disable failed", "error");
      });
    };
    loadScore();
    loadTwofa();
    load();
  });

  /* ============ CAMPAIGNS (attribution manager) ============ */
  R.register("campaigns", () => `
    <div class="view__head">
      <div><h1 class="view__title">Campaigns</h1>
      <p class="view__desc">Track UTM-tagged campaigns — visitors, leads and conversions attributed in AV OS analytics.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} New campaign</button></div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Campaign</th><th>UTM</th><th>Status</th><th>Visitors</th><th>Leads</th><th>Budget</th><th>Period</th><th></th></tr></thead>
        <tbody id="campBody"></tbody>
      </table>
    </div>`);
  R.after("campaigns", view => {
    let data = [];
    const load = async () => {
      const r = await AV.api.get("/api/campaigns");
      if (!r.ok) return;
      data = r.data || [];
      $("tbody", view).innerHTML = data.map(c => `
        <tr>
          <td><p class="cell-main">${esc(c.name)}</p>${c.description ? `<p class="cell-sub">${esc(c.description)}</p>` : ""}</td>
          <td style="font-size:11.5px;color:var(--ink-4)"><code>${esc(c.utm_campaign || "—")}</code><br><span>${esc(c.utm_source || "—")} / ${esc(c.utm_medium || "—")}</span></td>
          <td><span class="chip ${c.status === "active" ? "chip--ok" : c.status === "paused" ? "chip--warn" : "chip--muted"}">${esc(c.status)}</span></td>
          <td>${Number(c.visitor_count || 0).toLocaleString()}</td>
          <td><b>${Number(c.lead_count || 0)}</b></td>
          <td>${Number(c.budget || 0).toLocaleString("en-IN")}</td>
          <td style="font-size:11.5px;color:var(--ink-4)">${esc((c.start_date || "—") + " → " + (c.end_date || "—"))}</td>
          <td><div style="display:flex;gap:4px">
            <button class="icon-btn" style="width:30px;height:30px" data-edit="${c.id}">${icon("pen", 13)}</button>
            <button class="icon-btn" style="width:30px;height:30px" data-del="${c.id}">${icon("trash", 14)}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="8" style="text-align:center;color:var(--ink-3);padding:30px">No campaigns yet.</td></tr>`;
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete campaign?", "Attribution history is kept; only the campaign record is removed.", async () => {
        await AV.api.send("/api/campaigns/" + b.dataset.del, "DELETE");
        load();
      })));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => openEditor(data.find(c => c.id == b.dataset.edit))));
    };
    const openEditor = (c = null) => {
      const m = modal({
        title: c ? "Edit campaign" : "New campaign",
        body: `
          <div class="field"><label>Name</label><input class="f-name" value="${esc(c ? c.name : "")}" placeholder="LinkedIn Q3 2026"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>UTM source</label><input class="f-src" value="${esc(c ? c.utm_source : "")}" placeholder="linkedin"></div>
            <div class="field"><label>UTM medium</label><input class="f-med" value="${esc(c ? c.utm_medium : "")}" placeholder="social"></div>
            <div class="field"><label>UTM campaign</label><input class="f-camp" value="${esc(c ? c.utm_campaign : "")}" placeholder="q3-2026"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Description</label><textarea class="f-desc" rows="2" placeholder="What this campaign is about…">${esc(c ? c.description : "")}</textarea></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Budget (INR)</label><input class="f-budget" type="number" value="${c ? c.budget : 0}"></div>
            <div class="field"><label>Status</label><select class="f-status">${["active", "paused", "completed"].map(s => `<option ${c && c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          </div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Start date</label><input class="f-start" type="date" value="${esc(c ? c.start_date : "")}"></div>
            <div class="field"><label>End date</label><input class="f-end" type="date" value="${esc(c ? c.end_date : "")}"></div>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>${c ? "Save" : "Create"}</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const body = {
          name: $(".f-name", m.el).value.trim() || "Campaign",
          utm_source: $(".f-src", m.el).value.trim(), utm_medium: $(".f-med", m.el).value.trim(),
          utm_campaign: $(".f-camp", m.el).value.trim(), description: $(".f-desc", m.el).value,
          budget: $(".f-budget", m.el).value, status: $(".f-status", m.el).value,
          start_date: $(".f-start", m.el).value, end_date: $(".f-end", m.el).value
        };
        const r = await AV.api.send("/api/campaigns" + (c ? "/" + c.id : ""), c ? "PUT" : "POST", body);
        if (r.ok) { toast(c ? "Campaign updated" : "Campaign created"); m.close(); load(); }
      });
    };
    $("[data-add]", view).addEventListener("click", () => openEditor());
    load();
  });

  /* ============ EMAIL TEMPLATES (server-side engine) ============ */
  R.register("emailtemplates", () => `
    <div class="view__head">
      <div><h1 class="view__title">Email Templates</h1>
      <p class="view__desc">Server-side templates rendered by the email engine — new lead, confirmations, follow-ups, alerts. SMTP/API credentials never leave the server.</p></div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Templates</p><span class="chip chip--muted">variables: {name} {email} {company} {project_type} {date} {time} {site_name} {admin_url} {calendly_url}</span></div>
      <div class="card__body" id="tplList"></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card__head"><p class="card__title">Delivery log</p><a class="btn btn--sm btn--soft" data-go-platform>Open full email log</a></div>
      <div class="card__body" id="tplLog" style="max-height:220px;overflow-y:auto"></div>
    </div>`);
  R.after("emailtemplates", view => {
    const load = async () => {
      const r = await AV.api.get("/api/emailtemplates");
      if (!r.ok) return;
      $("#tplList", view).innerHTML = (r.data || []).map(t => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)">
          <label class="toggle" title="Enabled"><input type="checkbox" data-toggle="${t.id}" ${t.enabled ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:13.5px">${esc(t.name)}</p>
            <p style="font-size:11.5px;color:var(--ink-4)">${esc(t.subject)}</p>
          </div>
          <button class="btn btn--sm btn--soft" data-test="${t.id}">${icon("send", 12)} Test</button>
          <button class="btn btn--sm btn--ghost" data-edit="${t.id}">Edit</button>
        </div>`).join("") || `<p style="color:var(--ink-3)">No templates.</p>`;
      $$("[data-toggle]", view).forEach(b => b.addEventListener("change", async () => {
        const t = (r.data || []).find(x => x.id == b.dataset.toggle);
        if (t) await AV.api.send("/api/emailtemplates/" + t.id, "PUT", { name: t.name, subject: t.subject, body: t.body, enabled: b.checked ? 1 : 0 });
        toast(b.checked ? "Template enabled" : "Template disabled");
      }));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => {
        const t = (r.data || []).find(x => x.id == b.dataset.edit);
        const m = modal({
          title: `Edit — ${esc(t.name)}`,
          body: `
            <div class="field"><label>Name</label><input class="f-name" value="${esc(t.name)}"></div>
            <div class="field" style="margin-top:12px"><label>Subject</label><input class="f-subject" value="${esc(t.subject)}"></div>
            <div class="field" style="margin-top:12px"><label>Body (plain text, {variables} supported)</label><textarea class="f-body" rows="10" style="font-family:ui-monospace,monospace;font-size:12px">${esc(t.body)}</textarea></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const rr = await AV.api.send("/api/emailtemplates/" + t.id, "PUT", {
            name: $(".f-name", m.el).value || t.name, subject: $(".f-subject", m.el).value || t.subject,
            body: $(".f-body", m.el).value || t.body, enabled: t.enabled ? 1 : 0
          });
          if (rr.ok) { toast("Template saved to database"); m.close(); load(); }
        });
      }));
      $$("[data-test]", view).forEach(b => b.addEventListener("click", async () => {
        const rr = await AV.api.send("/api/emailtemplates/test/" + b.dataset.test, "POST", {});
        toast(rr.ok ? "Test email queued — check delivery log" : "Test failed", rr.ok ? "ok" : "error");
        loadLog();
      }));
    };
    const loadLog = async () => {
      const r = await AV.api.get("/api/emaillog");
      $("#tplLog", view).innerHTML = (r.data || []).slice(0, 12).map(e => `
        <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px;align-items:center">
          <span class="chip ${e.status === "sent" ? "chip--ok" : e.status === "queued" ? "chip--warn" : "chip--danger"}">${esc(e.status)}</span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.template)} → ${esc(e.recipient)}</span>
          <span style="color:var(--ink-4);font-size:11px">${esc((e.created_at || "").slice(0, 16))}</span>
        </div>`).join("") || `<p style="color:var(--ink-3)">No deliveries yet.</p>`;
    };
    $("[data-go-platform]", view).addEventListener("click", () => R.go("platform", { tab: "email" }));
    load();
    loadLog();
  });

  /* ============ PUBLISHING (deployment history + rollback) ============ */
  R.register("publishing", () => `
    <div class="view__head">
      <div><h1 class="view__title">Publishing</h1>
      <p class="view__desc">Deterministic build → staging → validation → atomic swap. Every publish is recorded; previous deployments can be rolled back; a failed publish auto-rolls back.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-preflight>${icon("check")} Pre-flight</button>
        <button class="btn btn--ghost" data-diff>${icon("copy")} Diff</button>
        <button class="btn btn--primary" data-publish>${icon("send")} Publish website</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Live sync</p><span class="chip" id="lsChip">…</span></div>
      <div class="card__body" id="lsBody" style="font-size:12.5px"></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Deployment history</p><span class="chip chip--muted">last 20 · snapshots kept: ${esc(AV.pubRetention || 10)}</span></div>
      <div class="card__body" id="depBody" style="overflow-x:auto"></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">Redirects</p><span class="chip chip--muted">written to the site .htaccess at publish</span></div>
      <div class="card__body">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <input class="input" id="redOld" placeholder="old-url.html" style="flex:1;min-width:150px">
          <input class="input" id="redNew" placeholder="new-url.html" style="flex:1;min-width:150px">
          <select class="select" id="redCode" style="min-height:38px"><option value="301">301</option><option value="302">302</option></select>
          <button class="btn btn--primary" data-red-add>${icon("plus", 13)} Add redirect</button>
        </div>
        <div id="redList"></div>
      </div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Pipeline</p></div>
      <div class="card__body" style="font-size:12.5px;line-height:1.9;color:var(--ink-3)">
        MySQL content → content snapshot → template rendering (site-template/) → asset copy → HTML generation →
        css/tokens.css + sitemap.xml + robots.txt + 404.html + .htaccess → validation → staging directory → atomic swap →
        post-publish health check (critical routes + sitemap) → deployment recorded.
        <br>If any step fails the build stops, the current live site stays untouched, and the failure is logged.
        <br>If the post-publish check fails, the previous deployment is restored automatically.
      </div>
    </div>`);
  R.after("publishing", view => {
    const load = async () => {
      const r = await AV.api.get("/api/deployments");
      $("#depBody", view).innerHTML = `<table class="table"><thead><tr><th>#</th><th>Version</th><th>Status</th><th>By</th><th>Note</th><th>Created</th><th></th></tr></thead><tbody>` +
        (r.data || []).map(d => `
          <tr>
            <td>#${d.id}</td>
            <td><code style="font-size:11.5px">${esc(d.version || "")}</code></td>
            <td><span class="chip ${d.status === "live" ? "chip--ok" : d.status === "rolled_back" ? "chip--warn" : "chip--muted"}">${esc(d.status)}</span></td>
            <td style="font-size:12px">${esc(d.user_name || "system")}</td>
            <td style="font-size:12px">${esc(d.note || "")}</td>
            <td style="font-size:12px;color:var(--ink-4)">${esc((d.created_at || "").slice(0, 16).replace("T", " "))}</td>
            <td>${d.status === "live" && d.id > 1 ? `<button class="btn btn--sm btn--danger-soft" data-rollback="${d.id}">Roll back to #${d.id - 1}</button>` : ""}</td>
          </tr>`).join("") + `</tbody></table>`;
      $$("[data-rollback]", view).forEach(b => b.addEventListener("click", () => confirmDlg(
        "Roll back deployment?",
        "The previous live deployment (site + content) will be restored. Current content becomes a new version — nothing is destroyed.",
        async () => {
          const rr = await AV.api.send("/api/publish/rollback", "POST", {});
          if (rr.ok) { toast(`Rollback complete — restored deployment #${rr.data.restored_deployment}`); load(); }
          else toast(rr.error && rr.error.message ? rr.error.message : "Rollback failed", "error");
        })));
    };
    const loadRedirects = async () => {
      const r = await AV.api.get("/api/redirects");
      $("#redList", view).innerHTML = (r.data || []).map(rd => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px">
          <span class="chip ${rd.enabled ? "chip--ok" : "chip--muted"}">${rd.status_code}${rd.enabled ? "" : " · off"}</span>
          <code style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(rd.old_url)} → ${esc(rd.new_url)}</code>
          <button class="icon-btn" style="width:28px;height:28px" data-red-del="${rd.id}">${icon("trash", 13)}</button>
        </div>`).join("") || `<p style="color:var(--ink-3)">No redirects.</p>`;
      $$("[data-red-del]", view).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/redirects/" + b.dataset.redDel, "DELETE");
        loadRedirects();
      }));
    };
    const loadLiveSync = async () => {
      const r = await AV.api.get("/api/system/publishing");
      if (!r.ok) return;
      const d = r.data;
      const ls = d.live_sync || {};
      const q = (d.queue && d.queue.current) || null;
      const chip = $("#lsChip", view);
      if (q && q.status === "processing") { chip.textContent = "PUBLISHING…"; chip.className = "chip chip--accent"; }
      else if (q && q.status === "failed") { chip.textContent = "FAILED"; chip.className = "chip chip--danger"; }
      else if (ls.failures >= 3) { chip.textContent = "NEEDS ATTENTION"; chip.className = "chip chip--warn"; }
      else { chip.textContent = "🟢 HEALTHY"; chip.className = "chip chip--ok"; }
      const rows = [
        ["Last check", ls.last_check || "—"],
        ["Last sync", ls.last_sync || "—"],
        ["Last publish", ls.last_publish || "—"],
        ["Consecutive failures", String(ls.failures || 0)],
        ["Last error", ls.last_error ? String(ls.last_error).slice(0, 140) : "none"],
      ];
      $("#lsBody", view).innerHTML = rows.map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--line)">
          <span style="color:var(--ink-3);flex:none">${esc(k)}</span>
          <span style="text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(v)}</span>
        </div>`).join("") + `
        <div style="margin-top:10px">
          <p class="card__title" style="margin-bottom:6px">Publish queue</p>
          ${(d.queue && d.queue.history || []).slice(0, 6).map(j => `
            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">
              <span class="chip ${j.status === "completed" ? "chip--ok" : j.status === "failed" ? "chip--danger" : j.status === "processing" ? "chip--accent" : "chip--muted"}" style="font-size:10px">${esc(j.status)}</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(j.trigger_name || "")} · ${esc(j.note || "")}</span>
              <span style="color:var(--ink-4);font-size:11px">${esc((j.created_at || "").slice(11, 19))}</span>
            </div>`).join("") || '<p style="color:var(--ink-3)">No jobs yet.</p>'}
        </div>`;
    };
    $("[data-red-add]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/redirects", "POST", {
        old_url: $("#redOld", view).value, new_url: $("#redNew", view).value, status_code: $("#redCode", view).value, enabled: 1
      });
      if (r.ok) { toast("Redirect saved — applies at next publish"); $("#redOld", view).value = ""; $("#redNew", view).value = ""; loadRedirects(); }
      else toast("Redirect failed", "error");
    });
    $("[data-preflight]", view).addEventListener("click", async () => {
      const btn = $("[data-preflight]", view);
      btn.disabled = true; btn.innerHTML = `${icon("check")} Building…`;
      const r = await AV.api.send("/api/publish/preflight", "POST", {});
      btn.disabled = false; btn.innerHTML = `${icon("check")} Pre-flight`;
      if (!r.ok) { toast("Pre-flight failed: " + (r.error && r.error.message ? r.error.message : "error"), "error"); return; }
      const x = r.data;
      const m = modal({
        title: "Pre-flight report",
        body: `<div style="font-size:13px;line-height:2">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">Pages</span><b>${x.pages}</b></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">Articles</span><b>${x.articles}</b></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">Images</span><b>${x.images}</b></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">SEO errors</span><b style="color:${x.seo_errors ? "var(--warn)" : "var(--ok)"}">${x.seo_errors}</b></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">Warnings (alt text)</span><b>${x.warnings}</b></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-3)">Broken assets / links</span><b style="color:var(--ok)">${x.broken_assets} / ${x.broken_links}</b></div>
          <p style="font-size:11.5px;color:var(--ink-4);margin-top:8px">Warnings do not block publishing — genuine errors do.</p>
        </div>`,
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    $("[data-diff]", view).addEventListener("click", async () => {
      const r = await AV.api.get("/api/publish/diff");
      const x = r.data || { collections: {}, total_changes: 0 };
      const m = modal({
        title: "Publish diff vs last deployment",
        body: x.total_changes === 0
          ? `<p style="color:var(--ok);font-size:13px">No changes since the last publish.</p>`
          : Object.entries(x.collections).map(([key, c]) => `
            <p style="font-weight:700;margin:10px 0 4px;text-transform:capitalize">${esc(key)}</p>
            ${(c.added || []).map(i => `<p style="font-size:12.5px;color:var(--ok)">+ ${esc(i)}</p>`).join("")}
            ${(c.modified || []).map(i => `<p style="font-size:12.5px;color:var(--warn)">~ ${esc(i)}</p>`).join("")}
            ${(c.removed || []).map(i => `<p style="font-size:12.5px;color:var(--danger)">− ${esc(i)}</p>`).join("")}`).join(""),
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    loadRedirects();
    loadLiveSync();
    load();
  });

  /* ============ VERSIONS (content history + restore) ============ */
  R.register("versions", () => `
    <div class="view__head">
      <div><h1 class="view__title">Versions</h1>
      <p class="view__desc">Every content save creates a version. View, compare and restore — restoring never destroys history.</p></div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Entity</p></div>
      <div class="card__body">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <select class="select" id="verKey" style="flex:1;min-width:220px">
            <option value="settings">settings</option><option value="nav">nav</option><option value="sections">sections (homepage)</option>
            <option value="pages">pages</option><option value="projects">projects</option><option value="articles">articles</option>
            <option value="clients">clients</option><option value="testimonials">testimonials</option><option value="forms">forms</option>
          </select>
          <button class="btn btn--soft" data-load>${icon("clock", 13)} Load versions</button>
        </div>
        <div id="verList" style="margin-top:14px"></div>
      </div>
    </div>`);
  R.after("versions", view => {
    const load = async () => {
      const key = $("#verKey", view).value;
      const r = await AV.api.get("/api/versions/" + key);
      const rows = (r.data && r.data.versions) || r.data || [];
      $("#verList", view).innerHTML = rows.length
        ? `<table class="table"><thead><tr><th>Version</th><th>Note</th><th>Created</th><th></th></tr></thead><tbody>` +
          rows.map(v => `<tr>
            <td><b>v${v.version}</b></td>
            <td style="font-size:12px">${esc(v.note || "")}</td>
            <td style="font-size:12px;color:var(--ink-4)">${esc((v.created_at || "").slice(0, 16).replace("T", " "))}</td>
            <td><button class="btn btn--sm btn--soft" data-view="${v.version}">View</button>
                <button class="btn btn--sm btn--danger-soft" data-restore="${v.version}">Restore</button></td>
          </tr>`).join("") + `</tbody></table>`
        : `<p style="color:var(--ink-3);font-size:12.5px">No versions for this entity yet.</p>`;
      $$("[data-view]", view).forEach(b => b.addEventListener("click", async () => {
        const rr = await AV.api.get("/api/versions/" + key);
        const list = (rr.data && rr.data.versions) || rr.data || [];
        const ver = list.find(x => String(x.version) === String(b.dataset.view));
        if (!ver) return;
        const m = modal({
          title: `v${ver.version} — ${esc(key)}`,
          body: `<pre style="white-space:pre-wrap;font-size:11.5px;max-height:420px;overflow-y:auto;background:var(--surface-3);padding:12px;border-radius:10px">${esc(JSON.stringify(ver.data || {}, null, 2))}</pre>`,
          actions: `<button class="btn btn--primary" data-c>Close</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
      }));
      $$("[data-restore]", view).forEach(b => b.addEventListener("click", () => confirmDlg(
        "Restore this version?",
        "The entity is restored to this version. A new version of the restore is created — history is preserved.",
        async () => {
          const rr = await AV.api.send("/api/versions/" + key + "/restore", "POST", { version: parseInt(b.dataset.restore, 10) });
          if (rr.ok) { toast("Version restored — publish to apply"); load(); }
          else toast("Restore failed", "error");
        })));
    };
    $("[data-load]", view).addEventListener("click", load);
    load();
  });

  /* ============ KEYWORDS (command center) ============ */
  R.register("keywords", () => `
    <div class="view__head">
      <div><h1 class="view__title">Keywords</h1>
      <p class="view__desc">Target keywords, intent, clusters and rankings. Internal AV OS estimates — not Google data.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-clusters>${icon("layers")} Clusters</button>
        <button class="btn btn--ghost" data-cannibal>${icon("x", 14)} Cannibalization</button>
        <button class="btn btn--primary" data-add>${icon("plus")} Add keyword</button>
      </div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Keyword</th><th>Intent</th><th>Cluster</th><th>Volume</th><th>Diff.</th><th>Position</th><th>Priority</th><th>Target</th><th></th></tr></thead>
        <tbody id="kwBody"></tbody>
      </table>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card__head"><p class="card__title">Ranking history</p><span class="chip chip--muted">record positions weekly</span></div>
      <div class="card__body" id="rankBody" style="max-height:220px;overflow-y:auto"></div>
    </div>`);
  R.after("keywords", view => {
    let items = [];
    const load = async () => {
      const r = await AV.api.get("/api/seo/keywords");
      if (!r.ok) return;
      items = (r.data && r.data.items) || [];
      $("#kwBody", view).innerHTML = items.map(k => `
        <tr>
          <td><p class="cell-main">${esc(k.keyword)}</p></td>
          <td><span class="chip chip--muted" style="font-size:10.5px">${esc(k.intent)}</span></td>
          <td style="font-size:12px">${esc(k.cluster_name || "—")}</td>
          <td>${Number(k.search_volume || 0).toLocaleString()}</td>
          <td style="font-size:12px">${k.difficulty || "—"}</td>
          <td><b>${k.current_position ? "#" + k.current_position : "—"}</b></td>
          <td>${k.priority || 50}</td>
          <td style="font-size:11.5px;color:var(--ink-4)">${esc(k.target_url || "")}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn--sm btn--soft" data-rank="${k.id}" data-kw="${esc(k.keyword)}">${icon("bar", 12)} Rank</button>
            <button class="btn btn--sm btn--ghost" data-edit="${k.id}">${icon("pen", 12)}</button>
            <button class="btn btn--sm btn--ghost" data-del="${k.id}">${icon("trash", 12)}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="9" style="text-align:center;color:var(--ink-3);padding:24px">No keywords yet — add your first target keyword.</td></tr>`;
      $$("[data-rank]", view).forEach(b => b.addEventListener("click", () => {
        const m = modal({
          title: `Record position — ${esc(b.dataset.kw)}`,
          body: `<div class="field-row">
            <div class="field"><label>Position (0 = not ranking)</label><input type="number" class="f-p" min="0" max="100"></div>
            <div class="field"><label>Device</label><select class="f-d"><option>desktop</option><option>mobile</option></select></div>
          </div>
          <div class="field" style="margin-top:12px"><label>URL</label><input class="f-u" placeholder="experience.html"></div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Record</button>`
        });
        $("[data-c]", m.el).addEventListener("click", m.close);
        $("[data-s]", m.el).addEventListener("click", async () => {
          const r = await AV.api.send("/api/seo/rankings", "POST", { keyword_id: b.dataset.rank, position: $(".f-p", m.el).value, device: $(".f-d", m.el).value, url: $(".f-u", m.el).value });
          if (r.ok) { toast("Position recorded"); m.close(); load(); loadRanks(); }
        });
      }));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => openEditor(items.find(k => k.id == b.dataset.edit))));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete keyword?", "", async () => {
        await AV.api.send("/api/seo/keywords/" + b.dataset.del, "DELETE");
        load();
      })));
    };
    const openEditor = (k = null) => {
      const m = modal({
        title: k ? "Edit keyword" : "Add keyword",
        body: `
          <div class="field"><label>Keyword</label><input class="f-kw" value="${esc(k ? k.keyword : "")}"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Search volume (est.)</label><input type="number" class="f-v" value="${k ? k.search_volume : 0}"></div>
            <div class="field"><label>Difficulty (est.)</label><input type="number" class="f-df" value="${k ? k.difficulty : 0}"></div>
          </div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Priority (1-100)</label><input type="number" class="f-pr" value="${k ? k.priority : 50}"></div>
            <div class="field"><label>Intent</label><select class="f-int">${["informational","commercial","transactional","navigational","local"].map(i => `<option ${k && k.intent === i ? "selected" : ""}>${i}</option>`).join("")}</select></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Target URL</label><input class="f-tu" value="${esc(k ? k.target_url : "")}" placeholder="experience.html"></div>
          <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:13px"><input type="checkbox" class="f-pk" ${k && k.primary_keyword ? "checked" : ""}> Primary keyword for its page</label>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", async () => {
        const body = {
          keyword: $(".f-kw", m.el).value.trim(), search_volume: $(".f-v", m.el).value, difficulty: $(".f-df", m.el).value,
          priority: $(".f-pr", m.el).value, intent: $(".f-int", m.el).value, target_url: $(".f-tu", m.el).value.trim(),
          primary_keyword: $(".f-pk", m.el).checked ? 1 : 0,
        };
        const r = await AV.api.send("/api/seo/keywords" + (k ? "/" + k.id : ""), k ? "PUT" : "POST", body);
        if (r.ok) { toast("Keyword saved to database"); m.close(); load(); }
        else toast("Save failed", "error");
      });
    };
    const loadRanks = async () => {
      const r = await AV.api.get("/api/seo/rankings");
      const recent = (r.data && r.data.recent) || [];
      $("#rankBody", view).innerHTML = recent.length
        ? recent.slice(0, 15).map(x => `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12.5px">
            <b style="width:110px">${esc(x.keyword)}</b>
            <span class="chip ${x.position === 0 ? "chip--muted" : x.position <= 10 ? "chip--ok" : "chip--accent"}">#${x.position || "—"}</span>
            <span style="color:var(--ink-4)">${esc(x.recorded_at)} · ${esc(x.device)}</span>
          </div>`).join("")
        : `<p style="color:var(--ink-3)">No positions recorded yet — use "Rank" on a keyword.</p>`;
    };
    $("[data-add]", view).addEventListener("click", () => openEditor());
    $("[data-cannibal]", view).addEventListener("click", async () => {
      const r = await AV.api.get("/api/seo/cannibalization");
      const c = r.data || [];
      const m = modal({
        title: "Keyword cannibalization",
        body: c.length
          ? c.map(x => `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
              <p style="font-weight:600;font-size:13.5px">⚠ ${esc(x.keyword)} — ${x.count} URLs</p>
              <p style="font-size:12px;color:var(--ink-4);margin:4px 0">${x.urls.map(u => esc(u)).join(" · ")}</p>
              <p style="font-size:12px;color:var(--ink-3)">${esc(x.recommendation)}</p></div>`).join("")
          : `<p style="color:var(--ok)">No cannibalization detected. ✓</p>`,
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    $("[data-clusters]", view).addEventListener("click", async () => {
      const r = await AV.api.get("/api/seo/clusters");
      const c = r.data || [];
      const m = modal({
        title: "Topic clusters",
        body: `
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <input class="input f-cn" placeholder="Cluster name, e.g. Experience Design" style="flex:1">
            <input class="input f-cu" placeholder="pillar URL" style="flex:1">
            <button class="btn btn--primary" data-add-c>${icon("plus", 13)}</button>
          </div>
          <div id="clusterList">${c.map(cl => `
            <div style="padding:10px 0;border-bottom:1px solid var(--line)">
              <div style="display:flex;align-items:center;gap:8px">
                <b style="font-size:13.5px">${esc(cl.name)}</b>
                <span class="chip chip--muted" style="font-size:10.5px">${cl.keyword_count} kw</span>
                <span style="flex:1;font-size:11.5px;color:var(--ink-4)">${esc(cl.pillar_url || "")}</span>
                <button class="icon-btn" data-del-c="${cl.id}" style="width:28px;height:28px">${icon("trash", 13)}</button>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${(cl.keywords || []).slice(0, 8).map(k => `<span class="chip chip--muted" style="font-size:10.5px">${esc(k.keyword)}</span>`).join("")}</div>
            </div>`).join("") || '<p style="color:var(--ink-3)">No clusters yet.</p>'}</div>`,
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-add-c]", m.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/seo/clusters", "POST", { name: $(".f-cn", m.el).value, pillar_url: $(".f-cu", m.el).value });
        if (r.ok) { toast("Cluster created"); m.close(); }
      });
      $$("[data-del-c]", m.el).forEach(b => b.addEventListener("click", async () => {
        await AV.api.send("/api/seo/clusters/" + b.dataset.delC, "DELETE");
        m.close();
      }));
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    load();
    loadRanks();
  });

  /* ============ OPPORTUNITIES (scored) ============ */
  R.register("opportunities", () => `
    <div class="view__head">
      <div><h1 class="view__title">Content opportunities</h1>
      <p class="view__desc">Scored from real keyword data (volume, intent, difficulty, position, business value). Internal estimate — not a ranking guarantee.</p></div>
      <div class="view__head-actions"><button class="btn btn--ghost" data-brief>${icon("doc")} Content brief</button></div>
    </div>
    <div class="card"><div class="card__body" id="oppBody"></div></div>`);
  R.after("opportunities", view => {
    const load = async () => {
      const r = await AV.api.get("/api/seo/opportunities?limit=30");
      const opps = r.data || [];
      $("#oppBody", view).innerHTML = opps.map((o, i) => `
        <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)">
          <span style="font-size:15px;font-weight:700;color:var(--ink-4);width:26px">${i + 1}</span>
          <div class="seo-score-ring" style="width:58px;height:58px">${icon("target", 22)}<span class="num" style="color:${o.score >= 70 ? "var(--ok)" : o.score >= 40 ? "var(--warn)" : "var(--ink-3)"}">${o.score}</span></div>
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:14px">${esc(o.keyword)} <span class="chip chip--muted" style="font-size:10px">${esc(o.intent)}</span></p>
            <p style="font-size:12px;color:var(--ink-3)">${esc(o.reason)}</p>
          </div>
          <div style="text-align:right;font-size:12px;color:var(--ink-4);flex:none">
            <div>${Number(o.search_volume || 0).toLocaleString()} vol</div>
            <div>${o.current_position ? "#" + o.current_position : "not ranking"}</div>
          </div>
          <button class="btn btn--sm btn--soft" data-brief-kw="${esc(o.keyword)}">${icon("doc", 12)} Brief</button>
        </div>`).join("") || `<p style="color:var(--ink-3);text-align:center;padding:30px">No opportunities scored yet — add keywords with volume/difficulty first.</p>`;
      $$("[data-brief-kw]", view).forEach(b => b.addEventListener("click", () => showBrief(b.dataset.briefKw)));
    };
    const showBrief = async (kw) => {
      const r = await AV.api.send("/api/seo/brief", "POST", { keyword: kw });
      if (!r.ok) { toast("Brief failed", "error"); return; }
      const b = r.data;
      const m = modal({
        title: `Content brief — ${esc(b.primary_keyword)}`,
        body: `
          <div style="font-size:13px;line-height:1.7">
            <p><b>Intent:</b> <span class="chip chip--muted" style="font-size:10.5px">${esc(b.intent)}</span></p>
            <p style="margin-top:8px"><b>Suggested title:</b> ${esc(b.suggested_title)}</p>
            <p><b>H1:</b> ${esc(b.suggested_h1)}</p>
            <p style="margin-top:8px"><b>H2 structure:</b></p>
            <ul style="margin:4px 0 0 18px">${b.suggested_h2.map(h => `<li style="font-size:12.5px">${esc(h)}</li>`).join("")}</ul>
            <p style="margin-top:8px"><b>Questions to answer:</b></p>
            <ul style="margin:4px 0 0 18px">${b.questions.map(q => `<li style="font-size:12.5px">${esc(q)}</li>`).join("")}</ul>
            ${b.secondary_keywords.length ? `<p style="margin-top:8px"><b>Secondary keywords:</b> ${b.secondary_keywords.map(esc).join(", ")}</p>` : ""}
            ${b.existing_related_content.length ? `<p style="margin-top:8px"><b>Related content to link:</b> ${b.existing_related_content.map(x => esc(x.title)).join(", ")}</p>` : `<p style="margin-top:8px;color:var(--ink-3)"><b>Related content:</b> none yet — this is a true content gap.</p>`}
            <p style="margin-top:8px"><b>CTA:</b> ${esc(b.cta)}</p>
            <p style="margin-top:10px;font-size:11.5px;color:var(--ink-4)">${esc(b.note)}</p>
          </div>`,
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    };
    $("[data-brief]", view).addEventListener("click", () => {
      const m = modal({
        title: "Generate a content brief",
        body: `<div class="field"><label>Target keyword</label><input class="f-kw" placeholder="e.g. immersive experience design"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Generate</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", () => {
        const kw = $(".f-kw", m.el).value.trim();
        if (!kw) return;
        m.close();
        showBrief(kw);
      });
    });
    load();
  });

  /* ============ ENGAGEMENT ============ */
  R.register("engagement", () => `
    <div class="view__head">
      <div><h1 class="view__title">Engagement</h1>
      <p class="view__desc">Real first-party events: views, CTA clicks, scroll depth, media interaction. Internal engagement scores — not Google metrics.</p></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card"><div class="card__head"><p class="card__title">Page engagement scores</p></div><div class="card__body" id="engBody"></div></div>
      <div class="card"><div class="card__head"><p class="card__title">CTA performance</p></div><div class="card__body" id="ctaBody"></div></div>
    </div>
    <div class="card"><div class="card__head"><p class="card__title">Conversion funnel</p><span class="chip chip--muted">visitor → client</span></div>
      <div class="card__body" id="funnelBody"></div></div>`);
  R.after("engagement", view => {
    const load = async () => {
      const [e, c, f] = await Promise.all([
        AV.api.get("/api/engagement/score"),
        AV.api.get("/api/engagement/ctas"),
        AV.api.get("/api/engagement/funnel"),
      ]);
      $("#engBody", view).innerHTML = (e.data || []).slice(0, 10).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12.5px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.path)}</span>
          <span style="color:var(--ink-4);font-size:11px">${x.views} views · ${x.cta_clicks} cta</span>
          <b style="width:40px;text-align:right;color:${x.score >= 70 ? "var(--ok)" : x.score >= 35 ? "var(--warn)" : "var(--ink-3)"}">${x.score}</b>
        </div>`).join("") || `<p style="color:var(--ink-3)">No engagement data yet — events fire on the live site.</p>`;
      $("#ctaBody", view).innerHTML = (c.data || []).slice(0, 10).map(x => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12.5px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.page)} → ${esc(x.cta)}</span>
          <span style="color:var(--ink-4);font-size:11px">${x.clicks} clicks · ${x.leads} leads</span>
          <b style="width:52px;text-align:right">${x.conversion_rate}%</b>
        </div>`).join("") || `<p style="color:var(--ink-3)">No CTA clicks recorded yet.</p>`;
      const stages = f.data || [];
      const max = Math.max(1, ...stages.map(x => x.count));
      $("#funnelBody", view).innerHTML = stages.map((x, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:7px 0;font-size:13px">
          <span style="width:120px;color:var(--ink-2)">${esc(x.stage)}</span>
          <div class="prog" style="flex:1"><i style="width:${Math.max(3, x.count / max * 100)}%"></i></div>
          <b style="width:70px;text-align:right">${x.count.toLocaleString()}</b>
          <span style="width:52px;text-align:right;color:${i === 0 ? "var(--ink-3)" : x.rate < 30 ? "var(--warn)" : "var(--ok)"}">${i === 0 ? "—" : x.rate + "%"}</span>
        </div>`).join("");
    };
    load();
  });


  /* ============ AI AGENTS (command center) ============ */
  R.register("aiagents", () => `
    <div class="view__head">
      <div><h1 class="view__title">AI Agents</h1>
      <p class="view__desc">A coordinated 24/7 growth team running on the Hostinger cron. Every agent: real jobs, schedule, permissions, memory, logging, cost tracking.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-refresh>${icon("refresh")} Refresh</button>
        <button class="btn btn--ghost" data-run-cron>${icon("play")} Run cycle now</button>
        <button class="btn btn--danger-soft" data-pause-all>${icon("x", 13)} ${""}PAUSE ALL AI</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card__head"><p class="card__title">AI system</p><span class="chip" id="aiOverall">…</span></div>
      <div class="card__body" id="aiHealth"></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Growth brief</p><span class="chip chip--accent">${icon("spark", 12)} today</span></div>
        <div class="card__body" id="aiBrief"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Autonomous action feed</p></div>
        <div class="card__body" id="aiFeed" style="max-height:260px;overflow-y:auto"></div>
      </div>
    </div>
    <div class="card">
      <div class="card__head"><p class="card__title">Agents</p><span class="chip chip--muted" id="aiAgentCount">—</span></div>
      <div class="card__body" id="agentGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px"></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card__head"><p class="card__title">Job queue</p><button class="btn btn--sm btn--ghost" data-go-jobs>Open logs</button></div>
      <div class="card__body" id="agentJobs" style="max-height:220px;overflow-y:auto"></div>
    </div>`);
  R.after("aiagents", view => {
    let agents = [];
    const load = async () => {
      const r = await AV.api.get("/api/agents");
      if (!r.ok) { toast("Agents API failed", "error"); return; }
      const h = r.data.health;
      agents = r.data.agents || [];
      const chip = $("#aiOverall", view);
      if (h.overall === "healthy") { chip.textContent = "🟢 HEALTHY"; chip.className = "chip chip--ok"; }
      else if (h.overall === "paused") { chip.textContent = "⏸ PAUSED"; chip.className = "chip chip--warn"; }
      else { chip.textContent = "⚠ ATTENTION"; chip.className = "chip chip--danger"; }
      $("#aiHealth", view).innerHTML = `
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          ${[["Agents active", h.agents_active + "/" + h.agents_total], ["Jobs queued", h.jobs_queued], ["Jobs running", h.jobs_running], ["Failed agents", h.agents_failed], ["Daily AI cost", "₹" + Number(h.daily_cost || 0).toFixed(2)], ["Last orchestration", h.last_orchestration ? h.last_orchestration.slice(0, 16).replace("T", " ") : "—"]].map(([k, v]) => `
            <div style="min-width:120px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px">
              <p style="font-size:11px;color:var(--ink-4);text-transform:uppercase;letter-spacing:.08em">${k}</p>
              <p style="font-weight:700;font-size:15px;margin-top:3px">${esc(v)}</p>
            </div>`).join("")}
        </div>
        ${h.paused_scopes.length ? `<p style="margin-top:10px;color:var(--warn);font-size:12.5px">Paused scopes: ${h.paused_scopes.map(esc).join(", ")}</p>` : ""}`;
      $("#aiAgentCount", view).textContent = agents.length + " agents";
      $("#agentGrid", view).innerHTML = agents.map(a => `
        <div style="border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--surface-1)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="status-dot" style="width:9px;height:9px;background:${a.status === "active" ? "var(--ok)" : a.status === "paused" ? "var(--warn)" : "var(--danger)"}"></span>
            <b style="font-size:13.5px">${esc(a.name)}</b>
            <span class="chip ${a.status === "active" ? "chip--ok" : "chip--warn"}" style="font-size:9.5px;margin-left:auto">${esc(a.status)}</span>
          </div>
          <p style="font-size:11.5px;color:var(--ink-3);line-height:1.5;min-height:34px">${esc(a.description)}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
            <span class="chip chip--muted" style="font-size:9.5px">L${a.autonomy}</span>
            <span class="chip chip--muted" style="font-size:9.5px">${esc(a.schedule)}</span>
            <span class="chip chip--muted" style="font-size:9.5px">${a.run_count} runs</span>
            <span class="chip ${a.success_count && a.run_count ? (a.success_count / a.run_count > 0.9 ? "chip--ok" : "chip--warn") : "chip--muted"}" style="font-size:9.5px">${a.run_count ? Math.round(a.success_count / a.run_count * 100) + "% ok" : "—"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-4)">
            <span>last ${esc((a.last_run || "—").slice(0, 16).replace("T", " "))}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn--sm btn--soft" data-run="${a.slug}">${icon("play", 11)}</button>
              <button class="btn btn--sm btn--ghost" data-toggle="${a.slug}" data-name="${esc(a.name)}" title="${a.enabled ? "Disable" : "Enable"}">${icon(a.enabled ? "x" : "check", 11)}</button>
            </div>
          </div>
          ${a.last_error ? `<p style="font-size:10.5px;color:var(--danger);margin-top:6px">${esc(a.last_error.slice(0, 80))}</p>` : ""}
        </div>`).join("");
      $$("[data-run]", view).forEach(b => b.addEventListener("click", async () => {
        const r = await AV.api.send("/api/agents/" + b.dataset.run + "/run", "POST", {});
        if (r.ok) { toast("Agent ran — job #" + (r.data.job || "?")); load(); loadJobs(); loadFeed(); }
        else toast(r.error && r.error.message ? r.error.message : "Run failed", "error");
      }));
      $$("[data-toggle]", view).forEach(b => b.addEventListener("click", async () => {
        const a = agents.find(x => x.slug === b.dataset.toggle);
        const r = await AV.api.send("/api/agents/" + a.slug, "PUT", { enabled: a.enabled ? 0 : 1 });
        if (r.ok) { toast(a.enabled ? a.name + " disabled" : a.name + " enabled"); load(); }
      }));
      loadBrief();
      loadFeed();
      loadJobs();
    };
    const loadBrief = async () => {
      const r = await AV.api.get("/api/agents/brief");
      if (!r.ok) return;
      const b = r.data;
      $("#aiBrief", view).innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          ${[["Traffic", (b.website.traffic_delta_pct >= 0 ? "+" : "") + b.website.traffic_delta_pct + "%"], ["Leads today", b.website.leads_today], ["SEO score", b.seo.score], ["Agents", b.agents.active + "/" + b.agents.total], ["Jobs 24h", b.agents.jobs_completed_24h + (b.agents.jobs_failed_24h ? " (" + b.agents.jobs_failed_24h + " failed)" : "")]].map(([k, v]) => `
          <div style="min-width:86px;padding:8px 12px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;text-align:center">
            <p style="font-size:10px;color:var(--ink-4)">${k}</p><p style="font-weight:700;font-size:14px">${esc(v)}</p>
          </div>`).join("")}
        </div>
        <p style="font-size:12.5px;color:var(--ink-3)">Top recommendation:</p>
        <p style="font-weight:600;font-size:13.5px;margin-top:3px">${esc(b.top_recommendation || "—")}</p>
        <div style="margin-top:8px">${(b.recommendations || []).map(x => `<p style="font-size:12px;color:var(--ink-3);padding:2px 0">• ${esc(x)}</p>`).join("")}</div>`;
    };
    const loadFeed = async () => {
      const r = await AV.api.get("/api/agents/memory?limit=10");
      $("#aiFeed", view).innerHTML = (r.data || []).map(m => `
        <div style="padding:7px 0;border-bottom:1px solid var(--line);font-size:12px">
          <span class="chip chip--muted" style="font-size:9.5px">${esc(m.agent_slug)}</span>
          <span style="color:var(--ink-4);font-size:11px">${esc((m.created_at || "").slice(11, 19))}</span>
          <p style="margin-top:3px;color:var(--ink-2)">${esc(m.observation)}</p>
          <p style="color:var(--accent);font-size:11.5px">→ ${esc(m.decision)}</p>
        </div>`).join("") || `<p style="color:var(--ink-3);font-size:12px">No agent memory yet — agents record observations as they run.</p>`;
    };
    const loadJobs = async () => {
      const r = await AV.api.get("/api/agents/jobs?limit=12");
      $("#agentJobs", view).innerHTML = (r.data || []).map(j => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px">
          <span class="chip ${j.status === "completed" ? "chip--ok" : j.status === "failed" ? "chip--danger" : j.status === "running" ? "chip--accent" : "chip--muted"}" style="font-size:9.5px">${esc(j.status)}</span>
          <b>${esc(j.agent_slug)}</b>
          <span style="flex:1;color:var(--ink-4);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(j.error || "")}</span>
          <span style="color:var(--ink-4);font-size:11px">${esc((j.created_at || "").slice(11, 19))}</span>
        </div>`).join("") || `<p style="color:var(--ink-3);font-size:12px">No jobs yet.</p>`;
    };
    $("[data-refresh]", view).addEventListener("click", load);
    $("[data-run-cron]", view).addEventListener("click", async () => {
      toast("Triggering the agent runner cycle…", "accent");
      const r = await AV.api.send("/api/agents/orchestrator/run", "POST", {});
      load();
    });
    $("[data-pause-all]", view).addEventListener("click", async () => {
      const cur = await AV.api.get("/api/agents/settings");
      const paused = (cur.data && cur.data.paused_scopes) || [];
      const allPaused = paused.includes("all");
      const r = await AV.api.send("/api/agents/pause", "POST", { scopes: allPaused ? [] : ["all"] });
      if (r.ok) { toast(allPaused ? "All agents RESUMED" : "PAUSE ALL AI — new autonomous actions stopped", allPaused ? "ok" : "error"); load(); }
    });
    load();
  });

})();
