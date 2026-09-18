export default function AISection({ content }) {
  return (
    <>
<section className="chapter ai t-dark" id="ai">
      <div className="container">
        <div className="ai__grid">
          <div className="ai__copy">
            <header className="chapter__head">
              <div className="chapter__meta" data-reveal={true}><span className="chapter__num">07</span><span className="chapter__rule"></span><span className="chapter__tag">Method</span></div>
              <h2 className="chapter__title" data-reveal={true}>Building with AI.<em className="block-em">Thinking like a human.</em></h2>
            </header>
            <div data-reveal-group={true}>
              <p data-reveal={true}>AI is the fastest collaborator I&#039;ve ever worked with — and it still needs direction. I integrate it across research, ideation, storyboards, scripts, image generation, video generation, concept development and rapid prototyping.</p>
              <p data-reveal={true}>The point was never to make more. It&#039;s to see more options, sooner — and choose better. Every output passes through the same filter it always did: does a human being understand this, trust this, remember this?</p>
            </div>
            <ul className="chip-list" data-reveal-group={true}><li data-reveal={true}>Research</li><li data-reveal={true}>Ideation</li><li data-reveal={true}>Storyboards</li><li data-reveal={true}>Scripts</li><li data-reveal={true}>Image Generation</li><li data-reveal={true}>Video Generation</li><li data-reveal={true}>Concept Development</li><li data-reveal={true}>Rapid Prototyping</li></ul>
            <div className="ai__projects" data-reveal-group={true}><article className="ai-project" data-reveal={true}><h3>The Virtual Life</h3><p>An AI-crafted narrative world — exploring how generated media can carry genuine emotional weight.</p></article><article className="ai-project" data-reveal={true}><h3>Immersive Wedding Invitation</h3><p>A platform that turns a wedding invitation into an explorable experience — AI-personalized for every guest.</p></article></div>
            <p className="ai__motto" data-reveal={true}>“AI accelerates the hands. It doesn&#039;t replace the head — or the heart.”</p>
          </div>
          <figure className="ai__media" data-parallax="0.05" data-reveal="img">
            <picture><img src="/assets/experience-centre.webp" alt="Visitors in a dark exhibition hall facing a large glowing media wall" width="1536" height="1024" loading="lazy" decoding="async" /></picture>
            <figcaption>An enterprise experience centre — strategy made walkable.</figcaption>
          </figure>
        </div>
      </div>
    </section>
    </>
  );
}
