import SiteChrome from './components/SiteChrome';
import SiteFooter from './components/SiteFooter';
import { useAnalytics } from './hooks/useAnalytics';
import { useElevate } from './hooks/useElevate';
import { useHistoryClose } from './hooks/useHistoryClose';
import { useMenu } from './hooks/useMenu';
import { useMobileChrome } from './hooks/useMobileChrome';
import { usePageMotion } from './hooks/usePageMotion';
import { useReveal } from './hooks/useReveal';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useCmsSeo } from './hooks/useCmsSeo';
import { useSearchMotion } from './hooks/useSearchMotion';
import SearchContent from './sections/search/SearchContent';

function CloseIcon(){return <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
export default function SearchApp(){
  useMenu(); useReveal(); usePageMotion(); useElevate(); useMobileChrome(); useHistoryClose(); useAnalytics(); useServiceWorker();
  useCmsSeo('/search/', { title: 'Search — Abhijeet Varghese' }); useSearchMotion();
  return (
    <>
      <SiteChrome activePath="/search/" />
      <a className="page-close" href="/" data-history-close="" aria-label="Back to previous page"><CloseIcon /></a>
      <main id="main"><SearchContent /></main>
      <SiteFooter />
    </>
  );
}
