import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { EntryList } from '@/components/EntryList';
import { useSiteChrome } from '@/lib/scroll';
import { INSIGHTS } from '@/content/pages';
import { ESSAY_INDEX } from '@/content/articles';

export function InsightsPage() {
  useSiteChrome();
  return (
    <Layout activeHref="insights.html" pageClose>
      <PageHero num={INSIGHTS.num} tag={INSIGHTS.tag} lede={INSIGHTS.lede}>
        {INSIGHTS.title[0]}
        <em>{INSIGHTS.title[1]}</em>
        {INSIGHTS.title[2]}
      </PageHero>
      <section className="page-section t-light">
        <EntryList entries={ESSAY_INDEX} readLabel="Read the essay" />
      </section>
    </Layout>
  );
}
