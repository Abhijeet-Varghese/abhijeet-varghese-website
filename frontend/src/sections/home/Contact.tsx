import { CONTACT } from '@/content/home';
import { CHROME } from '@/content/chrome';
import { ChapterMeta } from './ChapterMeta';
import { ContactBook } from '@/components/booking/ContactBook';
import { SocialIcon } from '@/components/chrome/SocialIcon';

export function Contact() {
  return (
    <section className="chapter contact t-dark" id="contact">
      <div className="contact__glow" aria-hidden="true" />
      <div className="container">
        <div className="contact__grid">
          <div className="contact__intro">
            <ChapterMeta num={CONTACT.num} tag={CONTACT.tag} />
            <h2 className="contact__title" data-reveal>
              {CONTACT.title}
            </h2>
            <p className="chapter__lede" data-reveal>
              {CONTACT.lede}
            </p>
            <ul className="contact__micro" data-reveal-group>
              {CONTACT.micro.map((row) => (
                <li data-reveal key={row.label}>
                  <span>{row.label}</span>
                  <strong>
                    {row.href ? (
                      <a className="link-arrow link-arrow--micro" href={row.href}>
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </strong>
                </li>
              ))}
            </ul>
            <div className="contact__social" data-reveal style={{ ['--d' as string]: '.2s' }}>
              <p className="label label--muted">Find me on</p>
              <ul className="social-row">
                {CHROME.footer.social.map((s) => (
                  <li key={s.label}>
                    <a className="social-chip" href={s.href} target="_blank" rel="noopener">
                      <SocialIcon icon={s.icon} label={s.label} />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ContactBook />
        </div>
      </div>
    </section>
  );
}
