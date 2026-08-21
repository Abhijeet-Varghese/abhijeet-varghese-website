import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContentDoc } from '@/hooks/useContentDoc';
import { contentApi } from '@/api/content';
import { PageHeader } from '@/components/PageHeader';
import { SaveStateBadge } from '@/components/SaveStateBadge';
import { Button, Field, Input } from '@/ui/controls';
import { Spinner, ErrorState } from '@/ui/feedback';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import { isDirty, type SaveState } from '@/state/editor';

interface NavLinkRow { id?: string; label: string; href: string; page?: string; cta?: boolean }

interface NavModel {
  primary: NavLinkRow[];
  cta: { label: string; href: string };
}

/** Navigation management — edits the real `content_store.nav` primary links. */
export function NavigationPage() {
  const { can } = usePermissions();
  const { pushToast } = useUi();
  const doc = useContentDoc();
  const [primary, setPrimary] = useState<NavLinkRow[]>([]);
  const [cta, setCta] = useState({ label: '', href: '' });
  const [baseline, setBaseline] = useState<{ primary: NavLinkRow[]; cta: { label: string; href: string } }>({ primary: [], cta: { label: '', href: '' } });
  const [baseVersion, setBaseVersion] = useState<number | undefined>();
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!doc.data || loaded) return;
    const nav = (doc.data.nav ?? {}) as Record<string, unknown>;
    const p = Array.isArray(nav.primary) ? (nav.primary as NavLinkRow[]) : [];
    const c = (nav.cta ?? {}) as { label: string; href: string };
    const init = { primary: p, cta: { label: c.label ?? '', href: c.href ?? '' } };
    setPrimary(p);
    setCta(init.cta);
    setBaseline(init);
    setBaseVersion(doc.data._versions?.['nav']);
    setLoaded(true);
  }, [doc.data, loaded]);

  const current = useMemo<NavModel>(() => ({ primary, cta }), [primary, cta]);
  const dirty = useMemo(() => isDirty(current, baseline), [current, baseline]);

  const updateLink = useCallback((i: number, k: keyof NavLinkRow, v: string) => {
    setPrimary((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  }, []);

  const save = useCallback(async () => {
    if (!doc.data || !can('content.write')) return;
    setSaveState('saving');
    const nextNav = { ...doc.data.nav, primary, cta };
    try {
      await contentApi.saveKey('nav', nextNav, baseVersion);
      setSaveState('saved');
      pushToast('success', 'Navigation saved (draft).');
      setBaseline({ primary, cta });
      setBaseVersion((baseVersion ?? 0) + 1);
    } catch (e) {
      setSaveState('failed');
      pushToast('error', (e as Error).message);
    }
  }, [doc.data, can, primary, cta, baseVersion, pushToast]);

  if (doc.loading) return <Spinner label="Loading navigation…" />;
  if (doc.error) return <ErrorState message={doc.error} requestId={doc.requestId} onRetry={doc.refetch} />;

  return (
    <>
      <PageHeader
        title="Navigation"
        sub="Primary navigation links. Drag/drop ordering arrives with the builder."
        actions={
          <>
            <SaveStateBadge state={dirty ? 'dirty' : saveState} />
            {can('content.write') && <Button onClick={() => void save()} disabled={!dirty} loading={saveState === 'saving'}>Save</Button>}
          </>
        }
      />
      <div className="av-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Primary links</h3>
        {primary.map((l, i) => (
          <div className="av-grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }} key={l.id ?? i}>
            <Input value={l.label} onChange={(e) => updateLink(i, 'label', e.target.value)} aria-label={`Link ${i + 1} label`} />
            <Input value={l.href} onChange={(e) => updateLink(i, 'href', e.target.value)} aria-label={`Link ${i + 1} URL`} />
          </div>
        ))}
        <div className="av-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
          <Field label="CTA label"><Input value={cta.label} onChange={(e) => setCta({ ...cta, label: e.target.value })} /></Field>
          <Field label="CTA href"><Input value={cta.href} onChange={(e) => setCta({ ...cta, href: e.target.value })} /></Field>
        </div>
      </div>
    </>
  );
}
