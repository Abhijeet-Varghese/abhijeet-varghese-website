import { PUBLIC_EMAIL } from '@/config/identity';
/**
 * Static (non-interactive) contact form — the no-JS / SSR fallback.
 *
 * Renders the complete form with a native `POST /api/public/lead` action, so
 * core content + submission remain available with JavaScript disabled. The
 * interactive `ContactBook` (lazy-loaded) progressively enhances it with the
 * custom calendar + time slots + in-page confirmation.
 *
 * Self-contained: intentionally imports nothing from ContactBook so it can
 * serve as the Suspense fallback while the interactive chunk loads.
 */
export function StaticContactForm() {
  return (
    <div className="book" data-reveal>
      <header className="book__head">
        <p className="book__eyebrow">Write from here</p>
        <h3>Send a message</h3>
        <p className="book__head-sub">Stays on this site · reply within 24 hours · no calendar redirect</p>
      </header>
      <div className="book__view" id="bookView">
        <form className="cf" id="contactForm" action="/api/public/lead" method="post" noValidate>
          <div className="cf-hp" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" id="cfWebsite" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="cf-row">
            <label>
              Your name
              <input type="text" id="cfName" name="name" autoComplete="name" placeholder="Full name" required />
            </label>
            <label>
              Mobile number
              <input type="tel" id="cfPhone" name="phone" autoComplete="tel" placeholder="+91 …" />
            </label>
          </div>
          <label>
            Email
            <input type="email" id="cfEmail" name="email" autoComplete="email" placeholder="you@company.com" required />
          </label>
          <label>
            Message <span>(optional)</span>
            <textarea id="cfMsg" name="message" rows={3} placeholder="The challenge, the audience, what success looks like…" />
          </label>
          <div className="pick pick--date">
            <p className="pick__label">
              Preferred day <span>(optional)</span>
            </p>
            <button
              className="date-trigger"
              type="button"
              id="dateTrigger"
              aria-expanded="false"
              aria-haspopup="dialog"
              aria-controls="datePop"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1.5 6.2h13M5.3 1v3M10.7 1v3" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <span id="dateTriggerText">Choose a date</span>
              <svg className="date-trigger__chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                <path d="m1 1 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <div className="date-pop" id="datePop" hidden>
              <div className="datepick">
                <div className="datepick__head">
                  <button className="datepick__nav" type="button" id="dpPrev" aria-label="Previous month">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 2 4 8l6 6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </button>
                  <p className="datepick__title" id="dpTitle" aria-live="polite" />
                  <button className="datepick__nav" type="button" id="dpNext" aria-label="Next month">
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
                <div className="datepick__grid" id="dpGrid" role="grid" aria-label="Choose a date" />
              </div>
              <p className="date-pop__hint" id="datePopHint">
                Select a day to see available times
              </p>
            </div>
            <input type="hidden" id="cfDate" name="date" value="" />
          </div>
          <div className="pick">
            <p className="pick__label">
              Preferred time <span>— IST, optional</span>
            </p>
            <div className="tslots" id="tslots" role="radiogroup" aria-label="Preferred time">
              <div>
                <p className="tslots__group">Morning</p>
                <div className="tslots__row">
                  {['09:30', '10:30', '12:00'].map((t, i) => (
                    <button type="button" className="tslot" role="radio" aria-checked="false" data-slot={t} tabIndex={i === 0 ? 0 : -1} key={t}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="tslots__group">Afternoon</p>
                <div className="tslots__row">
                  {['13:30', '15:00', '16:30'].map((t) => (
                    <button type="button" className="tslot" role="radio" aria-checked="false" data-slot={t} tabIndex={-1} key={t}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="tslots__group">Evening</p>
                <div className="tslots__row">
                  {['18:00', '19:30'].map((t) => (
                    <button type="button" className="tslot" role="radio" aria-checked="false" data-slot={t} tabIndex={-1} key={t}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="pick__hint" id="slotHint">
              Times update with live availability.
            </p>
          </div>
          <p className="book__summary" id="bookSummary">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span id="bookSummaryText">Time is optional — send a message anytime</span>
          </p>
          <button className="btn btn--accent btn--block" type="submit" id="bookSubmit">
            Send message{' '}
            <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <p className="cf-note" id="cfNote" role="status" aria-live="polite">
            Your message stays on this site. Time is optional.
          </p>
        </form>
      </div>
      <div className="book__done" id="bookDone" hidden>
        <div className="done__check" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <path d="m4 13.5 6 6L22 7" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h3>Message received.</h3>
        <p id="doneSummary" />
        <p className="book__done-note">I&apos;ll confirm the requested time by email within 24 hours.</p>
        <div className="done__actions">
          <a className="btn btn--ghost book__ghost" id="doneMail" href={`mailto:${PUBLIC_EMAIL}`}>
            Send a note by email
          </a>
          <button className="btn btn--accent" type="button" id="bookAgain">
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
