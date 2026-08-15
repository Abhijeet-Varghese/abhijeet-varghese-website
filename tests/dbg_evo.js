const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; };
    const world = document.querySelector('.about-evo3d__world');
    const card = document.querySelector('.about-evo3d__card');
    const stage = document.querySelector('.about-evo3d__stage');
    return {
      vw: window.innerWidth,
      stage: R(stage),
      world: R(world),
      worldCSS: getComputedStyle(world).width,
      card: R(card),
      cardTransform: getComputedStyle(card).transform,
      philosophy: !!document.querySelector('.about-philosophy'),
      creditsExtras: !!document.querySelector('.about-credits__fin, .about-credits__bg, .about-credits__mq, .about-credits__portrait'),
      jserr: window.__err || null,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
