import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

export function ConsultingPage() {
  useSiteChrome();
  const { content } = useContent();
  const CONSULTING = content.pages.CONSULTING;
  return (
    <Layout activeHref="consulting.html" pageClose>
      <PageHero num={CONSULTING.num} tag={CONSULTING.tag} lede={CONSULTING.lede}>
        {CONSULTING.title[0]}
        <em>{CONSULTING.title[1]}</em>
        {CONSULTING.title[2]}
      </PageHero>
      <section className="page-section t-light">
        <div className="container">
          <div className="prose" data-reveal-group data-dbase=".1">
            <p data-reveal dangerouslySetInnerHTML={{ __html: CONSULTING.prose }} />
          </div>
        </div>
      </section>
      <section className="page-section t-light">
        <div className="container">
          <ul className="focus__list" data-reveal-group>
            {CONSULTING.focus.map((item, i) => (
              <li data-reveal key={item}>
                <span className="focus__num">{String(i + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="page-section t-light">
        <div className="container">
          <div className="recruiter-card" data-reveal style={{ maxWidth: '760px', marginInline: 'auto' }}>
            <h3>{CONSULTING.card.heading}</h3>
            <p>{CONSULTING.card.body}</p>
            <p style={{ marginTop: '10px' }}>
              <a className="btn btn--accent" href="contact.html">
                Start a conversation <Arrow />
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
