export default function Recruiter() {
  return (
    <>
<div className="progress" id="progress" aria-hidden="true"></div>

  <div className="r-stage" id="rStage" aria-hidden="true">
    <div className="r-stage__base"></div>
    <div className="r-stage__light" id="rStageLight"></div>
  </div>

  <main id="main">

    
    <section className="r-hero" id="intro" aria-label="Introduction">
      <div className="r-wrap">
        <div className="r-hero__grid">
          <div className="r-hero__main">
            <p className="r-eyebrow" data-hero-reveal={true} style={{"--d": "0s"}}>
              <span className="r-eyebrow__num">01</span>
              <span className="r-eyebrow__label">Recruitment</span>
              <i className="r-eyebrow__rule" aria-hidden="true"></i>
              <span className="r-eyebrow__meta">Executive profile · 2026</span>
            </p>
            <h1 className="r-hero__name" data-hero-reveal={true} style={{"--d": ".08s"}}>Abhijeet Varghese</h1>
            <p className="r-hero__role" data-hero-reveal={true} style={{"--d": ".16s"}}><em>Creative</em> Head</p>
            <ul className="r-hero__disc" data-hero-reveal={true} style={{"--d": ".24s"}} aria-label="Specialisation">
              <li>Experience Design</li>
              <li>Enterprise Innovation</li>
              <li>AI-Enabled Creative Production</li>
            </ul>
            <p className="r-hero__lead" data-hero-reveal={true} style={{"--d": ".32s"}}>I build experiences, creative systems and visual solutions at the intersection of <em>creativity, technology and human understanding</em>.</p>
            <p className="r-hero__sub" data-hero-reveal={true} style={{"--d": ".4s"}}>I don't just design the output — I work on the thinking, the experience, the people and the system required to make the output work.</p>
            <div className="r-hero__cta" data-hero-reveal={true} style={{"--d": ".48s"}}>
              <a className="r-cta r-cta--solid" href="#contact">Start a conversation <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></a>
              <a className="r-cta--line" href="/case-studies/">View case studies</a>
            </div>
            <div className="r-hero__cue" data-hero-reveal={true} style={{"--d": ".58s"}} aria-hidden="true">
              <span>Scroll</span>
              <i></i>
            </div>
          </div>
          <div className="r-hero__viz" id="rHeroViz" data-hero-reveal={true} style={{"--d": ".3s"}} aria-hidden="true">
            <svg className="r-system" id="rSystem" viewBox="0 0 540 470" fill="none">
              <defs>
                <radialGradient id="rCoreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6EA8FF" stopOpacity="0.16" />
                  <stop offset="55%" stopColor="#6EA8FF" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#6EA8FF" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle className="r-system__glow" cx="270" cy="235" r="150" fill="url(#rCoreGlow)" />
              <circle className="r-system__ring" cx="270" cy="235" r="150" />
              <g className="r-system__spokes" stroke="rgba(148,170,230,.16)">
                <line className="r-spoke" data-idx="0" x1="270" y1="235" x2="270" y2="105" />
                <line className="r-spoke" data-idx="1" x1="270" y1="235" x2="398" y2="183" />
                <line className="r-spoke" data-idx="2" x1="270" y1="235" x2="418" y2="300" />
                <line className="r-spoke" data-idx="3" x1="270" y1="235" x2="348" y2="412" />
                <line className="r-spoke" data-idx="4" x1="270" y1="235" x2="192" y2="412" />
                <line className="r-spoke" data-idx="5" x1="270" y1="235" x2="122" y2="300" />
                <line className="r-spoke" data-idx="6" x1="270" y1="235" x2="142" y2="183" />
              </g>
              <g className="r-system__nodes">
                <g className="r-snode" data-idx="0" data-x="270" data-y="105"><circle className="r-snode__halo" cx="270" cy="105" r="10" /><circle className="r-snode__dot" cx="270" cy="105" r="3.5" /><text x="270" y="84" textAnchor="middle">Creative</text></g>
                <g className="r-snode" data-idx="1" data-x="398" data-y="183"><circle className="r-snode__halo" cx="398" cy="183" r="10" /><circle className="r-snode__dot" cx="398" cy="183" r="3.5" /><text x="412" y="178" textAnchor="start">Strategy</text></g>
                <g className="r-snode" data-idx="2" data-x="418" data-y="300"><circle className="r-snode__halo" cx="418" cy="300" r="10" /><circle className="r-snode__dot" cx="418" cy="300" r="3.5" /><text x="432" y="305" textAnchor="start">Experience</text></g>
                <g className="r-snode" data-idx="3" data-x="348" data-y="412"><circle className="r-snode__halo" cx="348" cy="412" r="10" /><circle className="r-snode__dot" cx="348" cy="412" r="3.5" /><text x="348" y="436" textAnchor="middle">Technology</text></g>
                <g className="r-snode" data-idx="4" data-x="192" data-y="412"><circle className="r-snode__halo" cx="192" cy="412" r="10" /><circle className="r-snode__dot" cx="192" cy="412" r="3.5" /><text x="192" y="436" textAnchor="middle">Story</text></g>
                <g className="r-snode" data-idx="5" data-x="122" data-y="300"><circle className="r-snode__halo" cx="122" cy="300" r="10" /><circle className="r-snode__dot" cx="122" cy="300" r="3.5" /><text x="108" y="305" textAnchor="end">People</text></g>
                <g className="r-snode" data-idx="6" data-x="142" data-y="183"><circle className="r-snode__halo" cx="142" cy="183" r="10" /><circle className="r-snode__dot" cx="142" cy="183" r="3.5" /><text x="128" y="178" textAnchor="end">Execution</text></g>
              </g>
              <g className="r-system__core">
                <circle className="r-system__core-halo" cx="270" cy="235" r="13" />
                <circle className="r-system__core-dot" cx="270" cy="235" r="3.5" />
              </g>
            </svg>
            <p className="r-hero__vizcap">A connected practice — seven disciplines, one system.</p>
          </div>
        </div>
      </div>
    </section>

    
    <section className="r-chap r-chap--paper" id="profile" data-num="02" aria-label="Professional profile">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">02</span>
          <span className="r-eyebrow__label">Professional profile</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">The short version</span>
        </p>
        <div className="r-profile">
          <div className="r-profile__text" data-reveal={true}>
            <h2 className="r-h2">I started with <em>making things.</em></h2>
            <p className="r-lead">Graphic identities, visual systems, motion, animation, interfaces, 3D, experiences. Over time, the questions became bigger.</p>
            <ul className="r-profile__questions">
              <li>How should a brand behave inside a physical environment?</li>
              <li>How can technology make an experience more useful rather than simply more impressive?</li>
              <li>How do you take an idea from the first conversation through design, technology, production and delivery?</li>
            </ul>
            <p className="r-lead">That is where my work sits today — connecting strategy, storytelling, design, technology and execution to turn complex ideas into experiences.</p>
            <p className="r-profile__foot">I can discuss an interface with a designer, an immersive system with a technology team, a physical installation with a fabricator and the objective with a client.</p>
          </div>
          <aside className="r-profile__snap" data-reveal={true} aria-label="Professional snapshot">
            <dl className="r-stats">
              <div><dt>12+</dt><dd>Years</dd></div>
              <div><dt>100+</dt><dd>Projects</dd></div>
              <div><dt>15+</dt><dd>Industries</dd></div>
            </dl>
            <p className="r-profile__focus">Creative Leadership · Experience Design · Immersive Technology · Enterprise Innovation · AI Creative Production</p>
          </aside>
        </div>
      </div>
    </section>

    
    <section className="r-chap" id="evolve" data-num="03" aria-label="Career evolution">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">03</span>
          <span className="r-eyebrow__label">Career evolution</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">My work has evolved</span>
        </p>
        <div className="r-sec__head" data-reveal={true}>
          <h2 className="r-h2">My work <em>has evolved.</em></h2>
          <p className="r-lead">From individual craft to connected disciplines.</p>
        </div>
        <ol className="r-evolve" id="rEvolve">
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d0">
              <span className="r-evolve__num">01</span>
              <span className="r-evolve__name">Graphic &amp; Brand Design</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d0">I began with visual communication — identity, graphic systems, compositions and brand-led communication.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d1">
              <span className="r-evolve__num">02</span>
              <span className="r-evolve__name">Animation &amp; Motion</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d1">Storytelling became temporal rather than static.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d2">
              <span className="r-evolve__num">03</span>
              <span className="r-evolve__name">UI / UX</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d2">Interfaces introduced another layer — designing not only what people see, but what they do, understand and experience.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d3">
              <span className="r-evolve__num">04</span>
              <span className="r-evolve__name">3D / VFX</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d3">3D and visual effects expanded the ability to construct environments and visualise ideas that could not easily be photographed or physically demonstrated.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d4">
              <span className="r-evolve__num">05</span>
              <span className="r-evolve__name">Immersive Technology</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d4">AR, VR and MR changed the relationship between the audience and the content — instead of watching an experience, people could enter it.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d5">
              <span className="r-evolve__num">06</span>
              <span className="r-evolve__name">Experience Design</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d5">Interactive installations, experience centres, spatial environments, immersive storytelling and technology-led brand experiences.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d6">
              <span className="r-evolve__num">07</span>
              <span className="r-evolve__name">Enterprise Innovation</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d6">Multiple stakeholders, business objectives, technical constraints, teams, vendors, timelines and production — the work became about connecting disciplines.</p>
          </li>
          <li className="r-evolve__item" data-reveal={true}>
            <button className="r-evolve__btn" type="button" aria-expanded="false" aria-controls="ev-d7">
              <span className="r-evolve__num">08</span>
              <span className="r-evolve__name">Creative Leadership</span>
              <span className="r-evolve__arrow" aria-hidden="true"></span>
            </button>
            <p className="r-evolve__desc" id="ev-d7">Today, I work across that intersection — bringing together creative thinking, experience design, technology, people and execution.</p>
          </li>
        </ol>
      </div>
    </section>

    
    <section className="r-chap r-chap--deep" id="work" data-num="04" aria-label="Selected proof">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">04</span>
          <span className="r-eyebrow__label">Selected proof</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">Evidence · 03 projects</span>
        </p>
        <div className="r-proof__head" data-reveal={true}>
          <h2 className="r-h2">Three projects that show <em>how I work.</em></h2>
          <div className="r-proof__meta">
            <p className="r-proof__count"><span id="rProofCur" aria-live="polite">01</span> / 03</p>
            <div className="r-proof__nav">
              <button className="r-nav" id="rProofPrev" type="button" aria-label="Previous project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 3 8l4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <button className="r-nav" id="rProofNext" type="button" aria-label="Next project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            </div>
          </div>
        </div>
        <div className="r-proof__rail" id="rProofRail" tabIndex="0" role="region" aria-label="Selected projects — scroll horizontally">
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
              <ul className="r-proof__tags">
                <li>Experience Strategy</li><li>Creative Direction</li><li>UI / UX</li><li>Content</li><li>VR</li><li>Interactive Experience</li><li>Spatial Experience</li><li>Stakeholder &amp; Team Coordination</li>
              </ul>
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
              <ul className="r-proof__tags">
                <li>Immersive Training</li><li>VR</li><li>Qualification</li><li>Testing</li><li>Trainer Monitoring</li><li>System Thinking</li>
              </ul>
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
              <ul className="r-proof__tags">
                <li>Brand Experience</li><li>Visualization</li><li>Creative Direction</li><li>Production</li><li>Stakeholder Coordination</li>
              </ul>
              <a className="r-arrow" href="/case-studies/bharat-petroleum-corporation-limited/">View case study →</a>
            </div>
          </article>
        </div>
        <div className="r-proof__progress" aria-hidden="true"><i id="rProofProgress"></i></div>
        <div className="r-proof__clients" data-reveal={true}>
          <p className="r-proof__clients-label">Selected engagements</p>
          <p className="r-proof__clients-list">Amazon · Orange Business · Indian Army · Tata Advanced Systems · Indian Oil · Bharat Petroleum · Samsung SDS · Sony · BBC Earth · Nickelodeon · Papa John's · Dunkin' · Rockwell Automation · JK Cement · Regional Express · Metabloqs</p>
          <p className="r-proof__clients-note">The formats changed. The underlying challenge stayed the same — understand the problem, find the opportunity, create the experience, align the people, make it real.</p>
        </div>
      </div>
    </section>

    
    <section className="r-chap r-chap--paper" id="cap" data-num="05" aria-label="Capabilities">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">05</span>
          <span className="r-eyebrow__label">Capabilities</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">What I actually do</span>
        </p>
        <div className="r-cap__grid">
          <div className="r-cap__intro" data-reveal={true}>
            <h2 className="r-h2">What I <em>actually do.</em></h2>
            <p className="r-lead">My work moves between disciplines depending on the problem.</p>
          </div>
          <ol className="r-cap__list" id="rCap">
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d0"><span className="r-cap__num">01</span><span className="r-cap__name">Experience Design</span></button>
              <div className="r-cap__detail" id="cap-d0"><p>Designing how people encounter, navigate, understand and remember an experience.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a> · <a href="/case-studies/indian-army/">Indian Army Immersive Training</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d1"><span className="r-cap__num">02</span><span className="r-cap__name">Creative Strategy</span></button>
              <div className="r-cap__detail" id="cap-d1"><p>Finding the creative and experiential opportunity inside a business or communication problem.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d2"><span className="r-cap__num">03</span><span className="r-cap__name">Creative Direction</span></button>
              <div className="r-cap__detail" id="cap-d2"><p>Setting the visual, narrative and experiential direction — and carrying that thinking through execution.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a> · <a href="/case-studies/bharat-petroleum-corporation-limited/">Bharat Petroleum Corporation Limited</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d3"><span className="r-cap__num">04</span><span className="r-cap__name">Immersive Experiences</span></button>
              <div className="r-cap__detail" id="cap-d3"><p>Using AR, VR, MR and spatial technologies where immersion genuinely improves the experience.</p><p className="r-cap__rel">Related — <a href="/case-studies/indian-army/">Indian Army Immersive Training</a> · <a href="/case-studies/orange-business/">Orange Experience Center</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d4"><span className="r-cap__num">05</span><span className="r-cap__name">Interactive Experiences</span></button>
              <div className="r-cap__detail" id="cap-d4"><p>Designing interactions between people, content, interfaces, environments and technology.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d5"><span className="r-cap__num">06</span><span className="r-cap__name">Experience Centres</span></button>
              <div className="r-cap__detail" id="cap-d5"><p>The creative, content, interaction and technology layers that turn physical spaces into meaningful brand experiences.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d6"><span className="r-cap__num">07</span><span className="r-cap__name">Brand Systems</span></button>
              <div className="r-cap__detail" id="cap-d6"><p>Extending a brand beyond identity into environments, interfaces, content and experiences.</p><p className="r-cap__rel">Related — <a href="/case-studies/bharat-petroleum-corporation-limited/">Bharat Petroleum Corporation Limited</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d7"><span className="r-cap__num">08</span><span className="r-cap__name">Enterprise Innovation</span></button>
              <div className="r-cap__detail" id="cap-d7"><p>Working with complex organisations to translate technology, products, processes and ideas into understandable experiences.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a> · <a href="/case-studies/bharat-petroleum-corporation-limited/">Bharat Petroleum Corporation Limited</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d8"><span className="r-cap__num">09</span><span className="r-cap__name">Storytelling</span></button>
              <div className="r-cap__detail" id="cap-d8"><p>Building narratives that give information structure, emotion and meaning.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a></p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d9"><span className="r-cap__num">10</span><span className="r-cap__name">AI-Enabled Creative Production</span></button>
              <div className="r-cap__detail" id="cap-d9"><p>Using AI across concept, image, video, sound, story, motion, experience, XR, prototyping and production — where it creates a genuine advantage.</p><p className="r-cap__rel">Related — Current practice</p></div>
            </li>
            <li className="r-cap__item" data-reveal={true}>
              <button className="r-cap__btn" type="button" aria-expanded="false" aria-controls="cap-d10"><span className="r-cap__num">11</span><span className="r-cap__name">Leadership &amp; Delivery</span></button>
              <div className="r-cap__detail" id="cap-d10"><p>Bringing creative teams, technology teams, clients, stakeholders, vendors and production partners together around one direction.</p><p className="r-cap__rel">Related — <a href="/case-studies/orange-business/">Orange Experience Center</a> · <a href="/case-studies/indian-army/">Indian Army Immersive Training</a> · <a href="/case-studies/bharat-petroleum-corporation-limited/">Bharat Petroleum Corporation Limited</a></p></div>
            </li>
          </ol>
        </div>
        <div className="r-levels" data-reveal={true}>
          <p className="r-levels__lead">I can operate at different levels of the same problem.</p>
          <div className="r-levels__grid">
            <div className="r-levels__col"><strong>Think</strong><p>Creative strategy · Experience strategy · Concept development · Narrative development · Innovation thinking</p></div>
            <div className="r-levels__col"><strong>Design</strong><p>Experience design · UI / UX · Brand systems · Spatial experiences · Interactive experiences · Visual communication · Motion and animation · 3D / VFX</p></div>
            <div className="r-levels__col"><strong>Technology</strong><p>AR · VR · MR · Spatial computing · Interactive technology · Immersive training · AI-enabled creative production</p></div>
            <div className="r-levels__col"><strong>Lead</strong><p>Creative direction · Multidisciplinary teams · Client coordination · Stakeholder management · Vendor coordination · Production coordination · Quality control · Delivery</p></div>
          </div>
          <p className="r-levels__close">I am comfortable in the middle — where disciplines, people and decisions meet.</p>
        </div>
      </div>
    </section>

    
    <section className="r-chap" id="method" data-num="06" aria-label="How I work">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">06</span>
          <span className="r-eyebrow__label">How I work</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">Seven stages · One intent</span>
        </p>
        <div className="r-sec__head" data-reveal={true}>
          <h2 className="r-h2">How <em>I work.</em></h2>
          <p className="r-lead">Seven stages. One intent — an idea only matters when it survives execution.</p>
        </div>
        <div className="r-method" id="rMethod">
          <div className="r-method__spine" aria-hidden="true"><i id="rMethodFill"></i></div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d0">
              <span className="r-method__num">01</span>
              <span className="r-method__name">Understand</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d0">I start by understanding the actual problem. The brief is rarely the entire problem — I look at the audience, business objective, environment, constraints, stakeholders, technology and desired outcome.</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d1">
              <span className="r-method__num">02</span>
              <span className="r-method__name">Find the opportunity</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d1">What can be made better, clearer, more useful or more memorable. This is where strategy and creativity meet.</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d2">
              <span className="r-method__num">03</span>
              <span className="r-method__name">Build the idea</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d2">I develop the narrative, visual language and experience logic before becoming attached to a particular medium — not "should this be a video?", but "what does this experience need to achieve?"</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d3">
              <span className="r-method__num">04</span>
              <span className="r-method__name">Design the experience</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d3">The output may become a brand system, interface, physical environment, animation, interactive installation, VR experience or visualisation. The medium follows the requirement.</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d4">
              <span className="r-method__num">05</span>
              <span className="r-method__name">Bring technology in</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d4">I use technology when it earns its place. AR, VR, MR, spatial computing, interactive systems and AI become valuable when they improve understanding, participation, simulation, communication, training or experience.</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d5">
              <span className="r-method__num">06</span>
              <span className="r-method__name">Align people</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d5">Clients, stakeholders, creative teams, technology teams, vendors, fabricators and production partners — a major part of my role is making sure everyone is solving the same problem.</p>
          </div>
          <div className="r-method__item" data-reveal={true}>
            <button className="r-method__btn" type="button" aria-expanded="false" aria-controls="m-d6">
              <span className="r-method__num">07</span>
              <span className="r-method__name">Stay with the work</span>
              <span className="r-method__mark" aria-hidden="true"></span>
            </button>
            <p className="r-method__desc" id="m-d6">The job isn't finished when the concept is approved. Direction, feedback, coordination, production, quality and delivery are part of the work. An idea only matters when it survives execution.</p>
          </div>
        </div>
      </div>
    </section>

    
    <section className="r-chap r-chap--paper" id="now" data-num="07" aria-label="Current direction">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">07</span>
          <span className="r-eyebrow__label">Current direction</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">AI-enabled creative production</span>
        </p>
        <div className="r-sec__head" data-reveal={true}>
          <h2 className="r-h2">AI is now part of <em>my creative practice.</em></h2>
          <p className="r-lead">My current practice is expanding into AI-enabled creative production — from early concept exploration through visual development and production. AI is not the centre of my identity: it is another capability inside a broader practice built around experience design, creative direction, storytelling and innovation.</p>
        </div>
        <ul className="r-ai" data-reveal={true} aria-label="AI across the creative process">
          <li>Concept</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Image</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Video</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Sound</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Story</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Motion</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Experience</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>XR</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Prototype</li><li className="r-ai__sep" aria-hidden="true"></li>
          <li>Production</li>
        </ul>
        <p className="r-now__question" data-reveal={true}>The question remains the same — what can technology make possible that was harder, slower or less effective before?</p>

        <div className="r-now__cols" data-reveal={true}>
          <div className="r-now__eco">
            <h3 className="r-h3">Professional ecosystem</h3>
            <p><strong>Professional Member — AVGC-XR Rajasthan.</strong> This connects my practice to the wider world of Animation, Visual Effects, Games, Comics and Extended Reality, while my broader work continues across enterprise experience design, innovation, immersive technology and creative production.</p>
          </div>
          <div className="r-now__fit">
            <h3 className="r-h3">Where I fit</h3>
            <ul className="r-spectrum">
              <li>Creative Leadership</li>
              <li>Experience Design</li>
              <li>Creative Technology</li>
              <li>Immersive / XR</li>
              <li>Innovation</li>
              <li>Brand Experience</li>
              <li>AI Creative Production</li>
            </ul>
            <p className="r-now__titles">Titles I'm most often considered for: Creative Director · Creative Executive · Experience Design Leader · Creative Systems Leader · Immersive Technology Strategist · Brand Systems Consultant · Creative Technologist · Experience Strategy Lead.</p>
            <p className="r-now__close"><em>The title is secondary. The problem is what matters.</em></p>
          </div>
        </div>

        <div className="r-seek" data-reveal={true}>
          <h3 className="r-h3">What I am looking for</h3>
          <p className="r-seek__lead">Ambitious problems where creativity has to work alongside technology, business objectives and real human behaviour.</p>
          <ul className="r-seek__list">
            <li>Designing an enterprise experience</li>
            <li>Building an experience centre</li>
            <li>Developing an immersive training system</li>
            <li>Creating a new brand experience</li>
            <li>Turning complex information into something people can understand</li>
            <li>Using spatial or immersive technology to change how people interact with information</li>
            <li>Building a creative system around AI</li>
            <li>Leading a multidisciplinary creative and technology team</li>
          </ul>
          <p className="r-seek__close">What interests me is the opportunity to take something complex and make it clearer, more useful, more engaging and more human.</p>
        </div>
      </div>
    </section>

    
    <section className="r-contact" id="contact" data-num="08" aria-label="Contact">
      <div className="r-wrap">
        <p className="r-eyebrow" data-reveal={true}>
          <span className="r-eyebrow__num">08</span>
          <span className="r-eyebrow__label">Contact</span>
          <i className="r-eyebrow__rule" aria-hidden="true"></i>
          <span className="r-eyebrow__meta">Start a conversation</span>
        </p>
        <h2 className="r-contact__title" data-reveal={true}>Let's talk about what you're <em>building.</em></h2>
        <p className="r-contact__line" data-reveal={true}>If the challenge sits between experience, creativity, technology, storytelling and innovation, let's start a conversation.</p>
        <div className="r-contact__cta" data-reveal={true}>
          <a className="r-cta r-cta--solid" href="/contact/">Start a conversation <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></a>
          <a className="r-cta--line" href="/case-studies/">View case studies</a>
        </div>
        <div className="r-contact__info" data-reveal={true}>
          <p className="r-contact__mail"><a href="mailto:hi@abhijeetvarghese.com">hi@abhijeetvarghese.com</a> <span aria-hidden="true">·</span> <a href="tel:+919694080706">+91-96940 80706</a></p>
          <div className="r-contact__links">
            <a href="https://www.linkedin.com/in/abhijeetvarghese/" target="_blank" rel="noopener">LinkedIn ↗</a>
            <a href="/assets/Abhijeet-Varghese-Resume.pdf" download={true}>Download résumé</a>
            <a href="/experience/">Career history →</a>
          </div>
        </div>
      </div>
    </section>
  </main>
    </>
  );
}
