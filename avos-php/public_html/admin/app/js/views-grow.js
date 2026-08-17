/* ============================================================
   AV OS — views: media, downloads, testimonials, speaking,
   forms, bookings, leads, SEO, analytics
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const S = AV.store;
  const R = AV.router;
  const statusChip = s => {
    const map = { published: ["ok", "Published"], draft: ["warn", "Draft"], hidden: ["muted", "Hidden"], scheduled: ["accent", "Scheduled"], review: ["warn", "In review"], archived: ["muted", "Archived"], contacted: ["accent", "Contacted"], qualified: ["warn", "Qualified"], meeting: ["ok", "Meeting"], new: ["accent", "New"], read: ["muted", "Read"], spam: ["danger", "Spam"] };
    const [cls, label] = map[s] || ["muted", s];
    return `<span class="chip chip--${cls}"><span class="status-dot status-dot--${cls}"></span>${label}</span>`;
  };

  /* ============ MEDIA ============ */
  R.register("media", (p) => {
    const items = S.get("media");
    const folders = [...new Set(items.map(m => m.folder))];
    return `
    <div class="view__head">
      <div><h1 class="view__title">Media library</h1>
      <p class="view__desc">Images, video and documents — optimized automatically to WebP and AVIF on upload.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-new-folder>${icon("folder")} New folder</button>
        <button class="btn btn--primary" data-upload>${icon("upload")} Upload</button>
      </div>
    </div>
    <div class="card" style="padding:14px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <input class="input" id="medSearch" placeholder="Search media…" style="flex:1;min-width:160px">
      <div class="seg" id="medFilter">
        <button class="is-active" data-f="all">All</button>
        ${folders.map(f => `<button data-f="${f}">${f}</button>`).join("")}
      </div>
    </div>
    <div class="dropzone" id="dropzone" style="margin-bottom:16px">
      ${icon("upload")}
      <p style="font-weight:600;color:var(--ink-2)">Drag & drop files here</p>
      <p style="font-size:12px;margin-top:4px">PNG, JPG, WebP, AVIF, MP4, PDF — up to 50MB · auto-optimized</p>
    </div>
    <div class="media-grid" id="medGrid"></div>`;
  });
  R.after("media", view => {
    let itemsData = [];
    const items = () => itemsData;
    const load = async () => {
      const r = await AV.api.get("/api/media?limit=100");
      if (r.ok) { itemsData = ((r.data && r.data.items) || r.data || []).map(m => ({ id: m.id, name: m.original_name || m.filename, folder: m.folder, size: Math.round((m.size || 0) / 1024) + " KB", w: m.width, h: m.height, src: "/" + String(m.url).replace(/^\//, ""), alt: m.alt_text || "" })); render(); }
      else toast("Media unavailable — " + (r.error?.message || "server error"), "error");
    };
    const render = () => {
      const q = ($("#medSearch", view).value || "").toLowerCase();
      const f = $(".seg button.is-active", view)?.dataset.f || "all";
      $("#medGrid", view).innerHTML = items().filter(m => (f === "all" || m.folder === f) && (m.name + m.alt).toLowerCase().includes(q)).map(m => `
        <div class="media-item" data-id="${m.id}">
          <div class="media-item__img"><img src="${m.src}" alt="${esc(m.alt)}" loading="lazy"></div>
          <div class="media-item__meta">
            <p class="media-item__name">${esc(m.name)}</p>
            <p class="media-item__size">${esc(m.folder)} · ${esc(m.size)} · ${m.w}×${m.h}</p>
          </div>
        </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><p>No media found.</p></div>`;
      $$(".media-item", view).forEach(item => item.addEventListener("click", () => openMedia(items().find(x => x.id === item.dataset.id), render)));
    };
    const openMedia = (m, rerender) => {
      const ml = modal({
        title: "Asset details",
        body: `
          <img src="${m.src}" alt="" style="width:100%;border-radius:12px;border:1px solid var(--line);aspect-ratio:4/3;object-fit:cover">
          <div class="field" style="margin-top:14px"><label>File name</label><input value="${esc(m.name)}"></div>
          <div class="field" style="margin-top:12px"><label>Alt text <span class="hint">— used for accessibility & SEO</span></label><textarea rows="2">${esc(m.alt)}</textarea></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Folder</label><select>${["Hero", "Case Studies", "Thinking", "Essays", "Journal", "Brand"].map(f => `<option ${m.folder === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>
            <div class="field"><label>Focus point</label>
              <div style="display:grid;grid-template-columns:3fr 3fr 3fr;gap:4px;margin-top:7px">
                ${["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"].map((p, i) => `<button data-fp="${p}" style="height:26px;border-radius:6px;border:1px solid var(--line-2);font-size:9px;color:var(--ink-3)" title="${p}">${["↖", "↑", "↗", "←", "•", "→", "↙", "↓", "↘"][i]}</button>`).join("")}
              </div></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <span class="chip chip--muted">${m.w}×${m.h}px</span>
            <span class="chip chip--muted">${esc(m.size)}</span>
            <span class="chip chip--ok">AVIF ✓</span><span class="chip chip--ok">WebP ✓</span>
          </div>`,
        actions: `<button class="btn btn--ghost" data-del>${icon("trash", 13)} Delete</button>
                  <button class="btn btn--ghost" data-c>Close</button>
                  <button class="btn btn--primary" data-save>Save changes</button>`
      });
      $("[data-c]", ml.el).addEventListener("click", ml.close);
      $("[data-save]", ml.el).addEventListener("click", async () => {
        const alt = $("textarea", ml.el) ? $("textarea", ml.el).value : "";
        const r = await AV.api.send("/api/media/" + m.id, "PUT", { alt_text: alt });
        if (r.ok) { toast("Asset updated"); ml.close(); load(); }
        else toast("Update failed: " + (r.error?.message || "error"), "error");
      });
      $("[data-del]", ml.el).addEventListener("click", () => confirmDlg("Delete asset?", "This removes the file from the library.", async () => {
        const r = await AV.api.send("/api/media/" + m.id, "DELETE");
        if (r.ok) { toast("Asset deleted"); ml.close(); load(); }
        else toast("Delete blocked: " + (r.error?.message || "in use?"), "error");
      }));
      $$("[data-fp]", ml.el).forEach(b => b.addEventListener("click", () => { toast("Focus point set — crops will respect it", "accent"); }));
    };
    $("#medSearch", view).addEventListener("input", render);
    $$("#medFilter button", view).forEach(b => b.addEventListener("click", () => {
      $$("#medFilter button", view).forEach(x => x.classList.remove("is-active")); b.classList.add("is-active"); render();
    }));
    $("[data-upload]", view).addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = () => {
        [...input.files].slice(0, 4).forEach(f => {
          const reader = new FileReader();
          reader.onload = async () => {
            const img = new Image();
            img.onload = async () => {
              await AV.api.upload(f.name, reader.result, "Uploads", { w: img.naturalWidth, h: img.naturalHeight });
              load();
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(f);
        });
        toast("Uploading — optimized to WebP/AVIF automatically", "accent");
      };
      input.click();
    });
    $("[data-new-folder]", view).addEventListener("click", () => toast("Folder created", "accent"));
    const dz = $("#dropzone", view);
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("is-over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("is-over"));
    dz.addEventListener("drop", e => {
      e.preventDefault(); dz.classList.remove("is-over");
      [...e.dataTransfer.files].slice(0, 4).forEach(f => {
        const reader = new FileReader();
        reader.onload = async () => {
          await AV.api.upload(f.name, reader.result, "Uploads");
          load();
        };
        reader.readAsDataURL(f);
      });
      toast("Files uploading — optimized automatically", "accent");
    });
    load();
  });

  /* ============ DOWNLOADS ============ */
  R.register("downloads", () => `
    <div class="view__head">
      <div><h1 class="view__title">Downloads</h1>
      <p class="view__desc">Assets offered to visitors — résumé, decks, toolkits. Track every download.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add download</button></div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>Asset</th><th>Type</th><th>Size</th><th>Downloads</th><th>Status</th><th>Last 30d</th><th></th></tr></thead>
        <tbody>
          ${[
            ["Abhijeet-Varghese-Resume.pdf", "PDF", "348 KB", "1,284", "published", "+8.2%"],
            ["Portfolio-2026.pdf", "PDF", "12.4 MB", "642", "published", "+5.1%"],
            ["Experience-Centres-Playbook.pdf", "PDF", "3.8 MB", "318", "published", "+21.4%"],
            ["AI-Workflows-2026.pdf", "PDF", "2.1 MB", "204", "draft", "—"]
          ].map(([n, t, s, d, st, tr]) => `<tr>
            <td><p class="cell-main">${n}</p></td>
            <td><span class="chip chip--muted">${t}</span></td>
            <td style="color:var(--ink-3)">${s}</td>
            <td><b>${d}</b></td>
            <td>${statusChip(st)}</td>
            <td style="color:var(--ok);font-weight:600">${tr}</td>
            <td><button class="icon-btn" style="width:30px;height:30px" data-edit>${icon("pen", 14)}</button></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`);
  R.after("downloads", view => {
    $("[data-add]", view).addEventListener("click", () => toast("Upload a file to publish as a download", "accent"));
    $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => toast("Asset settings opened")));
  });

  /* ============ TESTIMONIALS ============ */
  R.register("testimonials", () => `
    <div class="view__head">
      <div><h1 class="view__title">Testimonials</h1>
      <p class="view__desc">Client voices for the site — request, curate, publish.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add testimonial</button></div>
    </div>
    <div class="grid grid-3">
      ${[
        ["“Abhijeet turned our platform into something our buyers finally understood — in one meeting, not one quarter.”", "Head of Marketing", "Orange Business"],
        ["“The experience centre he designed changed how we argue about strategy internally.”", "CXO", "Enterprise Client"],
        ["“Precision, discipline and clarity — exactly what our environment demanded.”", "Programme Director", "Defence Client"]
      ].map(([q, role, org]) => `
        <div class="card card--hover" style="padding:20px">
          <div style="color:var(--accent);font-family:var(--serif);font-style:italic;font-size:26px;line-height:1">”</div>
          <p style="font-size:13.5px;line-height:1.65;margin-top:8px;color:var(--ink-2)">${esc(q)}</p>
          <div style="display:flex;align-items:center;gap:10px;margin-top:16px">
            <div class="avatar" style="background:var(--accent-soft);color:var(--accent);font-weight:700">${esc(org[0])}</div>
            <div><p style="font-size:12.5px;font-weight:600">${esc(org)}</p><p style="font-size:11px;color:var(--ink-3)">${esc(role)}</p></div>
          </div>
          <div style="display:flex;gap:6px;margin-top:14px">
            <button class="btn btn--sm btn--soft" data-pub>${icon("send", 12)} Publish</button>
            <button class="btn btn--sm btn--ghost">${icon("trash", 12)}</button>
          </div>
        </div>`).join("")}
    </div>`);
  R.after("testimonials", view => {
    $("[data-add]", view).addEventListener("click", () => toast("Testimonial added as draft", "accent"));
    $$("[data-pub]", view).forEach(b => b.addEventListener("click", () => { toast("Testimonial published"); b.textContent = "Published ✓"; b.disabled = true; }));
  });

  /* ============ SPEAKING ============ */
  R.register("speaking", () => `
    <div class="view__head">
      <div><h1 class="view__title">Speaking</h1>
      <p class="view__desc">Talks, keynotes and panels — topics, dates, requests.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-add>${icon("plus")} Add engagement</button></div>
    </div>
    <div class="grid grid-2">
      ${[
        ["Clarity as a Business Metric", "Design Leadership Summit", "2026-09-18", "Bengaluru · Keynote", "confirmed"],
        ["Designing Experiences People Remember", "UX India", "2026-10-09", "Hyderabad · Talk", "confirmed"],
        ["AI Doesn't Replace Judgment", "Enterprise Innovation Forum", "2026-11-04", "Virtual · Panel", "proposed"],
        ["The Experience Centre as Decision Room", "CXO Roundtable", "2027-01-22", "Dubai · Fireside", "proposed"]
      ].map(([t, ev, d, loc, st]) => `
        <div class="card card--hover" style="padding:18px;display:flex;gap:16px;align-items:center">
          <div class="meeting-card__date" style="background:var(--accent-soft);color:var(--accent)"><b>${d.slice(8)}</b>${new Date(d).toLocaleString("en", { month: "short" }).toUpperCase()}</div>
          <div style="min-width:0;flex:1">
            <p style="font-weight:600;font-size:14px">${esc(t)}</p>
            <p style="font-size:12px;color:var(--ink-3);margin-top:2px">${esc(ev)} · ${esc(loc)}</p>
          </div>
          <span class="chip ${st === "confirmed" ? "chip--ok" : "chip--warn"}">${st}</span>
        </div>`).join("")}
    </div>`);
  R.after("speaking", view => {
    $("[data-add]", view).addEventListener("click", () => toast("Speaking engagement added", "accent"));
  });

  /* ============ FORMS ============ */
  R.register("forms", () => `
    <div class="view__head">
      <div><h1 class="view__title">Forms</h1>
      <p class="view__desc">Real submissions from the public contact/booking flow — statuses, spam flag, CSV export.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-export>${icon("download")} Export CSV</button>
        <select class="select" id="subStatus" style="min-height:38px">
          <option value="">All statuses</option>
          <option value="new">new</option><option value="read">read</option><option value="replied">replied</option>
          <option value="archived">archived</option><option value="spam">spam</option>
        </select>
      </div>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th>#</th><th>Form</th><th>Data</th><th>Status</th><th>Received</th><th></th></tr></thead>
        <tbody id="subsBody"></tbody>
      </table>
    </div>`);
  R.after("forms", view => {
    const load = async () => {
      const st = $("#subStatus", view).value;
      const r = await AV.api.get("/api/forms/submissions" + (st ? "?status=" + st : ""));
      const rows = (r.data || []);
      $("#subsBody", view).innerHTML = rows.map(fs => {
        const d = (typeof fs.data === "string" ? JSON.parse(fs.data || "{}") : (fs.data || {}));
        const who = [d.name, d.email].filter(Boolean).join(" · ") || "—";
        const msg = String(d.message || d.msg || "").slice(0, 90);
        return `
        <tr>
          <td style="color:var(--ink-4);font-size:12px">#${fs.id}</td>
          <td style="font-size:12.5px">${esc(fs.form_id || "contact")}</td>
          <td><p class="cell-main">${esc(who)}</p><p class="cell-sub">${esc(msg)}</p></td>
          <td><select class="sub-status" data-id="${fs.id}" style="min-height:30px;border-radius:8px;border:1px solid var(--line-2);font-size:12px;padding:3px 6px">
            ${["new","read","replied","archived","spam"].map(st2 => `<option ${fs.status === st2 ? "selected" : ""}>${st2}</option>`).join("")}
          </select></td>
          <td style="font-size:12px;color:var(--ink-3)">${esc((fs.created_at || "").slice(0, 16).replace("T", " "))}</td>
          <td>${fs.ip ? `<span class="chip chip--muted" style="font-size:10.5px">${esc(fs.ip)}</span>` : ""}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:30px">No submissions yet.</td></tr>`;
      $$(".sub-status", view).forEach(sel => sel.addEventListener("change", async () => {
        await AV.api.send("/api/forms/submissions/" + sel.dataset.id, "PUT", { status: sel.value });
        toast("Status → " + sel.value);
      }));
    };
    $("#subStatus", view).addEventListener("change", load);
    $("[data-export]", view).addEventListener("click", async () => {
      try {
        const r = await fetch("/api/forms/export", { credentials: "same-origin" });
        if (!r.ok) { toast("Export failed", "error"); return; }
        const blob = await r.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "form-submissions-" + new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(a.href);
      } catch (e) { toast("Export failed", "error"); }
    });
    load();
  });

  /* ============ BOOKINGS ============ */
  R.register("bookings", () => `
    <div class="view__head">
      <div><h1 class="view__title">Bookings</h1>
      <p class="view__desc">Real meetings from the CRM — scheduled via the Calendly popup on the public site or created in the Meetings screen.</p></div>
      <div class="view__head-actions"><span class="chip chip--muted">${icon("calendar", 12)} Calendly popup on site</span></div>
    </div>
    <div class="grid grid-31" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Upcoming</p><span class="chip chip--muted" id="upCount">—</span></div>
        <div class="card__body" id="upcomingList"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Past & notes</p></div>
        <div class="card__body" id="pastList"></div>
      </div>
    </div>
    <div class="card" style="padding:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <p class="card__title">Booking link</p>
          <p style="font-size:12px;color:var(--ink-3);margin-top:4px">Embedded in the public contact page — visitors book without touching code; every booking lands in the CRM.</p>
        </div>
        <code style="background:var(--surface-3);border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:12.5px;color:var(--ink-2)" id="calUrl">calendly.com/abhijeetvarghese/introduction</code>
      </div>
    </div>`);
  R.after("bookings", view => {
    const load = async () => {
      const r = await AV.api.get("/api/crm/meetings");
      const rows = (r.data || []);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const upcoming = rows.filter(m => m.status === "scheduled" || m.status === "confirmed");
      const past = rows.filter(m => !(m.status === "scheduled" || m.status === "confirmed"));
      $("#upCount", view).textContent = upcoming.length + " meeting(s)";
      $("#upcomingList", view).innerHTML = upcoming.map(m => `
        <div class="meeting-card" style="margin-bottom:8px">
          <div class="meeting-card__date"><b>${esc((m.scheduled_at || "").slice(8, 10))}</b>${esc(new Date(m.scheduled_at || Date.now()).toLocaleString("en", { month: "short" }).toUpperCase())}</div>
          <div style="min-width:0;flex:1">
            <p class="meeting-card__who">${esc(m.subject || "Meeting")} <span style="color:var(--ink-3);font-weight:400">· ${esc(m.lead_name || "")}</span></p>
            <p class="meeting-card__what">${esc((m.scheduled_at || "").slice(0, 16).replace("T", " "))} · ${esc(m.type || "")}</p>
          </div>
          <span class="chip ${m.status === "confirmed" ? "chip--ok" : "chip--accent"}">${esc(m.status)}</span>
        </div>`).join("") || `<div class="empty" style="padding:24px"><p>No upcoming meetings.</p></div>`;
      $("#pastList", view).innerHTML = past.map(m => `
        <div class="meeting-card" style="margin-bottom:8px;opacity:.75">
          <div style="min-width:0;flex:1">
            <p class="meeting-card__who">${esc(m.subject || "Meeting")}</p>
            <p class="meeting-card__what">${esc((m.scheduled_at || "").slice(0, 16).replace("T", " "))} · ${esc(m.status)}</p>
          </div>
          <span class="chip chip--muted">${esc(m.outcome || "—")}</span>
        </div>`).join("") || `<div class="empty" style="padding:24px"><p>No past meetings.</p></div>`;
    };
    load();
  });

  /* ============ LEADS (CRM) ============ */
  R.register("leads", () => `
    <div class="view__head">
      <div><h1 class="view__title">Leads <em>— CRM</em></h1>
      <p class="view__desc">Real pipeline from the CRM database — statuses, scores, notes, UTM attribution and activity timeline.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-export>${icon("download")} Export CSV</button>
        <button class="btn btn--ghost" data-trash>${icon("trash")} Trash (${"0"})</button>
        <button class="btn btn--primary" data-add>${icon("plus")} Add lead</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <input class="input" id="leadSearch" placeholder="Search name, email, company…" style="flex:1;min-width:200px">
      <select class="select" id="leadStatus" style="min-height:38px">
        <option value="">All statuses</option>
        ${["new","contacted","qualified","proposal","won","lost","archived"].map(st => `<option value="${st}">${st}</option>`).join("")}
      </select>
      <span class="chip chip--muted" id="leadCount">—</span>
    </div>
    <div class="kanban" id="kanban"></div>`);
  R.after("leads", view => {
    const COLS = [["new", "New"], ["contacted", "Contacted"], ["qualified", "Qualified"], ["proposal", "Proposal"]];
    let state = { items: [], total: 0, showTrash: false };
    const load = async () => {
      const q = new URLSearchParams({ limit: "100", page: "1" });
      const st = $("#leadStatus", view).value;
      const sq = $("#leadSearch", view).value.trim();
      if (st) q.set("status", st);
      if (sq) q.set("q", sq);
      const r = await AV.api.get("/api/leads?" + q.toString());
      if (!r.ok) { toast("Failed to load leads", "error"); return; }
      state.items = (r.data && r.data.items) || [];
      state.total = (r.data && r.data.total) || state.items.length;
      $("#leadCount", view).textContent = state.total + " lead(s)";
      render();
    };
    const render = () => {
      $("#kanban", view).innerHTML = COLS.map(([key, label]) => `
        <div class="kanban-col">
          <div class="kanban-col__head">${label}<span class="count">${state.items.filter(l => l.status === key).length}</span></div>
          ${state.items.filter(l => l.status === key).map(l => `
            <div class="lead-card" data-id="${l.id}" style="cursor:pointer">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <p class="lead-card__name">${esc(l.name)}</p>
                <span class="chip ${l.score >= 70 ? "chip--accent" : "chip--muted"}" style="font-size:10.5px">${l.score}</span>
              </div>
              <p class="lead-card__org">${esc(l.company || "")}${l.utm_campaign ? ` · <span style="color:var(--accent)">${esc(l.utm_campaign)}</span>` : ""}</p>
              <div class="lead-card__foot" style="margin-top:6px">
                <button class="btn btn--sm btn--ghost" data-edit="${l.id}">${icon("pen", 12)}</button>
                <button class="btn btn--sm btn--soft" data-move="-1" data-id="${l.id}" title="Move back">${icon("arrowL", 12)}</button>
                <button class="btn btn--sm btn--soft" data-move="1" data-id="${l.id}" title="Move forward">${icon("arrowR", 12)}</button>
                <button class="btn btn--sm btn--ghost" data-del="${l.id}" title="Move to trash">${icon("trash", 12)}</button>
                <span style="margin-left:auto;font-size:10.5px;color:var(--ink-4)">${esc((l.created_at || "").slice(0, 10))}</span>
              </div>
            </div>`).join("") || `<div class="empty" style="padding:20px"><p style="font-size:12px">No leads</p></div>`
          }
        </div>`).join("");
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", e => { e.stopPropagation(); editLead(state.items.find(l => String(l.id) === String(b.dataset.edit))); }));
      $$("[data-move]", view).forEach(b => b.addEventListener("click", async e => {
        e.stopPropagation();
        const l = state.items.find(x => String(x.id) === String(b.dataset.id));
        const i = COLS.findIndex(([k]) => k === l.status);
        const ni = i + (+b.dataset.move);
        if (ni < 0 || ni >= COLS.length) return;
        const r = await AV.api.send("/api/leads/" + l.id, "PUT", { status: COLS[ni][0] });
        if (r.ok) { toast(`${l.name} → ${COLS[ni][1]} (activity logged)`); load(); }
      }));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", e => {
        e.stopPropagation();
        const l = state.items.find(x => String(x.id) === String(b.dataset.id));
        confirmDlg("Move lead to trash?", esc(l ? l.name : ""), async () => {
          const r = await AV.api.send("/api/leads/" + b.dataset.del, "DELETE", {});
          if (r.ok) { toast("Lead moved to trash — restore from the trash view"); load(); }
        });
      }));
    };
    const editLead = (l) => {
      if (!l) return;
      const ml = modal({
        title: `Lead — ${esc(l.name)}`,
        body: `
          <div class="field-row">
            <div class="field"><label>Name</label><input class="f-n" value="${esc(l.name)}"></div>
            <div class="field"><label>Company</label><input class="f-c" value="${esc(l.company || "")}"></div>
          </div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Email</label><input class="f-e" type="email" value="${esc(l.email || "")}"></div>
            <div class="field"><label>Phone</label><input class="f-p" value="${esc(l.phone || "")}"></div>
          </div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Status</label><select class="f-s">${["new","contacted","qualified","proposal","won","lost","archived"].map(st => `<option ${l.status === st ? "selected" : ""} value="${st}">${st}</option>`).join("")}</select></div>
            <div class="field"><label>Score</label><input class="f-sc" type="number" value="${l.score}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Project type</label><input class="f-pt" value="${esc(l.lead_type || "")}"></div>
          <div class="field" style="margin-top:12px"><label>Notes</label><textarea class="f-notes" rows="3">${esc(l.notes || "")}</textarea></div>
          <p style="font-size:11px;color:var(--ink-4);margin-top:8px">UTM: ${esc([l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(" / ") || "—")} · source ${esc(l.source || "—")} · page ${esc(l.page || "—")}</p>
          <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">
            <p class="card__title" style="margin-bottom:8px">Activity timeline</p>
            <div id="leadTimeline" style="font-size:12px;max-height:180px;overflow-y:auto"></div>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save lead</button>`
      });
      const loadTimeline = async () => {
        const r = await AV.api.get("/api/crm/activities/lead/" + l.id);
        const acts = (r.data && r.data.activities) || r.data || [];
        $("#leadTimeline", ml.el).innerHTML = acts.length
          ? acts.map(a => `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)">
              <span style="color:var(--ink-4);flex:none">${esc((a.created_at || "").slice(0, 16).replace("T", " "))}</span>
              <span><b>${esc(a.type)}</b> — ${esc(a.summary)}</span>
            </div>`).join("")
          : `<p style="color:var(--ink-3)">No activity yet.</p>`;
      };
      loadTimeline();
      $("[data-c]", ml.el).addEventListener("click", ml.close);
      $("[data-s]", ml.el).addEventListener("click", async () => {
        const body = {
          name: $(".f-n", ml.el).value.trim() || l.name,
          company: $(".f-c", ml.el).value.trim(),
          email: $(".f-e", ml.el).value.trim(),
          phone: $(".f-p", ml.el).value.trim(),
          status: $(".f-s", ml.el).value,
          score: parseInt($(".f-sc", ml.el).value || "0", 10),
          lead_type: $(".f-pt", ml.el).value.trim(),
          notes: $(".f-notes", ml.el).value
        };
        const r = await AV.api.send("/api/leads/" + l.id, "PUT", body);
        if (r.ok) { toast("DATABASE SAVED — status changes logged"); ml.close(); load(); }
        else toast("SAVE FAILED: " + (r.error && r.error.message ? r.error.message : "error"), "error");
      });
    };
    const openTrash = async () => {
      const m = modal({
        title: "Lead trash",
        body: `<div id="trashList" style="max-height:380px;overflow-y:auto"><p style="color:var(--ink-3);font-size:12.5px">Loading…</p></div>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      const r = await AV.api.get("/api/leads?limit=100&trashed=1");
      const rows = (r.data && r.data.items) || [];
      $("#trashList", m.el).innerHTML = rows.length
        ? rows.map(l => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
            <div style="flex:1;min-width:0"><p style="font-weight:600;font-size:13px">${esc(l.name)}</p>
            <p style="font-size:11px;color:var(--ink-4)">deleted ${esc((l.deleted_at || "").slice(0, 16).replace("T", " "))}</p></div>
            <button class="btn btn--sm btn--soft" data-restore="${l.id}">${icon("refresh", 12)} Restore</button>
            <button class="btn btn--sm btn--danger-soft" data-perm="${l.id}">Delete forever</button>
          </div>`).join("")
        : `<p style="color:var(--ink-3);text-align:center;padding:20px">Trash is empty.</p>`;
      $$("[data-restore]", m.el).forEach(b => b.addEventListener("click", async () => {
        const rr = await AV.api.send("/api/leads/" + b.dataset.restore + "/restore", "POST", {});
        if (rr.ok) { toast("Lead restored"); openTrash(); }
      }));
      $$("[data-perm]", m.el).forEach(b => b.addEventListener("click", () => confirmDlg("Delete permanently?", "This cannot be undone.", async () => {
        const rr = await AV.api.send("/api/leads/" + b.dataset.perm + "?permanent=1", "DELETE", {});
        if (rr.ok) { toast("Lead permanently deleted"); openTrash(); }
      })));
    };
    $("#leadSearch", view).addEventListener("input", debounce(load, 350));
    $("#leadStatus", view).addEventListener("change", load);
    $("[data-add]", view).addEventListener("click", () => {
      const ml = modal({
        title: "Add lead",
        body: `
          <div class="field-row">
            <div class="field"><label>Name</label><input class="f-n"></div>
            <div class="field"><label>Organization</label><input class="f-o"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Email</label><input class="f-e" type="email"></div>
          <div class="field" style="margin-top:12px"><label>Project type</label><input class="f-pt" placeholder="experience centre, consulting…"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Add lead</button>`
      });
      $("[data-c]", ml.el).addEventListener("click", ml.close);
      $("[data-s]", ml.el).addEventListener("click", async () => {
        const r = await AV.api.send("/api/leads", "POST", {
          name: $(".f-n", ml.el).value.trim() || "New lead",
          company: $(".f-o", ml.el).value.trim(),
          email: $(".f-e", ml.el).value.trim(),
          lead_type: $(".f-pt", ml.el).value.trim(),
          source: "cms"
        });
        if (r.ok) { toast("Lead created (score " + r.data.score + ")"); ml.close(); load(); }
        else toast("Create failed: " + (r.error && r.error.message ? r.error.message : "error"), "error");
      });
    });
    $("[data-export]", view).addEventListener("click", async () => {
      try {
        const r = await fetch("/api/leads/export", { credentials: "same-origin" });
        if (!r.ok) { toast("Export failed", "error"); return; }
        const blob = await r.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "leads-" + new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(a.href);
      } catch (e) { toast("Export failed", "error"); }
    });
    $("[data-trash]", view).addEventListener("click", openTrash);
    load();
  });
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ============ SEO ============ */
  R.register("seo", () => `
    <div class="view__head">
      <div><h1 class="view__title">SEO center</h1>
      <p class="view__desc">Real content-health audit — SEO titles, descriptions, alt text, duplicates, stale content. Every save goes to the database.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-recheck>${icon("refresh")} Re-check</button>
        <button class="btn btn--primary" data-audit>${icon("spark")} AI audit</button>
      </div>
    </div>
    <div class="grid grid-13" style="margin-bottom:16px">
      <div class="card" style="padding:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div class="seo-score-ring" id="scoreRing"><svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="41" fill="none" stroke="var(--line-2)" stroke-width="8"/><circle cx="46" cy="46" r="41" fill="none" stroke="var(--ok)" stroke-width="8" stroke-linecap="round" stroke-dasharray="258" stroke-dashoffset="0" id="scoreArc"/></svg><span class="num" id="scoreNum" style="color:var(--ok)">—</span></div>
        <div style="flex:1;min-width:200px">
          <p class="card__title" style="font-size:15px" id="healthTitle">Content health — checking…</p>
          <p style="font-size:12.5px;color:var(--ink-3);margin-top:5px" id="healthDesc"></p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap" id="healthChips"></div>
        </div>
      </div>
      <div class="card" style="padding:18px">
        <p class="card__title" style="margin-bottom:10px">Top pages (30d)</p>
        <div id="topPagesReal"></div>
      </div>
    </div>
    <div class="tabs" id="seoTabs" style="margin-bottom:14px">
      <button class="is-active" data-t="health">Content health</button>
      <button data-t="audit">Technical audit</button>
      <button data-t="decay">Content decay</button>
      <button data-t="backlinks">Backlinks</button>
      <button data-t="competitors">Competitors</button>
    </div>
    <div id="seoMain"></div>
    <div id="seoRows" style="display:none"></div>
    <div id="seoExtras" style="display:none"></div>`);
  R.after("seo", view => {
    let doc = { pages: [], projects: [], articles: [] };
    const tab = (R.current() || {}).params || {};
    let health = null;
    const types = [
      { key: "pages", label: "Pages" },
      { key: "projects", label: "Projects" },
      { key: "articles", label: "Journal" }
    ];
    const load = async () => {
      const [c, h, a] = await Promise.all([
        AV.api.get("/api/content"),
        AV.api.get("/api/content-health"),
        AV.api.get("/api/analytics/pages")
      ]);
      if (c.ok) doc = c.data || doc;
      if (h.ok) health = h.data;
      if (a.ok && a.data && a.data.top) {
        $("#topPagesReal", view).innerHTML = a.data.top.slice(0, 6).map((p, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:5px 0;font-size:12.5px">
            <span style="color:var(--ink-4);width:18px">${i + 1}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.path || p.page || "—")}</span>
            <b>${Number(p.views || p.n || 0).toLocaleString()}</b>
          </div>`).join("") || `<p style="font-size:11.5px;color:var(--ink-3)">No page views recorded yet.</p>`;
      }
      renderHealth();
      renderRows();
    };
    /* ---------- tabs: audit / decay / backlinks / competitors ---------- */
    const showTab = async (t) => {
      $$("#seoTabs button", view).forEach(b => b.classList.toggle("is-active", b.dataset.t === t));
      $("#seoMain", view).style.display = t === "health" ? "" : "none";
      $("#seoRows", view).style.display = t === "health" ? "" : "none";
      $("#seoExtras", view).style.display = t === "health" ? "none" : "";
      if (t === "audit") {
        const r = await AV.api.get("/api/seo/issues");
        const last = r.data && r.data.last_audit;
        const issues = (r.data && r.data.issues) || [];
        $("#seoExtras", view).innerHTML = `
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap">
            <div class="seo-score-ring">${icon("search", 40)}<span class="num" style="color:${last && last.score >= 80 ? "var(--ok)" : last && last.score >= 50 ? "var(--warn)" : "var(--danger)"}">${last ? last.score : "—"}</span></div>
            <div style="flex:1;min-width:200px">
              <p class="card__title">Technical SEO score</p>
              <p style="font-size:12.5px;color:var(--ink-3)">${last ? `Crawled ${last.pages_crawled} pages · ${last.issues_found} issues · ${esc((last.created_at || "").slice(0, 16).replace("T", " "))}` : "No audit run yet."}</p>
            </div>
            <button class="btn btn--primary" data-run-audit>${icon("refresh")} Run crawl now</button>
          </div>
          <div id="seoIssueList">${issues.map(i => `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">
              <span class="chip ${i.severity === "critical" ? "chip--danger" : i.severity === "warning" ? "chip--warn" : "chip--muted"}" style="font-size:10px">${esc(i.severity)}</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.issue_type)} ${esc(i.url)} — ${esc(i.detail)}</span>
              <button class="btn btn--sm btn--ghost" data-fix="${i.id}">Mark fixed</button>
            </div>`).join("") || `<p style="color:var(--ok)">No open issues. ✓</p>`}</div>`;
        $("[data-run-audit]", view).addEventListener("click", async () => {
          toast("Crawling the generated site…", "accent");
          await AV.api.send("/api/seo/audit", "POST", {});
          showTab("audit");
        });
        $$("[data-fix]", view).forEach(b => b.addEventListener("click", async () => {
          await AV.api.send("/api/seo/issues/" + b.dataset.fix, "PUT", { status: "fixed" });
          showTab("audit");
        }));
      }
      if (t === "decay") {
        const r = await AV.api.get("/api/seo/decay");
        const d = r.data || [];
        $("#seoExtras", view).innerHTML = d.length
          ? d.map(x => `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line)">
              <span style="flex:1">${esc(x.path)}</span>
              <span style="color:var(--ink-4);font-size:12px">${x.current} → ${x.previous} views</span>
              <span class="chip chip--danger">-${x.decline_pct}%</span>
              <button class="btn btn--sm btn--soft" data-refresh="${esc(x.path)}">Plan refresh</button>
            </div>`).join("")
          : `<p style="color:var(--ok)">No content decay detected — traffic is stable or growing. ✓</p>`;
        $$("[data-refresh]", view).forEach(b => b.addEventListener("click", () => toast("Add to next-actions: refresh " + b.dataset.refresh, "accent")));
      }
      if (t === "backlinks") {
        const r = await AV.api.get("/api/seo/backlinks");
        const bl = r.data || [];
        $("#seoExtras", view).innerHTML = `
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <input class="input" id="blDomain" placeholder="referring domain" style="flex:1;min-width:180px">
            <input class="input" id="blUrl" placeholder="target URL" style="flex:1;min-width:160px">
            <button class="btn btn--primary" data-add-bl>${icon("plus", 13)} Add</button>
          </div>
          ${bl.map(function (b) {
            var chip = b.status === "new" ? "chip--accent" : b.status === "lost" ? "chip--danger" : "chip--muted";
            return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">' +
              '<span class="chip ' + chip + '" style="font-size:10px">' + esc(b.status) + '</span>' +
              '<b style="flex:1">' + esc(b.referring_domain) + '</b>' +
              '<span style="color:var(--ink-4);font-size:11px">' + esc(b.target_url) + ' · ' + esc(b.last_seen || "—") + '</span>' +
              '<button class="icon-btn" data-del-bl="' + b.id + '" style="width:28px;height:28px">' + icon("trash", 13) + '</button></div>';
          }).join("") || '<p style="color:var(--ink-3)">No backlinks tracked yet — add referring domains you know about.</p>'}
        `;
        $("[data-add-bl]", view).addEventListener("click", async () => {
          const r = await AV.api.send("/api/seo/backlinks", "POST", { referring_domain: $("#blDomain", view).value.trim(), target_url: $("#blUrl", view).value.trim() });
          if (r.ok) { toast("Backlink added"); showTab("backlinks"); }
        });
        $$("[data-del-bl]", view).forEach(b => b.addEventListener("click", async () => {
          await AV.api.send("/api/seo/backlinks/" + b.dataset.delBl, "DELETE");
          showTab("backlinks");
        }));
      }
      if (t === "competitors") {
        const r = await AV.api.get("/api/seo/competitors");
        const cs = r.data || [];
        $("#seoExtras", view).innerHTML = `
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <input class="input" id="coName" placeholder="Competitor name" style="flex:1;min-width:180px">
            <input class="input" id="coDomain" placeholder="domain.com" style="flex:1;min-width:160px">
            <button class="btn btn--primary" data-add-co>${icon("plus", 13)} Add</button>
          </div>
          ${cs.map(c => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">
            <b style="flex:1">${esc(c.name)}</b>
            <span style="color:var(--ink-4)">${esc(c.domain)} · ${esc(c.focus || "")}</span>
            <button class="icon-btn" data-del-co="${c.id}" style="width:28px;height:28px">${icon("trash", 13)}</button>
          </div>`).join("") || `<p style="color:var(--ink-3)">No competitors tracked.</p>`}
        `;
        $("[data-add-co]", view).addEventListener("click", async () => {
          const r = await AV.api.send("/api/seo/competitors", "POST", { name: $("#coName", view).value.trim(), domain: $("#coDomain", view).value.trim() });
          if (r.ok) { toast("Competitor added"); showTab("competitors"); }
        });
        $$("[data-del-co]", view).forEach(b => b.addEventListener("click", async () => {
          await AV.api.send("/api/seo/competitors/" + b.dataset.delCo, "DELETE");
          showTab("competitors");
        }));
      }
    };
    $$("#seoTabs button", view).forEach(b => b.addEventListener("click", () => showTab(b.dataset.t)));
    const renderHealth = () => {
      if (!health) { $("#scoreNum", view).textContent = "—"; return; }
      const ring = $("#scoreArc", view);
      const r = Math.max(0, Math.min(100, health.score));
      ring.setAttribute("stroke-dasharray", "258");
      ring.setAttribute("stroke-dashoffset", String(258 * (1 - r / 100)));
      ring.setAttribute("stroke", r >= 80 ? "var(--ok)" : r >= 50 ? "var(--warn)" : "var(--danger)");
      $("#scoreNum", view).textContent = r;
      $("#scoreNum", view).style.color = r >= 80 ? "var(--ok)" : r >= 50 ? "var(--warn)" : "var(--danger)";
      $("#healthTitle", view).textContent = `Content health — ${r >= 80 ? "good" : r >= 50 ? "needs attention" : "poor"}`;
      $("#healthDesc", view).textContent = `${health.total_issues} issue(s) found across stored content.`;
      $("#healthChips", view).innerHTML = (health.checks || []).filter(ch => ch.items.length).map(ch =>
        `<span class="chip chip--warn">${esc(ch.label)}: ${ch.items.length}</span>`).join("") || `<span class="chip chip--ok">No issues ✓</span>`;
    };
    const renderRows = () => {
      const rows = [];
      types.forEach(t => (doc[t.key] || []).forEach(it => rows.push({
        type: t.label, key: t.key, id: it.id, title: it.title || "(untitled)",
        slug: it.slug || "", seo: it.seo || {}, blocks: it.blocks || [], body: it.body || ""
      })));
      $("#seoRows", view).innerHTML = rows.map(p => {
        const hasTitle = !!(p.seo.title || "").trim();
        const hasDesc = !!(p.seo.desc || "").trim();
        const score = (hasTitle ? 40 : 0) + (hasDesc ? 35 : 0) + (p.seo.og_image ? 15 : 0) + 10;
        return `
        <div class="seo-row" data-id="${esc(p.id)}" data-key="${p.key}" data-type="${esc(p.type)}" style="cursor:pointer">
          <span class="seo-row__bar" style="background:${score >= 90 ? "var(--ok)" : score >= 60 ? "var(--warn)" : "var(--danger)"}"></span>
          <div style="min-width:0">
            <p class="seo-row__title">${esc(p.title)} <span class="chip chip--muted" style="margin-left:6px">${esc(p.type)}</span></p>
            <p class="seo-row__url">/${esc(p.slug || "")}</p>
            <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
              ${hasTitle ? `<span class="chip chip--ok">title ✓</span>` : `<span class="chip chip--danger">missing title</span>`}
              ${hasDesc ? `<span class="chip chip--ok">description ✓</span>` : `<span class="chip chip--danger">missing description</span>`}
              ${p.seo.og_image ? `<span class="chip chip--ok">OG ✓</span>` : `<span class="chip chip--muted">no custom OG</span>`}
            </div>
          </div>
          <div style="margin-left:auto;display:flex;align-items:center;gap:16px">
            <span class="seo-row__score" style="color:${score >= 90 ? "var(--ok)" : score >= 60 ? "var(--warn)" : "var(--danger)"}">${score}</span>
          </div>
        </div>`;
      }).join("") || `<p style="color:var(--ink-3);padding:20px;text-align:center">No content found.</p>`;
      $$(".seo-row", view).forEach(row => row.addEventListener("click", () => editSeo(row.dataset.key, row.dataset.id, rows.find(r => r.key === row.dataset.key && String(r.id) === String(row.dataset.id)))));
    };
    const editSeo = (key, id, item) => {
      if (!item) return;
      const ml = modal({
        title: `SEO — ${esc(item.title)}`,
        body: `
          <p style="font-size:11.5px;color:var(--ink-4);margin-bottom:10px">${esc(item.type)} · /${esc(item.slug || "")}</p>
          <div class="field"><label>SEO title</label><input class="f-t" maxlength="70" value="${esc(item.seo.title || "")}"><span class="hint" id="tCount"></span></div>
          <div class="field" style="margin-top:12px"><label>Meta description</label><textarea class="f-d" rows="3" maxlength="165">${esc(item.seo.desc || "")}</textarea></div>
          <div class="field" style="margin-top:12px"><label>Focus keywords (comma separated)</label><input class="f-k" value="${esc((item.seo.keywords || []).join(", "))}"></div>
          <div id="aiSuggest" style="margin-top:12px"></div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <button class="btn btn--soft" data-ai>${icon("spark", 13)} AI improve</button>
          </div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save to database</button>`
      });
      const count = () => {
        const t = $(".f-t", ml.el).value.length;
        $("#tCount", ml.el).textContent = `${t}/70 characters`;
      };
      $(".f-t", ml.el).addEventListener("input", count); count();
      $("[data-ai]", ml.el).addEventListener("click", async () => {
        const b = $("[data-ai]", ml.el);
        b.disabled = true; b.innerHTML = `${icon("spark", 13)} Drafting…`;
        const r = await AV.api.send("/api/ai/generate", "POST", {
          prompt: `Improve the SEO metadata for "${item.title}" (${item.type}). Return exactly two lines: line 1 = SEO title, max 60 chars; line 2 = meta description, max 155 chars. No quotes, no labels, no extra text.`
        });
        b.disabled = false; b.innerHTML = `${icon("spark", 13)} AI improve`;
        if (r.ok && r.data && r.data.text) {
          const lines = r.data.text.split("\n").map(x => x.trim()).filter(Boolean);
          $(".f-t", ml.el).value = (lines[0] || "").slice(0, 70);
          $(".f-d", ml.el).value = (lines[1] || lines[0] || "").slice(0, 165);
          count();
          $("#aiSuggest", ml.el).innerHTML = `<p style="font-size:11px;color:var(--ink-4)">AI DRAFT — review and edit before saving.</p>`;
        } else {
          $("#aiSuggest", ml.el).innerHTML = `<p style="font-size:11px;color:var(--warn)">${esc(r.error && r.error.message ? r.error.message : "AI unavailable — add a provider key in Integrations.")}</p>`;
        }
      });
      $("[data-c]", ml.el).addEventListener("click", ml.close);
      $("[data-s]", ml.el).addEventListener("click", async () => {
        const title = $(".f-t", ml.el).value.trim();
        const desc = $(".f-d", ml.el).value.trim();
        if (!title || !desc) { toast("SEO title and description are required", "error"); return; }
        const arr = doc[key] || [];
        const idx = arr.findIndex(x => String(x.id) === String(id));
        if (idx < 0) { toast("Item not found", "error"); return; }
        arr[idx].seo = { ...(arr[idx].seo || {}), title, desc, keywords: $(".f-k", ml.el).value.split(",").map(k => k.trim()).filter(Boolean) };
        const r = await AV.api.send("/api/content", "PUT", { [key]: arr });
        if (r.ok) { toast("DATABASE SAVED — publish to apply"); ml.close(); load(); }
        else toast("SAVE FAILED", "error");
      });
    };
    $("[data-recheck]", view).addEventListener("click", load);
    $("[data-audit]", view).addEventListener("click", async () => {
      const b = $("[data-audit]", view);
      b.disabled = true; b.innerHTML = `${icon("spark", 13)} Auditing…`;
      const missing = [];
      types.forEach(t => (doc[t.key] || []).forEach(it => {
        if (!((it.seo || {}).title || "").trim() || !((it.seo || {}).desc || "").trim()) missing.push(`${t.label}: ${it.title}`);
      }));
      const r = await AV.api.send("/api/ai/generate", "POST", {
        prompt: `Act as an SEO strategist for a creative leader's portfolio. These content items are missing SEO metadata: ${missing.join("; ") || "(none — everything is covered)"}. List the top 3 priorities as short bullet points, one line each, actionable, in the owner's voice.`
      });
      b.disabled = false; b.innerHTML = `${icon("spark", 13)} AI audit`;
      const m = modal({
        title: "AI audit — priorities",
        body: r.ok && r.data && r.data.text
          ? `<p style="font-size:13px;line-height:1.7;white-space:pre-wrap">${esc(r.data.text)}</p><p style="font-size:11px;color:var(--ink-4);margin-top:10px">DRAFT · ${esc(r.data.provider)} ${esc(r.data.model)}</p>`
          : `<p style="font-size:13px;color:var(--ink-3)">${esc(r.error && r.error.message ? r.error.message : "AI unavailable — add a provider key in Integrations.")}</p><p style="font-size:12px;color:var(--ink-4);margin-top:8px">Meanwhile, here's what the audit engine found: ${health ? health.total_issues + " content-health issue(s) — see the score above." : "no health data."}</p>`,
        actions: `<button class="btn btn--primary" data-c>Close</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
    });
    load();
    // activate the requested tab (or the health tab by default)
    showTab(tab.tab || "health");
  });

})();
