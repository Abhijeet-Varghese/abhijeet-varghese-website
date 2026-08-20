import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';
import type { LegalSection } from '@/types/domain';

/** Shared legal page (Privacy Policy / Terms of Use). */
export function LegalPage({
  activeHref,
  num,
  title,
  lede,
  sections,
}: {
  activeHref: string;
  num: string;
  title: readonly [string, string, string];
  lede: string;
  sections: LegalSection[];
}) {
  useSiteChrome();
  return (
    <Layout activeHref={activeHref} pageClose>
      <PageHero num={num} tag="Legal" lede={lede}>
        {title[0]}
        <em>{title[1]}</em>
        {title[2]}
      </PageHero>
      <section className="page-section t-light">
        <div className="container">
          <div className="prose" data-reveal-group data-dbase=".1">
            {sections.flatMap((s) => [
              <h3 data-reveal key={`h-${s.heading}`}>
                {s.heading}
              </h3>,
              <p data-reveal key={`p-${s.heading}`}>
                {s.body}
              </p>,
            ])}
          </div>
        </div>
      </section>
    </Layout>
  );
}
