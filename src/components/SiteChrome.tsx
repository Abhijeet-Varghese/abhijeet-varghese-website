import { useCmsContent } from '../hooks/useCmsContent';
import type { CmsNav, CmsSettings } from '../lib/cms';
import { useOriginCapture, useScrollRestore } from '../hooks/useOriginCapture';

const FALLBACK_NAV: CmsNav['primary'] = [
  { id: 'n1', label: "Story", href: "/story/" },
  { id: 'n2', label: "Experience", href: "/experience/" },
  { id: 'n3', label: "Case Studies", href: "/case-studies/" },
  { id: 'n4', label: "Portfolio", href: "/portfolio/" },
];
const CTA_FALLBACK = { label: 'Start a conversation', href: '/contact/' };

interface SiteChromeProps {
  /** Current clean path when this is not the homepage. */
  activePath?: string;
}

export default function SiteChrome({ activePath }: SiteChromeProps) {
  useOriginCapture();
  useScrollRestore();
  const { data: navData, source: navSource } = useCmsContent('nav', null);
  const { data: settingsData } = useCmsContent('settings', null);

  const cmsNav = (navSource === 'cms' && navData && typeof navData === 'object' && Array.isArray((navData as CmsNav).primary))
    ? (navData as CmsNav)
    : null;

  const cmsSettings = (settingsData && typeof settingsData === 'object')
    ? (settingsData as CmsSettings)
    : null;

  // CMS nav.primary is source of truth when available — labels/hrefs/ordering from CMS, fallback otherwise
  const rawItems = cmsNav?.primary?.length ? cmsNav.primary : FALLBACK_NAV;
  // CTA: explicit cta flag, else /contact/, else fallback
  const ctaItem = (cmsNav?.primary?.find((n) => n.cta) ?? rawItems.find((n) => n.href === '/contact/') ?? CTA_FALLBACK) as CmsNav['primary'][number];
  // Primary nav excludes CTA
  const primaryFromCms = rawItems.filter((i) => i.href !== ctaItem.href && !i.cta);
  const items = primaryFromCms.length ? primaryFromCms : FALLBACK_NAV;
  const cta = ctaItem.href ? ctaItem : CTA_FALLBACK;

  const brandName = (cmsSettings?.siteName && cmsSettings.siteName.trim() !== '')
    ? cmsSettings.siteName
    : 'Abhijeet Varghese';
  const brandLogo = cmsSettings?.logo ? (cmsSettings.logo.startsWith('http') ? cmsSettings.logo : (cmsSettings.logo.startsWith('/') ? cmsSettings.logo : `/${cmsSettings.logo}`)) : '/assets/logo.png';
  const contactEmail = cmsSettings?.email || 'hi@abhijeetvarghese.com';

  return (
    <>
<header className="site-nav" id="siteNav" data-cms-source={cmsNav ? 'cms' : 'fallback'}>
    <nav className="site-nav__inner" aria-label="Primary">
      <a className="brand" href="/" {...(!activePath ? { 'aria-current': 'page' } : {})} aria-label={`${brandName} — home`}>
        <img className="brand__logo" src={brandLogo} alt={`${brandName} logo`} width="36" height="36" decoding="async" />
        <span className="brand__name">{brandName}</span>
      </a>
      <ul className="nav-links">
        {items.map((item) => (<li key={item.href}><a href={item.href} {...(activePath === item.href ? { 'aria-current': 'page' } : {})}>{item.label}</a></li>))}
      </ul>
      <a className="btn btn--accent btn--small" href={cta.href}>{cta.label}</a>
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
          {items.map((item) => (
            <li key={item.href}><a href={item.href} {...(activePath === item.href ? { 'aria-current': 'page' } : {})}>{item.label}</a></li>
          ))}
        </ul>
        <div className="mobile-menu__actions">
          <a className="btn btn--accent btn--block" href={cta.href}>{cta.label}</a>
          <a className="mobile-menu__mail" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </div>
      </nav>
    </div>
  </header>
    </>
  );
}
