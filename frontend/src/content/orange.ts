import type { SeoData } from '@/types';

/**
 * Orange Business New Executive Briefing Center — long-form case study content.
 * Transcribed verbatim from the production page (client-specific orange/black
 * visual world). Curly apostrophes/quotes preserved exactly where the
 * production source uses them.
 */

const M = 'assets/media';

export const ORANGE_SEO: SeoData = {
  title: 'Orange Business Experience Center & Executive Briefing Center | Abhijeet Varghese',
  description:
    "Explore Abhijeet Varghese's Orange Business Executive Briefing Center in Mumbai — a physical-digital experience combining experience strategy, interactive media, XR, VR, creative technology, spatial experience and enterprise collaboration.",
  keywords:
    'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/',
  ogType: 'website',
  ogTitle: 'Orange Business New Executive Briefing Center | Abhijeet Varghese',
  ogDescription:
    'A strategy-led physical-digital experience combining experience strategy, interactive media, XR, VR, creative technology and executive collaboration.',
  ogImage: `${'https://abhijeetvarghese.com'}/${M}/orange-business-executive-briefing-center-mumbai-panoramic.jpeg`,
  ogImageAlt: 'Orange Business New Executive Briefing Center in Mumbai',
  twitterCard: 'summary_large_image',
  themeColor: '#070707',
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://abhijeetvarghese.com/#person',
        name: 'Abhijeet Varghese',
        url: 'https://abhijeetvarghese.com/',
        jobTitle: 'Experience Strategy & Creative Technology Lead',
        knowsAbout: [
          'Experience Strategy',
          'Experience Design',
          'Creative Technology',
          'Immersive Experience',
          'XR',
          'VR',
          'Experience Centers',
          'Executive Briefing Centers',
          'Interactive Experience',
          'Spatial Experience',
          'Enterprise Experience',
        ],
      },
      {
        '@type': 'CreativeWork',
        '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#project',
        name: 'Orange Business New Executive Briefing Center',
        creator: { '@id': 'https://abhijeetvarghese.com/#person' },
        locationCreated: { '@type': 'Place', name: 'Mumbai, India' },
        about: [
          'Experience Design',
          'Experience Strategy',
          'Creative Technology',
          'Interactive Experience Design',
          'Immersive Experience Design',
          'Executive Briefing Center',
        ],
        image: { '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#hero-image' },
      },
      {
        '@type': 'Article',
        '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#article',
        headline: 'Orange Business New Executive Briefing Center',
        description:
          'Case study documenting the experience strategy, creative technology, interactive media, XR, content and physical-digital experience behind the Orange Business New Executive Briefing Center in Mumbai.',
        author: { '@id': 'https://abhijeetvarghese.com/#person' },
        about: { '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#project' },
        mainEntityOfPage: { '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#webpage' },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#webpage',
        url: 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/',
        name: 'Orange Business Experience Center & Executive Briefing Center',
        description:
          'A strategy-led physical-digital experience for executive engagement, product storytelling, immersive demonstration and collaboration.',
        breadcrumb: { '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#breadcrumb' },
        mainEntity: { '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#article' },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://abhijeetvarghese.com/' },
          { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://abhijeetvarghese.com/case-studies.html' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Orange Business Executive Briefing Center',
            item: 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/',
          },
        ],
      },
      {
        '@type': 'ImageObject',
        '@id': 'https://abhijeetvarghese.com/experience-design/orange-business-executive-briefing-center/#hero-image',
        contentUrl: 'https://abhijeetvarghese.com/assets/media/orange-business-executive-briefing-center-mumbai-panoramic.jpeg',
        caption: 'Panoramic view of the Orange Business New Executive Briefing Center in Mumbai',
      },
    ],
  },
};

/** Prefix every URL in a `srcset` string with `base` (handles comma-separated candidates). */
export function withBaseSrcset(base: string, s: string): string {
  return s
    .split(', ')
    .map((part) => {
      const idx = part.indexOf(' ');
      if (idx === -1) return base + part;
      return base + part.slice(0, idx) + part.slice(idx);
    })
    .join(', ');
}

/** Base-relative media paths are prefixed with '../../' at render time. */
export interface OrangeHotspot {
  className: string;
  label: string;
  title: string;
  copy: string;
}

