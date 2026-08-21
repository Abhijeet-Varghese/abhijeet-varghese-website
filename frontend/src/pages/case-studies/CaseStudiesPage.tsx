import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { useHomeMotion } from '@/lib/home-motion';
import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

/**
 * Case Studies index (production `case-studies.html`) — narrative collection
 * with cinematic panels + problem/approach/role/outcome metadata.
 */
export function CaseStudiesPage() {
  useSiteChrome();
  useHomeMotion();
  const { content } = useContent();
  const PROJECTS = content.projects.PROJECTS;
  return (
    <Layout activeHref="/case-studies" pageClose>
      <section className="page-hero" aria-label="Case Studies">
        <div className="container">
          <div className="chapter__meta page-hero__meta" data-reveal>
            <span className="chapter__num">03</span>
            <span className="chapter__rule" />
            <span className="chapter__tag">Case Studies</span>
          </div>
          <h1 className="page-hero__title" data-reveal>
            Work that had to be <em>understood</em>.
          </h1>
          <p className="page-hero__lede" data-reveal style={{ ['--d' as string]: '.15s' }}>
            Three engagements, chosen not for scale but for what they demanded — clarity where clarity was hardest.
          </p>
        </div>
      </section>
      <section className="page-section t-light">
        <div className="container">
          {PROJECTS.map((p, i) => (
            <article className="case" id={`case-prj-${i + 1}`} key={p.slug}>
              <figure className="case__panel" data-parallax={i === 0 ? '0' : '0.05'} data-reveal="img">
                <picture>
                  <img src={p.image} alt={p.imageAlt} width="1536" height="1024" loading="lazy" decoding="async" />
                </picture>
                <figcaption className="case__card" data-reveal>
                  <p className="case__kicker">
                    <span>{p.category}</span>
                    <span className="case__client">{p.client}</span>
                  </p>
                  <h3 className="case__title">{p.title}</h3>
                  <a className="case__card-cta" href={p.href}>
                    Explore case study <Arrow />
                  </a>
                </figcaption>
              </figure>
              <dl className="case__meta case__meta--row" data-reveal-group>
                <div data-reveal>
                  <dt>Problem</dt>
                  <dd>{p.problem}</dd>
                </div>
                <div data-reveal>
                  <dt>Approach</dt>
                  <dd>{p.approach}</dd>
                </div>
                <div data-reveal>
                  <dt>Role</dt>
                  <dd>{p.role}</dd>
                </div>
                <div data-reveal>
                  <dt>Outcome</dt>
                  <dd>{p.outcome}</dd>
                </div>
              </dl>
            </article>
          ))}
          <p className="clients__note" data-reveal style={{ marginTop: 'clamp(60px,9vh,110px)' }}>
            Detailed case studies — problem framing, process, artefacts and measurable outcomes — are shared personally
            rather than published.{' '}
            <a className="link-arrow" href="mailto:hi@abhijeetvarghese.com?subject=Case%20study%20deep%20dive">
              Request the deep dive <Arrow />
            </a>
          </p>
        </div>
      </section>
    </Layout>
  );
}
