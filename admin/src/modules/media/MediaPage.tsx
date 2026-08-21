import { useMemo, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { systemApi } from '@/api/system';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/ui/controls';
import { Input } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState } from '@/ui/feedback';
import type { MediaItem } from '@/api/types';

function fmtSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Media library foundation — lists the DAM (real /api/media data). */
export function MediaPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const media = useApi(() => systemApi.media({ limit: 100, q: debouncedQ }), [debouncedQ]);

  const items = useMemo(() => {
    const list = media.data?.items ?? [];
    return type ? list.filter((m) => m.type === type) : list;
  }, [media.data, type]);

  const columns: Column<MediaItem>[] = [
    { key: 'name', header: 'File', render: (m) => <strong>{m.original_name}</strong> },
    { key: 'type', header: 'Type', render: (m) => <Badge tone="accent">{m.type}</Badge> },
    { key: 'mime', header: 'MIME', render: (m) => <code className="av-muted">{m.mime || '—'}</code> },
    { key: 'dims', header: 'Dimensions', render: (m) => <span className="av-muted">{m.width && m.height ? `${m.width}×${m.height}` : '—'}</span> },
    { key: 'size', header: 'Size', render: (m) => <span className="av-muted">{fmtSize(m.size)}</span> },
  ];

  return (
    <>
      <PageHeader title="Media Library" sub={`${media.data?.total ?? 0} assets · full DAM pipeline arrives later.`} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Input placeholder="Search media…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
        <select className="av-select" style={{ maxWidth: 160 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="pdf">Documents</option>
          <option value="file">Files</option>
        </select>
      </div>
      {media.loading ? <Spinner label="Loading media…" /> : media.error ? (
        <ErrorState message={media.error} requestId={media.requestId} onRetry={media.refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No media" hint="Uploaded assets will appear here." />
      ) : (
        <DataTable columns={columns} rows={items} getKey={(m) => String(m.id)} />
      )}
    </>
  );
}
