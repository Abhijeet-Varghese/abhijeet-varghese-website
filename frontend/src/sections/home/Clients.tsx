import { useContent } from '@/content/provider';
import { ChapterMeta } from './ChapterMeta';

export function Clients() {
  const { content } = useContent();
  const CLIENTS = content.home.CLIENTS;
  return (
    <section className="chapter clients t-light" id="clients">
      <div className="container">
        <header className="chapter__head chapter__head--split">
          <div>
            <ChapterMeta num={CLIENTS.num} tag={CLIENTS.tag} />
            <h2 className="chapter__title" data-reveal>
              {CLIENTS.title}
            </h2>
          </div>
          <p className="chapter__lede" data-reveal>
            {CLIENTS.lede}
          </p>
        </header>
        <ul className="logo-wall" data-reveal-group aria-label="Selected clients">
          {CLIENTS.logos.map((logo) => (
            <li className="logo-tile" data-reveal key={logo.file}>
              <img
                src={`assets/logos/${logo.file}`}
                alt={logo.name}
                width="160"
                height="48"
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
        <p className="clients__note" data-reveal>
          {CLIENTS.note}
        </p>
      </div>
    </section>
  );
}
