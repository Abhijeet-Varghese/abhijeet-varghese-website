export default function Search() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
  <main id="main">

    <section className="page-hero" aria-label="Search">
      <div className="container">
        <div className="chapter__meta page-hero__meta" data-reveal={true}>
          <span className="chapter__index">S</span>
          <span className="chapter__tag">Search</span>
        </div>
        <h1 className="page-hero__title" data-reveal={true}>Find anything <em>on this site.</em></h1>
        <p className="page-hero__lede" data-reveal={true}>Projects, case studies, essays and journal entries — search the whole portfolio instantly.</p>
        <div className="container" style={{"maxWidth": "640px", "marginTop": "28px"}} data-reveal={true}>
          <input type="search" id="siteSearch" placeholder="Try &ldquo;experience centre&rdquo; or &ldquo;AI&rdquo;&hellip;" aria-label="Search the site" style={{"width": "100%", "minHeight": "56px", "borderRadius": "14px", "border": "1px solid var(--cl)", "background": "var(--bg)", "padding": "0 20px", "font": "inherit", "fontSize": "16px"}} />
          <div id="searchResults" style={{"marginTop": "16px"}} aria-live="polite"></div>
        </div>
      </div>
    </section>
    
  </main>
    </>
  );
}
