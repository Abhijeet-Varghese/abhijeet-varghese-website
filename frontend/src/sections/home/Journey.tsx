import { JOURNEY } from '@/content/home';
import { ChapterMeta } from './ChapterMeta';

export function Journey() {
  return (
    <>
      <section className="journey t-light" id="journey">
        <div className="journey__pin" id="journeyPin">
          <header className="journey__head container">
            <div>
              <ChapterMeta num={JOURNEY.num} tag={JOURNEY.tag} />
              <h2 className="chapter__title" data-reveal>
                {JOURNEY.title}
              </h2>
            </div>
            <p className="journey__hint" data-reveal>
              {JOURNEY.hint}
              <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true">
                <path d="M0 6h19M15 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </p>
          </header>
          <div className="journey__viewport">
            <ol className="journey__track" id="journeyTrack">
              {JOURNEY.eras.map((era) => (
                <li className={`era${era.future ? ' era--future' : ''}`} data-reveal key={era.index}>
                  <span className="era__index">{era.index}</span>
                  <h3 className="era__name">{era.name}</h3>
                  <span className="era__note">{era.note}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="journey__barwrap container">
            <div className="journey__bar" aria-hidden="true">
              <span id="journeyBar" />
            </div>
            <p className="journey__counter" aria-hidden="true">
              <em>Era</em> <span id="journeyBarNum">01 / 09</span>
            </p>
          </div>
        </div>
      </section>
      <div className="coda t-light">
        <div className="container">
          <p className="journey__coda" data-reveal>
            {JOURNEY.coda}
          </p>
        </div>
      </div>
    </>
  );
}
