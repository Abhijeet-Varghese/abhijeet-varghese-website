const NAV_FALLBACK = [
  { label: "Story", href: "/story/" },
  { label: "Experience", href: "/experience/" },
  { label: "Case Studies", href: "/case-studies/" },
  { label: "Portfolio", href: "/portfolio/" },
];

export default function SiteChrome({ content }) {
  const navItems = (content && content.nav && Array.isArray(content.nav.primary) && content.nav.primary.length)
    ? content.nav.primary.filter((n) => n.href !== "/contact/").map((n) => ({ label: n.label, href: n.href }))
    : NAV_FALLBACK;
  const settings = (content && content.settings) || {};
  return (
    <>
<header className="site-nav" id="siteNav">
    <nav className="site-nav__inner" aria-label="Primary">
      <a className="brand" href="/" aria-current="page" aria-label="Abhijeet Varghese — home">
        <img className="brand__logo" src="/assets/logo.png" alt="Abhijeet Varghese logo" width="36" height="36" decoding="async" />
        <span className="brand__name">{settings.siteName || "Abhijeet Varghese"}</span>
      </a>
      <ul className="nav-links">
        {navItems.map((n) => (<li key={n.href}><a href={n.href}>{n.label}</a></li>))}
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
          <li><a href="/story/"><em>01</em>Story</a></li>
          <li><a href="/experience/"><em>02</em>Experience</a></li>
          <li><a href="/case-studies/"><em>03</em>Case Studies</a></li>
          <li><a href="/portfolio/"><em>04</em>Portfolio</a></li>
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
