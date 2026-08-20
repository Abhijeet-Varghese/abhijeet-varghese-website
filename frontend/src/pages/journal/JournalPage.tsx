import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { EntryList } from '@/components/EntryList';
import { useSiteChrome } from '@/lib/scroll';
import { JOURNAL_PAGE } from '@/content/pages';
import { JOURNAL_INDEX } from '@/content/articles';

export function JournalPage() {
  useSiteChrome();
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
