import type { ReactNode } from 'react';

/**
 * Shared page hero — the `page-hero` scaffold used by every inner content page
 * (contact, consulting, recruiters, insights, journal, search, legal, 404).
 */
export function PageHero({
  num,
  tag,
  index,
  children,
  lede,
}: {
  num?: string;
  tag: string;
  /** 404 uses a bare "404" index instead of a numbered chapter rule */
  index?: string;
  children: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <section className="page-hero" aria-label={tag}>
      <div className="container">
        <div className="chapter__meta page-hero__meta" data-reveal>
          {index ? (
            <span className="chapter__index">{index}</span>
          ) : (
            <>
              {num && <span className="chapter__num">{num}</span>}
              <span className="chapter__rule" />
            </>
          )}
          <span className="chapter__tag">{tag}</span>
        </div>
        <h1 className="page-hero__title" data-reveal>
          {children}
        </h1>
        {lede && (
          <p className="page-hero__lede" data-reveal style={{ ['--d' as string]: '.15s' }}>
            {lede}
          </p>
        )}
      </div>
    </section>
  );
}
