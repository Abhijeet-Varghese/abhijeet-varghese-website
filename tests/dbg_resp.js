const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message.slice(0, 100)));
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const stage = document.querySelector('.about-evo3d__stage');
    const sr = stage.getBoundingClientRect();
    const card = document.querySelector('.about-evo3d__card');
    const cr = card.getBoundingClientRect();
    const ct = card.querySelector('.about-evo3d__content').getBoundingClientRect();
    return {
      vw: window.innerWidth, vh: window.innerHeight,
      stage: { l: Math.round(sr.left), r: Math.round(sr.right), t: Math.round(sr.top), b: Math.round(sr.bottom), w: Math.round(sr.width), h: Math.round(sr.height) },
      card: { t: Math.round(cr.top), b: Math.round(cr.bottom) },
      content: { l: Math.round(ct.left), r: Math.round(ct.right), t: Math.round(ct.top), b: Math.round(ct.bottom) },
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
