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
import { useJournalArticleMotion } from './hooks/useJournalArticleMotion';
import JournalAiContent from './sections/journalAi/JournalAiContent';

function CloseIcon(){return <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
export default function JournalAiApp(){
  useMenu(); useReveal(); usePageMotion(); useElevate(); useMobileChrome(); useHistoryClose(); useAnalytics(); useServiceWorker();
  useCmsSeo('/journal-what-a-year-of-ai-enabled-production-taught-me/', { title: 'AI-Enabled Production — Journal — Abhijeet Varghese' }); useJournalArticleMotion();
  return (
    <>
      <SiteChrome activePath="/journal-what-a-year-of-ai-enabled-production-taught-me/" />
      <a className="page-close" href="/journal/" data-history-close="" aria-label="Back to previous page"><CloseIcon /></a>
      <main id="main"><JournalAiContent /></main>
      <SiteFooter />
    </>
  );
}
