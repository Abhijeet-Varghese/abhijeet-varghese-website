/* Multi-viewport layout audit — minimal hero + six film frames */
const { chromium } = require('playwright');
const WIDTHS = [390, 768, 1024, 1281, 1440, 1920];
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const r = await page.evaluate(async () => {
      const vw = window.innerWidth;
      const out = { vw, overflow: 0, prologue: {}, identity: {}, frames: [], evo: null, compass: {}, credits: {}, stats: {} };
      out.overflow = document.documentElement.scrollWidth - vw;
      const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) }; };
      // minimal hero
      const title = document.querySelector('.about-prologue__title');
      const chips = document.querySelector('.about-prologue__roles');
      const skip = document.querySelector('.about-prologue__skip');
      const tr = R(title), cr = R(chips), skr = R(skip);
      out.prologue = {
        titleWithinViewport: tr.right <= vw + 1 && tr.left >= 0,
        roleWithinViewport: cr.right <= vw + 1 && cr.left >= 0,
        skipWithinViewport: skr.right <= vw + 1 && skr.left >= 0,
        titleAboveRole: tr.bottom <= cr.top + 1,
        heroMinimal: !document.querySelector('.about-prologue__aperture, .about-prologue__support, .about-prologue__tag, .about-prologue__role, .about-prologue__eyebrow'),
        heroChips: document.querySelectorAll('.about-prologue__role-chip').length,
        heroMarquee: !!document.querySelector('.about-prologue__mq'),
      };
      // identity
      const st = document.querySelector('.about-frame__statement');
      const stR = R(st);
      out.identity = { statementWithin: stR.right <= vw + 1 && stR.left >= 0 };
      if (vw >= 1081) {
        const pr = R(document.querySelector('.about-frame__portrait'));
        out.identity.portraitFlush = Math.abs(pr.right - vw) <= 2;
      }
      // the 3D film stack
      const evo = document.querySelector('.about-evo3d');
      const stage = document.querySelector('.about-evo3d__stage');
      if (evo && stage) {
        const stR = R(stage);
        const card = document.querySelector('.about-evo3d__card');
        const cr = R(card);
        const ct = card.querySelector('.about-evo3d__content').getBoundingClientRect();
        const rail = document.querySelector('.about-evo3d__rail');
        out.evo = {
          cards: document.querySelectorAll('.about-evo3d__card').length,
          stageH: stR.h, vh: window.innerHeight,
          stageFullWidth: Math.abs(stR.left) <= 2 && Math.abs(stR.right - vw) <= 2,
          cardFits: cr.right <= vw + 1 && cr.left >= -1,
          contentFits: ct.right <= vw + 1 && ct.left >= -1,
          noRail: !document.querySelector('.about-evo3d__rail'),
        };
      }
      // compass vs nav (two-axis)
      const comp = document.querySelector('.about-compass');
      const navLinks = document.querySelector('.site-nav__inner .nav-links');
      if (comp && navLinks) {
        const cr = R(comp), nr = R(navLinks);
        const overlap = !(cr.right < nr.left || cr.left > nr.right) && !(cr.bottom < nr.top || cr.top > nr.bottom) && vw > 700;
        out.compass = { withinViewport: cr.right <= vw + 1 && cr.left >= 0, overlapsNav: overlap && vw >= 701 && vw <= 1100 };
      }
      // credits centered
      const ci = document.querySelector('.about-credits__inner');
      const cir = R(ci);
      const cw = document.querySelector('.about-credits').getBoundingClientRect().width;
      out.credits = { centered: Math.abs(cir.left - (cw - cir.w) / 2) <= 2 };
      return out;
    });
    if (r.overflow > 0) issues.push(`${w}px: HORIZONTAL OVERFLOW ${r.overflow}`);
    if (!r.prologue.titleWithinViewport) issues.push(`${w}px: title outside viewport`);
    if (!r.prologue.roleWithinViewport) issues.push(`${w}px: role outside viewport`);
    if (!r.prologue.skipWithinViewport) issues.push(`${w}px: skip outside viewport`);
    if (!r.prologue.titleAboveRole) issues.push(`${w}px: title/role order`);
    if (!r.prologue.heroMinimal) issues.push(`${w}px: hero not minimal`);
    if (r.prologue.heroChips < 4) issues.push(`${w}px: hero chips ${r.prologue.heroChips}`);
    if (!r.prologue.heroMarquee) issues.push(`${w}px: hero marquee missing`);
    if (!r.identity.statementWithin) issues.push(`${w}px: statement outside viewport`);
    if (w >= 1081 && !r.identity.portraitFlush) issues.push(`${w}px: portrait not flush`);
    if (r.evo) {
      if (r.evo.cards !== 8) issues.push(`${w}px: evo cards ${r.evo.cards}`);
      if (Math.abs(r.evo.stageH - r.evo.vh) > 4) issues.push(`${w}px: stage height ${r.evo.stageH}/${r.evo.vh}`);
      if (!r.evo.stageFullWidth) issues.push(`${w}px: stage not full width`);
      if (!r.evo.cardFits) issues.push(`${w}px: card out of viewport`);
      if (!r.evo.contentFits) issues.push(`${w}px: card content out of viewport`);
      if (!r.evo.noRail) issues.push(`${w}px: rail still present`);
    }
    if (r.compass.overlapsNav) issues.push(`${w}px: compass overlaps nav`);
    if (!r.credits.centered) issues.push(`${w}px: credits not centered`);
    console.log(`${w}px: overflow=${r.overflow} heroMin=${r.prologue.heroMinimal} chips=${r.prologue.heroChips} mq=${r.prologue.heroMarquee} cards=${r.evo ? r.evo.cards : 0} stage=${r.evo ? r.evo.stageH + '/' + r.evo.vh : '-'}`);
    await page.close();
  }
  console.log(issues.length ? 'LAYOUT ISSUES:\n' + issues.join('\n') : 'LAYOUT AUDIT: ALL CLEAN');
  await browser.close();
})();
