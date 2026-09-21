import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl, findSection } from '../../lib/cms';
import type { CmsProject, CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Featured work',
  title: 'Work that had to be understood.',
  lede: 'Three engagements, chosen not for scale but for what they demanded — clarity where clarity was hardest.',
  projects: [
    {
      id: 'prj-orange', client: 'Orange Business', cat: 'Telecom & Digital Services', title: 'New Executive Briefing Center', work: 'Experience Design · Creative Technology',
      href: '/case-studies/orange-business/', img: '/assets/case-orange-experience-in-action.webp', avif: '/assets/case-orange-experience-in-action.avif', alt: 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail',
      meta: [
        { dt: 'Problem', dd: 'Transform executive briefing into an experiential environment.' },
        { dt: 'Approach', dd: 'Connect business objectives, brand, visitor journey, content, technology and physical environment.' },
        { dt: 'Role', dd: 'Experience Strategy & Creative Technology Lead' },
        { dt: 'Outcome', dd: 'A connected executive experience supporting engagement, demonstration, collaboration and evolving digital content.' },
      ],
    },
    {
      id: 'prj-bpcl', client: 'Bharat Petroleum Corporation Limited', cat: 'Energy & Industrial', title: 'Intuitive Experiences for Industrial Environments', work: 'Experience Design · Spatial Visualization',
      href: '/case-studies/bharat-petroleum-corporation-limited/', img: '/assets/case-bpcl.webp', avif: '/assets/case-bpcl.avif', alt: 'Bharat Petroleum Corporation Limited — Energy & Industrial engagement',
      meta: [
        { dt: 'Problem', dd: "Safety-critical operations ran on dense manuals and denser screens. Comprehension wasn't a nicety — it was risk management." },
        { dt: 'Approach', dd: 'Intuitive interfaces and immersive walkthroughs of complex processes, designed to be understood under pressure.' },
        { dt: 'Role', dd: 'Design Strategy & Experience Lead' },
        { dt: 'Outcome', dd: 'Experiences operators trust at a glance — clarity measured in seconds, not slides.' },
      ],
    },
    {
      id: 'prj-army', client: 'Indian Army', cat: 'Defence & Government', title: 'Immersive Solutions for Mission-Critical Environments', work: 'Immersive Experience · Creative Technology',
      href: '/case-studies/indian-army/', img: '/assets/case-army.webp', avif: '/assets/case-army.avif', alt: 'Indian Army Immersive Training Platform — Defence & Immersive case-study artwork',
      meta: [
        { dt: 'Problem', dd: 'Communication at enormous scale, under the highest stakes, asking for absolute precision and discipline.' },
        { dt: 'Approach', dd: 'Immersive storytelling and visualization pipelines where every frame is verified — built with the discipline of the institution it served.' },
        { dt: 'Role', dd: 'Creative Lead — Immersive Solutions' },
        { dt: 'Outcome', dd: 'Work where clarity, precision and execution mattered most — and delivered.' },
      ],
    },
  ],
};

export default function FeaturedWork() {
  const { data: sectionsData, source: secSource } = useCmsContent('sections', null);
  const { data: projectsData, source: projSource } = useCmsContent('projects', null);
  const section: CmsSection | null = secSource === 'cms' ? findSection(sectionsData, 'work') : null;
  const cmsProjects = projSource === 'cms' && Array.isArray(projectsData) ? (projectsData as CmsProject[]) : null;

  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const lede = section?.lede ? String(section.lede) : FALLBACK.lede;

  // CMS projects drive featured cards when available — map to display model with fallback
  let display = FALLBACK.projects;
  if (cmsProjects && cmsProjects.length) {
    const featured = cmsProjects.filter((p) => p.featured).sort((a,b) => (a.order ?? 99) - (b.order ?? 99));
    const source = featured.length ? featured : cmsProjects.slice(0,3);
    if (source.length) {
      display = source.map((p) => {
        const fb = FALLBACK.projects.find((f) => f.href.includes(p.slug || '')) ?? FALLBACK.projects[0];
        const img = p.image ? cmsMediaUrl(p.image) : fb.img;
        const avif = img.endsWith('.webp') ? img.replace('.webp','.avif') : (p.image ? cmsMediaUrl(p.image.replace('.webp','.avif')) : fb.avif);
        return {
          id: p.id,
          client: p.client || fb.client,
          cat: p.industry || fb.cat,
          title: p.cardTitle || p.title || fb.title,
          work: p.services || fb.work,
          href: p.url || fb.href,
          img: img || fb.img,
          avif: avif,
          alt: p.imageAlt || fb.alt,
          meta: [
            { dt: 'Problem', dd: p.challenge || fb.meta[0].dd },
            { dt: 'Approach', dd: p.approach || fb.meta[1].dd },
            { dt: 'Role', dd: p.role || fb.meta[2].dd },
            { dt: 'Outcome', dd: p.outcome || fb.meta[3].dd },
          ],
        };
      });
    }
  }

  // respect CMS ordering via projectIds if present
  if (section?.projectIds && Array.isArray(section.projectIds) && (section.projectIds as string[]).length && cmsProjects) {
    const orderIds = section.projectIds as string[];
    display = [...display].sort((a,b) => {
      const ai = orderIds.indexOf(a.id);
      const bi = orderIds.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  return (
    <>
<section className="chapter work t-light" id="work" data-cms-source={section || cmsProjects ? 'cms' : 'fallback'}>
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
            <h2 className="chapter__title" data-reveal={true}>{title}</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>{lede}</p>
        </header>
        <div className="work-stage">
        <div className="work-hud" aria-hidden="true"><span className="work-hud__num" id="workHudNum">01</span><span className="work-hud__bar"><i id="workHudBar"></i></span><span className="work-hud__tot">{String(display.length).padStart(2,'0')}</span></div>
        <div className="work-film" id="workFilm">
        {display.map((proj, idx) => (
        <article key={proj.id} className="case" id={`case-${proj.id}`}>
          <figure className="case__panel" data-parallax={idx===0? "0" : "0.05"} data-reveal="img">
            <picture><source type="image/avif" srcSet={proj.avif} /><img src={proj.img} alt={proj.alt} width="1672" height="941" loading="lazy" decoding="async" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { const im=e.currentTarget; if(im.src!==proj.img) im.src=proj.img; }} /></picture>
            <figcaption className="case__card" data-tilt={true} data-reveal={true}>
              <div className="case__card__in">
                <p className="case__cat">{proj.cat}</p>
                <h3 className="case__client">{proj.client}</h3>
                <p className="case__title">{proj.title}</p>
                <div className="case__card__foot">
                  <p className="case__work">{proj.work}</p>
                  <a className="case__card-cta" href={proj.href}>Explore case study <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
                </div>
              </div>
            </figcaption>
          </figure>
          <dl className="case__meta case__meta--row" data-reveal-group={true}>
            {proj.meta.map((m) => (<div key={m.dt} data-reveal={true}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>))}
          </dl>
        </article>
        ))}
        </div>
        </div>
      </div>
    </section>
    </>
  );
}
