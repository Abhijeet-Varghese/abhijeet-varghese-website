import type { CSSProperties, ReactNode } from 'react';

type DelayedStyle = CSSProperties & { '--d'?: string };

function delayed(delay: string): DelayedStyle {
  return { '--d': delay };
}

function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 3v11M4.5 10 9 14.5 13.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

interface EvolutionCardProps {
  act: string;
  world: string;
  name: string;
  category?: string;
  image?: { src: string; alt: string };
  note: string;
  title: ReactNode;
  description?: string;
  statement?: string;
  system?: string[];
  duo?: boolean;
  interlude?: boolean;
}

function EvolutionCard({
  act,
  world,
  name,
  category,
  image,
  note,
  title,
  description,
  statement,
  system,
  duo,
  interlude = false,
}: EvolutionCardProps) {
  return (
    <article className={`about-evo3d__card${interlude ? ' about-evo3d__card--interlude' : ' about-act'}`} data-act={act} data-world={world}>
      {image ? <img className="about-evo3d__image" src={image.src} alt={image.alt} width="1312" height="816" loading="lazy" decoding="async" /> : null}
      {!interlude ? <div className="about-evo3d__overlay" aria-hidden="true" /> : null}
      <div className="about-evo3d__gradient" aria-hidden="true" />
      <div className="about-evo3d__edge" aria-hidden="true" />
      <div className="about-evo3d__shadow" aria-hidden="true" />
      <div className="about-evo3d__hinge" aria-hidden="true" />
      <div className="about-evo3d__meta" aria-hidden="true"><span className="about-evo3d__meta-line" /><span>{name}</span></div>
      {category ? <div className="about-evo3d__category">{category}</div> : null}
      <div className="about-evo3d__content">
        <p className="about-evo3d__note">{note}</p>
        <h3 className={`about-evo3d__title${interlude ? ' about-evo3d__title--serif' : ''}`}>{title}</h3>
        {description ? <p className="about-evo3d__desc">{description}</p> : null}
        {statement ? <p className="about-evo3d__stmt">{statement}</p> : null}
        {system ? <ol className="about-evo3d__system">{system.map((item) => <li key={item}>{item}</li>)}</ol> : null}
        {duo ? <p className="about-evo3d__duo"><span>Does it look good?</span><strong>Does it <em>work?</em></strong></p> : null}
        {interlude ? <p className="about-evo3d__mark" aria-hidden="true">✦ ✦ ✦</p> : null}
      </div>
    </article>
  );
}

