const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  const m = () => page.evaluate(() => document.documentElement.scrollWidth);
  const base = await m();
  await page.evaluate(() => { document.querySelector('.about-zoomstage__labels').style.display = 'none'; });
  console.log('base:', base, '→ labels hidden:', await m());
  await browser.close();
})();
