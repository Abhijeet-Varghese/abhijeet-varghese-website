/* ═══════════════════════════════════════════════════════════════
   BPCL PALAKKAD — SITE CONFIGURATION
   Central registry: every filename, every coordinate, every line
   of copy. Nothing else in the codebase names a file.

   Coordinates are percentages of their own image
   (0–100 X, 0–100 Y, from the image's top-left corner).
   ═══════════════════════════════════════════════════════════════ */

window.BPCL_ASSETS = {
  miniature: [
    "miniature 1.png",
    "miniature 2.png",
    "miniature 3.png",
    "miniature 4.png",
    "miniature 5.png",
    "miniature day.png",
    "miniature night.png"
  ],
  blueprint: "Blueprint.png",
  walkthrough: [
    "bpcl video 1.jpg",
    "bpcl video 2.jpg",
    "bpcl video 3.jpg",
    "bpcl video 4.jpg",
    "bpcl video 5.jpg",
    "bpcl video 6.jpg",
    "bpcl video 7.jpg",
    "bpcl video 8.jpg",
    "bpcl video 9.jpg",
    "bpcl video 10.jpg"
  ],
  video: "assets/video/walkthrough.mp4"
};

window.BPCL = {

  /* ── DEPLOYMENT ───────────────────────────────────────────────────
     ─────────────────────────────────────────────────────────────
     PRODUCTION DOMAIN REQUIRED — NOT YET SUPPLIED.

     No domain has been established for this project, so no origin is
     asserted. Canonical, Open Graph and JSON-LD URLs in index.html are
     root-relative and resolve correctly on whatever host this is
     deployed to. To pin them, set ORIGIN to the live scheme+host
     (no trailing slash) and change the three occurrences of
     REPLACE-WITH-PRODUCTION-DOMAIN in sitemap.xml and robots.txt.
     Until then SEO cannot be marked production-complete.
     ───────────────────────────────────────────────────────────── */
  ORIGIN: 'https://abhijeetvarghese.com',
  SLUG:   'case-studies/bharat-petroleum-corporation-limited/',

  WALKTHROUGH_SRC:   window.BPCL_ASSETS.video,
  /* Armed. The player mounts only when WALKTHROUGH_SRC actually resolves,
     so it is safe to leave ON before the file exists: while the MP4 is
     absent the site keeps the frame sequence and renders no broken control.
     Drop the file at assets/video/walkthrough.mp4 (or point WALKTHROUGH_SRC
     at another path) and refresh — the player appears automatically.     */
  WALKTHROUGH_VIDEO: true,
  /* Supplied facts about the film, used only when it is mounted.
     `Bpcl 5.mp4` is NOT present in this workspace — verified.    */
  WALKTHROUGH_META: { duration: '4:40', seconds: 280.17, w: 1280, h: 720 },

  LOCATION: 'Palakkad, Kerala',

  /* ── 01–08 · frozen information architecture ─────────────────── */
  SECTIONS: [
    { n:'01', name:'ENTER',        id:'hero' },
    { n:'02', name:'CHALLENGE',    id:'challenge' },
    { n:'03', name:'MINIATURE',    id:'miniature' },
    { n:'04', name:'BLUEPRINT',    id:'blueprint' },
    { n:'05', name:'WALKTHROUGH',  id:'walkthrough' },
    { n:'06', name:'LEADERSHIP',   id:'leadership' },
    { n:'07', name:'OUTCOME',      id:'outcome' },
    { n:'08', name:'FINAL',        id:'final' }
  ],

  /* minimal top navigation — five destinations, not eight */
  NAV: [
    { n:'01', name:'CHALLENGE',   id:'challenge' },
    { n:'02', name:'MINIATURE',   id:'miniature' },
    { n:'03', name:'BLUEPRINT',   id:'blueprint' },
    { n:'04', name:'WALKTHROUGH', id:'walkthrough' },
    { n:'05', name:'DELIVERY',    id:'leadership' }
  ],

  /* ── §02 · the bridge from site to experience ────────────────── */
  BRIDGE: ['SITE','MODEL','BLUEPRINT','3D','EXPERIENCE'],

  /* §02 · the challenge, in the visitor's terms before the studio's */
  CHALLENGE: [
    'An industrial installation brings together storage, operations, circulation, utilities, landscape and infrastructure within one connected site.',
    'Different people needed to understand the same environment at different levels \u2014 its overall site relationship, spatial organization, circulation, infrastructure, architecture, landscape and operational logic. The challenge was not to show more. It was to make the relationships between the parts easier to understand.'
  ],

  CONTRIBUTION: 'Strategy · Consulting · Creative Direction · Stakeholder Alignment · Team & Vendor Coordination · End-to-End Delivery',

  STRATEGY: [
    { n:'01', name:'CLARIFY',    copy:'Make the site legible.' },
    { n:'02', name:'CONNECT',    copy:'Show how its components relate.' },
    { n:'03', name:'VISUALIZE',  copy:'Translate the spatial logic into detailed environments.' },
    { n:'04', name:'EXPERIENCE', copy:'Allow the site to be understood beyond a static plan.' }
  ],

  /* ── §03 · the physical miniature ────────────────────────────── */
  MODEL_META: [
    { k:'SCALE',      v:'Approx. 8 × 10 ft' },
    { k:'CONDITIONS', v:'Day / night — integrated lighting' },
    { k:'CONTENTS',   v:'Buildings · storage · roads · parking · landscape · utilities · boundary' }
  ],

  MINIATURE: [
    { file:'m1',    tag:'VIEW 01', alt:'Detailed physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation showing industrial buildings, storage areas, internal roads and landscaped zones.' },
    { file:'m2',    tag:'VIEW 02', alt:'Detailed physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation seen from above, showing the tank farm, operational buildings, parking, roads and landscape together.' },
    { file:'m3',    tag:'VIEW 03', alt:'Detailed physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation in three-quarter view, showing built form against the ground it occupies.' },
    { file:'m4',    tag:'VIEW 04', alt:'Detailed physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation seen from the far edge of the site.' },
    { file:'m5',    tag:'VIEW 05', alt:'Close view of the Bharat Petroleum Corporation Limited Palakkad physical miniature showing material, edge and workmanship.' },
    { file:'day',   tag:'DAY',     alt:'Bharat Petroleum Corporation Limited Palakkad Top Installation physical miniature in daylight, showing the full site layout.' },
    { file:'night', tag:'NIGHT',   alt:'Bharat Petroleum Corporation Limited Palakkad Top Installation physical miniature at night, its integrated lighting tracing the roads, buildings and storage areas.' }
  ],

  /* ── §04 · blueprint ─────────────────────────────────────────── */
  BLUEPRINT: {
    alt: 'Technical blueprint of the Bharat Petroleum Corporation Limited Palakkad Top Installation showing the tank farm, internal roads, parking and site layout.',
    note: 'Visualization and communication drawing. Not certified construction or survey data.',
    meta: [
      { k:'DRAWING', v:'SITE BLUEPRINT' },
      { k:'TYPE',    v:'SCHEMATIC SITE PLAN' },
      { k:'STATUS',  v:'VISUALIZATION / COMMUNICATION' }
    ]
  },

  /* ── §05 · 3D architectural walkthrough ──────────────────────── */
  FRAMES: [
    { n:'01', file:'frame01', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation — arrival view of the industrial facility.' },
    { n:'02', file:'frame02', alt:'Duplicate of frame 01 in the supplied set — not presented in the sequence.' },
    { n:'03', file:'frame03', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'04', file:'frame04', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'05', file:'frame05', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'06', file:'frame06', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'07', file:'frame07', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'08', file:'frame08', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'09', file:'frame09', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' },
    { n:'10', file:'frame10', alt:'3D architectural visualization of the Bharat Petroleum Corporation Limited Palakkad Top Installation.' }
  ],

  /* `bpcl video 2.jpg` is byte-identical to `bpcl video 1.jpg`
     (md5 52b3546d0e84e2f3f32e9d6f7e5ab27e, verified). It is held
     out of the sequence rather than presented as a second frame.
     Replace the file, then remove '02' from this list.            */
  DUPLICATE_FRAMES: ['02'],

  /* Optional: name the stages once a frame's subject is confirmed.
     Leave empty and captions stay neutral. */
  WALKTHROUGH_STAGES: [],

  /* Close-ups for the detail block — frame numbers, not indices. */
  CLOSEUPS: ['01','03','06'],

  /* ── §06 · leadership + delivery ─────────────────────────────── */
  FLOW: ['CONCEPT','TEAM','VENDORS','PRODUCTION','QA','DELIVERY'],
  LEADERSHIP: [
    { n:'01', name:'CREATIVE DIRECTION',    copy:'Set the visual language, the spatial logic and the quality bar every output had to meet.' },
    { n:'02', name:'TEAM COORDINATION',     copy:'Briefed, guided and reviewed contributors so separate hands produced one coherent result.' },
    { n:'03', name:'STAKEHOLDER MANAGEMENT',copy:'Turned requirements and feedback into clear creative decisions without losing the direction.' },
    { n:'04', name:'VENDOR MANAGEMENT',     copy:'Carried the same brief, standards and review process through external production.' }
  ],

  /* ── §07 · outcome — one site, four ways to understand it ────── */
  OUTCOMES: [
    { n:'01', name:'PHYSICAL MODEL',   copy:'Tangible spatial understanding — the whole site held in one view.' },
    { n:'02', name:'BLUEPRINT',        copy:'Technical and spatial clarity — the site read as a system of relationships.' },
    { n:'03', name:'3D ENVIRONMENT',   copy:'Architectural realization — the site resolved as buildings, infrastructure and landscape.' },
    { n:'04', name:'WALKTHROUGH',      copy:'Experiential communication — the site understood by moving through it.' }
  ],

  PROJECT_INFO: [
    { k:'PROJECT',     v:'Bharat Petroleum Corporation Limited — Palakkad Top Installation' },
    { k:'LOCATION',    v:'Palakkad, Kerala' },
    { k:'DISCIPLINES', v:'Strategy · Creative Direction · Architectural Visualization · 3D Environment · Interactive Experience' },
    { k:'ROLE',        v:'Strategy · Consulting · Creative Direction · Stakeholder Alignment · Team & Vendor Coordination · End-to-End Delivery' }
  ]
};
