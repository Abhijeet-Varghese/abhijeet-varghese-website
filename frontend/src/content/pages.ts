import type { SeoData } from '@/types';
import type { LegalSection } from '@/types/domain';

const SITE = 'https://abhijeetvarghese.com';
const KEYWORDS =
  'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting';

interface SimplePageSeo {
  title: string;
  description: string;
  canonical: string;
  ldName: string;
}

function pageSeo({ title, description, canonical, ldName }: SimplePageSeo): SeoData {
  return {
    title,
    description,
    keywords: KEYWORDS,
    canonical,
    ogType: 'website',
    ogImage: `${SITE}/assets/hero-portrait.webp`,
    twitterCard: 'summary_large_image',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: ldName,
      url: canonical,
      inLanguage: 'en',
    },
  };
}

export const CONTACT_SEO = pageSeo({
  title: 'Start a Conversation — Abhijeet Varghese',
  description: 'Write or book an intro call.',
  canonical: `${SITE}/contact.html`,
  ldName: 'Contact',
});

export const CONSULTING_SEO = pageSeo({
  title: 'Consulting — Abhijeet Varghese',
  description: 'Clarity, as a service.',
  canonical: `${SITE}/consulting.html`,
  ldName: 'Consulting',
});

export const RECRUITERS_SEO = pageSeo({
  title: 'For Recruiters — Abhijeet Varghese',
  description: 'A design leader who ships.',
  canonical: `${SITE}/for-recruiters.html`,
  ldName: 'For Recruiters',
});

export const INSIGHTS_SEO = pageSeo({
  title: 'Insights & Essays — Abhijeet Varghese',
  description: 'Thinking out loud, on purpose.',
  canonical: `${SITE}/insights.html`,
  ldName: 'Insights',
});

export const JOURNAL_SEO = pageSeo({
  title: 'Journal — Abhijeet Varghese',
  description: 'Notes from the workbench.',
  canonical: `${SITE}/journal.html`,
  ldName: 'Journal',
});

export const SEARCH_SEO = pageSeo({
  title: 'Search — Abhijeet Varghese',
  description: 'Search the portfolio: projects, case studies, essays and journal entries.',
  canonical: `${SITE}/search.html`,
  ldName: 'Search',
});

export const PRIVACY_SEO = pageSeo({
  title: 'Privacy Policy — Abhijeet Varghese',
  description: 'Plain English about your data.',
  canonical: `${SITE}/privacy-policy.html`,
  ldName: 'Privacy Policy',
});

export const TERMS_SEO = pageSeo({
  title: 'Terms of Use — Abhijeet Varghese',
  description: 'The fine print, without the fog.',
  canonical: `${SITE}/terms.html`,
  ldName: 'Terms of Use',
});

export const NOT_FOUND_SEO: SeoData = {
  title: 'Page not found — Abhijeet Varghese',
  description: 'The page you were looking for does not exist.',
  keywords: KEYWORDS,
  canonical: `${SITE}/404.html`,
  ogType: 'website',
  ogImage: `${SITE}/assets/hero-portrait.webp`,
  twitterCard: 'summary_large_image',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '404',
    url: `${SITE}/404.html`,
    inLanguage: 'en',
  },
};

/* ---------- page content ---------- */

export const CONSULTING = {
  num: '08',
  tag: 'Consulting',
  title: ['Clarity, ', 'as a service', '.'] as const,
  lede: "Hard problem, high standards, tight timeline? That's the work I'm built for.",
  prose:
    'Most organizations don\'t need more decoration — they need <strong>direction</strong>. I work as a creative systems partner: translating strategy into experiences, building the systems that keep them coherent, and standing them up with the teams that will run them.',
  focus: [
    'Creative Strategy — the idea everything hangs on',
    'Brand Systems — identities that survive real organizations',
    'Digital Products — complexity in the system, never on the screen',
    'Experience Centres — strategy made walkable',
    'AI-Enabled Workflows — weeks of exploration in days',
  ],
  card: {
    heading: 'Every engagement starts the same way',
    body: 'An honest conversation about what actually needs to change — then a plan, a team and a standard. If you have a hard problem and high standards, we should talk.',
  },
};

