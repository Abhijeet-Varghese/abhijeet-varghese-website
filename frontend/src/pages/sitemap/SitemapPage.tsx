import { Layout } from '@/components/Layout';
import { PageHero } from '@/components/PageHero';
import { useSiteChrome } from '@/lib/scroll';

const LINKS: { href: string; title: string; meta: string }[] = [
  { href: 'story.html', title: 'About', meta: 'Page · 22 blocks' },
  { href: 'experience.html', title: 'Experience', meta: 'Page · 7 blocks' },
  { href: 'case-studies.html', title: 'Case Studies', meta: 'Page · 2 blocks' },
  { href: 'portfolio.html', title: 'Portfolio', meta: 'Page · 0 blocks' },
  { href: 'contact.html', title: 'Contact', meta: 'Page · 2 blocks' },
  { href: 'insights.html', title: 'Insights', meta: 'Page · 2 blocks' },
  { href: 'journal.html', title: 'Journal', meta: 'Page · 2 blocks' },
  { href: 'for-recruiters.html', title: 'For Recruiters', meta: 'Page · 3 blocks' },
  { href: 'consulting.html', title: 'Consulting', meta: 'Page · 4 blocks' },
  { href: 'sitemap.html', title: 'Sitemap', meta: 'Page · 2 blocks' },
  { href: 'privacy-policy.html', title: 'Privacy Policy', meta: 'Page · 2 blocks' },
  { href: 'terms.html', title: 'Terms', meta: 'Page · 2 blocks' },
  { href: 'essay-technology-should-feel-human.html', title: 'Technology Should Feel Human', meta: 'Essay · Design' },
  { href: 'essay-ai-isnt-replacing-creativity.html', title: "AI Isn't Replacing Creativity", meta: 'Essay · AI' },
  { href: 'essay-designing-experiences-people-remember.html', title: 'Designing Experiences People Remember', meta: 'Essay · Experience' },
  { href: 'essay-why-enterprise-experiences-fail.html', title: 'Why Enterprise Experiences Fail', meta: 'Essay · Enterprise' },
  { href: 'journal-what-a-year-of-ai-enabled-production-taught-me.html', title: 'What a year of AI-enabled production taught me', meta: 'Journal · Journal' },
  { href: 'journal-the-experience-centre-as-a-strategic-instrument.html', title: 'The experience centre as a strategic instrument', meta: 'Journal · Journal' },
  { href: 'experience-design/orange-business-executive-briefing-center/', title: 'Orange Business New Executive Briefing Center', meta: 'Case Study · Orange Business' },
  { href: 'case-study-intuitive-experiences-for-industrial-environments.html', title: 'Intuitive Experiences for Industrial Environments', meta: 'Case Study · BPCL' },
  { href: 'case-study-immersive-solutions-for-the-indian-army.html', title: 'Immersive Solutions for the Indian Army', meta: 'Case Study · Indian Army' },
  { href: 'assets/Abhijeet-Varghese-Resume.pdf', title: 'Download résumé', meta: 'PDF' },
];

export function SitemapPage() {
  useSiteChrome();
  return (
    <Layout activeHref="sitemap.html" pageClose>
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
