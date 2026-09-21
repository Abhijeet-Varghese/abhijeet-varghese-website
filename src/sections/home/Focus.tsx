import { useCmsContent } from '../../hooks/useCmsContent';
import { findSection } from '../../lib/cms';
import type { CmsSection } from '../../lib/cms';

const FALLBACK = {
  kicker: 'Now',
  title: 'Current focus.',
  lede: 'If you have a hard problem and high standards, we should talk.',
  list: ['Enterprise Innovation','Creative Systems','Experience Design','AI-Enabled Creative Workflows','Innovation Consulting','Leadership'],
  openLabel: 'Open to',
  openTo: ['Leadership Roles','Enterprise Consulting','Innovation Partnerships','Speaking'],
  note: 'Every engagement starts the same way — an honest conversation about what actually needs to change.',
};

export default function Focus() {
  const { data, source } = useCmsContent('sections', null);
  const section: CmsSection | null = source === 'cms' ? findSection(data, 'focus') : null;
  const kicker = section?.kicker ? String(section.kicker) : FALLBACK.kicker;
  const title = section?.title ? String(section.title) : FALLBACK.title;
  const lede = section?.lede ? String(section.lede) : FALLBACK.lede;
  const list = Array.isArray(section?.list) && (section.list as string[]).length ? (section.list as string[]) : FALLBACK.list;
  const openLabel = section?.openLabel ? String(section.openLabel) : FALLBACK.openLabel;
  const openTo = Array.isArray(section?.openTo) && (section.openTo as string[]).length ? (section.openTo as string[]) : FALLBACK.openTo;
  const note = section?.note ? String(section.note) : FALLBACK.note;

  return (
    <>
<section className="chapter focus t-light" id="focus" data-cms-source={section ? 'cms' : 'fallback'}>
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">{kicker}</span></div>
            <h2 className="chapter__title" data-reveal={true}>{title}</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>{lede}</p>
        </header>
        <div className="focus__grid">
          <ul className="focus__list" data-reveal-group={true}>{list.map((item) => (<li key={item} data-reveal={true}>{item}</li>))}</ul>
          <div className="focus__open" data-reveal-group={true}>
            <p className="label label--muted" data-reveal={true}>{openLabel}</p>
            <ul className="open__list">{openTo.map((item) => (<li key={item} data-reveal={true}>{item}</li>))}</ul>
            <p className="focus__note" data-reveal={true}>{note}</p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
