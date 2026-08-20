import { WHAT, NOW, CURIOUS, CREDITS } from '@/content/story';
import { Arrow } from '@/components/Arrow';

export function WhatNowCurious() {
  return (
    <>
      <section className="about-what t-light" aria-label="What I actually do">
        <div className="container about-what__grid">
          <div className="about-what__head">
            <p className="about-what__eyebrow" data-reveal>
              <span className="chapter__rule" />
              <span className="chapter__tag">{WHAT.eyebrow}</span>
            </p>
            <h2 className="about-what__title" data-reveal>
              {WHAT.title[0]}
              <br />
              <em>{WHAT.title[1]}</em>
            </h2>
          </div>
          <ol className="about-what__list">
            {WHAT.items.map((item, i) => (
              <li data-reveal style={{ ['--d' as string]: `${(i * 0.07).toFixed(2)}s` }} key={item}>
                <span className="about-what__item">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="about-now t-dark" aria-label="Now">
        <div className="container about-now__grid">
          <div className="about-now__head">
            <p className="about-now__eyebrow" data-reveal>
              <span className="chapter__rule" />
              <span className="chapter__tag">{NOW.eyebrow}</span>
            </p>
            <h2 className="about-now__title" data-reveal>
              {NOW.title[0]}
              <br />
              {NOW.title[1]}
              <br />
              <em>{NOW.title[2]}</em>
            </h2>
          </div>
          <p className="about-now__copy" data-reveal>
            {NOW.copy}
          </p>
        </div>
      </section>
      <section className="about-curious t-light" aria-label="Still curious">
        <div className="container">
          <h2 className="about-curious__title" data-reveal>
            {CURIOUS.title}
          </h2>
          <ul className="about-curious__list" data-reveal-group data-dbase=".1">
            {CURIOUS.items.map((item) => (
              <li data-reveal key={item}>
                {item}
              </li>
            ))}
          </ul>
          <p className="about-curious__note" data-reveal>
            {CURIOUS.note}
          </p>
        </div>
      </section>
      <section className="about-credits t-light" id="credits" aria-label="Credits">
        <div className="container about-credits__inner">
          <span className="about-credits__rule" aria-hidden="true" data-reveal />
          <p className="about-credits__quote" data-reveal>
            {CREDITS.quote}
          </p>
          <p className="about-credits__role" data-reveal>
            {CREDITS.role}
          </p>
          <p className="about-credits__sig" data-reveal>
            {CREDITS.sig}
          </p>
          <p className="about-credits__cta" data-reveal>
            <a className="btn btn--accent" href={CREDITS.cta.href}>
              {CREDITS.cta.label} <Arrow />
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
