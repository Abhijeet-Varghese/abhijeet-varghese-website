import { useContent } from '@/content/provider';
import { ChapterMeta } from './ChapterMeta';

export function AiMethod() {
  const { content } = useContent();
  const AI_METHOD = content.home.AI_METHOD;
  return (
    <section className="chapter ai t-dark" id="ai">
      <div className="container">
        <div className="ai__grid">
          <div className="ai__copy">
            <header className="chapter__head">
              <ChapterMeta num={AI_METHOD.num} tag={AI_METHOD.tag} />
              <h2 className="chapter__title" data-reveal>
                {AI_METHOD.title.lead}
                <em className="block-em">{AI_METHOD.title.em}</em>
              </h2>
            </header>
            <div data-reveal-group>
              {AI_METHOD.paragraphs.map((p, i) => (
                <p data-reveal key={i}>
                  {p}
                </p>
              ))}
            </div>
            <ul className="chip-list" data-reveal-group>
              {AI_METHOD.chips.map((chip) => (
                <li data-reveal key={chip}>
                  {chip}
                </li>
              ))}
            </ul>
            <div className="ai__projects" data-reveal-group>
              {AI_METHOD.projects.map((project) => (
                <article className="ai-project" data-reveal key={project.title}>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </article>
              ))}
            </div>
            <p className="ai__motto" data-reveal>
              {AI_METHOD.motto}
            </p>
          </div>
          <figure className="ai__media" data-parallax="0.05" data-reveal="img">
            <picture>
              <img
                src={AI_METHOD.media.src}
                alt={AI_METHOD.media.alt}
                width="1536"
                height="1024"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <figcaption>{AI_METHOD.media.caption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
