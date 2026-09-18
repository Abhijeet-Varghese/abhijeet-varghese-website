// Centralized API layer — the ONLY place that talks to the AV OS PHP backend.
// Handles: base URL, timeouts, error normalization, and the documented
// EmailJS delivery fallback for lead capture (ported from js/emailjs-fallback.js).
import snapshot from '../data/snapshot.json';

export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK', cause = null } = {}) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.cause = cause;
  }
}

export async function apiFetch(path, { method = 'GET', body, timeoutMs = 10000, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'same-origin',
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok || (data && data.ok === false)) {
      throw new ApiError((data && (data.error?.message || data.error)) || `Request failed (${res.status})`, { status: res.status, code: (data && data.error?.code) || 'HTTP' });
    }
    return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Request timed out', { code: 'TIMEOUT', cause: err });
    throw new ApiError('Backend unavailable', { code: 'NETWORK', cause: err });
  } finally { clearTimeout(timer); }
}

/* ---------- content (CMS) ---------- */
let contentPromise = null;
export function getContent({ maxAgeMs = 30000 } = {}) {
  if (contentPromise && Date.now() - contentPromise.at < maxAgeMs) return contentPromise.p;
  const p = apiFetch('/api/public/content').then(
    (d) => ({ content: d.content, version: d.version, generated: d.generated, fallback: false }),
    () => ({ content: snapshot.content, version: snapshot.version, generated: snapshot.generated, fallback: true })
  );
  contentPromise = { p, at: Date.now() };
  return p;
}
export const snapshotContent = snapshot.content;

/* ---------- EmailJS delivery fallback (lead capture) ---------- */
const SERVICE_ID = 'service_sa2s1c9';
const OWNER_TEMPLATE_ID = 'template_bf12i18';
const VISITOR_TEMPLATE_ID = 'template_n2ql8q9';
const PUBLIC_KEY = 'IdNuDWb_8YJTbre82';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
const BACKEND_TIMEOUT_MS = 8000;
const EMAILJS_SEND_GAP_MS = 1200;
const SEND_ATTEMPTS = 3;

let sdkPromise = null;
function loadSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SDK_URL; s.async = true;
    s.onload = () => { try { window.emailjs.init({ publicKey: PUBLIC_KEY }); resolve(window.emailjs); } catch (e) { reject(e); } };
    s.onerror = () => reject(new Error('EmailJS SDK failed to load'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fmtFallbackMessage(body) {
  const msg = String(body || '');
  const m = msg.match(/(?:^|\n\n)Requested intro call:\s*(.*?)\s+at\s+([^\r\n]+)\s+IST\s*$/s);
  return {
    formMessage: m ? msg.replace(/(?:^|\n\n)Requested intro call:.*$/s, '').trim() : msg,
    booking_date: m ? m[1].trim() : '—',
    booking_time: m ? m[2].trim() + ' IST' : '—',
  };
}
function buildParams(payload) {
  const booking = fmtFallbackMessage(payload.message);
  return {
    name: String(payload.name || ''), email: String(payload.email || ''),
    company: String(payload.organization || '—'),
    phone: String(payload.full_phone_number || payload.phone_number || '—'),
    message: booking.formMessage || '—', booking_date: booking.booking_date, booking_time: booking.booking_time,
    owner_mobile: '+91 969 408 0706', site_name: 'Abhijeet Varghese',
    site_url: 'https://abhijeetvarghese.com', admin_url: 'https://abhijeetvarghese.com/admin/',
  };
}
async function sendWithRetry(emailjs, template, params) {
  let lastError = null;
  for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
    try {
      const result = await emailjs.send(SERVICE_ID, template, params);
      if (result && result.status === 200) return true;
      lastError = new Error('EmailJS send failed (' + ((result && result.status) || 'no status') + ')');
    } catch (error) { lastError = error; }
    if (attempt < SEND_ATTEMPTS) await sleep(EMAILJS_SEND_GAP_MS);
  }
  throw lastError || new Error('EmailJS send failed');
}
async function sendFallback(payload) {
  const emailjs = await loadSdk();
  const params = buildParams(payload);
  if (!params.email) throw new Error('Visitor email is required for EmailJS fallback');
  let ownerOk = false;
  try { ownerOk = await sendWithRetry(emailjs, OWNER_TEMPLATE_ID, params); } catch { /* reported below */ }
  if (!ownerOk) return { owner: false, visitor: false };
  await sleep(EMAILJS_SEND_GAP_MS);
  let visitorOk = false;
  try { visitorOk = await sendWithRetry(emailjs, VISITOR_TEMPLATE_ID, params); } catch { /* degraded */ }
  return { owner: true, visitor: visitorOk };
}

/** POST /api/public/lead with the legacy delivery semantics:
 *  backend first (8s timeout); on failure/timeout EmailJS owner-first fallback.
 *  Returns { ok, fallback?, degraded? } — mirrors legacy Response shapes. */
export async function submitLead(payload) {
  let resp = null; let backendFailed = false;
  try {
    resp = await apiFetch('/api/public/lead', { method: 'POST', body: payload, timeoutMs: BACKEND_TIMEOUT_MS });
  } catch { backendFailed = true; }
  if (!backendFailed && resp && resp.ok !== false) {
    const d = resp || {};
    if (d.fallback_required === true && d.visitor_email_sent === false) {
      try { const sdk = await loadSdk(); await sendWithRetry(sdk, VISITOR_TEMPLATE_ID, buildParams(payload)); } catch { /* surfaced as degraded */ }
      return { ok: true, fallback: 'emailjs', degraded: 'visitor' };
    }
    return { ok: true, ...d };
  }
  try {
    const result = await sendFallback(payload);
    if (result.owner && result.visitor) return { ok: true, fallback: 'emailjs' };
    if (result.owner) return { ok: true, fallback: 'emailjs', degraded: 'visitor' };
    return { ok: false, fallback: 'emailjs', error: 'Fallback email delivery failed' };
  } catch {
    return { ok: false, fallback: 'emailjs', error: 'Fallback email delivery failed' };
  }
}
