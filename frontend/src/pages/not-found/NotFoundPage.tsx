import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';

/** Designed 404 page — never a plaintext "Not found". */
export function NotFoundPage() {
  useSiteChrome();
  return (
    <Layout pageClose>
      <PageHero
        tag="Not found"
        index="404"
        lede={
          <>
            The link may be old or mistyped. Head back to the <a href="/">homepage</a> or{' '}
            <a href="/case-studies">browse the work</a>.
          </>
        }
      >
        This page <em>doesn&rsquo;t exist.</em>
      </PageHero>
    </Layout>
  );
}
