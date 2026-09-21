import { useCmsContent } from '../../hooks/useCmsContent';
import { cmsMediaUrl, findSection } from '../../lib/cms';
import type { CmsSection } from '../../lib/cms';

const FALLBACK = {
  seo: 'Making ambitious ideas impossible to misunderstand.',
  tagline: 'Making ambitious ideas impossible to misunderstand.',
  taglineAccent: 'impossible to misunderstand.',
  lede: 'The most meaningful work doesn\'t happen when strategy, design, technology, AI and people work separately. It happens when they work together.',
  portrait: '/assets/hero-portrait.webp',
  cta: { label: 'Explore my work', href: '/case-studies/' },
  cta2: { label: 'Download résumé', href: '/assets/Abhijeet-Varghese-Resume.pdf' },
  roles: ['Creative Systems Leader', 'Experience Design', 'Enterprise Innovation', 'AI-Enabled Production'],
  availability: 'Available for select projects — 2026',
  marquee: ['Experience Design','Creative Strategy','Brand Systems','Experience Centres','Immersive Technology','AI-Enabled Production','Enterprise Innovation','Creative Leadership'],
};

export default function Hero() {
  const { data, source } = useCmsContent('sections', null);
  const cmsSection: CmsSection | null = source === 'cms' ? findSection(data, 'hero') : null;

  const taglineRaw = cmsSection?.title ? String(cmsSection.title) : FALLBACK.tagline;
  // CMS title may be plain text; split accent phrase when present
  const accentPhrase = FALLBACK.taglineAccent;
  const hasAccent = taglineRaw.includes(accentPhrase);
  const taglineBefore = hasAccent ? taglineRaw.replace(accentPhrase, '').trimEnd() : taglineRaw;
  const taglineAfterAccent = hasAccent ? accentPhrase : '';
  // Use CMS accent override if title2 present
  const accent = (cmsSection?.title2 ? String(cmsSection.title2) : taglineAfterAccent) || taglineAfterAccent;

  const lede = cmsSection?.lede ? String(cmsSection.lede) : FALLBACK.lede;
  const portrait = cmsSection?.portrait ? cmsMediaUrl(String(cmsSection.portrait)) : FALLBACK.portrait;
  const cta = cmsSection?.cta && typeof cmsSection.cta === 'object' ? cmsSection.cta as { label:string; href:string } : FALLBACK.cta;
  const cta2 = cmsSection?.cta2 && typeof cmsSection.cta2 === 'object' ? cmsSection.cta2 as { label:string; href:string } : FALLBACK.cta2;
  const roles = Array.isArray(cmsSection?.roles) && (cmsSection.roles as string[]).length ? (cmsSection.roles as string[]) : FALLBACK.roles;
  const availability = cmsSection?.availability ? String(cmsSection.availability) : FALLBACK.availability;
  const marquee = Array.isArray(cmsSection?.marquee) && (cmsSection.marquee as string[]).length ? (cmsSection.marquee as string[]) : FALLBACK.marquee;
  const marqueeTrack = [...marquee, ...marquee];

  return (
    <>
<section className="hp-hero hp6 t-dark" id="hero" data-theme="dark" aria-label="Introduction" data-cms-source={cmsSection ? 'cms' : 'fallback'}>
      <p className="hp-hero__seo">{FALLBACK.seo}</p>
      <div className="hp-hero__glow" aria-hidden="true"></div>
      <div className="hp6-field" aria-hidden="true"><span style={{"left": "5%", "top": "26%", "--fd": "-0.0.0s" } as React.CSSProperties & { '--fd': string }}>STRATEGY</span><span style={{"left": "50%", "top": "12%", "--fd": "-1.37.3s"} as React.CSSProperties & { '--fd': string }}>DESIGN</span><span style={{"left": "66%", "top": "66%", "--fd": "-2.74.6s"} as React.CSSProperties & { '--fd': string }}>TECHNOLOGY</span><span style={{"left": "30%", "top": "90%", "--fd": "-0.11000000000000032.0s"} as React.CSSProperties & { '--fd': string }}>AI</span><span style={{"left": "93%", "top": "42%", "--fd": "-1.4800000000000004.3s"} as React.CSSProperties & { '--fd': string }}>PEOPLE</span><span style={{"left": "8%", "top": "72%", "--fd": "-2.8500000000000005.6s"} as React.CSSProperties & { '--fd': string }}>STORY</span><span style={{"left": "88%", "top": "86%", "--fd": "-0.22000000000000064.0s"} as React.CSSProperties & { '--fd': string }}>SYSTEMS</span><span style={{"left": "44%", "top": "74%", "--fd": "-1.5899999999999999.3s"} as React.CSSProperties & { '--fd': string }}>SIGNAL</span></div>
      <div className="hp6-scan" aria-hidden="true"></div>
      <div className="hp6-stage">
        <div className="hp6-title">
          <h1 className="hp6-name" aria-label="Abhijeet Varghese">
            <span className="hp6-name__line hp6-name__line--one" aria-hidden="true"><span className="hp6-l" style={{"--i": "0", "--dx": "-14px", "--dy": "-18px", "--rot": "-4deg"} as React.CSSProperties}>A</span><span className="hp6-l" style={{"--i": "1", "--dx": "-6px", "--dy": "-11px", "--rot": "4deg"} as React.CSSProperties}>B</span><span className="hp6-l" style={{"--i": "2", "--dx": "2px", "--dy": "-4px", "--rot": "3deg"} as React.CSSProperties}>H</span><span className="hp6-l" style={{"--i": "3", "--dx": "10px", "--dy": "3px", "--rot": "2deg"} as React.CSSProperties}>I</span><span className="hp6-l" style={{"--i": "4", "--dx": "-11px", "--dy": "-13px", "--rot": "1deg"} as React.CSSProperties}>J</span><span className="hp6-l" style={{"--i": "5", "--dx": "-3px", "--dy": "-6px", "--rot": "0deg"} as React.CSSProperties}>E</span><span className="hp6-l" style={{"--i": "6", "--dx": "5px", "--dy": "1px", "--rot": "-1deg"} as React.CSSProperties}>E</span><span className="hp6-l" style={{"--i": "7", "--dx": "13px", "--dy": "-15px", "--rot": "-2deg"} as React.CSSProperties}>T</span></span>
            <span className="hp6-name__line hp6-name__line--two" aria-hidden="true"><span className="hp6-l" style={{"--i": "8", "--dx": "-8px", "--dy": "-8px", "--rot": "-3deg"} as React.CSSProperties}>V</span><span className="hp6-l" style={{"--i": "9", "--dx": "0px", "--dy": "-1px", "--rot": "-4deg"} as React.CSSProperties}>A</span><span className="hp6-l" style={{"--i": "10", "--dx": "8px", "--dy": "-17px", "--rot": "4deg"} as React.CSSProperties}>R</span><span className="hp6-l" style={{"--i": "11", "--dx": "-13px", "--dy": "-10px", "--rot": "3deg"} as React.CSSProperties}>G</span><span className="hp6-l" style={{"--i": "12", "--dx": "-5px", "--dy": "-3px", "--rot": "2deg"} as React.CSSProperties}>H</span><span className="hp6-l" style={{"--i": "13", "--dx": "3px", "--dy": "4px", "--rot": "1deg"} as React.CSSProperties}>E</span><span className="hp6-l" style={{"--i": "14", "--dx": "11px", "--dy": "-12px", "--rot": "0deg"} as React.CSSProperties}>S</span><span className="hp6-l" style={{"--i": "15", "--dx": "-10px", "--dy": "-5px", "--rot": "-1deg"} as React.CSSProperties}>E</span></span>
          </h1>
          <figure className="hp6-frame" data-frame={true}>
            <i className="hp6-frame__tick hp6-frame__tick--tl" aria-hidden="true"></i>
            <i className="hp6-frame__tick hp6-frame__tick--tr" aria-hidden="true"></i>
            <i className="hp6-frame__tick hp6-frame__tick--bl" aria-hidden="true"></i>
            <i className="hp6-frame__tick hp6-frame__tick--br" aria-hidden="true"></i>
            <div className="hp6-frame__well">
              <img src={portrait} alt="Editorial portrait of Abhijeet Varghese" width="1024" height="1024" fetchPriority="high" decoding="async" />
            </div>
            <figcaption className="hp6-frame__meta" aria-hidden="true"><span>Strategy</span><span>Design</span><span>Technology</span><span>AI</span></figcaption>
          </figure>
        </div>
        <div className="hp6-grid">
          <div className="hp6-main">
            <p className="hp-hero__tagline">{hasAccent ? <>{taglineBefore} <em className="hp6-accent">{accent}<svg className="hp6-flourish" viewBox="0 0 340 16" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M4 10 C 70 4, 200 3, 268 7 S 322 11, 336 6 M300 12 C 312 13, 326 12, 334 10" /></svg></em></> : <>{taglineRaw}<svg className="hp6-flourish" viewBox="0 0 340 16" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M4 10 C 70 4, 200 3, 268 7 S 322 11, 336 6 M300 12 C 312 13, 326 12, 334 10" /></svg></>}</p>
            <p className="hp6-lede">{lede}</p>
            <div className="hp6-actions">
              <a className="btn btn--accent" href={cta.href}>{cta.label} <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
              <a className="btn btn--ghost" href={cta2.href} download={cta2.href.endsWith('.pdf')}>{cta2.label}</a>
            </div>
          </div>
          <ul className="hp6-roles" aria-label="Disciplines">
            {roles.map((r, i) => (<li key={r} style={{ "--rd": `${1.2 + i * 0.08}s` } as React.CSSProperties}><span>{r}</span></li>))}
          </ul>
        </div>
        <p className="hp-hero__avail"><span className="hp-hero__avail-dot" aria-hidden="true"></span>{availability}</p>
      </div>
      <div className="hp-hero__cue" aria-hidden="true"><span>Scroll</span><i></i></div>
      <div className="hp-hero__marquee" aria-hidden="true"><div className="marquee__track">{marqueeTrack.map((item, idx) => (<span key={`${item}-${idx}`}>{item}<span className="marquee__dot" aria-hidden="true"></span></span>))}</div></div>
    </section>
    </>
  );
}
