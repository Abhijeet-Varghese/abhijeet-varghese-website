import type { CSSProperties } from 'react';

const revealDelay = (value: string): CSSProperties => ({ '--d': value } as CSSProperties);

const caseStudies = [
  {
    id: 'cs-01',
    category: 'Telecom & Digital Services',
    href: '/case-studies/orange-business/',
    label: 'Open the Orange Business case study',
    avif: '/assets/case-orange-experience-in-action.avif',
    image: '/assets/case-orange-experience-in-action.webp?v=20260909',
    alt: 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail',
    client: 'Orange Business',
    project: 'Executive Briefing Center',
    statement: 'From business story to physical experience.',
    description: 'A new executive briefing environment designed to bring together brand, technology, content and spatial experience — giving visitors a more connected way to understand what Orange Business makes possible.',
    work: 'Experience Strategy · Creative Direction · Creative Technology · Content · Experience Delivery',
  },
  {
    id: 'cs-02',
    category: 'Energy & Industrial',
    href: '/case-studies/bharat-petroleum-corporation-limited/',
    label: 'Open the Bharat Petroleum case study',
    avif: '/assets/case-bpcl.avif',
    image: '/assets/case-bpcl.webp?v=20260905',
    alt: 'Bharat Petroleum Corporation Limited Palakkad Top Installation — physical miniature, blueprint system and 3D walkthrough of the industrial site',
    client: 'Bharat Petroleum',
    project: 'Palakkad Top Installation',
    statement: 'Making an industrial system understandable at every scale.',
    description: 'A complex petroleum installation brought together through physical modelling, technical visualization, 3D environments and immersive walkthroughs — allowing different audiences to understand the same site from different perspectives.',
    work: 'Strategy · Creative Direction · Spatial Visualization · 3D · Immersive Experience · Delivery',
  },
  {
    id: 'cs-03',
    category: 'Defence & Government',
    href: '/case-studies/indian-army/',
    label: 'Open the Indian Army case study',
    avif: '/assets/case-army.avif',
    image: '/assets/case-army.webp?v=20260909',
    alt: 'Indian Army Immersive Training Platform — defence simulation artwork with a soldier in virtual-reality training beside T-90 tanks',
    client: 'Indian Army',
    project: 'Immersive Solutions for Mission-Critical Environments',
    statement: 'When clarity has to perform under pressure.',
    description: 'Immersive visualization and storytelling developed for environments where information needs to be precise, immediate and understood — bringing complex scenarios into experiences designed for clarity.',
    work: 'Immersive Experience · Creative Technology · Visualization · Creative Direction',
  },
] as const;

function ArrowIcon() {
  return (
    <svg className="btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true" width="15" height="15">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Legacy Case Studies listing, retained as one ordered, crawlable collection. */
export default function CaseStudiesContent() {
  return (
    <>
      <section className="page-hero" aria-label="Case Studies">
        <div className="container">
          <div className="chapter__meta page-hero__meta" data-reveal="">
            <span className="chapter__num">03</span><span className="chapter__rule"></span><span className="chapter__tag">Case Studies</span>
          </div>
          <h1 className="page-hero__title" data-reveal="">Making complexity <em>visible</em>.</h1>
          <div data-reveal="" style={revealDelay('.15s')}>
            <p className="page-hero__lede">Three engagements across technology, industry and defence — each shaped around a different challenge, audience and environment.</p>
            <p className="page-hero__lede page-hero__lede--more">These are not projects presented as finished pictures. They are examples of how strategy, experience design, storytelling and technology can turn complex ideas into experiences people can understand.</p>
          </div>
          <ul className="hero-notes" data-reveal="" style={revealDelay('.3s')} aria-label="Disciplines">
            <li><i>01</i>Experience Design</li>
            <li><i>02</i>Creative Technology</li>
            <li><i>03</i>Strategy</li>
            <li><i>04</i>Immersive Experiences</li>
          </ul>
        </div>
      </section>

      <section className="cx" aria-label="Selected case studies">
        <div className="container">
          {caseStudies.map((study) => (
            <article className="cx-item" id={study.id} key={study.id}>
              <header className="cx-mark" data-reveal="">
                <span className="cx-cat">{study.category}</span><i aria-hidden="true"></i>
              </header>
              <a className="cx-fig" href={study.href} data-reveal="img" aria-label={study.label}>
                <span className="cx-par">
                  <picture>
                    <source type="image/avif" srcSet={study.avif} />
                    <img src={study.image} alt={study.alt} width="1672" height="941" loading="lazy" decoding="async" />
                  </picture>
                </span>
              </a>
              <div className="cx-title" data-reveal="">
                <h2 className="cx-name"><a href={study.href}>{study.client}</a></h2>
                <a className="link-arrow cx-cta" href={study.href}>Explore case study <ArrowIcon /></a>
              </div>
              <div className="cx-cols">
                <div className="cx-left" data-reveal="">
                  <p className="cx-project">{study.project}</p>
                  <p className="cx-statement">{study.statement}</p>
                </div>
                <div className="cx-right" data-reveal="" style={revealDelay('.08s')}>
                  <p className="cx-desc">{study.description}</p>
                  <p className="cx-work">{study.work}</p>
                </div>
              </div>
            </article>
          ))}

          <aside className="cx-hinge" data-reveal="">
            <p className="cx-hinge__tag">Three environments</p>
            <p className="cx-hinge__q">Three different rooms. Three different audiences. <em>One way of working.</em></p>
            <p className="cx-hinge__p">Make the complex feel obvious — then make it feel effortless.</p>
          </aside>

          <aside className="cx-close" data-reveal="">
            <p className="cx-close__eyebrow">Beyond the case study</p>
            <h2 className="cx-close__head">Some work is better <em>discussed</em> than displayed.</h2>
            <div className="cx-close__copy">
              <p>The work shown here is only part of the story.</p>
              <p>For selected engagements, the deeper process — strategic thinking, stakeholder decisions, working artefacts, iterations and delivery — is best explored in conversation.</p>
            </div>
            <div className="cx-close__actions">
              <a className="btn btn--accent" href="/contact/">Start a conversation <ArrowIcon /></a>
              <a className="btn btn--ghost" href="mailto:hi@abhijeetvarghese.com?subject=Case%20study%20deep%20dive">Request a deeper look</a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
