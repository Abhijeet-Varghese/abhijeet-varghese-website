import { THINKING } from '@/content/home';
import { ArrowSm } from '@/components/Arrow';
import { ChapterMeta } from './ChapterMeta';

export function Thinking() {
  return (
    <section className="chapter thinking t-dark" id="thinking">
      <div className="container">
        <header className="chapter__head chapter__head--center">
          <ChapterMeta num={THINKING.num} tag={THINKING.tag} />
        </header>
        <blockquote className="thinking__quote" data-reveal>
          <p>
            “Technology evolves every day.
            <br />
            <em>Human understanding doesn&apos;t..”</em>
          </p>
        </blockquote>
        <div className="thinking__lede" data-reveal>
          <p>{THINKING.lede}</p>
        </div>
        <ul className="essays" data-reveal-group>
          {THINKING.essays.map((essay) => (
            <li key={essay.href}>
              <a className="essay" href={essay.href} data-reveal>
                <span className="essay__num">{essay.num}</span>
                <span className="essay__main">
                  <span className="essay__title">{essay.title}</span>
                  <span className="essay__tag">{essay.tag}</span>
                </span>
                <ArrowSm />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <figure className="thinking__media container-wide" data-parallax="0.04" data-reveal="img">
        <picture>
          <img
            src={THINKING.media.src}
            alt={THINKING.media.alt}
            width="1536"
            height="1024"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <figcaption>{THINKING.media.caption}</figcaption>
      </figure>
    </section>
  );
}
