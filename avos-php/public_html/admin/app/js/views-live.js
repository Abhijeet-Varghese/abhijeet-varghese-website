/* ============================================================
   AV OS — live editing views (loaded last, overrides shells)
   Navigation (menu + footer + copyright), Page layout editor
   (blocks), Settings (favicon/logo upload + save), real publish.
   Every change flows: store → API → site.json → publish → live site.
   ============================================================ */
(() => {
  const { icon, toast, modal, confirmDlg, esc, $, $$ } = AV.ui;
  const S = AV.store;
  const R = AV.router;

  const statusChip = s => {
    const map = { published: ["ok", "Published"], draft: ["warn", "Draft"], hidden: ["muted", "Hidden"], scheduled: ["accent", "Scheduled"], review: ["warn", "In review"] };
    const [cls, label] = map[s] || ["muted", s];
    return `<span class="chip chip--${cls}"><span class="status-dot status-dot--${cls}"></span>${label}</span>`;
  };

  /* ============================================================
     NAVIGATION — full editor: primary menu, footer columns, copyright
     ============================================================ */
  R.register("navigation", () => `
    <div class="view__head">
      <div><h1 class="view__title">Navigation <em>& footer</em></h1>
      <p class="view__desc">Edit the menu, footer columns and copyright — add, remove and reorder anything. Publish to apply.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--primary" data-save>${icon("save")} Save & publish</button>
      </div>
    </div>
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card__head"><p class="card__title">Primary menu</p>
          <button class="btn btn--sm btn--soft" data-add-link>${icon("plus", 12)} Add link</button></div>
        <div class="card__body" id="navPrimary"></div>
      </div>
      <div class="card">
        <div class="card__head"><p class="card__title">Footer columns</p>
          <button class="btn btn--sm btn--soft" data-add-col>${icon("plus", 12)} Add column</button></div>
        <div class="card__body" id="navFooter"></div>
      </div>
    </div>
    <div class="card" style="padding:18px">
      <div class="field"><label>Copyright line</label>
        <input id="navCopyright" placeholder="© 2026 …">
        <span class="hint">Shown at the bottom of every page.</span></div>
    </div>`);
  R.after("navigation", view => {
    let nav = S.get("nav");
    if (!nav) nav = { primary: [], footerColumns: [], copyright: "" };
    const render = () => {
      $("#navPrimary", view).innerHTML = nav.primary.map((l, i) => `
        <div class="section-row" style="margin-bottom:8px;flex-wrap:wrap">
          <span class="section-row__grip">${icon("grip")}</span>
          <input class="input f-label" value="${esc(l.label)}" placeholder="Label" style="flex:1;min-width:110px">
          <input class="input f-href" value="${esc(l.href)}" placeholder="page.html or https://…" style="flex:1.2;min-width:150px">
          <label class="toggle" title="CTA style"><input type="checkbox" class="f-cta" ${l.cta ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>
          <div class="section-row__actions">
            <button data-move="-1" ${i === 0 ? "disabled" : ""} title="Move up">${icon("up")}</button>
            <button data-move="1" ${i === nav.primary.length - 1 ? "disabled" : ""} title="Move down">${icon("down")}</button>
            <button class="danger" data-del title="Delete">${icon("trash")}</button>
          </div>
        </div>`).join("") || `<div class="empty" style="padding:20px"><p>No menu links yet — add one.</p></div>`;
      $("#navFooter", view).innerHTML = nav.footerColumns.map((col, ci) => `
        <div style="border:1px solid var(--line);border-radius:var(--r-md);padding:12px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <input class="input f-col" value="${esc(col.label)}" placeholder="Column label" style="flex:1;font-weight:600">
            <button class="icon-btn" style="width:30px;height:30px" data-delcol="${ci}" title="Delete column">${icon("trash", 14)}</button>
          </div>
          <div style="display:grid;gap:6px">
            ${(col.links || []).map((l, li) => `
              <div style="display:flex;gap:8px;align-items:center">
                <input class="input f-link-label" value="${esc(l.label)}" placeholder="Label" style="flex:1;min-width:90px">
                <input class="input f-link-href" value="${esc(l.href)}" placeholder="page.html" style="flex:1.4;min-width:120px">
                <button class="icon-btn" style="width:28px;height:28px" data-dellink="${ci}:${li}" title="Remove link">${icon("x", 13)}</button>
              </div>`).join("")}
          </div>
          <button class="btn btn--sm btn--ghost" data-addlink="${ci}" style="margin-top:8px">${icon("plus", 12)} Add link</button>
        </div>`).join("") || `<div class="empty" style="padding:20px"><p>No footer columns yet.</p></div>`;
      $("#navCopyright", view).value = nav.copyright || "";
    };

    /* live bindings — inputs write to model + debounced save */
    const wire = () => {
      $$("#navPrimary .f-label", view).forEach((inp, i) => inp.addEventListener("input", () => { nav.primary[i].label = inp.value; S.save(); }));
      $$("#navPrimary .f-href", view).forEach((inp, i) => inp.addEventListener("input", () => { nav.primary[i].href = inp.value; S.save(); }));
      $$("#navPrimary .f-cta", view).forEach((cb, i) => cb.addEventListener("change", () => { nav.primary[i].cta = cb.checked; S.save(); }));
      $$("#navPrimary [data-move]", view).forEach(b => b.addEventListener("click", () => {
        const i = $$("#navPrimary .section-row", view).indexOf(b.closest(".section-row"));
        const j = i + (+b.dataset.move);
        if (j < 0 || j >= nav.primary.length) return;
        [nav.primary[i], nav.primary[j]] = [nav.primary[j], nav.primary[i]];
        S.save(); render(); wire();
      }));
      $$("#navPrimary [data-del]", view).forEach(b => b.addEventListener("click", () => {
        const i = $$("#navPrimary .section-row", view).indexOf(b.closest(".section-row"));
        nav.primary.splice(i, 1); S.save(); render(); wire();
      }));
      $$("#navFooter .f-col", view).forEach((inp, ci) => inp.addEventListener("input", () => { nav.footerColumns[ci].label = inp.value; S.save(); }));
      $$("#navFooter .f-link-label", view).forEach((inp, i) => {
        inp.addEventListener("input", () => {
          const [ci, li] = findLink(inp); if (ci >= 0) nav.footerColumns[ci].links[li].label = inp.value; S.save();
        });
      });
      $$("#navFooter .f-link-href", view).forEach((inp, i) => {
        inp.addEventListener("input", () => {
          const [ci, li] = findLink(inp); if (ci >= 0) nav.footerColumns[ci].links[li].href = inp.value; S.save();
        });
      });
      $$("#navFooter [data-addlink]", view).forEach(b => b.addEventListener("click", () => {
        const ci = +b.dataset.addlink;
        nav.footerColumns[ci].links = nav.footerColumns[ci].links || [];
        nav.footerColumns[ci].links.push({ id: "fl" + Date.now(), label: "New link", href: "page.html" });
        S.save(); render(); wire();
      }));
      $$("#navFooter [data-dellink]", view).forEach(b => b.addEventListener("click", () => {
        const [ci, li] = b.dataset.dellink.split(":").map(Number);
        nav.footerColumns[ci].links.splice(li, 1); S.save(); render(); wire();
      }));
      $$("#navFooter [data-delcol]", view).forEach(b => b.addEventListener("click", () => {
        const ci = +b.dataset.delcol;
        confirmDlg("Delete column?", `“${nav.footerColumns[ci].label}” and its links will be removed.`, () => {
          nav.footerColumns.splice(ci, 1); S.save(); render(); wire();
        });
      }));
      $("#navCopyright", view).addEventListener("input", () => { nav.copyright = $("#navCopyright", view).value; S.save(); });
    };
    const findLink = inp => {
      const row = inp.closest("div");
      const col = row.parentElement.parentElement;
      const ci = $$("#navFooter > div", view).indexOf(col.closest("#navFooter > div"));
      const li = $$(".f-link-label", col).indexOf(row.querySelector(".f-link-label")) ;
      return [ci, li];
    };
    $("[data-add-link]", view).addEventListener("click", () => {
      nav.primary.push({ id: "n" + Date.now(), label: "New page", href: "page.html" });
      S.save(); render(); wire();
    });
    $("[data-add-col]", view).addEventListener("click", () => {
      nav.footerColumns.push({ id: "fc" + Date.now(), label: "New column", links: [{ id: "fl" + Date.now(), label: "New link", href: "page.html" }] });
      S.save(); render(); wire();
    });
    $("[data-save]", view).addEventListener("click", () => {
      S.set("nav", nav);
      AV.publishSite();
    });
    render(); wire();
  });

  /* ============================================================
     PAGES — list + block layout editor (design & layout of any page)
     ============================================================ */
  const BLOCK_TYPES = [
    ["hero", "Hero banner"], ["prose", "Text / prose"], ["image", "Image"], ["quote", "Quote"],
    ["list", "List"], ["timeline", "Timeline"], ["cta", "Call to action"], ["card", "Highlight card"],
    ["cases", "Case studies"], ["articles", "Articles list"], ["logowall", "Logo wall"],
    ["capabilities", "Capabilities"], ["contact", "Contact form"], ["sitemap", "Sitemap"],
    ["job", "Employment entry"]
  ];

  const blockForm = (type, content) => {
    const c = content || {};
    const F = (label, id, val, textarea) => `
      <div class="field" style="margin-top:12px"><label>${label}</label>
        ${textarea
          ? `<textarea class="bf-${id}" rows="4">${esc(val || "")}</textarea>`
          : `<input class="bf-${id}" value="${esc(val || "")}">`}</div>`;
    let html = "";
    if (type === "hero") html = F("Kicker (e.g. 04 · Contact)", "kicker", c.kicker) + F("Title (HTML ok)", "title", c.title) + F("Lede", "lede", c.lede, true);
    else if (type === "prose") html = F("Paragraphs (one per line, HTML ok)", "paragraphs", (c.paragraphs || []).join("\n"), true);
    else if (type === "image") html = `<div class="field"><label>Image</label><div class="media-grid" style="max-height:220px;overflow-y:auto;grid-template-columns:repeat(auto-fill,minmax(80px,1fr))">${S.get("media").map(m => `<div class="media-item bf-pick" data-src="${m.src}" style="border-radius:8px"><div class="media-item__img"><img src="${m.src}" alt="" loading="lazy"></div></div>`).join("")}</div><input class="bf-src" type="hidden" value="${esc(c.src || "")}"></div>` + F("Alt text", "alt", c.alt) + F("Caption", "caption", c.caption) + `<div class="field" style="margin-top:12px"><label>Layout</label><select class="bf-mode">${["wide","bleed","tall"].map(m => `<option ${(c.mode || "wide") === m ? "selected" : ""}>${m}</option>`).join("")}</select><p class="hint" style="font-size:11.5px;color:var(--ink-3);margin-top:4px">wide = 16:10 · bleed = edge-to-edge cinematic · tall = offset documentary frame</p></div>`;
    else if (type === "quote") html = F("Quote text", "text", c.text, true) + `<div class="field" style="margin-top:12px"><label>Style</label><select class="bf-variant">${["statement","serif","question","signature","epic","finale","act"].map(v => `<option ${c.variant === v ? "selected" : ""}>${v}</option>`).join("")}</select><p class="hint" style="font-size:11.5px;color:var(--ink-3);margin-top:4px">statement = all-caps · serif = italic · question · epic = full-bleed giant · finale = centered serif · act = chapter label</p></div>`;
    else if (type === "list") html = F("Items (one per line)", "items", (c.items || []).join("\n"), true);
    else if (type === "timeline") html = F("Eras — one per line as: Name — note", "items", (c.items || []).map(i => `${i.name} — ${i.note}`).join("\n"), true);
    else if (type === "cta") html = F("Heading", "title", c.title) + F("Role line (small caps)", "role", c.role) + F("Text", "text", c.text, true) + F("Button label", "button", c.button) + F("Button href", "href", c.href);
    else if (type === "card") html = F("Heading", "title", c.title) + F("Body", "body", c.body, true) + F("Chips (comma separated)", "chips", (c.chips || []).join(", ")) + F("CTA label", "cta", c.cta) + F("CTA href", "href", c.href);
    else if (type === "cases") html = `<p style="font-size:12.5px;color:var(--ink-3)">Shows published projects from the Projects view. Manage which projects appear by editing Projects.</p>`;
    else if (type === "articles") html = `<p style="font-size:12.5px;color:var(--ink-3)">Shows published ${c.kind === "journal" ? "journal entries" : "essays"} automatically.</p>`;
    else if (type === "logowall") html = F("Heading", "title", c.title) + F("Lede", "lede", c.lede, true);
    else if (type === "job") html = F("Company", "company", c.company) + F("Role", "role", c.role) + F("Role line (e.g. Immersive & Brand Systems)", "role_sub", c.role_sub) + F("Dates (e.g. Sep 2024 — Jan 2026)", "dates", c.dates) + F("Location", "location", c.location) + F("Role summary", "summary", c.summary, true) + F("Disciplines (one per line)", "disciplines", (c.disciplines || []).join("\n"), true) + F("Responsibilities (one per line)", "responsibilities", (c.responsibilities || []).join("\n"), true);
    else if (type === "contact") html = F("Note under contacts", "note", c.note, true);
    else if (type === "capabilities" || type === "sitemap") html = `<p style="font-size:12.5px;color:var(--ink-3)">Auto-generated from your content.</p>`;
    return html;
  };
  const readBlockForm = (type, el) => {
    const c = {};
    const v = sel => $(sel, el)?.value || "";
    if (type === "hero") { c.kicker = v(".bf-kicker"); c.title = v(".bf-title"); c.lede = v(".bf-lede"); }
    else if (type === "prose") { c.paragraphs = v(".bf-paragraphs").split("\n").filter(x => x.trim()); }
    else if (type === "image") { c.src = v(".bf-src"); c.alt = v(".bf-alt"); c.caption = v(".bf-caption"); c.mode = v(".bf-mode") || "wide"; }
    else if (type === "quote") { c.text = v(".bf-text"); c.variant = v(".bf-variant"); }
    else if (type === "list") { c.items = v(".bf-items").split("\n").filter(x => x.trim()); }
    else if (type === "timeline") { c.items = v(".bf-items").split("\n").filter(Boolean).map(l => { const [name, ...rest] = l.split("—"); return { name: (name || "").trim(), note: rest.join("—").trim() }; }); }
    else if (type === "cta") { c.title = v(".bf-title"); c.role = v(".bf-role"); c.text = v(".bf-text"); c.button = v(".bf-button"); c.href = v(".bf-href"); }
    else if (type === "card") { c.title = v(".bf-title"); c.body = v(".bf-body"); c.chips = v(".bf-chips").split(",").map(x => x.trim()).filter(Boolean); c.cta = v(".bf-cta"); c.href = v(".bf-href"); }
    else if (type === "logowall") { c.title = v(".bf-title"); c.lede = v(".bf-lede"); }
    else if (type === "job") { c.company = v(".bf-company"); c.role = v(".bf-role"); c.role_sub = v(".bf-role_sub"); c.dates = v(".bf-dates"); c.location = v(".bf-location"); c.summary = v(".bf-summary"); c.disciplines = v(".bf-disciplines").split("\n").filter(x => x.trim()); c.responsibilities = v(".bf-responsibilities").split("\n").filter(x => x.trim()); }
    else if (type === "contact") { c.note = v(".bf-note"); }
    return c;
  };

  R.register("pages", () => `
    <div class="view__head">
      <div><h1 class="view__title">Pages <em>& layouts</em></h1>
      <p class="view__desc">Edit any page's design and layout block by block — add, remove and reorder. New pages appear in the menu instantly after publish.</p></div>
      <div class="view__head-actions"><button class="btn btn--primary" data-new-page>${icon("plus")} New page</button></div>
    </div>
    <div class="bulkbar" id="pagesBulkBar" style="display:none;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin-bottom:12px;flex-wrap:wrap">
      <b style="font-size:13px" id="pagesSelCount">0 selected</b>
      <button class="btn btn--sm btn--soft" data-bulk="publish">Publish</button>
      <button class="btn btn--sm btn--ghost" data-bulk="unpublish">Unpublish</button>
      <button class="btn btn--sm btn--ghost" data-bulk="archive">Archive</button>
      <button class="btn btn--sm btn--danger-soft" data-bulk="delete">Delete</button>
      <button class="btn btn--sm btn--ghost" data-bulk-clear>Clear</button>
    </div>
    <div class="card" style="overflow:auto">
      <table class="table">
        <thead><tr><th style="width:34px"></th><th>Page</th><th>Slug</th><th>Blocks</th><th>Status</th><th>Updated</th><th></th></tr></thead>
        <tbody id="pagesBody"></tbody>
      </table>
    </div>`);
  R.after("pages", view => {
    const pages = () => S.get("pages");
    const bulkRun = async action => {
      const ids = [...$$(".pg-sel:checked", view)].map(c => c.value);
      if (!ids.length) { toast("Select pages first", "error"); return; }
      const r = await AV.api.send("/api/content/bulk", "POST", { key: "pages", ids, action });
      if (!r.ok) { toast("Bulk failed: " + (r.error && r.error.message ? r.error.message : "error"), "error"); return; }
      const x = r.data;
      toast(`Bulk ${action}: ${x.succeeded} ok, ${x.failed} failed`);
      const fails = (x.results || []).filter(z => !z.ok);
      if (fails.length) fails.slice(0, 4).forEach(z => toast(z.title + " — " + z.error, "error"));
      await AV.api.pull();
      render();
    };
    const render = () => {
      const sel = [...$$(".pg-sel:checked", view)].map(c => c.value);
      $("#pagesBody", view).innerHTML = pages().map(pg => `
        <tr>
          <td><input type="checkbox" class="pg-sel" value="${esc(pg.id)}" style="accent-color:var(--accent)"></td>
          <td><p class="cell-main">${esc(pg.title)}</p></td>
          <td style="font-family:ui-monospace,monospace;font-size:12px;color:var(--ink-3)">${esc(pg.slug)}.html</td>
          <td><span class="chip chip--muted">${(pg.blocks || []).length} blocks</span></td>
          <td>${statusChip(pg.status)}</td>
          <td style="color:var(--ink-3);font-size:12px">${esc(pg.updated || "")}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn--sm btn--soft" data-layout="${pg.id}">${icon("sliders", 12)} Layout</button>
            <button class="btn btn--sm btn--ghost" data-edit="${pg.id}">${icon("pen", 12)} Info</button>
            <button class="btn btn--sm btn--ghost" data-del="${pg.id}">${icon("trash", 12)}</button>
          </div></td>
        </tr>`).join("");
      $$(".pg-sel", view).forEach(c => { if (sel.includes(c.value)) c.checked = true; });
      const syncBar = () => {
        const n = $$(".pg-sel:checked", view).length;
        $("#pagesSelCount", view).textContent = n + " selected";
        $("#pagesBulkBar", view).style.display = n ? "flex" : "none";
      };
      $$(".pg-sel", view).forEach(c => c.addEventListener("change", syncBar));
      syncBar();
      $$("[data-bulk]", view).forEach(b => b.addEventListener("click", () => bulkRun(b.dataset.bulk)));
      $("[data-bulk-clear]", view).addEventListener("click", () => { $$(".pg-sel", view).forEach(c => c.checked = false); syncBar(); });
      $$("[data-layout]", view).forEach(b => b.addEventListener("click", () => layoutEditor(pages().find(p => p.id === b.dataset.layout), render)));
      $$("[data-edit]", view).forEach(b => b.addEventListener("click", () => editInfo(pages().find(p => p.id === b.dataset.edit), render)));
      $$("[data-del]", view).forEach(b => b.addEventListener("click", () => confirmDlg("Delete page?", "The page and its URL will be removed from the site after publish.", () => {
        S.set("pages", pages().filter(p => p.id !== b.dataset.del));
        toast("Page deleted — publish to apply"); render();
      })));
    };
    const editInfo = (pg, rerender) => {
      const m = modal({
        title: "Page info",
        body: `
          <div class="field"><label>Title</label><input class="f-t" value="${esc(pg.title)}"></div>
          <div class="field" style="margin-top:12px"><label>Slug <span class="hint">— becomes page.html</span></label><input class="f-s" value="${esc(pg.slug)}"></div>
          <div class="field-row" style="margin-top:12px">
            <div class="field"><label>Status</label><select class="f-st">${["published", "draft", "hidden"].map(s => `<option ${pg.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
            <div class="field"><label>SEO title</label><input class="f-seo" value="${esc((pg.seo || {}).title || "")}"></div>
          </div>
          <div class="field" style="margin-top:12px"><label>SEO description</label><textarea class="f-desc" rows="2">${esc((pg.seo || {}).desc || "")}</textarea></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", () => {
        pg.title = $(".f-t", m.el).value; pg.slug = $(".f-s", m.el).value.replace(/\.html$/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
        pg.status = $(".f-st", m.el).value;
        pg.seo = pg.seo || {}; pg.seo.title = $(".f-seo", m.el).value; pg.seo.desc = $(".f-desc", m.el).value;
        pg.updated = "Just now"; S.save(); toast("Page saved — publish to apply"); m.close(); rerender();
      });
    };
    const layoutEditor = (pg, rerender) => {
      const m = modal({
        title: `Layout — ${esc(pg.title)}`,
        body: `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">
            <p style="font-size:12.5px;color:var(--ink-3)">${(pg.blocks || []).length} blocks · drag order with arrows</p>
            <button class="btn btn--sm btn--soft" data-add-block>${icon("plus", 12)} Add block</button>
          </div>
          <div id="blockList" style="display:grid;gap:8px;max-height:46vh;overflow-y:auto;padding:2px"></div>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-save>Save layout</button>`
      });
      const list = $("#blockList", m.el);
      const renderBlocks = () => {
        list.innerHTML = (pg.blocks || []).map((b, i) => `
          <div class="section-row" data-i="${i}" style="margin-bottom:0">
            <span class="section-row__grip">${icon("grip")}</span>
            <div style="min-width:0;flex:1">
              <p class="section-row__name">${esc(BLOCK_TYPES.find(t => t[0] === b.type)?.[1] || b.type)}</p>
              <p class="section-row__id">${esc((b.content || {}).title || (b.content || {}).kicker || b.type)}</p>
            </div>
            <div class="section-row__actions">
              <button data-mv="-1" ${i === 0 ? "disabled" : ""}>${icon("up")}</button>
              <button data-mv="1" ${i === (pg.blocks || []).length - 1 ? "disabled" : ""}>${icon("down")}</button>
              <button data-edit>${icon("pen")}</button>
              <button class="danger" data-del>${icon("trash")}</button>
            </div>
          </div>`).join("") || `<div class="empty" style="padding:20px"><p>No blocks — add your first one.</p></div>`;
        $$(".section-row", list).forEach(row => {
          const i = +row.dataset.i;
          $("[data-mv]", row).addEventListener("click", e => {
            const j = i + (+e.currentTarget.dataset.mv);
            if (j < 0 || j >= pg.blocks.length) return;
            [pg.blocks[i], pg.blocks[j]] = [pg.blocks[j], pg.blocks[i]];
            renderBlocks();
          });
          $("[data-del]", row).addEventListener("click", () => { pg.blocks.splice(i, 1); renderBlocks(); });
          $("[data-edit]", row).addEventListener("click", () => {
            const b = pg.blocks[i];
            const em = modal({
              title: `Edit — ${esc(BLOCK_TYPES.find(t => t[0] === b.type)?.[1] || b.type)}`,
              body: blockForm(b.type, b.content) + `<input type="hidden" class="bf-type" value="${b.type}">`,
              actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Save block</button>`
            });
            $$(".bf-pick", em.el).forEach(p => p.addEventListener("click", () => { $(".bf-src", em.el).value = p.dataset.src; toast("Image selected"); }));
            $("[data-c]", em.el).addEventListener("click", em.close);
            $("[data-s]", em.el).addEventListener("click", () => {
              b.content = readBlockForm(b.type, em.el);
              S.save(); em.close(); renderBlocks(); toast("Block updated — save layout to keep");
            });
          });
        });
      };
      $("[data-add-block]", m.el).addEventListener("click", () => {
        const am = modal({
          title: "Add block",
          body: `<div style="display:grid;gap:8px;max-height:50vh;overflow-y:auto">
            ${BLOCK_TYPES.map(([t, lbl]) => `<button class="prompt-card" data-t="${t}"><span class="prompt-card__name">${icon("layers", 14)} ${lbl}</span></button>`).join("")}
          </div>`,
          actions: `<button class="btn btn--ghost" data-c>Cancel</button>`
        });
        $("[data-c]", am.el).addEventListener("click", am.close);
        $$("[data-t]", am.el).forEach(b => b.addEventListener("click", () => {
          pg.blocks = pg.blocks || [];
          pg.blocks.push({ id: "b" + Date.now(), type: b.dataset.t, content: {} });
          S.save(); am.close(); renderBlocks(); toast("Block added — edit it or save layout");
        }));
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-save]", m.el).addEventListener("click", () => {
        pg.updated = "Just now"; S.save();
        toast("Layout saved — publish to apply"); m.close(); rerender();
      });
      renderBlocks();
    };
    $("[data-new-page]", view).addEventListener("click", () => {
      const m = modal({
        title: "New page",
        body: `
          <div class="field"><label>Title</label><input class="f-t" placeholder="e.g. Speaking"></div>
          <div class="field" style="margin-top:12px"><label>Slug</label><input class="f-s" placeholder="speaking"></div>
          <p style="font-size:12px;color:var(--ink-3);margin-top:12px">The page starts with a hero + text block. After creating, open Layout to design it, then add it to the menu and publish.</p>`,
        actions: `<button class="btn btn--ghost" data-c>Cancel</button><button class="btn btn--primary" data-s>Create page</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-s]", m.el).addEventListener("click", () => {
        const title = $(".f-t", m.el).value.trim() || "New page";
        const slug = ($(".f-s", m.el).value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")).replace(/\.html$/, "");
        S.set("pages", [...pages(), {
          id: "p-" + Date.now(), title, slug, status: "published", template: "Page",
          seo: { title: `${title} — ${S.get("settings").siteName}`, desc: "", keywords: "" },
          updated: "Just now",
          blocks: [
            { id: "b" + Date.now(), type: "hero", content: { kicker: "New · Page", title: title, lede: "A new page, ready to design." } },
            { id: "b" + (Date.now() + 1), type: "prose", content: { paragraphs: ["Write something worth reading here — edit this block in the Layout editor."] } }
          ]
        }]);
        toast("Page created — add it to the menu, then publish");
        m.close(); render();
      });
    });
    render();
  });

  /* ============================================================
     SETTINGS — brand, favicon + logo upload, save to backend
     ============================================================ */
  R.register("settings", () => `
    <div class="view__head">
      <div><h1 class="view__title">Settings</h1>
      <p class="view__desc">Site identity, favicon, logo, contacts — everything here publishes to the live site.</p></div>
      <div class="view__head-actions">
        <button class="btn btn--ghost" data-sync>${icon("refresh")} Sync frontend</button>
        <button class="btn btn--primary" data-save>${icon("save")} Save & publish</button>
      </div>
    </div>
    <div class="grid grid-13">
      <div class="card" style="padding:20px">
        <p class="card__title" style="margin-bottom:14px">Site identity</p>
        <div class="field"><label>Site name</label><input id="stName" value="${esc(S.get("settings").siteName || "")}"></div>
        <div class="field" style="margin-top:12px"><label>Tagline</label><input id="stTag" value="${esc(S.get("settings").tagline || "")}"></div>
        <div class="field-row" style="margin-top:12px">
          <div class="field"><label>Contact email</label><input id="stEmail" value="${esc(S.get("settings").email || "")}"></div>
          <div class="field"><label>Phone</label><input id="stPhone" value="${esc(S.get("settings").phone || "")}"></div>
        </div>
        <div class="field" style="margin-top:12px"><label>Meta description</label><textarea id="stMeta" rows="3">${esc(S.get("settings").metaDescription || "")}</textarea></div>
        <div class="field" style="margin-top:12px"><label>Keywords <span class="hint">comma separated</span></label><input id="stKw" value="${esc(S.get("settings").keywords || "")}"></div>
        <div class="field" style="margin-top:12px"><label>Copyright line</label><input id="stCopy" value="${esc((S.get("nav") || {}).copyright || "")}"></div>
      </div>
      <div>
        <div class="card" style="padding:20px;margin-bottom:16px">
          <p class="card__title" style="margin-bottom:14px">Brand marks</p>
          <div class="field"><label>Logo</label>
            <div style="display:flex;align-items:center;gap:12px">
              <img id="logoPrev" src="${esc(S.get("settings").logo || "media/logo.png")}" style="width:52px;height:52px;object-fit:contain;border-radius:12px;border:1px solid var(--line);background:var(--surface-2)" alt="">
              <div style="display:grid;gap:6px">
                <button class="btn btn--sm btn--soft" data-upload-logo>${icon("upload", 12)} Upload logo</button>
                <span style="font-size:11px;color:var(--ink-4)">PNG / WebP / SVG — used in menu & footer</span>
              </div>
            </div></div>
          <div class="field" style="margin-top:16px"><label>Favicon <span class="hint">— the browser tab icon</span></label>
            <div style="display:flex;align-items:center;gap:12px">
              <img id="favPrev" src="${esc(S.get("settings").favicon || "media/logo.png")}" style="width:36px;height:36px;object-fit:contain;border-radius:8px;border:1px solid var(--line);background:var(--surface-2)" alt="">
              <div style="display:grid;gap:6px">
                <button class="btn btn--sm btn--soft" data-upload-fav>${icon("upload", 12)} Upload favicon</button>
                <span style="font-size:11px;color:var(--ink-4)">Any image — 64×64 or larger recommended</span>
              </div>
            </div></div>
          <div class="field" style="margin-top:16px"><label>Social links <span class="hint">— one per line: Label,https://…</span></label>
            <textarea id="stSocial" rows="5">${(S.get("settings").socials || []).map(s => `${s.label},${s.href}`).join("\n")}</textarea></div>
        </div>
        <div class="card" style="padding:20px">
          <p class="card__title" style="margin-bottom:10px">Publishing</p>
          <p style="font-size:12.5px;color:var(--ink-3);line-height:1.6">Saving writes to the backend content store. Publishing regenerates every page of the live site — homepage, menu, footer, articles and case studies.</p>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:10px 0;border-top:1px solid var(--line)">
            <div><p style="font-weight:600;font-size:13px">Auto publish (live sync)</p>
            <p style="font-size:11.5px;color:var(--ink-3)">Every save regenerates the public site automatically — no manual publish needed.</p></div>
            <label class="toggle" title="Auto-publish on save"><input type="checkbox" id="autoPubToggle"><span class="track"></span><span class="thumb"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)">
            <div><p style="font-weight:600;font-size:13px">Frontend sync</p>
            <p style="font-size:11.5px;color:var(--ink-3)">Pulls css/js/images/fonts from the frontend folder into the template, then publishes.</p></div>
            <label class="toggle" title="Frontend sync"><input type="checkbox" id="fsyncToggle"><span class="track"></span><span class="thumb"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)">
            <div><p style="font-weight:600;font-size:13px">Post-publish health check</p>
            <p style="font-size:11.5px;color:var(--ink-3)">Verify critical routes after publish; roll back automatically if broken.</p></div>
            <label class="toggle" title="Health check"><input type="checkbox" id="hcToggle"><span class="track"></span><span class="thumb"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)">
            <div><p style="font-weight:600;font-size:13px">Automatic rollback</p>
            <p style="font-size:11.5px;color:var(--ink-3)">Restore the previous deployment when the health check fails.</p></div>
            <label class="toggle" title="Automatic rollback"><input type="checkbox" id="rbToggle"><span class="track"></span><span class="thumb"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)">
            <div><p style="font-weight:600;font-size:13px">Version retention</p>
            <p style="font-size:11.5px;color:var(--ink-3)">Number of production snapshots kept on disk.</p></div>
            <input type="number" id="retentionInput" min="2" max="50" style="width:76px;min-height:34px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface-2);padding:4px 8px;font-size:13px">
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn btn--soft btn--sm" data-sync2>${icon("refresh", 12)} Sync frontend now</button>
            <button class="btn btn--soft btn--sm" data-sync-preview>${icon("eye", 12)} Preview sync</button>
            <button class="btn btn--primary" style="margin-left:auto" data-publish>${icon("send")} Publish website now</button>
          </div>
        </div>
      </div>
    </div>`);
  R.after("settings", view => {
    const s = S.get("settings");
    const doUpload = (kind) => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = () => {
        const f = input.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const name = "brand-" + Date.now() + (f.name.match(/\.[^.]+$/) || [".png"])[0];
          const img = new Image();
          img.onload = async () => {
            const r = await AV.api.upload(name, reader.result, "Brand", { w: img.naturalWidth, h: img.naturalHeight });
            if (r.ok) {
              if (kind === "logo") { s.logo = r.src; $("#logoPrev", view).src = r.src; }
              else { s.favicon = r.src; $("#favPrev", view).src = r.src; }
              S.save();
              toast(kind === "logo" ? "Logo uploaded — publish to apply" : "Favicon uploaded — publish to apply", "accent");
            } else toast("Upload failed: " + (r.error || "server unreachable"), "error");
          };
          img.src = URL.createObjectURL(f);
        };
        reader.readAsDataURL(f);
      };
      input.click();
    };
    $("[data-upload-logo]", view).addEventListener("click", () => doUpload("logo"));
    $("[data-upload-fav]", view).addEventListener("click", () => doUpload("fav"));
    const collect = () => {
      s.siteName = $("#stName", view).value;
      s.tagline = $("#stTag", view).value;
      s.email = $("#stEmail", view).value;
      s.phone = $("#stPhone", view).value;
      s.metaDescription = $("#stMeta", view).value;
      s.keywords = $("#stKw", view).value;
      const nav = S.get("nav") || {};
      nav.copyright = $("#stCopy", view).value;
      S.set("nav", nav);
      s.socials = $("#stSocial", view).value.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        const [label, href] = l.split(",");
        return { id: "s" + Date.now() + Math.random().toString(36).slice(2, 5), label: (label || "").trim(), href: (href || "").trim() };
      });
      S.save();
    };
    $("[data-save]", view).addEventListener("click", async () => {
      collect();
      // with live sync on, the save itself auto-publishes — avoid a double publish
      const fl = await AV.api.get("/api/flags");
      const auto = !!(fl.data || []).find(x => x.flag === "auto_publish" && x.enabled);
      if (auto) toast("Settings saved — live sync is publishing automatically");
      else { toast("Settings saved to backend"); AV.publishSite(); }
    });
    $("[data-publish]", view).addEventListener("click", () => { collect(); AV.publishSite(); });
    /* Live sync: publishing settings (flags + retention) */
    const loadPublishSettings = async () => {
      const r = await AV.api.get("/api/system/publish-settings");
      if (!r.ok) return;
      const flags = (r.data && r.data.flags) || {};
      const set = (id, flag) => { const t = $(id, view); if (t && flags[flag]) t.checked = !!flags[flag].enabled; };
      set("#autoPubToggle", "auto_publish");
      set("#fsyncToggle", "frontend_sync");
      set("#hcToggle", "post_publish_healthcheck");
      set("#rbToggle", "automatic_rollback");
      const ret = $("#retentionInput", view);
      if (ret && r.data.settings) ret.value = r.data.settings.retention;
      AV.pubRetention = (r.data.settings && r.data.settings.retention) || 10;
    };
    const savePublishSettings = async (extra) => {
      const body = {
        auto_publish: $("#autoPubToggle", view).checked,
        frontend_sync: $("#fsyncToggle", view).checked,
        post_publish_healthcheck: $("#hcToggle", view).checked,
        automatic_rollback: $("#rbToggle", view).checked,
        retention: parseInt($("#retentionInput", view).value || "10", 10),
      };
      const r = await AV.api.send("/api/system/publish-settings", "PUT", Object.assign(body, extra || {}));
      if (r.ok) toast("Publishing settings saved", "accent");
      else toast("Save failed", "error");
    };
    $("#autoPubToggle", view).addEventListener("change", () => savePublishSettings());
    $("#fsyncToggle", view).addEventListener("change", () => savePublishSettings());
    $("#hcToggle", view).addEventListener("change", () => savePublishSettings());
    $("#rbToggle", view).addEventListener("change", () => savePublishSettings());
    $("#retentionInput", view).addEventListener("change", () => savePublishSettings());
    $("[data-sync-preview]", view).addEventListener("click", async () => {
      const r = await AV.api.send("/api/sync/frontend?dry_run=1", "POST", {});
      if (!r.ok) { toast(r.error && r.error.message ? r.error.message : "Preview failed", "error"); return; }
      const lines = (r.data && r.data.output) || [];
      const m = modal({
        title: "Frontend sync — preview",
        body: `<pre style="font-size:12px;white-space:pre-wrap;max-height:360px;overflow-y:auto;background:var(--surface-3);padding:12px;border-radius:10px">${esc(lines.join("\n"))}</pre>`,
        actions: `<button class="btn btn--ghost" data-c>Close</button><button class="btn btn--primary" data-run>Sync now</button>`
      });
      $("[data-c]", m.el).addEventListener("click", m.close);
      $("[data-run]", m.el).addEventListener("click", () => { m.close(); runSync(); });
    });
    const runSync = async () => {
      const btn = $("[data-sync2]", view);
      if (btn) { btn.disabled = true; btn.innerHTML = `${icon("refresh", 12)} Syncing…`; }
      const r = await AV.api.send("/api/sync/frontend", "POST", {});
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon("refresh", 12)} Sync now`; }
      if (r.ok) {
        const lines = (r.data && r.data.output) || [];
        toast("Frontend synced — " + (lines.find(l => l.includes("file(s)")) || "done"));
        AV.publishSite();
      } else {
        toast(r.error && r.error.message ? r.error.message : "Sync failed — is the frontend folder configured?", "error");
      }
    };
    $("[data-sync]", view).addEventListener("click", runSync);
    $("[data-sync2]", view).addEventListener("click", runSync);
    loadPublishSettings();
  });

  /* ============================================================
     PUBLISH HOOK — any [data-publish] button does the real thing
     ============================================================ */
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-publish]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    AV.publishSite();
  }, true);
})();
