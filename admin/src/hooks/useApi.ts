/**
 * AV OS admin — server-state fetch hook. Thin wrapper over the typed client
 * that exposes { data, loading, error, refetch } with user-safe error text.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/client';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  requestId: string | null;
  refetch: () => void;
}

export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fnRef.current()
      .then((d) => { if (active) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (!active) return;
        setLoading(false);
        if (e instanceof ApiError) {
          setError(e.safeMessage);
          setRequestId(e.requestId ?? null);
        } else {
          setError('Something went wrong.');
        }
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, requestId, refetch };
}
