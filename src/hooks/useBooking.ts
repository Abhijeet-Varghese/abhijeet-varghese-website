import { useEffect } from 'react';
import { AV_COUNTRIES } from '../data/countries';
import type { LeadPayload } from '../types';
import { sendBothEmails } from '../lib/emailjs';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function flagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(
    0x1f1e6 + code.charCodeAt(0) - 65,
    0x1f1e6 + code.charCodeAt(1) - 65,
  );
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function longDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function safeLog(email: string): string {
  if (!email) return 'unknown';
  return email.replace(/(.{2}).+(@.+)/, '$1***$2');
}

/**
 * Primary EmailJS delivery: backend persists lead via /api/public/lead, then
 * EmailJS delivers owner + visitor emails. No SMTP dependency.
 * Returns saved + ownerOk/visitorOk so the UI only shows success when
 * the required owner email has been delivered.
 */
async function submitLead(payload: LeadPayload): Promise<{ saved: boolean; ownerOk: boolean; visitorOk: boolean }> {
  try {
    const response = await fetch('/api/public/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { saved: false, ownerOk: false, visitorOk: false };
    let body: unknown = null;
    try {
      const parsed: unknown = await response.clone().json();
      body = parsed;
    } catch { void 0; }
    const data = (body && typeof body === 'object' && (body as Record<string, unknown>).data && typeof (body as Record<string, unknown>).data === 'object' ? (body as Record<string, unknown>).data : body) as Record<string, unknown> | null;
    if (data && data.fallback === 'emailjs') {
      const visitorOk = data.degraded !== 'visitor';
      return { saved: true, ownerOk: true, visitorOk };
    }
    // Lead persisted — EmailJS is now responsible for actual delivery.
    try {
      const { ownerOk, visitorOk } = await sendBothEmails(payload);
      return { saved: true, ownerOk, visitorOk };
    } catch { void 0; return { saved: true, ownerOk: false, visitorOk: false }; }
  } catch { void 0; return { saved: false, ownerOk: false, visitorOk: false }; }
}

/**
 * Booking form controller. It retains the reviewed IDs/classes/markup but
 * isolates mutable calendar, country-picker, validation, and lead transport
 * from the page's React content components.
 */
export function useBooking(): void {
  useEffect(() => {
    const form = document.getElementById('contactForm');
    if (!(form instanceof HTMLFormElement)) return;

    const byId = <T extends HTMLElement>(id: string): T | null => {
      const node = document.getElementById(id);
      return node instanceof HTMLElement ? node as T : null;
    };
    const listen = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Document,
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions | boolean,
    ) => {
      target.addEventListener(type, handler as EventListener, options);
      cleanup.push(() => target.removeEventListener(type, handler as EventListener, options));
    };
    const cleanup: Array<() => void> = [];
    const timers = new Set<number>();
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const bookView = byId<HTMLElement>('bookView');
    const bookDone = byId<HTMLElement>('bookDone');
    const doneSummary = byId<HTMLElement>('doneSummary');
    const doneMail = byId<HTMLAnchorElement>('doneMail');
    const bookAgain = byId<HTMLButtonElement>('bookAgain');
    const nameInput = byId<HTMLInputElement>('cfName');
    const emailInput = byId<HTMLInputElement>('cfEmail');
    const organizationInput = byId<HTMLInputElement>('cfOrg');
    const mobileInput = byId<HTMLInputElement>('cfMobile');
    const phoneWrap = byId<HTMLElement>('cfPhoneWrap');
    const phoneFull = byId<HTMLInputElement>('cfPhoneFull');
    const countryValue = byId<HTMLInputElement>('cfCcValue');
    const messageInput = byId<HTMLTextAreaElement>('cfMsg');
    const countryButton = byId<HTMLButtonElement>('cfCc');
    const countryFlag = byId<HTMLElement>('cfCcFlag');
    const countryCode = byId<HTMLElement>('cfCcCode');
    const countryPopup = byId<HTMLElement>('cfCcPop');
    const countryList = byId<HTMLElement>('cfCcList');
    const dateTrigger = byId<HTMLButtonElement>('dateTrigger');
    const dateTriggerText = byId<HTMLElement>('dateTriggerText');
    const datePopup = byId<HTMLElement>('datePop');
    const datePicker = form.querySelector<HTMLElement>('.datepick');
    const dateGrid = byId<HTMLElement>('dpGrid');
    const dateTitle = byId<HTMLElement>('dpTitle');
    const previousMonth = byId<HTMLButtonElement>('dpPrev');
    const nextMonth = byId<HTMLButtonElement>('dpNext');
    const hiddenDate = byId<HTMLInputElement>('cfDate');
    const slots = byId<HTMLElement>('tslots');
    const slotButtons = Array.from(form.querySelectorAll<HTMLButtonElement>('.tslot'));
    const slotHint = byId<HTMLElement>('slotHint');
    const summary = byId<HTMLElement>('bookSummary');
    const summaryText = byId<HTMLElement>('bookSummaryText');
    const note = byId<HTMLElement>('cfNote');
    const submitButton = byId<HTMLButtonElement>('bookSubmit');
    if (!(dateTrigger && dateTriggerText && datePopup && dateGrid && dateTitle && previousMonth && nextMonth && hiddenDate && slots && summary && summaryText && countryButton && countryPopup && countryList && countryFlag && countryCode && countryValue && mobileInput && phoneFull && phoneWrap)) {
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileQuery = window.matchMedia('(max-width: 700px)');
    const countries = AV_COUNTRIES.map(([iso2, name, dial]) => ({ iso2, name, dial }));
    let activeCountries = countries;
    let countrySelection = 'in';
    let countryDial = '+91';
    let countryOpen = false;
    let countryActive = -1;
    let countrySuppressUntil = 0;
    let selectedSlot: string | null = null;
    let selectedDate: Date | null = null;
    let dateOpen = false;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    const minimumMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maximumMonth = new Date(today.getFullYear(), today.getMonth() + 4, 1);
    let viewedMonth = new Date(minimumMonth);

    const errorMessage = (field: HTMLElement, message: string) => {
      const id = `e-err-${field.id || field.getAttribute('name') || 'field'}`;
      let error = document.getElementById(id);
      if (!(error instanceof HTMLElement)) {
        error = document.createElement('p');
        error.id = id;
        error.className = 'e-field-error';
        error.setAttribute('role', 'alert');
        field.insertAdjacentElement('afterend', error);
      }
      error.textContent = message;
      field.setAttribute('aria-invalid', 'true');
      const describedBy = (field.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
      if (!describedBy.includes(id)) field.setAttribute('aria-describedby', [...describedBy, id].join(' '));
    };
    const clearError = (field: HTMLElement) => {
      const id = `e-err-${field.id || field.getAttribute('name') || 'field'}`;
      field.classList.remove('is-invalid', 'is-flagged');
      field.removeAttribute('aria-invalid');
      document.getElementById(id)?.remove();
      const describedBy = (field.getAttribute('aria-describedby') ?? '').split(' ').filter((value) => value && value !== id);
      if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
      else field.removeAttribute('aria-describedby');
    };
    const flagInvalid = (field: HTMLElement, message: string) => {
      field.classList.add('is-invalid');
      errorMessage(field, message);
    };
    const flagChoice = (field: HTMLElement, message: string) => {
      field.classList.add('is-flagged');
      errorMessage(field, message);
    };

    const updateFullPhone = () => {
      const national = mobileInput.value.replace(/\D/g, '');
      phoneFull.value = national ? `+${countryDial.replace(/\D/g, '')}${national}` : '';
    };
    const setCountry = (iso2: string) => {
      const country = countries.find((entry) => entry.iso2 === iso2);
      if (!country) return;
      countrySelection = country.iso2;
      countryDial = country.dial;
      countryFlag.textContent = flagEmoji(country.iso2);
      countryCode.textContent = country.dial;
      countryValue.value = country.dial;
      updateFullPhone();
    };
    const renderCountries = () => {
      // Preserve the original picker’s render ownership: opening and every
      // keyboard render begins at its first country, even after a selection.
      activeCountries = countries;
      countryActive = activeCountries.length ? 0 : -1;
      countryList.replaceChildren(...activeCountries.map((country, index) => {
        const option = document.createElement('li');
        option.className = `cf-cc-opt${country.iso2 === countrySelection ? ' is-selected' : ''}${index === countryActive ? ' is-active' : ''}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(country.iso2 === countrySelection));
        option.dataset.i = String(index);
        option.tabIndex = index === countryActive ? 0 : -1;
        option.setAttribute('aria-label', `${country.name}, ${country.dial}`);
        const flag = document.createElement('span');
        flag.className = 'cf-cc-opt__flag';
        flag.setAttribute('aria-hidden', 'true');
        flag.textContent = flagEmoji(country.iso2);
        const dial = document.createElement('span');
        dial.className = 'cf-cc-opt__dial';
        dial.textContent = country.dial;
        option.append(flag, dial);
        return option;
      }));
    };
    const focusCountry = () => {
      const option = countryList.querySelectorAll<HTMLElement>('.cf-cc-opt')[countryActive];
      option?.focus({ preventScroll: true });
      option?.scrollIntoView({ block: 'nearest' });
    };
    const closeCountries = (refocus?: HTMLElement) => {
      countryOpen = false;
      countryPopup.hidden = true;
      countryButton.setAttribute('aria-expanded', 'false');
      refocus?.focus();
    };
    const openCountries = () => {
      countryOpen = true;
      countryPopup.hidden = false;
      countryButton.setAttribute('aria-expanded', 'true');
      renderCountries();
      focusCountry();
    };
    const selectCountry = (index: number) => {
      const country = activeCountries[index];
      if (!country) return;
      setCountry(country.iso2);
      closeCountries(mobileInput);
      countrySuppressUntil = Date.now() + 250;
    };

    const updateSummary = () => {
      if (selectedDate && selectedSlot) {
        summary.classList.add('is-set');
        summaryText.innerHTML = `<strong>${longDate(selectedDate)} · ${selectedSlot} IST</strong>&nbsp;— 30 min intro call`;
      } else if (selectedDate) {
        summary.classList.remove('is-set');
        summaryText.innerHTML = `${longDate(selectedDate)} —&nbsp;now pick a time`;
      } else if (selectedSlot) {
        summary.classList.remove('is-set');
        summaryText.innerHTML = `${selectedSlot} IST —&nbsp;now pick a day`;
      } else {
        summary.classList.remove('is-set');
        summaryText.textContent = 'Pick a day and a time';
      }
    };

    const closeDate = () => {
      if (!dateOpen) return;
      dateOpen = false;
      datePopup.classList.remove('is-open');
      dateTrigger.setAttribute('aria-expanded', 'false');
      dateTrigger.classList.remove('is-open');
      later(() => {
        if (!dateOpen) datePopup.hidden = true;
      }, 320);
    };
    const openDate = () => {
      if (dateOpen) return;
      dateOpen = true;
      datePopup.hidden = false;
      dateTrigger.setAttribute('aria-expanded', 'true');
      dateTrigger.classList.add('is-open');
      requestAnimationFrame(() => requestAnimationFrame(() => datePopup.classList.add('is-open')));
    };

    const renderCalendar = () => {
      const year = viewedMonth.getFullYear();
      const month = viewedMonth.getMonth();
      dateTitle.textContent = viewedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      previousMonth.disabled = viewedMonth <= minimumMonth;
      nextMonth.disabled = new Date(year, month + 1, 1) >= maximumMonth;
      dateGrid.replaceChildren();
      const offset = (new Date(year, month, 1).getDay() + 6) % 7;
      const days = new Date(year, month + 1, 0).getDate();
      for (let index = 0; index < offset; index += 1) {
        const pad = document.createElement('span');
        pad.className = 'dp-empty';
        pad.setAttribute('aria-hidden', 'true');
        dateGrid.append(pad);
      }
      const todayISO = isoDate(today);
      for (let day = 1; day <= days; day += 1) {
        const date = new Date(year, month, day);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'dp-day';
        cell.textContent = String(day);
        cell.setAttribute('role', 'gridcell');
        if (isoDate(date) === todayISO) cell.classList.add('is-today');
        if (selectedDate && isoDate(date) === isoDate(selectedDate)) cell.classList.add('is-selected');
        if (date <= today) {
          cell.disabled = true;
          cell.setAttribute('aria-disabled', 'true');
        } else {
          cell.setAttribute('aria-label', longDate(date));
          cell.addEventListener('click', () => {
            selectedDate = date;
            hiddenDate.value = isoDate(date);
            dateTriggerText.textContent = shortDate(date);
            dateTrigger.classList.add('is-set');
            clearError(dateTrigger);
            datePicker?.classList.remove('is-flagged');
            closeDate();
            renderCalendar();
            updateSummary();
          });
        }
        dateGrid.append(cell);
      }
    };

    const selectSlot = (slot: HTMLButtonElement) => {
      slotButtons.forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-checked', 'false');
        button.tabIndex = -1;
      });
      slot.classList.add('is-active');
      slot.setAttribute('aria-checked', 'true');
      slot.tabIndex = 0;
      selectedSlot = slot.dataset.slot ?? null;
      clearError(slots);
      updateSummary();
    };

    const resetSubmitButton = () => {
      if (!submitButton) return;
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
      submitButton.innerHTML = 'Send booking request';
    };
    const buildMailto = (payload: { name: string; email: string; organization: string; message: string; fullPhone: string }) => {
      const subject = `Intro call request — ${payload.name}${payload.organization ? `(${payload.organization})` : ''} · ${selectedDate ? longDate(selectedDate) : ''} ${selectedSlot ?? ''} IST`;
      const lines = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Mobile: ${payload.fullPhone || '—'}`,
        `Organization: ${payload.organization || '—'}`,
        selectedDate && selectedSlot ? `Requested slot: ${longDate(selectedDate)} at ${selectedSlot} IST` : '',
        payload.message ? `Context notes:\n${payload.message}` : '',
      ].filter(Boolean);
      return `mailto:hi@abhijeetvarghese.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    };

    const onSubmit = async (event: SubmitEvent) => {
      event.preventDefault();
      const values = {
        name: nameInput?.value.trim() ?? '',
        email: emailInput?.value.trim() ?? '',
        organization: organizationInput?.value.trim() ?? '',
        message: messageInput?.value.trim() ?? '',
        countryCode: countryValue.value.trim(),
        phone: mobileInput.value.replace(/\D/g, ''),
        fullPhone: phoneFull.value.trim(),
      };
      let valid = true;
      if (!values.name && nameInput) {
        flagInvalid(nameInput, 'Please enter your name.');
        valid = false;
      }
      if (!emailPattern.test(values.email) && emailInput) {
        flagInvalid(emailInput, 'Please enter a valid email address.');
        valid = false;
      }
      if (!/^\+[1-9]\d{6,14}$/.test(values.fullPhone) || values.phone.length < 4) {
        flagInvalid(phoneWrap, 'Please enter a valid mobile number.');
        valid = false;
      }
      if (!selectedDate) {
        flagChoice(dateTrigger, 'Please choose a date for your intro call.');
        openDate();
        valid = false;
      }
      if (!selectedSlot) {
        flagChoice(slots, 'Please choose a preferred time slot.');
        valid = false;
      }
      if (!valid) {
        // main.js scrolls its first invalid input (falling back to the date
        // trigger), while elevate.js moves focus after its 450ms error pass.
        const scrollTarget = form.querySelector<HTMLElement>('.is-invalid') ?? dateTrigger;
        const focusTarget = form.querySelector<HTMLElement>('.is-invalid, .is-flagged');
        scrollTarget.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        if (focusTarget) {
          if (!/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(focusTarget.tagName)) {
            focusTarget.setAttribute('tabindex', '-1');
          }
          later(() => focusTarget.focus({ preventScroll: true }), 450);
        }
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        submitButton.innerHTML = 'Sending your request…';
      }
      if (note) {
        note.textContent = 'Saving your details — one moment.';
        note.classList.remove('is-set');
      }
      const utm = new URLSearchParams(location.search);
      const payload: LeadPayload = {
        name: values.name,
        email: values.email,
        country_code: values.countryCode,
        phone_number: values.phone,
        full_phone_number: values.fullPhone,
        organization: values.organization,
        message: [values.message, `Requested intro call: ${longDate(selectedDate!)} at ${selectedSlot!} IST`].filter(Boolean).join('\n\n'),
        project_type: 'intro call request',
        source: 'website',
        page: location.pathname,
        referrer: document.referrer || '',
        utm_source: utm.get('utm_source') ?? '',
        utm_medium: utm.get('utm_medium') ?? '',
        utm_campaign: utm.get('utm_campaign') ?? '',
        utm_term: utm.get('utm_term') ?? '',
        utm_content: utm.get('utm_content') ?? '',
      };
      const result = await submitLead(payload);
      resetSubmitButton();
      if (!result.saved) {
        if (note) {
          note.textContent = "I couldn't save the request just now. Please email hi@abhijeetvarghese.com.";
          note.classList.remove('is-set');
        }
        try {
          console.warn('[Booking] lead not saved', safeLog(payload.email));
        } catch { void 0; }
        return;
      }
      if (!result.ownerOk) {
        if (note) {
          note.textContent = "Your details were saved, but email delivery is pending. Please email hi@abhijeetvarghese.com directly and I'll confirm within 24 hours.";
          note.classList.remove('is-set');
        }
        try {
          console.warn('[Booking] owner EmailJS failed — lead retained', safeLog(payload.email));
        } catch { void 0; }
        return;
      }
      if (note) {
        note.textContent = result.visitorOk
          ? 'Request received — confirmation email sent.'
          : 'Request received — you will receive a confirmation shortly. I will confirm the time by email within 24 hours.';
        note.classList.add('is-set');
      }
      if (!result.visitorOk) {
        try {
          console.warn('[Booking] visitor EmailJS failed — owner was notified, lead retained', safeLog(payload.email));
        } catch { void 0; }
      }
      if (doneSummary && selectedDate && selectedSlot) {
        doneSummary.textContent = `Thanks${values.name ? `, ${values.name}` : ''}. Your request for ${longDate(selectedDate)} at ${selectedSlot} IST has been received.`;
      }
      if (doneMail) {
        doneMail.href = buildMailto(values);
        doneMail.textContent = values.message ? 'Send additional context' : 'Send a note by email';
      }
      if (bookView) bookView.hidden = true;
      if (bookDone) {
        bookDone.hidden = false;
        bookDone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        const heading = bookDone.querySelector<HTMLElement>('h2, h3');
        heading?.setAttribute('tabindex', '-1');
        later(() => heading?.focus({ preventScroll: true }), 450);
      }
    };

    const onBookAgain = () => {
      resetSubmitButton();
      form.reset();
      selectedSlot = null;
      selectedDate = null;
      slotButtons.forEach((slot, index) => {
        slot.classList.remove('is-active');
        slot.disabled = false;
        slot.tabIndex = index === 0 ? 0 : -1;
      });
      clearError(slots);
      clearError(dateTrigger);
      dateTrigger.classList.remove('is-set');
      dateTriggerText.textContent = 'Choose a date';
      hiddenDate.value = '';
      closeDate();
      form.querySelectorAll<HTMLElement>('.is-invalid, .is-flagged').forEach((field) => clearError(field));
      viewedMonth = new Date(minimumMonth);
      renderCalendar();
      updateSummary();
      if (note) {
        note.textContent = 'Your preferred time will be confirmed personally by email.';
        note.classList.remove('is-set');
      }
      if (bookDone) bookDone.hidden = true;
      if (bookView) bookView.hidden = false;
    };

    const onCountryButton = () => {
      if (Date.now() < countrySuppressUntil) return;
      if (countryOpen) closeCountries(countryButton);
      else openCountries();
    };
    const onCountryButtonKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        openCountries();
      }
    };
    const onCountryListKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCountries(countryButton);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        countryActive = Math.min(countryActive + 1, activeCountries.length - 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        countryActive = Math.max(countryActive - 1, 0);
      } else if (event.key === 'Home') {
        event.preventDefault();
        countryActive = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        countryActive = activeCountries.length - 1;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        selectCountry(countryActive);
        return;
      } else if (event.key === 'Tab') {
        closeCountries();
        return;
      } else {
        return;
      }
      renderCountries();
      focusCountry();
    };
    const onCountryListClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.cf-cc-opt') : null;
      const index = Number(target?.dataset.i);
      if (target && Number.isInteger(index)) {
        event.stopPropagation();
        selectCountry(index);
      }
    };
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (countryOpen && target && !phoneWrap.contains(target)) closeCountries(countryButton);
      if (dateOpen && target && !datePopup.contains(target) && !dateTrigger.contains(target)) closeDate();
    };
    const onDatePopupClick = (event: MouseEvent) => {
      // main.js keeps clicks inside the sheet local; home-mobile.js additionally
      // closes the open sheet when its touch-only backdrop itself is tapped.
      if (event.target === datePopup && mobileQuery.matches && datePopup.classList.contains('is-open')) {
        closeDate();
      } else {
        event.stopPropagation();
      }
    };
    const onGlobalKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDate();
    };
    const onSlotKey = (event: KeyboardEvent) => {
      const eligible = slotButtons.filter((button) => !button.disabled);
      if (!eligible.length || !(document.activeElement instanceof HTMLButtonElement) || !eligible.includes(document.activeElement)) return;
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = eligible.indexOf(document.activeElement);
      const columns = 3;
      let next: HTMLButtonElement;
      switch (event.key) {
        case 'ArrowRight': next = eligible[(index + 1) % eligible.length]; break;
        case 'ArrowLeft': next = eligible[(index - 1 + eligible.length) % eligible.length]; break;
        case 'ArrowDown': next = eligible[Math.min(index + columns, eligible.length - 1)]; break;
        case 'ArrowUp': next = eligible[Math.max(index - columns, 0)]; break;
        case 'Home': next = eligible[0]; break;
        case 'End': next = eligible[eligible.length - 1]; break;
        default: return;
      }
      selectSlot(next);
      next.focus({ preventScroll: true });
    };
    const onVisibility = () => {
      if (document.hidden) return;
      const currentToday = new Date();
      currentToday.setHours(0, 0, 0, 0);
      if (+currentToday !== +today) {
        today = currentToday;
        renderCalendar();
      }
    };

    setCountry('in');
    countryPopup.hidden = true;
    activeCountries = countries;
    renderCalendar();
    updateSummary();
    if (slotHint) slotHint.textContent = 'All standard times shown — final confirmation happens at booking.';
    slotButtons.forEach((slot, index) => {
      slot.tabIndex = index === 0 ? 0 : -1;
      listen(slot, 'click', () => {
        selectSlot(slot);
        slot.focus({ preventScroll: true });
      });
    });
    [nameInput, emailInput, mobileInput].forEach((field) => {
      if (!field) return;
      listen(field, 'input', () => clearError(field));
    });
    listen(mobileInput, 'input', () => {
      updateFullPhone();
      // main.js attaches its one-shot invalid-class clear to cfPhoneWrap, so
      // typing into its child input resolves that wrapper-owned error.
      clearError(phoneWrap);
    });
    listen(form, 'submit', onSubmit);
    listen(countryButton, 'click', onCountryButton);
    listen(countryButton, 'keydown', onCountryButtonKey);
    listen(countryList, 'keydown', onCountryListKey);
    listen(countryList, 'click', onCountryListClick);
    listen(dateTrigger, 'click', (event) => {
      event.stopPropagation();
      if (dateOpen) closeDate();
      else openDate();
    });
    listen(datePopup, 'click', onDatePopupClick);
    listen(previousMonth, 'click', () => {
      viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    listen(nextMonth, 'click', () => {
      viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1);
      renderCalendar();
    });
    listen(slots, 'keydown', onSlotKey);
    if (bookAgain) listen(bookAgain, 'click', onBookAgain);
    listen(document, 'click', onDocumentClick);
    listen(document, 'keydown', onGlobalKey);
    document.addEventListener('visibilitychange', onVisibility);
    cleanup.push(() => document.removeEventListener('visibilitychange', onVisibility));

    return () => {
      cleanup.forEach((dispose) => dispose());
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);
}
