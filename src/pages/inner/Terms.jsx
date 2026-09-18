export default function Terms() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
  <main id="main">
    <section className="page-hero" aria-label="Legal">
      <div className="container">
        <div className="chapter__meta page-hero__meta" data-reveal={true}>
          <span className="chapter__num">11</span><span className="chapter__rule"></span><span className="chapter__tag">Legal</span>
        </div>
        <h1 className="page-hero__title" data-reveal={true}>The fine print, <em>without the fog</em>.</h1>
        <p className="page-hero__lede" data-reveal={true} style={{"--d": ".15s"}}>Short version: be respectful, ask before reusing, and everything here is provided as-is.</p>
      </div>
    </section>
    <section className="page-section t-light">
      <div className="container">
        <div className="prose" data-reveal-group={true} data-dbase=".1">
          <h2 data-reveal={true}>1. Use of this site</h2><p data-reveal={true}>This site is a portfolio and professional resource. You may browse, share links and reference the work with attribution. Scraping, reselling or misrepresenting the content is not permitted.</p>
<h2 data-reveal={true}>2. Intellectual property</h2><p data-reveal={true}>All work shown here — design, copy, imagery and concepts — belongs to Abhijeet Varghese or the organizations the work was created for. Client logos remain the property of their owners.</p>
<h2 data-reveal={true}>3. No guarantees</h2><p data-reveal={true}>Content is provided as is for information. Nothing on this site constitutes professional advice or an offer of employment or engagement.</p>
<h2 data-reveal={true}>4. Booking</h2><p data-reveal={true}>Booked calls are confirmed by email. Life happens — rescheduling is one message away, and no-shows are treated with the same grace we&#039;d ask for.</p>
<h2 data-reveal={true}>5. Contact</h2><p data-reveal={true}>Questions about these terms? hi@abhijeetvarghese.com. Last revised: August 2026.</p>
        </div>
      </div>
    </section>
  </main>
    </>
  );
}
