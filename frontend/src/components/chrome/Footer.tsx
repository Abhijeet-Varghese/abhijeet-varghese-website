import { useContent } from '@/content/provider';
import { SocialIcon } from './SocialIcon';

/** Global footer chrome — identical on every page. `base` prefixes internal links. */
export function Footer({ base = '' }: { base?: string }) {
  const { content } = useContent();
  const CHROME = content.chrome.CHROME;
  const f = CHROME.footer;
  return (
    <footer className="footer footer--arena">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a className="footer__brandtop" href={base + CHROME.brandHref} aria-label="Abhijeet Varghese — home">
            <img
              className="brand__logo brand__logo--foot"
              src={base + CHROME.logoUrl}
              alt="Abhijeet Varghese logo"
              width="36"
              height="36"
              decoding="async"
            />
            <span className="footer__name">{CHROME.brandLabel}</span>
          </a>
          <p className="footer__line">{f.line}</p>
          <p className="footer__contact">
            <a href={f.emailHref}>{f.email}</a>
            <a href={f.phoneHref}>{f.phone}</a>
          </p>
          <p className="footer__avail">
            <span className="footer__avail-dot" aria-hidden="true" />
            {f.availability}
          </p>
        </div>
        {f.columns.map((col) => (
          <div className="footer__col" key={col.label}>
            <p className="footer__label">{col.label}</p>
            <ul className="footer__links">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <a href={base + link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="footer__col">
          <p className="footer__label">Social</p>
          <ul className="footer__social">
            {f.social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener">
                  <SocialIcon icon={s.icon} label={s.label} />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">{f.copyright}</p>
          <p className="footer__note">{f.note}</p>
          <a className="footer__top" href="#top" aria-label="Back to top">
            ↑<span>Back to top</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
