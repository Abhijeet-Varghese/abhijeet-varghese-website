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
      const b = el.getBoundingClientRect();
      if (b.right > vw + 1 || b.left < -1) {
        bad.push({ el: el.tagName + '.' + (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).toString().split(' ').slice(0,2).join('.'), right: Math.round(b.right), left: Math.round(b.left), w: Math.round(b.width) });
      }
    });
    return bad.slice(0, 25);
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
