import { useCmsContent } from '../../hooks/useCmsContent';
import { findSection } from '../../lib/cms';
import type { CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Journey',
  title: 'Not a timeline. An evolution.',
  hint: 'Keep scrolling — the years unfold sideways',
  eras: [
    { name: 'Graphic Design', note: 'Learning to see' },
    { name: 'Animation', note: 'Learning to move' },
    { name: 'Storytelling', note: 'Learning to mean' },
    { name: 'Experience Design', note: 'Learning to orchestrate' },
    { name: 'Immersive Tech', note: 'Learning to build worlds' },
    { name: 'Creative Leadership', note: 'Learning to multiply others' },
    { name: 'Enterprise Innovation', note: 'Learning to shift systems' },
    { name: 'AI', note: 'Moving faster — deliberately' },
    { name: 'Future', note: 'Still curious', future: true },
  ] as { name: string; note: string; future?: boolean }[],
  coda: 'The tools changed. The curiosity never did.',
};

export default function Journey() {
  const { data, source } = useCmsContent('sections', null);
  const section: CmsSection | null = source === 'cms' ? findSection(data, 'journey') : null;
  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const eras = Array.isArray(section?.eras) && (section.eras as typeof FALLBACK.eras).length ? (section.eras as typeof FALLBACK.eras) : FALLBACK.eras;
  const coda = section?.coda ? String(section.coda) : FALLBACK.coda;

  return (
    <>
<section className="journey t-light" id="journey" data-cms-source={section ? 'cms' : 'fallback'}>
      <div className="journey__pin" id="journeyPin">
        <header className="journey__head container">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
            <h2 className="chapter__title" data-reveal={true}>{title}</h2>
          </div>
          <p className="journey__hint" data-reveal={true}>{FALLBACK.hint}
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M0 6h19M15 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" /></svg>
          </p>
        </header>
        <div className="journey__viewport">
          <ol className="journey__track" id="journeyTrack">
            {eras.map((era) => (
              <li key={era.name} className={era.future ? 'era era--future' : 'era'} data-reveal={true}>
                <h3 className="era__name">{era.name}</h3>
                <span className="era__note">{era.note}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="journey__barwrap container">
          <div className="journey__bar" aria-hidden="true"><span id="journeyBar"></span></div>
        </div>
      </div>
    </section>
    <div className="coda t-light"><div className="container"><p className="journey__coda" data-reveal={true}>{coda}</p></div></div>
    </>
  );
}
