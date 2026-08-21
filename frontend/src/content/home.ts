/**
 * Homepage content — extracted verbatim from the production index.html and
 * typed. This is the CMS-snapshot shape the Vite build consumes (see the PHP
 * publish snapshot pipeline in the migration notes).
 */

export interface CasePanel {
  id: string;
  image: string;
  alt: string;
  kicker: string;
  client: string;
  title: string;
  href: string;
  meta: { problem: string; approach: string; role: string; outcome: string };
  parallax: number;
}

export interface Era {
  index: string;
  name: string;
  note: string;
  future?: boolean;
}

export interface EssayLink {
  num: string;
  title: string;
  tag: string;
  href: string;
}

export const HERO = {
  seoLine: 'Making ambitious ideas impossible to misunderstand.',
  nameLines: ['Abhijeet', 'Varghese'] as const,
  portrait: {
    src: 'assets/hero-portrait.webp',
    alt: 'Editorial portrait of Abhijeet Varghese',
    width: 1024,
    height: 1024,
  },
  tagline: 'Making ambitious ideas impossible to misunderstand.',
  roles: ['Creative Systems Leader', 'Experience Design', 'Enterprise Innovation'],
  actions: {
    work: { label: 'Explore my work', href: '/case-studies' },
    resume: { label: 'Download résumé', href: 'assets/Abhijeet-Varghese-Resume.pdf' },
  },
  availability: 'Available for select projects — 2026',
  lede: 'The most meaningful work doesn\u0027t happen when strategy, design, technology, AI and people work separately. It happens when they work together.',
  marquee: [
    'Experience Design',
    'Creative Strategy',
    'Brand Systems',
    'Experience Centres',
    'Immersive Technology',
    'AI-Enabled Production',
    'Enterprise Innovation',
    'Creative Leadership',
  ],
};

export const CLIENTS = {
  num: '02',
  tag: 'Trust',
  title: 'Experiences built for.',
  lede:
    'Global enterprises, national institutions and culture-defining brands — organizations that trusted the work when it mattered.',
  logos: [
    { name: 'Amazon', file: 'amazon.webp' },
    { name: 'Orange Business', file: 'orange-business.webp' },
    { name: 'Indian Army', file: 'indian-army.webp' },
    { name: 'TATA Advanced Systems', file: 'tata-advanced-systems.webp' },
    { name: 'Indian Oil', file: 'indian-oil.webp' },
    { name: 'BPCL', file: 'bpcl.webp' },
    { name: 'Samsung SDS', file: 'samsung-sds.webp' },
    { name: 'Sony BBC Earth', file: 'sony-bbc-earth.webp' },
    { name: 'Nickelodeon', file: 'nickelodeon.webp' },
    { name: 'Rockwell Automation', file: 'rockwell-automation.webp' },
    { name: 'Govt. of Rajasthan', file: 'govt-of-rajasthan.webp' },
    { name: 'Metabloqs', file: 'metabloqs.webp' },
    { name: "Papa John's", file: 'papa-johns.webp' },
    { name: "Dunkin' Donuts", file: 'dunkin.webp' },
    { name: 'JK Lakshmi Cement', file: 'jk-lakshmi-cement.webp' },
    { name: 'Regional Express', file: 'regional-express.webp' },
  ],
  note:
    'Delivering work across enterprise, defence, manufacturing, technology, retail, aviation, government, media and emerging industries.',
};

