export default function CaseBPCL() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>

  
  <a className="page-close" href="/case-studies/" data-history-close={true} aria-label="Back to case studies"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>

  <main id="main">

  
  <section className="hero" id="hero" aria-labelledby="heroTitle">
    <div className="hero__media">
      <picture>
        <source type="image/webp" srcSet="/assets/bpcl/images/miniature/night-720.webp 720w, /assets/bpcl/images/miniature/night-1100.webp 1100w, /assets/bpcl/images/miniature/night-1672.webp 1672w" sizes="100vw" />
        <img id="heroImg" src="/assets/bpcl/images/miniature/night-1280.jpg" alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation at night, its integrated lighting tracing the internal roads, tank farm and buildings." width="1672" height="941" fetchpriority="high" decoding="async" />
      </picture>
    </div>
    <div className="hero__veil" aria-hidden="true"></div>
    <div className="hero__inner">
      <p className="hero__place mono">BHARAT PETROLEUM CORPORATION LIMITED · PALAKKAD</p>
      <h1 className="hero__title" id="heroTitle">
        <span className="line"><span>MAKING</span></span>
        <span className="line"><span>COMPLEXITY</span></span>
        <span className="line"><span>VISIBLE.</span></span>
      </h1>
      <p className="hero__lede">A spatial visualization project translating a complex industrial site into something people could see, understand and experience.</p>
      <p className="hero__meta mono">STRATEGY · CREATIVE DIRECTION · SPATIAL VISUALIZATION · 3D WALKTHROUGH</p>
      <a className="hero__cta mono" href="#challenge">EXPLORE THE PROJECT <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  
  <section className="section section--paper" id="challenge" aria-labelledby="challengeTitle">
    <div className="wrap">
      <p className="label mono">THE CHALLENGE</p>
      <h2 className="display" id="challengeTitle">THE SITE WAS COMPLEX.<br />THE STORY COULDN'T BE.</h2>
      <div className="cols" id="challengeCopy"></div>

      <h3 className="close-line">START WITH WHAT PEOPLE<br />NEED TO UNDERSTAND.</h3>

      <div className="strategy">
        <p className="label mono">STRATEGIC RESPONSE</p>
        <ol className="strategy__list" id="strategyList"></ol>
      </div>

      <div className="bridge" id="bridge" aria-label="From site to experience"></div>

      <p className="contribution mono" id="contribution"></p>
    </div>
  </section>

  
  <section className="section section--ink" id="miniature" aria-labelledby="miniatureTitle">
    <div className="wrap">
      <p className="label mono">01 / PHYSICAL MINIATURE</p>
      <h2 className="display" id="miniatureTitle">FIRST, THE SITE<br />HAD TO BE SEEN<br />AS A WHOLE.</h2>
      <p className="lede lede--wide">The installation was built as a physical miniature at roughly 8 × 10 ft — detailed enough to hold storage areas, operational buildings, internal roads, parking, landscape, utilities and boundary in a single view.</p>
      <p className="body body--wide">Seen together, the relationships between the parts became obvious in a way no single image of the site could achieve.</p>
      <dl className="metarow" id="modelMeta"></dl>
    </div>

    <figure className="viewer" id="viewer" aria-label="Physical miniature viewer">
      <div className="viewer__stage" id="viewerStage"></div>
      <figcaption className="viewer__hud">
        <span className="mono viewer__tag" id="viewerTag">VIEW 02</span>
        <span className="mono viewer__count" id="viewerCount">02 / 07</span>
      </figcaption>
      <div className="viewer__nav">
        <button className="vnav" id="viewerPrev" type="button" aria-label="Previous miniature view"><span aria-hidden="true">←</span></button>
        <div className="viewer__dots" id="viewerDots" role="tablist" aria-label="Miniature views"></div>
        <button className="vnav" id="viewerNext" type="button" aria-label="Next miniature view"><span aria-hidden="true">→</span></button>
        <button className="inspect" id="viewerInspect" type="button"><span className="mono">INSPECT</span></button>
      </div>
    </figure>

    <div className="wrap dnwrap">
      <p className="label mono">MINIATURE LIGHTING</p>
      <h3 className="close-line">SAME MODEL.<br />DIFFERENT CONDITION.</h3>
      <p className="body body--wide">Daylight reveals the organization of the installation. Integrated lighting reveals another layer after dark.</p>
    </div>

    <div className="dn" id="dn">
      <div className="dn__frame" id="dnFrame">
        <img className="dn__img" id="dnNight" src="/assets/bpcl/images/miniature/night-1280.jpg" srcSet="/assets/bpcl/images/miniature/night-720.webp 720w, /assets/bpcl/images/miniature/night-1100.webp 1100w, /assets/bpcl/images/miniature/night-1672.webp 1672w" sizes="(max-width:900px) 96vw, 92vw" alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation at night, with integrated lighting along roads, buildings and tanks." width="1672" height="941" loading="lazy" decoding="async" />
        <div className="dn__clip" id="dnClip">
          <img className="dn__img" id="dnDay" src="/assets/bpcl/images/miniature/day-1280.jpg" srcSet="/assets/bpcl/images/miniature/day-720.webp 720w, /assets/bpcl/images/miniature/day-1100.webp 1100w, /assets/bpcl/images/miniature/day-1672.webp 1672w" sizes="(max-width:900px) 96vw, 92vw" alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation in daylight, showing the full site layout." width="1672" height="941" loading="lazy" decoding="async" />
        </div>
        <div className="dn__handle" id="dnHandle" role="slider" tabIndex="0" aria-label="Day to night comparison of the physical miniature" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50 percent day">
          <span className="dn__grip" aria-hidden="true"></span>
        </div>
        <span className="dn__tag dn__tag--l mono">DAY</span>
        <span className="dn__tag dn__tag--r mono">NIGHT</span>
      </div>
      <p className="dn__cap mono">DRAG TO COMPARE</p>
    </div>
  </section>

  
  <section className="section section--ink" id="blueprint" aria-labelledby="blueprintTitle">
    <div className="wrap link">
      <p className="link__from mono">MODEL</p>
      <span className="link__arrow" aria-hidden="true"></span>
      <p className="link__to mono">BLUEPRINT</p>
      <p className="link__copy">The physical model established the spatial whole. The blueprint translated it into a structured technical view.</p>
    </div>

    <div className="wrap">
      <p className="label mono">02 / TECHNICAL TRANSLATION</p>
      <h2 className="display" id="blueprintTitle">THE MODEL<br />BECAME A LANGUAGE.</h2>
      <p className="sub-line mono">THE SITE, DRAWN AS A SYSTEM.</p>
    </div>

    <figure className="bpv" id="bpv">
      <div className="bpv__viewport" id="bpvViewport" tabIndex="0" role="group" aria-label="Blueprint viewer. Use plus and minus keys to zoom, arrow keys to pan, zero to reset.">
        <div className="bpv__canvas" id="bpvCanvas">
          <picture>
            <source type="image/webp" srcSet="/assets/bpcl/images/blueprint/blueprint-720.webp 720w, /assets/bpcl/images/blueprint/blueprint-1100.webp 1100w, /assets/bpcl/images/blueprint/blueprint-1672.webp 1672w" sizes="(max-width:900px) 96vw, 92vw" />
            <img id="bpvImg" src="/assets/bpcl/images/blueprint/blueprint-1280.jpg" alt="Technical blueprint of the Bharat Petroleum Corporation Limited Palakkad Top Installation showing the tank farm, internal roads, parking and site layout." width="1672" height="941" loading="lazy" decoding="async" draggable="false" />
          </picture>
        </div>
        <div className="bpv__cross" id="bpvCross" aria-hidden="true"><i></i><i></i></div>
      </div>
      <figcaption className="bpv__note mono" id="bpvNote"></figcaption>
      <div className="bpv__bar">
        <div className="bpv__ctl">
          <button className="btn" id="bpvOut" type="button" aria-label="Zoom out">−</button>
          <span className="mono bpv__val" id="bpvVal">1.0×</span>
          <button className="btn" id="bpvIn" type="button" aria-label="Zoom in">+</button>
          <button className="btn btn--wide" id="bpvReset" type="button">RESET</button>
        </div>
      </div>
    </figure>
  </section>

  
  <section className="section section--ink" id="walkthrough" aria-labelledby="walkthroughTitle">
    <div className="wrap">
      <p className="label mono">03 / 3D ARCHITECTURAL WALKTHROUGH</p>
      <h2 className="display" id="walkthroughTitle">FROM PLAN<br />TO PRESENCE.</h2>
      <p className="lede lede--wide">The 3D walkthrough translates the site into an explorable architectural environment — bringing buildings, storage infrastructure, roads, movement, landscape and context into one continuous experience.</p>
      <h3 className="close-line">NOW,<br />ENTER THE SITE.</h3>
    </div>

    <figure className="film" id="film" aria-label="3D architectural walkthrough">
      <div className="film__frame" id="filmFrame">
        <div className="film__stage" id="filmStage"></div>
        <div className="film__grid" aria-hidden="true"></div>
        <div className="film__bars" aria-hidden="true"><i></i><i></i></div>
      </div>
      <figcaption className="film__hud">
        <span className="mono film__count" id="filmCount">01 / 10</span>
        <span className="mono film__cap" id="filmCap">3D ARCHITECTURAL WALKTHROUGH — FRAME 01</span>
      </figcaption>
      <div className="film__ctrl">
        <button className="vnav" id="filmPrev" type="button" aria-label="Previous frame"><span aria-hidden="true">←</span></button>
        <div className="film__rail" id="filmRail" role="tablist" aria-label="Walkthrough frames"></div>
        <button className="vnav" id="filmNext" type="button" aria-label="Next frame"><span aria-hidden="true">→</span></button>
      </div>
    </figure>

    <div className="wrap closeups">
      <h3 className="close-line">DETAIL<br />MAKES THE ENVIRONMENT<br />BELIEVABLE.</h3>
      <p className="body body--wide">The environment was resolved beyond the masterplan — down to architecture, infrastructure, materials, landscape and lighting.</p>
      <div className="closeups__grid" id="closeups"></div>
    </div>
  </section>

  
  <section className="section section--paper" id="leadership" aria-labelledby="leadershipTitle">
    <div className="wrap">
      <p className="label mono">04 / LEADERSHIP</p>
      <h2 className="display" id="leadershipTitle">ONE VISION.<br />MANY MOVING PARTS.</h2>
      <p className="lede lede--wide">The work ran through concept development, creative direction, team guidance, stakeholder management, vendor coordination, production and quality control. The harder task was holding one coherent vision across all of it.</p>

      <ol className="flow" id="flow" aria-label="Delivery flow"></ol>

      <h3 className="close-line">THE VISION HAD<br />TO SURVIVE<br />PRODUCTION.</h3>

      <div className="areas" id="areas"></div>

      <h3 className="close-line senior-line">MORE THAN THE OUTPUT.<br />I DROVE THE JOURNEY<br />FROM CONCEPT TO DELIVERY.</h3>

      <dl className="foot__info" id="footInfo" aria-label="Project at a glance"></dl>
    </div>
  </section>

  
  <section className="section section--paper" id="outcome" aria-labelledby="outcomeTitle">
    <div className="wrap">
      <p className="label mono">OUTCOME</p>
      <h2 className="display" id="outcomeTitle">THE SITE COULD NOW<br />BE UNDERSTOOD<br />FROM EVERY SCALE.</h2>
      <ol className="chain-out" id="outcomes"></ol>
    </div>
  </section>

  </main>

  
  <section className="finale" id="final" aria-labelledby="finalTitle">
    <div className="finale__media">
      <picture>
        <source type="image/webp" srcSet="/assets/bpcl/images/miniature/m5-720.webp 720w, /assets/bpcl/images/miniature/m5-1100.webp 1100w, /assets/bpcl/images/miniature/m5-1672.webp 1672w" sizes="100vw" />
        <img src="/assets/bpcl/images/miniature/m5-1280.jpg" alt="Closing view of the Bharat Petroleum Corporation Limited Palakkad Top Installation physical miniature, resolved from concept to experience." width="1672" height="941" loading="lazy" decoding="async" />
      </picture>
    </div>
    <div className="finale__inner">
      <p className="finale__place mono">BHARAT PETROLEUM CORPORATION LIMITED · PALAKKAD</p>
      <h2 className="finale__title" id="finalTitle">
        <span className="line"><span>FROM CONCEPT</span></span>
        <span className="line"><span>TO EXPERIENCE.</span></span>
      </h2>
      <p className="finale__line mono">Strategy · Creative Direction · Visualization · Leadership · Delivery</p>
    </div>
  </section>

  <nav className="e-next" aria-label="Next case study">
    <div className="e-next__in">
      <div><p className="e-next__eyebrow">Next case study</p>
      <p className="e-next__title"><a href="/case-studies/indian-army/">Indian Army <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M4 15h19M17 8.5 23.5 15 17 21.5" stroke="currentColor" strokeWidth="1.8" /></svg></a></p></div>
      <a className="btn btn--ghost" href="/case-studies/">All case studies</a>
    </div>
  </nav>
    </>
  );
}
