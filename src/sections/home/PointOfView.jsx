export default function PointOfView({ content }) {
  const arts = ((content && content.articles) || []).filter((a) => a.status !== "draft");
  const bySlug = {};
  arts.forEach((a) => { bySlug[String(a.id).replace(/^art-/, "")] = a; });
  const A = (slug, fallback) => (bySlug[slug] && bySlug[slug].title) || fallback;
  const T = (slug, fallback) => (bySlug[slug] ? `${bySlug[slug].category} · ${bySlug[slug].readTime}` : fallback);
  return (
    <>
<section className="chapter thinking t-dark" id="thinking">
      <div className="container">
        <header className="chapter__head chapter__head--center">
          <div className="chapter__meta" data-reveal={true}><span className="chapter__num">05</span><span className="chapter__rule"></span><span className="chapter__tag">Point of view</span></div>
        </header>
        <blockquote className="thinking__quote" data-reveal={true}>
          <p>“Technology evolves every day.<br /><em>Human understanding doesn't..”</em></p>
        </blockquote>
        <div className="thinking__lede" data-reveal={true}><p>Every engagement I take on is a translation problem: turning what an organization knows into what its audience understands. Tools change quarterly; the human mind doesn&#039;t. So I design for the constant — attention, trust, memory — and let the tools serve it, never the other way around.</p></div>
        <ul className="essays" data-reveal-group={true}>
<li><a className="essay" href="/insights/technology-should-feel-human/" data-reveal={true}>
              <span className="essay__num">01</span>
              <span className="essay__main"><span className="essay__title">{A("technology-should-feel-human", 'Technology Should Feel Human')}</span><span className="essay__tag">{T("technology-should-feel-human", 'Design · 13 min')}</span></span>
              <svg className="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" /></svg>
            </a></li>
<li><a className="essay" href="/insights/ai-isnt-replacing-creativity/" data-reveal={true}>
              <span className="essay__num">02</span>
              <span className="essay__main"><span className="essay__title">{A("ai-isnt-replacing-creivity", 'AI Isn&#039;t Replacing Creativity')}</span><span className="essay__tag">{T("ai-isnt-replacing-creivity", 'AI · 14 min')}</span></span>
              <svg className="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" /></svg>
            </a></li>
<li><a className="essay" href="/insights/designing-experiences-people-remember/" data-reveal={true}>
              <span className="essay__num">03</span>
              <span className="essay__main"><span className="essay__title">{A("designing-experiences-people-remember", 'Designing Experiences People Remember')}</span><span className="essay__tag">{T("designing-experiences-people-remember", 'Experience · 12 min')}</span></span>
              <svg className="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" /></svg>
            </a></li>
<li><a className="essay" href="/insights/why-enterprise-experiences-fail/" data-reveal={true}>
              <span className="essay__num">04</span>
              <span className="essay__main"><span className="essay__title">{A("why-enterprise-experiences-fail", 'Why Enterprise Experiences Fail')}</span><span className="essay__tag">{T("why-enterprise-experiences-fail", 'Enterprise · 15 min')}</span></span>
              <svg className="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" /></svg>
            </a></li>
        </ul>
      </div>
      <figure className="thinking__media container-wide" data-parallax="0.04" data-reveal="img">
        <picture><img src="/assets/working-session.webp" alt="Design working session — layout prints and sketches reviewed across a workshop table" width="1536" height="1024" loading="lazy" decoding="async" /></picture>
        <figcaption>Where most projects actually begin — paper, questions and honest conversation.</figcaption>
      </figure>
    </section>
    </>
  );
}