export const CAPABILITIES = {
  num: '03',
  tag: 'Capabilities',
  title: {
    lead: "Complex challenges don't need more specialists.",
    em: 'They need people who can connect the dots.',
  },
  items: [
    {
      num: '01',
      title: 'Creative Strategy',
      description:
        'Direction before decoration. I turn ambiguity into a shared point of view — the idea everything else hangs on — so teams stop debating taste and start building against intent.',
    },
    {
      num: '02',
      title: 'Brand Systems',
      description:
        'Systems, not style guides. Identities engineered to survive real organizations — coherent across products, print, motion and environments, and simple enough for everyone else to use without me.',
    },
    {
      num: '03',
      title: 'Digital Products',
      description:
        'Interfaces that respect the person using them. From enterprise dashboards to consumer apps, I design products where the complexity lives in the system — never on the screen.',
    },
    {
      num: '04',
      title: 'Experience Centres',
      description:
        'Physical spaces where organizations explain themselves. I architect centres that turn strategy into something visitors can walk through, touch — and finally understand.',
    },
    {
      num: '05',
      title: 'Creative Leadership',
      description:
        'Teams make the work; leaders make the conditions. Mentoring, standards, reviews and rituals that raise the ceiling of what a creative team believes it can ship.',
    },
    {
      num: '06',
      title: 'AI-Enabled Creative Production',
      description:
        'Machines for momentum, humans for judgment. I design workflows where AI compresses weeks of exploration into days — while taste, ethics and craft remain unmistakably human.',
      feature: true,
    },
  ],
};

export const WORK = {
  num: '04',
  tag: 'Featured work',
  title: 'Work that had to be understood.',
  lede: 'Three engagements, chosen not for scale but for what they demanded — clarity where clarity was hardest.',
  cases: [
    {
      id: 'case-prj-1',
      image: 'assets/case-orange-experience-in-action.webp',
      alt: 'Orange Business Executive Briefing Center — Experience in Action case-study thumbnail',
      kicker: 'Experience Design & Creative Technology',
      client: 'Orange Business',
      title: 'Orange Business New Executive Briefing Center',
      href: 'experience-design/orange-business-executive-briefing-center/',
      parallax: 0,
      meta: {
        problem: 'Transform executive briefing into an experiential environment.',
        approach:
          'Connect business objectives, brand, visitor journey, content, technology and physical environment.',
        role: 'Experience Strategy & Creative Technology Lead',
        outcome:
          'A connected executive experience supporting engagement, demonstration, collaboration and evolving digital content.',
      },
    },
    {
      id: 'case-prj-2',
      image: 'assets/case-bpcl.webp',
      alt: 'BPCL — Energy & Industrial engagement',
      kicker: 'Energy & Industrial',
      client: 'BPCL',
      title: 'Intuitive Experiences for Industrial Environments',
      href: '/case-study-intuitive-experiences-for-industrial-environments',
      parallax: 0.05,
      meta: {
        problem:
          "Safety-critical operations ran on dense manuals and denser screens. Comprehension wasn't a nicety — it was risk management.",
        approach:
          'Intuitive interfaces and immersive walkthroughs of complex processes, designed to be understood under pressure.',
        role: 'Design Strategy & Experience Lead',
        outcome: 'Experiences operators trust at a glance — clarity measured in seconds, not slides.',
      },
    },
    {
      id: 'case-prj-3',
      image: 'assets/case-army.webp',
      alt: 'Indian Army — Defence & Immersive engagement',
      kicker: 'Defence & Immersive',
      client: 'Indian Army',
      title: 'Immersive Solutions for the Indian Army',
      href: '/case-study-immersive-solutions-for-the-indian-army',
      parallax: 0.05,
      meta: {
        problem:
          'Communication at enormous scale, under the highest stakes, asking for absolute precision and discipline.',
        approach:
          'Immersive storytelling and visualization pipelines where every frame is verified — built with the discipline of the institution it served.',
        role: 'Creative Lead — Immersive Solutions',
        outcome: 'Work where clarity, precision and execution mattered most — and delivered.',
      },
    },
  ] as CasePanel[],
};

export const THINKING = {
  num: '05',
  tag: 'Point of view',
  lede:
    'Every engagement I take on is a translation problem: turning what an organization knows into what its audience understands. Tools change quarterly; the human mind doesn\u0027t. So I design for the constant — attention, trust, memory — and let the tools serve it, never the other way around.',
  essays: [
    { num: '01', title: 'Technology Should Feel Human', tag: 'Design · 6 min', href: '/essay-technology-should-feel-human' },
    { num: '02', title: 'AI Isn\u0027t Replacing Creativity', tag: 'AI · 8 min', href: '/essay-ai-isnt-replacing-creativity' },
    { num: '03', title: 'Designing Experiences People Remember', tag: 'Experience · 7 min', href: '/essay-designing-experiences-people-remember' },
    { num: '04', title: 'Why Enterprise Experiences Fail', tag: 'Enterprise · 9 min', href: '/essay-why-enterprise-experiences-fail' },
  ] as EssayLink[],
  media: {
    src: 'assets/working-session.webp',
    alt: 'Working session with paper, sketches and conversation',
    caption: 'Where most projects actually begin — paper, questions and honest conversation.',
  },
};