export const ORANGE_HOTSPOTS: OrangeHotspot[] = [
  {
    className: 'registration',
    label: 'REGISTRATION',
    title: 'Registration',
    copy: 'The first digital touchpoint and identity layer of the visitor journey.',
  },
  {
    className: 'rotoscope',
    label: 'ROTOSCOPE',
    title: 'Rotoscope',
    copy: 'A kinetic display where physical movement changes the digital content state.',
  },
  {
    className: 'wall',
    label: 'VIDEO WALL',
    title: 'Video Wall',
    copy: 'A multifunctional executive interface for presentation, interaction and collaboration.',
  },
  {
    className: 'vr',
    label: 'VR',
    title: 'VR',
    copy: 'An immersive product-knowledge experience centered on the custom Orange chair.',
  },
];

export interface OrangeRoleStep {
  num: string;
  label: string;
  copy: string;
}

export const ORANGE_ROLE_CHAIN: OrangeRoleStep[] = [
  { num: '01', label: 'STRATEGY', copy: 'Client consultancy, business requirements and experience direction.' },
  { num: '02', label: 'EXPERIENCE', copy: 'Visitor journey, interaction and personalization.' },
  {
    num: '03',
    label: 'CONTENT',
    copy: 'Storyboards, visual design, video, voice-over, presentations and interactive content.',
  },
  { num: '04', label: 'TECHNOLOGY', copy: 'XR, interactive systems, AV, conferencing and dynamic content.' },
  {
    num: '05',
    label: 'LEADERSHIP',
    copy: 'Senior stakeholders, Mumbai and Gurgaon teams, vendors and implementation partners.',
  },
  { num: '06', label: 'SITE', copy: 'Fabrication, installation, testing, refinement and delivery.' },
];

export interface OrangeJourneyStep {
  num: string;
  /** capitalized stage title (used in the stage h3 + button data-title) */
  title: string;
  /** uppercase button label */
  label: string;
  copy: string;
  image: string;
  srcset: string;
}

export const ORANGE_JOURNEY: OrangeJourneyStep[] = [
  {
    num: '01',
    title: 'Arrive',
    label: 'ARRIVE',
    copy: 'The visitor enters a deliberately controlled executive environment.',
    image: `${M}/orange-business-visitor-registration-touchscreen-848.webp`,
    srcset: `${M}/orange-business-visitor-registration-touchscreen-480.webp 480w, ${M}/orange-business-visitor-registration-touchscreen-848.webp 848w`,
  },
  {
    num: '02',
    title: 'Recognize',
    label: 'RECOGNIZE',
    copy: 'Registration establishes identity and the potential for a personalized visit.',
    image: `${M}/orange-business-visitor-registration-touchscreen-848.webp`,
    srcset: `${M}/orange-business-visitor-registration-touchscreen-480.webp 480w, ${M}/orange-business-visitor-registration-touchscreen-848.webp 848w`,
  },
  {
    num: '03',
    title: 'Activate',
    label: 'ACTIVATE',
    copy: 'Presence detection moves the room from standby into an active experience state.',
    image: `${M}/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp`,
    srcset: `${M}/orange-business-executive-briefing-center-mumbai-panoramic-640.webp 640w, ${M}/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp 1280w`,
  },
  {
    num: '04',
    title: 'Explore',
    label: 'EXPLORE',
    copy: 'The Rotoscope turns physical movement into digital content navigation.',
    image: `${M}/orange-business-rotoscope-experience-848.webp`,
    srcset: `${M}/orange-business-rotoscope-experience-480.webp 480w, ${M}/orange-business-rotoscope-experience-848.webp 848w`,
  },
  {
    num: '05',
    title: 'Immerse',
    label: 'IMMERSE',
    copy: 'VR transforms product knowledge into an immersive experience.',
    image: `${M}/orange-business-vr-experience-848.webp`,
    srcset: `${M}/orange-business-vr-experience-480.webp 480w, ${M}/orange-business-vr-experience-848.webp 848w`,
  },
  {
    num: '06',
    title: 'Connect',
    label: 'CONNECT',
    copy: 'The video wall supports presentation, collaboration and conferencing.',
    image: `${M}/orange-business-interactive-video-wall-848.webp`,
    srcset: `${M}/orange-business-interactive-video-wall-480.webp 480w, ${M}/orange-business-interactive-video-wall-848.webp 848w`,
  },
  {
    num: '07',
    title: 'Converse',
    label: 'CONVERSE',
    copy: 'Technology recedes into the background as executive discussion begins.',
    image: `${M}/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp`,
    srcset: `${M}/orange-business-executive-briefing-center-mumbai-panoramic-640.webp 640w, ${M}/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp 1280w`,
  },
];

