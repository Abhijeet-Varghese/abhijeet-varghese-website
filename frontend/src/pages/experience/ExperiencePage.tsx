import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import type { ExperienceJob } from '@/content/experience';
import { Arrow } from '@/components/Arrow';

/**
 * Experience page — hero + 6-role timeline + closing. Ported 1:1. The
 * timeline's ::before rail reveal is driven by the `exp-scrolled` body class
 * (the production `--exp-fill` custom property has no CSS consumer and was
 * omitted, matching the documented dead-write policy).
 */
export function ExperiencePage() {
  useSiteChrome();
  useExperienceTimeline();
  const { content } = useContent();
  const EXPERIENCE_JOBS = content.experience.EXPERIENCE_JOBS;
  return (
    <Layout activeHref="/experience" pageClose>
      <section className="exp-hero t-dark" aria-label="Experience">
        <div className="exp-hero__grid container">
          <div className="exp-hero__copy">
            <div className="chapter__meta" data-reveal>
              <span className="chapter__num">✦</span>
              <span className="chapter__rule" />
              <span className="chapter__tag">Experience</span>
            </div>
            <h1 className="exp-hero__title" data-reveal style={{ ['--d' as string]: '.15s' }}>
              Experience
            </h1>
            <p className="exp-hero__lede" data-reveal style={{ ['--d' as string]: '.25s' }}>
              Where I&apos;ve worked, what I&apos;ve led, and how my responsibilities have evolved.
            </p>
            <div className="exp-hero__meta" data-reveal style={{ ['--d' as string]: '.35s' }}>
              <span>Six roles</span>
              <i aria-hidden="true" />
              <span>2014 — 2026</span>
              <i aria-hidden="true" />
              <span>Creative Direction &amp; Experience Design</span>
            </div>
          </div>
          <div className="exp-hero__big" aria-hidden="true" data-reveal style={{ ['--d' as string]: '.2s' }}>
            06
          </div>
        </div>
      </section>
      <section className="exp-record t-light">
        <div className="container">
          <div className="exp-timeline" id="expTimeline">
            {EXPERIENCE_JOBS.map((job, i) => (
              <Job key={job.date} job={job} index={i} />
            ))}
          </div>
        </div>
      </section>
      <section className="exp-closing t-dark">
        <div className="container">
          <div className="exp-closing__inner">
            <span className="exp-closing__rule" aria-hidden="true" data-reveal />
            <h2 data-reveal>Now, the work.</h2>
            <p data-reveal>The roles are the record — the work is the evidence.</p>
            <p data-reveal>
              <a className="btn btn--accent" href="/case-studies">
                Explore the work <Arrow />
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Job({ job, index }: { job: ExperienceJob; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cls = `exp-job${job.lead ? ' exp-job--lead' : ''}${job.last ? ' exp-job--last' : ''}`;
  return (
    <article className={cls} data-reveal>
      <div className="exp-job__rail" aria-hidden="true" />
      <div className="exp-job__date">
        <time>{job.date}</time>
      </div>
      <div className="exp-job__main">
        <h2 className="exp-job__role">{job.role}</h2>
        {job.roleSub && <p className="exp-job__role-sub">{job.roleSub}</p>}
        {job.image && (
          <figure className="exp-job__img" data-reveal="img">
            <img src={job.image.src} alt={job.image.alt} width={job.image.width} height={job.image.height} loading="lazy" decoding="async" />
          </figure>
        )}
        <p className="exp-job__company">
          {job.company}
          {job.location && (
            <>
              {' '}
              <span className="exp-job__loc">{job.location}</span>
            </>
          )}
        </p>
        <p className="exp-job__summary">{job.summary}</p>
        <p className="exp-job__disc-label" aria-hidden="true">
          Disciplines
        </p>
        <p className="exp-job__disc">
          {job.disciplines.flatMap((d, k) => (k === 0 ? [<span key={`d${k}`}>{d}</span>] : [<i aria-hidden="true" key={`i${k}`} />, <span key={`d${k}`}>{d}</span>]))}
        </p>
        <p className="exp-job__resp-label" id={`exp-label-${index}`}>
          Responsibilities
        </p>
        <ul className="exp-job__list" aria-labelledby={`exp-label-${index}`}>
          {job.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <ul className="exp-job__list is-hidden" id={`exp-more-${index}`} hidden={!expanded}>
          {job.moreResponsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <button
          type="button"
          className="exp-job__more"
          aria-expanded={expanded}
          aria-controls={`exp-more-${index}`}
          onClick={() => setExpanded((v) => !v)}
        >
          View all responsibilities <span className="exp-job__more-arrow">+</span>
        </button>
      </div>
    </article>
  );
}

function useExperienceTimeline() {
  useEffect(() => {
    const timeline = document.getElementById('expTimeline');
    if (!timeline) return;
    let ticking = false;
    const onScroll = () => {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(Math.max((vh * 0.9 - r.top) / (r.height * 0.6), 0), 1);
      document.body.classList.toggle('exp-scrolled', p > 0.02);
      ticking = false;
    };
    const throttled = () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    };
    window.addEventListener('scroll', throttled, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', throttled);
  }, []);
}
