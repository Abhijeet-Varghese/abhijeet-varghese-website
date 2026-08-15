/* v2.4.20 hybrid — arena hero + v2.4.19 sections + merged single-row footer (v2.6.4 parity) */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 100)));
  await page.goto('http://127.0.0.1:8092/?hq=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const issues = [];
  const r = await page.evaluate(() => {
    const out = {};
    // arena hero present
    out.hero = !!document.querySelector('.hp-hero__name');
    out.heroPortraitFits = (() => { const r = document.querySelector('.hp-hero__portrait').getBoundingClientRect(); return r.bottom <= window.innerHeight + 1; })();
    // v2.4.19 sections present (classic classes)
    out.sections = {
      clients: !!document.querySelector('.logo-wall'),
      caps: !!document.querySelector('.cap-list'),
      work: !!document.querySelector('.case__card') || document.querySelectorAll('.case').length,
      thinking: !!document.querySelector('.thinking__quote'),
      journey: !!document.querySelector('.journey__pin'),
      ai: !!document.querySelector('.ai__grid'),
      focus: !!document.querySelector('.focus__list'),
      contact: !!document.querySelector('.book'),
    };
    // section order ids
    out.ids = Array.from(document.querySelectorAll('section[id]')).map(s => s.id).filter(i => ['hero','clients','capabilities','work','thinking','journey','ai','focus','contact'].includes(i));
    // journey eras from v2.4.19 (real data)
    out.eras = document.querySelectorAll('#journeyTrack .era').length;
    // footer dark + single row (v2.6.4): brand + 4 columns on one line,
    // bottom strip full-width beneath, one Social block only (deduped)
    const footer = document.querySelector('.footer');
    const inner = document.querySelector('.footer__inner');
    out.footerBg = getComputedStyle(footer).backgroundColor;
    out.footerDisplay = getComputedStyle(inner).display;
    out.colCount = inner.querySelectorAll('.footer__col').length;
    const brandR = document.querySelector('.footer__brand').getBoundingClientRect();
    const colRs = Array.from(inner.querySelectorAll('.footer__col')).map(c => c.getBoundingClientRect());
    const bottomR = document.querySelector('.footer__bottom').getBoundingClientRect();
    const innerR = inner.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(inner).paddingLeft);
    const padR = parseFloat(getComputedStyle(inner).paddingRight);
    out.singleRow = colRs.length > 0 && colRs.every(c => Math.abs(c.top - brandR.top) < 4);
    const rowBottom = Math.max(brandR.bottom, ...colRs.map(c => c.bottom));
    out.bottomFullWidth = Math.abs((bottomR.left - innerR.left) - padL) < 2
      && Math.abs((innerR.right - bottomR.right) - padR) < 2
      && bottomR.top >= rowBottom - 1;
    out.bottomJustify = getComputedStyle(document.querySelector('.footer__bottom')).justifyContent;
    // v2.6.4 parity: copyright at left edge, back-to-top at right edge
    const copyR = document.querySelector('.footer__copy').getBoundingClientRect();
    const topR = document.querySelector('.footer__top').getBoundingClientRect();
    out.copyAtLeft = Math.abs((copyR.left - innerR.left) - padL) < 2;
    out.topAtRight = Math.abs((innerR.right - topR.right) - padR) < 2;
    // the tagline band above the footer was removed (v2.4.20) — footer starts clean
    out.faSceneGone = document.querySelectorAll('.fa-scene').length === 0;
    // no arena extras
    out.arenaCaps = !!document.getElementById('capsStage');
    out.arenaMenuBtn = !!document.querySelector('.arena-menu__toggle');
    // overflow
    out.overflow = document.documentElement.scrollWidth - window.innerWidth;
    return out;
  });
  console.log('HOME:', JSON.stringify(r, null, 1));
  if (!r.hero || !r.heroPortraitFits) issues.push('HERO MISSING/BROKEN');
  for (const [k, v] of Object.entries(r.sections)) if (!v) issues.push(`SECTION MISSING: ${k}`);
  if (r.ids.join(',') !== 'hero,clients,capabilities,work,thinking,journey,ai,focus,contact') issues.push('ORDER: ' + r.ids.join(','));
  if (r.eras < 9) issues.push('ERAS ' + r.eras);
  if (r.arenaCaps || r.arenaMenuBtn) issues.push('ARENA EXTRAS PRESENT');
  if (r.overflow > 0) issues.push('OVERFLOW ' + r.overflow);
  // footer: dark + single row + one Social block + full-width bottom strip
  if (r.footerBg !== 'rgb(5, 7, 13)') issues.push('FOOTER BG ' + r.footerBg);
  if (r.footerDisplay !== 'flex') issues.push('FOOTER NOT FLEX: ' + r.footerDisplay);
  if (r.colCount !== 4) issues.push('FOOTER COLS ' + r.colCount + ' (expect 4: Menu/Resources/Social/Legal)');
  if (!r.singleRow) issues.push('FOOTER NOT SINGLE ROW');
  if (!r.bottomFullWidth) issues.push('FOOTER BOTTOM NOT FULL-WIDTH BELOW ROW');
  if (r.bottomJustify !== 'space-between') issues.push('FOOTER BOTTOM NOT SPACE-BETWEEN: ' + r.bottomJustify);
  if (!r.copyAtLeft) issues.push('FOOTER COPY NOT LEFT');
  if (!r.topAtRight) issues.push('FOOTER BACK-TO-TOP NOT RIGHT');
  console.log('FOOTER:', r.footerDisplay, '| cols:', r.colCount, '| singleRow:', r.singleRow, '| bottomFullWidth:', r.bottomFullWidth, '| bottomJustify:', r.bottomJustify, '| copyLeft:', r.copyAtLeft, '| topRight:', r.topAtRight, '| bg:', r.footerBg);
  // v2.4.19 work card invariant
  const work = await page.evaluate(() => {
    const c = document.querySelector('.case__card');
    if (!c) return null;
    const client = c.querySelector('.case__client');
    const title = c.querySelector('.case__title');
    const cta = c.querySelector('.case__card-cta');
    if (!client || !title || !cta) return null;
    return { clientBigger: parseFloat(getComputedStyle(client).fontSize) > parseFloat(getComputedStyle(title).fontSize), ctaText: cta.textContent.trim().slice(0, 24) };
  });
  console.log('WORK CARD:', JSON.stringify(work));
  if (!work || !work.clientBigger) issues.push('WORK CARD BROKEN');
  // journey coda present
  const coda = await page.evaluate(() => (document.querySelector('.journey__coda') || {}).textContent || '');
  console.log('CODA:', coda.trim().slice(0, 40));
  // mid width — the "preview pane" size (~1201px): single row must hold
  await page.setViewportSize({ width: 1201, height: 900 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const mid = await page.evaluate(() => {
    const inner = document.querySelector('.footer__inner');
    const brand = document.querySelector('.footer__brand').getBoundingClientRect();
    const cols = Array.from(inner.querySelectorAll('.footer__col')).map(c => c.getBoundingClientRect());
    return {
      singleRow: cols.length === 4 && cols.every(c => Math.abs(c.top - brand.top) < 4),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  console.log('MID 1201:', JSON.stringify(mid));
  if (!mid.singleRow || mid.overflow > 0) issues.push('MID 1201 FOOTER NOT SINGLE ROW');
  // mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const m = await page.evaluate(() => {
    const port = document.querySelector('.hp-hero__portrait').getBoundingClientRect();
    const brandB = document.querySelector('.footer__brand').getBoundingClientRect().bottom;
    const colT = document.querySelector('.footer__col').getBoundingClientRect().top;
    return {
      portFits: port.bottom <= 844,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      sections: document.querySelectorAll('.logo-wall, .cap-list, .thinking__quote, .book').length,
      navToggle: !!document.getElementById('navToggle'),
      footerStacked: colT >= brandB - 1,
    };
  });
  console.log('MOBILE:', JSON.stringify(m));
  if (!m.portFits || m.overflow > 0 || m.sections < 3 || !m.navToggle) issues.push('MOBILE FAIL');
  if (!m.footerStacked) issues.push('MOBILE FOOTER NOT STACKED');
  if (errs.length) issues.push('JSERR: ' + errs.join('|'));
  console.log(issues.length ? 'ISSUES:\n' + issues.join('\n') : 'HYBRID QA: ALL CLEAN');
  await browser.close();
})();
