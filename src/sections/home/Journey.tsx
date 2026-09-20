export default function Journey() {
  return (
    <>
<section className="journey t-light" id="journey">
      <div className="journey__pin" id="journeyPin">
        <header className="journey__head container">
          <div>
            <div className="chapter__meta" data-reveal={true}><span className="chapter__rule"></span><span className="chapter__tag">Journey</span></div>
            <h2 className="chapter__title" data-reveal={true}>Not a timeline. An evolution.</h2>
          </div>
          <p className="journey__hint" data-reveal={true}>Keep scrolling — the years unfold sideways
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M0 6h19M15 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" /></svg>
          </p>
        </header>
        <div className="journey__viewport">
          <ol className="journey__track" id="journeyTrack">
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Graphic Design</h3>
              <span className="era__note">Learning to see</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Animation</h3>
              <span className="era__note">Learning to move</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Storytelling</h3>
              <span className="era__note">Learning to mean</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Experience Design</h3>
              <span className="era__note">Learning to orchestrate</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Immersive Tech</h3>
              <span className="era__note">Learning to build worlds</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Creative Leadership</h3>
              <span className="era__note">Learning to multiply others</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">Enterprise Innovation</h3>
              <span className="era__note">Learning to shift systems</span>
            </li>
            <li className="era" data-reveal={true}>
              
              <h3 className="era__name">AI</h3>
              <span className="era__note">Moving faster — deliberately</span>
            </li>
            <li className="era era--future" data-reveal={true}>
              
              <h3 className="era__name">Future</h3>
              <span className="era__note">Still curious</span>
            </li>
          </ol>
        </div>
        <div className="journey__barwrap container">
          <div className="journey__bar" aria-hidden="true"><span id="journeyBar"></span></div>
          
        </div>
      </div>
    </section>
    <div className="coda t-light"><div className="container"><p className="journey__coda" data-reveal={true}>The tools changed. The curiosity never did.</p></div></div>
    </>
  );
}
