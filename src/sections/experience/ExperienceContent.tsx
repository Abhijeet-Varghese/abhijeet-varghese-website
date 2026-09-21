import { Fragment, type CSSProperties } from 'react';
import { experienceJobs } from './experience-data';
import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl } from '../../lib/cms';

const revealDelay = (value: string): CSSProperties => ({ '--d': value } as CSSProperties);

function ArrowIcon() {
  return (
    <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Legacy Experience record — CMS pages block override when available, layout unchanged. */
export default function ExperienceContent() {
  const { data: pagesData, source: pagesSource } = useCmsContent('pages', null);
  const cmsPage = (() => {
    if (pagesSource !== 'cms' || !Array.isArray(pagesData)) return null;
    const pages = pagesData as { slug: string; title?: string; blocks?: { id: string; type: string; content?: { title?: string; lede?: string } }[] }[];
    return pages.find((p) => p.slug === 'experience') ?? null;
  })();
  const heroBlock = cmsPage?.blocks?.find((b) => b.type === 'hero')?.content ?? null;
  const cmsHeroTitle = heroBlock?.title ? String(heroBlock.title) : null;
  const cmsHeroLede = heroBlock?.lede ? String(heroBlock.lede) : null;

  const cmsJobs = (() => {
    if (!Array.isArray(cmsPage?.blocks)) return null;
    const jobs = (cmsPage.blocks as { type: string; content: Record<string, unknown> }[]).filter((b) => b.type === 'job');
    if (!jobs.length) return null;
    return jobs.map((j) => {
      const c = j.content as { company?: string; role?: string; role_sub?: string; dates?: string; location?: string; summary?: string; disciplines?: string[]; responsibilities?: string[]; image?: string; alt?: string };
      return {
        date: c.dates || '',
        role: c.role || '',
        roleSub: c.role_sub || null,
        company: c.company || '',
        location: c.location || null,
        summary: c.summary || '',
        disciplines: c.disciplines || [],
        responsibilities: c.responsibilities || [],
        moreResponsibilities: [] as string[],
        lead: false as boolean,
        last: false as boolean,
        image: c.image ? cmsMediaUrl(c.image) : undefined,
      };
    });
  })();

  const jobs: typeof experienceJobs = (cmsJobs && cmsJobs.length ? (cmsJobs as unknown as typeof experienceJobs) : experienceJobs);

  return (
    <>
      <section className="exp-hero t-dark" aria-label="Experience" data-cms-source={cmsPage ? 'cms' : 'fallback'}>
        <div className="exp-hero__grid container">
          <div className="exp-hero__copy">
            <div className="chapter__meta" data-reveal="">
              <span className="chapter__num">✦</span><span className="chapter__rule"></span><span className="chapter__tag">Experience</span>
            </div>
            <h1 className="exp-hero__title" data-reveal="" style={revealDelay('.15s')}>{cmsHeroTitle || 'Experience'}</h1>
            <p className="exp-hero__lede" data-reveal="" style={revealDelay('.25s')}>{cmsHeroLede || 'Where I\'ve worked, what I\'ve led, and how my responsibilities have evolved.'}</p>
            <div className="exp-hero__meta" data-reveal="" style={revealDelay('.35s')}>
              <span>{jobs.length} roles</span><i aria-hidden="true"></i><span>2014 — 2026</span><i aria-hidden="true"></i><span>Creative Direction &amp; Experience Design</span>
            </div>
          </div>
          <div className="exp-hero__big" aria-hidden="true" data-reveal="" style={revealDelay('.2s')}>{String(jobs.length).padStart(2,'0')}</div>
        </div>
      </section>

      <section className="exp-record t-light">
        <div className="container">
          <div className="exp-timeline" id="expTimeline">
            {jobs.map((job, jobIndex) => {
              const labelId = `exp-label-${jobIndex}`;
              const moreId = `exp-more-${jobIndex}`;
              const classes = [
                'exp-job',
                (job as unknown as { lead?: boolean }).lead ? 'exp-job--lead' : '',
                (job as unknown as { last?: boolean }).last ? 'exp-job--last' : '',
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
                      {job.disciplines.map((discipline: string, disciplineIndex: number) => (
                        <Fragment key={discipline}>
                          <span>{discipline}</span>
                          {disciplineIndex < job.disciplines.length - 1 && <i aria-hidden="true"></i>}
                        </Fragment>
                      ))}
                    </p>
                    <p className="exp-job__resp-label" id={labelId}>Responsibilities</p>
                    <ul className="exp-job__list" aria-labelledby={labelId}>
                      {job.responsibilities.map((responsibility: string) => <li key={responsibility}>{responsibility}</li>)}
                    </ul>
                    <ul className="exp-job__list is-hidden" id={moreId} hidden>
                      {(job as unknown as { moreResponsibilities?: string[] }).moreResponsibilities?.map((responsibility: string) => <li key={responsibility}>{responsibility}</li>)}
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
