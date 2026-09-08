/* v2.4.20 About — THE STORY QA:
   - footer identical to homepage (arena footer) on every page
   - Frame summary on page, no "Frame" title
   - evolution chapters numbered 01–06, expand below, images everywhere
   - hover shows the chapter's image
   - creative inner scene (ghost numeral + sticky chapter rail + sheet)
   - copy preserved */
const { chromium } = require('playwright');
const axe = require('axe-core');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  const issues = [];
  const r = await page.evaluate(() => {
    const out = {};
    out.pageH = document.documentElement.scrollHeight;
    out.noHero = document.querySelectorAll('.hero').length === 0;
    const norm = document.body.textContent.replace(/\s+/g, ' ').replace(/\u2019/g, "'");
    // prologue
    out.prologueTitle = (document.querySelector('.about-prologue__title') || {}).textContent || '';
    out.roleLine = (document.querySelector('.about-credits__role') || {}).textContent || '';
    // identity hub
    out.identity = !!document.querySelector('.about-frame__spread');
    out.identityName = (document.querySelector('.about-credits__sig') || {}).textContent || '';
    out.portrait = !!document.querySelector('.about-frame__portrait img');
    out.statement = (document.querySelector('.about-frame__statement') || {}).textContent || '';
    out.bioParas = document.querySelectorAll('.about-frame__bio p').length;
    out.whatRows = document.querySelectorAll('.about-what__list li').length;
    out.courses = document.querySelectorAll('.about-frame__fact:nth-child(2) li').length;
    out.territories = document.querySelectorAll('.about-frame__fact:nth-child(3) li').length;
    out.question = (document.querySelector('.about-frame__question') || {}).textContent || '';
    out.nums = Array.from(document.querySelectorAll('.about-frame__num strong')).map(n => n.textContent.replace(/\s+/g, ''));
    out.numLabels = Array.from(document.querySelectorAll('.about-frame__num > span')).map(s => s.textContent.trim());
    out.facts = document.querySelectorAll('.about-frame__fact').length;
    out.education = (document.querySelector('.about-frame__fact-line') || {}).textContent || '';
    out.factLines = Array.from(document.querySelectorAll('.about-frame__fact-line')).map(l => l.textContent.trim());
    out.credo = (document.querySelector('.about-frame__credo-title') || {}).textContent || '';
    out.credo = (document.querySelector('.about-frame__credo-title') || {}).textContent || '';
    // evolution
    out.scenes = document.querySelectorAll('.about-evo3d__card').length;
    out.nums2 = Array.from(document.querySelectorAll('.about-evo3d__card')).map(s => s.dataset.act || '');
    out.labels = document.querySelectorAll('.about-evo3d__category').length;
    out.headlines = Array.from(document.querySelectorAll('.about-evo3d__title')).map(x => x.textContent.replace(/\s+/g, ' ').trim());
    out.system = document.querySelectorAll('.about-evo3d__system li').length;
    out.systemNames = Array.from(document.querySelectorAll('.about-evo3d__system li')).map(s => s.textContent.trim());
    // interludes + closing
    out.interludes = document.querySelectorAll('.about-evo3d__card--interlude').length;
    out.noPhilosophy = !document.querySelector('.about-philosophy');
    out.what = (document.querySelector('.about-what__title') || {}).textContent || '';
    out.now = (document.querySelector('.about-now__title') || {}).textContent || '';
    out.curious = document.querySelectorAll('.about-curious__list li').length;
    out.curiousTitle = (document.querySelector('.about-curious__title') || {}).textContent || '';
    out.credits = !!document.querySelector('.about-credits__quote');
    out.creditsExtras = !!document.querySelector('.about-credits__fin, .about-credits__bg, .about-credits__mq, .about-credits__portrait');
    // dedicated about image system — no recycled imagery
    out.aboutImgs = Array.from(document.querySelectorAll('img')).map(i => (i.getAttribute('src') || '')).filter(s => s.includes('about/about-')).length;
    out.recycled = Array.from(document.querySelectorAll('img')).map(i => (i.getAttribute('src') || '')).filter(s => /case-|essay-|journal-|working-session|experience-centre/.test(s)).length;
    out.systemNodes = document.querySelectorAll('.about-evo3d__system li').length;
    // beyond-apple — optical tracking, press feedback, material
    out.displayTracking = getComputedStyle(document.querySelector('.about-prologue__title')).letterSpacing;
    out.bodyTracking = getComputedStyle(document.querySelector('.about-frame__bio p')).letterSpacing;
    out.materialKeyframe = Array.from(document.styleSheets).some(s => {
      try { return Array.from(s.cssRules).some(r => r.name === 'materialArrive'); } catch (e) { return false; }
    });
    out.entityLeak = /&amp;|&lt;|&gt;/.test(document.body.textContent);
    // chrome
    out.footerArena = document.querySelector('.footer').classList.contains('footer--arena');
    out.footerBg = getComputedStyle(document.querySelector('.footer')).backgroundColor;
    out.overflow = document.documentElement.scrollWidth - window.innerWidth;
    // copy anchors
    const mustHave = [
      "I DIDN'T START OUT", 'DESIGNING EXPERIENCES.',
      'Creative Director & Experience Designer',
      'I design experiences', 'by thinking beyond the frame',
      'turning complex ideas into experiences people can understand, feel and remember',
      'How should this be experienced?',
      '12+', '65+', '100+',
      'Years of practice', 'Clients served', 'Projects delivered',
      'BA — VFX & Animation',
      'What Is the Metaverse — Meta', 'Digital Business Strategy — University of Virginia', 'Digital Transformation',
      'Creative Direction', 'Immersive Experiences', 'Spatial / Environmental Experiences', 'Production & Execution',
      'Technology is part of my vocabulary.', 'Experience is where they come together.',
            "I'm a creative person first.",
      'kept getting bigger.',
      'I LEARNED TO THINK IN TIME.', 'THEN THE FRAME STARTED RESPONDING.',
      "THEN THE SCREEN WASN'T ENOUGH.", 'THEN EVERYTHING HAD TO WORK TOGETHER.',
      'BECAUSE EXPERIENCES ARE FOR PEOPLE.', 'THEN THE WORK BECAME BIGGER THAN THE IDEA.',
      'FRAME · TIMING · MOVEMENT', 'STORY · SYSTEM · TECHNOLOGY · REALITY', 'IDEA · TEAM · EXECUTION',
      'THE DISTANCE BETWEEN THE IDEA AND REALITY.', 'GOOD IDEAS HAVE TO SURVIVE REALITY.',
      'SPACE HAS A NARRATIVE TOO.',
      'I take complicated things', 'figure out how people should experience them',
      'Hard problems.', 'Ambitious ideas.', 'Experiences with a reason to exist.',
      'Still curious.', 'Still learning.', 'Still getting distracted by interesting interfaces.',
      "That's probably what hasn't changed.",
      'Does it look good?', 'Does it work?',
      'Start a conversation', '— Abhijeet Varghese',
    ];
    out.missing = mustHave.filter(s => !norm.includes(s));
    return out;
  });
  console.log('ABOUT:', JSON.stringify({ pageH: r.pageH, prologueTitle: r.prologueTitle.slice(0, 30), identity: r.identity, statement: r.statement.slice(0, 40), nums: r.nums, facts: r.facts, courses: r.courses, territories: r.territories, triggers: r.triggers, labels: r.labels, system: r.system, interludes: r.interludes, philosophy: r.philosophy, curious: r.curious, footerBg: r.footerBg, overflow: r.overflow, missing: r.missing }, null, 1));
  if (!r.noHero) issues.push('HERO PRESENT');
  if (!r.prologueTitle.replace(/\s+/g, ' ').includes("I DIDN'T START OUT")) issues.push("PROLOGUE TITLE");
  if (!r.roleLine.includes('Creative Director')) issues.push('ROLE LINE');
  if (!r.identity) issues.push('IDENTITY MISSING');
  if (!r.identityName.includes('Abhijeet Varghese')) issues.push('IDENTITY NAME ' + r.identityName);
  if (!r.portrait) issues.push('NO PORTRAIT');
  if (!r.statement.includes('I design experiences')) issues.push('STATEMENT');
  if (r.bioParas !== 3) issues.push('BIO ' + r.bioParas);
  if (r.whatRows !== 6) issues.push('WHAT ROWS ' + r.whatRows);
  if (r.courses !== 3) issues.push('COURSES ' + r.courses);
  if (r.territories !== 9) issues.push('TERRITORIES ' + r.territories);
  if (!r.question.includes("How should this be experienced?")) issues.push("QUESTION");
  if (r.nums.join(',') !== '12+,65+,100+') issues.push('NUMS ' + r.nums.join(','));
  if (r.numLabels.join(',') !== 'Years of practice,Clients served,Projects delivered') issues.push('NUM LABELS');
  if (r.facts !== 3) issues.push('FACTS ' + r.facts);
  if (!r.education.includes('BA — VFX')) issues.push('EDUCATION');
  if (!r.credo.toLowerCase().includes("creative person first")) issues.push("CREDO");
  if (!r.credo.toLowerCase().includes("creative person first")) issues.push("CREDO");
  if (r.scenes !== 8) issues.push('CARDS ' + r.scenes);
  if (r.nums2.join(',') !== '01,02,03,04,05,06,07,08') issues.push('SEQUENCE ' + r.nums2.join(','));
  if (r.labels !== 6) issues.push('LABELS ' + r.labels);
  if (r.headlines.length < 6) issues.push('HEADLINES ' + r.headlines.length);
  if (r.system !== 7) issues.push('SYSTEM ' + r.system);
  if (r.systemNames.join('|') !== 'STORY|AUDIENCE|INTERACTION|SPACE|TECHNOLOGY|PRODUCTION|REALITY') issues.push('SYSTEM NAMES');
  if (r.interludes !== 2) issues.push('INTERLUDES ' + r.interludes);
  if (!r.noPhilosophy) issues.push('PHILOSOPHY STILL PRESENT');
  if (!r.what.includes('I take complicated things')) issues.push('WHAT');
  if (!r.now.includes("Hard problems.")) issues.push("NOW");
  if (r.curious !== 5 || !r.curiousTitle.includes("Still curious")) issues.push("CURIOUS " + r.curious);
  if (!r.credits) issues.push('CREDITS MISSING');
  if (r.creditsExtras) issues.push('CREDITS EXTRAS REMAIN');
  if (r.aboutImgs < 6) issues.push('ABOUT IMAGES ' + r.aboutImgs);
  if (r.recycled > 0) issues.push('RECYCLED IMAGERY ' + r.recycled);
  if (r.systemNodes !== 7) issues.push('SYSTEM NODES ' + r.systemNodes);
  if (parseFloat(r.displayTracking) > -0.03) issues.push('DISPLAY TRACKING ' + r.displayTracking);
  if (r.bodyTracking !== 'normal' && parseFloat(r.bodyTracking) !== 0) issues.push('BODY TRACKING ' + r.bodyTracking);
  if (!r.materialKeyframe) issues.push('NO MATERIAL ARRIVE');
  if (!r.footerArena || r.footerBg !== 'rgb(5, 7, 13)') issues.push('FOOTER ' + r.footerBg);
  if (r.entityLeak) issues.push('ENTITY LEAK (&amp; visible)');
  if (r.overflow > 0) issues.push('OVERFLOW ' + r.overflow);
  if (r.missing.length) issues.push('COPY MISSING: ' + r.missing.join(' | '));
  // --- instant press feedback: pointerdown sets is-pressing (compass) ---
  await page.evaluate(() => {
    const t = document.getElementById('aboutCompassBtn');
    t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    return t.classList.contains('is-pressing');
  }).then(p => { if (!p) issues.push('NO PRESS FEEDBACK'); });
  await page.evaluate(() => document.getElementById('aboutCompassBtn').classList.remove('is-pressing'));

  // --- zoom stage: image fills the canvas at the top (scale ~1) ---
  await page.evaluate(() => {
    const zs = document.getElementById('aboutZoomStage');
    window.scrollTo(0, zs.offsetTop - window.innerHeight + 120);
  });
  await page.waitForTimeout(600);
  const zoomFill = await page.evaluate(() => {
    const f = document.getElementById('aboutZoomFrame');
    const m = new DOMMatrixReadOnly(getComputedStyle(f).transform);
    const img = f.querySelector('img').getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    return { scaleX: +m.a.toFixed(3), imgW: Math.round(img.width), frameW: Math.round(fr.width) };
  });
  console.log('ZOOM FILL:', JSON.stringify(zoomFill));
  if (Math.abs(zoomFill.scaleX - 1.08) > 0.08) issues.push('ZOOM NOT OVERSCANNED AT TOP ' + zoomFill.scaleX);
  if (zoomFill.imgW < zoomFill.frameW - 4) issues.push('ZOOM IMAGE SMALLER THAN CANVAS ' + zoomFill.imgW + '/' + zoomFill.frameW);

  // --- the 3D film stack: seek into card 03 and verify ---
  const seekCard = act => page.evaluate(n => {
    const runway = document.querySelector('.about-evo3d__scroll');
    const total = document.querySelectorAll('.about-evo3d__card').length;
    const scrollable = Math.max(runway.offsetHeight - window.innerHeight, 1);
    const point = n === 1 ? 0 : (n - 1) + 0.12;
    window.scrollTo(0, runway.getBoundingClientRect().top + window.scrollY + scrollable * point / (total + 1.2));
  }, act);
  await seekCard(1);
  await page.waitForTimeout(1200);
  await seekCard(3);
  await page.waitForTimeout(1600);
  const exp = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="03"]');
    const stage = document.querySelector('.about-evo3d__stage');
    const sr = stage.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const content = card.querySelector('.about-evo3d__content').getBoundingClientRect();
    return {
      world: card.dataset.world || '',
      category: card.querySelector('.about-evo3d__category').textContent.trim(),
      title: card.querySelector('.about-evo3d__title').textContent.replace(/\s+/g, ' ').trim(),
      note: card.querySelector('.about-evo3d__note').textContent.trim(),
      desc: card.querySelector('.about-evo3d__desc').textContent.trim(),
      stmt: (card.querySelector('.about-evo3d__stmt') || {}).textContent || '',
      img: card.querySelectorAll('.about-evo3d__image').length,
      metaName: card.querySelector('.about-evo3d__meta span:last-child').textContent.trim(),
      stageFullWidth: Math.abs(sr.left) <= 2 && Math.abs(sr.right - window.innerWidth) <= 2,
      cardFits: cr.width <= window.innerWidth + 1 && cr.left >= -1,
      contentAtBottom: content.bottom <= cr.bottom + 2 && content.top > cr.top + cr.height * 0.3,
      glass: (() => { const cs = getComputedStyle(card.querySelector('.about-evo3d__content')); return cs.backdropFilter !== 'none' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'; })(),
      samePage: location.pathname === '/story.html',
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
    };
  });
  console.log('EVO3D CARD 03:', JSON.stringify(exp));
  if (exp.world !== 'environment') issues.push('WORLD ' + exp.world);
  if (!exp.category.includes('SPACE · SCALE · ATMOSPHERE')) issues.push('CATEGORY ' + exp.category);
  if (!exp.title.includes("THEN THE SCREEN WASN'T ENOUGH.")) issues.push('TITLE ' + exp.title);
  if (!exp.note) issues.push('NO NOTE');
  if (!exp.desc) issues.push('NO DESC');
  if (!exp.stmt.includes('SPACE HAS A NARRATIVE TOO.')) issues.push('STMT ' + exp.stmt);
  if (exp.img < 1) issues.push('NO CARD IMAGE');
  if (exp.metaName !== 'Environment') issues.push('META NAME ' + exp.metaName);
  if (!exp.stageFullWidth) issues.push('STAGE NOT FULL WIDTH');
  if (!exp.cardFits) issues.push('CARD OUT OF VIEWPORT');
  if (!exp.contentAtBottom) issues.push('CONTENT NOT AT BOTTOM');
  if (!exp.glass) issues.push('NO GLASS PLATE');
  if (!exp.samePage) issues.push('NAVIGATED AWAY');
  if (exp.bodyLocked) issues.push('BODY LOCKED');

  // axe on the stage (active card region)
  await page.addScriptTag({ content: axe.source });
  const ax = await page.evaluate(async () => {
    const stage = document.querySelector('.about-evo3d__stage');
    if (!stage) return [{ id: 'no-stage', nodes: 0 }];
    const res = await axe.run(stage, { runOnly: { type: 'rule', values: ['color-contrast'] } });
    return res.violations.map(v => ({ id: v.id, nodes: v.nodes.length }));
  });
  console.log('AXE STAGE:', JSON.stringify(ax));
  if (ax.length) issues.push('AXE STAGE ' + JSON.stringify(ax));

  // ch04 — the signal chain; ch06 — the duo
  await seekCard(4);
  await page.waitForTimeout(1600);
  const sys = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="04"]');
    return Array.from(card.querySelectorAll('.about-evo3d__system li')).map(li => li.textContent.trim()).join('|');
  });
  console.log('SYSTEM:', sys);
  if (sys !== 'STORY|AUDIENCE|INTERACTION|SPACE|TECHNOLOGY|PRODUCTION|REALITY') issues.push('SYSTEM NAMES ' + sys);
  await seekCard(6);
  await page.waitForTimeout(1600);
  const duo = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="06"]');
    return (card.querySelector('.about-evo3d__duo') || {}).textContent || '';
  });
  if (!duo.includes('Does it look good?') || !duo.includes('Does it work?')) issues.push('DUO ' + duo);

  // --- footer identical on another page (contact) ---
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page2.goto('http://127.0.0.1:8092/contact.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(1800);
  const f2 = await page2.evaluate(() => {
    const footer = document.querySelector('.footer');
    const inner = document.querySelector('.footer__inner');
    const brand = document.querySelector('.footer__brand').getBoundingClientRect();
    const cols = Array.from(inner.querySelectorAll('.footer__col')).map(c => c.getBoundingClientRect());
    return {
      arena: footer.classList.contains('footer--arena'),
      bg: getComputedStyle(footer).backgroundColor,
      cols: cols.length,
      singleRow: cols.length === 4 && cols.every(c => Math.abs(c.top - brand.top) < 4),
    };
  });
  console.log('CONTACT FOOTER:', JSON.stringify(f2));
  if (!f2.arena || f2.bg !== 'rgb(5, 7, 13)' || f2.cols !== 4 || !f2.singleRow) issues.push('CONTACT FOOTER NOT IDENTICAL ' + JSON.stringify(f2));
  await page2.close();

  // --- mobile: the stack recomposes ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8092/story.html?as4=mobile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const world = document.querySelector('.about-evo3d__world');
    const wr = world.getBoundingClientRect();
    const card = document.querySelector('.about-evo3d__card');
    const content = card.querySelector('.about-evo3d__content').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      worldW: Math.round(wr.width),
      vw: window.innerWidth,
      contentFits: content.right <= window.innerWidth + 1 && content.left >= -1,
    };
  });
  console.log('MOBILE:', JSON.stringify(m));
  if (m.overflow > 0 || m.worldW > m.vw + 1 || !m.contentFits) issues.push('MOBILE FAIL ' + JSON.stringify(m));

  if (errs.length) issues.push('JSERR: ' + errs.join('|'));
  console.log(issues.length ? 'ISSUES:\n' + issues.join('\n') : 'ABOUT STORY QA: ALL CLEAN');
  await browser.close();
})();
