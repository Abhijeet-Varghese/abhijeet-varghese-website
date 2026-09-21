import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl, findSection } from '../../lib/cms';
import type { CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Method',
  title: 'Building with AI.',
  title2: 'Thinking like a human.',
  p1: 'AI is the fastest collaborator I\'ve ever worked with — and it still needs direction. I integrate it across research, ideation, storyboards, scripts, image generation, video generation, concept development and rapid prototyping.',
  p2: 'The point was never to make more. It\'s to see more options, sooner — and choose better. Every output passes through the same filter it always did: does a human being understand this, trust this, remember this?',
  chips: ['Research','Ideation','Storyboards','Scripts','Image Generation','Video Generation','Concept Development','Rapid Prototyping'],
  projects: [
    { name: 'The Virtual Life', body: 'An AI-crafted narrative world — exploring how generated media can carry genuine emotional weight.' },
    { name: 'Immersive Wedding Invitation', body: 'A platform that turns a wedding invitation into an explorable experience — AI-personalized for every guest.' },
  ],
  motto: 'AI accelerates the hands. It doesn\'t replace the head — or the heart.',
  media: { src: '/assets/experience-centre.webp', alt: 'Visitors in a dark exhibition hall facing a large glowing media wall', caption: 'An enterprise experience centre — strategy made walkable.' },
};

export default function AISection() {
  const { data, source } = useCmsContent('sections', null);
  const section: CmsSection | null = source === 'cms' ? findSection(data, 'ai') : null;
  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const title2 = section?.title2 ? String(section.title2) : FALLBACK.title2;
  const p1 = section?.p1 ? String(section.p1) : FALLBACK.p1;
  const p2 = section?.p2 ? String(section.p2) : FALLBACK.p2;
  const chips = Array.isArray(section?.chips) && (section.chips as string[]).length ? (section.chips as string[]) : FALLBACK.chips;
  const projects = Array.isArray(section?.projects) && (section.projects as typeof FALLBACK.projects).length ? (section.projects as typeof FALLBACK.projects) : FALLBACK.projects;
  const motto = section?.motto ? String(section.motto) : FALLBACK.motto;
  const img = section?.image ? cmsMediaUrl(String(section.image)) : FALLBACK.media.src;
  const caption = section?.imageCaption ? String(section.imageCaption) : FALLBACK.media.caption;

  return (
    <>
<section className="chapter ai t-dark" id="ai" data-cms-source={section ? 'cms' : 'fallback'}>
      <div className="container">
        <div className="ai__grid">
          <div className="ai__copy">
            <header className="chapter__head">
              <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
              <h2 className="chapter__title" data-reveal={true}>{title}<em className="block-em">{title2}</em></h2>
            </header>
            <div data-reveal-group={true}>
              <p data-reveal={true}>{p1}</p>
              <p data-reveal={true}>{p2}</p>
            </div>
            <ul className="chip-list" data-reveal-group={true}>{chips.map((c) => (<li key={c} data-reveal={true}>{c}</li>))}</ul>
            <div className="ai__projects" data-reveal-group={true}>{projects.map((pr) => (<article key={pr.name} className="ai-project" data-reveal={true}><h3>{pr.name}</h3><p>{pr.body}</p></article>))}</div>
            <p className="ai__motto" data-reveal={true}>“{motto}”</p>
          </div>
          <figure className="ai__media" data-parallax="0.05" data-reveal="img">
            <picture><img src={img} alt={FALLBACK.media.alt} width="1536" height="1024" loading="lazy" decoding="async" onError={(e: React.SyntheticEvent<HTMLImageElement>)=>{ const im=e.currentTarget; if(im.src!==FALLBACK.media.src) im.src=FALLBACK.media.src; }} /></picture>
            <figcaption>{caption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
    </>
  );
}
