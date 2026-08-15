const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const w of [390, 768, 1024]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
      const comp = document.getElementById('aboutCompass');
      const links = document.querySelector('.site-nav__inner .nav-links');
      const nav = document.querySelector('.site-nav__inner');
      return { compass: R(comp), links: R(links), navRow: R(nav), navH: Math.round(nav.getBoundingClientRect().height) };
    });
    console.log(w + 'px:', JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
