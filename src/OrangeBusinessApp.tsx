import SiteChrome from './components/SiteChrome';
import SiteFooter from './components/SiteFooter';
import { useAnalytics } from './hooks/useAnalytics';
import { useElevate } from './hooks/useElevate';
import { useHistoryClose } from './hooks/useHistoryClose';
import { useMenu } from './hooks/useMenu';
import { useMobileChrome } from './hooks/useMobileChrome';
import { useOrangeBusinessMotion } from './hooks/useOrangeBusinessMotion';
import { usePageMotion } from './hooks/usePageMotion';
import { useReveal } from './hooks/useReveal';
import { useServiceWorker } from './hooks/useServiceWorker';
import OrangeBusinessContent from './sections/case-studies/OrangeBusinessContent';

function CloseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function OrangeBusinessApp() {
  useMenu();
  useReveal();
  usePageMotion();
  useElevate();
  useMobileChrome();
  useHistoryClose();
  useAnalytics();
  useServiceWorker();
  useOrangeBusinessMotion();

  return (
    <>
      <SiteChrome activePath="/case-studies/orange-business/" />
      <a className="page-close" href="/case-studies/" data-history-close="" aria-label="Back to Case Studies">
        <CloseIcon />
      </a>
      <main id="main" className="ob-page">
        <OrangeBusinessContent />
      </main>
      <SiteFooter />
    </>
  );
}
