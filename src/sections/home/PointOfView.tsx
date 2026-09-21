import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl, findSection } from '../../lib/cms';
import type { CmsArticle, CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Point of view',
  quote: 'Technology evolves every day. Human understanding doesn\'t.',
  lede: 'Every engagement I take on is a translation problem: turning what an organization knows into what its audience understands. Tools change quarterly; the human mind doesn\'t. So I design for the constant — attention, trust, memory — and let the tools serve it, never the other way around.',
  essays: [
    { title: 'Technology Should Feel Human', tag: 'Design · 13 min', href: '/insights/technology-should-feel-human/' },
    { title: "AI Isn't Replacing Creativity", tag: 'AI · 14 min', href: '/insights/ai-isnt-replacing-creativity/' },
    { title: 'Designing Experiences People Remember', tag: 'Experience · 12 min', href: '/insights/designing-experiences-people-remember/' },
    { title: 'Why Enterprise Experiences Fail', tag: 'Enterprise · 15 min', href: '/insights/why-enterprise-experiences-fail/' },
  ],
  media: { src: '/assets/working-session.webp', alt: 'Design working session — layout prints and sketches reviewed across a workshop table', caption: 'Where most projects actually begin — paper, questions and honest conversation.' },
};

export default function PointOfView() {
  const { data: secData, source: secSource } = useCmsContent('sections', null);
  const { data: artData, source: artSource } = useCmsContent('articles', null);
  const section: CmsSection | null = secSource === 'cms' ? findSection(secData, 'thinking') : null;
  const cmsArticles = artSource === 'cms' && Array.isArray(artData) ? (artData as CmsArticle[]) : null;

  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const quote = section?.quote ? String(section.quote) : FALLBACK.quote;
  const lede = section?.lede ? String(section.lede) : FALLBACK.lede;
  const imgSrc = section?.image ? cmsMediaUrl(String(section.image)) : FALLBACK.media.src;
  const caption = section?.imageCaption ? String(section.imageCaption) : FALLBACK.media.caption;

  // CMS essays via essayIds ordering
  let essays = FALLBACK.essays;
  if (cmsArticles && cmsArticles.length) {
    const byId = new Map(cmsArticles.map((a) => [a.id, a]));
    const ids = section?.essayIds as string[] | undefined;
    let picked: CmsArticle[] = [];
    if (ids && ids.length) {
      picked = ids.map((id) => byId.get(id) || null).filter(Boolean) as CmsArticle[];
    }
    if (!picked.length) {
      // fallback to 4 most recent
      picked = [...cmsArticles].slice(0,4);
    }
    if (picked.length) {
      essays = picked.map((a) => ({
        title: a.title || FALLBACK.essays[0].title,
        tag: [a.category, a.readTime].filter(Boolean).join(' · ') || FALLBACK.essays[0].tag,
        href: a.url || `/insights/${a.slug}/`,
      }));
    }
  }

  return (
    <>
<section className="chapter thinking t-dark" id="thinking" data-cms-source={section || cmsArticles ? 'cms' : 'fallback'}>
      <div className="container">
        <header className="chapter__head chapter__head--center">
          <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
        </header>
        <blockquote className="thinking__quote" data-reveal={true}>
          <p>“{quote.split('.')[0]}.<br /><em>{quote.includes('.') ? quote.split('.').slice(1).join('.').trim() : ''}</em>”</p>
        </blockquote>
        <div className="thinking__lede" data-reveal={true}><p>{lede}</p></div>
        <ul className="essays" data-reveal-group={true}>
          {essays.map((e) => (
            <li key={e.href}><a className="essay" href={e.href} data-reveal={true}>
              <span className="essay__main"><span className="essay__title">{e.title}</span><span className="essay__tag">{e.tag}</span></span>
              <svg className="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" /></svg>
            </a></li>
          ))}
        </ul>
      </div>
      <figure className="thinking__media container-wide" data-parallax="0.04" data-reveal="img">
        <picture><img src={imgSrc} alt={FALLBACK.media.alt} width="1536" height="1024" loading="lazy" decoding="async" onError={(e: React.SyntheticEvent<HTMLImageElement>)=>{ const im=e.currentTarget; if(im.src!==FALLBACK.media.src) im.src=FALLBACK.media.src; }} /></picture>
        <figcaption>{caption}</figcaption>
      </figure>
    </section>
    </>
  );
}
