import { useEffect, useState } from 'react';
import { getContent } from '../api/client.js';

/** CMS content with lifecycle state: loading → ready | fallback (snapshot). */
export default function useContent() {
  const [state, setState] = useState({ status: 'loading', content: null, fallback: false, version: null });
  useEffect(() => {
    let alive = true;
    getContent().then((d) => { if (alive) setState({ status: d.fallback ? 'fallback' : 'ready', content: d.content, fallback: d.fallback, version: d.version }); })
      .catch(() => { /* getContent already falls back to the snapshot */ });
    return () => { alive = false; };
  }, []);
  return state;
}
