import { Fragment, type CSSProperties } from 'react';
import { experienceJobs } from './experience-data';

const revealDelay = (value: string): CSSProperties => ({ '--d': value } as CSSProperties);

function ArrowIcon() {
  return (
    <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Legacy Experience record, rendered in its original semantic and visual order. */
export default function ExperienceContent() {
  return (
    <>
      <section className="exp-hero t-dark" aria-label="Experience">
        <div className="exp-hero__grid container">
          <div className="exp-hero__copy">
            <div className="chapter__meta" data-reveal="">
              <span className="chapter__num">✦</span><span className="chapter__rule"></span><span className="chapter__tag">Experience</span>
            </div>
            <h1 className="exp-hero__title" data-reveal="" style={revealDelay('.15s')}>Experience</h1>
            <p className="exp-hero__lede" data-reveal="" style={revealDelay('.25s')}>Where I&apos;ve worked, what I&apos;ve led, and how my responsibilities have evolved.</p>
            <div className="exp-hero__meta" data-reveal="" style={revealDelay('.35s')}>
              <span>Six roles</span><i aria-hidden="true"></i><span>2014 — 2026</span><i aria-hidden="true"></i><span>Creative Direction &amp; Experience Design</span>
            </div>
          </div>
          <div className="exp-hero__big" aria-hidden="true" data-reveal="" style={revealDelay('.2s')}>06</div>
        </div>
      </section>

      <section className="exp-record t-light">
        <div className="container">
          <div className="exp-timeline" id="expTimeline">
            {experienceJobs.map((job, jobIndex) => {
              const labelId = `exp-label-${jobIndex}`;
              const moreId = `exp-more-${jobIndex}`;
              const classes = [
                'exp-job',
                job.lead ? 'exp-job--lead' : '',
                job.last ? 'exp-job--last' : '',
              ].filter(Boolean).join(' ');

              return (
                <article className={classes} data-reveal="" key={`${job.date}-${job.role}`}>
                  <div className="exp-job__rail" aria-hidden="true"></div>
                  <div className="exp-job__date"><time>{job.date}</time></div>
                  <div className="exp-job__main">
                    <h2 className="exp-job__role">{job.role}</h2>
                    {job.roleSub && <p className="exp-job__role-sub">{job.roleSub}</p>}
                    <p className="exp-job__company">
                      {job.company}
                      {job.location && <>{' '}<span className="exp-job__loc">{job.location}</span></>}
                    </p>
                    <p className="exp-job__summary">{job.summary}</p>
                    <p className="exp-job__disc-label" aria-hidden="true">Disciplines</p>
                    <p className="exp-job__disc">
                      {job.disciplines.map((discipline, disciplineIndex) => (
                        <Fragment key={discipline}>
                          <span>{discipline}</span>
                          {disciplineIndex < job.disciplines.length - 1 && <i aria-hidden="true"></i>}
                        </Fragment>
                      ))}
                    </p>
                    <p className="exp-job__resp-label" id={labelId}>Responsibilities</p>
                    <ul className="exp-job__list" aria-labelledby={labelId}>
                      {job.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}
                    </ul>
                    <ul className="exp-job__list is-hidden" id={moreId} hidden>
                      {job.moreResponsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}
                    </ul>
                    <button type="button" className="exp-job__more" aria-expanded="false" aria-controls={moreId}>
                      <span className="exp-job__more-label">View all responsibilities</span>{' '}<span className="exp-job__more-arrow" aria-hidden="true">+</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="exp-closing t-dark">
        <div className="container">
          <div className="exp-closing__inner">
            <span className="exp-closing__rule" aria-hidden="true" data-reveal=""></span>
            <h2 data-reveal="">Now, the work.</h2>
            <p data-reveal="">The roles are the record — the work is the evidence.</p>
            <p data-reveal=""><a className="btn btn--accent" href="/case-studies/">Explore the work <ArrowIcon /></a></p>
          </div>
        </div>
      </section>
    </>
  );
}
