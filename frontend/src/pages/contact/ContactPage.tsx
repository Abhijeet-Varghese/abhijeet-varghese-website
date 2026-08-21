import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import { BookingGate } from '@/components/booking/BookingGate';
import { SocialIcon } from '@/components/chrome/SocialIcon';

/**
 * Contact page — page-hero + the custom booking experience (reuses the
 * homepage's lazy-loaded ContactBook via BookingGate). Same fields + pending
 * approval flow; POST /api/public/lead, no Calendly.
 */
export function ContactPage() {
  useSiteChrome();
  const { content } = useContent();
  const CONTACT = content.home.CONTACT;
  const CHROME = content.chrome.CHROME;
  return (
    <Layout activeHref="contact.html" pageClose>
      <PageHero num="04" tag="Contact" lede={CONTACT.lede}>
        Let&apos;s build something <em>worth remembering</em>.
      </PageHero>
      <section className="page-section page-section--tight contact-page t-light">
        <div className="container">
          <div className="contact__grid">
            <div className="contact__intro">
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
              <p className="focus__note" data-reveal style={{ marginTop: '34px', maxWidth: '38ch' }}>
                Every engagement starts the same way — an honest conversation about what actually needs to change. Whether
                it&apos;s a leadership role, an enterprise engagement or an idea that needs a clearer voice.
              </p>
            </div>
            <BookingGate />
          </div>
        </div>
      </section>
    </Layout>
  );
}
