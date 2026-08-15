/* Multi-viewport layout audit — opens every chapter, checks geometry */
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
      const out = { vw, overflow: 0, prologue: {}, identity: {}, rows: [], open: [], compass: {}, credits: {}, zoom: {}, stats: {} };
      out.overflow = document.documentElement.scrollWidth - vw;
      const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) }; };
      // prologue
      const ap = document.querySelector('.about-prologue__aperture');
      const title = document.querySelector('.about-prologue__title');
      const skip = document.querySelector('.about-prologue__skip');
      const mq = document.querySelector('.about-prologue__mq');
      const apr = R(ap), tr = R(title), skr = R(skip), mqr = R(mq);
      out.prologue = {
        titleInside: tr.right <= apr.right + 1 && tr.left >= apr.left - 1,
        titleWithinViewport: tr.right <= vw + 1 && tr.left >= 0,
        skipVsMq: skr.bottom <= mqr.top + 2,   // no overlap with marquee
        apertureH: apr.h, contentH: skr.bottom - tr.top,
        apertureContains: skr.bottom <= apr.bottom + 1 && tr.top >= apr.top - 1,
      };
      // identity
      const st = document.querySelector('.about-frame__statement');
      const stR = R(st);
      out.identity = { statementWithin: stR.right <= vw + 1 && stR.left >= 0 };
      if (vw >= 1081) {
        const pr = R(document.querySelector('.about-frame__portrait'));
        out.identity.portraitFlush = Math.abs(pr.right - vw) <= 2;
      }
      // collapsed rows — ghost numeral + name + chevron inside viewport
      document.querySelectorAll('.about-act__trigger').forEach(t => {
        const nm = R(t.querySelector('.about-act__name'));
        const ch = R(t.querySelector('.about-act__chev'));
        out.rows.push({ nameInside: nm.right <= vw + 1 && nm.left >= 0, chevInside: ch.right <= vw + 1 });
      });
      // open each chapter, check scene geometry
      for (const n of ['01','02','03','04','05','06']) {
        const trig = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-' + n + '"]');
        if (trig.getAttribute('aria-expanded') !== 'true') trig.click();
        await new Promise(res => setTimeout(res, 1300));
        const panel = document.getElementById('aboutActPanel-' + n);
        const scene = panel.querySelector('.about-act__scene');
        const sheet = panel.querySelector('.about-act__sheet');
        const head = panel.querySelector('.about-act__head');
        const fig = panel.querySelector('.about-figure');
        const sr = R(scene), shR = R(sheet), hR = R(head), fr = fig ? R(fig) : null;
        let bleed = null, painted = null;
        if (fig && vw >= 1281) {
          const side = scene.dataset.side;
          const probe = side === 'right' ? vw - 4 : 4;
          const y = Math.round(fr.top + fr.h / 2);
          const hit = document.elementFromPoint(probe, y);
          painted = !!(hit && fig.contains(hit));
          bleed = side === 'right' ? Math.abs(fr.right - vw) <= 2 : Math.abs(fr.left) <= 2;
        }
        out.open.push({
          n,
          sheetInsideScene: shR.right <= sr.right + 1 && shR.left >= sr.left - 1 && shR.left >= 0,
          sheetNoOverlapHead: hR.right <= shR.left + 1,
          figBleed: bleed, figPainted: painted,
          bodyInside: (() => { const b = R(panel.querySelector('.about-act__body')); return b.right <= vw + 1; })(),
        });
        // close it again (except last) to keep heights stable
        if (n !== '06') { trig.click(); await new Promise(res => setTimeout(res, 700)); }
      }
      // compass vs nav
      const comp = document.querySelector('.about-compass');
      const navLinks = document.querySelector('.site-nav__inner .nav-links');
      if (comp && navLinks) {
        const cr = R(comp), nr = R(navLinks);
        const overlap = !(cr.right < nr.left || cr.left > nr.right) && vw > 700;
        out.compass = { withinViewport: cr.right <= vw + 1 && cr.left >= 0, overlapsNav: overlap && vw >= 701 && vw <= 1100 };
      }
      // credits inner centered
      const ci = document.querySelector('.about-credits__inner');
      const cir = R(ci);
      const cw = document.querySelector('.about-credits').getBoundingClientRect().width;
      out.credits = { centered: Math.abs(cir.left - (cw - cir.w) / 2) <= 2 };
      // stats
      const stats = document.querySelector('.about-stats__grid');
      const sr2 = R(stats);
      out.stats = { within: sr2.right <= vw + 1 && sr2.left >= 0 };
      return out;
    });
    // collect
    if (r.overflow > 0) issues.push(`${w}px: HORIZONTAL OVERFLOW ${r.overflow}`);
    if (!r.prologue.titleInside) issues.push(`${w}px: prologue title outside aperture`);
    if (!r.prologue.titleWithinViewport) issues.push(`${w}px: prologue title outside viewport`);
    if (!r.prologue.skipVsMq) issues.push(`${w}px: skip link overlaps marquee`);
    if (w >= 1081 && !r.prologue.apertureContains) issues.push(`${w}px: content taller than aperture frame`);
    if (!r.identity.statementWithin) issues.push(`${w}px: statement outside viewport`);
    if (w >= 1081 && !r.identity.portraitFlush) issues.push(`${w}px: portrait not flush (${JSON.stringify(r.identity)})`);
    r.rows.forEach((row, i) => {
      if (!row.nameInside || !row.chevInside) issues.push(`${w}px: row ${i + 1} name/chevron out`);
    });
    r.open.forEach(o => {
      if (!o.sheetInsideScene) issues.push(`${w}px: ch${o.n} sheet outside scene`);
      if (!o.sheetNoOverlapHead) issues.push(`${w}px: ch${o.n} head overlaps sheet`);
      if (o.figBleed === false) issues.push(`${w}px: ch${o.n} figure bleed wrong`);
      if (o.figPainted === false) issues.push(`${w}px: ch${o.n} figure CLIPPED (not painted)`);
      if (!o.bodyInside) issues.push(`${w}px: ch${o.n} body outside viewport`);
    });
    if (r.compass.overlapsNav) issues.push(`${w}px: compass overlaps nav links`);
    if (!r.credits.centered) issues.push(`${w}px: credits inner not centered`);
    if (!r.stats.within) issues.push(`${w}px: stats band out`);
    console.log(`${w}px: overflow=${r.overflow} prologue=${JSON.stringify(r.prologue)} rows=${r.rows.length} openOK=${r.open.filter(o=>o.sheetInsideScene&&o.sheetNoOverlapHead).length}/${r.open.length} paint=${r.open.filter(o=>o.figPainted!==false).length}/${r.open.filter(o=>o.figPainted!==null).length} bleedOK=${r.open.filter(o=>o.figBleed!==false).length}/${r.open.filter(o=>o.figBleed!==null).length}`);
    await page.close();
  }
  console.log(issues.length ? 'LAYOUT ISSUES:\n' + issues.join('\n') : 'LAYOUT AUDIT: ALL CLEAN');
  await browser.close();
})();
