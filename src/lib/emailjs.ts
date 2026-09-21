/**
 * AV EmailJS primary delivery — EmailJS is now the single email transport.
 * Backend persists the lead via /api/public/lead; this module delivers
 * owner + visitor emails via EmailJS.
 *
 * Uses EXISTING EmailJS credentials discovered in repo:
 *   service_sa2s1c9 / template_bf12i18 (owner) / template_n2ql8q9 (visitor) / IdNuDWb_8YJTbre82
 * Do NOT invent IDs — these are the only values that exist in the project.
 */
import type { LeadPayload } from '../types';

// Existing EmailJS configuration (verbatim from abhijeetvarghese/js/emailjs-fallback.js)
export const EMAILJS_SERVICE_ID = 'service_sa2s1c9';
export const EMAILJS_OWNER_TEMPLATE_ID = 'template_bf12i18';
export const EMAILJS_VISITOR_TEMPLATE_ID = 'template_n2ql8q9';
export const EMAILJS_PUBLIC_KEY = 'IdNuDWb_8YJTbre82';
export const EMAILJS_SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
export const EMAILJS_SEND_GAP_MS = 1200;
export const EMAILJS_SEND_ATTEMPTS = 3;

// Declare global emailjs populated by the SDK
declare global {
  interface Window {
    emailjs?: {
      init: (opts: { publicKey: string }) => void;
      send: (serviceId: string, templateId: string, params: Record<string, string>) => Promise<{ status: number; text?: string }>;
    };
  }
}

let sdkPromise: Promise<NonNullable<Window['emailjs']>> | null = null;

