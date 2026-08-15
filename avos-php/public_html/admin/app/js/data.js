/* ============================================================
   AV OS — data layer: seed content + localStorage store
   ============================================================ */
window.AV = {};

/* ---------- Seed data ---------- */
AV.seed = {
  settings: {
    siteName: "AbhijeetVarghese.com",
    tagline: "Making ambitious ideas impossible to misunderstand.",
    email: "hi@abhijeetvarghese.com",
    phone: "+91-96940 80706",
    theme: "light",
    sidebarCollapsed: false,
    designTokens: {
      radius: 16, shadow: 40, spacing: 24, container: 1280, accent: "#2E5AAC",
      bodyFont: "Inter Tight", headingFont: "Inter Tight", accentFont: "Instrument Serif"
    }
  },
  dashboard: {
    stats: [
      { id: "visitors", label: "Visitors", value: "18,420", trend: "+12.4%", up: true, spark: [12, 14, 13, 17, 16, 19, 22, 21, 24, 26, 25, 29] },
      { id: "views", label: "Page Views", value: "46,932", trend: "+18.1%", up: true, spark: [30, 28, 34, 33, 38, 42, 40, 46, 44, 51, 55, 58] },
      { id: "downloads", label: "Résumé Downloads", value: "1,284", trend: "+8.2%", up: true, spark: [4, 6, 5, 8, 7, 9, 8, 11, 10, 12, 13, 15] },
      { id: "leads", label: "New Leads", value: "96", trend: "+22.9%", up: true, spark: [2, 3, 2, 4, 5, 4, 6, 7, 6, 8, 9, 10] }
    ],
    health: { perf: 94, seo: 98, a11y: 100, bp: 100 },
    meetings: [
      { id: "m1", who: "Ravi Kumar", org: "Acme Inc", what: "Experience centre strategy", time: "Today · 15:00 IST", when: "Today" },
      { id: "m2", who: "Sarah Mitchell", org: "Northwind", what: "Enterprise design leadership", time: "Tomorrow · 10:30 IST", when: "Tomorrow" },
      { id: "m3", who: "Arjun Mehta", org: "Tata Advanced Systems", what: "Immersive training review", time: "Fri · 12:00 IST", when: "Friday" }
    ],
    activity: [
      { icon: "M", cls: "accent", text: "<b>Case Studies</b> — “Indian Army” published", time: "2h ago" },
      { icon: "L", cls: "ok", text: "New lead — <b>Priya Sharma</b> (Deloitte) via contact form", time: "4h ago" },
      { icon: "B", cls: "warn", text: "Booking confirmed — <b>Sarah Mitchell</b> · 10:30 IST", time: "6h ago" },
      { icon: "S", cls: "accent", text: "SEO score updated — <b>Homepage 98</b>", time: "9h ago" },
      { icon: "M", cls: "muted", text: "Media — 12 assets optimized (AVIF)", time: "12h ago" },
      { icon: "A", cls: "ok", text: "AI drafted <b>“Why Enterprise Experiences Fail”</b> outline", time: "1d ago" }
    ],
    aiSuggestions: [
      { title: "Refresh the Insights page", body: "Traffic to insights grew 31% this month. Publishing the 4th essay draft this week could capture the momentum." },
      { title: "Follow up with 3 warm leads", body: "Leads from enterprise consulting are 2.1× more likely to convert. The oldest is 5 days old." },
      { title: "Update meta description", body: "The homepage meta is 12 characters over the ideal length and missing the 'enterprise innovation' keyword." }
    ],
    quickDrafts: [
      { title: "AI Isn't Replacing Creativity", status: "Draft · 68%", updated: "2h ago" },
      { title: "Why Enterprise Experiences Fail", status: "Draft · 41%", updated: "Yesterday" },
      { title: "Journal — Clarity as a metric", status: "Review", updated: "3d ago" }
    ]
  },
  sections: [
    { id: "hero", name: "Hero", kicker: "The Cover", status: "published", updated: "2h ago", order: 1, title: "Making ambitious ideas impossible to misunderstand." },
    { id: "clients", name: "Clients", kicker: "Trust", status: "published", updated: "1d ago", order: 2, title: "Experiences built for." },
    { id: "capabilities", name: "Capabilities", kicker: "Capabilities", status: "published", updated: "1d ago", order: 3, title: "Complex challenges don't need more specialists." },
    { id: "work", name: "Featured Work", kicker: "Featured work", status: "published", updated: "3d ago", order: 4, title: "Work that had to be understood." },
    { id: "thinking", name: "Thinking", kicker: "Point of view", status: "published", updated: "1d ago", order: 5, title: "Technology evolves every day." },
    { id: "journey", name: "Journey", kicker: "Journey", status: "published", updated: "2d ago", order: 6, title: "Not a timeline. An evolution." },
    { id: "ai", name: "AI", kicker: "Method", status: "published", updated: "4d ago", order: 7, title: "Building with AI. Thinking like a human." },
    { id: "cta", name: "CTA", kicker: "Now", status: "published", updated: "5d ago", order: 8, title: "Current focus." },
    { id: "contact", name: "Contact", kicker: "Begin", status: "published", updated: "1h ago", order: 9, title: "Let's build something worth remembering." },
    { id: "footer", name: "Footer", kicker: "Colophon", status: "published", updated: "6d ago", order: 10, title: "© 2026 Abhijeet Varghese. All Rights Reserved." }
  ],
  pages: [
    { id: "p-home", title: "Homepage", slug: "/", template: "Home", status: "published", seo: 98, updated: "1h ago" },
    { id: "p-story", title: "Story", slug: "/story", template: "Page", status: "published", seo: 96, updated: "2d ago" },
    { id: "p-experience", title: "Experience", slug: "/experience", template: "Page", status: "published", seo: 97, updated: "2d ago" },
    { id: "p-cases", title: "Case Studies", slug: "/case-studies", template: "Page", status: "published", seo: 95, updated: "4d ago" },
    { id: "p-contact", title: "Contact", slug: "/contact", template: "Contact", status: "published", seo: 93, updated: "3h ago" },
    { id: "p-insights", title: "Insights", slug: "/insights", template: "Blog Index", status: "published", seo: 97, updated: "1d ago" },
    { id: "p-journal", title: "Journal", slug: "/journal", template: "Blog Index", status: "published", seo: 96, updated: "1d ago" },
    { id: "p-recruiters", title: "For Recruiters", slug: "/for-recruiters", template: "Page", status: "published", seo: 92, updated: "1w ago" },
    { id: "p-consulting", title: "Consulting", slug: "/consulting", template: "Page", status: "published", seo: 91, updated: "1w ago" },
    { id: "p-sitemap", title: "Sitemap", slug: "/sitemap", template: "Page", status: "published", seo: 88, updated: "2w ago" }
  ],
  blocks: [
    { type: "hero", name: "Hero", desc: "Full-bleed editorial opener" },
    { type: "text", name: "Text", desc: "Rich text, headings, lists" },
    { type: "image", name: "Image", desc: "Single image with caption" },
    { type: "gallery", name: "Gallery", desc: "Grid or carousel of media" },
    { type: "video", name: "Video", desc: "Embed or hosted video" },
    { type: "quote", name: "Quote", desc: "Editorial pull quote" },
    { type: "timeline", name: "Timeline", desc: "Vertical era strip" },
    { type: "accordion", name: "Accordion", desc: "Collapsible sections" },
    { type: "tabs", name: "Tabs", desc: "Tabbed content" },
    { type: "cards", name: "Cards", desc: "Card grid" },
    { type: "stats", name: "Statistics", desc: "Number highlights" },
    { type: "testimonials", name: "Testimonials", desc: "Client voices" },
    { type: "cta", name: "CTA", desc: "Call to action band" },
    { type: "forms", name: "Form", desc: "Custom form embed" },
    { type: "code", name: "Code Embed", desc: "HTML / JS embed" },
    { type: "logowall", name: "Logo Wall", desc: "Client logo grid" },
    { type: "newsletter", name: "Newsletter", desc: "Subscribe capture" },
    { type: "buttons", name: "Buttons", desc: "Action buttons" }
  ],
  projects: [
    {
      id: "prj-1", title: "Enterprise Technology, Made Understandable", client: "Orange Business", industry: "Enterprise Technology",
      status: "published", year: "2025", featured: true, image: "media/case-orange.webp",
      summary: "Helping enterprise technology become understandable.", views: "8,421",
      role: "Creative Direction & Experience Strategy", challenge: "Genuinely complex platforms had let complexity become the experience. Powerful capability, buried under jargon.",
      approach: "Translate system architecture into human narratives — experience films, interactive demos and centre experiences that make capability legible.",
      outcome: "Enterprise technology buyers can finally see, understand — and remember.", updated: "3d ago"
    },
    {
      id: "prj-2", title: "Intuitive Experiences for Industrial Environments", client: "BPCL", industry: "Energy & Industrial",
      status: "published", year: "2025", featured: true, image: "media/case-bpcl.webp",
      summary: "Designing intuitive experiences for complex industrial environments.", views: "6,740",
      role: "Design Strategy & Experience Lead", challenge: "Safety-critical operations ran on dense manuals and denser screens. Comprehension wasn't a nicety — it was risk management.",
      approach: "Intuitive interfaces and immersive walkthroughs of complex processes, designed to be understood under pressure.",
      outcome: "Experiences operators trust at a glance — clarity measured in seconds, not slides.", updated: "5d ago"
    },
    {
      id: "prj-3", title: "Immersive Solutions for the Indian Army", client: "Indian Army", industry: "Defence & Immersive",
      status: "published", year: "2025", featured: true, image: "media/case-army.webp",
      summary: "Creating immersive solutions where clarity, precision and execution matter most.", views: "12,084",
      role: "Creative Lead — Immersive Solutions", challenge: "Communication at enormous scale, under the highest stakes, asking for absolute precision and discipline.",
      approach: "Immersive storytelling and visualization pipelines where every frame is verified — built with the discipline of the institution it served.",
      outcome: "Work where clarity, precision and execution mattered most — and delivered.", updated: "1w ago"
    },
    {
      id: "prj-4", title: "The Virtual Life", client: "Personal / AI Lab", industry: "AI & Narrative",
      status: "draft", year: "2026", featured: false, image: "media/essay-01.webp",
      summary: "An AI-crafted narrative world exploring emotional weight in generated media.", views: "—",
      role: "Creator & Director", challenge: "Can generated media carry genuine emotional weight?", approach: "Built a narrative world with AI across image, video and sound, curated by hand.", outcome: "A proof that tools serve the story — not the other way around.", updated: "2d ago"
    },
    {
      id: "prj-5", title: "Immersive Wedding Invitation", client: "Personal / AI Lab", industry: "Experiential",
      status: "draft", year: "2026", featured: false, image: "media/essay-02.webp",
      summary: "A platform that turns a wedding invitation into an explorable experience.", views: "—",
      role: "Creator & Director", challenge: "Make every guest feel personally invited.", approach: "AI-personalized experiences per guest inside one shared world.", outcome: "Invitations people don't just open — they revisit.", updated: "4d ago"
    },
    {
      id: "prj-6", title: "Experience Centre — Strategy Made Walkable", client: "Enterprise Client", industry: "Experience Centres",
      status: "scheduled", year: "2026", featured: false, image: "media/experience-centre.webp",
      summary: "Physical spaces where organizations explain themselves.", views: "—",
      role: "Experience Architect", challenge: "Turn strategy into something visitors can walk through and touch.", approach: "Centre master-planning: narrative arc, spatial flow, interactive media systems.", outcome: "Centres that function as decision rooms, not showrooms.", updated: "6d ago"
    }
  ],
  articles: [
    {
      id: "art-1", title: "Technology Should Feel Human", type: "essay", status: "published",
      category: "Design", readTime: "6 min", date: "2026-07-12", image: "media/essay-01.webp",
      excerpt: "The most advanced systems fail when they forget the person holding them.",
      body: "Every technology starts life as a promise. Somewhere between the promise and the rollout, the human being quietly leaves the room.\n\nI've spent twelve years inside that translation problem. The pattern repeats everywhere — the system is powerful, the people are smart, and the experience is still alienating.\n\nWhat does a human interface actually mean? It means respecting attention, which is finite. It means earning trust, which takes repeated, honest behaviour. And it means designing for memory — because the only interface people carry is the one in their heads.\n\nTechnology evolves every day. Human understanding doesn't. That asymmetry is the brief.",
      views: "3,204", updated: "2h ago"
    },
    {
      id: "art-2", title: "AI Isn't Replacing Creativity", type: "essay", status: "draft",
      category: "AI", readTime: "8 min", date: "2026-06-20", image: "media/essay-02.webp",
      excerpt: "Machines compress exploration; humans still do judgment.",
      body: "Every few decades a tool arrives that seems to make craft obsolete. Photography didn't kill painting — it relocated the argument.\n\nWhat AI actually compresses is exploration. The first 80 percent of any creative task can now happen in minutes instead of weeks.\n\nBut exploration was never the hard part. The hard part was always judgment: knowing which variation deserves to exist.\n\nSo the new workflow looks like this: machines for momentum, humans for judgment.",
      views: "1,982", updated: "Yesterday"
    },
    {
      id: "art-3", title: "Designing Experiences People Remember", type: "essay", status: "published",
      category: "Experience", readTime: "7 min", date: "2026-05-15", image: "media/essay-03.webp",
      excerpt: "Memory is the real medium.",
      body: "Ask anyone what they remember about a great launch. Not the average minutes — the peak, and the ending.\n\nDesigning for memory also means designing for retelling. An experience that can be told as a story propagates.\n\nSo I design for the moments people will retell. A single honest moment beats a hundred polished ones.",
      views: "2,876", updated: "1w ago"
    },
    {
      id: "art-4", title: "Why Enterprise Experiences Fail", type: "essay", status: "review",
      category: "Enterprise", readTime: "9 min", date: "2026-04-02", image: "media/essay-04.webp",
      excerpt: "Jargon, org charts and inherited complexity — the three silent killers.",
      body: "Enterprise experiences don't fail for lack of talent or budget. They fail for three quieter reasons, and all three are translation failures.\n\nThe first killer is jargon. The second is the org chart. The third is inherited complexity.\n\nThe fix is the same for all three: treat clarity as a first-class requirement.",
      views: "1,540", updated: "3d ago"
    },
    {
      id: "art-5", title: "What a year of AI-enabled production taught me", type: "journal", status: "published",
      category: "Journal", readTime: "4 min", date: "2026-08-04", image: "media/journal-01.webp",
      excerpt: "Compression is the real gift.",
      body: "Twelve months into running AI-enabled production pipelines, the headline lesson is not about the technology at all. It's about where the human hours went: not into making, but into deciding.",
      views: "1,102", updated: "4d ago"
    },
    {
      id: "art-6", title: "The experience centre as a strategic instrument", type: "journal", status: "published",
      category: "Journal", readTime: "3 min", date: "2026-06-11", image: "media/journal-02.webp",
      excerpt: "The best centres are decision rooms, not showrooms.",
      body: "Most experience centres are built backwards. The centres that matter are built as decision rooms — places where the organization confronts its own strategy made visible.",
      views: "864", updated: "2w ago"
    },
    {
      id: "art-7", title: "On writing for non-designers", type: "journal", status: "draft",
      category: "Journal", readTime: "3 min", date: "2026-04-19", image: "media/journal-03.webp",
      excerpt: "The second audience is always the one that matters.",
      body: "Most design documentation has two audiences: the designer who wrote it, and everyone else. Write for the person who will implement it at 6pm on a Friday.",
      views: "—", updated: "1w ago"
    },
    {
      id: "art-8", title: "Clarity as a business metric", type: "journal", status: "review",
      category: "Journal", readTime: "3 min", date: "2026-01-22", image: "media/journal-04.webp",
      excerpt: "If you can't measure understanding, you're guessing about trust.",
      body: "Clarity is measurable, if you define it honestly: the time it takes a real user to correctly answer 'what does this do, and what should I do next?'",
      views: "1,014", updated: "3w ago"
    }
  ],
  media: [
    { id: "med-1", name: "hero-portrait.webp", folder: "Hero", size: "38 KB", w: 512, h: 512, src: "media/hero-portrait.webp", alt: "Editorial portrait of Abhijeet Varghese", tags: ["hero", "portrait"] },
    { id: "med-2", name: "case-orange.webp", folder: "Case Studies", size: "52 KB", w: 640, h: 427, src: "media/case-orange.webp", alt: "Enterprise technology briefing room", tags: ["work", "enterprise"] },
    { id: "med-3", name: "case-bpcl.webp", folder: "Case Studies", size: "48 KB", w: 640, h: 427, src: "media/case-bpcl.webp", alt: "Engineers at a process touchscreen", tags: ["work", "industrial"] },
    { id: "med-4", name: "case-army.webp", folder: "Case Studies", size: "61 KB", w: 640, h: 427, src: "media/case-army.webp", alt: "Immersive training theatre", tags: ["work", "defence"] },
    { id: "med-5", name: "working-session.webp", folder: "Thinking", size: "44 KB", w: 640, h: 427, src: "media/working-session.webp", alt: "Working session over journey maps", tags: ["process"] },
    { id: "med-6", name: "experience-centre.webp", folder: "Experience Centres", size: "58 KB", w: 640, h: 427, src: "media/experience-centre.webp", alt: "Enterprise experience centre with LED wall", tags: ["space", "centre"] },
    { id: "med-7", name: "essay-01.webp", folder: "Essays", size: "22 KB", w: 640, h: 357, src: "media/essay-01.webp", alt: "Abstract azure ribbons", tags: ["essay"] },
    { id: "med-8", name: "essay-02.webp", folder: "Essays", size: "24 KB", w: 640, h: 357, src: "media/essay-02.webp", alt: "Neural network nodes", tags: ["essay", "ai"] },
    { id: "med-9", name: "essay-03.webp", folder: "Essays", size: "21 KB", w: 640, h: 357, src: "media/essay-03.webp", alt: "Concentric rings", tags: ["essay"] },
    { id: "med-10", name: "essay-04.webp", folder: "Essays", size: "23 KB", w: 640, h: 357, src: "media/essay-04.webp", alt: "Architectural grid", tags: ["essay", "enterprise"] },
    { id: "med-11", name: "journal-01.webp", folder: "Journal", size: "20 KB", w: 640, h: 357, src: "media/journal-01.webp", alt: "Light streaks", tags: ["journal"] },
    { id: "med-12", name: "journal-02.webp", folder: "Journal", size: "21 KB", w: 640, h: 357, src: "media/journal-02.webp", alt: "Topographic contours", tags: ["journal"] },
    { id: "med-13", name: "logo.png", folder: "Brand", size: "39 KB", w: 500, h: 500, src: "media/logo.png", alt: "Abhijeet Varghese logo", tags: ["brand", "logo"] }
  ],
  leads: [
    { id: "ld-1", name: "Priya Sharma", org: "Deloitte", email: "priya@deloitte.com", status: "new", tags: ["enterprise", "design leadership"], score: 92, notes: "Asked about design leadership roles at Big 4. Source: contact form.", updated: "4h ago" },
    { id: "ld-2", name: "Ravi Kumar", org: "Acme Inc", email: "ravi@acme.com", status: "contacted", tags: ["experience centre"], score: 88, notes: "Booked intro call. Interested in a full centre build.", updated: "2h ago" },
    { id: "ld-3", name: "Sarah Mitchell", org: "Northwind", email: "sarah@northwind.io", status: "qualified", tags: ["consulting", "ai workflows"], score: 84, notes: "Wants AI-enabled production pipeline setup.", updated: "1d ago" },
    { id: "ld-4", name: "Arjun Mehta", org: "Tata Advanced Systems", email: "arjun@tataas.com", status: "meeting", tags: ["defence", "immersive"], score: 95, notes: "Reviewing immersive training programme.", updated: "3d ago" },
    { id: "ld-5", name: "Emily Chen", org: "Stripe", email: "emily@stripe.com", status: "new", tags: ["faang", "product design"], score: 90, notes: "Found via LinkedIn. Interested in experience design leadership.", updated: "5h ago" },
    { id: "ld-6", name: "David Okafor", org: "Flutterwave", email: "david@flutterwave.com", status: "contacted", tags: ["enterprise", "brand"], score: 78, notes: "Brand system refresh inquiry.", updated: "2d ago" },
    { id: "ld-7", name: "Maria Lopez", org: "PwC", email: "maria@pwc.com", status: "qualified", tags: ["big4", "innovation"], score: 86, notes: "Innovation lab consulting — scope call next week.", updated: "1d ago" },
    { id: "ld-8", name: "Ken Watanabe", org: "Sony", email: "ken@sony.com", status: "archived", tags: ["media"], score: 64, notes: "Old inquiry — no reply after 3 touches.", updated: "3w ago" }
  ],
  meetings: [
    { id: "mt-1", who: "Ravi Kumar", org: "Acme Inc", what: "Experience centre strategy", when: "2026-08-08", time: "15:00 IST", status: "upcoming", notes: "" },
    { id: "mt-2", who: "Sarah Mitchell", org: "Northwind", what: "AI production pipeline", when: "2026-08-09", time: "10:30 IST", status: "upcoming", notes: "" },
    { id: "mt-3", who: "Arjun Mehta", org: "Tata Advanced Systems", what: "Immersive training review", when: "2026-08-11", time: "12:00 IST", status: "upcoming", notes: "Bring the demo build." },
    { id: "mt-4", who: "Emily Chen", org: "Stripe", what: "Intro call", when: "2026-08-12", time: "16:30 IST", status: "upcoming", notes: "" },
    { id: "mt-5", who: "Maria Lopez", org: "PwC", what: "Innovation lab scope", when: "2026-08-14", time: "11:00 IST", status: "upcoming", notes: "" },
    { id: "mt-6", who: "David Okafor", org: "Flutterwave", what: "Brand system refresh", when: "2026-08-05", time: "13:00 IST", status: "past", notes: "Solid call — send proposal." },
    { id: "mt-7", who: "Priya Sharma", org: "Deloitte", what: "Intro call", when: "2026-08-04", time: "09:30 IST", status: "past", notes: "Positive. Follow up with case studies." }
  ],
  availability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false, hours: "09:30 – 19:30 IST" },
  forms: [
    { id: "fm-1", title: "Contact form", location: "Homepage · Contact section", submissions: 96, spam: 4, updated: "1h ago" },
    { id: "fm-2", title: "Case study deep-dive request", location: "Case Studies page", submissions: 31, spam: 1, updated: "3d ago" },
    { id: "fm-3", title: "Consulting inquiry", location: "Consulting page", submissions: 18, spam: 0, updated: "1w ago" },
    { id: "fm-4", title: "For Recruiters", location: "Recruiters page", submissions: 27, spam: 3, updated: "2d ago" }
  ],
  submissions: [
    { id: "sb-1", form: "Contact form", name: "Ravi Kumar", email: "ravi@acme.com", message: "We're scoping a 12,000 sq ft experience centre in Bangalore. Would love an intro call.", date: "Today 11:02", status: "new" },
    { id: "sb-2", form: "For Recruiters", name: "Priya Sharma", email: "priya@deloitte.com", message: "Hiring for design leadership at Deloitte Digital. Your profile is a strong match.", date: "Today 08:41", status: "new" },
    { id: "sb-3", form: "Contact form", name: "Ken Watanabe", email: "ken@sony.com", message: "Interested in your immersive work. Can we talk next month?", date: "Yesterday", status: "read" },
    { id: "sb-4", form: "Consulting inquiry", name: "Maria Lopez", email: "maria@pwc.com", message: "Innovation lab consulting — 6 month engagement, hybrid.", date: "Yesterday", status: "read" },
    { id: "sb-5", form: "Contact form", name: "Spam Bot", email: "spam@fake.io", message: "Buy viagra now cheap!!!", date: "Yesterday", status: "spam" }
  ],
  seo: [
    { id: "seo-1", title: "Homepage", url: "/", score: 98, keywords: ["creative systems leader", "experience design", "enterprise innovation"], title: "Abhijeet Varghese — Creative Systems Leader | Experience Design, Enterprise Innovation & AI", desc: "12+ years turning complex ideas into experiences people understand, trust and remember.", updated: "1h ago" },
    { id: "seo-2", title: "Case Studies", url: "/case-studies", score: 95, keywords: ["enterprise experience design", "case studies"], title: "Case Studies — Abhijeet Varghese | Enterprise Experience Design", desc: "Selected work: Orange Business, BPCL and the Indian Army — clarity under pressure.", updated: "4d ago" },
    { id: "seo-3", title: "Insights", url: "/insights", score: 97, keywords: ["design essays", "AI creativity"], title: "Insights & Essays — Abhijeet Varghese | Design, AI & Enterprise", desc: "Essays on experience design, AI-enabled creativity and enterprise innovation.", updated: "1d ago" },
    { id: "seo-4", title: "For Recruiters", url: "/for-recruiters", score: 92, keywords: ["design leadership", "big 4", "faang"], title: "For Recruiters — Abhijeet Varghese | Design Leadership", desc: "A creative systems leader open to design leadership roles.", updated: "1w ago" },
    { id: "seo-5", title: "Contact", url: "/contact", score: 93, keywords: ["book intro call"], title: "Start a Conversation — Abhijeet Varghese", desc: "Write to Abhijeet Varghese or book an intro call. Replies within 24 hours.", updated: "3h ago" }
  ],
  analytics: {
    visitors30: [1240, 1380, 1290, 1520, 1610, 1480, 1720, 1890, 1750, 1980, 2140, 2010, 2260, 2410, 2320, 2580, 2740, 2620, 2890, 3010, 2980, 3240, 3390, 3260, 3510, 3680, 3540, 3820, 4010, 4180],
    sources: [["Organic Search", 42], ["Direct", 28], ["LinkedIn", 15], ["Referral", 9], ["Other", 6]],
    countries: [["India", 54], ["United States", 18], ["United Kingdom", 8], ["UAE", 6], ["Singapore", 5], ["Other", 9]],
    devices: [["Mobile", 58], ["Desktop", 36], ["Tablet", 6]],
    pages: [["/", 46], ["/case-studies", 22], ["/insights", 12], ["/experience", 9], ["/story", 6], ["Other", 5]],
    queries: [["abhijeet varghese", 840], ["creative systems leader", 412], ["enterprise experience design", 356], ["abhijeet varghese designer", 298], ["experience centre design india", 244]]
  },
  notifications: [
    { id: "n1", icon: "lead", text: "New lead — <b>Emily Chen</b> (Stripe)", time: "5h ago", unread: true },
    { id: "n2", icon: "book", text: "Booking confirmed — <b>Sarah Mitchell</b> · Fri 10:30 IST", time: "6h ago", unread: true },
    { id: "n3", icon: "seo", text: "SEO health — <b>Homepage 98</b> · all pages green", time: "9h ago", unread: true },
    { id: "n4", icon: "ai", text: "AI Studio — draft outline ready for <b>“Why Enterprise Experiences Fail”</b>", time: "1d ago", unread: false },
    { id: "n5", icon: "backup", text: "Backup completed — <b>Auto · Aug 08 03:00</b>", time: "1d ago", unread: false },
    { id: "n6", icon: "perf", text: "Performance alert — <b>LCP improved 4.3s → 4.0s</b>", time: "2d ago", unread: false }
  ],
  users: [
    { id: "u1", name: "Abhijeet Varghese", email: "hi@abhijeetvarghese.com", role: "Super Admin", status: "active", last: "Now", twoFA: true },
    { id: "u2", name: "Studio Editor", email: "editor@abhijeetvarghese.com", role: "Editor", status: "active", last: "2d ago", twoFA: true },
    { id: "u3", name: "Content Writer", email: "writer@abhijeetvarghese.com", role: "Writer", status: "invited", last: "—", twoFA: false }
  ],
  logs: [
    { t: "10:41:22", level: "info", msg: "Login — hi@abhijeetvarghese.com · Chrome on macOS · Bengaluru, IN" },
    { t: "10:38:07", level: "info", msg: "Published section “Contact” on homepage" },
    { t: "10:12:55", level: "warn", msg: "Calendly sync — rate limit approaching (68%)" },
    { t: "09:47:31", level: "info", msg: "Media optimized — 12 assets → AVIF (avg −62%)" },
    { t: "09:02:18", level: "info", msg: "Backup completed — Auto · 03:00 snapshot restored check OK" },
    { t: "08:41:09", level: "info", msg: "New form submission — For Recruiters (Priya Sharma)" },
    { t: "07:55:44", level: "error", msg: "API rate limit — OpenAI (429). Retried in 32s — OK" },
    { t: "07:12:03", level: "info", msg: "AI Studio — generated 3 LinkedIn post variants" }
  ],
  backups: [
    { id: "b1", name: "Auto · Aug 08 03:00", size: "48.2 MB", date: "Today 03:00", kind: "auto", status: "ok" },
    { id: "b2", name: "Auto · Aug 07 03:00", size: "48.1 MB", date: "Yesterday 03:00", kind: "auto", status: "ok" },
    { id: "b3", name: "Manual · Pre-launch", size: "47.9 MB", date: "Aug 05 18:22", kind: "manual", status: "ok" },
    { id: "b4", name: "Auto · Aug 06 03:00", size: "48.0 MB", date: "Aug 06 03:00", kind: "auto", status: "ok" },
    { id: "b5", name: "Auto · Aug 05 03:00", size: "47.6 MB", date: "Aug 05 03:00", kind: "auto", status: "ok" }
  ],
  integrations: [
    { id: "i1", name: "Google Analytics 4", desc: "Traffic, events, conversions", status: "connected", icon: "G", color: "#F9AB00" },
    { id: "i2", name: "Google Search Console", desc: "Queries, indexing, clicks", status: "connected", icon: "G", color: "#4285F4" },
    { id: "i3", name: "Microsoft Clarity", desc: "Heatmaps, sessions, rage clicks", status: "connected", icon: "C", color: "#4E8EF7" },
    { id: "i4", name: "Cloudflare Analytics", desc: "Edge analytics, bot protection", status: "connected", icon: "C", color: "#F6821F" },
    { id: "i5", name: "Calendly", desc: "Bookings, availability, invites", status: "connected", icon: "K", color: "#006BFF" },
    { id: "i6", name: "Resend", desc: "Transactional email", status: "connected", icon: "R", color: "#000000" },
    { id: "i7", name: "HubSpot CRM", desc: "Contacts, deals, pipelines", status: "available", icon: "H", color: "#FF7A59" },
    { id: "i8", name: "Supabase", desc: "Database, auth, storage", status: "available", icon: "S", color: "#3ECF8E" },
    { id: "i9", name: "n8n", desc: "Workflow automation", status: "available", icon: "N", color: "#EA4B71" },
    { id: "i10", name: "OpenAI", desc: "GPT-4o · Assistants · DALL·E", status: "connected", icon: "AI", color: "#10A37F" },
    { id: "i11", name: "Anthropic", desc: "Claude · long-context writing", status: "available", icon: "A", color: "#D97757" },
    { id: "i12", name: "Google Gemini", desc: "Multimodal generation", status: "available", icon: "G", color: "#8E75F2" },
    { id: "i13", name: "SMTP", desc: "Custom mail server", status: "connected", icon: "M", color: "#2E5AAC" },
    { id: "i14", name: "LinkedIn", desc: "Post publishing", status: "available", icon: "in", color: "#0A66C2" },
    { id: "i15", name: "Instagram", desc: "Content publishing", status: "available", icon: "ig", color: "#E4405F" },
    { id: "i16", name: "YouTube", desc: "Video publishing", status: "connected", icon: "YT", color: "#FF0000" }
  ],
  aiPrompts: [
    { name: "Generate Article", desc: "Full article from an outline or topic", icon: "doc" },
    { name: "Rewrite Content", desc: "Sharpen tone, tighten structure", icon: "pen" },
    { name: "Improve Grammar", desc: "Polish a draft line by line", icon: "check" },
    { name: "Generate SEO Meta", desc: "Title + description + keywords", icon: "seo" },
    { name: "Summarize Project", desc: "Case study into a crisp summary", icon: "sum" },
    { name: "Generate Case Study", desc: "Full structured case study draft", icon: "case" },
    { name: "LinkedIn Post", desc: "Professional post from any content", icon: "in" },
    { name: "Instagram Caption", desc: "Short, punchy captions + hashtags", icon: "ig" },
    { name: "Newsletter", desc: "Monthly digest draft", icon: "mail" },
    { name: "Translate Content", desc: "English ↔ any language", icon: "lang" },
    { name: "Tone Adjustment", desc: "Shift to confident, warm, executive…", icon: "tone" },
    { name: "Generate FAQs", desc: "Questions from a topic", icon: "faq" }
  ]
};

