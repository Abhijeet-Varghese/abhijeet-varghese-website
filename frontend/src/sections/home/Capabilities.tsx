import { CAPABILITIES } from '@/content/home';
import { ChapterMeta } from './ChapterMeta';

export function Capabilities() {
  return (
    <section className="chapter capabilities t-dark" id="capabilities">
      <div className="container">
        <header className="chapter__head">
          <ChapterMeta num={CAPABILITIES.num} tag={CAPABILITIES.tag} />
          <h2 className="chapter__title chapter__title--wide" data-reveal>
            {CAPABILITIES.title.lead}
            <em className="block-em">{CAPABILITIES.title.em}</em>
          </h2>
        </header>
        <div className="cap-list">
          {CAPABILITIES.items.map((cap) => (
            <article className={`cap${cap.feature ? ' cap--feature' : ''}`} data-reveal key={cap.num}>
              <div className="cap__index">
                <span className="cap__num">{cap.num}</span>
              </div>
              <h3>{cap.title}</h3>
              <p>{cap.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
