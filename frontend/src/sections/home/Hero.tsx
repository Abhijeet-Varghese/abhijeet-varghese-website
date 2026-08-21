import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

export function Hero() {
  const { content } = useContent();
  const HERO = content.home.HERO;
  return (
    <section className="hp-hero t-dark" id="hero" data-theme="dark" aria-label="Introduction">
      <div className="hp-hero__glow" aria-hidden="true" />
      <div className="hp-hero__stage">
        {/*
          The wordmark is the brand, not the page's proposition, so it is a <p>
          with an accessible label rather than the <h1>. The <h1> is the tagline
          below — the sentence that states what this person actually does.
          Purely semantic: .hp-hero__name keeps every visual property.
        */}
        <p className="hp-hero__name" aria-label={HERO.nameLines.join(' ')}>
          <span className="hp-hero__name-line" aria-hidden="true">{HERO.nameLines[0]}</span>
          <span className="hp-hero__name-line" aria-hidden="true">{HERO.nameLines[1]}</span>
        </p>
        <figure className="hp-hero__portrait">
          <img
            src={HERO.portrait.src}
            alt={HERO.portrait.alt}
            width={HERO.portrait.width}
            height={HERO.portrait.height}
            fetchPriority="high"
            decoding="async"
          />
          <span className="hp-hero__veil" aria-hidden="true" />
        </figure>
        <div className="hp-hero__copy">
          {/* The page's real <h1>: the proposition, visible and unduplicated. */}
          <h1 className="hp-hero__tagline">{HERO.tagline}</h1>
          <p className="hp-hero__roles">
            {HERO.roles.map((role) => (
              <span className="hero__roles-item" key={role}>
                {role}
              </span>
            ))}
          </p>
          <div className="hp-hero__actions">
            <a className="btn btn--accent" href={HERO.actions.work.href}>
              {HERO.actions.work.label} <Arrow />
            </a>
            <a className="btn btn--ghost" href={HERO.actions.resume.href} download>
              {HERO.actions.resume.label}
            </a>
          </div>
          <p className="hp-hero__avail">
            <span className="hp-hero__avail-dot" aria-hidden="true" />
            {HERO.availability}
          </p>
        </div>
        <p className="hp-hero__lede" data-reveal>
          {HERO.lede}
        </p>
        <div className="hp-hero__cue" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
      <div className="hp-hero__marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...HERO.marquee, ...HERO.marquee].flatMap((item, i) => [
            <span key={`t${i}`}>{item}</span>,
            <span key={`d${i}`} className="marquee__dot" />,
          ])}
        </div>
      </div>
    </section>
  );
}
