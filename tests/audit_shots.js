const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [name, w, h] of [['audit-01-desktop', 1440, 900], ['audit-03-mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2400);
    await page.screenshot({ path: `/home/user/previews/${name}-hero.png` });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const evo = document.querySelector('.about-evo3d');
      const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
      window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * 0.2);
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/home/user/previews/${name}-stack.png` });
    await page.close();
  }
  console.log('AUDIT SHOTS DONE');
})();
