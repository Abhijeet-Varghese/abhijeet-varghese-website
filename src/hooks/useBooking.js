import { useEffect } from 'react';
import { AV_COUNTRIES } from '../data/countries.js';
import { submitLead } from '../api/client.js';

const pad = (n) => String(n).padStart(2, '0');
const istNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// IST business-hours slots, Mon–Sat (matches legacy intro-call offering).
function slotsFor(y, m, d) {
  const day = new Date(y, m, d).getDay();
  if (day === 0) return [];
  return ['10:00','11:30','14:00','15:30','17:00'];
}

/** Contact + intro-call booking controller. Operates on the legacy DOM ids so
 *  the approved markup/CSS stays byte-identical: bookForm, bookView, bookDone,
 *  dateTrigger/dateTriggerText, datePop, dpTitle/dpPrev/dpNext/dpGrid, tslots. */
export default function useBooking() {
  useEffect(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const form = $('#contactForm');
    if (!form) return undefined;
    const bookView = $('#bookView'); const bookDone = $('#bookDone');
    const dateTrigger = $('#dateTrigger'); const dateTriggerText = $('#dateTriggerText');
    const datePop = $('#datePop'); const dpGrid = $('#dpGrid'); const dpTitle = $('#dpTitle');
    const dpPrev = $('#dpPrev'); const dpNext = $('#dpNext');
    const slotBox = $('#tslots'); const slotHint = $('#slotHint');
    const errText = { name: 'Please tell us your name.', email: 'Please provide a valid email address.', country: 'Please choose your country.', phone: 'Please provide a reachable phone number.', date: 'Please choose a date for your intro call.', tslots: 'Please choose a preferred time slot.' };
    const countryBtn = $('#cfCc'); const countryPop = $('#cfCcPop'); const countryList = $('#cfCcList');
    const countryFlag = $('#cfCcFlag'); const countryCode = $('#cfCcCode'); const countryValue = $('#cfCcValue');
    const countryInput = form.elements.country_code;

    let now = istNow();
    let vy = now.getFullYear(); let vm = now.getMonth();
    let selectedDate = null; let chosenSlot = null;
    const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const maxMonth = new Date(now.getFullYear(), now.getMonth() + 3, 1);

    const fmtLong = (dt) => `${DAYS[(dt.getDay() + 6) % 7]} ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;

    function renderCal() {
      if (!dpGrid) return;
      dpTitle && (dpTitle.textContent = `${MONTHS[vm]} ${vy}`);
      if (dpPrev) dpPrev.disabled = new Date(vy, vm, 1) <= minMonth;
      if (dpNext) dpNext.disabled = new Date(vy, vm + 1, 1) >= maxMonth;
      dpGrid.innerHTML = '';
      const offset = (new Date(vy, vm, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(vy, vm + 1, 0).getDate();
      for (let i = 0; i < offset; i++) { const p = document.createElement('span'); p.className = 'dp-empty'; p.setAttribute('aria-hidden', 'true'); dpGrid.appendChild(p); }
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(vy, vm, d);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'dp-day'; b.textContent = String(d);
        b.setAttribute('aria-label', fmtLong(dt));
        const past = dt < new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const noSlots = slotsFor(vy, vm, d).length === 0;
        if (past) { b.disabled = true; b.classList.add('is-past'); }
        if (noSlots && !past) { b.disabled = true; }
        if (dt.toDateString() === now.toDateString()) b.classList.add('is-today');
        if (selectedDate && dt.toDateString() === selectedDate.toDateString()) { b.classList.add('is-selected'); b.setAttribute('aria-pressed', 'true'); }
        b.addEventListener('click', () => { selectedDate = dt; chosenSlot = null; renderCal(); renderSlots(); syncSummary(); closePop(); });
        dpGrid.appendChild(b);
      }
    }
    function renderSlots() {
      if (!slotBox) return;
      slotBox.innerHTML = '';
      const slots = selectedDate ? slotsFor(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : [];
      if (!selectedDate) { if (slotHint) slotHint.hidden = false; return; }
      if (slotHint) slotHint.hidden = true;
      slots.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tslot'; b.textContent = t + ' IST';
        if (t === chosenSlot) b.classList.add('is-set');
        b.addEventListener('click', () => { chosenSlot = t; renderSlots(); syncSummary(); clearFlag('tslots'); });
        slotBox.appendChild(b);
      });
    }
    function syncSummary() {
      if (dateTriggerText) dateTriggerText.textContent = selectedDate ? (chosenSlot ? `${fmtLong(selectedDate)} · ${chosenSlot} IST` : fmtLong(selectedDate)) : 'Choose a date';
      const live = $('#bookSummary');
      if (live) live.textContent = selectedDate ? `Requested intro call: ${fmtLong(selectedDate)}${chosenSlot ? ' at ' + chosenSlot + ' IST' : ''}` : '';
    }
    const openPop = () => { if (!datePop) return; renderCal(); datePop.classList.add('is-open'); datePop.hidden = false; dateTrigger && dateTrigger.setAttribute('aria-expanded', 'true'); };
    const closePop = () => { if (!datePop) return; datePop.classList.remove('is-open'); datePop.hidden = true; dateTrigger && dateTrigger.setAttribute('aria-expanded', 'false'); };

    const flag = (el, msg) => { if (!el) return; const wrap = el.closest('.field') || el.parentElement; if (wrap) { wrap.classList.add('is-flagged'); let e = wrap.querySelector('.field__err'); if (!e) { e = document.createElement('span'); e.className = 'field__err'; e.id = 'e-err-' + (el.id || el.name || 'f'); e.setAttribute('role', 'alert'); wrap.appendChild(e); } e.textContent = msg; } };
    const clearFlag = (key) => { const el = form.elements[key] || document.getElementById(key); if (!el) return; const wrap = el.closest ? (el.closest('.field') || el.parentElement) : null; if (wrap) { wrap.classList.remove('is-flagged'); const e = wrap.querySelector('.field__err'); if (e) e.textContent = ''; } };

    if (dateTrigger) dateTrigger.addEventListener('click', () => (datePop && datePop.classList.contains('is-open') ? closePop() : openPop()));
    if (dpPrev) dpPrev.addEventListener('click', () => { const d = new Date(vy, vm - 1, 1); if (d >= minMonth) { vy = d.getFullYear(); vm = d.getMonth(); renderCal(); } });
    if (dpNext) dpNext.addEventListener('click', () => { const d = new Date(vy, vm + 1, 1); if (d < maxMonth) { vy = d.getFullYear(); vm = d.getMonth(); renderCal(); } });
    document.addEventListener('click', (e) => { if (datePop && datePop.classList.contains('is-open') && !e.target.closest('#datePop') && !e.target.closest('#dateTrigger')) closePop(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });

    // country selector (legacy custom popup: cfCc → cfCcPop/cfCcList)
    const mobile = $('#cfMobile'); const phoneFull = $('#cfPhoneFull');
    let dial = '';
    if (countryBtn && countryPop && countryList) {
      AV_COUNTRIES.forEach(([code, name, code_dial]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cc-item'; b.dataset.code = code;
        b.innerHTML = `<span class="cc-item__code">${code.toUpperCase()}</span><span class="cc-item__name">${name}</span><span class="cc-item__dial">${code_dial}</span>`;
        b.addEventListener('click', () => {
          dial = code_dial;
          if (countryInput) countryInput.value = code;
          if (countryValue) countryValue.textContent = name;
          if (countryCode) countryCode.textContent = code_dial;
          if (countryFlag) countryFlag.textContent = code.toUpperCase();
          countryBtn.setAttribute('aria-expanded', 'false');
          countryPop.classList.remove('is-open'); countryPop.hidden = true;
          clearFlag('cfCc'); syncPhone(); countryBtn.focus();
        });
        countryList.appendChild(b);
      });
      countryPop.hidden = true;
      countryBtn.addEventListener('click', () => {
        const open = countryPop.classList.toggle('is-open');
        countryPop.hidden = !open;
        countryBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', (e) => { if (!e.target.closest('#cfCcPop') && !e.target.closest('#cfCc')) { countryPop.classList.remove('is-open'); countryPop.hidden = true; countryBtn.setAttribute('aria-expanded', 'false'); } });
    }
    const syncPhone = () => { if (mobile && phoneFull) phoneFull.value = dial && mobile.value.replace(/\D/g, '') ? `${dial} ${mobile.value.trim()}` : mobile.value.trim(); };
    if (mobile) mobile.addEventListener('input', syncPhone);
    syncPhone();
    renderSlots(); syncSummary();

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = Object.fromEntries(new FormData(form).entries());
      let ok = true;
      if (!String(f.name || '').trim()) { flag(form.elements.name, errText.name); ok = false; } else clearFlag('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email || ''))) { flag(form.elements.email, errText.email); ok = false; } else clearFlag('email');
      const goodPhone = Boolean(f.full_phone_number || f.phone) && String(f.phone || '').replace(/\D/g, '').length >= 4;
      if (!goodPhone) { flag(mobile || form.elements.phone, errText.phone); ok = false; } else clearFlag('cfMobile');
      if (!f.country_code) { flag(countryBtn, errText.country); ok = false; }
      if (!selectedDate) { flag(dateTrigger || form, errText.date); ok = false; } else if (form.elements.date) form.elements.date.value = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      if (!chosenSlot) { if (slotHint) { slotHint.hidden = false; slotHint.textContent = errText.tslots; } ok = false; }
      if (!ok) return;
      const btn = $('#bookSubmit') || form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
      const utm = new URLSearchParams(location.search);
      const payload = {
        name: f.name, email: f.email, country_code: f.country_code || '', phone_number: f.phone || '',
        full_phone_number: f.full_phone_number || (phoneFull ? phoneFull.value : ''), organization: f.organization || '',
        message: [f.message, `Requested intro call: ${fmtLong(selectedDate)} at ${chosenSlot} IST`].filter(Boolean).join('\n\n'),
        project_type: 'intro call request', source: 'website', page: location.pathname, referrer: document.referrer || '',
        utm_source: utm.get('utm_source') || '', utm_medium: utm.get('utm_medium') || '', utm_campaign: utm.get('utm_campaign') || '',
      };
      const res = await submitLead(payload);
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
      if (res && res.ok) { if (bookView) bookView.hidden = true; if (bookDone) { bookDone.hidden = false; bookDone.classList.add('is-show'); } }
      else { flag(btn, 'We could not send that just now. Please email hi@abhijeetvarghese.com.'); }
    });
    return undefined;
  }, []);
}
