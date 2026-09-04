import type { SeoData } from '@/types';

/** A published project (case study) — mirrors the CMS `projects` snapshot. */
export type ProjectStatus = 'published' | 'coming-soon';

export interface Project {
  slug: string;
  client: string;
  category: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  portfolioAlt: string;
  role: string;
  year: string;
  summary: string;
  problem: string;
  approach: string;
  outcome: string;
  status: ProjectStatus;
  index: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'orange-business-executive-briefing-center',
    client: 'Orange Business',
    category: 'Experience Design & Creative Technology',
    title: 'Orange Business New Executive Briefing Center',
    href: 'experience-design/orange-business-executive-briefing-center/',
    image: 'assets/case-orange-experience-in-action.webp',
    imageAlt: 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail',
    portfolioAlt: 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail',
    role: 'Experience Strategy & Creative Technology Lead',
    year: '2025',
    summary: 'A strategy-led physical-digital experience created for executive engagement, product storytelling, immersive demonstration and collaboration.',
    problem: 'Transform executive briefing into an experiential environment.',
    approach: 'Connect business objectives, brand, visitor journey, content, technology and physical environment.',
    outcome: 'A connected executive experience supporting engagement, demonstration, collaboration and evolving digital content.',
    status: 'published',
    index: '01',
  },
  {
    slug: 'intuitive-experiences-for-industrial-environments',
    client: 'BPCL',
    category: 'Energy & Industrial',
    title: 'Making the Future Visible',
    href: '/case-study-intuitive-experiences-for-industrial-environments',
    image: 'assets/case-bpcl.webp',
    imageAlt: 'BPCL Palakkad Installation — Making the Future Visible',
    portfolioAlt: 'BPCL Palakkad Installation — Making the Future Visible',
    role: 'Project Director / Creative Lead',
    year: '2025',
    summary: 'An end-to-end industrial visualization project transforming a planned BPCL installation into a highly detailed physical miniature and a detailed 3D architectural walkthrough.',
    problem: 'How do you show a facility before it exists?',
    approach: 'Translate the BPCL installation layout into connected physical and digital visualization experiences.',
    outcome: 'One site expressed through three levels of understanding: technical plan, physical place and digital experience.',
    status: 'published',
    index: '02',
  },
  {
    slug: 'immersive-solutions-for-the-indian-army',
    client: 'Indian Army',
    category: 'Defence & Immersive',
    title: 'Immersive Solutions for the Indian Army',
    href: '/case-study-immersive-solutions-for-the-indian-army',
    image: 'assets/case-army.webp',
    imageAlt: 'Indian Army — Defence & Immersive engagement',
    portfolioAlt: 'Immersive Solutions for the Indian Army — Indian Army',
    role: 'Creative Lead — Immersive Solutions',
    year: '2025',
    summary: 'Creating immersive solutions where clarity, precision and execution matter most.',
    problem: 'Communication at enormous scale, under the highest stakes, asking for absolute precision and discipline.',
    approach: 'Immersive storytelling and visualization pipelines where every frame is verified — built with the discipline of the institution it served.',
    outcome: 'Work where clarity, precision and execution mattered most — and delivered.',
    status: 'coming-soon',
    index: '03',
  },
];

export const PORTFOLIO_SEO: SeoData = {
  title: 'Portfolio — Abhijeet Varghese | Experience Design & Creative Direction',
  description: 'Selected portfolio work across experience design, creative direction, immersive technology, enterprise communication and spatial experiences.',
  keywords: 'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: 'https://abhijeetvarghese.com/portfolio.html',
  ogType: 'website',
  ogImage: 'https://abhijeetvarghese.com/assets/hero-portrait.webp',
  twitterCard: 'summary_large_image',
  jsonLd: {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Portfolio', url: 'https://abhijeetvarghese.com/portfolio.html', inLanguage: 'en',
    hasPart: [
      { '@type': 'CreativeWork', name: 'Orange Business New Executive Briefing Center', about: 'Experience Design & Creative Technology', image: 'https://abhijeetvarghese.com/assets/case-orange-experience-in-action.webp', url: 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/' },
      { '@type': 'CreativeWork', name: 'Making the Future Visible', about: 'Energy & Industrial', image: 'https://abhijeetvarghese.com/assets/case-bpcl.webp', url: 'https://abhijeetvarghese.com/case-study-intuitive-experiences-for-industrial-environments.html' },
      { '@type': 'CreativeWork', name: 'Immersive Solutions for the Indian Army', about: 'Defence & Immersive', image: 'https://abhijeetvarghese.com/assets/case-army.webp', url: 'https://abhijeetvarghese.com/case-study-immersive-solutions-for-the-indian-army.html' },
    ],
  },
};

export const CASE_STUDIES_SEO: SeoData = {
  title: 'Case Studies — Abhijeet Varghese', description: 'Work that had to be understood.',
  keywords: 'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: 'https://abhijeetvarghese.com/case-studies.html', ogType: 'website', ogImage: 'https://abhijeetvarghese.com/assets/hero-portrait.webp', twitterCard: 'summary_large_image',
  jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Case Studies', url: 'https://abhijeetvarghese.com/case-studies.html', inLanguage: 'en' },
};

const SEO_KEYWORDS = 'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting';

export function comingSoonSeo(p: Project): SeoData {
  const canonical = `https://abhijeetvarghese.com/${p.href}`;
  const title = `${p.title} — Abhijeet Varghese`;
  return {
    title, description: p.summary, keywords: SEO_KEYWORDS, canonical, ogType: 'website', ogTitle: title, ogDescription: p.summary,
    ogImage: `https://abhijeetvarghese.com/${p.image}`, twitterCard: 'summary_large_image',
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, description: p.summary, url: canonical, isPartOf: { '@type': 'CollectionPage', name: 'Case Studies', url: 'https://abhijeetvarghese.com/case-studies.html' }, inLanguage: 'en' },
  };
}
