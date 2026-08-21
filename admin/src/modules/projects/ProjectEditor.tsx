import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContentDoc } from '@/hooks/useContentDoc';
import { contentApi, projectsOf } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { SaveStateBadge } from '@/components/SaveStateBadge';
import { Button, Field, Input, Select, Textarea, Toggle } from '@/ui/controls';
import { Spinner, ErrorState } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import { isDirty, type SaveState } from '@/state/editor';
import type { Project } from '@/api/types';

const EMPTY: Project = {
  slug: '', title: '', client: '', industry: '', status: 'draft', image: '', summary: '',
  role: '', year: '', challenge: '', approach: '', outcome: '', featured: false,
};

export function ProjectEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useUi();
  const { can } = usePermissions();
  const doc = useContentDoc();
  const isNew = slug === 'new';

  const [form, setForm] = useState<Project>(EMPTY);
  const [baseline, setBaseline] = useState<Project>(EMPTY);
  const [baseVersion, setBaseVersion] = useState<number | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!doc.data || loaded) return;
    const projects = projectsOf(doc.data);
    const found = isNew ? undefined : projects.find((p) => p.slug === slug);
    if (!isNew && !found) { navigate('/projects'); return; }
    const init = found ? { ...found } : { ...EMPTY };
    setForm(init);
    setBaseline(init);
    setBaseVersion(doc.data._versions?.['projects']);
    setLoaded(true);
  }, [doc.data, loaded, isNew, slug, navigate]);

  const set = useCallback(<K extends keyof Project>(k: K, v: Project[K]) => setForm((f) => ({ ...f, [k]: v })), []);

  const dirty = useMemo(() => isDirty(form, baseline), [form, baseline]);

  const save = useCallback(async () => {
    if (!doc.data || !can('content.write')) return;
    setSaveState('saving');
    const all = projectsOf(doc.data);
    const idx = all.findIndex((p) => p.slug === baseline.slug || p.title === baseline.title);
    let next: Project[];
    if (isNew || idx === -1) {
      next = [...all, { ...form, id: form.id ?? `prj-${Date.now()}` }];
    } else {
      next = all.map((p, i) => (i === idx ? { ...p, ...form } : p));
    }
    try {
      await contentApi.saveKey('projects', next, baseVersion);
      setSaveState('saved');
      pushToast('success', isNew ? 'Project created (draft).' : 'Project saved (draft).');
      setBaseline(form);
      setBaseVersion((baseVersion ?? 0) + 1);
      if (isNew) navigate(`/projects/${form.slug || form.title}`);
    } catch (e) {
      setSaveState('failed');
      pushToast('error', (e as Error).message);
    }
  }, [doc.data, can, form, baseline, baseVersion, isNew, navigate, pushToast]);

  if (doc.loading) return <Spinner label="Loading project…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  return (
    <>
      <PageHeader
        title={isNew ? 'New project' : form.title || 'Untitled'}
        sub="Draft edits are saved to the CMS; publishing is a separate action."
        actions={
          <>
            <SaveStateBadge state={dirty ? 'dirty' : saveState} />
            <Button variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
            {can('content.write') && (
              <Button onClick={() => void save()} disabled={!dirty} loading={saveState === 'saving'}>Save draft</Button>
            )}
          </>
        }
      />
      <div className="av-grid av-grid--2">
        <div className="av-card">
          <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Slug"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="lowercase-hyphenated" /></Field>
          <Field label="Client"><Input value={form.client} onChange={(e) => set('client', e.target.value)} /></Field>
          <div className="av-grid av-grid--2">
            <Field label="Category / industry"><Input value={form.industry} onChange={(e) => set('industry', e.target.value)} /></Field>
            <Field label="Year"><Input value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
          </div>
          <Field label="Role"><Input value={form.role} onChange={(e) => set('role', e.target.value)} /></Field>
          <Field label="Image (path)"><Input value={form.image} onChange={(e) => set('image', e.target.value)} /></Field>
          <div className="av-grid av-grid--2">
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </Select>
            </Field>
            <Field label="Featured">
              <div style={{ paddingTop: '6px' }}>
                <Toggle checked={!!form.featured} onChange={(v) => set('featured', v)} label="Featured" />
              </div>
            </Field>
          </div>
        </div>
        <div className="av-card">
          <Field label="Summary"><Textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
          <Field label="Challenge"><Textarea value={form.challenge} onChange={(e) => set('challenge', e.target.value)} /></Field>
          <Field label="Approach"><Textarea value={form.approach} onChange={(e) => set('approach', e.target.value)} /></Field>
          <Field label="Outcome"><Textarea value={form.outcome} onChange={(e) => set('outcome', e.target.value)} /></Field>
        </div>
      </div>
    </>
  );
}
