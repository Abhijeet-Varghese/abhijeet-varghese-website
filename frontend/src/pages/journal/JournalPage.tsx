import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { EntryList } from '@/components/EntryList';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';

export function JournalPage() {
  useSiteChrome();
  const { content } = useContent();
  const JOURNAL_PAGE = content.pages.JOURNAL_PAGE;
  const JOURNAL_INDEX = content.articles.JOURNAL_INDEX;
  return (
    <Layout activeHref="journal.html" pageClose>
      <PageHero num={JOURNAL_PAGE.num} tag={JOURNAL_PAGE.tag} lede={JOURNAL_PAGE.lede}>
        {JOURNAL_PAGE.title[0]}
        <em>{JOURNAL_PAGE.title[1]}</em>
        {JOURNAL_PAGE.title[2]}
      </PageHero>
      <section className="page-section t-light">
        <EntryList entries={JOURNAL_INDEX} readLabel="Read the entry" />
      </section>
    </Layout>
  );
}
