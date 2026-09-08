/* ============================================================
   AV OS — data layer: backend API + local store
   The content store is the authoritative source (pulled from
   /api/content). The empty skeleton below only guarantees the
   expected shape before the first pull / when offline.
   ============================================================ */
window.AV = {};

/* ---------- Empty store shape ---------- */
AV.seed = {
  settings: {
    siteName: "AbhijeetVarghese.com",
    tagline: "",
    email: "",
    phone: "",
    theme: "light",
    sidebarCollapsed: false,
    designTokens: {
      radius: 16, shadow: 40, spacing: 24, container: 1280, accent: "#2E5AAC",
      bodyFont: "Inter Tight", headingFont: "Inter Tight", accentFont: "Instrument Serif"
    }
  },
  nav: { primary: [], footerColumns: [], copyright: "" },
  sections: [],
  pages: [],
  projects: [],
  articles: [],
  clients: [],
  media: [],
  seo: [],
  testimonials: [],
  downloads: []
};

/* ---------- Backend API layer ----------
   The CMS talks to the AV OS server: content store (GET/PUT) and uploads.
   Falls back to localStorage when offline. The public website is static —
   there is no publish step. */
AV.api = {
  connected: false,
  _timer: null,
  _pending: false,   // a debounced PUT is scheduled or in flight
  csrf: "",
  /* fetch with session CSRF header + auth handling */
  async _req(url, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers["Accept"] = "application/json";
    if (opts.method && opts.method !== "GET") {
      opts.headers["X-CSRF-Token"] = this.csrf;
      opts.headers["Content-Type"] = "application/json";
    }
    opts.credentials = "same-origin";
    const r = await fetch(url, opts);
    if (r.status === 401 && !location.pathname.includes("login")) {
      location.href = "/admin/login.php";
      throw new Error("unauthorized");
    }
    return r;
  },
  async session() {
    try {
      const r = await fetch("/api/session", { credentials: "same-origin" });
      const d = await r.json();
      if (d.ok && d.data && d.data.authed) {
        this.csrf = d.data.csrf || "";
        AV.sessionMustChange = !!d.data.must_change_password;
        AV.permissions = d.data.permissions || [];
        return true;
      }
      return false;
    } catch (e) { return false; }
  },
  async pull() {
    try {
      const r = await this._req("/api/content");
      if (!r.ok) throw new Error("api down");
      const payload = await r.json();
      const data = payload && payload.data ? payload.data : payload;
      if (data && typeof data === "object" && data.settings && data.sections) {
        this.stateVersions = data._versions || {};
        delete data._versions;
        AV.store.state = data;
        AV.store.saveLocal();
        this.connected = true;
        return true;
      }
      throw new Error("bad payload");
    } catch (e) {
      this.connected = false;
      return false;
    }
  },
  cancelPush() {
    clearTimeout(this._timer);
    this._pending = false;
  },
  push() {
    clearTimeout(this._timer);
    this._pending = true;
    this._timer = setTimeout(async () => {
      try {
        const body = Object.assign({}, AV.store.state);
        body.base_versions = this.stateVersions || {};
        const r = await this._req("/api/content", { method: "PUT", body: JSON.stringify(body) });
        if (r.status === 409) {
          this.connected = true;
          this._pending = false;
          if (AV.emitStatus) AV.emitStatus("conflict");
          try {
            const p = await r.json();
            if (AV.toast) AV.toast((p.error && p.error.message) || "Content conflict — another session saved first", "error");
          } catch (e) {}
          return;
        }
        this.connected = r.ok;
        if (r.ok) {
          const p = await r.json().catch(() => ({}));
          if (AV.emitStatus) AV.emitStatus("saved");
        } else if (AV.emitStatus) {
          AV.emitStatus("save-failed");
        }
      } catch (e) {
        this.connected = false;
        if (AV.emitStatus) AV.emitStatus("save-failed");
      } finally {
        this._pending = false;
      }
    }, 600);
  },
  async get(path) {
    try {
      const r = await this._req(path);
      const p = await r.json().catch(() => ({}));
      return { ok: r.ok, data: p.data ?? p, error: p.error };
    } catch (e) { return { ok: false, error: { message: e.message } }; }
  },
  async send(path, method, body) {
    try {
      const r = await this._req(path, { method, body: body ? JSON.stringify(body) : undefined });
      const p = await r.json().catch(() => ({}));
      return { ok: r.ok && p.ok !== false, data: p.data ?? p, error: p.error };
    } catch (e) { return { ok: false, error: { message: e.message } }; }
  },
  async upload(name, base64, folder, dims) {
    try {
      const r = await this._req("/api/media", { method: "POST", body: JSON.stringify({ name, data: base64, folder, ...(dims || {}) }) });
      const payload = await r.json().catch(() => ({}));
      return payload && payload.data ? { ok: r.ok, ...payload.data, error: payload.error && payload.error.message } : payload;
    } catch (e) { return { ok: false, error: e.message }; }
  }
};

/* ---------- Store (server state mirrored to localStorage) ---------- */
AV.store = {
  KEY: "avos-state-v1",
  state: null,
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) { this.state = JSON.parse(raw); return; }
    } catch (e) { /* fresh start */ }
    this.state = JSON.parse(JSON.stringify(AV.seed));
    this.save();
  },
  save() {
    this.saveLocal();
    if (AV.emitStatus) AV.emitStatus('local-draft');   // LOCAL DRAFT until server confirms
    AV.api.push();
  },
  saveLocal() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { /* quota */ }
  },
  get(area) { return this.state[area]; },
  set(area, value) { this.state[area] = value; this.save(); },
  reset() { localStorage.removeItem(this.KEY); this.load(); }
};
AV.store.load();