/* ---------- Backend API layer ----------
   The CMS talks to the AV OS server: content store (GET/PUT), publish
   (POST) and uploads. Falls back to localStorage when offline. */
AV.api = {
  connected: false,
  _timer: null,
  csrf: "",
  /* fetch with session CSRF header + auth handling */
  async _req(url, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers["Accept"] = "application/json";
    if (opts.method && opts.method !== "GET") {
      opts.headers["X-CSRF-Token"] = this.csrf;
      opts.headers["Content-Type"] = "application/json";
    }
    opts.credentials = "same-origin";
    const r = await fetch(url, opts);
    if (r.status === 401 && !location.pathname.includes("login")) {
      location.href = "/admin/login.php";
      throw new Error("unauthorized");
    }
    return r;
  },
  async session() {
    try {
      const r = await fetch("/api/session", { credentials: "same-origin" });
      const d = await r.json();
      if (d.ok && d.data && d.data.authed) {
        this.csrf = d.data.csrf || "";
        AV.sessionMustChange = !!d.data.must_change_password;
        AV.permissions = d.data.permissions || [];
        return true;
      }
      return false;
    } catch (e) { return false; }
  },
  async pull() {
    try {
      const r = await this._req("/api/content");
      if (!r.ok) throw new Error("api down");
      const payload = await r.json();
      const data = payload && payload.data ? payload.data : payload;
      if (data && typeof data === "object" && data.settings && data.sections) {
        this.stateVersions = data._versions || {};
        delete data._versions;
        AV.store.state = data;
        AV.store.saveLocal();
        this.connected = true;
        return true;
      }
      throw new Error("bad payload");
    } catch (e) {
      this.connected = false;
      return false;
    }
  },
  cancelPush() {
    clearTimeout(this._timer);
  },
  push() {
    clearTimeout(this._timer);
    this._timer = setTimeout(async () => {
      try {
        const body = Object.assign({}, AV.store.state);
        body.base_versions = this.stateVersions || {};
        const r = await this._req("/api/content", { method: "PUT", body: JSON.stringify(body) });
        if (r.status === 409) {
          this.connected = true;
          if (AV.emitStatus) AV.emitStatus("conflict");
          try {
            const p = await r.json();
            if (AV.toast) AV.toast((p.error && p.error.message) || "Content conflict — another session saved first", "error");
          } catch (e) {}
          return;
        }
        this.connected = r.ok;
        if (r.ok) {
          const p = await r.json().catch(() => ({}));
          if (p.data && p.data.auto_published) {
            if (AV.emitStatus) AV.emitStatus("published");
            if (AV.toast) AV.toast("Saved — public site auto-published", "accent", 2400);
          } else if (AV.emitStatus) {
            AV.emitStatus("saved");
          }
        } else if (AV.emitStatus) {
          AV.emitStatus("save-failed");
        }
      } catch (e) {
        this.connected = false;
        if (AV.emitStatus) AV.emitStatus("save-failed");
      }
    }, 600);
  },
  async publish() {
    if (AV.emitStatus) AV.emitStatus("publishing");
    try {
      const r = await this._req("/api/publish", { method: "POST" });
      const payload = await r.json().catch(() => ({}));
      const body = payload && payload.data ? payload.data : payload;
      const ok = r.ok && payload.ok !== false;
      if (AV.emitStatus) AV.emitStatus(ok ? "published" : "save-failed");
      return { ok, ...body };
    } catch (e) {
      if (AV.emitStatus) AV.emitStatus("save-failed");
      return { ok: false, error: e.message };
    }
  },
  async get(path) {
    try {
      const r = await this._req(path);
      const p = await r.json().catch(() => ({}));
      return { ok: r.ok, data: p.data ?? p, error: p.error };
    } catch (e) { return { ok: false, error: { message: e.message } }; }
  },
  async send(path, method, body) {
    try {
      const r = await this._req(path, { method, body: body ? JSON.stringify(body) : undefined });
      const p = await r.json().catch(() => ({}));
      return { ok: r.ok && p.ok !== false, data: p.data ?? p, error: p.error };
    } catch (e) { return { ok: false, error: { message: e.message } }; }
  },
  async upload(name, base64, folder, dims) {
    try {
      const r = await this._req("/api/media", { method: "POST", body: JSON.stringify({ name, data: base64, folder, ...(dims || {}) }) });
      const payload = await r.json().catch(() => ({}));
      return payload && payload.data ? { ok: r.ok, ...payload.data, error: payload.error && payload.error.message } : payload;
    } catch (e) { return { ok: false, error: e.message }; }
  }
};

/* ---------- Store ---------- */
AV.store = {
  KEY: "avos-state-v1",
  state: null,
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) { this.state = JSON.parse(raw); return; }
    } catch (e) { /* fresh start */ }
    this.state = JSON.parse(JSON.stringify(AV.seed));
    this.save();
  },
  save() {
    this.saveLocal();
    if (AV.emitStatus) AV.emitStatus('local-draft');   // LOCAL DRAFT until server confirms
    AV.api.push();
  },
  saveLocal() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { /* quota */ }
  },
  get(area) { return this.state[area]; },
  set(area, value) { this.state[area] = value; this.save(); },
  reset() { localStorage.removeItem(this.KEY); this.load(); }
};
AV.store.load();
