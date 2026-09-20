const NAV_ITEMS = [
  { label: "Story", href: "/story/" },
  { label: "Experience", href: "/experience/" },
  { label: "Case Studies", href: "/case-studies/" },
  { label: "Portfolio", href: "/portfolio/" },
];

export default function SiteChrome() {
  return (
    <>
<header className="site-nav" id="siteNav">
    <nav className="site-nav__inner" aria-label="Primary">
      <a className="brand" href="/" aria-current="page" aria-label="Abhijeet Varghese — home">
        <img className="brand__logo" src="/assets/logo.png" alt="Abhijeet Varghese logo" width="36" height="36" decoding="async" />
        <span className="brand__name">Abhijeet Varghese</span>
      </a>
      <ul className="nav-links">
        {NAV_ITEMS.map((item) => (<li key={item.href}><a href={item.href}>{item.label}</a></li>))}
      </ul>
      <a className="btn btn--accent btn--small" href="/contact/">Start a conversation</a>
      <button className="nav-toggle" type="button" id="navToggle" aria-expanded="false" aria-controls="mobileMenu" aria-label="Open menu">
        <span className="nav-toggle__line" aria-hidden="true"></span>
        <span className="nav-toggle__line" aria-hidden="true"></span>
        <span className="nav-toggle__line" aria-hidden="true"></span>
      </button>
    </nav>
    <div className="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Site menu" hidden={true}>
      <div className="mobile-menu__bar">
        <span className="mobile-menu__title">Menu</span>
        <button className="mobile-menu__close" type="button" id="mobileClose" aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        </button>
      </div>
      <nav aria-label="Mobile">
        <ul className="mobile-menu__list">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}><a href={item.href}>{item.label}</a></li>
          ))}
        </ul>
        <div className="mobile-menu__actions">
          <a className="btn btn--accent btn--block" href="/contact/">Start a conversation</a>
          <a className="mobile-menu__mail" href="mailto:hi@abhijeetvarghese.com">hi@abhijeetvarghese.com</a>
        </div>
      </nav>
    </div>
  </header>
    </>
  );
}
