export default function FeaturedWork() {
  return (
    <>
<section className="chapter work t-light" id="work">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">Featured work</span></div>
            <h2 className="chapter__title" data-reveal={true}>Work that had to be understood.</h2>
          </div>
          <p className="chapter__lede" data-reveal={true}>Three engagements, chosen not for scale but for what they demanded — clarity where clarity was hardest.</p>
        </header>
        <div className="work-stage">
        <div className="work-hud" aria-hidden="true"><span className="work-hud__num" id="workHudNum">01</span><span className="work-hud__bar"><i id="workHudBar"></i></span><span className="work-hud__tot">03</span></div>
        <div className="work-film" id="workFilm">
        <article className="case" id="case-prj-1">
          <figure className="case__panel" data-parallax="0" data-reveal="img">
            <picture><source type="image/avif" srcSet="/assets/case-orange-experience-in-action.avif" /><img src="/assets/case-orange-experience-in-action.webp?v=20260909" alt="Orange Business Executive Briefing Center — Experience in Action case-study thumbnail" width="1672" height="941" loading="lazy" decoding="async" /></picture>
            <figcaption className="case__card" data-tilt={true} data-reveal={true}>
              <div className="case__card__in">
                <p className="case__cat">Telecom &amp; Digital Services</p>
                <h3 className="case__client">Orange Business</h3>
                <p className="case__title">New Executive Briefing Center</p>
                <div className="case__card__foot">
                  <p className="case__work">Experience Design · Creative Technology</p>
                  <a className="case__card-cta" href="/case-studies/orange-business/">Explore case study <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
                </div>
              </div>
            </figcaption>
          </figure>
          <dl className="case__meta case__meta--row" data-reveal-group={true}>
            <div data-reveal={true}><dt>Problem</dt><dd>Transform executive briefing into an experiential environment.</dd></div>
            <div data-reveal={true}><dt>Approach</dt><dd>Connect business objectives, brand, visitor journey, content, technology and physical environment.</dd></div>
            <div data-reveal={true}><dt>Role</dt><dd>Experience Strategy &amp; Creative Technology Lead</dd></div>
            <div data-reveal={true}><dt>Outcome</dt><dd>A connected executive experience supporting engagement, demonstration, collaboration and evolving digital content.</dd></div>
          </dl>
        </article>
        <article className="case" id="case-prj-2">
          <figure className="case__panel" data-parallax="0.05" data-reveal="img">
            <picture><source type="image/avif" srcSet="/assets/case-bpcl.avif" /><img src="/assets/case-bpcl.webp?v=20260905" alt="Bharat Petroleum Corporation Limited — Energy &amp; Industrial engagement" width="1672" height="941" loading="lazy" decoding="async" /></picture>
            <figcaption className="case__card" data-tilt={true} data-reveal={true}>
              <div className="case__card__in">
                <p className="case__cat">Energy &amp; Industrial</p>
                <h3 className="case__client">Bharat Petroleum Corporation Limited</h3>
                <p className="case__title">Intuitive Experiences for Industrial Environments</p>
                <div className="case__card__foot">
                  <p className="case__work">Experience Design · Spatial Visualization</p>
                  <a className="case__card-cta" href="/case-studies/bharat-petroleum-corporation-limited/">Explore case study <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
                </div>
              </div>
            </figcaption>
          </figure>
          <dl className="case__meta case__meta--row" data-reveal-group={true}>
            <div data-reveal={true}><dt>Problem</dt><dd>Safety-critical operations ran on dense manuals and denser screens. Comprehension wasn&#039;t a nicety — it was risk management.</dd></div>
            <div data-reveal={true}><dt>Approach</dt><dd>Intuitive interfaces and immersive walkthroughs of complex processes, designed to be understood under pressure.</dd></div>
            <div data-reveal={true}><dt>Role</dt><dd>Design Strategy &amp; Experience Lead</dd></div>
            <div data-reveal={true}><dt>Outcome</dt><dd>Experiences operators trust at a glance — clarity measured in seconds, not slides.</dd></div>
          </dl>
        </article>
        <article className="case" id="case-prj-3">
          <figure className="case__panel" data-parallax="0.05" data-reveal="img">
            <picture><source type="image/avif" srcSet="/assets/case-army.avif" /><img src="/assets/case-army.webp?v=20260909" alt="Indian Army Immersive Training Platform — Defence &amp; Immersive case-study artwork" width="1672" height="941" loading="lazy" decoding="async" /></picture>
            <figcaption className="case__card" data-tilt={true} data-reveal={true}>
              <div className="case__card__in">
                <p className="case__cat">Defence &amp; Government</p>
                <h3 className="case__client">Indian Army</h3>
                <p className="case__title">Immersive Solutions for Mission-Critical Environments</p>
                <div className="case__card__foot">
                  <p className="case__work">Immersive Experience · Creative Technology</p>
                  <a className="case__card-cta" href="/case-studies/indian-army/">Explore case study <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg></a>
                </div>
              </div>
            </figcaption>
          </figure>
          <dl className="case__meta case__meta--row" data-reveal-group={true}>
            <div data-reveal={true}><dt>Problem</dt><dd>Communication at enormous scale, under the highest stakes, asking for absolute precision and discipline.</dd></div>
            <div data-reveal={true}><dt>Approach</dt><dd>Immersive storytelling and visualization pipelines where every frame is verified — built with the discipline of the institution it served.</dd></div>
            <div data-reveal={true}><dt>Role</dt><dd>Creative Lead — Immersive Solutions</dd></div>
            <div data-reveal={true}><dt>Outcome</dt><dd>Work where clarity, precision and execution mattered most — and delivered.</dd></div>
          </dl>
        </article>
        </div>
        </div>
      </div>
    </section>
    </>
  );
}
