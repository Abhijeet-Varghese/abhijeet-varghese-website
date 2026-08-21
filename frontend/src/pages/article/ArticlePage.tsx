import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';
import { Arrow } from '@/components/Arrow';

/**
 * Shared essay/journal article page (production `article-hero` + `article-body`
 * template). Content is transcribed verbatim; blank paragraphs render as
 * `<p>&nbsp;</p>` exactly as the production source.
 *
 * The article is resolved from the runtime content provider by slug; the
 * static snapshot guarantees the slug is present even when the CMS is offline.
 */
export function ArticlePage({ slug }: { slug: string }) {
  useSiteChrome();
  const { content } = useContent();
  const article = content.articles.ARTICLES_BY_SLUG[slug];
  if (!article) return null;
  const activeHref = article.kind === 'essay' ? 'insights.html' : 'journal.html';
  return (
    <Layout activeHref={activeHref} pageClose>
      <section className="article-hero">
        <img
          className="article-hero__img"
          src={article.image}
          alt={article.imageAlt}
          width={article.imageWidth}
          height={article.imageHeight}
          fetchPriority="high"
          decoding="async"
        />
        <div className="article-hero__veil" aria-hidden="true" />
        <div className="container article-hero__inner">
          <div className="chapter__meta" data-reveal>
            <span className="chapter__num">✦</span>
            <span className="chapter__rule" />
            <span className="chapter__tag">{article.tag}</span>
          </div>
          <h1 className="article-hero__title" data-reveal style={{ ['--d' as string]: '.1s' }}>
            {article.title}
          </h1>
          <p className="article-hero__lede" data-reveal style={{ ['--d' as string]: '.2s' }}>
            {article.excerpt}
          </p>
        </div>
      </section>
      <section className="article-body t-light">
        <div className="container">
          <div className="prose" data-reveal-group data-dbase=".15">
            {article.paragraphs.map((p, i) =>
              p ? <p key={i}>{p}</p> : <p key={i}>&nbsp;</p>,
            )}
          </div>
          <div className="article-foot" data-reveal>
            <p style={{ color: 'var(--cm)', fontSize: '0.95rem' }}>
              By <strong style={{ color: 'var(--ct)' }}>Abhijeet Varghese</strong> · {article.date}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <a className="link-arrow" href={article.backHref}>
                {article.backLabel}
              </a>
              <a className="link-arrow" href="contact.html">
                Start a conversation <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>
      {article.related && (
        <section className="page-section t-light" aria-label="Related">
          <div className="container">
            <div className="chapter__meta" data-reveal>
              <span className="chapter__index">+</span>
              <span className="chapter__tag">Keep reading</span>
            </div>
            <h2 className="chapter__title" data-reveal style={{ fontSize: '1.6rem' }}>
              Related <em>content.</em>
            </h2>
            <ul style={{ listStyle: 'none', margin: '18px 0 0', padding: 0 }}>
              <li data-reveal style={{ padding: '10px 0', borderBottom: '1px solid var(--cl)' }}>
                <a className="link-arrow" href={article.related.href}>
                  {article.related.title}
                  <span style={{ fontSize: '11px', color: 'var(--ink-3)', marginLeft: '8px' }}>{article.related.label}</span>{' '}
                  <Arrow />
                </a>
              </li>
            </ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
