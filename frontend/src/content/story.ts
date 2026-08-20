/**
 * Story page (About) content — extracted verbatim from production story.html.
 * NOTE on typography: production uses straight apostrophes (') throughout
 * EXCEPT two Evolution card notes which use curly (’) — preserved exactly.
 */

export interface EvoCard {
  act: string;
  world: string;
  image?: string;
  alt?: string;
  meta: string;
  category?: string;
  note: string;
  title: [string, string, string];
  serif?: boolean;
  desc?: string;
  stmt?: string;
  system?: string[];
  duo?: { span: string; strong: [string, string] };
  mark?: string;
}

export const EVOLUTION_CARDS: EvoCard[] = [
  {
    act: '01',
    world: 'motion',
    image: 'assets/about/about-motion.webp',
    alt: 'Motion — dedicated About visual',
    meta: 'Motion',
    category: 'FRAME · TIMING · MOVEMENT',
    note: 'The frame starts moving. Time becomes a material.',
    title: ['I LEARNED ', 'TO THINK ', 'IN TIME. '],
    desc: 'VFX and animation taught me movement, rhythm, composition and visual storytelling.',
  },
  {
    act: '02',
    world: 'interaction',
    image: 'assets/about/about-experience.webp',
    alt: 'Interaction — dedicated About visual',
    meta: 'Interaction',
    category: 'BEHAVIOUR · RESPONSE · INTUITION',
    note: 'The work moves beyond passive viewing.',
    title: ['THEN THE ', 'FRAME STARTED ', 'RESPONDING. '],
    desc: 'I became interested in how people move, interact, notice and understand.',
  },
  {
    act: '03',
    world: 'environment',
    image: 'assets/about/about-environment.webp',
    alt: 'Environment — dedicated About visual',
    meta: 'Environment',
    category: 'SPACE · SCALE · ATMOSPHERE',
    note: 'The screen wasn’t enough.',
    title: ['THEN THE ', "SCREEN WASN'T ", 'ENOUGH. '],
    desc: 'I started thinking about space, atmosphere, scale and how environments communicate.',
    stmt: 'SPACE HAS A NARRATIVE TOO.',
  },
  {
    act: '04',
    world: 'experience',
    image: 'assets/about/about-experience.webp',
    alt: 'Experience — dedicated About visual',
    meta: 'Experience',
    category: 'STORY · SYSTEM · TECHNOLOGY · REALITY',
    note: 'Design isn’t only what people see — it’s what they feel.',
    title: ['THEN EVERYTHING ', 'HAD TO ', 'WORK TOGETHER. '],
    desc: 'Story, interaction, space, technology, content and production became one problem.',
    system: ['STORY', 'AUDIENCE', 'INTERACTION', 'SPACE', 'TECHNOLOGY', 'PRODUCTION', 'REALITY'],
  },
  {
    act: '05',
    world: 'people',
    image: 'assets/about/about-people.webp',
    alt: 'People — dedicated About visual',
    meta: 'People',
    category: 'COLLABORATION · DIRECTION · EMPATHY',
    note: 'The work is ultimately about people.',
    title: ['BECAUSE EXPERIENCES ', 'ARE FOR ', 'PEOPLE. '],
    desc: 'The work became about bringing different disciplines and people around one idea.',
  },
  {
    act: '06',
    world: 'leadership',
    image: 'assets/about/about-leadership.webp',
    alt: 'Creative Leadership — dedicated About visual',
    meta: 'Creative Leadership',
    category: 'IDEA · TEAM · EXECUTION',
    note: 'Direction, story, technology and execution — together.',
    title: ['THEN THE WORK ', 'BECAME BIGGER THAN ', 'THE IDEA. '],
    desc: 'Creative direction, collaboration, production and execution had to hold together in the real world.',
    duo: { span: 'Does it look good?', strong: ['Does it ', 'work?'] },
  },
  {
    act: '07',
    world: 'interlude',
    meta: 'Interlude',
    note: 'The distance',
    title: ['THE DISTANCE BETWEEN ', 'THE IDEA AND ', 'REALITY. '],
    serif: true,
    mark: '✦ ✦ ✦',
  },
  {
    act: '08',
    world: 'interlude',
    meta: 'Interlude',
    note: 'The survival',
    title: ['GOOD IDEAS ', 'HAVE TO ', 'SURVIVE REALITY. '],
    serif: true,
    mark: '✦ ✦ ✦',
  },
];

