const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/home/user/previews/scrap-${name}.png` });
  };
  await shot('01-minimal-hero', 0);
  await shot('02-evolution-head', 2900);
  await shot('03-frame-motion', 3300);
  await shot('04-frame-interaction', 4200);
  await shot('05-frame-environment', 5100);
  await shot('06-frame-experience-system', 6000);
  await shot('07-frame-leadership', 8000);
  await shot('08-what', 11300);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/scrap-m1-hero.png' });
  await page.evaluate(() => window.scrollTo(0, 3300));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/scrap-m2-frame.png' });
  await browser.close();
  console.log('SCRAP SHOTS DONE');
})();
