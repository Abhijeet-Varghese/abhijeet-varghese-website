export default function Journal() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
  <main id="main">
    <section className="page-hero" aria-label="Journal">
      <div className="container">
        <div className="chapter__meta page-hero__meta" data-reveal={true}>
          <span className="chapter__num">06</span><span className="chapter__rule"></span><span className="chapter__tag">Journal</span>
        </div>
        <h1 className="page-hero__title" data-reveal={true}>Notes from the <em>workbench</em>.</h1>
        <p className="page-hero__lede" data-reveal={true} style={{"--d": ".15s"}}>Unpolished, honest, dated. The thinking that happens between projects.</p>
      </div>
    </section>
<section className="page-section t-light"><div className="container"><div className="entry" data-reveal={true} style={{"border-top": "1px solid var(--cl)"}}></div><article className="entry" data-reveal={true}>
          <p className="entry__meta"><em>01</em><span>Journal · 4 min</span></p>
          <h2><a href="/journal-what-a-year-of-ai-enabled-production-taught-me/">What a year of AI-enabled production taught me</a></h2>
          <p>Compression is the real gift.</p>
          <p style={{"margin-top": "12px"}}><a className="link-arrow" href="/journal-what-a-year-of-ai-enabled-production-taught-me/">Read the entry <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a></p>
        </article>
<article className="entry" data-reveal={true}>
          <p className="entry__meta"><em>02</em><span>Journal · 3 min</span></p>
          <h2><a href="/journal-the-experience-centre-as-a-strategic-instrument/">The experience centre as a strategic instrument</a></h2>
          <p>The best centres are decision rooms, not showrooms.</p>
          <p style={{"margin-top": "12px"}}><a className="link-arrow" href="/journal-the-experience-centre-as-a-strategic-instrument/">Read the entry <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a></p>
        </article></div></section>
  </main>
    </>
  );
}
