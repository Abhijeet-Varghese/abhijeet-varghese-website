import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import type { Project } from '@/content/projects';
import { Arrow } from '@/components/Arrow';

/**
 * Honest "coming soon" case-study page (production behaviour). Renders the
 * real project record (client / practice / role) with a "Full case study
 * coming soon" state — no fabricated content, no dead links.
 */
export function ComingSoonCase({ project }: { project: Project }) {
  useSiteChrome();
  return (
    <Layout activeHref="case-studies.html" pageClose>
      <section className="page-hero case-coming__hero" aria-label={`${project.client} case study coming soon`}>
        <div className="container">
          <div className="chapter__meta page-hero__meta" data-reveal>
            <span className="chapter__num">✦</span>
            <span className="chapter__rule" />
            <span className="chapter__tag">{project.client} · Coming soon</span>
          </div>
          <h1 className="page-hero__title" data-reveal>
            {project.title}
          </h1>
          <p className="page-hero__lede" data-reveal style={{ ['--d' as string]: '.15s' }}>
            Full case study coming soon.
          </p>
        </div>
      </section>
      <section className="case-coming t-light" aria-label="Case study preview">
        <div className="container case-coming__grid">
          <figure className="case-coming__media" data-reveal="img">
            <img
              src={project.image}
              alt={`${project.title} — ${project.client} preview`}
              width="1536"
              height="1024"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption>
              {project.client} · {project.category} · {project.year}
            </figcaption>
          </figure>
          <div className="case-coming__copy" data-reveal style={{ ['--d' as string]: '.12s' }}>
            <p className="case-coming__eyebrow">In development</p>
            <h2>
              The complete story is <em>coming soon.</em>
            </h2>
            <p>{project.summary}</p>
            <dl>
              <div>
                <dt>Client</dt>
                <dd>{project.client}</dd>
              </div>
              <div>
                <dt>Practice</dt>
                <dd>{project.category}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{project.role}</dd>
              </div>
            </dl>
            <div className="case-coming__actions">
              <a className="btn btn--accent" href="case-studies.html">
                View all case studies <Arrow />
              </a>
              <a className="link-arrow" href="portfolio.html">
                Explore the portfolio <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
