import type { Article, IndexEntry } from '@/types/domain';
import type { SeoData } from '@/types';

const SITE = 'https://abhijeetvarghese.com';

/** Build Article JSON-LD + OG/Twitter from a published article record. */
function articleSeo(a: Omit<Article, 'seo'>): SeoData {
  const type = a.kind === 'essay' ? 'Article' : 'Article';
  return {
    title: a.title,
    description: a.excerpt,
    keywords:
      'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
    canonical: `${SITE}/${a.slug}.html`,
    ogType: 'article',
    ogImage: `${SITE}/${a.image}`,
    twitterCard: 'summary_large_image',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': type,
      headline: a.title,
      author: { '@type': 'Person', name: 'Abhijeet Varghese' },
      datePublished: a.date,
      image: `${SITE}/${a.image}`,
      url: `${SITE}/${a.slug}.html`,
      inLanguage: 'en',
    },
  };
}

interface RawArticle {
  slug: string;
  kind: 'essay' | 'journal';
  title: string;
  excerpt: string;
  tag: string;
  image: string;
  imageAlt: string;
  paragraphs: string[];
  date: string;
  backLabel: string;
  backHref: string;
  related?: { title: string; href: string; label: string };
}

const RAW: RawArticle[] = [
  {
    slug: 'essay-technology-should-feel-human',
    kind: 'essay',
    title: 'Technology Should Feel Human',
    excerpt: 'The most advanced systems fail when they forget the person holding them.',
    tag: 'Design · 6 min',
    image: 'assets/essay-01.webp',
    imageAlt: 'Artwork for “Technology Should Feel Human”',
    paragraphs: [
      'Every technology starts life as a promise. Somewhere between the promise and the rollout, the human being quietly leaves the room.',
      '',
      "I've spent twelve years inside that translation problem. The pattern repeats everywhere — the system is powerful, the people are smart, and the experience is still alienating.",
      '',
      'What does a human interface actually mean? It means respecting attention, which is finite. It means earning trust, which takes repeated, honest behaviour. And it means designing for memory — because the only interface people carry is the one in their heads.',
      '',
      "Technology evolves every day. Human understanding doesn't. That asymmetry is the brief.",
    ],
    date: '2026-07-12',
    backLabel: '← All insights',
    backHref: '/insights',
  },
  {
    slug: 'essay-ai-isnt-replacing-creativity',
    kind: 'essay',
    title: "AI Isn't Replacing Creativity",
    excerpt: 'Machines compress exploration; humans still do judgment.',
    tag: 'AI · 8 min',
    image: 'assets/essay-02.webp',
    imageAlt: 'Artwork for “AI Isn\'t Replacing Creativity”',
    paragraphs: [
      "Every few decades a tool arrives that seems to make craft obsolete. Photography didn't kill painting — it relocated the argument.",
      '',
      'What AI actually compresses is exploration. The first 80 percent of any creative task can now happen in minutes instead of weeks.',
      '',
      'But exploration was never the hard part. The hard part was always judgment: knowing which variation deserves to exist.',
      '',
      'So the new workflow looks like this: machines for momentum, humans for judgment.',
    ],
    date: '2026-06-20',
    backLabel: '← All insights',
    backHref: '/insights',
  },
  {
    slug: 'essay-designing-experiences-people-remember',
    kind: 'essay',
    title: 'Designing Experiences People Remember',
    excerpt: 'Memory is the real medium.',
    tag: 'Experience · 7 min',
    image: 'assets/essay-03.webp',
    imageAlt: 'Artwork for “Designing Experiences People Remember”',
    paragraphs: [
      'Ask anyone what they remember about a great launch. Not the average minutes — the peak, and the ending.',
      '',
      'Designing for memory also means designing for retelling. An experience that can be told as a story propagates.',
      '',
      'So I design for the moments people will retell. A single honest moment beats a hundred polished ones.',
    ],
    date: '2026-05-15',
    backLabel: '← All insights',
    backHref: '/insights',
    related: { title: 'Why Enterprise Experiences Fail', href: '/essay-why-enterprise-experiences-fail', label: 'Essay' },
  },
  {
    slug: 'essay-why-enterprise-experiences-fail',
    kind: 'essay',
    title: 'Why Enterprise Experiences Fail',
    excerpt: 'Jargon, org charts and inherited complexity — the three silent killers.',
    tag: 'Enterprise · 9 min',
    image: 'assets/essay-04.webp',
    imageAlt: 'Artwork for “Why Enterprise Experiences Fail”',
    paragraphs: [
      "Enterprise experiences don't fail for lack of talent or budget. They fail for three quieter reasons, and all three are translation failures.",
      '',
      'The first killer is jargon. The second is the org chart. The third is inherited complexity.',
      '',
      'The fix is the same for all three: treat clarity as a first-class requirement.',
    ],
    date: '2026-04-02',
    backLabel: '← All insights',
    backHref: '/insights',
    related: { title: 'Designing Experiences People Remember', href: '/essay-designing-experiences-people-remember', label: 'Essay' },
  },
  {
    slug: 'journal-what-a-year-of-ai-enabled-production-taught-me',
    kind: 'journal',
    title: 'What a year of AI-enabled production taught me',
    excerpt: 'Compression is the real gift.',
    tag: 'Journal · 4 min',
    image: 'assets/journal-01.webp',
    imageAlt: 'Artwork for “What a year of AI-enabled production taught me”',
    paragraphs: [
      "Twelve months into running AI-enabled production pipelines, the headline lesson is not about the technology at all. It's about where the human hours went: not into making, but into deciding.",
    ],
    date: '2026-08-04',
    backLabel: '← All journal entries',
    backHref: '/journal',
    related: { title: 'The experience centre as a strategic instrument', href: '/journal-the-experience-centre-as-a-strategic-instrument', label: 'Journal' },
  },
  {
    slug: 'journal-the-experience-centre-as-a-strategic-instrument',
    kind: 'journal',
    title: 'The experience centre as a strategic instrument',
    excerpt: 'The best centres are decision rooms, not showrooms.',
    tag: 'Journal · 3 min',
    image: 'assets/journal-02.webp',
    imageAlt: 'Artwork for “The experience centre as a strategic instrument”',
    paragraphs: [
      'Most experience centres are built backwards. The centres that matter are built as decision rooms — places where the organization confronts its own strategy made visible.',
    ],
    date: '2026-06-11',
    backLabel: '← All journal entries',
    backHref: '/journal',
    related: { title: 'What a year of AI-enabled production taught me', href: '/journal-what-a-year-of-ai-enabled-production-taught-me', label: 'Journal' },
  },
];

const ARTICLE_DIMS = { imageWidth: 1376, imageHeight: 768 };

export const ARTICLES: Article[] = RAW.map((r) => {
  const a: Omit<Article, 'seo'> = { ...r, ...ARTICLE_DIMS };
  return { ...a, seo: articleSeo(a) };
});

export const ARTICLES_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export const ESSAYS: Article[] = ARTICLES.filter((a) => a.kind === 'essay');
export const JOURNAL: Article[] = ARTICLES.filter((a) => a.kind === 'journal');

/** Index (listing) entries in production order. */
export const ESSAY_INDEX: IndexEntry[] = ESSAYS.map((a, i) => ({
  num: String(i + 1).padStart(2, '0'),
  title: a.title,
  tag: a.tag,
  excerpt: a.excerpt,
  href: `${a.slug}.html`,
}));

export const JOURNAL_INDEX: IndexEntry[] = JOURNAL.map((a, i) => ({
  num: String(i + 1).padStart(2, '0'),
  title: a.title,
  tag: a.tag,
  excerpt: a.excerpt,
  href: `${a.slug}.html`,
}));
