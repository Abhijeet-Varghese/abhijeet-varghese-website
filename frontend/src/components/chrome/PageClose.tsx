/**
 * Inner-page close/back control (`data-history-close`). Rendered on the Story
 * page; the contextual back behaviour (return to originating route + section +
 * scroll position, homepage fallback) is handled by `initNavOrigin`.
 */
export function PageClose({ base = '' }: { base?: string }) {
  return (
    <a className="page-close" href={base + 'index.html'} data-history-close aria-label="Close and return to previous section">
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </a>
  );
}
