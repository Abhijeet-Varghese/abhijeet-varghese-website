export default function Portfolio() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>
  
  <a className="page-close" href="/" data-history-close={true} aria-label="Back to previous page"><svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></a>
    <main id="main" className="pf">

    
    <section className="pf-overture" id="portfolio" data-pf-chapter={true} aria-label="Portfolio introduction">
      <span className="pf-overture__aura" aria-hidden="true"></span>
      <div className="pf-wrap">
        <div className="pf-overture__top">
          <p className="pf-eyebrow">Portfolio</p>
          <p className="pf-overture__idx">Selected practice · 2014 — 2026</p>
        </div>

        <div className="pf-overture__body">
          <h1 className="pf-display pf-overture__title">
            <span className="pf-line"><i>Creative</i></span>
            <span className="pf-line"><i>Director</i></span>
            <span className="pf-line pf-suffix"><i><em>Portfolio</em></i></span>
            <span className="pf-sr"> — Abhijeet Varghese</span>
          </h1>
        </div>

        <div className="pf-overture__foot">
          <p className="pf-overture__disc">Design. Animation.<br />Immersive Experiences.</p>
          <div className="pf-overture__right">
            <p className="pf-lede">A curated overview of my work and creative direction across brands, experiences, animation and immersive environments.</p>
            <p className="pf-scroll"><i aria-hidden="true"></i>Scroll</p>
          </div>
        </div>
      </div>
    </section>

    
    <section className="pf-sec pf-film" id="film" data-pf-chapter={true} aria-labelledby="film-title">
      <div className="pf-wrap">
        <div className="pf-film__frame" data-pf-open={true}>
          <div className="pf-film__bar">
            <p className="pf-eyebrow">The film</p>
            <p className="pf-film__stamp">Portfolio reel</p>
          </div>

          <div className="pf-film__stage">
            <div className="pf-film__media">
              <div className="pf-player" data-pf-player={true} data-yt="R1O0VanJfTo" data-yt-title="Creative Director Portfolio — Abhijeet Varghese">
                <button className="pf-player__poster" type="button" data-cursor="Play" aria-label="Play the portfolio film: Creative Director Portfolio">
                  <img src="/assets/media/reel-poster-1280.webp" fetchpriority="high" srcSet="/assets/media/reel-poster-768.webp 768w, /assets/media/reel-poster-1280.webp 1280w" sizes="(max-width: 900px) 92vw, 88vw" width="1280" height="720" decoding="async" alt="Portfolio film — Creative Director Portfolio, a showreel of design, animation and immersive experience work by Abhijeet Varghese" />
                  <span className="pf-player__scrim" aria-hidden="true"></span>
                  <span className="pf-player__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z" /></svg>
                    <b>Play reel</b>
                  </span>
                </button>
              </div>
            </div>
            <span className="pf-film__panel pf-film__panel--t" aria-hidden="true"></span>
            <span className="pf-film__panel pf-film__panel--b" aria-hidden="true"></span>
            <span className="pf-film__edge" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </div>

          <div className="pf-film__caption">
            <div>
              <h2 id="film-title">Creative Director Portfolio</h2>
              <p>Design, animation and immersive experiences — cut as one continuous piece.</p>
            </div>
            <a className="pf-film__yt" href="https://youtu.be/R1O0VanJfTo" target="_blank" rel="noopener">
              <u>Watch on YouTube</u>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11 11 5M6 4h5v5" stroke="currentColor" strokeWidth="1.5" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    
    <section className="pf-sec pf-context" id="context" data-pf-chapter={true} aria-labelledby="context-title">
      <div className="pf-wrap pf-context__grid">
        <div className="pf-context__copy">
          <p className="pf-eyebrow" data-reveal={true}>The context</p>
          <h2 id="context-title" data-pf-open={true}>
            <span className="pf-line"><i>Different mediums.</i></span>
            <span className="pf-line" style={{"--d": ".1s"}}><i><em>One standard of clarity.</em></i></span>
          </h2>
          <p className="pf-lede" data-reveal={true}>The reel gathers selected work across enterprise technology, industrial environments, immersive communication and brand experience — the mediums where complexity has to become legible before it can become convincing.</p>
          <p className="pf-lede" data-reveal={true}>Abhijeet Varghese is a creative director and experience designer working across brand, motion, spatial and immersive work — shaping complex ideas into experiences people can read at a glance.</p>
        </div>

        <dl className="pf-credits" data-reveal={true}>
          <div><dt>Role</dt><dd>Creative Director</dd></div>
          <div><dt>Disciplines</dt><dd className="pf-credits__list">Brand Experience · Motion · 3D · Immersive · Digital</dd></div>
          <div><dt>Location</dt><dd>India</dd></div>
        </dl>
      </div>
    </section>

    
    <section className="portfolio-practice t-dark" id="practice" data-pf-chapter={true} aria-label="Practice areas">
      <div className="container portfolio-practice__inner">
        <header><p data-reveal={true}>Practice spectrum</p><h2 data-reveal={true}>The medium changes. The work is always about clarity.</h2></header>
        <ol><li data-reveal={true} style={{"--d": "0s"}}><span>01</span><h3>Creative Strategy</h3><p>Direction before decoration. I turn ambiguity into a shared point of view — the idea everything else hangs on — so teams stop debating taste and start building against intent.</p></li>
