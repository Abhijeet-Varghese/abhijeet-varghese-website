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
import { useStaticMotion } from './hooks/useStaticMotion';
import TermsContent from './sections/terms/TermsContent';

function CloseIcon(){return <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
export default function TermsApp(){
  useMenu(); useReveal(); usePageMotion(); useElevate(); useMobileChrome(); useHistoryClose(); useAnalytics(); useServiceWorker();
  useCmsSeo('/terms/', { title: 'Terms — Abhijeet Varghese' }); useStaticMotion();
  return (
    <>
      <SiteChrome activePath="/terms/" />
      <a className="page-close" href="/" data-history-close="" aria-label="Back to previous page"><CloseIcon /></a>
      <main id="main"><TermsContent /></main>
      <SiteFooter />
    </>
  );
}
