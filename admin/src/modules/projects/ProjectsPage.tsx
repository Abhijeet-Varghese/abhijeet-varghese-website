import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentDoc } from '@/hooks/useContentDoc';
import { useDebounce } from '@/hooks/useDebounce';
import { projectsOf } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge, Button, Input } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState } from '@/ui/feedback';
import { usePermissions } from '@/permissions/usePermissions';
import type { Project } from '@/api/types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const doc = useContentDoc();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedQ = useDebounce(q, 250);

  const projects = useMemo(() => {
    const all = doc.data ? projectsOf(doc.data) : [];
    return all
      .filter((p) => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (!debouncedQ) return true;
        const hay = `${p.title} ${p.client} ${p.industry} ${p.slug}`.toLowerCase();
        return hay.includes(debouncedQ.toLowerCase());
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [doc.data, debouncedQ, statusFilter]);

  if (doc.loading) return <Spinner label="Loading projects…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  const columns: Column<Project>[] = [
    { key: 'title', header: 'Project', render: (p) => <strong>{p.title}</strong> },
    { key: 'client', header: 'Client', render: (p) => p.client },
    { key: 'category', header: 'Category', render: (p) => p.industry },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={p.status === 'published' ? 'success' : 'warning'}>{p.status}</Badge> },
    { key: 'featured', header: 'Featured', render: (p) => (p.featured ? <Badge tone="accent">★ Featured</Badge> : <span className="av-muted">—</span>) },
    { key: 'updated', header: 'Updated', render: (p) => <span className="av-muted">{String(p.updated ?? '—')}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        sub={`${projects.length} project${projects.length === 1 ? '' : 's'}`}
        actions={
          can('content.write') ? (
            <Button onClick={() => navigate('/projects/new')}>New project</Button>
          ) : undefined
        }
      />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
        <select className="av-select" style={{ maxWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
      {projects.length === 0 ? (
        <EmptyState title="No projects" hint="Projects you create will appear here." />
      ) : (
        <DataTable columns={columns} rows={projects} getKey={(p) => p.slug || p.title} onRowClick={(p) => navigate(`/projects/${p.slug}`)} />
      )}
    </>
  );
}