export const JOURNEY = {
  num: '06',
  tag: 'Journey',
  title: 'Not a timeline. An evolution.',
  hint: 'Keep scrolling — the years unfold sideways',
  eras: [
    { index: '01', name: 'Graphic Design', note: 'Learning to see' },
    { index: '02', name: 'Animation', note: 'Learning to move' },
    { index: '03', name: 'Storytelling', note: 'Learning to mean' },
    { index: '04', name: 'Experience Design', note: 'Learning to orchestrate' },
    { index: '05', name: 'Immersive Tech', note: 'Learning to build worlds' },
    { index: '06', name: 'Creative Leadership', note: 'Learning to multiply others' },
    { index: '07', name: 'Enterprise Innovation', note: 'Learning to shift systems' },
    { index: '08', name: 'AI', note: 'Moving faster — deliberately' },
    { index: '09', name: 'Future', note: 'Still curious', future: true },
  ] as Era[],
  coda: 'The tools changed. The curiosity never did.',
};

export const AI_METHOD = {
  num: '07',
  tag: 'Method',
  title: { lead: 'Building with AI.', em: 'Thinking like a human.' },
  paragraphs: [
    "AI is the fastest collaborator I've ever worked with — and it still needs direction. I integrate it across research, ideation, storyboards, scripts, image generation, video generation, concept development and rapid prototyping.",
    "The point was never to make more. It's to see more options, sooner — and choose better. Every output passes through the same filter it always did: does a human being understand this, trust this, remember this?",
  ],
  chips: [
    'Research',
    'Ideation',
    'Storyboards',
    'Scripts',
    'Image Generation',
    'Video Generation',
    'Concept Development',
    'Rapid Prototyping',
  ],
  projects: [
    {
      title: 'The Virtual Life',
      description:
        'An AI-crafted narrative world — exploring how generated media can carry genuine emotional weight.',
    },
    {
      title: 'Immersive Wedding Invitation',
      description:
        'A platform that turns a wedding invitation into an explorable experience — AI-personalized for every guest.',
    },
  ],
  motto: '“AI accelerates the hands. It doesn\u0027t replace the head — or the heart.”',
  media: {
    src: 'assets/experience-centre.webp',
    alt: 'Enterprise experience centre — strategy made walkable',
    caption: 'An enterprise experience centre — strategy made walkable.',
  },
};

export const FOCUS = {
  num: '08',
  tag: 'Now',
  title: 'Current focus.',
  lede: 'If you have a hard problem and high standards, we should talk.',
  list: [
    { num: '01', label: 'Enterprise Innovation' },
    { num: '02', label: 'Creative Systems' },
    { num: '03', label: 'Experience Design' },
    { num: '04', label: 'AI-Enabled Creative Workflows' },
    { num: '05', label: 'Innovation Consulting' },
    { num: '06', label: 'Leadership' },
  ],
  openLabel: 'Open to',
  open: ['Leadership Roles', 'Enterprise Consulting', 'Innovation Partnerships', 'Speaking'],
  note: 'Every engagement starts the same way — an honest conversation about what actually needs to change.',
};

export const CONTACT = {
  num: '09',
  tag: 'Begin',
  title: 'Let\u0027s build something worth remembering.',
  lede:
    'One conversation is enough to know if this fits. Share the essentials, pick a time — the invite comes straight from my desk.',
  micro: [
    { label: 'Working', value: 'Worldwide · IST hours' },
    { label: 'Responds', value: 'Within 24 hours, personally' },
    { label: 'Email', value: 'hi@abhijeetvarghese.com', href: 'mailto:hi@abhijeetvarghese.com' },
    { label: 'Call / WhatsApp', value: '+91-96940 80706', href: 'tel:+919694080706' },
  ],
};
