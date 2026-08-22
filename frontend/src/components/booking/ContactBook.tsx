import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PUBLIC_EMAIL } from '@/config/identity';

/**
 * On-site contact / booking widget — custom calendar + time slots, submits to
 * `POST /api/public/lead` and never redirects to an external scheduler.
 *
 * Booking is a REQUEST (pending approval): the confirmation copy reflects the
 * admin-approval workflow, it does not falsely confirm a slot.
 *
 * Form fields (per spec): Name · Mobile Number · Email · Message · Calendar ·
 * Time Slot · Submit. No Organization field.
 */

const SLOTS = [
  { group: 'Morning', times: ['09:30', '10:30', '12:00'] },
  { group: 'Afternoon', times: ['13:30', '15:00', '16:30'] },
  { group: 'Evening', times: ['18:00', '19:30'] },
];

const fmtLong = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function ContactBook() {
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return startOfMonth(t);
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState<{ text: string; kind?: 'ok' | 'error' }>({
    text: 'Your message stays on this site. Time is optional.',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [dateOpen, setDateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const datePopRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);

  const prefersReduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 4, 1), [today]);

  /* --- date popover open/close --- */
  const openDate = useCallback(() => {
    const pop = datePopRef.current;
    const trigger = dateTriggerRef.current;
    if (!pop || !trigger) return;
    setDateOpen(true);
    pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-open');
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add('is-open')));
  }, []);

  const closeDate = useCallback(() => {
    const pop = datePopRef.current;
    const trigger = dateTriggerRef.current;
    if (!pop) return;
    setDateOpen(false);
    pop.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.classList.remove('is-open');
    window.setTimeout(() => {
      if (!pop.classList.contains('is-open')) pop.hidden = true;
    }, 320);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dateOpen) return;
    const onDocClick = () => closeDate();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDate();
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [dateOpen, closeDate]);

  const selectDate = useCallback(
    (d: Date) => {
      setSelectedDate(d);
      const trigger = dateTriggerRef.current;
      if (trigger) {
        trigger.classList.add('is-set');
        trigger.classList.remove('is-flagged');
      }
      closeDate();
    },
    [closeDate],
  );

  const selectSlot = useCallback((s: string) => {
    setChosenSlot(s);
  }, []);

  /* --- calendar grid --- */
  const grid = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayISO = iso(new Date());
    const cells: { day: number; date: Date }[] = [];
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      cells.push({ day: dNum, date: new Date(y, m, dNum) });
    }
    return { offset, cells, todayISO };
  }, [viewMonth]);

  const monthLabel = mounted ? viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
  const canPrev = viewMonth > minMonth;
  const canNext = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) < maxMonth;

  const dateTriggerText = selectedDate ? fmtShort(selectedDate) : 'Choose a date';

  /* --- summary --- */
  const slotLabel = useMemo(() => {
    if (selectedDate && chosenSlot) return `${fmtLong(selectedDate)} at ${chosenSlot} IST`;
    if (selectedDate) return fmtLong(selectedDate);
    if (chosenSlot) return `${chosenSlot} IST`;
    return '';
  }, [selectedDate, chosenSlot]);

  /* --- submit --- */
  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (submitting) return;

      const name = nameRef.current?.value.trim() ?? '';
      const email = emailRef.current?.value.trim() ?? '';
      const phone = phoneRef.current?.value.trim() ?? '';
      const msg = msgRef.current?.value.trim() ?? '';

      const nextErrors: Record<string, string> = {};
      if (!name) nextErrors.name = 'Please enter your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email.';
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        const bad = (nameRef.current && !name ? nameRef.current : emailRef.current) ?? null;
        bad?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        setNote({ text: 'Please complete the highlighted fields.', kind: 'error' });
        return;
      }

      setSubmitting(true);
      setNote({ text: 'Saving your details — one moment.' });

      const utm = new URLSearchParams(location.search);
      const payload = {
        name,
        email,
        phone,
        message: [msg, slotLabel ? `Preferred time: ${slotLabel}` : ''].filter(Boolean).join('\n\n'),
        project_type: slotLabel ? 'intro call request' : 'website message',
        source: 'website',
        page: location.pathname,
        referrer: document.referrer || '',
        utm_source: utm.get('utm_source') || '',
        utm_medium: utm.get('utm_medium') || '',
        utm_campaign: utm.get('utm_campaign') || '',
        website: '',
      };

      let saved = false;
      let errText = "I couldn't save the request just now. Please email hi@abhijeetvarghese.com.";
      try {
        const lr = await fetch('/api/public/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
          redirect: 'error',
        });
        const raw = await lr.text();
        let body: any = null;
        try {
          body = raw ? JSON.parse(raw) : null;
        } catch {
          body = null;
        }
        if (lr.ok && body && body.status !== 'spam') saved = true;
        else if (lr.status === 429)
          errText = `Too many submissions — please try again in a few minutes, or email ${PUBLIC_EMAIL}.`;
        else if (body && (body.error || body.message)) errText = String(body.error || body.message);
      } catch {
        saved = false;
      }

      setSubmitting(false);
      if (!saved) {
        setNote({ text: errText, kind: 'error' });
        return;
      }

      setDone(true);
      setNote({ text: 'Message saved on this site — no external calendar opened.', kind: 'ok' });
      window.setTimeout(() => {
        doneRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      }, 0);
    },
    [submitting, slotLabel, prefersReduced],
  );

  const reset = useCallback(() => {
    setChosenSlot(null);
    setSelectedDate(null);
    setSubmitting(false);
    setDone(false);
    setErrors({});
    formRef.current?.reset();
    setNote({ text: 'Your message stays on this site. Time is optional.' });
  }, []);

  const doneSummary = slotLabel
    ? `Thanks. Your message and preferred time (${slotLabel}) are saved.`
    : 'Thanks. Your message is saved — I\u0027ll reply by email within 24 hours.';

  return (
    <div className="book" data-reveal>
      <header className="book__head">
        <p className="book__eyebrow">Write from here</p>
        <h3>Send a message</h3>
        <p className="book__head-sub">Stays on this site · reply within 24 hours · no calendar redirect</p>
      </header>
      <div className="book__view" id="bookView" hidden={done}>
        <form
          className="cf"
          id="contactForm"
          action="/api/public/lead"
          method="post"
          noValidate
          ref={formRef}
          onSubmit={submit}
        >
          <div className="cf-hp" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" id="cfWebsite" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="cf-row">
            <label>
              Your name
              <input
                type="text"
                id="cfName"
                name="name"
                ref={nameRef}
                autoComplete="name"
                placeholder="Full name"
                required
                className={errors.name ? 'is-invalid' : undefined}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'cfName-error' : undefined}
              />
              {errors.name && (
                <span className="cf-error" id="cfName-error">
                  {errors.name}
                </span>
              )}
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                id="cfPhone"
                name="phone"
                ref={phoneRef}
                autoComplete="tel"
                placeholder="+91 …"
              />
            </label>
          </div>
          <label>
            Email
            <input
              type="email"
              id="cfEmail"
              name="email"
              ref={emailRef}
              autoComplete="email"
              placeholder="you@company.com"
              required
              className={errors.email ? 'is-invalid' : undefined}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'cfEmail-error' : undefined}
            />
            {errors.email && (
              <span className="cf-error" id="cfEmail-error">
                {errors.email}
              </span>
            )}
          </label>
          <label>
            Message <span>(optional)</span>
            <textarea
              id="cfMsg"
              name="message"
              ref={msgRef}
              rows={3}
              placeholder="The challenge, the audience, what success looks like…"
            />
          </label>
          <div className="pick pick--date">
            <p className="pick__label">
              Preferred day <span>(optional)</span>
            </p>
            <button
              className="date-trigger"
              type="button"
              id="dateTrigger"
              ref={dateTriggerRef}
              aria-expanded={dateOpen}
              aria-haspopup="dialog"
              aria-controls="datePop"
              onClick={(e) => {
                e.stopPropagation();
                if (dateOpen) closeDate();
                else openDate();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1.5 6.2h13M5.3 1v3M10.7 1v3" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <span id="dateTriggerText">{dateTriggerText}</span>
              <svg className="date-trigger__chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                <path d="m1 1 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <div
              className="date-pop"
              id="datePop"
              ref={datePopRef}
              hidden
              onClick={(e) => e.stopPropagation()}
            >
              <div className="datepick">
                <div className="datepick__head">
                  <button
                    className="datepick__nav"
                    type="button"
                    id="dpPrev"
                    aria-label="Previous month"
                    disabled={!canPrev}
                    onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 2 4 8l6 6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </button>
                  <p className="datepick__title" id="dpTitle" aria-live="polite">
                    {monthLabel}
                  </p>
                  <button
                    className="datepick__nav"
                    type="button"
                    id="dpNext"
                    aria-label="Next month"
                    disabled={!canNext}
                    onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="m6 2 6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </button>
                </div>
                <div className="datepick__week" aria-hidden="true">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>
                <div className="datepick__grid" id="dpGrid" role="grid" aria-label="Choose a date">
                  {mounted && Array.from({ length: grid.offset }).map((_, i) => (
                    <span className="dp-empty" aria-hidden="true" key={`e${i}`} />
                  ))}
                  {mounted && grid.cells.map(({ day, date }) => {
                    const past = date <= today;
                    const isToday = iso(date) === grid.todayISO;
                    const isSelected = selectedDate !== null && iso(date) === iso(selectedDate);
                    return (
                      <button
                        type="button"
                        className={`dp-day${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                        role="gridcell"
                        key={day}
                        disabled={past}
                        aria-disabled={past || undefined}
                        aria-label={!past ? fmtLong(date) : undefined}
                        title={past ? undefined : fmtLong(date)}
                        onClick={() => selectDate(date)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="date-pop__hint" id="datePopHint">
                Select a day to see available times
              </p>
            </div>
            <input type="hidden" id="cfDate" name="date" value={selectedDate ? iso(selectedDate) : ''} />
          </div>
          <div className="pick">
            <p className="pick__label">
              Preferred time <span>— IST, optional</span>
            </p>
            <div className="tslots" id="tslots" role="radiogroup" aria-label="Preferred time">
              {SLOTS.map(({ group, times }) => (
                <div key={group}>
                  <p className="tslots__group">{group}</p>
                  <div className="tslots__row">
                    {times.map((t, i) => (
                      <button
                        type="button"
                        className={`tslot${chosenSlot === t ? ' is-active' : ''}`}
                        role="radio"
                        aria-checked={chosenSlot === t}
                        data-slot={t}
                        tabIndex={chosenSlot === t || (!chosenSlot && i === 0 && group === 'Morning') ? 0 : -1}
                        key={t}
                        onClick={() => selectSlot(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="pick__hint" id="slotHint">
              Times update with live availability.
            </p>
          </div>
          <p className={`book__summary${selectedDate && chosenSlot ? ' is-set' : ''}`} id="bookSummary">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span id="bookSummaryText">
              {selectedDate && chosenSlot ? (
                <>
                  <strong>
                    {fmtLong(selectedDate)} · {chosenSlot} IST
                  </strong>
                  &nbsp;— optional preferred time
                </>
              ) : selectedDate ? (
                `${fmtLong(selectedDate)} — optional; pick a time if you like`
              ) : chosenSlot ? (
                `${chosenSlot} IST — optional; pick a day if you like`
              ) : (
                'Time is optional — send a message anytime'
              )}
            </span>
          </p>
          <button
            className="btn btn--accent btn--block"
            type="submit"
            id="bookSubmit"
            disabled={submitting}
            aria-disabled={submitting}
          >
            {submitting ? (
              'Sending your message…'
            ) : (
              <>
                Send message{' '}
                <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </>
            )}
          </button>
          <p
            className={`cf-note${note.kind === 'ok' ? ' is-set' : note.kind === 'error' ? ' is-error' : ''}`}
            id="cfNote"
            ref={noteRef}
            role="status"
            aria-live="polite"
          >
            {note.text}
          </p>
        </form>
      </div>
      <div className="book__done" id="bookDone" ref={doneRef} hidden={!done}>
        <div className="done__check" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <path d="m4 13.5 6 6L22 7" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h3>Message received.</h3>
        <p id="doneSummary">{doneSummary}</p>
        <p className="book__done-note">I&apos;ll confirm the requested time by email within 24 hours.</p>
        <div className="done__actions">
          <a className="btn btn--ghost book__ghost" id="doneMail" href={`mailto:${PUBLIC_EMAIL}`}>
            Send a note by email
          </a>
          <button className="btn btn--accent" type="button" id="bookAgain" onClick={reset}>
            Request another slot
          </button>
        </div>
      </div>
      <p className="book__fine">
        Prefer writing? <a className="book__fine-link" href={`mailto:${PUBLIC_EMAIL}`}>hi@abhijeetvarghese.com</a> ·{' '}
        <a className="book__fine-link" href="tel:+919694080706">+91-96940 80706</a>
      </p>
    </div>
  );
}
