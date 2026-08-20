import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useSiteChrome } from '@/lib/scroll';
import type { SearchResult } from '@/types/domain';

/** Port of the production search behaviour (search-index.json, live filtering). */
export function SearchPage() {
  useSiteChrome();
  return (
    <Layout activeHref="search.html" pageClose>
      <section className="page-hero" aria-label="Search">
        <div className="container">
          <div className="chapter__meta page-hero__meta" data-reveal>
            <span className="chapter__rule" />
            <span className="chapter__tag">Search</span>
          </div>
          <h1 className="page-hero__title" data-reveal>
            Find anything <em>on this site.</em>
          </h1>
          <p className="page-hero__lede" data-reveal>
            Projects, case studies, essays and journal entries — search the whole portfolio instantly.
          </p>
          <SearchForm />
        </div>
      </section>
    </Layout>
  );
}

function esc(s: unknown): string {
  return String(s || '').replace(/[&<>"]/g, (c) =>
    c.charCodeAt(0) === 34 ? '&quot;' : ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]!,
  );
}

function SearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SearchResult[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error('index');
        return r.json();
      })
      .then((d: { items?: SearchResult[] }) => {
        setItems(d.items || []);
      })
      .catch(() => setFailed(true));
  }, []);

  const render = useCallback(
    (q: string): string => {
      q = String(q || '').toLowerCase().trim();
      if (q.length < 2) return '';
      if (items === null) return '<p class="site-search__empty">Loading the index…</p>';
      const hits = items
        .filter((i) => {
          const tags = Array.isArray(i.tags) ? i.tags.join(' ') : String(i.tags || '');
          return (i.title + ' ' + i.excerpt + ' ' + tags).toLowerCase().indexOf(q) !== -1;
        })
        .slice(0, 10);
      if (!hits.length) {
        return `<p class="site-search__empty">No results for “${esc(q)}”. Try another term, or <a href="contact.html">ask me directly</a>.</p>`;
      }
      return hits
        .map(
          (i) =>
            `<a class="site-search__hit" href="${esc(i.url)}">` +
            `<span class="site-search__type">${esc(i.type)}</span>` +
            `<strong>${esc(i.title)}</strong>` +
            `<span class="site-search__excerpt">${esc(i.excerpt)}</span></a>`,
        )
        .join('');
    },
    [items],
  );

  const html = failed
    ? '<p class="site-search__empty">Search is unavailable right now. Use the <a href="sitemap.html">sitemap</a> or <a href="contact.html">ask me directly</a>.</p>'
    : render(query);

  return (
    <form className="site-search" id="siteSearchForm" role="search" data-reveal onSubmit={(e) => e.preventDefault()}>
      <label className="site-search__label" htmlFor="siteSearch">
        Search the site
      </label>
      <input
        type="search"
        id="siteSearch"
        name="q"
        ref={inputRef}
        placeholder="Try “experience centre” or “AI”…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div id="searchResults" className="site-search__results" aria-live="polite" dangerouslySetInnerHTML={{ __html: html }} />
    </form>
  );
}
