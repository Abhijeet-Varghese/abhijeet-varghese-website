const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const r = {};
  // 1. delegated press feedback on a LINK (nav link + skip link + footer link)
  r.linkPress = await page.evaluate(() => {
    const a = document.querySelector('.site-nav__inner .nav-links a');
    a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const has = a.classList.contains('is-pressing');
    a.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    return has;
  });
  // 2. compass sheet materializes (is-show after open, not instant-hidden)
  await page.evaluate(() => {
    const btn = document.getElementById('aboutCompassBtn');
    const list = document.getElementById('aboutCompassList');
    if (!btn) return;
    if (list.hidden) btn.click();
  });
  await page.waitForTimeout(500);
  r.sheetOpen = await page.evaluate(() => {
    const list = document.getElementById('aboutCompassList');
    return { shown: list.classList.contains('is-show'), hidden: list.hidden, expanded: document.getElementById('aboutCompassBtn').getAttribute('aria-expanded'), opacity: getComputedStyle(list).opacity, transform: getComputedStyle(list).transform };
  });
  // close and verify symmetric exit (is-closing then hidden)
  await page.evaluate(() => document.getElementById('aboutCompassBtn').click());
  await page.waitForTimeout(120);
  r.sheetClosing = await page.evaluate(() => document.getElementById('aboutCompassList').classList.contains('is-closing'));
  await page.waitForTimeout(300);
  r.sheetClosed = await page.evaluate(() => document.getElementById('aboutCompassList').hidden);
  // 3. the 3D stack — stage full-bleed, content at the bottom of the card
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1300);
  r.stack = await page.evaluate(() => {
    const stage = document.querySelector('.about-evo3d__stage');
    const card = document.querySelector('.about-evo3d__card');
    const sr = stage.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const ct = card.querySelector('.about-evo3d__content').getBoundingClientRect();
    return {
      stageFull: Math.abs(sr.left) <= 2 && Math.abs(sr.right - window.innerWidth) <= 2,
      contentAtBottom: ct.bottom <= cr.bottom + 2 && ct.top > cr.top + cr.height * 0.3,
      noNumber: !card.querySelector('.about-evo3d__number'),
      glass: getComputedStyle(card.querySelector('.about-evo3d__content')).backdropFilter !== 'none',
      noRail: !document.querySelector('.about-evo3d__rail'),
      cards: document.querySelectorAll('.about-evo3d__card').length,
      interludeImgs: [...document.querySelectorAll('.about-evo3d__card--interlude .about-evo3d__image')].filter(i => i.src).length,
    };
  });
  // 4. the pointer camera drifts
  const cam0 = await page.evaluate(() => getComputedStyle(document.querySelector('.about-evo3d__camera')).transform);
  await page.mouse.move(1200, 300);
  await page.waitForTimeout(700);
  const cam1 = await page.evaluate(() => getComputedStyle(document.querySelector('.about-evo3d__camera')).transform);
  r.cameraMoved = cam0 !== cam1;

  // 5. optical sizing + reveal curve
  r.optical = await page.evaluate(() => getComputedStyle(document.body).fontOpticalSizing);
  r.revealCurve = await page.evaluate(() => getComputedStyle(document.querySelector('.about-prologue__title')).transitionTimingFunction);
  console.log('APPLE PASS:', JSON.stringify(r, null, 1));
  await browser.close();
})();
