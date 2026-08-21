import { useContent } from '@/content/provider';

export function Identity() {
  const { content } = useContent();
  const IDENTITY = content.story.IDENTITY;
  return (
    <section className="about-frame t-light" id="act-01" data-act="01" aria-label="About — identity">
      <div className="container">
        <div className="about-frame__spread">
          <div className="about-frame__manifesto">
            <h2 className="about-frame__statement" data-reveal>
              {IDENTITY.statement[0]}
              <br />
              <em>{IDENTITY.statement[1]}</em>
            </h2>
            <div className="about-frame__bio" data-reveal-group data-dbase=".12">
              {IDENTITY.beats.map((beat, i) => (
                <div
                  className="about-frame__beat"
                  data-reveal
                  style={i > 0 ? { ['--d' as string]: `${i * 0.1}s` } : undefined}
                  key={beat.num}
                >
                  <span className="about-frame__beat-num" aria-hidden="true">
                    {beat.num}
                  </span>
                  <p>{beat.text}</p>
                </div>
              ))}
            </div>
            <p className="about-frame__question" data-reveal>
              {IDENTITY.question[0]}
              <em>{IDENTITY.question[1]}</em>
            </p>
          </div>
          <figure className="about-frame__portrait" data-reveal="portrait">
            <span className="about-frame__portrait-frame" aria-hidden="true" />
            <img
              src={IDENTITY.portrait.src}
              alt={IDENTITY.portrait.alt}
              width="1024"
              height="1024"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
        <div className="about-frame__nums" aria-label="By the numbers">
          {IDENTITY.numbers.map((n, i) => (
            <div
              className="about-frame__num"
              data-reveal
              style={i > 0 ? { ['--d' as string]: `${i * 0.1}s` } : undefined}
              key={n.label}
            >
              <strong data-count={n.value} data-suffix={n.suffix}>
                <span className="about-frame__num-val">{n.value}</span>
                <span>{n.suffix}</span>
              </strong>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
        <div className="about-frame__facts">
          {IDENTITY.facts.map((fact, i) => (
            <div
              className="about-frame__fact"
              data-reveal
              style={i > 0 ? { ['--d' as string]: `${i * 0.08}s` } : undefined}
              key={fact.label}
            >
              <p className="about-frame__fact-label">{fact.label}</p>
              {fact.line ? (
                <p className="about-frame__fact-line">{fact.line}</p>
              ) : (
                <ul className={`about-frame__list${fact.cols ? ' about-frame__list--cols' : ''}`}>
                  {fact.list!.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="about-frame__credo">
          <h3 className="about-frame__credo-title" data-reveal>
            {IDENTITY.credo.title}
          </h3>
          <p className="about-frame__credo-lines" data-reveal>
            {IDENTITY.credo.lines[0]}
            <br />
            {IDENTITY.credo.lines[1]}
            <br />
            {IDENTITY.credo.lines[2]}
            <br />
            <em>{IDENTITY.credo.lines[3]}</em>
          </p>
        </div>
        <div className="about-zoomstage" id="aboutZoomStage" aria-hidden="true">
          <p className="about-zoomstage__eyebrow" data-reveal>
            <span className="chapter__rule" />
            <span className="chapter__tag">The zoom-out</span>
          </p>
          <div className="about-zoomstage__viewport">
            <div className="about-zoomstage__ghost" id="aboutZoomGhost1" aria-hidden="true">
              <img src={IDENTITY.zoomImage} alt="" width="1312" height="816" loading="lazy" decoding="async" />
            </div>
            <div className="about-zoomstage__ghost" id="aboutZoomGhost2" aria-hidden="true">
              <img src={IDENTITY.zoomImage} alt="" width="1312" height="816" loading="lazy" decoding="async" />
            </div>
            <div className="about-zoomstage__frame" id="aboutZoomFrame">
              <img src={IDENTITY.zoomImage} alt="" width="1312" height="816" loading="lazy" decoding="async" />
            </div>
          </div>
          <ol className="about-zoomstage__labels" id="aboutZoomLabels">
            {IDENTITY.zoomLabels.map((label, i) => (
              <li data-zoom={String(i + 1)} key={label}>
                <span>0{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
