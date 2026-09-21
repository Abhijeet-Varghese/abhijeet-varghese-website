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
import { useStoryMotion } from './hooks/useStoryMotion';
import StoryContent from './sections/story/StoryContent';

function CloseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** React entry for the clean public Story route. */
export default function StoryApp() {
  useMenu();
  useReveal();
  usePageMotion();
  useElevate();
  useMobileChrome();
  useStoryMotion();
  useHistoryClose();
  useAnalytics();
  useServiceWorker();

  return (
    <>
      <SiteChrome activePath="/story/" />
      <a className="page-close" href="/" data-history-close="" aria-label="Back to previous page"><CloseIcon /></a>
      <main id="main">
        <StoryContent />
      </main>
      <SiteFooter />
    </>
  );
}