export interface PrologueLine {
  text: string;
  outline: boolean;
  shift: boolean;
}

export const PROLOGUE: {
  roles: string[];
  lede: string;
  titleLines: [PrologueLine, PrologueLine, PrologueLine];
} = {
  roles: ['Creative Direction', 'Experience Design', 'Immersive Technology', 'Visual Storytelling'],
  lede: 'VFX and animation were my entry point. Eventually, I started thinking about the whole experience.',
  titleLines: [
    { text: "I DIDN'T", outline: false, shift: false },
    { text: 'START OUT', outline: false, shift: true },
    { text: 'DESIGNING EXPERIENCES.', outline: true, shift: false },
  ],
};

export const IDENTITY = {
  statement: ['I design experiences', 'by thinking beyond the frame.'],
  beats: [
    {
      num: '01',
      text: 'I started in VFX and animation, learning to think through frames, movement, composition and visual storytelling.',
    },
    {
      num: '02',
      text: 'Over time, the frame became interaction, interaction became environment, and environment became the whole experience.',
    },
    {
      num: '03',
      text: 'Today, I work across creative direction, experience design, immersive technology, visual storytelling and execution — turning complex ideas into experiences people can understand, feel and remember.',
    },
  ],
  question: ['How should this be ', 'experienced?'],
  portrait: { src: 'assets/hero-portrait.webp', alt: 'Editorial portrait of Abhijeet Varghese' },
  numbers: [
    { value: '12', suffix: '+', label: 'Years of practice' },
    { value: '65', suffix: '+', label: 'Clients served' },
    { value: '100', suffix: '+', label: 'Projects delivered' },
  ],
  facts: [
    { label: 'Education', line: 'BA — VFX & Animation' },
    {
      label: 'Continuously learning',
      list: ['What Is the Metaverse — Meta', 'Digital Business Strategy — University of Virginia', 'Digital Transformation — Specialization'],
    },
    {
      label: 'Works across',
      list: [
        'Creative Direction',
        'Experience Design',
        'Immersive Experiences',
        'Visual Storytelling',
        'Motion',
        'Spatial / Environmental Experiences',
        'Brand Experiences',
        'Creative Leadership',
        'Production & Execution',
      ],
      cols: true,
    },
  ],
  credo: {
    title: "I'm a creative person first.",
    lines: ['Technology is part of my vocabulary.', 'Design is part of my foundation.', 'Animation is part of how I think.', 'Experience is where they come together.'],
  },
  zoomLabels: ['Frame', 'Interaction', 'Environment', 'Experience'],
  zoomImage: 'assets/about/about-environment.webp',
};

export const WHAT = {
  eyebrow: 'What I actually do',
  title: ['I take complicated things', 'and figure out how people should experience them.'],
  items: ['Films', 'Interactive Experiences', 'VR/XR', 'Experience Centres', 'Physical Installations', 'Brand Systems'],
};

export const NOW = {
  eyebrow: 'Now',
  title: ['Hard problems.', 'Ambitious ideas.', 'Experiences with a reason to exist.'],
  copy: "I'm interested in work where design, technology, story and people have to come together — and where the idea matters as much as the execution.",
};

export const CURIOUS = {
  title: 'Still curious.',
  items: [
    'Still learning.',
    'Still looking at films differently.',
    'Still noticing how spaces work.',
    'Still getting distracted by interesting interfaces.',
    'Still curious about what technology can become.',
  ],
  note: "That's probably what hasn't changed.",
};

export const CREDITS = {
  quote: "That's the work I'm interested in.",
  role: 'Creative Director & Experience Designer',
  sig: '— Abhijeet Varghese',
  cta: { label: 'Start a conversation', href: 'contact.html' },
};

export const COMPASS_ACTS = [
  { act: '01', name: 'Motion' },
  { act: '02', name: 'Interaction' },
  { act: '03', name: 'Environment' },
  { act: '04', name: 'Experience' },
  { act: '05', name: 'People' },
  { act: '06', name: 'Creative Leadership' },
];
