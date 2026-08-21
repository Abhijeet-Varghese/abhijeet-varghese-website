import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

export function Hero() {
  const { content } = useContent();
  const HERO = content.home.HERO;
  return (
    <section className="hp-hero t-dark" id="hero" data-theme="dark" aria-label="Introduction">
      <p className="hp-hero__seo">{HERO.seoLine}</p>
      <div className="hp-hero__glow" aria-hidden="true" />
      <div className="hp-hero__stage">
        <h1 className="hp-hero__name">
          <span className="hp-hero__name-line">{HERO.nameLines[0]}</span>
          <span className="hp-hero__name-line">{HERO.nameLines[1]}</span>
        </h1>
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
          <p className="hp-hero__tagline">{HERO.tagline}</p>
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
