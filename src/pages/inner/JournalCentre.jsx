export default function JournalCentre() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
  <main id="main">
    <section className="article-hero">
      <img className="article-hero__img" src="/assets/journal-02.webp" alt="Artwork for “The experience centre as a strategic instrument”" width="1376" height="768" fetchpriority="high" decoding="async" />
      <div className="article-hero__veil" aria-hidden="true"></div>
      <div className="container article-hero__inner">
        <div className="chapter__meta" data-reveal={true}>
          <span className="chapter__num">✦</span><span className="chapter__rule"></span>
          <span className="chapter__tag">Journal · 3 min</span>
        </div>
        <h1 className="article-hero__title" data-reveal={true} style={{"--d": ".1s"}}>The experience centre as a strategic instrument</h1>
        <p className="article-hero__lede" data-reveal={true} style={{"--d": ".2s"}}>The best centres are decision rooms, not showrooms.</p>
      </div>
    </section>
    <section className="article-body t-light">
      <div className="container">
        <div className="prose" data-reveal-group={true} data-dbase=".15">
          <p>Most experience centres are built backwards. The centres that matter are built as decision rooms — places where the organization confronts its own strategy made visible.</p>
        </div>
        <div className="article-foot" data-reveal={true}>
          <p style={{"color": "var(--cm)", "fontSize": "0.95rem"}}>By <strong style={{"color": "var(--ct)"}}>Abhijeet Varghese</strong> · 2026-06-11</p>
          <div style={{"display": "flex", "gap": "14px", "flexWrap": "wrap"}}>
            <a className="link-arrow" href="/journal/">← All journal entries</a>
            <a className="link-arrow" href="/contact/">Start a conversation <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
          </div>
        </div>
      </div>
    </section>
    <section className="page-section t-light" aria-label="Related">
      <div className="container">
        <div className="chapter__meta" data-reveal={true}><span className="chapter__index">+</span><span className="chapter__tag">Keep reading</span></div>
        <h2 className="chapter__title" data-reveal={true} style={{"fontSize": "1.6rem"}}>Related <em>content.</em></h2>
        <ul style={{"listStyle": "none", "margin": "18px 0 0", "padding": "0"}}><li data-reveal={true} style={{"padding": "10px 0", "borderBottom": "1px solid var(--cl)"}}><a className="link-arrow" href="/journal-what-a-year-of-ai-enabled-production-taught-me/">What a year of AI-enabled production taught me<span style={{"fontSize": "11px", "color": "var(--ink-3)", "marginLeft": "8px"}}>Journal</span> <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a></li></ul>
      </div>
    </section>
  </main>
    </>
  );
}
