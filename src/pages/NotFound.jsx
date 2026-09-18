export default function NotFound() {
  return (
    <main id="main">
      <section className="chapter t-dark" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="chapter__meta"><span className="chapter__num">404</span><span className="chapter__rule"></span><span className="chapter__tag">Lost signal</span></div>
          <h1 className="chapter__title" style={{ fontSize: 'clamp(2.4rem,6vw,4.6rem)' }}>This page does not exist.</h1>
          <p className="chapter__lede" style={{ margin: '18px auto 34px', maxWidth: '46ch' }}>The URL may be old, or the page may have moved. Everything current starts from the home page.</p>
          <a className="btn btn--accent" href="/">Return home</a>
        </div>
      </section>
    </main>
  );
}
