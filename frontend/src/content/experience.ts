import type { SeoData } from '@/types';

const SITE = 'https://abhijeetvarghese.com';

export const EXPERIENCE_SEO: SeoData = {
  title: 'Experience — Abhijeet Varghese | Creative Director & Experience Designer',
  description:
    "Where I've worked, what I've led, and how my responsibilities have evolved — from creative project management to creative direction across immersive, AR/VR and experience design.",
  keywords:
    'Abhijeet Varghese, creative director, experience design, enterprise innovation, UX design, design leadership, brand experience, immersive technology, AI design, creative strategy, experience centre, design consulting',
  canonical: `${SITE}/experience.html`,
  ogType: 'website',
  ogImage: `${SITE}/assets/hero-portrait.webp`,
  twitterCard: 'summary_large_image',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: 'Experience — Abhijeet Varghese',
    url: `${SITE}/experience.html`,
    inLanguage: 'en',
  },
};

export interface ExperienceJob {
  date: string;
  role: string;
  roleSub?: string;
  company: string;
  location?: string;
  image?: { src: string; alt: string; width: number; height: number };
  summary: string;
  disciplines: string[];
  responsibilities: string[];
  moreResponsibilities: string[];
  lead?: boolean;
  last?: boolean;
}

export const EXPERIENCE_JOBS: ExperienceJob[] = [
  {
    date: 'Sep 2024 — Jan 2026',
    role: 'Creative Head',
    roleSub: 'Immersive & Brand Systems',
    company: 'RAMS Creative Technologies',
    location: 'Jaipur',
    image: {
      src: 'assets/experience-centre.webp',
      alt: 'An enterprise experience centre — strategy made walkable.',
      width: 640,
      height: 427,
    },
    summary:
      'Led creative direction for experience centres and immersive storytelling environments, developing spatial concepts, experience frameworks and visual strategies while directing multidisciplinary teams across design, animation, XR development and interactive media.',
    disciplines: [
      'Creative Direction', 'Experience Design', 'Graphic Design', 'Art Direction', 'Brand Systems',
      'Motion Graphics', 'Animation', 'VFX / Visual Effects', 'Visual Storytelling', 'AR', 'VR', 'XR',
      'Interactive Media', 'Spatial Experience', 'Immersive Experiences', 'Team Leadership', 'Production',
    ],
    responsibilities: [
      'Led creative direction for enterprise experience centres, immersive environments and brand systems.',
      'Developed creative concepts, visual directions and initial spatial experience frameworks.',
      'Translated client briefs and business requirements into creative concepts, experience narratives and visual communication systems.',
      'Worked directly with clients and stakeholders to understand requirements, present concepts and establish creative direction.',
      'Directed multidisciplinary teams across graphic design, visual design, animation, motion graphics, XR development and interactive media production where required.',
      'Guided the development of visual storytelling environments for technology, enterprise, industrial and immersive applications.',
    ],
    moreResponsibilities: [
      'Contributed to experience-centre planning, spatial concepts, visitor journeys and immersive storytelling.',
      'Directed interactive and immersive experiences, including AR, VR and XR experiences.',
      'Provided art direction across graphic design, visual communication, motion design, animation and experiential media.',
      'Guided the creation of visual assets and communication materials supporting physical and digital experiences.',
      'Translated complex technical and engineering information into clear visual narratives.',
      'Reviewed design, animation, motion and immersive outputs to maintain creative consistency and quality.',
      'Guided production execution across multiple creative disciplines.',
      'Coordinated creative requirements between clients, designers, animators, developers, XR specialists and production teams.',
      'Presented experience concepts, visual strategies, storyboards and creative solutions to stakeholders.',
      'Provided creative direction from concept development through execution and final delivery.',
      'Supported immersive storytelling, VR modules, interactive displays and experiential environments.',
      'Oversaw creative quality across multidisciplinary production pipelines.',
    ],
    lead: true,
  },
  {
    date: 'Jan 2024 — May 2024',
    role: 'Creative Head',
    roleSub: 'AR/VR Platform & Experience Design',
    company: 'PlugXR Reality',
    summary:
      'Led creative direction for AR/VR platform experiences and immersive product demonstrations, developing storytelling frameworks and guiding teams creating interactive AR/VR modules in collaboration with product teams.',
    disciplines: [
      'Creative Direction', 'AR', 'VR', 'Experience Design', 'Interaction Design', 'Visual Design',
      'Visual Storytelling', 'Immersive Experience', 'Product Collaboration', 'Creative Reviews', 'Team Leadership',
    ],
    responsibilities: [
      'Led creative direction for AR/VR platform experiences, demonstrations and immersive product presentations.',
      'Developed storytelling frameworks for communicating AR/VR products and capabilities.',
      'Developed concepts and interaction approaches for interactive AR and VR modules.',
      'Guided teams working on AR/VR experience development.',
      'Collaborated with product teams to align creative concepts with platform capabilities, usability and user requirements.',
      'Developed visual and experiential approaches for enterprise AR/VR demonstrations.',
    ],
    moreResponsibilities: [
      'Designed visual storytelling systems for immersive product communication.',
      'Reviewed AR/VR experiences from a creative and usability perspective.',
      'Conducted creative reviews to ensure clarity, consistency and quality.',
      'Structured immersive experiences so complex technology could be communicated clearly to users and stakeholders.',
      'Supported enterprise presentations and demonstrations through immersive storytelling.',
      'Contributed to AR experience modules and immersive case studies.',
      'Worked across visual design, interaction concepts and immersive experience development.',
      'Guided creative teams through concept development, iteration and final presentation.',
    ],
  },
  {
    date: 'Oct 2022 — Jan 2024',
    role: 'Creative Director',
    roleSub: 'Experience & Innovation Consultant',
    company: 'Independent',
    image: {
      src: 'assets/working-session.webp',
      alt: 'Where projects begin — paper, questions and honest conversation.',
      width: 640,
      height: 427,
    },
    summary:
      'Provided independent creative direction and experience consulting across design, animation, immersive media and experiential environments, working directly with clients, distributed creative teams and vendors.',
    disciplines: [
      'Creative Direction', 'Creative Consulting', 'Graphic Design', 'Branding', 'Art Direction',
      'Motion Graphics', 'Animation', 'VFX', 'Video', 'Photography / Shooting', 'Visual Storytelling',
      'Interactive', 'Immersive', 'Experience Design', 'Experiential Design', 'Team Direction',
      'Vendor Coordination', 'Production',
    ],
    responsibilities: [
      'Provided creative direction across design, animation, immersive media and experiential environments.',
      'Worked directly with clients to understand project briefs, business requirements and communication challenges.',
      'Developed creative concepts, experience concepts and storytelling strategies.',
      'Translated client requirements into visual concepts, experience frameworks and executable creative direction.',
      'Worked across graphic design, visual communication, branding and digital design.',
      'Developed motion graphics, animation and visual storytelling content.',
    ],
    moreResponsibilities: [
      'Worked across animation and VFX-led visual development.',
      'Developed creative treatments, storyboards and visual directions for video and animation projects.',
      'Supported photography and video shooting and visual-content production where required by project scope.',
      'Developed concepts for video, animation and experiential content.',
      'Directed distributed creative teams across different locations and disciplines.',
      'Coordinated external creative teams, specialists, production partners and vendors.',
      'Managed multidisciplinary creative collaboration across designers, animators, developers and production specialists.',
      'Developed interactive installations and communication systems.',
      'Worked on immersive and experiential environments combining visual storytelling and technology.',
      'Presented creative concepts, visual directions and design solutions to clients and stakeholders.',
      'Guided projects from concept development through creative production and delivery.',
      'Provided art direction and quality control across creative outputs.',
      'Helped translate complex ideas into clearer visual and experiential communication.',
      'Delivered visual storytelling environments for enterprise organisations.',
      'Managed the relationship between creative intent, client expectations and production execution.',
    ],
  },
  {
    date: 'Sep 2021 — Sep 2022',
    role: 'Creative Head',
    company: 'RAMS Creative Technologies',
    location: 'Jaipur',
    summary:
      'Led creative direction across design, animation and interactive experience projects, developing storytelling frameworks, communication strategies and visual narratives while directing and mentoring multidisciplinary creative teams.',
    disciplines: [
      'Creative Direction', 'Graphic Design', 'Art Direction', 'Visual Design', 'Motion Graphics',
      'Animation', 'Visual Storytelling', 'Interactive Experience', 'Digital Experience', 'Team Leadership',
      'Mentoring', 'Production',
    ],
    responsibilities: [
      'Led creative direction across graphic design, visual design, animation and interactive experience projects.',
      'Developed creative concepts and visual directions based on project requirements.',
      'Developed storytelling frameworks and communication strategies.',
      'Translated complex technical subjects into accessible visual narratives.',
      'Developed concepts for interactive and digital experiences.',
      'Guided experience concept development from initial idea through execution.',
    ],
    moreResponsibilities: [
      'Directed multidisciplinary creative teams.',
      'Provided art direction across design, animation and interactive media.',
      'Guided designers and animators through creative development and production.',
      'Mentored designers and animators.',
      'Reviewed creative work and provided creative direction.',
      'Conducted creative reviews and quality-control processes.',
      'Reviewed visual, animation and interactive outputs.',
      'Maintained consistency between creative concept and final execution.',
      'Collaborated with stakeholders to develop and refine creative solutions.',
      'Worked across visual communication, animation, motion and interactive experience development.',
      'Developed creative approaches for technical and complex subjects.',
      'Supported multidisciplinary production and project delivery.',
    ],
  },
  {
    date: 'Jan 2016 — Apr 2021',
    role: 'Creative Director',
    company: 'Angel Creations',
    summary:
      'Founded and led a creative studio delivering branding, graphic design, animation and creative communication projects, while directing multidisciplinary teams, client relationships and end-to-end creative delivery.',
    disciplines: [
      'Creative Direction', 'Graphic Design', 'Brand Identity', 'Branding', 'Art Direction',
      'Motion Graphics', 'Animation', 'VFX', 'Video', 'Shooting', 'Visual Storytelling',
      'Creative Production', 'Team Leadership', 'Client Management', 'Project Delivery',
    ],
    responsibilities: [
      'Founded and led a creative studio delivering branding, graphic design, animation and creative communication projects.',
      'Directed overall creative strategy and execution across client projects.',
      'Developed brand identity systems and visual communication.',
      'Developed graphic design solutions across digital and physical communication requirements.',
      'Directed motion graphics and animation campaigns.',
      'Worked across animation, VFX and visual storytelling.',
    ],
    moreResponsibilities: [
      'Developed concepts, storyboards and visual treatments for animation and video content.',
      'Directed creative production from initial concept through final delivery.',
      'Developed creative treatments for video and visual-content projects.',
      'Supported shooting and visual-content production where required by project scope.',
      'Directed visual storytelling and communication for client campaigns.',
      'Developed storytelling frameworks for brand communication.',
      'Managed multidisciplinary creative teams.',
      'Managed designers, animators and creative specialists.',
      'Assigned creative responsibilities and guided teams through project execution.',
      'Reviewed design, animation, motion and visual outputs.',
      'Maintained creative quality and consistency across projects.',
      'Developed creative concepts based on client briefs and business requirements.',
      'Presented concepts, design directions and creative solutions to clients and stakeholders.',
      'Built and maintained long-term client relationships.',
      'Managed creative expectations, project requirements and delivery timelines.',
      'Coordinated internal teams and external creative resources.',
      'Oversaw end-to-end creative delivery while maintaining creative quality.',
      'Balanced creative direction, client expectations, production constraints and deadlines.',
    ],
  },
  {
    date: 'Jan 2014 — Jan 2016',
    role: 'Creative Project Manager',
    company: 'Arena Animation',
    summary:
      'Managed animation and design production projects, coordinating creative teams, schedules, workflows and quality-control processes while building foundational expertise in animation production pipelines.',
    disciplines: [
      'Project Management', 'Animation', 'Graphic Design', 'Creative Production', 'Team Coordination',
      'Production Planning', 'Workflow Management', 'Quality Control',
    ],
    responsibilities: [
      'Managed animation and design production projects from planning through delivery.',
      'Coordinated teams of designers and animators.',
      'Managed production schedules, deadlines and delivery requirements.',
      'Monitored project progress across creative production stages.',
      'Coordinated resources required for animation and design production.',
      'Implemented workflow improvements to improve production efficiency.',
    ],
    moreResponsibilities: [
      'Supported creative reviews and quality-control processes.',
      'Reviewed production output against project requirements.',
      'Coordinated communication between production requirements and creative teams.',
      'Assisted with production planning and task allocation.',
      'Supported animation production pipelines and delivery processes.',
      'Built foundational expertise in animation production, design workflows and creative project management.',
    ],
    last: true,
  },
];
