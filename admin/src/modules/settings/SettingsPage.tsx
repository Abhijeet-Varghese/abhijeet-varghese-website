import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContentDoc } from '@/hooks/useContentDoc';
import { contentApi } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { SaveStateBadge } from '@/components/SaveStateBadge';
import { Button, Field, Input, Textarea } from '@/ui/controls';
import { Spinner, ErrorState } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import { isDirty, type SaveState } from '@/state/editor';

interface SocialRow { id?: string; label?: string; href?: string }
interface SettingsForm {
  siteName: string; tagline: string; email: string; phone: string; availability: string;
  metaDescription: string; keywords: string; socials: SocialRow[];
}

const EMPTY: SettingsForm = { siteName: '', tagline: '', email: '', phone: '', availability: '', metaDescription: '', keywords: '', socials: [] };

/** Site settings — edits the real `content_store.settings` fields. */
export function SettingsPage() {
  const { can } = usePermissions();
  const { pushToast } = useUi();
  const doc = useContentDoc();
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [baseline, setBaseline] = useState<SettingsForm>(EMPTY);
  const [baseVersion, setBaseVersion] = useState<number | undefined>();
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!doc.data || loaded) return;
    const s = (doc.data.settings ?? {}) as Record<string, unknown>;
    const init: SettingsForm = {
      siteName: String(s.siteName ?? ''),
      tagline: String(s.tagline ?? ''),
      email: String(s.email ?? ''),
      phone: String(s.phone ?? ''),
      availability: String(s.availability ?? ''),
      metaDescription: String(s.metaDescription ?? ''),
      keywords: String(s.keywords ?? ''),
      socials: Array.isArray(s.socials) ? (s.socials as SocialRow[]) : [],
    };
    setForm(init);
    setBaseline(init);
    setBaseVersion(doc.data._versions?.['settings']);
    setLoaded(true);
  }, [doc.data, loaded]);

  const dirty = useMemo(() => isDirty(form, baseline), [form, baseline]);

  const save = useCallback(async () => {
    if (!doc.data || !can('settings.write')) return;
    setSaveState('saving');
    const next = { ...doc.data.settings, ...form };
    try {
      await contentApi.saveKey('settings', next, baseVersion);
      setSaveState('saved');
      pushToast('success', 'Settings saved (draft).');
      setBaseline(form);
      setBaseVersion((baseVersion ?? 0) + 1);
    } catch (e) {
      setSaveState('failed');
      pushToast('error', (e as Error).message);
    }
  }, [doc.data, can, form, baseVersion, pushToast]);

  if (doc.loading) return <Spinner label="Loading settings…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  return (
    <>
      <PageHeader
        title="Settings"
        sub="General, brand, SEO and social — the categories that exist today."
        actions={
          <>
            <SaveStateBadge state={dirty ? 'dirty' : saveState} />
            {can('settings.write') && <Button onClick={() => void save()} disabled={!dirty} loading={saveState === 'saving'}>Save</Button>}
          </>
        }
      />
      <div className="av-grid av-grid--2">
        <div className="av-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>General & brand</h3>
          <Field label="Site name"><Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} /></Field>
          <Field label="Tagline"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Availability"><Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} /></Field>
        </div>
        <div className="av-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>SEO & social</h3>
          <Field label="Meta description"><Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></Field>
          <Field label="Keywords"><Textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></Field>
          <Field label="Social profiles" hint="One per line: id|label|href">
            <Textarea
              value={form.socials.map((s) => `${s.id ?? ''}|${s.label ?? ''}|${s.href ?? ''}`).join('\n')}
              onChange={(e) => setForm({ ...form, socials: e.target.value.split('\n').filter(Boolean).map((line) => {
                const [id, label, href] = line.split('|');
                return { id, label, href };
              }) })}
            />
          </Field>
        </div>
      </div>
    </>
  );
}
