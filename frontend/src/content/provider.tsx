/**
 * AV OS — CMSContentProvider + useContent (Phase 3 §4).
 *
 * The React entry point for runtime content. Mount <CMSContentProvider> once
 * near the root; it attempts the runtime load on mount and exposes the merged
 * content document + state through context. `useContent()` reads it.
 *
 * The provider is deliberately tolerant: if the API is unavailable it serves
 * the static snapshot (the site never renders blank), and it exposes state so
 * a fallback is observable rather than silent.
 */
import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { contentLoader, initContent, type ContentState } from './loader';
import { STATIC_CONTENT, type ContentDocument } from './static-snapshot';

export interface CmsContentContextValue {
  content: ContentDocument;
  state: ContentState;
  /** force a revalidation (e.g. after a publish event) */
  revalidate: () => Promise<void>;
}

const CmsContentContext = createContext<CmsContentContextValue>({
  content: STATIC_CONTENT,
  state: { phase: 'idle', source: 'static', reason: '', etag: null, revision: null, fetchedAt: null, fetchMs: null, runtimeLoads: 0 },
  revalidate: async () => {},
});

export function CMSContentProvider({ children }: { children: ReactNode }): ReactElement {
  const [content, setContent] = useState<ContentDocument>(() => contentLoader.content);
  const [state, setState] = useState<ContentState>(() => contentLoader.state);

  useEffect(() => {
    let cancelled = false;
    void initContent().then(() => {
      if (cancelled) return;
      setContent(contentLoader.content);
      setState(contentLoader.state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const revalidate = async (): Promise<void> => {
    await contentLoader.revalidate();
    setContent(contentLoader.content);
    setState(contentLoader.state);
  };

  return (
    <CmsContentContext.Provider value={{ content, state, revalidate }}>
      {children}
    </CmsContentContext.Provider>
  );
}

/** Read the current content document + state from context. */
export function useContent(): CmsContentContextValue {
  return useContext(CmsContentContext);
}

/** Render-prop accessor for non-hook call sites / tests. */
export function ContentConsumer(props: { children: (value: CmsContentContextValue) => ReactNode }): ReactElement {
  return <CmsContentContext.Consumer>{(v) => props.children(v)}</CmsContentContext.Consumer>;
}
