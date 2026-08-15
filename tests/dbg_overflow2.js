const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    const trig = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-06"]');
    if (trig && trig.getAttribute('aria-expanded') !== 'true') trig.click();
  });
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('.about-reel, .about-grain, .about-atmo')) return;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if ((b.right > vw + 1 || b.left < -1) && cs.position !== 'fixed' && cs.position !== 'absolute') {
        bad.push({ el: el.tagName + '.' + String(el.className).split(' ').slice(0,2).join('.'), right: Math.round(b.right), left: Math.round(b.left), w: Math.round(b.width), pos: cs.position });
      }
    });
    return { scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 20) };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
