import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';
import { ChapterMeta } from './ChapterMeta';

export function Work() {
  const { content } = useContent();
  const WORK = content.home.WORK;
  return (
    <section className="chapter work t-light" id="work">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <ChapterMeta num={WORK.num} tag={WORK.tag} />
            <h2 className="chapter__title" data-reveal>
              {WORK.title}
            </h2>
          </div>
          <p className="chapter__lede" data-reveal>
            {WORK.lede}
          </p>
        </header>
        {WORK.cases.map((c) => (
          <article className="case" id={c.id} key={c.id}>
            <figure className="case__panel" data-parallax={String(c.parallax)} data-reveal="img">
              <picture>
                <img
                  src={c.image}
                  alt={c.alt}
                  width="1536"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption className="case__card" data-reveal>
                <p className="case__kicker">
                  <span>{c.kicker}</span>
                  <span className="case__client">{c.client}</span>
                </p>
                <h3 className="case__title">{c.title}</h3>
                <a className="case__card-cta" href={c.href}>
                  Explore case study <Arrow />
                </a>
              </figcaption>
            </figure>
            <dl className="case__meta case__meta--row" data-reveal-group>
              <div data-reveal>
                <dt>Problem</dt>
                <dd>{c.meta.problem}</dd>
              </div>
              <div data-reveal>
                <dt>Approach</dt>
                <dd>{c.meta.approach}</dd>
              </div>
              <div data-reveal>
                <dt>Role</dt>
                <dd>{c.meta.role}</dd>
              </div>
              <div data-reveal>
                <dt>Outcome</dt>
                <dd>{c.meta.outcome}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
