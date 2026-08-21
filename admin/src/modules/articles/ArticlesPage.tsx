import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentDoc } from '@/hooks/useContentDoc';
import { useDebounce } from '@/hooks/useDebounce';
import { articlesOf } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge, Button, Input } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState } from '@/ui/feedback';
import { usePermissions } from '@/permissions/usePermissions';
import type { Article } from '@/api/types';

export function ArticlesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const doc = useContentDoc();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 250);

  const articles = useMemo(() => {
    const all = doc.data ? articlesOf(doc.data) : [];
    return all
      .filter((a) => {
        if (!debouncedQ) return true;
        const hay = `${a.title} ${a.category} ${a.slug}`.toLowerCase();
        return hay.includes(debouncedQ.toLowerCase());
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [doc.data, debouncedQ]);

  if (doc.loading) return <Spinner label="Loading articles…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  const columns: Column<Article>[] = [
    { key: 'title', header: 'Title', render: (a) => <strong>{a.title}</strong> },
    { key: 'type', header: 'Type', render: (a) => <Badge tone={a.type === 'journal' ? 'info' : 'accent'}>{a.type}</Badge> },
    { key: 'category', header: 'Category', render: (a) => a.category },
    { key: 'date', header: 'Date', render: (a) => <span className="av-muted">{a.date}</span> },
    { key: 'status', header: 'Status', render: (a) => <Badge tone={a.status === 'published' ? 'success' : 'warning'}>{a.status}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Journal"
        sub={`${articles.length} article${articles.length === 1 ? '' : 's'}`}
        actions={can('content.write') ? <Button onClick={() => navigate('/articles/new')}>New article</Button> : undefined}
      />
      <div style={{ marginBottom: '16px' }}>
        <Input placeholder="Search articles…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
      </div>
      {articles.length === 0 ? (
        <EmptyState title="No articles" hint="Essays and journal entries will appear here." />
      ) : (
        <DataTable columns={columns} rows={articles} getKey={(a) => a.slug || a.title} onRowClick={(a) => navigate(`/articles/${a.slug}`)} />
      )}
    </>
  );
}
