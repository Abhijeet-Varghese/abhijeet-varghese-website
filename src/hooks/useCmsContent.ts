import { useEffect, useState } from 'react';
import { getPublicContent, getPublicContentKey, type CmsDoc, type CmsKey } from '../lib/cms';

/**
 * useCmsContent — fetch CMS content with fallback.
 * Returns { data, loading, error, source }.
 * On API/DB failure returns fallback (hardcoded) so UI never breaks.
 */
export function useCmsContent<K extends CmsKey>(key: K, fallback?: unknown) {
  const [data, setData] = useState<unknown>(fallback ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'cms'|'fallback'>('fallback');
  // stringify fallback for dep check — safe as fallback is JSON-serializable CMS data
  const fallbackKey = JSON.stringify(fallback);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicContentKey(key);
        if (cancelled) return;
        if (res?.data && (Array.isArray(res.data) ? (res.data as unknown[]).length : Object.keys(res.data as object).length)) {
          setData(res.data);
          setSource('cms');
        } else {
          setData(fallback ?? null);
          setSource('fallback');
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setData(fallback ?? null);
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallbackKey]);

  return { data, loading, error, source };
}

export function useCmsDoc(fallbackDoc?: Partial<CmsDoc>) {
  const [doc, setDoc] = useState<Partial<CmsDoc> | null>(fallbackDoc ?? null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'cms'|'fallback'>('fallback');
  const fallbackKey = JSON.stringify(fallbackDoc);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPublicContent();
      if (cancelled) return;
      if (res?.data) { setDoc(res.data as Partial<CmsDoc>); setSource('cms'); }
      else { setDoc((fallbackKey ? JSON.parse(fallbackKey) as Partial<CmsDoc> : null) ?? null); setSource('fallback'); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fallbackKey]);
  return { doc, loading, source };
}
