const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/home/user/previews/f3-${name}.png` });
  };
  await shot('01-hero', 0);
  await shot('02-evolution-head', 2800);
  await shot('03-frame-motion', 3150);
  await shot('04-frame-interaction', 3800);
  await shot('05-frame-environment', 4450);
  await shot('06-frame-system', 5100);
  await shot('07-frame-leadership', 6600);
  await shot('08-what', 9900);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/f3-m1-hero.png' });
  await page.evaluate(() => window.scrollTo(0, 3150));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/f3-m2-frame.png' });
  await browser.close();
  console.log('F3 SHOTS DONE');
})();
