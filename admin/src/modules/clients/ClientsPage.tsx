import { useCallback, useMemo, useState } from 'react';
import { useContentDoc } from '@/hooks/useContentDoc';
import { useDebounce } from '@/hooks/useDebounce';
import { clientsOf, contentApi } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Field, Input } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState, Dialog } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import type { ClientRecord } from '@/api/types';

export function ClientsPage() {
  const { can } = usePermissions();
  const { pushToast } = useUi();
  const doc = useContentDoc();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [form, setForm] = useState<ClientRecord>({ name: '' });
  const [saving, setSaving] = useState(false);
  const debouncedQ = useDebounce(q, 250);

  const clients = useMemo(() => {
    const all = doc.data ? clientsOf(doc.data) : [];
    return all
      .filter((c) => !debouncedQ || c.name.toLowerCase().includes(debouncedQ.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [doc.data, debouncedQ]);

  const openEdit = useCallback((c: ClientRecord | null) => {
    setEditing(c);
    setForm(c ? { ...c } : { name: '' });
  }, []);

  const save = useCallback(async () => {
    if (!doc.data || !can('content.write') || !editing) return;
    setSaving(true);
    const all = clientsOf(doc.data);
    const idx = all.findIndex((c) => c.name === editing.name);
    const next = idx === -1 ? [...all, form] : all.map((c, i) => (i === idx ? form : c));
    try {
      await contentApi.saveKey('clients', next, doc.data._versions?.['clients']);
      pushToast('success', 'Client saved (draft).');
      setEditing(null);
      doc.refetch();
    } catch (e) {
      pushToast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [doc, can, editing, form, pushToast]);

  if (doc.loading) return <Spinner label="Loading clients…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  const columns: Column<ClientRecord>[] = [
    { key: 'name', header: 'Name', render: (c) => <strong>{c.name}</strong> },
    { key: 'industry', header: 'Industry', render: (c) => <span className="av-muted">{String(c.industry ?? '—')}</span> },
    { key: 'logo', header: 'Logo', render: (c) => <code className="av-muted">{String(c.logo ?? '—')}</code> },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        sub={`${clients.length} client${clients.length === 1 ? '' : 's'}`}
        actions={can('content.write') ? <Button onClick={() => openEdit(null)}>Add client</Button> : undefined}
      />
      <div style={{ marginBottom: '16px' }}>
        <Input placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
      </div>
      {clients.length === 0 ? (
        <EmptyState title="No clients" hint="Client logos and names will appear here." />
      ) : (
        <DataTable columns={columns} rows={clients} getKey={(c) => c.name} onRowClick={openEdit} />
      )}

      <Dialog
        open={editing !== null}
        title={editing ? `Edit ${editing.name}` : 'Add client'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void save()} loading={saving}>Save</Button>
          </>
        }
      >
        <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Industry"><Input value={form.industry ?? ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></Field>
        <Field label="Logo (path)"><Input value={form.logo ?? ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="assets/logos/…" /></Field>
      </Dialog>
    </>
  );
}
