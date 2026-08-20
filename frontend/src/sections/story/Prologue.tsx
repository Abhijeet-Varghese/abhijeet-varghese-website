import { PROLOGUE } from '@/content/story';

export function Prologue() {
  return (
    <section className="about-prologue t-dark" id="prologue" aria-label="About — opening frame">
      <div className="about-prologue__blueprint" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="container about-prologue__inner">
        <div className="about-prologue__meta" data-reveal>
          <span>About / The first frame</span>
          <span>2014 — Now</span>
        </div>
        <div className="about-prologue__composition">
          <div className="about-prologue__frame" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <h1 className="about-prologue__title">
            <span className="about-prologue__line about-prologue__word">
              <span className="about-prologue__word-in">{PROLOGUE.titleLines[0].text}</span>
            </span>
            <span className="about-prologue__line about-prologue__line--shift about-prologue__word">
              <span className="about-prologue__word-in">{PROLOGUE.titleLines[1].text}</span>
            </span>
            <span className="about-prologue__line about-prologue__line--outline about-prologue__word">
              <span className="about-prologue__word-in">
                <em>{PROLOGUE.titleLines[2].text}</em>
              </span>
            </span>
          </h1>
          <p className="about-prologue__lede" data-reveal style={{ ['--d' as string]: '.42s' }}>
            {PROLOGUE.lede}
          </p>
        </div>
        <div className="about-prologue__footer">
          <p className="about-prologue__roles" data-reveal style={{ ['--d' as string]: '.5s' }}>
            {PROLOGUE.roles.map((role) => (
              <span className="about-prologue__role-chip" key={role}>
                {role}
              </span>
            ))}
          </p>
          <p className="about-prologue__skip" data-reveal style={{ ['--d' as string]: '.65s' }}>
            <a href="#act-01">
              <span>Enter the story</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 3v11M4.5 10 9 14.5 13.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </p>
        </div>
      </div>
      <div className="about-prologue__mq" aria-hidden="true">
        <div className="about-prologue__mq-track">
          {[...PROLOGUE.roles, ...PROLOGUE.roles].flatMap((role, i) => [
            <span key={`t${i}`}>{role}</span>,
            <span className="about-prologue__mq-dot" aria-hidden="true" key={`d${i}`}>
              ✦
            </span>,
          ])}
        </div>
      </div>
    </section>
  );
}
