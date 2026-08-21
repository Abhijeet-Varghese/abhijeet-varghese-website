import { useCallback, useMemo, useState } from 'react';
import { useContentDoc } from '@/hooks/useContentDoc';
import { contentApi, experienceOf } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Field, Input, Textarea } from '@/ui/controls';
import { Spinner, ErrorState, EmptyState, Dialog } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import type { ExperienceJob } from '@/api/types';

export function ExperiencePage() {
  const { can } = usePermissions();
  const { pushToast } = useUi();
  const doc = useContentDoc();
  const [editing, setEditing] = useState<ExperienceJob | null>(null);
  const [form, setForm] = useState<ExperienceJob>({ date: '', role: '', company: '', summary: '' });
  const [saving, setSaving] = useState(false);

  const jobs = useMemo(() => {
    const all = doc.data ? experienceOf(doc.data) : [];
    return [...all].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [doc.data]);

  const openEdit = useCallback((j: ExperienceJob | null) => {
    setEditing(j);
    setForm(j ? { ...j } : { date: '', role: '', company: '', summary: '', order: (jobs.length || 0) + 1 });
  }, [jobs.length]);

  const save = useCallback(async () => {
    if (!doc.data || !can('content.write') || !editing) return;
    setSaving(true);
    const all = experienceOf(doc.data);
    const idx = all.findIndex((j) => (j.id ?? j.company) === (editing.id ?? editing.company));
    const next = idx === -1 ? [...all, form] : all.map((j, i) => (i === idx ? form : j));
    try {
      await contentApi.saveKey('experience', next, doc.data._versions?.['experience']);
      pushToast('success', 'Experience saved (draft).');
      setEditing(null);
      doc.refetch();
    } catch (e) {
      pushToast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [doc, can, editing, form, pushToast]);

  if (doc.loading) return <Spinner label="Loading experience…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  const columns: Column<ExperienceJob>[] = [
    { key: 'role', header: 'Role', render: (j) => <strong>{j.role}{j.roleSub ? ` · ${j.roleSub}` : ''}</strong> },
    { key: 'company', header: 'Company', render: (j) => j.company },
    { key: 'date', header: 'Period', render: (j) => <span className="av-muted">{j.date}</span> },
    { key: 'location', header: 'Location', render: (j) => <span className="av-muted">{j.location ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Experience"
        sub={`${jobs.length} role${jobs.length === 1 ? '' : 's'}`}
        actions={can('content.write') ? <Button onClick={() => openEdit(null)}>Add role</Button> : undefined}
      />
      {jobs.length === 0 ? (
        <EmptyState title="No experience" hint="Your career timeline will appear here." />
      ) : (
        <DataTable columns={columns} rows={jobs} getKey={(j) => j.id ?? j.company} onRowClick={openEdit} />
      )}

      <Dialog
        open={editing !== null}
        title={editing ? `Edit ${editing.role}` : 'Add role'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void save()} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="av-grid av-grid--2">
          <Field label="Role"><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
        </div>
        <Field label="Date range"><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Sep 2024 — Jan 2026" /></Field>
        <Field label="Location"><Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Summary"><Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
      </Dialog>
    </>
  );
}
