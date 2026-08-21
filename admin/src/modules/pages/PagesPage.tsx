import { useMemo } from 'react';
import { useContentDoc } from '@/hooks/useContentDoc';
import { pagesOf } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState } from '@/ui/feedback';

interface PageRecord {
  id?: string;
  slug?: string;
  title?: string;
  status?: string;
  template?: string;
  updated?: string;
  seo?: Record<string, unknown>;
}

export function PagesPage() {
  const doc = useContentDoc();

  const pages = useMemo<PageRecord[]>(() => {
    const all = pagesOf(doc.data ?? ({} as never)) as PageRecord[];
    return all.sort((a, b) => (a.slug ?? '').localeCompare(b.slug ?? ''));
  }, [doc.data]);

  if (doc.loading) return <Spinner label="Loading pages…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  const columns: Column<PageRecord>[] = [
    { key: 'title', header: 'Title', render: (p) => <strong>{p.title ?? '—'}</strong> },
    { key: 'slug', header: 'Slug', render: (p) => <code className="av-muted">{p.slug ?? '—'}</code> },
    { key: 'template', header: 'Template', render: (p) => <span className="av-muted">{String(p.template ?? '—')}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={p.status === 'published' ? 'success' : 'warning'}>{p.status ?? '—'}</Badge> },
    { key: 'seo', header: 'SEO', render: (p) => (p.seo && (p.seo.title || p.seo.desc)) ? <Badge tone="success">✓</Badge> : <Badge tone="warning">Missing</Badge> },
    { key: 'updated', header: 'Updated', render: (p) => <span className="av-muted">{String(p.updated ?? '—')}</span> },
  ];

  return (
    <>
      <PageHeader title="Pages" sub={`${pages.length} page${pages.length === 1 ? '' : 's'} · visual editing arrives with the builder (Phase 6).`} />
      {pages.length === 0 ? (
        <EmptyState title="No pages" hint="Pages will appear here." />
      ) : (
        <DataTable columns={columns} rows={pages} getKey={(p) => p.slug ?? p.id ?? String(Math.random())} />
      )}
    </>
  );
}
