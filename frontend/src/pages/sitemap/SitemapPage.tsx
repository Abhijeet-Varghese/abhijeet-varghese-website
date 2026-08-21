import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';

const LINKS: { href: string; title: string; meta: string }[] = [
  { href: '/story', title: 'About', meta: 'Page · 22 blocks' },
  { href: '/experience', title: 'Experience', meta: 'Page · 7 blocks' },
  { href: '/case-studies', title: 'Case Studies', meta: 'Page · 2 blocks' },
  { href: '/portfolio', title: 'Portfolio', meta: 'Page · 0 blocks' },
  { href: '/contact', title: 'Contact', meta: 'Page · 2 blocks' },
  { href: '/insights', title: 'Insights', meta: 'Page · 2 blocks' },
  { href: '/journal', title: 'Journal', meta: 'Page · 2 blocks' },
  { href: '/for-recruiters', title: 'For Recruiters', meta: 'Page · 3 blocks' },
  { href: '/consulting', title: 'Consulting', meta: 'Page · 4 blocks' },
  { href: '/sitemap', title: 'Sitemap', meta: 'Page · 2 blocks' },
  { href: '/privacy-policy', title: 'Privacy Policy', meta: 'Page · 2 blocks' },
  { href: '/terms', title: 'Terms', meta: 'Page · 2 blocks' },
  { href: '/essay-technology-should-feel-human', title: 'Technology Should Feel Human', meta: 'Essay · Design' },
  { href: '/essay-ai-isnt-replacing-creativity', title: "AI Isn't Replacing Creativity", meta: 'Essay · AI' },
  { href: '/essay-designing-experiences-people-remember', title: 'Designing Experiences People Remember', meta: 'Essay · Experience' },
  { href: '/essay-why-enterprise-experiences-fail', title: 'Why Enterprise Experiences Fail', meta: 'Essay · Enterprise' },
  { href: '/journal-what-a-year-of-ai-enabled-production-taught-me', title: 'What a year of AI-enabled production taught me', meta: 'Journal · Journal' },
  { href: '/journal-the-experience-centre-as-a-strategic-instrument', title: 'The experience centre as a strategic instrument', meta: 'Journal · Journal' },
  { href: 'experience-design/orange-business-executive-briefing-center/', title: 'Orange Business New Executive Briefing Center', meta: 'Case Study · Orange Business' },
  { href: '/case-study-intuitive-experiences-for-industrial-environments', title: 'Intuitive Experiences for Industrial Environments', meta: 'Case Study · BPCL' },
  { href: '/case-study-immersive-solutions-for-the-indian-army', title: 'Immersive Solutions for the Indian Army', meta: 'Case Study · Indian Army' },
  { href: 'assets/Abhijeet-Varghese-Resume.pdf', title: 'Download résumé', meta: 'PDF' },
];

export function SitemapPage() {
  useSiteChrome();
  return (
    <Layout activeHref="/sitemap" pageClose>
      <PageHero num="09" tag="Sitemap" lede="If you&apos;re looking for it, it&apos;s here.">
        Every corner of this <em>site</em>.
      </PageHero>
      <section className="page-section t-light">
        <div className="container">
          <div className="sitemap-grid" data-reveal-group data-dbase=".1">
            {LINKS.map((l) => (
              <a href={l.href} data-reveal key={l.href}>
                <strong>{l.title}</strong>
                <span>{l.meta}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
