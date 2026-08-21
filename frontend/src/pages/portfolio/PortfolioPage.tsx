import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

/**
 * Portfolio — visual index of selected work (production `portfolio.html`).
 * Hero + 3-piece index + practice spectrum + proof wall + CTA.
 */
export function PortfolioPage() {
  useSiteChrome();
  const { content } = useContent();
  const PROJECTS = content.projects.PROJECTS;
  const CAPABILITIES = content.home.CAPABILITIES;
  const CLIENTS = content.home.CLIENTS;
  return (
    <Layout activeHref="/portfolio" pageClose>
      <section className="portfolio-hero t-dark" aria-label="Portfolio introduction">
        <div className="portfolio-hero__grid" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="container portfolio-hero__inner">
          <div className="portfolio-hero__meta" data-reveal>
            <span>Selected practice</span>
            <span>2014 — 2026</span>
          </div>
          <h1 className="portfolio-hero__title">
            <span data-reveal>Work across </span>
            <em data-reveal style={{ ['--d' as string]: '.12s' }}>
              frames, systems{' '}
            </em>
            <span data-reveal style={{ ['--d' as string]: '.22s' }}>
              and spaces.
            </span>
          </h1>
          <div className="portfolio-hero__foot" data-reveal style={{ ['--d' as string]: '.32s' }}>
            <p>
              A visual index of selected work across enterprise technology, industrial environments and immersive
              communication — each project shaped to make complexity legible.
            </p>
            <dl>
              <div>
                <dt>Selected work</dt>
                <dd>3</dd>
              </div>
              <div>
                <dt>Organisations</dt>
                <dd>16</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="portfolio-index t-light" aria-label="Selected portfolio projects">
        <div className="container">
          <header className="portfolio-index__head">
            <p data-reveal>Selected portfolio</p>
            <h2 data-reveal>
              Different mediums.
              <br />
              <em>One standard of clarity.</em>
            </h2>
            <span data-reveal>Visual index / 3 works</span>
          </header>
          <div className="portfolio-index__grid">
            {PROJECTS.map((p, i) => (
              <article className={`portfolio-piece portfolio-piece--${i + 1}`} data-reveal key={p.slug}>
                <a className="portfolio-piece__link" href={p.href} aria-label={`View ${p.title}`}>
                  <figure className="portfolio-piece__media">
                    <img src={p.image} alt={p.portfolioAlt} width="1536" height="1024" loading="lazy" decoding="async" />
                    <span className="portfolio-piece__index" aria-hidden="true">
                      {p.index}
                    </span>
                    <span className="portfolio-piece__view" aria-hidden="true">
                      View project ↗
                    </span>
                  </figure>
                  <div className="portfolio-piece__copy">
                    <div className="portfolio-piece__eyebrow">
                      <span>{p.client}</span>
                      <span>{p.category}</span>
                    </div>
                    <h2>{p.title}</h2>
                    <p>{p.summary}</p>
                    <dl>
                      <div>
                        <dt>Role</dt>
                        <dd>{p.role}</dd>
                      </div>
                      <div>
                        <dt>Year</dt>
                        <dd>{p.year}</dd>
                      </div>
                    </dl>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-practice t-dark" aria-label="Practice areas">
        <div className="container portfolio-practice__inner">
          <header>
            <p data-reveal>Practice spectrum</p>
            <h2 data-reveal>The medium changes. The work is always about clarity.</h2>
          </header>
          <ol>
            {CAPABILITIES.items.map((cap, i) => (
              <li data-reveal style={{ ['--d' as string]: `${(i * 0.06).toFixed(2)}s` }} key={cap.num}>
                <span>{cap.num}</span>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="portfolio-proof t-light" aria-label="Selected organisations">
        <div className="container">
          <header>
            <p data-reveal>Selected organisations</p>
            <h2 data-reveal>
              Trusted when the work
              <br />
              <em>had to be understood.</em>
            </h2>
          </header>
          <ul className="portfolio-proof__logos">
            {CLIENTS.logos.map((logo) => (
              <li data-reveal key={logo.file}>
                <img
                  src={`assets/logos/${logo.file}`}
                  alt={logo.name}
                  width="160"
                  height="48"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="portfolio-cta t-dark" aria-label="Start a conversation">
        <div className="container portfolio-cta__inner">
          <p data-reveal>Have a complicated idea?</p>
          <h2 data-reveal>
            Let&apos;s make it
            <br />
            <em>impossible to misunderstand.</em>
          </h2>
          <a className="btn btn--accent" href="/contact" data-reveal>
            Start a conversation <Arrow />
          </a>
        </div>
      </section>
    </Layout>
  );
}
