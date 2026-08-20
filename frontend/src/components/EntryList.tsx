import type { IndexEntry } from '@/types/domain';
import { Arrow } from '@/components/Arrow';

/**
 * Index/list entry used by Insights + Journal (and matching the production
 * `entry` treatment). Each entry: serif numeral + tag, title link, excerpt,
 * and a "Read …" link. Preceded by a hairline rule.
 */
export function EntryList({ entries, readLabel }: { entries: IndexEntry[]; readLabel: string }) {
  return (
    <div className="container">
      <div className="entry" data-reveal style={{ borderTop: '1px solid var(--cl)' }} />
      {entries.map((e) => (
        <article className="entry" data-reveal key={e.href}>
          <p className="entry__meta">
            <em>{e.num}</em>
            <span>{e.tag}</span>
          </p>
          <h3>
            <a href={e.href}>{e.title}</a>
          </h3>
          <p>{e.excerpt}</p>
          <p style={{ marginTop: '12px' }}>
            <a className="link-arrow" href={e.href}>
              {readLabel} <Arrow />
            </a>
          </p>
        </article>
      ))}
    </div>
  );
}
