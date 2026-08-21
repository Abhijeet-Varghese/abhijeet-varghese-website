import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContentDoc } from '@/hooks/useContentDoc';
import { articlesOf, contentApi } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { SaveStateBadge } from '@/components/SaveStateBadge';
import { Button, Field, Input, Select, Textarea } from '@/ui/controls';
import { Spinner, ErrorState } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import { isDirty, type SaveState } from '@/state/editor';
import type { Article } from '@/api/types';

const EMPTY: Article = {
  slug: '', title: '', type: 'essay', status: 'draft', category: '', date: new Date().toISOString().slice(0, 10),
  image: '', excerpt: '', paragraphs: [],
};

export function ArticleEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useUi();
  const { can } = usePermissions();
  const doc = useContentDoc();
  const isNew = slug === 'new';

  const [form, setForm] = useState<Article>(EMPTY);
  const [baseline, setBaseline] = useState<Article>(EMPTY);
  const [baseVersion, setBaseVersion] = useState<number | undefined>();
  const [bodyText, setBodyText] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!doc.data || loaded) return;
    const all = articlesOf(doc.data);
    const found = isNew ? undefined : all.find((a) => a.slug === slug);
    if (!isNew && !found) { navigate('/articles'); return; }
    const init = found ? { ...found } : { ...EMPTY };
    setForm(init);
    setBaseline(init);
    setBodyText((found?.paragraphs ?? []).join('\n\n'));
    setBaseVersion(doc.data._versions?.['articles']);
    setLoaded(true);
  }, [doc.data, loaded, isNew, slug, navigate]);

  const set = useCallback(<K extends keyof Article>(k: K, v: Article[K]) => setForm((f) => ({ ...f, [k]: v })), []);

  const dirty = useMemo(() => {
    const next = { ...form, paragraphs: bodyText.split(/\n{2,}/).map((s) => s.trim()) };
    return isDirty(next, baseline);
  }, [form, bodyText, baseline]);

  const save = useCallback(async () => {
    if (!doc.data || !can('content.write')) return;
    setSaveState('saving');
    const all = articlesOf(doc.data);
    const next: Article = { ...form, paragraphs: bodyText.split(/\n{2,}/).map((s) => s.trim()) };
    const idx = all.findIndex((a) => a.slug === baseline.slug || a.title === baseline.title);
    const list = idx === -1 ? [...all, { ...next, id: next.id ?? `art-${Date.now()}` }] : all.map((a, i) => (i === idx ? { ...a, ...next } : a));
    try {
      await contentApi.saveKey('articles', list, baseVersion);
      setSaveState('saved');
      pushToast('success', isNew ? 'Article created (draft).' : 'Article saved (draft).');
      setBaseline(next);
      setBaseVersion((baseVersion ?? 0) + 1);
      if (isNew) navigate(`/articles/${next.slug || next.title}`);
    } catch (e) {
      setSaveState('failed');
      pushToast('error', (e as Error).message);
    }
  }, [doc.data, can, form, bodyText, baseline, baseVersion, isNew, navigate, pushToast]);

  if (doc.loading) return <Spinner label="Loading article…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  return (
    <>
      <PageHeader
        title={isNew ? 'New article' : form.title || 'Untitled'}
        sub="Essays and journal entries. The AI Journal Studio arrives in a later phase."
        actions={
          <>
            <SaveStateBadge state={dirty ? 'dirty' : saveState} />
            <Button variant="ghost" onClick={() => navigate('/articles')}>Cancel</Button>
            {can('content.write') && <Button onClick={() => void save()} disabled={!dirty} loading={saveState === 'saving'}>Save draft</Button>}
          </>
        }
      />
      <div className="av-grid av-grid--2">
        <div className="av-card">
          <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Slug"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="essay-…" /></Field>
          <div className="av-grid av-grid--2">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="essay">Essay</option>
                <option value="journal">Journal</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
              </Select>
            </Field>
          </div>
          <Field label="Category"><Input value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Image (path)"><Input value={form.image} onChange={(e) => set('image', e.target.value)} /></Field>
          <Field label="Excerpt"><Textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></Field>
        </div>
        <div className="av-card">
          <Field label="Body (paragraphs — blank line separates)" hint="Saved as a paragraph array.">
            <Textarea style={{ minHeight: 320 }} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
          </Field>
        </div>
      </div>
    </>
  );
}