/** Default wide-media-copy paragraph (before any video-wall mode is selected). */
export const ORANGE_WALL_DEFAULT_COPY =
  'The interactive video wall became a multifunctional executive interface for presentation, demonstration, media playback, online conferencing and PC workflows.';

export interface OrangeArchNode {
  title: string;
  what: string;
  experience: string;
  business: string;
}

export const ORANGE_ARCH_NODES: OrangeArchNode[] = [
  {
    title: 'Registration',
    what: 'Captures visitor information at the beginning of the visit.',
    experience: 'Establishes identity and enables personalization.',
    business: 'Creates more contextual executive engagement.',
  },
  {
    title: 'Rotoscope',
    what: 'Connects display position to digital content states.',
    experience: 'Makes content navigation physical and memorable.',
    business: 'Supports more engaging product storytelling.',
  },
  {
    title: 'Video Wall',
    what: 'Unifies presentation, media, touch and conferencing.',
    experience: 'Creates one large-format collaboration interface.',
    business: 'Supports multiple executive use cases.',
  },
  {
    title: 'VR',
    what: 'Delivers immersive product-knowledge modules.',
    experience: 'Turns complex concepts into spatial experience.',
    business: 'Supports sales enablement.',
  },
  {
    title: 'Sensors',
    what: 'Detect room occupancy and visitor presence.',
    experience: 'Triggers the responsive environment.',
    business: 'Creates controlled automated room operation.',
  },
  {
    title: 'Automation',
    what: 'Coordinates curtains, lighting and active room state.',
    experience: 'Makes the room respond without manual setup.',
    business: 'Reduces operational friction.',
  },
  {
    title: 'Conferencing',
    what: 'Connects the room to remote specialists and teams.',
    experience: 'Extends collaboration beyond the physical center.',
    business: 'Provides access to distributed expertise.',
  },
];

export interface OrangePurpose {
  label: string;
  value: string;
  experience: string;
  business: string;
}

export const ORANGE_PURPOSE: OrangePurpose[] = [
  { label: 'REGISTRATION', value: 'PERSONALIZATION', experience: 'A personalized visitor journey.', business: 'More contextual executive engagement.' },
  { label: 'SENSORS', value: 'RESPONSE', experience: 'A room that responds to presence.', business: 'Automated and controlled room operation.' },
  { label: 'ROTOSCOPE', value: 'INTERACTION', experience: 'Physical navigation through digital content.', business: 'More engaging product storytelling.' },
  { label: 'VIDEO WALL', value: 'COLLABORATION', experience: 'Presentation, interaction and remote collaboration.', business: 'One interface for multiple executive use cases.' },
  { label: 'VR', value: 'IMMERSION', experience: 'Immersive product understanding.', business: 'Product knowledge and sales enablement.' },
  { label: 'BACKEND', value: 'CONTINUITY', experience: 'Continuously editable digital content.', business: 'Long-term platform flexibility.' },
];

export interface OrangeVideoMode {
  label: string;
  copy: string;
}

export const ORANGE_VIDEO_MODES: OrangeVideoMode[] = [
  { label: 'PRESENT', copy: 'Executive presentations supported by large-format media and professional audio.' },
  { label: 'DEMONSTRATE', copy: 'Product and solution storytelling through rich media and playback.' },
  { label: 'INTERACT', copy: 'Touch-driven exploration turns the wall into an enterprise interface.' },
  { label: 'CONNECT', copy: 'Conferencing connects the room to remote experts and teams.' },
];

export const ORANGE_SUMMARY = {
  title: 'Orange Business New Executive Briefing Center',
  rows: [
    ['CLIENT', 'Orange Business'],
    ['PROJECT', 'New Executive Briefing Center'],
    ['CHALLENGE', 'Transform executive briefing into an experiential environment.'],
    ['APPROACH', 'Connect business objectives, brand, visitor journey, content, technology and physical environment.'],
    ['SOLUTION', 'A responsive physical-digital experience platform.'],
    ['MY ROLE', 'Strategy → Creative Direction → Technology → Content → Leadership → Delivery.'],
    ['OUTCOME', 'A connected executive experience supporting engagement, demonstration, collaboration and evolving digital content.'],
  ] as [string, string][],
};

export const ORANGE_PROJECT_STRIP = [
  ['01', 'Executive Briefing Center'],
  ['02', 'Physical + Digital Experience'],
  ['03', 'Responsive Environment'],
  ['04', 'Interactive Media + VR'],
  ['05', 'Dynamic Content Platform'],
] as [string, string][];
