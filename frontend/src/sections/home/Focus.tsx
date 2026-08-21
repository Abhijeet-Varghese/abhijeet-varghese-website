import { useContent } from '@/content/provider';
import { ChapterMeta } from './ChapterMeta';

export function Focus() {
  const { content } = useContent();
  const FOCUS = content.home.FOCUS;
  return (
    <section className="chapter focus t-light" id="focus">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <ChapterMeta num={FOCUS.num} tag={FOCUS.tag} />
            <h2 className="chapter__title" data-reveal>
              {FOCUS.title}
            </h2>
          </div>
          <p className="chapter__lede" data-reveal>
            {FOCUS.lede}
          </p>
        </header>
        <div className="focus__grid">
          <ul className="focus__list" data-reveal-group>
            {FOCUS.list.map((item) => (
              <li data-reveal key={item.num}>
                <span className="focus__num">{item.num}</span>
                {item.label}
              </li>
            ))}
          </ul>
          <div className="focus__open" data-reveal-group>
            <p className="label label--muted" data-reveal>
              {FOCUS.openLabel}
            </p>
            <ul className="open__list">
              {FOCUS.open.map((item) => (
                <li data-reveal key={item}>
                  {item}
                </li>
              ))}
            </ul>
            <p className="focus__note" data-reveal>
              {FOCUS.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
