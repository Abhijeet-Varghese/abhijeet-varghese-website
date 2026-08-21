import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

export function RecruitersPage() {
  useSiteChrome();
  const { content } = useContent();
  const RECRUITERS = content.pages.RECRUITERS;
  return (
    <Layout activeHref="for-recruiters.html" pageClose>
      <PageHero num={RECRUITERS.num} tag={RECRUITERS.tag} lede={RECRUITERS.lede}>
        {RECRUITERS.title[0]}
        <em>{RECRUITERS.title[1]}</em>
        {RECRUITERS.title[2]}
      </PageHero>
      <section className="page-section t-light">
        <div className="container">
          <div className="prose" data-reveal-group data-dbase=".1">
            {RECRUITERS.prose.map((p, i) => (
              <p data-reveal key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        </div>
      </section>
      <section className="page-section t-light">
        <div className="container">
          <div className="recruiter-card" data-reveal style={{ maxWidth: '760px', marginInline: 'auto' }}>
            <h3>{RECRUITERS.card.heading}</h3>
            <p>{RECRUITERS.card.body}</p>
            <ul className="chip-list">
              {RECRUITERS.card.chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
            <p style={{ marginTop: '10px' }}>
              <a className="link-arrow" href="assets/Abhijeet-Varghese-Resume.pdf" download>
                Download résumé <Arrow />
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
