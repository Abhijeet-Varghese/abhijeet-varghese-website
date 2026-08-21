import { useMemo, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useContentDoc } from '@/hooks/useContentDoc';
import { contentApi } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge, Button, Select } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState, Dialog } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import type { Revision } from '@/api/types';

const CONTENT_KEYS = ['settings', 'nav', 'sections', 'pages', 'projects', 'articles', 'clients', 'experience', 'story', 'orange', 'page_content', 'page_seo'];

/** Revisions — wraps the existing `versions` system (read + restore). */
export function RevisionsPage() {
  const { can } = usePermissions();
  const { pushToast } = useUi();
  const doc = useContentDoc();
  const [key, setKey] = useState('projects');
  const [confirming, setConfirming] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);
  const versions = useApi(() => contentApi.versions(key), [key]);

  const totalVersion = useMemo(() => doc.data?._versions?.[key] ?? 0, [doc.data, key]);

  const columns: Column<Revision>[] = [
    { key: 'version', header: 'Version', render: (r) => <strong>v{r.version}</strong> },
    { key: 'note', header: 'Note', render: (r) => <span className="av-muted">{r.note || '—'}</span> },
    { key: 'date', header: 'Created', render: (r) => <span className="av-muted">{r.created_at}</span> },
    {
      key: 'actions', header: '',
      render: (r) => can('versions.restore')
        ? <Button size="sm" variant="ghost" onClick={() => setConfirming(r)}>Restore</Button>
        : null,
    },
  ];

  const restore = async () => {
    if (!confirming) return;
    setRestoring(true);
    try {
      await contentApi.restore(key, confirming.version);
      pushToast('success', `Restored ${key} to v${confirming.version}.`);
      setConfirming(null);
      versions.refetch();
      doc.refetch();
    } catch (e) {
      pushToast('error', (e as Error).message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <PageHeader title="Revisions" sub={`Current ${key} revision: v${totalVersion} · restores are themselves versioned.`} />
      <div style={{ marginBottom: '16px', maxWidth: 240 }}>
        <Select value={key} onChange={(e) => setKey(e.target.value)} aria-label="Content collection">
          {CONTENT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>
      </div>
      {versions.loading ? <Spinner label="Loading revisions…" /> : versions.error ? (
        <ErrorState message={versions.error} requestId={versions.requestId} onRetry={versions.refetch} />
      ) : !versions.data || versions.data.length === 0 ? (
        <EmptyState title="No revisions" hint="Versions are created when content is saved." />
      ) : (
        <DataTable columns={columns} rows={versions.data} getKey={(r) => String(r.version)} />
      )}

      <Dialog
        open={confirming !== null}
        title={`Restore ${key} to v${confirming?.version ?? ''}?`}
        onClose={() => setConfirming(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void restore()} loading={restoring}>Restore</Button>
          </>
        }
      >
        <p className="av-muted">
          This restores the <Badge tone="accent">{key}</Badge> collection to version v{confirming?.version}. The restore is recorded as a new version, so nothing is lost.
        </p>
      </Dialog>
    </>
  );
}