<li data-reveal={true} style={{"--d": "0.06s"}}><span>02</span><h3>Brand Systems</h3><p>Systems, not style guides. Identities engineered to survive real organizations — coherent across products, print, motion and environments, and simple enough for everyone else to use without me.</p></li>
<li data-reveal={true} style={{"--d": "0.12s"}}><span>03</span><h3>Digital Products</h3><p>Interfaces that respect the person using them. From enterprise dashboards to consumer apps, I design products where the complexity lives in the system — never on the screen.</p></li>
<li data-reveal={true} style={{"--d": "0.18s"}}><span>04</span><h3>Experience Centres</h3><p>Physical spaces where organizations explain themselves. I architect centres that turn strategy into something visitors can walk through, touch — and finally understand.</p></li>
<li data-reveal={true} style={{"--d": "0.24s"}}><span>05</span><h3>Creative Leadership</h3><p>Teams make the work; leaders make the conditions. Mentoring, standards, reviews and rituals that raise the ceiling of what a creative team believes it can ship.</p></li>
<li data-reveal={true} style={{"--d": "0.3s"}}><span>06</span><h3>AI-Enabled Creative Production</h3><p>Machines for momentum, humans for judgment. I design workflows where AI compresses weeks of exploration into days — while taste, ethics and craft remain unmistakably human.</p></li></ol>
      </div>
    </section>

    
    <div className="pf-fade pf-fade--to-light" aria-hidden="true"></div>

    
    <section className="chapter clients t-light" id="clients" data-pf-chapter={true} aria-label="Selected organisations">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">Selected organisations</span></div>
            <h2 className="chapter__title" data-reveal={true}>Trusted when the work<br /><em>had to be understood.</em></h2>
          </div>
        </header>
        <ul className="logo-wall" data-reveal-group={true} aria-label="Selected organisations">
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/amazon.webp" alt="Amazon" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/orange-business.webp" alt="Orange Business" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/indian-army.webp" alt="Indian Army" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/tata-advanced-systems.webp" alt="TATA Advanced Systems" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/indian-oil.webp" alt="Indian Oil" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/bpcl.webp" alt="Bharat Petroleum Corporation Limited" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/samsung-sds.webp" alt="Samsung SDS" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/sony-bbc-earth.webp" alt="Sony BBC Earth" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/nickelodeon.webp" alt="Nickelodeon" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/rockwell-automation.webp" alt="Rockwell Automation" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/govt-of-rajasthan.webp" alt="Govt. of Rajasthan" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/metabloqs.webp" alt="Metabloqs" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/papa-johns.webp" alt="Papa John&#039;s" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/dunkin.webp" alt="Dunkin&#039; Donuts" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/jk-lakshmi-cement.webp" alt="JK Lakshmi Cement" width="160" height="48" loading="lazy" decoding="async" /></li>
          <li className="logo-tile" data-reveal={true}><img src="/assets/logos/regional-express.webp" alt="Regional Express" width="160" height="48" loading="lazy" decoding="async" /></li>
        </ul>
      </div>
    </section>

    
    <div className="pf-fade pf-fade--to-dark" aria-hidden="true"></div>

    
    <section className="pf-seam" data-pf-chapter={true} aria-hidden="true">
      <div className="pf-seam__inner">
        <span className="pf-seam__word">more</span>
        <span className="pf-seam__line"></span>
        <span className="pf-seam__label">Beyond the reel</span>
      </div>
    </section>

    


    
    <section className="pf-sec pf-soon" id="more-work" data-pf-chapter={true} aria-label="More work — coming soon">
      <div className="pf-wrap">
        <div className="pf-soon__panel" data-pf-soon-empty={true} data-pf-live={true}>
          <span className="pf-soon__frag pf-soon__frag--1" aria-hidden="true"></span>
          <span className="pf-soon__frag pf-soon__frag--2" aria-hidden="true"></span>
          <span className="pf-soon__frag pf-soon__frag--3" aria-hidden="true"></span>
          <span className="pf-soon__frag pf-soon__frag--4" aria-hidden="true"></span>
          <span className="pf-soon__frag pf-soon__frag--5" aria-hidden="true"></span>
          <span className="pf-soon__sweep" aria-hidden="true"></span>
          <span className="pf-soon__noise" aria-hidden="true"></span>

          <div className="pf-soon__body">
            <p className="pf-soon__status"><span className="pf-soon__dot" aria-hidden="true"></span>Beyond the reel · In curation</p>
            <h2 className="pf-soon__title" data-pf-open={true}>
              <span className="pf-line"><i>Coming</i></span>
              <span className="pf-line" style={{"--d": ".09s"}}><i><em>Soon</em></i></span>
            </h2>
            <p className="pf-lede pf-soon__lede">Additional films, projects and experiences are currently being curated.</p>
            <ul className="pf-soon__kinds">
              <li>Brand films</li>
              <li>Motion design</li>
              <li>3D</li>
              <li>Interactive installations</li>
              <li>Immersive environments</li>
              <li>Experimental</li>
            </ul>
            <a className="pf-soon__cta" href="/contact/">
              Ask for a private preview
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section className="pf-sec pf-sec--deep pf-proofwrap" id="case-studies" data-pf-chapter={true} aria-label="Selected proof">
      <div className="pf-wrap">
        <p className="pf-eyebrow" data-reveal={true}>Selected proof <span>Evidence · 03 projects</span></p>
        <div className="r-proof__head" data-reveal={true}>
          <h2 className="r-h2">Three projects that show <em>how I work.</em></h2>
          <div className="r-proof__meta">
            <p className="r-proof__count"><span id="pfProofCur" aria-live="polite">01</span> / 03</p>
            <div className="r-proof__nav">
              <button className="r-nav" id="pfProofPrev" type="button" aria-label="Previous project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 3 8l4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <button className="r-nav" id="pfProofNext" type="button" aria-label="Next project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            </div>
          </div>
        </div>
        <div className="r-proof__rail" id="pfProofRail" tabIndex="0" role="region" aria-label="Selected projects — scroll horizontally">
          <article className="r-proof__panel" id="pp-0" aria-label="Orange Experience Center">
            <p className="r-proof__ghost" aria-hidden="true">01</p>
            <figure className="r-proof__media">
              <picture><source type="image/avif" srcSet="/assets/case-orange-experience-in-action-800.avif 800w, /assets/case-orange-experience-in-action-1280.avif 1280w, /assets/case-orange-experience-in-action.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" /><img src="/assets/case-orange-experience-in-action.webp" srcSet="/assets/case-orange-experience-in-action-800.webp 800w, /assets/case-orange-experience-in-action-1280.webp 1280w, /assets/case-orange-experience-in-action.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Orange Experience Center — immersive brand experience environment" width="1672" height="941" loading="lazy" decoding="async" /></picture>
              <span className="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div className="r-proof__body">
              <p className="r-proof__sector">Enterprise Technology</p>
              <h3 className="r-proof__name">Orange <em>Experience Center</em></h3>
              <p className="r-proof__role">Experience Strategy &amp; Creative Technology Lead</p>
              <p className="r-proof__desc">Physical space, storytelling, interactive technology, visual communication and immersive experiences — brought together and made to work as one experience.</p>
              <ul className="r-proof__tags"><li>Experience Strategy</li><li>Creative Direction</li><li>UI / UX</li><li>Content</li><li>VR</li><li>Interactive Experience</li><li>Spatial Experience</li><li>Stakeholder &amp; Team Coordination</li></ul>
              <a className="r-arrow" href="/case-studies/orange-business/">View case study →</a>
            </div>
          </article>
          <article className="r-proof__panel" id="pp-1" aria-label="Indian Army Immersive Training">
            <p className="r-proof__ghost" aria-hidden="true">02</p>
            <figure className="r-proof__media">
              <picture><source type="image/avif" srcSet="/assets/case-army-800.avif 800w, /assets/case-army-1280.avif 1280w, /assets/case-army.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" /><img src="/assets/case-army.webp" srcSet="/assets/case-army-800.webp 800w, /assets/case-army-1280.webp 1280w, /assets/case-army.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Indian Army immersive training — VR training and qualification environment" width="1672" height="941" loading="lazy" decoding="async" /></picture>
              <span className="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div className="r-proof__body">
              <p className="r-proof__sector">Defence &amp; Training</p>
              <h3 className="r-proof__name">Indian Army <em>Immersive Training</em></h3>
              <p className="r-proof__role">Immersive Training · XR · Qualification · System Design</p>
              <p className="r-proof__desc">A dedicated training room with 15 high-end computers and live trainer monitoring — immersive training with qualification and testing built in. VR stops being a visual simulation and becomes part of a larger training, observation, assessment, qualification and progression system.</p>
              <ul className="r-proof__tags"><li>Immersive Training</li><li>VR</li><li>Qualification</li><li>Testing</li><li>Trainer Monitoring</li><li>System Thinking</li></ul>
              <a className="r-arrow" href="/case-studies/indian-army/">View case study →</a>
            </div>
          </article>
          <article className="r-proof__panel" id="pp-2" aria-label="Bharat Petroleum Corporation Limited">
            <p className="r-proof__ghost" aria-hidden="true">03</p>
            <figure className="r-proof__media">
              <picture><source type="image/avif" srcSet="/assets/case-bpcl-800.avif 800w, /assets/case-bpcl-1280.avif 1280w, /assets/case-bpcl.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" /><img src="/assets/case-bpcl.webp" srcSet="/assets/case-bpcl-800.webp 800w, /assets/case-bpcl-1280.webp 1280w, /assets/case-bpcl.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Bharat Petroleum Corporation Limited — immersive experience visualisation" width="1672" height="941" loading="lazy" decoding="async" /></picture>
              <span className="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div className="r-proof__body">
              <p className="r-proof__sector">Energy</p>
              <h3 className="r-proof__name">Bharat Petroleum <em>Corporation Limited</em></h3>
              <p className="r-proof__role">Brand Experience · Visualization · Creative Direction · Production</p>
              <p className="r-proof__desc">Visualisation and experience design used to communicate complex enterprise environments — a carefully structured visual language, from the miniature environment to the 3D walkthrough. The real work was making a complex environment understandable.</p>
              <ul className="r-proof__tags"><li>Brand Experience</li><li>Visualization</li><li>Creative Direction</li><li>Production</li><li>Stakeholder Coordination</li></ul>
              <a className="r-arrow" href="/case-studies/bharat-petroleum-corporation-limited/">View case study →</a>
            </div>
          </article>
        </div>
        <div className="r-proof__progress" aria-hidden="true"><i id="pfProofProgress"></i></div>
      </div>
    </section>

  </main>
  
  
  


  <div className="pf-grain" aria-hidden="true"></div>
  <div className="pf-cursor" aria-hidden="true"><span></span></div>
    </>
  );
}
