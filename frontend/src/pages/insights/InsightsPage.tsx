import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { EntryList } from '@/components/EntryList';
import { useSiteChrome } from '@/lib/scroll';
import { useContent } from '@/content/provider';

export function InsightsPage() {
  useSiteChrome();
  const { content } = useContent();
  const INSIGHTS = content.pages.INSIGHTS;
  const ESSAY_INDEX = content.articles.ESSAY_INDEX;
  return (
    <Layout activeHref="/insights" pageClose>
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
