import { useCmsContent } from '../../hooks/useCmsContent';
import { findSection } from '../../lib/cms';
import type { CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Capabilities',
  title: "Complex challenges don't need more specialists.",
  title2: 'They need people who can connect the dots.',
  caps: [
    { name: 'Creative Strategy', body: 'Direction before decoration. I turn ambiguity into a shared point of view — the idea everything else hangs on — so teams stop debating taste and start building against intent.' },
    { name: 'Brand Systems', body: 'Systems, not style guides. Identities engineered to survive real organizations — coherent across products, print, motion and environments, and simple enough for everyone else to use without me.' },
    { name: 'Digital Products', body: 'Interfaces that respect the person using them. From enterprise dashboards to consumer apps, I design products where the complexity lives in the system — never on the screen.' },
    { name: 'Experience Centres', body: 'Physical spaces where organizations explain themselves. I architect centres that turn strategy into something visitors can walk through, touch — and finally understand.' },
    { name: 'Creative Leadership', body: 'Teams make the work; leaders make the conditions. Mentoring, standards, reviews and rituals that raise the ceiling of what a creative team believes it can ship.' },
    { name: 'AI-Enabled Creative Production', body: 'Machines for momentum, humans for judgment. I design workflows where AI compresses weeks of exploration into days — while taste, ethics and craft remain unmistakably human.' },
  ] as { name: string; body: string }[],
};

export default function Capabilities() {
  const { data, source } = useCmsContent('sections', null);
  const section: CmsSection | null = source === 'cms' ? findSection(data, 'capabilities') : null;
  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const title2 = section?.title2 ? String(section.title2) : FALLBACK.title2;
  const caps = Array.isArray(section?.capabilities) && (section.capabilities as { name:string; body:string }[]).length
    ? (section.capabilities as { name:string; body:string }[])
    : FALLBACK.caps;

  return (
    <>
<section className="chapter capabilities t-dark" id="capabilities" data-cms-source={section ? 'cms' : 'fallback'}>
      <div className="container">
        <header className="chapter__head">
          <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
          <h2 className="chapter__title chapter__title--wide" data-reveal={true}>{title}<em className="block-em">{title2}</em></h2>
        </header>
        <div className="cap-list">
          {caps.map((cap, idx) => (
            <article key={cap.name} className={`cap${idx === caps.length - 1 ? ' cap--feature' : ''}`} data-reveal={true}>
              <h3>{cap.name}</h3>
              <p>{cap.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