export function loadEmailJsSdk(): Promise<NonNullable<Window['emailjs']>> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = EMAILJS_SDK_URL;
    s.async = true;
    s.onload = () => {
      try {
        if (!window.emailjs) throw new Error('EmailJS SDK not available after load');
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        resolve(window.emailjs);
      } catch (e) {
        reject(e);
      }
    };
    s.onerror = () => reject(new Error('EmailJS SDK failed to load'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

function safe(v: unknown, fallback = ''): string {
  const s = String(v ?? '').trim();
  return s !== '' ? s : fallback;
}

function safeWithDash(v: unknown): string {
  const s = String(v ?? '').trim();
  return s !== '' ? s : '—';
}

function parseBooking(message: string): { formMessage: string; booking_date: string; booking_time: string } {
  const msg = String(message || '');
  const m = msg.match(/(?:^|\n\n)Requested intro call:\s*(.*?)\s+at\s+([^\r\n]+)\s+IST\s*$/s);
  if (!m) return { formMessage: msg.trim() !== '' ? msg.trim() : '—', booking_date: '—', booking_time: '—' };
  return {
    formMessage: msg.replace(/(?:^|\n\n)Requested intro call:.*$/s, '').trim() || '—',
    booking_date: m[1].trim() || '—',
    booking_time: (m[2].trim() + ' IST') || '—',
  };
}

function submittedAtNow(): string {
  try {
    return new Date().toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: true,
    }) + ' IST';
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Build comprehensive EmailJS template params covering ALL required fields.
 * Uses safe empty-string / dash fallbacks so undefined never breaks the request.
 * Sends many aliases so both legacy and new template variable names resolve.
 */
export function buildEmailJsParams(payload: LeadPayload): Record<string, string> {
  const booking = parseBooking(payload.message);
  const submittedAt = submittedAtNow();
  const fullPhone = safe(payload.full_phone_number) || safe(payload.phone_number ? `+${String(payload.country_code).replace(/\D/g, '')}${payload.phone_number}` : '');
  const phoneDisplay = fullPhone || '—';

  // Derive country display: prefer country_code dial, fallback phone prefix not needed
  const countryCode = safe(payload.country_code);
  const base: Record<string, string> = {
    // identity
    name: safe(payload.name),
    visitor_name: safe(payload.name),
    from_name: safe(payload.name),
    email: safe(payload.email),
    visitor_email: safe(payload.email),
    from_email: safe(payload.email),

    // phone
    phone: phoneDisplay,
    phone_number: safe(payload.phone_number),
    full_phone_number: safe(payload.full_phone_number) || fullPhone,
    country: countryCode,
    country_code: countryCode,

    // org
    company: safeWithDash(payload.organization),
    organisation: safeWithDash(payload.organization),
    organization: safeWithDash(payload.organization),

    // project
    project_type: safe(payload.project_type) || 'intro call request',
    inquiry_type: safe(payload.project_type) || 'intro call request',
    project: safe(payload.project_type) || 'intro call request',
    type: safe(payload.project_type) || 'intro call request',

    // message + booking
    message: booking.formMessage,
    enquiry_message: booking.formMessage,
    visitor_message: booking.formMessage,
    details: booking.formMessage,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    date: booking.booking_date,
    time: booking.booking_time,
    preferred_date: booking.booking_date,
    preferred_time: booking.booking_time,

    // source / tracking
    source: safe(payload.source),
    page: safe(payload.page),
    source_page: safe(payload.page),
    page_url: safe(payload.page),
    current_page: safe(payload.page),
    referrer: safe(payload.referrer),
    referrer_url: safe(payload.referrer),
    utm_source: safe(payload.utm_source),
    utm_medium: safe(payload.utm_medium),
    utm_campaign: safe(payload.utm_campaign),
    utm_term: safe(payload.utm_term),
    utm_content: safe(payload.utm_content),

    // meta
    submitted_at: submittedAt,
    timestamp: submittedAt,
    submission_date: submittedAt,
    site_name: 'Abhijeet Varghese',
    site_url: 'https://abhijeetvarghese.com',
    admin_url: 'https://abhijeetvarghese.com/admin/',
    owner_mobile: '+91 969 408 0706',
  };

  // Add owner/visitor specific reply_to helpers (caller will override as needed)
  // Default reply_to = visitor email for owner, hi@ for visitor — but include both
  base['reply_to'] = safe(payload.email);
  base['to_email'] = safe(payload.email);
  base['owner_email'] = 'hi@abhijeetvarghese.com';
  base['owner_emails'] = 'hi@abhijeetvarghese.com, abhijeetvarghese33@gmail.com, write4abhijeet@gmail.com';

  return base;
}

export function buildOwnerParams(payload: LeadPayload): Record<string, string> {
  const p = buildEmailJsParams(payload);
  // Owner notification: Reply-To must be visitor email where supported
  p['reply_to'] = safe(payload.email);
  // Provide explicit owner recipient hint if template uses it
  p['to_email'] = p['owner_emails'];
  p['owner_email'] = 'hi@abhijeetvarghese.com';
  return p;
}

export function buildVisitorParams(payload: LeadPayload): Record<string, string> {
  const p = buildEmailJsParams(payload);
  // Visitor confirmation: Reply-To must be hi@abhijeetvarghese.com
  p['reply_to'] = 'hi@abhijeetvarghese.com';
  p['to_email'] = safe(payload.email);
  p['visitor_email'] = safe(payload.email);
  return p;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendWithRetry(
  emailjs: NonNullable<Window['emailjs']>,
  templateId: string,
  params: Record<string, string>,
): Promise<boolean> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= EMAILJS_SEND_ATTEMPTS; attempt++) {
    try {
      const result = await emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
      if (result && result.status === 200) return true;
      lastError = new Error('EmailJS send failed (' + ((result && (result as { status?: number }).status) || 'no status') + ')');
    } catch (e) {
      lastError = e;
    }
    if (attempt < EMAILJS_SEND_ATTEMPTS) await sleep(EMAILJS_SEND_GAP_MS);
  }
  // Log safe diagnostic without exposing secrets
  try {
    console.warn('[EmailJS] sendWithRetry failed after', EMAILJS_SEND_ATTEMPTS, 'attempts', String((lastError as Error)?.message || lastError || '').slice(0, 200));
  } catch { void 0; }
  throw lastError || new Error('EmailJS send failed');
}

export async function sendOwnerEmail(payload: LeadPayload): Promise<boolean> {
  if (!safe(payload.email)) throw new Error('Visitor email required');
  const emailjs = await loadEmailJsSdk();
  return sendWithRetry(emailjs, EMAILJS_OWNER_TEMPLATE_ID, buildOwnerParams(payload));
}

export async function sendVisitorEmail(payload: LeadPayload): Promise<boolean> {
  if (!safe(payload.email)) throw new Error('Visitor email required');
  const emailjs = await loadEmailJsSdk();
  return sendWithRetry(emailjs, EMAILJS_VISITOR_TEMPLATE_ID, buildVisitorParams(payload));
}

export async function sendBothEmails(payload: LeadPayload): Promise<{ ownerOk: boolean; visitorOk: boolean }> {
  let ownerOk = false;
  try {
    ownerOk = await sendOwnerEmail(payload);
  } catch { void 0; ownerOk = false; }
  if (!ownerOk) return { ownerOk: false, visitorOk: false };
  await sleep(EMAILJS_SEND_GAP_MS);
  let visitorOk = false;
  try {
    visitorOk = await sendVisitorEmail(payload);
  } catch { void 0; visitorOk = false; }
  return { ownerOk: true, visitorOk };
}