export const RECRUITERS = {
  num: '07',
  tag: 'For Recruiters',
  title: ['A design leader who ', 'ships', '.'] as const,
  lede: "If you're hiring for creative direction, design leadership or innovation roles — here's what I bring and how to reach me.",
  prose: [
    'I lead the kind of work most teams find hardest: <strong>complex, ambiguous, high-stakes</strong>. Twelve-plus years across experience design, enterprise innovation, immersive technology and AI-enabled creative production — with a track record of building teams, standards and rituals that raise the ceiling of what a creative organization can ship.',
    "I've delivered for global enterprises, national institutions and culture-defining brands — from enterprise technology platforms and safety-critical industrial environments to immersive defence training and national-scale communication. I design <strong>systems</strong> — brand, product, experience, team — not just artefacts.",
    "I'm open to leadership roles that need someone who can connect strategy, design, technology and AI — and make it all feel human.",
  ],
  card: {
    heading: 'Currently open to',
    body: 'Full résumé available on request — or download it directly.',
    chips: ['Design Leadership', 'Creative Direction', 'Head of Experience', 'Enterprise Innovation', 'Consulting', 'Speaking'],
  },
};

export const INSIGHTS = {
  num: '05',
  tag: 'Insights',
  title: ['Thinking out loud, ', 'on purpose', '.'] as const,
  lede: 'Notes from the edge of design, technology and enterprise — written to be argued with, not just read.',
};

export const JOURNAL_PAGE = {
  num: '06',
  tag: 'Journal',
  title: ['Notes from the ', 'workbench', '.'] as const,
  lede: 'Unpolished, honest, dated. The thinking that happens between projects.',
};

export const PRIVACY: LegalSection[] = [
  {
    heading: '1. What we collect',
    body: 'When you contact me — by email, phone, or the booking calendar — you share what you choose to share: your name, email address, organization and the details of your inquiry. That\u0027s it.',
  },
  {
    heading: '2. Booking',
    body: 'Intro call requests are submitted directly through this site and stored in AV OS. Your name, email, organization, context and preferred date/time are used only to arrange the conversation; no third-party scheduler is opened.',
  },
  {
    heading: '3. Cookies & analytics',
    body: 'This site does not run third-party advertising or tracking analytics. If a privacy-conscious analytics tool is added later, this policy will be updated first.',
  },
  {
    heading: '4. What we do with your information',
    body: 'Reply to you. Arrange meetings. Keep a record of what we discussed so the next conversation starts from memory, not scratch. We do not sell, rent or trade personal information.',
  },
  {
    heading: '5. Your rights',
    body: 'You can ask what data I hold about you, ask for it to be corrected, or ask for it to be deleted — at any time, no forms, just write: hi@abhijeetvarghese.com',
  },
  {
    heading: '6. Changes',
    body: 'If this policy changes, the date below updates. Last revised: August 2026.',
  },
];

export const PRIVACY_PAGE = {
  num: '10',
  tag: 'Legal',
  title: ['Plain English about ', 'your data', '.'] as const,
  lede: 'This site collects as little as possible, and never sells anything.',
};

export const TERMS: LegalSection[] = [
  {
    heading: '1. Use of this site',
    body: 'This site is a portfolio and professional resource. You may browse, share links and reference the work with attribution. Scraping, reselling or misrepresenting the content is not permitted.',
  },
  {
    heading: '2. Intellectual property',
    body: 'All work shown here — design, copy, imagery and concepts — belongs to Abhijeet Varghese or the organizations the work was created for. Client logos remain the property of their owners.',
  },
  {
    heading: '3. No guarantees',
    body: 'Content is provided as is for information. Nothing on this site constitutes professional advice or an offer of employment or engagement.',
  },
  {
    heading: '4. Booking',
    body: "Booked calls are confirmed by email. Life happens — rescheduling is one message away, and no-shows are treated with the same grace we'd ask for.",
  },
  {
    heading: '5. Contact',
    body: 'Questions about these terms? hi@abhijeetvarghese.com. Last revised: August 2026.',
  },
];

export const TERMS_PAGE = {
  num: '11',
  tag: 'Legal',
  title: ['The fine print, ', 'without the fog', '.'] as const,
  lede: 'Short version: be respectful, ask before reusing, and everything here is provided as-is.',
};
