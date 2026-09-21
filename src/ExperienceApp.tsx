import SiteChrome from './components/SiteChrome';
import SiteFooter from './components/SiteFooter';
import { useAnalytics } from './hooks/useAnalytics';
import { useElevate } from './hooks/useElevate';
import { useExperienceMotion } from './hooks/useExperienceMotion';
import { useHistoryClose } from './hooks/useHistoryClose';
import { useMenu } from './hooks/useMenu';
import { useMobileChrome } from './hooks/useMobileChrome';
import { usePageMotion } from './hooks/usePageMotion';
import { useReveal } from './hooks/useReveal';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useCmsSeo } from './hooks/useCmsSeo';
import ExperienceContent from './sections/experience/ExperienceContent';

function CloseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** React entry for the public Experience route. */
export default function ExperienceApp() {
  useMenu();
  useReveal();
  usePageMotion();
  useElevate();
  useMobileChrome();
  useExperienceMotion();
  useHistoryClose();
  useAnalytics();
  useServiceWorker();
  useCmsSeo('/experience/', { title: 'Experience — Abhijeet Varghese' });

  return (
    <>
      <SiteChrome activePath="/experience/" />
      <a className="page-close" href="/" data-history-close="" aria-label="Back to previous page"><CloseIcon /></a>
      <main id="main">
        <ExperienceContent />
      </main>
      <SiteFooter />
    </>
  );
}
