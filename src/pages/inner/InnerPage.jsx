import { useEffect } from 'react';
import useContent from '../../hooks/useContent.js';
import usePageSeo from '../../hooks/usePageSeo.js';
import useLoader from '../../hooks/useLoader.js';
import useMenu from '../../hooks/useMenu.js';
import useReveal from '../../hooks/useReveal.js';
import useElevate from '../../hooks/useElevate.js';
import SiteChrome from '../../components/SiteChrome.jsx';
import SiteFooter from '../../components/SiteFooter.jsx';
import meta from '../../data/pageMeta.json';

const NOOP = () => {};

/** Shared shell for migrated inner pages: CMS chrome + footer, per-route SEO,
 *  legacy body class, global elevate/reveal/menu/loader behavior, plus the
 *  page's own interaction hook. */
export default function InnerPage({ name, hook, children }) {
  const m = meta[name] || {};
  const useHook = hook || NOOP;
  const { content } = useContent();
  usePageSeo(m, content && content.seo);
  useLoader(); useMenu(); useReveal([]); useElevate(); useHook();
  useEffect(() => {
    const prev = document.body.className;
    if (m.bodyClass) document.body.classList.add(...m.bodyClass.split(/\s+/).filter(Boolean));
    return () => { document.body.className = prev; };
  }, [m.bodyClass]);
  return (
    <>
      <SiteChrome content={content} />
      {children}
      <SiteFooter content={content} />
    </>
  );
}
