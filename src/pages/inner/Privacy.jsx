export default function Privacy() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
  <main id="main">
    <section className="page-hero" aria-label="Legal">
      <div className="container">
        <div className="chapter__meta page-hero__meta" data-reveal={true}>
          <span className="chapter__num">10</span><span className="chapter__rule"></span><span className="chapter__tag">Legal</span>
        </div>
        <h1 className="page-hero__title" data-reveal={true}>Plain English about <em>your data</em>.</h1>
        <p className="page-hero__lede" data-reveal={true} style={{"--d": ".15s"}}>This site collects as little as possible, and never sells anything.</p>
      </div>
    </section>
    <section className="page-section t-light">
      <div className="container">
        <div className="prose" data-reveal-group={true} data-dbase=".1">
          <h2 data-reveal={true}>1. What we collect</h2><p data-reveal={true}>When you contact me — by email, phone, or the booking calendar — you share what you choose to share: your name, email address, organization and the details of your inquiry. That&#039;s it.</p>
<h2 data-reveal={true}>2. Booking</h2><p data-reveal={true}>Intro call requests are submitted directly through this site and stored in AV OS. Your name, email, organization, context and preferred date/time are used only to arrange the conversation; no third-party scheduler is opened.</p>
<h2 data-reveal={true}>3. Cookies &amp; analytics</h2><p data-reveal={true}>This site does not run third-party advertising or tracking analytics. If a privacy-conscious analytics tool is added later, this policy will be updated first.</p>
<h2 data-reveal={true}>4. What we do with your information</h2><p data-reveal={true}>Reply to you. Arrange meetings. Keep a record of what we discussed so the next conversation starts from memory, not scratch. We do not sell, rent or trade personal information.</p>
<h2 data-reveal={true}>5. Your rights</h2><p data-reveal={true}>You can ask what data I hold about you, ask for it to be corrected, or ask for it to be deleted — at any time, no forms, just write: hi@abhijeetvarghese.com</p>
<h2 data-reveal={true}>6. Changes</h2><p data-reveal={true}>If this policy changes, the date below updates. Last revised: August 2026.</p>
        </div>
      </div>
    </section>
  </main>
    </>
  );
}