export default function StoryContent() {
  const reelFrames = [
    'about-motion.webp',
    'about-experience.webp',
    'about-environment.webp',
    'about-people.webp',
    'about-leadership.webp',
    'about-credits.webp',
  ];

  return (
    <>
      <div className="about-atmo" id="aboutAtmo" aria-hidden="true" />
      <div className="about-reel" aria-hidden="true">
        <div className="about-reel__track" id="aboutReelTrack">
          {[...reelFrames, ...reelFrames].map((frame, index) => (
            <span className="about-reel__frame" style={{ backgroundImage: `url('/assets/about/${frame}')` }} key={`${frame}-${index}`} />
          ))}
        </div>
      </div>
      <div className="about-grain" aria-hidden="true" />

      <section className="about-prologue t-dark" id="prologue" aria-label="About — opening frame">
        <div className="about-prologue__blueprint" aria-hidden="true"><i /><i /><i /></div>
        <div className="container about-prologue__inner">
          <div className="about-prologue__meta" data-reveal="">
            <span>About / The first frame</span>
            <span>2014 — Now</span>
          </div>
          <div className="about-prologue__composition">
            <div className="about-prologue__frame" aria-hidden="true"><i /><i /><i /><i /></div>
            <h1 className="about-prologue__title">
              <span className="about-prologue__line about-prologue__word"><span className="about-prologue__word-in">I DIDN&apos;T</span></span>
              <span className="about-prologue__line about-prologue__line--shift about-prologue__word"><span className="about-prologue__word-in">START OUT</span></span>
              <span className="about-prologue__line about-prologue__line--outline about-prologue__word"><span className="about-prologue__word-in"><em>DESIGNING EXPERIENCES.</em></span></span>
            </h1>
            <p className="about-prologue__lede" data-reveal="" style={delayed('.42s')}>VFX and animation were my entry point. Eventually, I started thinking about the whole experience.</p>
          </div>
          <div className="about-prologue__footer">
            <p className="about-prologue__roles" data-reveal="" style={delayed('.5s')}>
              <span className="about-prologue__role-chip">Creative Direction</span>
              <span className="about-prologue__role-chip">Experience Design</span>
              <span className="about-prologue__role-chip">Immersive Technology</span>
              <span className="about-prologue__role-chip">Visual Storytelling</span>
            </p>
            <p className="about-prologue__skip" data-reveal="" style={delayed('.65s')}><a href="#act-01"><span>Enter the story</span><ArrowDownIcon /></a></p>
          </div>
        </div>
        <div className="about-prologue__mq" aria-hidden="true">
          <div className="about-prologue__mq-track">
            <span>Creative Direction</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Experience Design</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Immersive Technology</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Visual Storytelling</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Creative Direction</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Experience Design</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Immersive Technology</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
            <span>Visual Storytelling</span><span className="about-prologue__mq-dot" aria-hidden="true">✦</span>
          </div>
        </div>
      </section>

      <section className="about-frame t-light" id="act-01" data-act="01" aria-label="About — identity">
        <div className="container">
          <div className="about-frame__spread">
            <div className="about-frame__manifesto">
              <h2 className="about-frame__statement" data-reveal="">I design experiences<br /><em>by thinking beyond the frame.</em></h2>
              <div className="about-frame__bio" data-reveal-group="" data-dbase=".12">
                <div className="about-frame__beat" data-reveal=""><span className="about-frame__beat-num" aria-hidden="true">01</span><p>I started in VFX and animation, learning to think through frames, movement, composition and visual storytelling.</p></div>
                <div className="about-frame__beat" data-reveal="" style={delayed('.1s')}><span className="about-frame__beat-num" aria-hidden="true">02</span><p>Over time, the frame became interaction, interaction became environment, and environment became the whole experience.</p></div>
                <div className="about-frame__beat" data-reveal="" style={delayed('.2s')}><span className="about-frame__beat-num" aria-hidden="true">03</span><p>Today, I work across creative direction, experience design, immersive technology, visual storytelling and execution — turning complex ideas into experiences people can understand, feel and remember.</p></div>
              </div>
              <p className="about-frame__question" data-reveal="">How should this be <em>experienced?</em></p>
            </div>
            <figure className="about-frame__portrait" data-reveal="portrait">
              <span className="about-frame__portrait-frame" aria-hidden="true" />
              <img src="/assets/hero-portrait.webp" alt="Editorial portrait of Abhijeet Varghese" width="1024" height="1024" loading="lazy" decoding="async" />
            </figure>
          </div>

          <div className="about-frame__nums" aria-label="By the numbers">
            <div className="about-frame__num" data-reveal=""><strong data-count="12" data-suffix="+"><span className="about-frame__num-val">12</span><span>+</span></strong><span>Years of practice</span></div>
            <div className="about-frame__num" data-reveal="" style={delayed('.1s')}><strong data-count="65" data-suffix="+"><span className="about-frame__num-val">65</span><span>+</span></strong><span>Clients served</span></div>
            <div className="about-frame__num" data-reveal="" style={delayed('.2s')}><strong data-count="100" data-suffix="+"><span className="about-frame__num-val">100</span><span>+</span></strong><span>Projects delivered</span></div>
          </div>

          <div className="about-frame__facts">
            <div className="about-frame__fact" data-reveal=""><p className="about-frame__fact-label">Education</p><p className="about-frame__fact-line">BA — VFX &amp; Animation</p></div>
            <div className="about-frame__fact" data-reveal="" style={delayed('.08s')}><p className="about-frame__fact-label">Continuously learning</p><ul className="about-frame__list"><li>What Is the Metaverse — Meta</li><li>Digital Business Strategy — University of Virginia</li><li>Digital Transformation — Specialization</li></ul></div>
            <div className="about-frame__fact" data-reveal="" style={delayed('.16s')}><p className="about-frame__fact-label">Works across</p><ul className="about-frame__list about-frame__list--cols"><li>Creative Direction</li><li>Experience Design</li><li>Immersive Experiences</li><li>Visual Storytelling</li><li>Motion</li><li>Spatial / Environmental Experiences</li><li>Brand Experiences</li><li>Creative Leadership</li><li>Production &amp; Execution</li></ul></div>
          </div>

          <div className="about-frame__credo">
            <h3 className="about-frame__credo-title" data-reveal="">I&apos;m a creative person first.</h3>
            <p className="about-frame__credo-lines" data-reveal="">Technology is part of my vocabulary.<br />Design is part of my foundation.<br />Animation is part of how I think.<br /><em>Experience is where they come together.</em></p>
          </div>

          <div className="about-zoomstage" id="aboutZoomStage" aria-hidden="true">
            <p className="about-zoomstage__eyebrow" data-reveal=""><span className="chapter__rule" /><span className="chapter__tag">The zoom-out</span></p>
            <div className="about-zoomstage__viewport">
              <div className="about-zoomstage__ghost" id="aboutZoomGhost1" aria-hidden="true"><img src="/assets/about/about-environment.webp" alt="Daylight falling through a multi-level concrete atrium" width="1312" height="816" loading="lazy" decoding="async" /></div>
              <div className="about-zoomstage__ghost" id="aboutZoomGhost2" aria-hidden="true"><img src="/assets/about/about-environment.webp" alt="" width="1312" height="816" loading="lazy" decoding="async" /></div>
              <div className="about-zoomstage__frame" id="aboutZoomFrame"><img src="/assets/about/about-environment.webp" alt="" width="1312" height="816" loading="lazy" decoding="async" /></div>
            </div>
            <ol className="about-zoomstage__labels" id="aboutZoomLabels">
              <li data-zoom="1"><span>01</span>Frame</li>
              <li data-zoom="2"><span>02</span>Interaction</li>
              <li data-zoom="3"><span>03</span>Environment</li>
              <li data-zoom="4"><span>04</span>Experience</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="about-acts about-evo3d t-dark" id="acts" aria-label="The evolution">
        <div className="container about-evo3d__head">
          <header className="about-acts__head">
            <div className="chapter__meta" data-reveal=""><span className="chapter__num">✦</span><span className="chapter__rule" /><span className="chapter__tag">The Evolution</span></div>
            <h2 className="chapter__title" data-reveal="">The frame<br /><em>kept getting bigger.</em></h2>
            <p className="about-acts__hint" data-reveal="">What started with images gradually became a way of thinking about interactions, spaces, systems and people.</p>
          </header>
          <p className="about-acts__meta" aria-hidden="true">08 Frames</p>
        </div>
        <div className="about-evo3d__scroll">
          <div className="about-evo3d__stage">
            <div className="about-evo3d__camera">
              <div className="about-evo3d__world">
                <EvolutionCard act="01" world="motion" name="Motion" category="FRAME · TIMING · MOVEMENT" image={{ src: '/assets/about/about-motion.webp', alt: 'Motion — dedicated About visual' }} note="The frame starts moving. Time becomes a material." title={<><span>I LEARNED </span><span>TO THINK </span><span>IN TIME. </span></>} description="VFX and animation taught me movement, rhythm, composition and visual storytelling." />
                <EvolutionCard act="02" world="interaction" name="Interaction" category="BEHAVIOUR · RESPONSE · INTUITION" image={{ src: '/assets/about/about-experience.webp', alt: 'Interaction — dedicated About visual' }} note="The work moves beyond passive viewing." title={<><span>THEN THE </span><span>FRAME STARTED </span><span>RESPONDING. </span></>} description="I became interested in how people move, interact, notice and understand." />
                <EvolutionCard act="03" world="environment" name="Environment" category="SPACE · SCALE · ATMOSPHERE" image={{ src: '/assets/about/about-environment.webp', alt: 'Environment — dedicated About visual' }} note="The screen wasn’t enough." title={<><span>THEN THE </span><span>SCREEN WASN&apos;T </span><span>ENOUGH. </span></>} description="I started thinking about space, atmosphere, scale and how environments communicate." statement="SPACE HAS A NARRATIVE TOO." />
                <EvolutionCard act="04" world="experience" name="Experience" category="STORY · SYSTEM · TECHNOLOGY · REALITY" image={{ src: '/assets/about/about-experience.webp', alt: 'Experience — dedicated About visual' }} note="Design isn’t only what people see — it’s what they feel." title={<><span>THEN EVERYTHING </span><span>HAD TO </span><span>WORK TOGETHER. </span></>} description="Story, interaction, space, technology, content and production became one problem." system={['STORY', 'AUDIENCE', 'INTERACTION', 'SPACE', 'TECHNOLOGY', 'PRODUCTION', 'REALITY']} />
                <EvolutionCard act="05" world="people" name="People" category="COLLABORATION · DIRECTION · EMPATHY" image={{ src: '/assets/about/about-people.webp', alt: 'People — dedicated About visual' }} note="The work is ultimately about people." title={<><span>BECAUSE EXPERIENCES </span><span>ARE FOR </span><span>PEOPLE. </span></>} description="The work became about bringing different disciplines and people around one idea." />
                <EvolutionCard act="06" world="leadership" name="Creative Leadership" category="IDEA · TEAM · EXECUTION" image={{ src: '/assets/about/about-leadership.webp', alt: 'Creative Leadership — dedicated About visual' }} note="Direction, story, technology and execution — together." title={<><span>THEN THE WORK </span><span>BECAME BIGGER THAN </span><span>THE IDEA. </span></>} description="Creative direction, collaboration, production and execution had to hold together in the real world." duo />
                <EvolutionCard act="07" world="interlude" name="Interlude" note="The distance" title={<><span>THE DISTANCE BETWEEN </span><span>THE IDEA AND </span><span>REALITY. </span></>} interlude />
                <EvolutionCard act="08" world="interlude" name="Interlude" note="The survival" title={<><span>GOOD IDEAS </span><span>HAVE TO </span><span>SURVIVE REALITY. </span></>} interlude />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-what t-light" aria-label="What I actually do">
        <div className="container about-what__grid">
          <div className="about-what__head">
            <p className="about-what__eyebrow" data-reveal=""><span className="chapter__rule" /><span className="chapter__tag">What I actually do</span></p>
            <h2 className="about-what__title" data-reveal="">I take complicated things<br /><em>and figure out how people should experience them.</em></h2>
          </div>
          <ol className="about-what__list">
            <li data-reveal="" style={delayed('0s')}><span className="about-what__item">Films</span></li>
            <li data-reveal="" style={delayed('0.07s')}><span className="about-what__item">Interactive Experiences</span></li>
            <li data-reveal="" style={delayed('0.14s')}><span className="about-what__item">VR/XR</span></li>
            <li data-reveal="" style={delayed('0.21s')}><span className="about-what__item">Experience Centres</span></li>
            <li data-reveal="" style={delayed('0.28s')}><span className="about-what__item">Physical Installations</span></li>
            <li data-reveal="" style={delayed('0.35s')}><span className="about-what__item">Brand Systems</span></li>
          </ol>
        </div>
      </section>

      <section className="about-now t-dark" aria-label="Now">
        <div className="container about-now__grid">
          <div className="about-now__head">
            <p className="about-now__eyebrow" data-reveal=""><span className="chapter__rule" /><span className="chapter__tag">Now</span></p>
            <h2 className="about-now__title" data-reveal="">Hard problems.<br />Ambitious ideas.<br /><em>Experiences with a reason to exist.</em></h2>
          </div>
          <p className="about-now__copy" data-reveal="">I&apos;m interested in work where design, technology, story and people have to come together — and where the idea matters as much as the execution.</p>
        </div>
      </section>

      <section className="about-curious t-light" aria-label="Still curious">
        <div className="container">
          <h2 className="about-curious__title" data-reveal="">Still curious.</h2>
          <ul className="about-curious__list" data-reveal-group="" data-dbase=".1">
            <li data-reveal="">Still learning.</li>
            <li data-reveal="">Still looking at films differently.</li>
            <li data-reveal="">Still noticing how spaces work.</li>
            <li data-reveal="">Still getting distracted by interesting interfaces.</li>
            <li data-reveal="">Still curious about what technology can become.</li>
          </ul>
          <p className="about-curious__note" data-reveal="">That&apos;s probably what hasn&apos;t changed.</p>
        </div>
      </section>

      <section className="about-credits t-light" id="credits" aria-label="Credits">
        <div className="container about-credits__inner">
          <span className="about-credits__rule" aria-hidden="true" data-reveal="" />
          <p className="about-credits__quote" data-reveal="">That&apos;s the work I&apos;m interested in.</p>
          <p className="about-credits__role" data-reveal="">Creative Director &amp; Experience Designer</p>
          <p className="about-credits__sig" data-reveal="">— Abhijeet Varghese</p>
          <p className="about-credits__cta" data-reveal=""><a className="btn btn--accent" href="/contact/">Start a conversation <ArrowRightIcon /></a></p>
        </div>
      </section>

      <nav className="about-compass" id="aboutCompass" aria-label="Story compass" hidden>
        <button className="about-compass__btn" type="button" id="aboutCompassBtn" aria-expanded="false" aria-controls="aboutCompassList"><span className="about-compass__num" id="aboutCompassNum">01</span><span className="about-compass__name" id="aboutCompassName">Motion</span><span className="about-compass__chev" aria-hidden="true">▾</span></button>
        <ul className="about-compass__list" id="aboutCompassList" hidden>
          <li><button type="button" data-act="01"><span className="about-compass__item-num">01</span><span className="about-compass__item-name">Motion</span></button></li>
          <li><button type="button" data-act="02"><span className="about-compass__item-num">02</span><span className="about-compass__item-name">Interaction</span></button></li>
          <li><button type="button" data-act="03"><span className="about-compass__item-num">03</span><span className="about-compass__item-name">Environment</span></button></li>
          <li><button type="button" data-act="04"><span className="about-compass__item-num">04</span><span className="about-compass__item-name">Experience</span></button></li>
          <li><button type="button" data-act="05"><span className="about-compass__item-num">05</span><span className="about-compass__item-name">People</span></button></li>
          <li><button type="button" data-act="06"><span className="about-compass__item-num">06</span><span className="about-compass__item-name">Creative Leadership</span></button></li>
        </ul>
      </nav>
    </>
  );
}
